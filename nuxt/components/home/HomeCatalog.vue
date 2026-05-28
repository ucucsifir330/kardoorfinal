<template>
<section class="catalog-section">
    <div class="catalog-stage-backdrop" aria-hidden="true"></div>
    <div class="catalog-shell">
      <main
        class="catalog-main"
        :ref="setMainRef"
      >
        <div class="catalog-sticky-title" :class="{ 'is-scrolled': isCatalogScrolled }">
          <h1 class="catalog-title">Koleksiyonlar</h1>
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

              <span class="catalog-card-subtitle">{{ block.description }}</span>
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
// @ts-nocheck
const props = defineProps<{
  products: any[];
  isCatalogScrolled: boolean;
  visibleRows: number[];
  activeWishlistKey: string | null;
  activeProduct: any;
  activeProductIndex: number | null;
  setMainRef: (el: any) => void;
  setRowRef: (el: any) => void;
  catalogBeforeEnter: (el: HTMLElement) => void;
  catalogEnter: (el: HTMLElement, done: () => void) => void;
  openProductModal: (index: number) => void;
  handleWishlistClick: (index: number, key: string) => void;
  closeProductModal: () => void;
  showPreviousProduct: () => void;
  showNextProduct: () => void;
  toggleLike: (index: number | null) => void;
}>();

const catalogPreviewLimit = 10;

const catalogBlocks = [
  {
    index: 1,
    productPrefix: 'AL',
    number: '01',
    seriesLabel: 'Seri 01',
    shortName: 'Alüminyum',
    category: {
      short: 'Dış İklim',
      full: 'Dış İklim Modelleri'
    },
    parts: [
      { id: 'aluminium-frame', short: 'Kasa', full: 'Alüminyum Kasa Seri' },
      { id: 'aluminium-frame-wing', short: 'Kanat', full: 'Alüminyum Kasa ve Kanat Seri' }
    ],
    cardTitle: 'Alüminyum Sistemler',
    description: 'dış iklim uyumlu kapı sistemleri'
  },
  {
    index: 2,
    productPrefix: 'DY',
    number: '02',
    seriesLabel: 'Seri 02',
    shortName: 'Doğal',
    category: {
      short: 'Dış İklim',
      full: 'Dış İklim Modelleri'
    },
    parts: [
      { id: 'termo-wood', short: 'Wood', full: 'Termo Wood Seri' },
      { id: 'natural-stone', short: 'Taş', full: 'Doğal Taş Seri' }
    ],
    cardTitle: 'Doğal Yüzeyler',
    description: 'wood ve taş dokulu kapı yüzeyleri'
  },
  {
    index: 3,
    productPrefix: 'CM',
    number: '03',
    seriesLabel: 'Seri 03',
    shortName: 'Cam',
    category: {
      short: 'Dış İklim',
      full: 'Dış İklim Modelleri'
    },
    parts: [
      { id: 'mixed-glass', short: 'Karma', full: 'Karma Cam Seri' },
      { id: 'tempered-glass', short: 'Temperli', full: 'Temperli Cam Seri' }
    ],
    cardTitle: 'Camlı Modeller',
    description: 'cam detaylı dış kapı çözümleri'
  },
  {
    index: 4,
    productPrefix: 'MK',
    number: '04',
    seriesLabel: 'Seri 04',
    shortName: 'Metal',
    category: {
      short: 'Dış İklim',
      full: 'Dış İklim Modelleri'
    },
    parts: [
      { id: 'composite', short: 'Kompozit', full: 'Kompozit Seri' },
      { id: 'sheet-metal', short: 'Sac', full: 'Komple Sac Metal Seri' }
    ],
    cardTitle: 'Metal & Kompozit',
    description: 'dayanıklı metal ve kompozit modeller'
  },
  {
    index: 5,
    productPrefix: 'PL',
    number: '05',
    seriesLabel: 'Seri 05',
    shortName: 'Laminoks',
    category: {
      short: 'Exclusive',
      full: 'Exclusive Modeller'
    },
    parts: [
      { id: 'lux-pvc', short: 'PVC', full: 'Lüks PVC Seri' },
      { id: 'elit-laminox', short: 'Elit', full: 'Elit Laminoks Seri' },
      { id: 'rustic-laminox', short: 'Rustik', full: 'Rustik Laminoks Seri' }
    ],
    cardTitle: 'PVC & Laminoks',
    description: 'exclusive kaplama seçenekleri'
  },
  {
    index: 6,
    productPrefix: 'MO',
    number: '06',
    seriesLabel: 'Seri 06',
    shortName: 'Mimari',
    category: {
      short: 'Exclusive',
      full: 'Exclusive Modeller'
    },
    parts: [
      { id: 'project-custom', short: 'Özel', full: 'Projeye Özel Seri' },
      { id: 'pivot', short: 'Pivot', full: 'Pivot Seri' }
    ],
    cardTitle: 'Mimari Özel',
    description: 'projeye özel ve pivot çözümler'
  },
  {
    index: 7,
    productPrefix: 'GT',
    number: '07',
    seriesLabel: 'Seri 07',
    shortName: 'Teknik',
    category: {
      short: 'Çözümler',
      full: 'Teknik Çözümler'
    },
    parts: [
      { id: 'villa-building-entry', short: 'Giriş', full: 'Villa ve Bina Giriş Seri' },
      { id: 'emergency-exit', short: 'Acil', full: 'Acil Çıkış Seri' },
      { id: 'shaft-cover', short: 'Şaft', full: 'Bina Şaft Kapakları Seri' }
    ],
    cardTitle: 'Giriş & Teknik',
    description: 'giriş, acil çıkış ve şaft sistemleri'
  }
];

const getCatalogPreviewProducts = (block: typeof catalogBlocks[number]) =>
  props.products
    .map((product, productIndex) => ({ ...product, productIndex }))
    .filter((product) => product.code.startsWith(`${block.productPrefix}-`))
    .slice(0, catalogPreviewLimit);
</script>
