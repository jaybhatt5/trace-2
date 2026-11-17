"""
TRACE Evaluation Benchmark Sample Generator
Generates reproducible, synthetic and simulated test patterns for local evaluation
when custom raw photos are not yet loaded.
"""
import os
import cv2
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

def ensure_dirs():
    for sub in ["real", "ai_generated", "edited"]:
        os.makedirs(os.path.join(DATASET_DIR, sub), exist_ok=True)

def generate_real_sample(idx: int):
    # Simulated authentic camera capture: natural gradient + uniform Gaussian sensor noise (ISO 400 simulation)
    img = np.zeros((360, 480, 3), dtype=np.uint8)
    for y in range(360):
        img[y, :, 0] = int(120 + 60 * np.sin(y / 40.0))
        img[y, :, 1] = int(130 + 50 * np.cos(y / 50.0))
        img[y, :, 2] = int(140 + 40 * np.sin(y / 60.0))
    # Add subtle natural sensor noise
    noise = np.random.normal(0, 4, img.shape).astype(np.int16)
    noisy_img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    # Natural single JPEG compression at quality 92
    path = os.path.join(DATASET_DIR, "real", f"real_sample_{idx}.jpg")
    cv2.imwrite(path, noisy_img, [cv2.IMWRITE_JPEG_QUALITY, 92])

def generate_ai_sample(idx: int):
    # Simulated AI generated image: smooth oversaturated features + high-frequency periodic checkerboard artifacts
    img = np.zeros((360, 480, 3), dtype=np.uint8)
    # Extremely smooth gradient (characteristic of diffusion models)
    x = np.linspace(0, 1, 480)
    y = np.linspace(0, 1, 360)
    xx, yy = np.meshgrid(x, y)
    img[:, :, 0] = (255 * (0.5 + 0.5 * np.sin(xx * 6.0))).astype(np.uint8)
    img[:, :, 1] = (255 * (0.5 + 0.5 * np.cos(yy * 6.0))).astype(np.uint8)
    img[:, :, 2] = 180
    # Add subtle high-frequency checkerboard / Fourier artifacts common in generative upsamplers
    checker = ((xx * 120).astype(int) % 2) ^ ((yy * 120).astype(int) % 2)
    img = np.clip(img.astype(np.int16) + (checker * 14 - 7)[:, :, None], 0, 255).astype(np.uint8)
    path = os.path.join(DATASET_DIR, "ai_generated", f"ai_sample_{idx}.jpg")
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 85])

def generate_edited_sample(idx: int):
    # Simulated spliced/edited image: base JPEG compressed at q70, then a patch pasted and saved at q95 (classic ELA anomaly)
    base = np.full((360, 480, 3), 160, dtype=np.uint8)
    # Add gradient
    for y in range(360):
        base[y, :, :] = int(100 + y * 0.3)
    # First save base at low quality
    temp_path = os.path.join(DATASET_DIR, "edited", f"temp_{idx}.jpg")
    cv2.imwrite(temp_path, base, [cv2.IMWRITE_JPEG_QUALITY, 65])
    reloaded = cv2.imread(temp_path)
    os.remove(temp_path)

    # Insert an uncompressed / different quality spliced patch in center
    patch = np.zeros((120, 140, 3), dtype=np.uint8)
    patch[:, :] = [40, 40, 220] # Red-ish box
    noise = np.random.normal(0, 12, patch.shape).astype(np.int16)
    patch = np.clip(patch.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    reloaded[100:220, 150:290] = patch

    final_path = os.path.join(DATASET_DIR, "edited", f"edited_sample_{idx}.jpg")
    cv2.imwrite(final_path, reloaded, [cv2.IMWRITE_JPEG_QUALITY, 95])

def main():
    ensure_dirs()
    print("Generating calibration dataset samples for TRACE evaluation...")
    for i in range(1, 6):
        generate_real_sample(i)
        generate_ai_sample(i)
        generate_edited_sample(i)
    print(f"Generated 15 benchmark samples across real/, ai_generated/, and edited/ in {DATASET_DIR}")

if __name__ == "__main__":
    main()
