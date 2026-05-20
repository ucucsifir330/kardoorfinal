from __future__ import annotations

import argparse
import json
import re
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path

import fitz
from PIL import Image, ImageDraw
from rapidocr_onnxruntime import RapidOCR


@dataclass
class CatalogReviewCard:
    code: str
    file: str
    page: int
    bbox: list[int]
    code_bbox: list[int]
    series: str | None
    ocr_confidence: float


SERIES_BY_PAGE = [
    (7, 11, "Alüminyum Kasa"),
    (12, 15, "Alüminyum Kasa ve Kanat"),
    (16, 20, "Termo Wood"),
    (21, 23, "Doğal Taş"),
    (24, 27, "Karma Cam"),
    (28, 29, "Temperli Cam"),
    (30, 39, "Kompozit"),
    (40, 43, "Komple Sac Metal"),
    (45, 53, "Lüks PVC"),
    (54, 63, "Elit Laminoks"),
    (64, 65, "Rustik Laminoks"),
    (66, 69, "Projeye Özel"),
    (70, 71, "Pivot"),
    (72, 80, "Villa ve Bina Giriş"),
    (81, 81, "Acil Çıkış"),
]


def series_for_page(page: int) -> str | None:
    for start, end, series in SERIES_BY_PAGE:
        if start <= page <= end:
            return series
    return None


def page_image(doc: fitz.Document, page_number: int) -> Image.Image:
    page = doc[page_number - 1]
    pix = page.get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def normalize_code(text: str) -> str | None:
    normalized = re.sub(r"[^A-Za-z0-9]", "", text).upper()
    match = re.fullmatch(r"K(\d{4})", normalized)
    if not match:
        return None
    return f"K{match.group(1)}"


def ocr_codes(engine: RapidOCR, image: Image.Image, page_number: int) -> list[tuple[str, list[int], float]]:
    temp_path = Path(tempfile.gettempdir()) / f"kardoor_catalog_ocr_page_{page_number:02d}.png"
    image.save(temp_path)
    result, _ = engine(str(temp_path))

    codes: list[tuple[str, list[int], float]] = []
    for item in result or []:
        points, text, confidence = item
        code = normalize_code(text)
        if not code or confidence < 0.82:
            continue

        xs = [int(point[0]) for point in points]
        ys = [int(point[1]) for point in points]
        bbox = [min(xs), min(ys), max(xs), max(ys)]
        codes.append((code, bbox, float(confidence)))

    deduped: dict[str, tuple[str, list[int], float]] = {}
    for code, bbox, confidence in codes:
        current = deduped.get(code)
        if not current or confidence > current[2]:
            deduped[code] = (code, bbox, confidence)
    return sorted(deduped.values(), key=lambda value: (value[1][1], value[1][0]))


def group_rows(code_items: list[tuple[str, list[int], float]]) -> list[list[tuple[str, list[int], float]]]:
    rows: list[list[tuple[str, list[int], float]]] = []
    threshold = 230 if len(code_items) <= 3 else 165

    for item in code_items:
        _, bbox, _ = item
        center_y = (bbox[1] + bbox[3]) / 2
        placed = False
        for row in rows:
            row_center = sum((entry[1][1] + entry[1][3]) / 2 for entry in row) / len(row)
            if abs(center_y - row_center) <= threshold:
                row.append(item)
                placed = True
                break
        if not placed:
            rows.append([item])

    for row in rows:
        row.sort(key=lambda value: value[1][0])
    return rows


