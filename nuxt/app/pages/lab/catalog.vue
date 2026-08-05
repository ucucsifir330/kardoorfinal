<script setup lang="ts">
/**
 * KATALOG LAB — HomeCatalog'un temiz yeniden kurulumunun deneme alanı.
 *
 * Production'a BAĞLI DEĞİL: ana sayfa HomeCatalog.vue'yu kullanmaya devam
 * ediyor; bu sayfa yalnız CatalogLab.vue'yu tek başına ayağa kaldırır.
 * Görsel sözleşme: home-catalog.css'teki 202 seçici `.home-page` atasına
 * bağlı — sarmalayıcı sınıf bu yüzden burada da var, yoksa tasarım kayar.
 *
 * Kabul kapısı (değiştirme fazına geçilmeden ölçülecek):
 *   • 7 satır / 68 ürün tam açılıyor (sıçramalı scroll'da da delik yok)
 *   • liquid menü, SVG yapı çizgisi, mıknatıs linki, modal birebir
 *   • scroll'da forced reflow ≤ eski ölçüm (136ms tavan)
 *
 * Prod build'de sayfa ana sayfaya yönlenir — lab yalnız geliştirmede yaşar.
 */
import { navigateTo } from "#imports";
// Lab AYRI dosya: production HomeCatalog.vue'ya hiç dokunmuyor.
// Yeni sistem burada kuruluyor, beğenilince değiştirme fazı gelir.
// Açık import — auto-import manifest bayatlama tuzağına karşı.
import CatalogLab from "~/components/lab/CatalogLab.vue";

if (!import.meta.dev) {
  navigateTo("/", { redirectCode: 302 });
}

useHead({ title: "Katalog Lab" });
</script>

<template>
  <div class="home-page catalog-lab-page">
    <CatalogLab />
  </div>
</template>

<style scoped>
/* Ana sayfada bu boşluğu hero veriyor; lab'de bölüm tek başına durduğu
   için başlık navbar'ın altına girmesin diye küçük bir nefes payı. */
.catalog-lab-page {
  padding-top: 120px;
  min-height: 100vh;
  /* `--paper` DEĞİL: o token her iki temada da krem (#F2EEE6), gece
     modunda değişmiyor. Sayfa sarmalı krem kalırken bölüm lacivert
     oluyordu ve üstteki dolgu bandında krem bir şerit görünüyordu
     (ölçüldü: 0–76px arası sayfa bg, altı section bg).

     Gündüzde section'ın kendi zemini yok (transparent) — sayfa zemini
     görünüyor, `--catalog-stage-bg` doğru değer.
     Gecede section `#080B18` alıyor; bandın onunla aynı olması için
     aşağıdaki tema kuralı var. */
  background: var(--catalog-stage-bg);
}

/* Gece: bant bölümün zeminiyle birebir aynı olmalı, yoksa üstte bir
   ton farkı şerit gibi seçiliyor (#050714 vs #080B18 ölçüldü). */
:global(.app-shell--night) .catalog-lab-page {
  background: #080B18;
}

/* Mobilde 120px navbar payı çok: ölçüldü, sayfa/section/main dolguları üst
   üste binince ilk kapı 538px'e düşüyordu (ekranın %64'ü boş). */
@media (max-width: 860px) {
  .catalog-lab-page {
    padding-top: 76px;
  }
}
</style>
