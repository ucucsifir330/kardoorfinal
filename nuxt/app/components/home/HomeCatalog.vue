<template>
  <section ref="catalogSectionRef" class="catalog-section">
    <div class="catalog-stage-backdrop" aria-hidden="true"></div>
    <svg
      ref="catalogLineSvgRef"
      class="catalog-structural-lines"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="catalog-structural-line-gradient"
          ref="catalogLineGradientRef"
          gradientUnits="userSpaceOnUse"
          x1="0"
          x2="0"
          y1="0"
          y2="80"
        >
          <stop offset="0" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="0" />
          <stop offset="0.06" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="0.34" />
          <stop offset="0.16" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="1" />
          <stop offset="0.84" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="1" />
          <stop offset="0.94" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="0.34" />
          <stop offset="1" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path ref="catalogLinePathRef" class="catalog-structural-line-path" />
    </svg>
    <div class="catalog-shell">
      <main
        class="catalog-main"
        :ref="setMainRef"
      >
        <div class="catalog-sticky-title" :class="{ 'is-scrolled': isCatalogScrolled }">
          <!-- h2 (h1 değil): sayfanın tek birinci düzey başlığı hero'dadır.
               SSR açıldıktan sonra ikisi de sunucu çıktısına girip
               çakışıyordu. -->
          <h2 ref="catalogTitleRef" class="catalog-title">{{ catalogCopy.title }}</h2>
        </div>

        <div
          v-for="block in localizedCatalogBlocks"
          :key="block.index"
          :ref="setRowRef"
          :data-row-index="block.index"
          class="catalog-row"
          :class="{
            'is-liquid-active': activeLiquidCard === `block-${block.index}`,
            'is-liquid-expanded': liquidMenuExpanded[`block-${block.index}`],
          }"
        >
          <div class="catalog-row-info">
            <transition @before-enter="catalogBeforeEnter" @enter="catalogEnter" :css="false">
              <div v-if="visibleRows.includes(block.index)" data-index="0">
                <h2 class="catalog-product-family">{{ block.number }}</h2>
                <p class="catalog-designer">{{ block.shortName }}</p>

                <div class="catalog-tags">
                  <div class="catalog-tag">
                    <span class="catalog-tag-part">
                      <span class="catalog-tag-label catalog-tag-label--short">{{ block.category.short }}</span>
                      <span class="catalog-tag-label catalog-tag-label--full">{{ block.category.full }}</span>
                      <span class="catalog-tag-line"></span>
                    </span>
                  </div>

                  <div class="catalog-tag catalog-tag--summary">
                    <template v-for="(part, partIndex) in block.parts" :key="part.id">
                      <span v-if="partIndex" class="catalog-tag-separator" aria-hidden="true"> / </span>
                      <span class="catalog-tag-part">
                        <span class="catalog-tag-label catalog-tag-label--short">{{ part.short }}</span>
                        <span class="catalog-tag-label catalog-tag-label--full">{{ part.full }}</span>
                        <span class="catalog-tag-line"></span>
                      </span>
                    </template>
                  </div>
                </div>

                <a
                  class="catalog-all-models catalog-magnetic-link"
                  href="/catalog"
                  @mousemove="handleCatalogMagnetMove"
                  @mouseleave="handleCatalogMagnetLeave"
                >
                  <span class="catalog-tag-part">
                    <span class="catalog-tag-label catalog-tag-label--short">{{ catalogCopy.allShort }}</span>
                    <span class="catalog-tag-label catalog-tag-label--full">{{ catalogCopy.allFull }}</span>
                    <span class="catalog-tag-line"></span>
                  </span>
                </a>
              </div>
            </transition>
          </div>

          <div
            class="catalog-card liquid-card"
            @mousemove="handleLiquidCardMouseMove($event, `block-${block.index}`)"
          >
            <div class="catalog-card-header">
              <h3 class="catalog-card-title">
                {{ block.cardTitle }} <span>{{ block.seriesLabel }}</span>
              </h3>

              <div class="catalog-card-actions">
                <span class="catalog-card-subtitle">{{ block.description }}</span>

              </div>
            </div>

            <ul class="catalog-mobile-actions">
              <li><NuxtLink to="/catalog">{{ catalogCopy.actions.viewSeries }}</NuxtLink></li>
              <li>{{ catalogCopy.actions.downloadCatalog }}</li>
              <li>{{ catalogCopy.actions.requestOffer }}</li>
            </ul>

            <transition-group
              name="catalog-list"
              tag="div"
              :css="false"
              class="catalog-product-grid"
              @before-enter="catalogBeforeEnter"
              @enter="catalogEnter"
            >
              <article
                v-for="(item, index) in (visibleRows.includes(block.index) ? getPreviewProducts(block) : [])"
                :key="'row-' + block.index + '-item-' + item.id"
                :data-index="index + 1"
                class="catalog-product"
                @click="openProductModal(item.productIndex)"
              >
                <div class="catalog-product-image-wrap">
                  <img
                    :src="thumb(item.image)"
                    :alt="catalogCopy.productImageAlt"
                    class="catalog-product-image"
                    loading="lazy"
                    decoding="async"
                    @error="handleCatalogImageError($event, item.localImage)"
                  >
                </div>

                <div class="catalog-product-bottom">
                  <div class="catalog-product-info">
                    <p class="catalog-finish">{{ item.finish }}</p>

                    <div class="catalog-code-wrap">
                      <p class="catalog-code">{{ block.cardTitle }} / {{ item.code }}</p>
                      <div class="catalog-code-line"></div>
                    </div>
                  </div>

                  <div class="catalog-product-arrow-wrap">
                    <svg class="catalog-product-arrow" viewBox="0 0 32 10" aria-hidden="true">
                      <line x1="0" y1="5" x2="31" y2="5"></line>
                      <polyline points="22,0 31,5 22,10"></polyline>
                    </svg>
                  </div>
                </div>
              </article>
            </transition-group>

            <div
              class="liquid-menu"
              :class="{ 'is-expanded': liquidMenuExpanded[`block-${block.index}`] }"
            >
              <div
                class="liquid-edge-control"
              >
                <svg
                  class="liquid-blob"
                  :ref="el => setBlobContainerRef(el, `block-${block.index}`)"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    class="liquid-blob-path"
                    :ref="el => setBlobPathRef(el, `block-${block.index}`)"
                  />
                </svg>

                <div
                  class="liquid-hover-zone"
                  @mousemove="handleLiquidMouseMove($event, `block-${block.index}`)"
                  @mouseenter="handleLiquidEnter(`block-${block.index}`, $event)"
                  @mouseleave="handleLiquidLeave(`block-${block.index}`)"
                  @click.stop="handleLiquidMenuClick($event, `block-${block.index}`)"
                >
                  <div
                    class="hamburger"
                    :ref="el => setHamburgerRef(el, `block-${block.index}`)"
                  >
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                  </div>
                </div>
              </div>

              <div
                class="liquid-menu-inner"
                @click.stop
              >
                <ul class="liquid-actions">
                  <li><NuxtLink to="/catalog">{{ catalogCopy.actions.viewSeries }}</NuxtLink></li>
                  <li>{{ catalogCopy.actions.downloadCatalog }}</li>
                  <li>{{ catalogCopy.actions.requestOffer }}</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  </section>

  <CatalogProductModal
    v-if="activeProduct"
    :product="activeProduct"
    :product-index="activeProductIndex"
    :copy="catalogCopy"
    :series="localizedActiveProductSeries"
    :collection="localizedActiveProductCollection"
    :category="localizedActiveProductCategory"
    :system="localizedActiveProductSystem"
    @close="closeProductModal"
    @prev="showPreviousProduct"
    @next="showNextProduct"
    @toggle-like="toggleLike"
    @image-error="handleCatalogImageError"
  />
  </template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { ComponentPublicInstance } from "vue";