def column_bounds(page_width: int, row: list[tuple[str, list[int], float]], bbox: list[int]) -> tuple[int, int]:
    center_x = (bbox[0] + bbox[2]) / 2
    count = len(row)

    if count >= 3:
        col_width = page_width / 3
        index = min(2, max(0, int(center_x // col_width)))
        return int(index * col_width), int((index + 1) * col_width)

    if count == 2:
        if center_x < page_width / 2:
            return 0, page_width // 2
        return page_width // 2, page_width

    if center_x < page_width * 0.35:
        return 0, page_width // 2
    if center_x > page_width * 0.65:
        return page_width // 2, page_width
    return int(page_width * 0.22), int(page_width * 0.78)


def card_bbox(
    image: Image.Image,
    code_items: list[tuple[str, list[int], float]],
    row: list[tuple[str, list[int], float]],
    code_bbox: list[int],
) -> list[int]:
    page_width, page_height = image.size
    if len(code_items) == 1:
        return [10, 92, page_width - 10, page_height - 42]

    left, right = column_bounds(page_width, row, code_bbox)
    row_top = min(item[1][1] for item in row)
    row_bottom = max(item[1][3] for item in row)

    if len(code_items) >= 4:
        top_pad = 560
        bottom_pad = 105
    else:
        top_pad = 860
        bottom_pad = 110

    top = max(92, row_top - top_pad)
    bottom = min(page_height - 42, row_bottom + bottom_pad)

    # Leave a little breathing room but avoid bleeding into neighboring columns.
    left = max(0, left + 10)
    right = min(page_width, right - 10)

    if bottom - top < 430:
        top = max(92, code_bbox[1] - 620)
        bottom = min(page_height - 42, code_bbox[3] + 120)

    return [left, top, right, bottom]


def make_contact_sheets(files: list[Path], output_dir: Path) -> None:
    for sheet_index, start in enumerate(range(0, len(files), 72), start=1):
        thumbs: list[tuple[str, Image.Image]] = []
        for file in files[start : start + 72]:
            image = Image.open(file).convert("RGB")
            image.thumbnail((145, 190))
            thumbs.append((file.name, image.copy()))

        cols = 8
        pad = 12
        label_h = 24
        cell_w = 175
        cell_h = 230
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell_w + pad, rows * cell_h + pad), "white")
        draw = ImageDraw.Draw(sheet)

        for index, (name, image) in enumerate(thumbs):
            x = pad + (index % cols) * cell_w
            y = pad + (index // cols) * cell_h
            sheet.paste(image, (x + (cell_w - image.width) // 2, y + label_h))
            draw.text((x, y), name[:23], fill=(0, 0, 0))

        sheet.save(output_dir / f"_contact_sheet_{sheet_index:02d}.jpg", "JPEG", quality=90)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--out", default=Path("nuxt/public/images/catalog-review-cards"), type=Path)
    parser.add_argument("--pages", default="7-43,45-81")
    args = parser.parse_args()

    page_numbers: list[int] = []
    for part in args.pages.split(","):
        if "-" in part:
            start, end = [int(value) for value in part.split("-", 1)]
            page_numbers.extend(range(start, end + 1))
        else:
            page_numbers.append(int(part))

    args.out.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(args.pdf))
    engine = RapidOCR()
    cards: list[CatalogReviewCard] = []

    for page_number in page_numbers:
        image = page_image(doc, page_number)
        code_items = ocr_codes(engine, image, page_number)
        rows = group_rows(code_items)
        row_by_code = {item[0]: row for row in rows for item in row}

        for code, code_bbox, confidence in code_items:
            bbox = card_bbox(image, code_items, row_by_code[code], code_bbox)
            output_file = f"{code}.png"
            left, top, right, bottom = bbox
            image.crop((left, top, right, bottom)).save(args.out / output_file, "PNG", optimize=True)
            cards.append(
                CatalogReviewCard(
                    code=code,
                    file=output_file,
                    page=page_number,
                    bbox=bbox,
                    code_bbox=code_bbox,
                    series=series_for_page(page_number),
                    ocr_confidence=round(confidence, 4),
                )
            )

    cards.sort(key=lambda card: (card.page, card.code))
    (args.out / "manifest.json").write_text(
        json.dumps([asdict(card) for card in cards], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    make_contact_sheets(sorted(args.out.glob("K*.png")), args.out)

    print(f"Extracted {len(cards)} review cards")
    print(args.out.resolve())


if __name__ == "__main__":
    main()
