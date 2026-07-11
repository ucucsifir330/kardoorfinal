<template>
  <section ref="sectionRef" class="home-references-flip" aria-labelledby="home-references-title">
    <section
      ref="introRef"
      class="home-references-flip__intro"
      @pointermove="handleSpecimenPointerMove"
      @pointerleave="resetSpecimenPointer"
    >
      <div class="home-references-flip__specimens" aria-hidden="true">
        <figure class="home-references-flip__specimen home-references-flip__specimen--marble">
          <img
            class="home-references-flip__specimen-image"
            src="/images/brand/prism-illustrations/cracked-black-marble-cube.webp"
            alt=""
            decoding="async"
          >
        </figure>

        <figure class="home-references-flip__specimen home-references-flip__specimen--torus">
          <img
            class="home-references-flip__specimen-image"
            :src="torusSpecimenSrc"
            alt=""
            decoding="async"
          >
        </figure>
      </div>

      <h2 id="home-references-title">
        <span v-for="line in referencesCopy.titleLines" :key="line">{{ line }}</span>
      </h2>
      <p>{{ referencesCopy.intro }}</p>
    </section>

    <section ref="initialRef" class="home-references-flip__panel home-references-flip__initial">
      <div class="home-references-flip__copy">
        <h3>
          <template v-for="(line, index) in referencesCopy.panelTitleLines" :key="line">
            <br v-if="index">
            {{ line }}
          </template>
        </h3>
        <p>{{ referencesCopy.panelBody }}</p>
      </div>

      <div ref="startMarkerRef" class="home-references-flip__marker home-references-flip__marker--start"></div>
    </section>

    <section ref="finalRef" class="home-references-flip__panel home-references-flip__final">
      <div class="home-references-flip__marker home-references-flip__marker--final">
        <div ref="mediaRef" class="home-references-flip__media">
          <iframe
            v-if="isDocumentaryStarted"
            class="home-references-flip__video"
            :src="documentaryYoutubeEmbedUrl"
            :title="referencesCopy.videoTitle"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
          <button
            v-if="!isDocumentaryStarted"
            type="button"
            class="home-references-flip__play"
            :style="{ '--references-video-poster': `url(${documentaryYoutubePosterUrl})` }"
            :aria-label="referencesCopy.playAria"
            @click="startDocumentary"
          >
            <span class="home-references-flip__play-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
              </svg>
            </span>
            <span class="home-references-flip__play-text">{{ referencesCopy.playLabel }}</span>
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { locale } = useKardoorLocale();

interface ReferencesCopy {
  videoTitle: string;
  playAria: string;
  playLabel: string;
  titleLines: string[];
  intro: string;
  panelTitleLines: string[];
  panelBody: string;
}

const trCopy: ReferencesCopy = {
  videoTitle: "Ege Kardoor kurumsal belgesel",
  playAria: "Kurumsal belgeseli oynat",
  playLabel: "Tanıtımı İzle",
  titleLines: ["Sınırların nasıl", "çizildiğine", "tanık olun."],
  intro:
    "Ege Kardoor’un üretim felsefesi. Ham çeliğin, yüksek mühendislik ve tasarım vizyonuyla premium bir mimari elemente dönüşme serüveni.",
  panelTitleLines: ["Mikro detaylardan,", "makro projelere."],
  panelBody:
    "Sadece bir güvenlik önlemi değil, yapının karakterini belirleyen o ilk temas noktası. Hassas kesimlerden kusursuz yüzey bitişlerine kadar, fabrikamızdaki teknoloji ve zanaat entegrasyonunu keşfedin."
};

const enCopy: ReferencesCopy = {
  videoTitle: "Ege Kardoor corporate documentary",
  playAria: "Play the corporate documentary",
  playLabel: "Watch Intro",
  titleLines: ["Witness how", "boundaries", "are drawn."],
  intro:
    "Ege Kardoor’s production philosophy: the journey of raw steel becoming a premium architectural element through advanced engineering and a refined design vision.",
  panelTitleLines: ["From micro details,", "to macro projects."],
  panelBody:
    "More than a security measure, the entrance door is the first point of contact that defines a structure’s character. Explore the integration of technology and craft in our factory, from precision cuts to flawless surface finishes."
};

