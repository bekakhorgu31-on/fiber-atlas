"""Create the deterministic, source-specific topology projection for Iteration 27D."""
import json
import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
src = json.loads((ROOT / 'migration/iteration27/source-interpretation.json').read_text(encoding='utf-8'))
ledger = json.loads((ROOT / 'migration/iteration27/source-b-transition-ledger.json').read_text(encoding='utf-8'))
semantic = json.loads((ROOT / 'migration/iteration27/semantic-audit.json').read_text(encoding='utf-8'))
assert src['source']['sha256'] == ledger['sourceSha256'] == '419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d'
colors = {k: v for k, v in {
    'blue':'#0000ff','orange':'#f48c37','green':'#008000','brown':'#9c4a09','slate':'#808080',
    'white':'#ffffff','red':'#ff0000','black':'#000000','yellow':'#ffff00','violet':'#cc99ff','rose':'#ff00ff','aqua':'#00ffff'
}.items()}
cables=[]
for label in src['cableLabels']:
    cables.append({
        'legacyId':label['legacyId'].removeprefix('C'), 'label':label['legacyLabel'],
        'endpoints':label['endpointTokens'], 'fiberCount':label['capacityFibers'],
        'sourceShapeIds':label['source']['shapeIds'],
        'fibers':[{k:f[k] for k in ('fiberNumber','tubeNumber','positionInTube','fiberColorKey','tubeColorKey')}
                  for f in src['physicalConstructionCandidates'][label['legacyId'] if label['legacyId'].startswith('C') else 'C'+label['legacyId']]['banks'][0]['fibers']]
    })
transitions=[]
overlaps=[]
for t in ledger['transitions']:
    if t['disposition'] == 'exact_source_transition':
        transitions.append({k:t[k] for k in ('id','node','segmentA','fiberA','tubeA','fiberColorA','tubeColorA','markerShapeA','segmentB','fiberB','tubeB','fiberColorB','tubeColorB','markerShapeB','connectorShape','connectorGeometry')})
    elif t['disposition'] == 'duplicate_overlap_evidence':
        overlaps.append({k:t[k] for k in ('id','node','segmentA','fiberA','segmentB','fiberB','connectorShape','markerShapeA','markerShapeB')})
artifact={
    'schemaVersion':1,'sourceSha256':src['source']['sha256'],'documentId':src['documentId'],
    'cables':cables,'transitions':transitions,'overlapTransitions':overlaps,
    'transitionAccounting':ledger['summary'],
    'sourceConflicts':[semantic['c148Conflict']],
}
# Keep the source's meaningful, unresolved annotation occurrences as evidence; none creates topology.
text_rows=[]
for line in (ROOT/'migration/iteration27/all-text.txt').read_text(encoding='utf-8').splitlines():
    parts=line.split('\t',3)
    if len(parts) >= 2:
        try: text_rows.append({'shapeId':parts[0], 'text':ast.literal_eval(parts[1])})
        except (ValueError, SyntaxError): pass
cut=[x for x in text_rows if 'გაიჭრას' in x['text'] or 'მოდული' in x['text']]
company=[{'shapeId':x['shapeId'],'text':x['organizationText'],'organization':x['organizationKey'],'bounds':x.get('worldBounds'),'rotation':x.get('worldAngle'),'groupPath':x.get('groupPath',[]),'nearbyEvidence':x.get('nearestTransitionMarkerShapes',[])} for x in semantic['textShapeDisposition']['companyOccurrences']]
place_names=['ჩხუტელი','ორბელი','ლაჯანა','გაგულეჩი','ლაილაში','სურმუში','აჭარა','ალპანა','ტვიში']
annotation_rows=[]
for x in company: annotation_rows.append({'id':f"ORG-{x['shapeId']}",'rawText':x['text'],'category':'service_commercial_note','scope':'unresolved','sourceShapeId':x['shapeId'],'organization':x['organization'],'geometry':x['bounds'],'rotation':x['rotation'],'groupPath':x['groupPath'],'nearbyEvidence':x['nearbyEvidence'],'associationState':'unresolved'})
for x in cut: annotation_rows.append({'id':f"CUT-{x['shapeId']}",'rawText':x['text'],'category':'source_instruction','scope':'unresolved','sourceShapeId':x['shapeId'],'executionStatus':'unknown','associationState':'unresolved'})
for x in text_rows:
    if x['text'] in place_names: annotation_rows.append({'id':f"PLACE-{x['shapeId']}",'rawText':x['text'],'category':'place_annotation','scope':'unresolved','sourceShapeId':x['shapeId'],'associationState':'unresolved'})
    elif 'მიმართულება' in x['text'] or 'ლენტეხი-ხელედის' in x['text']: annotation_rows.append({'id':f"DIRECTION-{x['shapeId']}",'rawText':x['text'],'category':'direction_annotation','scope':'unresolved','sourceShapeId':x['shapeId'],'createsFiberEdge':False,'associationState':'unresolved'})
    elif x['text'].strip().upper().replace(' ', '').startswith('FO') and any(ch.isdigit() for ch in x['text']): annotation_rows.append({'id':f"CAPACITY-{x['shapeId']}",'rawText':x['text'],'category':'capacity_note','scope':'unresolved','sourceShapeId':x['shapeId'],'associationState':'unresolved'})
    elif 'Aagregacia' in x['text'] or 'ODF-ში' in x['text'] or x['text']=='OTDR': annotation_rows.append({'id':f"NOTE-{x['shapeId']}",'rawText':x['text'],'category':'technical_annotation','scope':'unresolved','sourceShapeId':x['shapeId'],'associationState':'unresolved'})
artifact['annotations']=annotation_rows
artifact['textAccounting']={'nonemptyTextShapes':3569,'meaningfulTextOccurrencesPreserved':len(annotation_rows)+22,'companyOccurrences':len(company),'cutModuleNotes':len(cut),'numericAndLayoutText':3463,'companyAssignmentsCreated':0}
out=ROOT/'src/data/iteration27d-network-projection.json'
out.write_text(json.dumps(artifact,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(f'wrote {out.relative_to(ROOT)}: {len(cables)} cables, {sum(c["fiberCount"] for c in cables)} fiber positions, {len(transitions)} exact transitions')
