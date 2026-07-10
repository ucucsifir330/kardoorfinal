# home-catalog.css temizlik — devir notu (v4)

Dosya: `nuxt/assets/styles/sections/home-catalog.css` (branch: `cleanup2`)
Şu an: 2924 satır. Son commit: `9a25702` (çalışma ağacı temiz).

## Bu turda ne yapıldı (Sonnet, 2026-07-05)

Önceki v3 notunda "CDP ile 441 dosya-içi nested-selector çakışması bulundu ama
ayrıştırılmadı" deniyordu. Bunun yerine CDP'den vazgeçilip iki basit araç
kullanıldı:

1. **`find-overridden.cjs`** (scratchpad, kalıcı değil): postcss ile dosyayı
   parse edip, her selector'ı "base" (ör. `.catalog-row`) olarak, onu saran
   diğer selector'ları "suffix" (ör. `.home-page .catalog-row`) olarak eşleştirir.
   Aynı media-context içinde specificity + doküman sırasına göre "suffix, base'i
   ezer mi" hesaplar. Aynı kuralın birleşik selector'larını (`.a, .b {...}`)
   yanlış pozitif saymaz. `html[data-theme="dark"] .app-shell--night` gibi
   koşullu (tema-bağımlı) ezmeleri ayrı gruba ayırır — bunlar sadece dark+night
   kombinasyonunda geçerli, base kural light modda hâlâ canlı olabilir, o yüzden
   DOKUNULMADI (5 aday: `.home-page .catalog-like.is-liked`,
   `.home-page .catalog-product:hover .catalog-finish` x2,
   `.home-page .catalog-row.is-liquid-expanded .liquid-menu-inner`,
   `.home-page .liquid-blob-path` — hepsi renk/gölge property'si, sadece dark
   temada ezilir).

2. Kalan 10 koşulsuz (temaya bağlı olmayan) tam-ölü aday bulundu, silindi,
   sonra **`snap-all-catalog.cjs` + `diff-snapshots.cjs`** ile doğrulandı:
   playwright + sistem Chrome, `[class*="catalog-"]` seçiciyle eşleşen TÜM
   elementlerin TÜM computed-style property'lerini 4 viewport (1440/1024/700/390)
   × 2 tema (light/dark) = 8 kombinasyonda silmeden önce/sonra karşılaştırdı.
   595 (masaüstü) / 325 (mobil, bazı elementler responsive olarak DOM'dan
   kalkıyor) elementte SIFIR fark çıktı. Commit `9a25702`.

Bu yöntem CDP'den daha basit ve daha kesin: cascade'i kendin modellemek yerine
tarayıcının nihai hesapladığı değeri (`getComputedStyle`) karşılaştırıyorsun,
matched-rules sırası/media query loglama derdi yok.

## Sıradaki adımlar (öncelik sırasıyla)

1. **5 tema-koşullu aday** (yukarıda listelendi): bunların light modda da
   gerçekten ölü olup olmadığını kontrol et — muhtemelen light'ta base kural
   canlı, sadece dark+night'ta ikinci bir override var (bu normal/kasıtlı
   olabilir, silinecek "ölü kod" olmayabilir). `snap-all-catalog.cjs` zaten
   light temayı da kaydediyor, `overridden-report.json`'daki (scratchpad,
   silinmiş olabilir, `find-overridden.cjs` yeniden çalıştırılabilir) ilgili
   base selector'ların light-mode computed style'ına bak.

2. **92 property-düzeyi ezilme kaydının geri kalanı** (15 tam-ölü dışındakiler,
   yani "PARTIAL" — bazı property ölü bazısı canlı aynı kuralda): bunlar kural
   içinde bölünmeli mi (ölü kısmı sil, canlı kısmı `.home-page` katmanına
   taşı) değerlendirilmedi. `find-overridden.cjs`'i yeniden çalıştırıp
   `allPropsOverridden: false` olanlara bak.

3. **`!important` oranı hâlâ yüksek** (~%48). Kök neden: `.home-page` katmanı
   zaten specificity ile kazanırken savunmacı biçimde her declaration'a
   important eklenmiş. Bu ayrı ve daha riskli bir refactor (silme değil,
   important kaldırıp test etme) — kullanıcı onayı olmadan başlanmamalı.

4. Bekleyen ürün kararları (CSS değil): series/[slug].vue'daki "View Door
   Selector" butonu `/doors`'a gidiyor (route silinmiş, 404) →  `/catalog`'a
   çevrilmeli. `/catalog` kartları `/doors/KOD`'a gidiyor ama route kapalı →
   404. `catalog-taxonomy.ts` eşlemeleri tahmin, yayın öncesi doğrulanmalı.

## Doğrulama yöntemi (standart, her turda kullan)

Statik dosya analizi TEK BAŞINA yeterli değil — kullanıcı bunu 3 kez haklı
çıkarak reddetti (bkz. memory `cleanup2-css-temizlik-durumu.md`). Her silme
öncesi/sonrası gerçek tarayıcı `getComputedStyle` karşılaştırması şart:

- `snap-all-catalog.cjs`: `[class*="catalog-"]` tüm elementlerin computed
  style'ını 4 viewport × 2 tema'da JSON'a yazar.
- Silmeden önce ve sonra bu script'i çalıştır, `diff-snapshots.cjs` ile
  karşılaştır. SIFIR fark yoksa silme güvenli değildir.
- Scriptler kalıcı değil (scratchpad'te), gerekirse yukarıdaki mantıkla
  yeniden yazılabilir. Chrome path: `C:\Program Files\Google\Chrome\Application\chrome.exe`.
  Playwright-core repo kökünde (`node_modules/playwright-core`, nuxt/ altında
  DEĞİL). Dev server `http://localhost:3000`.

## Kullanıcı hakkında not

Kullanıcı temizlik iddialarına karşı haklı bir şekilde şüpheci; "bitti" demeden
önce her zaman somut kanıt (computed-style diff, ekran görüntüsü karşılaştırması)
göster. Bkz. memory `css-temizlik-kanit-standardi`.
