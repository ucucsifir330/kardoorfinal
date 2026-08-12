<script setup lang="ts">
/**
 * KAPI DETAY — "Eşik"
 *
 * Kapı bir vitrin nesnesi gibi sunuluyor: koyu sahne, yandan gelen ışık,
 * gerçek boyut hissi. `PRODUCT.md` "malzeme konuşur, ürün fotoğrafı her
 * zaman ön planda" diyor; eski sayfada kapı küçük bir kartın içindeydi ve
 * sayfanın %60'ı boştu (ölçüldü: yükseklik 4000px, içerik ~700px'te bitiyor).
 *
 * ─ Animasyon sahipliği (bkz. proje mimarisi) ─────────────────────────────
 *   motion-v : bileşen düzeyi giriş + jest (hover) animasyonları
 *   GSAP     : scroll'a bağlı hareket (scrub)
 *
 * İki motor AYNI elemanın AYNI property'sini yönetemez — bu projede daha
 * önce iki kez yaşandı (CSS `!important` transform, Motion'ın inline
 * stilini eziyordu). Bu yüzden giriş animasyonu DIŞ sarmalayıcıda
 * (motion-v), scroll yakınlaşması İÇ katmanda (GSAP) çalışıyor: ayrı DOM
 * düğümleri, çakışma yok.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { motion } from "motion-v";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getProductByCode } from "~/data/catalog";
import { getProductTaxonomy } from "~/data/catalog-taxonomy";
import { products, slugifyProductPart } from "~/data/products";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

gsap.registerPlugin(ScrollTrigger);

const route = useRoute();
const product = getProductByCode(String(route.params.code));
const { assetUrl } = useKardoorAsset();
const { locale } = useKardoorLocale();

if (!product) {
  throw createError({ statusCode: 404, statusMessage: "Door model not found" });
}

const useLocalImageFallback = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null;
  const fallback = image?.dataset.fallbackSrc;
  if (!image || !fallback || image.src.endsWith(fallback)) return;
  image.src = fallback;
};

const similar = products
  .filter((item) => item.code !== product.code && item.seriesSlug === product.seriesSlug)
  .slice(0, 4);

const backLink = {
  path: "/catalog",
  query: { anaKategori: slugifyProductPart(getProductTaxonomy(product).anaKategori) }
};

/**
 * Sayfada i18n HİÇ YOKTU (ölçüldü: `locale` 0 eşleşme) — içerik Türkçe iken
 * etiketler sabit İngilizceydi: MATERIALS / USE CASES / REQUEST QUOTE.
 */
const t = computed(() =>
  locale.value === "en"
    ? {
        back: "Catalog",
        materials: "Materials",
        useCases: "Use cases",
        surfaces: "Surfaces",
        quote: "Request a quote",
        all: "All doors",
        sameSeries: "From the same series",
        spec: "Specification"
      }
    : {
        back: "Katalog",
        materials: "Malzeme",
        useCases: "Kullanım alanı",
        surfaces: "Yüzey",
        quote: "Teklif al",
        all: "Tüm kapılar",
        sameSeries: "Aynı seriden",
        spec: "Künye"
      }
);

useSeoMeta({
  title: () => `${product.code} ${product.name} — ${product.seriesTitle}`,
  description: () => product.description
});

/* ── motion-v: giriş koreografisi ────────────────────────────────────────
   Ata → çocuk variant mirası: `kimlik` kabı `gorunur`e geçince çocuklar
   aynı adı tanıyıp sırayla giriyor. Tek tek delay yazmaya gerek yok. */
const kimlikKabi = {
  gizli: { opacity: 0 },
  gorunur: {
    opacity: 1,
    transition: { delayChildren: 0.18, staggerChildren: 0.07 }
  }
};

const kimlikOge = {
  gizli: { opacity: 0, y: 18 },
  gorunur: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, visualDuration: 0.5, bounce: 0.12 }
  }
};

