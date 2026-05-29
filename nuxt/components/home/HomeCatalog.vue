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
      <path ref="catalogLinePathRef" class="catalog-structural-line-path" />
    </svg>
    <div class="catalog-shell">
      <main
        class="catalog-main"
        :ref="setMainRef"
        @scroll.passive="handleCatalogScroll"
      >
        <div class="catalog-sticky-title" :class="{ 'is-scrolled': isCatalogScrolled }">
          <h1 ref="catalogTitleRef" class="catalog-title">Koleksiyonlar</h1>
        </div>

        <div
          v-for="block in catalogBlocks"
          :key="block.index"
          :ref="setRowRef"
          :data-row-index="block.index"
          class="catalog-row"
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

                <a class="catalog-all-models" href="/catalog">
                  <span class="catalog-tag-part">
                    <span class="catalog-tag-label catalog-tag-label--short">Tümü</span>
                    <span class="catalog-tag-label catalog-tag-label--full">Tüm Modelleri Gör</span>
                    <span class="catalog-tag-line"></span>
                  </span>
                </a>
              </div>
            </transition>
          </div>

          <div class="catalog-card">
            <div class="catalog-card-header">
              <h3 class="catalog-card-title">
                {{ block.cardTitle }} <span>{{ block.seriesLabel }}</span>
              </h3>

              <div class="catalog-card-actions">
                <span class="catalog-card-subtitle">{{ block.description }}</span>

                <NuxtLink class="catalog-learn-more" to="/catalog" aria-label="Tüm modelleri gör">
                  <span class="catalog-learn-more__circle" aria-hidden="true">
                    <span class="catalog-learn-more__icon"></span>
                  </span>
                  <span class="catalog-learn-more__text">Tümü</span>
                </NuxtLink>
              </div>
            </div>

            <transition-group
              name="catalog-list"
              tag="div"
              :css="false"
              class="catalog-product-grid"
              @before-enter="catalogBeforeEnter"
              @enter="catalogEnter"
            >
              <article
                v-for="(item, index) in (visibleRows.includes(block.index) ? getCatalogPreviewProducts(block) : [])"
                :key="'row-' + block.index + '-item-' + item.id"
                :data-index="index + 1"
                class="catalog-product"
                @click="openProductModal(item.productIndex)"
              >
                <div class="catalog-product-image-wrap" @click="openProductModal(item.productIndex)">
                  <img
                    :src="item.image"
                    alt="Kapı Modeli"
                    class="catalog-product-image"
                  >

                  <div
                    class="catalog-like-wrap"
                    :class="{ 'is-menu-open': activeWishlistKey === `${block.index}-${item.id}` }"
                  >
                    <button
                      type="button"
                      class="catalog-like"
                      :class="{ 'is-liked': item.liked }"
                      :aria-label="item.liked ? 'Favorilerden çıkar' : 'Favorilere ekle'"
                      @click.stop.prevent="handleWishlistClick(item.productIndex, `${block.index}-${item.id}`)"
                      @keydown.enter.stop.prevent="handleWishlistClick(item.productIndex, `${block.index}-${item.id}`)"
                      @keydown.space.stop.prevent="handleWishlistClick(item.productIndex, `${block.index}-${item.id}`)"
                    >
                      <svg class="catalog-heart" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>

                    <div
                      class="catalog-wishlist-panel"
                      :class="{ 'is-click-open': activeWishlistKey === `${block.index}-${item.id}` }"
                      role="menu"
                      @mousedown.stop
                      @click.stop
                    >
                      <button type="button" role="menuitem">{{ item.liked ? 'Favorilerden kaldır' : 'Favorilere ekle' }}</button>
                      <button type="button" role="menuitem">Favori listelerim</button>
                      <button type="button" role="menuitem">Yeni favori listesi</button>
                    </div>
                  </div>
                </div>

                <div class="catalog-product-bottom">
                  <div class="catalog-product-info">
                    <p class="catalog-finish">{{ item.finish }}</p>

                    <div class="catalog-code-wrap">
                      <p class="catalog-code">{{ item.seriesTitle }} / {{ item.code }}</p>
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
          </div>
        </div>
      </main>
    </div>
  </section>

  <div
    v-if="activeProduct"
    class="product-modal"
    role="dialog"
    aria-modal="true"
    aria-label="Ürün detayı"
    @click.self="closeProductModal"
  >
    <button type="button" class="product-modal-close" aria-label="Kapat" @click="closeProductModal">×</button>
    <button type="button" class="product-modal-nav product-modal-prev" aria-label="Önceki ürün" @click="showPreviousProduct">
      <svg viewBox="0 0 44 16" aria-hidden="true">
        <line x1="43" y1="8" x2="2" y2="8"></line>
        <polyline points="9,1 2,8 9,15"></polyline>
      </svg>
    </button>
    <button type="button" class="product-modal-nav product-modal-next" aria-label="Sonraki ürün" @click="showNextProduct">
      <svg viewBox="0 0 44 16" aria-hidden="true">
        <line x1="1" y1="8" x2="42" y2="8"></line>
        <polyline points="35,1 42,8 35,15"></polyline>
      </svg>
    </button>

    <div class="product-modal-panel">
      <div class="product-modal-visual">
        <img :src="activeProduct.image" :alt="activeProduct.finish" class="product-modal-image">
      </div>

      <div class="product-modal-content">
        <h2>PBL15/50</h2>
        <div class="product-modal-meta">
          <span>ONE</span>
          <span>Kapı donanımı</span>
          <span>Rozetli kapı kolları</span>
          <span>{{ activeProduct.finish }}</span>
        </div>
        <p class="product-modal-description">
          Masif çift yaylı rozetli kapı kolu, {{ activeProduct.finish }} yüzey seçeneğiyle.
        </p>

        <button type="button" class="product-modal-like" @click.stop="toggleLike(activeProductIndex)">
          <span aria-hidden="true">♥</span>
          {{ activeProduct.liked ? 'Favorilerden kaldır' : 'Favorilere ekle' }}
        </button>

        <div class="product-modal-details">
          <div>
            <h3>Ürün Bilgisi</h3>
            <dl>
              <div><dt>Kod:</dt><dd>{{ activeProduct.code }}</dd></div>
              <div><dt>Birim:</dt><dd>Adet</dd></div>
              <div><dt>Koleksiyon:</dt><dd>ONE</dd></div>
              <div><dt>Tasarımcı:</dt><dd>Güven Karaboğa</dd></div>
            </dl>
          </div>

          <div>
            <h3>Dosyalar</h3>
            <a href="#">Teknik föy</a>
            <a href="#">Ürün fotoğrafı</a>
            <a href="#">Teknik çizim</a>
            <a href="#">Montaj talimatı</a>
          </div>
        </div>

        <div class="product-modal-finishes" aria-label="Yüzey seçenekleri">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { ComponentPublicInstance } from "vue";

