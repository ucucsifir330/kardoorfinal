<script setup lang="ts">
/**
 * Catalog product quick-view modal.
 *
 * Teleported to <body>: the page lives inside ScrollSmoother's transformed
 * `#smooth-content`, where `position: fixed` does not anchor to the viewport.
 * Desktop opens with a GSAP timeline, mobile with a Motion spring.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useNuxtApp } from "#imports";
import { motion, AnimatePresence } from "motion-v";
import { gsap } from "gsap";

const props = withDefaults(defineProps<{
  product: Record<string, any> | null;
  copy: Record<string, any>;
  series: string;
  collection: string;
  system: string;
  /** Previous/next product images, prefetched while the modal is open. */
  neighbourImages?: string[];
  /** Hidden on the catalog page, where the series link points at itself. */
  showSeriesLink?: boolean;
}>(), {
  showSeriesLink: true
});

/** Single-column breakpoint. Must stay in sync with the media query below. */
const MOBILE_BREAKPOINT = 860;

const isMobile = ref(false);

const syncDevice = () => {
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT;
};

if (import.meta.client) {
  syncDevice();
  window.addEventListener("resize", syncDevice, { passive: true });
}

/**
 * Desktop animates with GSAP, mobile with Motion: the horizontal scaleX open
 * looks cramped on a single-column layout. Motion props are dropped in GSAP
 * mode — two systems cannot own the same property.
 */
const gsapMode = computed(() => !isMobile.value);

const emit = defineEmits<{
  close: [];
  prev: [];
  next: [];
}>();

const isOpen = computed(() => props.product !== null);

/**
 * Same ImageKit width and quality as the catalog card, so the modal reuses the
 * already-cached file instead of requesting a new URL. No srcset: the image is
 * `object-fit: contain` in a ~294px slot, so a 2x branch only inflates bytes.
 */
const MODAL_IMAGE_WIDTH = 440;

const imageUrl = (url?: string) => {
  if (!url) return "";
  if (!url.includes("ik.imagekit.io")) return url;
  return `${url.split("?")[0]}?tr=w-${MODAL_IMAGE_WIDTH},q-82`;
};

const modalImage = computed(() => imageUrl(props.product?.image as string | undefined));

/**
 * Warm the neighbour images so arrow-key navigation renders instantly instead
 * of waiting on the network. Best effort: skipped when the prop is empty.
 */
const preloaded = new Set<string>();

const preload = (url?: string) => {
  const src = imageUrl(url);
  if (!src || preloaded.has(src)) return;
  preloaded.add(src);
  const img = new Image();
  img.decoding = "async";
  img.src = src;
};

/* --- Motion (mobile) ------------------------------------------------------ */

const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }
};

/** Scales up from the center. Low bounce on purpose: a door is a heavy object. */
const MOBILE_ENTER = {
  initial: { scale: 0.94, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.97, opacity: 0 },
  transition: { type: "spring" as const, visualDuration: 0.4, bounce: 0.14 }
} as const;

const panelMotion = computed(() => (gsapMode.value ? {} : MOBILE_ENTER));

/** Staggered entrance for the info column: kicker → code → copy → actions. */
const contentGroup = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.14, staggerChildren: 0.07 }
  }
};

const contentItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, visualDuration: 0.42, bounce: 0.1 }
  }
};

/* --- GSAP (desktop) ------------------------------------------------------- */

const backdropRef = ref<any>(null);
const panelRef = ref<any>(null);
let gsapTl: gsap.core.Timeline | null = null;

const prefersReducedMotion = () =>
  import.meta.client &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Elements driven by the open and product-change timelines. */
const gsapTargets = () => {
  const panel = panelRef.value?.$el ?? panelRef.value;
  if (!panel) return null;
  return {
    backdrop: backdropRef.value?.$el ?? backdropRef.value,
    panel,
    visual: panel.querySelector(".kmodal__visual"),
    texts: [
      panel.querySelector(".kmodal__kicker"),
      panel.querySelector(".kmodal__code"),
      panel.querySelector(".kmodal__meta"),
      panel.querySelector(".kmodal__desc"),
      panel.querySelector(".kmodal__details"),
      panel.querySelector(".kmodal__actions")
    ].filter(Boolean)
  };
};

/**
 * Open sequence: the panel widens, the image comes out of depth, the text
 * follows. The negative positions ("-=0.7") overlap the steps — Motion's
 * staggerChildren can only queue them back to back.
 */
