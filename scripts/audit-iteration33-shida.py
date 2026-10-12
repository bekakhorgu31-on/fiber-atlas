"""Source-specific engineering audit of the preserved Shida geometry stream.

This report creates no active network facts. Label/bank proximity remains a
candidate until actual drawn Fiber lines corroborate the association.
"""
from __future__ import annotations
import argparse
import gzip
import hashlib
import json
import math
import re
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from marker_geometry import point_inside_marker_ellipse, UnsupportedMarkerGeometry
from shida_geometry import marker_docking_evidence, port_docking_evidence, inward_endpoint_rays, first_linear_path, RULE, CONFIRMATION

ROOT = Path(__file__).resolve().parents[1]
LABEL = re.compile(r'^(\d+)-(\d+)-(\d+)-(\d+)-(20|24|48|72|96|144)$')
ATTACHED = {'two_unique_ellipse_attachments','two_unique_marker_attachments'}


def compact_index(path, check=None):
    shapes = {}
    with gzip.open(path, 'rt', encoding='utf-8') as stream:
        for line in stream:
            if len(shapes)>=100000:raise ValueError('Compact geometry Shape limit exceeded')
            if check and len(shapes)%1000==0:check()
            row = json.loads(line); s = row['payload']; g = s['geometry']
            props = {}
            for section in s['sections']:
                if section['attributes'].get('N') == 'Property':
                    for r in section['rows']:
                        cells = {c.get('N'): c.get('V') for c in r['cells']}
                        props[r['attributes'].get('N')] = cells
            points = [[r['attributes'].get('T'), r['world_point']['x'], r['world_point']['y']]
                      for section in g.get('world_geometry_sections', []) for r in section['rows'] if r.get('world_point')]
            key=(row['page_id'],s['id'])
            if key in shapes:raise ValueError('Duplicate page-local Shape in geometry index')
            shapes[key] = {
                'id': s['id'], 'page': row['page_id'], 'parent': s['parent_id'], 'type': s['attributes'].get('Type'),
                'master': s['master_id'], 'text': s['text'], 'point': g['global_pin'], 'bounds': g['world_bounds'],
                'begin': g.get('global_begin'), 'end': g.get('global_end'), 'points': points, 'props': props,
                'fill': s['effective_style'].get('FillForegnd', {}).get('rgb'),
                'line': s['effective_style'].get('LineColor', {}).get('rgb'),
                'pattern': s['effective_style'].get('LinePattern', {}).get('value'),
                'ellipse': any(r['attributes'].get('T') == 'EllipticalArcTo' for section in s['sections'] for r in section['rows']),
                'geometry': {k: g[k] for k in ('local_to_page', 'local_bounds')},
            }
    return shapes


def number_bank(markers, children):
    # Numbering is read from a complete, aligned source text row. Colors and
    # ordinal positions never stand in for a missing printed Fiber number.
    rows = []
    for item in sorted((s for s in children if s['text'].isdigit()), key=lambda s: s['point']['y']):
        if not rows or abs(item['point']['y'] - rows[-1][0]['point']['y']) > .012:
            rows.append([])
        rows[-1].append(item)
    count = len(markers)
    candidates = [row for row in rows if len(row) == count and sorted(int(s['text']) for s in row) == list(range(1, count+1))]
    if len(candidates) != 1:
        return None, {'reason': 'missing_or_ambiguous_complete_printed_number_row', 'rowCounts': [len(r) for r in rows]}
    numbers = candidates[0]; result = []
    pitch = statistics.median(b['point']['x'] - a['point']['x'] for a, b in zip(sorted(markers, key=lambda s:s['point']['x']), sorted(markers, key=lambda s:s['point']['x'])[1:]))
    tolerance = min(.035, pitch * .35)
    used = set()
    for marker in markers:
        hits = [n for n in numbers if abs(n['point']['x'] - marker['point']['x']) <= tolerance]
        if len(hits) != 1 or hits[0]['id'] in used:
            return None, {'reason': 'number_marker_alignment_not_one_to_one', 'marker': marker['id'], 'hits': [n['id'] for n in hits]}
        used.add(hits[0]['id']); result.append({'shapeId': marker['id'], 'numberShapeId': hits[0]['id'], 'fiber': int(hits[0]['text']), 'fill': marker['fill'], 'ring': marker['line']})
    return sorted(result, key=lambda m:m['fiber']), None


