# Son Commit Sonrası Unstaged Değişiklikler — Dosya Bazında Detaylı Döküm

> Tarih: 3 Ağustos 2026
>
> Karşılaştırma tabanı: `eb4dfa2 feat(ui): integrate navbar and showroom entrance`
>
> Kaynak: `git diff HEAD`

## Çalışma Ağacı Özeti

Bu doküman hazırlanırken son commit sonrasındaki kod farkı:

- 28 değiştirilmiş, takip edilen kod dosyası
- 828 eklenen satır
- 690 silinen satır
- Staged değişiklik yok
- Takip edilmeyen dosya yok

Bu not güncellendikten sonra `docs/lastchangescodexe.md` de unstaged olduğu için
çalışma ağacında toplam 29 değiştirilmiş takip edilen dosya görünür.

Git, yerel değişikliklerin hangi kullanıcı veya Codex oturumu tarafından
yazıldığını kanıtlamaz. Bu nedenle aşağıdaki belge, mevcut unstaged diff'in teknik
açıklamasıdır; tek tek satırların yazarı hakkında kesin kayıt değildir.

---

## 1. `nuxt/app/app.vue`

**Diff:** 5 ekleme, 1 silme

### Ne değişti?

- Nuxt importlarına `useState` eklendi.
- `kardoor-page-content-visible` adında global, boolean bir state oluşturuldu.
- Bu state'in başlangıç değeri references rotasında `true`, startup ekranı kullanan
  diğer rotalarda `false` olacak şekilde bağlandı.
- Sayfa geçişi başlamadan hemen önce state `false` yapılıyor.
- Transition overlay yeni sayfayı açtıktan sonra state `true` yapılıyor.
- İlk startup animasyonu tamamlandığında da state `true` yapılıyor.

### Kullanıcıya etkisi

Header, ana sayfa hero içeriği ve floating contact kontrolü artık page transition
perdesiyle eşzamanlı görünmüyor; perde açıldıktan sonra kendi reveal animasyonlarını
başlatabiliyor.

---

## 2. `nuxt/app/assets/styles/base/reset.css`

**Diff:** 3 ekleme

### Ne değişti?

- `button`, `input` ve `textarea` ortak reset kuralına `color: var(--text)` eklendi.
- Tarayıcının varsayılan saf siyah form kontrolü rengi yerine aktif tema metin
  rengi kullanılıyor.

### Kullanıcıya etkisi

Form kontrolleri özellikle açık temada sayfanın yeni ink paletiyle tutarlı görünüyor.

---

## 3. `nuxt/app/assets/styles/base/tokens.css`

**Diff:** 66 ekleme, 37 silme

### Ne değişti?

Yeni açık tema paleti merkezi tokenlar olarak eklendi:

- Brand tonları: `--brand-100`, `--brand-200`, `--brand-300`, `--brand-500`,
  `--brand-700`, `--brand-800`, `--brand-900`
- Açık yüzeyler: `--paper`, `--surface`, `--surface-2`, `--hairline`
- Metinler: `--ink`, `--ink-soft`, `--ink-body`
- Koyu editoryal yüzey: `--slab`, `--slab-fg`, `--slab-soft`, `--slab-line`

Gündüz tema eşlemelerinde:

- `--bg`, `--panel`, `--line`, `--text`, `--muted` ve `--soft` yeni tokenlara
  bağlandı.
- Açık zemindeki ana vurgu `--brand-700`, primary CTA vurgusu `--brand-500`
  olacak şekilde `--accent` ve `--accent-soft` güncellendi.
- Ambience ve header marka metni açık tema tokenlarına geçirildi.
- Katalog yüzeyleri paper tonuna, metinler ink tonlarına, structural line brand
  700'e bağlandı.
- Eski amber katalog ilerleme rengi kaldırıldı.
- Artık kullanılmayan katalog wishlist paneli ve wishlist butonu tokenları hem
  day hem night bloklarından silindi.

### Kullanıcıya etkisi

Açık tema tek bir sıcak mineral yüzey ve mor-mavi brand ailesinden besleniyor.
Sayfalar arasında farklı hardcoded gri, beyaz, siyah ve amber tonların görünme
ihtimali azaltılıyor.

### Risk notu

Bu dosya global token kaynağı olduğu için değişiklik yalnız tek bir componenti
değil, bu değişkenleri kullanan tüm sayfaları etkileyebilir.

---

## 4. `nuxt/app/assets/styles/components/buttons.css`

**Diff:** 6 ekleme, 5 silme

### Ne değişti?

- `.btn-primary` border ve arka planı `--brand-500`, metni `--brand-100` oldu.
- `.btn-secondary` dolu panel yüzeyinden şeffaf zemine geçirildi.
- Secondary butona `--hairline` border ve `--brand-700` metin rengi verildi.

### Kullanıcıya etkisi

Primary ve secondary aksiyon hiyerarşisi daha net: primary dolu brand yüzeyi,
secondary ise şeffaf ve ince kenarlı kontrol olarak okunuyor.

