#!/usr/bin/env python3
"""Domain-neutral VSDX package reader and render/geometry resolver."""
from __future__ import annotations
import argparse, gzip, hashlib, json, math, re, zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET

EXTRACTOR_VERSION="fiber-atlas-vsdx-package-reader/3"
GEOMETRY_RESOLVER_VERSION="fiber-atlas-visio-world-geometry/2"
STYLE_RESOLVER_VERSION="fiber-atlas-visio-effective-style/2"
RAW_FORMAT="fiber-atlas-vsdx-raw/3"
STYLE_KIND={"FillForegnd":"FillStyle","FillBkgnd":"FillStyle","FillPattern":"FillStyle","FillForegndTrans":"FillStyle","FillBkgndTrans":"FillStyle","ShdwForegnd":"FillStyle","ShdwPattern":"FillStyle","LineColor":"LineStyle","LinePattern":"LineStyle","LineWeight":"LineStyle","LineColorTrans":"LineStyle"}
POINT_ROWS={"MoveTo","LineTo","ArcTo","EllipticalArcTo","NURBSTo","RelMoveTo","RelLineTo"}
STD={"0":"#000000","1":"#ffffff","2":"#ff0000","3":"#00ff00","4":"#0000ff","5":"#ffff00","6":"#ff00ff","7":"#00ffff","8":"#800000","9":"#008000","10":"#000080","11":"#808000","12":"#800080","13":"#008080","14":"#c0c0c0","15":"#e6e6e6","16":"#cdcdcd","17":"#b3b3b3","18":"#999999","19":"#808080","20":"#666666","21":"#4d4d4d","22":"#333333","23":"#1a1a1a"}

def local(t): return t.rsplit("}",1)[-1]
def attrs(e): return {local(k):v for k,v in e.attrib.items()}
def attr(e,n): return next((v for k,v in e.attrib.items() if local(k)==n),None)
def children(e,n): return [c for c in e if local(c.tag)==n]
def raw_text(e): return "" if e is None else "".join(e.itertext()).replace("\r\n","\n").replace("\r","\n")
def xml(z,p): return ET.fromstring(z.read(p))
def relpart(owner):
 p=PurePosixPath(owner);return str(p.parent/"_rels"/(p.name+".rels"))
def target(owner,t):
 out=[]
 for x in (PurePosixPath(owner).parent/t).parts:
  if x=="..":
   if out:out.pop()
  elif x not in (".","/"):out.append(x)
 return "/".join(out)
def rels(z,owner):
 rp=relpart(owner)
 if rp not in z.namelist():return []
 out=[]
 for e in xml(z,rp):
  a=attrs(e);ext=a.get("TargetMode")=="External"
  out.append({"id":a.get("Id"),"type":a.get("Type"),"target":a.get("Target"),"target_mode":a.get("TargetMode"),"resolved_part":None if ext else target(owner,a.get("Target",""))})
 return out
def relmap(z,owner):return {r["id"]:r["resolved_part"] for r in rels(z,owner) if r["id"] and r["resolved_part"]}
def cell(c):return attrs(c)
def cmap(e):return {} if e is None else {attr(c,"N"):cell(c) for c in children(e,"Cell") if attr(c,"N")}
def section(s):return {"attributes":attrs(s),"rows":[{"attributes":attrs(r),"cells":[cell(c) for c in children(r,"Cell")]} for r in children(s,"Row")]}
def num(c,d=0.0):
 try:return float((c or {}).get("V",d))
 except (TypeError,ValueError):return d

def mul(a,b):return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]
def pt(m,x,y):return {"x":m[0]*x+m[2]*y+m[4],"y":m[1]*x+m[3]*y+m[5]}
def affine_matrix(pin_x,pin_y,loc_pin_x,loc_pin_y,angle=0.0,flip_x=False,flip_y=False,scale_x=1.0,scale_y=1.0):
 sx=-scale_x if flip_x else scale_x;sy=-scale_y if flip_y else scale_y;co,si=math.cos(angle),math.sin(angle)
 a,b,c,d=co*sx,si*sx,-si*sy,co*sy
 return [a,b,c,d,pin_x-a*loc_pin_x-c*loc_pin_y,pin_y-b*loc_pin_x-d*loc_pin_y]