def polygon_vertices(shape):
    vertices=set()
    for kind,x,y in shape['points']:
        if kind in ('MoveTo','RelMoveTo') and vertices:
            break
        if kind in ('MoveTo','LineTo','RelMoveTo','RelLineTo'):
            vertices.add((round(x,8),round(y,8)))
    return vertices


def contains(outer, inner):
    return outer['min_x']<=inner['min_x'] and outer['max_x']>=inner['max_x'] and outer['min_y']<=inner['min_y'] and outer['max_y']>=inner['max_y']


def intersects(a,b):
    return a['min_x']<=b['max_x'] and a['max_x']>=b['min_x'] and a['min_y']<=b['max_y'] and a['max_y']>=b['min_y']


def span_capacity_evidence(shapes, children, banks, page, pair, rows, label):
    """A conflicting label cannot truncate two complete, explicitly FO-labelled banks.

    Endpoint ownership and actual marker-to-marker strokes have already been
    established by owner_graph. Port capacity, colors and proximity cannot supply
    the missing Fiber evidence here.
    """
    endpoints=[banks[(page,bank)] for bank in pair]
    capacity=endpoints[0]['capacity']
    if any(bank['capacity']!=capacity or not bank['markers'] or sorted(m['fiber'] for m in bank['markers'])!=list(range(1,capacity+1)) for bank in endpoints):return None
    if len(rows)!=capacity or len({r['shapeId'] for r in rows})!=capacity:return None
    if any(sorted(r[side]['fiber'] for r in rows)!=list(range(1,capacity+1)) for side in ('a','z')) or any(r['a']['fiber']!=r['z']['fiber'] for r in rows):return None
    fo=[]
    for bank in pair:
        texts=[s for s in children[(page,bank)] if re.fullmatch(r'FO\s*(\d+)',s['text'],re.I)]
        if len(texts)!=1 or int(re.fullmatch(r'FO\s*(\d+)',texts[0]['text'],re.I)[1])!=capacity:return None
        fo.append(texts[0]['id'])
    markers=[shapes[(page,m['shapeId'])] for bank in endpoints for m in bank['markers']]
    p=label['point']
    if not (min(m['bounds']['min_x'] for m in markers)<=p['x']<=max(m['bounds']['max_x'] for m in markers) and min(m['bounds']['min_y'] for m in markers)<=p['y']<=max(m['bounds']['max_y'] for m in markers)):return None
    return {'rule':'shida-complete-fo-banks-and-drawn-span/1','declaredCapacity':label['capacity'],'resolvedCapacity':capacity,'bankShapeIds':list(pair),'foShapeIds':fo,'lineShapeIds':[r['shapeId'] for r in rows],'markerShapeIds':[m['id'] for m in markers],'numberShapeIds':[m['numberShapeId'] for bank in endpoints for m in bank['markers']]}