const referencesCopy = computed(() => (locale.value === "en" ? enCopy : trCopy));

// Statik src, Nuxt dev'de virtual:public + HMR cache-bust (?t=...&) etkileşimiyle
// yolu bozabiliyor; dinamik binding asset transform'unu atlayarak bundan kaçınır.
const torusSpecimenSrc = "/images/brand/prism-illustrations/metallic-inflated-torus-sculpture.webp";

const sectionRef = ref<HTMLElement | null>(null);
const initialRef = ref<HTMLElement | null>(null);
const finalRef = ref<HTMLElement | null>(null);
const startMarkerRef = ref<HTMLElement | null>(null);
const mediaRef = ref<HTMLElement | null>(null);
const introRef = ref<HTMLElement | null>(null);
const isDocumentaryStarted = ref(false);
const documentaryYoutubeId = "yiZm36w4qiQ";
const documentaryYoutubePosterUrl = `https://i.ytimg.com/vi/${documentaryYoutubeId}/maxresdefault.jpg`;
const documentaryYoutubeEmbedUrl = computed(() => {
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    modestbranding: "1",
    playsinline: "1",
    rel: "0"
  });

  return `https://www.youtube.com/embed/${documentaryYoutubeId}?${params.toString()}`;
});

// Play içeriği (ikon + yazı) kartla birlikte salt orantısal küçülürse yazı
// ~7px'e düşüp okunmaz oluyor; kart durumunda tam boyutun bu oranında kalacak
// şekilde ters ölçekle telafi edilir (scrub sonunda 1'e iner).
const PLAY_CONTENT_START_SCALE = 0.3;

type FlipContext = { revert: () => void };
type FlipFitVars = { x?: number; y?: number; scaleX?: number; scaleY?: number };

let flipContext: FlipContext | null = null;
let rebuildFlip: (() => void) | null = null;
let documentaryStartScrollY = 0;
// Catalog rows reserve their final height before product batches reveal, so this
// trigger should not drift during normal scroll. If an upstream responsive/layout
// change still moves this section, refresh ONLY this trigger instance. A global
// ScrollTrigger.refresh() would re-pin the hero/turntable and yank the scroll
// position.
let flipScrollTrigger: { refresh: () => void } | null = null;
let catalogResizeObserver: ResizeObserver | null = null;
let catalogResizeTimer = 0;

const scheduleFlipTriggerRefresh = () => {
  window.clearTimeout(catalogResizeTimer);
  catalogResizeTimer = window.setTimeout(() => {
    catalogResizeTimer = 0;
    window.requestAnimationFrame(() => {
      flipScrollTrigger?.refresh();
    });
  }, 180);
};

const stopDocumentary = () => {
  isDocumentaryStarted.value = false;
  documentaryStartScrollY = 0;
};

const setSpecimenPointer = (x: number, y: number) => {
  const intro = introRef.value;
  if (!intro) return;

  intro.style.setProperty("--references-pointer-x", x.toFixed(3));
  intro.style.setProperty("--references-pointer-y", y.toFixed(3));
};

const resetSpecimenPointer = () => {
  setSpecimenPointer(0, 0);
};

