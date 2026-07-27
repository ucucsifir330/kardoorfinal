> **⚠️ ARŞİV — GÜNCEL DEĞİLDİR. Bu belgeye göre iş yapma.**
>
> Dosya yolları Nuxt 4 taşımasından önceki yapıya ait olabilir; her yolu kullanmadan önce doğrula.
>
> Güncel durum için: `docs/cleanup2-stabilizasyon.md`, `docs/cdp-css-tarama-raporu.md`, `AGENTS.md`.
> (Arşivlendi: 2026-07-22)

---

# CODEX HANDOFF — main.css / light.css / dark.css temizlik raporu

Tarih: 2026-07-11 · Kaynak: Claude, üç dosyanın satır satır manuel okuması + sınıf/DOM doğrulaması (script yok, grep ile tekil sınıf teyidi yapıldı).

Dosyalar:
- `nuxt/app/assets/styles/main.css` (192 satır)
- `nuxt/public/themes/light.css` (1535 satır)
- `nuxt/public/themes/dark.css` (1681 satır)

Önemli bağlam: light/dark **karşılıklı dışlayan** tam override dosyaları; `#kardoor-theme` link href'i `useShowroomAmbience.ts` ile takas ediliyor. Bundle CSS'in üstüne yüklenir ve neredeyse her kural `!important`. İki dosya "append-pass" mimarisinde: aynı seçici ardışık pass'lerde defalarca yeniden yazılmış. Aşağıdaki A–B kategorileri **statik olarak kesin** (aynı dosya içi kaskad: aynı seçici/eşit specificity + hepsi !important → sonraki kazanır, ya da sınıf DOM'da hiç yok). D kategorisi CDP/computed-style teyidi ister.

---

## A. KESİN ÖLÜ — seçici DOM'la hiç eşleşmiyor

### A1. `#app` id'si hiçbir yerde yok
Nuxt kökü `#__nuxt` (nuxt.config.ts'de `app.rootId` override YOK; `id="app"` hiçbir template'te yok).
- light.css 45-48: `#app { ... }` bloğu komple.
- light.css 1074-1080: gruptaki `#app,` satırı.
- dark.css 43-46: `#app { ... }` bloğu komple.
- dark.css 297-302: gruptaki `#app` üyesi.
- dark.css 1219-1226: gruptaki `#app,` satırı.
- **main.css 95**: `html[data-theme="dark"] #app,` grup üyesi.

### A2. `div#__nuxt > div.footer-wrapper` direct-child seçicileri eşleşmiyor
Gerçek DOM: `#__nuxt > div.app-shell > #smooth-wrapper > #smooth-content > div.footer-wrapper > footer.footer-dome`. footer-wrapper #__nuxt'ün direkt çocuğu DEĞİL, 3 seviye altında. "Final mobile lock" pass'lerindeki tüm `div#__nuxt > ...` kuralları hiç uygulanmıyor:
- light.css 898-952 (blok içindeki `.close-icon` 954-957 CANLI, korunmalı).
- dark.css 1023-1077 (`.close-icon` 1079-1082 CANLI).
- Ayrıca light.css 1009 ve 1020, dark.css 1134 ve 1145'teki `div#__nuxt .footer-wrapper ...` (descendant) üyeleri eşleşiyor ama gruptaki diğer seçiciyle aynı elementi seçiyor → gereksiz, gruptan çıkarılabilir.

### A3. Kullanılmayan keyframes
- `@keyframes shine`: light 50-53, dark 48-51. `animation: shine` kullanımı repo'da yok.
- `@keyframes mobileCatalogLineSweep`: light 622-627, dark 747-752. Kullanan yok.

### A4. Var olmayan sınıf
- `.catalog-label`: dark 316 (grup üyesi; grubun kalanı canlı ama blok zaten B4 gereği komple ölü, aşağıda).

---

## B. KESİN ÖLÜ — dosya içi tam ezme (aynı seçici, eşit specificity, hepsi !important, sonraki blok tüm property'leri yeniden yazıyor)

### B1. Testimonial "sediment" bölgesi — İKİ DOSYADA AYNI YAPI
İki dosyanın başındaki testimonial/review blokları 5-6 pass üst üste; yalnız SON versiyonlar canlı.

