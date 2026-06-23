<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const emit = defineEmits<{
  complete: [];
}>();

const visible = ref(false);
const isExiting = ref(false);

let fallbackTimer = 0;
let holdTimer = 0;
let exitTimer = 0;
let removeVisibilityListener: (() => void) | null = null;
let completed = false;
let fillComplete = false;

onMounted(() => {
  if (document.visibilityState === "hidden") return;

  visible.value = true;

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      dismiss();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  removeVisibilityListener = () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  fallbackTimer = window.setTimeout(() => {
    startExit();
  }, 7600);
});

const clearTimers = () => {
  window.clearTimeout(fallbackTimer);
  window.clearTimeout(holdTimer);
  window.clearTimeout(exitTimer);
};

const complete = () => {
  if (completed) return;

  clearTimers();
  completed = true;

  if (document.visibilityState === "hidden") {
    visible.value = false;
    return;
  }

  emit("complete");
};

const startExit = () => {
  if (!visible.value || completed || isExiting.value) return;

  clearTimers();
  isExiting.value = true;

  exitTimer = window.setTimeout(() => {
    complete();
  }, 1200);
};

const dismiss = () => {
  if (!visible.value || completed) return;

  if (!fillComplete) {
    startExit();
    return;
  }

  holdTimer = window.setTimeout(() => {
    startExit();
  }, 1000);
};

const handleFillAnimationEnd = () => {
  if (isExiting.value) {
    complete();
    return;
  }

  fillComplete = true;
  dismiss();
};

onBeforeUnmount(() => {
  clearTimers();
  removeVisibilityListener?.();
  removeVisibilityListener = null;
});
</script>

<template>
  <Transition name="welcome">
    <div
      v-if="visible"
      class="welcome-screen"
      :class="{ 'is-exiting': isExiting }"
      aria-hidden="true"
    >
      <div
        class="welcome-screen__mark"
      >
        <span
          class="welcome-screen__fill"
          @animationend="handleFillAnimationEnd"
        />
        <span class="welcome-screen__surface" aria-hidden="true">
          <span class="welcome-screen__wave welcome-screen__wave--front" />
          <span class="welcome-screen__wave welcome-screen__wave--back" />
        </span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.welcome-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #2C2C31;
  --welcome-loader-fill: #E6E7EB;
  pointer-events: none;
  transition:
    opacity 180ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1)),
    transform 180ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1));
}

.welcome-screen__mark {
  position: relative;
  width: clamp(132px, 15vw, 248px);
  aspect-ratio: 0.485;
  opacity: 0;
  transform: translate3d(0, 8px, 0) scale(0.985);
  animation: k-loader-mark-in 700ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) 100ms forwards;
  mask: url("/images/brand/kardoor-footer-mark-tight.png") center / contain no-repeat;
  -webkit-mask: url("/images/brand/kardoor-footer-mark-tight.png") center / contain no-repeat;
  overflow: hidden;
  will-change: transform, opacity;
}

.welcome-screen__fill {
  position: absolute;
  inset: 0;
  display: block;
  background: var(--welcome-loader-fill);
  clip-path: inset(100% 0 0 0);
  animation: k-loader-fill 3900ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1)) 360ms forwards;
  will-change: clip-path;
}

.welcome-screen__surface {
  position: absolute;
  left: -56%;
  right: -56%;
  top: 104%;
  display: block;
  height: 44%;
  background: var(--welcome-loader-fill);
  animation: k-loader-surface 3900ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1)) 360ms forwards;
  will-change: transform;
}

.welcome-screen__wave {
  position: absolute;
  left: 50%;
  bottom: calc(100% - 2px);
  display: block;
  width: 86%;
  aspect-ratio: 1;
  background: var(--welcome-loader-fill);
  border-radius: 43% 47% 42% 48%;
  transform: translate3d(-50%, 50%, 0);
  opacity: 0.92;
  will-change: transform;
}

.welcome-screen__wave--front {
  animation: k-loader-wave-front 1600ms linear infinite;
}

.welcome-screen__wave--back {
  width: 78%;
  opacity: 0.58;
  border-radius: 48% 42% 49% 43%;
  animation: k-loader-wave-back 2100ms linear infinite reverse;
}

.welcome-enter-from,
.welcome-leave-to {
  opacity: 0;
}

.welcome-screen.is-exiting .welcome-screen__mark {
  animation: k-loader-mark-out 960ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
}

.welcome-screen.is-exiting .welcome-screen__fill {
  animation: k-loader-empty 960ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
}

.welcome-screen.is-exiting .welcome-screen__surface {
  animation: k-loader-surface-out 960ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
}

@keyframes k-loader-mark-in {
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes k-loader-mark-out {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }

  to {
    opacity: 0.72;
    transform: translate3d(0, -6px, 0) scale(0.992);
  }
}

@keyframes k-loader-fill {
  0% {
    clip-path: inset(100% 0 0 0);
  }

  86% {
    clip-path: inset(0 0 0 0);
  }

  100% {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes k-loader-empty {
  from {
    clip-path: inset(0 0 0 0);
  }

  to {
    clip-path: inset(100% 0 0 0);
  }
}

@keyframes k-loader-surface {
  0% {
    transform: translate3d(0, 0, 0);
  }

  86% {
    transform: translate3d(0, -238%, 0);
  }

  100% {
    transform: translate3d(0, -248%, 0);
  }
}

@keyframes k-loader-surface-out {
  from {
    transform: translate3d(0, -248%, 0);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes k-loader-wave-front {
  100% {
    transform: translate3d(-50%, 50%, 0) rotate(360deg);
  }
}

@keyframes k-loader-wave-back {
  100% {
    transform: translate3d(-50%, 50%, 0) rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-screen__mark,
  .welcome-screen__fill,
  .welcome-screen__surface,
  .welcome-screen__wave {
    will-change: auto;
  }

  .welcome-screen__mark {
    animation-duration: 1ms;
  }

  .welcome-screen__fill,
  .welcome-screen__surface {
    animation-duration: 1200ms;
    animation-delay: 80ms;
  }

  .welcome-screen__wave {
    animation: none;
  }
}
</style>
