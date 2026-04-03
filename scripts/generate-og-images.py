from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"
FONT_PATH = ROOT / "src" / "app" / "fonts" / "PretendardVariable.ttf"

WIDTH = 1200
HEIGHT = 630


def rgba(hex_value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = hex_value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4)) + (alpha,)


def gradient_background() -> Image.Image:
    image = Image.new("RGBA", (WIDTH, HEIGHT), rgba("#07110d"))
    pixels = image.load()

    for y in range(HEIGHT):
        for x in range(WIDTH):
            horiz = x / max(WIDTH - 1, 1)
            vert = y / max(HEIGHT - 1, 1)
            mix = min(1.0, horiz * 0.58 + vert * 0.42)
            start = rgba("#07110d")
            end = rgba("#173824")
            pixels[x, y] = tuple(
                round(start[index] + (end[index] - start[index]) * mix) for index in range(4)
            )

    return image


def draw_pitch_lines(draw: ImageDraw.ImageDraw) -> None:
    line = rgba("#d8ffe0", 72)
    strong = rgba("#b8ff5a", 120)
    draw.rounded_rectangle((58, 58, WIDTH - 58, HEIGHT - 58), radius=42, outline=line, width=3)
    draw.arc((775, 95, 1190, 510), start=228, end=132, fill=line, width=3)
    draw.arc((30, 140, 360, 470), start=50, end=310, fill=rgba("#d8ffe0", 52), width=2)
    draw.line((88, 315, 1110, 315), fill=rgba("#d8ffe0", 34), width=2)
    draw.line((880, 110, 1110, 110), fill=strong, width=5)


def draw_motion_streaks(base: Image.Image) -> None:
    streaks = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(streaks)
    for offset, alpha in ((0, 92), (24, 64), (48, 36)):
        draw.rounded_rectangle(
            (180 + offset, 460 + offset * 0.2, 710 + offset, 490 + offset * 0.2),
            radius=16,
            fill=rgba("#b8ff5a", alpha),
        )
    for offset, alpha in ((0, 90), (20, 55)):
        draw.rounded_rectangle(
            (745 + offset, 392 - offset * 0.2, 1015 + offset, 416 - offset * 0.2),
            radius=12,
            fill=rgba("#68d7ff", alpha),
        )
    streaks = streaks.filter(ImageFilter.GaussianBlur(radius=8))
    base.alpha_composite(streaks)


def draw_player(base: Image.Image) -> None:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    jersey = rgba("#b8ff5a")
    dark = rgba("#05100b")
    white = rgba("#f4f7f2")
    cyan = rgba("#73dbff")

    draw.ellipse((710, 162, 780, 232), fill=white)
    draw.rounded_rectangle((660, 225, 830, 380), radius=56, fill=jersey)
    draw.polygon([(678, 240), (720, 205), (782, 228), (760, 268)], fill=white)

    draw.rounded_rectangle((615, 245, 705, 286), radius=20, fill=white)
    draw.rounded_rectangle((790, 250, 950, 292), radius=20, fill=white)
    draw.rounded_rectangle((690, 360, 740, 505), radius=24, fill=white)
    draw.rounded_rectangle((760, 352, 815, 468), radius=24, fill=white)
    draw.rounded_rectangle((810, 420, 972, 468), radius=24, fill=white)

    draw.rounded_rectangle((682, 496, 768, 528), radius=14, fill=cyan)
    draw.rounded_rectangle((932, 454, 1018, 486), radius=14, fill=cyan)

    draw.ellipse((645, 186, 742, 264), outline=rgba("#dffff2", 34), width=14)
    draw.ellipse((823, 188, 930, 282), outline=rgba("#68d7ff", 56), width=10)

    shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((610, 500, 1040, 585), fill=rgba("#000000", 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=24))
    base.alpha_composite(shadow)
    base.alpha_composite(layer)

    ball = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ball_draw = ImageDraw.Draw(ball)
    cx, cy, r = 1030, 438, 40
    ball_draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=white, outline=dark, width=5)
    pentagon = []
    for step in range(5):
        angle = math.radians(-90 + step * 72)
        pentagon.append((cx + math.cos(angle) * 14, cy + math.sin(angle) * 14))
    ball_draw.polygon(pentagon, fill=jersey, outline=dark)
    for px, py in pentagon:
        ball_draw.line((cx, cy, px, py), fill=dark, width=3)
    glow = ball.filter(ImageFilter.GaussianBlur(radius=10))
    base.alpha_composite(Image.blend(Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0)), glow, 0.6))
    base.alpha_composite(ball)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_PATH), size=size)


def draw_text(base: Image.Image) -> None:
    draw = ImageDraw.Draw(base)
    badge_font = load_font(34)
    copy_font = load_font(74)
    brand_font = load_font(64)

    badge_text = "FUTSAL MATCHING"
    copy_text = "CONNECT,\nPLAY,\nREPEAT"
    brand_text = "FOOTLINK"

    badge_box = (82, 82, 344, 130)
    draw.rounded_rectangle(badge_box, radius=22, fill=rgba("#0d1c14", 212), outline=rgba("#b8ff5a", 110), width=2)
    draw.text((108, 92), badge_text, font=badge_font, fill=rgba("#e8ffee"))

    draw.multiline_text(
        (82, 164),
        copy_text,
        font=copy_font,
        fill=rgba("#f5f7f3"),
        spacing=2,
    )

    draw.text((82, 520), brand_text, font=brand_font, fill=rgba("#b8ff5a"))
    draw.text((370, 532), "풋살 매칭을 더 빠르게", font=load_font(28), fill=rgba("#d8e6dc", 232))


def create_og_image(include_text: bool) -> Image.Image:
    base = gradient_background()
    draw = ImageDraw.Draw(base)
    draw_pitch_lines(draw)
    draw_motion_streaks(base)

    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((720, 120, 1180, 600), fill=rgba("#b8ff5a", 62))
    glow_draw.ellipse((615, 160, 1015, 560), fill=rgba("#68d7ff", 36))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=58))
    base.alpha_composite(glow)

    draw_player(base)

    if include_text:
        draw_text(base)

    return base


def save_images() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    create_og_image(include_text=True).save(PUBLIC_DIR / "og-footlink.png", format="PNG")
    create_og_image(include_text=False).save(PUBLIC_DIR / "og-footlink-clean.png", format="PNG")


if __name__ == "__main__":
    save_images()