light.css (dark.css karşılıkları parantezde):
- `.testimonial-wrapper`: 60-65, 80-85, 92-104, 139-141 ÖLÜ → kazanan 207-219 (+background'ı 1091 eziyor). (dark: 58-63, 78-83, 90-102, 137-139 ölü → 205-217, +1236-1238)
- `.testimonial-wrapper::before`: 4 birebir kopya; 55-58, 87-90, 148-151 ÖLÜ, 226-229 kalsın. (dark: 53-56, 85-88, 146-149 ölü; 224-227 kalır)
- `.gradient-mask`: 111-119, 153-166, 176-178, 180-193 (153-166'nın BİREBİR kopyası), 203-205 ÖLÜ → kazanan 231-246 (+background 1139-1145). (dark: 109-117, 151-164, 174-176, 178-191, 201-203 ölü → 229-244, +1285-1291)
- `.title-area, .carousel-area` transform: 106-109, 134-137, 143-146 (kopya) ÖLÜ → 221-224 `transform:none`. (dark: 104-107, 132-135, 141-144 → 219-222)
- `.title-area { isolation }`: 168-170 ile 195-197 kopya; biri silinir. (dark: 166-168 / 193-195)
- `.rotating-title`: 172-174 ve 199-201 (z-index:3) ÖLÜ → 248-251 z-index:2 kazanıyor. (dark: 170-172, 197-199 → 246-249)
- `.review-card` ve `:hover`: 67-78 ve 121-132 ÖLÜ → 253-262 kazanan. (dark: 65-76, 119-130 → 251-260; dark'ta ayrıca 401-413 Mineral öncesi versiyon var — box-shadow'u 251-260'tan sonra geldiği için canlı, dikkat: dark'ta kazanan 401-413 + hover 407-413'tür, 251-260 ÖLÜdür)

### B2. Footer eski pass kalıntıları
- `.footer-info { bottom: 820px }` ÜÇ kopya + media: light 332-334, 384-386 ve 454-459'daki `@media (min-aspect-ratio: 8/5)...` bloğunun tamamı ÖLÜ — Mineral pass'i (1215-1225) koşulsuz `bottom: auto !important` ile dosyada daha sonra geliyor. (dark: 457-459, 509-511 ve 579-584 media bloğu ölü → 1361-1371)
- `.footer-wrapper { height: 2200px }`: light 319-321 → 1148-1151 `height:auto` ÖLÜ. (dark: 444-446 → 1294-1297)
- `.footer-wrapper` background: light 303-305 → 1090-1092 eziyor, ÖLÜ. (dark: 428-430 → 1236-1238; aynı renk ama yine ezik)
- `.footer-dome` ilk transform bloğu: light 323-328 → 376-382 aynı property setini yeniden yazıyor, ÖLÜ. (dark: 448-453 → 501-507)
- Sosyal buton offset'lerinin İLK versiyonu: light 1315-1329 (`nth-of-type(1-4)`) → 1393-1415 aynı seçicileri yeniden tanımlıyor, ÖLÜ. (dark: 1461-1475 → 1539-1561)
- `.footer-brand` / `.footer-logo` eski boyutları:
  - light 1192 `height: clamp(330px...)` → 1439 eziyor; 1199 `width: clamp(390px...)` → 1444; 1195 `overflow:visible` → 1478 kopya.
  - @1180 içinde: light 1244 `height:220px` → 1453 `280px`; 1247-1249 logo width → 1457-1459.
  - @760 içinde: light 1283 `height:96px` → 1468 `116px`; 1288-1289 logo width → 1471-1473 (`object-position:center` 1290 CANLI kalır).
  - (dark aynı yapı: 1338, 1345, 1341 → 1585, 1590, 1624; @1180 1390/1393-1395 → 1599/1603-1605; @760 1429/1434-1436 → 1614/1617-1619)
- @920 `.footer-info` grid bloğu: light 483-486 → @1180 bloğu 1260-1264 aynı property'leri kapsıyor ve daha sonra → ÖLÜ. (dark: 608-611 → 1406-1410)
- @1180 İLK footer bloğu: light 463-468 (`left/right/grid-template-columns/column-gap`) → hepsi sonraki koşulsuz Mineral 1215-1225 (`left:auto/right:auto`) + 1262 + 1343 tarafından ezik → blok ÖLÜ. 470-472 (`footer-info-left`) ve 474-478 (`footer-bottom`) tablet aralığında canlı, KALIR. (dark: 588-593 ölü; 595-603 kalır)

### B3. Katalog eski pass kalıntıları
- `.catalog-section` background: light 336-339 → 1082-1084, ÖLÜ. (dark: 461-464 → 1228-1230)
- `.catalog-main`: light 341-345 ÖLÜ ve 356-359 ÖLÜ (background zinciri 420-431 → 1086-1092'de bitiyor; `overscroll-behavior-y:auto` 358'i, 427'deki `overscroll-behavior:contain` shorthand'i eziyor). 420-431 içindeki `background` satırı da 1091'e yenik ama bloğun kalanı canlı. (dark: 466-470 ÖLÜ, 481-484 ÖLÜ → 545-556 + 1232-1238)
- `.catalog-section::before` ilk blok: light 394-403 → 1117-1125, ÖLÜ. (dark: 519-528 → 1263-1271)
- `.catalog-section::after` light 405-418: `background` ve `filter` ÖLÜ (1127-1137 eziyor), **`transform: scaleY(var(--catalog-line-progress))` (417) CANLI** — Mineral bloğunda transform yok. Satır bazında ayıklanmalı.
- `.catalog-card` light: 347-352'de box-shadow ÖLÜ (361-366 eziyor) ve border'ın renk kısmı ölü (447, 1098); border width/style canlı. 446-450'de `border-color` 1098'e yenik, `border-radius`/`overflow` canlı.

### B4. dark.css'e özgü büyük bulgular
- **Desktop'ta görünmez pseudo'ya boyama**: dark 380-383 `.catalog-section::after { content:none; display:none }` (!important) desktop'ta bu pseudo'yu tamamen kaldırıyor. Buna rağmen dark 530-543 ve 1273-1283 desktop'ta bu var olmayan elemana background/filter/transform yazıyor → İKİ BLOK DESKTOP'TA ZOMBİ. (≤760'ta 627-645 `content:""` ile geri getiriyor; mobil blokları canlı.) Silmeden önce tek CDP kontrolü: gece modunda desktop'ta `.catalog-section::after` computed `display:none` mi — beklenti: evet.
- dark 316-321 (catalog-label/title/product-family/card-title renkleri) → 1247-1254 aynı seçicilere renk yazıyor, blok ÖLÜ.
- dark 336-342: `catalog-card-title span` HARİÇ tüm üyeler (subtitle/designer/finish/code) 1256-1261'de yeniden → blok yalnız `catalog-card-title span { color: rgba(244,246,255,0.5) }` olarak sadeleşir.
- dark 371-374 `.catalog-tag-line` (0.36) → 1190-1192 (0.42) eziyor, ÖLÜ.
- dark 1194-1200 (`catalog-designer` 0.62, `catalog-card-subtitle` 0.55) → 1256-1261 (0.64) eziyor, ÖLÜ.
- dark 331-334 `.catalog-card` background #171D3D → dosya içinde 1240-1245 eziyor; box-shadow zinciri 333 → 474-477 → 486-491 (kazanan 486-491). AMA bkz. kategori C — dosyalar arası çatışma bu kararı değiştiriyor.

### B5. `:root` değişken kopyaları
- light 1-27'deki şu 12 tanım, 1058-1072 "Mineral" bloğunda yeniden tanımlandığı için ÖLÜ: `--bg-color, --text-primary, --text-secondary, --catalog-stage-bg, --catalog-stage-surface-bg, --catalog-stage-main-bg, --catalog-stage-sticky-bg, --catalog-stage-line-track, --catalog-stage-line-fill, --catalog-product-scrollbar-track, --catalog-product-scrollbar-thumb, --catalog-product-scrollbar-thumb-hover`. Kalanlar (transition'lar, wishlist'ler, `--catalog-stage-line-filter`, `--catalog-product-scrollbar`) CANLI.
- dark: 291-295 bloğu KOMPLE ÖLÜ (üç değişkeni de 1203-1216 yeniden tanımlıyor); 1-27'deki aynı liste ölü.
- ⚠️ Tuhaflık (silme değil, bilinçli karar konusu): light temada `--bg-color` final değeri `#111417` (koyu!). html/body bunu kullanıyor ama 1079'daki `#F4F1EA !important` kurtarıyor. `--bg-color`'a bağımlı başka kurallar (ör. 426 `.catalog-main`, 231-246 gradient-mask'ın var kullanımı — onlar zaten sonradan eziliyor) gözden geçirilmeden --bg-color değeri "düzeltilmemeli"; sadece not.
- light 1051-1055 `.app-shell,.app-shell--day { background: var(--bg-color) }` → 1074-1080 `background-color:#F4F1EA` eziyor. Shorthand nüansı: 1052'nin `background-image:none` etkisi kalır; bundle .app-shell'e background-image vermiyorsa blok güvenle silinir (hızlı grep: vermiyor). (dark: 1177-1180 aynı durumda → 1219-1226)

---

## C. DOSYALAR ARASI ÇATIŞMA — main.css, dark.css'i specificity ile eziyor (KARAR GEREKTİRİR)

main.css'teki gece bloğu `.app-shell--night .catalog-card` gibi (0,2,0) seçiciler kullanıyor ve `!important`. dark.css'in `.catalog-card` (0,1,0) `!important` kuralları HER ZAMAN kaybeder. Gece modunda ikisi de aktif olduğu için fiilen kazanan main.css:

| Property | main.css (kazanan) | dark.css (kaybeden) |
|---|---|---|
| .catalog-card / .review-card / .catalog-product-image-wrap bg | `#171D3D` (main 123-128) | `rgba(244,246,255,0.055)` (dark 1240-1245) |
| .catalog-title, .catalog-card-title, .rotating-title, .quote, .name | `#F4F6FF` (main 136-143) | aynı değer (dark 1247-1254) |
| .catalog-designer, .catalog-card-subtitle, .catalog-finish, .catalog-code | `#9FA7BD` (main 145-151) | `rgba(244,246,255,0.64)` (dark 1256-1261) |
| .footer-socials > .social-btn bg/renk | `#171D3D / #F4F6FF` (main 165-175) | dark 1497-1502, 1526-1537 aynı değerler |

Sonuç: dark.css'in "Mineral Executive" pass'inin renk kısmı büyük ölçüde FİİLEN ölü. İki seçenek — **kullanıcıya sorulmadan seçilmemeli** (görsel karar):
1. Gece paletinin tek sahibi main.css kalsın → dark.css'ten yenik düşen renk kuralları silinsin.
2. Tema dosyası tek sahip olsun → main.css 93-192 navy bloğu sadeleştirilip dark.css'e taşınsın (ama main.css bloğu tema CSS'i geç yüklendiğinde FOUC koruması görevi görüyor olabilir; kontrol edilmeli).

---

## D. MUHTEMEL ÖLÜ — CDP/computed-style teyidi önerilir (kanıt standardı gereği)

- `.social-btn` boyut kuralları: light 1205-1208 (96px), @1180 1251-1254 (72px), @760 757-760 (64px) — hepsi sonraki `.footer-socials > .social-btn` (0,2,0) `clamp(54px,3.45vw,68px)` (1380-1391) tarafından ezilir; tüm .social-btn'ler DOM'da .footer-socials içinde (HomeFooter.vue doğrulandı). "DOM'da başka social-btn yok" varsayımına dayandığı için CDP teyidi iyi olur. (dark karşılıkları: 1351-1354, 1397-1400, 882-885 → 1526-1537)
- Mobil footer pass'leri arası kısmî ezmeler (light 629-893 ↔ 963-1034; dark 754-1018 ↔ 1088-1159): `footer-socials` margin (752→991), `footer-bottom` blokları (869-892→995-1033) gibi üyeler tek tek kontrol edilmeli; blok bütünüyle ölü DEĞİL.
- `.close-icon` kuralları yalnız references sayfası modalında karşılık buluyor (references.vue:119); references.vue kendi scoped .close-icon stillerine de sahip. Kim kazanıyor CDP ile bakılmalı; tema kuralları gereksizse üç pass'lik close-icon zinciri (light 281-301, 954-957, 1040-1048) sadeleşir.

---

## E. YAPISAL ÖNERİ (temizlik sonrası)

1. İki dosyanın ilk ~260 satırı ve footer layout pass'leri renk dışında BİREBİR AYNI (layout kuralları: testimonial düzeni, footer grid, sosyal buton yerleşimi). Ölü kod ayıklandıktan sonra kalan ortak LAYOUT kuralları temalardan çıkıp main.css'e (tema-nötr) taşınabilir; temalarda yalnız renk/gölge kalır. Bu, iki dosyayı ~1500'den tahminen 300-400 satıra indirir.
2. Silme sırası önerisi: önce A (eşleşmeyen seçiciler) → B (dosya içi kesinler) → C kararı kullanıcıyla → D CDP turu.
3. Doğrulama düzeneği hazır: `nuxt/scripts/audit/runtime-browser-audit.mjs` localStorage seed ile her iki temayı yükleyebiliyor; her silme dilimi sonrası light+dark × desktop/1180/920/760 snapshot karşılaştırması yapılmalı (clean-candidate yöntemi: silmek yerine doğrulanmış kuralları yeni dosyaya kopyala).

## Dokunulmayacaklar (canlı olduğu doğrulandı)

- `app-shell--night/--day/--references` (app.vue:67 dinamik üretim — grep'te görünmez, SİLME).
- `.reveal-word/.reveal-char/.brand-gradient-word` + `adaBrandGradientCharMove` (HomeExperience.vue JS ile üretiyor).
- `.mail-btn/.phone-btn/.location-group/.hours/.footer-heading/.form-row-message` (HomeFooter.vue'da mevcut).
- `.static-text/.hidden-measure/.track/.track-inner/.author/.top-row/.bottom-row/.rotating-text-wrapper` (HomeReviews.vue).
- `.catalog-tags/.catalog-tag/.catalog-tag-line/.catalog-code-line/.catalog-product-arrow/.catalog-row-info` (HomeCatalog.vue).
- main.css 28-91 (performans + seam fix blokları) — bilinçli, dokunma.
