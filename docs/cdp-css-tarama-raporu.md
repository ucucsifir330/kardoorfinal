# CDP Canlı-DOM CSS Taraması — cleanup2 raporu

Tarih: 2026-07-12 · Yöntem: Chrome DevTools MCP, gerçek tarayıcı, dev sunucu `:3001`

## Kapsam

- **23 geçiş**: `/` (1883/1440/768/390), `/catalog` + 7 seri sayfası, `/company`, `/contact`, `/references`, `/doors/AL-001` (masaüstü 1883 + mobil 390 emülasyonu, touch).
- Her geçişte: adım adım tam scroll (scroll-trigger sınıfları), header menü aç/kapa, iletişim FAB aç/kapa, **tema değişimi (day↔night)** + ikinci tam scroll.
- Kurallar CSSOM'dan `data-vite-dev-id` ile kaynak dosyaya eşlendi; her selector canlı DOM'a `querySelector` ile test edildi. `:hover/:focus` gibi durum pseudo'ları soyulup taban element arandı — **listede kalanlar taban elementi dahi hiç var olmayan kurallardır.**

## Özet

| Metrik | Değer |
|---|---:|
| Benzersiz selector (tüm site) | 1329 |
| Canlı DOM'da eşleşen | 1044 |
| Hiçbir geçişte eşleşmeyen (dedup sonrası) | **205** |

| Ölü aday | Toplam | Dosya |
|---:|---:|---|
| 110 | 844 | `nuxt/app/assets/styles/main.css` |
| 62 | 62 | `nuxt/app/components/DebugLab.vue` |
| 19 | 84 | `nuxt/app/pages/references.vue` |
| 7 | 96 | `public/themes/dark.css` |
| 3 | 53 | `nuxt/app/assets/styles/sections/showroom.css` |
| 2 | 4 | `nuxt/app/components/ui/SmoothCursor.vue` |
| 1 | 13 | `nuxt/app/components/ui/WelcomeScreen.vue` |
| 1 | 16 | `nuxt/app/components/home/AdaCtaButton.vue` |

## Değerlendirme (dosya bazında)

### `main.css` — 110 aday, 3 küme

1. **`.product-modal-*` (~55 kural)** — eski ürün modalı. Hiçbir rotada DOM'da yok; ürün detayı artık `/doors/[code]` sayfası. Kod tarafında hâlâ render eden bileşen var mı bakılmalı; yoksa en büyük tek temizlik fırsatı bu.
2. **`.catalog-subpage*`, `.catalog-lib__empty*`, `.catalog-lib-dock__badge`, `.catalog-lib-filter__option--unavailable`** — katalog alt-sayfa/boş-durum kalıntıları.
3. **`is-liquid-expanded`, `is-liked`, `html.is-safari*`, `.review-card.tilting`, `.reveal-word/.reveal-char`** — etkileşim/tarayıcı durum sınıfları. Safari kuralları Chrome'da doğal olarak ölü görünür (**silme**); `is-liked` favori tıklanmadığı için, `tilting` tilt anında eklendiği için görünmemiş olabilir → clean-candidate ile doğrula.
4. **`.page-enter-active/.page-leave-*`** — sayfa geçiş sınıfları; sadece rota geçişi anında var olur. Audit geçiş bittikten sonra koştu → **büyük olasılıkla canlı, silme**.

### `pages/references.vue` — 19 aday
`.project-expansion-panel`, `.panel-*`, `.nav-btn*` — proje genişletme paneli hiç açılmadı (tıklanmadı). Panel gerçekten açılabiliyorsa canlıdır; açan etkileşim kaldırıldıysa ölüdür. Tarama sırasında panel tetiklenmedi, elle doğrula.

### `public/themes/dark.css` — 7 aday
`.reveal-word/.reveal-char`, `.close-icon`, `.catalog-like.is-liked`, footer-bottom kuralı — main.css'teki karşılıklarıyla aynı kaderde; birlikte ele al.

### `components/DebugLab.vue` — 62/62
`?debug=1` olmadan hiç mount edilmiyor; **bilerek var, dokunma** (dev-only panel).

