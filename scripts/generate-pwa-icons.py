from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"


def rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4)) + (alpha,)


def blend(left: str, right: str, factor: float) -> tuple[int, int, int, int]:
    a = rgba(left)
    b = rgba(right)
    return tuple(round(a[index] + (b[index] - a[index]) * factor) for index in range(4))


def build_background(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pixels = image.load()

    for y in range(size):
        for x in range(size):
            factor = min(1.0, (x / max(size - 1, 1)) * 0.58 + (y / max(size - 1, 1)) * 0.42)
            pixels[x, y] = blend("#07110d", "#173824", factor)

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.23), fill=255)
    image.putalpha(mask)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((size * 0.14, size * 0.08, size * 0.9, size * 0.82), fill=rgba("#b8ff5a", 54))
    glow_draw.ellipse((size * 0.46, size * 0.18, size * 1.0, size * 0.74), fill=rgba("#68d7ff", 34))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.1))
    image.alpha_composite(glow)
    return image


def draw_arc_accent(target: Image.Image, size: int) -> None:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    stroke = max(3, round(size * 0.012))
    draw.arc((size * 0.08, size * 0.12, size * 0.4, size * 0.44), start=208, end=34, fill=rgba("#eafdea", 138), width=stroke)
    draw.arc((size * 0.61, size * 0.12, size * 0.94, size * 0.46), start=204, end=24, fill=rgba("#68d7ff", 138), width=stroke)
    target.alpha_composite(layer)


def draw_chain(target: Image.Image, size: int) -> None:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    width = size * 0.24
    height = size * 0.12
    stroke = max(7, round(size * 0.036))

    def link(center: tuple[float, float], angle: float, color: str) -> None:
        overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        rect = (
            center[0] - width / 2,
            center[1] - height / 2,
            center[0] + width / 2,
            center[1] + height / 2,
        )
        overlay_draw.rounded_rectangle(rect, radius=height / 2, outline=rgba(color), width=stroke)
        overlay.rotate(angle, resample=Image.Resampling.BICUBIC, center=center)
        rotated = overlay.rotate(angle, resample=Image.Resampling.BICUBIC, center=center)
        layer.alpha_composite(rotated)

    link((size * 0.4, size * 0.28), -32, "#b8ff5a")
    link((size * 0.57, size * 0.28), 32, "#f4f7f2")

    blur = layer.filter(ImageFilter.GaussianBlur(radius=size * 0.025))
    target.alpha_composite(Image.blend(Image.new("RGBA", (size, size), (0, 0, 0, 0)), blur, 0.38))
    target.alpha_composite(layer)


def draw_ball(target: Image.Image, size: int) -> None:
    cx, cy = size * 0.5, size * 0.64
    radius = size * 0.24

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((cx - radius * 1.15, cy + radius * 0.62, cx + radius * 1.15, cy + radius * 1.42), fill=rgba("#020604", 92))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.04))
    target.alpha_composite(shadow)

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=rgba("#f5f7f2"), outline=rgba("#08120d"), width=max(4, round(size * 0.016)))

    pentagon = []
    for index in range(5):
        angle = math.radians(-90 + index * 72)
        pentagon.append((cx + math.cos(angle) * radius * 0.33, cy + math.sin(angle) * radius * 0.33))
    draw.polygon(pentagon, fill=rgba("#b8ff5a"), outline=rgba("#08120d"))

    seam = max(2, round(size * 0.008))
    for px, py in pentagon:
        draw.line((cx, cy, px, py), fill=rgba("#08120d"), width=seam)

    for index in range(5):
        angle = math.radians(-54 + index * 72)
        outer_x = cx + math.cos(angle) * radius * 0.7
        outer_y = cy + math.sin(angle) * radius * 0.7
        draw.line((pentagon[index][0], pentagon[index][1], outer_x, outer_y), fill=rgba("#08120d"), width=seam)

    target.alpha_composite(layer)


