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
        @scroll.passive="handleCatalogScroll"
      >
        <div class="catalog-sticky-title" :class="{ 'is-scrolled': isCatalogScrolled }">
          <h1 ref="catalogTitleRef" class="catalog-title">{{ catalogCopy.title }}</h1>
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

                  <div
                    class="catalog-like-wrap"
                    :class="{ 'is-menu-open': activeWishlistKey === `${block.index}-${item.id}` }"
                  >
                    <button
                      type="button"
                      class="catalog-like"
                      :class="{ 'is-liked': item.liked }"
                      :aria-label="item.liked ? catalogCopy.favorite.removeAria : catalogCopy.favorite.addAria"
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
                      <button type="button" role="menuitem">{{ item.liked ? catalogCopy.favorite.remove : catalogCopy.favorite.add }}</button>
                      <button type="button" role="menuitem">{{ catalogCopy.favorite.lists }}</button>
                      <button type="button" role="menuitem">{{ catalogCopy.favorite.newList }}</button>
                    </div>
                  </div>
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

  <Teleport to="body">
  <div
    v-if="activeProduct"
    class="product-modal"
    role="dialog"
    aria-modal="true"
    :aria-label="`${activeProduct.code} ${catalogCopy.modal.productDetail}`"
    @click.self="closeProductModal"
  >
    <button
      type="button"
      class="product-modal-close"
      :aria-label="catalogCopy.modal.close"
      @click="closeProductModal"
    >
      ×
    </button>

    <button
      type="button"
      class="product-modal-nav product-modal-prev"
      :aria-label="catalogCopy.modal.previous"
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
      :aria-label="catalogCopy.modal.next"
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
            {{ localizedActiveProductSeries || catalogCopy.modal.seriesFallback }}
          </p>

          <h2>{{ activeProduct.code }}</h2>

          <div class="product-modal-meta">
            <span>{{ localizedActiveProductCollection || catalogCopy.modal.collectionFallback }}</span>
            <span>{{ localizedActiveProductCategory || catalogCopy.modal.categoryFallback }}</span>
            <span>{{ activeProduct.finish }}</span>
          </div>
        </div>

        <p class="product-modal-description">
          {{ catalogCopy.modal.description }}
        </p>

        <div class="product-modal-actions">
          <button
            type="button"
            class="product-modal-like"
            @click.stop="toggleLike(activeProductIndex)"
          >
            <span aria-hidden="true">♥</span>
            {{ activeProduct.liked ? catalogCopy.favorite.remove : catalogCopy.favorite.add }}
          </button>

          <NuxtLink class="product-modal-quote" to="/contact">
            {{ catalogCopy.modal.quote }}
          </NuxtLink>
        </div>

        <div class="product-modal-details">
          <div class="product-modal-info-block">
            <h3>{{ catalogCopy.modal.infoTitle }}</h3>

            <dl>
              <div>
                <dt>{{ catalogCopy.modal.fields.code }}</dt>
                <dd>{{ activeProduct.code }}</dd>
              </div>

              <div>
                <dt>{{ catalogCopy.modal.fields.series }}</dt>
                <dd>{{ localizedActiveProductSeries || catalogCopy.modal.collectionFallback }}</dd>
              </div>

              <div>
                <dt>{{ catalogCopy.modal.fields.finish }}</dt>
                <dd>{{ activeProduct.finish }}</dd>
              </div>

              <div>
                <dt>{{ catalogCopy.modal.fields.system }}</dt>
                <dd>{{ localizedActiveProductSystem || catalogCopy.modal.systemFallback }}</dd>
              </div>

              <div>
                <dt>{{ catalogCopy.modal.fields.usage }}</dt>
                <dd>{{ catalogCopy.modal.usage }}</dd>
              </div>
            </dl>
          </div>

          <div class="product-modal-info-block">
            <h3>{{ catalogCopy.modal.filesTitle }}</h3>

            <div class="product-modal-files">
              <a href="#">{{ catalogCopy.modal.files.specSheet }}</a>
              <a href="#">{{ catalogCopy.modal.files.productImage }}</a>
              <a href="#">{{ catalogCopy.modal.files.drawing }}</a>
              <a href="#">{{ catalogCopy.modal.files.installation }}</a>
            </div>
          </div>
        </div>

        <div class="product-modal-specs">
          <div>
            <span>01</span>
            <strong>{{ catalogCopy.modal.specs.body }}</strong>
          </div>

          <div>
            <span>02</span>
            <strong>{{ catalogCopy.modal.specs.customSize }}</strong>
          </div>

          <div>
            <span>03</span>
            <strong>{{ catalogCopy.modal.specs.finishes }}</strong>
          </div>
        </div>

        <div class="product-modal-finishes" :aria-label="catalogCopy.modal.finishesAria">
          <button type="button" style="--finish: #111111" :aria-label="catalogCopy.modal.finishLabels.black"></button>
          <button type="button" style="--finish: #2f3335" :aria-label="catalogCopy.modal.finishLabels.anthracite"></button>
          <button type="button" style="--finish: #7a6f5f" :aria-label="catalogCopy.modal.finishLabels.bronze"></button>
          <button type="button" style="--finish: #f3f0e9" :aria-label="catalogCopy.modal.finishLabels.light"></button>
          <button type="button" style="--finish: #c99354" :aria-label="catalogCopy.modal.finishLabels.brass"></button>
          <button type="button" class="is-metal" :aria-label="catalogCopy.modal.finishLabels.metal"></button>
        </div>
      </div>
    </section>
  </div>
  </Teleport>
  </template>

