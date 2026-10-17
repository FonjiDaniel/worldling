"""Rebuild the Worldling Step 6 image set.
Requires Python, fonttools, Pillow and Inkscape on PATH. No network access.
Edit ../05-template/og-template.json to customize the OG share image.
"""
from pathlib import Path
import base64, json, random, re, subprocess, xml.etree.ElementTree as ET
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/'04-assets';CONFIG=json.loads((ROOT/'05-template/og-template.json').read_text())
C={'void':'#07071A','surface':'#11122B','raised':'#1A1B3A','text':'#F4F1EA','muted':'#9A9BB8','primary':'#7C6CFF','accent':'#3FE0C5','warm':'#FF8A5B','link':'#A99FFF','line':'#34365A','control':'#696C91'}
F={};copy=[];manifest=[];current='';serial=0
for key,name,axes in [('display','BricolageGrotesque-variable.ttf',{'wght':650,'wdth':100,'opsz':48}),('body','Geist-variable.ttf',{'wght':400}),('medium','Geist-variable.ttf',{'wght':500}),('bold','Geist-variable.ttf',{'wght':600}),('mono','GeistMono-variable.ttf',{'wght':500})]:
 f=instantiateVariableFont(TTFont(ASSET/'fonts'/name),axes,inplace=False)
 F[key]=(f.getGlyphSet(),f.getBestCmap(),f['head'].unitsPerEm)

def esc(s):
 import html
 return html.escape(str(s),quote=True)
def measure(s,size=24,font='body',track=0):
 gs,cm,upem=F[font]
 return (sum(gs[cm[ord(ch)]].width for ch in s)/upem+max(0,len(s)-1)*track)*size
def text(s,x,y,size=24,font='body',color=None,track=0,align='left'):
 assert '\u2014' not in s
 w=measure(s,size,font,track)
 if align=='center':x-=w/2
 elif align=='right':x-=w
 copy.append({'asset':current,'text':s,'x':round(x,2),'y':round(y,2),'font':font,'size':size,'width':round(w,2)})
 gs,cm,upem=F[font];cursor=0;paths=[]
 for ch in s:
  glyph=cm[ord(ch)];pen=SVGPathPen(gs);gs[glyph].draw(pen)
  if pen.getCommands():paths.append(f'<path d="{pen.getCommands()}" transform="translate({cursor:g} 0)"/>')
  cursor+=gs[glyph].width+track*upem
 return f'<g fill="{color or C["text"]}" transform="translate({x:g} {y+size*.82:g}) scale({size/upem:g} {-size/upem:g})" aria-label="{esc(s)}">'+''.join(paths)+'</g>'
def wrap(s,x,y,w,size=24,font='body',color=None,lh=1.5,track=0):
 lines=[]
 for paragraph in s.split('\n'):
  line=''
  for word in paragraph.split(' '):
   attempt=(line+' '+word).strip()
   if line and measure(attempt,size,font,track)>w:lines.append(line);line=word
   else:line=attempt
  lines.append(line)
 for line in lines:assert measure(line,size,font,track)<=w+1,(current,line,w)
 return ''.join(text(line,x,y+i*size*lh,size,font,color,track) for i,line in enumerate(lines)),len(lines)*size*lh
def rect(x,y,w,h,fill,r=0,stroke=None,sw=1,extra=''):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '')+f' {extra}/>'
def line(x1,y1,x2,y2,color=None,sw=1):return f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{color or C["line"]}" stroke-width="{sw}"/>'
def circle(x,y,r,fill,stroke=None,sw=1):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '')+'/>'
def data_uri(path):return 'data:image/png;base64,'+base64.b64encode(Path(path).read_bytes()).decode()
HERO=data_uri(ROOT/CONFIG['planet_path']);PRESETS=data_uri(ASSET/'world-presets.png')
def planet(x,y,w):return f'<image x="{x}" y="{y}" width="{w}" height="{w}" xlink:href="{HERO}"/>'
def logo(x,y,w):
 global serial
 serial+=1;s=(ASSET/'worldling-logo.svg').read_text();inner=s[s.index('>')+1:s.rindex('</svg>')]
 inner=inner.replace('hwhite-transparent',f'logo-{serial}')
 return f'<svg x="{x}" y="{y}" width="{w}" height="{w*360/1331:g}" viewBox="0 0 1331 360">{inner}</svg>'
def icon(key,x,y,size=24,color=None):
 s=(ASSET/'icons'/f'{key}.svg').read_text();inner=s[s.index('>')+1:s.rindex('</svg>')]
 return f'<g transform="translate({x} {y}) scale({size/24})" color="{color or C["text"]}" stroke="currentColor" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">{inner}</g>'
