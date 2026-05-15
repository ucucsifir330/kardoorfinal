<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const {
  activeIndex,
  activeProduct,
  previousProduct,
  nextProduct,
  filteredProducts,
  filterOptions,
  selectedSeries,
  selectedUseCases,
  selectedSurfaces,
  selectedExportTags,
  toggle,
  next,
  previous,
  clearFilters
} = useDoorSelector();

const isFilterOpen = ref(false);
const stageRef = ref<HTMLElement | null>(null);
const { locale } = useKardoorLocale();

const useLocalImageFallback = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null;
  const fallback = image?.dataset.fallbackSrc;

  if (!image || !fallback || image.src.endsWith(fallback)) return;

  image.src = fallback;
};

const copy = computed(() =>
  locale.value === "tr"
    ? {
        previousDoor: "Önceki kapı",
        nextDoor: "Sonraki kapı",
        selector: "Kapı seçici",
        panelSystem: "Panel sistemi",
        exportReady: "İhracata hazır",
        productDetails: "Ürün detayları",
        filterDoors: "Kapıları filtrele",
        productNavigation: "Kapı modeli navigasyonu",
        filters: "Kapı filtreleri",
        filterProducts: "Ürünleri filtrele",
        modelLabel: "model",
        closeFilters: "Filtreleri kapat",
        series: "Seri",
        useCase: "Kullanım alanı",
        surface: "Yüzey",
        export: "İhracat",
        clearFilters: "Filtreleri temizle"
      }
    : {
        previousDoor: "Previous door",
        nextDoor: "Next door",
        selector: "Door selector",
        panelSystem: "Panel system",
        exportReady: "Export-ready",
        productDetails: "Product details",
        filterDoors: "Filter doors",
        productNavigation: "Door model navigation",
        filters: "Door filters",
        filterProducts: "Filter products",
        modelLabel: "models",
        closeFilters: "Close filters",
        series: "Series",
        useCase: "Use case",
        surface: "Surface",
        export: "Export",
        clearFilters: "Clear filters"
      }
);

onMounted(async () => {
  const { gsap } = await import("gsap");

  gsap.fromTo(
    ".door-selector__product",
    { y: 42, opacity: 0, scale: 0.94 },
    { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power3.out" }
  );

  watch(
    activeProduct,
    () => {
      if (!stageRef.value) return;

      gsap.fromTo(
        stageRef.value.querySelectorAll(".door-selector__product, .door-selector__copy, .spec-card"),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.04, ease: "power2.out" }
      );
    },
    { flush: "post" }
  );
});
</script>