### Küçükler
- `SmoothCursor.vue` `--visible/--active`: fare hareketiyle ekleniyor; audit fare oynatmadı → **muhtemelen canlı**.
- `WelcomeScreen.vue` `welcome-enter-from`: transition ilk karesi → **canlı**.
- `AdaCtaButton.vue` `--icon-left`: bu varyant hiçbir yerde kullanılmıyor olabilir — koddan bak.
- `showroom.css` 3 kural: yine `html.is-safari` — silme.

## Tanımlanıp hiç `var()` ile okunmayan CSS değişkenleri

- `public/themes/dark.css` (7): `--word-transition-smooth`, `--catalog-product-scrollbar`, `--catalog-stage-bg`, `--catalog-stage-sticky-bg`, `--catalog-product-scrollbar-track`, `--catalog-product-scrollbar-thumb`, `--catalog-product-scrollbar-thumb-hover`
- `nuxt/app/assets/styles/main.css` (56): `--card-bg`, `--surface-hover`, `--text-muted`, `--accent-soft`, `--panel`, `--warm`, `--header-blur`, `--header-glass`, `--header-glass-strong`, `--header-glass-sheen`, `--header-glass-line`, `--header-glass-highlight`, `--header-control-active`, `--header-control-highlight`, `--header-control-shadow`, `--header-language-track`, `--header-bulb-fill`, `--header-bulb-glow`, `--header-quote-text`, `--spring-bounce`, `--spring-snappy`, `--expo-in-out`, `--quint-out`, `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--radius-sm`, `--ambience-bg`, `--ambience-text`, `--ambience-muted`, `--ambience-soft`, `--ambience-line`, `--ambience-glass`, `--ambience-overlay`, `--ambience-shadow`, `--ambience-light`, `--ambience-glow`, `--ambience-hero-filter`, `--ambience-copy-shadow`, `--header-shine-angle`, `--disabled`, `--catalog-curtain-extra`, `--references-soft`, `--references-line`, `--references-accent`, `--marble`, `--torus`, `--clg-surface-raised`, `--day`, `--contact-soft`, `--night`, `--contact-map-card-width`, `--contact-map-card-height`, `--catalog-stage-bg`
- `nuxt/app/pages/references.vue` (3): `--ref-page-bg`, `--references`, `--header-control-active`

> Not: JS içinden `getPropertyValue`/`style.setProperty` ile okunma ihtimali taranmadı; silmeden önce `Grep` ile kod tarafına bak.

## Kullanılmayan @keyframes

Yok — tanımlı tüm keyframe'ler bir `animation-name` tarafından referanslanıyor.

## Kapsam dışı (bu durumlara özel kurallar "ölü" görünebilir)

- EN dil varyantı, `?debug=1` Debug Lab, form hata/başarı durumları, video modal açık hali, referanslar proje paneli açık hali, favori (`is-liked`) durumu, Safari (`html.is-safari`).
- Kısa ömürlü animasyon sınıfları örnekleme aralığına denk gelmemiş olabilir.
- Karar kuralı: buradaki liste **aday** listesidir; silmeden önce [[clean-candidate dosya yöntemi]] ile doğrulanmış kuralları ayrı dosyaya taşıyarak ilerle.

## Dosya bazında tam listeler

<details><summary><code>nuxt/app/assets/styles/main.css</code> — 110 selector</summary>

