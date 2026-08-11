<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "#imports";
import { motion } from "motion-v";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import { useCatalogCopy } from "~/composables/useCatalogCopy";
import CatalogProductModal from "~/components/home/CatalogProductModal.vue";
import {
  clearedCatalogFilterQuery,
  countActiveCatalogFilters,
  filterCatalogProducts,
  parseCatalogFilterQuery
} from "~/data/catalog-library-filters";
import { products, type DoorProduct } from "~/data/products";

gsap.registerPlugin(Flip);

definePageMeta({
  pageTransition: false
});

const route = useRoute();
const router = useRouter();
const { locale } = useKardoorLocale();
const { catalogCopy } = useCatalogCopy();

const filters = computed(() => parseCatalogFilterQuery(route.query));
const filteredProducts = computed(() => filterCatalogProducts(products, filters.value));
const hasActiveFilters = computed(() => countActiveCatalogFilters(filters.value) > 0);

/**
 * Ürünler seri bütünlüğü korunarak gruplanır. Her serinin gerçek
 * `showcase` / `product-showcase` ürünü bölümün lideri olur; veri böyle bir
 * ürün tanımlamıyorsa ilk model liderlik eder. Böylece görsel vurgu başka
 * bir serinin ortasına düşmez ve katalog gerçek bir showroom turu gibi
 * okunur.
 */
const seriGruplari = computed(() => {
  const gruplar = new Map<
    string,
    { slug: string; baslik: string; urunler: DoorProduct[] }
  >();

  for (const urun of filteredProducts.value) {
    const mevcut = gruplar.get(urun.seriesSlug);
    if (mevcut) {
      mevcut.urunler.push(urun);
      continue;
    }

    gruplar.set(urun.seriesSlug, {
      slug: urun.seriesSlug,
      baslik: urun.seriesTitle,
      urunler: [urun]
    });
  }

  return [...gruplar.values()].map((grup) => {
    const liderIndex = grup.urunler.findIndex((urun) => urun.visualRole !== "product");
    if (liderIndex <= 0) return grup;

    const urunler = [...grup.urunler];
    const [lider] = urunler.splice(liderIndex, 1);
    return lider ? { ...grup, urunler: [lider, ...urunler] } : grup;
  });
});

/**
 * SAYFALAMA YOK — 169 urunun tamami tek akista.
 *
 * "Daha fazla goster" dugmesi bento ritmini kesiyordu: her tiklamada akis
 * duruyor, kullanici bento'yu bir butun olarak goremiyordu. 169 hucre DOM
 * icin onemsiz bir yuk; gorseller ilk 8 disinda `loading="lazy"` oldugu icin
 * tarayici zaten sadece goruse gireni indiriyor.
 *
 * Katalog birkac yuz urunu asarsa sayfalama geri gelmeli.
 */
const visibleProducts = computed(() => seriGruplari.value.flatMap((grup) => grup.urunler));

/**
 * BENTO — hücre boyutu ürünün KENDİ oranından türer, süslemeden değil.
 *
 * Ölçüldü: kapı görselleri şeffaf kesim ve oranları 0.54 (dar) ile 0.86
 * (geniş pivot) arasında değişiyor. `visualRole` alanı bunu zaten
 * işaretliyor, yani düzen veriyle sürülüyor — ileride CMS/e-ticaret
 * tarafından yönetilebilir, elle hücre yerleştirmesi yok.
 */
const hucreTipi = (urun: Record<string, any>) => {
  if (urun.visualRole === "showcase") return "scene";
  if (urun.visualRole === "product-showcase") return "wide";
  return "door";
};

/** Bir serinin filtre sonrası kaç modeli kaldı — seri işaretinde gösterilir. */
/**
 * Her seri bir bölüm işareti ve lider ürünle açılır. Masaüstündeki 12 kolon
 * kompozisyon bu iki veri noktasını kullanır; mobilin ürün sırası ve iki
 * kolon davranışı değişmez.
 */