<template>
  <section ref="stageRef" class="door-selector" :style="{ '--door-accent': activeProduct.accentColor }">
    <div class="door-selector__grain" aria-hidden="true" />
    <div class="door-selector__rails" aria-hidden="true" />

    <button class="selector-arrow selector-arrow--left" type="button" :aria-label="copy.previousDoor" @click="previous">
      ←
    </button>
    <button class="selector-arrow selector-arrow--right" type="button" :aria-label="copy.nextDoor" @click="next">
      →
    </button>

    <div class="door-selector__topline">
      <p>{{ copy.selector }}</p>
      <span>{{ String(activeIndex + 1).padStart(2, "0") }} / {{ String(filteredProducts.length).padStart(2, "0") }}</span>
    </div>

    <div class="door-selector__media">
      <div class="door-selector__ghost door-selector__ghost--left" aria-hidden="true">
        <NuxtImg
          :src="previousProduct.image"
          :alt="previousProduct.name"
          :data-fallback-src="previousProduct.fallbackImage"
          width="240"
          height="520"
          @error="useLocalImageFallback"
        />
      </div>

      <div class="door-selector__product">
        <div class="door-selector__halo" aria-hidden="true" />
        <NuxtImg
          :key="activeProduct.slug"
          :src="activeProduct.image"
          :alt="activeProduct.name"
          :data-fallback-src="activeProduct.fallbackImage"
          width="460"
          height="760"
          sizes="sm:280px md:360px lg:460px"
          preload
          @error="useLocalImageFallback"
        />
      </div>

      <div class="door-selector__ghost door-selector__ghost--right" aria-hidden="true">
        <NuxtImg
          :src="nextProduct.image"
          :alt="nextProduct.name"
          :data-fallback-src="nextProduct.fallbackImage"
          width="240"
          height="520"
          @error="useLocalImageFallback"
        />
      </div>
    </div>

    <aside class="spec-card spec-card--capacity">
      <strong>{{ activeProduct.specs[0] }}</strong>
      <span>{{ copy.panelSystem }}</span>
    </aside>

    <aside class="spec-card spec-card--connect">
      <span>{{ copy.exportReady }}</span>
      <strong>{{ activeProduct.exportTags[0] }}</strong>
    </aside>

    <aside class="spec-card spec-card--detail">
      <p>{{ activeProduct.seriesTitle }}</p>
      <NuxtLink :to="`/doors/${activeProduct.slug}`">{{ copy.productDetails }}</NuxtLink>
    </aside>

    <div class="door-selector__copy">
      <p>{{ activeProduct.category }}</p>
      <h1>{{ activeProduct.code }}</h1>
      <span>{{ activeProduct.name }}</span>
    </div>

    <div class="door-selector__summary">
      <p>{{ activeProduct.description }}</p>
      <ul>
        <li v-for="spec in activeProduct.specs" :key="spec">{{ spec }}</li>
      </ul>
    </div>

    <button class="filter-trigger" type="button" @click="isFilterOpen = true">
      {{ copy.filterDoors }}
      <span aria-hidden="true">≡</span>
    </button>

    <div class="product-strip" :aria-label="copy.productNavigation">
      <button
        v-for="(product, index) in filteredProducts"
        :key="product.slug"
        type="button"
        :class="{ 'is-active': product.slug === activeProduct.slug }"
        @click="activeIndex = index"
      >
        {{ product.code }}
      </button>
    </div>

    <div class="filter-panel" :class="{ 'is-open': isFilterOpen }" :aria-label="copy.filters">
      <div class="filter-panel__head">
        <div>
          <p>{{ copy.filterProducts }}</p>
          <span>{{ filteredProducts.length }} {{ copy.modelLabel }}</span>
        </div>
        <button type="button" :aria-label="copy.closeFilters" @click="isFilterOpen = false">×</button>
      </div>

      <div class="filter-group">
        <h2>{{ copy.series }}</h2>
        <button
          v-for="series in filterOptions.series"
          :key="series.slug"
          type="button"
          :class="{ 'is-selected': selectedSeries.includes(series.slug) }"
          @click="toggle(selectedSeries, series.slug)"
        >
          {{ series.shortTitle }}
        </button>
      </div>

      <div class="filter-group">
        <h2>{{ copy.useCase }}</h2>
        <button
          v-for="useCase in filterOptions.useCases"
          :key="useCase"
          type="button"
          :class="{ 'is-selected': selectedUseCases.includes(useCase) }"
          @click="toggle(selectedUseCases, useCase)"
        >
          {{ useCase }}
        </button>
      </div>

      <div class="filter-group">
        <h2>{{ copy.surface }}</h2>
        <button
          v-for="surface in filterOptions.surfaces"
          :key="surface"
          type="button"
          :class="{ 'is-selected': selectedSurfaces.includes(surface) }"
          @click="toggle(selectedSurfaces, surface)"
        >
          {{ surface }}
        </button>
      </div>

      <div class="filter-group">
        <h2>{{ copy.export }}</h2>
        <button
          v-for="tag in filterOptions.exportTags"
          :key="tag"
          type="button"
          :class="{ 'is-selected': selectedExportTags.includes(tag) }"
          @click="toggle(selectedExportTags, tag)"
        >
          {{ tag }}
        </button>
      </div>

      <button class="filter-panel__clear" type="button" @click="clearFilters">{{ copy.clearFilters }}</button>
    </div>
  </section>
</template>