import { useCatalogCopy } from "~/composables/useCatalogCopy";
import { useLiquidMenu } from "~/composables/useLiquidMenu";
import { useCatalogStructuralLine } from "~/composables/useCatalogStructuralLine";
import { useMagneticHover } from "~/composables/useMagneticHover";

const {
  catalogBlocks,
  visibleRows,
  activeProduct,
  activeProductIndex,
  getCatalogPreviewProducts,
  toggleLike,
  openProductModal,
  closeProductModal,
  showPreviousProduct,
  showNextProduct,
  handleProductModalKeydown,
  resetCatalogModalState
} = useHomeCatalog();

const { catalogCopy } = useCatalogCopy();
const localizedCatalogBlocks = computed(() =>
  catalogBlocks.map((block: any) => ({
    ...block,
    ...(catalogCopy.value.blocks[block.index] ?? {})
  }))
);

const localizedActiveProductBlock = computed(() => {
  const product = activeProduct.value;
  if (!product?.code) return null;

  return localizedCatalogBlocks.value.find((block: any) =>
    product.code.startsWith(`${block.productPrefix}-`)
  ) ?? null;
});

const localizedActiveProductSeries = computed(() =>
  localizedActiveProductBlock.value?.cardTitle ?? activeProduct.value?.series ?? ""
);