def matrix(c):return affine_matrix(num(c.get("PinX")),num(c.get("PinY")),num(c.get("LocPinX")),num(c.get("LocPinY")),num(c.get("Angle")),bool(num(c.get("FlipX"))),bool(num(c.get("FlipY"))))
def bounds(points):
 xs=[p["x"] for p in points];ys=[p["y"] for p in points]
 return {"min_x":min(xs),"min_y":min(ys),"max_x":max(xs),"max_y":max(ys),"width":max(xs)-min(xs),"height":max(ys)-min(ys)}
def world_rows(sections,own,w,h):
 out=[]
 for sec in sections:
  if sec["attributes"].get("N")!="Geometry":continue
  rows=[]
  for row in sec["rows"]:
   cm={c.get("N"):c for c in row["cells"] if c.get("N")};kind=row["attributes"].get("T");r={"attributes":row["attributes"],"cells":row["cells"]}
   if kind in POINT_ROWS and "X" in cm and "Y" in cm:
    x,y=num(cm["X"]),num(cm["Y"])
    if kind.startswith("Rel"):x,y=x*w,y*h
    r["world_point"]=pt(own,x,y)
   rows.append(r)
  out.append({"attributes":sec["attributes"],"rows":rows})
 return out
def geom(c,sections,parent,own):
 px,py,w,h=num(c.get("PinX")),num(c.get("PinY")),num(c.get("Width")),num(c.get("Height"));corners=[pt(own,0,0),pt(own,w,0),pt(own,w,h),pt(own,0,h)]
 g={"local_pin":{"x":px,"y":py},"global_pin":pt(parent,px,py),"local_to_page":own,"width":w,"height":h,"angle":num(c.get("Angle")),"world_angle":math.atan2(own[1],own[0]),"local_bounds":{"min_x":0.0,"min_y":0.0,"max_x":w,"max_y":h,"width":w,"height":h},"world_corners":corners,"world_bounds":bounds(corners),"world_geometry_sections":world_rows(sections,own,w,h)}
 if "BeginX" in c and "BeginY" in c:g["global_begin"]=pt(parent,num(c["BeginX"]),num(c["BeginY"]))
 if "EndX" in c and "EndY" in c:g["global_end"]=pt(parent,num(c["EndX"]),num(c["EndY"]))
 return g

def rgb(v,f,colors):
 for x in (v,f):
  if not x:continue
  m=re.search(r"#([0-9a-fA-F]{6})",x)
  if m:return "#"+m.group(1).lower()
  m=re.search(r"RGB\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",x,re.I)
  if m:return "#%02x%02x%02x"%tuple(max(0,min(255,int(n))) for n in m.groups())
  if x.strip() in colors:return colors[x.strip()].lower()
 return None
def styles(root):return {str(attr(s,"ID")):{"attributes":attrs(s),"cells":cmap(s),"sections":[section(x) for x in children(s,"Section")]} for s in root.iter() if local(s.tag)=="StyleSheet"}
def resolved(name,sa,lc,mc,ma,ss):
 c=lc.get(name)
 if c and c.get("F")!="Inh":return {**c,"source_kind":"shape","source_id":sa.get("ID")}
 c=mc.get(name)
 if c and c.get("F")!="Inh":return {**c,"source_kind":"master-shape","source_id":ma.get("ID")}
 kind=STYLE_KIND.get(name);sid=sa.get(kind or "") or ma.get(kind or "");seen=set()
 while sid and sid not in seen:
  seen.add(sid);s=ss.get(sid)
  if not s:break
  c=s["cells"].get(name)
  if c and c.get("F")!="Inh":return {**c,"source_kind":"style","source_id":sid}
  sid=s["attributes"].get(kind) if kind else None
 c=lc.get(name) or mc.get(name)
 return None if not c else {**c,"source_kind":"inherited-unresolved","source_id":sa.get("ID")}
