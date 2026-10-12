#!/usr/bin/env python3
"""Fresh source interpretation. Reads only Iteration 23 raw extraction.

The archived Iteration 22 transition file is opened only after the fresh
projection is complete, in the isolated diff phase.
"""
from __future__ import annotations
import collections, gzip, hashlib, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'migration/iteration23/tsageri-lentekhi.fresh.raw.json.gz'
OUT=ROOT/'src/data'
SHA='caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa'
ENDPOINTS={
'148':['AGG5','SC205'],'149':['SC205','AP41'],'150':['SC205','SC206'],'151':['SC206','SC207-boundary'],'169':['SC206','SC216'],'170':['SC216','AP50'],'171':['SC216','SC217'],'172':['SC217','SC218'],'173':['SC218','AP51'],'174':['SC218','SC219'],'175':['SC219','AP52'],'176':['SC219','SC220'],'177':['SC220','SC221'],'178':['SC221','SC222'],'179':['SC222','SC223'],'180':['SC223','SC224'],'181':['SC224','SC225'],'182':['SC225','AP53'],'183':['SC225','AP54'],'184':['LENTEKHI','SC224']}
AP_CABLE={'41':'149','50':'170','51':'173','52':'175','53':'182','54':'183'}
GREEN={'#92d050','#00b050','#128729','#13861c','#008000','#009900','#00ff00'}
COLOR_KEY={'#0000ff':'blue','#f48c37':'orange','#ea700d':'orange','#f9bb00':'orange','#008000':'green','#9c4a09':'brown','#808080':'slate','#7f7f7f':'slate','#ffffff':'white','#ff0000':'red','#000000':'black','#ffff00':'yellow','#cc99ff':'violet','#7030a0':'violet','#ff00ff':'rose','#00ffff':'aqua'}

def dump(name,obj):
 p=OUT/name;p.write_text(json.dumps(obj,ensure_ascii=False,sort_keys=True,indent=2)+'\n',encoding='utf-8');return p
def is_marker(s):
 return bool(s.get('effective_style',{}).get('FillForegnd',{}).get('rgb')) and any(r.get('attributes',{}).get('T')=='EllipticalArcTo' for sec in s.get('sections',[]) for r in sec.get('rows',[]))
def gp(s):return s['geometry']['global_pin']
def endpoint(s,name):return s.get('geometry',{}).get('global_'+name.lower())
def local_cell(s,name):
 return next((c for c in s.get('cells',[]) if c.get('N')==name),{})
def style_cell(s,name):
 return s.get('effective_style',{}).get(name,{})
def parse_label(t):
 m=re.fullmatch(r'(\d+)-([^-]+)-([^-]+)-(\d+)',t.strip());return None if not m else {'legacySegmentId':m.group(1),'fromToken':m.group(2),'toToken':m.group(3),'capacity':int(m.group(4))}
def canon(e):
 sides=sorted([(e['a']['legacySegmentId'],e['a']['fiberNumber']),(e['z']['legacySegmentId'],e['z']['fiberNumber'])]);return (e['nodeId'],*sides[0],*sides[1])

