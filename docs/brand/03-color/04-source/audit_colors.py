"""Recalculate the delivered Worldling color contrast data using Python 3.

Run: python audit_colors.py
Or:  python audit_colors.py /path/to/worldling-colors.json
No third-party dependency is required.
"""
import colorsys
import json
import math
from pathlib import Path
import sys

source=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'02-color-files/worldling-colors.json'
data=json.loads(source.read_text())
def rgb(code):return [int(code.lstrip('#')[i:i+2],16) for i in (0,2,4)]
def luminance(code):
    channels=[n/255 for n in rgb(code)]
    channels=[n/12.92 if n<=0.04045 else ((n+0.055)/1.055)**2.4 for n in channels]
    return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722
def ratio(a,b):
    a,b=sorted((luminance(a),luminance(b)))
    return (b+0.05)/(a+0.05)

assert ratio('#000000','#FFFFFF')==21.0
assert ratio('#07071A','#07071A')==1.0
colors=data['foundation']+data['utility']+data['semantic']+[c['surface'] for c in data['semantic']]
for scale in data['scales'].values():colors+=list(scale.values())
lookup={c['name']:c for c in colors}
for col in colors:
    assert rgb(col['hex'])==col['rgb'],col['name']
    h,l,s=colorsys.rgb_to_hls(*(n/255 for n in col['rgb']))
    assert col['hsl']=={'h':round(h*360,1),'s':round(s*100,1),'l':round(l*100,1)},col['name']
for family,scale in data['scales'].items():
    assert list(scale)==['50','100','200','300','400','500','600','700','800','900','950']
    assert scale['500']['hex']==lookup[family]['hex']
    levels=[luminance(c['hex']) for c in scale.values()]
    assert all(a>b for a,b in zip(levels,levels[1:])),family

text_pairs=[]
for group in ['curated','semantic','all_scale_pairs']:text_pairs+=data['contrast'][group]
for pair in text_pairs:
    value=ratio(pair['foreground_hex'],pair['background_hex'])
    assert math.isclose(value,pair['contrast_ratio'],abs_tol=1e-12)
    assert pair['display_ratio']==f'{value:.2f}:1'
    for flag,threshold in [('normal_AA',4.5),('normal_AAA',7),('large_AA',3),('large_AAA',4.5)]:
        assert pair[flag]==(value>=threshold),(pair,flag)
for pair in data['contrast']['ui_boundaries']:
    value=ratio(lookup[pair['foreground']]['hex'],lookup[pair['background']]['hex'])
    assert math.isclose(value,pair['contrast_ratio'],abs_tol=1e-12)
    assert pair['non_text_AA']==(value>=3)
assert sum(data['usage']['detail'].values())==100
report={'status':'verified','rgb_hsl_entries_checked':len(colors),'accent_steps':33,'text_contrast_pairs_checked':len(text_pairs),'ui_contrast_pairs_checked':len(data['contrast']['ui_boundaries']),'decisions_use_unrounded_ratios':True,'scope':'Arithmetic and table validation for opaque sRGB pairs. Full application accessibility is outside this audit.'}
print(json.dumps(report,indent=2))