const bentoHucreleri = computed(() => {
  const cikti: Array<Record<string, any>> = [];

  for (const grup of seriGruplari.value) {
    cikti.push({
      tip: "series",
      anahtar: `seri-${grup.slug}`,
      baslik: grup.baslik,
      adet: grup.urunler.length
    });

    grup.urunler.forEach((urun, index) => {
      const tip = hucreTipi(urun);
      const ilkSahne = tip === "scene" && !cikti.some((hucre) => hucre.tip === "scene");
      cikti.push({
        tip,
        ilkSahne,
        seriLideri: index === 0,
        anahtar: urun.slug,
        urun
      });
    });
  }

  return cikti;
});

const gridRef = ref<HTMLElement | null>(null);
let girisBaglami: gsap.Context | null = null;

const azHareket = () =>
  import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Yalnızca ilk ekrandaki hücreler için tek giriş koreografisi. Önceki
 * sürümde 176 hücrenin her biri ScrollTrigger sahibi oluyordu; basit bir
 * reveal için bu kadar scroll gözlemcisi gereksizdi ve görsel decode yüküyle
 * aynı anda ana thread'i zorluyordu. Ekran dışındaki hücreler daima görünür.
 */
const girisKur = () => {
  const grid = gridRef.value;
  if (!grid || azHareket()) return;

  const hucreler = gsap.utils
    .toArray<HTMLElement>(".cbento__cell", grid)
    .filter((hucre) => hucre.getBoundingClientRect().top < window.innerHeight * 1.08);
  if (!hucreler.length) return;

  girisBaglami = gsap.context(() => {
    gsap.fromTo(
      hucreler,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.58,
        ease: "expo.out",
        stagger: 0.045,
        clearProps: "opacity,transform"
      }
    );
  }, grid);
};

/* ── motion-v: hover ──────────────────────────────────────────────────────
   Hover'in sahibi motion-v (proje kurali: GSAP scroll/timeline, motion-v
   bilesen jestleri). CSS'ten bu property'lerin `transform`/`transition`
   kurallari SILINDI -- ayni property'yi iki motor yonetemez.

   Ata -> cocuk variant mirasi: kap `hover`a gecince gorsel ve isik ayni
   variant adini taniyip birlikte oynuyor; tek tek olay dinleyicisi yok. */
const kartKap = {
  rest: { transform: "translate3d(0, 0, 0)" },
  hover: {
    transform: "translate3d(0, -4px, 0)",
    transition: { type: "spring" as const, bounce: 0.12, duration: 0.36 }
  }
};

const kartGorsel = {
  rest: { transform: "translate3d(0, 0, 0) scale(1)" },
  hover: {
    transform: "translate3d(0, -6px, 0) scale(1.018)",
    transition: { type: "spring" as const, bounce: 0.1, duration: 0.38 }
  }
};

/** Sahne hucresinde gorsel tam kaniyor; yukselme degil hafif yakinlasma. */
const sahneGorsel = {
  rest: { transform: "translate3d(0, 0, 0) scale(1)" },
  hover: {
    transform: "translate3d(0, 0, 0) scale(1.035)",
    transition: { type: "spring" as const, bounce: 0, duration: 0.42 }
  }
};

/** Isik yuzeyi tarar — "malzeme konusur". */
const kartIsik = {
  rest: { transform: "translate3d(-120%, 0, 0)", opacity: 0 },
  hover: {
    transform: "translate3d(120%, 0, 0)",
    opacity: 1,
    transition: { duration: 0.72, ease: "easeInOut" as const }
  }
};

const gorselBoyutu = (hucre: Record<string, any>) => {
  if (hucre.tip === "scene" || hucre.tip === "wide") return "100vw md:50vw";
  if (hucre.seriLideri) return "50vw md:25vw lg:50vw";
  return "50vw md:25vw";
};

