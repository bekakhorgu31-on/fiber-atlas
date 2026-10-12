"""Read-only rejection diagnostics from the exact audited source; no graph edits."""
from __future__ import annotations
import gzip,hashlib,json,math,time,re
from collections import Counter,defaultdict
from pathlib import Path
from shida_geometry import first_linear_path,inward_endpoint_rays,port_docking_evidence,RULE
ROOT=Path(__file__).resolve().parents[1]
started=time.monotonic()
audit=json.loads((ROOT/'migration/iteration33/source-audit-gap-aware.json').read_text(encoding='utf8'))
semantic=json.loads((ROOT/'tmp/iteration33-shida-semantic.json').read_text(encoding='utf8'))
with gzip.open(ROOT/'migration/iteration33/compact-shapes.json.gz','rt',encoding='utf8') as f:
    shapes={(s['page'],s['id']):s for s in json.load(f)}
ports={p['shapeId']:p for p in semantic['ports'] if p['completePortBank'] and not p['bindings']}
banks={b['groupShapeId']:b for b in audit['banks']};marker_numbers={m['shapeId']:m for b in banks.values() for m in b['markers'] or []}
labels_by_bank=defaultdict(set)
for pair in audit['nodeContainerAudit']['physicalBankPairs']:
    if pair['status']=='source_endpoint_bank_pair':
        for bank in pair['banks']:labels_by_bank[bank].add(pair['labelShapeIds'][0])
node_by_id={n['shapeId']:n for n in audit['nodeContainerAudit']['nodes']}
diagnostics={key:{'shapeId':key,'apToken':p['apToken'],'portNumber':p['number'],'nodeShapeId':p['nodeSymbolShapeId'],'candidates':[],'reasonCounts':{}} for key,p in ports.items()}
for row in audit['lineLedger']:
    line=shapes[(row['page'],row['shapeId'])];path=first_linear_path(line)
    endpoints=[line['begin'],line['end']]
    if any(p is None for p in endpoints):
        if len(path)<2:continue
        endpoints=[{'x':x,'y':y} for x,y in [path[0],path[-1]]]
    rays=inward_endpoint_rays(line)
    for end,point in enumerate(endpoints):
        candidates=[]
        for key,p in ports.items():
            b=p['bounds'];pad=min(.025,(p['portPitch'] or .1)*.12)
            if p['page']!=row['page'] or not b['min_x']-pad<=point['x']<=b['max_x']+pad or not b['min_y']-pad<=point['y']<=b['max_y']+pad:continue
            dock=port_docking_evidence(point,shapes[(p['page'],key)],rays[end],p['portPitch'])
            if dock:candidates.append((key,p,dock))
        for key,p,dock in candidates:
            marker_ids=row['endMarkers'] if end==0 else row['beginMarkers']
            bank_ids={shapes[(row['page'],m)]['parent'] for m in marker_ids}
            label_ids=set().union(*(labels_by_bank[b] for b in bank_ids)) if bank_ids else set()
            if len(candidates)>1:reason='ambiguous_Port_docking'
            elif len(marker_ids)!=1:reason='missing_or_ambiguous_marker_attachment'
            elif marker_ids[0] not in marker_numbers:reason='printed_marker_number_not_established'
            elif len(label_ids)!=1:reason='bank_without_unique_Cable_association'
            else:
                node=node_by_id[p['nodeSymbolShapeId']]['bounds'];m=shapes[(row['page'],marker_ids[0])]['bounds']
                if not (node['min_x']<=m['max_x'] and node['max_x']>=m['min_x'] and node['min_y']<=m['max_y'] and node['max_y']>=m['min_y']):reason='marker_outside_owning_AP_body'
                else:reason='requires_comparison_with_original_interpreter_filter'
            item={'strokeShapeId':row['shapeId'],'markerShapeIds':marker_ids,'bankShapeIds':sorted(bank_ids),'labelShapeIds':sorted(label_ids),'docking':dock,'rejectedReason':reason,'status':'diagnostic_only_not_a_mapping'}
            diagnostics[key]['candidates'].append(item)
for d in diagnostics.values():
    d['reasonCounts']=dict(Counter(c['rejectedReason'] for c in d['candidates']))
    d['classification']='source_supported_rejection' if d['candidates'] else 'not_yet_established'
    if not d['candidates']:d['nextInvestigation']='Inspect owning AP body, complete numbered bank and all source strokes; no candidate found by this bounded docking check is not proof of an intentional empty Port.'
