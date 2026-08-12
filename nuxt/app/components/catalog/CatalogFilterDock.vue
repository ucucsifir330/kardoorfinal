<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { gsap } from "gsap";
import { useRoute, useRouter } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import {
  catalogFacetGroups,
  clearedCatalogFilterQuery,
  countActiveCatalogFilters,
  filterCatalogProducts,
  getCatalogFacetGroups,
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
const panelRef = ref<HTMLElement | null>(null);
const scrimRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const closeDockRef = ref<HTMLButtonElement | null>(null);
const open = ref(false);
const closing = ref(false);
const openGroups = ref<Set<CatalogFacetKey>>(new Set([catalogFacetGroups[0]?.key]));
let panelTimeline: ReturnType<typeof gsap.timeline> | null = null;

const isGroupOpen = (key: CatalogFacetKey) => openGroups.value.has(key);

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const toggleGroup = async (key: CatalogFacetKey) => {
  const willOpen = !openGroups.value.has(key);
  const options = dialogRef.value?.querySelector<HTMLElement>(
    `#catalog-lib-filter-panel-${key}`
  );
  const chevron = dialogRef.value?.querySelector<HTMLElement>(
    `#catalog-lib-filter-summary-${key} .catalog-lib-filter__chevron`
  );
  const startHeight = options?.getBoundingClientRect().height ?? 0;

  if (options) {
    gsap.killTweensOf(options);
    gsap.set(options, { height: startHeight });
  }
  if (chevron) gsap.killTweensOf(chevron);

  const next = new Set(openGroups.value);
  if (willOpen) {
    next.add(key);
  } else {
    next.delete(key);
  }
  openGroups.value = next;

  await nextTick();

  if (prefersReducedMotion()) {
    if (options) gsap.set(options, { clearProps: "height" });
    if (chevron) gsap.set(chevron, { clearProps: "transform" });
    return;
  }

  if (options) {
    gsap.to(options, {
      height: willOpen ? options.scrollHeight : 0,
      duration: willOpen ? 0.72 : 0.56,
      ease: willOpen ? "power3.out" : "power2.inOut",
      overwrite: "auto",
      onComplete: () => gsap.set(options, { clearProps: "height" })
    });
  }

  if (chevron) {
    gsap.fromTo(
      chevron,
      { rotation: willOpen ? 45 : -135 },
      {
        rotation: willOpen ? -135 : 45,
        duration: 0.58,
        ease: "power2.inOut",
        overwrite: "auto",
        onComplete: () => gsap.set(chevron, { clearProps: "transform" })
      }
    );
  }
};

const filters = computed(() => parseCatalogFilterQuery(route.query));
const facetGroups = computed(() => getCatalogFacetGroups(filters.value));
const activeCount = computed(() => countActiveCatalogFilters(filters.value));
const resultCount = computed(() => filterCatalogProducts(products, filters.value).length);

const t = computed(() =>
  locale.value === "tr"
    ? {
        trigger: "Filtreler",
        panelLabel: "Katalog filtreleri",
        close: "Filtreleri kapat",
        closeDock: "Kapat",
        clear: "Temizle",
        show: `${resultCount.value} modeli göster`,
        status: `${resultCount.value} model bulundu`
      }
    : {
        trigger: "Filters",
        panelLabel: "Catalog filters",
        close: "Close filters",
        closeDock: "Close",
        clear: "Clear",
        show: `Show ${resultCount.value} models`,
        status: `${resultCount.value} models found`
      }
);

const openPanel = () => {
  const dialog = dialogRef.value;
  const panel = panelRef.value;
  const scrim = scrimRef.value;
  const closeDock = closeDockRef.value;
  if (!dialog || !panel || !scrim || !closeDock) return;

  panelTimeline?.kill();
  gsap.set(panel, { xPercent: -100 });
  gsap.set(scrim, { opacity: 0 });
  gsap.set(closeDock, { autoAlpha: 0, y: 22, scale: 0.94 });
  dialog.showModal();
  open.value = true;
  closing.value = false;

  if (prefersReducedMotion()) {
    gsap.set(panel, { xPercent: 0 });
    gsap.set(scrim, { opacity: 1 });
    gsap.set(closeDock, { autoAlpha: 1, y: 0, scale: 1 });
    return;
  }

  panelTimeline = gsap
    .timeline({ defaults: { overwrite: "auto" } })
    .to(scrim, { opacity: 1, duration: 0.65, ease: "power1.out" }, 0)
    .to(panel, { xPercent: 0, duration: 1.05, ease: "power3.out" }, 0)
    .to(
      closeDock,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
        clearProps: "visibility"
      },
      0.25
    );
};

