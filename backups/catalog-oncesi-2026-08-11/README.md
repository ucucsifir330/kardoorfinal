# /catalog — museum'a geçmeden önceki hâl, 2026-08-11

Museum Index prototipi `/prototypes/catalog-desktop`'tan alınıp `/catalog`'a
bağlanmadan HEMEN ÖNCE alınan tam yedek. Buradaki her dosya o an git HEAD
(`35839a0`) ile birebir aynıydı — yani `git checkout` ile de dönülebilir, bu
klasör sadece tek adımda geri alabilmek için.

| Dosya | Ana ağaçtaki yeri | Satır |
|---|---|---|
| `catalog.vue` | `nuxt/app/pages/catalog.vue` | 133 |
| `catalog-library.css` | `nuxt/app/assets/styles/pages/catalog-library.css` | 631 |
| `CatalogFilterDock.vue` | `nuxt/app/components/catalog/CatalogFilterDock.vue` | 353 |
| `catalog-library-filters.ts` | `nuxt/app/data/catalog-library-filters.ts` | 150 |
| `catalog-desktop.vue` | `nuxt/app/pages/prototypes/catalog-desktop.vue` | 179 |

## O anki çalışma şekli — geri dönerken bilinmesi gerekenler

- `catalog.vue` ürünleri 24'erli sayfalıyordu (`PAGE_SIZE`), `loadMore` sonrası
  `$smoother.refresh()` çağırıyordu.
- Filtreler sayfanın içinde DEĞİLDİ: `CatalogFilterDock` **`app.vue:215`**'ten,
  route `/catalog` olduğunda global olarak basılıyordu. URL query'ye yazıyor,
  `catalog-library-filters.ts` okuyor.
- Stiller global `catalog-library.css`'ten geliyordu (`main.css` içinden import).
- `catalog-desktop.vue` prototip sarmalayıcısıydı: `Museum Index` picker'ı ve
  `body.catalog-prototype-active .chub { display: none }` kuralı ondaydı.

## Geri dönüş

```bash
cp backups/catalog-oncesi-2026-08-11/catalog.vue              nuxt/app/pages/catalog.vue
cp backups/catalog-oncesi-2026-08-11/catalog-library.css      nuxt/app/assets/styles/pages/catalog-library.css
cp backups/catalog-oncesi-2026-08-11/CatalogFilterDock.vue    nuxt/app/components/catalog/CatalogFilterDock.vue
cp backups/catalog-oncesi-2026-08-11/catalog-library-filters.ts nuxt/app/data/catalog-library-filters.ts
```

`main.css` içindeki `@import "./pages/catalog-library.css";` satırı ve
`app.vue`'daki `CatalogFilterDock` koşulu da geri konmalı.
