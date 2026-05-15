<template>
<section class="catalog-section">
    <div class="catalog-shell">
      <main
        class="catalog-main"
        ref="mainRef"
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

  

<section class="ada-team-section">
    <div class="ada-manifesto-spacer"></div>
  
    <div class="ada-manifesto-container">
      <div class="ada-scroll-line-wrapper">
        <div class="ada-scroll-line-fill"></div>
      </div>
      <div class="ada-manifesto-content">
        <h3 class="ada-manifesto-text scroll-reveal" id="manifesto-text">
          Bir kapının değeri yalnızca görünüşüyle değil; yıllara meydan okuyan dayanımı ve taşıdığı güvenle ölçülür. Tavizsiz işçilik ve doğru mühendislikle, sadece bir kapı değil güven üretiyoruz.
        </h3>
        <a href="/company" class="ada-manifesto-cta" aria-label="Hakkımızda sayfasına git">
          <span class="ada-manifesto-cta-text" data-text="Hikâyemizi Keşfet">Hikâyemizi Keşfet</span>
          <span class="ada-manifesto-cta-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
            </svg>
          </span>
        </a>
      </div>
    </div>
  
    <div class="ada-subtitle-container">
      <div class="ada-loop-track">
        <div class="ada-loop-group">
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/apple/EAE8E8" alt="Apple"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/nike/EAE8E8" alt="Nike"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/tesla/EAE8E8" alt="Tesla"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/sony/EAE8E8" alt="Sony"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/meta/EAE8E8" alt="Meta"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/google/EAE8E8" alt="Google"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/ikea/EAE8E8" alt="IKEA"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/mcdonalds/EAE8E8" alt="McDonald's"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/visa/EAE8E8" alt="Visa"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/bmw/EAE8E8" alt="BMW"></span>
        </div>
        <div class="ada-loop-group" aria-hidden="true">
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/apple/EAE8E8" alt="Apple"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/nike/EAE8E8" alt="Nike"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/tesla/EAE8E8" alt="Tesla"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/sony/EAE8E8" alt="Sony"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/meta/EAE8E8" alt="Meta"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/google/EAE8E8" alt="Google"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/ikea/EAE8E8" alt="IKEA"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/mcdonalds/EAE8E8" alt="McDonald's"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/visa/EAE8E8" alt="Visa"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/bmw/EAE8E8" alt="BMW"></span>
        </div>
      </div>
    </div>
  
    <div class="ada-subtitle-container-reverse">
      <div class="ada-loop-track-reverse">
        <div class="ada-loop-group">
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/adidas/EAE8E8" alt="Adidas"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/mastercard/EAE8E8" alt="Mastercard"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/netflix/EAE8E8" alt="Netflix"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/samsung/EAE8E8" alt="Samsung"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/spotify/EAE8E8" alt="Spotify"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/puma/EAE8E8" alt="Puma"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/toyota/EAE8E8" alt="Toyota"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/honda/EAE8E8" alt="Honda"></span>
          <span class="ada-loop-item"><span class="ada-brand-logo ada-brand-logo-microsoft" aria-label="Microsoft" role="img"><svg class="ada-brand-logo-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h26v26H4V4Zm30 0h26v26H34V4ZM4 34h26v26H4V34Zm30 0h26v26H34V34Z" fill="currentColor"/></svg></span></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/nvidia/EAE8E8" alt="NVIDIA"></span>
        </div>
        <div class="ada-loop-group" aria-hidden="true">
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/adidas/EAE8E8" alt="Adidas"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/mastercard/EAE8E8" alt="Mastercard"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/netflix/EAE8E8" alt="Netflix"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/samsung/EAE8E8" alt="Samsung"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/spotify/EAE8E8" alt="Spotify"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/puma/EAE8E8" alt="Puma"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/toyota/EAE8E8" alt="Toyota"></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/honda/EAE8E8" alt="Honda"></span>
          <span class="ada-loop-item"><span class="ada-brand-logo ada-brand-logo-microsoft" aria-label="Microsoft" role="img"><svg class="ada-brand-logo-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h26v26H4V4Zm30 0h26v26H34V4ZM4 34h26v26H4V34Zm30 0h26v26H34V34Z" fill="currentColor"/></svg></span></span>
          <span class="ada-loop-item"><img class="ada-brand-logo" src="https://cdn.simpleicons.org/nvidia/EAE8E8" alt="NVIDIA"></span>
        </div>
      </div>
    </div>
  
    <div class="ada-title-container">
      <h4 class="ada-giant-title">
        <span class="ada-first-letter">Y</span>önetim Kadrosu
      </h4>
    </div>
  
    <div class="ada-carousel-wrapper">
      <div class="ada-founders-grid">
        <article class="ada-card">
          <div class="ada-card-text">
            <span class="ada-role">Kurucu Ortak</span>
            <h3 class="ada-name">Güven Karaboğa</h3>
          </div>
          <div class="ada-image-container">
            <img :src="aboutUsImage('guvenkaraboga')" class="ada-person-img" alt="Güven Karaboğa">
            <div class="ada-hover-overlay">
              <p class="ada-bio">Üretim bandından tasarıma kadar her detayın markanın premium standartlarına uymasını sağlar.</p>
              <a href="#" class="ada-read-more"
                 data-name="Güven Karaboğa"
                 data-role="Ege Kardoor Partner & Founder"
                 :data-image="aboutUsImage('guvenkaraboga')"
                 data-bio="Güven Karaboğa, Ege Kardoor'un üretim ve tasarım standartlarını belirleyen kurucu güçtür. Konutlardan ticari yapılara kadar geniş bir yelpazede, malzeme mühendisliği ve kusursuz işçiliği bir araya getirerek markanın premium vizyonunu oluşturmuştur."
                 data-services="Premium Kapı Tasarımı, Üretim Optimizasyonu, Kalite Kontrol Süreçleri, Malzeme Mühendisliği"
                 data-exp="20">Devamını Oku</a>
            </div>
          </div>
        </article>
  
        <article class="ada-card">
          <div class="ada-card-text">
            <span class="ada-role">Kurucu Ortak</span>
            <h3 class="ada-name">Yaşar Karaboğa</h3>
          </div>
          <div class="ada-image-container">
            <img :src="aboutUsImage('yasarkaraboga')" class="ada-person-img" alt="Yaşar Karaboğa">
            <div class="ada-hover-overlay">
              <p class="ada-bio">Kardoor'un finansal operasyonlarını ve stratejik saha yönetimini koordine eder.</p>
              <a href="#" class="ada-read-more"
                 data-name="Yaşar Karaboğa"
                 data-role="Ege Kardoor Partner & Founder"
                 :data-image="aboutUsImage('yasarkaraboga')"
                 data-bio="Finansal operasyonlar ve stratejik büyüme hedeflerini koordine eden Yaşar Karaboğa, saha yönetimi ve müşteri ilişkileri konusundaki derin tecrübesiyle projelerin kusursuz tamamlanmasını sağlar."
                 data-services="Finansal Planlama, Stratejik Saha Yönetimi, Proje Koordinasyonu, Müşteri İlişkileri"
                 data-exp="18">Devamını Oku</a>
            </div>
          </div>
        </article>
  
        <article class="ada-card">
          <div class="ada-card-text">
            <span class="ada-role">Üretim ve Büyüme</span>
            <h3 class="ada-name">Bülent Karaboğa</h3>
          </div>
          <div class="ada-image-container">
            <img :src="aboutUsImage('bulentkaraboga')" class="ada-person-img" alt="Bülent Karaboğa">
            <div class="ada-hover-overlay">
              <p class="ada-bio">Fabrikadan çıkan her ürünün malzeme ve güvenlik standartlarını bizzat denetler.</p>
              <a href="#" class="ada-read-more"
                 data-name="Bülent Karaboğa"
                 data-role="Üretim Direktörü"
                 :data-image="aboutUsImage('bulentkaraboga')"
                 data-bio="Modern üretim teknolojilerini geleneksel el işçiliği disipliniyle harmanlayarak, her kapının yıllara meydan okumasını sağlar."
                 data-services="Güvenlik Denetimi, Ar-Ge Çalışmaları, Tedarik Zinciri, Personel Eğitimi"
                 data-exp="12">Devamını Oku</a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
  
  <div class="ada-modal" id="teamModal">
    <div class="ada-modal-overlay"></div>
    <div class="ada-modal-wrapper">
      
      <div class="ada-modal-left">
        <img src="" alt="" id="modalImage">
      </div>
  
      <div class="ada-modal-right">
        
        <div class="ada-modal-top-fixed">
          <div class="ada-modal-top-content">
            <div class="ada-modal-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              İzmir, Türkiye
            </div>
            <button class="ada-modal-close" id="closeModal">Kapat <span class="close-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span></button>
          </div>
        </div>
  
        <div class="ada-modal-right-fixed-panel">
          <div class="ada-modal-services-wrapper">
            <span class="services-title">Uzmanlık & Sorumluluklar</span> 
            <ul class="services-list" id="modalServices"></ul>
          </div>
          <div class="ada-modal-experience">
            <div class="exp-line-1"><strong id="modalExp"></strong> <span>yıllık</span></div>
            <div class="exp-line-2">Tecrübe</div>
          </div>
        </div>
  
        <div class="ada-modal-scroll-area">
          <div class="ada-modal-scroll-content">
            <h2 class="ada-modal-name" id="modalName"></h2>
            <p class="ada-modal-role" id="modalRole"></p>
            
            <div class="ada-modal-content-split">
              <div class="ada-modal-bio-col">
                <a href="#" class="ada-modal-social" target="_blank">
                  <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                    <path d="M160,128a32,32,0,1,1-32-32A32.03667,32.03667,0,0,1,160,128Zm68-44v88a56.06353,56.06353,0,0,1-56,56H84a56.06353,56.06353,0,0,1-56-56V84A56.06353,56.06353,0,0,1,84,28h88A56.06353,56.06353,0,0,1,228,84Zm-52,44a48,48,0,1,0-48,48A48.05436,48.05436,0,0,0,176,128Zm16-52a12,12,0,1,0-12,12A12,12,0,0,0,192,76Z"></path>
                  </svg>
                </a>
                <p class="ada-modal-bio-text" id="modalBio"></p>
              </div>
  
              <div class="ada-modal-services-col"></div>
            </div>
          </div>
        </div>
  
      </div>
    </div>
  </div>

  

