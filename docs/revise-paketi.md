# revise Paketi — Palet, Footer ve Baslik Deneyimi

Bu dosya `revise` branch'inde `519e7ae` uzerine atilan 5 commit'i paket paket
anlatir. Amac; degisikligi tek bir "UI revizyonu" yiginindan cikarip her biri
tek basina incelenebilir, dogrulanabilir ve geri alinabilir parcalara bolmektir.

## Kunye

| Alan | Deger |
| --- | --- |
| Branch | `revise` |
| Base commit | `519e7ae` (feat(ui): revise palette and page intro experience) |
| Commit araligi | `519e7ae..89018d9` |
| Tarih | 2026-08-11 |
| Kapsam | 12 dosya, +196 / -91 |
| Uzak durum | Commit'ler lokal; `origin/revise`'a push edilmedi |

## Paketler

| # | Commit | Paket | Dosya |
| --- | --- | --- | --- |
| 1 | `699ba4c` | Palet tokenlari ve hex temizligi | 5 |
| 2 | `4a31e0c` | Entrance configure paneli + copy mask | 2 |
| 3 | `b005963` | Footer divider merkezleme | 1 |
| 4 | `db78479` | Yorumlar basligi: pill yerine gradient metin | 2 |
| 5 | `89018d9` | References FLIP kose yaricapi | 2 |

---

## 1. Palet tokenlari ve hex temizligi — `699ba4c`

**Dosyalar**

- `nuxt/app/assets/styles/base/tokens.css`
- `nuxt/app/assets/styles/sections/home-catalog.css`
- `nuxt/app/assets/styles/sections/home-team.css`
- `nuxt/app/components/ui/WelcomeScreen.vue`
- `nuxt/app/pages/references.vue`

**Token degisiklikleri**

| Token | Once | Sonra | Etki |
| --- | --- | --- | --- |
| `--paper` | `#F2EEE6` | `#EBE6DB` | Acik zemin bir tik daha koyu/sicak |
| `--surface` | `#FBF9F5` | `#FDFCFA` | Kart yuzeyi neredeyse beyaz |
| `--surface-2` | `#F1EDE5` | `#F1F0EC` | Ikincil yuzey notrlesti |
| `--accent-soft` | `var(--brand-500)` | `var(--brand-700)` | Ikili basligin 2. satiri koyulasti |

**Hex to token eslemeleri**

| Yer | Once | Sonra | Gercek renk farki |
| --- | --- | --- | --- |
| `.ada-manifesto-cta` (day) | `#16101F` | `var(--slab)` = `#1A1533` | Hafif daha acik ve mor/mavi |
| `.welcome-screen` (day) | `#16101F` | `var(--slab)` | Ayni fark |
| `.footer-dome` (references) | `#16101F` | `var(--slab)` | Ayni fark, `box-shadow` dahil |
| `.catalog-card-subtitle` | `var(--ink-soft)` `#8A8073` | `var(--brand-700)` `#22318C` | Sicak griden lacivert metne gecis |

> Dikkat: bu commit "sadece degisken adi degistirdik" degil. `#16101F -> #1A1533`
> ve `#8A8073 -> #22318C` gercek renk degisimleridir; ekranda gorulur.
> Kazanim, bu yuzeylerin bundan sonra tek merkezden (`--slab`, `--brand-700`)
> yonetiliyor olmasi.

**Dogrulama**

- Day temada: `/` ana sayfa manifesto CTA, welcome screen, `/references` footer dome.
- Katalog kartlarinin alt basligi (sag hizali, 15.5px) lacivert okunmali.

---

## 2. Entrance configure paneli + copy mask — `4a31e0c`

**Dosyalar**

- `nuxt/app/assets/styles/sections/entrance-lab.css`
- `nuxt/app/assets/styles/sections/entrance-mobile.css`

**Degisiklikler**

- Masaustu `.entrance-lab__configure` (day): sabit `color-mix(#f3f1ea, #d9d6cd)`
  yerine `color-mix(in srgb, var(--paper) 58%, var(--hairline))`. Ayni karisim
  orani korundu, kaynak renkler palete bagli hale geldi.
- Mobil `.entrance-mobile__configure`: taban artik `var(--ambience-bg)` degil,
  acik bir koyu zemin — `color-mix(in srgb, #131937 58%, #080B18)`. Day icin
  ayri bir `[data-ambience="day"]` varyanti eklendi (masaustuyle ayni formul).
  Sebep: `--ambience-bg` tema gecislerinde panelin altini beklenmedik sekilde
  aciyordu; artik iki ambience de acik acik tanimli.
