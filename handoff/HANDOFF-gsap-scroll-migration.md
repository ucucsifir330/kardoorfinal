# Ege Kardoor — Scroll Motoru Göçü (Lenis → GSAP) Devir Notu

Yeni bir sohbet oturumunun kaldığı yerden devam edebilmesi için hazırlandı. Yeni sohbette ilk mesaj olarak bunu paylaş.

## Genel Bağlam
Ege Kardoor — premium/Awwwards seviyesi hedefli kurumsal+katalog sitesi (çelik, alüminyum, ahşap, PVC, cam kapı üreticisi). Stack: **Nuxt 3/4 + Vue 3 (TS) + GSAP**, WebGL yok. Monorepo, asıl uygulama `nuxt/` workspace'inde. Dev: `npm run dev` → http://localhost:3000.

> ÖNEMLİ DİZİN NOTU: Bağlı (mounted) klasör `kardoorfinal-dev` ama asıl proje **bir klasör içeride**: `kardoorfinal-dev/kardoorfinal-dev/nuxt/...`. Dosya yolları hep bu iç içe yapıyı kullanır.

## Bu Oturumun Konusu
Scroll'u baştan sona **Lenis'ten alıp GSAP'a** verdik. Hedef: smooth scroll + pin/scrub + **auto-settle** (kullanıcıdan kontrolü alıp bir noktadan diğerine biz götürme) hepsi tek motorda, GSAP ile. Referans: kullanıcının attığı resmi repo **greensock/gsap-skills** (ScrollTrigger, ScrollSmoother, Nuxt 4 SSR-safe örnek dahil).

GSAP 3.15.0 pakette ScrollSmoother/SplitText/Observer/Inertia hepsini içeriyor (GSAP artık tamamen ücretsiz, **lisans engeli yok**).

## Yapılanlar (dosya dosya)

1. **`nuxt/composables/useGSAP.ts`** (YENİ) — Tek noktadan plugin kaydı (SSR-safe, `import.meta.client` guard). `ScrollTrigger + ScrollSmoother + ScrollToPlugin` register eder. `registerGsap()` ve `useGSAP()` export'ları.

2. **`nuxt/plugins/scroll.client.ts`** (YENİ) — Eski Lenis plugin'inin yerine geçti. GSAP **ScrollSmoother** kurar:
   - `wrapper: "#smooth-wrapper"`, `content: "#smooth-content"`, `smooth: 1.2`, `effects: true`, `smoothTouch: 0`.
   - Touch cihazlarda native scroll (smoother kurulmaz), `is-touch-device` class'ı korunur.
   - `app:mounted`'ta smoother oluşturulur + `ScrollTrigger.refresh()`.
   - `page:finish`'te scroll top + refresh (route geçişleri için).
   - `provide: { smoother: () => ScrollSmoother.get() }` — yani **`$smoother` bir fonksiyon**, çağırınca canlı instance döner.
   - ⚠️ İçinde GEÇİCİ DEBUG var: `window.__sm/__gsap/__ST`. Doğrulama bitince **kaldırılacak**.

3. **`nuxt/app.vue`** — İçerik **ScrollSmoother wrapper'ına** alındı:
   ```
   <div class="app-shell">
     <WelcomeScreen/> <LoadingScreen/> <SiteHeader/> <FloatingContactHub/> <SmoothCursor/>  <!-- fixed, dışarıda -->
     <div id="smooth-wrapper"><div id="smooth-content">
       <main><NuxtPage/></main>
       <HomeFooter/>
     </div></div>
   </div>
   ```
   Sebep: ScrollSmoother `#smooth-content`'i `transform` ile sürer; `transform`'lu ata containing-block yarattığı için **içerideki `position:fixed` bozulur**. O yüzden tüm fixed overlay'ler wrapper DIŞINDA.

4. **`nuxt/plugins/lenis.client.ts`** — No-op'a çevrildi (sandbox mount'tan silemediği için). Phase 2'de bu dosya ve `package.json`'daki `lenis` bağımlılığı **silinecek**.