---

## 5. `nuxt/app/assets/styles/components/site-header.css`

**Diff:** 17 ekleme, 17 silme

### Ne değişti?

- Navbar'ın hardcoded siyah/beyaz renkleri slab tokenlarına bağlandı.
- Bar zemini `--slab`, metin `--slab-fg`, ikincil metin `--slab-soft` kullanıyor.
- Segment thumb ve aktif segment metni de slab ailesine taşındı.
- Navbar logosunun maksimum clamp değeri 90px'ten 80px'e indirildi.
- Metin aralığı, flare, alt radius, yatay/dikey padding ve grup gap değerleri
  hafifçe küçültüldü.
- Segment yüksekliği, navbar fontu ve tema/dil segment genişlikleri azaltıldı.

### Kullanıcıya etkisi

Desktop navbar daha kompakt ve kontrollü görünüyor; merkezin K damlası, linkler ve
tema/dil segmentleri daha az yatay alan tüketiyor.

---

## 6. `nuxt/app/assets/styles/pages/catalog-library.css`

**Diff:** 13 ekleme, 13 silme

### Ne değişti?

- Catalog library'nin yerel metin, muted metin, ana yüzey, güçlü yüzey, raised
  yüzey, hairline ve focus renkleri yeni global tokenlara bağlandı.
- Aynı token eşlemesi dock ve filter katmanlarına da uygulandı.

### Kullanıcıya etkisi

Katalog kütüphanesi ile ana sayfa katalog bölümü aynı açık tema renk sistemini
kullanıyor; dock ve filtre alanları ayrı bir gri/beyaz sistem gibi görünmüyor.

---

## 7. `nuxt/app/assets/styles/pages/company.css`

**Diff:** 17 ekleme, 17 silme

### Ne değişti?

- Koyu timeline üzerindeki beyaz metin ve işaretler `--slab-fg` tokenına taşındı.
- Gündüz timeline metni `--ink`, ikincil açıklama `--ink-body`, zayıf metin
  `--ink-soft` kullanıyor.
- Timeline track, aktif çizgi, yıl butonları, sayı ve deneyim metinleri tokenlara
  bağlandı.
- Mobil kartların alt border rengi `--hairline` oldu.

### Kullanıcıya etkisi

Company timeline hem açık hem koyu yüzeyde yeni paletle aynı kontrast hiyerarşisini
koruyor.

---

## 8. `nuxt/app/assets/styles/pages/contact.css`

**Diff:** 14 ekleme, 14 silme

### Ne değişti?

- Gündüz contact zemini `--paper`, ana metin `--ink`, açıklama `--ink-body`, zayıf
  metin `--ink-soft` oldu.
- Borderlar `--hairline` ve `--ink-soft` tokenlarına taşındı.
- Focus ve checkbox vurgusundaki kırmızı kaldırılıp `--brand-700` kullanıldı.
- Submit hover yüzeyi brand 700, metni brand 100 oldu.
- Sayfa gradient'i `--surface`, `--paper`, `--surface-2` ile yeniden eşlendi.
- Harita yüzeyi/inset rengi ve contact sayfasındaki footer zemini yeni tokenlara
  geçirildi.

### Kullanıcıya etkisi

İletişim formu site genelindeki açık tema ve brand rengiyle aynı dili kullanıyor;
eski kırmızı focus/check vurgusu artık görünmüyor.

---

## 9. `nuxt/app/assets/styles/sections/entrance-lab.css`

**Diff:** 41 ekleme, 22 silme

### Ne değişti?

- Gündüz entrance metinleri hardcoded lacivert yerine `--ink` kullanıyor.
- Konfigüratör içeriği `top` ile yukarı taşındı ve viewport'a bağlı kontrollü bir
  yüksekliğe alındı.
- İç düzen `space-between` kullanacak şekilde değişti; heading, copy ve CTA
  arasındaki dağılım yeniden kuruldu.
- Konfigüratör heading'i yaklaşık 68–126px aralığından 58–104px aralığına
  küçültüldü; line-height 1.04 oldu.
- Heading'in ikinci satırı `--accent` rengine geçirildi.
- Açıklama metni yaklaşık 23–30px'ten 19–22px'e küçültüldü; line-height 1.4 ve
  `text-wrap: pretty` eklendi.
- CTA grubunun eski büyük üst margin'i kaldırıldı; gap küçültüldü.
- Konfigüratör CTA yüksekliği, padding'i, ikon aralığı ve fontu küçültüldü.
- “Çok Yakında” hover rengi ortak accent tokenına bağlandı.
- Hero CTA satırının üst boşluğu artırıldı.
- Gündüz hero ana CTA'sı brand 700 zemin ve brand 100 metin kullanıyor.
- Yanındaki ok butonunun border, metin ve shadow tonları açık tema tokenlarına
  geçirildi.

### Kullanıcıya etkisi

Konfigüratör çağrı bölümü daha küçük, daha dengeli ve viewport içinde daha kontrollü
bir kompozisyona sahip. Hero CTA'ları içerikten biraz daha ayrık görünüyor.

