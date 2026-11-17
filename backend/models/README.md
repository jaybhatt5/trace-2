# TRACE AI Models Directory

This directory stores offline and locally cached machine learning models for TRACE's local forensic vision and media authenticity verification engine.

---

## 1. Active Models

### A. OpenCV YuNet Face Detector (`face_detection_yunet_2023mar.onnx`)
- **Architecture**: YuNet (ultra-lightweight, high-speed deep face detector).
- **Source**: OpenCV Model Zoo (`https://github.com/opencv/opencv_zoo`).
- **File Size**: ~232 KB (0.23M parameters).
- **License**: Apache-2.0.
- **Hardware Target**: Optimized for Intel Core i5 / Intel Iris Xe CPU via OpenCV DNN.
- **Output**: 2D Bounding boxes, detection confidence score, and 5 facial key landmarks (right eye, left eye, nose tip, right mouth corner, left mouth corner) for face alignment and symmetry analysis.

### B. PyTorch EfficientNet-B0 (`torchvision.models.efficientnet_b0`)
- **Architecture**: Inverted Residual Convolutional Network (Tan & Le).
- **Source**: PyTorch / Torchvision official model hub.
- **Parameters**: 5.29M parameters (~20 MB).
- **License**: BSD 3-Clause.
- **Device**: CPU / Intel Iris Xe with multithreaded tensor operations.
- **Role**: Feature extraction on face crops and full frames to detect spatial GAN/diffusion synthesis artifacts and unnatural high-level feature variance.

---

## 2. Multi-Pillar Forensic Pipeline
1. **Biometric Mechanics**: Landmark symmetry, eye-to-eye angle, face aspect ratio, boundary coherence.
2. **Digital Signal / Noise**: Error Level Analysis (ELA) with high-precision JPEG recompression difference, Laplacian high-frequency edge variance.
3. **Spectral Frequency**: 2D Fast Fourier Transform (FFT) radial energy spectrum detecting deconvolution checkerboard grid artifacts.
4. **Provenance & Metadata**: EXIF header extraction, camera sensor tags, and C2PA synthetic software markers.
5. **Video Temporal Dynamics**: Cross-frame landmark position jitter variance, lighting shift standard deviation, and frame-level score aggregation.

---

## 3. Standardized Verdict Categories
Every TRACE detection report assigns media strictly to one of four transparent categories:
- **`Likely Authentic`**: Genuine camera capture with natural Poisson sensor noise, consistent JPEG compression, and organic facial symmetry.
- **`Potentially Manipulated`**: Localized visual splicing, ELA discrepancy, or chyron typography doctoring detected.
- **`Likely AI-Generated`**: Neural diffusion or GAN synthesis signatures detected across spectral and biometric features.
- **`Inconclusive`**: Low media resolution, obstructed facial landmarks, or insufficient video frames to establish high statistical confidence.
