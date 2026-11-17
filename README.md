<div align="center">

<img src="assets/logo.svg" alt="TRACE Logo" width="120" />

# TRACE

### AI-Powered News Verification & Deepfake Detection Platform
*Enterprise-grade SaaS newsroom platform inspired by Linear & Vercel. Combines local PyTorch/OpenCV deepfake computer vision, OCR chyron extraction, NLP stylometry, and live syndicated wire corroboration.*

<br />

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5.0+-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)

<br />

[**Architecture**](#-architecture-overview) ·
[**Local AI Engine**](#-local-ai-deepfake-engine) ·
[**Skeleton Loading**](#-skeleton-loading-system) ·
[**Getting Started**](#-getting-started) ·
[**API Reference**](#-api-reference) ·
[**Team**](#-team--academic-attribution)

</div>

---

## 📖 About TRACE

**TRACE** (**T**ruth **R**eview & **A**uthenticity **C**hecking **E**ngine) is an enterprise-grade AI SaaS application designed to detect synthetic media, altered broadcast footage, and viral misinformation across global news streams.

Unlike systems that depend solely on third-party cloud APIs, TRACE operates a **high-performance local computer vision and NLP engine** optimized for consumer hardware (Intel Core i5 11th Gen, 8GB RAM, integrated Intel Iris Xe graphics).

### Core Pillars

1. **Local Deepfake Computer Vision Lab:** Multi-pillar forensic pipeline featuring PyTorch EfficientNet-B0 inference, OpenCV YuNet facial landmark alignment, Error Level Analysis (ELA), Laplacian edge noise variance, 2D Fast Fourier Transform (FFT) spectral artifact analysis, and video frame temporal consistency with cross-frame jitter variance.
2. **4 Standardized Forensic Verdicts:**
   - `Likely Authentic` (Camera capture corroborated, uniform sensor noise)
   - `Potentially Manipulated` (Regional JPEG recompression delta, face swap seam)
   - `Likely AI-Generated` (Diffusion spectral artifacts, high GAN feature probability)
   - `Inconclusive` (Low media resolution, extreme occlusion, insufficient evidence)
3. **Broadcast OCR & Chyron Verification:** Bilateral image filtering, adaptive Otsu binarization, morphological ticker boundary extraction, and headline cross-referencing.
4. **NLP Stylometry & Authorship Audit:** Sentence length variance (burstiness), vocabulary richness (Type-Token Ratio), perplexity approximation, and cliché token detection.
5. **Live News Syndication & Fact-Checking:** Real-time wire integration (GNews v4) with 1-click claim verification and Google Gemini multimodal search grounding.
6. **Verification Dossiers & Audit Certificates:** Printable, downloadable JSON dossiers and official certificates complete with verification IDs and QR codes.
7. **Modular Skeleton Loading System:** Zero blank screens, zero layout shifts, and progressive scanning telemetry for all asynchronous workloads.

---

## 🏛 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                       Client Frontend (React 19 + Vite 6)              │
│       Linear / Vercel Design System • Skeleton Loaders • Real-Time UI   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Express 4 API Server (Node.js)                   │
│         /api/detect-deepfake • /api/fact-check-media • /api/feed       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼ (Bridge)                       ▼ (Optional Enrichment)
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  Local Python AI Microservice (5001) │  │  Google Gemini 3.7 API       │
│  FastAPI + Uvicorn / Direct CLI      │  │  Multimodal Search Grounding │
│  ├─ PyTorch EfficientNet-B0          │  └──────────────────────────────┘
│  ├─ OpenCV YuNet Face Detection      │
│  ├─ ELA, Laplacian & 2D FFT          │
│  ├─ Video Temporal Jitter Analysis   │
│  ├─ Morphological Chyron OCR         │
│  └─ Stylometric NLP Engine           │
└──────────────────────────────────────┘
```

### Hardware Target & Efficiency

- **Target System:** Intel Core i5 11th Generation (4 physical cores / 8 threads), 8GB RAM, Intel Iris Xe graphics.
- **Inference Speed:**
  - Single Image Deepfake Analysis: **~110ms – 180ms** (CPU)
  - 15-Frame Video Temporal Jitter: **~120ms – 250ms** (CPU)
  - Face Landmark Alignment (YuNet): **< 15ms** (CPU)
  - Memory Footprint: **< 350MB RAM** total during active inference.
- **Model Caching:** Models are instantiated via a thread-safe singleton (`models_manager.py`) during backend startup and persist in memory—never reloaded per request.

---

## 🤖 Local AI Deepfake Engine

Located in `ai_engine/`, the local inference engine operates without requiring external detection tokens.

### Models & Weights Provenance

| Component | Architecture / Weights | License | Parameters | Size | Source |
|---|---|---|---|---|---|
| **Face Detector** | `face_detection_yunet_2023mar.onnx` | Apache-2.0 | 0.23M | 232 KB | OpenCV Zoo |
| **Spatial Artifact Classifier** | `torchvision.models.efficientnet_b0` | BSD-3-Clause | 5.29M | 21.4 MB | PyTorch Hub |
| **Spectral Signal Analyzer** | 2D Fast Fourier Transform (NumPy) | BSD-3-Clause | Analytical | 0 KB | Native math |
| **Noise & ELA Inspector** | Laplacian Kernel + JPEG Delta (OpenCV) | Apache-2.0 | Analytical | 0 KB | Native math |

### 4-Pillar Scoring Methodology

1. **Biometric Mechanics:** YuNet detects 5 facial landmarks (two pupils, nose tip, two mouth corners) to measure iris symmetry, face alignment tilt, and facial boundary seam sharpness.
2. **Digital Signal (ELA & Noise):** Calculates Error Level Analysis by saving the image at 90% quality and computing pixel-wise difference against the source. Measures high-frequency sensor noise via the variance of the Laplacian convolution.
3. **Spectral Fourier (2D FFT):** Shifts 2D Fourier frequencies to the center and measures energy concentration in outer rings to catch characteristic generative diffusion decoders.
4. **Temporal Consistency (Video):** Analyzes inter-frame Euclidean distance variance of face centroids and standard deviation of lighting deltas across sampled keyframes.

---

## ⚡ Skeleton Loading System

TRACE implements a comprehensive skeleton loading suite in `src/components/skeletons/` matching content dimensions to eliminate layout shifts:

- `SkeletonCard`: Responsive cards for news feeds and exposé grids.
- `SkeletonText`: Variable-width text lines with subtle shimmer keyframes.
- `SkeletonImage`: Aspect-ratio locked media placeholders with scan animation.
- `SkeletonResult`: Verdict cards, truth score gauges, and evidence panels.
- `SkeletonTable`: Tabular rows with headers for audit reports.
- `SkeletonAnalysis`: Deepfake scanner with media preview, progress bar, and 4 forensic pillar placeholders.
- `AnalysisLoader`: Unified loading progress indicator with real-time operational status messages.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18.0.0 or higher
- **Python:** v3.10, 3.11, 3.12, 3.13, or 3.14
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/trace-ai.git
   cd trace-ai
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Python AI dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Includes PyTorch, Torchvision, OpenCV-Python, NumPy, Pillow, FastAPI, Uvicorn)*

4. **Environment Configuration:**
   Copy `.env.example` to `.env` and configure your keys:
   ```bash
   cp .env.example .env
   ```
   *Note: Local AI deepfake detection, OCR chyron detection, and NLP text analysis run 100% locally on CPU without requiring an external API key.*

---

## 🔐 Environment Variables & Deployment

### Required vs Optional Variables

| Variable | Required | Description | How to Generate / Source |
|---|---|---|---|
| `AUTH_JWT_SECRET` | **Yes** | 64-character cryptographic hex secret for short-lived JWT tokens | Run `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_MFA_SECRET` | **Yes** | 64-character AES-256 secret for encrypting multi-factor authenticator secrets | Run `openssl rand -hex 32` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini Generative AI key for multimodal news grounding & NLP | Obtain from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GNEWS_API_KEY` | Optional | GNews v4 API key for live international wire feeds | Obtain from [GNews.io](https://gnews.io/) (Curated wire fallback included if omitted) |
| `ADMIN_EMAIL` | Optional | Email for the initial bootstrap administrator account | e.g. `admin@yourdomain.com` |
| `ADMIN_INITIAL_PASSWORD` | Optional | Strong initial password (forced change & MFA required on first login) | e.g. `ComplexPass2026!` |
| `ADMIN_SESSION_SECRET` | Optional | Session signature key for administrative portal tokens | Run `openssl rand -hex 32` |
| `NODE_ENV` | Optional | Environment mode: `production` or `development` | Defaults to `production` in deployed environments |
| `APP_URL` | Optional | Base public domain URL | e.g. `https://your-trace-app.vercel.app` |

### Setting Variables Locally

1. Create a local `.env` file in the project root (never committed to git):
   ```bash
   cp .env.example .env
   ```
2. Populate the keys with your genuine credentials.
3. Verify that git ignores the file by running:
   ```bash
   git status
   # Ensure .env does NOT appear in untracked files
   ```

### Deploying to Vercel

TRACE is pre-configured with `vercel.json` and a serverless entry point at `api/index.ts`.

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: configure production deployment and vercel serverless entry"
   git push origin main
   ```
2. **Import Project into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository (`trace-2`).
   - Framework Preset: **Vite** (or Other).
   - Root Directory: `./` (Root).
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Configure Environment Variables in Vercel:**
   - Under **Project Settings > Environment Variables**, add each of the following:
     - `AUTH_JWT_SECRET` (generate with `openssl rand -hex 32`)
     - `AUTH_MFA_SECRET` (generate with `openssl rand -hex 32`)
     - `GEMINI_API_KEY` (your Google Gemini API key)
     - `GNEWS_API_KEY` (optional, your GNews key)
     - `NODE_ENV`: `production`
   - Click **Deploy**. Vercel will build the React 19 client into `dist` and route all `/api/*` calls through the serverless function.

---

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   This automatically boots:
   - The Express & Vite application on `http://localhost:3000`
   - The Python Local AI engine in the background on `http://127.0.0.1:5001`

6. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔌 API Reference

### Local AI Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ai-status` | Status of local AI engine, active device (CPU), loaded models, and RAM |
| `POST` | `/api/detect-deepfake` | Local 4-pillar deepfake analysis for image or video with optional Gemini context |
| `POST` | `/api/fact-check-media` | Local OCR chyron extraction and visual integrity verification |
| `POST` | `/api/analyze-text` | Local NLP burstiness, perplexity, and stylometric authorship audit |

### News Wire & Claim Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/news` | Syndicated news wire with 5-minute cache across 9 categories |
| `GET` | `/api/news/search` | Full-text search across live wire dispatches |
| `GET` | `/api/feed` | All verified articles, debunked hoaxes, and platform stats |
| `POST` | `/api/fact-check` | Grounded claim verification against wire registries |
| `POST` | `/api/admin/news` | Editorial CMS publishing endpoint |

---

## 🧪 Testing & Verification

Run the automated test suites:

- **Type Check:**
  ```bash
  npm run lint
  ```
- **Local AI Suite (Image, Video, OCR, NLP):**
  ```bash
  python -m ai_engine.cli status
  ```
- **Production Build Test:**
  ```bash
  npm run build
  ```

---

## 👥 Team & Academic Attribution

Developed as a major academic project by:

| Name | Role | Degree |
|---|---|---|
| **Thakar Dhaval** | Lead Developer | Bachelor of Computer Applications (BCA), Semester 3 |
| **Bhatt Jay** | Lead Developer | Bachelor of Computer Applications (BCA), Semester 3 |

**Institution:** Department of Computer Science, **Shree Swaminarayan College of Computer Science (SSCCS)**

---

<div align="center">

**TRACE — Dedicated to factual journalism and transparency in the digital age.**

</div>