<section class="testimonial-wrapper">
    <div class="title-area">
      <h2 class="title rotating-title">
        <div class="top-row" :style="{ gap: dynamicGap }">
          <span ref="staticText" class="static-text">Son</span>

          <div class="rotating-text-wrapper" :style="{ width: titleWidth + 'px' }">
            <span ref="hiddenSpan" class="hidden-measure">{{ titleWords[titleIndex] }}</span>

            <transition-group name="slide-word" tag="div" class="word-slider">
              <span :key="titleWords[titleIndex]" class="word-slide-item">
                {{ titleWords[titleIndex] }}
              </span>
            </transition-group>
          </div>
        </div>

        <div class="bottom-row">size bırakıyoruz.</div>
      </h2>

      <div class="gradient-mask"></div>
    </div>

    <div class="carousel-area">
      <div
        class="track"
        @mousedown.prevent="startDrag($event, 1)"
        @touchstart="startDrag($event, 1)"
        @mouseenter="setHover(true, 1)"
        @mouseleave="setHover(false, 1)"
      >
        <div class="track-inner" ref="inner1">
          <div
            v-for="(review, index) in row1"
            :key="'r1-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row1"
            :key="'clone1-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="track"
        @mousedown.prevent="startDrag($event, 2)"
        @touchstart="startDrag($event, 2)"
        @mouseenter="setHover(true, 2)"
        @mouseleave="setHover(false, 2)"
      >
        <div class="track-inner" ref="inner2">
          <div
            v-for="(review, index) in row2"
            :key="'r2-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row2"
            :key="'clone2-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="footer-wrapper" ref="footerWrapper">
    <footer class="footer-dome" ref="footerDome">
      <div class="footer-brand">
        <img src="https://i.hizliresim.com/q70qm97.png" alt="ADA Logo" class="footer-logo">
      </div>

      <div class="footer-main">
        <div class="footer-socials">
          <a href="#" class="social-btn" aria-label="Instagram">
            <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M160,128a32,32,0,1,1-32-32A32.03667,32.03667,0,0,1,160,128Zm68-44v88a56.06353,56.06353,0,0,1-56,56H84a56.06353,56.06353,0,0,1-56-56V84A56.06353,56.06353,0,0,1,84,28h88A56.06353,56.06353,0,0,1,228,84Zm-52,44a48,48,0,1,0-48,48A48.05436,48.05436,0,0,0,176,128Zm16-52a12,12,0,1,0-12,12A12,12,0,0,0,192,76Z"></path>
            </svg>
          </a>

          <a href="#" class="social-btn linkedin-btn" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.38 4.27 5.47v6.27ZM5.32 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.1 20.45H3.54V9H7.1v11.45Z"></path>
            </svg>
          </a>

          <a href="#" class="social-btn facebook-btn" aria-label="Facebook">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15.82 4.02h-2.33c-2.6 0-4.28 1.73-4.28 4.42v2.03H6.95c-.2 0-.36.16-.36.36v2.95c0 .2.16.36.36.36h2.26v7.48c0 .2.16.36.36.36h3.08c.2 0 .36-.16.36-.36v-7.48h2.76c.18 0 .33-.13.36-.31l.44-2.95c.03-.22-.14-.41-.36-.41h-3.16V8.73c0-.85.2-1.28 1.31-1.28h1.5c.2 0 .36-.16.36-.36V4.38c0-.2-.16-.36-.36-.36Z"></path>
            </svg>
          </a>

          <a href="https://wa.me/905555555555" class="social-btn whatsapp-btn" aria-label="WhatsApp" target="_blank">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.79 1.48h.01c6.57 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.47-8.44ZM12.08 21.82h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.73.98.99-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.29c0-5.46 4.45-9.9 9.92-9.9a9.86 9.86 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.92 9.9Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"></path>
            </svg>
          </a>

          <a href="mailto:info@kardoor.com" class="social-btn mail-btn" aria-label="Mail">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path class="mail-envelope-body" d="M4.25 8H19.75C20.58 8 21.25 8.67 21.25 9.5V16.75C21.25 17.58 20.58 18.25 19.75 18.25H4.25C3.42 18.25 2.75 17.58 2.75 16.75V9.5C2.75 8.67 3.42 8 4.25 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              <path class="mail-envelope-fold-left" d="M4.25 17.35L9.7 12.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
              <path class="mail-envelope-fold-right" d="M19.75 17.35L14.3 12.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
              <path class="mail-envelope-flap" d="M3.75 8.75L12 14L20.25 8.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </a>

          <a href="tel:+905555555555" class="social-btn phone-btn" aria-label="Telefon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8.45 5.35L10.15 9.15C10.38 9.68 10.25 10.28 9.82 10.65L8.65 11.68C9.55 13.52 11.02 15 12.88 15.92L13.92 14.72C14.28 14.3 14.88 14.17 15.4 14.4L19.2 16.1C19.82 16.38 20.15 17.05 19.98 17.72L19.58 19.28C19.4 19.98 18.78 20.45 18.05 20.42C10.08 20.05 3.95 13.92 3.58 5.95C3.55 5.22 4.02 4.6 4.72 4.42L6.78 4.02C7.45 3.85 8.18 4.72 8.45 5.35Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </a>
        </div>

        <div class="footer-panel">
          <h2 class="footer-heading">
            Size en yakın showroomu seçin;<br>
            projeniz için <em>görüşme talebi bırakın.</em>
          </h2>

          <div class="location-group">
            <p class="location-label">Şube seçimi:</p>

            <div class="location-options">
              <label class="location-option">
                <input type="radio" name="location" checked>
                <span class="radio-ui"></span>
                <span class="option-text flip-text-link" data-text="İzmir">İzmir</span>
              </label>

              <label class="location-option">
                <input type="radio" name="location">
                <span class="radio-ui"></span>
                <span class="option-text flip-text-link" data-text="Kocaeli">Kocaeli</span>
              </label>

              <label class="location-option">
                <input type="radio" name="location">
                <span class="radio-ui"></span>
                <span class="option-text flip-text-link" data-text="Manisa">Manisa</span>
              </label>
            </div>
          </div>

          <form class="footer-form" @submit.prevent>
            <div class="form-row">
              <input type="text" placeholder="Adınız ve soyadınız">
              <input type="text" placeholder="Telefon numaranız">
            </div>

            <div class="form-row form-row-message">
              <input type="text" placeholder="Mesajınız">
              <button type="submit" class="submit-btn" aria-label="Gönder">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M8 5L15 12L8 19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="footer-info">
        <div class="footer-info-left">
          <div class="footer-column">
            <span class="footer-kicker">Ürün Serileri</span>
            <a href="#" class="flip-text-link no-line" data-text="Alüminyum Seri">Alüminyum Seri</a>
            <a href="#" class="flip-text-link no-line" data-text="Thermowood Seri">Thermowood Seri</a>
            <a href="#" class="flip-text-link no-line" data-text="Doğal Taş Seri">Doğal Taş Seri</a>
            <a href="#" class="flip-text-link no-line" data-text="Cam Panel Seri">Cam Panel Seri</a>
            <a href="#" class="flip-text-link no-line" data-text="Pivot Seri">Pivot Seri</a>
            <a href="#" class="flip-text-link no-line" data-text="Laminoks Seri">Laminoks Seri</a>
          </div>

          <div class="footer-column">
            <span class="footer-kicker">Kardoor</span>
            <a href="#" class="flip-text-link no-line" data-text="Ana Sayfa">Ana Sayfa</a>
            <a href="#" class="flip-text-link no-line" data-text="Hakkımızda">Hakkımızda</a>
            <a href="#" class="flip-text-link no-line" data-text="Üretim">Üretim</a>
            <a href="#" class="flip-text-link no-line" data-text="Katalog">Katalog</a>
            <a href="#" class="flip-text-link no-line" data-text="Şubelerimiz">Şubelerimiz</a>
            <a href="#" class="flip-text-link no-line" data-text="İletişim">İletişim</a>
          </div>
        </div>

        <div class="footer-locations">
          <span class="footer-kicker">Şubelerimiz/Showroomlar</span>

          <div class="location-cards">
            <div class="location-card">
              <h3><span class="flip-text-link" data-text="İzmir">İzmir</span></h3>
              <p>Zafer Mahallesi Turgut Özal Caddesi<br>No:14/16 Buca / İzmir</p>
              <strong>+90 537 776 53 00</strong>
              <div class="hours">
                <span>Pzt-Paz</span>
                <span>08:00 - 18:30</span>
              </div>
            </div>

            <div class="location-card">
              <h3><span class="flip-text-link" data-text="Kocaeli">Kocaeli</span></h3>
              <p>Mimar Sinan Mah. Bağlar Cad.<br>No:79/A Körfez / Kocaeli</p>
              <strong>+90 530 614 35 41</strong>
              <div class="hours">
                <span>Pzt-Paz</span>
                <span>08:00 - 18:30</span>
              </div>
            </div>

            <div class="location-card">
              <h3><span class="flip-text-link" data-text="Manisa">Manisa</span></h3>
              <p>Caferbey Mah. Asfalt Altı Sk<br>No: 110</p>
              <strong>+90 533 969 62 36</strong>
              <div class="hours">
                <span>Pzt-Paz</span>
                <span>08:00 - 18:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div>
          <span>© 2026 Kardoor Çelik Kapı.</span>
          <strong>Tüm hakları saklıdır.</strong>
        </div>

        <div>
          <a href="#" class="flip-text-link no-line" data-text="Gizlilik Politikası">Gizlilik Politikası</a>·
          <a href="#" class="flip-text-link no-line" data-text="KVKK Aydınlatma Metni">KVKK Aydınlatma Metni</a>·
          <a href="#" class="flip-text-link no-line" data-text="Kullanım Koşulları">Kullanım Koşulları</a>
        </div>

        <div>
          <span>Üç Üç Sıfır ®</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface Review {
  id: number;
  text: string;
  name: string;
}

