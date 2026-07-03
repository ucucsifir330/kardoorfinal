# Kardoor — Kaynak Kod Temizlik Analizi

> **DURUM (4 Tem 2026, `cleanup2` branch):** Tamamlananlar: §1c Render klasörleri, §2a home-team.css (1685→487),
> §2b ölü sınıflar (home-catalog.css 3745→3345 + light/dark.css karşılıkları, −742 satır, commit `55570ff`),
> §2c site-header.css, §2d transitions.css, §2e references.css, §2g catalog.css, §2h main.css ölüleri,
> tema karşılıkları + HomeManifesto/HomeExperience ölü JS'i.
> §4 kısmen: main.css render-blocking @import silindi, references.vue'daki üçüncü font linki kaldırıldı,
> tüm Google aileleri tek config linkinde (commit `2ba0ead`). Kalan: aile sayısını azaltma (tasarım kararı).
> **Çözülen bulgu:** aluminium.css/subpage.css artık `pages/catalog.css` üzerinden import ediliyor — bağlantısız değil.
> **Bekleyenler:** §1a+1b (doors zinciri — kullanıcı erteledi), §2b yapısal birleştirme, §4 aile azaltma + hero görselleri, §5 responsive.

> Üretim tarihi: 3 Temmuz 2026 · Analiz: Claude · Uygulama: Alp (manuel)
> Satır numaraları bu tarihteki commit'e göredir; sildikçe kayacaktır — selector adına göre ara.
>
> **Güven işaretleri:**
> - ✅ **Kesin ölü** — hiçbir template/JS/composable'da geçmiyor, silinebilir.
> - ⚠️ **Doğrula** — dinamik sınıf / dış bağımlılık ihtimali var, silmeden önce projede ara.
> - ⛔ **SİLME (yanlış pozitif)** — tarayıcı "kullanılmıyor" dedi ama aslında kullanılıyor.

---

## 0. ÖNCE BUNLARI BİL — Yanlış Pozitifler (⛔ SİLME)

Bu sınıflar tarama araçlarında "unused" görünür ama **kullanılıyor**:

| Sınıf | Neden kullanılıyor |
|---|---|
| `.app-shell--night` (tokens.css, main.css, floating-contact.css, contact.css, home-references.css, dark.css) | `app.vue` içinde dinamik: `` `app-shell--${mode}` `` |
| `.page-enter-active/-leave-active/-from/-to` (transitions.css L2-22) | `nuxt.config.ts` → `pageTransition: { name: "page" }` |
| `.sl-backdrop-*`, `.sl-counter-*`, `.sl-info-*` (showroom.css) | ShowroomLab'de `<Transition name="sl-backdrop">` vb. |
| `.welcome-*` | WelcomeScreen `<Transition name="welcome">` |
| `.is-active`, `.is-focused` gibi durum sınıfları | Genelde `:class` binding'lerinde string olarak var; ama **catalog-search'e bağlı `.is-focused` gerçekten ölü** (aşağıda) |

---

## 1. TAMAMEN SİLİNEBİLİR DOSYA/ZİNCİRLER

### 1a. Ölü sayfa zincirleri ✅
`/doors` ve `/doors/:slug` route'ları `nuxt.config.ts` L15'te hook ile kapalı; `/series`'e hiçbir navigasyon yok.

- `pages/doors/index.vue` + `pages/doors/[slug].vue`
- `pages/series/index.vue` + `pages/series/[slug].vue`
- `components/doors/DoorSelector.vue` (sadece doors/index kullanıyor)
- `assets/styles/sections/door-selector.css` (480 satır) + main.css'teki `@import` satırı
- `composables/useDoorSelector.ts` (116 satır)
- ⚠️ `composables/useShowroomDoors.ts` — ShowroomLab kullanıyor olabilir, silme; sadece doors sayfaları kullanıyorsa sil.
- ⚠️ Silince `nuxt.config.ts`'teki `pages:extend` hook'u (L13-36) da gereksizleşir → sadeleştir.
- ⚠️ `SiteHeader.vue` ve katalog sayfalarındaki `/series`, `/doors` linklerini kontrol et (CatalogProductCard zaten non-navigating yapılmış).

### 1b. `assets/styles/sections/content-pages.css` (857 satır) — %95+ ölü ✅
Silinen `request-quote`, `export`, eski `company/contact` şablonlarının stilleri. `company.vue` kendi `company-*`, `contact.vue` kendi sınıflarını kullanıyor; `detail-page`/`back-link`/`eyebrow` sınıfları sadece ölü doors/series sayfalarında.
**Öneri:** 1a'yı sildikten sonra bu dosyayı komple sil + main.css'teki import'unu kaldır. (Silmeden önce son kontrol: `grep -rn "content-lead\|detail-page\|eyebrow" pages components --include="*.vue"`)

