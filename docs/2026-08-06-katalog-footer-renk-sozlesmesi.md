# Katalog production'a alındı + renkler tek sözleşmeye bağlandı

**Tarih:** 2026-08-06
**Commit:** `1db2164`
**Dal:** `palette-merge` → `origin/cleanup2` (fast-forward, `eb4dfa2..1db2164`)
**Kapsam:** 20 dosya, +5332 / −3665

---

## Neden

Kullanıcının bildirdiği dört somut şikâyet vardı:

1. Light modda footer'ın altı sayfa paletiyle uyuşmuyor, siyah görünüyor
2. Dark temada footer "patlamış", GSAP animasyonları oynamıyor
3. Footer'daki K logosu kutusundan taşıyor
4. Katalogda kapıların arkası zeminle aynı, kartlar kayboluyor

Talimat açıktı: **patch değil, kökten çözüm.** Eski/çürük bileşen çöpe atılacak.

---

## Teşhis — ölçülen, tahmin edilmeyen

Her bulgu Playwright + computed-style ile ölçüldü. ScrollSmoother aktif olduğu
için `window.scrollTo` çalışmıyor; ölçümler gerçek `mouse.wheel` olaylarıyla
yapıldı (ilk denemede bu atlanmıştı ve yanlış sonuç üretmişti).

### Footer renk kaosu

Renk kaynağı **6 dosyaya dağılmış 13 kuraldı**: `main.css`'in `!important`
bloğu, `public/themes/{light,dark}.css`, `references.vue`, `contact.css`,
`company.css`, `home-footer.css`.

| Ölçülen sorun | Değer |
|---|---|
| Gündüz zemin | 4 farklı beyaz: `#F2EEE6` / `#F6F2E9` / `#F1EDE5` / `#F8F6EF` |
| Gece kubbe | `#080B18` — zeminle **birebir aynı**, yani görünmez |
| Alt şerit | 8/8 senaryoda hardcoded `#FFFFFF`, tema tanımıyor |
| Logo taşması | Kutu `x=56`, logo `x=34.4` → 21.6px sola taşma |
| Mobil ≠ masaüstü | `dark.css` mobilde kubbeyi `#171D3D` yapmaya çalışıyor |

Kubbe için **6 ayrı gece rengi** yarışıyordu (`#080B18`, `#131937`, `#171D3D`,
`#0D122B→#131937` gradyan, `#16101F`, `#1A1533`). Kazanan tamamen dosya yükleme
sırasına ve `!important` sayısına bağlıydı.

### GSAP neden oynamıyordu

Footer elle `window.addEventListener("scroll")` + `IntersectionObserver`
kullanıyordu. Ama sayfa **ScrollSmoother** altında çalışıyor — scroll gerçek
kaydırma değil, `#smooth-content` üzerinde bir transform. İkisi de sinyal
vermiyordu.