---

## 10. `nuxt/app/assets/styles/sections/entrance-mobile.css`

**Diff:** 4 ekleme

### Ne değişti?

- Mobil konfigüratör heading'inin ikinci satırına `--accent` rengi eklendi.

### Kullanıcıya etkisi

Desktop'taki iki renkli konfigüratör başlık hiyerarşisi mobilde de korunuyor.

---

## 11. `nuxt/app/assets/styles/sections/home-catalog.css`

**Diff:** 68 ekleme, 114 silme

### Ne değişti?

Renk ve yüzey tarafında:

- Ana katalog zemini, kartlar, görsel yüzeyleri, metinler, yardımcı metinler,
  borderlar ve liquid menü yüzeyleri paper/surface/ink tokenlarına bağlandı.
- Hardcoded beyaz, lacivert ve gri fallback'lerin önemli kısmı kaldırıldı.

Desktop grid tarafında:

- Katalog başlığı büyütüldü.
- 1181px üstünde heading için daha büyük clamp ve 10px dikey offset eklendi.
- Beş sütunlu ürün grid'i 1800px yerine 1181px üstünde devreye giriyor.
- Sekizden sonraki katalog ürünleri de 1181px üstünde görünür oluyor.
- Satır maksimum genişliği 2080px ile sınırlandı.

Liquid menü tarafında:

- Hamburger çizgilerine transform ve opacity transition'ları eklendi.
- Hover veya expanded durumda üst/alt çizgi dönerek X oluşturuyor, orta çizgi
  küçülüp kayboluyor.
- Liquid menü ve action satırlarının border/metin renkleri tokenlara taşındı.

Wishlist kaldırma tarafında:

- Dark theme wishlist butonu, kalp, liked, active ve hover override'ları silindi.
- Safari scroll sırasında wishlist shadow/transition kapatan eski seçiciler silindi.
- Dosyada kalmış eksik `.catalog-like-wrap:hover` satırı kaldırıldı.

### Kullanıcıya etkisi

Katalog geniş desktop ekranları beklemeden beş sütuna çıkıyor. Liquid menü ikonu
hover'da daha açık şekilde X'e dönüşüyor. Ürün kartlarında wishlist kalbi/paneli
artık bulunmuyor.

---

## 12. `nuxt/app/assets/styles/sections/home-footer.css`

**Diff:** 69 ekleme, 66 silme

### Ne değişti?

- Footer dome zemini `--slab`, logo/metinler `--slab-fg`, iç yüzeyler
  `--slab-line` tokenlarına taşındı.
- Sosyal buton normal ve hover renkleri slab ailesine bağlandı.
- Flip link çizgisi ve iki yüzündeki metin rengi tokenlaştırıldı.
- Footer başlığı, lokasyon seçimi, radio kontrolü, form inputları, placeholder,
  submit butonu, bilgi kolonları, telefonlar ve çalışma saatleri slab tokenlarına
  geçirildi.
- Açık alt footer metinleri `--ink` ve `--ink-soft` kullanıyor.
- References rotasındaki footer wrapper `--brand-900`, dome ise `--slab` kullanıyor;
  iki koyu katman arasında derinlik korunuyor.
- Mobil footer border ve metin alpha değerleri slab-fg RGB ailesine uyarlandı.

### Kullanıcıya etkisi

Footer eski farklı gri/siyah değerler yerine tek koyu editoryal palette çalışıyor.
References sayfasında wrapper ile dome birbirine karışmadan iki ayrı koyu seviye
olarak okunuyor.

---

## 13. `nuxt/app/assets/styles/sections/home-references.css`

**Diff:** 20 ekleme, 8 silme

### Ne değişti?

- References bölüm zemini, ana metni, muted metni ve çizgileri slab tokenlarına
  bağlandı.
- Koyu zemin üzerindeki vurgu `--brand-300` oldu.
- Intro heading'in son satırına brand 300 rengi verildi.
- Sol marble ve sağ torus dekorlarının yatay konumu sabit viewport hesapları yerine
  ana içerik genişliğini dikkate alan `min()`/`calc()` formülleriyle değiştirildi.

### Kullanıcıya etkisi

Başlık vurgusu koyu zeminde daha okunaklı. Dekoratif objeler geniş ekranlarda ana
metne yaklaşmadan, içerik kolonuna göre daha kontrollü konumlanıyor.

---

## 14. `nuxt/app/assets/styles/sections/home-team.css`

**Diff:** 19 ekleme, 19 silme

### Ne değişti?

- Team/manifesto bölümünün koyu yüzeyi ve metinleri slab tokenlarına bağlandı.
- Manifesto CTA normal ve hover renkleri slab/ink tokenlarıyla eşlendi.
- Reveal karakterleri, büyük başlık ve marka logoları yeni metin tokenlarını
  kullanıyor.
- Gündüz team zemini paper, metinleri ink, ikincil metinleri ink-soft oldu.

