"""Owner-confirmed Shida docking convention, isolated from other source families."""
from __future__ import annotations
import math
from marker_geometry import point_inside_marker_ellipse, UnsupportedMarkerGeometry

RULE = 'shida-numbered-marker-and-port-drafting-gap/2'
CONFIRMATION = 'OWNER-SHIDA-DRAFTING-GAP-CONTINUITY-2026-10-09'


def first_linear_path(shape):
    points=[]
    for kind,x,y in shape.get('points',[]):
        if kind in ('MoveTo','RelMoveTo') and points:
            break
        if kind not in ('MoveTo','LineTo','RelMoveTo','RelLineTo'):
            return []
        if not points or points[-1]!=(x,y):
            points.append((x,y))
    return points


def inward_endpoint_rays(shape):
    path=first_linear_path(shape)
    if len(path)<2 or path[0]==path[-1]:
        return None,None
    begin,end=shape.get('begin'),shape.get('end')
    if not begin or not end:
        return None,None
    if math.dist(path[0],(begin['x'],begin['y']))>1e-6 or math.dist(path[-1],(end['x'],end['y']))>1e-6:
        return None,None
    return (path[1][0]-path[0][0],path[1][1]-path[0][1]),(path[-2][0]-path[-1][0],path[-2][1]-path[-1][1])


def marker_docking_evidence(point, marker, inward_ray=None, bank_pitch=None):
    if point_inside_marker_ellipse(point,marker,epsilon=1e-9):
        return {'kind':'ellipse_containment','rule':RULE,'gap':0.0}
    if inward_ray is None or bank_pitch is None or bank_pitch<=0:
        return None
    geometry=marker['geometry'];matrix=geometry['local_to_page'];bounds=geometry['local_bounds']
    a,b,c,d,e,f=map(float,matrix);width=float(bounds['width']);height=float(bounds['height'])
    cx=float(bounds.get('min_x',0))+width/2;cy=float(bounds.get('min_y',0))+height/2
    center=(a*cx+c*cy+e,b*cx+d*cy+f)
    vx,vy=center[0]-point['x'],center[1]-point['y'];distance=math.hypot(vx,vy)
    ray_length=math.hypot(*inward_ray)
    if not distance or not ray_length or not all(math.isfinite(v) for v in (*inward_ray,bank_pitch)):
        return None
    tx,ty=inward_ray[0]/ray_length,inward_ray[1]/ray_length
    # The marker must be beyond the open stroke endpoint, not alongside or on
    # the interior side of that stroke. No nearest-marker fallback is used.
    longitudinal=-(vx*tx+vy*ty)
    if longitudinal<=0:
        return None
    perpendicular=abs(vx*ty-vy*tx)
    nx,ny=-ty,tx
    normal_radius=math.hypot((a*nx+b*ny)*width/2,(c*nx+d*ny)*height/2)
    determinant=a*d-b*c
    if abs(determinant)<1e-12:
        raise UnsupportedMarkerGeometry('Singular Shida marker transform')
    px,py=point['x']-e,point['y']-f
    lx=(d*px-c*py)/determinant;ly=(-b*px+a*py)/determinant
    normalized=math.hypot((lx-cx)/(width/2),(ly-cy)/(height/2))
    radius_on_ray=distance/normalized
    gap=distance-radius_on_ray
    gap_limit=min(bank_pitch*.12,radius_on_ray*.4)
    transverse_limit=min(bank_pitch*.30,normal_radius)
    if gap<0 or gap>gap_limit or perpendicular>transverse_limit:
        return None
    return {'kind':'owner_confirmed_drafting_gap','rule':RULE,'ownerConfirmationId':CONFIRMATION,
            'gap':gap,'gapLimit':gap_limit,'perpendicularResidual':perpendicular,
            'transverseLimit':transverse_limit,'bankPitch':bank_pitch,'normalizedEllipseDistance':normalized}


def port_docking_evidence(point, port_shape, inward_ray=None, port_pitch=None):
    path=first_linear_path(port_shape)
    if len(path)<4:
        return None
    xs=sorted(set(round(p[0],8) for p in path));ys=sorted(set(round(p[1],8) for p in path))
    if len(xs)!=2 or len(ys)!=2:
        return None
    xmin,xmax,ymin,ymax=xs[0],xs[1],ys[0],ys[1]
    x,y=point['x'],point['y']
    if xmin-1e-8<=x<=xmax+1e-8 and ymin-1e-8<=y<=ymax+1e-8:
        return {'kind':'source_port_rectangle','rule':RULE,'gap':0}
    if inward_ray is None or port_pitch is None or port_pitch<=0:
        return None
    length=math.hypot(*inward_ray)
    if not length:return None
    tx,ty=inward_ray[0]/length,inward_ray[1]/length
    vx,vy=(xmin+xmax)/2-x,(ymin+ymax)/2-y
    if vx*tx+vy*ty>=0:return None
    gap=math.hypot(max(xmin-x,0,x-xmax),max(ymin-y,0,y-ymax))
    limit=min(port_pitch*.12,min(xmax-xmin,ymax-ymin)*.4)
    transverse=abs(vx*ty-vy*tx)
    if gap>limit or transverse>port_pitch*.3:return None
    return {'kind':'owner_confirmed_port_drafting_gap','rule':RULE,'ownerConfirmationId':CONFIRMATION,'gap':gap,'gapLimit':limit,'perpendicularResidual':transverse,'portPitch':port_pitch}
