"""Build a source-only, partial-coverage Shida semantic proposal from full geometry."""
from __future__ import annotations
import argparse
import importlib.util
import hashlib
import json
import re
import sys
import time
from pathlib import Path
from shida_geometry import RULE, CONFIRMATION

ROOT=Path(__file__).resolve().parents[1]
VERSION='shida-source-local-semantics/3'
OWNER_SOURCE_SHA='e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060'


def interpret(directory,output):
    started=time.monotonic();metadata=json.loads((directory/'summary.json').read_text(encoding='utf8'))
    spec=importlib.util.spec_from_file_location('stream_resource_guard',ROOT/'scripts/extract-vsdx-geometry-stream.py');guard=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard)
    def check():
        if time.monotonic()-started>180:raise ValueError('Shida semantic interpretation time limit exceeded')
        memory=guard.working_set_bytes()
        if memory and memory>512*1024*1024:raise ValueError('Shida semantic interpretation working-set limit exceeded')
    if metadata['summary'].get('shape_index')!='shapes.ndjson.gz' or metadata['summary'].get('connect_index')!='connects.ndjson.gz':raise ValueError('Unexpected geometry artifact paths')
    for key,name in [('shapes','shapes.ndjson.gz'),('connects','connects.ndjson.gz')]:
        artifact=metadata['artifacts'][key]
        with (directory/name).open('rb') as stream:
            digest=hashlib.file_digest(stream,'sha256').hexdigest()
        if artifact['file']!=name or digest!=artifact['sha256']:raise ValueError('Geometry artifact integrity failed before Shida interpretation')
    if not 0<metadata['summary']['shapes_including_subshapes']<=100000:raise ValueError('Shida source Shape bound exceeded')
    result={'version':VERSION,'family':None,'source':metadata['source'],'blockers':[],'warnings':[]}
    if metadata['source']['sha256']!=OWNER_SOURCE_SHA:
        result['blockers']=['The Shida drafting-gap convention has not been certified for this source revision. Geometry remains preserved.']
    else:
        spec=importlib.util.spec_from_file_location('shida_source_audit',ROOT/'scripts/audit-iteration33-shida.py');audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
        shapes=audit.compact_index(directory/metadata['summary']['shape_index'],check)
        check()
        evidence=audit.audit(shapes,metadata,gap_aware=True)
        check()
        if len(shapes)!=metadata['summary']['shapes_including_subshapes']:
            raise ValueError('Source Shape count mismatch before semantic interpretation')
        result.update({'family':'shida-kartli','page':metadata['pages'][0], 'ownerConfirmationId':CONFIRMATION,'gapRule':RULE,
                       'labels':evidence['labels'],'banks':evidence['banks'],'nodes':evidence['nodeContainerAudit']['nodes'],
                       'physicalBankPairs':evidence['nodeContainerAudit']['physicalBankPairs'],
                       'transitions':evidence['nodeContainerAudit']['nodeTransitionCandidates'],
                       'ports':evidence['apPortAudit']['ports'],'portReview':evidence['apPortAudit']['review'],
                       'coverage':evidence['counts'],'stations':[],'annotations':[]})
        for shape in shapes.values():
            if shape['master']=='7':
                b=shape['bounds'];names=[s for s in shapes.values() if s['page']==shape['page'] and re.search(r'AGG|აგრეგ',s['text'],re.I) and b['min_x']<=s['point']['x']<=b['max_x'] and b['min_y']<=s['point']['y']<=b['max_y']]
                for name in names:
                    token=re.search(r'#\s*(\d+)',name['text'])
                    result['stations'].append({'shapeId':shape['id'],'nameShapeId':name['id'],'name':name['text'],'token':token[1] if token else None,'bounds':b,'point':shape['point']})
            if shape['text'] and re.search('[A-Za-zა-ჰ]',shape['text']):
                result['annotations'].append({'shapeId':shape['id'],'text':shape['text'],'point':shape['point'],'parentShapeId':shape['parent']})
        # Preserve raw construction references and every label occurrence. No
        # number-only cross-document match, Tube standard or usage state is inferred.
        result['warnings']=[
            'Partial source coverage: unknown continuation is not a termination.',
            'Cable records preserve source label occurrences; repeated construction references are not unique physical Cable identities.',
            'Tube meaning, unresolved bank associations, aggregation Ports and usage/reserve/planned annotations require further source evidence.',
            'Port source State and fill are preserved independently; physical usage, allocation and commercial availability remain unknown.',
        ]
        check()
        result['resources']={'elapsed_seconds':round(time.monotonic()-started,3),'peak_working_set_bytes':guard.peak_working_set_bytes(),'working_set_limit_bytes':512*1024*1024}
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    return {'family':result['family'],'blockers':result['blockers'],'labels':len(result.get('labels',[])),'transitions':len(result.get('transitions',[])),'ports':len(result.get('ports',[]))}


if __name__=='__main__':
    if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf8')
    parser=argparse.ArgumentParser();parser.add_argument('geometry',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
    print(json.dumps(interpret(args.geometry,args.output),ensure_ascii=False))
