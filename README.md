# Kardoor Digital Showroom

Ege Kardoor icin gelistirilen premium Nuxt 4 web deneyimi: sinematik giris
sahnesi, showroom kapi gezinmesi, koleksiyon katalogu ve kurumsal icerik
sayfalari tek uygulamada.

> Bu dosya 2026-08-14'te agac uzerinde dogrulanarak yeniden yazildi. Onceki
> surum Three.js'i stack'te sayiyordu (bagimlilik degil), var olmayan bes rota
> listeliyordu ve `app/` oncesi klasor yapisini anlatiyordu. Buradaki her yol ve
> komut o tarihte kontrol edildi. **Tasidiginiz bir dosya varsa README'yi ayni
> degisiklikte guncelleyin.**

## Stack

- Nuxt 4 · Vue 3 · TypeScript
- GSAP + ScrollTrigger + ScrollSmoother — Lenis kaldirildi
- motion-v — bolum bazli reveal/motion
- Tailwind v4 — kismi migrasyon, bkz. `docs/design/DESIGN.md` §11
- @nuxt/image

## Kurulum

```bash
npm install
npm run dev
```

Repo npm workspace kullanir; root script'leri `nuxt/` uygulamasina delege eder.
Node 20+, npm 10+.

## Komutlar

```bash
npm run dev           # dev server
npm run build         # production build
npm run generate      # static output
npm run preview       # build onizleme
npm run typecheck     # Nuxt typecheck
npm run lint:css      # stylelint (app/assets + public/themes)
npm run audit:runtime # Playwright + CDP, 390x844 ve 1440x1000, iki tema
npm run audit:repo    # statik depo denetimi
```

`audit:runtime` varsayilan olarak `:3000` ve 14 rota tarar; daraltmak icin
`AUDIT_BASE_URL` ve `AUDIT_ROUTES` kullanin:

```bash
AUDIT_BASE_URL=http://localhost:3001 AUDIT_ROUTES=/,/catalog npm run audit:runtime
```

## Proje Yapisi

```text
.
├── package.json                    # workspace script'leri
├── AGENTS.md                       # ajan calisma sozlesmesi
├── docs/design/DESIGN.md           # tasarim sozlesmesi
├── .claude/skills/                 # mobil is akisi (SKILL/VERIFY/LEDGER)
└── nuxt/
    ├── app/
    │   ├── app.vue                 # global startup + transition + NuxtLayout
    │   ├── layouts/default.vue     # chrome, smoother agaci, sayfa, footer
    │   ├── pages/                  # rota dosyalari
    │   ├── components/
    │   │   ├── home/               # ana sayfa deneyimi
    │   │   ├── catalog/            # koleksiyon gorunumleri
    │   │   ├── layout/             # header, footer, nav
    │   │   └── ui/                 # paylasilan UI parcalari
    │   ├── composables/            # 16 composable: tema, locale, katalog, giris
    │   ├── data/                   # urun, seri, koleksiyon, taksonomi
    │   └── assets/styles/          # global CSS mimarisi
    ├── public/                     # hero gorselleri, kapi sprite'lari, temalar
    ├── server/api/                 # iletisim formu ucu
    └── tests/audit/                # Playwright/CDP denetim script'leri
```

## Render Agaci

```text
app.vue (.app-shell)
├── PageTransitionOverlay
├── WelcomeScreen (yalniz ilk acilis)
└── NuxtLayout → layouts/default.vue (.site-layout)
    ├── SiteHeader          ⎫ smoother DISINDA:
    ├── ContactHub          ⎬ #smooth-content transform'u
    ├── SmoothCursor        ⎭ position: fixed'i bozar
    └── #smooth-wrapper › #smooth-content
        ├── main › NuxtPage
        └── SiteFooter      (her rotada)
```

Ana sayfa `app/components/home/HomeExperience.vue` ile kurulur — 101 satirlik
ince bir kompozisyon dugumu, runtime davranis alt bilesenlerde ve
composable'larda:

- `EntranceDoorLab.vue` — masaustu giris sahnesi
- `EntranceDoorMobile.vue` — dokunmatik giris (coarse pointer, <=1024px)
- `ShowroomLabMobile.vue` — mobil showroom
- `HomeCatalogTransition.vue` — katalog ↔ belgesel handoff sahibi
- `HomeCatalog.vue` · `HomeReferences.vue` · `HomeManifesto.vue` · `HomeReviews.vue`

## Rota'lar

| Route | Aciklama |
| --- | --- |
| `/` | Ana showroom deneyimi |
| `/catalog` | Koleksiyonlar |
| `/catalog/{steel,aluminium,glass,pvc,wood,architectural,technical}` | Seri sayfalari — **su an kirik**, hepsi `/catalog`'u basiyor |
| `/doors/[code]` | Kapi detay sayfasi |
| `/company` | Kurumsal |
| `/references` | Referanslar |
| `/contact` | Iletisim |

Katalog alt rotalari `pages/catalog.vue` parent olup icinde `<NuxtPage>`
bulunmadigi icin cocuk sayfalarini render edemiyor. Dosyalar (veri, SEO, CSS)
saglam; ya `pages/catalog/index.vue` yapisina gecilmeli ya da silinmeli.

## Stil Mimarisi

Tum global stiller `app/assets/styles/main.css` uzerinden import edilir.

- `base/` — token, reset, transition
- `components/` — header, footer, buton gibi paylasilan parcalar
- `sections/` — ana sayfa bolum stilleri
- `pages/` — rota bazli stiller
- `public/themes/` — `light.css` / `dark.css` runtime tema katmani

Scoped CSS minimumda tutulur; yeni stillerde bolum prefix'i kullanin
(`.home-references-flip__…`, `.catalog-…`, `.company-…`).

## Tema ve Dil

- Tema `useShowroomAmbience()` ile yonetilir. **`prefers-color-scheme` degil**:
  `localStorage` anahtari `kardoor-showroom-ambience`, degerler `day` / `night`,
  DOM'da `data-ambience`.
- TR/EN `useKardoorLocale()` icinde; `app.vue` `html lang`'i gunceller.

## Mobil

Mobil **ayri bir bilesen agaci** olarak gelistirilir — masaustunun dar hali
degil. Karar ve kurallar `docs/design/DESIGN.md` §12'de, is akisi
`.claude/skills/kardoor-mobile-workflow/` altinda.

Dokunmatik cihazlarda ScrollSmoother kapalidir (`app/plugins/scroll.client.ts`),
native scroll calisir.

## Gelistirme Notlari

- Scroll/GSAP: ScrollTrigger refresh akisini bozmayin; layout yuksekligi degisen
  bolumlerde refresh cagirin. Reverse scroll'u test etmeden scroll-driven
  degisiklik merge etmeyin.
- Header, footer ve chrome `layouts/default.vue` icinde — sayfa bileseninde
  tekrar render etmeyin.
- Yeni rota eklerken stil dosyasini `main.css` icine import edin.
- Mobil davranis iddiasi kaynak okuyarak dogrulanmaz; `VERIFY.md`'deki
  CDP tabanli yontem kullanilir.

## Dogrulama

```bash
npm run typecheck
```

Gorsel/scroll degisikliklerinde masaustu ve mobil kirilimlarini gercek cihaz
emulasyonuyla kontrol edin.

## Lisans

Tum haklari saklidir. Ege Kardoor icin hazirlanmis ozel web deneyimidir.