interface TrackState {
  x: number;
  isDragging: boolean;
  startX: number;
  isHovered: boolean;
  baseSpeed: number;
  currentVelocity: number;
}

interface ProductVariant {
  id: number;
  finish: string;
  code: string;
  image: string;
  liked: boolean;
}

const nuxtApp = useNuxtApp()
const aboutUsImages = {
  guvenkaraboga: "https://ik.imagekit.io/kardoor/aboutus/guvenkaraboga?updatedAt=1778789528553",
  yasarkaraboga: "https://ik.imagekit.io/kardoor/aboutus/yasarkaraboga?updatedAt=1778789528545",
  bulentkaraboga: "https://ik.imagekit.io/kardoor/aboutus/bulentkaraboga?updatedAt=1778789528509"
} as const
const seriesImages = {
  ivoryLine: "https://ik.imagekit.io/kardoor/series/1.png?updatedAt=1778762643897",
  graphiteOak: "https://ik.imagekit.io/kardoor/series/2.png?updatedAt=1778762645386",
  classicSand: "https://ik.imagekit.io/kardoor/series/3.png?updatedAt=1778762644382",
  emeraldLine: "https://ik.imagekit.io/kardoor/series/4.png?updatedAt=1778762645568",
  monoGraphite: "https://ik.imagekit.io/kardoor/series/5.png?updatedAt=1778762645583"
} as const
const aboutUsImage = (fileName: keyof typeof aboutUsImages) => aboutUsImages[fileName]

const products = ref([] as ProductVariant[]);
const isCatalogScrolled = ref(false);
const mainRef = ref<HTMLElement | null>(null);
const visibleRows = ref([] as number[]);
const rowRefs = ref([] as HTMLElement[]);
const activeWishlistKey = ref<string | null>(null);
const activeProductIndex = ref<number | null>(null);
let catalogScrollTarget = 0;
let catalogScrollTween: gsap.core.Tween | null = null;
let catalogRowsFrame = 0;

const isMobileCatalogViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;

const setRowRef = (el: Element | ComponentPublicInstance | null) => {
  if (el && !rowRefs.value.includes(el)) {
    rowRefs.value.push(el);
  }
};

