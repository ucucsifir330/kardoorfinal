# Kardoor Catalog Review Cards

The Kardoor PDF catalog is flattened: every catalog page is one image, not separate door assets. The safest extraction flow is therefore:

1. Render each PDF page.
2. Use OCR to find product codes such as `K1002`.
3. Crop the surrounding product card so the door and its visible code stay together.
4. Save the crop as `K1002.png` and record metadata in `manifest.json`.

This produces review cards for matching and cleanup. It is not the final clean door cutout step.

## Setup

```powershell
$py='C:\Users\alpdo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py -m pip install pymupdf pillow rapidocr-onnxruntime
```

## Run

```powershell
$py='C:\Users\alpdo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py scripts\extract_catalog_review_cards.py --pdf 'C:\Users\alpdo\AppData\Local\Temp\Kardoor-Pdf-Katalog.pdf'
```

Outputs:

- `nuxt/public/images/catalog-review-cards/K1002.png`: code-named review card crops.
- `nuxt/public/images/catalog-review-cards/manifest.json`: `code`, `series`, `page`, crop box, and OCR confidence.
- `_contact_sheet_*.jpg`: quick visual QA sheets.

After reviewing these code-matched cards, the next step is a second pass that crops only the door body from each confirmed card.