- `.page-enter-active`
- `.page-leave-active`
- `.page-enter-from`
- `.page-leave-to`
- `.page-enter-active, .page-leave-active`
- `.page-enter-from, .page-leave-to`
- `div#__nuxt > section.catalog-section::after`
- `.catalog-like.is-liked .catalog-heart`
- `.home-page .catalog-like.is-liked`
- `.product-modal`
- `.product-modal-panel`
- `.product-modal-panel::before`
- `.product-modal-panel::after`
- `.product-modal-visual`
- `.product-modal-visual-frame`
- `.product-modal-visual:not(:has(.product-modal-visual-frame))`
- `.product-modal-image`
- `.product-modal-visual-caption`
- `.product-modal-content`
- `.product-modal-content::-webkit-scrollbar`
- `.product-modal-content::-webkit-scrollbar-track`
- `.product-modal-content::-webkit-scrollbar-thumb`
- `.product-modal-heading`
- `.product-modal-kicker`
- `.product-modal-content h2`
- `.product-modal-meta`
- `.product-modal-meta span:not(:last-child)::after`
- `.product-modal-meta span + span::before`
- `.product-modal-description`
- `.product-modal-actions`
- `.product-modal-like, .product-modal-quote`
- `.product-modal-like`
- `.product-modal-like span`
- `.product-modal-quote`
- `.product-modal-details`
- `.product-modal-info-block`
- `.product-modal-info-block h3, .product-modal-details h3`
- `.product-modal-info-block h3::after, .product-modal-details h3::after`
- `.product-modal-info-block dl, .product-modal-details dl`
- `.product-modal-info-block dl div, .product-modal-details dl div`
- `.product-modal-info-block dl div:last-child, .product-modal-details dl div:last-child`
- `.product-modal-info-block dt, .product-modal-details dt`
- `.product-modal-info-block dd, .product-modal-details dd`
- `.product-modal-files`
- `.product-modal-files a, .product-modal-details a`
- `.product-modal-files a:hover, .product-modal-details a:hover`
- `.product-modal-specs`
- `.product-modal-specs div`
- `.product-modal-specs div:hover`
- `.product-modal-specs span`
- `.product-modal-specs strong`
- `.product-modal-finishes`
- `.product-modal-finishes button, .product-modal-finishes span`
- `.product-modal-finishes button:hover, .product-modal-finishes span:hover`
- `.product-modal-finishes button:first-child, .product-modal-finishes span:first-child`
- `.product-modal-finishes button.is-metal, .product-modal-finishes span:nth-child(6)`
- `.product-modal-finishes span:nth-child(1)`
- `.product-modal-finishes span:nth-child(2)`
- `.product-modal-finishes span:nth-child(3)`
- `.product-modal-finishes span:nth-child(4)`
- `.product-modal-finishes span:nth-child(5)`
- `.product-modal-close`
- `.product-modal-close:hover`
- `.product-modal-nav`
- `.product-modal-prev`
- `.product-modal-next`
- `.product-modal-nav svg`
- `.product-modal-nav:hover svg`
- `.product-modal-visual-frame, .product-modal-visual:not(:has(.product-modal-visual-frame))`
- `.product-modal-panel::before, .product-modal-panel::after`
- `.product-modal-meta span`
- `.home-page .catalog-row.is-liquid-expanded .catalog-card.liquid-card`
- `.home-page .catalog-row.is-liquid-active .liquid-menu`
- `.home-page .catalog-row.is-liquid-expanded .liquid-menu.is-expanded`
- `.home-page .catalog-row.is-liquid-expanded .liquid-menu-inner`
- `.home-page .catalog-row.is-liquid-expanded .liquid-menu.is-expanded .liquid-menu-inner`
- `.home-page .catalog-row.is-liquid-expanded .hamburger-line:nth-child(1), .home-page .catalog-row.is-liquid-expanded .hamburger-line:nth-child(2), .home-page .catalog-row.is-liquid-expanded .hamburger-line:nth-child(3)`
- `.home-page .catalog-row.is-liquid-expanded .hamburger`
- `html[data-theme="dark"] .app-shell--night .home-page .catalog-like.is-liked`
- `html[data-theme="dark"] .app-shell--night .home-page .catalog-like.is-liked .catalog-heart`
- `html.is-safari .home-page .catalog-card.liquid-card, html.is-safari .home-page .catalog-row:last-of-type .catalog-card.liquid-card, html.is-safari .home-page .catalog-product-image-wrap, html.is-safari .home-page .catalog-learn-more__circle, html.is-safari .home-page .catalog-all-models .catalog-tag-part`
- `html.is-safari .home-page .catalog-product-image-wrap`
- `html.is-safari .home-page .catalog-row`
- `html.is-safari.is-scrolling .home-page .catalog-shell, html.is-safari.is-scrolling .home-page .catalog-card, html.is-safari.is-scrolling .home-page .catalog-row:last-of-type .catalog-card, html.is-safari.is-scrolling .home-page .catalog-product-image-wrap, html.is-safari.is-scrolling .home-page .catalog-like`
- `html.is-safari.is-scrolling .home-page .catalog-card, html.is-safari.is-scrolling .home-page .catalog-product-image-wrap, html.is-safari.is-scrolling .home-page .catalog-product-image, html.is-safari.is-scrolling .home-page .catalog-like, html.is-safari.is-scrolling .home-page .catalog-tag-line, html.is-safari.is-scrolling .home-page .catalog-code-line`
- `html[data-theme="dark"] .app-shell--night .home-page .catalog-row.is-liquid-expanded .liquid-menu-inner`
- `.ada-split-quote small`
- `.reveal-word`
- `.reveal-char`
- `.reveal-word.brand-gradient-word .reveal-char`
- `.app-shell--day .ada-split-quote small`
- `.app-shell--night .home-references-flip__video`
- `.home-references-flip__video`
- `.review-card.tilting`
- `.catalog-subpage`
- `.catalog-subpage h1`
- `.catalog-subpage__grid`
- `.catalog-subpage__grid a`
- `.catalog-subpage__grid img`
- `.catalog-subpage__grid strong`
- `.catalog-subpage__grid span`
- `.catalog-lib__empty`
- `.catalog-lib__empty p`
- `.catalog-lib-dock__badge`
- `body:has(.catalog-lib-filter[open])`
- `.catalog-lib-filter__option--unavailable`
- `.catalog-lib-filter__option--unavailable input`
- `.contact-form__field--filled span`
- `.contact-form__status`
- `.contact-map__branch p .flip-text-link::before, .contact-map__branch p .flip-text-link::after`

