#!/usr/bin/env python3
"""Focused unit/regression suite for VSDX package and resolver layers."""
from __future__ import annotations
import gzip, hashlib, importlib.util, json, math, subprocess, sys, tempfile, unittest, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('extract_vsdx',ROOT/'scripts/extract-vsdx.py');extractor=importlib.util.module_from_spec(spec);spec.loader.exec_module(extractor)
geometry_spec=importlib.util.spec_from_file_location('marker_geometry',ROOT/'scripts/marker_geometry.py');marker_geometry=importlib.util.module_from_spec(geometry_spec);geometry_spec.loader.exec_module(marker_geometry)
inventory_spec=importlib.util.spec_from_file_location('stage_inventory',ROOT/'scripts/stage-vsdx-inventory.py');inventory=importlib.util.module_from_spec(inventory_spec);inventory_spec.loader.exec_module(inventory)
stream_geometry_spec=importlib.util.spec_from_file_location('stream_geometry',ROOT/'scripts/extract-vsdx-geometry-stream.py');stream_geometry=importlib.util.module_from_spec(stream_geometry_spec);stream_geometry_spec.loader.exec_module(stream_geometry)
shida_spec=importlib.util.spec_from_file_location('shida_audit',ROOT/'scripts/audit-iteration33-shida.py');shida_audit=importlib.util.module_from_spec(shida_spec);shida_spec.loader.exec_module(shida_audit)
from shida_geometry import marker_docking_evidence, port_docking_evidence, inward_endpoint_rays, CONFIRMATION

class ShidaDraftingGapTests(unittest.TestCase):
 def port(self):
  return {'points':[['MoveTo',97.337,513.9233412824975],['LineTo',97.428,513.9233412824975],['LineTo',97.428,514.12],['LineTo',97.337,514.12],['LineTo',97.337,513.9233412824975]]}
 def test_ap16_port10_actual_small_gap_is_recovered(self):
  evidence=port_docking_evidence({'x':97.396,'y':513.9217787824974},self.port(),(0,-1),.09117)
  self.assertEqual(evidence['ownerConfirmationId'],CONFIRMATION)
  self.assertAlmostEqual(evidence['gap'],.0015625,7)
 def test_port_gap_does_not_join_large_sideways_or_wrong_direction_strokes(self):
  for point,ray in [({'x':97.396,'y':513.89},(0,-1)),({'x':97.396,'y':513.92177878},(0,1)),({'x':97.334,'y':514.02},(0,-1))]:
   self.assertIsNone(port_docking_evidence(point,self.port(),ray,.09117))
 def marker(self):
  return {'geometry':{'local_to_page':[1,0,0,1,96.53570473140297,512.7108504199244],'local_bounds':{'min_x':0,'min_y':0,'width':.05905511811023621,'height':.05905511811023622}}}
 def test_owner_confirmed_ap16_f01_lower_and_upper_strokes_are_recovered(self):
  for point,ray in [({'x':96.57468011811025,'y':512.7042710542378},(0,-1)),({'x':96.57544390463127,'y':512.7727391296622},(0,1))]:
   with self.subTest(point=point):
    self.assertFalse(marker_geometry.point_inside_marker_ellipse(point,self.marker()))
    evidence=marker_docking_evidence(point,self.marker(),ray,.09117)
    self.assertEqual(evidence['ownerConfirmationId'],CONFIRMATION)
    self.assertGreater(evidence['gap'],0);self.assertLessEqual(evidence['gap'],evidence['gapLimit'])
 def test_large_gap_and_wrong_stroke_direction_are_not_continuations(self):
  self.assertIsNone(marker_docking_evidence({'x':96.56523229045808,'y':512.64},self.marker(),(0,-1),.09117))
  self.assertIsNone(marker_docking_evidence({'x':96.57468011811025,'y':512.7042710542378},self.marker(),(0,1),.09117))
 def test_nearby_parallel_stroke_cannot_dock_sideways_to_a_marker(self):
  self.assertIsNone(marker_docking_evidence({'x':96.609,'y':512.7403779789796},self.marker(),(0,1),.09117))
 def test_missing_bank_spacing_keeps_an_outside_marker_unresolved(self):
  self.assertIsNone(marker_docking_evidence({'x':96.57468011811025,'y':512.7042710542378},self.marker(),(0,-1),None))
 def test_docking_direction_must_match_actual_drawn_path_endpoints(self):
  shape={'begin':{'x':0,'y':0},'end':{'x':0,'y':1},'points':[['MoveTo',.1,0],['LineTo',.1,1]]}
  self.assertEqual(inward_endpoint_rays(shape),(None,None))

