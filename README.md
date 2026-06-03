# Kardoor Digital Showroom

Ege Kardoor icin gelistirilen premium Nuxt 4 web deneyimi. Proje; 3D giris sahnesi, scroll odakli katalog akisi, kurumsal belgesel handoff'u, urun katalog sayfalari ve kurumsal icerik sayfalarini tek bir uygulamada toplar.

## Stack

- Nuxt 4
- Vue 3
- TypeScript
- GSAP + ScrollTrigger
- Lenis smooth scroll
- Three.js
- @nuxt/image

## Gereksinimler

- Node.js 20 veya uzeri
- npm 10 veya uzeri

## Kurulum

```bash
npm install
npm run dev
```

Dev sunucusu varsayilan olarak `http://localhost:3000` adresinde calisir. Bu repo npm workspace kullanir; root script'leri `nuxt/` uygulamasina delege eder.

## Komutlar

```bash
npm run dev         # Nuxt dev server
npm run build       # Production build
npm run generate    # Static output
npm run preview     # Build onizleme
npm run typecheck   # Nuxt typecheck
npm run check       # typecheck alias
```

## Proje Yapisi

```text
.
├── package.json                  # workspace script'leri
├── nuxt/                         # asil Nuxt uygulamasi
│   ├── app.vue                   # global shell, header, cursor, footer
│   ├── pages/                    # route dosyalari
│   ├── components/
│   │   ├── home/                 # ana sayfa deneyimi
│   │   ├── catalog/              # katalog alt gorunumleri
│   │   ├── doors/                # kapi secici ve detay UI
│   │   ├── layout/               # header/brand yapilari
│   │   └── ui/                   # paylasilan UI parcalari
│   ├── composables/              # tema, locale, asset ve katalog state'i
│   ├── data/                     # urun, seri ve koleksiyon verileri
│   ├── assets/styles/            # global CSS mimarisi
│   ├── public/                   # statik modeller, temalar, sprite ve gorseller
│   └── plugins/                  # client plugin'leri
├── scripts/                      # yardimci script'ler
└── handoff/                      # tasarim/dev handoff notlari
```

## Ana Deneyim

Ana sayfa `nuxt/components/home/HomeExperience.vue` ile orkestre edilir:

- `EntranceDoor.vue`: 3D giris ve ilk izlenim sahnesi.
- `HomeCatalog.vue`: scroll ritmine bagli koleksiyon/kapi katalog akisi.
- `HomeReferences.vue`: kurumsal belgesel bolumu ve video flip animasyonu.
- `HomeManifesto.vue`: marka manifestosu ve metin animasyonlari.
- `HomeReviews.vue`: yorumlar bolumu.

Katalog-belgesel gecisinde katalog arka planda sabitlenir, belgesel karti alttan yukari akar. Bu handoff davranisi `HomeExperience.vue` ve `assets/styles/sections/home-references.css` icinde izole tutulur.

## Route'lar

| Route | Aciklama |
| --- | --- |
| `/` | Ana showroom deneyimi |
| `/catalog` | Genel katalog |
| `/catalog/steel` | Celik kapi katalog gorunumu |
| `/catalog/technical` | Giris ve teknik seri katalog gorunumu |
| `/catalog/architectural` | Mimari ozel seri katalog gorunumu |
| `/catalog/aluminium` | Aluminyum seri katalog gorunumu |
| `/catalog/glass` | Cam seri katalog gorunumu |
| `/catalog/pvc` | PVC seri katalog gorunumu |
| `/catalog/wood` | Ahsap seri katalog gorunumu |
| `/doors` ve `/doors/[slug]` | Kapi secici ve detay sayfalari |
| `/series` ve `/series/[slug]` | Seri listesi ve seri detayi |
| `/company` | Kurumsal sayfa |
| `/references` | Referanslar |
| `/production` | Uretim sayfasi |
| `/export` | Ihracat sayfasi |
| `/contact` | Iletisim |
| `/request-quote` | Teklif talebi |

## Stil Mimarisi

Tum global stiller `nuxt/assets/styles/main.css` uzerinden import edilir.

- `base/`: token, reset ve transition kurallari.
- `components/`: header, button gibi paylasilan parcalar.
- `sections/`: ana sayfa ve bolum bazli stiller.
- `pages/`: route bazli stiller.
- `public/themes/`: `light.css` ve `dark.css` tema degiskenleri.

CSS scoped kullanimi minimumda tutulur. Yeni stillerde bolum prefix'i kullan:

```css
.home-references-flip__...
.catalog-...
.company-...
```

## Tema ve Dil

- Tema modu `useShowroomAmbience()` ile yonetilir.
- TR/EN dil state'i `useKardoorLocale()` icindedir.
- `app.vue`, aktif locale degerine gore `html lang` attribute'unu gunceller.
- Tema renkleri runtime'da `/themes/light.css` ve `/themes/dark.css` dosyalariyla degisir.

## Asset Notlari

- 3D model: `nuxt/public/models/kardoor.glb`
- Kapi sprite verisi: `nuxt/public/kardoor-door-sprite.webp` ve `.json`
- Tema dosyalari: `nuxt/public/themes/`
- Katalog preview: `nuxt/public/katalog-preview.html`
- Gorsel cozumleme: `useKardoorAsset()`

## Gelistirme Notlari

- Scroll animasyonlarinda GSAP/ScrollTrigger refresh akisini bozma; layout yuksekligi degisen bolumlerde refresh cagir.
- Katalog ve belgesel handoff'u yalnizca ilgili wrapper katmanlarinda tutulmali; urun karti veya katalog veri akisi bu davranisa baglanmamali.
- Reverse scroll davranisini test etmeden scroll-driven degisiklikleri merge etme.
- Header, footer ve global shell `app.vue` icinde oldugu icin sayfa component'lerinde tekrar render etme.
- Yeni route eklendiginde stil dosyasini `main.css` icine import et.

## Dogrulama

Commit oncesi en az su komutu calistir:

```bash
npm run typecheck
```

Gorsel/scroll degisikliklerinde `localhost:3000` uzerinden desktop ve mobil kirilimlari manuel kontrol et.

## Lisans

Tum haklari saklidir. Ege Kardoor icin hazirlanmis ozel web deneyimidir.
