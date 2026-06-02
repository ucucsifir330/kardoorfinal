<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const shouldRender = ref(true);
const mountRef = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
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

  requestAnimationFrame(() => {
    refreshScrollTriggers();
  });
};

const scheduleRenderFlow = () => {
  if (shouldRender.value || renderFrame) return;

  const run = () => {
    renderFrame = null;
    renderFlow();
  };

  renderFrame = window.requestAnimationFrame(run);
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
  observer?.disconnect();
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