<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { ComponentPublicInstance } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

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

const { locale } = useKardoorLocale();

const catalogCopies: Record<string, any> = {
  tr: {
    title: "Koleksiyonlar",
    allShort: "Tümü",
    allFull: "Tüm Modelleri Gör",
    productImageAlt: "Kapı modeli",
    actions: {
      viewSeries: "Tüm Seriyi İncele",
      downloadCatalog: "Seri Kataloğunu İndir",
      requestOffer: "Koleksiyon Teklifi Al"
    },
    favorite: {
      add: "Favorilere ekle",
      remove: "Favorilerden kaldır",
      addAria: "Favorilere ekle",
      removeAria: "Favorilerden çıkar",
      lists: "Favori listelerim",
      newList: "Yeni favori listesi"
    },
    blocks: {
      1: {
        seriesLabel: "Seri 01",
        shortName: "Alüminyum",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "frame", short: "Kasa Seri", full: "Alüminyum Kasa Seri" },
          { id: "leaf", short: "Kanat Seri", full: "Alüminyum Kasa ve Kanat Seri" }
        ],
        cardTitle: "Alüminyum Sistemler",
        description: "dış iklim uyumlu kapı sistemleri"
      },
      2: {
        seriesLabel: "Seri 02",
        shortName: "Doğal",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "wood", short: "Wood Seri", full: "Termo Wood Seri" },
          { id: "stone", short: "Taş Seri", full: "Doğal Taş Seri" }
        ],
        cardTitle: "Doğal Yüzeyler",
        description: "wood ve taş dokulu kapı yüzeyleri"
      },
      3: {
        seriesLabel: "Seri 03",
        shortName: "Cam",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "mixed-glass", short: "Karma", full: "Karma Cam Seri" },
          { id: "tempered-glass", short: "Temperli", full: "Temperli Cam Seri" }
        ],
        cardTitle: "Camlı Modeller",
        description: "cam detaylı dış kapı çözümleri"
      },
      4: {
        seriesLabel: "Seri 04",
        shortName: "Metal",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "composite", short: "Kompozit", full: "Kompozit Seri" },
          { id: "sheet-metal", short: "Sac", full: "Komple Sac Metal Seri" }
        ],
        cardTitle: "Metal & Kompozit",
        description: "dayanıklı metal ve kompozit modeller"
      },
      5: {
        seriesLabel: "Seri 05",
        shortName: "Laminoks",
        category: { short: "Exclusive", full: "Exclusive Modeller" },
        parts: [
          { id: "lux-pvc", short: "PVC", full: "Lüks PVC Seri" },
          { id: "elit-laminox", short: "Elit", full: "Elit Laminoks Seri" },
          { id: "rustic-laminox", short: "Rustik", full: "Rustik Laminoks Seri" }
        ],
        cardTitle: "PVC & Laminoks",
        description: "exclusive kaplama seçenekleri"
      },
      6: {
        seriesLabel: "Seri 06",
        shortName: "Mimari",
        category: { short: "Exclusive", full: "Exclusive Modeller" },
        parts: [
          { id: "project-custom", short: "Özel", full: "Projeye Özel Seri" },
          { id: "pivot", short: "Pivot", full: "Pivot Seri" }
        ],
        cardTitle: "Mimari Özel",
        description: "projeye özel ve pivot çözümler"
      },
      7: {
        seriesLabel: "Seri 07",
        shortName: "Teknik",
        category: { short: "Çözümler", full: "Teknik Çözümler" },
        parts: [
          { id: "villa-building-entry", short: "Giriş", full: "Villa ve Bina Giriş Seri" },
          { id: "emergency-exit", short: "Acil", full: "Acil Çıkış Seri" },
          { id: "shaft-cover", short: "Şaft", full: "Bina Şaft Kapakları Seri" }
        ],
        cardTitle: "Giriş & Teknik",
        description: "giriş, acil çıkış ve şaft sistemleri"
      }
    },
    modal: {
      productDetail: "ürün detayı",
      close: "Kapat",
      previous: "Önceki ürün",
      next: "Sonraki ürün",
      seriesFallback: "Kardoor Mimari Kapılar",
      collectionFallback: "Premium Seri",
      categoryFallback: "Giriş Kapısı Sistemi",
      description:
        "Güçlendirilmiş gövde yapısı, rafine yüzey seçenekleri ve çağdaş cephe estetiğiyle villa, rezidans ve özel mimari projeler için geliştirilen premium giriş kapısı sistemi.",
      quote: "Teklif al",
      infoTitle: "Ürün Bilgisi",
      fields: {
        code: "Kod",
        series: "Seri",
        finish: "Yüzey",
        system: "Sistem",
        usage: "Kullanım"
      },
      systemFallback: "Çelik / Alüminyum kapı sistemi",
      usage: "Villa, rezidans, proje ve özel mimari girişler",
      filesTitle: "Dosyalar",
      files: {
        specSheet: "Teknik föy",
        productImage: "Ürün görseli",
        drawing: "Teknik çizim",
        installation: "Montaj detayı"
      },
      specs: {
        body: "Güçlendirilmiş gövde",
        customSize: "Projeye özel ölçü",
        finishes: "Mimari yüzey seçenekleri"
      },
      finishesAria: "Yüzey seçenekleri",
      finishLabels: {
        black: "Siyah yüzey",
        anthracite: "Antrasit yüzey",
        bronze: "Bronz yüzey",
        light: "Açık yüzey",
        brass: "Pirinç yüzey",
        metal: "Metal yüzey"
      }
    }
  },
  en: {
    title: "Collections",
    allShort: "All",
    allFull: "View All Models",
    productImageAlt: "Door model",
    actions: {
      viewSeries: "Explore the Full Series",
      downloadCatalog: "Download Series Catalogue",
      requestOffer: "Request a Collection Proposal"
    },
    favorite: {
      add: "Add to favourites",
      remove: "Remove from favourites",
      addAria: "Add to favourites",
      removeAria: "Remove from favourites",
      lists: "My favourite lists",
      newList: "New favourite list"
    },
    blocks: {
      1: {
        seriesLabel: "Series 01",
        shortName: "Aluminium",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "frame", short: "Frame Series", full: "Aluminium Frame Series" },
          { id: "leaf", short: "Leaf Series", full: "Aluminium Frame and Leaf Series" }
        ],
        cardTitle: "Aluminium Systems",
        description: "door systems engineered for exterior climates"
      },
      2: {
        seriesLabel: "Series 02",
        shortName: "Natural",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "wood", short: "Wood Series", full: "Thermo Wood Series" },
          { id: "stone", short: "Stone Series", full: "Natural Stone Series" }
        ],
        cardTitle: "Natural Surfaces",
        description: "wood and stone textured architectural door surfaces"
      },
      3: {
        seriesLabel: "Series 03",
        shortName: "Glass",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "mixed-glass", short: "Mixed", full: "Mixed Glass Series" },
          { id: "tempered-glass", short: "Tempered", full: "Tempered Glass Series" }
        ],
        cardTitle: "Glazed Models",
        description: "exterior door solutions refined with glass detailing"
      },
      4: {
        seriesLabel: "Series 04",
        shortName: "Metal",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "composite", short: "Composite", full: "Composite Series" },
          { id: "sheet-metal", short: "Sheet Metal", full: "Full Sheet Metal Series" }
        ],
        cardTitle: "Metal & Composite",
        description: "resilient metal and composite entrance models"
      },
      5: {
        seriesLabel: "Series 05",
        shortName: "Laminox",
        category: { short: "Exclusive", full: "Exclusive Models" },
        parts: [
          { id: "lux-pvc", short: "PVC", full: "Luxury PVC Series" },
          { id: "elit-laminox", short: "Elite", full: "Elite Laminox Series" },
          { id: "rustic-laminox", short: "Rustic", full: "Rustic Laminox Series" }
        ],
        cardTitle: "PVC & Laminox",
        description: "exclusive architectural cladding options"
      },
      6: {
        seriesLabel: "Series 06",
        shortName: "Architectural",
        category: { short: "Exclusive", full: "Exclusive Models" },
        parts: [
          { id: "project-custom", short: "Bespoke", full: "Project-Specific Series" },
          { id: "pivot", short: "Pivot", full: "Pivot Series" }
        ],
        cardTitle: "Architectural Bespoke",
        description: "project-specific and pivot door solutions"
      },
      7: {
        seriesLabel: "Series 07",
        shortName: "Technical",
        category: { short: "Solutions", full: "Technical Solutions" },
        parts: [
          { id: "villa-building-entry", short: "Entrance", full: "Villa and Building Entrance Series" },
          { id: "emergency-exit", short: "Exit", full: "Emergency Exit Series" },
          { id: "shaft-cover", short: "Shaft", full: "Building Shaft Cover Series" }
        ],
        cardTitle: "Entrance & Technical",
        description: "entrance, emergency exit, and shaft systems"
      }
    },
    modal: {
      productDetail: "product detail",
      close: "Close",
      previous: "Previous product",
      next: "Next product",
      seriesFallback: "Kardoor Architectural Doors",
      collectionFallback: "Premium Series",
      categoryFallback: "Entrance Door System",
      description:
        "A premium entrance door system developed for villas, residences, and bespoke architectural projects with a reinforced body, refined surface options, and a contemporary facade presence.",
      quote: "Request a quote",
      infoTitle: "Product Information",
      fields: {
        code: "Code",
        series: "Series",
        finish: "Finish",
        system: "System",
        usage: "Use"
      },
      systemFallback: "Steel / aluminium door system",
      usage: "Villas, residences, projects, and bespoke architectural entrances",
      filesTitle: "Files",
      files: {
        specSheet: "Technical sheet",
        productImage: "Product image",
        drawing: "Technical drawing",
        installation: "Installation detail"
      },
      specs: {
        body: "Reinforced body",
        customSize: "Project-specific sizing",
        finishes: "Architectural finish options"
      },
      finishesAria: "Finish options",
      finishLabels: {
        black: "Black finish",
        anthracite: "Anthracite finish",
        bronze: "Bronze finish",
        light: "Light finish",
        brass: "Brass finish",
        metal: "Metal finish"
      }
    }
  }
};

