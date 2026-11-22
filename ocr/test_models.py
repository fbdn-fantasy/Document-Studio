"""Exercises every supplied model with real CPU predictions and offline sockets."""
from pathlib import Path
import json
import sys
import time
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
import inference

def main():
    inference.deny_network()
    out=ROOT.parent/'test'/'ocr-evidence'
    out.mkdir(parents=True,exist_ok=True)
    report={}
    font=ImageFont.truetype('C:/Windows/Fonts/cambria.ttc',64)
    formula=Image.new('RGB',(600,160),'white')
    ImageDraw.Draw(formula).text((40,40),'E = mc²',font=font,fill='black')
    formula.save(out/'formula.png')
    t=time.monotonic()
    result=inference._predict('formula',np.array(formula)[:,:,::-1].copy())
    text=str(result.get('rec_formula',''))
    assert text and 'E' in text and 'm' in text,text
    report['formula']={'latex':text,'seconds':round(time.monotonic()-t,2)}
    print(report['formula'],flush=True)
    page=Image.open(out/'synthetic-document.png').convert('RGB')
    rotated=page.rotate(90,expand=True)
    result=inference.analyze_image(rotated)
    texts=' '.join(b.get('text','') for b in result['blocks'])
    assert 'Document Studio' in texts,texts
    assert result['width']==page.width and result['height']==page.height
    report['rotated_page']={'warnings':result['warnings'],'text_recognized':True}
    result['image'].save(out/'rotation-corrected.png')
    table=Image.new('RGB',(980,220),'white')
    draw=ImageDraw.Draw(table)
    tf=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',32)
    for i,row in enumerate([('Material','Mass'),('Copper','12 kg'),('Iron','20 kg')]):
        draw.text((20,15+70*i),row[0],font=tf,fill='black')
        draw.text((510,15+70*i),row[1],font=tf,fill='black')
    table.save(out/'wireless-table.png')
    t=time.monotonic()
    result=inference._predict('wireless',np.array(table)[:,:,::-1].copy())
    structure=''.join(result.get('structure',[]))
    assert '<td' in structure and '<tr>' in structure,structure
    report['wireless']={'html':structure,'seconds':round(time.monotonic()-t,2)}
    print(report['wireless'],flush=True)
    t=time.monotonic()
    result=inference._predict('unwarp',np.array(page.resize((620,877)))[:,:,::-1].copy())
    corrected=np.asarray(result['doctr_img'])
    assert corrected.ndim==3 and corrected.size>0
    Image.fromarray(corrected[:,:,::-1]).save(out/'uvdoc-result.png')
    report['uvdoc']={'shape':list(corrected.shape),'seconds':round(time.monotonic()-t,2)}
    (out/'model-tests.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({'ok':True,'tests':report}),flush=True)

if __name__=='__main__': main()
