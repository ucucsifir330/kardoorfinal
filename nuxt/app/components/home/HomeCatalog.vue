<script setup lang="ts">
/**
 * HomeCatalog — ana sayfa katalog bölümü.
 *
 * 2026-08-06'da lab'de sıfırdan kurulan sürüm production'a alındı; eski
 * 501 satırlık bileşen + 1700 satırlık home-catalog.css yerine geçti
 * (yedekler: backups/HomeCatalog.vue.eski-2026-08-06.bak,
 * backups/home-catalog.css.eski-2026-08-06.bak).
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
import { computed, onBeforeUnmount, ref } from "vue";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion-v";
import { useHomeCatalog } from "~/composables/useHomeCatalog";
import { useCatalogCopy } from "~/composables/useCatalogCopy";
import { useLiquidMenu } from "~/composables/useLiquidMenu";
import CatalogProductModal from "~/components/home/CatalogProductModal.vue";
import { useCatalogStructuralLine } from "~/composables/useCatalogStructuralLine";
import { useMagneticHover } from "~/composables/useMagneticHover";

const {
  products,
  catalogBlocks,
  getCatalogProductCount,
  getCatalogPreviewGroups,
  activeProduct,
  activeProductIndex,
  openProductModal,
  closeProductModal,
  showPreviousProduct,
  showNextProduct,
  resetCatalogModalState
} = useHomeCatalog();
const { catalogCopy } = useCatalogCopy();
const shouldReduceMotion = useReducedMotion();

// Yapı çizgisi: bölümün ve satırların geometrisini okur, scroll ile çizilir.
const sectionRef = ref<HTMLElement | null>(null);
const rowRefs = ref<HTMLElement[]>([]);
const setRowRef = (el: any) => {
  if (el && !rowRefs.value.includes(el)) rowRefs.value.push(el);
};

const {
  svgRef: lineSvgRef,
  pathRef: linePathRef,
  clipRectRef: lineClipRectRef
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
  catalogBlocks.map((block) => {
    const localizedBlock = catalogCopy.value.blocks[block.index] ?? {};
    return {
      ...block,
      ...localizedBlock,
      sources: block.sources.map((source) => ({
        ...source,
        ...(localizedBlock.sources?.[source.seriesSlug] ?? {})
      }))
    };
  })
);

const selectedSourceByBlock = ref<Record<number, string>>({});
const selectedSubclassByBlock = ref<Record<number, string>>({});

const selectedSourceSlug = (block: any) => {
  if (block.sources.length === 1) return block.sources[0].seriesSlug;
  return selectedSourceByBlock.value[block.index] ?? "all";
};

const selectSource = (blockIndex: number, sourceSlug: string) => {
  if ((selectedSourceByBlock.value[blockIndex] ?? "all") === sourceSlug) return;

  selectedSourceByBlock.value = {
    ...selectedSourceByBlock.value,
    [blockIndex]: sourceSlug
  };
};

const sidebarSubclasses = (block: any) =>
  block.index === 3 || block.index === 4 || block.index === 5
    ? block.sources[0]?.parts ?? []
    : [];

const selectedSubclass = (blockIndex: number) =>
  selectedSubclassByBlock.value[blockIndex] ?? "all";

const selectSubclass = (blockIndex: number, subclassId: string) => {
  if ((selectedSubclassByBlock.value[blockIndex] ?? "all") === subclassId) return;

  selectedSubclassByBlock.value = {
    ...selectedSubclassByBlock.value,
    [blockIndex]: subclassId
  };
};

const activeTechnicalParts = (block: any) => {
  const sourceSlug = selectedSourceSlug(block);
  if (sourceSlug === "all") return [];
  return block.sources.find((source: any) => source.seriesSlug === sourceSlug)?.parts ?? [];
};

const isEmphasizedFacet = (block: any, facetId: string) => {
  const sourceSlug = selectedSourceSlug(block);
  const source = block.sources.find((item: any) => item.seriesSlug === sourceSlug);
  return source?.emphasizedFacetIds?.includes(facetId) ?? false;
};

// Modal, ürünün müşteri yüzündeki beşli grubunu SEÇİLİ DİLDE göstermeli.
// Kanonik ürün verisi değişmez; eşleme mevcut `seriesSlug` üzerinden yapılır.
const activeBlock = computed(() => {
  const product = activeProduct.value;
  if (!product?.code) return null;
  return localizedBlocks.value.find((block: any) =>
    block.sources.some((source: any) => source.seriesSlug === product.seriesSlug)
  ) ?? null;
});

const activeSeries = computed(
  () => activeBlock.value?.cardTitle ?? activeProduct.value?.series ?? ""
);
const activeCollection = computed(
  () => activeBlock.value
    ? `${getCatalogProductCount(activeBlock.value)} ${catalogCopy.value.model}`
    : activeProduct.value?.collection ?? ""
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

/**
 * Kart görselinin ImageKit dönüşümü.
 *
 * Ölçüldü: kart görseli en büyük kırılımda bile ~219px genişlikte
 * gösteriliyor (kutu yüksekliği tavanı 312px, en geniş kapı oranı 0.70).
 * Sabit `w-360` ise DPR 1'de gösterilenin ~3.8 katı piksel indiriyordu —
 * 68 görselde birden, Lighthouse'un "properly size images" maddesi.
 *
 * Artık `srcset` ile yoğunluk seçenekleri veriliyor: DPR 1 ekran 220px,
 * DPR 2 ekran 440px iniyor. Tarayıcı hangisinin gerektiğine kendisi karar
 * veriyor, biz cihaz tahmini yapmıyoruz.
 */
