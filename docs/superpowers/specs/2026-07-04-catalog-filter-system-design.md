# Catalog Filter System Design

## Goal

Add a Kardoor-specific filtering experience to the new `/catalog` product grid. The interaction may borrow the reference site's disciplined left drawer and apply/clear flow, but all labels, product attributes, visual treatment, and data contracts belong to Kardoor.

This spec covers the filter data adapter, filtering state, URL synchronization, accessible drawer, filter trigger, result feedback, and empty state. Product detail overlays, pagination, remote data import, and deletion of the legacy catalogue remain separate milestones.

## Source Taxonomy

The firm's spreadsheet is the future authoritative source. Until completed data is returned, the following values are a fixed contract and must not be renamed by the UI.

### Ana Kategori

- Çelik Sistemleri
- Dış İklim Sistemleri
- Ekonomik Seriler
- Bina Giriş Sistemleri
- Özel Proje Sistemleri

### Kasa Tipi

- Standart Kasa
- Alüminyum Kasa
- Gizli Kasa
- Pivot Kasa
- Projeye Özel Kasa

### Yüzey

- Laminoks
- PVC
- Ahşap
- Doğal Taş
- Cam
- Metal
- Kompozit
- Özel Yüzey

### Renk

- Antrasit
- Siyah
- Beyaz
- Gri
- Kahverengi
- Meşe
- Ceviz
- Özel Renk

### Kullanım Alanı

- Daire
- Villa
- Bina Girişi
- Dış Mekân
- İç Mekân
- Proje

## Provisional Product Mapping

The current `DoorProduct` records do not contain the firm's exact fields. A separate deterministic adapter will derive provisional filter attributes without mutating `nuxt/data/products.ts`. Every adapted record carries `provisional: true`; the completed spreadsheet can later replace the adapter output without changing filter UI or behavior.

No random or image-based technical inference is allowed. A missing technical value is preferable to a fabricated one.

### Series Mapping

| Current `seriesSlug` | Ana Kategori | Kasa Tipi | Yüzey |
|---|---|---|---|
| `aluminyum-sistemler` | Dış İklim Sistemleri | Alüminyum Kasa | Metal, Kompozit |
| `dogal-yuzeyler` | Dış İklim Sistemleri | Standart Kasa | Ahşap, Doğal Taş |
| `camli-modeller` | Dış İklim Sistemleri | Standart Kasa | Cam |
| `metal-kompozit` | Çelik Sistemleri | Standart Kasa | Metal, Kompozit |
| `pvc-laminoks` | Ekonomik Seriler | Standart Kasa | PVC, Laminoks |
| `mimari-ozel` with `pivot` tag | Özel Proje Sistemleri | Pivot Kasa | Özel Yüzey |
| remaining `mimari-ozel` | Özel Proje Sistemleri | Projeye Özel Kasa | Özel Yüzey |
| `giris-teknik` | Bina Giriş Sistemleri | Standart Kasa | Metal |

`Gizli Kasa` remains in the taxonomy but has no provisional assignment. It appears automatically when authoritative product data supplies matches.

### Color Normalization

Existing `colors` values are normalized as follows:

| Existing value | Filter value |
|---|---|
| `antrasit` | Antrasit |
| `siyah` | Siyah |
| `beyaz` | Beyaz |
| `gri`, `gümüş` | Gri |
| `kahverengi` | Kahverengi |
| `ahşap` | Ceviz |
| every other non-empty value | Özel Renk |

`Meşe` remains unassigned until authoritative data exists.

### Use-case Normalization

- `Villa` maps to Villa.
- `Dış iklim` maps to Dış Mekân.
- `Apartman` and `Konut` map to Daire.
- Values containing `bina girişi` or another explicit entrance use map to Bina Girişi.
- Values containing `proje`, `showroom`, or `mimari` map to Proje.
- An explicit interior value maps to İç Mekân.

Products may hold multiple provisional surface, color, and use-case values. The spreadsheet import may later narrow these to authoritative single or multiple values.

## Filtering Semantics

- Selecting multiple values within one group uses OR logic.
- Selections across different groups use AND logic.
- An empty group imposes no condition.
- The filter result preserves the original product order.
- Filter options with zero matches in the complete catalogue are omitted from the provisional UI. The taxonomy still retains them for future data.
- The grid displays a labelled empty state when no products match.
- Clearing all filters restores the full catalogue and original order.

## State and URL Model

The page owns two states:

- `appliedFilters`: controls the visible product grid and URL.
- `draftFilters`: editable drawer state.