const mockData: ProductVariant[] = [
  { id: 1, finish: 'saten paslanmaz çelik', code: '2701d002inx00', image: seriesImages.emeraldLine, liked: false },
  { id: 2, finish: 'saten siyah', code: '2701d002nmx00', image: seriesImages.monoGraphite, liked: false },
  { id: 3, finish: 'PVD saten siyah', code: '2701d002izx00', image: seriesImages.graphiteOak, liked: false },
  { id: 4, finish: 'bronz', code: '2701d002brx00', image: seriesImages.classicSand, liked: false },
  { id: 5, finish: 'beyaz', code: '2701d002whx00', image: seriesImages.ivoryLine, liked: false },
  { id: 6, finish: 'PVD saten altın', code: '2701d002gdx00', image: seriesImages.emeraldLine, liked: false },
  { id: 7, finish: 'PVD açık bronz', code: '2701d002lbx00', image: seriesImages.monoGraphite, liked: false },
  { id: 8, finish: 'PVD şampanya', code: '2701d002chx00', image: seriesImages.graphiteOak, liked: false }
];

products.value = mockData;
visibleRows.value = [1];

const catalogBeforeEnter = (el: HTMLElement) => {
  el.style.opacity = '0';
  el.style.transform = 'translateX(-80px)';
};

const catalogEnter = (el: HTMLElement, done: () => void) => {
  const delay = parseInt(el.dataset.index || '0') * 120;

  setTimeout(() => {
    el.style.transition = 'opacity 0.7s ease-out, transform 0.7s ease-out';
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';

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
  const rootEl = mainRef.value as HTMLElement | null;

  if (!rootEl) return;

  const rootRect = rootEl.getBoundingClientRect();
  const revealLine = rootRect.top + rootRect.height * 0.84;

  rowRefs.value.forEach((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const rowIndex = parseInt(el.getAttribute('data-row-index') || '0');

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
  catalogScrollTarget = target.scrollTop;
  requestCatalogRowCheck();
};

const handleCatalogWheel = (event: WheelEvent) => {
  if (isMobileCatalogViewport()) return;

  const target = mainRef.value as HTMLElement | null;

  if (!target) return;

  const maxScrollTop = target.scrollHeight - target.clientHeight;
  const deltaMultiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? target.clientHeight : 1;
  const deltaY = event.deltaY * deltaMultiplier;
  const currentScrollTop = target.scrollTop;
  const boundaryThreshold = 42;

  if (maxScrollTop <= 0 || deltaY === 0) {
    return;
  }

  const isAtTop = currentScrollTop <= boundaryThreshold;
  const isAtBottom = maxScrollTop - currentScrollTop <= boundaryThreshold;
  const shouldPassToPage = (deltaY < 0 && isAtTop) || (deltaY > 0 && isAtBottom);

  if (shouldPassToPage) {
    event.preventDefault();
    const boundaryScrollTop = deltaY < 0 ? 0 : maxScrollTop;
    target.scrollTop = boundaryScrollTop;
    catalogScrollTarget = boundaryScrollTop;
    window.scrollBy({
      top: deltaY,
      left: 0,
      behavior: 'auto'
    });
    requestCatalogRowCheck();
    return;
  }

  const nextScrollTop = currentScrollTop + deltaY;
  const clampedScrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
  const leftoverDelta = nextScrollTop - clampedScrollTop;

  event.preventDefault();
  catalogScrollTween?.kill();

  if (clampedScrollTop !== currentScrollTop) {
    target.scrollTop = clampedScrollTop;
    catalogScrollTarget = clampedScrollTop;
    requestCatalogRowCheck();
  }

  if (leftoverDelta !== 0) {
    window.scrollBy({
      top: leftoverDelta,
      left: 0,
      behavior: 'auto'
    });
  }
};

const toggleLike = (index: number) => {
  products.value[index].liked = !products.value[index].liked;
};

const handleWishlistClick = (index: number, key: string) => {
  if (isMobileCatalogViewport()) {
    toggleLike(index);
    activeWishlistKey.value = null;
    return;
  }

  const willOpen = activeWishlistKey.value !== key;
  toggleLike(index);
  activeWishlistKey.value = willOpen ? key : null;
};

const activeProduct = computed(() => {
  if (activeProductIndex.value === null) return null;
  return products.value[activeProductIndex.value] || null;
});

const openProductModal = (index: number) => {
  activeProductIndex.value = index;
  activeWishlistKey.value = null;

  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
};

const closeProductModal = () => {
  activeProductIndex.value = null;

  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
};

const showPreviousProduct = () => {
  if (!products.value.length || activeProductIndex.value === null) return;
  activeProductIndex.value = (activeProductIndex.value - 1 + products.value.length) % products.value.length;
};

const showNextProduct = () => {
  if (!products.value.length || activeProductIndex.value === null) return;
  activeProductIndex.value = (activeProductIndex.value + 1) % products.value.length;
};

const handleProductModalKeydown = (event: KeyboardEvent) => {
  if (activeProductIndex.value === null) return;

  if (event.key === 'Escape') {
    closeProductModal();
  } else if (event.key === 'ArrowLeft') {
    showPreviousProduct();
  } else if (event.key === 'ArrowRight') {
    showNextProduct();
  }
};

const initialTitleWidth =
  typeof window !== 'undefined'
    ? Math.max(180, Math.min(320, window.innerWidth * 0.18))
    : 220;

const titleWords = ref(['sözü', 'kararı', 'yorumu']);
const titleIndex = ref(0);
const titleWidth = ref(initialTitleWidth);
const hiddenSpan = ref<HTMLElement | null>(null);
const staticText = ref<HTMLElement | null>(null);
const baseTitleWidth = ref(0);

const inner1 = ref<HTMLElement | null>(null);
const inner2 = ref<HTMLElement | null>(null);

const footerWrapper = ref<HTMLElement | null>(null);
const footerDome = ref<HTMLElement | null>(null);

const googleReviews = ref([
  {
    id: 1,
    text: 'Kardoor Çelik kapı ailesi sorunumu özenle dinledi ve çözdü. Güven bey ve montaj ekibi arkadaşlara teşekkür ediyorum. Titizlikle ilgilendiler.',
    name: 'Nadire Ş.'
  },
  {
    id: 2,
    text: 'Kendi evime ve oğlumun evine kapı yaptırdık. Çok memnun kaldık. Personeller işi beklediğimden hızlı teslim ettiler.',
    name: 'Ahmet M.'
  },
  {
    id: 3,
    text: 'Yaptıkları işlerde gerek kaliteleri olsun gerek hızları olsun 20 yıldır böyle bir firmayla hiç çalışmamıştım. Teşekkürler Kardoor Çelik Kapı.',
    name: 'Mustafa K.'
  },
  {
    id: 4,
    text: "İzmir'de dış iklim kapısı ararken Kardoor'u bulduk. Güven Bey çok yardımcı oldu. Kapının yalıtımı ve malzeme kalitesi gerçekten muazzam.",
    name: 'Elif T.'
  },
  {
    id: 5,
    text: 'Bina giriş kapımızı yeniledik. Cam kapı detayları ve işçilik çok başarılı. Tüm süreçte profesyonelce yaklaştılar, tavsiye ederim.',
    name: 'Kemal S.'
  },
  {
    id: 6,
    text: 'Montaj ekibi söz verdikleri gün ve saatte gelip tertemiz çalıştı. Hem estetik hem de güven veren, sağlam bir yapısı var. Elinize sağlık.',
    name: 'Ayşe Y.'
  },
  {
    id: 7,
    text: "Showroom'daki 3D sunum ile evimize uygulanacak kapıyı önceden görmek harikaydı. Sonuç beklediğimizden de şık oldu.",
    name: 'Burak D.'
  },
  {
    id: 8,
    text: 'Hızlı, net ve profesyonel yaklaşım. İhtiyacımız olan çelik kapı çözümünü doğrudan aldık, fiyat ve performans çok iyi.',
    name: 'Serkan A.'
  }
] as Review[]);

const row1 = computed(() => googleReviews.value.slice(0, 4));
const row2 = computed(() => googleReviews.value.slice(4, 8));

const track1State: TrackState = {
  x: 0,
  isDragging: false,
  startX: 0,
  isHovered: false,
  baseSpeed: 0.4,
  currentVelocity: 0.4
};

const track2State: TrackState = {
  x: 0,
  isDragging: false,
  startX: 0,
  isHovered: false,
  baseSpeed: 0.25,
  currentVelocity: 0.25
};

let activeTrack: number | null = null;
let animationFrameId = 0;
let titleInterval: ReturnType<typeof setInterval> | null = null;
let footerTrigger: any = null;
let catalogObserver: IntersectionObserver | null = null;

const updateTitleWidth = () => {
  const hiddenSpanEl = hiddenSpan.value as HTMLElement | null;
  const staticTextEl = staticText.value as HTMLElement | null;

  if (!hiddenSpanEl) return;

  const measuredWidth = hiddenSpanEl.getBoundingClientRect().width;
  titleWidth.value = measuredWidth;

  if (!baseTitleWidth.value) {
    baseTitleWidth.value = measuredWidth;
  }

  if (staticTextEl) {
    const offset = (measuredWidth - baseTitleWidth.value) * 0.18;
    staticTextEl.style.transform = `translateX(${offset}px)`;
  }
};

const dynamicGap = computed(() => {
  const gapValue = 34 + titleWidth.value * 0.04;
  return `${Math.max(38, Math.min(58, gapValue))}px`;
});

const getX = (event: MouseEvent | TouchEvent): number => {
  if ('touches' in event && event.touches.length > 0) {
    return event.touches[0].pageX;
  }

  return (event as MouseEvent).pageX;
};

const animate = () => {
  const tracks: Array<{ state: TrackState; inner: HTMLElement | null }> = [
    {
      state: track1State,
      inner: inner1.value as HTMLElement | null
    },
    {
      state: track2State,
      inner: inner2.value as HTMLElement | null
    }
  ];

  tracks.forEach(({ state, inner }: { state: TrackState; inner: HTMLElement | null }) => {
    if (!inner) return;

    const halfWidth = inner.scrollWidth / 2;

    if (!state.isDragging) {
      const targetVelocity = state.isHovered ? 0 : state.baseSpeed;
      state.currentVelocity += (targetVelocity - state.currentVelocity) * 0.04;
      state.x -= state.currentVelocity;
    }

    if (state.x <= -halfWidth) {
      state.x += halfWidth;
    } else if (state.x > 0) {
      state.x -= halfWidth;
    }

    inner.style.transform = `translateX(${state.x}px)`;
  });

  animationFrameId = requestAnimationFrame(animate);
};

const startDrag = (event: MouseEvent | TouchEvent, trackNum: number) => {
  activeTrack = trackNum;

  const state = trackNum === 1 ? track1State : track2State;

  state.isDragging = true;
  state.startX = getX(event);

  document.body.style.cursor = 'grabbing';
};

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (activeTrack === null) return;

  const state = activeTrack === 1 ? track1State : track2State;

  if (!state.isDragging) return;

  const currentX = getX(event);

  state.x += currentX - state.startX;
  state.startX = currentX;
};

const endDrag = () => {
  track1State.isDragging = false;
  track2State.isDragging = false;
  activeTrack = null;

  document.body.style.cursor = 'default';
};

const setHover = (value: boolean, trackNum: number) => {
  const state = trackNum === 1 ? track1State : track2State;
  state.isHovered = value;
};

const tiltCard = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement;
  const box = card.getBoundingClientRect();

  const x = event.clientX - box.left;
  const y = event.clientY - box.top;

  card.style.setProperty('--x', `${x}px`);
  card.style.setProperty('--y', `${y}px`);

  const centerX = box.width / 2;
  const centerY = box.height / 2;

  const rotateX = (centerY - y) / 15;
  const rotateY = (x - centerX) / 20;

  card.classList.add('tilting');
  card.style.setProperty('--rx', `${rotateX}deg`);
  card.style.setProperty('--ry', `${rotateY}deg`);
};

const resetTilt = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement;

  card.classList.remove('tilting');
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
};

const initCatalogObserver = () => {
  const rootEl = mainRef.value as HTMLElement | null;

  if (!rootEl) return;

  if (catalogObserver) {
    catalogObserver.disconnect();
  }

  catalogObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        const rowIndex = parseInt(entry.target.getAttribute('data-row-index') || '0');

        revealCatalogRow(rowIndex);

        catalogObserver?.unobserve(entry.target);
      }
    });
  }, {
    root: rootEl,
    rootMargin: '0px 0px 42% 0px',
    threshold: 0.01
  });

  rowRefs.value.forEach((el: HTMLElement) => {
    catalogObserver?.observe(el);
  });

  requestCatalogRowCheck();
};