/** Kapı yerine oturur — ağır bir nesne gibi, sekmeden. */
const kapiGiris = {
  initial: { opacity: 0, y: 34 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, visualDuration: 0.72, bounce: 0.06 }
};

/** Komşu kartlar: yükselir. CSS'te transform YOK — Motion sahibi. */
const komsuHover = { y: -6, transition: { type: "spring" as const, bounce: 0.2, duration: 0.35 } };

/* ── GSAP: scroll'a bağlı yaklaşma ───────────────────────────────────────
   Sayfa ScrollSmoother altında; `window.scroll` ve IntersectionObserver
   sinyal vermiyor (ölçüldü, bu projede iki kez). ScrollTrigger smoother'ın
   playhead'ini okuduğu için doğru çalışan tek yol. */
const sahneRef = ref<HTMLElement | null>(null);
const zoomRef = ref<HTMLElement | null>(null);
const isikRef = ref<HTMLElement | null>(null);
let mm: ReturnType<typeof gsap.matchMedia> | null = null;

onMounted(() => {
  if (!sahneRef.value || !zoomRef.value) return;
  mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Işık yüzeyi bir kez tarar — katalogdaki hover taramasıyla aynı dil.
    if (isikRef.value) {
      gsap.fromTo(
        isikRef.value,
        { xPercent: -130, opacity: 0 },
        { xPercent: 130, opacity: 1, duration: 1.9, delay: 0.5, ease: "power2.inOut" }
      );
    }

    // Yaklaşma: scroll ilerledikçe kapı büyür.
    gsap.to(zoomRef.value, {
      scale: 1.12,
      ease: "none",
      scrollTrigger: {
        trigger: sahneRef.value,
        start: "top top",
        end: "bottom top",
        scrub: 0.8
      }
    });
  });
});

onBeforeUnmount(() => {
  mm?.revert();
  mm = null;
});
</script>

