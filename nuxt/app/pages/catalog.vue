<script setup lang="ts">
import { computed } from "vue";
import CollectionsIndex from "~/components/catalog/CollectionsIndex.vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import { products } from "~/data/products";

// Collections kendi giriş koreografisini kuruyor (hero → arşiv geçişi, ScrollTrigger
// satır tetikleyicileri). Site geneli sayfa geçiş perdesi bunun üstüne binince
// iki animasyon aynı anda başlıyordu; prototipte de kapalıydı.
definePageMeta({
  pageTransition: false
});

const { locale } = useKardoorLocale();

const seo = computed(() =>
  locale.value === "tr"
    ? {
        title: "Kapı Kataloğu",
        description:
          "Ege Kardoor kapı kataloğu: çelik, alüminyum, ahşap, PVC ve cam kapı serilerini filtreleyin, projeniz için doğru modeli bulun."
      }
    : {
        title: "Door Catalog",
        description:
          "Ege Kardoor door catalog: browse steel, aluminium, wood, PVC and glass door series and find the right model for your project."
      }
);

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description
});
</script>

<template>
  <CollectionsIndex :products="products" />
</template>
