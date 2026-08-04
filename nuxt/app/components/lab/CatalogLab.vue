<script setup lang="ts">
/**
 * KATALOG LAB — yeni katalog sisteminin kurulduğu yer.
 *
 * HomeCatalog.vue'nun davranışlarını KORUMAZ; sıfırdan kuruluyor.
 * Production dosyasına bağlı değil, ona hiç dokunmuyor.
 *
 * Sistem:
 *   • Kartlar baştan DOM'da — v-if ile satır açma yok, `visibleRows`
 *     state'i yok, ayrı scroll dinleyicisi yok.
 *   • Giriş animasyonu motion-v'nin kendi proplarıyla: `initial` +
 *     `whileInView`. Composable yok.
 *
 * ScrollSmoother notu: sayfa transform ile kaydığı için tarayıcının
 * IntersectionObserver'ı kartları "ekran dışında" görüyor (ölçüldü:
 * transform matrix(1,0,0,1,0,-6339), kart top -3941, isIntersecting
 * false). Motion'a `root` olarak scroll kabı veriliyor — kesişimi ona
 * göre hesaplasın.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { motion } from "motion-v";
import { useHomeCatalog } from "~/composables/useHomeCatalog";
import { useCatalogCopy } from "~/composables/useCatalogCopy";
import { useLiquidMenu } from "~/composables/useLiquidMenu";
import CatalogModalLab from "~/components/lab/CatalogModalLab.vue";
import { useCatalogStructuralLine } from "~/composables/useCatalogStructuralLine";
import { useMagneticHover } from "~/composables/useMagneticHover";

const {
  catalogBlocks,
  getCatalogPreviewProducts,
  activeProduct,
  activeProductIndex,
  toggleLike,
  openProductModal,
  closeProductModal,
  showPreviousProduct,
  showNextProduct,
  handleProductModalKeydown,
  resetCatalogModalState
} = useHomeCatalog();
const { catalogCopy } = useCatalogCopy();

// Yapı çizgisi: bölümün ve satırların geometrisini okur, scroll ile çizilir.
const sectionRef = ref<HTMLElement | null>(null);
const rowRefs = ref<HTMLElement[]>([]);
const setRowRef = (el: any) => {
  if (el && !rowRefs.value.includes(el)) rowRefs.value.push(el);
};

const {
  svgRef: lineSvgRef,
  pathRef: linePathRef,
  gradientRef: lineGradientRef
} = useCatalogStructuralLine({ section: sectionRef, rows: rowRefs });

// "Tümü" bağlantısının mıknatıs etkisi.
const magnet = useMagneticHover();

// Kart kenarındaki damla şerit + hamburger. Fizik, rAF döngüsü ve olay
// işleyicileri kendi sahibinde (bkz. useLiquidMenu).
const {
  expanded: liquidExpanded,
  isIconHovered,
  setBlobPathRef,
  setBlobContainerRef,
  setHamburgerRef,
  onZoneMouseMove,
  onZoneEnter,
  onZoneLeave,
  onZoneClick,
  onCardMouseMove
} = useLiquidMenu();

const localizedBlocks = computed(() =>
  catalogBlocks.map((block: any) => ({
    ...block,
    ...(catalogCopy.value.blocks[block.index] ?? {})
  }))
);

// Modal, ürünün serisini/koleksiyonunu SEÇİLİ DİLDE göstermeli. Ürün
// verisi dilden bağımsız; eşleme kod önekiyle yapılır (AL-001 → Alüminyum).
const activeBlock = computed(() => {
  const product = activeProduct.value;
  if (!product?.code) return null;
  return localizedBlocks.value.find((b: any) =>
    product.code.startsWith(`${b.productPrefix}-`)
  ) ?? null;
});

const activeSeries = computed(
  () => activeBlock.value?.cardTitle ?? activeProduct.value?.series ?? ""
);
const activeCollection = computed(
  () => activeBlock.value?.seriesLabel ?? activeProduct.value?.collection ?? ""
);
const activeCategory = computed(
  () => activeBlock.value?.description ?? activeProduct.value?.category ?? ""
);
/**
 * Sistem adı. Blok başlığını BAŞA EKLEMİYORUZ: o zaten seri adı ve modalın
 * üst satırında görünüyordu — "Alüminyum Sistemler / Çelik / Alüminyum kapı
 * sistemi" gibi kendini tekrar eden bir değer çıkıyordu (ölçüldü).
 */
const activeSystem = computed(
  () => activeProduct.value?.system ?? catalogCopy.value.modal.systemFallback
);

