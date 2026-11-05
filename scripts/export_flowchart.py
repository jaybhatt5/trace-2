import asyncio
import json
import os
import subprocess
import tempfile
import time
import base64
import requests
import websockets

HTML_CONTENT = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Newsreader:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 30px;
      background: #fbfaf8;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #graphDiv {
      background: #ffffff;
      padding: 36px 44px;
      border-radius: 12px;
      border: 1.5px solid #e7e5e4;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      max-width: 1100px;
      width: 100%;
    }
    svg {
      width: 100% !important;
      height: auto !important;
    }
    .node rect, .node circle, .node polygon, .node path {
      stroke-width: 1.5px !important;
    }
  </style>
  <script>
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      fontFamily: 'Plus Jakarta Sans',
      themeVariables: {
        primaryColor: '#ffffff',
        primaryTextColor: '#1c1917',
        primaryBorderColor: '#78716c',
        lineColor: '#57534e',
        secondaryColor: '#f5f5f4',
        tertiaryColor: '#fafaf9',
        fontSize: '13px'
      }
    });
  </script>
</head>
<body>
  <div id="graphDiv"></div>
  <script>
    const diagram = `
flowchart TD
    User([Reader / Journalist]) -->|Submits Claim, Photo, Video or Text| Frontend["React 19 Broadsheet SPA<br/>(Vite + Tailwind v4 + Motion)"]
    
    subgraph BF ["Client-Side Browser Forensics"]
        Frontend -->|HTML5 Canvas| ELA["Error Level Analysis (ELA)"]
        Frontend -->|Laplacian Kernels| Noise["Edge & Noise Variance Map"]
        Frontend -->|HTML5 Video Element| Keyframes["Temporal Keyframe Extraction"]
    end

    subgraph BE ["Node.js / Express Server (server.ts)"]
        Frontend -->|REST GET /api/news| GNewsService["GNews v4 Syndication Service"]
        Frontend -->|REST POST /api/fact-check| FactCheckRouter["Fact-Check Engine"]
        Frontend -->|REST POST /api/detect-deepfake| DeepfakeRouter["Multimodal Vision Router"]
        
        GNewsService -->|HTTPS Requests| GNewsAPI[("GNews v4 API")]
        FactCheckRouter -->|Google GenAI SDK| GeminiAPI[("Google Gemini 2.5 / 3.7 Flash")]
        FactCheckRouter -.->|Network Disconnect Fallback| LocalEngine["Heuristic Verification Engine"]
        
        FactCheckRouter -->|JSON Write| DiskStorage[("Local Disk Persistence: data/user-factchecks.json")]
        FactCheckRouter -->|GraphQL SDK| PostgresDB[("Cloud SQL for PostgreSQL via Firebase")]
    end

    FactCheckRouter -->|Structured Audit Payload| Frontend
    Frontend --> Modal["FactCheckModal (Audit Certificate + QR Code)"]
`;
    mermaid.render('mermaidSvg', diagram).then(res => {
      document.getElementById('graphDiv').innerHTML = res.svg;
      console.log('MERMAID_RENDER_SUCCESS');
    }).catch(err => {
      console.error('MERMAID_ERROR:', err);
    });
  </script>
</body>
</html>
"""

async def main():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    user_data = os.path.join(tempfile.gettempdir(), 'chrome_cdp_flowchart')
    
    html_file = os.path.abspath('scripts/render_flowchart.html')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(HTML_CONTENT)
        
    proc = subprocess.Popen([
        chrome_path,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--force-device-scale-factor=2.0',
        f'--user-data-dir={user_data}',
        '--remote-debugging-port=9222',
        'about:blank'
    ])
    
    try:
        pages = None
        for _ in range(25):
            try:
                res = requests.get('http://127.0.0.1:9222/json/list', timeout=1)
                pages = res.json()
                if pages:
                    break
            except Exception:
                time.sleep(0.3)
        
        target = next((p for p in pages if p.get('type') == 'page'), None)
        ws_url = target['webSocketDebuggerUrl']
        
        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            msg_id = 1
            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get('id') == cid:
                        return resp.get('result', {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1280,
                "height": 980,
                "deviceScaleFactor": 2.0,
                "mobile": False
            })
            
            nav_url = f"file:///{html_file.replace('\\', '/')}"
            print(f"Loading {nav_url}...", flush=True)
            await send_cmd("Page.navigate", {"url": nav_url})
            await asyncio.sleep(3.5)
            
            # Extract SVG
            eval_svg = await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('#graphDiv svg') ? document.querySelector('#graphDiv svg').outerHTML : ''"
            })
            svg_content = eval_svg.get('result', {}).get('value', '')
            if svg_content:
                svg_path = os.path.join(os.getcwd(), 'assets', 'screenshots', 'flowchart.svg')
                with open(svg_path, 'w', encoding='utf-8') as f:
                    f.write(svg_content)
                print(f"[OK] Saved SVG flowchart: {svg_path} ({len(svg_content)} bytes)", flush=True)

            # Capture high-res PNG of #graphDiv
            eval_box = await send_cmd("Runtime.evaluate", {
                "expression": """
                    const el = document.getElementById('graphDiv');
                    const r = el.getBoundingClientRect();
                    JSON.stringify({ x: r.x, y: r.y, width: r.width, height: r.height });
                """
            })
            box = json.loads(eval_box.get('result', {}).get('value', '{}'))
            
            clip_params = {
                "x": box.get('x', 0),
                "y": box.get('y', 0),
                "width": box.get('width', 1100),
                "height": box.get('height', 850),
                "scale": 1.0
            }
            
            res = await send_cmd("Page.captureScreenshot", {
                "format": "png",
                "clip": clip_params
            })
            img_bytes = base64.b64decode(res['data'])
            
            png_path = os.path.join(os.getcwd(), 'assets', 'screenshots', 'flowchart.png')
            with open(png_path, 'wb') as f:
                f.write(img_bytes)
            print(f"[OK] Saved PNG flowchart: {png_path} ({len(img_bytes)} bytes)", flush=True)
            
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()

if __name__ == '__main__':
    asyncio.run(main())