5. **`nuxt/components/home/EntranceDoor.vue`** — Asıl iş. Anasayfa "portal" auto-settle'ı GSAP'a kuruldu:
   - `$lenis` yerine `$smoother` alınıyor (`const { $lenis, $smoother } = useNuxtApp()`). Eski Lenis snap motoru (`snapToProgress`, `scheduleIdleSnap`, `lockTurntableDoor`, `requestDoorStep/Select`) **hâlâ duruyor ama inert** (lenis undefined → `if(!lenis) return`). Turntable kapı-kapı snap'i şu an devre dışı; Phase 2'de GSAP'a taşınacak.
   - YENİ **Portal Grab** bloğu (trigger'dan hemen önce): kapı ~%65 açıldığında ve kullanıcı AŞAĞI scroll'larken kontrolü alıp **showroom'a (p=0.68)** ipeksi glide; YUKARI scroll'da seni **aldığı yere (kapı noktası)** geri götürür. Glide ortasında ters wheel → yön değiştirir (tünelde asılı kalmaz).
   - `onUpdate` içine `maybePortalGrab(self.progress, progressDelta)` eklendi. Teardown'a `portalTween.kill()` + wheel listener temizliği eklendi.

### EntranceDoor master progress haritası (pinli alan ≈ 8.5×viewport)
- `0 → 0.30` kapı açılıyor (sprite, SEQ_END=0.30). **Kapı %65 ≈ p 0.195** (portal tetik noktası).
- `0.25 → 0.68` doorway'e zoom (1×→17×) = portal içine çekiş.
- `0.36 → 0.68` showroom portalın içinden büyüyerek beliriyor.
- `p = 0.68` = TURNTABLE_START = **showroom'a varış**.
- `0.68 → 0.86` turntable döner (5 DOOR_SNAP_POINTS).
- `0.865 → 0.985` showroom yatay slide.

### Ayarlanabilir sabitler (Portal Grab — EntranceDoor.vue)
- `DOOR_ENTER_RATIO = 0.65` → kapı açıklık eşiği (× SEQ_END = tetik progress'i).
- `PORTAL_TARGET_PROGRESS = TURNTABLE_START` → varış (showroom).
- `PORTAL_DURATION = 2.6` → glide süresi (saniye). Kullanıcı "ipeksi/ağır" istedi; gerekirse 3.0–3.5'e çıkar.
- `PORTAL_EASE = "power2.inOut"` → istenirse `sine.inOut` (daha yumuşak).
- `PORTAL_INTENT = 0.0006` → gerçek scroll niyeti eşiği.

## Mevcut Durum
- Foundation ÇALIŞIYOR: ScrollSmoother init oluyor (smooth:1.2), pin/scrub sağlam (pin-spacer ~12075px, content ~23240px), `sm.scrollTo()` content'i gerçekten ötelendi. Konsol/derleme hatası yok.
- Portal grab + ters çekiş kodu yazıldı, kullanıcı fiziksel ekranda 2.6s versiyonu onayladı ("burası okey").
- Kullanıcının son geri bildirimi: hız ve ters çekiş iyi.

## KRİTİK Test Tuzağı (zaman kazandırır)
Claude in Chrome ile sekmeye gidip JS ile ölçüm yaparken **sekme arka planda kalıyor** (`document.visibilityState: "hidden"`), tarayıcı **`requestAnimationFrame`'i donduruyor**. Sonuç: WelcomeScreen enter'da takılıyor, `HomeContentLoader.shouldRender` (rAF ile açılır) false kalıyor → **EntranceDoor hiç mount olmuyor** → sayfa kısa (3536px), ScrollTrigger 0. Bu **gerçek bug DEĞİL**, sadece arka-plan artefaktı. rAF-bağımlı her şey (GSAP ticker, ScrollSmoother smoothing, Vue transition, portal glide) sekme önde olmadan doğrulanamaz. **Auto-settle/scroll hissinin son onayı kullanıcının fiziksel ekranından alınmalı.** (Sandbox bash localhost'a erişemez.)

## Sıradaki Adımlar
1. **Debug temizliği:** `scroll.client.ts` içindeki `window.__sm/__gsap/__ST` kaldır.
2. **Turntable snap'i GSAP'a taşı:** EntranceDoor'daki inert Lenis snap motorunu (kapı-kapı `DOOR_SNAP_POINTS`, `requestDoorStep/Select` — ShowroomTurntable/UI bunları kullanır) `smoother.scrollTo` tabanlı GSAP glide ile yeniden yaz.
3. **Phase 2 yayılım:** `company.vue`'daki `$lenis.scrollTo` geçişlerini `$smoother`'a çevir; diğer ScrollTrigger sayfalarını (production, export, references, request-quote, contact) ScrollSmoother altında denetle.
4. **Modal/fixed teleport:** Sayfa içeriğindeki `position:fixed` modallar (product-modal, ada-modal, filter-panel, project-expansion-panel) ScrollSmoother transform'u yüzünden kayabilir → açıldıklarında `<Teleport to="body">` ile wrapper dışına al. Canlıda neyin bozulduğunu görerek düzelt.
5. **references.css 1px tel kontrolü:** ScrollSmoother content transform'u, önceki oturumda çözülen 21:9 sub-pixel 1px çizgisini geri getirebilir → references sayfasını fiziksel ekranda doğrula.
6. **Cleanup:** `lenis.client.ts` dosyasını ve `package.json`'daki `lenis` bağımlılığını sil.

## GSAP Skill (kalıcı /slash skill için)
Repo bir Claude Code **plugin marketplace**'i: `greensock/gsap-skills`. Kalıcı `/gsap-scrolltrigger` vb. slash skill olarak çıkması için kullanıcı **Settings → Capabilities → plugin marketplace ekle → `greensock/gsap-skills`** ile kurmalı (Claude oturumdan kuramıyor). İçerik referans olarak elde mevcut.

## Kullanıcı Tercihleri
Türkçe, samimi ("reis") ton. Premium/Awwwards seviye çıktı. Cerrahi (surgical) düzenleme — ilgisiz tasarım/davranışı bozma. Auto-settle noktalarında **önce kullanıcıya sor, beraber ayarla** ("nerede ne olacak" birlikte kararlaştırılır). Rakamları canlıda iteratif tune etmeyi seviyor.
