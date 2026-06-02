<script setup lang="ts">
import type { CatalogRow } from "~/composables/useCatalogPage";

defineProps<{
  row: CatalogRow;
  isVisible: boolean;
}>();
</script>

<template>
  <article class="catalog-row catalog-row--technical" :data-row-id="row.id">
    <div class="catalog-row__meta">
      <div :class="{ 'catalog-row__reveal': isVisible }" data-index="0">
        <h2>{{ row.collection }}</h2>
        <p>{{ row.title.split(" ")[0] }}</p>
        <div class="catalog-row__tags">
          <span v-for="tag in row.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <div class="catalog-card">
      <div class="catalog-card__head">
        <h3>{{ row.title }} <span>{{ row.series }}</span></h3>
        <p>{{ row.description }}</p>
        <NuxtLink class="catalog-card__route" :to="row.route" aria-label="Koleksiyona git">›</NuxtLink>
      </div>

      <div class="catalog-grid">
        <CatalogProductCard
          v-for="(item, index) in row.variants"
          :key="item.slug"
          :item="item"
          :index="index"
        />
      </div>
    </div>
  </article>
</template>