const initFooterAnimation = () => {
  const footer = footerDome.value as HTMLElement | null;
  const wrapper = footerWrapper.value as HTMLElement | null;

  if (!footer || !wrapper) return;

  if (footerTrigger) {
    footerTrigger.kill();
  }

  const isMobileFooter = () => window.matchMedia('(max-width: 760px)').matches;
  const getFooterMotion = () => {
    if (isMobileFooter()) {
      return { y: 0, radius: 220, divisor: 1.18 };
    }

    return { y: 24, radius: 520, divisor: 1.35 };
  };

  const initialMotion = getFooterMotion();

  gsap.set(footer, {
    y: initialMotion.y,
    '--dome-radius': `${initialMotion.radius}px`,
    borderTopLeftRadius: `50% ${initialMotion.radius}px`,
    borderTopRightRadius: `50% ${initialMotion.radius}px`,
    force3D: true
  });

  let ticking = false;

  const updateFooterShape = () => {
    ticking = false;

    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const motion = getFooterMotion();
    const rawProgress = (viewportHeight - rect.top) / (viewportHeight * motion.divisor);
    const progress = Math.min(1, Math.max(0, rawProgress));
    const easedProgress = gsap.parseEase('sine.inOut')(progress);
    const y = Math.max(0, motion.y * (1 - easedProgress));
    const radius = Math.max(0, motion.radius * (1 - easedProgress));
    const radiusValue = `50% ${radius}px`;

    gsap.to(footer, {
      y,
      '--dome-radius': `${radius}px`,
      borderTopLeftRadius: radiusValue,
      borderTopRightRadius: radiusValue,
      duration: 0.9,
      ease: 'power2.out',
      overwrite: true,
      force3D: true
    });
  };

  const requestFooterUpdate = () => {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateFooterShape);
  };

  updateFooterShape();
  window.addEventListener('scroll', requestFooterUpdate, { passive: true });
  window.addEventListener('resize', requestFooterUpdate);

  footerTrigger = {
    kill: () => {
      window.removeEventListener('scroll', requestFooterUpdate);
      window.removeEventListener('resize', requestFooterUpdate);
    }
  };
};

