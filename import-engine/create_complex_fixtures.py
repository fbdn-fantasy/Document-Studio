"""Real photographed-document and complex scientific layout acceptance inputs."""
from pathlib import Path
import sys
import cv2,numpy as np
from PIL import Image,ImageDraw,ImageFont
root=Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True)
f=lambda size,bold=False:ImageFont.truetype('C:/Windows/Fonts/arial'+('bd' if bold else '')+'.ttf',size)
im=Image.new('RGB',(1800,2400),'white');d=ImageDraw.Draw(im)
d.text((130,130),'SCIENCE WORKSHEET',font=f(70,True),fill='black')
for x,texts in [(130,['Left column','The experiment measures mass.','Record every observation.']),(980,['Right column','The energy remains constant.','Check the units carefully.'])]:
 for i,t in enumerate(texts):d.text((x,330+i*80),t,font=f(38,i==0),fill='black')
d.text((130,630),'Results table',font=f(48,True),fill='black')
for y in (760,890,1020,1150):d.line((130,y,1640,y),fill='black',width=4)
for x in (130,1640):d.line((x,760,x,1150),fill='black',width=4)
d.line((880,890,880,1150),fill='black',width=4)
for x,y,t in [(550,795,'MEASUREMENTS'),(170,930,'Length'),(930,930,'12 centimetres'),(170,1060,'Mass'),(930,1060,'20 grams')]:d.text((x,y),t,font=f(42),fill='black')
d.text((130,1330),'Energy is described by this equation.',font=f(42),fill='black')
d.text((540,1460),'E = mc²',font=f(100),fill='black')
d.text((130,1710),'Conclusions',font=f(48,True),fill='black');d.text((130,1810),'The source diagram must remain visible.',font=f(42),fill='black')
d.ellipse((160,1940,510,2290),outline='#174b7a',width=8);d.line((160,2115,510,2115),fill='#174b7a',width=5)
d.text((650,2070),'Scientific illustration',font=f(42),fill='black')
im.save(root/'complex.png')
source=np.float32([[0,0],[1799,0],[1799,2399],[0,2399]])
dest=np.float32([[370,170],[2140,350],[2310,2620],[180,2470]])
matrix=cv2.getPerspectiveTransform(source,dest)
photo=cv2.warpPerspective(cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR),matrix,(2560,2800),borderValue=(100,108,115))
cv2.imwrite(str(root/'perspective-photo.jpg'),photo,[cv2.IMWRITE_JPEG_QUALITY,92])
print(root)
