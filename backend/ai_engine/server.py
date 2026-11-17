import os
import sys
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .models_manager import model_manager
from .deepfake_engine import analyze_image, analyze_video
from .ocr_engine import extract_ocr_text
from .nlp_engine import analyze_nlp_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("trace.api")

INTERNAL_AI_TOKEN = os.environ.get("AI_ENGINE_INTERNAL_TOKEN", "trace-internal-ai-bridge-local")

app = FastAPI(
    title="TRACE Local AI Inference Engine",
    description="High-performance, CPU-optimized local deepfake, OCR, and NLP forensic inference engine",
    version="1.0.0"
)

# Restricted CORS: Only allow local Node.js Express server
ALLOWED_CORS_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

async def verify_internal_auth(request: Request):
    """Restricts engine endpoints to authorized internal bridge caller."""
    token = request.headers.get("x-internal-ai-token")
    if INTERNAL_AI_TOKEN and token != INTERNAL_AI_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing internal AI authentication token."
        )

@app.get("/health")
def health_check():
    """Returns local AI engine health, loaded models, and device diagnostics."""
    status = model_manager.get_status()
    return {
        "status": "OPERATIONAL",
        "engine": "TRACE Local AI Multi-Pillar Sentinel",
        "device": status["device"],
        "cpu_threads": status["cpu_threads"],
        "models": status["models"]
    }

@app.post("/api/detect/image", dependencies=[Depends(verify_internal_auth)])
def detect_image_endpoint(payload: Dict[str, Any] = Body(...)):
    """Local image deepfake & manipulation detection."""
    image_data = payload.get("image") or payload.get("imageBase64") or payload.get("mediaUrl")
    if not image_data:
        raise HTTPException(status_code=400, detail="Missing image or imageBase64 in request body.")
    if len(str(image_data)) > 35 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload exceeds maximum 35MB boundary.")
    user_desc = payload.get("description", "")

    try:
        result = analyze_image(image_data, user_description=user_desc)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Image detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect/video", dependencies=[Depends(verify_internal_auth)])
def detect_video_endpoint(payload: Dict[str, Any] = Body(...)):
    """Local video deepfake & temporal consistency detection."""
    video_data = payload.get("video") or payload.get("videoBase64") or payload.get("mediaUrl") or payload.get("filePath")
    if not video_data:
        raise HTTPException(status_code=400, detail="Missing video, videoBase64, or filePath in request body.")
    # Safe boundary: cap sampled frames to 30 max to prevent DoS
    max_frames = min(max(int(payload.get("maxFrames", 10)), 1), 30)

    try:
        result = analyze_video(video_data, max_sampled_frames=max_frames)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Video detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ocr", dependencies=[Depends(verify_internal_auth)])
def ocr_endpoint(payload: Dict[str, Any] = Body(...)):
    """Local OCR chyron & text extraction."""
    image_data = payload.get("image") or payload.get("imageBase64") or payload.get("mediaUrl")
    if not image_data:
        raise HTTPException(status_code=400, detail="Missing image or imageBase64 in request body.")

    try:
        result = extract_ocr_text(image_data)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/text", dependencies=[Depends(verify_internal_auth)])
def analyze_text_endpoint(payload: Dict[str, Any] = Body(...)):
    """Local NLP burstiness & perplexity text analysis."""
    text = payload.get("text", "")
    if not text or len(text.strip()) < 15:
        raise HTTPException(status_code=400, detail="Text must be at least 15 characters long.")

    try:
        result = analyze_nlp_text(text)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("AI_ENGINE_PORT", 5001))
    logger.info(f"Starting TRACE Local AI Inference Engine on port {port}...")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