def main(compare=True):
 with gzip.open(RAW,'rt',encoding='utf-8') as f:raw=json.load(f)
 assert raw['source']['sha256']==SHA
 page=raw['pages'][0];shapes=page['shapes'];by={str(s['id']):s for s in shapes};children=collections.defaultdict(list)
 for s in shapes:children[str(s.get('parent_id'))].append(s)

 labels=[]
 for s in shapes:
  parsed=parse_label(s.get('text',''))
  if parsed and parsed['legacySegmentId'] in ENDPOINTS:labels.append({**parsed,'shapeId':str(s['id']),'exactLabel':s['text'],'position':gp(s)})
 assert {x['legacySegmentId'] for x in labels}==set(ENDPOINTS)
 def descendants(group_id):
  out=[];stack=list(children[str(group_id)])
  while stack:
   item=stack.pop();out.append(item);stack.extend(children[str(item['id'])])
  return out
 candidates=[]
 for s in shapes:
  if s.get('attributes',{}).get('Type')!='Group':continue
  markers=[x for x in descendants(str(s['id'])) if is_marker(x)]
  if len(markers) in {24,48,72,96,144,192}:candidates.append((s,markers))
 banks={}
 for label in labels:
  cap=label['capacity'];lp=label['position'];valid=[]
  for group,markers in candidates:
   if len(markers)!=cap:continue
   p=gp(group);xd=abs(p['x']-lp['x']);yd=p['y']-lp['y']
   if xd<=3.2 and abs(yd)<=7:valid.append((abs(yd)+xd*.1,yd,group,markers))
  chosen=[]
  lower=sorted((v for v in valid if v[1]<0),key=lambda x:x[0]);upper=sorted((v for v in valid if v[1]>0),key=lambda x:x[0])
  if lower:chosen.append(lower[0])
  if upper:chosen.append(upper[0])
  banks[label['legacySegmentId']]=[]
  for _,_,group,markers in sorted(chosen,key=lambda x:gp(x[2])['y']):
   ordered=sorted(markers,key=lambda x:gp(x)['x'])
   banks[label['legacySegmentId']].append({'groupShapeId':str(group['id']),'markers':ordered})
 assert all(banks[x] for x in ENDPOINTS), {x:len(banks[x]) for x in ENDPOINTS}

 # Decode physical construction independently from the freshly discovered
 # banks. Effective fill/line colors are used; raw cell values stay attached.
 physical_segments=[];physical_by_marker={}
 for seg,items in sorted(banks.items(),key=lambda x:int(x[0])):
  decoded_banks=[]
  for item in items:
   records=[];markers=item['markers']
   for n,m in enumerate(markers,1):
    tube=(n-1)//12+1;block=markers[(tube-1)*12:tube*12]
    rings=collections.Counter(COLOR_KEY.get(style_cell(x,'LineColor').get('rgb')) for x in block);rings.pop(None,None)
    tube_color=rings.most_common(1)[0][0] if rings else None
    inner=style_cell(m,'FillForegnd');outer=style_cell(m,'LineColor');observed=COLOR_KEY.get(outer.get('rgb'));warnings=[]
    if observed!=tube_color:warnings.append('Individual ring differs from the repeated ring color of its 12-position Tube group.')
    record={'fiberNumber':n,'tubeNumber':tube,'positionInTube':(n-1)%12+1,'markerShapeId':str(m['id']),'rawInnerColor':local_cell(m,'FillForegnd').get('V',inner.get('value')),'effectiveInnerColor':inner.get('rgb'),'fiberColorKey':COLOR_KEY.get(inner.get('rgb')),'rawOuterColor':local_cell(m,'LineColor').get('V',outer.get('value')),'effectiveOuterColor':outer.get('rgb'),'observedOuterColorKey':observed,'tubeColorKey':tube_color,'warnings':warnings}
    records.append(record);physical_by_marker[str(m['id'])]=record
   decoded_banks.append(records)
  canonical=decoded_banks[0];signature=lambda rr:[(x['fiberColorKey'],x['tubeColorKey']) for x in rr]
  physical_segments.append({'segmentId':f'CAB-{int(seg):06d}','legacySegmentId':seg,'fiberCount':len(canonical),'tubeCount':(len(canonical)+11)//12,'groupShapeIds':[items[0]['groupShapeId']],'corroboratingGroupShapeIds':[x['groupShapeId'] for x in items[1:]],'pairedBanksAgree':all(signature(x)==signature(canonical) for x in decoded_banks[1:]),'decodedFiberColors':sum(x['fiberColorKey'] is not None for x in canonical),'decodedTubeColors':len({x['tubeNumber'] for x in canonical if x['tubeColorKey'] is not None}),'confidence':'source_interpreted','records':canonical,'unresolved':[] if all(x['fiberColorKey'] and x['tubeColorKey'] for x in canonical) else ['One or more effective marker colors are outside the bounded source color map.']})

 marker_index={};bank_records=[]
 for seg,items in banks.items():
  for bi,item in enumerate(items):
   rec={'segment':seg,'bankIndex':bi,'groupShapeIds':[item['groupShapeId']],'markerCount':len(item['markers'])};bank_records.append(rec)
   for n,m in enumerate(item['markers'],1):
    physical=physical_by_marker[str(m['id'])]
    marker_index[str(m['id'])]={'segment':seg,'bankIndex':bi,'fiberNumber':n,'groupShapeIds':[item['groupShapeId']],'markerShapeId':str(m['id']),'absoluteX':gp(m)['x'],'absoluteY':gp(m)['y'],'evidenceBasis':'explicit_connect','tubeNumber':physical['tubeNumber'],'tubeColorKey':physical['tubeColorKey'],'fiberColorKey':physical['fiberColorKey'],'rawInnerColor':physical['rawInnerColor'],'effectiveInnerColor':physical['effectiveInnerColor'],'rawOuterColor':physical['rawOuterColor'],'effectiveOuterColor':physical['effectiveOuterColor']}

 targets=collections.defaultdict(list)
 for row in page['connects']:
  t=marker_index.get(str(row.get('ToSheet')))
  if t:targets[str(row.get('FromSheet'))].append({**t,'connectorCell':row.get('FromCell')})
 positions=list(marker_index.values())
 def nearest(x,y):
  c=[(abs(v['absoluteX']-x)+abs(v['absoluteY']-y),v) for v in positions if abs(v['absoluteX']-x)<=.015 and abs(v['absoluteY']-y)<=.05]
  return None if not c else {**min(c,key=lambda x:x[0])[1],'evidenceBasis':'source_geometry','alignmentDelta':min(c,key=lambda x:x[0])[0]}
 connector_ids=set(targets)
 connector_ids.update(str(s['id']) for s in shapes if endpoint(s,'begin') and endpoint(s,'end'))
 for cid in connector_ids:
  c=by.get(cid,{})
  for side,cell in [('begin','BeginX'),('end','EndX')]:
   if any(x.get('connectorCell')==cell for x in targets[cid]):continue
   p=endpoint(c,side)
   if p:
    m=nearest(p['x'],p['y'])
    if m:targets[cid].append({**m,'connectorCell':cell})
 edges=[];dangling=[]
 for cid,tt in sorted(targets.items(),key=lambda x:int(x[0])):
  vals=sorted({(v['segment'],v['bankIndex'],v['fiberNumber']):v for v in tt}.values(),key=lambda v:(int(v['segment']),v['bankIndex'],v['fiberNumber']))
  made=False
  for i,a in enumerate(vals):
   for z in vals[i+1:]:
    if a['segment']==z['segment']:continue
    common=set(ENDPOINTS[a['segment']])&set(ENDPOINTS[z['segment']])
    if len(common)!=1:continue
    node=next(iter(common));c=by.get(cid,{})
    side_keys=('segment','bankIndex','fiberNumber','markerShapeId','tubeNumber','tubeColorKey','fiberColorKey','rawInnerColor','effectiveInnerColor','rawOuterColor','effectiveOuterColor')
    edges.append({'id':f'NFT-{node}-{cid}','nodeId':node,'connectorShapeId':cid,'a':{k:a[k] for k in side_keys}|{'legacySegmentId':a['segment']},'z':{k:z[k] for k in side_keys}|{'legacySegmentId':z['segment']},'basis':sorted({a['evidenceBasis'],z['evidenceBasis']}),'geometry':{'begin':endpoint(c,'begin'),'end':endpoint(c,'end')}});made=True
  if vals and not made:dangling.append({'connectorShapeId':cid,'targets':vals})
 edges.sort(key=lambda e:(e['nodeId'],int(e['connectorShapeId']),int(e['a']['legacySegmentId']),e['a']['fiberNumber']))

 # AP port graphics: explicit number labels below each ODF symbol. Bank identity is
 # selected by y proximity; Fiber number is selected by x alignment, never array order.
 ap_ports=[];bindings=[];ap_evidence=[]
 odf_groups=[s for s in shapes if s.get('attributes',{}).get('NameU','').startswith('ODF.')]
 for group in odf_groups:
  nums={x.get('text','').strip() for x in children[str(group['id'])]};ap=next((x for x in nums if x in AP_CABLE),None)
  if not ap:continue
  g=gp(group);w=abs(group['geometry']['width']);port_shapes=[]
  for s in shapes:
   t=s.get('text','').strip();p=gp(s)
   if s.get('parent_id') is None and t.isdigit() and 1<=int(t)<=24 and g['x']-w/2<=p['x']<=g['x']+w/2 and .35<=g['y']-p['y']<=.85:port_shapes.append(s)
  bynum={int(s['text'].strip()):s for s in port_shapes};assert set(bynum)==set(range(1,25)),(ap,set(bynum))
  ap_evidence.append({'id':ap,'groupShapeId':str(group['id']),'labelShapeIds':sorted(str(x['id']) for x in children[str(group['id'])] if x.get('text','').strip()==ap)})
  seg=AP_CABLE[ap];apbank=min(banks[seg],key=lambda b:abs(gp(by[str(b['groupShapeId'])])['y']-sum(gp(x)['y'] for x in port_shapes)/24))
  markers=apbank['markers']
  for n in range(1,25):
   ps=bynum[n];p=gp(ps);match=min(markers,key=lambda m:abs(gp(m)['x']-p['x']));delta=abs(gp(match)['x']-p['x']);assert delta<.015,(ap,n,delta)
   fiber=sorted(markers,key=lambda x:gp(x)['x']).index(match)+1;sty=ps['effective_style'];fill=sty.get('FillForegnd',{}).get('rgb');pattern=sty.get('FillPattern',{}).get('value')
   usage='in_use' if fill in GREEN and pattern!='0' else 'unused' if fill=='#ffffff' and pattern!='0' else 'unknown'
   ap_ports.append({'ownerType':'ap','ownerId':ap,'portNumber':n,'physicalUsage':usage,'availability':'unknown','rawFill':sty.get('FillForegnd',{}).get('value'),'effectiveFill':fill,'fillPattern':pattern,'sourceShapeIds':[str(ps['id'])],'companyLabel':None})
   bindings.append({'id':f'PTB-AP{ap}-P{n:02d}-C{seg}-F{fiber:02d}','ownerType':'ap','ownerId':ap,'portNumber':n,'legacySegmentId':seg,'fiberNumber':fiber,'basis':['source_geometry','ordered_marker_alignment'],'sourceShapeIds':[str(ps['id']),str(match['id']),apbank['groupShapeId']],'alignmentDelta':delta})

 # Tsageri mirrored banks are deduplicated by logical port number. Their number
 # labels are transparent and are not treated as white Port graphics.
 def numbered_labels(group_id,limit):
  return {int(s['text'].strip()):s for s in children[group_id] if s.get('text','').strip().isdigit() and 1<=int(s['text'].strip())<=limit and .08<=abs(s['geometry']['height'])<=.11}
 internal=numbered_labels('43430',192);boundary=numbered_labels('43833',192);assert len(internal)==len(boundary)==192
 tsageri=[{'ownerType':'odf','ownerId':'ODF-TSAGERI-01','portNumber':n,'physicalUsage':'unknown','availability':'unknown','rawFill':None,'effectiveFill':None,'fillPattern':'0','sourceShapeIds':[str(internal[n]['id']),str(boundary[n]['id'])],'representations':['internal_odf_port','aggregation_boundary_port'],'companyLabel':None} for n in range(1,193)]
 # Lentekhi has a 48-position termination bank but no separate filled Port
 # graphic. Preserve local same-number binding and report usage as unknown.
 lent_bank=banks['184'][0];lent_labels={int(s['text'].strip()):s for s in children[lent_bank['groupShapeId']] if s.get('text','').strip().isdigit() and 1<=int(s['text'].strip())<=48 and .08<=abs(s['geometry']['height'])<=.11};assert len(lent_labels)==48
 lent=[]
 for n in range(1,49):
  marker=sorted(lent_bank['markers'],key=lambda x:gp(x)['x'])[n-1];lab=lent_labels[n]
  lent.append({'ownerType':'odf','ownerId':'ODF-LENTEKHI-01','portNumber':n,'physicalUsage':'unknown','availability':'unknown','rawFill':None,'effectiveFill':None,'fillPattern':'0','sourceShapeIds':[str(lab['id'])],'companyLabel':None})
  bindings.append({'id':f'PTB-LENTEKHI-P{n:02d}-C184-F{n:02d}','ownerType':'odf','ownerId':'ODF-LENTEKHI-01','portNumber':n,'legacySegmentId':'184','fiberNumber':n,'basis':['ordered_marker_alignment'],'sourceShapeIds':[str(lab['id']),str(marker['id']),lent_bank['groupShapeId']],'alignmentDelta':abs(gp(lab)['x']-gp(marker)['x'])})

 transition_doc={'schemaVersion':2,'ruleVersion':'tsageri-lentekhi-node-fiber-transition/2','source':{'file':raw['source']['file'],'sha256':SHA,'page':page['name'],'pageId':page['id'],'part':page['part'],'rawArtifact':'migration/iteration23/tsageri-lentekhi.fresh.raw.json.gz'},'inputPolicy':'fresh raw extraction only; owner confirmations excluded','banks':bank_records,'exactConnectorEdges':edges,'danglingConnectorEndpoints':dangling}
 dump('iteration23-fresh-transitions.json',transition_doc)
 dump('iteration23-physical-construction.json',{'schemaVersion':2,'sourceSha256':SHA,'source':{'file':raw['source']['file'],'page':page['name'],'pageId':page['id'],'part':page['part'],'rawArtifact':'migration/iteration23/tsageri-lentekhi.fresh.raw.json.gz'},'interpretationRule':'tsageri-lentekhi-marker-colors/3','conventionLayer':'iteration23-owner-confirmations.json#OWNER-MARKER-GRAMMAR','convention':'outer ring = Tube physical color; inner fill = Fiber physical color','ignoredStyle':'Connector and cable line color is never decoded as a physical Tube or Fiber color.','segments':physical_segments})
 dump('iteration23-port-occupancy.json',{'schemaVersion':1,'sourceSha256':SHA,'conventionLayer':'iteration23-owner-confirmations.json','counts':dict(collections.Counter(x['physicalUsage'] for x in ap_ports+tsageri+lent)),'ports':ap_ports+tsageri+lent})
 dump('iteration23-port-bindings.json',{'schemaVersion':1,'sourceSha256':SHA,'bindings':bindings})

 groups=collections.defaultdict(list)
 for e in edges:groups[(e['nodeId'],tuple(sorted((e['a']['legacySegmentId'],e['z']['legacySegmentId']))))].append(e)
 rec=[]
 for (node,pair),ee in sorted(groups.items()):
  left=pair[0];cap=next(x['capacity'] for x in labels if x['legacySegmentId']==left);mapped={e['a']['fiberNumber'] if e['a']['legacySegmentId']==left else e['z']['fiberNumber'] for e in ee};other={e['a']['fiberNumber'] if e['a']['legacySegmentId']==left else e['z']['fiberNumber'] for e in edges if e['nodeId']==node and left in (e['a']['legacySegmentId'],e['z']['legacySegmentId']) and tuple(sorted((e['a']['legacySegmentId'],e['z']['legacySegmentId'])))!=pair};unresolved=cap-len(mapped|other)
  rec.append({'nodeId':node,'leftLegacySegmentId':left,'rightLegacySegmentId':pair[1],'capacity':cap,'exact':len(ee),'intentionalTerminations':0,'unresolved':unresolved,'otherRelationship':len(other),'sourceConflicts':0,'reconciled':len(mapped)+len(other)+unresolved==cap,'numberChanges':sum(e['a']['fiberNumber']!=e['z']['fiberNumber'] for e in ee),'tubeChanges':sum(e['a']['tubeNumber']!=e['z']['tubeNumber'] or e['a']['tubeColorKey']!=e['z']['tubeColorKey'] for e in ee),'fiberColorChanges':sum(e['a']['fiberColorKey']!=e['z']['fiberColorKey'] for e in ee),'basisCounts':dict(collections.Counter('+'.join(e['basis']) for e in ee))})
 dump('iteration23-connection-reconciliation.json',{'schemaVersion':1,'sourceSha256':SHA,'relationships':rec})

 def shape_anchor(sid):
  s=by[sid];return {'shapeId':sid,'parentId':s.get('parent_id'),'depth':s['depth'],'text':s.get('text',''),'geometry':s['geometry'],'effectiveStyle':s['effective_style'],'masterId':s.get('master_id'),'masterShapeId':s.get('master_shape_id')}
 closure_ids=sorted({x.replace('SC','') for v in ENDPOINTS.values() for x in v if x.startswith('SC') and x[2:].isdigit()},key=int)
 asset_evidence={'closures':[{'id':x,'cableLabelShapeIds':sorted(y['shapeId'] for y in labels if x in (y['fromToken'],y['toToken']))} for x in closure_ids],'accessPoints':sorted(ap_evidence,key=lambda x:int(x['id'])),'aggregations':[{'id':'5','cableLabelShapeIds':[next(x['shapeId'] for x in labels if x['legacySegmentId']=='148')]},{'id':'AGG-LENTEKHI','cableLabelShapeIds':[next(x['shapeId'] for x in labels if x['legacySegmentId']=='184')]}]}
 summary={'schemaVersion':1,'source':raw['source'],'page':{'id':page['id'],'name':page['name'],'part':page['part'],'pageSheet':page['page_sheet'],'relationships':page['relationships']},'rawCounts':raw['summary'],'freshCounts':{'cables':len(labels),'cableBanks':sum(len(x) for x in banks.values()),'fiberMarkers':len(marker_index),'physicalConstructionFibers':sum(len(x['records']) for x in physical_segments),'physicalConstructionTubes':sum(x['tubeCount'] for x in physical_segments),'groupShapes':sum(s.get('attributes',{}).get('Type')=='Group' for s in shapes),'portLikeNumericShapes':sum(s.get('text','').strip().isdigit() and s.get('parent_id') is None and .20<=abs(s['geometry']['height'])<=.25 for s in shapes),'circularMarkerShapes':sum(is_marker(s) for s in shapes),'connectionLineShapes':sum(bool(endpoint(s,'begin') and endpoint(s,'end')) for s in shapes),'exactTransitions':len(edges),'portBindings':len(bindings),'portOccupancyRecords':len(ap_ports)+len(tsageri)+len(lent)},'inventory':{'cables':sorted(labels,key=lambda x:int(x['legacySegmentId'])),'closures':closure_ids,'accessPoints':sorted(AP_CABLE,key=int),'aggregations':['5','AGG-LENTEKHI'],'assetEvidence':asset_evidence},'rawAnchors':{'segmentLabelC172':shape_anchor('15983'),'greenAp41Port1':shape_anchor('12484'),'whiteAp41Port4':shape_anchor('12487'),'nestedGroup':shape_anchor('43430'),'masterInheritedStyle':shape_anchor('12428'),'c172Fiber29Marker':shape_anchor('34674'),'connectRow':next(row for row in page['connects'] if row.get('FromSheet')=='44243')},'generation':{'deterministic':True,'rawArtifactSha256':hashlib.sha256(RAW.read_bytes()).hexdigest(),'oldFixtureInput':False}}
 dump('iteration23-fresh-summary.json',summary)

 if not compare:return

 # Isolated comparison phase begins here; archived data cannot influence outputs above.
 old=json.load(open(ROOT/'migration/archive/iteration22/src__data__iteration21-routing-evidence.json',encoding='utf-8'));oldmap={canon(e):e for e in old['exactConnectorEdges']};newmap={canon(e):e for e in edges};same=sorted(set(oldmap)&set(newmap));missing=sorted(set(oldmap)-set(newmap));new=sorted(set(newmap)-set(oldmap))
 diff={'schemaVersion':1,'oldSource':'iteration22 archived generated projection','freshSourceSha256':SHA,'counts':{'old':len(oldmap),'fresh':len(newmap),'reproducedExactly':len(same),'notFoundInFreshSource':len(missing),'newlyDiscovered':len(new),'changed':0},'notFoundInFreshSource':[oldmap[k] for k in missing],'newlyDiscovered':[newmap[k] for k in new],'changed':[]}
 dump('iteration23-transition-diff.json',diff)
 print(json.dumps({'transitions':len(edges),'bindings':len(bindings),'occupancy':len(ap_ports)+len(tsageri)+len(lent),'diff':diff['counts']},indent=2))
if __name__=='__main__':main()