const KART_GORSEL_W = 220;

const ikUrl = (url: string, genislik: number) =>
  `${url.split("?")[0]}?tr=w-${genislik},q-82`;

const thumb = (url?: string) => {
  if (!url || !url.includes("ik.imagekit.io")) return url || "";
  return ikUrl(url, KART_GORSEL_W);
};

/**
 * `w` tanımlayıcılı srcset — `1x/2x` DEĞİL.
 *
 * Yoğunluk tanımlayıcısıyla (`2x`) DPR 1.25 gibi ARA değerlerde tarayıcı
 * yukarı yuvarlayıp 2x dalını seçiyordu: 220px'lik karta 440px iniyordu,
 * 23 KB yerine 87.6 KB — 68 kartta ~4.4 MB fazladan (ölçüldü).
 *
 * `w` + `sizes` ile tarayıcı gerçek CSS genişliğini DPR ile çarpıp en
 * yakın adayı seçiyor: DPR 1.25'te 275px gerekiyor → 330 dalı yeterli,
 * 440'a çıkmıyor. Retina (DPR 2) ekranda ise 440'ı kendisi seçiyor.
 */
const thumbSrcset = (url?: string) => {
  if (!url || !url.includes("ik.imagekit.io")) return undefined;
  return [220, 330, 440]
    .map((w) => `${ikUrl(url, w)} ${w}w`)
    .join(", ");
};

// ── GİRİŞ ANİMASYONU ───────────────────────────────────────────────────
// Bulanıklıktan netleşerek, hafif büyüyerek. Hero/navbar ile aynı dil;
// kartlar küçük olduğu için blur 20px değil 12px.
const enterFrom = computed(() =>
  shouldReduceMotion.value
    ? { opacity: 0 }
    : { opacity: 0, filter: "blur(12px)", scale: 0.96 }
);
const enterTo = computed(() =>
  shouldReduceMotion.value
    ? { opacity: 1 }
    : { opacity: 1, filter: "blur(0px)", scale: 1 }
);
const enterTransition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

/** Kart başına gecikme — satır içinde sıralı giriş. */
const CARD_STAGGER = 0.08;

/**
 * Filtre geri bildirimi modalın ağır ama kontrollü hareket dilini taşır.
 * Aktif yüzey düşük bounce'lu spring ile seçenekler arasında süzülür;
 * kartlar çıkarken kısa, girerken daha uzun davranır.
 */