def arrow(x,y,size=24,color=None,direction='right'):
 transform=f'translate({x} {y}) scale({size/24})'+(' translate(24 0) scale(-1 1)' if direction=='left' else '')
 return f'<g transform="{transform}" stroke="{color or C["text"]}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 12h16m-6-6 6 6-6 6"/></g>'
def stars(w,h,seed=1,density=32):
 rnd=random.Random(seed);parts=[]
 for _ in range(round(w*h/1_000_000*density)):
  x=rnd.uniform(16,w-16);y=rnd.uniform(16,h-16);r=rnd.uniform(.65,1.35);a=rnd.uniform(.24,.5)
  parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" fill="{C["text"]}" opacity="{a:.2f}"/>')
 return ''.join(parts)
def defs():
 return '<radialGradient id="nebula"><stop stop-color="#7C6CFF" stop-opacity=".08"/><stop offset="1" stop-color="#7C6CFF" stop-opacity="0"/></radialGradient><radialGradient id="aurora"><stop stop-color="#3FE0C5" stop-opacity=".06"/><stop offset="1" stop-color="#3FE0C5" stop-opacity="0"/></radialGradient>'
def bg(w,h,seed=1):
 return rect(0,0,w,h,C['void'])+f'<ellipse cx="{w*.76}" cy="{h*.45}" rx="{w*.52}" ry="{h*.62}" fill="url(#nebula)"/><ellipse cx="{w*.9}" cy="{h*.93}" rx="{w*.4}" ry="{h*.4}" fill="url(#aurora)"/>'+stars(w,h,seed)
def button(label,x,y,w,h=56,size=20,ic=None,outline=False):
 fill='none' if outline else C['warm'];ink=C['text'] if outline else C['void']
 b=rect(x,y,w,h,fill,h/2,C['muted'] if outline else None)
 total=measure(label,size,'bold')+(size+10 if ic else 0);left=x+(w-total)/2
 if ic:b+=icon(ic,left,y+(h-size)/2,size,ink);left+=size+10
 return b+text(label,left,y+(h-size)/2-1,size,'bold',ink)