### 1c. `public/Render_light` + `public/Render_night` (744 MB) ✅
Sprite paketleyicinin ham kaynak kareleri; kodda sıfır referans (paketlenmiş `kardoor-door-*.webp` kullanılıyor). `public/`ten çıkar → repo dışı arşiv veya `scripts/` altında build-dışı klasör. Deploy boyutu 773 MB → ~30 MB.

---

## 2. CSS DOSYA BAZINDA ÖLÜ SINIFLAR

### 2a. `sections/home-team.css` (1.685 satır) — 73 ölü sınıf, ~%60'ı silinebilir ✅
Kaldırılmış "kurucular/ekip" bölümünün tüm kalıntısı. Şu blokların **tamamı** hiçbir .vue/.ts'de geçmiyor:

- **Promo/video bloğu** (L644-900 civarı): `.ada-carousel-wrapper`, `.ada-promo-*` (wrapper, card, media, poster, sheen, copy, kicker, title, text, meta, action, play, action-text), `.ada-video-modal*`, `.ada-video-close`, `.ada-video-stage`, `.ada-video-player`, `.ada-video-preview`
- **Kurucular grid'i** (L896-1046): `.ada-founders-grid`, `.ada-card`, `.ada-card-text`, `.ada-role`, `.ada-name`, `.ada-image-container`, `.ada-person-img`, `.ada-hover-overlay`, `.ada-bio`, `.ada-read-more`
- **Kişi modalı** (L1047-1320): `.ada-modal*` (tüm varyantlar), `.services-title`, `.services-list`, `.exp-line-1`, `.exp-line-2`
- **Tekil ölüler:** `.ada-manifesto-spacer` (L52), `.ada-structural-lines` (L60), `.ada-manifesto-word` (L127), `.reveal-space` (L263), `.ada-spacer-copy` (L276), `.ada-heading-k` (L315), `.ada-spacer-cta--icon-left` (L399), `.ege-gradient` (L497), `.kardoor-word` (L506), `.kern-after-k` (L513), `.reg-mark` (L517), `.loop-separator` (L528)
- ⚠️ `.ada-structural-line-path` — `ada-structural-line` HomeExperience'ta JS ile üretiliyor olabilir; `structural` kelimesini HomeExperience.vue'da ara.

Aynı ölü blokların **tema karşılıkları** da silinmeli: `public/themes/light.css` L287-320 ve `dark.css` L287-320 (`.services-title`, `.services-list`, `.exp-line-*`).

### 2b. `sections/home-catalog.css` (4.182 satır, 1.229 adet `!important`)
**Ölü sınıflar ✅:** `.catalog-logo-row` (L235), `.catalog-logo-text` (L241), `.catalog-search-block` (L246), `.catalog-search-input` (L254), `.catalog-filter-block` (L259), `.catalog-filter-list` (L271), `.catalog-filter-item` + `.catalog-arrow` (L280), `.catalog-sample-block` (L414), `.catalog-sample-text` (L420), `.catalog-sample-btn` (L424), `.catalog-mobile-filter-sheet` (L431), `.catalog-mobile-filter-panel` (L438), `.catalog-logo-ege` (L667), `.catalog-logo-kardoor` (L675), `.catalog-logo-r-wrap` (L681), `.catalog-logo-r` (L691), `.catalog-filter-label` (L710), `.catalog-search-wrapper` (L713), `.is-focused` (L740), `.catalog-search-icon` (L748), `.catalog-filter-text` (L788), `.catalog-sample-arrow` (L795), `.catalog-bottom-spacer` (L1139), `.catalog-mobile-filter-btn` (L1746), `.catalog-learn-more` (L2326), `.catalog-learn-more__icon` (L2357), `.catalog-learn-more__text` (L2383)
→ Bunlar eski katalog sidebar/arama/filtre UI'sının kalıntısı — aynı adlar `themes/light.css` (L487-660) ve `themes/dark.css` (L356-812) içinde de ölü.

**Yapısal sorun (silme değil birleştirme):** aynı selector defalarca tanımlı — `.catalog-section` **13 kez**, `.catalog-shell` 9, `.catalog-section::after` 9, `.catalog-row:last-of-type .catalog-card` 7, `.catalog-sticky-title` 5. Her yeni düzenleme dosyanın sonuna eklenmiş; `!important` sayısının 1.229 olmasının sebebi bu. **Öneri:** ölü sınıfları sildikten sonra tekrarlanan tanımları tek bloğa indir — `!important`'ların çoğu kendiliğinden gereksizleşir. (Formani animasyonu buraya geleceği için bu birleştirmeyi animasyondan ÖNCE yapmak çok daha güvenli.)

