"""Overlay CineCoop chat branding on landing_teleparty.mp4 → landing_cinecoop.mp4."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SRC = ASSETS / "landing_teleparty.mp4"
OVERLAY_PNG = ASSETS / "hero_chat_overlay.png"
OUT = ASSETS / "landing_cinecoop.mp4"
LOGO = ASSETS / "brand-cp-48.png"

VIDEO_W, VIDEO_H = 850, 466
OVERLAY_W = 218
OVERLAY_X = VIDEO_W - OVERLAY_W
BRAND_RED = (229, 9, 20)  # Teleparty-style red for title


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates += [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
        ]
    else:
        candidates += [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def build_overlay() -> None:
    img = Image.new("RGB", (OVERLAY_W, VIDEO_H), (11, 11, 13))
    draw = ImageDraw.Draw(img)

    # Left edge blend into video
    for x in range(12):
        alpha = x / 12
        c = int(11 + (26 - 11) * alpha)
        draw.line([(x, 0), (x, VIDEO_H)], fill=(c, c, c + 2))

    draw.rectangle((0, 0, OVERLAY_W, 44), fill=(15, 15, 18))
    draw.line((0, 44, OVERLAY_W, 44), fill=(32, 32, 32))

    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA")
        logo = logo.resize((22, 22), Image.Resampling.LANCZOS)
        img.paste(logo, (10, 11), logo)

    title_font = load_font(17, bold=True)
    draw.text((38, 12), "CineCoop", fill=BRAND_RED, font=title_font)

    # User avatar top-right
    draw.ellipse((OVERLAY_W - 34, 10, OVERLAY_W - 10, 34), fill=(47, 107, 255))
    draw.text((OVERLAY_W - 28, 14), "M", fill=(255, 255, 255), font=load_font(12, bold=True))

    # Session line
    draw.ellipse((12, 58, 28, 74), fill=(88, 132, 255))
    small = load_font(10)
    draw.text((34, 56), "Raymond", fill=(183, 202, 234), font=small)
    draw.text((34, 70), "created the session", fill=(232, 237, 247), font=load_font(11))

    # Sample messages
    y = 98
    messages = [
        ("Floppyxx", "LMAOOO"),
        ("Floppyxx", "HAHAHAH 😂"),
    ]
    body = load_font(12)
    name_f = load_font(11, bold=True)
    for user, text in messages:
        draw.ellipse((12, y, 28, y + 16), fill=(60, 70, 90))
        draw.text((34, y - 1), user, fill=(183, 202, 234), font=name_f)
        draw.text((34, y + 13), text, fill=(232, 237, 247), font=body)
        y += 46

    # Bottom composer (CineCoop style)
    draw.rectangle((0, VIDEO_H - 92, OVERLAY_W, VIDEO_H), fill=(15, 15, 18))
    draw.line((0, VIDEO_H - 92, OVERLAY_W, VIDEO_H - 92), fill=(32, 32, 32))
    draw.rounded_rectangle((10, VIDEO_H - 78, OVERLAY_W - 10, VIDEO_H - 38), radius=8, fill=(30, 31, 34), outline=(58, 58, 62))
    draw.text((18, VIDEO_H - 68), "Type a message…", fill=(120, 124, 132), font=load_font(11))
    draw.text((12, VIDEO_H - 28), "GIF", fill=(181, 186, 193), font=load_font(10, bold=True))

    img.save(OVERLAY_PNG, "PNG")
    print(f"Wrote {OVERLAY_PNG}")


def encode_video() -> None:
    if not SRC.exists():
        sys.exit(f"Missing source video: {SRC}")
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(SRC),
        "-loop",
        "1",
        "-framerate",
        "30",
        "-i",
        str(OVERLAY_PNG),
        "-filter_complex",
        f"[0:v][1:v]overlay={OVERLAY_X}:0:shortest=1[out]",
        "-map",
        "[out]",
        "-an",
        "-c:v",
        "libx264",
        "-crf",
        "20",
        "-preset",
        "medium",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(OUT),
    ]
    subprocess.run(cmd, check=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_overlay()
    encode_video()