/* ── ÜRÜN VİTRİNİ ─────────────────────────────────────────────────────────
   Normal tık katalog içinde modal açar. Bağlantının gerçek `href`i korunur:
   Ctrl/Cmd+tık ve orta tık ürün detayını yeni sekmede açmaya devam eder. */
const aktifUrunKodu = ref<string | null>(null);

const aktifUrunIndex = computed(() =>
  visibleProducts.value.findIndex((urun) => urun.code === aktifUrunKodu.value)
);

const aktifUrun = computed(() => {
  const urun = visibleProducts.value[aktifUrunIndex.value] as DoorProduct | undefined;
  if (!urun) return null;

  return {
    ...urun,
    finish: urun.name,
    series: urun.seriesTitle,
    collection: urun.category,
    system: urun.materials.join(" / "),
    // Kart ve modal aynı yerel dosyayı kullanır; ikinci bir uzak/IPX isteği yok.
    image: urun.localImage || urun.image
  };
});

const komsuGorseller = computed(() => {
  const liste = visibleProducts.value;
  const index = aktifUrunIndex.value;
  if (index < 0 || !liste.length) return [];

  const onceki = liste[(index - 1 + liste.length) % liste.length];
  const sonraki = liste[(index + 1) % liste.length];
  return [onceki?.localImage, sonraki?.localImage].filter(Boolean) as string[];
});

const urunVitrininiAc = (event: MouseEvent, urun: DoorProduct) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  aktifUrunKodu.value = urun.code;
};

const urunVitrininiKapat = () => {
  aktifUrunKodu.value = null;
};

const komsuUruneGit = (yon: -1 | 1) => {
  const liste = visibleProducts.value;
  const index = aktifUrunIndex.value;
  if (index < 0 || !liste.length) return;
  aktifUrunKodu.value = liste[(index + yon + liste.length) % liste.length]?.code ?? null;
};

// Açık ürün yeni filtre sonucunda listeden çıkarsa modal kapalı kalır.
watch(
  () => visibleProducts.value.map((urun) => urun.code).join("|"),
  () => {
    if (aktifUrunKodu.value && aktifUrunIndex.value < 0) urunVitrininiKapat();
  }
);

/**
 * Filtre değişimi: Flip ile akışkan yeniden dizilim.
 * Kartlar zıplamak yerine yeni yerlerine kayar; hangi ürünün kaldığı,
 * hangisinin gittiği gözle takip edilebilir olur.
 */
watch(
  () => filteredProducts.value.map((p: any) => p.slug).join("|"),
  async () => {
    const grid = gridRef.value;
    if (!grid || azHareket()) return;
    const durum = Flip.getState(grid.querySelectorAll(".cbento__cell"));
    await nextTick();
    Flip.from(durum, {
      duration: 0.46,
      ease: "expo.out",
      stagger: 0.008,
      absolute: true,
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.3 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.18 })
    });
  }
);

onMounted(() => {
  requestAnimationFrame(girisKur);
});

onBeforeUnmount(() => {
  girisBaglami?.revert();
  girisBaglami = null;
  if (gridRef.value) gsap.killTweensOf(gridRef.value.querySelectorAll(".cbento__cell"));
});

const clearFilters = () => {
  router.replace({
    query: { ...route.query, ...clearedCatalogFilterQuery() }
  });
};

const seo = computed(() =>
  locale.value === "tr"
    ? {
        title: "Kapı Kataloğu",
        description:
          "Ege Kardoor kapı kataloğu: çelik, alüminyum, ahşap, PVC ve cam kapı serilerini filtreleyin, projeniz için doğru modeli bulun."
      }
    : {
        title: "Door Catalog",
        description:
          "Ege Kardoor door catalog: browse steel, aluminium, wood, PVC and glass door series and find the right model for your project."
      }
);