### 2c. `components/site-header.css` (1.207 satır) — eski header kontrolleri ✅
`.site-header__controls` (L447), `.site-header__bar-divider` (L455), `.site-header__theme-button` (L582), `.site-header__language-button` (L583), `.site-header__utility-link` (L599), `.site-header__utility` (L625), `.site-header__theme` (L638), `.site-header__language` (L639, **3 kez tanımlı**), `.site-header__lang-toggle` (L1045), `.brand-symbol__right` (L1094), `.brand-symbol__core` (L1099)

### 2d. `base/transitions.css` — kullanılmayan transition setleri ✅
`fade` (L24-32), `slide-up` (L36-51), `scale` (L54-67) — hiçbir `<Transition>` bu adları kullanmıyor. `page-*` KALSIN (⛔).

### 2e. `pages/references.css` — eski sayfa tasarımı kalıntısı ✅
`.references-page` (L1), `.references-hero` (L34), `.hero-brand` (L53), `.reg-mark` (L67), `.hero-letter` (L86), `.reference-card` (L300), `.reference-card--selected` (L326). ⚠️ `.ege` (L63) — kısa ad, dikkatli ara.

### 2f. `pages/catalog/aluminium.css` — kalıntı ✅
`.catalog-row__sticky` (L36), `.catalog-row__reveal--active` (L60), `.catalog-row__number` (L65), `.catalog-row__category` (L75), `.catalog-card--aluminium` (L98), `.catalog-card__eyebrow` (L111), `.catalog-card__description` (L130), `.catalog-card__feature` (L167), `.catalog-grid--aluminium` (L174), `.catalog-product-card` + `__media` (L180-184 — bileşen scoped stiline taşınmış olmalı, kontrol et ⚠️)

### 2g. `pages/catalog.css`
`.catalog-product__like--active` (L571), `.app-main--catalog` (L665) ✅ · `.kardoor-footer` (L21) ⚠️

### 2h. `main.css`
- `.content-page` (L74), `.catalog-search-wrapper` (L101), `.catalog-filter-item` (L102) ✅
- **L1'deki `@import url('https://fonts.googleapis.com/...Inter...Plus+Jakarta+Sans...')` → render-blocking zincir.** Plus Jakarta Sans'ı hangi dosya kullanıyorsa çıkar veya nuxt.config head'ine taşı; bu `@import` satırı kalkmalı. (Bkz. §4 Fontlar)

### 2i. `home-references.css`
`.home-references-flip__scroll-hint` (L75), `.home-references-flip__image` (L365) ⚠️ — bu dosyaya dün commit geldi (`bf5c3fa`), yeni tasarımın parçası olabilir; HomeReferences.vue'da tek tek ara.

### 2j. `public/themes/light.css` + `dark.css` (606 + 650 `!important`)
Ölü katalog sınıfları (§2b listesiyle aynı) + `.word-slide-item` (light L721, dark L884) ✅. Uzun vadede bu iki dosyanın `!important` savaşı token'lara devredilmeli ama bu ayrı bir operasyon — şimdilik sadece ölü blokları sil.

---

## 3. JS/VUE TARAFI — DOSYA BAZINDA NOTLAR

### 3a. `components/home/HomeExperience.vue` (999 satır)
- L40: `// @ts-nocheck` — kaldırılıp tip hataları giderilmeli (kademeli).
- 6 ayrı `scroll`/`resize` listener'ı (L645-646, L716-717, L917-919) + `mousemove` (L937). `scroll` dinleyenler ScrollTrigger `onUpdate`'e taşınabilir → tek kaynak.
- Reviews marquee fiziği + katalog handoff pin'i + manifesto reveal tek dosyada; `useReviewsMarquee` composable'ına ayrılmalı (temizlik sonrası, ayrı adım).

### 3b. `components/home/HomeCatalog.vue` (1.346 satır)
- İki ayrı `resize` listener'ı (L1295 `checkMobile`, L1318 `refreshCatalogLine`) → tek handler'da birleşebilir.
- `isMobile` eşiği 760px — CSS'teki 760 breakpoint'iyle uyumlu, iyi; ama bu eşik `matchMedia("(max-width: 760px)")` + change event ile daha ucuz.
- 2 düz `<img>` var → `NuxtImg`e geçir.

### 3c. `components/home/EntranceDoorLab.vue` (579 satır)
- Kod sağlıklı ve iyi belgelenmiş; asıl eksik **mobil strateji** (bkz. §5).
- L380: `window.addEventListener("wheel", { passive: false })` — hero unmount olana dek TÜM sayfa wheel'lerinde çalışır. Erken çıkış var ama yine de her event'te `trigger.progress` okunuyor; sorun değil, bilgi olarak dursun.
- L554: CTA `href="#"` — hem erişilebilirlik hem SEO için gerçek hedef ver (`/catalog` ya da scroll-to).