def owner_graph(shapes, children, banks, labels, matches, marker_numbers):
    nodes=[]; unresolved_symbols=[]
    rectangles=[s for s in shapes.values() if s['parent'] is None and s['type']=='Shape' and not s['text'] and len(polygon_vertices(s))==4 and s['bounds']['width']>2 and s['bounds']['height']>.3]
    for key,shape in shapes.items():
        if shape['parent'] is not None or shape['type']!='Group':continue
        kids=children.get(key,[])
        if shape['master']=='2':
            numbers=[s for s in kids if s['text'].isdigit()]
            coords=[s for s in kids if '°' in s['text'] and re.search('[NS]',s['text']) and re.search('[EW]',s['text'])]
            if len(numbers)==1 and len(coords)==1:
                nodes.append({'kind':'closure_symbol','token':numbers[0]['text'],'shapeId':shape['id'],'page':shape['page'],'numberShapeId':numbers[0]['id'],'coordinateShapeId':coords[0]['id'],'coordinateText':coords[0]['text'],'bounds':shape['bounds'],'containerShapeId':shape['id']})
            else:unresolved_symbols.append({'shapeId':shape['id'],'reason':'closure_number_coordinate_group_incomplete'})
            continue
        triangles=[s for s in kids if s['text'].isdigit() and len(polygon_vertices(s))==3]
        capacities=[s for s in kids if s['text'].isdigit() and len(polygon_vertices(s))==4 and s['text']=='24']
        if len(triangles)==1 and len(capacities)==1:
            name_texts=[s['text'] for s in kids if re.search('[A-Za-zა-ჰ]',s['text']) and len(s['text'])<150]
            containers=([shape] if len(polygon_vertices(shape))==4 and shape['bounds']['width']>2 and shape['bounds']['height']>.3 else sorted((s for s in rectangles if s['page']==shape['page'] and contains(s['bounds'],shape['bounds'])),key=lambda s:s['bounds']['width']*s['bounds']['height']))
            if not containers:
                unresolved_symbols.append({'shapeId':shape['id'],'reason':'AP_triangle_capacity_group_without_unique_container'});continue
            container=containers[0]
            nodes.append({'kind':'ap_triangle_capacity_symbol','token':triangles[0]['text'],'shapeId':shape['id'],'page':shape['page'],'numberShapeId':triangles[0]['id'],'capacityShapeId':capacities[0]['id'],'capacity':24,'names':name_texts,'bounds':container['bounds'],'containerShapeId':container['id']})
    owners={}; marker_shapes={key:shape for key,shape in shapes.items() if shape['ellipse']}
    for key,bank in banks.items():
        dots=[s for s in children[key] if s['ellipse']]
        owners[key]=[{'token':n['token'],'kind':n['kind'],'symbolShapeId':n['shapeId'],'containerShapeId':n['containerShapeId']}
                     for n in nodes if n['page']==key[0] and all(intersects(n['bounds'],dot['bounds']) for dot in dots)]
        bank['nodeOwners']=owners[key]
    bridges=defaultdict(list); local=[]; classified=Counter()
    for match in matches:
        if match['disposition'] not in ATTACHED:continue
        ak=(match['page'],match.get('aGroup'));zk=(match['page'],match.get('zGroup'))
        ao=owners.get(ak,[]);zo=owners.get(zk,[])
        an=marker_numbers.get((match['page'],match['beginMarkers'][0]));zn=marker_numbers.get((match['page'],match['endMarkers'][0]))
        if len(ao)!=1 or len(zo)!=1 or an is None or zn is None:
            classified['unresolved_bank_number_or_node_owner']+=1;continue
        stroke=shapes[(match['page'],match['shapeId'])]
        row={'shapeId':match['shapeId'],'page':match['page'],'begin':stroke['begin'],'end':stroke['end'],'path':first_linear_path(stroke),'a':{'bankShapeId':ak[1],**an},'z':{'bankShapeId':zk[1],**zn},'aOwner':ao[0],'zOwner':zo[0],
             'attachmentEvidence':{'begin':match.get('beginAttachmentEvidence',[]),'end':match.get('endAttachmentEvidence',[])},'endpointSource':match.get('endpointSource','1D_cells')}
        if ao[0]['token']==zo[0]['token'] and ao[0]['symbolShapeId']==zo[0]['symbolShapeId']:
            classified['same_node_drawn_link']+=1;local.append(row)
        else:
            classified['different_node_physical_depiction']+=1;bridges[(match['page'],tuple(sorted((ak[1],zk[1]))))].append(row)
    physical=[]; bank_labels=defaultdict(set); capacity_claims=defaultdict(list)
    for (page,pair),rows in bridges.items():
        tokens={rows[0]['aOwner']['token'],rows[0]['zOwner']['token']}
        capacities={banks[(page,pair[0])]['capacity'],banks[(page,pair[1])]['capacity']}
        candidates=[l for l in labels if l['page']==page and {l['fromToken'],l['toToken']}==tokens and capacities=={l['capacity']}]
        remaps=[r['shapeId'] for r in rows if r['a']['fiber']!=r['z']['fiber']]
        status='source_endpoint_bank_pair' if len(candidates)==1 and not remaps else 'unresolved_physical_label_association'
        entry={'page':page,'banks':list(pair),'nodeTokens':sorted(tokens),'lineCount':len(rows),'lineShapeIds':[r['shapeId'] for r in rows],'labelShapeIds':[l['shapeId'] for l in candidates],'status':status,'unexpectedInternalRemaps':remaps}
        physical.append(entry)
        if status=='source_endpoint_bank_pair':
            for bank in pair:bank_labels[(page,bank)].add(candidates[0]['shapeId'])
        elif not candidates and not remaps:
            # Only a uniquely identified, fully drawn span can resolve a label
            # contradiction. Collect claims before choosing, so two depictions
            # cannot silently claim the same label.
            proven=[]
            for label in labels:
                if label['page']!=page or {label['fromToken'],label['toToken']}!=tokens:continue
                evidence=span_capacity_evidence(shapes,children,banks,page,pair,rows,label)
                if evidence:proven.append((label,evidence))
            if len(proven)==1:capacity_claims[(page,proven[0][0]['shapeId'])].append((entry,*proven[0]))
    for claims in capacity_claims.values():
        if len(claims)!=1:continue
        entry,label,evidence=claims[0]
        if any(label['shapeId'] in p['labelShapeIds'] for p in physical):continue
        label['declaredCapacity']=label['capacity'];label['capacity']=evidence['resolvedCapacity'];label['capacityEvidence']=evidence
        entry.update({'status':'source_endpoint_bank_pair','labelShapeIds':[label['shapeId']],'capacityEvidence':evidence})
        for bank in entry['banks']:bank_labels[(entry['page'],bank)].add(label['shapeId'])
    transitions=[]; unresolved_local=[]
    for row in local:
        al=bank_labels.get((row['page'],row['a']['bankShapeId']),set());zl=bank_labels.get((row['page'],row['z']['bankShapeId']),set())
        if len(al)!=1 or len(zl)!=1 or al==zl:
            unresolved_local.append({**row,'reason':'local_bank_has_no_unique_source_cable_association'});continue
        row['a']['labelShapeId']=next(iter(al));row['z']['labelShapeId']=next(iter(zl));row['nodeToken']=row['aOwner']['token'];row['status']='source_audit_candidate'
        transitions.append(row)
    return {'nodes':nodes,'unresolvedSymbols':unresolved_symbols,'bankOwnershipCounts':dict(Counter(len(v) for v in owners.values())),
            'lineCounts':dict(classified),'physicalBankPairs':physical,'nodeTransitionCandidates':transitions,'unresolvedLocalLinks':unresolved_local,
            'counts':{'closureSymbols':sum(n['kind']=='closure_symbol' for n in nodes),'apSymbols':sum(n['kind']=='ap_triangle_capacity_symbol' for n in nodes),'supportedLabelBankPairs':sum(p['status']=='source_endpoint_bank_pair' for p in physical),'localTransitionCandidates':len(transitions),'unresolvedLocalLinks':len(unresolved_local)}}


