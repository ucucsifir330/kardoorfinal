<script setup lang="ts">
import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

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

const { filters, searchQuery, isScrolled, visibleRows, filteredRows, setRowRef } = useCatalogPage();
</script>

<template>
  <section class="catalog-page">
    <CatalogSidebar v-model:search-query="searchQuery" :filters="filters" />
    <CatalogMain
      :rows="filteredRows"
      :visible-rows="visibleRows"
      :is-scrolled="isScrolled"
      :set-row-ref="setRowRef"
    />
  </section>
</template>