### 3d. `app.vue` + global overlay'ler
- `SmoothCursor` (185 satır, mousemove) her sayfada mount — dokunmatik cihazda gereksiz; `is-touch-device` sınıfına göre hiç mount etmemek daha iyi (CSS ile gizlemek yerine).
- `WelcomeScreen` her girişte mi çalışıyor kontrol et; session'da bir kez yeterli olabilir.

### 3e. Düz `<img>` kullanan dosyalar (→ NuxtImg + width/height + loading="lazy")
CatalogProductCard, HomeCatalog (2), HomeFooter, HomeManifesto (2), HomeReferences (4), ShowroomLab, tüm catalog alt sayfaları (7), company (2), references (4)

---

## 4. GLOBAL: FONT + GÖRSEL OPTİMİZASYONU

### Fontlar — 8 aile, 3 kaynak → hedef 2-3 aile
| Aile | Kaynak | Durum |
|---|---|---|
| General Sans | Fontshare (config head) | Kullanımda (3 dosya) |
| Inter | Google (config) **ve** main.css @import (mükerrer!) | En yaygın (15 dosya) — KALSIN, tek kaynaktan |
| Montserrat | Google (config) | 9 dosya |
| Instrument Serif | Google (config) | 4 dosya |
| Barlow Condensed | Google (config) | 2 dosya |
| Science Gothic | Google (config) | 2 dosya |
| Plus Jakarta Sans | main.css @import | 2 dosya |
| PP Neue Montreal | Lokal (base/fonts.css) | Lokal, sorun değil |

**Adımlar:** (1) main.css L1 `@import`'u sil, Inter mükerrerliği kalkar. (2) Az kullanılan aileleri (Barlow, Science Gothic, Plus Jakarta) tasarımda hangi başlıklar kullanıyor tespit et → mevcut ailelerden birine bağla. (3) Kalan Google ailelerini tek `<link>`te topla, kullanılmayan weight'leri kırp.

### Görseller
- `public/L-21X9.png` (6.2 MB) + `N-21X9.png` (8.1 MB) → kaynakları webp/avif'e dönüştür (~%90 küçülür), `HERO` sabitindeki yolları güncelle.
- `nuxt/public/images` (15 MB) içinde optimize edilmemiş büyük dosya var mı bak: `du -ah nuxt/public/images | sort -rh | head`.

---

## 5. RESPONSIVE AÇIKLARI (temizlikten sonraki iş)

| Bölüm | Mevcut durum | Yapılacak |
|---|---|---|
| entrance-lab.css | Mobil query **0** (sadece `min-width:1181` + reduced-motion) | Mobil hero kurgusu: ≤1024'te pinli 9-viewport scrub yerine kısa/statik hero; kapı navigasyonu buton tabanlı (wheel yok, ScrollSmoother kapalı → `settleToProgress` mobilde zaten çalışmıyor) |
| showroom.css | 1 query (900px) | Turntable + kapı rayı mobil düzeni |
| home-team.css | 2 query | Ölü kod temizliği sonrası kalan manifesto/CTA bölümüne mobil geçiş |
| home-references.css | 1 query (760px) | Yeni flip tasarımının tablet arası (760-1180) durumu |
| home-reviews.css | 2 query | Draggable marquee'nin touch davranışı |
| home-catalog.css | 23 query ✅ | En iyi durumda; birleştirme sırasında bozmamaya dikkat |
| Breakpoint standardı | Fiilen 760 / 1024 / 1180 | tokens.css'e yorum olarak resmileştir, yeni query'lerde sadece bunları kullan |

---

## 6. ÖNERİLEN SIRA (manuel uygulama)

1. **§1c** Render klasörleri (5 dk, en büyük kazanç, sıfır risk)
2. **§1a + §1b** Ölü sayfa zincirleri + content-pages.css (grep doğrulamalı)
3. **§2a** home-team.css ada-blokları + tema karşılıkları
4. **§2b-2h** Kalan CSS ölüleri (dosya dosya; her silmeden sonra `npm run dev` ile ilgili sayfayı gez)
5. **§4** Font konsolidasyonu + hero görsel dönüşümü
6. **§2b yapısal** home-catalog.css tekrar-birleştirme (!important temizliği)
7. **§5** Responsive seferberliği (ayrı oturum)
8. En son: HomeCatalog Formani animasyonu

> Her adımdan sonra commit at — geri dönüş kolay olsun. CSS silerken sayfayı iki temada da (day/night) kontrol et; tema dosyaları `!important` ile geç yükleniyor, ölü sanılan bir kural temada canlı olabilir.
