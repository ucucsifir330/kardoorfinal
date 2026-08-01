# Son Codex Değişiklikleri

> Tarih: 1 Ağustos 2026
>
> Kaynak: `cleanup2` çalışma ağacındaki commit kapsamı
>
> Kapsam: 17 takip edilen dosyada değişiklik ve 1 yeni Vue bileşeni; bu not dosyası sayıya dahil değildir

## Kısa Özet

Mevcut değişiklik seti üç ana işi kapsıyor:

1. Deneysel navbar tasarımının gerçek `SiteHeader` yapısına taşınması ve eski navbar lab dosyalarının kaldırılması.
2. Ana sayfa girişinde kapının arkasında showroom'un ilk kareden itibaren görünmesi; zoom sırasında derinlik/parallax hissinin eklenmesi.
3. Showroom kapılarının ölçü, taban hizası ve yan kapı görünürlüğünün daha tutarlı hâle getirilmesi.

Bunlara ek olarak tema geçişi performansı, header token sahipliği, sayfa özelindeki eski aktif-link override'ları ve browser audit seçicisi güncellendi.

Takip edilen dosyalardaki diff toplamı:

- 17 takip edilen dosya
- 1.634 eklenen satır
- 1.935 silinen satır
- 2 silinen dosya
- 1 yeni, takip edilmeyen Vue bileşeni

## 1. Navbar ve Header Yeniden Kurulumu

### `nuxt/app/components/layout/SiteHeader.vue`

Header'ın navbar bölümü kapsamlı biçimde yeniden kuruldu.

- Sol taraftaki `EGE KARDOOR` markası navbar'dan bağımsız bırakıldı ve scroll sırasında sabit kalmaya devam ediyor.
- Ortadaki navbar, üst kenara yapışan koyu bir çubuk ve merkezinden aşağı sarkan dairesel K logosu yapısına geçirildi.
- Eski `/doors` ve pasif “Ürünler” bağlantısı yerine aktif `/catalog` “Koleksiyonlar / Collections” bağlantısı eklendi.
- Navigasyon etiketleri TR ve EN değerlerini birlikte taşıyor. Görünmeyen ölçüm katmanı sayesinde dil değişiminde navbar genişliği ve merkez logosu kaymıyor.
- Aktif ve hover link durumu, metnin altında soldan açılan ince çizgiyle gösteriliyor.
- `1120px` altında ana linkler açılır panele taşınıyor ve çubukta “Menü” düğmesi gösteriliyor.
- `880px` altında tema/dil kontrolleri de panel içine taşınıyor; üst çubuk daha yalın hâle geliyor.
- `680px` altında navbar tam genişliğe geçiyor ve soldaki ayrı marka gizleniyor.
- Merkez K logosu masaüstünde ana sayfa bağlantısı, dar ekranda ise menü açma/kapatma kontrolü olarak çalışıyor.
- Menü paneli, K logosunun merkezinden büyüyüp küçülen GSAP animasyonuyla açılıp kapanıyor.
- Menü açıldığında ScrollSmoother varsa duraklatılıyor; yoksa native scroll `overflow` üzerinden kilitleniyor.
- Menü kapanırken odak tekrar logo kontrolüne taşınıyor; panel kapalıyken `inert` kullanılıyor.
- `Escape`, route değişimi ve desktop genişliğine geri dönüş menüyü güvenli biçimde kapatıyor.
- `prefers-reduced-motion` durumunda hareketli panel animasyonu atlanıyor.
- Aşağı scroll'da navbar gizleniyor, yukarı scroll'da geri geliyor; menü açıkken veya sayfanın üstündeyken gizlenmiyor.
- Panel açıkken body'ye teleport edilen marka kopyaları doğrudan `is-dimmed` sınıfıyla gizleniyor.

### `nuxt/app/components/layout/SiteNavControls.vue` — yeni dosya

Tema ve dil segmentleri `SiteHeader.vue` içinden ayrılarak tekrar kullanılabilir bir bileşene taşındı.