</details>

<details><summary><code>nuxt/app/components/DebugLab.vue</code> — 62 selector</summary>

- `.dlab[data-v-f4523dfe]`
- `.dlab__fab[data-v-f4523dfe]`
- `.dlab__panel[data-v-f4523dfe]`
- `.dlab__head[data-v-f4523dfe]`
- `.dlab__head span[data-v-f4523dfe]`
- `details[data-v-f4523dfe]`
- `summary[data-v-f4523dfe]`
- `summary em[data-v-f4523dfe]`
- `.dlab__row[data-v-f4523dfe]`
- `.dlab__row > label[data-v-f4523dfe]`
- `.dlab__panel button[data-v-f4523dfe]`
- `.dlab__panel button.on[data-v-f4523dfe]`
- `.dlab__panel button.off[data-v-f4523dfe]`
- `.dlab__panel button[data-v-f4523dfe]:disabled`
- `.dlab__panel input[type="range"][data-v-f4523dfe]`
- `.dlab__search[data-v-f4523dfe]`
- `.dlab__files[data-v-f4523dfe]`
- `.dlab__files button[data-v-f4523dfe]`
- `.dlab__files em[data-v-f4523dfe]`
- `.dlab__vars[data-v-f4523dfe]`
- `.dlab__var[data-v-f4523dfe]`
- `.dlab__var label[data-v-f4523dfe]`
- `.dlab__var input[type="color"][data-v-f4523dfe]`
- `.dlab__varval[data-v-f4523dfe]`
- `.dlab__pin[data-v-f4523dfe]`
- `.dlab__pindesc[data-v-f4523dfe]`
- `.dlab__computed[data-v-f4523dfe]`
- `.dlab__computed b[data-v-f4523dfe]`
- `.dlab__rules[data-v-f4523dfe]`
- `.dlab__rule[data-v-f4523dfe]`
- `.dlab__rulehead b[data-v-f4523dfe]`
- `.dlab__rulehead em[data-v-f4523dfe]`
- `.dlab__ruleprops[data-v-f4523dfe]`
- `.dlab__prop.win[data-v-f4523dfe]`
- `.dlab__prop.dead[data-v-f4523dfe]`
- `.dlab__prop.imp b[data-v-f4523dfe]`
- `.dlab__stats[data-v-f4523dfe]`
- `.dlab__chip[data-v-f4523dfe]`
- `.dlab__chip--imp[data-v-f4523dfe]`
- `.dlab__chip--dead[data-v-f4523dfe]`
- `.dlab__chip--kill[data-v-f4523dfe]`
- `.dlab__deadview[data-v-f4523dfe]`
- `.dlab__deadwarn[data-v-f4523dfe]`
- `.dlab__rule.fulldead[data-v-f4523dfe]`
- `.dlab__legend[data-v-f4523dfe]`
- `.dlab__legend .w[data-v-f4523dfe]`
- `.dlab__legend .d[data-v-f4523dfe]`
- `.dlab__winners[data-v-f4523dfe]`
- `.dlab__winner[data-v-f4523dfe]`
- `.dlab__winner b[data-v-f4523dfe]`
- `.dlab__wval[data-v-f4523dfe]`
- `.dlab__wval i[data-v-f4523dfe]`
- `.dlab__winner em[data-v-f4523dfe]`
- `.dlab__rulemore[data-v-f4523dfe]`
- `.dlab__hint[data-v-f4523dfe]`
- `.dlab__abdiff[data-v-f4523dfe]`
- `.dlab__flip[data-v-f4523dfe]`
- `.dlab__foot[data-v-f4523dfe]`
- `.dlab__reset[data-v-f4523dfe]`
- `.dlab-hl[data-v-f4523dfe]`
- `.dlab-hl__m[data-v-f4523dfe]`
- `.dlab-hl__p[data-v-f4523dfe]`

