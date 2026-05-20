# Kardoor Catalog Product Candidates

This step uses the OCR-matched review cards in `nuxt/public/images/catalog-review-cards/` and extracts a door-body candidate for each `Kxxxx` code.

Run after `extract_catalog_review_cards.py`:

```powershell
$py='C:\Users\alpdo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py scripts\extract_catalog_product_candidates.py
```

Outputs:

- `nuxt/public/images/catalog-product-candidates/K1002.png`: door-body candidate named by catalog code.
- `nuxt/public/images/catalog-product-candidates/manifest.json`: source review card, crop box, page, and series metadata.
- `_contact_sheet_*.jpg`: quick QA sheets.

These are candidates from the flattened PDF catalog, not perfect source renders. Review cards remain the source of truth for code matching; product candidates are the next visual cleanup layer.
