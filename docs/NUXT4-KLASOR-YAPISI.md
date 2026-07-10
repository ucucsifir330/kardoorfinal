# Nuxt 4 Klasör Yapısı Geçişi (2026-07-06, branch: cleanup2)

Proje Nuxt 4.4.6'da zaten çalışıyordu ama klasörler Nuxt 3 düzenindeydi.
Bu geçişte uygulama kodu `nuxt/app/` altına taşındı. Taşıma `git mv` ile
yapıldı, dosya geçmişi korunuyor.

## Eski yapı (Nuxt 3 düzeni)

```
nuxt/
├── app.vue
├── assets/
│   └── styles/           # main.css + base/components/pages/sections
├── components/           # HomeCatalog.vue, SiteHeader.vue, ...
├── composables/          # useShowroomAmbience.ts, ...
├── data/                 # catalog.ts, products.ts, collections.ts, ...
├── pages/                # index.vue, catalog.vue, catalog/*, series/*, ...
├── plugins/              # scroll.client.ts
├── public/               # themes/light.css, themes/dark.css, statikler
├── server/               # api/, routes/, utils/
├── output/               # playwright çıktıları (Nuxt'a ait değil)
├── nuxt.config.ts
├── tsconfig.json
└── package.json
```

## Yeni yapı (Nuxt 4 düzeni)

```
nuxt/
├── app/                  # ← YENİ: tarayıcıya giden tüm uygulama kodu
│   ├── app.vue
│   ├── assets/
│   │   └── styles/
│   ├── components/
│   ├── composables/
│   ├── data/
│   ├── pages/
│   └── plugins/
├── public/               # yerinde kaldı — ham statik dosyalar (themes/ dahil)
├── server/               # yerinde kaldı — Nitro api/routes/utils
├── output/               # yerinde kaldı (playwright çıktıları)
├── nuxt.config.ts        # yerinde kaldı, İÇERİĞİ DEĞİŞMEDİ
├── tsconfig.json         # yerinde kaldı
└── package.json          # yerinde kaldı
```

## Ne değişti, ne değişmedi

- **Taşınanlar:** `app.vue`, `assets/`, `components/`, `composables/`,
  `data/`, `pages/`, `plugins/` → `app/` altına.
- **Yerinde kalanlar:** `server/`, `public/`, `nuxt.config.ts`,
  `tsconfig.json`, `package.json`, `output/`.
- **Alias'lar:** `~` (ve `@`) artık `nuxt/app/` klasörünü gösteriyor.
  Bu yüzden `~/components/...`, `~/data/...`, `~/assets/...` import'ları
  ELLE DEĞİŞTİRİLMEDEN çalışmaya devam etti. Proje köküne (nuxt/) erişmek
  için `~~` (veya `@@`) kullanılır.
- **Tek kod düzeltmesi:** `server/api/contact.post.ts` içindeki import
  `~/server/utils/contactEmail.js` → `~~/server/utils/contactEmail`
  yapıldı. (`~` app/'i göstermeye başlayınca Nitro boot'ta
  "Could not load .../app/server/utils/contactEmail.js" hatası veriyordu.)
- **URL'ler, route'lar, SEO, görünüm:** hiçbiri değişmedi. Doğrulama:
  dev server Nuxt 4.4.6 temiz boot; `/`, `/catalog`, `/company`,
  `/contact`, `/references` → 200, konsol hatasız; playwright ekran
  görüntüleriyle ana sayfa/katalog/iletişim görsel kontrol edildi.

## Kurallar (bundan sonrası için)

- Tarayıcıda çalışan her şey (`.vue`, composable, client plugin, CSS)
  → `app/` altına.
- Sunucuda çalışan her şey (API, Nitro util) → `server/` altına;
  app/ içinden `~~/server/...` diye import ETME (Nitro tarafı zaten
  server/utils'i auto-import eder), server içinden app/'e import etme.
- Ham servis edilecek statik dosya (tema CSS'leri, favicon, resim)
  → `public/` altına.
- İleride client+server ortak kod gerekirse Nuxt 4'ün `shared/` klasörü
  kullanılabilir (şu an yok; `data/` yalnızca app tarafında kullanıldığı
  için app/ altına taşındı).
