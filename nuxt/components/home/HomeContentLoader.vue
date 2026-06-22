<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const shouldRender = ref(false);
const mountRef = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let renderFrame: number | null = null;
let renderFallbackTimer = 0;

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

  requestAnimationFrame(() => {
    refreshScrollTriggers();
  });
};

const scheduleRenderFlow = () => {
  if (shouldRender.value || renderFrame) return;

  const run = () => {
    renderFrame = null;
    window.clearTimeout(renderFallbackTimer);
    renderFallbackTimer = 0;
    renderFlow();
  };

  renderFrame = window.requestAnimationFrame(run);
  renderFallbackTimer = window.setTimeout(run, 120);
};

onMounted(() => {
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
  if (renderFrame) window.cancelAnimationFrame(renderFrame);
  window.clearTimeout(renderFallbackTimer);
  observer?.disconnect();
});
</script>

<template>
  <div ref="mountRef" cl