def build_icon(size: int) -> Image.Image:
    image = build_background(size)

    streaks = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    streak_draw = ImageDraw.Draw(streaks)
    streak_draw.rounded_rectangle((size * 0.16, size * 0.74, size * 0.84, size * 0.82), radius=size * 0.04, fill=rgba("#b8ff5a", 88))
    streak_draw.rounded_rectangle((size * 0.48, size * 0.34, size * 0.86, size * 0.4), radius=size * 0.03, fill=rgba("#68d7ff", 76))
    streaks = streaks.filter(ImageFilter.GaussianBlur(radius=size * 0.045))
    image.alpha_composite(streaks)

    draw_chain(image, size)
    draw_ball(image, size)
    draw_arc_accent(image, size)
    return image


def build_icon_v3(size: int) -> Image.Image:
    image = build_background(size)

    streaks = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    streak_draw = ImageDraw.Draw(streaks)
    streak_draw.rounded_rectangle((size * 0.14, size * 0.68, size * 0.88, size * 0.78), radius=size * 0.05, fill=rgba("#b8ff5a", 120))
    streaks = streaks.filter(ImageFilter.GaussianBlur(radius=size * 0.05))
    image.alpha_composite(streaks)

    draw_ball(image, size)

    badge = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    badge_draw = ImageDraw.Draw(badge)
    badge_draw.rounded_rectangle(
        (size * 0.55, size * 0.14, size * 0.84, size * 0.33),
        radius=size * 0.07,
        fill=rgba("#0c1711", 220),
        outline=rgba("#dff7df", 110),
        width=max(3, round(size * 0.01)),
    )
    image.alpha_composite(badge)

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    width = size * 0.18
    height = size * 0.09
    stroke = max(6, round(size * 0.026))

    def link(center: tuple[float, float], angle: float, color: str) -> None:
        overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        rect = (
            center[0] - width / 2,
            center[1] - height / 2,
            center[0] + width / 2,
            center[1] + height / 2,
        )
        overlay_draw.rounded_rectangle(rect, radius=height / 2, outline=rgba(color), width=stroke)
        rotated = overlay.rotate(angle, resample=Image.Resampling.BICUBIC, center=center)
        layer.alpha_composite(rotated)

    link((size * 0.64, size * 0.22), -28, "#b8ff5a")
    link((size * 0.74, size * 0.22), 28, "#f4f7f2")
    blur = layer.filter(ImageFilter.GaussianBlur(radius=size * 0.015))
    image.alpha_composite(Image.blend(Image.new("RGBA", (size, size), (0, 0, 0, 0)), blur, 0.34))
    image.alpha_composite(layer)

    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring)
    ring_draw.arc((size * 0.07, size * 0.1, size * 0.35, size * 0.38), start=210, end=24, fill=rgba("#eafdea", 118), width=max(2, round(size * 0.01)))
    ring_draw.arc((size * 0.63, size * 0.46, size * 0.93, size * 0.76), start=200, end=344, fill=rgba("#68d7ff", 118), width=max(2, round(size * 0.01)))
    image.alpha_composite(ring)
    return image


def save(name: str, size: int) -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    build_icon(size).save(PUBLIC_DIR / name, format="PNG")


def main() -> None:
    save("icon-512.png", 512)
    save("icon-192.png", 192)
    save("apple-touch-icon.png", 180)
    save("icon-512-v2.png", 512)
    save("icon-192-v2.png", 192)
    save("apple-touch-icon-v2.png", 180)
    build_icon_v3(512).save(PUBLIC_DIR / "icon-512-v3.png", format="PNG")
    build_icon_v3(192).save(PUBLIC_DIR / "icon-192-v3.png", format="PNG")
    build_icon_v3(180).save(PUBLIC_DIR / "apple-touch-icon-v3.png", format="PNG")


if __name__ == "__main__":
    main()