const handleSpecimenPointerMove = (event: PointerEvent) => {
  if (event.pointerType === "touch") return;

  const intro = introRef.value;
  if (!intro) return;

  const rect = intro.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

  setSpecimenPointer(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
};

const startDocumentary = () => {
  documentaryStartScrollY = window.scrollY;
  isDocumentaryStarted.value = true;
};

const handleDocumentaryScroll = () => {
  if (!isDocumentaryStarted.value) return;

  if (Math.abs(window.scrollY - documentaryStartScrollY) > 90) {
    stopDocumentary();
  }
};

const setupFlip = async () => {
  const section = sectionRef.value;
  if (!section) return;

  const [{ gsap }, { ScrollTrigger }, { Flip }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/Flip")
  ]);

  gsap.registerPlugin(ScrollTrigger, Flip);

  const create = () => {
    flipContext?.revert();
    flipScrollTrigger = null;

    flipContext = gsap.context(() => {
      const media = mediaRef.value;
      const startMarker = startMarkerRef.value;
      const initial = initialRef.value;
      const final = finalRef.value;

      if (!media || !startMarker || !initial || !final) return;

      // Medya layout'ta hep final marker'ı (tam ekran) doldurur; Flip.fit onu
      // başlangıç kartına oturtan x/y/scale değerlerini verir. Scrub boyunca
      // yalnızca transform değişir: relayout yok, CLS'e kayma yazılmaz.
      const fitVars = Flip.fit(media, startMarker, { scale: true, getVars: true }) as FlipFitVars;
      const fitScaleX = Number(fitVars.scaleX) || 1;
      const fitScaleY = Number(fitVars.scaleY) || 1;

      gsap.set(media, { autoAlpha: 1 });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: initial,
          start: "top 24%",
          endTrigger: final,
          end: "bottom bottom",
          // ScrollSmoother already eases the page; keep this card locked to
          // that smoothed playhead instead of adding a second one-second lag.
          scrub: true
        }
      });

      timeline.fromTo(media, { ...fitVars }, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);

      const playContent = media.querySelectorAll<HTMLElement>(
        ".home-references-flip__play-icon, .home-references-flip__play-text"
      );

      if (playContent.length) {
        timeline.fromTo(
          playContent,
          {
            scaleX: Math.max(1, PLAY_CONTENT_START_SCALE / fitScaleX),
            scaleY: Math.max(1, PLAY_CONTENT_START_SCALE / fitScaleY)
          },
          { scaleX: 1, scaleY: 1 },
          0
        );
      }

      flipScrollTrigger = timeline.scrollTrigger ?? null;
    }, section);
  };

  create();
  rebuildFlip = create;
  window.addEventListener("resize", create);

  if ("ResizeObserver" in window) {
    catalogResizeObserver?.disconnect();

    const upstreamTargets = [
      document.querySelector<HTMLElement>(".catalog-section"),
      document.querySelector<HTMLElement>(".home-catalog-reference-stack__catalog-frame")
    ].filter((target): target is HTMLElement => Boolean(target));

    if (upstreamTargets.length) {
      let lastHeight = upstreamTargets.reduce((height, target) => height + target.getBoundingClientRect().height, 0);

      catalogResizeObserver = new ResizeObserver(() => {
        const nextHeight = upstreamTargets.reduce((height, target) => height + target.getBoundingClientRect().height, 0);
        if (Math.abs(nextHeight - lastHeight) < 1) return;

        lastHeight = nextHeight;
        scheduleFlipTriggerRefresh();
      });

      upstreamTargets.forEach((target) => catalogResizeObserver?.observe(target));
    }
  }
};

// Buton <-> iframe geçişinde play içeriği yeniden mount olur; ters ölçek
// tween'inin yeni node'ları yakalaması için kurulum tazelenir.
watch(isDocumentaryStarted, async () => {
  await nextTick();
  rebuildFlip?.();
});

onMounted(() => {
  nextTick(() => {
    setupFlip();
  });

  window.addEventListener("scroll", handleDocumentaryScroll, { passive: true });
});

onBeforeUnmount(() => {
  if (rebuildFlip) {
    window.removeEventListener("resize", rebuildFlip);
    rebuildFlip = null;
  }

  window.clearTimeout(catalogResizeTimer);
  catalogResizeTimer = 0;
  catalogResizeObserver?.disconnect();
  catalogResizeObserver = null;
  flipScrollTrigger = null;

  flipContext?.revert();
  flipContext = null;
  window.removeEventListener("scroll", handleDocumentaryScroll);
});
</script>
