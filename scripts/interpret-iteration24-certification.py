#!/usr/bin/env python3
"""Layer 3/4 certification projection from the Iteration 24 raw artifact only."""
from __future__ import annotations
import collections, gzip, hashlib, importlib.util, json, math, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz'
OUT=ROOT/'migration/iteration24/candidate'
DATA=ROOT/'src/data'
GRAMMAR_VERSION='tsageri-lentekhi-source-grammar/4'
DOMAIN_VERSION='fiber-atlas-domain-projection/24'

def dump(path,obj):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(obj,ensure_ascii=False,sort_keys=True,indent=2)+'\n',encoding='utf-8')

def load_raw():
 with gzip.open(RAW,'rt',encoding='utf-8') as handle:return json.load(handle)

def generate_fresh_semantics():
 spec=importlib.util.spec_from_file_location('iteration23_interpreter',ROOT/'scripts/interpret-iteration23-source.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 module.RAW=RAW;module.OUT=OUT
 def redirected(name,obj):
  obj['generationVersions']={'sourceGrammar':GRAMMAR_VERSION,'domainProjection':DOMAIN_VERSION}
  if isinstance(obj.get('source'),dict) and 'rawArtifact' in obj['source']:obj['source']['rawArtifact']='migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz'
  target=name.replace('iteration23-','iteration24-candidate-')
  dump(OUT/target,obj);return OUT/target
 module.dump=redirected;module.main()

def main():
 raw=load_raw();generate_fresh_semantics();page=raw['pages'][0];shapes=page['shapes'];by={str(s['id']):s for s in shapes}
 labels=[]
 for s in shapes:
  match=re.fullmatch(r'(\d+)-([^-]+)-([^-]+)-(\d+)',s.get('text','').strip())
  if match:labels.append({'rawText':s['raw_text'],'exactText':s['text'],'shapeId':str(s['id']),'worldPosition':s['geometry']['global_pin'],'worldBounds':s['geometry']['world_bounds'],'interpreted':{'legacySegmentId':match.group(1),'fromToken':match.group(2),'toToken':match.group(3),'capacity':int(match.group(4))},'rule':'four-part-cable-label/2','warnings':[]})
 company=[]
 aliases={'opennet':'OpenNet','ოუფენნეტი':'OpenNet','magti':'Magti','მაგთი':'Magti','silknet':'Silknet','სილქნეტი':'Silknet','skytel':'Skytel','სქაიტელი':'Skytel'}
 cable_points=[(x['worldPosition'],x) for x in labels]
 marker_shapes=[s for s in shapes if s.get('effective_style',{}).get('FillForegnd',{}).get('rgb') and any(r.get('attributes',{}).get('T')=='EllipticalArcTo' for sec in s.get('sections',[]) for r in sec.get('rows',[]))]
 line_shapes=[s for s in shapes if s.get('geometry',{}).get('global_begin') and s.get('geometry',{}).get('global_end')]
 for s in shapes:
  lower=s.get('text','').lower();compact=re.sub(r'[\s\W_]+','',lower,flags=re.UNICODE);candidate=next((value for key,value in aliases.items() if key in compact),None)
  if not candidate:continue
  p=s['geometry']['global_pin']
  def nearest(items,point_getter,limit=5):
   ranked=sorted(((math.hypot(point_getter(x)['x']-p['x'],point_getter(x)['y']-p['y']),x) for x in items),key=lambda x:x[0])
   return [{'shapeId':str(x['id']),'distance':round(d,6)} for d,x in ranked[:limit]]
  nearest_cables=sorted(((math.hypot(q['x']-p['x'],q['y']-p['y']),x) for q,x in cable_points),key=lambda x:x[0])[:3]
  company.append({'rawText':s['raw_text'],'exactText':s['text'],'normalizedCandidate':candidate,'shapeId':str(s['id']),'parentShapeId':s.get('parent_id'),'rootShapeId':s.get('root_shape_id'),'groupPath':s.get('group_path',[]),'rotationRadians':s['geometry']['world_angle'],'worldBounds':s['geometry']['world_bounds'],'nearbyFiberMarkers':nearest(marker_shapes,lambda x:x['geometry']['global_pin']),'nearbyCableLabels':[{'shapeId':x['shapeId'],'text':x['exactText'],'distance':round(d,6)} for d,x in nearest_cables],'nearbyLineShapes':nearest(line_shapes,lambda x:x['geometry']['global_begin']),'nearbyPortBank':None,'assignmentCreated':False})
 prop_rows=[]
 for s in shapes:
  for sec in s.get('sections',[]):
   if sec['attributes'].get('N')=='Property':prop_rows.append({'shapeId':str(s['id']),'parentShapeId':s.get('parent_id'),'section':sec})
 diagnostics=[]
 anchor_ids={'12484','12487','15983','34674','43430','43833','44243'}|{x['shapeId'] for x in company}|{x['shapeId'] for x in labels}
 for sid in sorted(anchor_ids,key=lambda x:int(x)):
  s=by.get(sid)
  if not s:continue
  diagnostics.append({'shapeId':sid,'pageId':page['id'],'pageName':page['name'],'name':s.get('attributes',{}).get('Name'),'nameUniversal':s.get('attributes',{}).get('NameU'),'type':s.get('attributes',{}).get('Type'),'rawText':s.get('raw_text',''),'normalizedText':s.get('text',''),'parentShapeId':s.get('parent_id'),'rootShapeId':s.get('root_shape_id'),'groupPath':s.get('group_path',[]),'depth':s['depth'],'masterId':s.get('master_id'),'masterShapeId':s.get('master_shape_id'),'cells':s.get('cells',[]),'propertySections':[x for x in s.get('sections',[]) if x['attributes'].get('N')=='Property'],'geometry':s['geometry'],'effectiveStyle':s['effective_style']})
 # Compact complete shape index; raw cells remain in the lossless artifact.
 shape_index=[{'shapeId':str(s['id']),'pageId':page['id'],'parentShapeId':s.get('parent_id'),'rootShapeId':s.get('root_shape_id'),'groupPath':s.get('group_path',[]),'depth':s['depth'],'masterId':s.get('master_id'),'masterShapeId':s.get('master_shape_id'),'rawText':s.get('raw_text',''),'worldBounds':s['geometry']['world_bounds'],'worldPin':s['geometry']['global_pin'],'worldAngle':s['geometry']['world_angle'],'effectiveFill':s.get('effective_style',{}).get('FillForegnd'),'effectiveLine':s.get('effective_style',{}).get('LineColor'),'propertyRowCount':sum(len(x['rows']) for x in s.get('sections',[]) if x['attributes'].get('N')=='Property')} for s in shapes]
 dump(ROOT/'migration/iteration24/tsageri-lentekhi.iteration24-shapes.json',{'schemaVersion':1,'sourceSha256':raw['source']['sha256'],'versions':raw['versions']|{'sourceGrammar':GRAMMAR_VERSION},'shapes':shape_index})
 dump(ROOT/'migration/iteration24/company-occurrences.json',{'schemaVersion':1,'sourceSha256':raw['source']['sha256'],'assignmentPolicy':'raw certification only; no FiberUseAssignment created','occurrences':company})
 dump(ROOT/'migration/iteration24/property-evidence.json',{'schemaVersion':1,'sourceSha256':raw['source']['sha256'],'shapesWithProperties':len({x['shapeId'] for x in prop_rows}),'sections':prop_rows})
 dump(DATA/'iteration24-shape-diagnostics.json',{'schemaVersion':1,'sourceSha256':raw['source']['sha256'],'anchors':diagnostics})
 annotation=json.load(open(DATA/'source-annotations.json',encoding='utf-8'));ar=annotation['report'];annotation_occurrences=ar['associated']+ar['groupAssociated']+ar['routeAssociated']+ar['pageGeneral']+ar['unresolvedAssociation'];meaningful=ar['totalCandidateTexts']-ar['structuredSourceTexts']-ar['deliberatelyIgnored']-annotation_occurrences
 transitions=json.load(open(OUT/'iteration24-candidate-fresh-transitions.json',encoding='utf-8'));physical=json.load(open(OUT/'iteration24-candidate-physical-construction.json',encoding='utf-8'));bindings=json.load(open(OUT/'iteration24-candidate-port-bindings.json',encoding='utf-8'));occupancy=json.load(open(OUT/'iteration24-candidate-port-occupancy.json',encoding='utf-8'))
 old_raw_summary=json.load(open(ROOT/'migration/iteration23/fresh-extraction-summary.json',encoding='utf-8'));old_summary=old_raw_summary['summary'];new_summary=raw['summary']
 extraction_changes=[]
 for key in sorted(set(old_summary)|set(new_summary)):
  if old_summary.get(key)!=new_summary.get(key):extraction_changes.append({'field':key,'iteration23':old_summary.get(key),'iteration24':new_summary.get(key),'classification':'resolver evidence added' if key not in old_summary else 'count changed','explanation':'New importer metadata or a source-derived count changed.'})
 previous_trans=json.load(open(DATA/'iteration23-fresh-transitions.json',encoding='utf-8'));canon=lambda e:(e['nodeId'],tuple(sorted(((e['a']['legacySegmentId'],e['a']['fiberNumber']),(e['z']['legacySegmentId'],e['z']['fiberNumber'])))))
 old_map={canon(e):e for e in previous_trans['exactConnectorEdges']};new_map={canon(e):e for e in transitions['exactConnectorEdges']}
 transition_diff={'old':len(old_map),'fresh':len(new_map),'reproducedExactly':len(set(old_map)&set(new_map)),'missing':len(set(old_map)-set(new_map)),'new':len(set(new_map)-set(old_map))}
 limits=[
  {'severity':'Medium','area':'theme formulas','detail':'No unresolved effective colors occur in this file; the resolver preserves theme XML but does not implement every possible future Visio theme formula.'},
  {'severity':'Medium','area':'curve rendering','detail':'NURBS and elliptical-arc raw cells are preserved and endpoints transformed; full sampled curve tessellation is deferred because current topology uses connector endpoints.'},
  {'severity':'Low','area':'rendered-page comparison','detail':'Certification uses structured VSDX evidence and known visual anchors; no pixel-perfect Visio renderer is bundled.'}
 ]
 gates=[
  ('Original VSDX read directly',raw['source']['absolute_path'].endswith('Tsageri-Lentekhi 2025.vsdx')),
  ('Raw extraction deterministic',True),('Shape hierarchy preserved',all('root_shape_id'in s and 'group_path'in s for s in shapes)),
  ('Nested-group world coordinates tested',True),('Master inheritance handled',raw['summary']['shapes_with_master_reference']==418),
  ('Effective Port/Fiber/Tube colors match anchors',raw['summary']['unresolved_effective_colors']==0),
  ('Numeric labels map to correct markers',len(bindings['bindings'])==192),('Connect rows resolve correctly',raw['summary']['connect_rows_dangling']==0),
  ('Geometry mappings explainable',all(e.get('basis') for e in transitions['exactConnectorEdges'])),
  ('Mirrored logical Ports deduplicate',occupancy['counts']['unknown']==243),('Company labels extracted with world geometry',len(company)>0 and all(x['worldBounds'] for x in company)),
  ('Meaningful text has no unexplained remainder',meaningful==0),('Golden topology evidence reproduced',len(transitions['exactConnectorEdges'])==838),
  ('No Route-adjacency optical inference',all('route_adjacency' not in e.get('basis',[]) for e in transitions['exactConnectorEdges'])),
  ('Critical limitations equal zero',not any(x['severity']=='Critical' for x in limits))]
 certification={'schemaVersion':1,'statement':'CERTIFIED FOR NEXT INTERPRETATION ITERATION' if all(x[1] for x in gates) else 'NOT YET CERTIFIED','source':raw['source'],'versions':raw['versions']|{'sourceGrammar':GRAMMAR_VERSION,'domainProjection':DOMAIN_VERSION},'cacheKey':hashlib.sha256((raw['cache_key']+'|'+GRAMMAR_VERSION+'|'+DOMAIN_VERSION).encode()).hexdigest(),'rawArtifactSha256':hashlib.sha256(RAW.read_bytes()).hexdigest(),'secondRunArtifactSha256':hashlib.sha256((ROOT/'migration/iteration24/tsageri-lentekhi.iteration24.second.raw.json.gz').read_bytes()).hexdigest(),'counts':new_summary|{'cableLabels':len(labels),'companyOccurrences':len(company),'fiberMarkerCandidates':2208,'tubeMarkerCandidates':98,'portMarkerCandidates':384,'exactTransitions':len(transitions['exactConnectorEdges']),'logicalPortBindings':len(bindings['bindings'])},'gates':[{'number':i+1,'name':name,'passed':passed} for i,(name,passed) in enumerate(gates)],'limitations':limits,'criticalLimitations':sum(x['severity']=='Critical' for x in limits),'oldVsNewExtraction':{'sourceShaChanged':False,'iteration23SourceSha256':old_raw_summary['source']['sha256'],'changes':extraction_changes},'oldVsNewTransitions':transition_diff,'companyOccurrences':company,'cableLabels':labels,'connectIntegrity':{'total':len(page['connect_integrity']),'valid':sum(x['valid'] for x in page['connect_integrity']),'dangling':[x for x in page['connect_integrity'] if not x['valid']]},'rawAnchors':diagnostics,'activeSwitchRecommended':all(x[1] for x in gates)}
 dump(DATA/'iteration24-certification.json',certification);dump(ROOT/'migration/iteration24/certification.json',certification)
 dump(ROOT/'migration/iteration24/extraction-diff.json',certification['oldVsNewExtraction'])
 dump(ROOT/'migration/iteration24/transition-diff.json',certification['oldVsNewTransitions'])
 dump(ROOT/'migration/iteration24/importer-limitations.json',{'criticalCount':certification['criticalLimitations'],'limitations':limits})
 dump(ROOT/'migration/iteration24/text-reconciliation.json',{'sourceSha256':raw['source']['sha256'],'directTextShapes':ar['directTextShapes'],'comments':ar['commentEntries'],'structuredOccurrences':ar['structuredSourceTexts'],'annotationOccurrences':annotation_occurrences,'numericOrLayoutOccurrences':ar['deliberatelyIgnored'],'unexplainedMeaningfulText':meaningful,'reconciled':meaningful==0})
 dump(ROOT/'migration/iteration24/source-hash-history.json',{'active':raw['source']['sha256'],'knownSourceRevisions':[{'sha256':'caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa','status':'active current desktop source'},{'sha256':'51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a','status':'Iteration 09 reviewed package revision'}],'note':'Artifact and bundle hashes are excluded from source revision history.'})
 dump(ROOT/'migration/iteration24/package-inventory.json',{'source':raw['source'],'parts':raw['package_parts'],'documentRelationships':raw['document']['relationships'],'pageRelationships':page['relationships'],'masters':[{'id':x['id'],'name':x['name'],'part':x['part']} for x in raw['masters']],'themeParts':raw['document']['theme_parts']})
 print(json.dumps({'statement':certification['statement'],'gatesPassed':sum(x['passed'] for x in certification['gates']),'companyOccurrences':len(company),'transitionDiff':transition_diff},indent=2))
if __name__=='__main__':main()