const gsapOpen = () => {
  const targets = gsapTargets();
  if (!targets) return;

  gsapTl?.kill();

  if (prefersReducedMotion()) {
    gsap.set([targets.backdrop, targets.panel, targets.visual, ...targets.texts],
      { opacity: 1, clearProps: "transform" });
    return;
  }

  gsapTl = gsap.timeline();
  gsapTl
    .fromTo(targets.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.inOut" })
    .fromTo(targets.panel, { scaleX: 0.82, scaleY: 0.94, opacity: 0 },
      { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.78, ease: "power4.out" }, "-=0.2")
    .fromTo(targets.visual, { scale: 1.2, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.94, ease: "power4.out" }, "-=0.7")
    .fromTo(targets.texts, { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.54, ease: "power3.out", stagger: 0.06 }, "-=0.62");
};

/** Set while the exit tween runs, so a double click cannot stack two exits. */
const isClosing = ref(false);

/**
 * AnimatePresence does not drive the GSAP path, so unmounting is delayed by
 * hand: play the exit tween first, emit `close` on complete.
 */
const closeModal = () => {
  if (!gsapMode.value) {
    emit("close");
    return;
  }
  if (isClosing.value) return;

  const targets = gsapTargets();
  if (!targets || prefersReducedMotion()) {
    emit("close");
    return;
  }

  isClosing.value = true;
  gsapTl?.kill();
  gsapTl = gsap.timeline({
    onComplete: () => {
      isClosing.value = false;
      emit("close");
    }
  });

  gsapTl
    .to(targets.panel, { y: 26, opacity: 0, duration: 0.26, ease: "power2.in" })
    .to(targets.backdrop, { opacity: 0, duration: 0.2, ease: "power1.in" }, "-=0.16");
};

/* --- Product change ------------------------------------------------------- */

/** 1 = next, -1 = previous. The image slides in from that side. */
const slideDirection = ref<1 | -1>(1);
let slideTl: gsap.core.Timeline | null = null;

const animateProductChange = () => {
  const targets = gsapTargets();
  if (!targets || prefersReducedMotion()) return;

  slideTl?.kill();
  const x = 34 * slideDirection.value;

  slideTl = gsap.timeline();
  slideTl
    .fromTo(targets.visual, { x, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.44, ease: "power3.out" })
    .fromTo(targets.texts, { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.36, ease: "power2.out", stagger: 0.04 }, "-=0.32");
};

const goPrev = () => {
  slideDirection.value = -1;
  emit("prev");
};

const goNext = () => {
  slideDirection.value = 1;
  emit("next");
};

/* --- Focus trap ----------------------------------------------------------- */

/** The element that opened the modal; focus returns here on close. */
let previousFocus: HTMLElement | null = null;

const focusables = (): HTMLElement[] => {
  const root: HTMLElement | null = backdropRef.value?.$el ?? backdropRef.value;
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((el) => el.offsetParent !== null);
};

/** Wraps Tab / Shift+Tab so focus cannot escape to the page behind. */
const trapFocus = (event: KeyboardEvent) => {
  const items = focusables();
  if (items.length === 0) return;

  const first = items[0]!;
  const last = items[items.length - 1]!;
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

/* --- Background lock ------------------------------------------------------ */

const { $smoother } = useNuxtApp();

const getSmoother = () => ($smoother as undefined | (() => any))?.() ?? null;

/**
 * Overflow alone does not hold: on desktop the page scrolls through
 * ScrollSmoother's transform, so the smoother is paused too. The lock must sit
 * on <html> — the scroll container is the root element, not the body.
 * `getSmoother()` returns null on touch devices, where scrolling is native.
 */
const lockBackground = (locked: boolean) => {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  document.body.style.overflow = locked ? "hidden" : "";
  getSmoother()?.paused(locked);
};

/* --- Lifecycle ------------------------------------------------------------ */

const onKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return;
  if (event.key === "Escape") closeModal();
  if (event.key === "ArrowLeft") goPrev();
  if (event.key === "ArrowRight") goNext();
  if (event.key === "Tab") trapFocus(event);
};

watch(isOpen, async (opened) => {
  if (!import.meta.client) return;

  if (opened) {
    previousFocus = document.activeElement as HTMLElement | null;
    lockBackground(true);
    window.addEventListener("keydown", onKeydown);
    await nextTick();
    requestAnimationFrame(() => {
      if (gsapMode.value) gsapOpen();
      // One more frame before focusing: the panel is not painted yet, so
      // offsetParent is null and focusables() would come back empty.
      requestAnimationFrame(() => focusables()[0]?.focus());
    });
  } else {
    lockBackground(false);
    window.removeEventListener("keydown", onKeydown);
    previousFocus?.focus();
    previousFocus = null;
  }
});

/** Product swapped while open — the open timeline already covers first paint. */
watch(() => props.product?.code, (newCode, oldCode) => {
  if (!import.meta.client || !isOpen.value) return;
  if (!newCode || !oldCode || newCode === oldCode) return;
  requestAnimationFrame(animateProductChange);
});

watch(
  () => [isOpen.value, props.neighbourImages] as const,
  ([opened]) => {
    if (!import.meta.client || !opened) return;
    for (const url of props.neighbourImages ?? []) preload(url);
  },
  { immediate: true, deep: true }
);

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  gsapTl?.kill();
  slideTl?.kill();
  window.removeEventListener("resize", syncDevice);
  // Leaving the page while open must not strand the smoother in a paused state.
  lockBackground(false);
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="product"
        ref="backdropRef"
        class="kmodal"
        :class="{ 'is-gsap': gsapMode }"
        role="dialog"
        aria-modal="true"
        :aria-label="`${product.code} ${copy.modal.productDetail}`"
        v-bind="gsapMode ? {} : backdropMotion"
        @click.self="closeModal"
      >
        <button class="kmodal__close" :aria-label="copy.modal.close" @click="closeModal">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <button class="kmodal__nav kmodal__nav--prev" :aria-label="copy.modal.previous" @click="goPrev">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15,5 8,12 15,19" /></svg>
        </button>

        <button class="kmodal__nav kmodal__nav--next" :aria-label="copy.modal.next" @click="goNext">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9,5 16,12 9,19" /></svg>
        </button>

        <motion.section ref="panelRef" class="kmodal__panel" v-bind="panelMotion">
          <div class="kmodal__visual">
            <img
              :src="modalImage"
              :alt="product.finish"
              class="kmodal__image"
              decoding="async"
            >
          </div>

          <motion.div
            class="kmodal__content"
            v-bind="gsapMode ? {} : { variants: contentGroup, initial: 'hidden', animate: 'visible' }"
          >
            <motion.p class="kmodal__kicker" v-bind="gsapMode ? {} : { variants: contentItem }">
              {{ series || copy.modal.seriesFallback }}
            </motion.p>

            <motion.h2 class="kmodal__code" v-bind="gsapMode ? {} : { variants: contentItem }">
              {{ product.code }}
            </motion.h2>

            <motion.p class="kmodal__meta" v-bind="gsapMode ? {} : { variants: contentItem }">
              {{ collection || copy.modal.collectionFallback }}
              <span aria-hidden="true">·</span>
              {{ product.finish }}
            </motion.p>

            <motion.p class="kmodal__desc" v-bind="gsapMode ? {} : { variants: contentItem }">
              {{ product.description || copy.modal.description }}
            </motion.p>

            <!-- Spec block sits above the CTA: decision info first, action second. -->
            <motion.div class="kmodal__details" v-bind="gsapMode ? {} : { variants: contentItem }">
              <div class="kmodal__block">
                <h3>{{ copy.modal.infoTitle }}</h3>
                <dl>
                  <div>
                    <dt>{{ copy.modal.fields.system }}</dt>
                    <dd>{{ system || copy.modal.systemFallback }}</dd>
                  </div>
                  <div>
                    <dt>{{ copy.modal.fields.usage }}</dt>
                    <dd>{{ copy.modal.usage }}</dd>
                  </div>
                </dl>
              </div>

              <div class="kmodal__block">
                <h3>{{ copy.modal.filesTitle }}</h3>
                <!-- No file URLs yet. Disabled buttons rather than href="#",
                     which jumps to the top and lies to screen readers.
                     Becomes <a :href download> once the files exist. -->
                <div class="kmodal__files">
                  <button type="button" disabled>{{ copy.modal.files.specSheet }}</button>
                  <button type="button" disabled>{{ copy.modal.files.drawing }}</button>
                </div>
              </div>
            </motion.div>

            <motion.div class="kmodal__actions" v-bind="gsapMode ? {} : { variants: contentItem }">
              <NuxtLink class="kmodal__cta" to="/contact">{{ copy.modal.quote }}</NuxtLink>
              <NuxtLink v-if="showSeriesLink" class="kmodal__link" to="/catalog">
                {{ copy.actions.viewSeries }}
              </NuxtLink>
            </motion.div>
          </motion.div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>

<style scoped>
/* Hidden on the first frame; the GSAP timeline fades it in. Without this the
   modal flashes fully visible for one frame. */
.kmodal.is-gsap {
  opacity: 0;
}

.kmodal {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 3vw, 48px);
  background: var(--catalog-product-modal-backdrop, rgba(20, 21, 29, 0.48));
  backdrop-filter: blur(18px);
}

