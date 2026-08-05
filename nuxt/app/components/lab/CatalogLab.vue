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
import { computed, onBeforeUnmount, ref } from "vue";
import { motion } from "motion-v";
import { useHomeCatalog } from "~/composables/useHomeCatalog";
import { useCatalogCopy } from "~/composables/useCatalogCopy";
import { useLiquidMenu } from "~/composables/useLiquidMenu";
import CatalogModalLab from "~/components/lab/CatalogModalLab.vue";
import { useCatalogStructuralLine } from "~/composables/useCatalogStructuralLine";
import { useMagneticHover } from "~/composables/useMagneticHover";

const {
  products,
  catalogBlocks,
  getCatalogPreviewProducts,
  activeProduct,
  activeProductIndex,
  openProductModal,
  closeProductModal,
  showPreviousProduct,
  showNextProduct,
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
  Her seri bir ŞERİT — kapılar yatay kayıyor, dikeyde 7 seri sıralanıyor.
  Parmağın doğal hareketi; her seri kendi kimliğini koruyor; dikey scroll
  68 karttan 7 şeride iniyor.

  `:deep()` şart: bu sınıfların çoğu `v-for` içindeki alt öğelerde ve
  global CSS'ten geliyor, scoped seçici tek başına ulaşamıyor.
  `!important` kullanımı da bilinçli — devralınan kurallar zaten
  `!important` yazılmış, bastırmanın başka yolu yok (bkz. home-catalog.css
  686 adet). Lab production'a taşınırken o kurallar silinecek ve buradaki
  `!important`'lar da düşecek.
-->
<style scoped>
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
  .catalog-section :deep(.catalog-row-info .catalog-tags),
  .catalog-section :deep(.catalog-row-info .catalog-all-models) {
    display: none !important;
  }

  .catalog-section :deep(.catalog-row-info) {
    margin-bottom: 14px !important;
  }

  .catalog-section :deep(.catalog-product-family) {
    margin: 0 !important;
    font-size: 12px !important;
    letter-spacing: 0.18em !important;
  }

  .catalog-section :deep(.catalog-designer) {
    margin: 2px 0 0 !important;
    font-size: 21px !important;
    line-height: 1.15 !important;
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
    background: var(--brand-700) !important;
  }

  .catalog-section :deep(.liquid-actions li:first-child a) {
    color: var(--brand-100) !important;
  }

  .catalog-section :deep(.liquid-actions li:focus-visible),
  .catalog-section :deep(.liquid-actions li a:focus-visible) {
    outline: 2px solid var(--text-primary) !important;
    outline-offset: 3px !important;
  }
}
</style>
