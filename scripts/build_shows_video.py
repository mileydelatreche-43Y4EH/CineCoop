"""Re-encode landingpage_shows with #FAFAFA background and higher quality."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ASSETS / "landingpage_shows.mp4"
BACKUP = ASSETS / "landingpage_shows_source.mp4"

BG_HEX = "0xFAFAFA"
SIZE = "850x478"
# Keys near-white poster grid background without eating poster highlights
COLORKEY = (
    "format=rgba,"
    "colorkey=0xFFFFFF:0.06:0.04,"
    "colorkey=0xFAFAFA:0.03:0.02"
)


def resolve_source() -> Path:
    if BACKUP.exists():
        return BACKUP
    if OUT.exists():
        shutil.copy2(OUT, BACKUP)
        return BACKUP
    raise FileNotFoundError(f"No source video: {BACKUP} or {OUT}")


def main() -> int:
    src = resolve_source()
    if not BACKUP.exists():
        shutil.copy2(src, BACKUP)

    fc = (
        f"color=c={BG_HEX}:s={SIZE}[bg];"
        f"[0:v]{COLORKEY}[fg];"
        "[bg][fg]overlay=shortest=1:format=auto,"
        "unsharp=5:5:0.35:5:5:0.0,"
        "format=yuv420p"
    )
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src),
        "-filter_complex",
        fc,
        "-c:v",
        "libx264",
        "-crf",
        "16",
        "-preset",
        "slow",
        "-movflags",
        "+faststart",
        "-an",
        str(OUT),
    ]
    print("Running:", " ".join(cmd))
    subprocess.run(cmd, check=True)
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
