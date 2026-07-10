<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useNuxtApp, useRoute, useRouter } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import {
  clearedCatalogFilterQuery,
  countActiveCatalogFilters,
  filterCatalogProducts,
  parseCatalogFilterQuery
} from "~/data/catalog-library-filters";
import { products } from "~/data/products";

definePageMeta({
  pageTransition: false
});

const PAGE_SIZE = 24;

const route = useRoute();
const router = useRouter();
const { locale } = useKardoorLocale();
const { $smoother } = useNuxtApp();

const filters = computed(() => parseCatalogFilterQuery(route.query));
const filteredProducts = computed(() => filterCatalogProducts(products, filters.value));
const hasActiveFilters = computed(() => countActiveCatalogFilters(filters.value) > 0);

const visibleCount = ref(PAGE_SIZE);
watch(filters, () => {
  visibleCount.value = PAGE_SIZE;
});

const visibleProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value));
const remainingCount = computed(() => filteredProducts.value.length - visibleProducts.value.length);

const loadMore = async () => {
  visibleCount.value += PAGE_SIZE;
  await nextTick();
  // Sayfa boyu değişti; ScrollSmoother'ın ölçümü tazelensin.
  ($smoother?.() as { refresh?: () => void } | null)?.refresh?.();
};

const clearFilters = () => {
  router.replace({
    query: { ...route.query, ...clearedCatalogFilterQuery() }
  });
};

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

const t = computed(() =>
  locale.value === "tr"
    ? {
        status: `${filteredProducts.value.length} modelden ${visibleProducts.value.length} tanesi gösteriliyor`,
        loadMore: "Daha fazla göster",
        empty: "Filtrenize uyan model yok.",
        clearFilters: "Filtreleri temizle"
      }
    : {
        status: `Showing ${visibleProducts.value.length} of ${filteredProducts.value.length} models`,
        loadMore: "Load more items",
        empty: "No doors match your filters.",
        clearFilters: "Clear filters"
      }
);

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description
});
</script>

<template>
  <section id="main-content" class="catalog-lib">
    <h1 class="catalog-lib__heading">{{ seo.title }}</h1>

    <p class="catalog-lib__status" aria-live="polite">{{ t.status }}</p>

    <ul v-if="visibleProducts.length" class="catalog-lib__grid">
      <li
        v-for="(product, index) in visibleProducts"
        :key="product.slug"
        class="catalog-lib__item"
      >
        <NuxtLink
          class="catalog-lib__card"
          :to="`/doors/${product.code}`"
          :aria-label="`${product.name}, ${product.code}`"
        >
          <span class="catalog-lib__visual">
            <img
              :src="product.localImage"
              :alt="`${product.name} ${product.code}`"
              width="320"
              height="426"
              :loading="index < 6 ? 'eager' : 'lazy'"
              :fetchpriority="index < 2 ? 'high' : 'auto'"
            />
            <span class="catalog-lib__add" aria-hidden="true">+</span>
          </span>

          <span class="catalog-lib__meta">
            <strong>{{ product.name }}</strong>
            <span>{{ product.code }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="catalog-lib__empty">
      <p>{{ t.empty }}</p>
      <button v-if="hasActiveFilters" type="button" @click="clearFilters">
        {{ t.clearFilters }}
      </button>
    </div>

    <div v-if="remainingCount > 0" class="catalog-lib__more">
      <button type="button" @click="loadMore">{{ t.loadMore }}</button>
    </div>
  </section>
</template>
