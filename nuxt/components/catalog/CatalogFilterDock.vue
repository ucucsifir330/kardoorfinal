<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import {
  catalogFacetGroups,
  countActiveCatalogFilters,
  filterCatalogProducts,
  parseCatalogFilterQuery,
  serializeCatalogFilterState,
  type CatalogFacetKey
} from "~/data/catalog-library-filters";
import { products } from "~/data/products";

// app.vue'da #smooth-content DIŞINDA mount edilir: ScrollSmoother'ın
// transform'u fixed konumlandırmayı kırdığından tetikleyici burada yaşar.
// Panel native <dialog> — focus trap, Esc ve focus restore tarayıcıdan gelir.

const route = useRoute();
const router = useRouter();
const { locale } = useKardoorLocale();

const dialogRef = ref<HTMLDialogElement | null>(null);
const open = ref(false);

const filters = computed(() => parseCatalogFilterQuery(route.query));
const activeCount = computed(() => countActiveCatalogFilters(filters.value));
const resultCount = computed(() => filterCatalogProducts(products, filters.value).length);

const t = computed(() =>
  locale.value === "tr"
    ? {
        trigger: "Filtreler",
        panelLabel: "Katalog filtreleri",
        close: "Filtreleri kapat",
        clear: "Temizle",
        show: `${resultCount.value} modeli göster`,
        status: `${resultCount.value} model bulundu`
      }
    : {
        trigger: "Filters",
        panelLabel: "Catalog filters",
        close: "Close filters",
        clear: "Clear",
        show: `Show ${resultCount.value} models`,
        status: `${resultCount.value} models found`
      }
);

const openPanel = () => {
  dialogRef.value?.showModal();
  open.value = true;
};

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === dialogRef.value) dialogRef.value?.close();
};

const toggleValue = (key: CatalogFacetKey, value: string) => {
  const next = new Set(filters.value[key]);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  router.replace({
    query: {
      ...route.query,
      ...serializeCatalogFilterState({ ...filters.value, [key]: [...next] })
    }
  });
};

const clearAll = () => {
  router.replace({
    query: { ...route.query, seri: undefined, renk: undefined, kullanim: undefined }
  });
};

onBeforeUnmount(() => {
  dialogRef.value?.close();
});
</script>

<template>
  <div class="catalog-lib-dock">
    <button
      type="button"
      class="catalog-lib-dock__trigger"
      :aria-expanded="open"
      aria-controls="catalog-lib-filter-panel"
      @click="openPanel"
    >
      {{ t.trigger }}
      <span v-if="activeCount" class="catalog-lib-dock__badge">{{ activeCount }}</span>
    </button>

    <dialog
      id="catalog-lib-filter-panel"
      ref="dialogRef"
      class="catalog-lib-filter"
      :aria-label="t.panelLabel"
      @close="open = false"
      @click="onBackdropClick"
    >
      <form method="dialog" class="catalog-lib-filter__inner">
        <header class="catalog-lib-filter__head">
          <h2>{{ t.trigger }}</h2>
          <button class="catalog-lib-filter__close" :aria-label="t.close">×</button>
        </header>

        <div class="catalog-lib-filter__body">
          <fieldset
            v-for="group in catalogFacetGroups"
            :key="group.key"
            class="catalog-lib-filter__group"
          >
            <legend>{{ group.title[locale] }}</legend>
            <label
              v-for="option in group.options"
              :key="option.value"
              class="catalog-lib-filter__option"
            >
              <input
                type="checkbox"
                :checked="filters[group.key].includes(option.value)"
                @change="toggleValue(group.key, option.value)"
              />
              <span class="catalog-lib-filter__option-label">{{ option.label }}</span>
              <span class="catalog-lib-filter__option-count">{{ option.count }}</span>
            </label>
          </fieldset>

          <p class="catalog-lib-filter__status" aria-live="polite">{{ t.status }}</p>
        </div>

        <footer class="catalog-lib-filter__foot">
          <button class="catalog-lib-filter__apply">{{ t.show }}</button>
          <button
            v-if="activeCount"
            type="button"
            class="catalog-lib-filter__clear"
            @click="clearAll"
          >
            {{ t.clear }}
          </button>
        </footer>
      </form>
    </dialog>
  </div>
</template>
