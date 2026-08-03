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
// Açık import — yeni klasör eklenince Nuxt'un auto-import manifest'i
// bayatlayıp "Failed to resolve component" üretebiliyor (bilinen tuzak,
// bkz. memory: HomeCatalogTransition'da da yaşandı). Lab geçici olduğu
// için auto-import'a hiç girmiyoruz.
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
  background: var(--paper);
}
</style>