onMounted(() => {
  products.value = mockData;
  visibleRows.value = [1];

  nextTick(() => {
    const catalogMainEl = mainRef.value as HTMLElement | null;
    if (catalogMainEl) {
      catalogMainEl.scrollTop = 0;
      catalogScrollTarget = 0;
      isCatalogScrolled.value = false;
    }

    requestAnimationFrame(() => {
      initCatalogObserver();
    });
  });

  updateTitleWidth();

  nextTick(() => {
    updateTitleWidth();
    requestAnimationFrame(updateTitleWidth);

    const fonts = (document as any).fonts;

    if (fonts?.ready) {
      fonts.ready.then(() => {
        updateTitleWidth();
        ScrollTrigger.refresh();
      });
    }

    initFooterAnimation();
  });

  window.addEventListener('resize', updateTitleWidth);

  titleInterval = setInterval(() => {
    titleIndex.value = (titleIndex.value + 1) % titleWords.value.length;

    nextTick(() => {
      updateTitleWidth();
    });
  }, 7000);

  track2State.x = -400;
  animate();

  window.addEventListener('mousemove', onDrag as EventListener);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchmove', onDrag as EventListener, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('keydown', handleProductModalKeydown);
});

onBeforeUnmount(() => {
  if (titleInterval) {
    clearInterval(titleInterval);
  }

  cancelAnimationFrame(animationFrameId);
  if (catalogRowsFrame) {
    cancelAnimationFrame(catalogRowsFrame);
    catalogRowsFrame = 0;
  }

  if (footerTrigger) {
    footerTrigger.kill();
  }

  if (catalogObserver) {
    catalogObserver.disconnect();
  }

  window.removeEventListener('resize', updateTitleWidth);
  window.removeEventListener('mousemove', onDrag as EventListener);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchmove', onDrag as EventListener);
  window.removeEventListener('touchend', endDrag);
  window.removeEventListener('keydown', handleProductModalKeydown);
  document.body.style.overflow = '';
});