### Kullanıcıya etkisi

Manifesto/team alanı açık ve koyu tema arasında ayrı hardcoded renkler yerine ortak
palette geçiyor.

---

## 15. `nuxt/app/assets/styles/sections/showroom.css`

**Diff:** 115 ekleme, 45 silme

### Ne değişti?

Gündüz showroom paleti:

- Arka plan, vignette, ana/ikincil/zayıf metin ve çizgiler yeni açık tema tokenlarına
  geçirildi.

Sahne:

- Stage'in iki kenarına pseudo-element gradient maskeleri eklendi.
- Bu maskeler, orbitte kenarda kalan komşu kapıların viewport sınırında sert
  kesilmesini yumuşatıyor.
- Mobilde maske genişliği 24px'e indiriliyor.

Bilgi paneli:

- Panelin dikey gap'i küçültüldü ve maksimum genişliği 410px oldu.
- Yeni `.showroom-lab__identity` ve `.showroom-lab__details` gruplarına ayrı width
  ve gap kuralları eklendi.
- Kapı adı 42–82px'ten yaklaşık 38–60px'e küçültüldü; letter-spacing sıkılaştırıldı,
  `text-wrap: balance` eklendi.
- Adın ilk satırına nowrap, vurgu satırına accent rengi verildi.
- Teknik açıklama ve metadata genişlik/font/line-height değerleri küçültüldü.

CTA ve navigasyon:

- Aksiyonlar flex yerine iki eşit sütunlu grid oldu.
- Her CTA panel sütununu tamamen dolduruyor ve ortak yüksekliğe sahip.
- Gündüz primary CTA brand 700/100 kullanıyor.
- Secondary CTA şeffaf/hairline görünümde; hover dolgusu brand 500.
- Alt door rail `margin-top: auto` ile panelin altına yaslandı.
- Counter, rail fill ve focus rengi ortak accent tokenına bağlandı.

### Kullanıcıya etkisi

Showroom bilgi paneli daha düzenli iki blok hâlinde okunuyor. İki CTA aynı genişlikte
duruyor, metinler kapı görselleriyle daha dengeli ölçekleniyor ve yan kapıların ekran
kenarında kesilmesi daha yumuşak görünüyor.

---

## 16. `nuxt/app/components/home/AdaCtaButton.vue`

**Diff:** 9 ekleme, 9 silme

### Ne değişti?

- Filled varyantın hardcoded koyu zemin, açık metin ve fill yüzeyi brand tokenlarına
  geçirildi.
- Normal filled CTA brand 500/100 kullanıyor; directional hover fill brand 700.
- Outline varyant metni brand 700, borderı hairline oldu.
- Outline hover metni brand 100, hover border/fill brand 700 kullanıyor.

### Kullanıcıya etkisi

Bu ortak CTA'yı kullanan hero, showroom ve diğer bölümlerde renkler yeni brand
sistemine uyuyor; directional hover davranışı korunuyor.

---

## 17. `nuxt/app/components/home/CatalogProductModal.vue`

**Diff:** 1 ekleme, 1 silme

### Ne değişti?

- Modal kapatma butonunun hover arka planı `white` yerine `var(--surface)` oldu.

### Kullanıcıya etkisi

Kapatma butonu açık temadaki sıcak yüzey rengiyle uyumlu görünüyor.

---

## 18. `nuxt/app/components/home/EntranceDoorLab.vue`

**Diff:** 73 ekleme, 4 silme

### Ne değişti?

- Hero heading, subtitle, CTA grubu ve scroll cue için dört ayrı template ref'i
  eklendi.
- `kardoor-page-content-visible` global state'i bu componentte okunuyor.
- Hero destekleyici içerikleri için GSAP hazırlama ve oynatma fonksiyonları eklendi.
- Başlangıç durumu `blur(20px)`, `opacity: 0`, `scale: 0.9`.
- Reveal animasyonu 1.5 saniye, `power2.out` ease ile normal duruma getiriyor.
- Animasyon yalnız bir kez oynuyor.
- `prefers-reduced-motion` durumunda animasyon atlanıp geçici stiller temizleniyor.
- Global visibility state `true` olduğunda reveal tetikleniyor.
- Component zaten görünür state ile mount olursa animasyon mount sırasında başlıyor.
- Teardown sırasında tween öldürülüyor ve inline filter/opacity/scale temizleniyor.
- Template'teki h1, subtitle, CTA row ve scroll cue yeni ref'lere bağlandı.

### Kullanıcıya etkisi

Page transition perdesi açıldıktan sonra hero metinleri, aksiyonlar ve scroll işareti
yumuşak blur/scale reveal ile birlikte görünür oluyor.

### Risk notu

Bu dosya GSAP, ScrollTrigger ve entrance scroll akışının yüksek riskli sahibidir.
Yeni tween doğrudan ScrollTrigger mimarisini değiştirmiyor ancak aynı componentte
ek bir görsel animasyon yaşam döngüsü oluşturuyor.

---

