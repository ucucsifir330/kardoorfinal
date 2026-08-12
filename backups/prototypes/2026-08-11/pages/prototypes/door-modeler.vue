<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import DoorModelerAssembly from "~/components/prototypes/door-modeler/DoorModelerAssembly.vue";
import DoorModelerCinema from "~/components/prototypes/door-modeler/DoorModelerCinema.vue";
import DoorModelerDraft from "~/components/prototypes/door-modeler/DoorModelerDraft.vue";
import DoorModelerEditor from "~/components/prototypes/door-modeler/DoorModelerEditor.vue";

definePageMeta({ pageTransition: false });

useSeoMeta({
  title: "Door Modeler Prototype",
  robots: "noindex, nofollow"
});

useHead({
  bodyAttrs: { class: "door-modeler-active" }
});

const variants = [
  { name: "Cinema", component: DoorModelerCinema },
  { name: "Draft", component: DoorModelerDraft },
  { name: "Assembly", component: DoorModelerAssembly },
  { name: "Editor", component: DoorModelerEditor }
] as const;

const current = ref(0);
const replayKey = ref(0);
const picker = ref<HTMLElement | null>(null);
const highlight = ref<HTMLElement | null>(null);
const items = ref<HTMLButtonElement[]>([]);
const pickerReady = ref(false);
const currentComponent = computed(() => variants[current.value]!.component);

const setItemRef = (element: Element | null, index: number) => {
  if (element instanceof HTMLButtonElement) items.value[index] = element;
};

const moveHighlight = () => {
  const element = items.value[current.value];
  if (!element || !highlight.value) return;
  highlight.value.style.width = `${element.offsetWidth}px`;
  highlight.value.style.transform = `translateX(${element.offsetLeft}px)`;
};

const setActive = async (index: number) => {
  if (index < 0 || index >= variants.length) return;
  current.value = index;
  replayKey.value += 1;
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(index + 1));
  history.replaceState(null, "", url);
  await nextTick();
  moveHighlight();
};

const replay = () => {
  replayKey.value += 1;
};

const onKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const number = Number.parseInt(event.key, 10);
  if (number >= 1 && number <= variants.length) void setActive(number - 1);
  else if (event.key === "ArrowRight") void setActive((current.value + 1) % variants.length);
  else if (event.key === "ArrowLeft") void setActive((current.value - 1 + variants.length) % variants.length);
  else if (event.key === "r" || event.key === "R") replay();
};

onMounted(async () => {
  const requested = Number.parseInt(new URLSearchParams(window.location.search).get("v") ?? "1", 10) - 1;
  await setActive(Number.isInteger(requested) && requested >= 0 && requested < variants.length ? requested : 0);
  window.addEventListener("resize", moveHighlight);
  document.addEventListener("keydown", onKeydown);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    pickerReady.value = true;
  }));
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", moveHighlight);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div class="door-modeler-page">
    <component :is="currentComponent" :key="replayKey" />

    <nav ref="picker" class="proto-picker" :data-ready="pickerReady ? '' : undefined" aria-label="Prototype variants">
      <span ref="highlight" class="proto-picker-highlight" aria-hidden="true" />
      <button
        v-for="(variant, index) in variants"
        :key="variant.name"
        :ref="(element) => setItemRef(element as Element | null, index)"
        class="proto-picker-item"
        :data-active="current === index ? '' : undefined"
        :aria-current="current === index ? 'true' : undefined"
        type="button"
        @click="setActive(index)"
      >
        {{ variant.name }}
      </button>
      <span class="proto-picker-divider" aria-hidden="true" />
      <button class="proto-picker-item proto-picker-replay" type="button" aria-label="Replay animation (R)" @click="replay">↻</button>
    </nav>
  </div>
</template>

<style scoped>
.door-modeler-page {
  --bg: var(--bg-main);
  --panel: var(--bg-navy);
  --panel-soft: var(--card-bg);
  --line: color-mix(in srgb, var(--text-main) 14%, transparent);
  --line-strong: color-mix(in srgb, var(--text-main) 28%, transparent);
  --text: var(--text-main);
  --muted: var(--text-soft);
  --soft: var(--text-faint);
  --accent-fg: var(--brand-300);
  --accent-fill: var(--brand-500);
  --accent-on: var(--bg-deepest);
  min-height: 100svh;
  background: var(--bg-deepest);
}

:global(body.door-modeler-active .site-header),
:global(body.door-modeler-active .footer-wrapper) {
  display: none !important;
}

:global(body.door-modeler-active #smooth-content > main) {
  min-height: 100svh;
}

:global(body.door-modeler-active),
:global(body.door-modeler-active .app-shell),
:global(body.door-modeler-active #smooth-wrapper),
:global(body.door-modeler-active #smooth-content),
:global(body.door-modeler-active #smooth-content > main) {
  background: var(--bg-deepest) !important;
}

.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  will-change: transform;
}

.proto-picker[data-ready] .proto-picker-highlight {
  transition:
    transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
    width 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
}

.proto-picker-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font: inherit;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.proto-picker-item:hover {
  color: rgba(255, 255, 255, 0.85);
}

.proto-picker-item:active {
  transform: scale(0.97);
}

.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 2px;
}

.proto-picker-item[data-active] {
  color: #fff;
}

.proto-picker-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.12);
}

.proto-picker-replay {
  padding: 0 10px;
  font-size: 14px;
}

.proto-picker[data-position="top"] {
  bottom: auto;
  top: 24px;
}
</style>
