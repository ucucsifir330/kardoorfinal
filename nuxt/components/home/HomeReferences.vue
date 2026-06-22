<template>
  <section ref="sectionRef" class="home-references-flip" aria-labelledby="home-references-title">
    <div ref="mediaRef" class="home-references-flip__media">
      <iframe
        v-if="isDocumentaryStarted"
        class="home-references-flip__video"
        :src="documentaryYoutubeEmbedUrl"
        title="Ege Kardoor kurumsal belgesel"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
      <button
        v-if="!isDocumentaryStarted"
        type="button"
        class="home-references-flip__play"
        :style="{ '--references-video-poster': `url(${documentaryYoutubePosterUrl})` }"
        aria-label="Kurumsal belgeseli oynat"
        @click="startDocumentary"
      >
        <span class="home-references-flip__play-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
          </svg>
        </span>
        <span class="home-references-flip__play-text">Watch Intro</span>
      </button>
    </div>

    <section class="home-references-flip__intro">
      <h2 id="home-references-title">
        <span>Sınırların nasıl</span>
        <span>çizildiğine</span>
        <span>tanık olun.</span>
      </h2>
      <p>
        Ege Kardoor’un üretim felsefesi. Ham çeliğin, yüksek mühendislik ve
        tasarım vizyonuyla premium bir mimari elemente dönüşme serüveni.
      </p>
    </section>

    <section ref="initialRef" class="home-references-flip__panel home-references-flip__initial">
      <div class="home-references-flip__copy">
        <h3>
          Mikro detaylardan,<br>
          makro projelere.
        </h3>
        <p>
          Sadece bir güvenlik önlemi değil, yapının karakterini belirleyen o
          ilk temas noktası. Hassas kesimlerden kusursuz yüzey bitişlerine
          kadar, fabrikamızdaki teknoloji ve zanaat entegrasyonunu keşfedin.
        </p>
        <span></span>
      </div>

      <div ref="startMarkerRef" class="home-references-flip__marker home-references-flip__marker--start">
      </div>
    </section>

    <section ref="finalRef" class="home-references-flip__panel home-references-flip__final">
      <div ref="finalMarkerRef" class="home-references-flip__marker home-references-flip__marker--final"></div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { gsap as GsapNamespace } from "gsap";

const sectionRef = ref<HTMLElement | null>(null);
const initialRef = ref<HTMLElement | null>(null);
const finalRef = ref<HTMLElement | null>(null);
const startMarkerRef = ref<HTMLElement | null>(null);
const finalMarkerRef = ref<HTMLElement | null>(null);
const mediaRef = ref<HTMLElement | null>(null);
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

// Flip ilerlemesinin bu oranını geçip scroll bırakılınca video sona tamamlanır;
// altındaysa başa döner. Hissi canlıda ayarlamak için tek düğme (0–1).
const FLIP_SNAP_THRESHOLD = 0.25;

let flipContext: ReturnType<typeof GsapNamespace.context> | null = null;
let resizeHandler: (() => void) | null = null;
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
  const initial = initialRef.value;
  const final = finalRef.value;
  const finalMarker = finalMarkerRef.value;
  const media = mediaRef.value;

  if (!section || !initial || !final || !finalMarker || !media) return;

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger")
  ]);

  gsap.registerPlugin(ScrollTrigger);

  const getBounds = (element: HTMLElement) => {
    const sectionRect = section.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    return {
      height: rect.height,
      left: rect.left - sectionRect.left + section.scrollLeft,
      top: rect.top - sectionRect.top + section.scrollTop,
      width: rect.width
    };
  };

  const create = () => {
    flipContext?.revert();
    flipScrollTrigger = null;

    flipContext = gsap.context(() => {
      if (!mediaRef.value || !startMarkerRef.value || !finalMarkerRef.value || !initialRef.value || !finalRef.value) return;

      const flipTween = gsap.fromTo(
        mediaRef.value,
        {
          autoAlpha: 1,
          height: () => getBounds(startMarkerRef.value as HTMLElement).height,
          left: () => getBounds(startMarkerRef.value as HTMLElement).left,
          top: () => getBounds(startMarkerRef.value as HTMLElement).top,
          width: () => getBounds(startMarkerRef.value as HTMLElement).width
        },
        {
          height: () => getBounds(finalMarkerRef.value as HTMLElement).height,
          left: () => getBounds(finalMarkerRef.value as HT