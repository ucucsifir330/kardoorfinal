<script setup lang="ts">
import gsap from "gsap";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

type Project = {
  id: number;
  title: string;
  location: string;
  image: string;
};

const { locale } = useKardoorLocale();

const pageCopy = computed(() =>
  locale.value === "tr"
    ? {
        title: "REFERANSLAR",
        close: "Kapat",
        previous: "Önceki referans",
        next: "Sonraki referans",
        metaTitle: "Referanslar",
        metaDescription: "Ege Kardoor referans projeleri ve uygulama örnekleri."
      }
    : {
        title: "REFERENCES",
        close: "Close",
        previous: "Previous reference",
        next: "Next reference",
        metaTitle: "References",
        metaDescription: "Ege Kardoor reference projects and installation examples."
      }
);

useSeoMeta({
  title: () => pageCopy.value.metaTitle,
  description: () => pageCopy.value.metaDescription
});

const titleLetters = computed(() => pageCopy.value.title.split(""));
const letterRefs = ref<HTMLElement[]>([]);
const brandRef = ref<HTMLElement | null>(null);
const cardRefs = ref<HTMLElement[]>([]);
const trackRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);

const projects = ref<Project[]>([
  {
    id: 1,
    title: "Kardoor Villa",
    location: "İzmir, Çeşme",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600"
  },
  {
    id: 2,
    title: "Modern Çelik Kapı",
    location: "İstanbul, Beşiktaş",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600"
  },
  {
    id: 3,
    title: "Lüks Apartman",
    location: "Ankara, Çankaya",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600"
  },
  {
    id: 4,
    title: "Prestij Konutları",
    location: "Bursa, Nilüfer",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600"
  },
  {
    id: 5,
    title: "Kıyı Yalı",
    location: "İstanbul, Sarıyer",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600"
  }
]);

const selectedProject = ref<Project | null>(null);
const driftDirection = ref(1);

let marqueeTween: gsap.core.Tween | null = null;
let isDragging = false;
let startX = 0;
let pointerStartX = 0;
let hasDragged = false;
let dragOffset = 0;

const setLetterRef = (element: Element | null, index: number) => {
  if (element instanceof HTMLElement) letterRefs.value[index] = element;
};

const setCardRef = (element: Element | null, index: number) => {
  if (element instanceof HTMLElement) cardRefs.value[index] = element;
};

const onDragStart = (event: PointerEvent) => {
  isDragging = true;
  startX = event.pageX - dragOffset;
  pointerStartX = event.pageX;
  hasDragged = false;
  marqueeTween?.pause();
  wrapperRef.value?.setPointerCapture(event.pointerId);
  if (wrapperRef.value) wrapperRef.value.style.cursor = "grabbing";
};

const onDragMove = (event: PointerEvent) => {
  if (!isDragging || !trackRef.value) return;

  event.preventDefault();
  hasDragged = Math.abs(event.pageX - pointerStartX) > 8;
  dragOffset = event.pageX - startX;

  const totalWidth = trackRef.value.offsetWidth / 2;
  if (dragOffset > 0) dragOffset -= totalWidth;
  if (dragOffset < -totalWidth) dragOffset += totalWidth;

  gsap.set(trackRef.value, { x: dragOffset });
};

const onDragEnd = (event: PointerEvent) => {
  if (!isDragging) return;

  isDragging = false;
  wrapperRef.value?.releasePointerCapture(event.pointerId);
  if (wrapperRef.value) wrapperRef.value.style.cursor = "grab";
  marqueeTween?.play();
};

const onPointerEnter = () => {
  if (marqueeTween && !isDragging) {
    gsap.to(marqueeTween, { timeScale: 0, duration: 1.2, ease: "power2.out" });
  }
};

const onPointerLeave = (event: PointerEvent) => {
  onDragEnd(event);

  if (marqueeTween && !isDragging) {
    gsap.to(marqueeTween, { timeScale: 1, duration: 1.2, ease: "power2.inOut" });
  }
};

const handleCardClick = (project: Project) => {
  if (hasDragged) return;
  if (selectedProject.value) return;

  selectedProject.value = project;
};

const closeModal = () => {
  selectedProject.value = null;
};

