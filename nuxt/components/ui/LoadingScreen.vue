<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "#imports";

const visible = ref(false);

let resolveTimer: ReturnType<typeof setTimeout> | null = null;
let startedAt = 0;
const MIN_VISIBLE = 1400;

const startLoading = () => {
  if (resolveTimer) { clearTimeout(resolveTimer); resolveTimer = null; }
  startedAt = Date.now();
  visible.value = true;
};

const finishLoading = () => {
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, MIN_VISIBLE - elapsed);
  resolveTimer = setTimeout(() => {
    visible.value = false;
  }, remaining + 420);
};

const router = useRouter();
router.beforeEach(() => { startLoading(); });
router.afterEach(() => { finishLoading(); });

// SVG rect dimensions (viewBox units)
// W × H of the rect, stroke sits on the border
const W = 340;
const H = 110;
const S = 2;          // stroke-width
const PAD = S / 2;    // inset so stroke isn't clipped
const perimeter = 2 * (W + H);
// snake segment = 40% of perimeter
const segLen = Math.round(perimeter * 0.40);
</script>

<template>
  <Transition name="loading">
    <div v-if="visible" class="ls-overlay" aria-hidden="true">
      <div class="ls-wrap">

        <!-- snake border SVG — sits exactly over the logo box -->
        <svg
          class="ls-svg"
          :viewBox="`0 0 ${W + S} ${H + S}`"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- faint track -->
          <rect
            :x="PAD" :y="PAD" :width="W" :height="H"
            rx="2"
            stroke="rgba(0,100,200,0.18)"
            :stroke-width="S"
          />
          <!-- animated snake -->
          <rect
            class="ls-snake"
            :x="PAD" :y="PAD" :width="W" :height="H"
            rx="2"
            stroke="#0077ff"
            :stroke-width="S"
            :stroke-dasharray="`${segLen} ${perimeter - segLen}`"
            stroke-dashoffset="0"
            stroke-linecap="round"
          />
        </svg>

        <!-- logo -->
        <div class="ls-logo">
          <BrandMark />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ls-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg, #ffffff);
  pointer-events: none;
}

/* wrapper — logo lives here, SVG overlays it absolutely */
.ls-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* padding must match SVG rect padding so border hugs logo */
  padding: 28px 40px;
}

/* SVG stretches to cover the entire wrap box */
.ls-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* snake animation: dashoffset travels the full perimeter */
.ls-snake {
  animation: ls-snake 2s linear infinite;
}

@keyframes ls-snake {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -900; } /* −perimeter */
}

/* ── logo styling ── */
.ls-logo {
  display: inline-flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.ls-logo :deep(.brand-mark) {
  gap: 1.4rem;
}

.ls-logo :deep(.brand-symbol) {
  width: 80px;
  height: 98px;
}

.ls-logo :deep(.brand-symbol__left),
.ls-logo :deep(.brand-symbol__right) {
  width: 40px;
  height: 80px;
}

.ls-logo :deep(.brand-symbol__core) {
  left: 32px;
  width: 24px;
  height: 66px;
}

.ls-logo :deep(.brand-title) {
  font-size: 2.2rem;
  color: #071018;
}

.ls-logo :deep(.brand-title strong) {
  color: #3a83ff;
}

/* ── transitions ── */
.loading-enter-from   { opacity: 0; }
.loading-enter-active { transition: opacity 0.2s ease; }
.loading-leave-to     { opacity: 0; }
.loading-leave-active { transition: opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
</style>