const t = computed(() =>
  locale.value === "tr"
    ? {
        status: `${filteredProducts.value.length} modelden ${visibleProducts.value.length} tanesi gösteriliyor`,
        empty: "Filtrenize uyan model yok.",
        clearFilters: "Filtreleri temizle",
        modelEki: "model"
      }
    : {
        status: `Showing ${visibleProducts.value.length} of ${filteredProducts.value.length} models`,
        empty: "No doors match your filters.",
        clearFilters: "Clear filters",
        modelEki: "models"
      }
);

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description
});
</script>

<template>
  <section id="main-content" class="catalog-lib">
    <h1 class="catalog-lib__heading">{{ seo.title }}</h1>

    <p class="catalog-lib__status" aria-live="polite">{{ t.status }}</p>

    <ul v-if="bentoHucreleri.length" ref="gridRef" class="cbento">
      <li
        v-for="(hucre, index) in bentoHucreleri"
        :key="hucre.anahtar"
        class="cbento__cell"
        :class="[
          `is-${hucre.tip}`,
          { 'is-lead': hucre.ilkSahne, 'is-series-lead': hucre.seriLideri }
        ]"
      >
        <!-- Seri işareti: bilgi taşıyan ritim kırıcı -->
        <div v-if="hucre.tip === 'series'" class="cbento__series">
          <span class="cbento__series-title">{{ hucre.baslik }}</span>
          <span class="cbento__series-count">{{ hucre.adet }} {{ t.modelEki }}</span>
        </div>

        <!-- Hover'in sahibi motion-v: kap `hover` variantina gecince gorsel
             ve isik ayni adi miras alip birlikte oynuyor. -->
        <motion.div
          v-else
          class="h-full"
          :variants="kartKap"
          initial="rest"
          animate="rest"
          while-hover="hover"
        >
          <NuxtLink
            class="cbento__link"
            :to="`/doors/${hucre.urun.code}`"
            :prefetch="false"
            :aria-label="`${hucre.urun.name}, ${hucre.urun.code}`"
            @click.capture="urunVitrininiAc($event, hucre.urun)"
          >
            <span class="cbento__stage">
              <motion.span
                class="cbento__image-motion"
                :variants="hucre.tip === 'scene' ? sahneGorsel : kartGorsel"
              >
                <NuxtImg
                  class="cbento__img"
                  :src="hucre.urun.localImage"
                  :alt="`${hucre.urun.name} ${hucre.urun.code}`"
                  :sizes="gorselBoyutu(hucre)"
                  format="webp"
                  :quality="82"
                  :loading="index < 6 ? 'eager' : 'lazy'"
                  :fetchpriority="index < 3 ? 'high' : 'auto'"
                  decoding="async"
                />
              </motion.span>
              <span class="cbento__ground" aria-hidden="true"></span>
              <motion.span class="cbento__sheen" :variants="kartIsik" aria-hidden="true" />
            </span>

            <span class="cbento__meta">
              <strong class="cbento__name">{{ hucre.urun.name }}</strong>
              <span class="cbento__code">{{ hucre.urun.code }}</span>
            </span>

            <span class="cbento__add" aria-hidden="true">+</span>
          </NuxtLink>
        </motion.div>
      </li>
    </ul>

    <div v-else class="catalog-lib__empty">
      <p>{{ t.empty }}</p>
      <button v-if="hasActiveFilters" type="button" @click="clearFilters">
        {{ t.clearFilters }}
      </button>
    </div>

    <CatalogProductModal
      :product="aktifUrun"
      :copy="catalogCopy"
      :series="aktifUrun?.seriesTitle ?? ''"
      :collection="aktifUrun?.category ?? ''"
      :system="aktifUrun?.system ?? ''"
      :neighbour-images="komsuGorseller"
      :show-series-link="false"
      @close="urunVitrininiKapat"
      @prev="komsuUruneGit(-1)"
      @next="komsuUruneGit(1)"
    />
  </section>
</template>
