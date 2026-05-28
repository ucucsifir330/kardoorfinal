<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const shouldRender = ref(false);
const mountRef = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;
let renderTimer: number | null = null;
let renderFrame: number | null = null;

const refreshScrollTriggers = async () => {
  try {
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    ScrollTrigger.refresh();
  } catch {
    // The page still works without GSAP refresh; this only keeps scroll-linked reveals in sync.
  }
};

const renderFlow = () => {
  if (shouldRender.value) return;
  shouldRender.value = true;
  observer?.disconnect();
  observer = null;

  nextTick(() => {
    const section = document.querySelector(".catalog-section");
    if (!section) return;

    visibilityObserver = new IntersectionObserver(
      (entries) => {
        document.body.classList.toggle(
          "home-content-visible",
          entries.some((entry) => entry.isIntersecting)
        );
      },
      { threshold: 0.08 }
    );
    visibilityObserver.observe(section);
  });

  requestAnimationFrame(() => {
    refreshScrollTriggers();
  });
};

const scheduleRenderFlow = () => {
  if (shouldRender.value || renderTimer || renderFrame) return;

  const run = () => {
    renderTimer = null;
    renderFrame = null;
    renderFlow();
  };

  renderFrame = window.requestAnimationFrame(run);
};

const handleDoorState = (event: Event) => {
  const detail = (event as CustomEvent<{ isOpen?: boolean }>).detail;
  if (detail?.isOpen) scheduleRenderFlow();
};

onMounted(() => {
  window.addEventListener("kardoor:entrance-door-state", handleDoorState);
  scheduleRenderFlow();

  if (mountRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) renderFlow();
      },
      { rootMargin: "1600px 0px", threshold: 0.01 }
    );
    observer.observe(mountRef.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("kardoor:entrance-door-state", handleDoorState);
  if (renderTimer) window.clearTimeout(renderTimer);
  if (renderFrame) window.cancelAnimationFrame(renderFrame);
  observer?.disconnect();
  visibilityObserver?.disconnect();
  document.body.classList.remove("home-content-visible");
});
</script>

<template>
  <div ref="mountRef" class="home-content-loader">
    <ClientOnly>
      <LazyHomeExperience v-if="shouldRender" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.home-content-loader {
  min-height: 1px;
}
</style>