const nextProject = () => {
  if (!selectedProject.value) return;

  driftDirection.value = 1;
  const currentIndex = projects.value.findIndex((project) => project.id === selectedProject.value?.id);
  selectedProject.value = projects.value[(currentIndex + 1) % projects.value.length];
};

const prevProject = () => {
  if (!selectedProject.value) return;

  driftDirection.value = -1;
  const currentIndex = projects.value.findIndex((project) => project.id === selectedProject.value?.id);
  selectedProject.value =
    projects.value[(currentIndex - 1 + projects.value.length) % projects.value.length];
};

const onPanelEnter = (element: Element, done: () => void) => {
  const inner = element.querySelector(".panel-inner");
  const timeline = gsap.timeline({ onComplete: done });

  timeline.fromTo(
    element,
    { height: 0, opacity: 1 },
    { height: "min(760px, calc(100vh - 120px))", duration: 1, ease: "power4.inOut" }
  );
  timeline.fromTo(
    inner,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
    "-=0.4"
  );
};

const onPanelLeave = (element: Element, done: () => void) => {
  const inner = element.querySelector(".panel-inner");
  const timeline = gsap.timeline({ onComplete: done });

  timeline.to(inner, { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" });
  timeline.to(
    element,
    {
      height: 0,
      duration: 0.7,
      ease: "power4.inOut",
      onStart: () => {
        if (element instanceof HTMLElement) element.style.overflow = "hidden";
      }
    },
    "-=0.1"
  );
};

const onProjectEnter = (element: Element, done: () => void) => {
  gsap.fromTo(
    element,
    { xPercent: 8 * driftDirection.value, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", onComplete: done }
  );
};

const onProjectLeave = (element: Element, done: () => void) => {
  gsap.to(element, {
    xPercent: -8 * driftDirection.value,
    opacity: 0,
    duration: 0.3,
    ease: "power2.in",
    onComplete: done
  });
};

onMounted(() => {
  if (trackRef.value) {
    marqueeTween = gsap.to(trackRef.value, {
      x: () => -(trackRef.value ? trackRef.value.offsetWidth / 2 : 0),
      duration: 35,
      ease: "none",
      repeat: -1,
      onUpdate: () => {
        if (!isDragging && trackRef.value) {
          dragOffset = Number(gsap.getProperty(trackRef.value, "x"));
        }
      }
    });
  }

  gsap.set([brandRef.value, letterRefs.value, cardRefs.value], { autoAlpha: 1 });
  gsap.from(brandRef.value, { x: -30, opacity: 0, duration: 1, ease: "power3.out" });
  gsap.from(letterRefs.value, {
    y: 60,
    opacity: 0,
    duration: 0.8,
    stagger: 0.04,
    ease: "back.out(1.5)"
  });
  gsap.from(cardRefs.value, {
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.05,
    ease: "power3.out",
    delay: 0.4
  });
});

onBeforeUnmount(() => {
  marqueeTween?.kill();
});
</script>

<template>
  <div class="references-page">
    <section class="references-hero">
      <div class="hero-inner">
        <div ref="brandRef" class="hero-brand">
          <span class=""></span>
          <span class=""> <span class="reg-mark"></span></span>
        </div>

        <h1 class="hero-title" :aria-label="pageCopy.title">
          <span class="title-block" aria-hidden="true">
            <span
              v-for="(letter, index) in titleLetters"
              :key="`${letter}-${index}`"
              :ref="(element) => setLetterRef(element, index)"
              class="hero-letter"
            >
              {{ letter }}
            </span>
          </span>
        </h1>
      </div>

      <Transition :css="false" @enter="onPanelEnter" @leave="onPanelLeave">
        <div v-if="selectedProject" class="project-expansion-panel">
          <div class="panel-inner">
            <button type="button" class="panel-close" @click.stop.prevent="closeModal">
              <span class="close-text">{{ pageCopy.close }}</span>
              <span class="close-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </button>

            <div class="panel-content">
              <div class="panel-carousel">
                <button type="button" class="nav-btn prev" :aria-label="pageCopy.previous" @click="prevProject">
                  ‹
                </button>

                <div class="image-viewport">
                  <Transition
                    :css="false"
                    mode="out-in"
                    @enter="onProjectEnter"
                    @leave="onProjectLeave"
                  >
                    <div :key="selectedProject.id" class="project-display">
                      <div class="display-img-container">
                        <img :src="selectedProject.image" :alt="selectedProject.title" />
                      </div>
                      <div class="display-info">
                        <h2>{{ selectedProject.title }}</h2>
                        <p class="panel-location">{{ selectedProject.location }}</p>
                      </div>
                    </div>
                  </Transition>
                </div>

                <button type="button" class="nav-btn next" :aria-label="pageCopy.next" @click="nextProject">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <section class="cards-section">
      <div class="top-transition-shadow" aria-hidden="true" />

      <div
        ref="wrapperRef"
        class="marquee-wrapper"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
        @pointerenter="onPointerEnter"
        @pointerleave="onPointerLeave"
      >
        <div ref="trackRef" class="marquee-track">
          <div class="marquee-group">
            <button
              v-for="(project, index) in projects"
              :key="`group-a-${project.id}`"
              :ref="(element) => setCardRef(element, index)"
              type="button"
              class="reference-card"
              @click="handleCardClick(project)"
            >
              <span class="card-image">
                <img :src="project.image" :alt="project.title" />
              </span>
              <span class="card-body">
                <span class="card-title"><span aria-hidden="true">→</span> {{ project.title }}</span>
                <span class="card-location">{{ project.location }}</span>
              </span>
            </button>
          </div>

          <div class="marquee-group" aria-hidden="true">
            <button
              v-for="(project, index) in projects"
              :key="`group-b-${project.id}`"
              :ref="(element) => setCardRef(element, index + projects.length)"
              type="button"
              class="reference-card"
              tabindex="-1"
              @click="handleCardClick(project)"
            >
              <span class="card-image">
                <img :src="project.image" :alt="project.title" />
              </span>
              <span class="card-body">
                <span class="card-title"><span aria-hidden="true">→</span> {{ project.title }}</span>
                <span class="card-location">{{ project.location }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.references-page {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  background: #fff;
  color: #000;
}

.references-hero {
  position: relative;
  z-index: 5;
  display: flex;
  width: 100%;
  min-height: 310px;
  flex-direction: column;
  justify-content: flex-end;
  padding: 120px 56px 30px;
  background: #000;
}

.hero-inner {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
}

.hero-brand {
  position: relative;
  margin-bottom: 10px;
  color: #fff;
  font-family: Montserrat, Inter, sans-serif;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
}

.hero-brand .ege {
  color: #0066a9;
}

.reg-mark {
  position: relative;
  top: -0.6em;
  margin-left: 2px;
  color: rgb(255 255 255 / 70%);
  font-size: 0.45em;
  font-weight: 400;
}

.hero-title {
  margin: 0;
}

.title-block {
  display: block;
  margin-left: -8px;
  letter-spacing: -6px;
}

.hero-letter {
  display: inline-block;
  color: #fff;
  font-family: Montserrat, Inter, sans-serif;
  font-size: clamp(54px, 9vw, 130px);
  font-weight: 700;
  line-height: 0.76;
}

.project-expansion-panel {
  position: absolute;
  top: 100%;
  left: 50%;
  z-index: 4;
  width: 1550px;
  max-width: 95vw;
  overflow: hidden;
  transform: translateX(-50%);
  border-radius: 0 0 40px 40px;
  background: #000;
  box-shadow: 0 50px 120px rgb(0 0 0 / 40%);
  will-change: height;
}

.panel-inner {
  position: relative;
  display: flex;
  height: min(760px, calc(100vh - 120px));
  max-width: 1550px;
  flex-direction: column;
  margin: 0 auto;
  padding: 20px 80px 80px;
}

.panel-close {
  position: absolute;
  top: 10px;
  right: 80px;
  z-index: 10;
  display: flex;
  align-items: center;
  border: 0;
  background: none;
  color: #fff;
  cursor: pointer;
  font-family: Montserrat, Inter, sans-serif;
  font-size: 14px;
  font-weight: 700;
  gap: 14px;
}

.close-icon {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eae8e8;
  transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.panel-close:hover .close-icon {
  transform: rotate(90deg);
}

.close-icon svg {
  stroke: #13141c;
  stroke-linecap: round;
  stroke-width: 2.5;
}

.panel-content {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
}

.panel-carousel {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 60px;
}

.image-viewport {
  position: relative;
  overflow: hidden;
  height: 520px;
  flex: 1;
  border-radius: 20px;
}

.project-display {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  gap: 24px;
}

.display-img-container {
  flex: 1;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgb(0 0 0 / 50%);
}

.display-img-container img,
.card-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.display-info {
  padding-bottom: 20px;
}

.display-info h2 {
  margin: 0 0 4px;
  color: #fff;
  font-family: Montserrat, Inter, sans-serif;
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 700;
}

.panel-location {
  margin: 0;
  padding-bottom: 15px;
  color: rgb(255 255 255 / 50%);
  font-family: Inter, sans-serif;
  font-size: 18px;
  font-weight: 300;
  line-height: 1.6;
}

.nav-btn {
  border: 0;
  background: none;
  color: #fff;
  cursor: pointer;
  font-size: 80px;
  opacity: 0.2;
  padding: 10px;
  transition: 0.3s;
}

.nav-btn:hover,
.nav-btn:focus-visible {
  color: #0066a9;
  opacity: 1;
}

.cards-section {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  padding: 80px 0 120px;
  background: #fff;
}

.top-transition-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: linear-gradient(to bottom, rgb(0 0 0 / 4%) 0%, transparent 100%);
  pointer-events: none;
}

.marquee-wrapper {
  overflow: hidden;
  width: 100%;
  cursor: grab;
  padding: 40px 0;
  touch-action: none;
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

.reference-card {
  flex-shrink: 0;
  width: 320px;
  border: 1px solid rgb(0 0 0 / 2%);
  border-radius: 20px;
  background: #fff;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 2%),
    0 10px 20px -5px rgb(0 0 0 / 5%);
  cursor: pointer;
  padding: 14px;
  text-align: left;
  transition:
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.reference-card:hover,
.reference-card:focus-visible {
  transform: translateY(-12px);
  border-color: rgb(0 102 169 / 8%);
  box-shadow: 0 20px 40px -10px rgb(0 0 0 / 8%);
  outline: 0;
}

.card-image {
  display: block;
  aspect-ratio: 1 / 1.1;
  overflow: hidden;
  border-radius: 14px;
  pointer-events: none;
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 24px 10px 10px;
  pointer-events: none;
}

.card-title {
  margin-bottom: 8px;
  color: #000;
  font-family: Montserrat, Inter, sans-serif;
  font-size: 18px;
  font-weight: 800;
}

.card-title span {
  margin-right: 6px;
  color: #0066a9;
}

.card-location {
  margin: 0;
  color: #999;
  font-family: Montserrat, Inter, sans-serif;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .references-hero {
    min-height: 245px;
    padding: 92px 16px 26px;
  }

  .title-block {
    display: block;
    max-width: 100%;
    margin-left: 0;
    letter-spacing: 0;
    overflow-wrap: normal;
    white-space: normal;
  }

  .hero-letter {
    font-size: clamp(37px, 10.5vw, 52px);
    line-height: 0.92;
  }

  .cards-section {
    align-items: stretch;
    padding: 42px 0 72px;
  }

  .panel-inner {
    padding: 72px 20px 32px;
  }

  .panel-close {
    right: 20px;
  }

  .panel-carousel {
    gap: 12px;
  }

  .image-viewport {
    height: min(58vh, 460px);
  }

  .nav-btn {
    font-size: 48px;
    padding: 4px;
  }

  .marquee-group {
    gap: 14px;
    padding-right: 14px;
  }

  .reference-card {
    width: min(74vw, 260px);
    border-radius: 14px;
    padding: 10px;
  }

  .card-image {
    border-radius: 10px;
  }

  .card-body {
    padding: 16px 4px 6px;
  }

  .card-title {
    font-size: 15px;
    line-height: 1.2;
  }

  .card-location {
    font-size: 12px;
  }
}

@media (max-width: 420px) {
  .references-hero {
    min-height: 228px;
    padding-top: 88px;
  }

  .hero-letter {
    font-size: clamp(34px, 9.7vw, 42px);
  }

  .reference-card {
    width: min(72vw, 240px);
  }
}
</style>