## 19. `nuxt/app/components/home/HomeCatalog.vue`

**Diff:** 64 ekleme, 189 silme

### Ne değişti?

Wishlist kaldırma:

- Ürün kartı görselinin üzerindeki kalp butonu tamamen kaldırıldı.
- Hover/click ile açılan wishlist paneli ve üç panel aksiyonu kaldırıldı.
- Wishlist aria etiketleri ve “listelerim/yeni liste” TR/EN metinleri silindi.
- `activeWishlistKey` ve `handleWishlistClick` composable destructure'ından çıkarıldı.
- Dosya sonundaki wishlist Tailwind class sabitleri ve scoped parent-state CSS'i
  kaldırıldı.
- Modal componentine gönderilen `toggleLike` korunuyor; ürün modalındaki favori
  davranışı bu diffte kaldırılmadı.

Liquid menü davranışı:

- `liquidIconHoverSuppressed` state'i eklendi.
- Hover başladığında suppression temizleniyor.
- Pointer satırdan çıktığında suppression sıfırlanıyor.
- Menü açıldığında aktif card ve ikon state'i normal şekilde korunuyor.
- Menü kapanınca imleç hâlâ kontrol üzerindeyse ikon hemen tekrar X olmuyor;
  çizgilere dönüyor ve ancak pointer çıkıp yeniden girdiğinde X oluyor.
- Satıra `is-liquid-icon-hovered` class koşulu eklendi.

Renk:

- Structural SVG line fallback rengi eski koyu değerden brand 700 hex karşılığına
  geçirildi.

### Kullanıcıya etkisi

Ana sayfa ürün kartları daha sade; kart üzerinde favori kalbi ve wishlist popup'ı
yok. Liquid menü ikonu açma/kapatma sonrası daha anlaşılır bir çizgi/X durumu
gösteriyor.

---

## 20. `nuxt/app/components/home/HomeReviews.vue`

**Diff:** 9 ekleme, 9 silme

### Ne değişti?

- Ana başlık metni `--ink` oldu.
- Rotating pill zemini `--brand-700`, iç metin ve cursor `--brand-100` oldu.
- Pill shadow'un mavi tonu yeni brand rengine uyarlandı.
- Review kart zemini `--surface`, borderı `--hairline` oldu.
- Hover borderı brand 700'e geçirildi; açık glow sıcak surface RGB tonuyla eşlendi.
- Author divider hairline, rating rengi brand 700 oldu.

### Kullanıcıya etkisi

Yorumlar bölümü açık tema paletiyle uyumlu; eski parlak mavi pill ve sarı yıldız
rengi yerine aynı brand ailesi kullanılıyor.

---

## 21. `nuxt/app/components/home/ShowroomLab.vue`

**Diff:** 13 ekleme, 8 silme

### Ne değişti?

- Kapı adı ve seri bilgisi `.showroom-lab__identity` wrapper'ına alındı.
- Divider, teknik açıklama ve metadata `.showroom-lab__details` wrapper'ına alındı.
- CTA grubu bu iki bilgi bloğunun altında bağımsız bırakıldı.

### Kullanıcıya etkisi

CSS artık showroom başlık/seri grubu ile teknik detay grubuna ayrı ölçü ve boşluk
verebiliyor; bilgi hiyerarşisi daha kontrollü kuruluyor.

---

## 22. `nuxt/app/components/layout/SiteHeader.vue`

**Diff:** 63 ekleme, 2 silme

### Ne değişti?

- `useState` import edildi ve `kardoor-page-content-visible` state'i okunuyor.
- Navbar bar elementi için `navBarRevealRef` eklendi.
- Navbar reveal'i için ayrı GSAP tween, prepared ve played state'leri eklendi.
- Navbar başlangıçta `blur(20px)`, `opacity: 0`, `scale: 0.9` durumuna hazırlanıyor.
- Global content state görünür olduğunda 1.5 saniyelik `power2.out` animasyon oynuyor.
- Reduced-motion kullanıcısında animasyon uygulanmıyor.
- Component mount olurken mevcut visibility değerine göre reveal başlatılıyor.
- State değişimi watch ile izleniyor.
- Unmount sırasında tween öldürülüyor ve inline stiller temizleniyor.
- Template'teki `<nav>` elementi yeni reveal ref'ine bağlandı.

### Kullanıcıya etkisi

Navbar transition overlay'in altında önceden görünmek yerine sayfa açıldıktan sonra
blur/scale reveal ile geliyor.

### Risk notu

Mevcut mobil menü GSAP timeline'ı korunuyor; yeni reveal tween'i bundan ayrı ancak
aynı navbar elementinin yaşam döngüsünde çalışıyor.

---

## 23. `nuxt/app/components/ui/BrandMark.vue`

**Diff:** 1 ekleme, 1 silme

### Ne değişti?

- Marka işaretinin hardcoded mavi rengi `--brand-500` tokenına geçirildi.

### Kullanıcıya etkisi

BrandMark yeni global brand paletiyle senkron çalışıyor.