- Aynı bileşen hem masaüstü navbar grubunda hem açılır panelde kullanılıyor.
- `useShowroomAmbience` ve `useKardoorLocale` global state kullandığı için iki görünüm senkron kalıyor.
- Tema ve dil grupları için TR/EN erişilebilirlik etiketleri bulunuyor.
- Tema geçişi, tıklanan noktadan büyüyen dairesel View Transition animasyonuyla yapılıyor.
- View Transitions API desteklenmiyorsa veya azaltılmış hareket tercih ediliyorsa tema doğrudan değiştiriliyor.
- Tema animasyon süresi önceki 650 ms değerinden 520 ms'ye düşürülmüş durumda.

### `nuxt/app/assets/styles/components/site-header.css`

Eski glass/pill header CSS'i, yeni üretim navbar geometrisine göre baştan düzenlendi.

- Header marka değerleri ve navbar değerleri kendi sahiplik alanlarında toplandı.
- Yeni `.site-nav__*` sınıf sistemi eklendi.
- Koyu navbar çubuğu, alt köşe radius'ları, üst kenardaki concave flare'ler ve merkezdeki K damlası CSS ile oluşturuldu.
- Damla/oyuk geometrisi, logo ölçüsüne bağlı custom property hesaplarıyla responsive çalışıyor.
- Masaüstü, ara laptop, tablet ve telefon için ayrı davranış katmanları tanımlandı.
- Dil değişiminde yerleşim kaymasını engelleyen görünmez link ölçüm yapısı stillendi.
- Tema/dil kontrolleri için kayan aktif thumb yapısı eklendi.
- Açılır panel, scrim, panel linkleri ve menü ikonunun açık/kapalı durumları eklendi.
- Tam ekran scrim'den `backdrop-filter` kaldırıldı; kapalı durum `visibility:hidden` ile compositing dışına çıkarıldı.
- Navbar shell kendi compositing katmanına alındı; geniş gölgenin tema/sayfa/scroll geçişlerinde sürekli yeniden çizilmesi azaltıldı.
- Panel açıkken teleport marka katmanını gizlemek için `:has()` yerine doğrudan sınıf kullanıldı.
- Reduced-motion durumunda ilgili CSS transition'ları kapatıldı.

### `nuxt/app/assets/styles/base/tokens.css`

Header'a özel çok sayıdaki eski glass, link, kontrol, ölçü ve segment tokenı global token dosyasından kaldırıldı.

- `--header` sayfa üst boşluğu amacıyla globalde tutuldu.
- Marka metni ve gölgesi için kullanılan temel tokenlar korundu.
- Navbar ölçüleri ve görsel değişkenlerinin tek sahibi artık `site-header.css`.

### `nuxt/app/assets/styles/base/transitions.css`

Tema değiştirme sırasında View Transitions API'nin varsayılan tam ekran cross-fade'i kapatıldı.

- Eski ve yeni root snapshot'larında varsayılan animasyon kaldırıldı.
- Katmanların blend modu normale çekildi.
- Eski tema altta, yeni tema üstte sabitlenerek yalnızca dairesel `clip-path` animasyonunun çalışması sağlandı.
- Amaç, ağır sayfalarda iki tam ekran opacity ve clip-path animasyonunun aynı anda oluşturduğu takılmayı azaltmak.

### `nuxt/app/assets/styles/main.css`

Scroll sırasında efektleri geçici olarak azaltan global listeden header pseudo-element seçicileri çıkarıldı.

- `.site-header__bar::before`
- `.site-header__mobile-panel::before`

Bu eski sınıflar yeni navbar mimarisinde kullanılmıyor.

### Sayfa özelindeki eski header override'ları

Aşağıdaki dosyalardan eski header aktif-link gradient override'ları kaldırıldı:

- `nuxt/app/assets/styles/pages/contact.css`
- `nuxt/app/pages/references.vue`

Yeni navbar aktif durumu artık ortak `site-header.css` kurallarıyla yönetiliyor; contact ve references sayfaları header görünümünü ayrıca ezmiyor.

### Kaldırılan navbar lab dosyaları

- `nuxt/app/components/lab/NavLab.vue`
- `nuxt/app/pages/navbar-lab.vue`

Bu iki deneysel dosya silindi. Lab'da doğrulanan koyu çubuk, merkez damla, tema/dil segmentleri ve mobil panel yaklaşımı gerçek `SiteHeader` yapısına taşındığı için ayrı demo sayfası artık tutulmuyor.

## 2. Entrance / Kapıdan Showroom'a Geçiş

### `nuxt/app/components/home/EntranceDoorLab.vue`