<template>
  <article class="kdoor bg-[var(--kd-page)] text-[var(--kd-page-fg)] font-body">
    <!-- ── SAHNE ─────────────────────────────────────────────────────── -->
    <section
      ref="sahneRef"
      class="kdoor__stage relative isolate grid min-h-svh items-center gap-[clamp(24px,4vw,80px)] overflow-hidden bg-[var(--kd-stage)] px-[clamp(20px,5vw,96px)] pb-[clamp(48px,7vh,96px)] text-[var(--kd-stage-fg)] lg:grid-cols-2"
      :style="{ paddingTop: 'calc(var(--header, 82px) + clamp(28px, 4vh, 64px))' }"
    >
      <NuxtLink
        :to="backLink"
        class="absolute left-[clamp(20px,5vw,96px)] z-[3] inline-flex items-center gap-2 text-[0.82rem] tracking-[0.06em] text-[color-mix(in_srgb,var(--kd-stage-fg)_66%,transparent)] no-underline transition-colors duration-200 hover:text-[var(--kd-stage-fg)]"
        :style="{ top: 'calc(var(--header, 82px) + clamp(14px, 2vh, 26px))' }"
      >
        <span aria-hidden="true">←</span> {{ t.back }}
      </NuxtLink>

      <!-- Kapı: DIŞ sarmalayıcı Motion (giriş), İÇ katman GSAP (scroll zoom).
           Ayrı düğüm = iki motor aynı transform'u yönetmiyor. -->
      <motion.div
        class="relative flex h-[min(78svh,760px)] min-h-0 items-end justify-center"
        :initial="kapiGiris.initial"
        :animate="kapiGiris.animate"
        :transition="kapiGiris.transition"
      >
        <div
          ref="zoomRef"
          class="relative flex h-full items-end origin-bottom will-change-transform [filter:drop-shadow(0_42px_60px_rgba(0,0,0,0.55))]"
        >
          <!-- Isik KAPIYA kirpilir: `overflow-hidden` bu kutuda, golge disinda.
               Golgeyi de kirpmamak icin drop-shadow ust katmanda duruyor. -->
          <span class="relative block h-full overflow-hidden">
            <!-- YEREL gorsel, IPX YOK.
                 Olculdu: `NuxtImg` + `assetUrl(product.image)` gorseli
                 `/_ipx/.../https://ik.imagekit.io/...` uzerinden geciriyordu;
                 Nuxt Image uzak dosyayi istek aninda indirip donusturuyor ve
                 tek gorsel 1525ms suruyordu (katalogdaki yerel webp'ler 49ms).
                 Istek dustugunde de gorsel komple kiriliyordu.
                 Yerel webp zaten optimize; uzak surum yalnizca yedek. -->
            <img
              :src="product.localImage"
              :alt="`${product.name} ${product.code}`"
              :data-fallback-src="assetUrl(product.image)"
              width="520"
              height="820"
              fetchpriority="high"
              decoding="async"
              class="block h-auto max-h-full w-auto max-w-full"
              @error="useLocalImageFallback"
            >
            <span
              ref="isikRef"
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 z-[2] opacity-0 [background:linear-gradient(100deg,transparent_40%,rgba(255,255,255,0.3)_50%,transparent_60%)]"
            ></span>
          </span>
        </div>

        <!-- Zemin çizgisi: kapı havada asılı değil, yerde duruyor. -->
        <span
          aria-hidden="true"
          class="absolute inset-x-[8%] bottom-0 h-px [background:linear-gradient(90deg,transparent,color-mix(in_srgb,var(--kd-stage-fg)_34%,transparent)_22%,color-mix(in_srgb,var(--kd-stage-fg)_34%,transparent)_78%,transparent)]"
        ></span>
      </motion.div>

      <!-- Kimlik -->
      <motion.header
        class="relative z-[2] max-w-[46ch]"
        :variants="kimlikKabi"
        initial="gizli"
        animate="gorunur"
      >
        <motion.p
          :variants="kimlikOge"
          class="m-0 mb-[clamp(10px,1.4vh,18px)] text-[0.78rem] uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--kd-stage-fg)_60%,transparent)]"
        >
          {{ product.seriesTitle }}
        </motion.p>

        <motion.h1
          :variants="kimlikOge"
          class="m-0 text-[clamp(3.2rem,7vw,6rem)] font-medium leading-[0.9] tracking-[-0.045em] tabular-nums"
        >
          {{ product.code }}
        </motion.h1>

        <motion.p
          :variants="kimlikOge"
          class="mt-[clamp(6px,1vh,12px)] mb-0 text-[clamp(1.1rem,1.5vw,1.5rem)] tracking-[-0.01em] text-[color-mix(in_srgb,var(--kd-stage-fg)_82%,transparent)]"
        >
          {{ product.name }}
        </motion.p>

        <motion.p
          :variants="kimlikOge"
          class="mt-[clamp(16px,2.2vh,26px)] mb-0 max-w-[46ch] text-[clamp(0.94rem,1vw,1.06rem)] leading-[1.62] text-pretty text-[color-mix(in_srgb,var(--kd-stage-fg)_74%,transparent)]"
        >
          {{ product.description }}
        </motion.p>

        <motion.ul
          v-if="product.specs?.length"
          :variants="kimlikOge"
          class="m-0 mt-[clamp(18px,2.4vh,28px)] flex list-none flex-wrap gap-2 p-0"
        >
          <li
            v-for="spec in product.specs"
            :key="spec"
            class="rounded-full px-[13px] py-[7px] text-[0.78rem] leading-[1.2] text-[color-mix(in_srgb,var(--kd-stage-fg)_78%,transparent)] [box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--kd-stage-fg)_20%,transparent)]"
          >
            {{ spec }}
          </li>
        </motion.ul>

        <motion.div :variants="kimlikOge" class="mt-[clamp(24px,3.2vh,40px)] flex flex-wrap gap-3">
          <NuxtLink
            to="/contact"
            class="inline-flex min-h-[46px] items-center rounded-full bg-[var(--kd-stage-fg)] px-[22px] text-[0.9rem] font-medium text-[var(--kd-stage)] no-underline transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--kd-stage-fg)_88%,transparent)]"
          >
            {{ t.quote }}
          </NuxtLink>
          <NuxtLink
            to="/catalog"
            class="inline-flex min-h-[46px] items-center rounded-full px-[22px] text-[0.9rem] font-medium no-underline transition-shadow duration-200 [box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--kd-stage-fg)_30%,transparent)] hover:[box-shadow:inset_0_0_0_1px_var(--kd-stage-fg)]"
          >
            {{ t.all }}
          </NuxtLink>
        </motion.div>
      </motion.header>
    </section>

    <!-- ── KÜNYE ─────────────────────────────────────────────────────── -->
    <section class="px-[clamp(20px,5vw,96px)] py-[clamp(56px,9vh,120px)]">
      <h2
        class="m-0 mb-[clamp(22px,3vh,40px)] text-[0.78rem] font-medium uppercase tracking-[0.14em] text-[var(--kd-page-soft)]"
      >
        {{ t.spec }}
      </h2>

      <dl class="m-0 border-t border-[var(--kd-line)]">
        <div
          v-for="satir in [
            { etiket: t.materials, degerler: product.materials },
            { etiket: t.surfaces, degerler: product.surfaces },
            { etiket: t.useCases, degerler: product.useCases }
          ].filter((s) => s.degerler?.length)"
          :key="satir.etiket"
          class="grid gap-[clamp(16px,3vw,48px)] border-b border-[var(--kd-line)] py-[clamp(16px,2.4vh,26px)] md:grid-cols-[minmax(140px,22%)_minmax(0,1fr)]"
        >
          <dt class="text-[0.9rem] font-medium text-[var(--kd-page-soft)]">{{ satir.etiket }}</dt>
          <dd class="m-0 flex flex-wrap gap-x-[22px] gap-y-2 text-[clamp(0.98rem,1.05vw,1.14rem)] leading-[1.4]">
            <span v-for="d in satir.degerler" :key="d">{{ d }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- ── AYNI SERİDEN ──────────────────────────────────────────────── -->
    <section v-if="similar.length" class="px-[clamp(20px,5vw,96px)] pb-[clamp(64px,10vh,128px)]">
      <h2
        class="m-0 mb-[clamp(22px,3vh,40px)] text-[0.78rem] font-medium uppercase tracking-[0.14em] text-[var(--kd-page-soft)]"
      >
        {{ t.sameSeries }}
      </h2>

      <ul class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[clamp(12px,1.4vw,22px)] p-0">
        <li v-for="item in similar" :key="item.code">
          <motion.div :while-hover="komsuHover" class="h-full">
            <NuxtLink
              :to="`/doors/${item.code}`"
              class="flex h-full flex-col overflow-hidden rounded-[3px_3px_14px] bg-surface-raised text-inherit no-underline [box-shadow:inset_0_0_0_1px_var(--kd-line)]"
            >
              <span class="flex h-[clamp(190px,22vw,280px)] min-h-0 items-end justify-center overflow-hidden px-3 pt-4">
                <img
                  :src="item.localImage"
                  :alt="`${item.name} ${item.code}`"
                  loading="lazy"
                  class="block h-auto max-h-full w-auto max-w-full [filter:var(--kd-thumb-shadow)]"
                >
              </span>
              <span class="flex flex-col gap-0.5 px-4 pb-4 pt-3.5">
                <strong class="text-base font-medium tracking-[-0.01em]">{{ item.name }}</strong>
                <span class="text-[0.76rem] tabular-nums tracking-[0.06em] text-[var(--kd-page-soft)]">
                  {{ item.code }}
                </span>
              </span>
            </NuxtLink>
          </motion.div>
        </li>
      </ul>
    </section>
  </article>
</template>