const localizedActiveProductCollection = computed(() =>
  localizedActiveProductBlock.value?.seriesLabel ?? activeProduct.value?.collection ?? ""
);

const localizedActiveProductCategory = computed(() =>
  localizedActiveProductBlock.value?.description ?? activeProduct.value?.category ?? ""
);

const localizedActiveProductSystem = computed(() =>
  localizedActiveProductBlock.value
    ? `${localizedActiveProductBlock.value.cardTitle} / ${catalogCopy.value.modal.systemFallback}`
    : activeProduct.value?.system ?? ""
);

const isMobile = ref(false);
const mobileProductLimit = 4;

const getPreviewProducts = (block: any) => {
  const all = getCatalogPreviewProducts(block);
  return isMobile.value ? all.slice(0, mobileProductLimit) : all;
};

// Catalog grid thumbnails are tiny (~120px) but the source ImageKit files are
// full-res (~1400x2300, ~3.5MP each). Decoding/compositing ~36 of those while
// scrolling was the real cause of the jank (measured: p95 40ms -> 12ms once
// resized). Serve a 360px-wide ImageKit variant for the grid; the modal keeps
// the original full-res URL untouched.
const thumb = (url?: string) => {
  if (!url || !url.includes("ik.imagekit.io")) return url || "";
  return `${url.split("?")[0]}?tr=w-360,q-82`;
};

const isCatalogScrolled = ref(false);
const catalogSectionRef = ref<HTMLElement | null>(null);
const catalogTitleRef = ref<HTMLElement | null>(null);
const mainRef = ref<HTMLElement | null>(null);
const rowRefs = ref<HTMLElement[]>([]);
// Yapı çizgisi kendi sahibinde: geometri, ScrollTrigger, font-hazır
// gecikmesi ve resize debounce'u orada (bkz. useCatalogStructuralLine).
// Bileşen yalnız "satır açıldı, yeniden ölç" der.
const {
  svgRef: catalogLineSvgRef,
  pathRef: catalogLinePathRef,
  gradientRef: catalogLineGradientRef,
  scheduleRefresh: scheduleCatalogLineRefresh
} = useCatalogStructuralLine({ section: catalogSectionRef, rows: rowRefs });

let catalogRowsFrame = 0;

// Sıvı menü (kart kenarındaki damla şerit + hamburger) kendi sahibinde:
// bkz. useLiquidMenu. Kendi rAF döngüsü, easing'i ve fizik durumu var;
// katalog verisiyle hiç konuşmuyor.
const {
  activeCard: activeLiquidCard,
  expanded: liquidMenuExpanded,
  setBlobPathRef,
  setBlobContainerRef,
  setHamburgerRef,
  onZoneMouseMove: handleLiquidMouseMove,
  onZoneEnter: handleLiquidEnter,
  onZoneLeave: handleLiquidLeave,
  onZoneClick: handleLiquidMenuClick,
  onCardMouseMove: handleLiquidCardMouseMove
} = useLiquidMenu();


const setMainRef = (el: Element | ComponentPublicInstance | null) => {
  mainRef.value = el as HTMLElement | null;
};

const setRowRef = (el: Element | ComponentPublicInstance | null) => {
  if (el && !rowRefs.value.includes(el as HTMLElement)) {
    rowRefs.value.push(el as HTMLElement);
  }
};

const catalogBeforeEnter = (el: Element) => {
  const target = el as HTMLElement;
  target.style.opacity = "0";
  target.style.transform = "translateX(-80px)";
};

const catalogEnter = (el: Element, done: () => void) => {
  const target = el as HTMLElement;
  const delay = parseInt(target.dataset.index || "0") * 120;

  setTimeout(() => {
    target.style.transition = "opacity 0.7s ease-out, transform 0.7s ease-out";
    target.style.opacity = "1";
    target.style.transform = "translateX(0)";

    setTimeout(done, 700);
  }, delay);
};

const revealCatalogRow = (rowIndex: number) => {
  if (rowIndex && !visibleRows.value.includes(rowIndex)) {
    visibleRows.value.push(rowIndex);
    scheduleCatalogLineRefresh();
  }

  // Keep the next rows warm so the row 07 -> references handoff never competes
  // with a fresh grid mount/image queue on the same scroll frames.
  for (let offset = 1; offset <= 2; offset++) {
    const nextRowIndex = rowIndex + offset;
    if (nextRowIndex <= catalogBlocks.length && !visibleRows.value.includes(nextRowIndex)) {
      visibleRows.value.push(nextRowIndex);
      scheduleCatalogLineRefresh();
    }
  }
};

