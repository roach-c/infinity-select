import json,sys,io,urllib.request
from PIL import Image,ImageDraw
IMG=json.loads(open('docs/images.js').read().split('\n')[0].split('=',1)[1].rstrip(';'))
o=json.load(open('tools/face_overrides.json')); names=[k for k,v in o.items() if v]
S=Image.new('RGB',(len(names)*110,130),'white');d=ImageDraw.Draw(S)
for n,k in enumerate(names):
    im=Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(IMG[k],headers={'User-Agent':'x'})).read())).convert('RGB')
    W,H=im.size;cx,cy,s=o[k];s=s*H/2
    S.paste(im.crop((int(cx*W-s),int(cy*H-s),int(cx*W+s),int(cy*H+s))).resize((100,100)),(n*110,0));d.text((n*110,104),str(n)+' '+k.split(' - ')[1][:14],fill='black')
S.save(sys.argv[1])