/* --- Panel: image left, info right --------------------------------------- */
.kmodal__panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(32px, 4vw, 64px);
  width: min(100%, 1180px);
  /* Height is capped by the viewport, never by a fixed min-height. */
  max-height: min(86vh, 780px);
  /* Explicit row: the default `auto` row grows with its content and would
     push straight through max-height. */
  grid-template-rows: minmax(0, 1fr);
  padding: clamp(32px, 3.4vw, 56px);
  border-radius: 4px 4px clamp(28px, 2.6vw, 42px);
  background: var(--modal-surface);
  box-shadow: 0 42px 130px rgba(0, 0, 0, 0.16);

}

/* --- Left column: image --------------------------------------------------- */
.kmodal__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Grid children default to `min-height: auto` and refuse to shrink below
     their content, breaking the panel's height cap. */
  min-height: 0;
  padding: clamp(16px, 2vw, 32px);
  border-radius: 2px 2px clamp(24px, 2.2vw, 34px);
  background: var(--modal-raised);
}

.kmodal__image {
  display: block;
  width: auto;
  max-width: 92%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 28px 38px rgba(0, 0, 0, 0.18));
}

/* --- Right column: info --------------------------------------------------- */
.kmodal__content {
  display: flex;
  flex-direction: column;
  /* `safe center` centers while it fits but falls back to top alignment on
     overflow; plain `center` splits the overflow and hides the top edge. */
  justify-content: safe center;
  min-height: 0;
  overflow-y: auto;
  /* No `scrollbar-width` / `scrollbar-color` here: once Chrome sees either,
     it drops the ::-webkit-scrollbar rules entirely. Firefox is handled in
     the global block at the end of this file. */
  /* Keeps the bar off the text; `scrollbar-gutter` would reserve the space
     even when no bar is shown. */
  padding-right: 14px;
  margin-right: -14px;
}