class ShidaSourceAuditTests(unittest.TestCase):
 def capacity_fixture(self):
  shapes={};children={};banks={};rows=[]
  for name,y in [('a',0),('z',1)]:
   markers=[]
   for n in range(1,25):
    identity=name+str(n);markers.append({'fiber':n,'shapeId':identity,'numberShapeId':'N'+identity})
    shapes[('0',identity)]={'id':identity,'bounds':{'min_x':n*.1-.02,'max_x':n*.1+.02,'min_y':y-.02,'max_y':y+.02}}
   banks[('0',name)]={'capacity':24,'markers':markers}
   children[('0',name)]=[{'id':'FO'+name,'text':'FO 24','ellipse':False}]
  for n in range(1,25):rows.append({'shapeId':'L'+str(n),'a':{'fiber':n},'z':{'fiber':n}})
  label={'capacity':20,'point':{'x':1.2,'y':.5}}
  return shapes,children,banks,rows,label
 def test_complete_numbered_fo24_banks_and_twenty_four_drawn_lines_resolve_a_twenty_fiber_label(self):
  shapes,children,banks,rows,label=self.capacity_fixture()
  proof=shida_audit.span_capacity_evidence(shapes,children,banks,'0',('a','z'),rows,label)
  self.assertEqual(proof['declaredCapacity'],20);self.assertEqual(proof['resolvedCapacity'],24)
  self.assertEqual(len(proof['lineShapeIds']),24);self.assertEqual(len(proof['markerShapeIds']),48);self.assertEqual(proof['foShapeIds'],['FOa','FOz'])
  self.assertEqual(label['capacity'],20)
 def test_capacity_correction_requires_complete_unique_numbering_fo_text_and_actual_strokes(self):
  for defect in ['missing_line','duplicate_line','remapped_line','duplicate_number','missing_number','missing_fo','wrong_fo','duplicate_fo','unequal_banks','outside_label']:
   with self.subTest(defect=defect):
    shapes,children,banks,rows,label=self.capacity_fixture()
    if defect=='missing_line':rows.pop()
    elif defect=='duplicate_line':rows[-1]['shapeId']=rows[0]['shapeId']
    elif defect=='remapped_line':rows[-1]['z']['fiber']=1
    elif defect=='duplicate_number':banks[('0','a')]['markers'][-1]['fiber']=1
    elif defect=='missing_number':banks[('0','a')]['markers'].pop()
    elif defect=='missing_fo':children[('0','a')]=[]
    elif defect=='wrong_fo':children[('0','a')][0]['text']='FO 48'
    elif defect=='duplicate_fo':children[('0','a')].append({'id':'other','text':'FO 24'})
    elif defect=='unequal_banks':banks[('0','a')]['capacity']=20
    elif defect=='outside_label':label['point']['x']=5
    self.assertIsNone(shida_audit.span_capacity_evidence(shapes,children,banks,'0',('a','z'),rows,label))
 def test_owner_graph_resolves_only_a_unique_drawn_capacity_conflict_and_creates_no_route_edge(self):
  def graph(duplicate=False,drawn=True):
   shapes,children,banks,rows,label=self.capacity_fixture();matches=[];numbers={}
   for name,y,token in [('a',0,'25024'),('z',1,'20')]:
    owner='OWNER-'+name
    shapes[('0',owner)]={'id':owner,'parent':None,'page':'0','type':'Group','master':'2','text':'','points':[],'ellipse':False,'bounds':{'min_x':0,'max_x':3,'min_y':y-.05,'max_y':y+.05}}
    children[('0',owner)]=[{'text':token,'id':'TOKEN-'+name},{'text':'42° N 44° E','id':'COORD-'+name}]
    shapes[('0',name)]={'id':name,'parent':owner,'page':'0','type':'Group','text':'','points':[],'ellipse':False}
    for marker in banks[('0',name)]['markers']:
     s=shapes[('0',marker['shapeId'])];s.update({'page':'0','parent':name,'type':'Shape','text':'','points':[],'ellipse':True});children[('0',name)].append(s);numbers[('0',s['id'])]=marker
   for n,row in enumerate(rows,1):
    identity=row['shapeId'];shapes[('0',identity)]={'id':identity,'page':'0','parent':None,'type':'Shape','text':'','ellipse':False,'points':[['MoveTo',n*.1,0],['LineTo',n*.1,1]],'begin':{'x':n*.1,'y':0},'end':{'x':n*.1,'y':1}}
    matches.append({'shapeId':identity,'page':'0','aGroup':'a','zGroup':'z','beginMarkers':['a'+str(n)],'endMarkers':['z'+str(n)],'disposition':'two_unique_marker_attachments'})
   labels=[{**label,'shapeId':'LABEL','page':'0','fromToken':'25024','toToken':'20'}]
   if duplicate:labels.append({**labels[0],'shapeId':'OTHER-LABEL'})
   return shida_audit.owner_graph(shapes,children,banks,labels,matches if drawn else [],numbers),labels
  result,labels=graph();self.assertEqual(result['physicalBankPairs'][0]['status'],'source_endpoint_bank_pair');self.assertEqual(labels[0]['capacity'],24);self.assertEqual(labels[0]['declaredCapacity'],20);self.assertEqual(result['nodeTransitionCandidates'],[])
  result,labels=graph(duplicate=True);self.assertEqual(result['physicalBankPairs'][0]['status'],'unresolved_physical_label_association');self.assertTrue(all(l['capacity']==20 for l in labels))
  result,labels=graph(drawn=False);self.assertEqual(result['physicalBankPairs'],[]);self.assertEqual(labels[0]['capacity'],20)
 def test_rejected_port_connector_retains_missing_cable_association_without_creating_binding(self):
  def rectangle(identity,number,x):
   return {'id':identity,'page':'0','parent':None,'text':str(number),'ellipse':False,'props':{'State':{'Value':'თავისუფალი'}},'point':{'x':x,'y':1.1},'bounds':{'min_x':x-.04,'max_x':x+.04,'min_y':1,'max_y':1.2},'points':[['MoveTo',x-.04,1],['LineTo',x+.04,1],['LineTo',x+.04,1.2],['LineTo',x-.04,1.2],['LineTo',x-.04,1]],'fill':'#ffffff'}
  shapes={('0','p1'):rectangle('p1',1,.1),('0','p2'):rectangle('p2',2,.3),('0','marker'):{'id':'marker','parent':'bank','bounds':{'min_x':.08,'max_x':.12,'min_y':-.02,'max_y':.02}},('0','line'):{'begin':{'x':.1,'y':0},'end':{'x':.1,'y':1.1},'points':[['MoveTo',.1,0],['LineTo',.1,1.1]]}}
  for shape in shapes.values():shape.setdefault('page','0');shape.setdefault('text','');shape.setdefault('props',{});shape.setdefault('ellipse',False)
  graph={'physicalBankPairs':[],'nodeTransitionCandidates':[],'unresolvedLocalLinks':[],'nodes':[{'kind':'ap_triangle_capacity_symbol','shapeId':'ap','page':'0','token':'1','capacity':2,'bounds':{'min_x':-1,'max_x':1,'min_y':-1,'max_y':2}}]}
  match={'page':'0','shapeId':'line','disposition':'one_marker_attachment','beginMarkers':['marker'],'endMarkers':[],'beginAttachmentEvidence':[{'kind':'ellipse_containment'}],'endAttachmentEvidence':[]}
  result=shida_audit.ap_port_audit(shapes,graph,[match],{('0','marker'):{'fiber':1,'shapeId':'marker'}})
  port=next(p for p in result['ports'] if p['shapeId']=='p1')
  self.assertEqual(port['bindings'],[]);self.assertEqual(port['diagnostics'][0]['reason'],'bank_without_unique_cable_association');self.assertEqual(port['diagnostics'][0]['strokeShapeId'],'line')
 def markers(self):
  return [{'id':str(i),'point':{'x':i*.1,'y':0},'fill':'#0000ff','line':'#0000ff'} for i in (1,2)]
 def numbers(self,y=0.06):
  return [{'id':'N'+str(i)+str(y),'text':str(i),'point':{'x':i*.1,'y':y}} for i in (1,2)]
 def test_repeated_colors_do_not_replace_the_actual_printed_fiber_numbers(self):
  result,problem=shida_audit.number_bank(self.markers(),self.numbers())
  self.assertIsNone(problem);self.assertEqual([m['fiber'] for m in result],[1,2])
  result,problem=shida_audit.number_bank(self.markers(),[self.numbers()[0]])
  self.assertIsNone(result);self.assertIn('number_row',problem['reason'])
 def test_two_complete_number_rows_remain_ambiguous(self):
  result,problem=shida_audit.number_bank(self.markers(),self.numbers()+self.numbers(.5))
  self.assertIsNone(result);self.assertIn('ambiguous',problem['reason'])
 def test_ap_triangle_outline_is_separate_from_its_text_baseline(self):
  shape={'points':[['MoveTo',101.3116083520604,513.7763335082161],['LineTo',101.73884798183103,513.7763335082161],['LineTo',101.52522816694572,514.0967632305441],['LineTo',101.3116083520604,513.7763335082161],['MoveTo',101.37689812121188,513.7763335082161],['LineTo',101.67355821267955,513.7763335082161]]}
  self.assertEqual(len(shida_audit.polygon_vertices(shape)),3)
 def test_common_endpoint_labels_create_no_optical_edge_without_a_drawn_link(self):
  graph=shida_audit.owner_graph({}, {}, {}, [{'fromToken':'25017','toToken':'16'},{'fromToken':'25017','toToken':'17'}], [], {})
  self.assertEqual(graph['nodeTransitionCandidates'],[])
  self.assertEqual(graph['physicalBankPairs'],[])