port_groups=defaultdict(list)
for d in diagnostics.values():port_groups[d['nodeShapeId']].append(d)
complete_pairs={p['labelShapeIds'][0] for p in audit['nodeContainerAudit']['physicalBankPairs'] if p['status']=='source_endpoint_bank_pair'}
repeated=Counter(l['text'] for l in audit['labels']);bank_cases=[]
for l in audit['labels']:
    if l['shapeId'] in complete_pairs or repeated[l['text']]>1:continue
    candidates=[banks[b] for b in l['candidateBanks'] if b in banks]
    owners=[b.get('nodeOwners',[]) for b in candidates]
    if len(candidates)!=2:reason='two_unique_candidate_banks_not_established'
    elif any(len(o)!=1 for o in owners):reason='candidate_bank_node_container_not_established'
    elif {o[0]['token'] for o in owners}!={l['fromToken'],l['toToken']}:reason='proximity_candidate_owners_differ_from_declared_endpoints'
    else:reason='complete_drawn_physical_bank_pair_not_established'
    bank_cases.append({'labelShapeId':l['shapeId'],'rawLabel':l['text'],'logicalFibers':l['capacity'],'candidateBanks':[b['groupShapeId'] for b in candidates],'candidateOwners':owners,'earlierAssociationStatus':l['associationStatus'],'reason':reason,'status':'diagnosis_of_rejected_candidate_not_optical_fact','nextInvestigation':'Compare actual strokes/marker numbering, node containers and any partial/combined bank representation. Proximity alone cannot select an association.'})
result={'format':'fiber-atlas-review-diagnostics/1','sourceSha256':audit['sourceSha256'],'rule':RULE,'topologyChanged':False,'scope':'read-only investigation; zero accepted new mappings','ports':list(diagnostics.values()),'portGroups':[{'nodeShapeId':k,'apToken':v[0]['apToken'],'ports':len(v),'reasonCounts':dict(Counter(c['rejectedReason'] for d in v for c in d['candidates']))} for k,v in port_groups.items()],'bankCases':bank_cases,'unlabelledPhysicalPairs':[p for p in audit['nodeContainerAudit']['physicalBankPairs'] if not p['labelShapeIds']],'localLinkReasons':dict(Counter(e['reason'] for e in audit['nodeContainerAudit']['unresolvedLocalLinks'])),'coverageLedger':{'unownedBanks':audit['counts']['bankOwnershipCounts'].get('0',0),'localLinksWithoutAssociation':len(audit['nodeContainerAudit']['unresolvedLocalLinks']),'annotationsPreserved':len(semantic['annotations']),'excludedRawPorts':sum(not p['completePortBank'] for p in semantic['ports']),'aggregationPorts':'not established','TubeAndRingMeaning':'not established','overlapWarning':'These are overlapping coverage impacts, not additional review-case totals.'},'elapsedSeconds':round(time.monotonic()-started,3),'inputHashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'migration/iteration33/source-audit-gap-aware.json',ROOT/'migration/iteration33/compact-shapes.json.gz',ROOT/'tmp/iteration33-shida-semantic.json']}}
places={name.strip() for n in semantic['nodes'] for name in n.get('names',[])};annotations=[]
for a in semantic['annotations']:
    purpose='unclassified_text'
    for category,pattern in [('coordinate','°.*[NS].*[EW]'),('aggregation_name','AGG|აგრეგ'),('planned_work_note','გეგმ|გაიჭრ|სამომავლო|planned'),('reservation_note','სარეზერვ|რეზერვ|reserve'),('operation_note','გაჭრ|შეერთ|მოდულ|cut|splice'),('company_annotation','skytel|magt|silknet|opennet|cgc|მაგთ|სილქ|სქაი'),('construction_annotation',r'\bFO\b|fiber|ჟილ'),('direction_annotation','მიმართულ|toward')]:
        if re.search(pattern,a['text'],re.I):purpose=category;break
    if purpose=='unclassified_text' and a['text'].strip() in places:purpose='AP_place_name'
    annotations.append({'shapeId':a['shapeId'],'rawText':a['text'],'purpose':purpose,'scope':'unresolved','networkFactChanged':False,'completedWork':'not_established','nextStep':'Resolve exact scope and operation status before treating text as a network fact or required work.'})
result['annotationLedger']=annotations;result['annotationPurposeCounts']=dict(Counter(a['purpose'] for a in annotations))
result['unownedBankLedger']=[{'bankShapeId':b['groupShapeId'],'capacity':b['capacity'],'pageId':b['page'],'markerShapeIds':[m['shapeId'] for m in b['markers']],'state':'node_owner_not_established','overlapsExistingCases':True} for b in audit['banks'] if not b['nodeOwners']]
known={b for p in audit['nodeContainerAudit']['physicalBankPairs'] if p['status']=='source_endpoint_bank_pair' for b in p['banks']}
result['rejectedLocalLinkLedger']=[{'strokeShapeId':l['shapeId'],'nodeToken':l['aOwner']['token'],'bankA':l['a']['bankShapeId'],'bankB':l['z']['bankShapeId'],'missingAssociationSides':int(l['a']['bankShapeId'] not in known)+int(l['z']['bankShapeId'] not in known),'reason':l['reason'],'status':'not_an_optical_edge'} for l in audit['nodeContainerAudit']['unresolvedLocalLinks']]
result['distinctPortRejectionPatterns']=dict(Counter('|'.join(sorted(d['reasonCounts'])) or 'not_yet_established' for d in diagnostics.values()))
output=ROOT/'docs/iteration34-rejection-diagnostics.json';output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'ports':len(diagnostics),'groups':len(port_groups),'CableCases':len(bank_cases),'portReasons':dict(Counter(c['rejectedReason'] for d in diagnostics.values() for c in d['candidates'])),'bankReasons':dict(Counter(b['reason'] for b in bank_cases)),'elapsed':result['elapsedSeconds']}))
