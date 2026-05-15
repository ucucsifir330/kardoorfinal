<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const shouldRender = ref(false);
const mountRef = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;
let renderTimer: number | null = null;
let idleRenderId: number | null = null;

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
          "post-entrance-flow-visible",
          entries.some((entry) => entry.isIntersecting)
        );
      },
      { threshold: 0.08 }
    );
    visibilityObserver.observe(section);
  });
};

const scheduleRenderFlow = () => {
  if (shouldRender.value || renderTimer || idleRenderId) return;

  const win = window as typeof window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  const run = () => {
    renderTimer = null;
    idleRenderId = null;
    renderFlow();
  };

  if (win.requestIdleCallback) {
    idleRenderId = win.requestIdleCallback(run, { timeout: 1800 });
    return;
  }

  renderTimer = window.setTimeout(run, 900);
};

const handleDoorState = (event: Event) => {
  const detail = (event as CustomEvent<{ isOpen?: boolean }>).detail;
  if (detail?.isOpen) scheduleRenderFlow();
};

onMounted(() => {
  window.addEventListener("kardoor:entrance-door-state", handleDoorState);

  if (mountRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) renderFlow();
      },
      { rootMargin: "900px 0px", threshold: 0.01 }
    );
    observer.observe(mountRef.value);
  }
});

onBeforeUnmount(() => {
  const win = window as typeof window & { cancelIdleCallback?: (id: number) => void };

  window.removeEventListener("kardoor:entrance-door-state", handleDoorState);
  if (renderTimer) window.clearTimeout(renderTimer);
  if (idleRenderId && win.cancelIdleCallback) win.cancelIdleCallback(idleRenderId);
  observer?.disconnect();
  visibilityObserver?.disconnect();
  document.body.classList.remove("post-entrance-flow-visible");
});
</script>

<template>
  <div ref="mountRef" class="post-entrance-deferred">
    <ClientOnly>
      <LazyPostEntrancePenFlow v-if="shouldRender" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.post-entrance-deferred {
  min-height: 1px;
}
</style>
