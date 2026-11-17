"""
TRACE AI Evaluation Harness
Benchmark evaluation script that tests deepfake detection heuristics across:
  - real/
  - ai_generated/
  - edited/
Outputs Confusion Matrix, False Positive Rate (FPR), False Negative Rate (FNR), Precision, Recall, Accuracy.
"""
import os
import sys
import time
from typing import Dict, Any, List

# Add backend directory to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

try:
    from ai_engine.deepfake_engine import analyze_image
except ImportError as e:
    print(f"Error importing deepfake_engine: {e}")
    sys.exit(1)

DATASET_DIR = os.path.join(CURRENT_DIR, "dataset")

def run_evaluation() -> Dict[str, Any]:
    if not os.path.exists(DATASET_DIR) or not os.listdir(DATASET_DIR):
        print(f"Dataset directory not found or empty at {DATASET_DIR}. Generating default benchmark samples first...")
        import generate_samples
        generate_samples.main()

    categories = ["real", "ai_generated", "edited"]
    results: List[Dict[str, Any]] = []

    print("\n=======================================================")
    print("  TRACE FORENSIC ENGINE EVALUATION BENCHMARK")
    print("=======================================================\n")

    t_start = time.time()

    for category in categories:
        cat_dir = os.path.join(DATASET_DIR, category)
        if not os.path.exists(cat_dir):
            continue

        files = [f for f in os.listdir(cat_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        print(f"Evaluating category '{category}' ({len(files)} files)...")

        for f in files:
            img_path = os.path.join(cat_dir, f)

            try:
                out = analyze_image(img_path)
                is_manipulated = out.get("isManipulated", False)
                verdict = out.get("verdict", "Unknown")
                ai_prob = out.get("aiProbability", 0.0)

                expected_manipulated = (category in ["ai_generated", "edited"])

                results.append({
                    "file": f,
                    "category": category,
                    "expected_manipulated": expected_manipulated,
                    "predicted_manipulated": is_manipulated,
                    "verdict": verdict,
                    "ai_probability": ai_prob,
                    "confidence_band": out.get("confidenceBand", {}).get("label", "N/A"),
                    "duration_ms": out.get("processingDurationMs", 0)
                })
            except Exception as err:
                print(f"  [ERROR] Failed to process {f}: {err}")

    total_eval = len(results)
    if total_eval == 0:
        print("No images were evaluated. Please place sample images into eval/dataset/{real,ai_generated,edited}.")
        return {}

    # Metrics calculation
    # Positive class = Manipulated / Fake
    # Negative class = Authentic / Real
    tp = sum(1 for r in results if r["expected_manipulated"] and r["predicted_manipulated"])
    tn = sum(1 for r in results if not r["expected_manipulated"] and not r["predicted_manipulated"])
    fp = sum(1 for r in results if not r["expected_manipulated"] and r["predicted_manipulated"])
    fn = sum(1 for r in results if r["expected_manipulated"] and not r["predicted_manipulated"])

    accuracy = (tp + tn) / total_eval if total_eval > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    total_time = round(time.time() - t_start, 2)
    avg_latency = round(sum(r["duration_ms"] for r in results) / total_eval, 1)

    print("\n-------------------------------------------------------")
    print(f"BENCHMARK RESULTS SUMMARY ({total_eval} total samples evaluated in {total_time}s)")
    print(f"Average Inference Latency: {avg_latency} ms / image")
    print("-------------------------------------------------------")
    print(f"  Total Samples Evaluated:    {total_eval}")
    print(f"  Accuracy:                   {accuracy * 100:.2f}%")
    print(f"  Precision:                  {precision * 100:.2f}%")
    print(f"  Recall (Sensitivity):       {recall * 100:.2f}%")
    print(f"  F1-Score:                   {f1 * 100:.2f}%")
    print(f"  False Positive Rate (FPR):  {fpr * 100:.2f}%  (Real images falsely flagged as fake)")
    print(f"  False Negative Rate (FNR):  {fnr * 100:.2f}%  (Fake images falsely labelled as real)")
    print("-------------------------------------------------------")
    print("CONFUSION MATRIX (Positive = Manipulated, Negative = Real):")
    print(f"                Predicted Manipulated    Predicted Real")
    print(f"  Actual Fake:         {tp:4d} (TP)               {fn:4d} (FN)")
    print(f"  Actual Real:         {fp:4d} (FP)               {tn:4d} (TN)")
    print("-------------------------------------------------------\n")

    print("DETAILED PER-SAMPLE INFERENCE BREAKDOWN:")
    for r in results:
        status_sym = "✓" if (r["expected_manipulated"] == r["predicted_manipulated"]) else "✗ MISCLASSIFIED"
        print(f"  [{r['category'].upper():12s}] {r['file']:20s} -> Verdict: {r['verdict']:25s} | AI%: {r['ai_probability']:4.1f}% ({r['confidence_band']}) | {status_sym}")

    return {
        "total": total_eval,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "fpr": fpr,
        "fnr": fnr,
        "confusion_matrix": {"tp": tp, "tn": tn, "fp": fp, "fn": fn},
        "avg_latency_ms": avg_latency
    }

if __name__ == "__main__":
    run_evaluation()
