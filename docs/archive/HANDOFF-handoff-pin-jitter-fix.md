> **⚠️ ARŞİV — GÜNCEL DEĞİLDİR. Bu belgeye göre iş yapma.**
>
> Projeyi `kardoorfinal-dev/kardoorfinal-dev/nuxt/` altında gösteriyor — böyle bir dizin YOK. Stack de "Nuxt 3" değil, **Nuxt 4.4.5**.
>
> Güncel durum için: `docs/cleanup2-stabilizasyon.md`, `docs/cdp-css-tarama-raporu.md`, `AGENTS.md`.
> (Arşivlendi: 2026-07-22)

---

# Ege Kardoor — Handoff Pin Jitter & Sub-pixel Tel Devir Notu (5. oturum sonu)

Yeni sohbette ilk mesaj olarak bunu paylaş.

## Genel Bağlam
Ege Kardoor — premium/Awwwards seviyesi kurumsal+katalog sitesi (çelik/alüminyum/ahşap/PVC/cam kapı). Stack: **Nuxt 3/4 + Vue 3 (TS) + GSAP** (ScrollSmoother + ScrollTrigger + ScrollToPlugin), WebGL yok. `npm run dev` → http://localhost:3000.
> DİZİN: bağlı klasör `kardoorfinal-dev` ama asıl proje bir içeride: `kardoorfinal-dev/kardoorfinal-dev/nuxt/...`.
Türkçe, samimi ("reis") ton. Cerrahi düzenleme; büyük değişikliği CANLI test etmeden bırakma; test fiziksel Chrome'dan (Claude in Chrome, Browser 1, Windows, 3440×1215). Sandbox bash localhost'a erişemez.

## Bu Oturumda Yapılanlar (hepsi CANLI doğrulandı + kullanıcı onayladı)

### 1. Flip stale-trigger fix — DOĞRULANDI (geçti)
- `HomeReferences.vue`'daki hedefli `flipScrollTrigger` + `ResizeObserver` refresh fix'i canlı test edildi.
- **Kök neden artık reprodüksiyon vermiyor:** `maxScroll` taze load'dan itibaren sabit **25122** — katalog yüksekliği baştan rezerve ediliyor, doc scroll'da büyümüyor, yani trigger pikselleri bayatlamıyor. Flip media intro'da 203 (küçük), scrub'da iki yönde de monoton (203↔1215), jank yok. ResizeObserver fix'i güvenlik ağı olarak duruyor (zararsız).

### 2. Katalog(07) → Manifesto handoff JITTER — FİX'LENDİ (asıl iş)
- Belirti: "07 Giriş & Teknik" pinli dururken alttan siyah "Sınırların nasıl çizildiğine tanık olun" kartı (`.home-references-flip`) yükselirken **takılma/titreme**.
- **Kök neden (canlı kanıtlandı):** `HomeExperience.vue`'daki JS sahte-pin (`updateCatalogHandoffPin`) native `scroll` event'inde `getBoundingClientRect` okuyup transform yazıyordu; ScrollSmoother ise içeriği kendi GSAP tick'inde sürüyor → desync → pinli katalog frame'i her frame **±20–45px titriyordu** (82 frame'de 57 yön değişimi).
- **Fix:** pin update'i native scroll yerine **`ScrollTrigger.create({ onUpdate, onRefresh })`** ile smoother'la AYNI tick'e bağlandı. Sonuç: **0px oynama, 0 yön değişimi, 177 engage frame kusursuz.**
- **Perf:** `frame.scrollHeight`'ın her frame reflow zorlaması kesildi → `catalogHandoffFrameHeight` cache'i (ResizeObserver tazeliyor). Median frame 7.3ms, 20ms üstü frame yok.

### 3. ⚠️ DENENİP GERİ ALINAN — Derinlik "recede" efekti (BİR DAHA scale KULLANMA)
- Kart yükselirken katalog frame'ine `scale(→0.96)` + `brightness(→0.82)` denendi.
- **Bozdu:** scale yatayda da küçülttüğü için katalog "**yanlardan daraldı**", full-width komşularla hizası bozuldu; brightness köşe radius'unu farklı tona soktu.
- **Tamamen geri alındı.** Frame artık `transform:none, filter:none`. Derinlik istenirse İLERİDE yatayı bozmayan yöntemle (üstüne ince gölge/karartı katmanı), ASLA frame'e `scale` ile değil.

### 4. Siyah kart radius köşelerinde 1px sub-pixel TEL — FİX'LENDİ
- Belirti: scroll'da `.home-references-flip` yuvarlatılmış üst köşelerinde 1px çizgi (ScrollSmoother kesirli transform + radius antialiasing dikişi). Notlardaki 21:9 sub-pixel sorununun akrabası.
- **Fix:** `home-references.css` → `.home-references-flip { box-shadow: 0 0 0 1px var(--references-bg); }` — arka plan rengi köşe eğrisini takip edip 1px taşarak dikişi mühürlüyor. Yanlar full-width (ekran dışı), alt siyaha bağlanıyor. Kullanıcı "gitti" dedi.

## Bu Oturumda Dokunulan Dosyalar (COMMIT'SİZ)
- `nuxt/components/home/HomeExperience.vue` — synced ScrollTrigger pin + `catalogHandoffFrameHeight` cache; native scroll listener söküldü; `onBeforeUnmount`'a trigger kill eklendi.
- `nuxt/assets/styles/sections/home-references.css` — `.home-references-flip`'e box-shadow tel mührü.

## Ölçüm Tuzakları (zaman kazandırır)
- **Sekme ÖNDE olmalı.** Arka planda (`visibilityState:"hidden"`) rAF donuyor → smoother lerp'i kilitleniyor, `window.scrollTo` ölçümleri timeout. Her ölçümden önce kullanıcıdan sekmeyi öne almasını iste.
- Scroll'u **ScrollSmoother** sürüyor: `window.scrollTo` anında zıplamaz, lerp'ler; native scrollY ile içerik transform'u farklı (pin bölgesinde EntranceDoor 8.5×vh ofset). Ölçümde `#smooth-content` matrix3d'den contentY oku.
- **ScrollTrigger cold-start ~2sn:** load'dan hemen sonra pin engage olmuyor; ölçümden önce bir nudge + warmup bekle.
- Handoff pin engage penceresi: scrollY **~16000→17500** (pinOff 0→1215). Flip intro: ~17500+.
- `$smoother` window'da global DEĞİL (modular import); debug handle yok. Ölçümü DOM transform'larından oku.

## Sıradaki İşler
1. **Bu oturumun fix'lerini commit'le** (kullanıcı henüz commit'lemedi).
2. **Codex migration diff review** — kullanıcı istedi ama HENÜZ YAPILMADI. `git status`'ta dev bir Lenis→GSAP göçü commit'siz duruyor (`app.vue`, `tokens.css`, bir sürü CSS/komponent; `lenis.client.ts` silinmiş; `scroll.client.ts` + `useGSAP.ts` eklenmiş). Detay: `handoff/HANDOFF-gsap-scroll-migration.md` ve `PROJECT_HANDOFF.md`.
3. Migration notunun bekleyen maddeleri: turntable snap'i GSAP'a taşı, Phase 2 yayılım (company/production/export/references/contact `$lenis`→`$smoother`), modal/fixed teleport, `lenis.client.ts` + `package.json` lenis bağımlılığı temizliği.

## Kullanıcı Tercihleri
Türkçe, samimi ("reis") ton. Premium/Awwwards, düz şablon değil. Cerrahi düzenleme. Auto-settle/his noktalarında önce kullanıcıya sor, canlıda beraber tune et. Kısa-net açıklama.
