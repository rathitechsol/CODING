AnySave – Privacy-first video downloader

Overview
AnySave is a lightweight web app that lets users fetch video info and download media (when permitted) from supported platforms via yt-dlp. It runs a FastAPI backend and serves a simple static frontend. No accounts, no tracking.

Key features
- Paste a link to a public post (Instagram, Facebook, YouTube, TikTok, Vimeo, X/Twitter, and many others supported by yt-dlp)
- Preview title and thumbnail
- Choose common qualities: Best MP4, 1080p, 720p, or Audio MP3
- One-click download with server-side cleanup
- Legal reminder to respect copyright and terms

Requirements
- Python 3.9+
- ffmpeg available on PATH
- Windows, macOS, or Linux

Windows ffmpeg install tips
- If you use Chocolatey: `choco install ffmpeg -y`
- Or download builds from `https://ffmpeg.org/` and add the `bin` folder to your PATH

Setup
1) Create and activate a virtual environment (recommended)
   - Windows (PowerShell):
     - `py -3 -m venv .venv`
     - `.venv\\Scripts\\Activate.ps1`
   - macOS/Linux:
     - `python3 -m venv .venv`
     - `source .venv/bin/activate`

2) Install backend dependencies
   - `pip install -r server/requirements.txt`

3) Run the server (serves API and static site)
   - `uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload`
   - Open `http://localhost:8000` in your browser

Security notes
- Only http/https URLs are accepted. Local and private network addresses are rejected to mitigate SSRF.
- Downloads are processed in a per-request temp directory and cleaned up after each response.
- Consider adding rate limiting, logging, and WAF/CDN protections before production.

Legal
- This tool is for saving content you have the right to download. Ensure your use complies with the source site’s terms and applicable laws. You are responsible for your use of AnySave.

Deploying
- Ensure Python 3.9+, yt-dlp, and ffmpeg are available on the server. For containerization, install `ffmpeg` in the image and expose port 8000.


