"""Stream source-local review inventory without constructing a geometry/topology model."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET

VERSION = 'fiber-atlas-vsdx-stream-inventory/1'
NAMESPACE = 'http://schemas.microsoft.com/office/visio/2012/main'


def local(tag):
    return tag.rsplit('}', 1)[-1]


class SafeXmlStream:
    def __init__(self, stream):
        self.stream = stream
        self.tail = b''

    def read(self, size=-1):
        chunk = self.stream.read(min(size, 65536) if size >= 0 else 65536)
        syntax = chunk.replace(b'\x00', b'')
        check = self.tail + syntax
        if re.search(br'<!\s*(DOCTYPE|ENTITY)\b', check, re.I):
            raise ValueError('DTD/entity declarations are not supported in staged XML.')
        self.tail = check[-32:]
        return chunk


def events(archive, part, budget):
    stack = []
    with archive.open(part) as stream:
        for event, element in ET.iterparse(SafeXmlStream(stream), events=('start', 'end')):
            if event == 'start':
                budget[0] += 1
                if budget[0] > 6000000:
                    raise ValueError('Source XML exceeds the 6,000,000 element inventory limit.')
                stack.append(element)
                if len(stack) > 128:
                    raise ValueError('Source XML exceeds the 128-level nesting limit.')
            yield event, element, stack
            if event == 'end':
                stack.pop()


def release(element, stack):
    if len(stack) > 1:
        stack[-2].remove(element)
    element.clear()


def page_catalog(archive, budget):
    relationships = {}
    part = 'visio/pages/_rels/pages.xml.rels'
    if part not in archive.namelist():
        raise ValueError('Page relationships are missing.')
    for event, element, stack in events(archive, part, budget):
        if event == 'end':
            if local(element.tag) == 'Relationship' and element.get('TargetMode') != 'External':
                target = element.get('Target', '')
                pieces = []
                for piece in (PurePosixPath('visio/pages') / target).parts:
                    if piece == '..':
                        if not pieces:
                            raise ValueError('Page relationship escapes the package.')
                        pieces.pop()
                    elif piece not in ('.', '/'):
                        pieces.append(piece)
                relationships[element.get('Id')] = '/'.join(pieces)
            release(element, stack)
    pages = []
    current = None
    for event, element, stack in events(archive, 'visio/pages/pages.xml', budget):
        tag = local(element.tag)
        if event == 'start' and tag == 'Page':
            current = {'id': element.get('ID'), 'name': element.get('Name') or element.get('NameU'), 'part': None}
        elif event == 'end':
            if tag == 'Rel' and current is not None:
                relation = next((value for key, value in element.attrib.items() if local(key) == 'id'), None)
                current['part'] = relationships.get(relation)
            elif tag == 'Page' and current is not None:
                if not current['id'] or not current['part'] or current['part'] not in archive.namelist():
                    raise ValueError('Page identity or internal page relationship is invalid.')
                pages.append(current)
                current = None
            release(element, stack)
    if not pages or len({page['id'] for page in pages}) != len(pages):
        raise ValueError('Missing or duplicate page identities.')
    return pages


def stage(path, summary_path, index_path, max_shapes=100000):
    with path.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    budget = [0]
    total = text_shapes = 0
    with zipfile.ZipFile(path) as archive, index_path.open('w', encoding='utf-8') as output:
        pages = page_catalog(archive, budget)
        for page in pages:
            frames = []
            identities = set()
            text_depth = None
            page['shapes'] = 0
            for event, element, stack in events(archive, page['part'], budget):
                tag = local(element.tag)
                if event == 'start':
                    if len(stack) == 1 and element.tag != '{' + NAMESPACE + '}PageContents':
                        raise ValueError('Unsupported Visio page XML namespace or root.')
                    if tag == 'Shape':
                        shape_id = element.get('ID')
                        if not shape_id or shape_id in identities:
                            raise ValueError('Missing or duplicate page-local Shape identity.')
                        identities.add(shape_id)
                        total += 1
                        page['shapes'] += 1
                        if total > max_shapes:
                            raise ValueError(f'Source inventory exceeds the {max_shapes:,} Shape limit.')
                        frames.append({'id': shape_id, 'parent_id': frames[-1]['id'] if frames else None, 'depth': len(frames), 'attributes': dict(element.attrib), 'raw_text': '', 'evidence_scope': 'package_inventory', 'geometry_status': 'not_decoded'})
                    elif tag == 'Text' and frames and len(stack) > 1 and local(stack[-2].tag) == 'Shape':
                        text_depth = len(stack)
                else:
                    if text_depth is not None:
                        if len(stack) == text_depth:
                            text = ''.join(element.itertext()).replace('\r\n', '\n').replace('\r', '\n')
                            if len(text.encode('utf-8')) > 1024 * 1024:
                                raise ValueError('Shape text exceeds the 1 MiB inventory limit.')
                            frames[-1]['raw_text'] = text
                            text_depth = None
                        else:
                            continue
                    if tag == 'Shape':
                        shape = frames.pop()
                        shape['text'] = shape['raw_text'].strip()
                        text_shapes += bool(shape['text'])
                        output.write(json.dumps({'page_id': page['id'], 'shape_id': shape['id'], 'payload': shape}, ensure_ascii=False, separators=(',', ':')) + '\n')
                    release(element, stack)
    summary = {'format': 'fiber-atlas-vsdx-inventory/1', 'versions': {'extractor': VERSION}, 'extractionScope': 'package_inventory', 'source': {'file': path.name, 'sha256': digest, 'size_bytes': path.stat().st_size}, 'pages': pages, 'summary': {'pages': len(pages), 'all_page_shapes_including_subshapes': total, 'direct_text_shapes': text_shapes, 'xml_elements_scanned': budget[0]}, 'geometryDecoded': False, 'topologyProjected': False}
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('summary', type=Path)
    parser.add_argument('index', type=Path)
    parser.add_argument('--max-shapes', type=int, default=100000)
    args = parser.parse_args()
    stage(args.input, args.summary, args.index, args.max_shapes)


if __name__ == '__main__':
    main()
