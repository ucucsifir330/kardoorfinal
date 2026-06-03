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
          <stop offset="0.28" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="0.36" />
          <stop offset="0.82" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="1" />
          <stop offset="1" stop-color="var(--catalog-stage-line-fill, #111417)" stop-opacity="1" />
        </linearGradient>
      </defs>
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
                    <span class="catalog-tag-label catalog-tag-label--short">Tümü</span>
                    <span class="catalog-tag-label catalog-tag-label--full">Tüm Modelleri Gör</span>
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
                <div class="catalog-product-image-wrap">
                  <img
                    :src="item.image"
                    alt="Kapı Modeli"
                    class="catalog-product-image"
                    @error="handleCatalogImageError($event, item.localImage)"
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
                  <li><NuxtLink to="/catalog">Tüm Seriyi İncele</NuxtLink></li>
                  <li>Seri Kataloğunu İndir</li>
                  <li>Koleksiyon Teklifi Al</li>
                </ul>
              </div>
            </div>

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
    :aria-label="`${activeProduct.code} ürün detayı`"
    @click.self="closeProductModal"
  >
    <button
      type="button"
      class="product-modal-close"
      aria-label="Kapat"
      @click="closeProductModal"
    >
      ×
    </button>

    <button
      type="button"
      class="product-modal-nav product-modal-prev"
      aria-label="Önceki ürün"
      @click="showPreviousProduct"
    >
      <svg viewBox="0 0 44 16" aria-hidden="true">
        <line x1="43" y1="8" x2="2" y2="8" />
        <polyline points="9,1 2,8 9,15" />
      </svg>
    </button>

    <button
      type="button"
      class="product-modal-nav product-modal-next"
      aria-label="Sonraki ürün"
      @click="showNextProduct"
    >
      <svg viewBox="0 0 44 16" aria-hidden="true">
        <line x1="1" y1="8" x2="42" y2="8" />
        <polyline points="35,1 42,8 35,15" />
      </svg>
    </button>

    <section class="product-modal-panel">
      <div class="product-modal-visual">
        <div class="product-modal-visual-frame">
          <img
            :src="activeProduct.image"
            :alt="activeProduct.finish"
            class="product-modal-image"
            @error="handleCatalogImageError($event, activeProduct.localImage)"
          >
        </div>

        <div class="product-modal-visual-caption">
          <span>{{ activeProduct.code }}</span>
          <span>{{ activeProduct.finish }}</span>
        </div>
      </div>

      <div class="product-modal-content">
        <div class="product-modal-heading">
          <p class="product-modal-kicker">
            {{ activeProduct.series || 'Kardoor Architectural Doors' }}
          </p>

          <h2>{{ activeProduct.code }}</h2>

          <div class="product-modal-meta">
            <span>{{ activeProduct.collection || 'Premium Series' }}</span>
            <span>{{ activeProduct.category || 'Entrance Door System' }}</span>
            <span>{{ activeProduct.finish }}</span>
          </div>
        </div>

        <p class="product-modal-description">
          Güçlendirilmiş gövde yapısı, rafine yüzey seçenekleri ve çağdaş cephe
          estetiğiyle villa, rezidans ve özel mimari projeler için geliştirilen
          premium giriş kapısı sistemi.
        </p>

        <div class="product-modal-actions">
          <button
            type="button"
            class="product-modal-like"
            @click.stop="toggleLike(activeProductIndex)"
          >
            <span aria-hidden="true">♥</span>
            {{ activeProduct.liked ? 'Favorilerden kaldır' : 'Favorilere ekle' }}
          </button>

          <NuxtLink class="product-modal-quote" to="/request-quote">
            Teklif al
          </NuxtLink>
        </div>

        <div class="product-modal-details">
          <div class="product-modal-info-block">
            <h3>Ürün Bilgisi</h3>

            <dl>
              <div>
                <dt>Kod</dt>
                <dd>{{ activeProduct.code }}</dd>
              </div>

              <div>
                <dt>Seri</dt>
                <dd>{{ activeProduct.series || 'Premium' }}</dd>
              </div>

              <div>
                <dt>Yüzey</dt>
                <dd>{{ activeProduct.finish }}</dd>
              </div>

              <div>
                <dt>Sistem</dt>
                <dd>{{ activeProduct.system || 'Çelik / Alüminyum kapı sistemi' }}</dd>
              </div>

              <div>
                <dt>Kullanım</dt>
                <dd>Villa, rezidans, proje ve özel mimari girişler</dd>
              </div>
            </dl>
          </div>

          <div class="product-modal-info-block">
            <h3>Dosyalar</h3>

            <div class="product-modal-files">
              <a href="#">Teknik föy</a>
              <a href="#">Ürün görseli</a>
              <a href="#">Teknik çizim</a>
              <a href="#">Montaj detayı</a>
            </div>
          </div>
        </div>

        <div class="product-modal-specs">
          <div>
            <span>01</span>
            <strong>Güçlendirilmiş gövde</strong>
          </div>

          <div>
            <span>02</span>
            <strong>Projeye özel ölçü</strong>
          </div>

          <div>
            <span>03</span>
            <strong>Mimari yüzey seçenekleri</strong>
          </div>
        </div>

        <div class="product-modal-finishes" aria-label="Yüzey seçenekleri">
          <button type="button" style="--finish: #111111" aria-label="Siyah yüzey"></button>
          <button type="button" style="--finish: #2f3335" aria-label="Antrasit yüzey"></button>
          <button type="button" style="--finish: #7a6f5f" aria-label="Bronz yüzey"></button>
          <button type="button" style="--finish: #f3f0e9" aria-label="Açık yüzey"></button>
          <button type="button" style="--finish: #c99354" aria-label="Pirinç yüzey"></button>
          <button type="button" class="is-metal" aria-label="Metal yüzey"></button>
        </div>
      </div>
    </section>
  </div>
  </template>

