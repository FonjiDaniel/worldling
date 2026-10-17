"""Build the Step 6 lookbook and overview after build_applications.py.
Requires reportlab, fonttools and Pillow. No network access.
"""
from pathlib import Path
import tempfile
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont as FontToolsFont
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'03-guide';PNG=ROOT/'01-images';ASSETS=ROOT/'04-assets'
TMP=tempfile.TemporaryDirectory(prefix='worldling-app-fonts-')
FONTDIR=Path(TMP.name)
for name,file,axes in [('Display','BricolageGrotesque-variable.ttf',{'wght':650,'wdth':100,'opsz':48}),('Body','Geist-variable.ttf',{'wght':400}),('Bold','Geist-variable.ttf',{'wght':600})]:
 f=instantiateVariableFont(FontToolsFont(ASSETS/'fonts'/file),axes,inplace=False)
 path=FONTDIR/f'{name}.ttf';f.save(path);pdfmetrics.registerFont(TTFont(name,str(path)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
VOID='#07071A';SURFACE='#11122B';TEXT='#F4F1EA';MUTED='#9A9BB8';ACCENT='#3FE0C5';LINE='#34365A'
W=1000;H=1120;page=0
c=canvas.Canvas(str(OUT/'Worldling-Applications-Guide.pdf'),pagesize=(W,H))
c.setTitle('Worldling | Step 6 Applications');c.setAuthor('Worldling')
def tx(s,x,y,size=14,font='Body',color=TEXT):
 assert '\u2014' not in s
 assert x+pdfmetrics.stringWidth(s,font,size)<=W-48,(page,s)
 c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,H-y-size*.82,s)
def para(s,x,y,w,size=14,color=MUTED):
 p=Paragraph(s,ParagraphStyle('body',fontName='Body',fontSize=size,leading=size*1.5,textColor=HexColor(color)))
 _,h=p.wrap(w,1000);assert y+h<1052,(page,s,y+h);p.drawOn(c,x,H-y-h);return h
def line(y):
 c.setStrokeColor(HexColor(LINE));c.setLineWidth(.7);c.line(58,H-y,942,H-y)
def pic(file,x,y,w):
 im=Image.open(PNG/file);im.load();h=im.height*w/im.width
 c.drawImage(ImageReader(im),x,H-y-h,w,h,mask='auto');return h
def new(label,title,sub):
 global page
 if page:c.showPage()
 page+=1;c.setFillColor(HexColor(VOID));c.rect(0,0,W,H,fill=1,stroke=0)
 tx('WORLDLING / 06 APPLICATIONS / '+label,58,39,10,'Bold',ACCENT)
 tx(title,58,82,42,'Display');para(sub,58,142,884,14)
 line(1060);tx('Grow a world of your own.',58,1082,10,'Body',MUTED);tx(f'APPLICATIONS / {page:02d}',837,1082,10,'Bold',MUTED)

new('SOCIAL SHARING','A little world, ready to share.','The approved logo, calm space and one living world connect every application.')
tx('OPEN GRAPH / 1200 x 630',58,193,11,'Bold',ACCENT)
pic('social/Worldling-OG-1200x630.png',58,220,884)
tx('X HEADER / 1500 x 500',58,714,11,'Bold',ACCENT)
pic('social/Worldling-X-Header-1500x500.png',58,742,884)

new('LAUNCH','Worldling is here.','A clear invitation, warm action color and plenty of room around the planet.')
tx('INSTAGRAM POST / 1080 x 1350',58,202,11,'Bold',ACCENT)
tx('INSTAGRAM STORY / 1080 x 1920',584,202,11,'Bold',ACCENT)
pic('social/Worldling-Instagram-Post-1080x1350.png',58,234,458)
pic('social/Worldling-Instagram-Story-1080x1920.png',584,234,358)
para('The post leads with the original tagline. The planet fills the lower half while retaining its complete silhouette.',58,843,458)
para('The story centers the invitation and reserves generous space above and below the content.',584,910,358)
para('The drawn call to action is part of the image. Add a destination using the publishing surface’s available link controls.',58,1004,884,12)

new('MOBILE PRODUCT','A world worth visiting.','The planet takes the first glance. Its owner, growth and a kind action follow naturally.')
pic('product/Worldling-Mobile-World-1170x2532.png',66,214,350)
for y,title,body in [
 (254,'A living first impression','The painterly world fills the top of the page. The approved logo stays quiet in the navigation.'),
 (420,'A person behind the planet','Éclats d’aurore belongs to Mira, shown with @mira. These are fictional demonstration details.'),
 (586,'Growth, shown simply','The bloom card uses a separate mono value, a restrained Aurora progress line and a short supporting sentence.'),
 (752,'One warm action','Send a comet uses the Sunrise button. Explore the universe remains a quieter secondary path.')]:
 tx(title,482,y,25,'Display');para(body,482,y+45,434,15)
tx('390 x 844 logical pixels / PNG at 3x',482,975,12,'Bold',ACCENT)

new('DESKTOP PRODUCT','Room to make it yours.','A generous world preview sits beside a quiet control panel with familiar, visible choices.')
pic('product/Worldling-Desktop-Creator-1600x1000.png',58,229,884)
tx('A clear control panel',58,828,25,'Display')
para('Six world presets come from the approved moodboard. Verdant is selected. Terrain, cloud cover, ocean and landscape colors give the panel a simple rhythm.',58,873,417,15)
tx('The world stays central',524,828,25,'Display')
para('The full planet silhouette remains visible. Preview and Save my world support the creation flow. This is a static screen design.',524,873,418,15)
tx('1600 x 1000 pixels',58,1005,12,'Bold',ACCENT)

new('EMAIL','A calm welcome, at any width.','Simple dark header and footer designs, supplied separately and in complete layout previews.')
tx('DESKTOP / 600px LOGICAL WIDTH',58,204,11,'Bold',ACCENT)
tx('MOBILE / 360px LOGICAL WIDTH',608,204,11,'Bold',ACCENT)
pic('email/Worldling-Email-Preview-1200px.png',58,235,510)
pic('email/Worldling-Email-Preview-720px.png',608,235,334)
para('Exported at 2x. Keep body copy, buttons and footer links as live HTML when implementing the email. The supplied PNGs are visual designs.',58,961,884,14)
para('The kit includes individual headers and footers at both widths, matching SVGs, the share-template configuration and rebuild source.',58,1012,884,12)
c.save()

# One-page visual overview. Exact-size deliverables remain separate PNGs.
SW=1600;SH=1940
sheet=Image.new('RGB',(SW,SH),VOID);draw=ImageDraw.Draw(sheet)
font=lambda name,size:ImageFont.truetype(str(FONTDIR/f'{name}.ttf'),size)
draw.text((48,36),'Worldling',font=font('Display',46),fill=TEXT)
draw.text((48,95),'Step 6 / Applications',font=font('Body',25),fill=MUTED)
items=[
 ('01 / OPEN GRAPH','1200 x 630','social/Worldling-OG-1200x630.png'),
 ('02 / X HEADER','1500 x 500','social/Worldling-X-Header-1500x500.png'),
 ('03 / INSTAGRAM POST','1080 x 1350','social/Worldling-Instagram-Post-1080x1350.png'),
 ('04 / INSTAGRAM STORY','1080 x 1920','social/Worldling-Instagram-Story-1080x1920.png'),
 ('05 / MOBILE WORLD PAGE','390 x 844 at 3x','product/Worldling-Mobile-World-1170x2532.png'),
 ('06 / DESKTOP CREATOR','1600 x 1000','product/Worldling-Desktop-Creator-1600x1000.png'),
 ('07 / EMAIL, DESKTOP','600px at 2x','email/Worldling-Email-Preview-1200px.png'),
 ('08 / EMAIL, MOBILE','360px at 2x','email/Worldling-Email-Preview-720px.png')]
for i,(label,dims,path) in enumerate(items):
 col=i%2;row=i//2;x=48+col*800;y=162+row*438
 draw.text((x,y),label,font=font('Bold',17),fill=ACCENT)
 draw.text((x+704-draw.textlength(dims,font=font('Body',15)),y+1),dims,font=font('Body',15),fill=MUTED)
 im=Image.open(PNG/path).convert('RGB');im.thumbnail((704,365),Image.Resampling.LANCZOS)
 sheet.paste(im,(round(x+(704-im.width)/2),y+42))
 draw.line((x,y+418,x+704,y+418),fill=LINE,width=1)
sheet.save(OUT/'Worldling-Applications-Overview.png')
print('Created 5-page guide and application overview.')
