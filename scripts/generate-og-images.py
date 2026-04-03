from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"
FONT_PATH = ROOT / "src" / "app" / "fonts" / "PretendardVariable.ttf"
WIDTH = 1200
HEIGHT = 630


def rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4)) + (alpha,)


def blend(left: str, right: str, factor: float) -> tuple[int, int, int, int]:
    a = rgba(left)
    b = rgba(right)
    return tuple(round(a[index] + (b[index] - a[index]) * factor) for index in range(4))


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_PATH), size=size)


def background() -> Image.Image:
    image = Image.new("RGBA", (WIDTH, HEIGHT), rgba("#07110d"))
    pixels = image.load()

    for y in range(HEIGHT):
        for x in range(WIDTH):
            factor = min(1.0, (x / max(WIDTH - 1, 1)) * 0.68 + (y / max(HEIGHT - 1, 1)) * 0.32)
            pixels[x, y] = blend("#07110d", "#173824", factor)

    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((520, -40, 1220, 620), fill=rgba("#b8ff5a", 52))
    glow_draw.ellipse((700, 80, 1220, 560), fill=rgba("#68d7ff", 36))
    glow_draw.rounded_rectangle((88, 472, 720, 520), radius=24, fill=rgba("#b8ff5a", 72))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=34))
    image.alpha_composite(glow)

    lines = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    line_draw = ImageDraw.Draw(lines)
    line_draw.rounded_rectangle((54, 54, WIDTH - 54, HEIGHT - 54), radius=42, outline=rgba("#e9fdea", 116), width=3)
    line_draw.arc((-90, 132, 298, 510), start=54, end=304, fill=rgba("#e9fdea", 84), width=3)
    line_draw.arc((780, 40, 1230, 530), start=208, end=30, fill=rgba("#e9fdea", 84), width=3)
    line_draw.line((88, 316, 1110, 316), fill=rgba("#e9fdea", 76), width=2)
    line_draw.line((880, 110, 1110, 110), fill=rgba("#b8ff5a", 192), width=5)
    image.alpha_composite(lines)

    return image


def draw_link(layer: Image.Image, center: tuple[float, float], width: float, height: float, angle: float, color: str, stroke: int) -> None:
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    rect = (
        center[0] - width / 2,
        center[1] - height / 2,
        center[0] + width / 2,
        center[1] + height / 2,
    )
    draw.rounded_rectangle(rect, radius=height / 2, outline=rgba(color), width=stroke)
    rotated = overlay.rotate(angle, resample=Image.Resampling.BICUBIC, center=center)
    layer.alpha_composite(rotated)


def draw_ball(layer: Image.Image, center: tuple[float, float], radius: float) -> None:
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=rgba("#f5f7f2"), outline=rgba("#08120d"), width=8)

    pentagon = []
    for index in range(5):
        angle = math.radians(-90 + index * 72)
        pentagon.append((cx + math.cos(angle) * radius * 0.32, cy + math.sin(angle) * radius * 0.32))
    draw.polygon(pentagon, fill=rgba("#b8ff5a"), outline=rgba("#08120d"))

    for px, py in pentagon:
        draw.line((cx, cy, px, py), fill=rgba("#08120d"), width=5)


def hero(base: Image.Image) -> None:
    shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((596, 352, 1128, 594), fill=rgba("#020604", 98))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=32))
    base.alpha_composite(shadow)

    emblem = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_link(emblem, center=(846, 202), width=286, height=118, angle=-30, color="#b8ff5a", stroke=34)
    draw_link(emblem, center=(1020, 202), width=286, height=118, angle=30, color="#f5f7f2", stroke=34)
    draw_link(emblem, center=(804, 420), width=354, height=72, angle=0, color="#f5f7f2", stroke=28)
    draw_ball(emblem, center=(990, 420), radius=104)
    base.alpha_composite(emblem)

    accent = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    accent_draw = ImageDraw.Draw(accent)
    accent_draw.arc((710, 132, 902, 330), start=196, end=34, fill=rgba("#b8ff5a", 166), width=10)
    accent_draw.arc((978, 136, 1180, 342), start=198, end=338, fill=rgba("#68d7ff", 166), width=10)
    accent_draw.rounded_rectangle((938, 490, 1094, 536), radius=22, fill=rgba("#68d7ff", 210))
    accent = accent.filter(ImageFilter.GaussianBlur(radius=1))
    base.alpha_composite(accent)


def add_text(base: Image.Image) -> None:
    draw = ImageDraw.Draw(base)
    copy = "CONNECT, PLAY, REPEAT"
    brand = "FOOTLINK"

    draw.text((84, 154), copy, font=font(72), fill=rgba("#f5f7f2"))
    draw.rounded_rectangle((84, 500, 360, 560), radius=18, fill=rgba("#b8ff5a"))
    draw.text((114, 515), brand, font=font(40), fill=rgba("#08120d"))


def create(include_text: bool) -> Image.Image:
    image = background()
    hero(image)
    if include_text:
        add_text(image)
    return image


def hero_v3(base: Image.Image) -> None:
    shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((432, 270, 1090, 620), fill=rgba("#020604", 100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=38))
    base.alpha_composite(shadow)

    emblem = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_ball(emblem, center=(760, 384), radius=150)
    draw_link(emblem, center=(944, 214), width=300, height=122, angle=30, color="#f5f7f2", stroke=36)
    draw_link(emblem, center=(790, 214), width=300, height=122, angle=-30, color="#b8ff5a", stroke=36)
    draw_link(emblem, center=(594, 392), width=428, height=82, angle=0, color="#f5f7f2", stroke=30)
    base.alpha_composite(emblem)

    accents = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    accent_draw = ImageDraw.Draw(accents)
    accent_draw.rounded_rectangle((476, 504, 720, 548), radius=22, fill=rgba("#b8ff5a", 138))
    accent_draw.rounded_rectangle((808, 504, 1048, 548), radius=22, fill=rgba("#68d7ff", 148))
    accent_draw.arc((556, 118, 746, 312), start=190, end=36, fill=rgba("#eafdea", 156), width=10)
    accents = accents.filter(ImageFilter.GaussianBlur(radius=2))
    base.alpha_composite(accents)


def add_text_v3(base: Image.Image) -> None:
    draw = ImageDraw.Draw(base)
    draw.text((84, 124), "PLAY TONIGHT", font=font(84), fill=rgba("#f5f7f2"))
    draw.rounded_rectangle((84, 500, 360, 560), radius=18, fill=rgba("#b8ff5a"))
    draw.text((114, 515), "FOOTLINK", font=font(40), fill=rgba("#08120d"))


def create_v3(include_text: bool) -> Image.Image:
    image = background()
    hero_v3(image)
    if include_text:
        add_text_v3(image)
    return image


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    create(True).save(PUBLIC_DIR / "og-footlink.png", format="PNG")
    create(False).save(PUBLIC_DIR / "og-footlink-clean.png", format="PNG")
    create(True).save(PUBLIC_DIR / "og-footlink-v2.png", format="PNG")
    create(False).save(PUBLIC_DIR / "og-footlink-clean-v2.png", format="PNG")
    create_v3(True).save(PUBLIC_DIR / "og-footlink-v3.png", format="PNG")
    create_v3(False).save(PUBLIC_DIR / "og-footlink-clean-v3.png", format="PNG")


if __name__ == "__main__":
    main()