/** ImageKit görseli düşerse yerel kopyaya geç. */
const handleImageError = (event: Event, fallbackSrc?: string) => {
  const img = event.target as HTMLImageElement;
  if (fallbackSrc && img.src !== fallbackSrc) img.src = fallbackSrc;
};

/** Grid küçük görsel istiyor; kaynak dosyalar ~1400x2300. */
const thumb = (url?: string) => {
  if (!url || !url.includes("ik.imagekit.io")) return url || "";
  return `${url.split("?")[0]}?tr=w-360,q-82`;
};

// ── GİRİŞ ANİMASYONU ───────────────────────────────────────────────────
// Bulanıklıktan netleşerek, hafif büyüyerek. Hero/navbar ile aynı dil;
// kartlar küçük olduğu için blur 20px değil 12px.
const enterFrom = { opacity: 0, filter: "blur(12px)", scale: 0.96 };
const enterTo = { opacity: 1, filter: "blur(0px)", scale: 1 };
const enterTransition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

/** Kart başına gecikme — satır içinde sıralı giriş. */
const CARD_STAGGER = 0.08;

/**
 * Kart hover'ı SPRING ile: CSS geçişi imleç hızla girip çıkınca baştan
 * başlıyor, spring mevcut hızdan devam ediyor — fiziksel his. Ayrıca
 * WAAPI'ye derlendiği için ana iş parçacığının dışında oynuyor.
 *
 * bounce düşük (0.15): kapı kartı zıplamamalı, sadece "canlı" durmalı.
 */
const cardSpring = { type: "spring" as const, bounce: 0.15, duration: 0.4 };

/** Kart: hafifçe yükselir. Gölge de burada — CSS'te değil. */
const cardHover = {
  y: -6,
  boxShadow: "0 8px 18px rgba(0, 0, 0, 0.08)",
  transition: cardSpring
};

/**
 * Görsel: kart hover'ında büyür. Eskiden CSS'teydi ama `!important`
 * transform kuralı Motion'ın layoutId geçişini de eziyordu — iki sistem
 * aynı property'yi yönetemez.
 */
const imageHover = { scale: 1.045, y: -3, transition: cardSpring };

/**
 * ScrollSmoother'ın taşıdığı kap, IO'nun kökü olarak verilir. Kesişim
 * viewport'a göre değil bu kaba göre hesaplanır.
 */
/**
 * Kartı klavyeyle açma.
 *
 * Kartlar `<article tabindex="0">` idi: Tab ile odaklanılabiliyorlardı ama
 * Enter/Space hiçbir şey yapmıyordu — yalnız `@click` bağlıydı (ölçüldü:
 * her iki tuş da modalı açmadı). Yani klavye kullanıcısı 68 ürünün
 * hiçbirini açamıyordu. `role="button"` ile birlikte bu handler, yerel
 * bir <button>'ın verdiği davranışı geri getiriyor.
 *
 * Space'te `preventDefault`: yoksa tarayıcı sayfayı bir ekran aşağı kaydırır.
 */
const onCardKeydown = (event: KeyboardEvent, productIndex: number) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openProductModal(productIndex);
};

/**
 * Klavye gezinmesini MODAL'IN KENDİSİ yönetiyor (CatalogModalLab).
 *
 * Burada da `handleProductModalKeydown` window'a bağlıydı: iki dinleyici aynı
 * tuşu işliyordu ve tek ArrowRight ürünü İKİ İLERİ atlıyordu (ölçüldü:
 * AL-001 → AL-003). Eski modalın kendi klavye desteği yoktu, o yüzden bu
 * bağlama oradan kalmış. Modal artık odak tuzağını da yönettiği için tek
 * sahip olması şart.
 */
onBeforeUnmount(() => {
  // Modal açıkken sayfadan çıkılırsa body overflow kilidi kalmasın.
  resetCatalogModalState();
});

const inViewOptions = {
  once: true,
  // amount: kartın bu kadarı görününce tetikle. ScrollSmoother transform'u
  // yüzünden kesişim geç hesaplanıyor; küçük eşik erken yakalıyor.
  amount: 0 as const,
  margin: "0px 0px 40% 0px" as const
};
</script>