</details>

<details><summary><code>nuxt/app/pages/references.vue</code> — 19 selector</summary>

- `.project-expansion-panel[data-v-f6f31559]`
- `.panel-inner[data-v-f6f31559]`
- `.panel-close[data-v-f6f31559]`
- `.close-icon[data-v-f6f31559]`
- `.panel-close:hover .close-icon[data-v-f6f31559]`
- `.close-icon svg[data-v-f6f31559]`
- `.panel-content[data-v-f6f31559]`
- `.panel-carousel[data-v-f6f31559]`
- `.image-viewport[data-v-f6f31559]`
- `.project-display[data-v-f6f31559]`
- `.display-img-container[data-v-f6f31559]`
- `.display-img-container img[data-v-f6f31559]`
- `.display-info[data-v-f6f31559]`
- `.display-info h3[data-v-f6f31559]`
- `.panel-location[data-v-f6f31559]`
- `.nav-btn[data-v-f6f31559]`
- `.nav-btn[data-v-f6f31559]:hover`
- `.nav-btn.prev[data-v-f6f31559]`
- `.nav-btn.next[data-v-f6f31559]`

</details>

<details><summary><code>public/themes/dark.css</code> — 7 selector</summary>

- `.reveal-word`
- `.reveal-char`
- `.reveal-word.brand-gradient-word .reveal-char`
- `.close-icon`
- `.close-icon svg`
- `.catalog-like.is-liked .catalog-heart`
- `.footer-bottom > div:last-child, div#__nuxt .footer-wrapper .footer-bottom > div:last-child`

</details>

<details><summary><code>nuxt/app/assets/styles/sections/showroom.css</code> — 3 selector</summary>

- `html.is-safari .showroom-lab__backdrop`
- `html.is-safari .showroom-lab__backdrop-text`
- `html.is-safari .showroom-lab__slot`

</details>

<details><summary><code>nuxt/app/components/ui/SmoothCursor.vue</code> — 2 selector</summary>

- `.smooth-cursor--visible[data-v-3697c9aa]`
- `.smooth-cursor--active[data-v-3697c9aa]`

</details>

<details><summary><code>nuxt/app/components/ui/WelcomeScreen.vue</code> — 1 selector</summary>

- `.welcome-enter-from[data-v-a79f8257], .welcome-leave-to[data-v-a79f8257]`

</details>

<details><summary><code>nuxt/app/components/home/AdaCtaButton.vue</code> — 1 selector</summary>

- `.ada-cta-button--icon-left[data-v-66c9b1f6]`

</details>

