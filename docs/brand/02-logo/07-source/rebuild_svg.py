"""Rebuild Worldling's production SVGs using Python 3 and the adjacent JSON.

Usage: python rebuild_svg.py [output-directory]
No font installation or third-party Python dependency is needed.
"""
from pathlib import Path
import json
import sys

HERE = Path(__file__).resolve().parent
G = json.loads((HERE / 'worldling-geometry.json').read_text())
DEST = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / 'rebuilt-svg'
DEST.mkdir(parents=True, exist_ok=True)

def mark(uid, color, size=None):
    o = G['orbit']; p = G['planet']; sprout = G['sprout']
    optical = G['optical_variants'].get(str(size), {})
    width = optical.get('stroke', o['stroke'])
    gap = optical.get('gap', o['front_gap_each_side'])
    rear = optical.get('rear_clearance', o['rear_clearance'])
    scale = optical.get('sprout_scale', 1)
    ink = f'url(#{uid}-gradient)' if color == 'gradient' else color
    rotation = f'rotate({o["rotation_svg_degrees"]} {p["cx"]} {p["cy"]})'
    defs = f'''<defs>
<linearGradient id="{uid}-gradient" gradientUnits="userSpaceOnUse" x1="160" y1="790" x2="864" y2="250"><stop stop-color="#7C6CFF"/><stop offset="1" stop-color="#3FE0C5"/></linearGradient>
<mask id="{uid}-rear" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024" style="mask-type:luminance"><rect width="1024" height="1024" fill="white"/><circle cx="512" cy="590" r="{p['radius']+rear}" fill="black"/></mask>
<mask id="{uid}-body" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024" style="mask-type:luminance"><rect width="1024" height="1024" fill="white"/><path d="{o['front_path']}" transform="{rotation}" fill="none" stroke="black" stroke-width="{width+2*gap}"/></mask>
</defs>'''
    leaves = ''.join(f'<path d="{sprout[k]}"/>' for k in ['stem_path','left_leaf_path','right_leaf_path'])
    return defs + f'''<g fill="{ink}">
<ellipse cx="512" cy="590" rx="394" ry="100" transform="{rotation}" fill="none" stroke="{ink}" stroke-width="{width}" mask="url(#{uid}-rear)"/>
<g mask="url(#{uid}-body)"><circle cx="512" cy="590" r="216"/><g transform="translate(512 374) scale({scale}) translate(-512 -374)">{leaves}</g></g>
<path d="{o['front_path']}" transform="{rotation}" fill="none" stroke="{ink}" stroke-width="{width}"/>
</g>'''

def word(color, x, y, scale=1):
    w=G['wordmark'];b=w['visible_bounds_before_alignment']
    return f'<g transform="translate({x} {y}) scale({scale}) translate({-b[0]} {-b[1]})" fill="{color}" stroke="{color}" stroke-width="0.8" stroke-linejoin="round"><path d="{w["path"]}"/></g>'

def save(name, body, width=1024, height=1024, bg=None, viewbox=None):
    vb=viewbox or f'0 0 {width} {height}'
    r=vb.split()
    back=f'<rect x="{r[0]}" y="{r[1]}" width="{r[2]}" height="{r[3]}" fill="{bg}"/>' if bg else ''
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{vb}" role="img"><title>Worldling logo</title>{back}{body}</svg>'
    (DEST/(name+'.svg')).write_text(svg)

for name,color,bg in [('starlight-on-void','#F4F1EA','#07071A'),('dark-on-starlight','#07071A','#F4F1EA'),('white-transparent','#FFFFFF',None),('dark-transparent','#07071A',None),('primary-nebula','#7C6CFF',None),('hero-gradient','gradient',None)]:
    save('worldling-mark-'+name,mark(name,color),bg=bg)

for style,color,bg in [('on-dark','#F4F1EA','#07071A'),('on-light','#07071A','#F4F1EA'),('white-transparent','#FFFFFF',None),('dark-transparent','#07071A',None)]:
    for orientation in ['horizontal','stacked']:
        data=G['lockups'][orientation];x,y=data['wordmark_top_left']
        body=f'<g transform="{data["mark_transform"]}">{mark(orientation+style,color)}</g>'+word(color,x,y,data.get('wordmark_scale',1))
        save('worldling-'+orientation+'-'+style,body,*data['canvas'],bg)

for size in [1024,64,32,16]:
    vb=G['optical_variants'].get(str(size),{}).get('viewBox','0 0 1024 1024')
    save('worldling-'+str(size),mark('s'+str(size),'#F4F1EA',size),size,size,'#07071A',vb)
    if size<=64:save('worldling-transparent-'+str(size),mark('t'+str(size),'#F4F1EA',size),size,size,None,vb)

for rounded in [True,False]:
    radius=224 if rounded else 0
    bg=f'<defs><linearGradient id="app-bg" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#30275A"/><stop offset=".56" stop-color="#202544"/><stop offset="1" stop-color="#1B484B"/></linearGradient></defs><rect width="1024" height="1024" rx="{radius}" fill="url(#app-bg)"/>'
    body=bg+f'<g transform="translate(71.68 71.68) scale(.86)">{mark("app","#F4F1EA")}</g>'
    save('worldling-app-icon-'+('rounded' if rounded else 'square-source'),body)

print(f'Rebuilt {len(list(DEST.glob("*.svg")))} SVGs in {DEST}')