def ap_port_audit(shapes, graph, matches, marker_numbers):
    ports=[]; review=[]; bank_labels=defaultdict(set); bank_owners={}
    for pair in graph['physicalBankPairs']:
        if pair['status']=='source_endpoint_bank_pair':
            for bank in pair['banks']:bank_labels[(pair['page'],bank)].add(pair['labelShapeIds'][0])
    for edge in graph['nodeTransitionCandidates']+graph['unresolvedLocalLinks']:
        for side,owner in [('a','aOwner'),('z','zOwner')]:bank_owners[(edge['page'],edge[side]['bankShapeId'])]=edge[owner]
    # A bank used only at an AP can be absent from local node links, so retain
    # its owner directly from the physical-span evidence's source container.
    for node in graph['nodes']:
        if node['kind']!='ap_triangle_capacity_symbol':continue
        b=node['bounds'];candidates=[s for s in shapes.values() if s['page']==node['page'] and s['text'].isdigit() and 'State' in s['props'] and not s['ellipse'] and len(polygon_vertices(s))==4 and b['min_x']<=s['point']['x']<=b['max_x'] and b['min_y']<=s['point']['y']<=b['max_y']]
        complete=len(candidates)==node['capacity'] and sorted(int(s['text']) for s in candidates)==list(range(1,node['capacity']+1))
        ordered=sorted(candidates,key=lambda s:s['point']['x'])
        pitch=statistics.median(math.hypot(a['point']['x']-b['point']['x'],a['point']['y']-b['point']['y']) for a,b in zip(ordered,ordered[1:])) if len(ordered)>1 else None
        if not complete:review.append({'nodeSymbolShapeId':node['shapeId'],'reason':'AP_printed_port_bank_incomplete_or_ambiguous','shapeIds':[s['id'] for s in candidates]})
        for shape in candidates:
            ports.append({'nodeSymbolShapeId':node['shapeId'],'page':node['page'],'apToken':node['token'],'number':int(shape['text']),'shapeId':shape['id'],'point':shape['point'],'bounds':shape['bounds'],'sourceState':shape['props']['State'].get('Value'),'sourceFill':shape['fill'],'completePortBank':complete,'portPitch':pitch,'bindings':[],'diagnostics':[]})
    by_page=defaultdict(list)
    for port in ports:
        if port['completePortBank']:by_page[port['page']].append(port)
    proposals=defaultdict(list)
    for match in matches:
        if match['disposition']!='one_marker_attachment':continue
        beginning=bool(match['beginMarkers']);ids=match['beginMarkers'] if beginning else match['endMarkers']
        marker=shapes[(match['page'],ids[0])];number=marker_numbers.get((match['page'],ids[0]));labels=bank_labels.get((match['page'],marker['parent']),set())
        line=shapes[(match['page'],match['shapeId'])];point=line['end'] if beginning else line['begin']
        if point is None:
            path=first_linear_path(line)
            if len(path)<2:continue
            xy=path[-1] if beginning else path[0];point={'x':xy[0],'y':xy[1]}
        rays=inward_endpoint_rays(line)
        hits=[]
        for candidate in by_page[match['page']]:
            dock=port_docking_evidence(point,shapes[(candidate['page'],candidate['shapeId'])],rays[1] if beginning else rays[0],candidate['portPitch'])
            if dock:hits.append((candidate,dock))
        if len(hits)!=1:
            for p,dock in hits:p['diagnostics'].append({'strokeShapeId':match['shapeId'],'markerShapeId':marker['id'],'bankShapeId':marker['parent'],'reason':'ambiguous_port_docking','docking':dock,'status':'rejected_not_an_optical_mapping'})
            continue
        port,port_evidence=hits[0];node=next(n for n in graph['nodes'] if n['shapeId']==port['nodeSymbolShapeId'] and n['page']==port['page'])
        if number is None or len(labels)!=1:
            port['diagnostics'].append({'strokeShapeId':match['shapeId'],'markerShapeId':marker['id'],'bankShapeId':marker['parent'],'labelShapeIds':sorted(labels),'reason':'printed_marker_number_not_established' if number is None else 'bank_without_unique_cable_association','docking':port_evidence,'status':'rejected_not_an_optical_mapping'})
            continue
        # The marker bank must be on this AP's own body edge. A Port hit in a
        # different node is not permission to teleport between optical branches.
        if not intersects(node['bounds'],marker['bounds']):
            port['diagnostics'].append({'strokeShapeId':match['shapeId'],'markerShapeId':marker['id'],'bankShapeId':marker['parent'],'reason':'marker_outside_owning_ap_body','docking':port_evidence,'status':'rejected_not_an_optical_mapping'})
            continue
        key=(port['page'],port['shapeId']);proposals[key].append({'connectorShapeId':match['shapeId'],'labelShapeId':next(iter(labels)),'bankShapeId':marker['parent'],**number,
             'markerAttachment':(match['beginAttachmentEvidence'] if beginning else match['endAttachmentEvidence'])[0],'portAttachment':port_evidence})
    binding_count=0
    for port in ports:
        links=proposals.get((port['page'],port['shapeId']),[]);distinct={(x['labelShapeId'],x['fiber']) for x in links}
        if len(distinct)==1:port['bindings']=links;binding_count+=1
        elif distinct:
            review.append({'portShapeId':port['shapeId'],'reason':'multiple_distinct_Fibers_drawn_to_one_Port','candidates':links})
            port['diagnostics'].append({'reason':'multiple_distinct_fibers_drawn_to_one_port','candidates':links,'status':'rejected_not_an_optical_mapping'})
    return {'ports':ports,'review':review,'counts':{'ports':len(ports),'completeAPBanks':sum(1 for n in graph['nodes'] if n['kind']=='ap_triangle_capacity_symbol' and any(p['nodeSymbolShapeId']==n['shapeId'] and p['completePortBank'] for p in ports)),'boundPorts':binding_count,'unboundPorts':len(ports)-binding_count}}


