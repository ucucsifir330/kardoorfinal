<template>
<section class="catalog-section">
    <div class="catalog-shell">
      <main
        class="catalog-main"
        :ref="setMainRef"
      >
        <div class="catalog-sticky-title" :class="{ 'is-scrolled': isCatalogScrolled }">
          <h1 class="catalog-title">Katalog</h1>
        </div>

        <div
          v-for="n in 7"
          :key="n"
          :ref="setRowRef"
          :data-row-index="n"
          class="catalog-row"
        >
          <div class="catalog-row-info">
            <transition @before-enter="catalogBeforeEnter" @enter="catalogEnter" :css="false">
              <div v-if="visibleRows.includes(n)" data-index="0">
                <h2 class="catalog-product-family">ONE</h2>
                <p class="catalog-designer">by Güven Karaboğa</p>

                <div class="catalog-tags">
                  <div class="catalog-tag">
                    <span>kapı donanımı</span>
                    <div class="catalog-tag-line"></div>
                  </div>

                  <div class="catalog-tag">
                    <span>rozetli kapı kolları</span>
                    <div class="catalog-tag-line"></div>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <div class="catalog-card">
            <div class="catalog-card-header">
              <h3 class="catalog-card-title">
                PBL15/50 <span>Seri 0{{ n }}</span>
              </h3>

              <span class="catalog-card-subtitle">masif çift yaylı rozetli kapı kolu</span>
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
                v-for="(item, index) in (visibleRows.includes(n) ? products : [])"
                :key="'row-' + n + '-item-' + item.id"
                :data-index="index + 1"
                class="catalog-product"
                @click="openProductModal(index)"
              >
                <div class="catalog-product-image-wrap" @click="openProductModal(index)">
                  <img
                    :src="item.image"
                    alt="Kapı Modeli"
                    class="catalog-product-image"
                  >

                  <div
                    class="catalog-like-wrap"
                    :class="{ 'is-menu-open': activeWishlistKey === `${n}-${item.id}` }"
                  >
                    <button
                      type="button"
                      class="catalog-like"
                      :class="{ 'is-liked': item.liked }"
                      :aria-label="item.liked ? 'Favorilerden çıkar' : 'Favorilere ekle'"
                      @click.stop.prevent="handleWishlistClick(index, `${n}-${item.id}`)"
                      @keydown.enter.stop.prevent="handleWishlistClick(index, `${n}-${item.id}`)"
                      @keydown.space.stop.prevent="handleWishlistClick(index, `${n}-${item.id}`)"
                    >
                      <svg class="catalog-heart" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>

                    <div
                      class="catalog-wishlist-panel"
                      :class="{ 'is-click-open': activeWishlistKey === `${n}-${item.id}` }"
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
                      <p class="catalog-code">{{ item.code }}</p>
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
defineProps<{
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
</script>