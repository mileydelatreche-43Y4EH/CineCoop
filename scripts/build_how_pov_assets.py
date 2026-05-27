"""Generate viewport screenshots for the how-pov tutorial (16:10)."""
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
HOW = ROOT / "assets" / "how"
REF = HOW / "ref"
ASSETS = ROOT / "assets"
EXT_ICONS = ROOT.parent / "cinepulse-duo" / "icons"

# 16:10 @ 1080p height (min) — sharp assets for the how-pov “video” carousel
W, H = 1920, 1200
S = W / 800
SHOT_HI = 1
POPUP_TARGET_W = int(round(302 * S))
HERO_VIDEO = ASSETS / "landing_teleparty_hq.mp4"
HERO_FRAME_SEC = 6.0
HERO_FRAME_STEP5_SEC = 10.0
CHAT_W = int(round(W * 0.26))

HOW_PARTY_MEMBERS = (
    ("You", "#5865f2", "M"),
    ("Nora", "#57a55a", "N"),
    ("Nina", "#e91e63", "N"),
)

# (name, color, initial, text, has_gif, time_label, highlight_new)
HOW_PARTY_MESSAGES = (
    ("Nina", "#e91e63", "N", "can we skip the intro?", False, "5m", False),
    ("Nora", "#57a55a", "N", "host has control — fair", False, "4m", False),
    ("Nina", "#e91e63", "N", "ok no spoilers pls", False, "2m", False),
    ("Nora", "#57a55a", "N", "we're synced now", False, "1m", False),
    ("Nina", "#e91e63", "N", "this scene is insane", False, "now", True),
    ("Nora", "#57a55a", "N", "GIF incoming", True, "now", True),
)
HOW_PARTY_TYPING = ("Nora", "#57a55a", "N")


def _s(value: float) -> int:
    return int(round(value * S))


# Viewport-only assets: popup drops below the toolbar CineCoop icon (top-right).
POPUP_GAP_TOP = _s(6)
POPUP_GAP_RIGHT = _s(10)
BRAND_MASTER = ASSETS / "brand-cp.png"
POPUP_REF_W = 356
# Logo header zone in popup ref captures (popup-invite-active, popup-start-session).
POPUP_HEADER_LOGO_XY_SIDE = (8, 8, 39)


def cover_crop(img: Image.Image, tw: int, th: int) -> Image.Image:
    iw, ih = img.size
    scale = max(tw / iw, th / ih)
    nw, nh = max(1, int(iw * scale)), max(1, int(ih * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return resized.crop((left, top, left + tw, top + th))


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


def _save_png(img: Image.Image, path: Path) -> None:
    img.save(path, "PNG", compress_level=2)


def _rounded_rect(draw, xy, radius, fill):
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def _draw_text_centered(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    fill: str | tuple[int, int, int],
) -> None:
    x0, y0, x1, y1 = box
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    draw.text((cx, cy), text, fill=fill, font=font, anchor="mm")


def _brand_icon(side: int) -> Image.Image:
    """Render CineCoop logo from master PNG (sharp at any size)."""
    path = BRAND_MASTER if BRAND_MASTER.exists() else ASSETS / "brand-cp-48.png"
    icon = Image.open(path).convert("RGBA")
    side = max(1, side)
    if icon.width != side or icon.height != side:
        icon = icon.resize((side, side), Image.Resampling.LANCZOS)
    return icon


def _export_how_brand_icons() -> None:
    for size in (48, 96, 128):
        _brand_icon(size).save(HOW / f"brand-cp-{size}.png", optimize=True)


def _replace_popup_header_logo(popup: Image.Image) -> Image.Image:
    """Replace blurry screenshot logo with HQ render from brand-cp.png."""
    scale = popup.width / POPUP_REF_W
    x0, y0, side = POPUP_HEADER_LOGO_XY_SIDE
    x0 = int(round(x0 * scale))
    y0 = int(round(y0 * scale))
    side = int(round(side * scale))
    pad = max(1, int(round(2 * scale)))
    out = popup.copy()
    draw = ImageDraw.Draw(out)
    draw.rounded_rectangle(
        (x0 - pad, y0 - pad, x0 + side + pad, y0 + side + pad),
        radius=max(2, int(round(6 * scale))),
        fill=(15, 16, 18, 255),
    )
    icon = _brand_icon(side)
    out.paste(icon, (x0, y0), icon)
    return out


def _paste_icon(base: Image.Image, box: tuple[int, int, int, int], inset: int = 0):
    """Paste brand icon scaled to fit the box."""
    bw = box[2] - box[0] - inset * 2
    bh = box[3] - box[1] - inset * 2
    side = max(1, min(bw, bh))
    icon = _brand_icon(side)
    x = box[0] + inset + (bw - icon.width) // 2
    y = box[1] + inset + (bh - icon.height) // 2
    layer = base.convert("RGBA")
    layer.paste(icon, (x, y), icon)
    base.paste(layer.convert("RGB"))


def _hero_playback_frame(at_sec: float = HERO_FRAME_SEC) -> Image.Image:
    """Sharp Netflix-style frame for the left player (not a white page)."""
    if HERO_VIDEO.exists():
        tmp = Path(tempfile.mkdtemp(prefix="cinecoop-how-frame-"))
        out = tmp / "frame.png"
        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-ss",
                    str(at_sec),
                    "-i",
                    str(HERO_VIDEO),
                    "-frames:v",
                    "1",
                    "-vf",
                    "scale=1920:-2",
                    str(out),
                ],
                check=True,
                capture_output=True,
            )
            frame = Image.open(out).convert("RGB")
            return cover_crop(frame, W, H)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    return _netflix_back(dim=0.0)


