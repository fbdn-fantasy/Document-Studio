"""Linux runtime acceptance against the original cross-platform fixture image.

Run runtime-linux/bin/python3 -I -B ocr/test_linux_inference.py.
The supplied image contains editable prose, a wired table, and E=mc².
No fonts, network, source downloads, or host Python packages are required.
"""
from pathlib import Path
import json,sys,time
from PIL import Image
root=Path(__file__).resolve().parent
sys.path.insert(0,str(root))
import inference
out=root.parent/'test/linux-ocr-evidence'
out.mkdir(parents=True,exist_ok=True)
started=time.monotonic()
result=inference.analyze_image(Image.open(root.parent/'test/ocr-evidence/synthetic-document.png'),progress=lambda msg:print(msg,file=sys.stderr,flush=True))
result.pop('image').save(out/'corrected-document.png')
result['duration_seconds']=round(time.monotonic()-started,2)
(out/'analysis.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
recognized='\n'.join(b.get('text','')+' '+' '.join(c.get('text','') for c in b.get('cells',[])) for b in result['blocks'])
assert 'Document Studio' in recognized,recognized
assert 'Copper' in recognized,recognized
tables=[b for b in result['blocks'] if b['type']=='table'];assert tables,'Wired table not detected'
assert any(c['row']==1 and c['col']==0 and c['text']=='Copper' for c in tables[0]['cells']),tables[0]['cells']
assert any(c['row']==2 and c['col']==1 and '20' in c['text'] for c in tables[0]['cells']),tables[0]['cells']
formulas=[b for b in result['blocks'] if b['type']=='formula'];assert formulas,'Formula not recognized'
assert 'E' in formulas[0]['latex'] and 'm' in formulas[0]['latex'],formulas
print(json.dumps({'ok':True,'blocks':len(result['blocks']),'types':[b['type'] for b in result['blocks']],'seconds':result['duration_seconds'],'warnings':result['warnings']}))
