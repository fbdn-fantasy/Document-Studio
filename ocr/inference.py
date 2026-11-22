"""Document Studio's offline CPU document analysis, using supplied Paddle models.

All bounding boxes use pixels in the returned (possibly corrected) page image.
Model instances are retained only for this worker's lifetime. Large structure
predictors are evicted between uses to bound memory use on CPU-only machines.
"""
from __future__ import annotations

import contextlib
import gc
import html
import os
import re
from pathlib import Path
import socket
import sys
import tempfile

os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
os.environ.setdefault("PADDLE_PDX_CACHE_HOME", str(Path(tempfile.gettempdir()) / "DocumentStudio-inference"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("MODELSCOPE_OFFLINE", "1")
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("DOCUMENT_STUDIO_CACHE", str(Path(tempfile.gettempdir()) / "DocumentStudio-inference"))
os.environ.setdefault("PADDLE_EXTENSION_DIR", str(Path(tempfile.gettempdir()) / "DocumentStudio-inference" / "extensions"))

ROOT = Path(__file__).resolve().parent
MODELS = {
    "layout": ("PP-DocLayout-M", "Doc Layout", "LayoutDetection"),
    "formula": ("PP-FormulaNet_plus-S", "Formulanet plus s", "FormulaRecognition"),
    "orientation": ("PP-LCNet_x1_0_doc_ori", "LC Net Doc Orientation", "DocImgOrientationClassification"),
    "wired": ("SLANeXt_wired", "Slanext wired", "TableStructureRecognition"),
    "wireless": ("SLANeXt_wireless", "Slanext wireless", "TableStructureRecognition"),
    "unwarp": ("UVDoc", "UV Doc", "TextImageUnwarping"),
}
_ocr = None
_small = {}
_large = {}


def deny_network():
    """Defense in depth: the inference worker never downloads models or sends data."""
    def blocked(*args, **kwargs):
        raise OSError("Document Studio conversion is offline; network access is disabled")
    socket.create_connection = blocked
    socket.socket.connect = blocked
    socket.socket.connect_ex = blocked


def _progress(callback, message):
    if callback:
        callback(message)


def _model(kind):
    global _large
    small = kind == "orientation"
    cache = _small if small else _large
    if kind not in cache:
        if not small:
            for item in list(_large.values()):
                with contextlib.suppress(Exception):
                    item.close()
            _large.clear()
            gc.collect()
        import paddleocr
        name, folder, cls = MODELS[kind]
        path = ROOT / "models" / folder
        for filename in ("inference.json", "inference.pdiparams", "inference.yml"):
            if not (path / filename).is_file():
                raise RuntimeError(f"Missing bundled {name} resource: {filename}. Run installer Repair.")
        with contextlib.redirect_stdout(sys.stderr):
            cache[kind] = getattr(paddleocr, cls)(
                model_name=name, model_dir=str(path), device="cpu",
                enable_mkldnn=False, cpu_threads=4,
            )
    return cache[kind]


def _predict(kind, image):
    with contextlib.redirect_stdout(sys.stderr):
        return _model(kind).predict(image)[0]


def _read_text(image):
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR
        with contextlib.redirect_stdout(sys.stderr):
            _ocr = PaddleOCR(
                text_detection_model_name="PP-OCRv5_mobile_det",
                text_detection_model_dir=str(ROOT / "models" / "Mobile Det"),
                text_recognition_model_name="PP-OCRv5_mobile_rec",
                text_recognition_model_dir=str(ROOT / "models" / "Mobile Rec"),
                textline_orientation_model_name="PP-LCNet_x1_0_textline_ori",
                textline_orientation_model_dir=str(ROOT / "models" / "Text Line Orientation"),
                use_doc_orientation_classify=False, use_doc_unwarping=False,
                use_textline_orientation=True, device="cpu", enable_mkldnn=False,
                cpu_threads=4, text_det_limit_side_len=1536,
            )
    with contextlib.redirect_stdout(sys.stderr):
        return _ocr.predict(image)[0]


def _bbox(poly):
    import numpy as np
    points = np.asarray(poly).reshape(-1, 2)
    return [float(points[:, 0].min()), float(points[:, 1].min()),
            float(points[:, 0].max()), float(points[:, 1].max())]


def _inside(a, b):
    cx, cy = (a[0] + a[2]) / 2, (a[1] + a[3]) / 2
    return b[0] <= cx <= b[2] and b[1] <= cy <= b[3]


def _formula_candidate(text):
    """Conservative fallback for isolated equations missed by layout detection."""
    if not 3 <= len(text) <= 140 or not re.search(r"[=≈≠≤≥∑∫√]",text):
        return False
    if re.search(r"https?://|www\.|@",text,re.I):
        return False
    words=re.findall(r"[A-Za-z]+",text)
    allowed={"sin","cos","tan","cot","sec","csc","log","ln","lim","max","min","exp","sqrt"}
    if any(len(word)>3 and word.lower() not in allowed for word in words):
        return False
    if any(word.lower() in {"the","and","for","are","is","was","has","this","that"} for word in words):
        return False
    return bool(re.search(r"[0-9A-Za-zα-ωΑ-Ω]",text))


def _crop(image, bbox):
    h, w = image.shape[:2]
    x0, y0, x1, y1 = map(int, bbox)
    return image[max(0, y0):min(h, y1), max(0, x0):min(w, x1)].copy()


def _page_correction(image, rectify, warnings):
    """Conservative page quad correction, followed by model-assisted unwarping.

    A page outline must occupy 30–95% of the image. Full-bleed scans are left
    unchanged. UVDoc is used only when the outline is clearly nonrectangular.
    """
    import cv2
    import numpy as np
    if not rectify:
        return image
    h, w = image.shape[:2]
    scale = min(1.0, 1200 / max(h, w))
    reduced = cv2.resize(image, None, fx=scale, fy=scale)
    gray = cv2.cvtColor(reduced, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 50, 150)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image
    contour = max(contours, key=cv2.contourArea)
    fraction = cv2.contourArea(contour) / (reduced.shape[0] * reduced.shape[1])
    if not 0.30 < fraction < 0.95:
        return image
    approximation = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
    if len(approximation) == 4 and cv2.isContourConvex(approximation):
        points = approximation.reshape(4, 2).astype("float32") / scale
        sums, differences = points.sum(axis=1), np.diff(points, axis=1).ravel()
        ordered = np.array([points[np.argmin(sums)], points[np.argmin(differences)],
                            points[np.argmax(sums)], points[np.argmax(differences)]], dtype="float32")
        if len(np.unique(ordered, axis=0)) != 4:
            return image
        tl, tr, br, bl = ordered
        width = int(max(np.linalg.norm(tr-tl), np.linalg.norm(br-bl)))
        height = int(max(np.linalg.norm(bl-tl), np.linalg.norm(br-tr)))
        if min(width, height) < 200:
            return image
        target = np.array([[0, 0], [width-1, 0], [width-1, height-1], [0, height-1]], dtype="float32")
        image = cv2.warpPerspective(image, cv2.getPerspectiveTransform(ordered, target), (width, height), borderValue=(255,255,255))
        warnings.append("A photographed page outline was perspective-corrected. Review edges and cropping.")
    elif len(approximation) > 4:
        result = _predict("unwarp", image)
        candidate = result.get("doctr_img", result.get("output_img"))
        if candidate is not None and candidate.size:
            image = candidate
            warnings.append("UVDoc corrected a potentially curved page. Review the corrected page against the original.")
    return image


def _deskew(image):
    import cv2
    import numpy as np
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 70, 180)
    h, w = gray.shape
    lines = cv2.HoughLinesP(edges, 1, np.pi / 1800, threshold=100,
                            minLineLength=max(80, w // 7), maxLineGap=15)
    if lines is None:
        return image, 0.0
    angles = []
    for x1, y1, x2, y2 in lines[:, 0]:
        angle = float(np.degrees(np.arctan2(y2-y1, x2-x1)))
        if abs(angle) < 8:
            angles.append(angle)
    if len(angles) < 5:
        return image, 0.0
    angle = float(np.median(angles))
    if abs(angle) < 0.25 or np.std(angles) > 2:
        return image, 0.0
    matrix = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)
    return cv2.warpAffine(image, matrix, (w,h), flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=(255,255,255)), angle


def _table(image, box, lines, confidence):
    import cv2
    import numpy as np
    from bs4 import BeautifulSoup
    crop = _crop(image, box)
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    ink = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    horizontal = cv2.morphologyEx(ink, cv2.MORPH_OPEN, np.ones((1,max(20,crop.shape[1]//12)),np.uint8))
    vertical = cv2.morphologyEx(ink, cv2.MORPH_OPEN, np.ones((max(20,crop.shape[0]//12),1),np.uint8))
    wired = np.count_nonzero(horizontal) > crop.shape[1]*1.5 and np.count_nonzero(vertical) > crop.shape[0]*1.5
    result = _predict("wired" if wired else "wireless", crop)
    structure = result.get("structure", [])
    markup = "".join(structure) if isinstance(structure, (list,tuple)) else str(structure)
    soup = BeautifulSoup(markup, "html.parser")
    rows = soup.find_all("tr")
    # Supplied SLANeXt exports include a legacy location output, but it is
    # not a reliable cell detector (coordinates can extend beyond the crop).
    # Use its trained HTML structure and recover coordinates independently.
    bboxes = []
    cells, occupied = [], set()
    index = 0
    for row_index, row in enumerate(rows):
        column = 0
        for td in row.find_all(["td","th"], recursive=False):
            while (row_index, column) in occupied:
                column += 1
            rowspan = max(1,min(100,int(td.get("rowspan",1))))
            colspan = max(1,min(100,int(td.get("colspan",1))))
            cell = {"row":row_index,"col":column,"rowspan":rowspan,"colspan":colspan,"text":""}
            if index < len(bboxes):
                local = _bbox(bboxes[index])
                cell["bbox"] = [local[0]+box[0],local[1]+box[1],local[2]+box[0],local[3]+box[1]]
            for rr in range(row_index,row_index+rowspan):
                for cc in range(column,column+colspan):
                    occupied.add((rr,cc))
            cells.append(cell)
            index += 1
            column += colspan
    if not cells or len(cells) > 10000:
        raise ValueError("The table model did not return a reliable cell structure")
    inferred_positions = not any(cell.get("bbox") for cell in cells)
    if inferred_positions:
        # SLANeXt predicts HTML structure, not cell coordinates. Recover ruling
        # boundaries where present, otherwise cluster actual OCR line centers
        # according to the predicted grid; preserve the spans from the model.
        row_count=max(cell["row"]+cell["rowspan"] for cell in cells)
        col_count=max(cell["col"]+cell["colspan"] for cell in cells)
        def boundaries(axis,count,rulings,extent,offset):
            projection=np.count_nonzero(rulings,axis=axis)
            points=np.flatnonzero(projection>max(10,np.max(projection)*0.45)) if np.max(projection)>0 else []
            groups=[]
            for point in points:
                if not groups or point-groups[-1][-1]>4:
                    groups.append([point])
                else:
                    groups[-1].append(point)
            peaks=[float(np.mean(group)) for group in groups]
            if len(peaks)==count+1:
                return [offset+value for value in peaks]
            centers=sorted((line["bbox"][axis]+line["bbox"][axis+2])/2 for line in lines)
            if len(centers)<count:
                return np.linspace(offset,offset+extent,count+1).tolist()
            means=np.array([centers[min(len(centers)-1,int((i+0.5)*len(centers)/count))] for i in range(count)])
            for _ in range(20):
                buckets=[[] for _ in range(count)]
                for center in centers:
                    buckets[int(np.argmin(abs(means-center)))].append(center)
                revised=np.array([np.mean(bucket) if bucket else means[i] for i,bucket in enumerate(buckets)])
                if np.max(abs(means-revised))<0.01:
                    break
                means=revised
            means.sort()
            return [offset]+[(means[i]+means[i+1])/2 for i in range(count-1)]+[offset+extent]
        xs=boundaries(0,col_count,vertical,crop.shape[1],box[0])
        ys=boundaries(1,row_count,horizontal,crop.shape[0],box[1])
        for cell in cells:
            cell["bbox"]=[xs[cell["col"]],ys[cell["row"]],xs[cell["col"]+cell["colspan"]],ys[cell["row"]+cell["rowspan"]]]
    def assign(cell,line):
        cell["text"] += ("\n" if cell["text"] else "") + line["text"]
        cell.setdefault("runs",[]).append({
            "text":line["text"],"font_size":line.get("font_size",12.0),
            "bbox":line["bbox"],"confidence":line.get("confidence",0.0),
            "bold":line.get("bold",False),
        })
        cell["font_size"]=float(np.median([run["font_size"] for run in cell["runs"]]))
        cell["paddingLeft"]=max(0.0,min(run["bbox"][0] for run in cell["runs"])-cell["bbox"][0])
    unmatched = []
    for line in lines:
        matches = [cell for cell in cells if cell.get("bbox") and _inside(line["bbox"],cell["bbox"])]
        if matches:
            cell = min(matches,key=lambda c:(c["bbox"][2]-c["bbox"][0])*(c["bbox"][3]-c["bbox"][1]))
            assign(cell,line)
        else:
            unmatched.append(line)
    if unmatched:
        # SLANeXt supplies structural coordinates, but detections can straddle a
        # cell boundary. Assign only when a cell rectangle exists, never invent text.
        for line in unmatched:
            candidates = [cell for cell in cells if cell.get("bbox")]
            if not candidates:
                raise ValueError("Table cell positions were unavailable")
            cx,cy=(line["bbox"][0]+line["bbox"][2])/2,(line["bbox"][1]+line["bbox"][3])/2
            cell=min(candidates,key=lambda c:((c["bbox"][0]+c["bbox"][2])/2-cx)**2+((c["bbox"][1]+c["bbox"][3])/2-cy)**2)
            assign(cell,line)
    for td,cell in zip(soup.find_all(["td","th"]),cells):
        td.string = cell["text"]
    return {"type":"table","bbox":box,"cells":cells,"html":str(soup),
            "confidence":float(result.get("structure_score",confidence)),
            "inferred_cell_positions":inferred_positions,
            "model":"SLANeXt_wired" if wired else "SLANeXt_wireless"}


def analyze_image(image, progress=None, rectify=False):
    """Analyze one PIL page. No input path is changed, and no network is used."""
    deny_network()
    import cv2
    import numpy as np
    from PIL import Image
    warnings = []
    if image.width*image.height > 50_000_000:
        raise ValueError("Document image exceeds the 50 megapixel safety limit")
    _progress(progress,"Detecting page orientation")
    array = cv2.cvtColor(np.asarray(image.convert("RGB")), cv2.COLOR_RGB2BGR)
    orientation = _predict("orientation", array)
    labels = orientation.get("label_names", [])
    scores = orientation.get("scores", [])
    angle = int(labels[0]) if len(labels) and len(scores) and float(scores[0]) >= 0.80 else 0
    if angle:
        # Paddle's label describes clockwise rotation of the source; undo it.
        array = np.rot90(array, k=angle//90).copy()
        warnings.append(f"Page orientation corrected by {angle} degrees; review the result.")
    _progress(progress,"Checking page geometry")
    array = _page_correction(array,rectify,warnings)
    array,skew = _deskew(array)
    if skew:
        warnings.append(f"Corrected approximately {skew:.1f} degrees of skew.")
    h,w = array.shape[:2]
    _progress(progress,"Finding document layout")
    layout = _predict("layout",array)
    regions = list(layout.get("boxes",[]))
    _progress(progress,"Recognizing editable text")
    recognized = _read_text(array)
    texts,scores = recognized.get("rec_texts",[]),recognized.get("rec_scores",[])
    polys = recognized.get("rec_polys",recognized.get("dt_polys",[]))
    lines=[]
    for i,text in enumerate(texts):
        if not str(text).strip() or i>=len(polys):
            continue
        box=_bbox(polys[i])
        score=float(scores[i]) if i<len(scores) else 0.0
        lines.append({"type":"text","bbox":box,"text":str(text),"confidence":score,
                      "font_size":max(5.0,(box[3]-box[1])*0.76),"role":"text"})
    lines.sort(key=lambda item:(item["bbox"][1],item["bbox"][0]))
    blocks=[]
    consumed=set()
    for region in regions:
        label=str(region.get("label","text"))
        box=[float(x) for x in region.get("coordinate",[0,0,w,h])]
        confidence=float(region.get("score",0.0))
        if confidence<0.40 or len(box)!=4 or box[2]<=box[0] or box[3]<=box[1]:
            continue
        contained=[(i,line) for i,line in enumerate(lines) if _inside(line["bbox"],box)]
        if label in ("table","formula"):
            _progress(progress,"Recognizing table structure" if label=="table" else "Recognizing equation")
            try:
                if label=="table":
                    block=_table(array,box,[line for _,line in contained],confidence)
                    if block.get("inferred_cell_positions"):
                        warnings.append("Table structure came from SLANeXt; cell positions were reconstructed from ruling lines and OCR coordinates. Review cell assignments.")
                else:
                    result=_predict("formula",_crop(array,box))
                    latex=str(result.get("rec_formula",result.get("rec_text",""))).strip()
                    if not latex:
                        raise ValueError("No formula tokens returned")
                    block={"type":"formula","bbox":box,"latex":latex,"confidence":confidence}
                blocks.append(block)
                consumed.update(i for i,_ in contained)
            except Exception as exc:
                # Retain source pixels and recognized text for review instead of
                # throwing away uncertain scientific content.
                warnings.append(f"{label.title()} retained visually: {type(exc).__name__}: {str(exc)[:180]}")
                blocks.append({"type":"image","bbox":box,"role":label,"confidence":confidence,
                               "alt_text":"\n".join(line["text"] for _,line in contained)})
                consumed.update(i for i,_ in contained)
        elif label in ("image","chart","seal","header_image","footer_image","algorithm"):
            blocks.append({"type":"image","bbox":box,"role":label,"confidence":confidence})
            consumed.update(i for i,_ in contained)
        else:
            for _,line in contained:
                line["role"]=label
                if label in ("doc_title","paragraph_title"):
                    line["bold"]=True
    # Layout detection can label a short displayed equation as ordinary text.
    # Only mathematical-looking standalone lines get this additional genuine
    # recognition pass; ordinary prose/table content is never sent as a formula.
    for i,line in enumerate(lines):
        if i in consumed or not _formula_candidate(line["text"]):
            continue
        _progress(progress,"Recognizing equation")
        box=line["bbox"]
        padded=[max(0,box[0]-8),max(0,box[1]-8),min(w,box[2]+8),min(h,box[3]+8)]
        try:
            result=_predict("formula",_crop(array,padded))
        except Exception as exc:
            warnings.append(f"Possible equation retained as editable OCR text: {type(exc).__name__}: {str(exc)[:150]}")
            continue
        latex=str(result.get("rec_formula",result.get("rec_text",""))).strip()
        if latex:
            blocks.append({"type":"formula","bbox":box,"latex":latex,"confidence":line["confidence"],"ocr_text":line["text"]})
            consumed.add(i)
            warnings.append("A displayed equation was recognized from a mathematical text line. Review its symbols against the original.")
    blocks.extend(line for i,line in enumerate(lines) if i not in consumed)
    blocks.sort(key=lambda block:(block["bbox"][1],block["bbox"][0]))
    uncertain=sum(1 for line in lines if line["confidence"]<0.85)
    if uncertain:
        warnings.append(f"Review {uncertain} text line(s) with OCR confidence below 85%.")
    if not lines and not blocks:
        blocks=[{"type":"image","bbox":[0,0,w,h],"role":"unrecognized_page","confidence":0.0}]
        warnings.append("No text was recognized. The complete page has been retained as an image.")
    return {"width":w,"height":h,"image":Image.fromarray(cv2.cvtColor(array,cv2.COLOR_BGR2RGB)),
            "blocks":blocks,"warnings":warnings,"engine":"PaddleOCR 3.7.0 / PaddleX 3.7.2 CPU"}