const {
  catalogBlocks,
  visibleRows,
  activeProduct,
  activeProductIndex,
  activeWishlistKey,
  getCatalogPreviewProducts,
  toggleLike,
  handleWishlistClick,
  openProductModal,
  closeProductModal,
  showPreviousProduct,
  showNextProduct,
  handleProductModalKeydown,
  resetCatalogModalState
} = useHomeCatalog();

const isCatalogScrolled = ref(false);
const catalogSectionRef = ref<HTMLElement | null>(null);
const catalogTitleRef = ref<HTMLElement | null>(null);
const mainRef = ref<HTMLElement | null>(null);
const rowRefs = ref<HTMLElement[]>([]);
const catalogLineSvgRef = ref<SVGSVGElement | null>(null);
const catalogLinePathRef = ref<SVGPathElement | null>(null);

let catalogRowsFrame = 0;
let catalogObserver: IntersectionObserver | null = null;
let catalogLineFrame = 0;
let catalogLinePathLength = 0;

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
  }
};

const checkCatalogRows = () => {
  catalogRowsFrame = 0;
  const rootEl = mainRef.value;

  if (!rootEl) return;

  const rootRect = rootEl.getBoundingClientRect();
  const revealLine = rootRect.top + rootRect.height * 0.84;

  rowRefs.value.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const rowIndex = parseInt(el.getAttribute("data-row-index") || "0");

    if (rect.top < revealLine && rect.bottom > rootRect.top) {
      revealCatalogRow(rowIndex);
    }
  });
};

const requestCatalogRowCheck = () => {
  if (catalogRowsFrame) return;
  catalogRowsFrame = requestAnimationFrame(checkCatalogRows);
};

const handleCatalogScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  isCatalogScrolled.value = target.scrollTop > 5;
  requestCatalogRowCheck();
};

const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1);

const getDocumentTop = (element: HTMLElement) =>
  window.scrollY + element.getBoundingClientRect().top;