<script setup lang="ts">
import { gsap } from "gsap";
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
const catalogLineGradientRef = ref<SVGLinearGradientElement | null>(null);

let catalogRowsFrame = 0;
let catalogObserver: IntersectionObserver | null = null;
let catalogLineFrame = 0;
let catalogLinePathLength = 0;
let catalogHeadingLineConnected = false;

// --- LIQUID MENU STATE & LOGIC ---
const activeLiquidCard = ref<string | null>(null);
const liquidMenuExpanded = ref<Record<string, boolean>>({});
const blobPaths = ref<Record<string, SVGPathElement>>({});
const blobContainers = ref<Record<string, SVGSVGElement>>({});
const hamburgers = ref<Record<string, HTMLElement>>({});

const setBlobPathRef = (el: any, id: string) => { if (el) blobPaths.value[id] = el as SVGPathElement; };
const setBlobContainerRef = (el: any, id: string) => { if (el) blobContainers.value[id] = el as SVGSVGElement; };
const setHamburgerRef = (el: any, id: string) => { if (el) hamburgers.value[id] = el as HTMLElement; };

let liquidRaf: number | null = null;
let l_x = 0, l_y = 0;
let l_pull = 0;
let l_curveX = 60, l_curveY = 0;
let l_targetX = 0;
let l_xIter = 0, l_yIter = 0;
let l_height = 190;
const blobBaseWidth = 60;
const blobHoverWidth = 34;
const blobRestPath = (height: number) => `M${blobBaseWidth},${height} H0 V0 h${blobBaseWidth} V${height} z`;
const clampLiquidPull = (value: number) => Math.min(Math.max(value, 0), 1);

const resetLiquidShape = (id: string) => {
  const path = blobPaths.value[id];
  const container = blobContainers.value[id];
  const hamburger = hamburgers.value[id];
  const height = container?.getBoundingClientRect().height || l_height;

  l_pull = 0;
  if (path) path.setAttribute('d', blobRestPath(height));
  if (container) container.style.width = `${blobBaseWidth}px`;
  if (hamburger) {
    hamburger.style.setProperty('--hamburger-shift', '0px');
    hamburger.style.setProperty('--hamburger-lift', '0px');
  }
};

const easeOutExpo = (currentIteration: number, startValue: number, changeInValue: number, totalIterations: number) => {
  return changeInValue * (-Math.pow(2, -10 * currentIteration / totalIterations) + 1) + startValue;
};

