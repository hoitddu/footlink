from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"


def hex_to_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4)) + (alpha,)


def lerp_color(start: str, end: str, factor: float) -> tuple[int, int, int, int]:
    left = hex_to_rgba(start)
    right = hex_to_rgba(end)
    return tuple(
        round(left[index] + (right[index] - left[index]) * factor) for index in range(4)
    )


def rounded_gradient_background(size: int) -> Image.Image:
    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pixels = base.load()

    for y in range(size):
      for x in range(size):
            mix = ((x + y) / 2) / max(size - 1, 1)
            pixels[x, y] = lerp_color("#0e1e15", "#1f3b29", mix)

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = round(size * 0.225)
    mask_draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    base.putalpha(mask)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        (
            size * 0.43,
            size * 0.42,
            size * 0.96,
            size * 0.96,
        ),
        fill=hex_to_rgba("#b8ff5a", 64),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.065))
    base.alpha_composite(glow)

    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring)
    ring_width = max(4, round(size * 0.018))
    ring_draw.ellipse(
        (
            size * 0.63,
            size * 0.08,
            size * 1.03,
            size * 0.48,
        ),
        outline=hex_to_rgba("#dff7df", 36),
        width=ring_width,
    )
    base.alpha_composite(ring)

    return base


def draw_rotated_link(
    target: Image.Image,
    *,
    size: int,
    center: tuple[float, float],
    width: float,
    height: float,
    thickness: float,
    angle: float,
    color: str,
) -> None:
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    left = center[0] - width / 2
    top = center[1] - height / 2
    right = center[0] + width / 2
    bottom = center[1] + height / 2
    draw.rounded_rectangle(
        (left, top, right, bottom),
        radius=height / 2,
        outline=hex_to_rgba(color),
        width=max(3, round(thickness)),
    )
    rotated = overlay.rotate(angle, resample=Image.Resampling.BICUBIC, center=center)
    target.alpha_composite(rotated)


def draw_ball(target: Image.Image, *, size: int, center: tuple[float, float], radius: float) -> None:
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    outer = (
        center[0] - radius,
        center[1] - radius,
        center[0] + radius,
        center[1] + radius,
    )
    draw.ellipse(outer, fill=hex_to_rgba("#f3f4ef"), outline=hex_to_rgba("#0f1f16"), width=max(2, round(size * 0.01)))

    pentagon = []
    for step in range(5):
        angle = -90 + step * 72
        radians = angle * 3.14159265 / 180
        pentagon.append(
            (
                center[0] + radius * 0.34 * __import__("math").cos(radians),
                center[1] + radius * 0.34 * __import__("math").sin(radians),
            )
        )
    draw.polygon(pentagon, fill=hex_to_rgba("#b8ff5a"), outline=hex_to_rgba("#0f1f16"))

    for px, py in pentagon:
        draw.line((center[0], center[1], px, py), fill=hex_to_rgba("#0f1f16"), width=max(2, round(size * 0.008)))

    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=size * 0.001))
    target.alpha_composite(overlay)


def build_icon(size: int) -> Image.Image:
    image = rounded_gradient_background(size)

    draw_rotated_link(
        image,
        size=size,
        center=(size * 0.42, size * 0.43),
        width=size * 0.23,
        height=size * 0.115,
        thickness=size * 0.04,
        angle=-34,
        color="#b8ff5a",
    )
    draw_rotated_link(
        image,
        size=size,
        center=(size * 0.58, size * 0.43),
        width=size * 0.23,
        height=size * 0.115,
        thickness=size * 0.04,
        angle=34,
        color="#f3f4ef",
    )

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (size * 0.26, size * 0.62, size * 0.74, size * 0.72),
        radius=size * 0.05,
        fill=hex_to_rgba("#09110c", 90),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.03))
    image.alpha_composite(shadow)

    draw_ball(
        image,
        size=size,
        center=(size * 0.5, size * 0.66),
        radius=size * 0.11,
    )

    return image


def save_icon(filename: str, size: int) -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    icon = build_icon(size)
    icon.save(PUBLIC_DIR / filename, format="PNG")


def main() -> None:
    save_icon("icon-512.png", 512)
    save_icon("icon-192.png", 192)
    save_icon("apple-touch-icon.png", 180)


if __name__ == "__main__":
    main()
