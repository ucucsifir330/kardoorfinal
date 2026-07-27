<template>
  <div class="viewport-wrapper">
    <div ref="refStackRef" class="ref-stack">
      <section ref="heroRef" class="hero">
      <div class="hero-inner">
        <div class="hero-title">
          <div class="title-block" :style="{ '--hero-line-divisor': heroLineDivisor }">
            <span
              v-for="(words, i) in titleLines"
              :key="i"
              class="hero-line ts-line"
            >
              <template v-for="(word, j) in words" :key="j">
                <span :ref="setWordRef" class="ts-word">{{ word }}</span><span
                  v-if="j < words.length - 1"
                  class="ts-space"
                > </span>
              </template>
            </span>
          </div>
          <p class="hero-kicker">
            <span ref="kickerArrowRef" class="kicker-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
            <span class="ts-line ts-line--kicker">
              <template v-for="(word, k) in kickerWords" :key="k">
                <span :ref="setWordRef" class="ts-word">{{ word }}</span><span
                  v-if="k < kickerWords.length - 1"
                  class="ts-space"
                > </span>
              </template>
            </span>
          </p>
        </div>
      </div>
      </section>

      <section ref="cardsFrameRef" class="cards-section ref-stack__panel">
      <div ref="cardsInnerRef" class="cards-inner">
      <div class="top-transition-shadow"></div>

      <h2 class="ref-projects-title">{{ pageCopy.projectsTitle }}</h2>

      <div
        ref="wrapperRef"
        class="marquee-wrapper"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointerleave="onDragEnd"
        @mouseenter="onPointerEnter"
        @mouseleave="onPointerLeave"
      >
        <div ref="trackRef" class="marquee-track">
          <div
            v-for="(_, copyIndex) in marqueeCopies"
            :key="'copy-' + copyIndex"
            :ref="copyIndex === 0 ? setFirstGroupRef : undefined"
            class="marquee-group"
            :aria-hidden="copyIndex > 0 ? 'true' : undefined"
          >
            <template v-for="(project, i) in projects" :key="'g' + copyIndex + '-' + project.id">
              <div
                :ref="el => { if (el) cardRefs[(copyIndex * projects.length) + i] = el }"
                class="card"
                @click="handleCardClick(project, $event)"
              >
                <div class="card-image">
                  <img :src="project.image" :alt="project.title">
                </div>
                <div class="card-body">
                  <p class="card-title">{{ project.title }}</p>
                  <p class="card-location">{{ project.location }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="reference-brand-stage" :aria-label="pageCopy.brandStageLabel">
        <div class="reference-logo-row reference-logo-row--top">
          <div class="reference-logo-track">
            <div v-for="group in 2" :key="'reference-primary-' + group" class="reference-logo-group" :aria-hidden="group === 2 ? 'true' : undefined">
              <span v-for="brand in primaryBrands" :key="group + brand.name" class="reference-logo-item">
                <img :src="brand.src" :alt="brand.name">
              </span>
            </div>
          </div>
        </div>

        <div class="reference-logo-row reference-logo-row--bottom">
          <div class="reference-logo-track">
            <div v-for="group in 2" :key="'reference-secondary-' + group" class="reference-logo-group" :aria-hidden="group === 2 ? 'true' : undefined">
              <span v-for="brand in secondaryBrands" :key="group + brand.name" class="reference-logo-item">
                <span v-if="brand.name === 'Microsoft'" class="reference-logo-mark" aria-label="Microsoft" role="img">
                  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h26v26H4V4Zm30 0h26v26H34V4ZM4 34h26v26H4V34Zm30 0h26v26H34V34Z" fill="currentColor"/>
                  </svg>
                </span>
                <img v-else :src="brand.src" :alt="brand.name">
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
    </div>

    <Teleport to="body">
      <transition :css="false" @enter="onEnter" @leave="onLeave">
        <div v-if="selectedProject" class="project-expansion-panel">
          <div class="panel-inner">
          <button type="button" class="panel-close" @click.stop.prevent="closeModal">
            <span class="close-text">{{ pageCopy.closeLabel }}</span>
            <span class="close-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </span>
          </button>

          <div class="panel-content">
            <div class="panel-carousel">
              <button type="button" class="nav-btn prev" @click="prevProject">‹</button>

              <div class="image-viewport">
                <transition :css="false" mode="out-in" @enter="onProjectEnter" @leave="onProjectLeave">
                  <div :key="selectedProject.id" class="project-display">
                    <div class="display-img-container">
                      <img :src="selectedProject.image" :alt="selectedProject.title">
                    </div>
                    <div class="display-info">
                      <h3>{{ selectedProject.title }}</h3>
                      <p class="panel-location">{{ selectedProject.location }}</p>
                    </div>
                  </div>
                </transition>
              </div>

              <button type="button" class="nav-btn next" @click="nextProject">›</button>
            </div>
          </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { locale } = useKardoorLocale();

const seoCopy = computed(() =>
  locale.value === "tr"
    ? {
        title: "Referanslar",
        description:
          "Ege Kardoor referansları: konut, ticari ve mimari projelerde uygulanan kapı çözümleri ve iş birliği yapılan markalar."
      }
    : {
        title: "References",
        description:
          "Ege Kardoor references: door solutions delivered for residential, commercial and architectural projects, and partner brands."
      }
);

useSeoMeta({
  title: () => seoCopy.value.title,
  description: () => seoCopy.value.description
});

const pageCopies = {
  tr: {
    titleLines: [["KAPIDAN", "ÖTE"], ["MİMARİ", "BİR"], ["İMZA", "ÜRETİYORUZ"]],
    kickerWords: ["SEÇİLİ", "EGE", "KARDOOR", "PROJELERİ"],
    projectsTitle: "Referanslarımız",
    brandStageLabel: "Referans marka bantları",
    closeLabel: "Kapat",
    projects: [
      { id: 1, title: "Kardoor Villa", location: "İzmir, Çeşme", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600" },
      { id: 2, title: "Modern Çelik Kapı", location: "İstanbul, Beşiktaş", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600" },
      { id: 3, title: "Lüks Apartman", location: "Ankara, Çankaya", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600" },
      { id: 4, title: "Prestij Konutları", location: "Bursa, Nilüfer", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600" },
      { id: 5, title: "Kıyı Yalı", location: "İstanbul, Sarıyer", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600" }
    ]
  },
  en: {
    titleLines: [["BEYOND", "THE", "DOOR"], ["WE", "CRAFT"], ["ARCHITECTURAL"], ["SIGNATURES"]],
    kickerWords: ["SELECTED", "EGE", "KARDOOR", "PROJECTS"],
    projectsTitle: "Selected Works",
    brandStageLabel: "Reference brand marquees",
    closeLabel: "Close",
    projects: [
      { id: 1, title: "Kardoor Private Villa", location: "Izmir, Cesme", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600" },
      { id: 2, title: "Modern Steel Entrance", location: "Istanbul, Besiktas", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600" },
      { id: 3, title: "Luxury Residence", location: "Ankara, Cankaya", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600" },
      { id: 4, title: "Prestige Residences", location: "Bursa, Nilufer", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600" },
      { id: 5, title: "Coastal Mansion", location: "Istanbul, Sariyer", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600" }
    ]
  }
};

const pageCopy = computed(() => pageCopies[locale.value] ?? pageCopies.tr);
const titleLines = computed(() => pageCopy.value.titleLines);

// Başlık font-size üst sınırının böleni (büyük = daha küçük yazı). TR satırları
// boşluklu olduğundan dar; mevcut /6.8 değeriyle sığıyor → DOKUNMA. EN'de en uzun
// satır tek kelime ("ARCHITECTURAL", 13 wide-cap glif) ve /6.8'de taşıyor, o yüzden
// SADECE İngilizce için bölen büyütülüp yazı küçültülür (TR layout aynı kalır).
const heroLineDivisor = computed(() => (locale.value === "en" ? 7.45 : 6.8));
const kickerWords = computed(() => pageCopy.value.kickerWords);
const wordRefs = ref([]);
const setWordRef = (el) => {
  if (el && !wordRefs.value.includes(el)) wordRefs.value.push(el);
};
const cardRefs = ref([]);
const trackRef = ref(null);
const firstGroupRef = ref(null);
const heroRef = ref(null);
const wrapperRef = ref(null);
const cardsFrameRef = ref(null);
const cardsInnerRef = ref(null);
const refStackRef = ref(null);
const kickerArrowRef = ref(null);
const marqueeCopies = Array.from({ length: 6 });

const projects = computed(() => pageCopy.value.projects);

const primaryBrands = [
  { name: "Apple", src: "https://cdn.simpleicons.org/apple/14151D" },
  { name: "Nike", src: "https://cdn.simpleicons.org/nike/14151D" },
  { name: "Tesla", src: "https://cdn.simpleicons.org/tesla/14151D" },
  { name: "Sony", src: "https://cdn.simpleicons.org/sony/14151D" },
  { name: "Meta", src: "https://cdn.simpleicons.org/meta/14151D" },
  { name: "Google", src: "https://cdn.simpleicons.org/google/14151D" },
  { name: "IKEA", src: "https://cdn.simpleicons.org/ikea/14151D" },
  { name: "McDonald's", src: "https://cdn.simpleicons.org/mcdonalds/14151D" },
  { name: "Visa", src: "https://cdn.simpleicons.org/visa/14151D" },
  { name: "BMW", src: "https://cdn.simpleicons.org/bmw/14151D" }
];

const secondaryBrands = [
  { name: "Adidas", src: "https://cdn.simpleicons.org/adidas/14151D" },
  { name: "Mastercard", src: "https://cdn.simpleicons.org/mastercard/14151D" },
  { name: "Netflix", src: "https://cdn.simpleicons.org/netflix/14151D" },
  { name: "Samsung", src: "https://cdn.simpleicons.org/samsung/14151D" },
  { name: "Spotify", src: "https://cdn.simpleicons.org/spotify/14151D" },
  { name: "Puma", src: "https://cdn.simpleicons.org/puma/14151D" },
  { name: "Toyota", src: "https://cdn.simpleicons.org/toyota/14151D" },
  { name: "Honda", src: "https://cdn.simpleicons.org/honda/14151D" },
  { name: "Microsoft", src: "" },
  { name: "NVIDIA", src: "https://cdn.simpleicons.org/nvidia/14151D" }
];

const selectedProject = ref(null);
let marqueeTween = null;
let cardRiseTrigger = null;
let heroPinTrigger = null;
const driftDirection = ref(1);

let isDragging = false;
let startX = 0;
let dragOffset = 0;
let loopWidth = 0;
let resizeObserver = null;

const setFirstGroupRef = (el) => {
  firstGroupRef.value = el;
};

const normalizeMarqueeX = (value) => {
  if (!loopWidth) return value;
  return gsap.utils.wrap(-loopWidth, 0, value);
};

const startMarquee = () => {
  if (!trackRef.value || !firstGroupRef.value) return;

  marqueeTween?.kill();
  loopWidth = firstGroupRef.value.offsetWidth;
  dragOffset = normalizeMarqueeX(Number(gsap.getProperty(trackRef.value, "x")) || 0);
  gsap.set(trackRef.value, { x: dragOffset });

  marqueeTween = gsap.to(trackRef.value, {
    x: `-=${loopWidth}`,
    duration: loopWidth / 55,
    ease: "none",
    repeat: -1,
    modifiers: {
      x: gsap.utils.unitize((x) => normalizeMarqueeX(parseFloat(x)))
    },
    onUpdate: () => {
      if (!isDragging) {
        dragOffset = normalizeMarqueeX(Number(gsap.getProperty(trackRef.value, "x")) || 0);
      }
    }
  });
};

const onDragStart = (e) => {
  isDragging = true;
  startX = e.pageX - dragOffset;
  if (marqueeTween) marqueeTween.pause();
  wrapperRef.value.style.cursor = "grabbing";
};

const onDragMove = (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.pageX;
  dragOffset = x - startX;
  dragOffset = normalizeMarqueeX(dragOffset);
  gsap.set(trackRef.value, { x: dragOffset });
};

const onDragEnd = () => {
  if (!isDragging) return;
  isDragging = false;
  wrapperRef.value.style.cursor = "grab";
  if (marqueeTween) marqueeTween.play();
};

const onPointerEnter = () => {
  if (marqueeTween && !isDragging) gsap.to(marqueeTween, { timeScale: 0, duration: 1.2, ease: "power2.out" });
};

const onPointerLeave = () => {
  if (marqueeTween && !isDragging) gsap.to(marqueeTween, { timeScale: 1, duration: 1.2, ease: "power2.inOut" });
};

const handleCardClick = (project, e) => {
  if (Math.abs(startX - (e.pageX - dragOffset)) > 5) return;
  if (selectedProject.value) return;
  selectedProject.value = project;
};

const closeModal = () => {
  selectedProject.value = null;
};

const nextProject = () => {
  if (!selectedProject.value) return;
  driftDirection.value = 1;
  const currentIndex = projects.value.findIndex(p => p.id === selectedProject.value?.id);
  selectedProject.value = projects.value[(currentIndex + 1) % projects.value.length];
};

const prevProject = () => {
  if (!selectedProject.value) return;
  driftDirection.value = -1;
  const currentIndex = projects.value.findIndex(p => p.id === selectedProject.value?.id);
  selectedProject.value = projects.value[(currentIndex - 1 + projects.value.length) % projects.value.length];
};

const onEnter = (el, done) => {
  const inner = el.querySelector(".panel-inner");
  const tl = gsap.timeline({ onComplete: done });
  tl.fromTo(el, { height: 0, opacity: 1 }, { height: "760px", duration: 1, ease: "power4.inOut" });
  tl.fromTo(inner, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.4");
};

const onLeave = (el, done) => {
  const inner = el.querySelector(".panel-inner");
  const tl = gsap.timeline({ onComplete: done });
  tl.to(inner, { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" });
  tl.to(el, { height: 0, duration: 0.7, ease: "power4.inOut", onStart: () => { el.style.overflow = "hidden"; } }, "-=0.1");
};

const onProjectEnter = (el, done) => {
  gsap.fromTo(el, { xPercent: 8 * driftDirection.value, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", onComplete: done });
};

const onProjectLeave = (el, done) => {
  gsap.to(el, { xPercent: -8 * driftDirection.value, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: done });
};

onMounted(() => {
  nextTick(() => {
    startMarquee();

    if (firstGroupRef.value) {
      resizeObserver = new ResizeObserver(() => startMarquee());
      resizeObserver.observe(firstGroupRef.value);
    }

    // CSS `position:sticky` breaks under ScrollSmoother (the transformed
    // #smooth-content becomes the sticky containing block, so the hero never
    // sticks → everything just scrolls normally). Pin the hero with
    // ScrollTrigger instead — works WITH the smoother — so the cards section
    // (higher z-index) rises up and covers the held hero, exactly like the
    // home catalog → references handoff.
    if (heroRef.value) {
      heroPinTrigger = ScrollTrigger.create({
        trigger: heroRef.value,
        start: "top top",
        end: () => "+=" + (heroRef.value?.offsetHeight || window.innerHeight),
        pin: heroRef.value,
        pinSpacing: false,
        invalidateOnRefresh: true
      });
    }
  });

  gsap.set(cardRefs.value, { autoAlpha: 1 });
  gsap.from(cardRefs.value, { y: 40, opacity: 0, duration: 0.8, stagger: 0.05, ease: "power3.out", delay: 0.4 });

  // CodePen-style SplitText word reveal (https://codepen.io/shshaw/pen/KXwawQ)
  // Headline first, kicker follows in the same visual language via the shared stagger.
  const reduceMotion = typeof window !== "undefined"
    && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const arrow = kickerArrowRef.value;
  const card = cardsFrameRef.value;

  if (reduceMotion) {
    gsap.set(wordRefs.value, { yPercent: 0, opacity: 1 });
    if (arrow) gsap.set(arrow, { opacity: 1, y: 0 });
    if (card) gsap.set(card, { y: 0 });
  } else {
    gsap.set(wordRefs.value, { yPercent: 100, opacity: 0 });
    if (arrow) gsap.set(arrow, { opacity: 0, y: 8 });
    // Card starts pushed down (tip hidden), then slides up after the text.
    if (card) gsap.set(card, { y: 170 });

    const revealTl = gsap.timeline({ delay: 0.5 });
    revealTl.to(wordRefs.value, {
      yPercent: 0,
      duration: 0.6,
      ease: "circ.out",
      stagger: 0.2
    }, 0);
    revealTl.to(wordRefs.value, {
      opacity: 1,
      duration: 0.6,
      ease: "power1.out",
      stagger: 0.2
    }, 0);

    // Arrow fades/slides in with the tail of the text reveal.
    if (arrow) {
      revealTl.to(arrow, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power1.out"
      }, ">-0.15");
    }

    // Once the whole text is in, the card rises smoothly to its peek position.
    if (card) {
      revealTl.to(card, {
        y: 0,
        duration: 1.1,
        ease: "power3.out"
      }, ">0.05");
    }

    // Scroll-driven rise ON TOP of the load reveal (home-like feel). Applied to
    // the inner content (NOT the .cards-section that the load tween drives) so
    // the two never fight: as the section scrolls up over the sticky hero, the
    // inner content rises a touch more, scrubbed to scroll position.
    if (cardsInnerRef.value && cardsFrameRef.value) {
      cardRiseTrigger = gsap.fromTo(
        cardsInnerRef.value,
        { y: 90 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: cardsFrameRef.value,
            start: "top bottom",
            end: "top top",
            scrub: true
          }
        }
      ).scrollTrigger;
    }
  }
});

onBeforeUnmount(() => {
  marqueeTween?.kill();
  cardRiseTrigger?.kill();
  cardRiseTrigger = null;
  heroPinTrigger?.kill();
  heroPinTrigger = null;

  if (resizeObserver) {
    resizeObserver.disconnect();
  }

});
</script>

<style scoped>
/* Yalnızca references rotasında uygula: koşulsuz :global(body) yazılırsa bu
   chunk'ın CSS'i link-prefetch ile yüklendiği anda TÜM sayfalara sızıyor. */
:global(body:has(.app-shell--references)) {
  margin: 0;
  padding: 0;
  font-family: "Montserrat", sans-serif;
  background: #f6f2e9;
  overflow-x: clip;
  user-select: none;
}

/* The global theme paints html/body dark (#111417). On the references day view
   the page surface is cream; a dark body behind the cream sections can bleed
   through sub-pixel gaps as a hairline on certain widths (e.g. 21:9). Force the
   root surfaces to the same cream with a :has() rule that outranks the theme. */
:global(html:has(.app-shell--day.app-shell--references)),
:global(body:has(.app-shell--day.app-shell--references)) {
  background: #f6f2e9 !important;
}

:global(html:has(.app-shell--references):not(:has(.app-shell--day))),
:global(body:has(.app-shell--references):not(:has(.app-shell--day))) {
  background: #080B18 !important;
}

:global(.app-shell),
:global(.footer-wrapper) {
  background: var(--ref-surface, #080B18);
}

:global(.site-header) {
  z-index: 1300;
}

:global(.brand-blend-layer) {
  z-index: 1301;
}

:global(.brand-blend-layer--ege) {
  z-index: 1302;
}

.viewport-wrapper {
  /* Hero height < 100svh so the rounded card tip peeks at the bottom on load. */
  --ref-hero-h: 92svh;

  /* Same dark palette as /contact. */
  --ref-surface: #080B18;
  --ref-page-bg: linear-gradient(180deg, #050714 0%, #080B18 100%);
  --ref-panel-bg: #080B18;
  --ref-cards-panel-bg: #131937;
  --ref-ink: #F4F6FF;
  --ref-ink-soft: #B9C0D8;
  --ref-title-ink: #F4F6FF;
  --ref-card-bg: #171D3D;
  --ref-card-border: rgba(244, 246, 255, 0.12);
  --ref-card-title: #F4F6FF;
  --ref-card-loc: #9FA7BD;
  --ref-accent: #8EA2FF;
  --ref-logo-filter: brightness(0) saturate(100%) invert(94%) sepia(7%) saturate(216%) hue-rotate(222deg) brightness(103%) contrast(94%);
  --ref-modal-bg: #050714;
  --ref-modal-ink: #F4F6FF;
  --ref-modal-sub: #B9C0D8;
  --ref-modal-shadow: 0 50px 120px rgba(0, 0, 0, 0.55);
  --ref-close-chip: #C3CCFF;
  --ref-close-ink: #050714;

  width: 100%;
  position: relative;
  background: var(--ref-panel-bg);
  min-height: 100vh;
}

/* Same light palette as /contact. */
:global(.app-shell--day .viewport-wrapper) {
  --ref-surface: #f6f2e9;
  --ref-page-bg:
    radial-gradient(circle at 12% 8%, rgba(255, 255, 255, 0.76), transparent 26rem),
    linear-gradient(180deg, #faf7ef 0%, var(--ref-surface) 58%, #eee8db 100%);
  --ref-panel-bg: #f6f2e9;
  --ref-cards-panel-bg: #f6f2e9;
  --ref-ink: #111417;
  --ref-ink-soft: rgba(17, 20, 23, 0.68);
  --ref-title-ink: #111417;
  --ref-card-bg: rgba(255, 255, 255, 0.72);
  --ref-card-border: rgba(17, 20, 23, 0.24);
  --ref-card-title: #111417;
  --ref-card-loc: rgba(17, 20, 23, 0.48);
  --ref-accent: #d71920;
  --ref-logo-filter: none;
  --ref-modal-bg: #f5f1e8;
  --ref-modal-ink: #111417;
  --ref-modal-sub: rgba(17, 20, 23, 0.68);
  --ref-modal-shadow: 0 50px 120px rgba(81, 69, 53, 0.22);
  --ref-close-chip: #111417;
  --ref-close-ink: #f5f1e8;
}

:global(html[data-theme="dark"]) :global(body) {
  background: #080B18;
}

/* Scroll handoff (CSS sticky, smooth): the hero sticks to the top so the card
   rises and covers it (reveal), then everything scrolls normally into the
   footer. No pinning/locking — keeps it jank-free. */
.ref-stack {
  position: relative;
  isolation: isolate;
}

.hero {
  width: 100%;
  min-height: var(--ref-hero-h, 92svh);
  background: var(--ref-panel-bg);
  padding: calc(var(--header, 86px) + 24px) clamp(18px, 4vw, 64px) clamp(76px, 8vw, 120px);
  /* Pinned via ScrollTrigger in JS (CSS sticky breaks under ScrollSmoother). */
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-block {
  --hero-title-gap-anchor: clamp(14px, 1.2vw, 30px);
  --hero-title-gap: clamp(28px, 2.35vw, 58px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--hero-title-gap);
  letter-spacing: 0;
  margin-left: 0;
  text-align: center;
  transform: translateY(calc(var(--hero-title-gap) - var(--hero-title-gap-anchor)));
}

.hero-line {
  font-family: "PP Mori", "General Sans", Inter, system-ui, sans-serif;
  /* Üst sınır böleni dile göre değişir (--hero-line-divisor): TR 6.8 (mevcut),
     EN 7.45 → uzun "ARCHITECTURAL" satırı sığsın. Var yoksa 6.8'e düşer. */
  font-size: min(
    clamp(5.35rem, 8.4vw, 11.4rem),
    calc((100vw - 40px) / var(--hero-line-divisor, 6.8))
  );
  font-weight: 600;
  color: var(--ref-ink);
  line-height: 0.9;
  display: block;
  letter-spacing: 0;
  text-transform: uppercase;
  white-space: nowrap;
}

/* SplitText-style reveal mask. Padding gives the words clearance to slide
   in/out; the matching negative margin keeps the static layout untouched. */
.ts-line {
  overflow: hidden;
  padding: 0.18em 0 0.22em;
  margin: -0.18em 0 -0.22em;
}

.ts-word {
  display: inline-block;
  will-change: transform;
}

.ts-space {
  display: inline-block;
  width: 0.25em;
}

.ts-line--kicker {
  display: inline-block;
  padding: 0.12em 0 0.18em;
  margin: -0.12em 0 -0.18em;
  vertical-align: middle;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  margin: clamp(34px, 5.2vw, 72px) 0 0;
  color: var(--ref-ink-soft);
  font-family: "Montserrat", sans-serif;
  font-size: clamp(0.64rem, 0.74vw, 0.78rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
  text-align: center;
}

.hero-kicker .kicker-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--ref-ink);
  flex: 0 0 auto;
}

.hero-kicker .kicker-arrow svg {
  width: 100%;
  height: 100%;
  display: block;
  animation: kicker-arrow-bob 1.8s ease-in-out infinite;
}

@keyframes kicker-arrow-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-kicker .kicker-arrow {
    animation: none;
  }
}

.project-expansion-panel {
  position: absolute;
  top: var(--ref-hero-h, 92svh);
  left: 50%;
  width: 1550px;
  max-width: 95vw;
  transform: translateX(-50%);
  background: var(--ref-modal-bg);
  z-index: 1200;
  border-radius: 28px;
  box-shadow: var(--ref-modal-shadow);
  will-change: height;
}

.panel-inner {
  max-width: 1550px;
  margin: 0 auto;
  padding: 64px 80px 80px;
  height: 760px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel-close {
  position: absolute;
  top: 44px;
  right: 80px;
  background: none;
  border: none;
  color: var(--ref-modal-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: "Montserrat", sans-serif;
  font-size: 14px;
  font-weight: 700;
  z-index: 10;
}

.close-icon {
  width: 44px;
  height: 44px;
  background: var(--ref-close-chip);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.panel-close:hover .close-icon {
  transform: rotate(90deg);
}

.close-icon svg {
  width: 18px;
  height: 18px;
  stroke: var(--ref-close-ink);
}

.panel-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
}

.panel-carousel {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 60px;
}

.image-viewport {
  flex: 1;
  position: relative;
  height: 520px;
  overflow: hidden;
  border-radius: 20px;
}

.project-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.display-img-container {
  flex: 1;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.display-img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.display-info {
  padding-bottom: 20px;
}

.display-info h3 {
  font-family: "Montserrat", sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: var(--ref-modal-ink);
  margin-bottom: 4px;
}

.panel-location {
  font-family: "Inter", sans-serif;
  font-weight: 300;
  font-size: 18px;
  color: var(--ref-modal-sub);
  margin: 0;
  line-height: 1.6;
  padding-bottom: 15px;
}

.nav-btn {
  background: none;
  border: none;
  color: var(--ref-modal-ink);
  font-size: 80px;
  cursor: pointer;
  opacity: 0.2;
  transition: 0.3s;
  padding: 10px;
}

.nav-btn:hover {
  opacity: 1;
  color: var(--ref-accent);
}

.cards-section {
  background: var(--ref-cards-panel-bg);
  min-height: 100svh;
  box-sizing: border-box;
  width: 100%;
  position: relative;
  z-index: 2;
}

.cards-inner {
  width: 100%;
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(30px, 3.8vw, 52px) 0 clamp(34px, 4vw, 60px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ref-stack__panel {
  border-top-left-radius: clamp(2rem, 4.2vw, 4.25rem);
  border-top-right-radius: clamp(2rem, 4.2vw, 4.25rem);
  box-shadow: 0 -24px 70px -26px rgba(8, 10, 12, 0.28);
  overflow: hidden;
  /* No permanent compositing layer here: will-change:transform promoted the
     panel to its own GPU layer, and on wide (21:9) viewports its bottom edge
     left a 1px hairline against the cream footer behind it. GSAP adds
     will-change itself for the duration of the reveal tween, so the load
     animation stays smooth without a persistent layer. */
}

.top-transition-shadow {
  display: none;
}

.ref-projects-title {
  width: 100%;
  margin: 0 0 clamp(28px, 3.4vw, 56px);
  padding: 0 clamp(18px, 4vw, 76px);
  box-sizing: border-box;
  color: var(--ref-title-ink);
  font-family: "PP Telegraf", "General Sans", Inter, system-ui, sans-serif;
  font-size: clamp(56px, 8vw, 168px);
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0;
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .ref-projects-title {
    font-size: clamp(3rem, 12vw, 4.25rem);
    white-space: normal;
  }
}

.marquee-wrapper {
  width: 100%;
  overflow-x: clip;
  overflow-y: visible;
  padding: clamp(28px, 3vw, 48px) 0;
  cursor: grab;
  touch-action: none;
}

.marquee-wrapper:active {
  cursor: grabbing;
}

.marquee-track {
  display: flex;
  width: max-content;
  will-change: transform;
}

.marquee-group {
  display: flex;
  align-items: center;
  gap: 60px;
  padding-right: 60px;
}

.card {
  background: var(--ref-card-bg);
  width: 320px;
  border-radius: 20px;
  padding: 14px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 20px -5px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
  border: 1px solid var(--ref-card-border);
}

.card:hover {
  transform: translateY(-12px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08);
  border-color: rgba(142, 162, 255, 0.28);
}

:global(.app-shell--references:not(.app-shell--day)) .card:hover {
  background: #1D244A;
}

.card-image img {
  width: 100%;
  aspect-ratio: 1/1.1;
  object-fit: cover;
  border-radius: 14px;
  display: block;
  pointer-events: none;
}

.card-body {
  padding: 24px 10px 10px;
  pointer-events: none;
}

.card-title {
  font-family: "PP Mori", "General Sans", Inter, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--ref-card-title);
  margin-bottom: 8px;
}

.card-location {
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  color: var(--ref-card-loc);
  font-weight: 500;
  margin: 0;
}

.reference-brand-stage {
  width: 100%;
  margin-top: clamp(130px, 13vw, 240px);
  margin-bottom: clamp(90px, 9vw, 170px);
  overflow: hidden;
}

.reference-logo-row {
  position: relative;
  left: 50%;
  right: 50%;
  width: 100vw;
  max-width: none;
  overflow: hidden;
  margin-left: -50vw;
  margin-right: -50vw;
  /* Hover büyümesinde logolar dikeyde kırpılmasın diye pay. */
  padding-block: clamp(10px, 1.2vw, 20px);
}

.reference-logo-row + .reference-logo-row {
  margin-top: clamp(16px, 2vw, 28px);
}

.reference-logo-track {
  display: flex;
  align-items: center;
  width: max-content;
  white-space: nowrap;
  will-change: transform;
  animation: reference-logo-right 120s linear infinite;
}

.reference-logo-row--bottom .reference-logo-track {
  animation-name: reference-logo-left;
}

.reference-logo-row:hover .reference-logo-track {
  animation-play-state: paused;
}

.reference-logo-group {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  white-space: nowrap;
}

.reference-logo-item {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: clamp(116px, 8.5vw, 168px);
  height: clamp(42px, 3.8vw, 68px);
  margin: 0 clamp(22px, 3vw, 54px);
  color: rgba(20, 21, 29, 0.92);
  opacity: 0.9;
}

.reference-logo-item img,
.reference-logo-mark svg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 420ms cubic-bezier(0.165, 0.84, 0.44, 1),
    opacity 420ms ease;
}

/* Hover'da o anki logo büyür (home ile aynı his); bant zaten hover'da durduğu
   için hangi logonun üstünde olduğumuz net okunur. */
.reference-logo-item:hover img,
.reference-logo-item:hover .reference-logo-mark svg {
  transform: scale(1.32);
  opacity: 1;
}

.reference-logo-item img {
  filter: var(--ref-logo-filter);
}

.reference-logo-mark {
  display: inline-flex;
  width: 100%;
  height: 100%;
  color: var(--ref-ink);
}

@keyframes reference-logo-left {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

@keyframes reference-logo-right {
  from {
    transform: translateX(-50%);
  }

  to {
    transform: translateX(0);
  }
}

:global(.app-shell--references) {
  background: #080B18 !important;
  background-color: #080B18 !important;
}

:global(.app-shell--references:not(.app-shell--day) .footer-wrapper) {
  background: #131937 !important;
  background-color: #131937 !important;
}

:global(.app-shell--day.app-shell--references),
:global(.app-shell--day.app-shell--references .footer-wrapper) {
  background: #f6f2e9 !important;
  background-color: #f6f2e9 !important;
}

:global(.app-shell--references .footer-wrapper) {
  margin-top: 0;
}

:global(.app-shell--references .footer-dome) {
  background-color: #2a2a30;
  box-shadow: 0 0 0 1px #2a2a30;
}

:global(.app-shell--references:not(.app-shell--day) .footer-dome) {
  background: linear-gradient(180deg, #0D122B 0%, #131937 100%) !important;
  background-color: #131937 !important;
  box-shadow: 0 0 0 1px #131937 !important;
  outline-color: #131937 !important;
}

:global(.app-shell--references:not(.app-shell--day) .site-header) {
  --header-control-active: linear-gradient(135deg, #F4F6FF 0%, #C3CCFF 100%) !important;
  --header-link-active: #050714;
}

:global(.app-shell--references:not(.app-shell--day) .site-header__nav-link.is-active),
:global(.app-shell--references:not(.app-shell--day) .site-header__mobile-link.is-active) {
  background: linear-gradient(135deg, #F4F6FF 0%, #C3CCFF 100%) !important;
  color: #050714 !important;
}

:global(.app-shell--references:not(.app-shell--day) .footer-form .form-row input) {
  border-color: rgba(244, 246, 255, 0.22);
  color: #F4F6FF;
}

:global(.app-shell--references:not(.app-shell--day) .footer-form .form-row input:focus),
:global(.app-shell--references:not(.app-shell--day) .footer-form .form-row input:focus-visible) {
  border-color: #8EA2FF;
}

@media (min-width: 761px) {
  :global(.app-shell--references:not(.app-shell--day) .submit-btn),
  :global(.app-shell--references:not(.app-shell--day) .submit-btn__label),
  :global(.app-shell--references:not(.app-shell--day) .submit-btn svg) {
    color: #F4F6FF !important;
    stroke: #F4F6FF !important;
  }
}

/* No visible chip ring around the footer social buttons on references. */
:global(.app-shell--references .social-btn) {
  background-color: transparent;
}

:global(.app-shell--references .social-btn:hover) {
  background-color: #e6e7eb;
}

:global(.app-shell--references:not(.app-shell--day) .footer-socials > .social-btn) {
  background-color: #171D3D !important;
  color: #F4F6FF !important;
  border: 1px solid rgba(244, 246, 255, 0.12) !important;
}

:global(.app-shell--references:not(.app-shell--day) .footer-socials > .social-btn:hover) {
  background-color: #C3CCFF !important;
  color: #050714 !important;
  border-color: rgba(142, 162, 255, 0.28) !important;
}

@media (max-width: 900px) {
  .hero {
    min-height: 100svh;
    padding-top: calc(var(--header, 86px) + 22px);
    padding-bottom: 72px;
  }

  .hero-line {
    font-size: min(
      clamp(3.65rem, 11.4vw, 6.7rem),
      calc((100vw - 32px) / 9.8)
    );
    line-height: 0.92;
  }

  .cards-section {
    min-height: 100svh;
    padding-top: 44px;
    padding-bottom: 62px;
  }

  .reference-logo-item {
    width: clamp(108px, 24vw, 148px);
    height: clamp(44px, 12vw, 68px);
    margin: 0 clamp(18px, 5vw, 34px);
  }
}

@media (max-width: 540px) {
  .hero {
    min-height: 100svh;
    padding-inline: 16px;
    padding-bottom: 64px;
  }

  .hero-line {
    font-size: min(
      clamp(2.05rem, 10.4vw, 3.15rem),
      calc((100vw - 24px) / 11.8)
    );
    line-height: 0.94;
  }

  .hero-kicker {
    margin-top: 36px;
    font-size: 0.64rem;
  }

  .marquee-group {
    gap: 28px;
    padding-right: 28px;
  }

  .card {
    width: min(72vw, 280px);
  }

  .project-expansion-panel {
    position: fixed;
    inset: 0;
    width: 100vw;
    min-height: 100svh;
    height: 100dvh !important;
    max-width: none;
    transform: none !important;
    z-index: 10000;
    border-radius: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .panel-inner {
    min-height: 100%;
    height: auto !important;
    max-width: none;
    padding: calc(var(--header, 70px) + 18px) 18px 28px;
  }

  .panel-close {
    top: 18px;
    right: 16px;
    gap: 10px;
    z-index: 20;
  }

  .close-icon {
    width: 52px;
    height: 52px;
  }

  .panel-content {
    margin-top: 18px;
    align-items: stretch;
  }

  .panel-carousel {
    position: relative;
    display: block;
    min-height: 0;
  }

  .image-viewport {
    width: 100%;
    height: auto;
    min-height: 0;
    overflow: visible;
    border-radius: 18px;
  }

  .project-display {
    height: auto;
    min-height: 0;
    gap: 18px;
  }

  .display-img-container {
    flex: none;
    width: min(100%, 360px);
    height: auto;
    aspect-ratio: 4 / 5;
    margin: 0 auto;
    border-radius: 18px;
  }

  .display-info {
    width: min(100%, 360px);
    margin: 0 auto;
    padding-bottom: 0;
    text-align: left;
  }

  .display-info h3 {
    font-size: clamp(2rem, 10vw, 3rem);
    line-height: 0.95;
    overflow-wrap: anywhere;
  }

  .panel-location {
    font-size: 1rem;
    line-height: 1.45;
    padding-bottom: 0;
  }

  .nav-btn {
    position: absolute;
    top: min(40vw, 220px);
    transform: translateY(-50%);
    padding: 10px;
    font-size: 62px;
    line-height: 1;
    z-index: 3;
  }

  .nav-btn.prev {
    left: -4px;
  }

  .nav-btn.next {
    right: -4px;
  }

  .reference-brand-stage {
    margin-top: clamp(72px, 18vw, 120px);
    margin-bottom: clamp(56px, 14vw, 96px);
  }

  .reference-logo-row + .reference-logo-row {
    margin-top: 18px;
  }
}
</style>
