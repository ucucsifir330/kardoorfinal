# /catalog bento denemesi — iptal, 2026-08-11

7 Ağustos'ta başlayıp bitmeden kalan `/catalog` bento düzeni. 11 Ağustos'ta
kullanıcı kararıyla ana ağaçtan geri alındı. Hiç commit edilmemişti.

- `catalog.vue` — bento hali (440 satır). Ana ağaçtaki hâli HEAD'e (133 satır)
  döndürüldü; o sürüm `backups/catalog.vue.bento-oncesi-2026-08-07.bak` ile
  birebir aynı (doğrulandı).
- `catalog-bento.css` — 486 satır, bento ızgarasının tamamı. Ana ağaçtan silindi,
  `main.css`'teki `@import` satırı da kaldırıldı.

## Geri alınmayanlar — bunlar bento değil, ağaçta duruyor

- `main.css` → `@import "./base/reset.css" layer(base)`. Katmansız reset,
  Tailwind'in `layer(utilities)` içindeki metin renklerini eziyordu (buton yazısı
  zeminle aynı renge düşüyordu, CDP ile doğrulandı). Ayrı bir bug fix, korundu.
- `home-catalog.css` → `!important` sökümü + palette merge (`--ink`, `--paper`,
  `--hairline`). Ayrı iş kolu.
- `CatalogProductModal.vue` → `showSeriesLink` prop'u ve
  `product.description || copy.modal.description`. Prop varsayılanı `true`,
  yani bento olmadan davranış değişmiyor.
- `doors/[code].vue` + `door-detail.css` → ürün detay işi, ayrı.

## Geri getirmek istersen

```bash
cp backups/catalog-bento-iptal-2026-08-11/catalog.vue nuxt/app/pages/catalog.vue
cp backups/catalog-bento-iptal-2026-08-11/catalog-bento.css nuxt/app/assets/styles/pages/catalog-bento.css
# main.css'e geri ekle:  @import "./pages/catalog-bento.css";
```
