#!/usr/bin/env python3
"""Bounded, per-top-level-Shape VSDX geometry extraction to NDJSON."""
from __future__ import annotations

import argparse
import ctypes
import gzip
import hashlib
import importlib.util
import json
import re
import sys
import time
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

VERSION = 'fiber-atlas-vsdx-stream-geometry/1'
MAX_ELEMENTS = 6_000_000
MAX_SHAPES = 100_000
MAX_DEPTH = 128
MAX_ROOT_ELEMENTS = 1_000_000
MAX_ROOT_SHAPES = 25_000
MAX_SECONDS = 300
MAX_MEMORY_BYTES = 256 * 1024 * 1024
MAX_SOURCE_BYTES = 20 * 1024 * 1024
MAX_ENTRIES = 4096
MAX_ENTRY_BYTES = 128 * 1024 * 1024
MAX_PACKAGE_BYTES = 256 * 1024 * 1024


def local(tag: str) -> str:
    return tag.rsplit('}', 1)[-1]


class SafeXmlStream:
    def __init__(self, stream):
        self.stream = stream
        self.tail = b''

    def read(self, size=-1):
        chunk = self.stream.read(min(size, 65536) if size >= 0 else 65536)
        check = self.tail + chunk.replace(b'\x00', b'')
        if re.search(br'<!\s*(DOCTYPE|ENTITY)\b', check, re.I):
            raise ValueError('DTD/entity declarations are not supported.')
        self.tail = check[-32:]
        return chunk


def load_extractor():
    path = Path(__file__).with_name('extract-vsdx.py')
    spec = importlib.util.spec_from_file_location('fiber_atlas_vsdx_extractor', path)
    if spec is None or spec.loader is None:
        raise RuntimeError('The established VSDX geometry resolver is unavailable.')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_package(archive: zipfile.ZipFile):
    names = archive.namelist()
    if len(names) > MAX_ENTRIES:
        raise ValueError('VSDX contains too many package entries.')
    required = {'[Content_Types].xml', 'visio/document.xml', 'visio/pages/pages.xml'}
    if not required.issubset(names):
        raise ValueError('VSDX is missing required package parts.')
    total = 0
    seen = set()
    for info in archive.infolist():
        name = info.filename.replace('\\', '/')
        if name in seen or name.startswith('/') or re.search(r'(^|/)\.\.(?:/|$)|^[A-Za-z]:', name):
            raise ValueError('VSDX contains a duplicate or unsafe package path.')
        seen.add(name)
        if info.flag_bits & 1:
            raise ValueError('Encrypted VSDX entries are not supported.')
        if info.file_size > MAX_ENTRY_BYTES:
            raise ValueError('VSDX entry exceeds the 128 MiB expanded limit.')
        total += info.file_size
        if total > MAX_PACKAGE_BYTES:
            raise ValueError('Expanded VSDX package exceeds 256 MiB.')
    return names, total


def reject_declarations(archive: zipfile.ZipFile, names, page_parts):
    for name in names:
        if not name.endswith(('.xml', '.rels')) or name in page_parts:
            continue
        with archive.open(name) as stream:
            wrapped = SafeXmlStream(stream)
            while wrapped.read(65536):
                pass


def normalized_root(element, resolver, master_roots, master_shapes, styles, colors):
    wrapper = ET.Element('Wrapper')
    shapes = ET.SubElement(wrapper, 'Shapes')
    shapes.append(element)
    raw = resolver.shapetree(wrapper)
    return resolver.normalize(raw, master_roots, master_shapes, styles, colors)


def page_dimensions(resolver, element):
    cells = resolver.cmap(element)
    return {
        'width': resolver.num(cells.get('PageWidth')),
        'height': resolver.num(cells.get('PageHeight')),
        'drawing_scale': resolver.num(cells.get('DrawingScale'), 1),
        'page_scale': resolver.num(cells.get('PageScale'), 1),
    }


def file_digest(path: Path):
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def gzip_text_writer(path: Path):
    return gzip.open(path, 'wt', encoding='utf-8', newline='\n', compresslevel=6)


