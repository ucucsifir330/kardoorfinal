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
const openGroups = ref<Set<CatalogFacetKey>>(new Set([catalogFacetGroups[0]?.key]));

const isGroupOpen = (key: CatalogFacetKey) => openGroups.value.has(key);

const toggleGroup = (key: CatalogFacetKey) => {
  const next = new Set(openGroups.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  openGroups.value = next;
};

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
          <div
            v-for="group in catalogFacetGroups"
            :key="group.key"
            class="catalog-lib-filter__group"
          >
            <button
              :id="`catalog-lib-filter-summary-${group.key}`"
              type="button"
              class="catalog-lib-filter__summary"
              :aria-expanded="isGroupOpen(group.key)"
              :aria-controls="`catalog-lib-filter-panel-${group.key}`"
              @click="toggleGroup(group.key)"
            >
              <span>{{ group.title[locale] }}</span>
              <span class="catalog-lib-filter__chevron" aria-hidden="true"></span>
            </button>
            <div
              :id="`catalog-lib-filter-panel-${group.key}`"
              class="catalog-lib-filter__options"
              :class="{ 'catalog-lib-filter__options--open': isGroupOpen(group.key) }"
              role="group"
              :aria-labelledby="`catalog-lib-filter-summary-${group.key}`"
            >
              <div class="catalog-lib-filter__options-inner">
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
              </div>
            </div>
          </div>

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
