> **⚠️ ARŞİV — GÜNCEL DEĞİLDİR. Bu belgeye göre iş yapma.**
>
> Projeyi "Nuxt 3" olarak anlatıyor — gerçek sürüm **Nuxt 4.4.5**. Klasör yapısı da değişti (`nuxt/app/` altına taşındı).
>
> Güncel durum için: `docs/cleanup2-stabilizasyon.md`, `docs/cdp-css-tarama-raporu.md`, `AGENTS.md`.
> (Arşivlendi: 2026-07-22)

---

# Ege Kardoor — Proje Devir Notu (Handoff)

Bu dosya, yeni bir sohbet oturumunun projeyi sıfırdan tanıyıp kaldığı yerden devam edebilmesi için hazırlandı. Yeni sohbette ilk mesaj olarak bunu paylaş.

## Proje
Ege Kardoor — çelik, alüminyum, ahşap, PVC ve cam kapı üreticisi için premium, Awwwards seviyesi hedefleyen kurumsal/katalog web sitesi. Hedef kitle B2B (mimarlar, inşaat firmaları, bayiler) ve B2C (ev/işyeri sahipleri). Marka kimliği: geleneksel, sağlam, köklü; lüks ama ulaşılabilir; sessiz otorite. Detaylar `PRODUCT.md` ve `AGENTS.md` dosyalarında.

## Teknik Stack
- **Nuxt 3 + Vue 3** (TypeScript), **GSAP** (animasyon), CSS (scoped + global stylesheet'ler). WebGL yok.
- Monorepo: kök `package.json`, asıl uygulama `nuxt/` workspace'inde.
- Dev sunucu: `npm run dev` → **http://localhost:3000** (127.0.0.1 değil; tarayıcı araçları localhost ister).

## Önemli Dizinler/Dosyalar
- `nuxt/pages/` — sayfalar: `index`, `catalog` (+ alt kategoriler), `doors/[slug]`, `series/[slug]`, `company`, `production`, `references`, `contact`, `request-quote`, `export`.
- `nuxt/components/home/HomeFooter.vue` — paylaşımlı footer (tüm sayfalarda).
- `nuxt/assets/styles/sections/home-footer.css` — **footer'ın yetkili (authoritative) stil dosyası**. Footer'la ilgili çoğu kural burada, `!important` ile. `public/themes/light.css` ve `dark.css` ile çakışabilir; bu global dosya genelde sonradan yüklenip kazanır.
- `nuxt/public/themes/light.css` & `dark.css` — tema (gündüz/gece) kuralları, bolca `!important`.

## Tema Sistemi (DİKKAT)
- Gövde sınıfları: `.app-shell--day` (gündüz) / gece, ve sayfaya özel `.app-shell--references` gibi.
- Çok sayıda yakın krem tonu mevcut (`#f6f2e9`, `#f5f1e8`, `#faf7ef`, `#eee8db`, `#EAE8E8`, `#F4F1EA`). Yüzeyleri eşitlerken **tek tona** indirgemek gerekiyor.
- **Tuzak:** Global tema `html, body`'yi koyu (`#111417`) boyuyor. Açık temalı sayfalarda krem bölümlerin arkasında kalan koyu body, geniş (21:9) ekranlarda sub-pixel boşluktan 1px çizgi olarak sızabiliyor. Çözüm: `:has()` ile body/html'i sayfa rengine zorlamak.

## Referanslar Sayfası — Bu Oturumda Yapılanlar (`nuxt/pages/references.vue` + `home-footer.css`)
- Hero + panel + footer yüzeyleri tek krem **`#f6f2e9`**'a eşitlendi (gradient → düz renk; body/html dahil `:has()` ile zorlandı).
- Marquee kart kırpılması: `.marquee-wrapper` → `overflow-x: clip; overflow-y: visible`.
- Marka bandı ↔ footer arası boşluk açıldı (`.reference-brand-stage { margin-bottom }`).
- Footer dome kenarı kendi rengiyle mühürlendi.
- **En kritik ders:** `.ref-stack__panel` üzerindeki `will-change: transform` paneli kalıcı GPU katmanına terfi ettiriyordu; geniş ekranda panelin alt kenarı 1px yatay tel bırakıyordu. Kaldırıldı (GSAP animasyon sırasında kendi will-change'ini ekler).

## Footer — Bu Oturumda Yapılanlar
- `.footer-wordmark` ("EGE KARDOOR" akan bandı) `bottom: 27px` (E'lerin altı alttaki banda az miktarda girsin diye aşağı alındı).
- Büyük **K logosu** (`.footer-logo`, çapraz-köken PNG): dış `drop-shadow` yerine **SVG `SourceAlpha` tabanlı iç gölge filtresi** (`#kInnerShadow`, HomeFooter.vue içinde tanımlı) uygulandı — K footer'a oyulmuş/gömülmüş görünüyor. Premium/ince ayar: `feGaussianBlur stdDeviation=6`, `feOffset dy=4`, `feFlood flood-opacity=0.3`. Derinlik için bu üç değer oynatılır.

## Çalışma Yöntemi (işe yarayan akış)
- Kullanıcının tarayıcısı **Claude in Chrome** ile bağlı (Browser 1, Windows, 3440x1271 / 21:9, DPR 1). Canlı doğrulama için `localhost:3000`'e gidip JS ile computed style/geometri ölçmek, screenshot/zoom almak çok etkili oldu.
- **Uyarı:** Screenshot aracı 3440px genişliği ~1568px'e küçültüyor; 1px artefaktlar küçülmede kayboluyor. Sub-pixel sorunlarda son onay kullanıcının fiziksel ekranından alınmalı.
- Sandbox bash localhost'a ve bazı dış host'lara (ör. görsel CDN) erişemiyor. CORS nedeniyle çapraz-köken görsellerde canvas pixel okuma çalışmıyor.
- Stil çakışmalarında `!important` + özgüllük + yükleme sırası birlikte değerlendirilmeli; "yetkili" kuralın `home-footer.css` veya `public/themes/*` içinde olabileceği unutulmamalı.

## Kullanıcı Tercihleri
Türkçe, samimi ("reis") ton. Çıktılar premium/Awwwards seviyesi, düz şablon değil. Açıklamalar kısa ve net. Cerrahi (surgical) düzenlemeler: ilgisiz tasarım/davranışı bozma.

## Sıradaki Adım
Kullanıcı "çok büyük bir operasyona" geçileceğini belirtti — kapsam yeni sohbette netleşecek.