- `.entrance-lab__copy-mask` konumu: `left` `3.9vw -> 3.5vw`,
  `top` `19svh -> 21.5svh`. Clamp'lerin alt/ust sinirlari degismedi, yalnizca
  orta (viewport'a bagli) deger kaydi.

**Dogrulama**

- Masaustu + mobil, day ve night ambience'ta configure paneli.
- Copy blogunun kapi gorseliyle hizasi; ozellikle 1280-1600px arasi.

---

## 3. Footer divider merkezleme — `b005963`

**Dosya**

- `nuxt/app/assets/styles/sections/home-footer.css`

**Problem**

Onceki grid `minmax(360px, 560px) auto minmax(520px, 860px)` idi ve divider
kendi (orta) grid sutununda duruyordu. `column-gap` iki yanda esit olsa bile
sutunlarin genisligi asimetrik oldugu icin divider viewport merkezine
oturmuyordu; pencere genisledikce kayma artiyordu.

**Cozum**

- Grid `repeat(2, minmax(0, 1fr))`, `column-gap: 0`.
- Divider grid'den cikti: `position: absolute; left: 50%;` +
  `transform: translateX(-0.5px)` ile 1px cizgi gercek merkeze oturuyor.
  Yuksekligi, eskiden `margin` ile alinan bosluklarin clamp'leriyle acik acik
  hesaplaniyor:

  ```
  height: calc(
    clamp(720px, 72svh, 900px)      /* .footer-main min-height */
    - clamp(150px, 11vw, 205px)     /* ust padding */
    - clamp(8px, 1.4vw, 24px)       /* ust bosluk */
    - clamp(40px, 6vw, 90px)        /* alt bosluk */
  );
  ```

- Yeni tek ayar dugmesi: `--footer-center-gap: clamp(96px, 12vw, 160px)`.
  Solda `.footer-brand`'in `padding-right`'ini, sagda `.footer-panel`'in
  `padding-left`'ini besliyor — yani merkez bosluk iki tarafta tanim geregi esit.
- `.footer-visual` eski 4x96px alt grid'ini birakti, `grid-column: 1`.
  `.footer-panel` `grid-column: 2`, `max-width` ve `auto` margin kalkti.
- K logosu saga yaslandi (`justify-content: flex-end`), boyut
  `clamp(410px, 27vw, 560px) -> clamp(380px, 25vw, 520px)`, transform
  `translate(-3%, -1%) scale(1.04)` yerine sade `translateY(-1%)`.
- `min-width: 1181px` uzerinde iki sutun birlikte
  `translateY(clamp(22px, 2vw, 32px))` kadar asagi kayiyor (mockup dengesi).
- Mobil breakpoint'te `grid-column: auto`, logo yeniden ortalanip
  `padding-right: 0` oluyor; onceki yigilmis davranis korunuyor.

**Ek**

- `.footer-heading__emphasis` artik `var(--brand-300)`.
- `.location-card` telefon linkine `white-space: nowrap` (numara kiriliyordu).

**Dikkat**

Divider yuksekligi `.footer-main`'in `min-height` ve `padding` clamp'lerini
elle tekrarliyor. Bu dort degerden biri degisirse divider `calc`'i da
guncellenmeli — aksi halde cizgi kisa/uzun kalir. Ayni satirlar
`home-footer.css` icinde birbirine yakin durdugu icin fark edilir, ama tek
kaynak degil.

**Dogrulama**

- 1280 / 1440 / 1680 / 1920px: divider tam ortada mi, iki yandaki bosluk esit mi.
- 1180px alti: mobil/tablet duzeni bozulmadi mi, logo ortali mi.
- `/references` ve ana sayfa footer'i birlikte kontrol edilmeli.

---

## 4. Yorumlar basligi: pill yerine gradient metin — `db78479`

**Dosyalar**

- `nuxt/app/components/home/HomeReviews.vue`
- `nuxt/app/components/home/HomeExperience.vue`

**Kaldirilanlar**

- Donen kelimeyi saran pill: `bg-[var(--brand-700)]`, `bg-[length:300%_300%]`,
  `box-shadow`, `[animation:gradientBG_6s_ease_infinite]`,
  `rounded-[clamp(28px,3.2vw,44px)]`, `overflow-hidden`.
- Kelime ortalama (`justify-center`) ve `px-[2vw]` ic bosluklari.
- `HomeExperience.vue` icindeki `baseTitleWidth` mantigi — statik "Son"
  kelimesini olculen genislige gore `translateX` ile kaydiran kod.
- `dynamicGap`'in genislige bagli hesabi (`34 + titleWidth * 0.04`, 38-58px'e
  clamp'lenen). Yerine sabit `clamp(12px, 1.2vw, 22px)`.

**Gelenler**

- Wrapper `overflow-visible`, metin sola yasli (`justify-start`), yukseklikler
  bir tik buyudu (orn. masaustu `clamp(4.5rem, 6.05vw, 6.75rem)` ->
  `clamp(4.85rem, 6.55vw, 7.25rem)`).
- Kelime basina gradient kimlik: timeline her kelimeye gecerken
  `el.dataset.gradient = 'word-<i>'` yaziyor ve ayni deger parent
  `.typewriter-line`'a da kopyalaniyor. CSS tarafinda `word-0/1/2` icin ayri
  `--typewriter-gradient` (iki radial + bir `linear-gradient(... in oklab ...)`)
  ve eslesen `--typewriter-caret` rengi tanimli.
- Metin `background-clip: text` + `-webkit-text-fill-color: transparent` ile
  boyaniyor; `typewriter-gradient-flow` 16s `alternate` animasyonu yalnizca
  `background-position` oynatiyor (layout'a dokunmuyor).
- `prefers-reduced-motion: reduce` altinda animasyon kapali — gradient sabit
  kaliyor, metin okunur durumda.

**Dikkat**

- Gradient setleri `word-0..word-2` ile indekse bagli. `reviewCopies` icindeki
  `titleWords` uzunlugu degisirse 3'ten sonraki kelimeler gradient'siz
  (`color: transparent` + tanimsiz `--typewriter-gradient`) kalabilir; yeni
  kelime eklenirse CSS'e karsiligi da eklenmeli.
- `background-clip: text` destegi gerekli; hedef tarayicilarda sorun yok ancak
  cok eski WebKit'te metin gorunmez olur.

**Dogrulama**

- Ana sayfa yorumlar bolumu: uc kelimenin yazilip silinme dongusu, her kelimede
  gradient ve caret renginin degismesi, caret'in kirpilmamasi.
- Reduced-motion acikken metnin sabit ve okunur kalmasi.
- Locale degisiminde (tr disi) genislik olcumu ve hizalama.

---

## 5. References FLIP kose yaricapi — `89018d9`

**Dosyalar**

- `nuxt/app/components/home/HomeReferences.vue`
- `nuxt/app/assets/styles/sections/home-references.css`

**Degisiklikler**

- `.home-references-flip__media` artik `overflow: hidden` ve iki eksenli
  yaricap tasiyor:

  ```css
  --references-media-radius-x: var(--radius-xl); /* 20px */
  --references-media-radius-y: var(--radius-xl);
  border-radius: var(--references-media-radius-x) / var(--references-media-radius-y);
  ```

- FLIP scrub'i bu iki degiskeni baslangic degerinden `0px`'e animate ediyor.
  Baslangic degerleri `Flip.fit`'ten gelen `scaleX/scaleY`'ye **bolunuyor**:

  ```ts
  const startMediaRadiusX = `${mediaRadius / Math.max(Math.abs(fitScaleX), 0.001)}px`;
  ```

  Sebep: element olceklenirken kose yaricapi da olcekleniyor. Bolme, kucuk
  baslangic karesinde kosenin gozle **20px** gorunmesini sagliyor. `Math.max`
  ile 0'a bolme korumasi var.
- Renkler tokenlere gecti: iframe/play arka plani `#050607 -> var(--slab)`,
  play ikonu `#ffe8c9 -> var(--brand-100)` (`#EEF0FF`), play metni ayni sekilde.
  Bu, kremden soguk beyaza gecen **gorunur** bir renk degisimidir.
- Play ikonu kucultuldu: `clamp(46px,16vw,186px) -> clamp(44px,13vw,156px)`.
  SVG'nin optik merkezleme icin konan `translateX(7%)` duzeltmesi kaldirildi.

**Dogrulama**

- References bolumunde scroll scrub'i asagi/yukari: kose yaricapi buyume
  boyunca sabit gorunmeli, sonda tam kare olmali.
- Video acildiktan sonra iframe kenarlarinin tasmamasi (`overflow: hidden`).
- Play ikonu ve metninin yeni renkte kontrastinin yeterli olmasi.

---

## Bilinen konu: satir sonlari

`HomeExperience.vue` karisik satir sonu iceriyor: dosyanin buyuk kismi CRLF,
bu pakette duzenlenen ~40 satir LF olarak yazildi. Davranisa etkisi yok, ancak
diff'te icerigi degismemis satirlar degismis gibi gorunuyor.

Ayni durumdaki diger dosyalar: `tokens.css` (205 CRLF satir),
`home-team.css` (508). Kalici cozum icin iki secenek var:

1. Dosyalari tek bicime normalize eden ayri bir commit.
2. Repo kokune `.gitattributes` (`* text=auto eol=lf`) ekleyip bir kerelik
   `git add --renormalize .`.

Ikisi de bu paketin disinda birakildi; karistirilirsa gercek degisiklikler
gurultuye gomulur.

## Toplu dogrulama listesi

- [ ] `npm run dev` — konsol hatasi yok.
- [ ] Ana sayfa: entrance -> katalog -> references -> yorumlar -> footer akisi.
- [ ] `/references` sayfasi footer dome ve divider.
- [ ] Day ve night ambience ayri ayri.
- [ ] Breakpoint'ler: 390 / 768 / 1024 / 1180 / 1440 / 1920.
- [ ] `prefers-reduced-motion: reduce` ile yorumlar basligi.
- [ ] Build: `npm run build`.

## Geri alma

Paketler dosya bazinda ayrik oldugu icin tek tek geri alinabilir:

```bash
git revert 89018d9   # references flip
git revert db78479   # yorumlar basligi
git revert b005963   # footer divider
git revert 4a31e0c   # entrance
git revert 699ba4c   # palet tokenlari
```

Tum paketi birden geri almak icin:

```bash
git reset --hard 519e7ae
```