.kmodal__kicker {
  margin: 0 0 clamp(6px, 1vmin, 10px);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--modal-fg-muted);
}

.kmodal__code {
  margin: 0;
  font-family: "PP Telegraf", "General Sans", Inter, system-ui, sans-serif;
  /* vmin, not vw: on short-and-wide laptops a width-only scale overflows the
     column. vmin lets the heading shrink when height is the constraint. */
  font-size: clamp(40px, 5.6vmin, 76px);
  font-weight: 500;
  line-height: 0.94;
  letter-spacing: -0.02em;
  color: var(--modal-fg);
}

.kmodal__meta {
  margin: clamp(10px, 1.6vmin, 16px) 0 0;
  font-size: 12px;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--modal-fg-muted);
}

.kmodal__meta span {
  margin: 0 6px;
}

.kmodal__desc {
  margin: clamp(14px, 2.4vmin, 24px) 0 0;
  max-width: 46ch;
  font-size: clamp(16px, 1.15vw, 19px);
  line-height: 1.5;
  color: var(--modal-fg-muted);
}

/* Spec block: two stacked groups, not two columns — the info column is too
   narrow to split without wrapping every dt/dd row. */
.kmodal__details {
  display: grid;
  gap: clamp(13px, 1.9vmin, 19px);
  margin-top: clamp(16px, 2.5vmin, 25px);
  padding-top: clamp(14px, 2.1vmin, 21px);
  border-top: 1px solid var(--modal-line);
}

.kmodal__block h3 {
  margin: 0 0 clamp(8px, 1.2vmin, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--modal-fg-muted);
}

.kmodal__block dl {
  display: grid;
  gap: clamp(7px, 1vmin, 10px);
  margin: 0;
}

/* Fixed label column so the values all start on the same line. */
.kmodal__block dl > div {
  display: grid;
  grid-template-columns: minmax(88px, 0.34fr) 1fr;
  gap: 4px 18px;
  align-items: baseline;
}

