# Gece paleti — oksit ekseni analizi

Tarih: 2026-08-15 · Branch: `palette-merge`
**Durum: KARAR VERİLMEDİ.** Uygulandı, tarayıcıda doğrulandı, kullanıcı isteğiyle
geri alındı. Ağaç şu an lacivert eksende (`git status` temiz).

Bu dosyanın amacı: ölçümleri saklamak. Karar tekrar gündeme gelirse aşağıdaki
tablolar yeniden türetilmeden uygulanabilir.

---

## Yapılan işler

### 1. Teşhis — `ADAY-D-oksitli-kizil.png` neden uyumsuz görünüyor

Aday render'ı piksel piksel ölçüldü. Sorun kızıl renk değil, **5 basamaklı zemin
merdiveninin yalnızca 1 tanesinin döndürülmüş olması**:

| yüzey | ADAY-D'de | OKLCH |
|---|---|---|
| sayfa zemini | `#1F1715` | L 21.4% · C 0.014 · **H 34** |
| panel (`--bg-navy`) | `#10293F` | L 27.3% · C 0.051 · **H 247** |
| kart (`--card-bg`) | `#19354D` | L 31.9% · C 0.055 · **H 246** |

### 2. Gündüz teması zaten sıcak eksende — ölçüldü

| token | OKLCH hue |
|---|---|
| `--paper` `#EDEAE0` | 93 |
| `--ink` `#14120D` | 89 |
| `--hairline` `#DDD8C9` | 92 |
| `--warm` `#a77a55` | 60 |

Gündüz sıcak (H ~90), gece soğuk (H ~245). Sistem kendi içinde çelişiyor. Oksit
gece zemini (H 34) bu çelişkiyi kapatır; `--warm` de "kalıntı aksan" olmaktan
çıkıp ailenin doğal orta basamağı olur.

### 3. Türetilen merdiven

L basamakları birebir korunur (kart↔panel farkı 4.6% L, değişmez). Hue 34.
**Chroma merdiveni bilerek TERS: yükseldikçe DÜŞER.**

| token | mevcut (lacivert) | öneri (oksit) | oklch |
|---|---|---|---|
| `--bg-deepest` | `#071018` | `#150C0A` | 16.8% · 0.016 · 34 |
| `--bg-main` | `#0B1822` | `#1F1715` | 21.4% · 0.014 · 34 |
| `--bg-navy` | `#10293F` | `#2C2524` | 27.3% · 0.011 · 34 |
| `--card-bg` | `#19354D` | `#373130` | 31.9% · 0.009 · 34 |
| `--surface-hover` | `#21425E` | `#433E3C` | 36.8% · 0.008 · 34 |

**Ters chroma'nın gerekçesi:** lacivertte chroma yükseldikçe artıyor
(0.022 → 0.062), yani en büyük yüzey en renkli olan. Sıcak eksende o eğri ahşap
kapı görsellerini (C ~0.08) yutuyor — kart zemini onlarla aynı malzeme gibi
okunuyor. Oksit kimliği en dipte yaşamalı, kapının arkasındaki sahne
sıcak-grafit kalmalı. Ayrım hue'dan değil açıklıktan gelir.

Kontrast kapıları (mevcut testin eşikleri) korunuyor:

| çift | oksitte | lacivertte | eşik |
|---|---|---|---|
| `#EEF3F6` / zemin | 15.77 | 16.08 | ≥ 7 |
| `#B9C8D4` / zemin | 10.30 | 10.51 | ≥ 4.5 |
| `#95BADA` / en dip | 9.47 | 9.41 | ≥ 4.5 |

### 4. Uygulandı ve CDP ile doğrulandı (sonra geri alındı)

Gerçek tarayıcıda (playwright-core + sistem Chrome, 1440×900, gece teması
`localStorage` ile) computed-style okundu — kaynak okuması değil:

```
body            rgb(31, 23, 21)   #1F1715  ✓
.catalog-section rgb(44, 37, 36)  #2C2524  ✓
.catalog-card   rgb(55, 49, 48)   #373130  ✓
```

Ekran doğrulaması: ana sayfa ürün ızgarası, showroom bölümü, footer. Ahşap
kapılar (Cedra / Arlo / Caldo) sıcak zeminden ayrışıyor — ters chroma kararı
işini gördü. Gündüz teması bozulmadı (krem zemin + lacivert `01` imzası yerinde).

Kapsam dışı tutulanlar: `--slab` ve `--brand-signature` (ikisi de `#10293F`) —
bunlar gündüz temasının lacivert imzası, gece zemini değil.

---

## Yarım kalan / yapılması gereken işler

### A. Palet kararı — açık
Yukarıdaki merdiven hazır ve doğrulanmış durumda. Uygulamak iki dosyaya dokunur:
`base/tokens.css` (5 satır) ve `tests/dark-palette-contract.mjs` (beklenen
değerler). Karar verilmedi.

Kararla birlikte cevaplanması gerekenler:
- Gündüzün lacivert imzası (`--slab` / `--brand-signature`) kalsın mı, yoksa iki
  tema da tek sıcak eksene mi insin?
- `EGE` wordmark'ının parlak mavisi sıcak zeminde kalacak mı?

### B. `dark-palette-contract.mjs` kırık — palet işinden bağımsız
Test `sections/home-footer.css` okumaya çalışıyor; o dosya
`components/site-footer.css`'e taşınmış. Test ENOENT ile patlıyor, yani gece
paleti sözleşmesi şu an **hiç doğrulanmıyor**. Tek satırlık yol düzeltmesi.
Bu oturumda düzeltilmişti, geri alma sırasında o da geri gitti.

### C. `/catalog` (Collections) token sisteminin dışında
Sayfa kendi `--collections-tone-*-bg` değişkenlerini ve hardcoded `#010e1b`
tonlarını kullanıyor; `tokens.css`'e bağlı değil. Gece paleti ne olursa olsun bu
sayfa lacivert kalır. Bilerek ayrık tutuluyor — "düzeltme" diye dokunulmayacak,
ayrı bir karar konusu.

### D. `--ambience-glow` / `--ambience-light` hâlâ mavi
`rgba(149, 186, 218, …)`. Sıcak zemine geçilirse mavi ışık hâlesi mor bir
parıltı üretir. Palet kararı verilirse birlikte ele alınmalı.

### E. Katalog kenar çubuğunda çakışma — renk işi değil
`02` numarası ile `Dış İklim` etiketi üst üste biniyor (aday render'ında da,
mevcut ağaçta da var). Ayrı bir layout hatası.