def _netflix_back(dim: float = 0.0) -> Image.Image:
    """Full-screen player — simple black background, no oval or fake logos."""
    img = Image.new("RGB", (W, H), "#0b0b0b")
    draw = ImageDraw.Draw(img)
    # Subtle progress bar at the bottom
    bar_y = H - _s(28)
    draw.rectangle((0, bar_y, W, H), fill="#141414")
    draw.rectangle((_s(24), bar_y + _s(10), W - _s(24), bar_y + _s(14)), fill="#2a2a2a")
    draw.rectangle((_s(24), bar_y + _s(10), _s(24) + int((W - _s(48)) * 0.22), bar_y + _s(14)), fill="#e50914")
    if dim > 0:
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, int(255 * dim)))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return img


def _paste_popup_ref(base: Image.Image, ref_filename: str) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """Paste a real extension popup screenshot from assets/how/ref/."""
    path = REF / ref_filename
    if not path.exists():
        raise FileNotFoundError(f"Missing popup ref: {path}")
    popup = Image.open(path).convert("RGBA")
    tw = POPUP_TARGET_W
    th = max(1, int(popup.height * tw / popup.width))
    popup = popup.resize((tw, th), Image.Resampling.LANCZOS)
    popup = _replace_popup_header_logo(popup)
    px = W - tw - POPUP_GAP_RIGHT
    py = POPUP_GAP_TOP
    layer = base.convert("RGBA")
    layer.paste(popup, (px, py), popup)
    return layer.convert("RGB"), (px, py, px + tw, py + th)


def _click_pct(box: tuple[int, int, int, int], rel_x: float, rel_y: float) -> tuple[float, float]:
    x0, y0, x1, y1 = box
    cx = x0 + (x1 - x0) * rel_x
    cy = y0 + (y1 - y0) * rel_y
    return round(cx / W * 100, 1), round(cy / H * 100, 1)


def _invite_copy_hotspot(box: tuple[int, int, int, int]) -> tuple[float, float]:
    """Centre du bouton copier (icône presse-papiers) à droite du lien d'invitation."""
    return _click_pct(box, 0.906, 0.724)