Opening the drawer copies applied values into the draft. Closing with the close control, backdrop, or Escape discards unapplied draft changes. Applying commits the draft, updates the URL, closes the drawer, and announces the result count. Clearing resets the draft; the user then applies the empty draft.

URL query keys are stable and English for implementation safety:

- `category`
- `frame`
- `surface`
- `color`
- `use`

Multiple values are comma-separated slugs. Unknown slugs are ignored. Other unrelated query parameters are preserved. Browser Back and Forward restore the applied filter state and grid results.

Example:

```text
/catalog?category=dis-iklim-sistemleri&frame=aluminyum-kasa&color=antrasit,siyah
```

## UI Architecture

### `nuxt/data/catalog-filter-schema.ts`

Owns taxonomy types, stable slugs, labels, provisional mapping, color/use-case normalization, and the pure product filtering function. It has no Vue or browser dependencies.

### `nuxt/composables/useCatalogFilters.ts`

Owns URL parsing and serialization, applied/draft state, active-filter count, filtered products, apply, clear, open, close, and route synchronization. It consumes the pure schema functions.

### `nuxt/components/catalog/CatalogFilterDrawer.vue`

Owns only drawer presentation and interaction. It receives filter groups, draft selections, and result count through props and emits typed user intents. It does not know how products are filtered.

### `nuxt/pages/catalog.vue`

Continues to own the product grid. It renders `filteredProducts` instead of the raw product array, mounts the filter trigger/drawer, announces result changes, and renders the empty state. It does not contain taxonomy or mapping rules.

## Visual and Interaction Design

- A compact fixed trigger sits at the bottom centre, clear of the existing contact control and safe-area inset.
- The trigger uses the catalogue's restrained graphite-on-mineral language rather than copying the reference button.
- The trigger label is `Filtreler`; an active count appears only when filters are applied.
- The drawer enters from the left and uses a maximum desktop width of approximately 400px.
- On narrow screens the drawer fills the viewport width.
- The page behind the drawer receives a restrained dark scrim.
- Groups are native disclosure sections with visible names and selection counts.
- Values are native checkboxes with full-row labels and at least 44px touch targets.
- The footer contains `Uygula (N ürün)` and `Tümünü temizle` actions.
- The drawer uses the existing catalogue local token namespace; it introduces no new global color, font, radius, shadow, or spacing system.
- Motion is limited to opacity and transform, completes within 200ms, and is disabled under `prefers-reduced-motion: reduce`.

## Accessibility

- Implement the drawer with a native modal `<dialog>` teleported to `body`. This keeps it outside the transformed smooth-scroll container and provides top-layer focus containment.
- Opening moves focus into the dialog. Closing restores focus to the trigger.
- Escape closes and discards unapplied changes.
- The trigger exposes `aria-haspopup="dialog"` and `aria-expanded`.
- Disclosure controls expose their expanded state through native `<details>/<summary>` semantics.
- Result changes are announced through `aria-live="polite"` without stealing focus.
- The empty state has a heading and a button that clears applied filters.
- Focus indicators remain visible against every surface.
- The UI never communicates selection by color alone.

## Local Data and Error Handling

This milestone reads synchronous local data, so it has no network loading state. Mapping functions must safely return empty attribute arrays for unrecognized series or malformed metadata. Unknown URL values are ignored rather than causing an error.

If the authoritative spreadsheet later becomes a remote source, loading, retry, and data-validation behavior must receive its own design and implementation milestone.

## Testing and Acceptance

Pure tests must cover:

- every series-to-category/frame/surface mapping;
- pivot and non-pivot architectural products;
- every color normalization branch;
- use-case normalization;
- OR logic within a group and AND logic across groups;
- stable original ordering;
- unknown URL slugs;
- URL serialization and restoration;
- clear-all behavior.

Manual/runtime checks must cover:

- open, close, backdrop, and Escape behavior;
- focus containment and focus restoration;
- keyboard operation of disclosures and checkboxes;
- Apply and Clear behavior;
- browser Back and Forward;
- empty result recovery;
- 390px, 1024px, 1440px, and 1920px layouts;
- touch targets and coarse-pointer behavior;
- reduced motion;
- unchanged product links and unchanged catalogue subpage files.

The required project verification remains `npm run typecheck` plus a runtime `/catalog` HTTP check. No legacy catalogue file is deleted in this milestone.

## Deferred Work

- Authoritative spreadsheet import and validation.
- Product detail overlay or expanded technical sheet.
- Load-more pagination.
- Image loading/error/retry presentation.
- Night-theme treatment.
- Cleanup of the retired catalogue landing components and composable.

