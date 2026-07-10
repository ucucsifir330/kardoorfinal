<template>
  <div
    v-show="isEnabled"
    ref="cursorRef"
    class="smooth-cursor"
    popover="manual"
    :class="{
      'smooth-cursor--visible': isVisible,
      'smooth-cursor--active': isInteractive
    }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

type CursorPoint = {
  x: number;
  y: number;
};

const desktopPointerQuery = "(any-hover: hover) and (any-pointer: fine)";
const interactiveSelector = [
  "a[href]",
  "button",
  "summary",
  "label",
  "select",
  "textarea",
  "input",
  "[role='button']",
  "[role='link']",
  "[tabindex]:not([tabindex='-1'])",
  "[data-cursor='interactive']"
].join(",");

const cursorRef = ref<HTMLElement | null>(null);
const isEnabled = ref(false);
const isVisible = ref(false);
const isInteractive = ref(false);

const target: CursorPoint = { x: 0, y: 0 };
const current: CursorPoint = { x: 0, y: 0 };

let rafId = 0;
let mediaQuery: MediaQueryList | null = null;
let hasPosition = false;
let topLayerObserver: MutationObserver | null = null;

// <dialog>'un showModal() ile girdiği native "top layer" hiçbir z-index'le
// aşılamaz; imleç de aynı top layer'a Popover API üzerinden girip, her yeni
// dialog açıldığında en öne (yeniden gösterilerek) bindirilir. Aksi halde
// filtre paneli gibi modal'lar açıkken imleç tamamen kayboluyordu.
const bumpAboveTopLayer = () => {
  const el = cursorRef.value as
    | (HTMLElement & { showPopover?: () => void; hidePopover?: () => void })
    | null;
  if (!el?.showPopover) return;

  try {
    el.hidePopover?.();
  } catch {
    // zaten kapalıydı
  }
  try {
    el.showPopover();
  } catch {
    // desteklenmiyor ya da zaten açık
  }
};

const isTrackablePointer = (pointerType: string) => pointerType !== "touch";

const getInteractiveElement = (element: Element | null) => {
  const targetElement = element?.closest(interactiveSelector);

  if (!(targetElement instanceof HTMLElement)) return null;
  if (targetElement.hasAttribute("disabled")) return null;
  if (targetElement.getAttribute("aria-disabled") === "true") return null;

  return targetElement;
};

const updateInteractiveState = (event: PointerEvent) => {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  isInteractive.value = Boolean(getInteractiveElement(element));
};

const render = () => {
  const ease = isInteractive.value ? 0.32 : 0.24;

  current.x += (target.x - current.x) * ease;
  current.y += (target.y - current.y) * ease;

  if (cursorRef.value) {
    cursorRef.value.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
  }

  rafId = window.requestAnimationFrame(render);
};

const onPointerMove = (event: PointerEvent) => {
  if (!isTrackablePointer(event.pointerType)) return;

  target.x = event.clientX;
  target.y = event.clientY;

  if (!hasPosition) {
    current.x = target.x;
    current.y = target.y;
    hasPosition = true;
  }

  isVisible.value = true;
  updateInteractiveState(event);
};

const onPointerLeave = () => {
  isVisible.value = false;
  isInteractive.value = false;
};

const enableCursor = () => {
  if (isEnabled.value) return;

  isEnabled.value = true;
  document.documentElement.classList.add("smooth-cursor-active");
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  rafId = window.requestAnimationFrame(render);
};

const disableCursor = () => {
  if (!isEnabled.value) return;

  isEnabled.value = false;
  isVisible.value = false;
  isInteractive.value = false;
  hasPosition = false;
  document.documentElement.classList.remove("smooth-cursor-active");
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerleave", onPointerLeave);

  if (rafId) window.cancelAnimationFrame(rafId);
  rafId = 0;
};

const updateEnabled = () => {
  if (mediaQuery?.matches) {
    enableCursor();
  } else {
    disableCursor();
  }
};

onMounted(() => {
  mediaQuery = window.matchMedia(desktopPointerQuery);
  updateEnabled();
  mediaQuery.addEventListener("change", updateEnabled);

  bumpAboveTopLayer();
  topLayerObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.target instanceof HTMLDialogElement && mutation.target.open) {
        bumpAboveTopLayer();
        return;
      }
    }
  });
  topLayerObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["open"],
    subtree: true
  });
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", updateEnabled);
  topLayerObserver?.disconnect();
  disableCursor();
});
</script>

<style scoped>
.smooth-cursor {
  position: fixed;
  inset: auto;
  top: 0;
  left: 0;
  z-index: 10000;
  width: 18px;
  height: 18px;
  margin: 0;
  border: 0;
  padding: 0;
  border-radius: 999px;
  pointer-events: none;
  background: #fff;
  mix-blend-mode: difference;
  opacity: 0;
  transform: translate3d(-100px, -100px, 0) translate(-50%, -50%);
  transition:
    width 220ms cubic-bezier(0.22, 1, 0.36, 1),
    height 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 160ms ease;
  will-change: transform, width, height;
}

.smooth-cursor--visible {
  opacity: 1;
}

.smooth-cursor--active {
  width: 46px;
  height: 46px;
}

:global(html.smooth-cursor-active),
:global(html.smooth-cursor-active *) {
  cursor: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .smooth-cursor {
    display: none;
  }
}
</style>