const catalogCopy = computed(() => catalogCopies[locale.value] ?? catalogCopies.tr);
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
const catalogLineSvgRef = ref<SVGSVGElement | null>(null);
const catalogLinePathRef = ref<SVGPathElement | null>(null);
const catalogLineGradientRef = ref<SVGLinearGradientElement | null>(null);

let catalogRowsFrame = 0;
let catalogObserver: IntersectionObserver | null = null;
let catalogLineST: ScrollTrigger | null = null;
let catalogLinePathLength = 0;
let catalogHeadingLineConnected = false;
let catalogLineRefreshTimer = 0;
let catalogLineRevealAllowed = false;

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

  // Viewport-based reveal (was keyed off the tall .catalog-main, which revealed
  // every row at once). Only reveal rows that are at/near the viewport so the
  // door images load in batches as you scroll down.
  const vh = window.innerHeight;
  const revealLine = vh * 1.85;

  rowRefs.value.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const rowIndex = parseInt(el.getAttribute("data-row-index") || "0");

    if (rect.top < revealLine && rect.bottom > -vh * 0.1) {
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

const updateCatalogLineGeometry = () => {
  const section = catalogSectionRef.value;
  const svg = catalogLineSvgRef.value;
  const path = catalogLinePathRef.value;
  const gradient = catalogLineGradientRef.value;

  if (!section || !svg || !path) return;

  const sectionRect = section.getBoundingClientRect();
  const firstRowRect = rowRefs.value[0]?.getBoundingClientRect();
  const finalRowRect = rowRefs.value[rowRefs.value.length - 1]?.getBoundingClientRect();
  const width = sectionRect.width;
  const height = sectionRect.height;
  const lineX = Math.min(Math.max(window.innerWidth * 0.021875, 18), 42);
  const startY = firstRowRect
    ? firstRowRect.top - sectionRect.top + Math.min(Math.max(window.innerHeight * 0.012, 8), 16)
    : Math.min(Math.max(window.innerHeight * 0.14, 120), 170);
  const endY = finalRowRect
    ? Math.max(startY, finalRowRect.bottom - sectionRect.top)
    : height;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  if (gradient) {
    gradient.setAttribute("x1", `${lineX}`);
    gradient.setAttribute("x2", `${lineX}`);
    gradient.setAttribute("y1", `${startY}`);
    gradient.setAttribute("y2", `${endY}`);
  }
  path.setAttribute(
    "d",
    `M ${lineX} ${startY} V ${endY}`
  );

  catalogLinePathLength = path.getTotalLength();
  path.style.strokeDasharray = `${catalogLinePathLength}`;
  path.style.strokeDashoffset = `${catalogLinePathLength}`;
};

const drawCatalogLine = (progress: number) => {
  const path = catalogLinePathRef.value;
  if (!path || !catalogLinePathLength) return;

  const value = clampProgress(progress);
  path.style.strokeDashoffset = `${catalogLinePathLength * (1 - value)}`;

  if (value >= 0.965 && !catalogHeadingLineConnected) {
    catalogHeadingLineConnected = true;
    window.dispatchEvent(new CustomEvent("kardoor:heading-line-connected"));
  } else if (value < 0.82 && catalogHeadingLineConnected) {
    catalogHeadingLineConnected = false;
    window.dispatchEvent(new CustomEvent("kardoor:heading-line-reset"));
  }
};

// Drive the structural line from a GSAP ScrollTrigger so it samples the exact
// same smoothed playhead as ScrollSmoother. The old engine read the raw
// (un-smoothed) window.scrollY on a manual rAF loop, so the line raced the
// lagged content and felt janky. start/end mirror the previous math:
//   progress 0 at sectionTop - 0.2vh  -> trigger top at 20% of the viewport
//   progress 1 at sectionBottom - 0.28vh -> trigger bottom at 28% of the viewport
const buildCatalogLineTrigger = () => {
  const section = catalogSectionRef.value;
  if (!section) return;

  catalogLineST?.kill();
  catalogLineST = ScrollTrigger.create({
    trigger: section,
    start: "top 20%",
    end: "bottom 28%",
    onUpdate: (self) => drawCatalogLine(self.progress),
    onRefresh: (self) => drawCatalogLine(self.progress),
    onLeave: () => drawCatalogLine(1),
    onLeaveBack: () => drawCatalogLine(0)
  });
};

const refreshCatalogLine = () => {
  updateCatalogLineGeometry();

  if (catalogLineST) {
    catalogLineST.refresh();
  } else {
    buildCatalogLineTrigger();
  }

  if (catalogLineST) drawCatalogLine(catalogLineST.progress);

  // Reveal only after the line is allowed to show (fonts ready). Every reveal
  // pass keeps it visible; because the path stays hidden until the first
  // settled geometry, early reveal-driven geometry changes (rows mounting via
  // v-if, which grow the container and shift startY/endY) are applied while the
  // line is invisible — so no visible jump / bounce.
  if (catalogLineRevealAllowed) {
    catalogLineSvgRef.value?.classList.add("is-line-ready");
  }
};

// Called once the layout is stable enough to start showing the line (fonts
// loaded). We wait one more beat past any pending reveal-driven refresh
// (scheduleCatalogLineRefresh uses a 180ms debounce) so the initial batch of
// rows has mounted and grown the container before the path becomes visible.
// Otherwise the line shows, then a trailing reveal-refresh shifts startY/endY
// and it visibly jumps once.
const allowCatalogLineReveal = () => {
  window.setTimeout(() => {
    catalogLineRevealAllowed = true;
    nextTick(() => {
      window.requestAnimationFrame(refreshCatalogLine);
    });
  }, 220);
};

const scheduleCatalogLineRefresh = () => {
  window.clearTimeout(catalogLineRefreshTimer);
  catalogLineRefreshTimer = window.setTimeout(() => {
    catalogLineRefreshTimer = 0;
    nextTick(() => {
      window.requestAnimationFrame(refreshCatalogLine);
    });
  }, 180);
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
    // Observe against the VIEWPORT (not the tall .catalog-main container). With
    // root=main every row counted as intersecting at once, so all 7 rows + ~68
    // door images mounted/loaded together on first paint. Viewport root reveals
    // rows — and loads their door images — progressively as you scroll down.
    root: null,
    rootMargin: "0px 0px 85% 0px",
    threshold: 0.01
  });

  rowRefs.value.forEach((el) => {
    catalogObserver?.observe(el);
  });

  revealCatalogRow(1);
  requestCatalogRowCheck();
};

const checkMobile = () => { isMobile.value = window.innerWidth <= 760; };

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile, { passive: true });

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
    document.fonts.ready.then(allowCatalogLineReveal).catch(allowCatalogLineReveal);
  } else {
    // Fonts API unavailable: allow reveal after the next frame so geometry still
    // has a chance to settle.
    requestAnimationFrame(allowCatalogLineReveal);
  }

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

  if (catalogLineST) {
    catalogLineST.kill();
    catalogLineST = null;
  }

  window.clearTimeout(catalogLineRefreshTimer);
  catalogLineRefreshTimer = 0;

  window.removeEventListener("resize", refreshCatalogLine);
  window.removeEventListener("resize", checkMobile);
  window.removeEventListener("keydown", handleProductModalKeydown);
  window.dispatchEvent(new CustomEvent("kardoor:heading-line-reset"));
  resetCatalogModalState();
});
</script>