def audit(shapes, metadata, gap_aware=False):
    children = defaultdict(list); ellipses = []; labels = []; lines = []; masters = Counter()
    for key, shape in shapes.items():
        if shape['parent'] is not None: children[(shape['page'], shape['parent'])].append(shape)
        if shape['ellipse']: ellipses.append(shape)
        if shape['begin'] is not None and shape['end'] is not None: lines.append(shape)
        if shape['parent'] is None and shape['master']: masters[shape['master']] += 1
        match = LABEL.fullmatch(shape['text'])
        if match: labels.append({'shapeId': shape['id'], 'page': shape['page'], 'text': shape['text'], 'constructionReference': '-'.join(match.groups()[:2]), 'fromToken': match[3], 'toToken': match[4], 'capacity': int(match[5]), 'point': shape['point']})
    banks = {}
    for key, kids in children.items():
        markers = [s for s in kids if s['ellipse']]
        if len(markers) not in (20,24,48,72,96,144): continue
        numbers, problem = number_bank(markers, kids)
        banks[key] = {'groupShapeId': key[1], 'page': key[0], 'capacity': len(markers), 'point': shapes[key]['point'], 'markers': numbers, 'numberingProblem': problem}

    cell_line_count=len(lines)
    if gap_aware:
        for shape in shapes.values():
            if shape['begin'] is not None or shape['end'] is not None or shape['type']!='Shape' or shape['ellipse'] or shape['text'] or shape['parent'] is not None:continue
            path=first_linear_path(shape)
            if len(path)>1 and path[0]!=path[-1]:
                lines.append({**shape,'begin':{'x':path[0][0],'y':path[0][1]},'end':{'x':path[-1][0],'y':path[-1][1]},'endpointSource':'geometry_path'})
    marker_pitches={}
    for key,bank in banks.items():
        numbered=bank['markers']
        if not numbered or len(numbered)<2:continue
        points=[shapes[(key[0],m['shapeId'])]['point'] for m in numbered]
        pitch=statistics.median(math.hypot(a['x']-b['x'],a['y']-b['y']) for a,b in zip(points,points[1:]))
        for marker in numbered:marker_pitches[(key[0],marker['shapeId'])]=pitch

    grid = defaultdict(list)
    for shape in ellipses:
        p = shape['point']; grid[(shape['page'], math.floor(p['x']/.1), math.floor(p['y']/.1))].append(shape)
    def hits(page, point, ray=None):
        result = []; unsupported = []; evidence=[]
        for x in range(math.floor(point['x']/.1)-1, math.floor(point['x']/.1)+2):
            for y in range(math.floor(point['y']/.1)-1, math.floor(point['y']/.1)+2):
                for marker in grid.get((page,x,y), []):
                    try:
                        dock=marker_docking_evidence(point,marker,ray,marker_pitches.get((page,marker['id']))) if gap_aware else ({'kind':'ellipse_containment','gap':0} if point_inside_marker_ellipse(point,marker) else None)
                        if dock:
                            result.append(marker);evidence.append({'markerShapeId':marker['id'],**dock})
                    except UnsupportedMarkerGeometry: unsupported.append(marker['id'])
        return result, unsupported, evidence

    matches = []; dispositions = Counter(); pair_lines = defaultdict(list)
    for line in lines:
        rays=inward_endpoint_rays(line) if gap_aware else (None,None)
        begin, bu, be = hits(line['page'],line['begin'],rays[0]); end, eu, ee = hits(line['page'],line['end'],rays[1])
        if bu or eu: disposition='unsupported_nearby_marker_geometry'
        elif len(begin)>1 or len(end)>1: disposition='ambiguous_marker_attachment'
        elif not begin and not end: disposition='no_marker_attachment'
        elif not begin or not end: disposition='one_marker_attachment'
        elif begin[0]['id']==end[0]['id']: disposition='same_marker_drawing'
        else: disposition='two_unique_marker_attachments' if gap_aware else 'two_unique_ellipse_attachments'
        dispositions[disposition]+=1
        row={'shapeId':line['id'],'page':line['page'],'master':line['master'],'lineColor':line['line'],'linePattern':line['pattern'],'disposition':disposition,'beginMarkers':[s['id'] for s in begin],'endMarkers':[s['id'] for s in end],'unsupportedMarkers':bu+eu,
             'beginAttachmentEvidence':be,'endAttachmentEvidence':ee,'endpointSource':line.get('endpointSource','1D_cells')}
        if disposition in ATTACHED:
            a,z=begin[0],end[0];row.update({'aGroup':a['parent'],'zGroup':z['parent']})
            if a['parent'] and z['parent']: pair_lines[(line['page'],tuple(sorted((a['parent'],z['parent']))))].append(row)
        matches.append(row)

    bank_labels=defaultdict(list)
    for label in labels:
        candidates=[]
        for key,bank in banks.items():
            dx=abs(bank['point']['x']-label['point']['x']);dy=bank['point']['y']-label['point']['y']
            if bank['page']==label['page'] and bank['capacity']==label['capacity'] and dx<=3.2 and abs(dy)<=7:
                candidates.append({'bank':key[1],'dx':dx,'dy':dy})
        selected=[]
        for sign in (-1,1):
            side=sorted((c for c in candidates if c['dy']*sign>0),key=lambda c:abs(c['dy']))
            if side: selected.append(side[0]['bank'])
        label['candidateBanks']=selected
        label['bankCandidates']=candidates
        label['internalDrawnLinks']=len(pair_lines.get((label['page'],tuple(sorted(selected))),[])) if len(selected)==2 else 0
        label['associationStatus']='candidate_proximity_only' if not label['internalDrawnLinks'] else 'drawn_links_corroborate_bank_pair'
        for bank in selected:bank_labels[(label['page'],bank)].append(label)

    marker_numbers={}
    for key,bank in banks.items():
        for m in bank['markers'] or []:marker_numbers[(key[0],m['shapeId'])]=m
    node_edges=[]; internal_edges=[]; edge_issues=[]
    for match in matches:
        if match['disposition'] not in ATTACHED:continue
        ak=(match['page'],match.get('aGroup'));zk=(match['page'],match.get('zGroup'))
        als=bank_labels.get(ak,[]);zls=bank_labels.get(zk,[])
        if len(als)!=1 or len(zls)!=1:
            match['semanticDisposition']='bank_label_association_unresolved';continue
        a,z=als[0],zls[0]
        an=marker_numbers.get((match['page'],match['beginMarkers'][0]));zn=marker_numbers.get((match['page'],match['endMarkers'][0]))
        if an is None or zn is None:
            match['semanticDisposition']='printed_fiber_number_unresolved';continue
        edge={'shapeId':match['shapeId'],'page':match['page'],'a':{'labelShapeId':a['shapeId'],'bankShapeId':ak[1],**an},'z':{'labelShapeId':z['shapeId'],'bankShapeId':zk[1],**zn}}
        if a['shapeId']==z['shapeId']:
            match['semanticDisposition']='segment_internal_depiction'; internal_edges.append(edge);continue
        shared=set((a['fromToken'],a['toToken']))&set((z['fromToken'],z['toToken']))
        if len(shared)!=1:
            match['semanticDisposition']='no_unique_shared_declared_endpoint';edge_issues.append(edge);continue
        edge['nodeToken']=next(iter(shared));edge['status']='source_audit_candidate'
        match['semanticDisposition']='candidate_node_local_fiber_transition';node_edges.append(edge)

    symbols=[]
    for key,shape in shapes.items():
        if shape['parent'] is not None or shape['type']!='Group':continue
        kids=children[key]; numeric=[s for s in kids if s['text'].isdigit()]; named=[s for s in kids if re.search('[ა-ჰ]',s['text'])]
        coordinates=[s for s in kids if re.search(r'\d+\s*°.*[NS].*[EW]',s['text'])]
        if shape['master']=='2':symbols.append({'kind':'grey_number_coordinate_symbol','shapeId':shape['id'],'numberTexts':[s['text'] for s in numeric],'numberShapeIds':[s['id'] for s in numeric],'coordinates':[s['text'] for s in coordinates],'point':shape['point']})
        elif numeric and named:symbols.append({'kind':'named_numbered_group','shapeId':shape['id'],'numberTexts':[s['text'] for s in numeric],'nameTexts':[s['text'] for s in named],'point':shape['point']})
    counts={'sourceShapes':len(shapes),'labelOccurrences':len(labels),'markerBanks':len(banks),'numberedBanks':sum(b['markers'] is not None for b in banks.values()),'ellipseShapes':len(ellipses),'linesWithBeginEnd':cell_line_count,'linesAudited':len(lines),'lineDisposition':dict(dispositions),'candidateNodeTransitions':len(node_edges),'internalFiberLines':len(internal_edges),'declaredEndpointMismatchLines':len(edge_issues),'labelAssociation':dict(Counter(l['associationStatus'] for l in labels)),'directTopLevelMasterReferences':dict(masters),
            'gapRecoveredEndpoints':sum(e['kind']=='owner_confirmed_drafting_gap' for row in matches for e in row['beginAttachmentEvidence']+row['endAttachmentEvidence'])}
    geometry_only=[]
    for shape in shapes.values():
        if shape['begin'] is not None or shape['type']!='Shape' or shape['ellipse'] or shape['text'] or shape['parent'] is not None:continue
        path=[]
        for kind,x,y in shape['points']:
            if kind in ('MoveTo','RelMoveTo') and path:break
            if kind in ('MoveTo','LineTo','RelMoveTo','RelLineTo'):path.append([x,y])
        if len(path)>1 and path[0]!=path[-1]:geometry_only.append({'shapeId':shape['id'],'page':shape['page'],'points':path,'disposition':'open_geometry_without_1D_endpoint_cells_requires_separate_source_grammar'})
    counts['openGeometryWithoutEndpointCells']=len(geometry_only)
    graph=owner_graph(shapes,children,banks,labels,matches,marker_numbers)
    port_audit=ap_port_audit(shapes,graph,matches,marker_numbers) if gap_aware else None
    counts['nodeContainerAudit']=graph['counts'];counts['bankOwnershipCounts']=graph['bankOwnershipCounts']
    if port_audit:counts['apPorts']=port_audit['counts']
    return {'format':'shida-source-routing-audit/2','sourceSha256':metadata['source']['sha256'],'interpretationMode':'gap_aware' if gap_aware else 'strict_baseline','gapRule':{'id':RULE,'ownerConfirmationId':CONFIRMATION} if gap_aware else None,'counts':counts,'labels':labels,'banks':list(banks.values()),'nodeTransitionCandidates':node_edges,'internalFiberDepictions':internal_edges,'declaredEndpointMismatchLines':edge_issues,'symbols':symbols,'lineLedger':matches,'geometryOnlyPaths':geometry_only,'nodeContainerAudit':graph,'apPortAudit':port_audit}