def process_memory_bytes(peak=True):
    if sys.platform != 'win32':
        return None

    class MemoryCounters(ctypes.Structure):
        _fields_ = [
            ('cb', ctypes.c_ulong), ('PageFaultCount', ctypes.c_ulong),
            ('PeakWorkingSetSize', ctypes.c_size_t), ('WorkingSetSize', ctypes.c_size_t),
            ('QuotaPeakPagedPoolUsage', ctypes.c_size_t), ('QuotaPagedPoolUsage', ctypes.c_size_t),
            ('QuotaPeakNonPagedPoolUsage', ctypes.c_size_t), ('QuotaNonPagedPoolUsage', ctypes.c_size_t),
            ('PagefileUsage', ctypes.c_size_t), ('PeakPagefileUsage', ctypes.c_size_t),
        ]

    counters = MemoryCounters()
    counters.cb = ctypes.sizeof(counters)
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    psapi = ctypes.WinDLL('psapi', use_last_error=True)
    kernel.GetCurrentProcess.restype = ctypes.c_void_p
    psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.POINTER(MemoryCounters), ctypes.c_ulong]
    psapi.GetProcessMemoryInfo.restype = ctypes.c_int
    process = kernel.GetCurrentProcess()
    ok = psapi.GetProcessMemoryInfo(process, ctypes.byref(counters), counters.cb)
    return int(counters.PeakWorkingSetSize if peak else counters.WorkingSetSize) if ok else None


def peak_working_set_bytes():
    return process_memory_bytes()


def working_set_bytes():
    return process_memory_bytes(False)


