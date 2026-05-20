from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


@dataclass
class ProductCandidate:
    code: str
    file: str
    source_file: str
    bbox: list[int]
    source_page: int
    series: str | None


def load_manifest(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def detect_door_bbox(image: Image.Image, code_bbox: list[int] | None = None) -> list[int]:
    arr = np.array(image.convert("RGB"))
    height, width = arr.shape[:2]
    hsv = cv2.cvtColor(arr, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    saturation = hsv[:, :, 1]
    # Door bodies are usually darker and/or more saturated than the pale catalog
    # background. Keep this broad, then choose the strongest vertical component.
    mask = ((gray < 225) & ((saturation > 16) | (gray < 180))).astype(np.uint8) * 255

    # Product labels, footer bars, and page furniture live near the bottom.
    mask[int(height * 0.84) :, :] = 0
    mask[:4, :] = 0
    mask[:, :4] = 0
    mask[:, width - 4 :] = 0

    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (19, 31)), iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8), iterations=1)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates: list[tuple[float, tuple[int, int, int, int]]] = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = w * h
        aspect = h / max(w, 1)
        if h < height * 0.34 or w < width * 0.12:
            continue
        if aspect < 1.25:
            continue
        if area < width * height * 0.08:
            continue

        center_bonus = 1 - abs((x + w / 2) - width / 2) / max(width / 2, 1)
        score = area * (1 + min(aspect, 3.0) * 0.18 + center_bonus * 0.08)
        candidates.append((score, (x, y, w, h)))

    if not candidates:
        # Fallback: conservative middle crop for manual review.
        crop_w = int(width * 0.72)
        left = (width - crop_w) // 2
        bottom = int(height * 0.84)
        if code_bbox:
            bottom = min(bottom, max(0, code_bbox[1] - 10))
        return [left, 0, left + crop_w, bottom]

    _, (x, y, w, h) = max(candidates, key=lambda item: item[0])
    pad_x = max(10, int(w * 0.08))
    pad_y = max(10, int(h * 0.035))
    left = max(0, x - pad_x)
    top = max(0, y - pad_y)
    right = min(width, x + w + pad_x)
    bottom = min(int(height * 0.86), y + h + pad_y)

    if code_bbox:
        code_left, code_top, code_right, _ = code_bbox
        code_center = (code_left + code_right) / 2
        overlaps_crop = left - 25 <= code_center <= right + 25
        code_is_below_or_inside = code_top > y + h * 0.55
        if overlaps_crop and code_is_below_or_inside:
            bottom = min(bottom, max(top + 120, code_top - 12))

    # Avoid ultra-wide crops when neighbor products leaked into the review card.
    max_width = int(width * 0.78)
    if right - left > max_width:
        center = (left + right) // 2
        left = max(0, center - max_width // 2)
        right = min(width, center + max_width // 2)

    return [left, top, right, bottom]


def make_contact_sheets(files: list[Path], output_dir: Path) -> None:
    for sheet_index, start in enumerate(range(0, len(files), 80), start=1):
        thumbs: list[tuple[str, Image.Image]] = []
        for file in files[start : start + 80]:
            image = Image.open(file).convert("RGB")
            image.thumbnail((120, 180))
            thumbs.append((file.name, image.copy()))

        cols = 10
        pad = 12
        label_h = 24
        cell_w = 140
        cell_h = 215
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell_w + pad, rows * cell_h + pad), "white")
        draw = ImageDraw.Draw(sheet)

        for index, (name, image) in enumerate(thumbs):
            x = pad + (index % cols) * cell_w
            y = pad + (index // cols) * cell_h
            sheet.paste(image, (x + (cell_w - image.width) // 2, y + label_h))
            draw.text((x, y), name[:18], fill=(0, 0, 0))

        sheet.save(output_dir / f"_contact_sheet_{sheet_index:02d}.jpg", "JPEG", quality=90)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cards", default=Path("nuxt/public/images/catalog-review-cards"), type=Path)
    parser.add_argument("--out", default=Path("nuxt/public/images/catalog-product-candidates"), type=Path)
    args = parser.parse_args()

    manifest = load_manifest(args.cards / "manifest.json")
    args.out.mkdir(parents=True, exist_ok=True)

    candidates: list[ProductCandidate] = []
    for item in manifest:
        source = args.cards / item["file"]
        if not source.exists():
            continue

        image = Image.open(source).convert("RGB")
        card_left, card_top, _, _ = item["bbox"]
        code_left, code_top, code_right, code_bottom = item["code_bbox"]
        local_code_bbox = [
            code_left - card_left,
            code_top - card_top,
            code_right - card_left,
            code_bottom - card_top,
        ]
        bbox = detect_door_bbox(image, local_code_bbox)
        left, top, right, bottom = bbox
        output_file = f'{item["code"]}.png'
        image.crop((left, top, right, bottom)).save(args.out / output_file, "PNG", optimize=True)

        candidates.append(
            ProductCandidate(
                code=item["code"],
                file=output_file,
                source_file=item["file"],
                bbox=bbox,
                source_page=item["page"],
                series=item.get("series"),
            )
        )

    (args.out / "manifest.json").write_text(
        json.dumps([asdict(candidate) for candidate in candidates], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    make_contact_sheets(sorted(args.out.glob("K*.png")), args.out)

    print(f"Extracted {len(candidates)} product candidates")
    print(args.out.resolve())


if __name__ == "__main__":
    main()
