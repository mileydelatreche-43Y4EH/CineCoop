"""Replace Elias with Nina in chat-sidebar-demo.png and rebuild step-4-party."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "assets" / "how" / "ref" / "chat-sidebar-demo.png"

PINK = (233, 30, 99)
PILL_BG = (30, 30, 34)
PILL_BORDER = (38, 38, 42)
BG = (11, 11, 13)
TEXT = (240, 244, 250)


def _font(size: int, bold: bool = False):
    paths = (
        ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    )
    for path in paths:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_avatar(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, letter: str) -> None:
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PINK)
    f = _font(9, True)
    tw = draw.textlength(letter, font=f)
    draw.text((cx - tw / 2, cy - 6), letter, fill=(255, 255, 255), font=f)


def patch_chat_ref() -> None:
    im = Image.open(REF).convert("RGB")
    draw = ImageDraw.Draw(im)

    # Session members pill
    draw.rounded_rectangle((118, 34, 198, 52), radius=10, fill=PILL_BG, outline=PILL_BORDER, width=1)
    draw_avatar(draw, 130, 43, 8, "N")
    draw.text((142, 37), "Nina", fill=TEXT, font=_font(10))

    # Author strip only (avatar + name), leave message body intact
    for y0, y1 in ((168, 184), (274, 290), (383, 399)):
        draw.rectangle((0, y0, 78, y1), fill=BG)
        cy = (y0 + y1) // 2
        draw_avatar(draw, 14, cy, 8, "N")
        draw.text((28, y0 + 2), "Nina", fill=TEXT, font=_font(11, True))

    im.save(REF, "PNG", compress_level=2)
    print(f"Patched {REF}")


def main() -> None:
    patch_chat_ref()
    sys.path.insert(0, str(ROOT / "scripts"))
    from build_how_pov_assets import step4_party

    step4_party()
    print("Rebuilt step-4-party.png")


if __name__ == "__main__":
    main()
