<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useGSAP } from "~/composables/useGSAP";
import { useStartupProgress } from "~/composables/useStartupProgress";

const emit = defineEmits<{
  complete: [];
}>();

const visible = ref(false);
const isExiting = ref(false);
const markRef = ref<HTMLElement | null>(null);
const wordmarkRef = ref<HTMLElement | null>(null);
const fillRef = ref<HTMLElement | null>(null);
const surfaceRef = ref<HTMLElement | null>(null);
const { gsap } = useGSAP();

let fallbackTimer = 0;
let exitTimer = 0;
let minimumHoldTimer = 0;
let removeVisibilityListener: (() => void) | null = null;
let loaderTimeline: ReturnType<typeof gsap.timeline> | null = null;
let fillTween: ReturnType<typeof gsap.to> | null = null;
let surfaceTween: ReturnType<typeof gsap.to> | null = null;
let completed = false;
let hasMinimumHoldPassed = false;

/**
 * Perde artık sabit süreyle değil, hero'nun gerçek yükleme işleriyle
 * sürülüyor (bkz. useStartupProgress). İki koruma bandı var:
 *
 *  • MINIMUM_HOLD — sıcak cache'te işler ~50ms'de biterse perde tek karede
 *    açılıp kapanır; o göz kırpması animasyondan rahatsız edici.
 *  • MAX_WAIT — bir iş hiç çözülmezse perde asılı kalmasın. Eski 9800ms
 *    fallback'in yerini alır ama artık istisna yolu, normal akış değil.
 */
const MINIMUM_HOLD_MS = 900;
const MAX_WAIT_MS = 8000;

const { progress, isComplete, hasTasks } = useStartupProgress();

/**
 * Hero'suz sayfalarda (alt sayfalar, lab) hiç görev kaydolmaz; isComplete
 * sonsuza dek false kalır ve perde 8 saniyelik MAX_WAIT'e asılırdı. Görev
 * listesi bu süre dolduğunda hâlâ boşsa "bekleyecek şey yok" say.
 *
 * Süre MINIMUM_HOLD'dan uzun ve BİLEREK 2500ms: ana sayfada görevler hero
 * mount olunca kaydolur (~1.5-2s, dev'de daha geç). Daha kısa bir değer,
 * görevler kaydolmadan perdeyi açıp yüklemeyi bekleme amacını boşa çıkarır.
 */
const NO_TASK_GRACE_MS = 2500;
let hasNoTaskGracePassed = false;
let noTaskGraceTimer = 0;

const prefersReducedMotion = () =>
  import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

onMounted(async () => {
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

  // Ağ takılırsa perde asılı kalmasın (istisna yolu).
  fallbackTimer = window.setTimeout(() => {
    startExit();
  }, MAX_WAIT_MS);

  minimumHoldTimer = window.setTimeout(() => {
    hasMinimumHoldPassed = true;
    maybeFinish();
  }, MINIMUM_HOLD_MS);

  noTaskGraceTimer = window.setTimeout(() => {
    hasNoTaskGracePassed = true;
    maybeFinish();
  }, NO_TASK_GRACE_MS);

  await nextTick();
  playLoader();
  maybeFinish();
});

/** Hem gerçek işler bitmiş hem de en kısa gösterim süresi dolmuşsa çık. */
const maybeFinish = () => {
  if (!hasMinimumHoldPassed) return;

  const nothingToWaitFor = !hasTasks.value && hasNoTaskGracePassed;
  if (!isComplete.value && !nothingToWaitFor) return;

  startExit();
};

watch([isComplete, progress], () => {
  syncFillToProgress();
  maybeFinish();
});

const clearTimers = () => {
  window.clearTimeout(fallbackTimer);
  window.clearTimeout(exitTimer);
  window.clearTimeout(minimumHoldTimer);
  window.clearTimeout(noTaskGraceTimer);
};

const stopLoaderTimeline = () => {
  loaderTimeline?.kill();
  loaderTimeline = null;
  fillTween?.kill();
  fillTween = null;
  surfaceTween?.kill();
  surfaceTween = null;
};

const complete = () => {
  if (completed) return;

  clearTimers();
  stopLoaderTimeline();
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

  const fill = fillRef.value;
  const surface = surfaceRef.value;
  const wordmark = wordmarkRef.value;

  stopLoaderTimeline();

  if (!fill || !surface || prefersReducedMotion()) {
    complete();
    return;
  }

  loaderTimeline = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: complete
  });

  if (wordmark) {
    loaderTimeline.to(
      wordmark,
      {
        clipPath: "inset(0% 50% 0% 50%)",
        autoAlpha: 0,
        duration: 1.08,
        overwrite: true
      },
      0
    );
  }

  loaderTimeline
    .to(
      fill,
      {
        clipPath: "inset(100% 0% 0% 0%)",
        duration: 1.38,
        overwrite: true
      },
      0.08
    )
    .to(
      surface,
      {
        yPercent: 120,
        duration: 1.38,
        overwrite: true
      },
      0.08
    );

  exitTimer = window.setTimeout(() => {
    complete();
  }, 1700);
};

const dismiss = () => {
  if (!visible.value || completed) return;
  startExit();
};