def effstyle(sa,lc,master,ss,colors):
 mc=(master or {}).get("_cell_map",{});ma=(master or {}).get("attributes",{});out={}
 for name in STYLE_KIND:
  c=resolved(name,sa,lc,mc,ma,ss)
  if c:
   v={"value":c.get("V"),"formula":c.get("F"),"source_kind":c.get("source_kind"),"source_id":c.get("source_id")}
   if name in ("FillForegnd","FillBkgnd","LineColor","ShdwForegnd"):
    v["rgb"]=rgb(c.get("V"),c.get("F"),colors);v["resolution"]="resolved" if v["rgb"] else "unresolved"
   out[name]=v
 return out
def merged_cells(local_cells,master):
 out=dict((master or {}).get("_cell_map",{}));out.update(local_cells);return out
def merged_geometry_sections(local_sections,master):
 """Resolve inherited Geometry rows while leaving the raw local sections untouched."""
 master_sections=(master or {}).get("sections",[]);result=[]
 by_ix={s["attributes"].get("IX","0"):s for s in master_sections if s["attributes"].get("N")=="Geometry"}
 local_by_ix={s["attributes"].get("IX","0"):s for s in local_sections if s["attributes"].get("N")=="Geometry"}
 for six in sorted(set(by_ix)|set(local_by_ix),key=lambda x:int(x) if str(x).isdigit() else str(x)):
  ms=by_ix.get(six,{"attributes":{"N":"Geometry","IX":six},"rows":[]});ls=local_by_ix.get(six,{"attributes":ms["attributes"],"rows":[]})
  mr={r["attributes"].get("IX"):r for r in ms["rows"]};lr={r["attributes"].get("IX"):r for r in ls["rows"]};rows=[]
  for rix in sorted(set(mr)|set(lr),key=lambda x:int(x) if str(x).isdigit() else str(x)):
   base=mr.get(rix,{"attributes":{},"cells":[]});override=lr.get(rix,{"attributes":base["attributes"],"cells":[]});cells={c.get("N"):c for c in base["cells"] if c.get("N")};cells.update({c.get("N"):c for c in override["cells"] if c.get("N")});rows.append({"attributes":base["attributes"]|override["attributes"],"cells":list(cells.values())})
  result.append({"attributes":ms["attributes"]|ls["attributes"],"rows":rows})
 return result

def shapetree(container,parent=None,depth=0,inherited_master=None):
 out=[]
 for box in children(container,"Shapes"):
  for s in children(box,"Shape"):
   a=attrs(s);sid=a.get("ID");mid=a.get("Master") or inherited_master;tn=next((x for x in s if local(x.tag)=="Text"),None);rt=raw_text(tn);secs=[section(x) for x in children(s,"Section")]
   r={"id":sid,"parent_id":parent,"depth":depth,"attributes":a,"raw_text":rt,"text":rt.strip(),"cells":[cell(x) for x in children(s,"Cell")],"sections":secs,"master_id":mid,"_cell_map":cmap(s)}
   out.append(r);out.extend(shapetree(s,sid,depth+1,mid))
 return out
def masters(z):
 part="visio/masters/masters.xml"
 if part not in z.namelist():return [],{},{}
 root=xml(z,part);rm=relmap(z,part);catalog=[];roots={};bykey={}
 for m in (x for x in root.iter() if local(x.tag)=="Master"):
  rn=next((x for x in m if local(x.tag)=="Rel"),None);rid=next((v for k,v in (rn.attrib if rn is not None else {}).items() if local(k)=="id"),None);mp=rm.get(rid or "");mid=str(attr(m,"ID"));shapes=[]
  if mp:
   shapes=shapetree(xml(z,mp),inherited_master=mid)
   for s in shapes:bykey[(mid,str(s["id"]))]=s
   top=next((s for s in shapes if s["parent_id"] is None),None)
   if top:roots[mid]=top
  catalog.append({"id":mid,"name":attr(m,"Name") or attr(m,"NameU"),"name_universal":attr(m,"NameU"),"part":mp,"attributes":attrs(m),"relationships":rels(z,mp) if mp else [],"shapes":[{k:v for k,v in s.items() if k!="_cell_map"} for s in shapes]})
 return catalog,roots,bykey