Desktop giriş sahnesinde showroom artık sonradan fade-in olmuyor; ilk kareden itibaren hero'nun arkasında hazır duruyor.

- Hero kapı görselindeki şeffaf boşluktan düz siyah zemin yerine gerçek showroom görülüyor.
- Showroom, zoom ilerledikçe `1.14 → 1` ölçeğine iniyor; öndeki hero katmanının büyümesiyle birlikte derinlik/parallax etkisi oluşuyor.
- Showroom transform origin'i kapı boşluğunun merkezine bağlandı; zoom sırasında deliğin içindeki görüntünün kayması azaltıldı.
- Eski `showroomFadeRef` kaldırıldı ve yerine `showroomDepthRef` eklendi.
- Showroom baştan görünür olsa da eski eşik aşılana kadar `inert` ve `pointer-events:none` ile etkileşime kapalı tutuluyor.
- Kapı sprite'ı ilk kez yüklenme sonucuna ulaşana kadar showroom gizli tutuluyor; böylece boş canvas'ın şeffaf kapı deliğinden sahnenin erken sızması önleniyor.
- Sprite yüklemesi başarısız olsa bile `finally` ile showroom kilidi kaldırılıyor; sahne kalıcı olarak gizli kalmıyor.
- Kapıdan dışarıdan bakılan loş iç mekân hissi için ayrı bir dim overlay eklendi; zoom ilerledikçe opacity sıfıra iniyor.
- Maliyetli `filter: brightness()` yerine compositor dostu opacity katmanı kullanılıyor.
- Floating contact hub'ı kontrol eden aktif showroom eşiği korunuyor.
- Hero alt başlığının üst boşluğu desktop kurallarında 10 px artırıldı.

### `nuxt/app/assets/styles/sections/entrance-lab.css`

Vue tarafındaki yeni showroom derinliği için gerekli katman ve state stilleri eklendi.

- Showroom katmanı baştan görünür hâle getirildi.
- Eski opacity/visibility tabanlı showroom fade kuralları kaldırıldı.
- `--showroom-depth` ve kapı merkezinden gelen transform-origin kullanılmaya başlandı.
- `is-interactive` durumu ile pointer-event kontrolü eklendi.
- `is-revealed` durumu ile showroom görünürlüğü kapı sprite'ının ilk yüklenme sonucuna bağlandı.
- Koyu ve aydınlık ambience için ayrı dim overlay arka planları tanımlandı.
- Katman sırası ve açıklama blokları yeni geçiş mimarisine göre güncellendi.

### `nuxt/app/components/home/EntranceDoorMobile.vue`

Mobil giriş de desktop ile aynı “showroom kapının arkasında baştan hazır” yaklaşımına geçirildi.

- Showroom fade ve visibility eşiği kaldırıldı; sahne sürekli görünür.
- Mobilde showroom `1.12 → 1` ölçek parallax'ı kullanıyor.
- Transform origin kapı deliğinin merkezine bağlandı.
- Kullanıcı giriş aşamasını tamamlayana kadar showroom `inert` tutuluyor.
- Mobil kapı sprite'ı bir `Image` probe ile ön yükleniyor; yükleme tamamlanmadan showroom görünür yapılmıyor.
- Yükleme başarılı veya hatalı sonuçlandığında entrance yeniden render edilerek sahnenin kalıcı biçimde gizli kalması engelleniyor.

### `nuxt/app/assets/styles/sections/entrance-mobile.css`

Mobil showroom'un başlangıç görünürlüğü ile çalışma zamanı davranışının sahipliği netleştirildi.

- CSS'teki başlangıç `visibility` ve `opacity` değerlerinin yalnız JS devreye girene kadar geçerli olduğu belgelendi.
- Sabit `scale(1.06)` ve merkez transform-origin kuralları kaldırıldı; transform ve origin tamamen `EntranceDoorMobile.vue` içindeki ölçüm/render akışına bırakıldı.
- Böylece CSS ile inline mobil entrance değerlerinin birbirini ezmesi engellendi.

## 3. Showroom Kapı Yerleşimi

### `nuxt/app/components/home/ShowroomLab.vue`

Showroom orbitindeki yan kapıların viewport kenarındaki görünürlük oranı daha tutarlı hâle getirildi.