const playLoader = () => {
  const mark = markRef.value;
  const wordmark = wordmarkRef.value;
  const fill = fillRef.value;
  const surface = surfaceRef.value;

  if (!mark || !wordmark || !fill || !surface || completed) return;

  stopLoaderTimeline();

  gsap.set(fill, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(surface, { autoAlpha: 1, yPercent: 120 });
  gsap.set(wordmark, {
    autoAlpha: 0,
    clipPath: "inset(0% 50% 0% 50%)",
    y: 6
  });

  if (prefersReducedMotion()) {
    gsap.set(mark, { autoAlpha: 1, y: 0, scale: 1 });
    gsap.set(wordmark, {
      autoAlpha: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0
    });
    gsap.set(fill, { clipPath: "inset(0% 0% 0% 0%)" });
    gsap.set(surface, { yPercent: -248 });
    complete();
    return;
  }

  // Wordmark girişi sabit kalır (yüklemeden bağımsız marka anı). Dolum ise
  // artık zaman çizelgesinde DEĞİL — gerçek ilerlemeyi takip eder.
  loaderTimeline = gsap.timeline({ defaults: { ease: "power2.out" } });

  loaderTimeline.to(
    wordmark,
    {
      autoAlpha: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: 1.24,
      ease: "power3.inOut",
      overwrite: true
    },
    0.58
  );

  syncFillToProgress();
};

/**
 * Dolum seviyesini gerçek ilerlemeye taşır. Sayaç sıçramalı arttığı için
 * (3 görevde 0 → .33 → .66 → 1) doğrudan set etmek basamaklı görünürdü;
 * kısa bir tween aradaki geçişi yumuşatıyor.
 */
const syncFillToProgress = () => {
  const fill = fillRef.value;
  const surface = surfaceRef.value;
  if (!fill || !surface || isExiting.value || completed) return;
  if (prefersReducedMotion()) return;

  const value = Math.max(0, Math.min(1, progress.value));

  fillTween?.kill();
  fillTween = gsap.to(fill, {
    clipPath: `inset(${(1 - value) * 100}% 0% 0% 0%)`,
    duration: 0.6,
    ease: "power2.out",
    overwrite: "auto"
  });

  surfaceTween?.kill();
  surfaceTween = gsap.to(surface, {
    yPercent: 120 - value * 368, // 120 → -248 arasına eşlenir
    duration: 0.6,
    ease: "power2.out",
    overwrite: "auto"
  });
};

onBeforeUnmount(() => {
  clearTimers();
  stopLoaderTimeline();
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
      <div class="welcome-screen__lockup">
        <div
          ref="markRef"
          class="welcome-screen__mark"
        >
          <span
            ref="fillRef"
            class="welcome-screen__fill"
          />
          <span ref="surfaceRef" class="welcome-screen__surface" aria-hidden="true">
            <span class="welcome-screen__wave welcome-screen__wave--front" />
            <span class="welcome-screen__wave welcome-screen__wave--back" />
          </span>
        </div>
        <h3 ref="wordmarkRef" class="welcome-screen__wordmark">EGE KARDOOR</h3>
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
  --welcome-screen-bg: #080B18;
  background: var(--welcome-screen-bg);
  --welcome-loader-fill: #E6E7EB;
  pointer-events: none;
  transition:
    opacity 180ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1));
}

:global(.app-shell--day .welcome-screen) {
  --welcome-screen-bg: #16101F;
}

.welcome-screen__lockup {
  display: grid;
  justify-items: center;
  row-gap: clamp(18px, 2.2vw, 28px);
}

.welcome-screen__mark {
  position: relative;
  width: clamp(132px, 15vw, 248px);
  aspect-ratio: 0.485;
  opacity: 0;
  transform: translate3d(0, 8px, 0) scale(0.985);
  animation: k-loader-mark-in 920ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) 140ms forwards;
  mask: url("/images/brand/ege-logo.svg") center / contain no-repeat;
  -webkit-mask: url("/images/brand/ege-logo.svg") center / contain no-repeat;
  overflow: hidden;
  will-change: transform, opacity;
}

.welcome-screen__fill {
  position: absolute;
  inset: 0;
  display: block;
  background: var(--welcome-loader-fill);
  clip-path: inset(100% 0 0 0);
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
  will-change: transform;
}

.welcome-screen__wordmark {
  margin: 0;
  font-family: 'Science Gothic', var(--font-body);
  font-size: clamp(18px, 2.45vw, 38px);
  font-weight: 850;
  line-height: 0.92;
  letter-spacing: 0.02em;
  color: var(--welcome-loader-fill);
  text-transform: uppercase;
  opacity: 0;
  clip-path: inset(0 50% 0 50%);
  will-change: clip-path, transform, opacity;
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
  animation: k-loader-mark-out 1280ms var(--ease-soft, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
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
  .welcome-screen__wordmark,
  .welcome-screen__fill,
  .welcome-screen__surface,
  .welcome-screen__wave {
    will-change: auto;
  }

  .welcome-screen__mark {
    animation-duration: 1ms;
  }

  .welcome-screen__wave {
    animation: none;
  }
}
</style>