class StagedInventoryTests(unittest.TestCase):
 def stage(self, page, max_shapes=100000):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);source=root/'source.vsdx';summary=root/'summary.json';index=root/'shapes.ndjson'
   with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('visio/pages/pages.xml','<Pages xmlns="'+inventory.NAMESPACE+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><Page ID="0" Name="Source"><Rel r:id="r1"/></Page></Pages>')
    archive.writestr('visio/pages/_rels/pages.xml.rels','<Relationships><Relationship Id="r1" Target="page1.xml"/></Relationships>')
    archive.writestr('visio/pages/page1.xml',page)
   result=inventory.stage(source,summary,index,max_shapes)
   return result,[json.loads(line) for line in index.read_text(encoding='utf-8').splitlines()]
 def page(self, shapes):
  return '<PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes>'+shapes+'</Shapes></PageContents>'
 def test_preserves_nested_shape_identity_and_mixed_text_without_optical_facts(self):
  result,rows=self.stage(self.page('<Shape ID="1"><Text>parent</Text><Shapes><Shape ID="2"><Text>170-216-50-24<cp IX="0"/>\nშავი</Text></Shape></Shapes></Shape>'))
  child=next(row['payload'] for row in rows if row['shape_id']=='2')
  self.assertEqual(child['parent_id'],'1');self.assertEqual(child['depth'],1)
  self.assertEqual(child['raw_text'],'170-216-50-24\nშავი')
  self.assertEqual(result['summary']['all_page_shapes_including_subshapes'],2)
  self.assertFalse(result['geometryDecoded']);self.assertFalse(result['topologyProjected'])
  self.assertNotIn('geometry',child);self.assertEqual(child['geometry_status'],'not_decoded')
 def test_duplicate_shape_id_is_rejected(self):
  with self.assertRaisesRegex(ValueError,'duplicate'):
   self.stage(self.page('<Shape ID="1"/><Shape ID="1"/>'))
 def test_configured_shape_limit_stops_inventory(self):
  with self.assertRaisesRegex(ValueError,'Shape limit'):
   self.stage(self.page('<Shape ID="1"/><Shape ID="2"/>'),max_shapes=1)
 def test_dtd_entity_source_is_rejected(self):
  with self.assertRaisesRegex(ValueError,'DTD/entity'):
   self.stage('<!DOCTYPE PageContents [<!ENTITY value "expanded">]>'+self.page('<Shape ID="1"><Text>&value;</Text></Shape>'))
 def test_excessive_nesting_is_rejected(self):
  with self.assertRaisesRegex(ValueError,'nesting'):
   self.stage(self.page('<Shapes>'*130+'</Shapes>'*130))
 def test_text_of_parent_is_not_taken_from_child(self):
  _,rows=self.stage(self.page('<Shape ID="1"><Shapes><Shape ID="2"><Text>child</Text></Shape></Shapes></Shape>'))
  self.assertEqual(next(row['payload']['text'] for row in rows if row['shape_id']=='1'),'')

class GeometryTests(unittest.TestCase):
 def assertPoint(self,p,x,y):
  self.assertAlmostEqual(p['x'],x,9);self.assertAlmostEqual(p['y'],y,9)
 def test_child_point_translation(self):
  self.assertPoint(extractor.pt(extractor.affine_matrix(10,20,2,3),2,3),10,20)
 def test_rotated_group(self):
  self.assertPoint(extractor.pt(extractor.affine_matrix(0,0,0,0,math.pi/2),2,1),-1,2)
 def test_scaled_group(self):
  self.assertPoint(extractor.pt(extractor.affine_matrix(0,0,0,0,0,False,False,2,3),2,1),4,3)
 def test_nested_group(self):
  outer=extractor.affine_matrix(10,10,0,0);inner=extractor.affine_matrix(5,2,0,0,math.pi/2)
  self.assertPoint(extractor.pt(extractor.mul(outer,inner),1,0),15,13)
 def test_flipped_shape(self):
  self.assertPoint(extractor.pt(extractor.affine_matrix(0,0,0,0,0,True,False),3,4),-3,4)
 def test_marker_ellipse_includes_boundary_but_not_outside(self):
  marker={'geometry':{'local_to_page':[1,0,0,1,1,1],'local_bounds':{'width':2.,'height':4.}}}
  self.assertTrue(marker_geometry.point_inside_marker_ellipse({'x':2.,'y':3.},marker))
  self.assertTrue(marker_geometry.point_inside_marker_ellipse({'x':3.,'y':3.},marker))
  self.assertFalse(marker_geometry.point_inside_marker_ellipse({'x':3.0001,'y':3.},marker))
 def test_marker_matcher_preserves_ambiguous_hits(self):
  point={'x':1.,'y':1.};marker={'geometry':{'local_to_page':[1,0,0,1,.5,.5],'local_bounds':{'width':1.,'height':1.}}}
  self.assertEqual(len(marker_geometry.matching_marker_shapes(point,[marker,marker.copy()])),2)
  self.assertEqual(marker_geometry.matching_marker_shapes({'x':5.,'y':5.},[marker]),[])
 def test_rotated_non_circular_ellipse_rejects_bbox_false_hit(self):
  marker={'geometry':{'local_to_page':extractor.affine_matrix(0,0,2,1,math.pi/4),'local_bounds':{'width':4.,'height':2.}}}
  self.assertFalse(marker_geometry.point_inside_marker_ellipse({'x':1.,'y':-1.},marker))
  self.assertTrue(marker_geometry.point_inside_marker_ellipse({'x':1.,'y':1.},marker))
 def test_integrated_containment_with_rotation_scale_nesting_and_flip(self):
  outer=extractor.affine_matrix(10,20,0,0,math.pi/4,False,True,2,3)
  inner=extractor.affine_matrix(5,2,0,0,math.pi/6,True,False,.5,2)
  matrix=extractor.mul(outer,inner)
  marker={'geometry':{'local_to_page':matrix,'local_bounds':{'width':4.,'height':2.}}}
  for local,expected in [((2,1),True),((4,1),True),((2,2.01),False),((4,2),False)]:
   with self.subTest(local=local):
    self.assertEqual(marker_geometry.point_inside_marker_ellipse(extractor.pt(matrix,*local),marker),expected)
 def test_unsupported_transform_is_not_reported_as_outside(self):
  for geometry in [{}, {'local_bounds':{'width':2,'height':1},'local_to_page':[1,0,0,0,0,0]}, {'local_bounds':{'width':2,'height':1,'min_x':float('nan')},'local_to_page':[1,0,0,1,0,0]}]:
   with self.assertRaises(marker_geometry.UnsupportedMarkerGeometry):
    marker_geometry.matching_marker_shapes({'x':1,'y':1},[{'geometry':geometry}])

class StreamGeometryTests(unittest.TestCase):
 def setUp(self):
  self.memory_monitor=stream_geometry.working_set_bytes
  stream_geometry.working_set_bytes=lambda:32*1024*1024
 def tearDown(self):
  stream_geometry.working_set_bytes=self.memory_monitor
 def source(self,page,catalog_sheet=''):
  directory=tempfile.TemporaryDirectory();root=Path(directory.name);source=root/'source.vsdx';output=root/'output'
  with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED) as archive:
   archive.writestr('[Content_Types].xml','<Types/>')
   archive.writestr('visio/document.xml','<Document/>')
   archive.writestr('visio/pages/pages.xml','<Pages xmlns="'+inventory.NAMESPACE+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><Page ID="0" Name="Source">'+catalog_sheet+'<Rel r:id="r1"/></Page></Pages>')
   archive.writestr('visio/pages/_rels/pages.xml.rels','<Relationships><Relationship Id="r1" Target="page1.xml"/></Relationships>')
   archive.writestr('visio/pages/page1.xml',page)
  return directory,source,output
 def test_streamed_shape_groups_preserve_subshape_geometry_and_connect_integrity(self):
  directory,source,output=self.source('<PageContents xmlns="'+inventory.NAMESPACE+'"><PageSheet><Cell N="PageWidth" V="10"/><Cell N="PageHeight" V="20"/></PageSheet><Shapes><Shape ID="1" Type="Group"><Cell N="PinX" V="10"/><Cell N="PinY" V="20"/><Cell N="Width" V="2"/><Cell N="Height" V="2"/><Cell N="LocPinX" V="1"/><Cell N="LocPinY" V="1"/><Shapes><Shape ID="2" Type="Shape"><Cell N="PinX" V="1"/><Cell N="PinY" V="1"/><Cell N="Width" V="0.2"/><Cell N="Height" V="0.2"/><Cell N="LocPinX" V="0.1"/><Cell N="LocPinY" V="0.1"/><Text>fiber</Text></Shape></Shapes></Shape></Shapes><Connect FromSheet="1" ToSheet="2" FromCell="BeginX" ToCell="PinX"/></PageContents>')
  try:
   result=stream_geometry.extract(source,output)
   with gzip.open(output/'shapes.ndjson.gz','rt',encoding='utf-8') as stream:rows=[json.loads(line) for line in stream]
   child=next(row['payload'] for row in rows if row['shape_id']=='2')
   self.assertEqual(len(rows),2)
   self.assertEqual(result['pages'][0]['dimensions']['width'],10)
   self.assertEqual(result['pages'][0]['dimensions']['height'],20)
   self.assertEqual(result['pages'][0]['page_sheet']['cells'][0]['N'],'PageWidth')
   self.assertEqual(result['summary']['shapes_including_subshapes'],2)
   self.assertEqual(result['summary']['top_level_shapes'],1)
   self.assertEqual(child['parent_id'],'1');self.assertEqual(child['depth'],1)
   self.assertAlmostEqual(child['geometry']['global_pin']['x'],10,9)
   self.assertAlmostEqual(child['geometry']['global_pin']['y'],20,9)
   self.assertEqual(result['summary']['connect_rows_valid'],1)
   with gzip.open(output/'connects.ndjson.gz','rt',encoding='utf-8') as stream:connect=json.loads(stream.readline())
   self.assertTrue(connect['valid'])
  finally:
   directory.cleanup()
 def test_stream_extractor_rejects_dtd_entities(self):
  directory,source,output=self.source('<!DOCTYPE PageContents [<!ENTITY value "expanded">]><PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes><Shape ID="1"><Text>&value;</Text></Shape></Shapes></PageContents>')
  try:
   with self.assertRaisesRegex(ValueError,'DTD/entity'):
    stream_geometry.extract(source,output)
  finally:
   directory.cleanup()
 def test_page_catalog_sheet_supplies_dimensions_when_page_content_has_no_sheet(self):
  directory,source,output=self.source('<PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes><Shape ID="1"/></Shapes></PageContents>','<PageSheet><Cell N="PageWidth" V="314"/><Cell N="PageHeight" V="575"/></PageSheet>')
  try:
   result=stream_geometry.extract(source,output)
   self.assertEqual(result['pages'][0]['dimensions']['width'],314)
   self.assertEqual(result['pages'][0]['dimensions']['height'],575)
  finally:
   directory.cleanup()
 def test_stream_extractor_rejects_duplicate_page_local_shape_ids(self):
  directory,source,output=self.source('<PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes><Shape ID="1"/><Shape ID="1"/></Shapes></PageContents>')
  try:
   with self.assertRaisesRegex(ValueError,'duplicate page-local'):
    stream_geometry.extract(source,output)
  finally:
   directory.cleanup()
 def test_stream_extractor_enforces_the_compressed_source_limit(self):
  directory,source,output=self.source('<PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes><Shape ID="1"/></Shapes></PageContents>')
  limit=stream_geometry.MAX_SOURCE_BYTES;stream_geometry.MAX_SOURCE_BYTES=1
  try:
   with self.assertRaisesRegex(ValueError,'20 MiB'):
    stream_geometry.extract(source,output)
  finally:
   stream_geometry.MAX_SOURCE_BYTES=limit;directory.cleanup()
 def test_stream_extractor_rejects_a_missing_shape_id(self):
  directory,source,output=self.source('<PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes><Shape/></Shapes></PageContents>')
  try:
   with self.assertRaisesRegex(ValueError,'missing page-local Shape ID'):
    stream_geometry.extract(source,output)
  finally:
   directory.cleanup()
 def test_stream_extractor_enforces_the_memory_limit(self):
  directory,source,output=self.source('<PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes><Shape ID="1"/></Shapes></PageContents>')
  original=stream_geometry.working_set_bytes
  stream_geometry.working_set_bytes=lambda:stream_geometry.MAX_MEMORY_BYTES+1
  try:
   with self.assertRaisesRegex(ValueError,'working-set limit'):
    stream_geometry.extract(source,output)
  finally:
   stream_geometry.working_set_bytes=original;directory.cleanup()
 def test_stream_extractor_records_dangling_connect_evidence_without_promoting_it(self):
  directory,source,output=self.source('<PageContents xmlns="'+inventory.NAMESPACE+'"><Shapes><Shape ID="1"/></Shapes><Connect FromSheet="1" ToSheet="404"/></PageContents>')
  try:
   result=stream_geometry.extract(source,output)
   with gzip.open(output/'connects.ndjson.gz','rt',encoding='utf-8') as stream:row=json.loads(stream.readline())
   self.assertEqual(result['summary']['connect_rows_valid'],0)
   self.assertEqual(result['summary']['connect_rows_dangling'],1)
   self.assertFalse(row['valid']);self.assertTrue(row['from_resolves']);self.assertFalse(row['to_resolves'])
  finally:
   directory.cleanup()

class SC217GeometryRegressionTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.audit=json.loads((ROOT/'docs/iteration28l-sc217-source-audit.json').read_text(encoding='utf8'))
  cls.corrections=json.loads((ROOT/'src/data/iteration28l-sc217-corrections.json').read_text(encoding='utf8'))
 def test_f10_f11_f12_source_connectors_have_unique_ellipse_hits(self):
  pairs=self.audit['resolvedPairs']
  self.assertEqual([(x['connectorShapeId'],x['a']['fiber'],x['z']['fiber']) for x in pairs], [('34070',10,10),('34071',11,11),('34072',12,12)])
  for pair in pairs:
   with self.subTest(shape=pair['connectorShapeId']):
    self.assertEqual(pair['endpointEllipseHits'],[1,1])
    self.assertEqual(pair['connectRows'],[])
 def test_geometry_recovers_f10_f12_missed_by_old_tolerance(self):
  by_id={x['connectorShapeId']:x for x in self.audit['resolvedPairs']}
  self.assertFalse(by_id['34070']['oldTolerancePass'])
  self.assertTrue(by_id['34071']['oldTolerancePass'])
  self.assertFalse(by_id['34072']['oldTolerancePass'])
 def test_scoped_corrections_are_only_f10_and_f12(self):
  self.assertEqual([x['connectorShapeId'] for x in self.corrections['corrections']],['34070','34072'])
  self.assertEqual(self.corrections['rule'],'SC217-unique-endpoint-inside-decoded-marker-ellipse/1')
 def test_generator_reproduces_actual_source_audit_without_evidence_changes(self):
  paths=[ROOT/'docs/iteration28l-sc217-source-audit.json',ROOT/'src/data/iteration28l-sc217-corrections.json']
  before=[hashlib.sha256(path.read_bytes()).hexdigest() for path in paths]
  result=subprocess.run([sys.executable,str(ROOT/'scripts/audit-iteration28l-sc217.py')],capture_output=True,text=True,cwd=ROOT)
  self.assertEqual(result.returncode,0,result.stderr)
  self.assertEqual(before,[hashlib.sha256(path.read_bytes()).hexdigest() for path in paths])

class SourceRegressionTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  with gzip.open(ROOT/'migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz','rt',encoding='utf8') as f:cls.raw=json.load(f)
  cls.page=cls.raw['pages'][0];cls.by={str(s['id']):s for s in cls.page['shapes']}
 def test_package_pages_relationships_masters(self):
  self.assertEqual(self.raw['summary']['pages'],1);self.assertEqual(self.raw['summary']['unique_masters'],22)
  self.assertTrue(self.page['relationships']);self.assertEqual(len(self.raw['package_parts']),41)
 def test_shape_hierarchy_and_exact_text(self):
  self.assertEqual(self.by['43430']['parent_id'],'43429');self.assertEqual(self.by['43430']['root_shape_id'],'43429')
  self.assertEqual(self.by['12484']['raw_text'],'1\n');self.assertEqual(self.by['15983']['text'],'172-217-218-48')
 def test_master_and_style_resolution(self):
  fill=self.by['12428']['effective_style']['FillForegnd'];self.assertEqual(fill['source_kind'],'master-shape');self.assertEqual(fill['rgb'],'#bfbfbf')
  self.assertEqual(self.by['12487']['effective_style']['FillForegnd']['rgb'],'#ffffff')
 def test_port_color_and_number_anchors(self):
  self.assertEqual(self.by['12484']['text'],'1');self.assertEqual(self.by['12484']['effective_style']['FillForegnd']['rgb'],'#92d050')
  self.assertEqual(self.by['12487']['text'],'4');self.assertEqual(self.by['12487']['effective_style']['FillForegnd']['rgb'],'#ffffff')
 def test_fiber_tube_marker_anchor(self):
  marker=self.by['34674'];self.assertEqual(marker['effective_style']['FillForegnd']['rgb'],'#808080');self.assertEqual(marker['effective_style']['LineColor']['rgb'],'#008000')
 def test_connect_integrity_and_known_row(self):
  self.assertEqual(self.raw['summary']['connect_rows_dangling'],0);self.assertTrue(any(r.get('FromSheet')=='44243' for r in self.page['connects']))
 def test_rotated_company_and_comment(self):
  self.assertAlmostEqual(self.by['37584']['geometry']['world_angle'],-math.pi/2,9);self.assertIn('Skytel',self.by['37584']['raw_text'])
  self.assertEqual(len(self.raw['comments']),1);self.assertIn('ქუროები',self.raw['comments'][0]['raw_text'])

if __name__=='__main__':unittest.main(verbosity=2)