const checkCatalogRows = () => {
  catalogRowsFrame = 0;

  if (!mainRef.value) return;

  // isCatalogScrolled da burada, rAF içinde okunur — eskiden handleCatalogScroll
  // scroll event'inin İÇİNDE rect okuyordu, her kaydırma tick'i forced reflow'du.
  isCatalogScrolled.value = mainRef.value.getBoundingClientRect().top < -5;

  // Satır açma TEK YÖNLÜ: üst kenarı reveal çizgisini geçen her satır açılır
  // ve açık kalır. Eski koşulda `bottom > -vh*0.1` de aranıyordu — hızlı
  // kaydırmada rAF satırın viewport'tan geçişini kaçırırsa satır sonsuza dek
  // boş kalıyordu (ölçüldü: sıçramalı scroll'da 4-5. satırlar boş).
  // "Geçilmiş satır açık olmalı" zaten istenen davranış; alt kenar şartı
  // hiçbir şey korumuyordu.
  //
  // Açık satırın rect'i OKUNMAZ: forced-reflow trace'inde bu döngü 729ms ile
  // en pahalı ikinci kalemdi. Açılma tek yönlü olduğu için açık satırı tekrar
  // ölçmek saf kayıptı.
  const vh = window.innerHeight;
  const revealLine = vh * 1.85;

  rowRefs.value.forEach((el) => {
    const rowIndex = parseInt(el.getAttribute("data-row-index") || "0");
    if (visibleRows.value.includes(rowIndex)) return;

    if (el.getBoundingClientRect().top < revealLine) {
      revealCatalogRow(rowIndex);
    }
  });
};

const requestCatalogRowCheck = () => {
  if (catalogRowsFrame) return;
  catalogRowsFrame = requestAnimationFrame(checkCatalogRows);
};

const handleCatalogScroll = () => {
  requestCatalogRowCheck();
};

// "Tümü" bağlantısının mıknatıs etkisi kendi sahibinde (useMagneticHover):
// katalogla ilişkisi yok, herhangi bir bağlantıda kullanılabilir.
const {
  onMove: handleCatalogMagnetMove,
  onLeave: handleCatalogMagnetLeave
} = useMagneticHover();

const handleCatalogImageError = (event: Event, fallbackSrc?: string) => {
  if (!fallbackSrc) return;

  const image = event.currentTarget as HTMLImageElement | null;
  if (!image || image.src.endsWith(fallbackSrc)) return;

  image.onerror = null;
  image.src = fallbackSrc;
};


// Satır açmanın TEK sahibi scroll listener + rAF (checkCatalogRows).
// Eski sürümde bir de IntersectionObserver vardı — aynı satırları o da
// açmaya çalışıyordu. İki sorun: (1) aynı property'yi iki motor yönetiyordu,
// (2) IO ScrollSmoother altında zaten TETİKLENMİYOR (sayfa transform ile
// kayıyor, viewport kesişimi oluşmuyor — ölçüldü: sıçramalı scroll'da IO
// hiçbir satırı açmadı, HomeManifesto'da da aynı tespit kayıtlı). Ölü
// motoru taşımadık.
const startRowReveal = () => {
  revealCatalogRow(1);
  requestCatalogRowCheck();
};

const checkMobile = () => { isMobile.value = window.innerWidth <= 760; };

// Mobilde dikey scroll adres çubuğunu gizleyince tarayıcı sürekli 'resize'
// fırlatır; ama katalog çizgisi geometrisi ve isMobile kırılımı GENİŞLİĞE bağlı.
// Yükseklik-only değişimde iş yapmayıp bu sahte akışı susturuyoruz (mobil scroll
// jank suçlularından biri — bkz. memory: mobil-scroll-jank).
let lastCatalogWidth = import.meta.client ? window.innerWidth : 0;
const onCatalogResize = () => {
  if (window.innerWidth === lastCatalogWidth) return; // yükseklik-only → yoksay
  lastCatalogWidth = window.innerWidth;
  checkMobile();
};

onMounted(() => {
  checkMobile();

  nextTick(() => {
    isCatalogScrolled.value = false;

    requestAnimationFrame(startRowReveal);
  });

  window.addEventListener("resize", onCatalogResize, { passive: true });
  window.addEventListener("scroll", handleCatalogScroll, { passive: true });
  window.addEventListener("keydown", handleProductModalKeydown);
});

onBeforeUnmount(() => {
  if (catalogRowsFrame) {
    cancelAnimationFrame(catalogRowsFrame);
    catalogRowsFrame = 0;
  }

  window.removeEventListener("resize", onCatalogResize);
  window.removeEventListener("scroll", handleCatalogScroll);
  window.removeEventListener("keydown", handleProductModalKeydown);
  resetCatalogModalState();
});

</script>