const filterIndicatorTransition = computed(() =>
  shouldReduceMotion.value
    ? { duration: 0 }
    : { type: "spring" as const, visualDuration: 0.58, bounce: 0.06 }
);
const filterPressTransition = {
  type: "spring" as const,
  visualDuration: 0.2,
  bounce: 0.08
};
const filterLayoutTransition = computed(() =>
  shouldReduceMotion.value
    ? { duration: 0 }
    : { type: "spring" as const, visualDuration: 0.62, bounce: 0.06 }
);
const filterExit = computed(() =>
  shouldReduceMotion.value
    ? { opacity: 0, transition: { duration: 0.12 } }
    : {
        opacity: 0,
        filter: "blur(5px)",
        scale: 0.985,
        y: 8,
        transition: { duration: 0.24, ease: [0.4, 0, 1, 1] as const }
      }
);
const filterDividerEnter = computed(() =>
  shouldReduceMotion.value
    ? { opacity: 1 }
    : { opacity: 1, filter: "blur(0px)", y: 0 }
);
const filterDividerInitial = computed(() =>
  shouldReduceMotion.value
    ? { opacity: 0 }
    : { opacity: 0, filter: "blur(4px)", y: 6 }
);
const filterDividerExit = computed(() =>
  shouldReduceMotion.value
    ? { opacity: 0, transition: { duration: 0.12 } }
    : {
        opacity: 0,
        filter: "blur(4px)",
        y: 6,
        transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const }
      }
);

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
 * transform kuralı Motion'ın yazdığı satır içi stili eziyordu — iki sistem
 * aynı property'yi yönetemez.
 */
const imageHover = { scale: 1.045, y: -3, transition: cardSpring };

/**
 * ScrollSmoother'ın taşıdığı kap, IO'nun kökü olarak verilir. Kesişim
 * viewport'a göre değil bu kaba göre hesaplanır.
 */
/**
 * Modal açıkken önceki/sonraki ürünün görseli.
 *
 * Ok tuşuyla gezinirken önbellekte olmayan görsel yavaş ağda 728–838 ms
 * sonra beliriyordu (ölçüldü). Bunları şimdiden indirtiyoruz; sıra mantığı
 * burada, modal yalnız listeyi alıyor.
 */
