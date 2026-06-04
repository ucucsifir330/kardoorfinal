<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const visible = ref(false);
const leaving = ref(false);
const progress = ref(0);

let tickTimer = 0;
let dismissTimer = 0;

onMounted(() => {
  visible.value = true;
  leaving.value = false;
  progress.value = 0;

  const DURATION = 2800;
  const INTERVAL = 16;
  const steps = DURATION / INTERVAL;
  let current = 0;

  tickTimer = window.setInterval(() => {
    current++;
    const ratio = Math.min(1, current / steps);
    progress.value = Math.round(Math.pow(ratio, 1.35) * 100);

    if (ratio >= 1) {
      window.clearInterval(tickTimer);
      tickTimer = 0;
      progress.value = 100;
      dismiss();
    }
  }, INTERVAL);
});

const dismiss = () => {
  leaving.value = true;
  dismissTimer = window.setTimeout(() => {
    visible.value = false;
    dismissTimer = 0;
  }, 700);
};

onBeforeUnmount(() => {
  window.clearInterval(tickTimer);
  window.clearTimeout(dismissTimer);
});
</script>

<template>
  <Transition name="welcome">
    <div v-if="visible" class="welcome-screen" :class="{ 'is-leaving': leaving }" aria-hidden="true">
      <div class="welcome-screen__top-progress">
        <div
          class="welcome-screen__top-progress-bar"
          :style="{ transform: `scaleX(${progress / 100})` }"
        />
      </div>

      <div class="welcome-screen__brand">
        <BrandMark />
      </div>

      <span class="welcome-screen__progress-label">{{ progress }}%</span>
    </div>
  </Transition>
</template>

<style scoped>
.welcome-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.35rem;
  background: var(--bg, #f8f6ef);
  color: var(--text, #071018);
}

.welcome-screen__top-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  overflow: hidden;
  background: rgba(7, 16, 24, 0.10);
}

.welcome-screen__top-progress-bar {
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left center;
  background: var(--accent-blue, #006cff);
  box-shadow: 0 0 18px rgba(0, 108, 255, 0.34);
  transition: transform 60ms linear;
  will-change: transform;
}

.welcome-screen__brand {
  opacity: 0;
  transform: translateY(12px);
  animation: ws-fade-up 0.6s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) 0.15s forwards;
}

.welcome-screen__brand :deep(.brand-mark) {
  gap: 1.4rem;
}

.welcome-screen__brand :deep(.brand-symbol) {
  width: 80px;
  height: 98px;
}

.welcome-screen__brand :deep(.brand-symbol__left),
.welcome-screen__brand :deep(.brand-symbol__right) {
  width: 40px;
  height: 80px;
}

.welcome-screen__brand :deep(.brand-symbol__core) {
  left: 32px;
  width: 24px;
  height: 66px;
}

.welcome-screen__brand :deep(.brand-title) {
  font-size: 2rem;
}

.welcome-screen__brand :deep(.brand-title) {
  color: var(--text, #071018);
}

.welcome-screen__brand :deep(.brand-title strong) {
  color: #3a83ff;
}

.welcome-screen__progress-label {
  font-family: var(--font-body, Inter, system-ui, sans-serif);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.14em;
  color: var(--muted, rgba(7, 16, 24, 0.58));
  opacity: 0;
  transform: translateY(6px);
  animation: ws-fade-up 0.55s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) 0.32s forwards;
}

/* exit */
.welcome-screen.is-leaving {
  pointer-events: none;
}

.welcome-enter-from,
.welcome-leave-to {
  opacity: 0;
}

.welcome-leave-active {
  transition: opacity 0.7s var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1));
}

.welcome-enter-active {
  transition: none;
}

@keyframes ws-fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