<template>
  <section ref="sectionRef" class="catalog-section">
    <div class="catalog-stage-backdrop" aria-hidden="true"></div>

    <svg
      ref="lineSvgRef"
      class="catalog-structural-lines"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="catalog-structural-line-gradient"
          ref="lineGradientRef"
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
      <path ref="linePathRef" class="catalog-structural-line-path" />
    </svg>

    <div class="catalog-shell">
      <main class="catalog-main">
        <div class="catalog-sticky-title">
          <h2 class="catalog-title">{{ catalogCopy.title }}</h2>
        </div>

        <div
          v-for="block in localizedBlocks"
          :key="block.index"
          :ref="setRowRef"
          :data-row-index="block.index"
          class="catalog-row"
          :class="{
            'is-liquid-expanded': liquidExpanded[`block-${block.index}`],
            'is-liquid-icon-hovered': isIconHovered(`block-${block.index}`)
          }"
        >
          <div class="catalog-row-info">
            <motion.div
              :initial="enterFrom"
              :while-in-view="enterTo"
              :in-view-options="inViewOptions"
              :transition="enterTransition"
            >
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
                @mousemove="magnet.onMove"
                @mouseleave="magnet.onLeave"
              >
                <span class="catalog-tag-part">
                  <span class="catalog-tag-label catalog-tag-label--short">{{ catalogCopy.allShort }}</span>
                  <span class="catalog-tag-label catalog-tag-label--full">{{ catalogCopy.allFull }}</span>
                  <span class="catalog-tag-line"></span>
                </span>
              </a>
            </motion.div>
          </div>

          <div
            class="catalog-card liquid-card"
            @mousemove="onCardMouseMove($event, `block-${block.index}`)"
          >
            <div class="catalog-card-header">
              <h3 class="catalog-card-title">
                {{ block.cardTitle }} <span>{{ block.seriesLabel }}</span>
              </h3>

              <div class="catalog-card-actions">
                <span class="catalog-card-subtitle">{{ block.description }}</span>
              </div>
            </div>

            <div class="catalog-product-grid">
              <motion.article
                v-for="(item, index) in getCatalogPreviewProducts(block)"
                :key="'row-' + block.index + '-item-' + item.id"
                class="catalog-product"
                :initial="enterFrom"
                :while-in-view="enterTo"
                :in-view-options="inViewOptions"
                :transition="{ ...enterTransition, delay: index * CARD_STAGGER }"
                :variants="{ hover: cardHover }"
                while-hover="hover"
                :while-press="{ scale: 0.985 }"
                role="button"
                :aria-label="`${item.finish} ${block.cardTitle} ${item.code}`"
                @click="openProductModal(item.productIndex)"
                @keydown="onCardKeydown($event, item.productIndex)"
              >
                <div class="catalog-product-image-wrap">
                  <!-- layoutId: modaldaki görselle AYNI kimlik. Tıklanınca
                       Motion aradaki geçişi kendisi kurar. -->
                  <motion.img
                    :layout-id="`door-${item.code}`"
                    :src="thumb(item.image)"
                    :alt="catalogCopy.productImageAlt"
                    class="catalog-product-image"
                    loading="lazy"
                    decoding="async"
                    :variants="{ hover: imageHover }"
                    :transition="{ type: 'spring', bounce: 0.18, duration: 0.55 }"
                    @error="handleImageError($event, item.localImage)"
                  />
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
              </motion.article>
            </div>

            <div
              class="liquid-menu"
              :class="{ 'is-expanded': liquidExpanded[`block-${block.index}`] }"
            >
              <div class="liquid-edge-control">
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
                  @mousemove="onZoneMouseMove($event, `block-${block.index}`)"
                  @mouseenter="onZoneEnter(`block-${block.index}`, $event)"
                  @mouseleave="onZoneLeave(`block-${block.index}`)"
                  @click.stop="onZoneClick($event, `block-${block.index}`)"
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

              <div class="liquid-menu-inner" @click.stop>
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

  <!-- AnimatePresence modalın İÇİNDE (Teleport'un altında): burada
       sarmak "non-element root node" uyarısı veriyor, çünkü Teleport
       içeriği body'ye taşıyor ve Vue canlandırılabilir bir kök göremiyor. -->
  <!-- v-if YOK: bileşen hep mount kalır, görünürlüğü içerideki
       AnimatePresence yönetir. Dıştaki v-if bileşeni komple kaldırıyordu,
       o yüzden çıkış animasyonu hiç oynayamıyordu (Teleport içindeki
       AnimatePresence kaldırma kararını göremiyor). -->
  <!-- Modal LAB sürümü: iki kolon, panel yükselir, sade içerik.
       Eski CatalogProductModal.vue production'da duruyor, dokunulmadı
       (yedek: backups/CatalogProductModal.vue.eski-2026-08-04.bak). -->
  <CatalogModalLab
    :product="activeProduct"
    :copy="catalogCopy"
    :series="activeSeries"
    :collection="activeCollection"
    :system="activeSystem"
    @close="closeProductModal"
    @prev="showPreviousProduct"
    @next="showNextProduct"
  />
</template>
