#!/usr/bin/env python3
"""Iteration 25 source interpretation over the certified Iteration 24 raw artifact."""
from __future__ import annotations
import argparse, collections, gzip, hashlib, json, math, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz'
OCC = ROOT / 'migration/iteration24/company-occurrences.json'
TRANSITIONS = ROOT / 'src/data/iteration24-fresh-transitions.json'
SUMMARY = ROOT / 'src/data/iteration24-fresh-summary.json'
PORT_BINDINGS = ROOT / 'src/data/iteration24-port-bindings.json'
SHA = 'caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa'
RULE = 'tsageri-lentekhi-company-usage/1'
ENDPOINTS = {
 '148':['AGG5','SC205'],'149':['SC205','AP41'],'150':['SC205','SC206'],'151':['SC206','SC207-boundary'],
 '169':['SC206','SC216'],'170':['SC216','AP50'],'171':['SC216','SC217'],'172':['SC217','SC218'],
 '173':['SC218','AP51'],'174':['SC218','SC219'],'175':['SC219','AP52'],'176':['SC219','SC220'],
 '177':['SC220','SC221'],'178':['SC221','SC222'],'179':['SC222','SC223'],'180':['SC223','SC224'],
 '181':['SC224','SC225'],'182':['SC225','AP53'],'183':['SC225','AP54'],'184':['LENTEKHI','SC224']}

def write(out: Path, name: str, obj):
    out.mkdir(parents=True, exist_ok=True)
    p = out / name
    p.write_text(json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=2) + '\n', encoding='utf-8')
    return p