(() => {
  type CleanupTask = () => void

  type GsapCore = any
  type ScrollTriggerCore = any

  let cleanupTasks: CleanupTask[] = []
  let gsapContext: ReturnType<GsapCore['context']> | null = null

  const modalFallbackBio = `Güven Karaboğa, Ege Kardoor'un üretim ve tasarım standartlarını belirleyen kurucu güçtür. Konutlardan ticari yapılara kadar geniş bir yelpazede, malzeme mühendisliği ve kusursuz işçiliği bir araya getirerek markanın premium vizyonunu oluşturmuştur.`

  const select = <T extends Element>(selector: string): T | null => {
    return document.querySelector(selector) as T | null
  }

  const selectAll = <T extends Element>(selector: string): T[] => {
    return Array.from(document.querySelectorAll(selector)) as T[]
  }

  const addCleanup = (task: CleanupTask) => {
    cleanupTasks.push(task)
  }

  const initAdaGsap = (gsap: GsapCore, ScrollTrigger: ScrollTriggerCore) => {
    gsapContext = gsap.context(() => {
      const scrollLineFill = select<HTMLElement>('.ada-scroll-line-fill')
      const manifestoContainer = select<HTMLElement>('.ada-manifesto-container')
      const catalogSection = select<HTMLElement>('.catalog-section')

      if (catalogSection && manifestoContainer) {
        gsap.to(catalogSection, {
          '--catalog-line-progress': 1,
          ease: 'none',
          scrollTrigger: {
            trigger: catalogSection,
            start: 'bottom bottom',
            endTrigger: manifestoContainer,
            end: 'center 52%',
            scrub: 2,
            invalidateOnRefresh: true
          }
        })
      }

      if (scrollLineFill && manifestoContainer) {
        gsap.to(scrollLineFill, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: catalogSection || manifestoContainer,
            start: catalogSection ? 'bottom bottom' : 'top 72%',
            endTrigger: manifestoContainer,
            end: 'bottom 42%',
            scrub: 2,
            invalidateOnRefresh: true
          }
        })
      }

      const revealElement = select<HTMLElement>('#manifesto-text')

      if (revealElement) {
        const text = revealElement.textContent?.trim().replace(/\s+/g, ' ') || ''
        const words = text.split(' ')
        revealElement.innerHTML = ''

        words.forEach((word, i) => {
          const wordSpan = document.createElement('span')
          wordSpan.className = 'reveal-word'

          if (word.includes('Ege') || word.includes('Kardoor')) {
            wordSpan.classList.add('brand-gradient-word')
          }

          Array.from(word).forEach((char) => {
            const charSpan = document.createElement('span')
            charSpan.className = 'reveal-char'
            charSpan.textContent = char
            wordSpan.appendChild(charSpan)
          })

          revealElement.appendChild(wordSpan)

          if (i < words.length - 1) {
            revealElement.appendChild(document.createTextNode(' '))
          }
        })

        const chars = revealElement.querySelectorAll('.reveal-char')

        gsap.to(chars, {
          opacity: 1,
          stagger: 0.02,
          ease: 'none',
          scrollTrigger: {
            trigger: '#manifesto-text',
            start: 'top 85%',
            end: 'bottom 50%',
            scrub: 2
          }
        })
      }

      const titleElement = select<HTMLElement>('.ada-giant-title')
      const titleContainer = select<HTMLElement>('.ada-title-container')

      if (titleContainer) {
        titleContainer.style.setProperty('overflow', 'visible', 'important')
      }

      if (titleElement) {
        titleElement.style.setProperty('overflow', 'visible', 'important')

        const titleText = titleElement.textContent?.trim().replace(/\s+/g, ' ') || ''
        titleElement.innerHTML = ''

        titleText.split(' ').forEach((word, wordIndex, wordArray) => {
          const wordSpan = document.createElement('span')
          wordSpan.className = 'ada-title-float-word'
          wordSpan.style.display = 'inline-block'
          wordSpan.style.whiteSpace = 'nowrap'
          wordSpan.style.overflow = 'visible'

          Array.from(word).forEach((char, charIndex) => {
            const charSpan = document.createElement('span')
            charSpan.className = 'ada-title-float-char'
            charSpan.style.display = 'inline-block'
            charSpan.style.willChange = 'transform, opacity'
            charSpan.style.transformOrigin = '50% 50%'
            charSpan.style.backfaceVisibility = 'hidden'

            if (wordIndex === 0 && charIndex === 0) {
              charSpan.classList.add('ada-first-letter')
            }

            charSpan.textContent = char
            wordSpan.appendChild(charSpan)
          })

          titleElement.appendChild(wordSpan)

          if (wordIndex < wordArray.length - 1) {
            titleElement.appendChild(document.createTextNode(' '))
          }
        })

        const titleChars = titleElement.querySelectorAll('.ada-title-float-char')

        gsap.fromTo(
          titleChars,
          {
            yPercent: 115,
            rotateX: -72,
            opacity: 0,
            scale: 0.96,
            filter: 'blur(10px)'
          },
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.28,
            ease: 'expo.out',
            stagger: { amount: 0.44, from: 'center', ease: 'power2.out' },
            scrollTrigger: {
              trigger: titleElement,
              start: 'top 88%',
              end: 'bottom 56%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      }

      const loopTrack = select<HTMLElement>('.ada-loop-track')
      const loopContainer = select<HTMLElement>('.ada-subtitle-container')

      if (loopTrack) {
        const tickerTween = gsap.to(loopTrack, {
          xPercent: -50,
          duration: 160,
          ease: 'none',
          repeat: -1
        })

        if (loopContainer) {
          gsap.fromTo(
            loopContainer,
            { opacity: 0, y: 70 },
            {
              opacity: 1,
              y: 0,
              duration: 1.35,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: loopContainer,
                start: 'top 88%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
              }
            }
          )

          const pauseTicker = () => {
            gsap.to(tickerTween, { timeScale: 0, duration: 1.2, ease: 'power2.out' })
          }

          const playTicker = () => {
            gsap.to(tickerTween, { timeScale: 1, duration: 1.2, ease: 'power2.inOut' })
          }

          loopContainer.addEventListener('mouseenter', pauseTicker)
          loopContainer.addEventListener('mouseleave', playTicker)

          addCleanup(() => {
            loopContainer.removeEventListener('mouseenter', pauseTicker)
            loopContainer.removeEventListener('mouseleave', playTicker)
          })
        }
      }

      const loopTrackReverse = select<HTMLElement>('.ada-loop-track-reverse')
      const loopContainerReverse = select<HTMLElement>('.ada-subtitle-container-reverse')

      if (loopTrackReverse) {
        const tickerTweenReverse = gsap.fromTo(
          loopTrackReverse,
          { xPercent: -50 },
          {
            xPercent: 0,
            duration: 160,
            ease: 'none',
            repeat: -1
          }
        )

        if (loopContainerReverse) {
          gsap.fromTo(
            loopContainerReverse,
            { opacity: 0, y: 70 },
            {
              opacity: 1,
              y: 0,
              duration: 1.35,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: loopContainerReverse,
                start: 'top 88%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
              }
            }
          )

          const pauseTickerReverse = () => {
            gsap.to(tickerTweenReverse, { timeScale: 0, duration: 1.2, ease: 'power2.out' })
          }

          const playTickerReverse = () => {
            gsap.to(tickerTweenReverse, { timeScale: 1, duration: 1.2, ease: 'power2.inOut' })
          }

          loopContainerReverse.addEventListener('mouseenter', pauseTickerReverse)
          loopContainerReverse.addEventListener('mouseleave', playTickerReverse)

          addCleanup(() => {
            loopContainerReverse.removeEventListener('mouseenter', pauseTickerReverse)
            loopContainerReverse.removeEventListener('mouseleave', playTickerReverse)
          })
        }
      }

      if (window.matchMedia('(min-width: 1025px)').matches) {
        gsap.from('.ada-card', {
          y: 44,
          opacity: 0,
          stagger: 0.14,
          duration: 1.15,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.ada-founders-grid',
            start: 'top 88%',
            once: true
          }
        })
      }
    })

    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })
  }

  const initAdaModal = () => {
    const modal = select<HTMLElement>('#teamModal')
    const closeModalBtn = select<HTMLButtonElement>('#closeModal')
    const modalWrapper = select<HTMLElement>('.ada-modal-wrapper')
    const modalScrollArea = select<HTMLElement>('.ada-modal-scroll-area')
    let previousBodyOverflow = ''
    let previousHtmlOverflow = ''

    const lockPageScroll = () => {
      previousBodyOverflow = document.body.style.overflow
      previousHtmlOverflow = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      nuxtApp.$lenis?.stop?.()
    }

    const unlockPageScroll = () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      nuxtApp.$lenis?.start?.()
    }

    const updateModalScrollLine = () => {
      if (!modalWrapper || !modalScrollArea) return

      const isDesktopModal = window.matchMedia('(min-width: 1025px)').matches
      const scrollElement = isDesktopModal ? modalScrollArea : modalWrapper
      const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight
      const progress = maxScroll > 0 ? Math.min(Math.max(scrollElement.scrollTop / maxScroll, 0), 1) : 0

      modalWrapper.style.setProperty('--ada-modal-progress', progress.toFixed(4))
    }

    const resetModalScroll = () => {
      if (modalScrollArea) {
        modalScrollArea.scrollTop = 0
      }

      if (modalWrapper) {
        modalWrapper.scrollTop = 0
        modalWrapper.style.setProperty('--ada-modal-progress', '0')
      }
    }

    const closeModal = () => {
      if (!modal) return

      modal.classList.remove('active')
      unlockPageScroll()
      resetModalScroll()
    }

    const openTeamModal = (btn: HTMLElement) => {
      if (!modal) return

      const modalBio = select<HTMLElement>('#modalBio')
      const modalExp = select<HTMLElement>('#modalExp')
      const modalName = select<HTMLElement>('#modalName')
      const modalRole = select<HTMLElement>('#modalRole')
      const modalImage = select<HTMLImageElement>('#modalImage')
      const servicesList = select<HTMLUListElement>('#modalServices')

      if (modalName) {
        modalName.textContent = btn.dataset.name || ''
      }

      if (modalRole) {
        modalRole.textContent = btn.dataset.role || ''
      }

      if (modalBio) {
        modalBio.textContent = btn.dataset.bio || modalFallbackBio
      }

      if (modalImage) {
        modalImage.src = btn.dataset.image || ''
        modalImage.alt = btn.dataset.name || ''
      }

      if (modalExp) {
        modalExp.textContent = btn.dataset.exp || ''
      }

      if (servicesList) {
        servicesList.innerHTML = ''

        if (btn.dataset.services) {
          btn.dataset.services.split(',').forEach((service) => {
            const li = document.createElement('li')
            li.textContent = service.trim()
            servicesList.appendChild(li)
          })
        }
      }

      resetModalScroll()
      modal.classList.add('active')
      lockPageScroll()

      requestAnimationFrame(() => {
        updateModalScrollLine()
      })
    }

    const handleReadMoreClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const btn = target?.closest('.ada-read-more') as HTMLElement | null
      const card = target?.closest('.ada-card') as HTMLElement | null
      const cardBtn = card?.querySelector('.ada-read-more') as HTMLElement | null

      if (!btn && !cardBtn) return

      event.preventDefault()
      openTeamModal(btn || cardBtn)
    }

    const handleModalCloseClick = () => {
      closeModal()
    }

    const handleModalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null

      if (!target || !modal) return

      if (target === modal || target.classList.contains('ada-modal-overlay') || target.classList.contains('ada-modal-wrapper')) {
        closeModal()
      }
    }

    const handleModalWheel = (event: WheelEvent) => {
      if (!modalWrapper || !modalScrollArea) return

      event.preventDefault()

      if (window.matchMedia('(min-width: 1025px)').matches) {
        modalScrollArea.scrollTop += event.deltaY
      } else {
        modalWrapper.scrollTop += event.deltaY
      }

      updateModalScrollLine()
    }

    let startY = 0

    const handleTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY || 0
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!modalWrapper || !modalScrollArea) return

      const y = event.touches[0]?.clientY || 0
      const deltaY = startY - y

      event.preventDefault()

      if (window.matchMedia('(min-width: 1025px)').matches) {
        modalScrollArea.scrollTop += deltaY
      } else {
        modalWrapper.scrollTop += deltaY
      }

      updateModalScrollLine()
      startY = y
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('click', handleReadMoreClick)
    window.addEventListener('resize', updateModalScrollLine)
    document.addEventListener('keydown', handleKeydown)

    addCleanup(() => document.removeEventListener('click', handleReadMoreClick))
    addCleanup(() => window.removeEventListener('resize', updateModalScrollLine))
    addCleanup(() => document.removeEventListener('keydown', handleKeydown))
    addCleanup(() => {
      unlockPageScroll()
    })

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', handleModalCloseClick)
      addCleanup(() => closeModalBtn.removeEventListener('click', handleModalCloseClick))
    }

    if (modal) {
      modal.addEventListener('click', handleModalClick)
      addCleanup(() => modal.removeEventListener('click', handleModalClick))
    }

    if (modalScrollArea) {
      modalScrollArea.addEventListener('scroll', updateModalScrollLine, { passive: true })
      addCleanup(() => modalScrollArea.removeEventListener('scroll', updateModalScrollLine))
    }

    if (modalWrapper) {
      modalWrapper.addEventListener('wheel', handleModalWheel, { passive: false })
      modalWrapper.addEventListener('touchstart', handleTouchStart, { passive: true })
      modalWrapper.addEventListener('touchmove', handleTouchMove, { passive: false })

      addCleanup(() => modalWrapper.removeEventListener('wheel', handleModalWheel))
      addCleanup(() => modalWrapper.removeEventListener('touchstart', handleTouchStart))
      addCleanup(() => modalWrapper.removeEventListener('touchmove', handleTouchMove))
    }

    requestAnimationFrame(() => {
      updateModalScrollLine()
    })
  }

  const initMobileCarouselLoop = (ScrollTrigger: ScrollTriggerCore) => {
    const carouselWrapper = select<HTMLElement>('.ada-carousel-wrapper')
    const slider = select<HTMLElement>('.ada-founders-grid')

    if (!carouselWrapper || !slider) return

    const mobileQuery = window.matchMedia('(max-width: 1024px)')
    let loopActive = false
    let jumping = false
    let resizeTimer: ReturnType<typeof window.setTimeout> | null = null

    const getOriginalCards = () => {
      return Array.from(slider.querySelectorAll('.ada-card:not([data-loop-clone="true"])')) as HTMLElement[]
    }

    const cleanCardInlineStyles = (card: HTMLElement) => {
      card.style.opacity = ''
      card.style.visibility = ''
      card.style.transform = ''

      card.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.opacity = ''
        htmlEl.style.visibility = ''
        htmlEl.style.transform = ''
      })
    }

    const getCenteredScrollLeft = (card: HTMLElement) => {
      return card.offsetLeft - ((carouselWrapper.clientWidth - card.offsetWidth) / 2)
    }

    const removeLoop = () => {
      carouselWrapper.removeEventListener('scroll', handleLoopScroll)

      slider.querySelectorAll('.ada-card[data-loop-clone="true"]').forEach((clone) => {
        clone.remove()
      })

      slider.querySelectorAll('.ada-card[data-loop-original="true"]').forEach((card) => {
        const htmlCard = card as HTMLElement
        htmlCard.removeAttribute('data-loop-original')
        cleanCardInlineStyles(htmlCard)
      })

      loopActive = false
      jumping = false
    }

    const getLoopMetrics = () => {
      const originals = Array.from(slider.querySelectorAll('.ada-card[data-loop-original="true"]')) as HTMLElement[]
      const firstOriginal = originals[0]
      const firstAfterClone = slider.querySelector('.ada-card[data-loop-clone-position="after"]') as HTMLElement | null

      if (!firstOriginal || !firstAfterClone) return null

      const start = getCenteredScrollLeft(firstOriginal)
      const end = getCenteredScrollLeft(firstAfterClone)
      const length = end - start

      if (length <= 0) return null

      return { start, end, length }
    }

    const jumpTo = (left: number) => {
      jumping = true

      const oldBehavior = carouselWrapper.style.scrollBehavior
      carouselWrapper.style.scrollBehavior = 'auto'
      carouselWrapper.scrollLeft = left

      requestAnimationFrame(() => {
        carouselWrapper.style.scrollBehavior = oldBehavior

        requestAnimationFrame(() => {
          jumping = false
        })
      })
    }

    function handleLoopScroll() {
      if (!mobileQuery.matches || !loopActive || jumping) return

      const metrics = getLoopMetrics()

      if (!metrics) return

      if (carouselWrapper.scrollLeft < metrics.start) {
        jumpTo(carouselWrapper.scrollLeft + metrics.length)
        return
      }

      if (carouselWrapper.scrollLeft >= metrics.end) {
        jumpTo(carouselWrapper.scrollLeft - metrics.length)
      }
    }

    const initLoop = () => {
      removeLoop()

      if (!mobileQuery.matches) return

      const originals = getOriginalCards()

      if (originals.length < 2) return

      const beforeFragment = document.createDocumentFragment()
      const afterFragment = document.createDocumentFragment()

      originals.forEach((card) => {
        card.setAttribute('data-loop-original', 'true')
        cleanCardInlineStyles(card)
      })

      originals.forEach((card) => {
        const beforeClone = card.cloneNode(true) as HTMLElement
        beforeClone.setAttribute('data-loop-clone', 'true')
        beforeClone.setAttribute('data-loop-clone-position', 'before')
        beforeClone.removeAttribute('data-loop-original')
        cleanCardInlineStyles(beforeClone)
        beforeFragment.appendChild(beforeClone)
      })

      originals.forEach((card) => {
        const afterClone = card.cloneNode(true) as HTMLElement
        afterClone.setAttribute('data-loop-clone', 'true')
        afterClone.setAttribute('data-loop-clone-position', 'after')
        afterClone.removeAttribute('data-loop-original')
        cleanCardInlineStyles(afterClone)
        afterFragment.appendChild(afterClone)
      })

      slider.insertBefore(beforeFragment, originals[0])
      slider.appendChild(afterFragment)
      loopActive = true

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const firstOriginal = slider.querySelector('.ada-card[data-loop-original="true"]') as HTMLElement | null

          if (firstOriginal) {
            jumpTo(getCenteredScrollLeft(firstOriginal))
          }

          carouselWrapper.addEventListener('scroll', handleLoopScroll, { passive: true })
          ScrollTrigger.refresh()
        })
      })
    }

    const handleResize = () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer)
      }

      resizeTimer = window.setTimeout(initLoop, 180)
    }

    const handleMediaChange = () => {
      initLoop()
    }

    const handleLoad = () => {
      if (mobileQuery.matches) {
        initLoop()
      }
    }

    initLoop()

    window.addEventListener('resize', handleResize)
    window.addEventListener('load', handleLoad)

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleMediaChange)
      addCleanup(() => mobileQuery.removeEventListener('change', handleMediaChange))
    } else {
      mobileQuery.addListener(handleMediaChange)
      addCleanup(() => mobileQuery.removeListener(handleMediaChange))
    }

    addCleanup(() => window.removeEventListener('resize', handleResize))
    addCleanup(() => window.removeEventListener('load', handleLoad))
    addCleanup(() => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer)
      }

      removeLoop()
    })
  }

  const destroyAboutTeamSection = () => {
    cleanupTasks.slice().reverse().forEach((task) => task())
    cleanupTasks = []

    if (gsapContext) {
      gsapContext.revert()
      gsapContext = null
    }
  }

  const initAboutTeamSection = () => {
    const win = window as typeof window & { __adaAboutTeamMounted?: boolean; __adaAboutTeamDestroy?: () => void }

    if (win.__adaAboutTeamMounted) return
    win.__adaAboutTeamMounted = true
    win.__adaAboutTeamDestroy = destroyAboutTeamSection

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

    gsap.registerPlugin(ScrollTrigger)

    initAdaGsap(gsap, ScrollTrigger)
    initAdaModal()
    initMobileCarouselLoop(ScrollTrigger)

    window.addEventListener('load', ScrollTrigger.refresh)
    addCleanup(() => window.removeEventListener('load', ScrollTrigger.refresh))

    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAboutTeamSection, { once: true })
    } else {
      requestAnimationFrame(initAboutTeamSection)
    }
  }
})()
</script>