const updateLiquidSvg = () => {
  if (!activeLiquidCard.value) {
    liquidRaf = null;
    return;
  }

  const id = activeLiquidCard.value;
  const path = blobPaths.value[id];
  const container = blobContainers.value[id];
  const hamburger = hamburgers.value[id];

  if (!path || !container || !hamburger) {
    liquidRaf = requestAnimationFrame(updateLiquidSvg);
    return;
  }

  if (liquidMenuExpanded.value[id]) {
    resetLiquidShape(id);
    liquidRaf = null;
    return;
  }

  l_targetX = blobBaseWidth + blobHoverWidth * l_pull;

  if (Math.abs(l_curveX - l_targetX) < 1) l_xIter = 0;
  else l_xIter++;

  // Vertical tension physics
  if (Math.abs(l_curveY - l_y) < 1) l_yIter = 0;
  else l_yIter++;

  l_curveX = easeOutExpo(l_xIter, l_curveX, l_targetX - l_curveX, 100);
  l_curveY = easeOutExpo(l_yIter, l_curveY, l_y - l_curveY, 100);

  const anchorDistance = Math.min(76, Math.max(62, l_height * 0.34));
  const curviness = anchorDistance * 0.56;
  const safeCurveY = Math.min(Math.max(l_curveY, anchorDistance), l_height - anchorDistance);
  const shoulderTop = safeCurveY - anchorDistance;
  const shoulderBottom = safeCurveY + anchorDistance;

  const newCurve = `M0,0H${blobBaseWidth}V${shoulderTop}C${blobBaseWidth},${shoulderTop + curviness} ${l_curveX},${safeCurveY - curviness} ${l_curveX},${safeCurveY}C${l_curveX},${safeCurveY + curviness} ${blobBaseWidth},${shoulderBottom - curviness} ${blobBaseWidth},${shoulderBottom}V${l_height}H0Z`;

  path.setAttribute('d', newCurve);
  container.style.width = `${Math.max(blobBaseWidth, l_curveX)}px`;
  const curvePull = clampLiquidPull((l_curveX - blobBaseWidth) / blobHoverWidth);
  const hamburgerShift = curvePull * 11;
  const hamburgerLift = curvePull * -0.8;
  hamburger.style.setProperty('--hamburger-shift', `${hamburgerShift}px`);
  hamburger.style.setProperty('--hamburger-lift', `${hamburgerLift}px`);

  liquidRaf = requestAnimationFrame(updateLiquidSvg);
};

const handleLiquidMouseMove = (e: MouseEvent, id: string) => {
  if (liquidMenuExpanded.value[id]) {
    resetLiquidShape(id);
    return;
  }

  const target = e.currentTarget as HTMLElement;
  const container = blobContainers.value[id];
  const hamburger = hamburgers.value[id];
  if (!container) return;
  const blobRect = container.getBoundingClientRect();
  const centerX = hamburger
    ? hamburger.getBoundingClientRect().left + hamburger.getBoundingClientRect().width / 2
    : target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2;
  l_x = e.clientX - centerX;
  l_pull = clampLiquidPull(l_x / 72);
  l_y = Math.max(0, Math.min(blobRect.height, e.clientY - blobRect.top));
  l_height = blobRect.height;

  if (activeLiquidCard.value !== id) {
    activeLiquidCard.value = id;
    l_curveY = l_y;
    l_xIter = 0;
    l_yIter = 0;
    l_curveX = blobBaseWidth;
  }

  if (!liquidRaf) {
    liquidRaf = requestAnimationFrame(updateLiquidSvg);
  }
};

const handleLiquidEnter = (id: string, e: MouseEvent) => {
  if (liquidMenuExpanded.value[id]) {
    resetLiquidShape(id);
    return;
  }

  activeLiquidCard.value = id;
  const container = blobContainers.value[id];

  if (container) {
    const rect = container.getBoundingClientRect();
    l_height = rect.height;
    l_y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    l_curveY = l_y;
  }

  l_xIter = 0;
  l_yIter = 0;
  l_pull = 0;
  l_curveX = blobBaseWidth;

  if (!liquidRaf) {
    liquidRaf = requestAnimationFrame(updateLiquidSvg);
  }
};

const handleLiquidCardMouseMove = (e: MouseEvent, id: string) => {
  const target = e.target as HTMLElement;
  if (target.closest(".liquid-menu, .hamburger")) return;

  const card = e.currentTarget as HTMLElement;
  const rect = card.getBoundingClientRect();
  const distanceFromRight = rect.right - e.clientX;

  if (distanceFromRight > 320) {
    liquidMenuExpanded.value[id] = false;
  }
};

const handleLiquidMenuClick = (e: MouseEvent, id: string) => {
  const target = e.target as HTMLElement;
  if (target.closest(".liquid-menu-inner")) return;
  toggleLiquidMenu(id);
};

const handleLiquidLeave = (id: string) => {
  if (activeLiquidCard.value === id) {
    activeLiquidCard.value = null;
    if (liquidRaf) {
      cancelAnimationFrame(liquidRaf);
      liquidRaf = null;
    }

    resetLiquidShape(id);
  }
};

const expandLiquidMenu = (id: string) => { liquidMenuExpanded.value[id] = true; };
const collapseLiquidMenu = (id: string) => { liquidMenuExpanded.value[id] = false; };
const toggleLiquidMenu = (id: string) => {
  liquidMenuExpanded.value[id] = !liquidMenuExpanded.value[id];

  if (liquidMenuExpanded.value[id]) {
    activeLiquidCard.value = id;
    if (liquidRaf) {
      cancelAnimationFrame(liquidRaf);
      liquidRaf = null;
    }
    resetLiquidShape(id);
  }
};
// --- END LIQUID MENU LOGIC ---


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