- Yan kapı ölçeği `0.72` ortak sabitine bağlandı.
- Hedef görünürlük oranı `%75` olarak tanımlandı; kapının yaklaşık `%25`i ekran kenarının dışında kalıyor.
- Sabit piksel ofset yerine viewport, stage genişliği, slot yüksekliği ve tahmini görünür kapı genişliğinden hesaplanan responsive ofset kullanılıyor.
- Her kapı slotuna `baselineShift` ve görsel URL'sinden üretilen alfa maskesi aktarılıyor.

### `nuxt/app/assets/styles/sections/showroom.css`

Kapı görsellerinin taban hizası ve arka plan tipografisiyle ilişkisi düzeltildi.

- Slot'un tamamına opacity uygulamak yerine opacity kapı görseli ve gölge seviyesinde yönetiliyor.
- Kapının alfa siluetini kullanan maskeli bir zemin katmanı eklendi; arkadaki büyük kayan yazı yalnızca ürün siluetinin altında kesiliyor.
- Kapı görseli shell içinde mutlak konumlandırıldı ve merkez-alt noktasına sabitlendi.
- `--door-baseline-shift` ile kaynak görsellerdeki farklı transparan alt boşlukları dengeleniyor.
- Kapı gölgesi slot opacity'sine bağlandı.

### `nuxt/app/composables/useShowroomDoors.ts`

Showroom kapı verisine `baselineShift` alanı eklendi.

Beş temsilci kapının ölçek ve taban kaydırma kalibrasyonları güncellendi:

| Seri | Görsel | fitScale | baselineShift |
|---|---:|---:|---:|
| Alüminyum Sistemler | 41 | 1.152 | 7.5 |
| Doğal Yüzeyler | 57 | 1 | -1.2 |
| Camlı Modeller | 17 | 1.055 | 1.6 |
| PVC Laminoks | 117 | 1.057 | 2.7 |
| Mimari Özel | 142 | 1.013 | 0.2 |

Amaç, görünür alfa yüksekliğini yaklaşık ortak `%92` seviyesine getirmek ve kapıların zemine aynı hizada basıyormuş gibi görünmesini sağlamak.

## 4. Runtime Browser Audit

### `nuxt/tests/audit/runtime-browser-audit.mjs`

Audit'in hover hedefi eski `.site-header__nav-link` sınıfından yeni `.site-nav__link` sınıfına geçirildi.

## Silinen, Değiştirilen ve Yeni Dosyaların Tam Listesi

### Değiştirilen

- `nuxt/app/assets/styles/base/tokens.css`
- `nuxt/app/assets/styles/base/transitions.css`
- `nuxt/app/assets/styles/components/site-header.css`
- `nuxt/app/assets/styles/main.css`
- `nuxt/app/assets/styles/pages/contact.css`
- `nuxt/app/assets/styles/sections/entrance-lab.css`
- `nuxt/app/assets/styles/sections/entrance-mobile.css`
- `nuxt/app/assets/styles/sections/entrance-mobile.css` *(bkz. Ek E6 — asıl not
  yazıldıktan sonra değişti)*
- `nuxt/app/assets/styles/sections/showroom.css`
- `nuxt/app/components/home/EntranceDoorLab.vue`
- `nuxt/app/components/home/EntranceDoorMobile.vue`
- `nuxt/app/components/home/ShowroomLab.vue`
- `nuxt/app/components/layout/SiteHeader.vue`
- `nuxt/app/composables/useShowroomDoors.ts`
- `nuxt/app/pages/references.vue`
- `nuxt/tests/audit/runtime-browser-audit.mjs`

### Silinen

- `nuxt/app/components/lab/NavLab.vue`
- `nuxt/app/pages/navbar-lab.vue`

### Yeni ve takip edilmeyen

- `nuxt/app/components/layout/SiteNavControls.vue`

## Doğrulama Durumu

Bu not hazırlanırken mevcut diff okunup dosya bazında özetlendi. Kod değişiklikleri yeniden çalıştırılmadı ve bu dokümantasyon görevi için typecheck/test yürütülmedi. Bu nedenle yukarıdaki maddeler uygulanan kodun açıklamasıdır; tarayıcıda görsel doğrulama veya test sonucu iddiası değildir.

---

# Ek: İnceleme Notları ve Sonradan Yapılan Düzeltmeler