def extract(source: Path, output_dir: Path):
    started = time.monotonic()
    if source.stat().st_size > MAX_SOURCE_BYTES:
        raise ValueError('Compressed VSDX source exceeds the 20 MiB limit.')
    digest = hashlib.sha256()
    with source.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    source_sha = digest.hexdigest()
    resolver = load_extractor()
    output_dir.mkdir(parents=True, exist_ok=True)
    shape_path = output_dir / 'shapes.ndjson.gz'
    connect_path = output_dir / 'connects.ndjson.gz'
    summary_path = output_dir / 'summary.json'

    with zipfile.ZipFile(source) as archive:
        names, expanded_bytes = validate_package(archive)
        reject_declarations(archive, names, set())
        pages = resolver.page_catalog(archive)
        if not pages:
            raise ValueError('VSDX contains no readable Visio pages.')
        doc = resolver.xml(archive, 'visio/document.xml')
        colors = dict(resolver.STD)
        colors.update({str(resolver.attr(item, 'IX')): str(resolver.attr(item, 'RGB')).lower()
                       for item in doc.iter() if local(item.tag) == 'ColorEntry'
                       and resolver.attr(item, 'IX') and resolver.attr(item, 'RGB')})
        styles = resolver.styles(doc)
        masters, master_roots, master_shapes = resolver.masters(archive)
        memory = working_set_bytes()
        if memory is not None and memory > MAX_MEMORY_BYTES:
            raise ValueError('Geometry extraction exceeds the 256 MiB working-set limit.')
        budget_elements = 0
        total_shapes = 0
        total_top_shapes = 0
        total_connects = 0
        page_summaries = []
        catalog_sheets = {}
        catalog = resolver.xml(archive, 'visio/pages/pages.xml')
        for page_element in catalog.iter():
            if local(page_element.tag) != 'Page':
                continue
            sheet = next((child for child in page_element if local(child.tag) == 'PageSheet'), None)
            if sheet is not None:
                catalog_sheets[str(page_element.get('ID'))] = sheet
        shape_ids = {}
        connect_rows = []

        with gzip_text_writer(shape_path) as shape_out:
            for page in pages:
                stack = []
                shape_depth = 0
                sheet_depth = 0
                root_element_count = 0
                root_shape_count = 0
                root_started = None
                page_shape_count = 0
                page_top_count = 0
                page_text_count = 0
                catalog_sheet = catalog_sheets.get(str(page['id']))
                page_dimensions_value = page_dimensions(resolver, catalog_sheet) if catalog_sheet is not None else None
                page_sheet = {'cells': [resolver.cell(item) for item in resolver.children(catalog_sheet, 'Cell')],
                              'sections': [resolver.section(item) for item in resolver.children(catalog_sheet, 'Section')]} if catalog_sheet is not None else None
                page_connects = 0
                with archive.open(page['part']) as raw_stream:
                    iterator = ET.iterparse(SafeXmlStream(raw_stream), events=('start', 'end'))
                    for event, element in iterator:
                        if event == 'start':
                            budget_elements += 1
                            if budget_elements > MAX_ELEMENTS:
                                raise ValueError('Source XML exceeds the 6,000,000 element limit.')
                            if len(stack) + 1 > MAX_DEPTH:
                                raise ValueError('Source XML exceeds the 128-level nesting limit.')
                            stack.append(element)
                            tag = local(element.tag)
                            if tag == 'PageSheet':
                                sheet_depth += 1
                            if tag == 'Shape':
                                shape_depth += 1
                                if shape_depth == 1:
                                    root_started = time.monotonic()
                                    root_element_count = 0
                                    root_shape_count = 0
                            if shape_depth:
                                root_element_count += 1
                                if root_element_count > MAX_ROOT_ELEMENTS:
                                    raise ValueError('One Shape subtree exceeds the bounded 1,000,000 element limit.')
                                if tag == 'Shape':
                                    root_shape_count += 1
                                    if root_shape_count > MAX_ROOT_SHAPES:
                                        raise ValueError('One Shape subtree exceeds the bounded 25,000 Shape limit.')
                            continue

                        tag = local(element.tag)
                        if tag == 'PageSheet':
                            page_dimensions_value = page_dimensions(resolver, element)
                            page_sheet = {'cells': [resolver.cell(item) for item in resolver.children(element, 'Cell')],
                                          'sections': [resolver.section(item) for item in resolver.children(element, 'Section')]}
                            sheet_depth -= 1
                        if tag == 'Connect':
                            row = resolver.attrs(element)
                            connect_rows.append((str(page['id']), row))
                            page_connects += 1
                        if tag == 'Shape' and shape_depth == 1:
                            if root_started is None or time.monotonic() - root_started > MAX_SECONDS:
                                raise ValueError('A Shape subtree exceeded the 300 second processing limit.')
                            normalized = normalized_root(element, resolver, master_roots, master_shapes, styles, colors)
                            for item in normalized:
                                raw_id = item.get('id')
                                if raw_id is None or raw_id == '':
                                    raise ValueError('VSDX has a missing page-local Shape ID.')
                                sid = str(raw_id)
                                page_id = str(page['id'])
                                page_shape_ids = shape_ids.setdefault(page_id, set())
                                if not sid or sid in page_shape_ids:
                                    raise ValueError('VSDX has a missing or duplicate page-local Shape ID.')
                                page_shape_ids.add(sid)
                                total_shapes += 1
                                if total_shapes > MAX_SHAPES:
                                    raise ValueError('Source exceeds the 100,000 Shape geometry limit.')
                                page_shape_count += 1
                                page_text_count += bool(item.get('raw_text'))
                                payload = {'page_id': str(page['id']), 'shape_id': sid, 'payload': item}
                                shape_out.write(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n')
                            total_top_shapes += 1
                            page_top_count += 1
                            parent = stack[-2] if len(stack) > 1 else None
                            if parent is not None:
                                parent.remove(element)
                            element.clear()
                            shape_depth = 0
                            root_started = None
                            root_element_count = 0
                            root_shape_count = 0
                            memory = working_set_bytes()
                            if memory is not None and memory > MAX_MEMORY_BYTES:
                                raise ValueError('Geometry extraction exceeds the 256 MiB working-set limit.')
                        if tag not in ('Shape',) and not shape_depth and not sheet_depth:
                            if stack and len(stack) > 1:
                                stack[-2].remove(element)
                            element.clear()
                        stack.pop()
                        if tag == 'Shape' and shape_depth > 0:
                            shape_depth -= 1
                        if time.monotonic() - started > MAX_SECONDS:
                            raise ValueError('Full geometry extraction exceeded the 300 second time limit.')
                page_summaries.append({**page, 'dimensions': page_dimensions_value or {}, 'page_sheet': page_sheet,
                                       'shapes': page_shape_count, 'top_level_shapes': page_top_count,
                                       'text_shapes': page_text_count, 'connect_rows': page_connects})

        connect_valid = 0
        connect_dangling = 0
        with gzip_text_writer(connect_path) as connect_out:
            for page_id, row in connect_rows:
                from_resolves = str(row.get('FromSheet')) in shape_ids.get(page_id, set())
                to_resolves = str(row.get('ToSheet')) in shape_ids.get(page_id, set())
                valid = from_resolves and to_resolves
                connect_valid += valid
                connect_dangling += not valid
                connect_out.write(json.dumps({'page_id': page_id, 'row': row, 'from_resolves': from_resolves,
                                              'to_resolves': to_resolves, 'valid': valid}, ensure_ascii=False,
                                             separators=(',', ':')) + '\n')
        connect_integrity = [{'page_id': str(page['id']), 'connect_rows': page['connect_rows'],
                              'valid': sum(1 for page_id, row in connect_rows if page_id == str(page['id'])
                                           and str(row.get('FromSheet')) in shape_ids.get(page_id, set())
                                           and str(row.get('ToSheet')) in shape_ids.get(page_id, set())),
                              'dangling': sum(1 for page_id, row in connect_rows if page_id == str(page['id'])
                                              and (str(row.get('FromSheet')) not in shape_ids.get(page_id, set())
                                                   or str(row.get('ToSheet')) not in shape_ids.get(page_id, set())))}
                             for page in page_summaries]
        total_connects = sum(item['connect_rows'] for item in page_summaries)
        metadata = {
            'format': 'fiber-atlas-vsdx-stream-geometry/1', 'version': VERSION,
            'source': {'file': source.name, 'sha256': source_sha, 'size_bytes': source.stat().st_size},
            'package': {'entries': len(names), 'expanded_bytes': expanded_bytes},
            'resolver': {'extractor': resolver.EXTRACTOR_VERSION, 'geometry': resolver.GEOMETRY_RESOLVER_VERSION,
                         'style': resolver.STYLE_RESOLVER_VERSION},
            'masters': masters, 'pages': page_summaries,
            'summary': {'pages': len(pages), 'shapes_including_subshapes': total_shapes,
                        'top_level_shapes': total_top_shapes, 'connect_rows': total_connects,
                        'connect_rows_valid': connect_valid, 'connect_rows_dangling': connect_dangling,
                        'xml_elements_scanned': budget_elements, 'geometry_decoded': True,
                        'topology_projected': False, 'shape_index': shape_path.name, 'connect_index': connect_path.name,
                        'omitted_features': ['raw XML parts are retained only in the original VSDX package']},
            'connect_integrity': connect_integrity,
            'artifacts': {'shapes': {'file': shape_path.name, 'sha256': file_digest(shape_path), 'size_bytes': shape_path.stat().st_size},
                          'connects': {'file': connect_path.name, 'sha256': file_digest(connect_path), 'size_bytes': connect_path.stat().st_size}},
            'resources': {'elapsed_seconds': round(time.monotonic() - started, 3),
                          'peak_working_set_bytes': peak_working_set_bytes(), 'limits': {'compressed_source_bytes': MAX_SOURCE_BYTES,
                          'expanded_package_bytes': MAX_PACKAGE_BYTES,
                          'entry_bytes': MAX_ENTRY_BYTES, 'elements': MAX_ELEMENTS, 'shapes': MAX_SHAPES,
                           'depth': MAX_DEPTH, 'root_elements': MAX_ROOT_ELEMENTS, 'root_shapes': MAX_ROOT_SHAPES,
                          'working_set_bytes': MAX_MEMORY_BYTES,
                          'elapsed_seconds': MAX_SECONDS}},
        }
        summary_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        return metadata


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output_dir', type=Path)
    args = parser.parse_args()
    result = extract(args.source, args.output_dir)
    print(json.dumps({'source': result['source'], 'summary': result['summary'],
                      'resources': result['resources'], 'artifacts': result['artifacts']},
                     ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    main()
