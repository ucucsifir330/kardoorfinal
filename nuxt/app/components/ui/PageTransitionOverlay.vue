<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import { useGSAP } from "~/composables/useGSAP";

const panelIndexes = Array.from({ length: 5 }, (_, index) => index);
const rootRef = ref<HTMLElement | null>(null);
const panelRefs = ref<HTMLElement[]>([]);
const { gsap } = useGSAP();

let activeTimeline: ReturnType<typeof gsap.timeline> | null = null;

const setPanelRef = (element: unknown, index: number) => {
  if (element instanceof HTMLElement) {
    panelRefs.value[index] = element;
  }
};

const prefersReducedMotion = () =>
  import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stopTimeline = () => {
  activeTimeline?.kill();
  activeTimeline = null;
};

const getPanels = () => panelRefs.value.filter(Boolean);

const cover = async () => {
  if (!import.meta.client) return;

  await nextTick();

  const root = rootRef.value;
  const panels = getPanels();
  if (!root || panels.length === 0) return;

  stopTimeline();
  gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });

  if (prefersReducedMotion()) {
    gsap.set(panels, { yPercent: 0 });
    return;
  }

  gsap.set(panels, {
    autoAlpha: 1,
    yPercent: (index) => (index % 2 === 0 ? -105 : 105),
    transformOrigin: (index) => (index % 2 === 0 ? "top center" : "bottom center")
  });

  await new Promise<void>((resolve) => {
    activeTimeline = gsap.timeline({
      defaults: { ease: "power4.inOut" },
      onComplete: () => {
        activeTimeline = null;
        resolve();
      }
    });

    activeTimeline.to(panels, {
      yPercent: 0,
      duration: 0.74,
      force3D: true,
      stagger: {
        each: 0.065,
        from: "start"
      }
    });
  });
};

const reveal = async () => {
  if (!import.meta.client) return;

  await nextTick();

  const root = rootRef.value;
  const panels = getPanels();
  if (!root || panels.length === 0) return;

  stopTimeline();

  if (prefersReducedMotion()) {
    gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
    return;
  }

  await new Promise<void>((resolve) => {
    activeTimeline = gsap.timeline({
      defaults: { ease: "power4.inOut" },
      onComplete: () => {
        activeTimeline = null;
        gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
        resolve();
      }
    });

    activeTimeline
      .to(panels, {
        yPercent: (index) => (index % 2 === 0 ? 105 : -105),
        duration: 0.82,
        force3D: true,
        stagger: {
          each: 0.06,
          from: "end"
        }
      })
      .set(panels, { clearProps: "transform,transformOrigin" });
  });
};

onBeforeUnmount(() => {
  stopTimeline();
});

defineExpose({
  cover,
  reveal
});
</script>

<template>
  <div
    ref="rootRef"
    class="page-transition-overlay"
    aria-hidden="true"
  >
    <span
      v-for="index in panelIndexes"
      :key="index"
      :ref="(element) => setPanelRef(element, index)"
      class="page-transition-overlay__panel"
    />
  </div>
</template>

<style scoped>
.page-transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  contain: layout paint style;
}

.page-transition-overlay__panel {
  min-width: 0;
  min-height: 100svh;
  background: #2C2C31;
  margin-inline-end: -1px;
  transform: translate3d(0, 0, 0);
  will-change: transform;
  backface-visibility: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .page-transition-overlay__panel {
    will-change: auto;
  }
}
</style>