def save(name,folder,body,w,h,scale=1,extra_defs='',description=''):
 path=ROOT/'02-svg'/f'{name}.svg';path.parent.mkdir(exist_ok=True)
 doc=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><title>{esc(description or name)}</title><defs>{defs()}{extra_defs}</defs>{body}</svg>'
 path.write_text(doc)
 output=ROOT/'01-images'/folder/f'{name}.png';output.parent.mkdir(exist_ok=True)
 subprocess.run(['inkscape',str(path),'--export-type=png',f'--export-width={round(w*scale)}',f'--export-height={round(h*scale)}','--export-filename='+str(output)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 manifest.append({'name':name,'purpose':description,'image':str(output.relative_to(ROOT)),'svg':str(path.relative_to(ROOT)),'logical_size':[w,h],'png_size':[round(w*scale),round(h*scale)]})
 return output

# 01: Open Graph share template.
current='Worldling-OG-1200x630';b=bg(1200,630,6)
b+=logo(45,32,272)+planet(642,55,530)
b+=text('A WORLD TO VISIT',64,191,15,'bold',C['accent'],.06)
name=CONFIG['world_name'];chosen=None
for size in [60,56,52,48]:
 result,height=wrap(name,64,237,538,size,'display',lh=1.1,track=-.03)
 if height<=size*1.1*2+.1:chosen=(result,height);break
assert chosen is not None,'Use a shorter share title or adjust the OG layout for three lines.'
b+=chosen[0]+text(CONFIG['username'],64,237+chosen[1]+27,25,'body',C['muted'])
b+=line(64,475,535,475)+text(CONFIG['tagline'],64,509,25,'body')+text("Visit everyone else's.",64,552,20,'body',C['muted'])
save(current,'social',b,1200,630,description='Open Graph share image template')

# 02: X profile header. The lower-left region stays quiet for profile overlays.
current='Worldling-X-Header-1500x500';b=bg(1500,500,17)+logo(377,51,277)
b+=text('Grow a world',390,177,58,'display',track=-.03)+text('of your own.',390,241,58,'display',track=-.03)
b+=text("Visit everyone else's.",390,337,25,'body',C['muted'])+planet(1013,13,474)
save(current,'social',b,1500,500,description='X profile header')

# 03: Instagram launch post.
current='Worldling-Instagram-Post-1080x1350';b=bg(1080,1350,23)+logo(55,49,306)
b+=circle(703,90,5,C['accent'])+text('Worldling is here.',724,77,25,'medium',C['accent'])
b+=text('Grow a world',64,197,103,'display',track=-.035)+text('of your own.',64,307,103,'display',track=-.035)
b+=text("Visit everyone else's.",68,446,34,'body',C['muted'])
b+=button('Create your world',68,527,322,66,24)+planet(193,548,780)
save(current,'social',b,1080,1350,description='Instagram launch post')

# 04: Instagram launch story.
current='Worldling-Instagram-Story-1080x1920';b=bg(1080,1920,41)+logo(366,236,348)
b+=rect(348,362,384,54,C['surface'],27,C['line'])+circle(381,389,4,C['accent'])+text('Worldling is here.',408,377,25,'medium',C['accent'])
b+=text('Grow a world',540,471,104,'display',track=-.035,align='center')+text('of your own.',540,582,104,'display',track=-.035,align='center')
b+=text("Visit everyone else's.",540,728,35,'body',C['muted'],align='center')+planet(140,789,800)
b+=button('Create your world',322,1596,436,76,28)
save(current,'social',b,1080,1920,description='Instagram launch story')

# 05: Mobile world page, 390 by 844 logical pixels, delivered at 3x.
current='Worldling-Mobile-World-1170x2532';b=bg(390,844,35)
b+=text('9:41',24,16,13,'bold')
b+=f'<g fill="{C["text"]}">'+''.join(rect(306+i*4,23-i*2,2.5,3+i*2,C['text'],.7) for i in range(4))+'</g>'
b+=rect(342,18,20,10,'none',2,C['muted'])+rect(344,20,14,6,C['text'],1)+rect(364,21,2,4,C['muted'],1)
b+=logo(18,48,151)+icon('share',342,58,23)
b+=planet(10,104,370)
b+=text('Éclats d’aurore',24,480,36,'display',track=-.03)
b+=circle(42,553,18,C['raised'])+text('M',42,542,17,'bold',align='center')+text('Mira',70,537,16,'bold')+text('@mira',70,559,14,'body',C['muted'])
b+=rect(24,597,342,100,C['surface'],16,C['line'])+icon('bloom',42,615,20,C['accent'])+text('Bloom level',70,617,14,'medium',C['muted'])+text('07',344,609,26,'mono',align='right')
b+=rect(42,650,306,5,C['raised'],2.5)+rect(42,650,211,5,C['accent'],2.5)+text('Growing a little brighter.',42,668,14,'body',C['muted'])
b+=button('Send a comet',24,721,342,54,16,'comet')
b+=icon('universe',101,793,19,C['link'])+text('Explore the universe',131,793,14,'medium',C['link'])+rect(140,831,110,4,C['text'],2)
save(current,'product',b,390,844,3,description='Mobile world page at 390 by 844 logical pixels')

# 06: Desktop world creator.
current='Worldling-Desktop-Creator-1600x1000';b=bg(1600,1000,42)
b+=rect(0,0,1600,105,C['surface'],extra='opacity=".72"')+line(0,105,1600,105)+logo(49,22,248)
b+=text('Explore',1126,49,17,'medium',C['muted'])+text('My world',1225,49,17,'bold')+rect(1225,82,70,2,C['accent'],1)
b+=button('Preview',1334,29,136,48,16,'visit',True)+circle(1525,53,21,C['raised'])+text('M',1525,43,18,'bold',align='center')
b+=text('YOUR OWN SMALL WORLD',72,156,14,'bold',C['accent'],.05)+text('Make it yours.',72,196,52,'display',track=-.03)
b+=text('A little color. A little care. A world to call home.',75,270,20,'body',C['muted'])
b+=planet(150,310,620)+text('Drag to turn your world',460,952,16,'body',C['muted'],align='center')
# Glass-like control panel over the quiet space field.
b+=rect(969,149,559,784,'#000000',24,extra='opacity=".22"')+rect(969,137,559,784,C['surface'],24,C['line'],extra='fill-opacity=".88"')
b+=text('Your world',995,163,24,'display',track=-.01)+text('Éclats d’aurore',995,203,17,'medium',C['muted'])
b+=text('Landscape',995,250,16,'bold')+text('Atmosphere',1120,250,16,'medium',C['muted'])+text('Details',1273,250,16,'medium',C['muted'])
b+=line(995,282,1502,282)+rect(995,279,90,3,C['accent'],1.5)
labels=['Oceanic','Verdant','Desert','Frozen','Volcanic','Crystal']
for i,label in enumerate(labels):
 x=995+(i%3)*172;y=304+(i//3)*109;sel=i==1
 b+=rect(x,y,162,96,C['void'],12,C['accent'] if sel else C['control'],2 if sel else 1)
 sx=(i%3)*512;sy=(i//3)*512
 b+=f'<defs><clipPath id="preset-{i}"><rect x="{x+51}" y="{y+5}" width="60" height="60"/></clipPath></defs><image x="{x+51-sx*60/512}" y="{y+5-sy*60/512}" width="180" height="120" xlink:href="{PRESETS}" clip-path="url(#preset-{i})"/>'
 b+=text(label,x+81,y+70,14,'bold' if sel else 'medium',C['text'],align='center')
 if sel:b+=circle(x+146,y+15,6,C['accent'])+f'<path d="M{x+143} {y+15}l2 2 4-4" stroke="{C["void"]}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
for i,(label,value,pct) in enumerate([('Terrain','42%',.42),('Cloud cover','26%',.26),('Ocean','62%',.62)]):
 y=548+i*77;b+=text(label,995,y,15,'medium')+text(value,1502,y,14,'mono',C['muted'],align='right')
 b+=rect(995,y+34,507,5,C['raised'],2.5)+rect(995,y+34,507*pct,5,C['primary'],2.5)+circle(995+507*pct,y+36.5,7,C['text'],C['primary'],2)
b+=text('Landscape colors',995,778,15,'medium')
for i,col in enumerate(['#63804E','#9FAF65','#4DA5AC','#E4D8B3','#8C7AAF']):
 x=1011+i*44
 if i==0:b+=circle(x,823,18,'none',C['accent'],2)
 b+=circle(x,823,13,col)
b+=button('Save my world',995,856,507,48,16)
save(current,'product',b,1600,1000,description='Desktop world creator with presets, sliders and swatches')

# 07: Email header/footer pair, including a responsive mobile composition.
def email_header(w):
 p=32 if w>=500 else 24;b=rect(0,0,w,208 if w>=500 else 198,C['void'])+logo(p-5,22,182 if w>=500 else 160)
 if w>=500:b+=text('Grow a world of your own.',p,112,35,'display',track=-.025)
 else:b+=text('Grow a world',p,103,34,'display',track=-.025)+text('of your own.',p,141,34,'display',track=-.025)
 b+=line(p,195 if w>=500 else 197,w-p,195 if w>=500 else 197)
 return b
def email_footer(w):
 p=32 if w>=500 else 24;h=154 if w>=500 else 174
 b=rect(0,0,w,h,C['void'])+line(p,0,w-p,0)
 b+=text("Visit everyone else's.",p,27,18,'medium')+text('A little kindness travels far.',p,60,14,'body',C['muted'])
 b+=text('Email preferences',p,112,13,'medium',C['link'])+text('Unsubscribe',w-p,112,13,'medium',C['link'],align='right')
 b+=line(p,129,p+measure('Email preferences',13,'medium'),129,C['link'])+line(w-p-measure('Unsubscribe',13,'medium'),129,w-p,129,C['link'])
 return b
for w in [600,360]:
 for part,fn,h in [('Header',email_header,208 if w==600 else 198),('Footer',email_footer,154 if w==600 else 174)]:
  current=f'Worldling-Email-{part}-{w*2}px';b=fn(w);save(current,'email',b,w,h,2,description=f'Email {part.lower()} at {w}px logical width')
def email_complete(w):
 p=32 if w>=500 else 24;top=208 if w>=500 else 198;body_width=w-2*p
 b=rect(0,0,w,760,C['void'])+email_header(w)
 b+=text('Hi Mira,',p,top+35,18,'bold')
 paragraph='You’ve found a little corner of the universe. Choose a landscape, add a little color, and make it yours.'
 rendered,h=wrap(paragraph,p,top+76,body_width,16,'body',C['text'],1.6);b+=rendered
 y=top+76+h+27;b+=button('Create my world',p,y,202,48,16)
 follow='Your world will bloom as you tend it and friends visit.'
 rendered,h2=wrap(follow,p,y+79,body_width,15,'body',C['muted'],1.6);b+=rendered
 foot=y+79+h2+40;footer_h=154 if w>=500 else 174
 b+=f'<g transform="translate(0 {foot})">'+email_footer(w)+'</g>'
 return b,round(foot+footer_h)
for w in [600,360]:
 current=f'Worldling-Email-Preview-{w*2}px';b,h=email_complete(w);save(current,'email',b,w,h,2,description=f'Email layout preview at {w}px logical width')

(ROOT/'06-source/copy-and-layout.json').write_text(json.dumps(copy,ensure_ascii=False,indent=2))
(ROOT/'03-guide/application-index.json').write_text(json.dumps({'brand':'Worldling','step':6,'assets':manifest},ensure_ascii=False,indent=2))
print(json.dumps({'exported_images':len(manifest),'assets':[(m['name'],m['png_size']) for m in manifest]},ensure_ascii=False))