---

## 24. `nuxt/app/components/ui/FloatingContactHub.vue`

**Diff:** 86 ekleme, 25 silme

### Ne değişti?

Reveal animasyonu:

- GSAP ve `useState` import edildi.
- Floating trigger için `triggerRevealRef` eklendi.
- Global `kardoor-page-content-visible` state'i okunuyor.
- Ana sayfada trigger başlangıçta blur/opacity/scale ile hazırlanıyor.
- State görünür olduğunda 1.5 saniyelik `power2.out` reveal oynuyor.
- Animasyon yalnız home rotasında ve yalnız bir kez oynuyor.
- Reduced-motion durumunda geçici stiller doğrudan temizleniyor.
- Route değişimi ve global visibility değişimi reveal akışıyla senkronize edildi.
- Unmount sırasında tween öldürülüp inline stiller temizleniyor.

Renk sistemi:

- Cam yüzey RGB değeri sıcak `surface` ailesine yaklaştırıldı.
- Ana/metin muted renkleri `--ink` ve `--ink-soft` oldu.
- Çizgi `--hairline`, mavi vurgu `--brand-500` kullanıyor.
- Trigger ikon gradient'i `--slab`, `--slab-line` ve brand rengine bağlandı.
- Action yüzeyleri sıcak açık RGB tonuna geçirildi.

### Kullanıcıya etkisi

Floating contact kontrolü hero ile birlikte yumuşak reveal oluyor ve açık temada
diğer yüzeylerle aynı sıcak mineral palette görünüyor.

---

## 25. `nuxt/app/components/ui/PageTransitionOverlay.vue`

**Diff:** 1 ekleme, 1 silme

### Ne değişti?

- Gündüz page transition panel zemini hardcoded `#16101F` yerine `--slab` oldu.

### Kullanıcıya etkisi

Geçiş perdesi footer/references gibi koyu editoryal yüzeylerle aynı tokenı kullanıyor.

---

## 26. `nuxt/app/composables/useHomeCatalog.ts`

**Diff:** 20 silme

### Ne değişti?

- Mobil katalog viewport kontrol fonksiyonu silindi.
- `activeWishlistKey` state'i kaldırıldı.
- `handleWishlistClick` fonksiyonu kaldırıldı.
- Modal açılırken wishlist panelini kapatan state sıfırlaması silindi.
- Catalog state reset fonksiyonundaki wishlist temizliği kaldırıldı.
- Composable return değerlerinden `activeWishlistKey` ve `handleWishlistClick`
  çıkarıldı.
- Ürünlerin `liked` alanı ve genel `toggleLike` fonksiyonu korunuyor.

### Kullanıcıya etkisi

Kart üstü wishlist paneli için artık state tutulmuyor. Modalın mevcut like/favorite
mekanizması çalışmaya devam edebilecek yapıda bırakılıyor.

---

## 27. `nuxt/public/themes/dark.css`

**Diff:** 6 silme

### Ne değişti?

- Dark tema altındaki wishlist panel background, border, shadow, normal metin,
  hover metin ve hover background değişkenleri kaldırıldı.

### Kullanıcıya etkisi

Kart wishlist arayüzü kaldırıldığı için artık kullanılmayan dark tema değişkenleri
yüklenmiyor.

### Risk notu

Bu dosya aktif runtime tema override katmanıdır; diff yalnız kullanılmayan wishlist
değişkenlerini siliyor.

---

## 28. `nuxt/public/themes/light.css`

**Diff:** 31 ekleme, 37 silme

### Ne değişti?

- Light tema wishlist panel değişkenleri kaldırıldı.
- Reveal karakterleri, close icon zemini ve icon stroke'u slab/ink tokenlarına
  geçirildi.
- Mobil footer wrapper, dome, submit butonu, kicker ve lokasyon göstergesi yeni
  paper/slab tokenlarına bağlandı.
- Root altındaki katalog yüzey, metin, line ve progress değişkenleri tokens.css ile
  aynı paper/ink/brand eşlemesine geçirildi.
- `html`, `body`, app-shell ve day shell arka planı `--paper` oldu.
- Gradient mask paper RGB tonuna uyarlandı.
- Footer sosyal butonları `--slab-line` ve `--slab-fg` kullanıyor.

### Kullanıcıya etkisi

Light runtime override katmanı, yeni global açık tema tokenlarıyla aynı renkleri
kullanıyor; eski mineral palette kalan footer/reveal parçaları azaltılıyor.

### Risk notu

Bu dosya aktif runtime tema override katmanıdır. İçindeki `!important` kuralları
component-level stilleri ezebildiği için görsel doğrulama gerektirir.

---

## Çapraz-Dosya Bulguları

Bu bölüm tek bir dosyanın diff'inden görünmeyen, birden fazla dosya birlikte
okunduğunda ortaya çıkan tekrarları, riskleri ve kalan işleri kaydeder.

### 1. Aynı page-intro reveal deseni üç componentte tekrar ediyor