def normalize(raw,mroots,mshapes,ss,colors):
 mats={};paths={};out=[]
 for s in raw:
  sid=str(s["id"]);pid=str(s["parent_id"]) if s["parent_id"] is not None else None;parent=mats.get(pid,[1,0,0,1,0,0]);a=s["attributes"];mid=str(s.get("master_id") or "");msid=a.get("MasterShape");ms=mshapes.get((mid,str(msid))) if msid else mroots.get(mid)
  effective_cells=merged_cells(s["_cell_map"],ms);effective_geometry=merged_geometry_sections(s["sections"],ms);own=mul(parent,matrix(effective_cells));mats[sid]=own
  path=paths.get(pid,[])+([pid] if pid else []);paths[sid]=path
  item={k:v for k,v in s.items() if k!="_cell_map"};item["root_shape_id"]=path[0] if path else sid;item["group_path"]=path;item["master_shape_id"]=msid or (ms or {}).get("id");item["geometry"]=geom(effective_cells,effective_geometry,parent,own);item["effective_style"]=effstyle(a,s["_cell_map"],ms,ss,colors);out.append(item)
 return out
def page_catalog(z):
 part="visio/pages/pages.xml";root=xml(z,part);rm=relmap(z,part);out=[]
 for p in (x for x in root.iter() if local(x.tag)=="Page"):
  rn=next((x for x in p if local(x.tag)=="Rel"),None);rid=next((v for k,v in (rn.attrib if rn is not None else {}).items() if local(k)=="id"),None);pp=rm.get(rid or "")
  if pp:out.append({"id":attr(p,"ID"),"name":attr(p,"Name") or attr(p,"NameU"),"name_universal":attr(p,"NameU"),"part":pp,"attributes":attrs(p)})
 return out
def comments(z):
 part="visio/comments.xml"
 if part not in z.namelist():return []
 root=xml(z,part);authors={str(attr(x,"ID")):{"name":attr(x,"Name"),"initials":attr(x,"Initials"),"smtp":attr(x,"SMTP")} for x in root.iter() if local(x.tag)=="AuthorEntry"}
 return [{"id":attr(x,"CommentID"),"page_id":attr(x,"PageID"),"shape_id":attr(x,"ShapeID"),"date":attr(x,"Date"),"edited_at":attr(x,"EditDate"),"auto_comment_type":attr(x,"AutoCommentType"),"author_id":attr(x,"AuthorID"),"author":authors.get(str(attr(x,"AuthorID"))),"raw_text":raw_text(x),"part":part} for x in root.iter() if local(x.tag)=="CommentEntry"]