const neighbourImages = computed(() => {
  const i = activeProductIndex.value;
  const liste = products.value;
  if (i === null || !liste.length) return [];
  const oncekiIdx = (i - 1 + liste.length) % liste.length;
  const sonrakiIdx = (i + 1) % liste.length;
  return [liste[sonrakiIdx]?.image, liste[oncekiIdx]?.image].filter(Boolean) as string[];
});

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
 * Klavye gezinmesini MODAL'IN KENDİSİ yönetiyor (CatalogProductModal).
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
        <clipPath id="catalog-structural-line-clip" clipPathUnits="userSpaceOnUse">
          <rect ref="lineClipRectRef" x="0" y="0" width="0" height="0" />
        </clipPath>
      </defs>
      <path
        ref="linePathRef"
        class="catalog-structural-line-path"
        clip-path="url(#catalog-structural-line-clip)"
      />
      <g
        v-for="block in localizedBlocks"
        :key="`catalog-line-node-${block.index}`"
        :data-row-index="block.index"
        class="catalog-structural-line-node"
      >
        <circle class="catalog-structural-line-node__dot" r="3.5" />
      </g>
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
          :data-hero-group="block.heroGroup"
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
              <div class="catalog-sidebar-heading">
                <h2 class="catalog-product-family">{{ block.number }}</h2>
                <p class="catalog-designer">{{ block.shortName }}</p>
              </div>

              <div v-if="block.sources.length > 1" class="catalog-source-filter">
                <LayoutGroup :id="`catalog-filter-${block.index}`">
                  <div class="catalog-source-filter__options" role="group" :aria-label="catalogCopy.sourceSeries">
                  <motion.button
                    class="catalog-source-filter__option"
                    :class="{ 'is-active': selectedSourceSlug(block) === 'all' }"
                    type="button"
                    :aria-pressed="selectedSourceSlug(block) === 'all'"
                    :while-press="{ scale: 0.97 }"
                    :transition="filterPressTransition"
                    @click="selectSource(block.index, 'all')"
                  >
                    <motion.span
                      v-if="selectedSourceSlug(block) === 'all'"
                      class="catalog-source-filter__active-bg"
                      :layout-id="`catalog-filter-active-${block.index}`"
                      :transition="filterIndicatorTransition"
                      aria-hidden="true"
                    >
                      <span class="catalog-source-filter__active-dot"></span>
                    </motion.span>
                    <span class="catalog-source-filter__label">{{ catalogCopy.allSources }}</span>
                  </motion.button>
                  <motion.button
                    v-for="source in block.sources"
                    :key="source.seriesSlug"
                    class="catalog-source-filter__option"
                    :class="{ 'is-active': selectedSourceSlug(block) === source.seriesSlug }"
                    type="button"
                    :aria-pressed="selectedSourceSlug(block) === source.seriesSlug"
                    :while-press="{ scale: 0.97 }"
                    :transition="filterPressTransition"
                    @click="selectSource(block.index, source.seriesSlug)"
                  >
                    <motion.span
                      v-if="selectedSourceSlug(block) === source.seriesSlug"
                      class="catalog-source-filter__active-bg"
                      :layout-id="`catalog-filter-active-${block.index}`"
                      :transition="filterIndicatorTransition"
                      aria-hidden="true"
                    >
                      <span class="catalog-source-filter__active-dot"></span>
                    </motion.span>
                    <span class="catalog-source-filter__label">{{ source.short }}</span>
                  </motion.button>
                  </div>
                </LayoutGroup>
              </div>

              <div v-if="sidebarSubclasses(block).length" class="catalog-source-filter">
                <LayoutGroup :id="`catalog-filter-${block.index}`">
                  <div
                    class="catalog-source-filter__options"
                    role="group"
                    :aria-label="catalogCopy.subclasses"
                  >
                  <motion.button
                    class="catalog-source-filter__option"
                    :class="{ 'is-active': selectedSubclass(block.index) === 'all' }"
                    type="button"
                    :aria-pressed="selectedSubclass(block.index) === 'all'"
                    :while-press="{ scale: 0.97 }"
                    :transition="filterPressTransition"
                    @click="selectSubclass(block.index, 'all')"
                  >
                    <motion.span
                      v-if="selectedSubclass(block.index) === 'all'"
                      class="catalog-source-filter__active-bg"
                      :layout-id="`catalog-filter-active-${block.index}`"
                      :transition="filterIndicatorTransition"
                      aria-hidden="true"
                    >
                      <span class="catalog-source-filter__active-dot"></span>
                    </motion.span>
                    <span class="catalog-source-filter__label">{{ catalogCopy.allSources }}</span>
                  </motion.button>
                  <motion.button
                    v-for="subclass in sidebarSubclasses(block)"
                    :key="subclass.id"
                    class="catalog-source-filter__option"
                    :class="{ 'is-active': selectedSubclass(block.index) === subclass.id }"
                    type="button"
                    :aria-pressed="selectedSubclass(block.index) === subclass.id"
                    :while-press="{ scale: 0.97 }"
                    :transition="filterPressTransition"
                    @click="selectSubclass(block.index, subclass.id)"
                  >
                    <motion.span
                      v-if="selectedSubclass(block.index) === subclass.id"
                      class="catalog-source-filter__active-bg"
                      :layout-id="`catalog-filter-active-${block.index}`"
                      :transition="filterIndicatorTransition"
                      aria-hidden="true"
                    >
                      <span class="catalog-source-filter__active-dot"></span>
                    </motion.span>
                    <span class="catalog-source-filter__label">{{ subclass.short }}</span>
                  </motion.button>
                  </div>
                </LayoutGroup>
              </div>

              <a
                class="catalog-all-models catalog-magnetic-link"
                href="/catalog"
                @mousemove="magnet.onMove"
                @mouseleave="magnet.onLeave"
              >
                <svg
                  class="catalog-all-models__icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M2.75 12s3.25-5.25 9.25-5.25S21.25 12 21.25 12 18 17.25 12 17.25 2.75 12 2.75 12Z" />
                  <circle cx="12" cy="12" r="2.25" />
                </svg>
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
                {{ block.cardTitle }}
              </h3>

              <div class="catalog-card-actions">
                <span class="catalog-card-subtitle">{{ block.description }}</span>
              </div>
            </div>

            <div class="catalog-product-grid">
              <AnimatePresence mode="popLayout">
              <template
                v-for="(previewGroup, groupIndex) in getCatalogPreviewGroups(block, selectedSourceSlug(block))"
                :key="`${block.heroGroup}-${previewGroup.source.seriesSlug}`"
              >
                <motion.div
                  v-if="block.sources.length > 1"
                  :key="`${block.heroGroup}-${previewGroup.source.seriesSlug}-divider`"
                  class="catalog-source-divider"
                  layout="position"
                  :initial="filterDividerInitial"
                  :animate="filterDividerEnter"
                  :exit="filterDividerExit"
                  :transition="{ ...enterTransition, layout: filterLayoutTransition }"
                >
                  <span>{{ previewGroup.source.full }}</span>
                  <small>{{ previewGroup.totalCount }} {{ catalogCopy.model }}</small>
                </motion.div>

                <motion.article
                  v-for="(item, index) in previewGroup.products"
                  :key="'row-' + block.index + '-item-' + item.id"
                  class="catalog-product"
                  layout="position"
                  :initial="enterFrom"
                  :while-in-view="enterTo"
                  :exit="filterExit"
                  :in-view-options="inViewOptions"
                  :transition="{
                    ...enterTransition,
                    layout: filterLayoutTransition,
                    delay: (groupIndex * previewGroup.products.length + index) * CARD_STAGGER
                  }"
                  :variants="{ hover: cardHover }"
                  while-hover="hover"
                  :while-press="{ scale: 0.985 }"
                  role="button"
                  :aria-label="`${item.finish} ${block.cardTitle} ${item.code}`"
                  @click="openProductModal(item.productIndex)"
                  @keydown="onCardKeydown($event, item.productIndex)"
                >
                <div class="catalog-product-image-wrap">
                  <!-- `layout-id` YOK: eşi olacak modal görseli `<Teleport>`
                       ile gövdeye taşınıyor, düzen ağacı koptuğu için Motion
                       geçişi zaten kuramıyordu. Eşsiz bir layoutId taşımak
                       her kartta boşuna ölçüm yaptırıyordu. -->
                  <motion.img
                    :src="thumb(item.image)"
                    :srcset="thumbSrcset(item.image)"
                    sizes="220px"
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
                </motion.article>
              </template>
              </AnimatePresence>
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
                  <!-- İki eylem: seriyi incele (birincil) ve teklif iste.
                       "Seri Kataloğunu İndir" çıkarıldı — indirilecek dosya
                       yok ve üç seçenek hiçbirini öne çıkarmıyordu.
                       `downloadCatalog` sözlükte DURUYOR: production
                       HomeCatalog.vue hâlâ kullanıyor. -->
                  <li><NuxtLink to="/catalog">{{ catalogCopy.actions.viewSeries }}</NuxtLink></li>
                  <li><NuxtLink to="/contact">{{ catalogCopy.actions.requestOffer }}</NuxtLink></li>
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
  <!-- İki kolon, panel yükselir, sade içerik. Eski modal 2026-08-06'da
       değiştirildi (yedek: backups/CatalogProductModal.vue.eski-2026-08-06.bak). -->
  <CatalogProductModal
    :product="activeProduct"
    :copy="catalogCopy"
    :series="activeSeries"
    :collection="activeCollection"
    :system="activeSystem"
    :neighbour-images="neighbourImages"
    @close="closeProductModal"
    @prev="showPreviousProduct"
    @next="showNextProduct"
  />
