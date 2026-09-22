"""Build a macOS iconset using the same shapes as the app icon."""
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICONSET = ROOT / "build" / "Studieportalen.iconset"


def render(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    scale = size / 512
    point = lambda x, y: (round(x * scale), round(y * scale))
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(116 * scale), fill="#0b1020")
    draw.rounded_rectangle((*point(70, 70), *point(442, 442)), radius=round(92 * scale), fill="#6857e8")
    draw.polygon([point(100, 206), point(256, 122), point(412, 206), point(256, 290)], fill="white")
    draw.polygon([point(158, 256), point(256, 309), point(354, 256), point(354, 350), point(305, 379), point(207, 379), point(158, 350)], fill="white")
    draw.line([point(402, 217), point(402, 313)], fill="white", width=max(1, round(20 * scale)))
    draw.ellipse((*point(385, 320), *point(419, 354)), fill="white")
    return image


if __name__ == "__main__":
    ICONSET.mkdir(parents=True, exist_ok=True)
    for logical_size in (16, 32, 128, 256, 512):
        render(logical_size).save(ICONSET / f"icon_{logical_size}x{logical_size}.png")
        render(logical_size * 2).save(ICONSET / f"icon_{logical_size}x{logical_size}@2x.png")
    print(f"Mac-ikonuppsättning klar: {ICONSET}")