const updateCatalogLineGeometry = () => {
  const section = catalogSectionRef.value;
  const svg = catalogLineSvgRef.value;
  const path = catalogLinePathRef.value;

  if (!section || !svg || !path) return;

  const sectionRect = section.getBoundingClientRect();
  const titleRect = catalogTitleRef.value?.getBoundingClientRect();
  const width = sectionRect.width;
  const height = sectionRect.height + Math.min(Math.max(window.innerHeight * 0.44, 520), 720);
  const lineX = Math.min(Math.max(window.innerWidth * 0.021875, 18), 42);
  const startX = titleRect
    ? titleRect.left - sectionRect.left
    : lineX + Math.min(Math.max(window.innerWidth * 0.22, 280), 420);
  const startY = titleRect
    ? titleRect.top - sectionRect.top - Math.min(Math.max(window.innerHeight * 0.018, 14), 24)
    : Math.min(Math.max(window.innerHeight * 0.14, 120), 170);
  const radius = Math.min(Math.max(window.innerWidth * 0.016667, 28), 32);
  const endY = height - radius - 2;
  const endX = lineX + Math.min(Math.max(window.innerWidth * 0.16, 240), 306);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  path.setAttribute(
    "d",
    `M ${startX} ${startY} H ${lineX + radius} Q ${lineX} ${startY} ${lineX} ${startY + radius} V ${endY - radius} Q ${lineX} ${endY} ${lineX + radius} ${endY} H ${endX}`
  );

  catalogLinePathLength = path.getTotalLength();
  path.style.strokeDasharray = `${catalogLinePathLength}`;
  path.style.strokeDashoffset = `${catalogLinePathLength}`;
};

const updateCatalogLineProgress = () => {
  catalogLineFrame = 0;

  const section = catalogSectionRef.value;
  const path = catalogLinePathRef.value;

  if (!section || !path || !catalogLinePathLength) return;

  const viewportHeight = window.innerHeight || 1;
  const sectionTop = getDocumentTop(section);
  const sectionBottom = sectionTop + section.getBoundingClientRect().height;
  const start = sectionTop - viewportHeight * 0.2;
  const end = sectionBottom - viewportHeight * 0.28;
  const progress = clampProgress((window.scrollY - start) / Math.max(end - start, 1));

  path.style.strokeDashoffset = `${catalogLinePathLength * (1 - progress)}`;
};

const requestCatalogLineProgress = () => {
  if (catalogLineFrame) return;
  catalogLineFrame = requestAnimationFrame(updateCatalogLineProgress);
};

const refreshCatalogLine = () => {
  updateCatalogLineGeometry();
  updateCatalogLineProgress();
};

const initCatalogObserver = () => {
  const rootEl = mainRef.value;

  if (!rootEl) return;

  if (catalogObserver) {
    catalogObserver.disconnect();
  }

  catalogObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const rowIndex = parseInt(entry.target.getAttribute("data-row-index") || "0");

        revealCatalogRow(rowIndex);
        catalogObserver?.unobserve(entry.target);
      }
    });
  }, {
    root: rootEl,
    rootMargin: "0px 0px 42% 0px",
    threshold: 0.01
  });

  rowRefs.value.forEach((el) => {
    catalogObserver?.observe(el);
  });

  requestCatalogRowCheck();
};

onMounted(() => {
  nextTick(() => {
    const catalogMainEl = mainRef.value;
    if (catalogMainEl) {
      catalogMainEl.scrollTop = 0;
      isCatalogScrolled.value = false;
    }

    requestAnimationFrame(() => {
      initCatalogObserver();
      refreshCatalogLine();
    });
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(refreshCatalogLine).catch(() => undefined);
  }

  window.addEventListener("scroll", requestCatalogLineProgress, { passive: true });
  window.addEventListener("resize", refreshCatalogLine, { passive: true });
  window.addEventListener("keydown", handleProductModalKeydown);
});

onBeforeUnmount(() => {
  if (catalogRowsFrame) {
    cancelAnimationFrame(catalogRowsFrame);
    catalogRowsFrame = 0;
  }

  if (catalogObserver) {
    catalogObserver.disconnect();
  }

  if (catalogLineFrame) {
    cancelAnimationFrame(catalogLineFrame);
    catalogLineFrame = 0;
  }

  window.removeEventListener("scroll", requestCatalogLineProgress);
  window.removeEventListener("resize", refreshCatalogLine);
  window.removeEventListener("keydown", handleProductModalKeydown);
  resetCatalogModalState();
});
</script>