</template>

<!--
  MOBİL DÜZEN — lab'in kendi katmanı.

  `home-catalog.css` YAMANMIYOR: lab'in amacı zaten o dosyadan kurtulmak.
  Mobil kurallar burada, bileşenin yanında duruyor.

  Karar (2026-08-05): masaüstündeki 2 sütunlu grid mobile TAŞINMIYOR.
     Her grup bir ŞERİT — kapılar yatay kayıyor, dikeyde 5 grup sıralanıyor.
  Parmağın doğal hareketi; her seri kendi kimliğini koruyor; dikey scroll
     Kartlar 5 kontrollü şeritte kalıyor.

  `:deep()` şart: bu sınıfların çoğu `v-for` içindeki alt öğelerde ve
  global CSS'ten geliyor, scoped seçici tek başına ulaşamıyor.
  `!important` kullanımı da bilinçli — devralınan kurallar zaten
  `!important` yazılmış, bastırmanın başka yolu yok (bkz. home-catalog.css
  686 adet). Lab production'a taşınırken o kurallar silinecek ve buradaki
  `!important`'lar da düşecek.
-->
<style scoped>
.catalog-section :deep(.catalog-row-info) {
  padding:
    calc(var(--spacing) * 8)
    calc(var(--spacing) * 4)
    calc(var(--spacing) * 5);
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.catalog-section :deep(.catalog-row-info > div) {
  min-height: 100%;
}

.catalog-sidebar-heading {
  position: relative;
  width: 100%;
  height: calc(var(--spacing) * 15);
  transform: translateY(calc(var(--spacing) * -2));
}

.catalog-section :deep(.catalog-sidebar-heading .catalog-product-family) {
  position: absolute;
  top: calc(var(--spacing) * -3.5);
  left: calc(var(--spacing) * -0.5);
  margin: 0 !important;
  color: var(--brand-500);
  font-size: clamp(56px, 4.2vw, 58px) !important;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
  opacity: 0.16;
  transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.catalog-section :deep(.catalog-row.is-line-current .catalog-product-family) {
  opacity: 0.62;
}

.catalog-section :deep(.catalog-sidebar-heading .catalog-designer) {
  position: absolute;
  top: calc(var(--spacing) * 5);
  right: auto;
  bottom: auto;
  left: calc(var(--spacing) * 10);
  margin: 0 !important;
  color: var(--ink);
  font-size: 15px !important;
  font-weight: 600;
  line-height: 1.2 !important;
  opacity: 1;
}

.catalog-source-filter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  gap: 10px;
  margin-top: auto;
  margin-bottom: auto;
  transform: translateY(calc(var(--spacing) * -1));
}

.catalog-source-filter__label {
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-source-filter__options {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.catalog-source-filter__option {
  position: relative;
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--ink-body);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.2;
  text-align: left;
  white-space: nowrap;
  transform: translateX(0);
  isolation: isolate;
  transition:
    color 420ms var(--ease-soft),
    opacity 360ms var(--ease-soft),
    transform 360ms var(--ease-soft);
}

.catalog-source-filter__option.is-active {
  color: var(--surface);
  font-weight: 600;
}

.catalog-source-filter__active-bg {
  position: absolute;
  z-index: -1;
  inset: 0;
  display: flex;
  align-items: center;
  padding-left: 10px;
  border-radius: inherit;
  background: var(--ink);
  pointer-events: none;
}

.catalog-source-filter__active-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: var(--radius-full);
  background: var(--brand-500);
}

.catalog-source-filter__label {
  position: relative;
  z-index: 1;
}

.catalog-source-filter__option.is-active .catalog-source-filter__label {
  padding-left: 13px;
}

.catalog-source-filter__option:not(.is-active):hover {
  color: var(--ink);
  opacity: 0.78;
  transform: translateX(3px);
}

.catalog-source-filter__option:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

.catalog-all-models :deep(.catalog-tag-label--short) {
  display: none;
}

.catalog-all-models :deep(.catalog-tag-label--full) {
  display: inline;
}

.catalog-all-models__icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.catalog-section :deep(.catalog-all-models) {
  gap: 7px;
  margin-top: 0;
  margin-left: -12px;
  padding: 12px;
  color: var(--ink-soft);
  font-size: 14px;
  transition:
    color 280ms var(--ease-soft),
    opacity 280ms var(--ease-soft),
    transform 280ms var(--ease-soft);
}

.catalog-section :deep(.catalog-all-models .catalog-tag-line) {
  display: none;
}

.catalog-section :deep(.catalog-all-models:hover) {
  color: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  .catalog-source-filter__option,
  .catalog-section :deep(.catalog-all-models) {
    transition: none;
  }

  .catalog-source-filter__option:not(.is-active):hover {
    transform: none;
  }
}

.catalog-tag-part.is-emphasized {
  font-weight: 600;
}

.catalog-tag-part.is-emphasized :deep(.catalog-tag-line) {
  width: 100%;
  transform: scaleX(1);
}

.catalog-source-divider {
  grid-column: 1 / -1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 15px 6px;
  border-bottom: 1px solid var(--hairline);
  color: var(--ink-body);
  font-size: 12px;
  line-height: 1.2;
}

.catalog-source-divider small {
  color: var(--ink-soft);
  font-size: 10px;
}

@media (max-width: 1180px) {
  .catalog-section :deep(.catalog-product-grid > .catalog-product) {
    display: flex !important;
  }

  .catalog-section :deep(.catalog-product-grid > .catalog-product:nth-of-type(n + 9)) {
    display: none !important;
  }
}

@media (max-width: 920px) {
  .catalog-section :deep(.catalog-row-info) {
    padding: 0 0 8px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .catalog-sidebar-heading {
    height: calc(var(--spacing) * 15);
    margin-top: calc(var(--spacing) * 4);
    margin-bottom: calc(var(--spacing) * 5);
    transform: none;
  }

  .catalog-source-filter {
    margin-top: 0;
    margin-bottom: 0;
    transform: none;
  }

  .catalog-source-filter__options {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .catalog-section :deep(.catalog-all-models) {
    margin-top: calc(var(--spacing) * 5);
    margin-left: 0;
    padding: 10px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .catalog-section :deep(.catalog-sidebar-heading .catalog-product-family) {
    transition: none;
  }
}

@media (max-width: 860px) {
  /* ── ÜSTTEKİ ÖLÜ ALAN ────────────────────────────────────────────────
     Ölçüldü (390x844): başlık 271px'de, ilk kapı 538px'de — ekranın %64'ü
     kapı görmeden geçiyordu. Üç dolgu üst üste biniyordu: sayfa 120px,
     section 96px, main 55px. Hepsi masaüstü sahnesinden devralınmıştı. */
  .catalog-section :deep(.catalog-main) {
    padding-top: 0 !important;
  }

  /* Section'ın 96px'i masaüstü sahnesinin nefes payı; mobilde navbar
     zaten sayfa dolgusuyla ayrılıyor, ikisi üst üste biniyordu. */
  .catalog-section {
    padding-top: 28px !important;
  }

  /* "Koleksiyonlar" başlığı ölçüldü: 43px yükseklik + boşluklarıyla
     ekranın üçte birini yiyordu. Mobilde marka anı bir satırla kurulur. */
  .catalog-section :deep(.catalog-title) {
    font-size: 30px !important;
  }

  /* ── SATIR: bilgi üstte, şerit altta ─────────────────────────────── */
  .catalog-section :deep(.catalog-row) {
    display: block !important;
    margin-bottom: 44px !important;
  }

  /* Sol rail mobilde başlık yığınına dönüşüyordu — seri numarası ve adı
     yeterli, etiket listesi (Dış İklim / Kasa Seri / Kanat Seri) kapıdan
     yer çalıyor. Filtre kararı: YOK, seriler zaten ayrı bölümler. */
  .catalog-section :deep(.catalog-row-info .catalog-tags) {
    display: none !important;
  }

  .catalog-all-models :deep(.catalog-tag-label--short) {
    display: none;
  }

  .catalog-all-models :deep(.catalog-tag-label--full) {
    display: inline;
  }

  .catalog-section :deep(.catalog-row-info) {
    margin-bottom: 14px !important;
    padding: 0 0 4px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .catalog-section :deep(.catalog-product-family) {
    font-size: 56px !important;
    letter-spacing: -0.035em !important;
  }

  .catalog-section :deep(.catalog-designer) {
    margin: 0 !important;
    font-size: 15px !important;
    line-height: 1.2 !important;
  }

  .catalog-source-filter {
    gap: 6px;
    margin: 0;
  }

  .catalog-source-filter__options {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .catalog-source-filter__option {
    min-height: 32px;
    padding: 7px 11px;
    font-size: 13px;
  }

  .catalog-section :deep(.catalog-all-models) {
    margin-top: calc(var(--spacing) * 5);
    margin-left: 0;
    padding: 10px 0;
  }

  .catalog-source-divider {
    flex: 0 0 88px !important;
    width: 88px;
    min-width: 88px;
    align-self: stretch;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    border-right: 1px solid var(--hairline);
    border-bottom: 0;
    padding: 8px 10px;
  }

  /* Kart kabuğu şeridi kısıtlamasın: yatay kaydırma kenardan kenara. */
  .catalog-section :deep(.catalog-card) {
    padding-left: 0 !important;
    padding-right: 0 !important;
    background: transparent !important;
  }

  .catalog-section :deep(.catalog-card-header) {
    padding: 0 0 10px !important;
  }

  .catalog-section :deep(.catalog-card-title) {
    font-size: 15px !important;
  }

  /* ── ŞERİT ───────────────────────────────────────────────────────────
     Grid değil, yatay akış. `scroll-snap` ile kapılar hizada durur;
     parmağı bırakınca ortada bir kapı kalır, yarım kapıda asılı kalmaz. */
  .catalog-section :deep(.catalog-product-grid) {
    display: flex !important;
    flex-wrap: nowrap !important;
    gap: 12px !important;
    overflow-x: auto !important;
    overscroll-behavior-x: contain !important;
    scroll-snap-type: x mandatory !important;
    -webkit-overflow-scrolling: touch !important;
    /* Şerit ekranın kenarına kadar uzasın ama ilk/son kapı hizalı kalsın:
       negatif margin + eşit padding. Kart kabuğu zaten 16px içeride, o
       yüzden negatif margin de 16px.
       `scroll-padding-inline` ŞART: onsuz snap padding'i yok sayıyor,
       şerit 20px kayıp açılıyor ve ilk kapı ekranın solundan taşıyordu
       (ölçüldü: scrollLeft 20, ilk kart -4px). */
    margin: 0 -16px !important;
    padding: 2px 16px 14px !important;
    scroll-padding-inline: 16px !important;
    scrollbar-width: none !important;
  }

  .catalog-section :deep(.catalog-product-grid)::-webkit-scrollbar {
    display: none !important;
  }

  /* Kart genişliği: ekranda ~2.2 kapı görünsün. Yarım görünen üçüncü
     kapı "devamı var" sinyali — kaydırılabilir olduğunu kendi anlatır. */
  .catalog-section :deep(.catalog-product) {
    flex: 0 0 auto !important;
    width: calc((100vw - 32px - 12px) / 2.2) !important;
    min-width: 132px !important;
    scroll-snap-align: start !important;
  }

  .catalog-section :deep(.catalog-product-image-wrap) {
    height: auto !important;
    aspect-ratio: 3 / 4 !important;
    margin-bottom: 10px !important;
  }

  /* Ürün kodu `--ink-soft` kullanıyordu (home-catalog.css): kart zemininde
     3.35:1, AA'nın altı. Tema-duyarlı token'a alınıyor — o token gündüzde
     5.11:1 veriyor, gecede zaten yüksek. */
  .catalog-section :deep(.catalog-code) {
    color: var(--text-secondary) !important;
  }

  /* ── SERİ EYLEMLERİ ──────────────────────────────────────────────────
     Ölçüldü: haplar 31–33px yükseklikteydi (dokunma tabanı 44px) ve üçü
     de aynı ağırlıktaydı — hiçbiri birincil değildi, hiçbiri çağırmıyordu.
     Şimdi ilki dolu, diğerleri çerçeveli. */
  .catalog-section :deep(.liquid-actions) {
    gap: 8px !important;
    padding: 0 !important;
    /* İki eylem kaldı; üçüncüsü alta sarkmadığı için sarmaya gerek yok.
       Sığmazsa daralsınlar, alt satıra düşmesinler. */
    flex-wrap: nowrap !important;
  }

  .catalog-section :deep(.liquid-actions li) {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }

  .catalog-section :deep(.liquid-actions li a) {
    width: 100% !important;
    justify-content: center !important;
  }

  .catalog-section :deep(.liquid-actions li),
  .catalog-section :deep(.liquid-actions li a) {
    min-height: 44px !important;
    padding: 0 18px !important;
    font-size: 13px !important;
    /* `--ink-body` DEĞİL: o token yalnız gündüz temasında tanımlı,
       `.app-shell--night` içinde ezilmiyor — gece modunda gündüz mürekkebi
       koyu zeminde kalıyordu, 1.35:1 ölçüldü, metin okunmuyordu.
       `--text-secondary` iki temada da tanımlı. */
    color: var(--text-secondary) !important;
  }

  .catalog-section :deep(.liquid-actions li:first-child) {
    border-color: transparent !important;
    background: var(--accent-fill) !important;
  }

  .catalog-section :deep(.liquid-actions li:first-child a) {
    color: var(--accent-on) !important;
  }

  .catalog-section :deep(.liquid-actions li:focus-visible),
  .catalog-section :deep(.liquid-actions li a:focus-visible) {
    outline: 2px solid var(--text-primary) !important;
    outline-offset: 3px !important;
  }
}
</style>
