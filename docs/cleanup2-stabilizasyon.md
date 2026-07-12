# cleanup2 Stabilizasyon Haritasi

Bu dosya `cleanup2` branch'indeki karisik degisiklikleri amacina gore ayirir. Hedef, temizlik isini tek bir devasa CSS tartismasi olmaktan cikarip kontrol edilebilir paketlere bolmektir.

## Su Anki Gercek Durum

- Branch: `cleanup2`
- Bu branch `master`dan sadece CSS temizligiyle ayrilmiyor.
- Degisikliklerin icinde Nuxt 4 `app/` klasor tasimasi, catalog sistemi, yeni asset/fontlar, debug/audit tooling ve CSS cleanup birlikte duruyor.
- Bu yuzden "ne temizlendi?" sorusunun cevabi tek dosya degil; once degisiklikleri paketlemek gerekiyor.

## Paketler

### 1. Nuxt 4 klasor tasimasi

Kapsam:
- `nuxt/app.vue -> nuxt/app/app.vue`
- `nuxt/assets`, `nuxt/components`, `nuxt/composables`, `nuxt/pages`, `nuxt/plugins` altindaki dosyalarin `nuxt/app/` altina tasinmasi.

Durum:
- Buyuk olcude dosya tasima.
- Bu paket tek basina dogrulanmali: route'lar, auto-import, CSS import path'leri.

Karar:
- Kalacaksa ayri commit olmali.
- CSS temizligiyle ayni committe kalmamali.

### 2. Catalog sistem degisimi

Kapsam:
- Yeni `CatalogFilterDock.vue`
- `catalog-library` CSS/data dosyalari
- Yeni taxonomy/filter data
- Eski catalog model/sidebar/card dosyalarinin kaldirilmasi

Durum:
- Temizlik degil, urun/katalog mimarisi degisimi.

Karar:
- Ayri fonksiyonel paket.
- Browser ile `/catalog` ve alt route'lar dogrulanmadan CSS cleanup ile karistirilmamali.

### 3. Audit ve debug tooling

Kapsam:
- `nuxt/tests/audit/*`
- `nuxt/package.json` audit scriptleri
- `nuxt/.stylelintrc.json`
- `DebugLab.vue`
- Nuxt/Vue DevTools ayarlari

Durum:
- Test ve audit kodu `nuxt/tests/` altinda izole edilir; Nuxt uygulama
  derlemesine veya tarayici bundle'ina dahil edilmez.
- `nuxt/reports/` ve `nuxt/output/` yalnizca test artifact'i olarak uretilir
  ve commitlenmez.

### 4. CSS cleanup

Kapsam:
- `home-catalog.css`
- `home-footer.css`
- `site-header.css`
- `floating-contact.css`
- `contact.css`
- `company.css`
- katalog alt sayfa CSS dosyalari

Durum:
- Kucuk mekanik temizlikler yapildi: bos rule, redundant shorthand, bazi duplicate selector birlestirmeleri.
- `home-catalog.css` branch gecmisinde zaten CDP/browser kanitli cleanup commitlerine sahip.
- `home-footer.css` buyuk merge denemesi gorsel/state kontrolunden gecmedi; geri alindi. Sadece state farki `0` olan kucuk social button merge kaldi.

Karar:
- Bundan sonra CSS cleanup sadece kucuk batch halinde yapilmali.
- Her batch icin en az biri gerekli:
  - `npm run typecheck`
  - computed-style/browser state kontrolu
  - route/theme/viewport screenshot kontrolu

### 5. Theme dosyalari

Kapsam:
- `nuxt/public/themes/light.css`
- `nuxt/public/themes/dark.css`

Durum:
- Hala theme token dosyasi degil; component selector ve override katmani iceriyor.
- Dogru hedef token-only theme, ama bu ilk siradaki is degil.

Karar:
- Once aktif yuzeyler stabilize edilmeli.
- Theme dosyalarindan component selector tasima isi daha sonra, tek tek owner dosyaya tasinarak yapilmali.

## Oncelik Sirasi

1. Commit paketlerini ayir: Nuxt 4 tasima, catalog sistemi, audit tooling, CSS cleanup.
2. Audit tooling paketini temiz tut: artifact klasorleri ignore kalsin.
3. App'in temel calisirligini dogrula: home, catalog, company, references, contact.
4. Aktif CSS yuzeylerinde kucuk cleanup batchleri yap.
5. En son theme dosyalarini token-only hale getirmeye basla.

## Su Anda Yapilmamasi Gereken

- `light.css` / `dark.css` icinden toplu silme.
- `home-footer.css` icinde buyuk override merge.
- Scroll/GSAP/Lenis tarafina temizlik bahanesiyle dokunma.
- Tum branch'i tek commit olarak kapatma.

## Kisa Cevap

Bu branch'in amaci artik "her seyi temizledik" degil. Dogru amac:

1. Karisik degisiklikleri paketlemek.
2. Audit sistemini kalici hale getirmek.
3. CSS cleanup'i kanitli kucuk batchlere indirmek.
4. Sonra theme ownership sorununu cozmek.