> Bu bölüm, yukarıdaki notun yazılmasından sonra yapılan kod incelemesinde
> ortaya çıkan eksikleri, riskleri ve uygulanan düzeltmeleri içerir.

## E1. Doğrulama Durumu — Düzeltme

Yukarıdaki "typecheck/test yürütülmedi" ifadesi eksik. Doğrusu:

- `npm run build` bu ortamda **çalıştırılamıyor**. `node_modules` eksik kurulu
  (8 paket) ve mevcut kurulum macOS native binding'leri taşıyor; Linux sandbox
  bunları yükleyemiyor. Yani "çalıştırılmadı" değil, "çalıştırılamadı".
- `vue-tsc` sonucu bu nedenle **güvenilir değil**, geçti sayılmamalı.
- Sadece `stylelint`, `entrance-lab.css` ve `entrance-mobile.css` üzerinde
  temiz geçti.
- **Tarayıcı doğrulaması sıfırdır.** Aşağıdaki entrance/showroom davranışları
  gerçek cihazda hiç izlenmedi.

## E2. Entrance Bölümünde Adı Geçmeyen Değişiklikler

- Yeni sabit: `SHOWROOM_DEPTH = 0.14` (`EntranceDoorLab.vue`).
- Yeni custom property'ler: `--showroom-depth`, `--showroom-dim`.
- `SHOWROOM_START` ve `SHOWROOM_COVER` artık **yalnızca** body-class eşiği
  (FloatingContactHub'ın gizlenmesi) için kullanılıyor. Dosya başındaki faz
  haritasının anlamı bu yüzden değişti; showroom'un "0.273–0.56 arası fade-in"
  satırı artık geçerli değil.
- Sınıf adı değişti: `.entrance-lab__showroom.is-active` → `.is-interactive`.
  Dışarıdan eski seçiciyi arayan kod/test bulamaz.

## E3. Riskler (asıl notta hiç yok)

### Performans
Showroom artık `p=0`'dan itibaren boyanıyor (eskiden `opacity:0` +
`visibility:hidden`). İçindeki kapı görselleri `loading="lazy"`; katman baştan
görünür olduğu için daha erken decode edilecekler. **`/` sayfasının LCP'si
ölçülmeli** — bu değişikliğin tek gerçek maliyeti burası.

Ayrıca `.entrance-lab__showroom` (`will-change: transform`) ve dim overlay
(`will-change: opacity`) artık kalıcı olarak promote edilmiş iki tam-viewport
compositor katmanı. Kabul edilebilir, ama bedava değil.

### `inert` tarayıcı desteği
Safari 15.5+ / Firefox 112+ / Chrome 102+. Daha eski tarayıcıda geriye yalnızca
`pointer-events:none` kalır; **klavye odağı hero'nun arkasındaki gizli linklere
gidebilir.**

Ayrıca Vue `inert`'i boolean attribute olarak işlediği için `:inert="false"`
attribute'u tamamen kaldırır. Düz HTML'de `inert="false"` yine inert olurdu —
bu bilinçli bir varsayım, Vue'ya bağımlı.

## E4. Race Condition: Sprite Yüklenmeden Delikten Sahne Sızması — DÜZELTİLDİ

**En önemli bulgu.** Showroom'un baştan görünür olması bu hatayı ortaya çıkardı:

Kapı sprite'ı asenkron yükleniyor. O tamamlanana kadar:
- Masaüstünde `<canvas>` **boş** (`showProgress` `meta` yokken erken dönüyor),
- Mobilde `background-image` div'i **şeffaf**.

Hero'nun kapı deliği de şeffaf olduğu için, bu pencerede **kapı hiç çizilmeden
delikten showroom görünüyordu.** Masaüstü sprite'ı 917 KB; yavaş bağlantıda
belirgin bir sıçrama. Eskiden orada düz siyah vardı, bu yüzden fark edilmiyordu
— yani hata yeni değil, benim değişikliğim onu *görünür* yaptı.

Uygulanan düzeltme:
- `isDoorPainted` bayrağı eklendi (her iki bileşende).
- Masaüstü: `door.load(...).catch(...).finally(() => isDoorPainted = true)`.
  Showroom `.is-revealed` sınıfı gelene kadar `visibility: hidden`.
