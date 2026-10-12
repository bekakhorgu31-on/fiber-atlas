"""Bounded fresh-source adapter. Historical inventories and owner assertions are not inputs."""
import argparse, collections, contextlib, gzip, importlib.util, io, json, re, subprocess, sys
from pathlib import Path
from marker_geometry import matching_marker_shapes, UnsupportedMarkerGeometry

ROOT = Path(__file__).resolve().parents[1]
VERSION = 'owner-upload-grammar/1'

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

def interpret(raw_path, output):
    raw = json.loads(gzip.decompress(raw_path.read_bytes()))
    page = raw['pages'][0]
    shapes = page['shapes']; by = {str(s['id']): s for s in shapes}
    labels = [s.get('text', '').strip() for s in shapes if re.fullmatch(r'\d+-\d+-\d+-\d+', s.get('text', '').strip())]
    segments = {x.split('-')[0] for x in labels}
    a = module('source_a_upload', ROOT/'scripts/interpret-iteration23-source.py')
    b_segments={'148','149','150','151','152','153','154','155','156','157','158','159','160','161','162','164','165','166','167','168','169','172'}
    family = 'tsageri-lentekhi' if segments == set(a.ENDPOINTS) else 'tsageri-alpana-tvishi' if segments == b_segments else None
    result = {'version': VERSION, 'family': family, 'source': raw['source'], 'page': {k: page[k] for k in ['id','name','part']}, 'warnings': [], 'blockers': []}
    if not family or len(raw['pages']) != 1:
        result['blockers'] = ['Unsupported drawing family/page layout; no network edges projected.']
        output.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8'); return result
    if family == 'tsageri-lentekhi':
        a.RAW = raw_path; a.OUT = output.parent; a.SHA = raw['source']['sha256']
        with contextlib.redirect_stdout(io.StringIO()): a.main(compare=False)
        load = lambda name: json.loads((output.parent/name).read_text(encoding='utf-8'))
        summary = load('iteration23-fresh-summary.json')
        result['labels'] = summary['inventory']['cables']
        result['construction'] = load('iteration23-physical-construction.json')['segments']
        result['transitions'] = load('iteration23-fresh-transitions.json')['exactConnectorEdges']
        result['bindings'] = load('iteration23-port-bindings.json')['bindings']
        result['ports'] = load('iteration23-port-occupancy.json')['ports']
        banks = load('iteration23-fresh-transitions.json')['banks']
        result['warnings'].append('SC225 termination and other historical owner-only claims require a new explicit decision; absent source connectors remain unknown.')
    else:
        candidate = output.parent/'source-b.json'
        subprocess.run([sys.executable, str(ROOT/'scripts/interpret-iteration27-source.py'), str(raw_path), str(candidate), '--source-only'], check=True, capture_output=True)
        decoded = json.loads(candidate.read_text(encoding='utf-8'))
        result['labels'] = [{'legacySegmentId': x['legacyId'][1:], 'capacity': x['capacityFibers'], 'fromToken': x['endpointTokens'][0], 'toToken': x['endpointTokens'][1], 'shapeId': str(x['source']['shapeIds'][0]), 'exactLabel': x['legacyLabel']} for x in decoded['labels']]
        result['construction'] = [{'legacySegmentId': key[1:], 'records': value['banks'][0]['fibers'], 'pairedBanksAgree': value['banksAgree'], 'groupShapeIds': [decoded['banks'][key[1:]][0]['groupShapeId']]} for key, value in decoded['physical'].items()]
        result['transitions'] = [{'nodeId': edge['nodeToken'], 'connectorShapeId': edge['connectorShapeId'], 'a': {**edge['a'], 'legacySegmentId': edge['a']['segment']}, 'z': {**edge['z'], 'legacySegmentId': edge['z']['segment']}, 'basis': edge['basis']} for edge in decoded['transitions']]
        result['bindings'] = []; result['ports'] = []
        banks = [{'segment': seg, 'bankIndex': i, 'groupShapeIds': [b['groupShapeId']]} for seg, bb in decoded['banks'].items() for i, b in enumerate(bb)]
    children = collections.defaultdict(list)
    for s in shapes: children[str(s.get('parent_id'))].append(s)
    def descendants(group):
        stack = list(children[group]); out = []
        while stack:
            s = stack.pop(); out.append(s); stack.extend(children[str(s['id'])])
        return out
    markers = []
    for bank in banks:
        for group in bank['groupShapeIds']:
            circles = sorted([s for s in descendants(group) if a.is_marker(s)], key=lambda s: a.gp(s)['x'])
            for number, s in enumerate(circles, 1):
                markers.append({'shape': str(s['id']), 'legacySegmentId': bank['segment'], 'fiberNumber': number, 'geometry': s['geometry'], 'group': group})
    def hits(point):
        if not point: return []
        candidates = [m for m in markers if abs(a.gp(by[m['shape']])['x']-point['x']) < .12 and abs(a.gp(by[m['shape']])['y']-point['y']) < .12]
        try: return matching_marker_shapes(point, candidates)
        except UnsupportedMarkerGeometry: return []
    endpoints = {x['legacySegmentId']: {x['fromToken'], x['toToken']} for x in result['labels']}
    old_connectors = {x['connectorShapeId'] for x in result['transitions']}
    geometry_added = []
    result['geometryCandidates'] = []
    for s in shapes:
        begin, end = a.endpoint(s,'begin'), a.endpoint(s,'end')
        if not begin or not end: continue
        aa, zz = hits(begin), hits(end)
        if len(aa) != 1 or len(zz) != 1 or aa[0]['legacySegmentId'] == zz[0]['legacySegmentId']: continue
        left, right = aa[0], zz[0]; common = endpoints[left['legacySegmentId']] & endpoints[right['legacySegmentId']]
        if len(common) != 1 or str(s['id']) in old_connectors: continue
        edge = {'nodeId': next(iter(common)), 'connectorShapeId': str(s['id']), 'a': left, 'z': right, 'basis': ['unique_endpoint_inside_marker_ellipse'], 'geometry': {'begin': begin, 'end': end}}
        if family == 'tsageri-alpana-tvishi':
            result['geometryCandidates'].append({**edge,'reason':'Ellipse-only match is outside the certified Source B center-alignment grammar; no optical edge projected.'})
            continue
        result['transitions'].append(edge); geometry_added.append(str(s['id']))
    result['geometryCorrections'] = geometry_added
    result['banks'] = banks
    result['usage'] = []
    result['usageLines'] = []
    orgs = {'silknet':'ORG-SILKNET', 'skytel':'ORG-SKYTEL', 'opennet':'ORG-OPENNET', 'magti':'ORG-MAGTI', 'magticom':'ORG-MAGTI'}
    for s in shapes:
        text = s.get('text', '').strip()
        org = next((value for token, value in orgs.items() if re.search(r'\b'+token+r'\b', text, re.I)), None)
        if org:
            selected = [m for p in [a.endpoint(s,'begin'),a.endpoint(s,'end')] for m in hits(p) if len(hits(p)) == 1]
            result['usage'].append({'organizationId': org, 'rawText': text, 'shapeId': str(s['id']), 'fibers': [{'legacySegmentId': m['legacySegmentId'], 'fiberNumber': m['fiberNumber']} for m in selected]})
        begin, end = a.endpoint(s,'begin'), a.endpoint(s,'end')
        if family == 'tsageri-alpana-tvishi' and begin and end and not a.is_marker(s):
            targets = [m for point in [begin,end] for m in hits(point) if len(hits(point)) == 1]
            if targets:
                rgb = s.get('effective_style',{}).get('LineColor',{}).get('rgb')
                pattern = s.get('effective_style',{}).get('LinePattern',{}).get('value')
                usage = 'unused' if rgb == '#0000ff' and pattern == '1' else 'in_use' if rgb in {'#00b050','#009945','#ff0000'} and pattern == '1' else 'review_required' if rgb == '#ff0000' and pattern == '2' else 'unknown'
                result['usageLines'].append({'shapeId':str(s['id']),'fibers':[{'legacySegmentId':m['legacySegmentId'],'fiberNumber':m['fiberNumber']} for m in targets],'usageState':usage,'organizationId':org or ('ORG-OPENNET' if rgb in {'#00b050','#009945'} and pattern == '1' else None),'color':rgb,'pattern':pattern,'begin':begin,'end':end})
    result['counts'] = {'cables': len(result['labels']), 'fibers': sum(len(x['records']) for x in result['construction']), 'transitions': len(result['transitions']), 'bindings': len(result['bindings'])}
    output.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('raw', type=Path); parser.add_argument('output', type=Path); args = parser.parse_args()
    interpret(args.raw, args.output)
