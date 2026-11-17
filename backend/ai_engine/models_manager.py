import os
import time
import logging
from typing import Dict, Any, Optional, Tuple
import cv2
import numpy as np
import torch
import torchvision.models as models
from torchvision.models import EfficientNet_B0_Weights

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("trace.ai_engine")

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

YUNET_MODEL_FILENAME = "face_detection_yunet_2023mar.onnx"
YUNET_MODEL_PATH = os.path.join(MODELS_DIR, YUNET_MODEL_FILENAME)
YUNET_DOWNLOAD_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"

class ModelManager:
    """
    Singleton Manager for TRACE local AI inference models.
    Caches loaded models in memory, tracks parameter sizes, and reports honest device diagnostics.
    """
    _instance: Optional["ModelManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.face_detector: Optional[cv2.FaceDetectorYN] = None
        self.feature_model: Optional[torch.nn.Module] = None
        self.models_loaded: Dict[str, Dict[str, Any]] = {}
        self._load_face_detector()
        self._load_feature_model()
        self._initialized = True

    def _ensure_yunet_downloaded(self) -> bool:
        if os.path.exists(YUNET_MODEL_PATH) and os.path.getsize(YUNET_MODEL_PATH) > 100000:
            return True
        logger.info(f"Downloading YuNet Face Detector weights to {YUNET_MODEL_PATH}...")
        try:
            import urllib.request
            req = urllib.request.Request(YUNET_DOWNLOAD_URL, headers={"User-Agent": "TRACE-AI/1.0"})
            with urllib.request.urlopen(req, timeout=15) as response, open(YUNET_MODEL_PATH, "wb") as out_file:
                out_file.write(response.read())
            logger.info("YuNet weights downloaded successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to download YuNet model: {e}")
            return False

    def _load_face_detector(self):
        t0 = time.time()
        if not self._ensure_yunet_downloaded():
            self.models_loaded["face_detector"] = {
                "name": "OpenCV YuNet",
                "status": "UNAVAILABLE",
                "error": "Model weights could not be loaded",
                "device": "N/A"
            }
            return

        try:
            detector = cv2.FaceDetectorYN_create(
                model=YUNET_MODEL_PATH,
                config="",
                input_size=(320, 320),
                score_threshold=0.6,
                nms_threshold=0.3,
                top_k=5000
            )
            self.face_detector = detector
            self.models_loaded["face_detector"] = {
                "name": "OpenCV YuNet Face Detector",
                "version": "2023mar ONNX",
                "status": "LOADED",
                "params": "0.23M",
                "device": "CPU (OpenCV DNN)",
                "load_time_ms": round((time.time() - t0) * 1000, 2),
                "license": "Apache-2.0"
            }
            logger.info("YuNet Face Detector initialized.")
        except Exception as e:
            logger.error(f"Error initializing YuNet: {e}")
            self.models_loaded["face_detector"] = {
                "name": "OpenCV YuNet",
                "status": "ERROR",
                "error": str(e),
                "device": "CPU"
            }

    def _load_feature_model(self):
        t0 = time.time()
        try:
            custom_checkpoint = os.environ.get("DEEPFAKE_MODEL_PATH")
            if custom_checkpoint and os.path.exists(custom_checkpoint):
                logger.info(f"Loading custom deepfake detector weights from {custom_checkpoint}")
                model = torch.load(custom_checkpoint, map_location=self.device)
                model_name = f"Custom Deepfake Model ({os.path.basename(custom_checkpoint)})"
            else:
                weights = EfficientNet_B0_Weights.DEFAULT
                model = models.efficientnet_b0(weights=weights)
                model_name = "EfficientNet-B0 (Generic ImageNet Backbone + Forensic Heuristics)"

            model.eval()
            model.to(self.device)
            total_params = sum(p.numel() for p in model.parameters())

            self.feature_model = model
            self.models_loaded["deepfake_cnn"] = {
                "name": model_name,
                "status": "LOADED",
                "params": f"{total_params / 1e6:.2f}M",
                "device": str(self.device).upper(),
                "load_time_ms": round((time.time() - t0) * 1000, 2),
                "license": "PyTorch / Torchvision BSD-3-Clause",
                "architecture": "Inverted Residual Convolutional Network (Heuristic Feature Extractor)",
                "custom_checkpoint": bool(custom_checkpoint and os.path.exists(custom_checkpoint))
            }
            logger.info(f"{model_name} loaded onto {self.device} ({total_params} parameters).")
        except Exception as e:
            logger.error(f"Error initializing feature model: {e}")
            self.models_loaded["deepfake_cnn"] = {
                "name": "EfficientNet-B0",
                "status": "ERROR",
                "error": str(e),
                "device": str(self.device)
            }

    def get_status(self) -> Dict[str, Any]:
        return {
            "device": str(self.device),
            "cpu_threads": torch.get_num_threads(),
            "models": self.models_loaded
        }

model_manager = ModelManager()
