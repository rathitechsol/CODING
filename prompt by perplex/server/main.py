from __future__ import annotations

import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.background import BackgroundTask

# Optional: import only when used to keep startup fast
import yt_dlp


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR.parent / "web"


def is_public_http_url(url: str) -> bool:
    # Basic allowlist and SSRF guard: only http/https and no private IPs
    if not re.match(r"^https?://", url, re.IGNORECASE):
        return False
    # Disallow localhost and private networks
    private_patterns = [
        r"https?://localhost",XXXX
        r"https?://127\.0\.0\.1",
        r"https?://0\.0\.0\.0",
        r"https?://10\.",
        r"https?://192\.168\.",
        r"https?://172\.(1[6-9]|2[0-9]|3[0-1])\.",
    ]
    for pat in private_patterns:
        if re.match(pat, url, re.IGNORECASE):
            return False
    return True


class InfoResponse(BaseModel):
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    extractor: Optional[str] = None
    formats: List[Dict[str, Any]]


app = FastAPI(title="AnySave", version="0.1.0")


def ydl_extract(url: str) -> Dict[str, Any]:
    ydl_opts: Dict[str, Any] = {
        "quiet": True,
        "skip_download": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False)


@app.get("/api/info", response_model=InfoResponse)
def get_info(url: str = Query(..., description="Public media URL")):
    if not is_public_http_url(url):
        raise HTTPException(status_code=400, detail="Only public http/https URLs are allowed")
    try:
        info = ydl_extract(url)
    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(status_code=422, detail=f"Unable to extract info: {e}") from e

    # Build a compact formats list focusing on MP4/video and M4A/MP3 audio where possible
    formats: List[Dict[str, Any]] = []
    for f in info.get("formats", []):
        # skip DASH segments without direct URL
        if not f.get("url"):
            continue
        ext = (f.get("ext") or "").lower()
        vcodec = f.get("vcodec")
        acodec = f.get("acodec")
        # Keep common cases
        if ext in {"mp4", "m4a", "mp3", "webm"}:
            formats.append(
                {
                    "format_id": f.get("format_id"),
                    "ext": ext,
                    "filesize": f.get("filesize") or f.get("filesize_approx"),
                    "tbr": f.get("tbr"),
                    "fps": f.get("fps"),
                    "height": f.get("height"),
                    "width": f.get("width"),
                    "vcodec": vcodec,
                    "acodec": acodec,
                    "format_note": f.get("format_note"),
                }
            )

    # De-dup by (ext, height, acodec, vcodec, tbr)
    seen: set = set()
    deduped: List[Dict[str, Any]] = []
    for f in sorted(formats, key=lambda x: (x.get("height") or 0, x.get("tbr") or 0), reverse=True):
        key = (f.get("ext"), f.get("height"), f.get("acodec"), f.get("vcodec"), f.get("tbr"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(f)

    return InfoResponse(
        title=info.get("title") or "",
        thumbnail=info.get("thumbnail"),
        duration=info.get("duration"),
        extractor=info.get("extractor_key"),
        formats=deduped,
    )


@app.get("/api/download")
def download(
    url: str = Query(..., description="Public media URL"),
    format_id: Optional[str] = Query(None, description="yt-dlp format_id; if omitted, best mp4 is used"),
    audio_only: bool = Query(False, description="Extract audio only (mp3)"),
):
    if not is_public_http_url(url):
        raise HTTPException(status_code=400, detail="Only public http/https URLs are allowed")

    temp_dir = Path(tempfile.mkdtemp(prefix="anysave_"))
    output_template = str(temp_dir / "%(title)s.%(ext)s")

    ydl_opts: Dict[str, Any] = {
        "outtmpl": output_template,
        "restrictfilenames": True,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "merge_output_format": "mp4",
        # Postprocessing for audio when requested
        "postprocessors": [],
    }

    if audio_only:
        ydl_opts.update(
            {
                "format": "bestaudio/best",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }
        )
    else:
        if format_id:
            ydl_opts["format"] = format_id
        else:
            # Prefer best mp4 if available
            ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(url, download=True)
            if result.get("requested_downloads"):
                # Newer yt-dlp returns list of downloads
                downloads = result["requested_downloads"]
                file_path = Path(downloads[0]["filepath"])  # type: ignore[index]
            else:
                # Fallback to outtmpl pattern
                # Find one file in temp_dir
                candidates = list(temp_dir.glob("*"))
                if not candidates:
                    raise HTTPException(status_code=500, detail="Download failed")
                file_path = candidates[0]
    except yt_dlp.utils.DownloadError as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=422, detail=f"Download failed: {e}") from e

    # Stream the file and cleanup after response
    filename = file_path.name

    def cleanup_tmp() -> None:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

    headers = {"Cache-Control": "no-store"}
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream",
        headers=headers,
        background=BackgroundTask(cleanup_tmp),
    )


@app.get("/healthz")
def healthz():
    return JSONResponse({"status": "ok"})


# Serve static frontend (mounted last so /api/* remains accessible)
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")


