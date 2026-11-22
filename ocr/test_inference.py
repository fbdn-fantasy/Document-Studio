"""Real, offline CPU inference acceptance checks. Run with bundled runtime."""
from pathlib import Path
import json
import os
import sys
import time
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
import inference

def main():
    out=ROOT.parent / "test" / "ocr-evidence"
    out.mkdir(parents=True,exist_ok=True)
    font=ImageFont.truetype("C:/Windows/Fonts/arial.ttf",32)
    title=ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",48)
    page=Image.new("RGB",(1240,1754),"white")
    draw=ImageDraw.Draw(page)
    draw.text((110,100),"Document Studio acceptance",font=title,fill="black")
    for y,text in enumerate(["Physics and chemistry are editable.","The measured speed is 24 metres per second.","This offline test contains original text."]):
        draw.text((110,210+y*65),text,font=font,fill="black")
    for y in [500,570,640,710]: draw.line((110,y,1090,y),fill="black",width=3)
    for x in [110,600,1090]: draw.line((x,500,x,710),fill="black",width=3)
    for i,row in enumerate([("Material","Mass"),("Copper","12 kg"),("Iron","20 kg")]):
        draw.text((130,515+70*i),row[0],font=font,fill="black")
        draw.text((620,515+70*i),row[1],font=font,fill="black")
    draw.text((450,820),"E = mc²",font=ImageFont.truetype("C:/Windows/Fonts/cambria.ttc",64),fill="black")
    page.save(out / "synthetic-document.png")
    t=time.monotonic()
    result=inference.analyze_image(page,progress=lambda msg:print(msg,file=sys.stderr,flush=True))
    result.pop("image").save(out / "corrected-document.png")
    result["duration_seconds"]=round(time.monotonic()-t,2)
    (out / "analysis.json").write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    recognized="\n".join(block.get("text","")+" "+" ".join(c.get("text","") for c in block.get("cells",[])) for block in result["blocks"])
    assert "Document Studio" in recognized,recognized
    assert "Copper" in recognized,recognized
    tables=[b for b in result["blocks"] if b["type"]=="table"]
    assert tables,"The wired table was not detected"
    cells=tables[0]["cells"]
    assert any(c["row"]==1 and c["col"]==0 and c["text"]=="Copper" for c in cells),cells
    assert any(c["row"]==2 and c["col"]==1 and "20" in c["text"] for c in cells),cells
    formulas=[b for b in result["blocks"] if b["type"]=="formula"]
    assert formulas,"The displayed equation was not recognized"
    assert 'E' in formulas[0]['latex'] and 'm' in formulas[0]['latex'],formulas
    print(json.dumps({"ok":True,"blocks":len(result["blocks"]),"types":[b["type"] for b in result["blocks"]],"seconds":result["duration_seconds"],"warnings":result["warnings"]}))

if __name__=="__main__": main()
