"""Run from any directory: python audit_typography.py.

Requires fonttools and brotli for the WOFF2 font checks.
This audits the supplied values and fonts, not a browser or application.
"""
from pathlib import Path
import json, re, hashlib
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'02-type-files/worldling-typography.json').read_text())
css=(ROOT/'02-type-files/worldling-typography.css').read_text()
pattern=r'clamp\(([\d.]+)rem, calc\(([\d.]+)rem \+ ([\d.]+)vw\), ([\d.]+)rem\)'
checks=[]
for style in data['type_scale']:
    m=re.fullmatch(pattern,style['fluid_css'])
    assert m,style['id']
    low,intercept,slope,high=map(float,m.groups())
    def size(viewport):return max(low*16,min(high*16,intercept*16+slope*viewport/100))
    values={str(v):round(size(v),6) for v in [320,360,768,1440,1920]}
    assert abs(size(360)-style['mobile_px'])<.0001,style['id']
    assert abs(size(1440)-style['desktop_px'])<.0001,style['id']
    assert abs(size(320)-style['mobile_px'])<.0001
    assert abs(size(1920)-style['desktop_px'])<.0001
    assert f"--text-{style['id']}: {style['fluid_css']};" in css
    block=re.search(r'\.wl-'+re.escape(style['id'])+r' \{([^}]+)\}',css).group(1)
    for property,value in [('font-weight',style['font_weight']),('line-height',style['line_height']),('letter-spacing',f"{style['letter_spacing_em']:g}em")]:
        assert f'{property}: {value};' in block,(style['id'],property)
    checks.append({'style':style['id'],'status':'passed','sizes_css_px':values})
fonts=[]
for role,spec in data['fonts'].items():
    ttf_path=ROOT/'03-fonts/ttf'/spec['source']
    ttf=TTFont(ttf_path);woff=TTFont(ROOT/'03-fonts/woff2'/spec['woff2'])
    cmap=ttf.getBestCmap()
    coverage=data['font_coverage'][spec['name']]
    assert hashlib.sha256(ttf_path.read_bytes()).hexdigest()==coverage['ttf_sha256']
    assert woff.getBestCmap()==cmap
    assert [(a.axisTag,a.minValue,a.defaultValue,a.maxValue) for a in ttf['fvar'].axes]==[(a.axisTag,a.minValue,a.defaultValue,a.maxValue) for a in woff['fvar'].axes]
    assert [(r.nameID,r.platformID,r.platEncID,r.langID,r.toUnicode()) for r in ttf['name'].names]==[(r.nameID,r.platformID,r.platEncID,r.langID,r.toUnicode()) for r in woff['name'].names]
    missing=[ch for ch in coverage['checked_characters'] if ord(ch) not in cmap]
    assert not missing,(spec['name'],missing)
    assert (ROOT/'03-fonts/licenses'/spec['license']).is_file()
    fonts.append({'family':spec['name'],'status':'passed','checked_glyphs':len(set(coverage['checked_characters'])),'woff2_cmap_axes_and_names_match_ttf':True,'narrow_no_break_space_U202F_in_cmap':0x202f in cmap})
report={'status':'passed','scope':'Font coverage and file equivalence; mathematical type-scale endpoints and CSS property consistency. No browser rendering or app-wide accessibility certification.','type_scale':checks,'fonts':fonts,'browser_checks':{'status':'not_run','note':'No usable local browser was available. Verify zoom, reflow and user text-spacing behavior when integrating the specimen into the app.'}}
(ROOT/'05-source/typography-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'status':'passed','styles':len(checks),'font_families':len(fonts)}))