def step0_store() -> dict:
    img = Image.new("RGB", (W, H), "#eef1f5")
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, W, _s(56)), fill="#ffffff")
    draw.line((0, _s(56), W, _s(56)), fill="#e3e6ea", width=1)
    draw.text((_s(24), _s(18)), "Chrome Web Store", fill="#5f6368", font=_font(_s(12)))

    card = (W // 2 - _s(220), _s(92), W // 2 + _s(220), _s(410))
    _rounded_rect(draw, card, _s(18), "#ffffff")

    icon_outer = _s(118)
    icon_y = _s(118)
    icon_x = W // 2 - icon_outer // 2
    icon_box = (icon_x, icon_y, icon_x + icon_outer, icon_y + icon_outer)
    _paste_icon(img, icon_box, inset=_s(8))

    title_font = _font(_s(34), True)
    title = "CineCoop"
    tb = draw.textbbox((0, 0), title, font=title_font)
    draw.text(
        ((W - (tb[2] - tb[0])) / 2 - tb[0], icon_y + icon_outer + _s(22)),
        title,
        fill="#1a1d24",
        font=title_font,
    )

    btn = (W // 2 - _s(108), _s(332), W // 2 + _s(108), _s(388))
    _rounded_rect(draw, btn, _s(26), (26, 115, 232))
    _draw_text_centered(draw, btn, "Add to Chrome", _font(_s(17), True), "#ffffff")

    _save_png(img, HOW / "step-0-store.png")
    cx = (btn[0] + btn[2]) / 2 / W * 100
    cy = (btn[1] + btn[3]) / 2 / H * 100
    return {"click": (round(cx, 1), round(cy, 1))}


def _minimal_player_frame(
    width: int = W,
    height: int = H,
    *,
    progress: float = 0.2,
) -> Image.Image:
    """Fond noir + barre de progression rouge en bas (sans bouton play)."""
    img = Image.new("RGB", (width, height), "#0b0b0b")
    draw = ImageDraw.Draw(img)

    controls_h = _s(22)
    bar_y = height - controls_h
    draw.rectangle((0, bar_y, width, height), fill="#141414")
    pad_x = _s(40)
    track = (pad_x, bar_y + _s(9), width - pad_x, bar_y + _s(12))
    draw.rectangle(track, fill="#3a3a3a")
    prog = max(0.04, min(0.98, progress))
    draw.rectangle(
        (
            track[0],
            track[1],
            track[0] + int((track[2] - track[0]) * prog),
            track[3],
        ),
        fill="#e50914",
    )
    return img


def step1_netflix_play() -> dict:
    img = _minimal_player_frame()
    _save_png(img, HOW / "step-1-netflix-play.png")
    cy = (H - _s(22)) // 2
    cy_pct = round(cy / H * 100, 1)
    return {"click": (50.0, cy_pct)}


def step2_popup_start() -> dict:
    img = _netflix_back(dim=0.42)
    img, box = _paste_popup_ref(img, "popup-start-session.png")
    _save_png(img, HOW / "step-2-popup-start.png")
    return {"click": _click_pct(box, 0.5, 0.65)}


def step3_popup_invite() -> dict:
    """Invite friends — lecteur minimal + popup extension (pas de capture vidéo)."""
    img = _minimal_player_frame()
    img, box = _paste_popup_ref(img, "popup-invite-active.png")
    _save_png(img, HOW / "step-3-popup-invite.png")
    return {
        "click": _invite_copy_hotspot(box),
        "from": (92.0, 11.0),
    }


def _hex_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _draw_avatar(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    size: int,
    color: str,
    initial: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    *,
    online: bool = False,
) -> None:
    x, y = xy
    draw.ellipse((x, y, x + size, y + size), fill=_hex_rgb(color))
    draw.text((x + size / 2, y + size / 2), initial, fill="#ffffff", font=font, anchor="mm")
    if online:
        dot = max(3, size // 4)
        ox = x + size - dot + 1
        oy = y + size - dot + 1
        draw.ellipse((ox - 1, oy - 1, ox + dot + 1, oy + dot + 1), fill="#0b0b0d")
        draw.ellipse((ox, oy, ox + dot, oy + dot), fill="#3ba55d")


def _message_block_height(has_gif: bool) -> int:
    h = _s(36)
    if has_gif:
        h += _s(56) + _s(6)
    return h


def _draw_typing_indicator(
    draw: ImageDraw.ImageDraw,
    y: int,
    pad: int,
    av_size: int,
    name: str,
    color: str,
    initial: str,
    name_font,
    text_font,
) -> int:
    """Typing bubble — returns block height."""
    h = _s(26)
    _draw_avatar(draw, (pad, y + _s(2)), av_size, color, initial, _font(_s(9), True), online=True)
    bubble_x = pad + av_size + _s(6)
    bubble = (bubble_x, y, CHAT_W - pad, y + h)
    _rounded_rect(draw, bubble, _s(10), "#1a1d24")
    draw.rectangle(bubble, outline="#2f3544", width=1)
    draw.text((bubble_x + _s(10), y + h // 2), f"{name} is typing", fill="#9aa3b5", font=name_font, anchor="lm")
    for i, col in enumerate(("#5c7088", "#7a8aa3", "#69b4ff")):
        dx = bubble_x + _s(88) + i * _s(7)
        draw.ellipse((dx, y + h // 2 - _s(2), dx + _s(4), y + h // 2 + _s(2)), fill=col)
    return h + _s(6)


def _render_cinecoop_chat_panel() -> Image.Image:
    """Sharp in-page chat (same look as hero demo), drawn in vector style."""
    panel = Image.new("RGB", (CHAT_W, H), "#0b0b0d")
    draw = ImageDraw.Draw(panel)

    pad = _s(8)
    brand_font = _font(_s(11), True)
    title_font = _font(_s(7))
    member_font = _font(_s(8))
    name_font = _font(_s(9), True)
    text_font = _font(_s(10))
    time_font = _font(_s(7))
    chip_font = _font(_s(8), True)
    compose_font = _font(_s(9))
    gif_font = _font(_s(8), True)

    y = 0
    head_h = _s(22)
    draw.rectangle((0, y, CHAT_W, y + head_h), fill="#0f0f12")
    draw.line((0, y + head_h, CHAT_W, y + head_h), fill="#202020", width=1)
    draw.text((pad, y + head_h / 2), "CineCoop", fill="#5ca6ff", font=brand_font, anchor="lm")
    badge_w = _s(16)
    badge_x = pad + _s(62)
    badge_y = y + head_h // 2 - badge_w // 2
    draw.ellipse((badge_x, badge_y, badge_x + badge_w, badge_y + badge_w), fill="#5865f2")
    draw.text((badge_x + badge_w / 2, badge_y + badge_w / 2), "2", fill="#ffffff", font=_font(_s(8), True), anchor="mm")
    live_x = CHAT_W - pad - _s(34)
    draw.ellipse((live_x, y + head_h // 2 - _s(3), live_x + _s(6), y + head_h // 2 + _s(3)), fill="#3ba55d")
    draw.text((live_x - _s(4), y + head_h / 2), "Live", fill="#7d8aa3", font=title_font, anchor="rm")
    y += head_h

    members_h = _s(52)
    draw.rectangle((0, y, CHAT_W, y + members_h), fill="#0f0f12")
    draw.text((pad, y + _s(6)), "SESSION MEMBERS", fill="#8f9ab2", font=title_font)
    chip_y = y + _s(20)
    chip_x = pad
    av = _s(14)
    online_members = {"Nora", "Nina"}
    for label, color, initial in HOW_PARTY_MEMBERS:
        chip_w = _s(58)
        _rounded_rect(draw, (chip_x, chip_y, chip_x + chip_w, chip_y + _s(20)), _s(10), "#121214")
        draw.rectangle(
            (chip_x, chip_y, chip_x + chip_w, chip_y + _s(20)),
            outline="#262626",
            width=1,
        )
        _draw_avatar(
            draw,
            (chip_x + _s(3), chip_y + _s(3)),
            av,
            color,
            initial,
            chip_font,
            online=label in online_members,
        )
        draw.text((chip_x + _s(20), chip_y + _s(10)), label, fill="#dce3ef", font=member_font, anchor="lm")
        chip_x += chip_w + _s(6)
    draw.line((0, y + members_h, CHAT_W, y + members_h), fill="#202020", width=1)
    y += members_h

    log_top = y
    compose_h = _s(44)
    log_bottom = H - compose_h
    draw.rectangle((0, log_top, CHAT_W, log_bottom), fill="#0b0b0d")

    msg_x = pad
    av_msg = _s(18)
    gap = _s(8)
    typing_h = _s(32)
    available = log_bottom - log_top - pad * 2 - typing_h

    visible = list(HOW_PARTY_MESSAGES)
    while visible:
        total = sum(_message_block_height(m[4]) + gap for m in visible) + typing_h
        if total <= available or len(visible) <= 3:
            break
        visible.pop(0)

    block_heights = [_message_block_height(m[4]) + gap for m in visible]
    cy = log_bottom - pad - typing_h - sum(block_heights)

    for name, color, initial, text, has_gif, time_label, highlight in visible:
        block_h = _message_block_height(has_gif)
        body_x = msg_x + av_msg + _s(6)
        if highlight:
            _rounded_rect(
                draw,
                (msg_x - _s(2), cy - _s(2), CHAT_W - pad + _s(2), cy + block_h + _s(4)),
                _s(8),
                "#141820",
            )
        _draw_avatar(
            draw,
            (msg_x, cy),
            av_msg,
            color,
            initial,
            _font(_s(10), True),
            online=name in online_members,
        )
        draw.text((body_x, cy), name, fill="#b7caea", font=name_font)
        if time_label:
            draw.text((CHAT_W - pad, cy + _s(1)), time_label, fill="#6b7385", font=time_font, anchor="rt")
        text_y = cy + _s(14)
        if text:
            draw.text((body_x, text_y), text, fill="#e8edf7", font=text_font)
        if has_gif:
            gif_y = text_y + (_s(18) if text else 0)
            gif_w = CHAT_W - body_x - pad
            gif_h = _s(56)
            _rounded_rect(draw, (body_x, gif_y, body_x + gif_w, gif_y + gif_h), _s(10), "#1a1c22")
            draw.rectangle((body_x, gif_y, body_x + gif_w, gif_y + gif_h), outline="#2e3340", width=1)
            draw.line(
                (body_x + _s(12), gif_y + gif_h // 2, body_x + gif_w - _s(12), gif_y + gif_h // 2),
                fill="#3d4454",
                width=_s(3),
            )
            draw.polygon(
                [
                    (body_x + gif_w // 2 - _s(8), gif_y + gif_h // 2 - _s(10)),
                    (body_x + gif_w // 2 - _s(8), gif_y + gif_h // 2 + _s(10)),
                    (body_x + gif_w // 2 + _s(12), gif_y + gif_h // 2),
                ],
                fill="#69b4ff",
            )
        cy += block_h + gap

    t_name, t_color, t_initial = HOW_PARTY_TYPING
    _draw_typing_indicator(draw, cy, pad, _s(14), t_name, t_color, t_initial, name_font, text_font)

    draw.line((0, log_bottom, CHAT_W, log_bottom), fill="#202020", width=1)
    draw.rectangle((0, log_bottom, CHAT_W, H), fill="#1e1f22")
    field = (pad, log_bottom + _s(8), CHAT_W - pad, H - _s(8))
    _rounded_rect(draw, field, _s(10), "#383a40")
    draft = "this scene is"
    draw.text((field[0] + _s(12), (field[1] + field[3]) // 2), draft, fill="#dce0e6", font=compose_font, anchor="lm")
    tb = draw.textbbox((0, 0), draft, font=compose_font)
    caret_x = field[0] + _s(12) + (tb[2] - tb[0])
    caret_y0 = (field[1] + field[3]) // 2 - _s(6)
    draw.line((caret_x + _s(2), caret_y0, caret_x + _s(2), caret_y0 + _s(12)), fill="#69b4ff", width=2)
    gif_btn = (field[2] - _s(44), field[1] + _s(4), field[2] - _s(6), field[3] - _s(4))
    _rounded_rect(draw, gif_btn, _s(8), "#4a4d55")
    _draw_text_centered(draw, gif_btn, "GIF", gif_font, "#e8edf7")

    return panel


def _paste_drawn_chat(base: Image.Image) -> Image.Image:
    panel = _render_cinecoop_chat_panel()
    out = base.convert("RGB")
    out.paste(panel, (W - CHAT_W, 0))
    draw = ImageDraw.Draw(out)
    draw.line((W - CHAT_W, 0, W - CHAT_W, H), fill="#303030", width=1)
    return out


def step4_party() -> dict:
    """Enjoy together — lecteur minimal (comme étapes 3–4) + chat CineCoop, sans vraie vidéo."""
    player_w = W - CHAT_W
    img = Image.new("RGB", (W, H), "#0b0b0b")
    player = _minimal_player_frame(player_w, H, progress=0.38)
    img.paste(player, (0, 0))
    _save_png(img, HOW / "step-4-player.png")
    img = _paste_drawn_chat(img)
    _save_png(img, HOW / "step-4-party.png")
    return {"click": (42.0, 50.0)}


def main():
    HOW.mkdir(parents=True, exist_ok=True)
    _export_how_brand_icons()

    hotspots = {
        "0": step0_store(),
        "1": step1_netflix_play(),
        "2": step2_popup_start(),
        "3": step3_popup_invite(),
        "4": step4_party(),
    }
    print("Hotspots (% left, % top):")
    for k, v in hotspots.items():
        print(f"  step {k}: click={v['click']}")
    print(f"Assets written to {HOW}")


if __name__ == "__main__":
    main()
