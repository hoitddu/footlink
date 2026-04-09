from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"


def cover_watermark(image: Image.Image, *, x0: int, y0: int, x1: int, y1: int) -> Image.Image:
    result = image.convert("RGBA")

    patch = result.crop((max(0, x0 - 140), max(0, y0 - 140), x1, y1))
    patch = patch.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
    patch = patch.filter(ImageFilter.GaussianBlur(radius=18))
    result.alpha_composite(patch, (x0, y0))

    overlay = Image.new("RGBA", result.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=32, fill=(20, 54, 144, 120))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=24))
    result.alpha_composite(overlay)

    return result


def prepare_og() -> None:
    source = Image.open(PUBLIC_DIR / "og.png").convert("RGBA")
    cleaned = cover_watermark(source, x0=2620, y0=1320, x1=2838, y1=1500)
    resized = cleaned.resize((1200, 630), Image.Resampling.LANCZOS)
    # Keep filenames in sync: og-share.png is the legacy path, og-share-v3.png
    # is the versioned URL referenced in layout.tsx to bust social crawler caches.
    resized.save(PUBLIC_DIR / "og-share.png", format="PNG")
    resized.save(PUBLIC_DIR / "og-share-v3.png", format="PNG")


def prepare_pwa() -> None:
    source = Image.open(PUBLIC_DIR / "pwa.png").convert("RGBA")
    cleaned = cover_watermark(source, x0=1760, y0=1760, x1=2040, y1=2040)

    cleaned.resize((512, 512), Image.Resampling.LANCZOS).save(PUBLIC_DIR / "icon-512.png", format="PNG")
    cleaned.resize((192, 192), Image.Resampling.LANCZOS).save(PUBLIC_DIR / "icon-192.png", format="PNG")
    cleaned.resize((180, 180), Image.Resampling.LANCZOS).save(PUBLIC_DIR / "apple-touch-icon.png", format="PNG")


def main() -> None:
    prepare_og()
    prepare_pwa()


if __name__ == "__main__":
    main()
