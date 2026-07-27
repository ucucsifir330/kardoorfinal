<template>
  <svg
    class="ege-logo"
    viewBox="0 0 657 768"
    fill="currentColor"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : true"
    focusable="false"
  >
    <title v-if="title">{{ title }}</title>
    <rect x="6" y="7" width="188" height="753" rx="60" />
    <path d="M323 7L580.1 7A40 40 0 0 1 608.5 75.1L351.4 334.9A40 40 0 0 1 283 306.7L283 47A40 40 0 0 1 323 7Z" />
    <path d="M351.1 401.3L642.7 689.6A40 40 0 0 1 614.6 758L323 758A40 40 0 0 1 283 718L283 429.8A40 40 0 0 1 351.1 401.3Z" />
  </svg>
</template>

<script setup lang="ts">
/**
 * Ege Kardoor K markası — tek kaynak.
 *
 * Vektör, çünkü tüm kullanım yerleri zaten yalnızca SİLUETE ihtiyaç duyuyordu:
 * header ve welcome ekranı PNG'yi CSS `mask` olarak kullanıp rengi atıyordu,
 * footer ise alfa tabanlı bir SVG filtresi uyguluyordu. Kimse PNG'nin renk
 * verisini kullanmıyordu — 225KB'lık raster sadece bir siluet taşıyordu.
 *
 * Geometri, eski PNG'nin alfa kanalından ölçülerek türetildi (gövde 188x753
 * r60; kamalar x283'ten başlayıp x676/712'ye uzanan r40 yuvarlatılmış üçgenler).
 * Orijinale karşı piksel farkı %0.51.
 *
 * `currentColor` kullanır: renk, kullanan tarafın `color` değeriyle gelir, bu
 * yüzden tema geçişleri ekstra varyant gerektirmez.
 */
defineProps<{
  /** Erişilebilir ad. Verilmezse ikon dekoratif sayılır (aria-hidden). */
  title?: string
}>()
</script>

<style scoped>
.ege-logo {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
