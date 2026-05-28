from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps


IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def dominant_border_colors(rgb: np.ndarray) -> list[np.ndarray]:
    h, w, _ = rgb.shape
    strip = max(2, min(h, w) // 80)
    border = np.concatenate(
        [
            rgb[:strip, :, :].reshape(-1, 3),
            rgb[-strip:, :, :].reshape(-1, 3),
            rgb[:, :strip, :].reshape(-1, 3),
            rgb[:, -strip:, :].reshape(-1, 3),
        ],
        axis=0,
    )

    quantized = (border // 16).astype(np.int16)
    bins, counts = np.unique(quantized, axis=0, return_counts=True)
    order = np.argsort(counts)[::-1]

    colors: list[np.ndarray] = []
    for idx in order[:8]:
        center = bins[idx].astype(np.int16) * 16 + 8
        color = center.astype(np.float32)
        if not colors or all(np.linalg.norm(color - existing) > 34 for existing in colors):
            colors.append(color)
        if len(colors) >= 4:
            break

    corners = np.array(
        [
            rgb[0, 0],
            rgb[0, -1],
            rgb[-1, 0],
            rgb[-1, -1],
        ],
        dtype=np.float32,
    )
    for color in corners:
        if all(np.linalg.norm(color - existing) > 30 for existing in colors):
            colors.append(color)
    return colors


def edge_connected_background_mask(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    colors = dominant_border_colors(rgb)

    diff = np.stack(
        [np.linalg.norm(rgb.astype(np.float32) - color, axis=2) for color in colors],
        axis=0,
    )
    nearest = diff.min(axis=0)

    # Product shots have soft shadows and mild JPEG drift; this catches the connected
    # exterior backdrop while leaving framed glass/panels untouched.
    candidate = nearest < 54
    grayish = np.ptp(rgb.astype(np.int16), axis=2) < 34
    light = rgb.mean(axis=2) > 178
    candidate |= (nearest < 60) & grayish & light

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def push(y: int, x: int, parent: tuple[int, int] | None = None) -> None:
        if not visited[y, x] and candidate[y, x]:
            if parent is not None:
                py, px = parent
                if np.linalg.norm(rgb[y, x].astype(np.int16) - rgb[py, px].astype(np.int16)) > 26:
                    return
            visited[y, x] = True
            q.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while q:
        y, x = q.popleft()
        if y > 0:
            push(y - 1, x, (y, x))
        if y + 1 < h:
            push(y + 1, x, (y, x))
        if x > 0:
            push(y, x - 1, (y, x))
        if x + 1 < w:
            push(y, x + 1, (y, x))

    return visited


def remove_background(src: Path, dst: Path) -> None:
    image = Image.open(src).convert("RGBA")
    rgb = np.array(image.convert("RGB"))
    original_alpha = np.array(image.getchannel("A"))
    mask = edge_connected_background_mask(rgb)

    alpha = np.where(mask, 0, original_alpha).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L")
    alpha_img = alpha_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))

    out = image.copy()
    out.putalpha(alpha_img)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst)


def make_contact_sheet(files: list[Path], out: Path) -> None:
    thumb_w, thumb_h = 150, 190
    cols = 8
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * thumb_h), (238, 238, 238))
    checker_tile = Image.new("RGB", (16, 16), (255, 255, 255))
    for y in range(16):
        for x in range(16):
            if (x // 8 + y // 8) % 2:
                checker_tile.putpixel((x, y), (214, 214, 214))

    for i, path in enumerate(files):
        img = Image.open(path).convert("RGBA")
        img.thumbnail((thumb_w, thumb_h - 24), Image.Resampling.LANCZOS)
        checker = Image.new("RGB", img.size)
        tile = ImageOps.contain(checker_tile, (16, 16))
        for y in range(0, img.height, 16):
            for x in range(0, img.width, 16):
                checker.paste(tile, (x, y))
        checker.paste(img.convert("RGB"), mask=img.getchannel("A"))
        x0 = (i % cols) * thumb_w + (thumb_w - img.width) // 2
        y0 = (i // cols) * thumb_h + 4
        sheet.paste(checker, (x0, y0))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=90)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()

    files = [
        path
        for path in sorted(args.source.iterdir(), key=lambda item: item.name.lower())
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTS
        and not path.name.startswith("_contact_")
    ]
    outputs: list[Path] = []
    for src in files:
        dst = args.output / f"{src.stem}.png"
        remove_background(src, dst)
        outputs.append(dst)
        print(f"{src.name} -> {dst.name}")

    if args.contact_sheet:
        make_contact_sheet(outputs, args.contact_sheet)


if __name__ == "__main__":
    main()