def main():
    if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8')
    parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path,default=ROOT/'tmp/iteration33-shida-stream');parser.add_argument('--output',type=Path,default=ROOT/'migration/iteration33');parser.add_argument('--reuse-compact',action='store_true');parser.add_argument('--gap-aware',action='store_true');args=parser.parse_args()
    metadata=json.loads((args.input/'summary.json').read_text(encoding='utf-8'))
    if args.reuse_compact:
        with gzip.open(args.output/'compact-shapes.json.gz','rt',encoding='utf-8') as stream:shapes={(s['page'],s['id']):s for s in json.load(stream)}
    else:shapes=compact_index(args.input/metadata['summary']['shape_index'])
    if len(shapes)!=metadata['summary']['shapes_including_subshapes']:raise ValueError('Source index count mismatch')
    result=audit(shapes,metadata,args.gap_aware);args.output.mkdir(parents=True,exist_ok=True)
    name='source-audit-gap-aware.json' if args.gap_aware else 'source-audit.json'
    (args.output/name).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if not args.reuse_compact:
        with gzip.open(args.output/'compact-shapes.json.gz','wt',encoding='utf-8') as output:json.dump(list(shapes.values()),output,ensure_ascii=False,separators=(',',':'))
    print(json.dumps(result['counts'],ensure_ascii=False,indent=2))

if __name__=='__main__':main()
