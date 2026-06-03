<script setup lang="ts">
import { onMounted, ref } from "vue";

const SESSION_KEY = "kardoor-welcomed";

const visible = ref(false);
const leaving = ref(false);
const progress = ref(0);

onMounted(() => {
  if (sessionStorage.getItem(SESSION_KEY)) return;

  visible.value = true;

  const DURATION = 2200;
  const INTERVAL = 16;
  const steps = DURATION / INTERVAL;
  let current = 0;

  const tick = setInterval(() => {
    current++;
    const ratio = Math.min(1, current / steps);
    progress.value = Math.round((1 - Math.pow(1 - ratio, 2.4)) * 100);

    if (ratio >= 1) {
      clearInterval(tick);
      progress.value = 100;
      dismiss();
    }
  }, INTERVAL);
});

const dismiss = () => {
  leaving.value = true;
  setTimeout(() => {
    visible.value = false;
    sessionStorage.setItem(SESSION_KEY, "1");
  }, 700);
};
</script>

<template>
  <Transition name="welcome">
    <div v-if="visible" class="welcome-screen" :class="{ 'is-leaving': leaving }" aria-hidden="true">
      <div class="welcome-screen__brand">
        <BrandMark />
      </div>

      <div class="welcome-screen__progress-wrap">
        <div class="welcome-screen__progress-track">
          <div class="welcome-screen__progress-bar" :style="{ width: progress + '%' }" />
        </div>
        <span class="welcome-screen__progress-label">{{ progress }}%</span>
      </div>
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
  gap: 3rem;
  background: var(--bg, #f8f6ef);
  color: var(--text, #071018);
}

.welcome-screen__brand {
  opacity: 0;
  transform: translateY(12px);
  animation: ws-fade-up 0.6s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) 0.15s forwards;
}

.welcome-screen__progress-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  opacity: 0;
  transform: translateY(8px);
  animation: ws-fade-up 0.6s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) 0.35s forwards;
}

.welcome-screen__progress-track {
  width: 200px;
  height: 2px;
  background: var(--line, rgba(7, 16, 24, 0.14));
  border-radius: 999px;
  overflow: hidden;
}

.welcome-screen__progress-bar {
  height: 100%;
  background: var(--accent-blue, #006cff);
  border-radius: 999px;
  transition: width 60ms linear;
}

.welcome-screen__progress-label {
  font-family: var(--font-body, Inter, system-ui, sans-serif);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.12em;
  color: var(--muted, rgba(7, 16, 24, 0.68));
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