const closePanel = () => {
  const dialog = dialogRef.value;
  const panel = panelRef.value;
  const scrim = scrimRef.value;
  const closeDock = closeDockRef.value;
  if (!dialog?.open || !panel || !scrim || !closeDock || closing.value) return;

  panelTimeline?.kill();

  if (prefersReducedMotion()) {
    dialog.close();
    return;
  }

  closing.value = true;
  panelTimeline = gsap
    .timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => dialog.close()
    })
    .to(panel, { xPercent: -100, duration: 0.72, ease: "power2.inOut" }, 0)
    .to(scrim, { opacity: 0, duration: 0.55, ease: "power1.inOut" }, 0.08)
    .to(
      closeDock,
      { autoAlpha: 0, y: 18, scale: 0.96, duration: 0.4, ease: "power2.in" },
      0
    );
};

const onDialogClosed = () => {
  open.value = false;
  closing.value = false;
  panelTimeline?.kill();
  panelTimeline = null;
  if (panelRef.value) gsap.set(panelRef.value, { clearProps: "transform" });
  if (scrimRef.value) gsap.set(scrimRef.value, { clearProps: "opacity" });
  if (closeDockRef.value) {
    gsap.set(closeDockRef.value, { clearProps: "opacity,visibility,transform" });
  }

  void nextTick(() => {
    const trigger = triggerRef.value;
    if (!trigger || prefersReducedMotion()) return;
    gsap.fromTo(
      trigger,
      { autoAlpha: 0, y: 16, scale: 0.96 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.52,
        ease: "power3.out",
        clearProps: "opacity,visibility,transform"
      }
    );
  });
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
    query: { ...route.query, ...clearedCatalogFilterQuery() }
  });
};

onBeforeUnmount(() => {
  panelTimeline?.kill();
  dialogRef.value?.close();
});
</script>

<template>
  <div class="catalog-lib-dock">
    <button
      v-show="!open"
      ref="triggerRef"
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
      @cancel.prevent="closePanel"
      @close="onDialogClosed"
    >
      <div ref="scrimRef" class="catalog-lib-filter__scrim" aria-hidden="true" @click="closePanel"></div>

      <form ref="panelRef" method="dialog" class="catalog-lib-filter__panel">
        <header class="catalog-lib-filter__head">
          <h2>{{ t.trigger }}</h2>
          <button type="button" class="catalog-lib-filter__close" :aria-label="t.close" @click="closePanel">×</button>
        </header>

        <div class="catalog-lib-filter__body">
          <div
            v-for="group in facetGroups"
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
                  :class="{ 'catalog-lib-filter__option--unavailable': option.count === 0 && !filters[group.key].includes(option.value) }"
                >
                  <input
                    type="checkbox"
                    :checked="filters[group.key].includes(option.value)"
                    :disabled="option.count === 0 && !filters[group.key].includes(option.value)"
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
          <button type="button" class="catalog-lib-filter__apply" @click="closePanel">{{ t.show }}</button>
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

      <button
        ref="closeDockRef"
        type="button"
        class="catalog-lib-dock__trigger catalog-lib-dock__trigger--close"
        :aria-label="t.close"
        @click="closePanel"
      >
        <span class="catalog-lib-dock__close-icon" aria-hidden="true">×</span>
        {{ t.closeDock }}
      </button>
    </dialog>
  </div>
</template>