def extract(path):
 source=path.read_bytes();sha=hashlib.sha256(source).hexdigest();mtime=datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).isoformat()
 with zipfile.ZipFile(path) as z:
  doc=xml(z,"visio/document.xml");colors=dict(STD);colors.update({str(attr(x,"IX")):str(attr(x,"RGB")).lower() for x in doc.iter() if local(x.tag)=="ColorEntry" and attr(x,"IX") and attr(x,"RGB")});ss=styles(doc);mc,mroots,mshapes=masters(z)
  pp=[];tot=top=txt=props=conns=mrefs=fills=grouped=srefs=0;integrity_all=[]
  for item in page_catalog(z):
   root=xml(z,item["part"]);raw=shapetree(root);sh=normalize(raw,mroots,mshapes,ss,colors);cn=[attrs(x) for x in root.iter() if local(x.tag)=="Connect"];ids={str(s["id"]) for s in sh};integ=[]
   for i,row in enumerate(cn):
    fr=str(row.get("FromSheet"));to=str(row.get("ToSheet"));x={"row_index":i,"from_sheet":row.get("FromSheet"),"to_sheet":row.get("ToSheet"),"from_cell":row.get("FromCell"),"to_cell":row.get("ToCell"),"from_resolves":fr in ids,"to_resolves":to in ids,"valid":fr in ids and to in ids};integ.append(x);integrity_all.append(x)
   ps=next((x for x in root if local(x.tag)=="PageSheet"),None);pc=cmap(ps);dims={"width":num(pc.get("PageWidth")),"height":num(pc.get("PageHeight")),"drawing_scale":num(pc.get("DrawingScale"),1),"page_scale":num(pc.get("PageScale"),1)}
   tot+=len(sh);top+=sum(s["depth"]==0 for s in sh);grouped+=sum(s["depth"]>0 for s in sh);txt+=sum(bool(s["raw_text"]) for s in sh);props+=sum(any(sec["attributes"].get("N")=="Property" for sec in s["sections"]) for s in sh);conns+=len(cn);mrefs+=sum(bool(s.get("master_id")) for s in sh);fills+=sum(bool(s.get("effective_style",{}).get("FillForegnd")) for s in sh);srefs+=sum(any(s.get("attributes",{}).get(k) for k in ("FillStyle","LineStyle","TextStyle")) for s in sh)
   pp.append({**item,"relationships":rels(z,item["part"]),"dimensions":dims,"page_sheet":{"cells":[cell(x) for x in children(ps,"Cell")],"sections":[section(x) for x in children(ps,"Section")]} if ps is not None else None,"shapes":sh,"connects":cn,"connect_integrity":integ})
  parts=[];rawxml={}
  for info in sorted(z.infolist(),key=lambda x:x.filename):
   data=z.read(info.filename);isxml=info.filename.endswith((".xml",".rels"));parts.append({"part":info.filename,"size_bytes":len(data),"compressed_bytes":info.compress_size,"sha256":hashlib.sha256(data).hexdigest(),"content_kind":"xml" if isxml else "binary"})
   if isxml:rawxml[info.filename]=data.decode("utf-8","replace")
  cm=comments(z);unresolved=sum(v.get("resolution")=="unresolved" for p in pp for s in p["shapes"] for k,v in s.get("effective_style",{}).items() if k in ("FillForegnd","FillBkgnd","LineColor","ShdwForegnd"))
  summary={"pages":len(pp),"masters":len(mc),"unique_masters":len(mc),"styles":len(ss),"style_references":srefs,"package_parts":len(parts),"xml_parts_preserved_verbatim":len(rawxml),"all_page_shapes_including_subshapes":tot,"top_level_shapes":top,"grouped_subshapes":grouped,"direct_text_shapes":txt,"shapes_with_local_property_sections":props,"connect_rows":conns,"connect_rows_valid":sum(x["valid"] for x in integrity_all),"connect_rows_dangling":sum(not x["valid"] for x in integrity_all),"comments":len(cm),"shapes_with_master_reference":mrefs,"shapes_with_effective_fill":fills,"unresolved_effective_colors":unresolved}
  versions={"extractor":EXTRACTOR_VERSION,"geometry_resolver":GEOMETRY_RESOLVER_VERSION,"style_resolver":STYLE_RESOLVER_VERSION};cache=hashlib.sha256((sha+"|"+"|".join(versions.values())).encode()).hexdigest()
  return {"format":RAW_FORMAT,"versions":versions,"cache_key":cache,"source":{"file":path.name,"absolute_path":str(path.resolve()),"sha256":sha,"size_bytes":len(source),"modified_at":mtime},"extracted_at":mtime,"package_parts":parts,"raw_xml_parts":rawxml,"document":{"relationships":rels(z,"visio/document.xml"),"colors":colors,"styles":ss,"theme_parts":[x for x in sorted(z.namelist()) if x.startswith("visio/theme/")]},"masters":mc,"pages":pp,"comments":cm,"summary":summary}
def gzwrite(path,data):
 with path.open("wb") as f:
  with gzip.GzipFile(filename="",mode="wb",fileobj=f,compresslevel=9,mtime=0) as g:g.write(data)
def main():
 ap=argparse.ArgumentParser();ap.add_argument("input",type=Path);ap.add_argument("output",type=Path);ap.add_argument("--summary",type=Path);a=ap.parse_args();r=extract(a.input);a.output.parent.mkdir(parents=True,exist_ok=True);data=json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode();gzwrite(a.output,data) if a.output.suffix==".gz" else a.output.write_bytes(data)
 if a.summary:a.summary.parent.mkdir(parents=True,exist_ok=True);a.summary.write_text(json.dumps({k:r[k] for k in ("format","versions","cache_key","source","summary")},ensure_ascii=False,sort_keys=True,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":main()