Aynı tespit projenin kendi kodunda zaten yazılıydı
([HomeCatalog.vue:453](../nuxt/app/components/home/HomeCatalog.vue#L453)):
*"IO ScrollSmoother altında zaten TETİKLENMİYOR"*. Footer tek başına eski
yöntemde kalmıştı — "çürümüş bileşen" tam olarak buydu.

Ölçüldü: sayfa en dipteyken (`scrollY 20568 = maxScroll`) kubbe
`y=11.3px / radius=244px`'te asılı kalıyordu; hedef `0/0`. Gece temada kubbe
zeminle aynı renk olduğu için bu hiç fark edilmiyordu.

### Modal tema tanımıyordu

Modal `<Teleport to="body">` ile gövdeye taşınıyor ve **`.app-shell` ağacının
dışında** kalıyor (ölçüldü: modal ebeveyni `BODY`,
`closest('.app-shell') = false`). Kabuğa yazılan tema değişkenleri ona miras
akmıyordu.

Sonuç: panel her iki temada da beyaz kalıyor, gece beyaz metinle **1.72:1**
kontrast veriyordu — yazı okunmuyordu.

### Bölüm zemininde ton kırılması

`--catalog-stage-*` değişkenleri gece için yalnızca `main.css`'teki seçici
**listesinde** tanımlıydı. O listede olmayan yorumlar bölümü fallback'e düşüp
`#050714` alıyordu; ekip bölümü ise `#080B18` idi. Aradaki ince şerit buydu.

---

## Yapılanlar

### 1. Katalog: lab sürümü production'a

Lab'de sıfırdan kurulan katalog ana sayfaya alındı. Eski 501 satırlık bileşen
ve modal değiştirildi.

- `components/lab/CatalogLab.vue` → `components/home/HomeCatalog.vue`
- `components/lab/CatalogModalLab.vue` → `components/home/CatalogProductModal.vue`
- `pages/lab/catalog.vue` silindi (prod'da zaten `/`'a yönlendiriliyordu)

**Önemli:** Lab'ın ayrı bir CSS'i hiç olmamıştı. Stiller `home-catalog.css`'ten
geliyor; o dosya yerinde duruyor ve `main.css:10`'da import ediliyor. Bu turda
oraya yalnızca **2 yorum satırı** dokunuldu (dosya adı referansı).

Yedekler: `backups/*.eski-2026-08-06.bak`
Doğrulandı: **7 satır / 68 kart**, konsol hatası yok.

### 2. Footer renk sözleşmesi

`base/tokens.css`'te tek kaynak:

```
--footer-surface   kubbenin ARKASI (sayfa zeminiyle sürekli)
--footer-dome      kubbenin kendisi (surface'ten bir irtifa ayrışır)
--footer-dome-fg   kubbe üzerindeki metin/ikon
```

Kural: **footer'a renk basan başka hiçbir yer olmamalı.** Bir rota farklı
durmalıysa bu değişkenleri yeniden atar, değer ezmez.

| | Gündüz | Gece |
|---|---|---|
| `--footer-surface` | `--paper` #F2EEE6 | #080B18 |
| `--footer-dome` | `--slab` #1A1533 | **#131937** (yeni — artık görünür) |

### 3. Animasyon ScrollTrigger'a taşındı

Elle scroll dinleyicisi, `IntersectionObserver`, `requestAnimationFrame` döngüsü
ve manuel tween'in tamamı silindi. Yerine `gsap.matchMedia()` + ScrollTrigger
`scrub` geldi — ScrollSmoother ile aynı motoru paylaşıyor.

Açılma yolu bilerek uzun tutuldu (`start: "top bottom+=100%"`, `end: "center top"`,
`scrub: 1.1`): ilk denemede `top bottom → top top` yazılmıştı, bu yalnız 1
viewport yol veriyor ve hareket iki kattan fazla hızlanıyordu. Eski sistem
`rootMargin: "80%"` + `divisor: 1.35` ile ~1900px yol kullanıyordu.

`is-brand-overlap` eşiği ilerlemeye değil **ölçüye** bağlandı, böylece aralık
değişince marka yanlış yerde kaybolmuyor.

### 4. Modal teması

Token'lar `html[data-theme]` seviyesine alındı — Teleport'un ulaşabildiği tek
katman.

| | Gündüz | Gece |
|---|---|---|
| Panel | #FBF9F5 beyaz | #171D3D navy |
| Görsel kutusu | #F1EDE5 | #1D244A |
| Mürekkep | koyu | beyaz |
| **Kontrast** | **11.56:1** | **9.06:1** |

Dosya butonlarının tarayıcı varsayılanı gri dolgusu (`#EFEFEF`) kaldırıldı —
`background` hiç tanımlanmamıştı.

### 5. Temizlik

- `main.css`'teki gece `!important` bloğundan yorumlar bölümü çıkarıldı
  (artık yüzey token'larını okuyor; 25+ `!important` Tailwind class'larını
  eziyordu)
- `home-footer.css`'te **5 mükerrer seçici** birleştirildi, 10 `!important`
  atıldı
- Kendini iptal eden blok silindi: `.footer-visual`'a grid veriliyor, 6 satır
  sonra `display:contents` ile tamamen iptal ediliyordu
- `company.css`'teki `transform: none` kaldırıldı — GSAP kubbeyi o sayfada
  tamamen öldürüyordu
- `themes/{light,dark}.css`'ten ölü footer renk kuralları atıldı (ölçümde
  çalışmadıkları kanıtlanmıştı)
- Ölü `--footer-dome-line` token'ı silindi
- **stylelint: 2 error → 0 error**

---

## Doğrulama

Playwright ile 2 tema × 2 viewport × 4 rota ölçüldü.

| Kontrol | Sonuç |
|---|---|
| Gündüz zemin | tek ton `#F2EEE6` (references kasıtlı `#F6F2E9`) |
| Gece kubbe | `#131937`, zeminden ayrışıyor |
| Alt şerit | temaya bağlı (`#F2EEE6` / `#080B18`) |
| Logo taşması | **0/0** — 16 senaryonun hepsinde |
| Bölüm zeminleri | katalog/ekip/yorumlar hepsi aynı, kırılma yok |
| Katalog | 7 satır / 68 kart |
| Konsol hatası | yok |
| stylelint | 0 error |

---

## Bilinen kalan borç

Bu turun kapsamı değildi, bilerek bırakıldı:

- `home-catalog.css` — 1700 satır, **689 `!important` uyarısı**
- `public/themes/{light,dark}.css` — footer renk kuralları atıldı ama düzen
  kuralları hâlâ içeride; oysa dosyanın kendi başlığı "tema dosyaları yalnızca
  değişken atamalı" diyor
- Katalog ve ekip bölümleri hâlâ `main.css`'teki gece `!important` bloğunda;
  yüzey sözleşmesine taşınmadılar

---

## Süreç notu

Bu turda iki kez kapsam dışına çıkıldı ve geri alındı:

1. **Gündüz paleti** kremden mavi-lilaya çevrildi. Kullanıcı katalog/modal
   renklerini kastediyordu, tüm paleti değil. Tamamen geri alındı, `grep` ile
   doğrulandı — eklenen hiçbir renk kalmadı.
2. **`--surface`** yeniden tanımlandı (`var(--paper)`). Bu token katalog
   kartlarının yüzeyi (`#FBF9F5`); değişince kart sayfa zeminine eşitlendi ve
   kapıların arkası düzleşti. Geri alındı, `tokens.css`'e uyarı notu eklendi.

Ders: yüzey/renk token'ı değiştirmeden önce onu **kimin okuduğu** aranmalı.