Aşağıdaki üç component yaklaşık aynı reveal yaşam döngüsünü kendi içinde tekrar
uyguluyor:

- `nuxt/app/components/layout/SiteHeader.vue`
- `nuxt/app/components/home/EntranceDoorLab.vue`
- `nuxt/app/components/ui/FloatingContactHub.vue`

Tekrarlanan parçalar:

- `prefersReducedMotion()` kontrolü
- `prepare*()` fonksiyonu
- `play*()` fonksiyonu
- `is*Prepared` ve `hasPlayed*` flag'leri
- Tween referansının tutulması ve `kill()` edilmesi
- `filter`, `opacity` ve transform temizliği
- `watch(isPageContentVisible)` bağlantısı
- Mount ve unmount yaşam döngüsü

Bu, üç ayrı özellikten çok aynı animasyon deseninin üç yerel kopyasıdır. İleride
animasyon süresi, ease, reduced-motion davranışı veya cleanup değişirse üç dosyanın
birlikte güncellenmesi gerekir.

Olası iyileştirme: `usePageIntroReveal(targets, { onlyWhen })` benzeri bir composable
ile ortak lifecycle ve cleanup tek yerde tutulabilir. Componentler yalnız hedef
getter'ını ve route/uygunluk koşulunu verir. Bu refactor mevcut diffte uygulanmadı.

### 2. `clearProps: "scale"` kalıcı transform bırakmıyor; aktif tween penceresi yine de önemli

İlk incelemede `clearProps: "filter,opacity,scale"` sonrasında inline transform'un
bir kısmının kalabileceği ve CSS transform'larını kalıcı biçimde ezebileceği riski
öne sürüldü. Yerel GSAP `CSSPlugin` kaynağı kontrol edildiğinde bu kalıcı risk
doğrulanmadı:

- `scale`, GSAP'in transform property kümesinde bulunuyor.
- `clearProps` transform ailesinden herhangi bir property gördüğünde
  `clearTransforms` işaretini açıyor.
- Tamamlanma anında inline `transform`, bağımsız `scale/rotate/translate` değerleri
  ve GSAP transform cache'i temizleniyor.

Bu nedenle `clearProps: "scale"` değerini yalnız `clearProps: "transform"` ile
değiştirmek cleanup sonucunu pratikte değiştirmiyor. Reveal tamamlandıktan sonra:

- Floating contact trigger'ın CSS hover lift'i tekrar devreye girer.
- Entrance cue'nun `translateX(-50%)` CSS kuralı tekrar sahipliği alır.

Ancak tween'in aktif olduğu yaklaşık 1.5 saniye boyunca GSAP inline transform'u
yönetir. Bu geçici pencerede:

- Floating contact hover transform'u reveal scale'i tarafından ezilebilir.
- Cue'nun CSS transform'u GSAP'in parse ettiği değere dönüşür; reveal sırasında
  resize olursa merkezleme geçici olarak ölçüm anındaki transform değerine bağlı
  kalabilir.

Bu geçici çakışmayı tamamen kaldırmak istenirse `clearProps` adını değiştirmekten
ziyade reveal'i layout/hover transform'unu taşımayan ayrı bir wrapper üzerinde
oynatmak daha güvenli olur. Hover ve resize ile görsel doğrulama yine gereklidir.

### 3. Entrance cue scroll opacity'si reveal boyunca ikinci plana düşüyor

`.entrance-lab__cue` normalde opacity değerini `--hero-cue-opacity` custom
property'sinden alıyor. Scroll akışı bu değişkeni güncelleyerek cue'yu söndürüyor.

Hero reveal tween'i aynı elemente doğrudan inline `opacity` yazdığı için ilk 1.5
saniye içinde kullanıcı scroll ederse custom property güncellense bile görünür
opacity GSAP tarafından yönetilmeye devam ediyor. Reveal bittiğinde inline opacity
temizleniyor ve scroll değişkeni yeniden etkili oluyor.

Bu kalıcı bir kırılma değil, kısa süreli iki animasyon sahibinin aynı CSS property
üzerinde çakışmasıdır. Cue reveal'i opacity kullanmadan yapmak veya cue'yu ayrı bir
wrapper üzerinden reveal etmek olası çözümlerdir.

### 4. Hero reveal hedefleri all-or-nothing toplanıyor

`EntranceDoorLab.vue` içindeki `getHeroSupportingTargets()` şu dört ref'in tamamı
varsa array döndürüyor:

- heading
- subtitle
- actions
- cue

Ref'lerden biri null ise fonksiyon boş array döndürüyor ve reveal sessizce hiç
çalışmıyor. Bugünkü template'te dört hedef de koşulsuz render edildiği için mevcut
durumda hata oluşmuyor. İleride hedeflerden biri `v-if`, lazy render veya farklı
responsive template arkasına taşınırsa diğer üç hedef de animasyonsuz kalabilir.

Daha dayanıklı yaklaşım, ref değerlerini array içinde filtreleyip mevcut hedefleri
animasyona almaktır.