const handleCatalogMagnetMove = (event: MouseEvent) => {
  const zone = event.currentTarget as HTMLElement;
  const target = zone.querySelector<HTMLElement>(".catalog-tag-part, .catalog-learn-more__circle") || zone;
  const rect = zone.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const radius = Math.min(Math.max(Math.max(rect.width, rect.height) / 2, 58), 86);
  const distance = Math.hypot(dx, dy);

  if (distance > radius) {
    handleCatalogMagnetLeave(event);
    return;
  }

  const pull = 1 - distance / radius;

  gsap.to(target, {
    x: dx * 0.28 * pull,
    y: dy * 0.28 * pull,
    rotate: dx * 0.045 * pull,
    scale: 1 + pull * 0.045,
    duration: 0.85,
    ease: "power3.out",
    overwrite: "auto"
  });
};

const handleCatalogMagnetLeave = (event: MouseEvent) => {
  const zone = event.currentTarget as HTMLElement;
  const target = zone.querySelector<HTMLElement>(".catalog-tag-part, .catalog-learn-more__circle") || zone;

  gsap.to(target, {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    duration: 0.36,
    ease: "elastic.out(1, 0.45)",
    overwrite: true
  });
};

const handleCatalogImageError = (event: Event, fallbackSrc?: string) => {
  if (!fallbackSrc) return;

  const image = event.currentTarget as HTMLImageElement | null;
  if (!image || image.src.endsWith(fallbackSrc)) return;

  image.onerror = null;
  image.src = fallbackSrc;
};

const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1);

const getLayoutDocumentTop = (element: HTMLElement) => {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return top;
};

const updateCatalogLineGeometry = () => {
  const section = catalogSectionRef.value;
  const svg = catalogLineSvgRef.value;
  const path = catalogLinePathRef.value;
  const gradient = catalogLineGradientRef.value;

  if (!section || !svg || !path) return;

  const sectionRect = section.getBoundingClientRect();
  const firstRowRect = rowRefs.value[0]?.getBoundingClientRect();
  const width = sectionRect.width;
  const height = sectionRect.height + Math.min(Math.max(window.innerHeight * 0.44, 520), 720);
  const lineX = Math.min(Math.max(window.innerWidth * 0.021875, 18), 42);
  const startY = firstRowRect
    ? firstRowRect.top - sectionRect.top + Math.min(Math.max(window.innerHeight * 0.012, 8), 16)
    : Math.min(Math.max(window.innerHeight * 0.14, 120), 170);
  const radius = Math.min(Math.max(window.innerWidth * 0.016667, 28), 32);
  const endY = height - radius - 2;
  const endX = lineX + Math.min(Math.max(window.innerWidth * 0.16, 240), 306);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  if (gradient) {
    gradient.setAttribute("x1", `${lineX}`);
    gradient.setAttribute("x2", `${lineX}`);
    gradient.setAttribute("y1", `${startY}`);
    gradient.setAttribute("y2", `${startY + Math.min(Math.max(window.innerHeight * 0.08, 58), 92)}`);
  }
  path.setAttribute(
    "d",
    `M ${lineX} ${startY} V ${endY - radius} Q ${lineX} ${endY} ${lineX + radius} ${endY} H ${endX}`
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
  const sectionTop = getLayoutDocumentTop(section);
  const sectionBottom = sectionTop + section.offsetHeight;
  const start = sectionTop - viewportHeight * 0.2;
  const end = sectionBottom - viewportHeight * 0.28;
  const progress = clampProgress((window.scrollY - start) / Math.max(end - start, 1));

  path.style.strokeDashoffset = `${catalogLinePathLength * (1 - progress)}`;

  if (progress >= 0.965 && !catalogHeadingLineConnected) {
    catalogHeadingLineConnected = true;
    window.dispatchEvent(new CustomEvent("kardoor:heading-line-connected"));
  } else if (progress < 0.82 && catalogHeadingLineConnected) {
    catalogHeadingLineConnected = false;
    window.dispatchEvent(new CustomEvent("kardoor:heading-line-reset"));
  }
};

const requestCatalogLineProgress = () => {
  if (catalogLineFrame) return;

  const section = catalogSectionRef.value;
  if (section) {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;

    if (rect.bottom < -240) {
      if (catalogLinePathLength && catalogLinePathRef.value) {
        catalogLinePathRef.value.style.strokeDashoffset = "0";
      }
      if (!catalogHeadingLineConnected) {
        catalogHeadingLineConnected = true;
        window.dispatchEvent(new CustomEvent("kardoor:heading-line-connected"));
      }
      return;
    }

    if (rect.top > viewportHeight + 240) return;
  }

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
  window.dispatchEvent(new CustomEvent("kardoor:heading-line-reset"));
  resetCatalogModalState();
});
</script>
