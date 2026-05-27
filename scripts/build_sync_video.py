"""Sync promo: device mockup + sharp playback (full screens, no Teleparty chat)."""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
MOCKUP_SRC = ASSETS / "landingpage_synchronization_source.mp4"
MOCKUP_BASE = ASSETS / "sync_mockup_base.png"
CONTENT_SRC = ASSETS / "landing_teleparty_hq.mp4"
OUT = ASSETS / "landingpage_synchronization.mp4"

W, H = 850, 478
# Full device displays — tuned so video sits perfectly inside each screen bezel
# (x, y, width, height) in pixels on the 850×478 mockup frame.
# Nudge a bit to the right and slightly shrink so it no longer bleeds into the phone.
LAPTOP_SCREEN = (170, 56, 580, 356)
# Phone screen tightened so the content sits fully inside the rounded corners.
PHONE_SCREEN = (58, 60, 120, 380)

CONTENT_START_SEC = 4.0
DURATION_SEC = 12.0
FPS = 24


def cover_crop(img: Image.Image, tw: int, th: int) -> Image.Image:
    iw, ih = img.size
    scale = max(tw / iw, th / ih)
    nw, nh = max(1, int(iw * scale)), max(1, int(ih * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return resized.crop((left, top, left + tw, top + th))


def black_rect(img: Image.Image, box: tuple[int, int, int, int]) -> None:
    x, y, bw, bh = box
    img.paste(Image.new("RGB", (bw, bh), (0, 0, 0)), (x, y))


def paste_video(img: Image.Image, frame: Image.Image, box: tuple[int, int, int, int]) -> None:
    x, y, bw, bh = box
    black_rect(img, box)
    img.paste(cover_crop(frame, bw, bh), (x, y))


def build_mockup_base() -> Image.Image:
    """Always rebuild — cached base kept wrong Teleparty chat if zones changed."""
    if not MOCKUP_SRC.exists():
        sys.exit(f"Missing mockup source: {MOCKUP_SRC}")

    tmp = Path(tempfile.mkdtemp(prefix="cinecoop-sync-base-"))
    frame_path = tmp / "base.png"
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(MOCKUP_SRC),
                "-frames:v",
                "1",
                str(frame_path),
            ],
            check=True,
            capture_output=True,
        )
        base = Image.open(frame_path).convert("RGB")
        if base.size != (W, H):
            base = base.resize((W, H), Image.Resampling.LANCZOS)

        # Supprime totalement le téléphone : on repeint la zone de gauche en blanc,
        # puis on ne garde que l'écran du MacBook pour la vidéo.
        draw = ImageDraw.Draw(base)
        phone_x, phone_y, phone_w, phone_h = PHONE_SCREEN
        draw.rectangle((0, 0, phone_x + phone_w + 8, H), fill=(255, 255, 255))

        black_rect(base, LAPTOP_SCREEN)
        base.save(MOCKUP_BASE, optimize=True)
        print(f"Wrote mockup base {MOCKUP_BASE}")
        return base
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def extract_content_frames(tmp: Path) -> list[Path]:
    if not CONTENT_SRC.exists():
        sys.exit(f"Missing content video: {CONTENT_SRC}")

    out_dir = tmp / "content"
    out_dir.mkdir()
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(CONTENT_START_SEC),
            "-t",
            str(DURATION_SEC),
            "-i",
            str(CONTENT_SRC),
            "-vf",
            f"fps={FPS},scale=1920:-2",
            str(out_dir / "%04d.png"),
        ],
        check=True,
        capture_output=True,
    )
    paths = sorted(out_dir.glob("*.png"))
    if not paths:
        sys.exit("No content frames extracted")
    return paths


def encode_video() -> None:
    MOCKUP_BASE.unlink(missing_ok=True)
    base = build_mockup_base()
    tmp = Path(tempfile.mkdtemp(prefix="cinecoop-sync-"))
    frames_out = tmp / "out"
    frames_out.mkdir()

    try:
        content_paths = extract_content_frames(tmp)
        n = len(content_paths)

        for i, content_path in enumerate(content_paths, 1):
            content = Image.open(content_path).convert("RGB")
            out = base.copy()
            paste_video(out, content, LAPTOP_SCREEN)
            out.save(frames_out / f"{i:04d}.png", optimize=False)
            if i % 48 == 0:
                print(f"Composited {i}/{n}")

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-framerate",
                str(FPS),
                "-i",
                str(frames_out / "%04d.png"),
                "-c:v",
                "libx264",
                "-crf",
                "18",
                "-preset",
                "medium",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(OUT),
            ],
            check=True,
        )
        print(f"Wrote {OUT} ({n} frames @ {FPS}fps)")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    encode_video()