### 5. Ortak `useState` initializer değerleri tutarlı değil

State sahibi ve tüketiciler aynı key için farklı initializer kullanıyor:

- `app.vue`: `() => isReferencesRoute.value`
- `SiteHeader.vue`: `() => true`
- `EntranceDoorLab.vue`: `() => true`
- `FloatingContactHub.vue`: `() => true`

Nuxt `useState` aynı key için ilk çalışan initializer'ı kullanır. Mevcut component
ağacında root `app.vue` önce çalıştığı için beklenen değer kazanıyor; ancak davranış
mount sırasına örtük olarak bağlı.

Tüketici default'larını yalnız `false` yapmak fail-closed davranışı sağlar fakat
references ilk yüklemesinde root açıkça `true` atamazsa içeriğin kapalı kalması gibi
başka bir edge case üretebilir. Daha güvenli çözüm, state oluşturma ve ilk route
değerini tek bir composable/root sahibi içinde merkezileştirmek; tüketicilerin
yalnız mevcut state'i okumasıdır.

### 6. Floating contact gizli rotalarda da reveal için hazırlanıyor

`FloatingContactHub.vue` root elementi `v-show="isHomeRoute"` kullandığı için
component `/company`, `/contact` veya `/catalog` rotalarında unmount olmaz; yalnız
CSS ile gizlenir.

`playPageIntro()` home kontrolü yapıyor fakat `preparePageIntro()` yapmıyor. Bu
nedenle gizli trigger home dışındaki rotalarda da `opacity: 0`, `blur(20px)` ve
`scale: 0.9` inline başlangıç değerlerini alabilir. Home'a dönüldüğünde play akışı
elementi toparladığı için mevcut kullanımda görünür kırılma oluşmuyor; yine de
prepare/play uygunluk koşulları asimetrik.

Composable'a geçilirse veya yerel kod korunursa `onlyWhen/isHomeRoute` koşulunun
prepare ve play aşamalarında aynı şekilde uygulanması daha niyetli olur.

### 7. Catalog modal içinde silinen wishlist'e ait yorum kalmış

`CatalogProductModal.vue` scoped style açıklamasında “Aynı tuzak wishlist'te de
vardı” ifadesi hâlâ bulunuyor. Çalışan kodu etkilemiyor fakat kart wishlist'i
kaldırıldığı için tarihsel/eskimiş bir yorum olarak kalmış durumda.

### 8. Tokenlaştırma tamamlanmış değil

`nuxt/app` altında aşağıdaki komutla yapılan kaba sayım:

```bash
rg -o --no-filename '#[0-9A-Fa-f]{3,8}\b' nuxt/app
```

şu sonucu veriyor:

- 326 hardcoded hex kullanımı
- Büyük/küçük harf normalize edildiğinde 95 benzersiz hex değer

Bu sayı yorumları, SVG/template değerlerini, bilinçli fallback'leri ve aynı rengin
tekrarlarını da içerir; dolayısıyla 326 doğrudan “326 hata” anlamına gelmez. Yine de
mevcut diff'in tokenlaştırmayı ilerlettiğini fakat tamamlamadığını gösteren kaba bir
kalan iş ölçüsüdür. Yeni bir token refactor'ı ayrı kapsam ve görsel doğrulama
gerektirir.

### 9. Header filter containing-block riski mevcut DOM yapısında gerçekleşmiyor

CSS `filter`, uygulandığı elementte containing block oluşturabilir ve içindeki
`position: fixed` çocukların viewport davranışını değiştirebilir. Reveal filter'ı
`.site-nav__bar` elementine uygulanıyor.

Mevcut template'te mobil menü katmanları:

- `.site-nav__scrim`
- `.site-nav__panel-wrap`

`<nav class="site-nav__bar">` elementinin çocuğu değil, onun bulunduğu shell'in
ardından gelen kardeşlerdir. Bu nedenle navbar reveal filter'ı mobil fixed panelin
containing block'unu değiştirmiyor. SiteHeader için bu spesifik risk mevcut DOM
yapısında gerçekleşmiyor.

---

## Bu Dokümantasyon Görevinde Değiştirilen Dosya

- `docs/lastchangescodexe.md`

Bu görev sırasında yukarıdaki 28 uygulama dosyasının hiçbirine yeni düzenleme
yapılmadı. Yalnızca mevcut diff okunup bu Markdown belgesi güncellendi.

## Doğrulama Durumu

- `git status --short`, kod diff stat'ı, numstat, staged ve untracked kontrolleri
  yeniden çalıştırıldı.
- Dokümantasyon dosyasına özel `git diff --check` çalıştırıldı ve hata vermedi.
- `npm run typecheck` yeniden çalıştırıldı; `nuxt typecheck` hata vermeden exit 0
  ile tamamlandı.
- Browser hover/resize doğrulaması çalıştırılmadı.
- Bu belge diff üzerinden okunan uygulama niyetini açıklar; görsel kabul testi veya
  runtime davranış garantisi değildir.
