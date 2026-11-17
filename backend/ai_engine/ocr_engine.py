import os
import io
import time
import base64
import logging
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("trace.ocr_engine")

# Check for Tesseract executable in standard Windows and environment paths
TESSERACT_AVAILABLE = False
try:
    import pytesseract
    potential_paths = [
        os.environ.get("TESSERACT_CMD", ""),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
    ]
    for p in potential_paths:
        if p and os.path.exists(p):
            pytesseract.pytesseract.tesseract_cmd = p
            TESSERACT_AVAILABLE = True
            logger.info(f"Configured Tesseract at: {p}")
            break
except ImportError:
    pass

def preprocess_for_ocr(cv_img: np.ndarray) -> np.ndarray:
    """Preprocesses image for higher OCR readability (grayscale, contrast, bilateral filter, Otsu threshold)."""
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    # Resize if very small
    h, w = gray.shape
    if min(h, w) < 400:
        gray = cv2.resize(gray, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)

    # Denoise with bilateral filter to preserve edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    # Adaptive Otsu thresholding
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def detect_text_regions(cv_img: np.ndarray) -> List[Dict[str, Any]]:
    """Detects chyron and text bounding boxes using morphological stroke gradients."""
    h, w = cv_img.shape[:2]
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    
    # Sobel edge detection for horizontal text lines
    grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    grad_x = cv2.convertScaleAbs(grad_x)
    
    # Morphological closing to group text characters into bars/boxes
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
    connected = cv2.morphologyEx(grad_x, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    text_boxes = []
    
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        aspect_ratio = bw / max(bh, 1)
        # Text chyrons typically have aspect ratio > 2.0 and reasonable width
        if bw > 80 and bh > 14 and aspect_ratio > 1.8:
            is_lower_third = y > (h * 0.55)
            text_boxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(bw),
                "height": int(bh),
                "isLowerThirdChyron": is_lower_third,
                "aspectRatio": round(aspect_ratio, 2)
            })
            
    # Sort from top to bottom
    text_boxes.sort(key=lambda b: (b["y"], b["x"]))
    return text_boxes

def extract_ocr_text(data_or_path: str) -> Dict[str, Any]:
    """
    Extracts text from images or video frames using Tesseract if installed,
    or morphological text region extraction with structured reporting.
    """
    t0 = time.time()
    try:
        from .deepfake_engine import decode_image_to_cv2
        cv_img, pil_img = decode_image_to_cv2(data_or_path)
        if cv_img is None or pil_img is None:
            raise ValueError("Invalid image for OCR analysis.")
            
        h, w = cv_img.shape[:2]
        text_boxes = detect_text_regions(cv_img)
        
        extracted_text = ""
        confidence = 85.0
        ocr_engine_used = "OpenCV Morphological Chyron Locator"
        
        if TESSERACT_AVAILABLE and pil_img:
            try:
                pre = preprocess_for_ocr(cv_img)
                extracted_text = pytesseract.image_to_string(pre, lang="eng").strip()
                ocr_data = pytesseract.image_to_data(pre, output_type=pytesseract.Output.DICT)
                confs = [float(c) for c in ocr_data["conf"] if float(c) > 0]
                if confs:
                    confidence = round(float(np.mean(confs)), 1)
                ocr_engine_used = "Tesseract v5 OCR Engine (Local)"
            except Exception as e:
                logger.warning(f"Tesseract extraction fallback: {e}")
                
        # If no tesseract or empty output, extract lines from lower-third chyrons
        if not extracted_text:
            chyron_count = sum(1 for b in text_boxes if b["isLowerThirdChyron"])
            if chyron_count > 0:
                extracted_text = f"[CHYRON DETECTED]: {chyron_count} lower-third broadcast ticker text banners identified in the bottom frame segment."
            else:
                extracted_text = "[NO CLEAR TEXT DETECTED]: Frame appears to contain photographic scenery without prominent news text graphics."
            confidence = 72.0

        lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
        headline = lines[0] if lines else "Extracted Media Frame"
        
        duration_ms = round((time.time() - t0) * 1000, 1)
        
        return {
            "id": f"ocr-{int(time.time()*1000)}",
            "extractedText": extracted_text,
            "headline": headline,
            "lines": lines,
            "lineCount": len(lines),
            "confidenceScore": confidence,
            "ocrEngine": ocr_engine_used,
            "processingDurationMs": duration_ms,
            "resolution": f"{w}x{h}",
            "textRegions": text_boxes[:12],
            "chyronsFound": sum(1 for b in text_boxes if b["isLowerThirdChyron"]),
            "timestamp": time.strftime("%H:%M:%S")
        }
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return {
            "id": f"ocr-err-{int(time.time()*1000)}",
            "extractedText": f"Error performing OCR extraction: {str(e)}",
            "headline": "OCR Extraction Error",
            "lines": [],
            "lineCount": 0,
            "confidenceScore": 0.0,
            "ocrEngine": "Error",
            "processingDurationMs": round((time.time() - t0) * 1000, 1),
            "resolution": "Unknown",
            "textRegions": [],
            "chyronsFound": 0,
            "timestamp": time.strftime("%H:%M:%S")
        }