- Mobil: aynı URL ile `new Image()` ön-yüklemesi (CSS aynı URL'i cache'ten alır,
  ikinci indirme yok); `onload`/`onerror` ikisi de bayrağı açar.
  `watch(isDoorPainted, ...)` ile `renderEntrance` yeniden koşturuluyor.
- **`finally` / `onerror` bilinçli:** sprite 404 verirse showroom sonsuza dek
  kilitli kalmasın, sahne yine açılsın.

Yan fayda: `is-revealed` her zaman `placeDoor()`'dan sonra geldiği için
`--zoom-origin-*` o an kesin ölçülmüş oluyor. Bu da ikinci bir ilk-kare
sorununu kapatıyor (aşağıda).

## E5. Race Condition: İlk Karede Yanlış `transform-origin` — DÜZELTİLDİ

`.entrance-lab__showroom` ölçek merkezi olarak `--zoom-origin-*` kullanıyor, ama
bu değişkeni yalnızca `placeDoor()` yazıyor ve o `onMounted`'da çalışıyor. İlk
paint ile mount arasındaki pencerede fallback `50% 50%` geçerli oluyordu; kapı
deliği ise ~`%52 / %55`'te. Showroom baştan görünür olduğu için bu, delikten
görünen kesitte bir **sıçrama** demekti.

E4'teki `is-revealed` gecikmesi bunu da kapatıyor: showroom görünür olduğunda
`placeDoor()` kesinlikle çalışmış oluyor. Ayrı bir düzeltme gerekmedi.

## E6. Eski Kalıntı: `entrance-mobile.css` — DÜZELTİLDİ

`.entrance-mobile__showroom` hâlâ `transform: scale(1.06)` ve
`transform-origin: center` taşıyordu; oysa ikisini de JS her karede inline
eziyor. Masaüstü CSS'i bu geçişte temizlenmiş, mobil temizlenmemişti — yani
yeni davranış eski kuralların üzerine yamanmıştı ve CSS artık yanlış bilgi
veriyordu.

Bu iki satır kaldırıldı; `visibility`/`opacity` ise **bilinçli olarak** kaldı
(JS devreye girene kadarki doğru başlangıç durumu bu). Sahiplik açıklama
bloğuyla yazıldı.

`entrance-mobile.css` bu nedenle artık değişen dosyalar listesine **eklenmelidir**
— asıl notta yoktu, çünkü o an dosya gerçekten değişmemişti.

## E7. Düzeltilmeyen, Bilinen Sorun: `useDoorSprite.load()` Yarış Durumu

`nuxt/app/composables/useDoorSprite.ts` — **bu oturumda dokunulmadı, önceden
var olan bir sorun.** Kayıt için:

- `load()` içinde in-flight koruması veya iptal yok. Hızlı ardışık tema
  değişiminde iki `load()` yarışır; `meta`/`image`'ı **en son çözülen** atar.
  İki sprite farklı boyutta (917 KB / 769 KB) olduğu için hızlı çift geçişte
  yanlış temanın kapısı çizili kalabilir.
- `dispose()` sırasında uçuşta bir `load()` varsa, `dispose` `ctx`'i null
  yaptıktan sonra bekleyen `load` devam edip `meta`/`image`/`ready = true`
  atıyor — yani sökülmüş composable'ın state'ini diriltiyor.

Çözüm önerisi: `load()` başında artan bir `loadId` alıp `await`lerden sonra
"hâlâ güncel miyim" kontrolü yapmak (`EntranceDoorLab.vue` içindeki
`settleToProgress`/`activeSettleId` deseninin aynısı).

Not: tema geçişinde **flaş yok** — `drawNow` yalnızca yeni görsel çözüldükten
sonra çağrıldığı için canvas o ana kadar eski kareyi tutuyor. Sorun görsel
değil, state tutarlılığı.

## E8. Reddedilen Yaklaşım (tekrar denenmesin)

Kapı boşluğunun arkasına CSS gradient'leriyle sahte bir "iç mekân" katmanı
(`entrance-lab__portal` + ışık taşması) boyanmıştı; **kaldırıldı.** İstenen şey
uydurma derinlik değil, gerçek sayfanın delikten görünmesiydi. Portal yaklaşımı
hem konsepti karşılamıyordu hem de showroom'a geçişte ikinci bir cross-fade
beat'i yaratıyordu.