.kmodal__block dt {
  font-size: 13px;
  color: var(--modal-fg-muted);
}

.kmodal__block dd {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.45;
  color: var(--modal-fg);
}

.kmodal__files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kmodal__files button {
  display: inline-flex;
  align-items: center;
  /* 44px floor: minimum touch target. */
  min-height: 44px;
  font: inherit;
  padding: 0 16px;
  border: 1px solid var(--modal-line);
  border-radius: 999px;
  font-size: 13px;
  color: var(--modal-fg);
  /* Explicit: without it <button> falls back to the UA grey fill, which reads
     as a detached bubble on the panel surface in both themes. */
  background: transparent;
  text-decoration: none;
  transition: border-color 0.22s ease, background 0.22s ease;
}

.kmodal__files button:not(:disabled):hover {
  border-color: var(--accent-fg);
  background: var(--modal-raised);
}

/* Unavailable but still readable. No `opacity` and no `--text-secondary`:
   both drop the contrast below AA on the light panel. */
.kmodal__files button:disabled {
  border-style: dashed;
  color: var(--modal-fg-muted);
  cursor: not-allowed;
}

.kmodal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: clamp(18px, 3.2vmin, 32px);
}

.kmodal__cta,
.kmodal__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease;
}

.kmodal__cta {
  color: var(--accent-on);
  background: var(--accent-fill);
}

.kmodal__cta:hover {
  background: var(--accent-fg);
}

.kmodal__link {
  color: var(--modal-fg-muted);
  border: 1px solid var(--modal-line);
}

.kmodal__link:hover {
  color: var(--modal-fg);
  border-color: var(--modal-fg-muted);
}

/* --- Controls ------------------------------------------------------------- */
.kmodal__close,
.kmodal__nav {
  position: fixed;
  z-index: 3004;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--modal-line);
  border-radius: 999px;
  background: var(--modal-surface);
  color: var(--modal-fg);
  cursor: pointer;
  transition: transform 0.22s ease, background 0.22s ease;
}

.kmodal__close svg,
.kmodal__nav svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.kmodal__close {
  top: 24px;
  right: 28px;
  /* 44px floor: minimum touch target (WCAG 2.5.8 / Apple HIG). */
  width: 44px;
  height: 44px;
}

/* Keyboard-only focus ring; the modal traps focus, so it has to be visible. */
.kmodal__close:focus-visible,
.kmodal__nav:focus-visible,
.kmodal__cta:focus-visible,
.kmodal__link:focus-visible,
.kmodal__files button:focus-visible {
  outline: 2px solid var(--modal-fg);
  outline-offset: 3px;
}

.kmodal__close:hover {
  transform: rotate(90deg);
}

/* Arrows live in the gutter beside the panel, never on top of it. The gutter
   is (viewport - panel) / 2; `max()` pins the arrow to the edge once that
   gutter gets too narrow to center in. */
.kmodal__nav {
  --kmodal-side-gap: calc((100vw - min(100vw - 2 * clamp(24px, 3vw, 48px), 1180px)) / 2);
  --kmodal-arrow-offset: max(10px, calc(var(--kmodal-side-gap) / 2 - 24px));

  top: 50%;
  width: 48px;
  height: 48px;
  margin-top: -24px;
}

.kmodal__nav--prev { left: var(--kmodal-arrow-offset); }
.kmodal__nav--next { right: var(--kmodal-arrow-offset); }

.kmodal__nav:hover {
  background: var(--modal-raised);
}

/* --- Tablet / small laptop (861–1180px) ----------------------------------- */
/* Still two columns, but the image gives width back to the text, which is the
   side that actually cramps here. */
@media (min-width: 861px) and (max-width: 1180px) {
  .kmodal__panel {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
    gap: clamp(24px, 3vw, 40px);
    padding: clamp(24px, 3vw, 40px);
  }

  /* Narrower label column: the 88px floor squeezes the values in here. */
  .kmodal__block dl > div {
    grid-template-columns: minmax(72px, 0.32fr) 1fr;
    gap: 4px 12px;
  }

  /* The panel nearly fills the viewport, leaving no gutter for the arrows, so
     they move inside it to the bottom-left of the image. */
  .kmodal__nav {
    top: auto;
    bottom: clamp(24px, 3vw, 40px);
    width: 44px;
    height: 44px;
    margin-top: 0;
    box-shadow: 0 6px 18px rgb(0 0 0 / 0.10);
  }

  .kmodal__nav--prev {
    left: clamp(24px, 3vw, 40px);
    right: auto;
  }

  .kmodal__nav--next {
    left: calc(clamp(24px, 3vw, 40px) + 52px);
    right: auto;
  }
}

