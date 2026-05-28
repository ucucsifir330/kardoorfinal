<script setup lang="ts">
definePageMeta({
  pageTransition: false
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