def main(out: Path):
    raw = json.loads(gzip.decompress(RAW.read_bytes()))
    assert raw['source']['sha256'] == SHA
    page = raw['pages'][0]; shapes = page['shapes']; by = {str(s['id']):s for s in shapes}
    children = collections.defaultdict(list)
    for s in shapes: children[str(s.get('parent_id'))].append(s)
    def gp(s): return s['geometry']['global_pin']
    def endpoint(s, side): return s.get('geometry', {}).get('global_' + side)
    def is_marker(s):
        return bool(s.get('effective_style',{}).get('FillForegnd',{}).get('rgb')) and any(
            r.get('attributes',{}).get('T') == 'EllipticalArcTo' for sec in s.get('sections',[]) for r in sec.get('rows',[]))
    def descendants(gid):
        found=[]; stack=list(children[str(gid)])
        while stack:
            item=stack.pop(); found.append(item); stack.extend(children[str(item['id'])])
        return found

    labels=[]
    for s in shapes:
        m=re.fullmatch(r'(\d+)-([^-]+)-([^-]+)-(\d+)', s.get('text','').strip())
        if m and m.group(1) in ENDPOINTS:
            labels.append({'segment':m.group(1),'capacity':int(m.group(4)),'from':m.group(2),'to':m.group(3),'shape':str(s['id']),'text':s['text'],'position':gp(s)})
    candidates=[]
    for s in shapes:
        if s.get('attributes',{}).get('Type') != 'Group': continue
        markers=[x for x in descendants(s['id']) if is_marker(x)]
        if len(markers) in {24,48,72,96,144,192}: candidates.append((s,markers))
    banks={}
    for label in labels:
        valid=[]; lp=label['position']
        for group,markers in candidates:
            if len(markers) != label['capacity']: continue
            p=gp(group); xd=abs(p['x']-lp['x']); yd=p['y']-lp['y']
            if xd<=3.2 and abs(yd)<=7: valid.append((abs(yd)+xd*.1,yd,group,markers))
        chosen=[]
        for side in ([v for v in valid if v[1]<0],[v for v in valid if v[1]>0]):
            if side: chosen.append(min(side,key=lambda x:x[0]))
        banks[label['segment']]=[]
        for _,_,group,markers in sorted(chosen,key=lambda x:gp(x[2])['y']):
            banks[label['segment']].append({'groupShapeId':str(group['id']),'markers':sorted(markers,key=lambda x:gp(x)['x'])})
    marker_index=[]
    for segment, items in banks.items():
        for bank_index,item in enumerate(items):
            for number,marker in enumerate(item['markers'],1):
                p=gp(marker); marker_index.append({'segmentId':f'CAB-{int(segment):06d}','legacySegmentId':segment,'bankIndex':bank_index,'fiberNumber':number,'markerShapeId':str(marker['id']),'groupShapeId':item['groupShapeId'],'x':p['x'],'y':p['y']})
    def nearest(point, x_tol=.04, y_tol=.09):
        if not point: return None
        options=[]
        for marker in marker_index:
            dx=abs(marker['x']-point['x']); dy=abs(marker['y']-point['y'])
            if dx<=x_tol and dy<=y_tol: options.append((dx+dy,marker))
        if not options: return None
        distance, marker=min(options,key=lambda z:(z[0],int(z[1]['legacySegmentId']),z[1]['bankIndex'],z[1]['fiberNumber']))
        return {**marker,'alignmentDelta':round(distance,9)}

    occurrences=json.loads(OCC.read_text(encoding='utf-8'))['occurrences']
    interpreted=[]
    for occurrence in sorted(occurrences,key=lambda x:int(x['shapeId'])):
        shape=by[str(occurrence['shapeId'])]
        begin=nearest(endpoint(shape,'begin')); end=nearest(endpoint(shape,'end'))
        resolved=[x for x in (begin,end) if x]
        exact_same=len(resolved)==2 and begin['segmentId']==end['segmentId'] and begin['fiberNumber']==end['fiberNumber']
        exact_edge=len(resolved)==2 and begin['segmentId']!=end['segmentId']
        status='exact_fiber' if exact_same else 'exact_transition' if exact_edge else 'exact_single_endpoint' if len(resolved)==1 else 'unresolved'
        interpreted.append({'occurrenceId':f'NUO-{occurrence["shapeId"]}','shapeId':str(occurrence['shapeId']),'organizationId':occurrence['normalizedCandidate'],'rawText':occurrence['exactText'],'status':status,'begin':begin,'end':end,'geometry':{'begin':endpoint(shape,'begin'),'end':endpoint(shape,'end'),'worldBounds':shape['geometry']['world_bounds']},'evidenceBasis':['source_text_on_line_shape','world_geometry','fiber_marker_alignment'],'unresolvedReason':None if resolved else 'No Fiber marker endpoint aligns with the labelled line.'})

    # Deduplicate repeated labels on the same optical strand by organization and
    # the certified transition graph. Preserve every occurrence Shape ID.
    transition_doc=json.loads(TRANSITIONS.read_text(encoding='utf-8'))
    parent={}
    def find(x):
        parent.setdefault(x,x)
        if parent[x]!=x: parent[x]=find(parent[x])
        return parent[x]
    def union(a,b):
        a=find(a); b=find(b)
        if a!=b: parent[max(a,b)]=min(a,b)
    for edge in transition_doc['exactConnectorEdges']:
        union((f"CAB-{int(edge['a']['legacySegmentId']):06d}",edge['a']['fiberNumber']),(f"CAB-{int(edge['z']['legacySegmentId']):06d}",edge['z']['fiberNumber']))
    groups=collections.defaultdict(list)
    for item in interpreted:
        fibers={(x['segmentId'],x['fiberNumber']) for x in (item['begin'],item['end']) if x}
        components=tuple(sorted({find(x) for x in fibers}))
        key=(item['organizationId'],components)
        groups[key].append(item)
    assignments=[]
    for index,((org,fibers),items) in enumerate(sorted(groups.items(),key=lambda x:(x[0][0],x[0][1])),1):
        observed=sorted({(x['segmentId'],x['fiberNumber']) for item in items for x in (item['begin'],item['end']) if x})
        assignments.append({'id':f'NUA-{index:03d}','organizationId':org,'scope':'lineage' if len(observed)>1 else 'fiber','fibers':[{'segmentId':s,'fiberNumber':n} for s,n in observed],'sourceShapeIds':[x['shapeId'] for x in items],'occurrenceIds':[x['occurrenceId'] for x in items],'status':'source_interpreted','interpretationRule':RULE,'purpose':None,'rightsInferred':False,'ownershipInferred':False,'serviceInferred':False,'notes':['Usage attribution only. The source does not establish ownership, rights, service, or commercial availability.']})

    sc225=[e for e in transition_doc['exactConnectorEdges'] if e['nodeId']=='SC225']
    routing=[]
    for n in range(1,25):
        matches=[]
        for edge in sc225:
            sides=(edge['a'],edge['z'])
            if any(s['legacySegmentId']=='181' and s['fiberNumber']==n for s in sides):
                other=next(s for s in sides if s['legacySegmentId']!='181')
                matches.append({'outgoingLegacySegmentId':other['legacySegmentId'],'outgoingFiberNumber':other['fiberNumber'],'destination':'AP53' if other['legacySegmentId']=='182' else 'AP54' if other['legacySegmentId']=='183' else 'unknown','transitionId':edge['id'],'connectorShapeId':edge['connectorShapeId'],'basis':edge['basis'],'geometry':edge['geometry']})
        owner_anchor=n==6
        if len(matches)==1: classification='exact'
        elif owner_anchor: classification='owner_confirmed_ap_side_exact_ap_unresolved'
        else: classification='unresolved'
        routing.append({'incomingLegacySegmentId':'181','incomingFiberNumber':n,'classification':classification,'outgoing':matches[0] if len(matches)==1 else None,'ownerConfirmedAPSide':owner_anchor,'unresolvedReason':None if matches else ('Owner confirms AP-side continuation, but no source connector reaches C182 or C183.' if owner_anchor else 'No source connector from the SC225-side C181 marker reaches C182 or C183; no termination symbol establishes an intentional end.'),'sourceShapeIds':([matches[0]['connectorShapeId']] if matches else [])})
    cross=[]
    for edge in sc225:
        pair={edge['a']['legacySegmentId'],edge['z']['legacySegmentId']}
        if pair=={'182','183'}: cross.append({'transitionId':edge['id'],'connectorShapeId':edge['connectorShapeId'],'a':edge['a'],'z':edge['z'],'basis':edge['basis'],'geometry':edge['geometry']})

    cable_labels={x['segment']:{'exactLabel':x['text'],'shapeId':x['shape'],'fromToken':x['from'],'toToken':x['to']} for x in labels if x['segment'] in {'181','182','183'}}
    expected_conflict={'expectedInBrief':{'182':'182-225-54-24','183':'183-225-53-24'},'actualCertifiedSource':{k:v['exactLabel'] for k,v in cable_labels.items() if k in {'182','183'}},'resolution':'Certified VSDX source wins: C182 remains AP53 and C183 remains AP54. No swap is projected.'}
    ports=[]
    certified_bindings=json.loads(PORT_BINDINGS.read_text(encoding='utf-8'))['bindings']
    for item in certified_bindings:
        if item['ownerType']!='ap' or item['ownerId'] not in {'53','54'}: continue
        expected_segment='182' if item['ownerId']=='53' else '183'
        assert item['legacySegmentId']==expected_segment
        ports.append({**item,'status':'source_interpreted','sourceLabelShapeId':cable_labels[expected_segment]['shapeId']})

    metadata={'schemaVersion':1,'sourceSha256':SHA,'rawArtifactSha256':hashlib.sha256(RAW.read_bytes()).hexdigest(),'sourceFile':'Tsageri-Lentekhi 2025.vsdx','page':page['name'],'pageId':page['id'],'part':page['part'],'interpreter':'interpret-iteration25-source.py/1','deterministic':True}
    outputs={
      'iteration25-company-usage.json':{**metadata,'interpretationRule':RULE,'counts':{'rawOccurrences':len(interpreted),'logicalAssignments':len(assignments),'byOrganization':dict(sorted(collections.Counter(x['organizationId'] for x in interpreted).items())),'byStatus':dict(sorted(collections.Counter(x['status'] for x in interpreted).items()))},'occurrences':interpreted,'assignments':assignments},
      'iteration25-sc225-routing.json':{**metadata,'cableLabels':cable_labels,'identityConflict':expected_conflict,'rows':routing,'c182ToC183Transitions':cross,'counts':{'exactC181Routes':sum(x['classification']=='exact' for x in routing),'ownerAnchoredUnresolved':sum(x['classification'].startswith('owner_confirmed') for x in routing),'unresolved':sum(x['classification']=='unresolved' for x in routing),'c182C183ExactTransitions':len(cross)}},
      'iteration25-port-interpretation.json':{**metadata,'aggregationIdentity':'AGG-LENTEKHI','aggregationIdentityStatus':'neutral_due_heading_property_conflict','identityConflict':expected_conflict,'apBindings':ports,'occupancyPolicy':'Aggregation occupancy remains unknown without a distinct physical Port graphic. White AP positions mean observed unused, never commercial availability.'},
      'iteration25-unresolved-evidence.json':{**metadata,'records':[{'id':f'SC225-C181-F{x["incomingFiberNumber"]:02d}','nodeId':'SC225','legacySegmentId':'181','fiberNumber':x['incomingFiberNumber'],'reason':x['unresolvedReason'],'ownerConfirmedAPSide':x['ownerConfirmedAPSide'],'sourceShapeIds':x['sourceShapeIds']} for x in routing if x['classification']!='exact']},
      'iteration25-semantic-diff.json':{**metadata,'baseline':'Iteration 24 certified semantic projection','changes':[{'area':'company_usage','before':'31 raw occurrences; no assignments','after':f'{len(assignments)} logical usage assignments from 31 source-labelled line Shapes'},{'area':'SC225','before':'partial transition set','after':f'{sum(x["classification"]=="exact" for x in routing)} exact C181 branch transitions; {sum(x["classification"]!="exact" for x in routing)} precisely unresolved'},{'area':'AP53_AP54_identity','before':'C182→AP53; C183→AP54','after':'unchanged; certified source contradicts requested expected swap'}]},
    }
    manifest=[]
    for name,obj in outputs.items():
        p=write(out,name,obj); manifest.append({'file':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
    write(out,'iteration25-summary.json',{**metadata,'artifacts':manifest,'result':{'companyOccurrencesReconciled':len(interpreted),'companyAssignments':len(assignments),'sc225RowsReconciled':len(routing),'sourceIdentityConflictCount':1}})
    print(json.dumps({'output':str(out),'companyOccurrences':len(interpreted),'companyAssignments':len(assignments),'sc225Exact':sum(x['classification']=='exact' for x in routing),'sc225Unresolved':sum(x['classification']!='exact' for x in routing),'c182C183Transitions':len(cross)},indent=2))

if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--output',type=Path,default=ROOT/'migration/iteration25/candidate')
    args=parser.parse_args(); main(args.output)