/* --- Short viewport (height ≤ 700px) -------------------------------------- */
/* Width is fine on these laptops, height is not, so this query only checks
   height. Do not re-add `-webkit-line-clamp` to the description: the vmin type
   scale already fits, and clamping cut the sentence mid-word. */
@media (min-width: 861px) and (max-height: 700px) {
  .kmodal__panel {
    max-height: 94vh;
    padding: clamp(20px, 2.4vw, 34px);
  }
}

/* --- Phone: single column, full screen ------------------------------------ */
@media (max-width: 860px) {
  .kmodal {
    padding: 0;
  }

  .kmodal__panel {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0;
    width: 100%;
    height: 100dvh;
    max-height: none;
    padding: 0;
    border-radius: 0;
  }

  .kmodal__visual {
    border-radius: 0;
  }

  .kmodal__content {
    /* The extra 14px offsets the desktop scrollbar margin, which would
       otherwise pull the text against the edge. */
    padding: 24px 20px 32px;
    padding-right: 34px;
    /* Range, not a fixed height: the lower bound protects the spec table on
       short phones, the upper bound protects the image. */
    max-height: clamp(300px, 54dvh, 62dvh);
    border-top: 1px solid var(--modal-line);
  }

  .kmodal__code {
    font-size: clamp(34px, 9vw, 46px);
  }

  /* Anchored inside the image area, above the info sheet, low enough not to
     cover the door. */
  .kmodal__nav {
    top: auto;
    bottom: auto;
    margin-top: 0;
    top: clamp(180px, 26dvh, 300px);
  }
}

/* --- Landscape phone ------------------------------------------------------ */
/* Width is plentiful, height is scarce: back to two columns, otherwise the
   single-column layout crushes the door to ~90px. */
@media (max-width: 860px) and (orientation: landscape) and (max-height: 520px) {
  .kmodal__panel {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    gap: 20px;
    padding: 16px;
  }

  .kmodal__visual {
    border-radius: 2px 2px 20px;
  }

  .kmodal__content {
    max-height: none;
    padding: 0 20px 0 0;
    border-top: 0;
  }

  .kmodal__code {
    font-size: clamp(28px, 7vmin, 40px);
  }

  /* Spec table and CTA outrank the description at this height. */
  .kmodal__desc {
    display: none;
  }

  .kmodal__nav {
    top: auto;
    bottom: 14px;
    width: 38px;
    height: 38px;
    margin-top: 0;
  }

  .kmodal__nav--prev { left: 14px; right: auto; }
  .kmodal__nav--next { left: 60px; right: auto; }
}

/* --- Narrow phone (≤380px) ------------------------------------------------ */
@media (max-width: 380px) {
  /* The two CTAs no longer fit side by side. */
  .kmodal__actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .kmodal__cta,
  .kmodal__link {
    justify-content: center;
  }

  /* Same for label/value: the value drops to its own line. */
  .kmodal__block dl > div {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kmodal__close:hover {
    transform: none;
  }
}
</style>

<!--
  Scrollbar rules must be global: the modal is teleported to <body>, and
  `<style scoped>` cannot attach its data attribute to a pseudo-element
  through that boundary (`:deep()` fails for the same reason).
  `.kmodal__content` only exists in this component, so this does not leak.
-->
<style>
.kmodal__content::-webkit-scrollbar {
  width: 4px;
}

.kmodal__content::-webkit-scrollbar-track {
  background: transparent;
}

.kmodal__content::-webkit-scrollbar-thumb {
  background: var(--modal-line);
  border-radius: 999px;
}

.kmodal__content::-webkit-scrollbar-thumb:hover {
  background: var(--modal-fg-muted);
}

/* Firefox only — it has no ::-webkit-scrollbar. The @supports guard keeps
   these properties away from Chrome, where they would disable the rules above. */
@supports not selector(::-webkit-scrollbar) {
  .kmodal__content {
    scrollbar-width: thin;
    scrollbar-color: var(--modal-line) transparent;
  }
}
</style>
