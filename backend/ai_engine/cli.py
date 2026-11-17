import sys
import json
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_engine.deepfake_engine import analyze_image, analyze_video
from ai_engine.ocr_engine import extract_ocr_text
from ai_engine.nlp_engine import analyze_nlp_text
from ai_engine.models_manager import model_manager

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]

    try:
        payload = {}
        if cmd == "status":
            res = model_manager.get_status()
            print(json.dumps({"success": True, "result": res}))
            return

        if len(sys.argv) > 2 and sys.argv[2] != "-":
            raw_input = sys.argv[2]
            payload = json.loads(raw_input)
        elif not sys.stdin.isatty():
            raw_input = sys.stdin.read()
            if raw_input.strip():
                payload = json.loads(raw_input)

        if cmd == "image":
            img = payload.get("image") or payload.get("imageBase64") or payload.get("mediaUrl")
            desc = payload.get("description", "")
            res = analyze_image(img, user_description=desc)
            print(json.dumps({"success": True, "result": res}))
        elif cmd == "video":
            vid = payload.get("video") or payload.get("videoBase64") or payload.get("mediaUrl") or payload.get("filePath")
            max_f = int(payload.get("maxFrames", 10))
            res = analyze_video(vid, max_sampled_frames=max_f)
            print(json.dumps({"success": True, "result": res}))
        elif cmd == "ocr":
            img = payload.get("image") or payload.get("imageBase64") or payload.get("mediaUrl")
            res = extract_ocr_text(img)
            print(json.dumps({"success": True, "result": res}))
        elif cmd == "nlp":
            text = payload.get("text", "")
            res = analyze_nlp_text(text)
            print(json.dumps({"success": True, "result": res}))
        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
