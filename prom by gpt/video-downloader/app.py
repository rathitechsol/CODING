import os
import re
import uuid
from urllib.parse import urlparse

from flask import Flask, request, render_template, send_file, jsonify, after_this_request
from flask_cors import CORS
import yt_dlp
import validators


APP_ROOT = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_DIR = os.path.join(APP_ROOT, "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def detect_platform(url: str) -> str:
    try:
        netloc = urlparse(url).netloc.lower()
    except Exception:
        return "unknown"

    if any(k in netloc for k in ["youtube.com", "youtu.be"]):
        return "YouTube"
    if "instagram.com" in netloc:
        return "Instagram"
    if any(k in netloc for k in ["facebook.com", "fb.watch"]):
        return "Facebook"
    if any(k in netloc for k in ["twitter.com", "x.com"]):
        return "Twitter/X"
    if "tiktok.com" in netloc:
        return "TikTok"
    if "vimeo.com" in netloc:
        return "Vimeo"
    return "Unknown"


def sanitize_filename(name: str) -> str:
    name = name.strip().replace("\n", " ")
    name = re.sub(r"\s+", " ", name)
    return re.sub(r"[^A-Za-z0-9\-_.() ]+", "", name)[:120].strip() or "video"


def is_download_permitted(info: dict) -> bool:
    # Conservative checks: allow only public/unlisted content and avoid DRM/live
    availability = (info or {}).get("availability") or "public"
    has_drm = bool((info or {}).get("has_drm"))
    is_live = bool((info or {}).get("is_live"))
    # If formats exist and at least one progressive format is available
    formats = (info or {}).get("formats") or []
    has_progressive = any(
        f for f in formats
        if f and f.get("vcodec") not in (None, "none") and f.get("acodec") not in (None, "none")
    )
    if availability not in ("public", "unlisted"):
        return False
    if has_drm or is_live:
        return False
    if not has_progressive:
        return False
    return True


def summarize_formats(formats: list) -> list:
    summarized = []
    for f in formats or []:
        if not f:
            continue
        # Only show progressive formats (contain both audio and video) to avoid merger/ffmpeg requirement
        if f.get("vcodec") in (None, "none") or f.get("acodec") in (None, "none"):
            continue
        if f.get("ext") not in ("mp4", "webm", "mkv", "mov"):
            continue
        height = f.get("height")
        width = f.get("width")
        fps = f.get("fps")
        filesize = f.get("filesize") or f.get("filesize_approx")
        resolution = None
        if height and width:
            resolution = f"{width}x{height}"
        elif height:
            resolution = f"{height}p"
        summarized.append({
            "format_id": f.get("format_id"),
            "ext": f.get("ext"),
            "resolution": resolution,
            "fps": fps,
            "filesize": filesize,
            "vcodec": f.get("vcodec"),
            "acodec": f.get("acodec"),
            "format_note": f.get("format_note"),
        })
    # Deduplicate by (ext, resolution, fps) keeping the first (usually highest bitrate)
    seen = set()
    deduped = []
    for f in summarized:
        key = (f.get("ext"), f.get("resolution"), f.get("fps"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(f)
    # Sort by vertical resolution descending then fps desc
    def sort_key(item):
        res = item.get("resolution") or ""
        height_val = 0
        if isinstance(res, str) and "x" in res:
            try:
                height_val = int(res.split("x")[-1])
            except Exception:
                height_val = 0
        elif isinstance(res, str) and res.endswith("p"):
            try:
                height_val = int(res[:-1])
            except Exception:
                height_val = 0
        return (-height_val, -(item.get("fps") or 0))

    deduped.sort(key=sort_key)
    return deduped


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.post("/api/validate")
    def api_validate():
        data = request.get_json(silent=True) or {}
        url = (data.get("url") or "").strip()
        if not url or not validators.url(url):
            return jsonify({"valid": False, "platform": "Unknown"}), 200
        return jsonify({"valid": True, "platform": detect_platform(url)}), 200

    @app.post("/api/metadata")
    def api_metadata():
        data = request.get_json(silent=True) or {}
        url = (data.get("url") or "").strip()
        if not url or not validators.url(url):
            return jsonify({"error": "Invalid URL"}), 400

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "nocheckcertificate": True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
        except Exception as exc:
            return jsonify({"error": f"Failed to fetch metadata: {exc}"}), 500

        # Some URLs return playlists; pick first entry
        if info.get("_type") == "playlist" and info.get("entries"):
            info = next((e for e in info.get("entries") or [] if e), info)

        permitted = is_download_permitted(info)
        formats = summarize_formats(info.get("formats") or []) if permitted else []

        return jsonify({
            "title": info.get("title"),
            "uploader": info.get("uploader"),
            "duration": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "webpage_url": info.get("webpage_url") or url,
            "platform": detect_platform(url),
            "permitted": permitted,
            "formats": formats,
        }), 200

    @app.post("/api/download")
    def api_download():
        data = request.get_json(silent=True) or {}
        url = (data.get("url") or "").strip()
        format_id = (data.get("format_id") or "").strip() or None

        if not url or not validators.url(url):
            return jsonify({"error": "Invalid URL"}), 400

        # Fetch metadata first to confirm permission and title for naming
        probe_opts = {"quiet": True, "no_warnings": True, "skip_download": True}
        try:
            with yt_dlp.YoutubeDL(probe_opts) as ydl:
                info = ydl.extract_info(url, download=False)
        except Exception as exc:
            return jsonify({"error": f"Failed to probe URL: {exc}"}), 500

        if info.get("_type") == "playlist" and info.get("entries"):
            info = next((e for e in info.get("entries") or [] if e), info)

        if not is_download_permitted(info):
            return jsonify({"error": "Downloading this content is not permitted."}), 403

        title_part = sanitize_filename(info.get("title") or "video")
        unique_part = uuid.uuid4().hex[:8]
        base_out = os.path.join(DOWNLOAD_DIR, f"{title_part}-{unique_part}.%(ext)s")

        # Only request progressive formats to avoid requiring ffmpeg merging
        chosen_format = format_id or "best[acodec!=none][vcodec!=none][ext=mp4]/best[acodec!=none][vcodec!=none]"

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "outtmpl": base_out,
            "format": chosen_format,
            "retries": 2,
            "noplaylist": True,
            "nocheckcertificate": True,
        }

        downloaded_filepath = None
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.extract_info(url, download=True)

                # Map result to final file path
                if isinstance(result, dict):
                    # Newer yt-dlp may provide 'requested_downloads' entries with 'filepath'
                    reqs = result.get("requested_downloads") or []
                    for r in reqs:
                        fp = r.get("filepath") or r.get("_filename")
                        if fp and os.path.exists(fp):
                            downloaded_filepath = fp
                            break
                    if not downloaded_filepath:
                        # Fallback to prepared filename
                        candidate = ydl.prepare_filename(result)
                        # Resolve possible extension adjustments
                        if os.path.exists(candidate):
                            downloaded_filepath = candidate
                        else:
                            # Try with reported ext
                            ext = (result.get("ext") or "mp4").lstrip(".")
                            alt = os.path.splitext(candidate)[0] + f".{ext}"
                            if os.path.exists(alt):
                                downloaded_filepath = alt

            if not downloaded_filepath or not os.path.exists(downloaded_filepath):
                return jsonify({"error": "Download failed or file not found"}), 500

            filename = os.path.basename(downloaded_filepath)

            @after_this_request
            def cleanup(response):
                try:
                    if os.path.exists(downloaded_filepath):
                        os.remove(downloaded_filepath)
                except Exception:
                    pass
                return response

            return send_file(downloaded_filepath, as_attachment=True, download_name=filename)

        except Exception as exc:
            return jsonify({"error": f"Download failed: {exc}"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    # On Windows, ensure debug reloader does not duplicate downloads cleanup
    app.run(host="127.0.0.1", port=5000, debug=True)


