<script setup lang="ts">
import gsap from "gsap";
import type { ComponentPublicInstance } from "vue";
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

const resolveTemplateElement = (element: Element | ComponentPublicInstance | null) => {
  if (element instanceof HTMLElement) return element;
  if (element && "$el" in element && element.$el instanceof HTMLElement) return element.$el;
  return null;
};

const setLetterRef = (element: Element | ComponentPublicInstance | null, index: number) => {
  const htmlElement = resolveTemplateElement(element);
  if (htmlElement) letterRefs.value[index] = htmlElement;
};

const setCardRef = (element: Element | ComponentPublicInstance | null, index: number) => {
  const htmlElement = resolveTemplateElement(element);
  if (htmlElement) cardRefs.value[index] = htmlElement;
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

