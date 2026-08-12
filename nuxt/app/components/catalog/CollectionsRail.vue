<script setup lang="ts">
import type { DoorProduct } from "~/data/products";

type CollectionsRailGroup = {
  slug: string;
  title: string;
  products: DoorProduct[];
};

type CollectionsRailLabels = {
  modelIndex: string;
  search: string;
  searchPlaceholder: string;
  model: string;
  noResult: string;
  clearSearch: string;
};

const props = defineProps<{
  groups: CollectionsRailGroup[];
  allGroups: CollectionsRailGroup[];
  activeProductCode: string;
  filteredCount: number;
  totalCount: number;
  labels: CollectionsRailLabels;
  thumbnailSource: (source: string) => string;
  localizeSeriesTitle: (slug: string, fallback: string) => string;
  localizeTechnicalText: (value: string | undefined) => string;
  registerProductElement: (element: Element | null, product: DoorProduct) => void;
}>();

const emit = defineEmits<{
  select: [product: DoorProduct];
}>();

const searchQuery = defineModel<string>("searchQuery", { required: true });

const seriesOrdinal = (slug: string) =>
  String(props.allGroups.findIndex((group) => group.slug === slug) + 1).padStart(2, "0");

const selectProduct = (product: DoorProduct) => emit("select", product);
</script>

<template>
  <!--
    `collections-*` hooks and the 52svh row cadence are behavioral contracts.
    The parent uses them to bind thumbnail loading, Flip geometry and reversible
    ScrollTrigger product steps. Visual ownership belongs entirely to this leaf.
  -->
  <section
    class="collections-index col-start-3 row-start-1 min-w-0 bg-[var(--collections-bg)] text-[var(--collections-text)]"
    :aria-label="labels.modelIndex"
  >
    <header
      class="collections-index__toolbar sticky top-0 z-[3] grid min-h-[118px] grid-cols-[minmax(0,1fr)_auto] items-end gap-5 border-b border-[var(--collections-line)] bg-[var(--collections-bg)] px-7 pb-[18px] pt-[38px]"
    >
      <label class="block min-w-0">
        <span class="collections-label">{{ labels.search }}</span>
        <input
          v-model="searchQuery"
          class="mt-2 w-full border-0 border-b border-[var(--collections-soft)] bg-transparent pb-2 font-body text-[13px] text-[var(--collections-text)] outline-none transition-colors duration-200 placeholder:text-[var(--collections-soft)] focus:border-[var(--collections-accent)] motion-reduce:transition-none"
          type="search"
          :placeholder="labels.searchPlaceholder"
          autocomplete="off"
        >
      </label>
      <p class="mb-2 text-[11px] text-[var(--collections-soft)]">
        <strong class="font-semibold text-[var(--collections-text)]">{{ filteredCount }}</strong>
        / {{ totalCount }}
      </p>
    </header>

    <div v-if="groups.length" class="collections-index__groups">
      <section
        v-for="group in groups"
        :id="`collections-series-${group.slug}`"
        :key="group.slug"
        class="collections-group scroll-mt-[118px]"
      >
        <header
          class="collections-group__head grid grid-cols-[34px_minmax(0,1fr)_auto] gap-2.5 border-b border-[var(--collections-soft)] px-7 pb-5 pt-11"
        >
          <span class="text-[10px] text-[var(--collections-soft)]">{{ seriesOrdinal(group.slug) }}</span>
          <div class="min-w-0">
            <h2 class="m-0 font-display text-[clamp(28px,2.5vw,44px)] font-medium uppercase leading-[0.9] tracking-[-0.035em]">
              {{ localizeSeriesTitle(group.slug, group.title) }}
            </h2>
            <p class="mb-0 mt-[9px] text-[10px] leading-[1.4] text-[var(--collections-body)]">
              {{ localizeTechnicalText(group.products[0]?.subClass) }}
            </p>
          </div>
          <small class="text-[10px] text-[var(--collections-soft)]">
            {{ group.products.length }} {{ labels.model }}
          </small>
        </header>

        <ol class="collections-models m-0 list-none p-0">
          <li
            v-for="(product, productIndex) in group.products"
            :key="product.code"
            :ref="(element) => registerProductElement(element as Element | null, product)"
            :data-collections-product="product.code"
            class="group relative border-b border-[var(--collections-line)] before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:origin-center before:scale-y-0 before:bg-[var(--collections-accent)] before:transition-transform before:duration-200 before:content-[''] motion-reduce:before:transition-none"
            :class="{
              'bg-[var(--collections-surface)] before:scale-y-100': activeProductCode === product.code
            }"
            @focusin="selectProduct(product)"
          >
            <button
              class="grid min-h-[52svh] w-full cursor-pointer grid-cols-[28px_80px_minmax(110px,1fr)_minmax(92px,0.8fr)] items-center gap-3 border-0 bg-transparent px-7 py-2.5 text-left font-body text-inherit transition-transform duration-150 active:translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-[var(--collections-accent)] motion-reduce:transition-none max-[1180px]:grid-cols-[24px_60px_minmax(0,1fr)]"
              type="button"
              :aria-current="activeProductCode === product.code ? 'true' : undefined"
              @click="selectProduct(product)"
            >
              <span class="collections-models__number text-[9px] uppercase tracking-[0.04em] text-[var(--collections-soft)]">
                {{ String(productIndex + 1).padStart(2, "0") }}
              </span>
              <!-- A definite flex frame prevents CSS Grid's intrinsic image ratio from growing and clipping the thumbnail. -->
              <span class="collections-models__thumb flex h-28 w-20 shrink-0 items-center justify-center max-[1180px]:h-[88px] max-[1180px]:w-[60px]">
                <img
                  class="block h-full w-full object-contain transition-opacity duration-200 ease-out group-hover:opacity-80 group-focus-within:opacity-80 motion-reduce:transition-none"
                  :data-collections-thumbnail="thumbnailSource(product.image)"
                  alt=""
                  width="80"
                  height="112"
                  decoding="async"
                >
              </span>
              <span class="collections-models__identity flex min-w-0 flex-col gap-1">
                <strong class="truncate text-sm font-medium tracking-[-0.02em]">{{ product.name }}</strong>
                <small class="text-[9px] uppercase tracking-[0.04em] text-[var(--collections-soft)]">{{ product.code }}</small>
              </span>
              <span class="collections-models__material text-[9px] uppercase leading-[1.35] tracking-[0.04em] text-[var(--collections-soft)] max-[1180px]:hidden">
                {{ localizeTechnicalText(product.materials[0]) }}
              </span>
            </button>
          </li>
        </ol>
      </section>
    </div>

    <div v-else class="collections-index__empty min-h-[70svh] px-7 py-[72px]">
      <p class="mb-5 mt-0">{{ labels.noResult }}</p>
      <button
        class="cursor-pointer border-0 border-b border-current bg-transparent px-0 pb-2 text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--collections-accent)]"
        type="button"
        @click="searchQuery = ''"
      >
        {{ labels.clearSearch }}
      </button>
    </div>
  </section>
</template>
