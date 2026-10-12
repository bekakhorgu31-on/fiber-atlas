"""Read-only SC217 source audit. Does not manufacture a transition or mutate raw imports."""
import collections, gzip, hashlib, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('fresh',ROOT/'scripts/interpret-iteration23-source.py')
fresh=importlib.util.module_from_spec(spec);spec.loader.exec_module(fresh)
geometry_spec=importlib.util.spec_from_file_location('marker_geometry',ROOT/'scripts/marker_geometry.py')
marker_geometry=importlib.util.module_from_spec(geometry_spec);geometry_spec.loader.exec_module(marker_geometry)
raw_path=ROOT/'migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz'
with gzip.open(raw_path,'rt',encoding='utf8') as f:raw=json.load(f)
page=raw['pages'][0];shapes=page['shapes'];by={str(s['id']):s for s in shapes};children=collections.defaultdict(list)
for s in shapes:children[str(s.get('parent_id'))].append(s)
def descendants(group):
 out=[];stack=list(children[str(group)])
 while stack:
  s=stack.pop();out.append(s);stack.extend(children[str(s['id'])])
 return out
markers={}
for seg,group in [('171','34109'),('172','34524')]:
 bank=sorted((s for s in descendants(group) if fresh.is_marker(s)),key=lambda s:fresh.gp(s)['x'])
 for n,s in enumerate(bank,1):markers[str(s['id'])]={'segment':seg,'fiber':n,'shape':str(s['id']),'group':group,'pin':fresh.gp(s),'bounds':s['geometry']['world_bounds'],'fill':s['effective_style']['FillForegnd'],'ring':s['effective_style']['LineColor']}
edges=json.loads((ROOT/'src/data/iteration24-fresh-transitions.json').read_text(encoding='utf8'))
rows=edges.get('exactConnectorEdges',edges.get('edges',[]))
audit=[]
for seg in ['171','172']:
 for n in [9,10,11,12,13]:
  marker=next(m for m in markers.values() if m['segment']==seg and m['fiber']==n);p=marker['pin']
  connects=[r for r in page['connects'] if str(r.get('ToSheet'))==marker['shape']]
  near=[]
  for s in shapes:
   begin,end=fresh.endpoint(s,'begin'),fresh.endpoint(s,'end')
   if not begin or not end:continue
   distance=min(abs(q['x']-p['x'])+abs(q['y']-p['y']) for q in [begin,end])
   if distance>.16:continue
   sid=str(s['id']);targets=[r for r in page['connects'] if str(r.get('FromSheet'))==sid]
   near.append({'shape':sid,'distance':distance,'text':s.get('text'),'parent':s.get('parent_id'),'begin':begin,'end':end,'style':s.get('effective_style'),'connects':targets,'cells':s.get('cells'),'sections':s.get('sections')})
  audit.append({'marker':marker,'connects':connects,'nearLines':sorted(near,key=lambda s:s['distance']),'activeSourceEdges':[e for e in rows if e.get('nodeId')=='SC217' and any(x.get('legacySegmentId')==seg and x.get('fiberNumber')==n for x in [e['a'],e['z']])]})
output={'source':raw['source'],'rawArtifact':str(raw_path.relative_to(ROOT)),'rawArtifactSha256':hashlib.sha256(raw_path.read_bytes()).hexdigest(),'audit':audit}
corrections=[]
for n in [10,11,12]:
 a=next(m for m in markers.values() if m['segment']=='171' and m['fiber']==n)
 z=next(m for m in markers.values() if m['segment']=='172' and m['fiber']==n)
 def hits(point):
  return marker_geometry.matching_marker_shapes(point,[dict(m,geometry=by[m['shape']]['geometry']) for m in markers.values()])
 candidates=[]
 for s in shapes:
  begin,end=fresh.endpoint(s,'begin'),fresh.endpoint(s,'end')
  if not begin or not end:continue
  aa,zz=hits(begin),hits(end)
  if len(aa)==len(zz)==1 and aa[0]['shape']==a['shape'] and zz[0]['shape']==z['shape']:
   candidates.append({'connectorShapeId':str(s['id']),'begin':begin,'end':end,'a':a,'z':z,'connectRows':[r for r in page['connects'] if str(r.get('FromSheet'))==str(s['id'])],'oldTolerancePass':abs(begin['x']-a['pin']['x'])<=.015 and abs(end['x']-z['pin']['x'])<=.015,'endpointEllipseHits':[len(aa),len(zz)]})
 assert len(candidates)==1,(n,candidates)
 output.setdefault('resolvedPairs',[]).append(candidates[0])
 if n in [10,12]:corrections.append(candidates[0])
with gzip.open(ROOT/'migration/tsageri-lentekhi-iteration09.raw.json.gz','rt',encoding='utf8') as f:old_raw=json.load(f)
old_by={str(s['id']):s for s in old_raw['pages'][0]['shapes']}
for c in corrections:
 old=old_by[c['connectorShapeId']]
 cells={x['N']:x.get('V') for x in old['cells']}
 c['priorExtractionCorroboration']={k:cells[k] for k in ['BeginX','BeginY','EndX','EndY']}
 assert all(abs(float(cells[k])-c[side][axis])<1e-9 for k,side,axis in [('BeginX','begin','x'),('BeginY','begin','y'),('EndX','end','x'),('EndY','end','y')])
evidence={'rule':'SC217-unique-endpoint-inside-decoded-marker-ellipse/1','sourceSha256':raw['source']['sha256'],'rawArtifact':str(raw_path.relative_to(ROOT)),'corrections':corrections,'ownerReport':{'id':'OWNER-2026-10-05-C169-F12-LENTEKHI','recordedAt':'2026-10-05','selectedSegmentId':'CAB-000169','selectedFiberNumber':12,'reportedEndpoint':{'kind':'aggregation','id':'AGG-LENTEKHI'},'reportedOrganization':'Silknet','basis':'Owner report preserved in Iteration 28L task; no exact local pair asserted by owner.','fieldVerified':False}}
(ROOT/'src/data/iteration28l-sc217-corrections.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'docs/iteration28l-sc217-source-audit.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for a in audit:
 m=a['marker'];print(f"C{m['segment']}/F{m['fiber']} marker={m['shape']} pin={m['pin']} Connect={a['connects']}")
 for s in a['nearLines'][:6]:print(' line',s['shape'],'delta',round(s['distance'],6),'begin',s['begin'],'end',s['end'],'targets',[(r.get('ToSheet'),r.get('FromCell')) for r in s['connects']])
