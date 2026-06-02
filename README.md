# Kardoor

Ege Kardoor showroom ve katalog deneyimi için geliştirilen Nuxt 4 uygulaması.

## Gereksinimler

- Node.js 20+
- npm 10+

## Kurulum

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Komutlar

```bash
npm run dev         # geliştirme sunucusu
npm run build       # production build
npm run preview     # build çıktısını yerel olarak önizle
npm run typecheck   # TypeScript tip kontrolü
```

Root script'leri `nuxt/` klasöründeki uygulamaya delege eder.

## Proje Yapısı

```
nuxt/
├── app.vue                       # global layout (header + footer + NuxtPage)
├── pages/                        # route'lar
├── components/
│   ├── layout/                   # SiteHeader, BrandMark
│   ├── home/                     # ana sayfa bölümleri
│   └── doors/                    # kapı seçici
├── composables/                  # useShowroomAmbience, useKardoorLocale, useKardoorAsset
├── data/                         # ürün, seri, koleksiyon verileri
├── assets/styles/
│   ├── main.css                  # tüm CSS'in tek giriş noktası
│   ├── base/                     # tokens, reset, transitions
│   ├── components/               # header, buttons, footer
│   ├── sections/                 # bölüm bazlı stiller
│   └── pages/                    # sayfa bazlı stiller
└── public/
    └── themes/                   # light.css, dark.css (runtime tema)
```

## Rotalar

| Route | Açıklama |
|---|---|
| `/` | Hero + katalog + ekip + yorumlar |
| `/catalog` | Tam ürün kataloğu |
| `/doors`, `/doors/[slug]` | Kapı seçici ve detay sayfaları |
| `/series`, `/series/[slug]` | Seri listesi ve detayları |
| `/company` | Şirket zaman çizelgesi |
| `/references` | Referans projeler |
| `/production`, `/export`, `/contact`, `/request-quote` | İçerik sayfaları |

## Mimari Notlar

**Global layout.** `SiteHeader` ve `HomeFooter` `app.vue` içinde renderlanır ve her sayfada görünür. Sayfa içeriği `<NuxtPage />` üzerinden yüklenir.

**Tema.** `useShowroomAmbience()` composable'ı `<head>` içindeki tema linkini `/themes/light.css` ile `/themes/dark.css` arasında değiştirir. Tema dosyaları yalnızca renk değişkenlerini override etmek için kullanılır; layout kuralları bundle CSS içinde tutulur.

**Lokalizasyon.** `useKardoorLocale()` TR/EN içerik geçişini yönetir. `lang` attribute'u `app.vue` tarafından `useHead` ile set edilir.

**Asset yönetimi.** `useKardoorAsset()` ImageKit CDN URL'leri ile local fallback'i çözer. Görsel referansları doğrudan path yerine bu composable üzerinden geçer.

## CSS Konvansiyonu

Tüm sayfa ve bölüm stilleri `nuxt/assets/styles/main.css` üzerinden import edilen ayrı dosyalarda yaşar:

- Bölüm/component stilleri → `sections/` veya `components/`
- Sayfa bazlı stiller → `pages/`
- Tema renkleri → `public/themes/`

Vue dosyalarında `<style>` bloğu kullanılmaz. Yeni bir sayfa veya bölüm eklerken stilini ilgili klasöre yaz ve `main.css`'e import et.

CSS scoped değildir; class isimleri sayfaya/bölüme özgü prefix taşımalıdır (`.company-timeline__*`, `.references-hero`, `.ada-team-*` gibi).

## Bağımlılıklar

- **Nuxt 4** — uygulama çatısı
- **Vue 3** — UI
- **GSAP + ScrollTrigger** — scroll-driven animasyonlar
- **@nuxt/image** — görsel optimizasyonu
- **Three.js** — `EntranceDoor` 3D sahnesi

## Lisans

Tüm hakları saklıdır — Ege Kardoor.
