<template>
  <a
    class="ada-cta-button"
    :class="[
      `ada-cta-button--${variant}`,
      {
        'ada-cta-button--icon-left': iconPosition === 'left',
        'ada-cta-button--no-icon': iconPosition === 'none'
      }
    ]"
    :href="href"
    :aria-label="ariaLabel || label"
    @pointerenter="setHoverDirection"
    @pointerleave="resetHoverDirection"
  >
    <span class="ada-cta-button__fill" aria-hidden="true" />

    <span v-if="iconPosition === 'left'" class="ada-cta-button__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
    </span>

    <span class="ada-cta-button__text" aria-hidden="true">
      <span class="ada-cta-button__text-track">
        <span class="ada-cta-button__text-line">{{ label }}</span>
        <span class="ada-cta-button__text-line">{{ label }}</span>
      </span>
    </span>

    <span v-if="iconPosition === 'right'" class="ada-cta-button__icon" aria-hidden="true">
      <svg
        class="ada-cta-button__rocket"
        width="36"
        height="22"
        viewBox="0 0 36 22"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="matrix(1,0,0,1,-419.5,-274.131)">
          <g>
            <path
              class="ada-cta-button__rocket-top"
              d="M420,274.631L450,274.631C450,274.631 459.044,284.599 450,284.599C440.956,284.599 420,284.646 420,284.646L430.014,274.631"
            />
            <g transform="matrix(1,-1.22465e-16,-1.22465e-16,-1,0,569.277)">
              <path
                class="ada-cta-button__rocket-bottom"
                d="M420,274.631L450,274.631C450,274.631 459.044,284.599 450,284.599C440.956,284.599 420,284.646 420,284.646L430.014,274.631"
              />
            </g>
            <g transform="matrix(1,0,0,1,0,-0.0234189)">
              <path d="M420,284.646L450,284.646" />
            </g>
          </g>
        </g>
      </svg>
    </span>
  </a>
</template>

<script setup lang="ts">
import { gsap } from "gsap";

withDefaults(
  defineProps<{
    href?: string;
    label: string;
    ariaLabel?: string;
    iconPosition?: "left" | "right" | "none";
    variant?: "filled" | "outline";
  }>(),
  {
    href: "#",
    ariaLabel: "",
    iconPosition: "right",
    variant: "filled"
  }
);

const setHoverDirection = (event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target || !target.classList.contains("ada-cta-button--outline")) return;

  const rect = target.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  const fromHorizontal = Math.abs(x / rect.width) > Math.abs(y / rect.height);
  const fill = target.querySelector<HTMLElement>(".ada-cta-button__fill");
  if (!fill) return;

  const fromX = fromHorizontal ? (x < 0 ? "-103%" : "103%") : "0%";
  const fromY = fromHorizontal ? "0%" : y < 0 ? "-103%" : "103%";

  gsap.killTweensOf(fill);
  gsap.set(fill, { x: fromX, y: fromY, opacity: 1 });
  gsap.to(fill, {
    x: "0%",
    y: "0%",
    duration: 0.72,
    ease: "expo.out"
  });
};

const resetHoverDirection = (event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target || !target.classList.contains("ada-cta-button--outline")) return;

  const rect = target.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  const fromHorizontal = Math.abs(x / rect.width) > Math.abs(y / rect.height);
  const toX = fromHorizontal ? (x < 0 ? "-103%" : "103%") : "0%";
  const toY = fromHorizontal ? "0%" : y < 0 ? "-103%" : "103%";
  const fill = target.querySelector<HTMLElement>(".ada-cta-button__fill");
  if (!fill) return;

  gsap.killTweensOf(fill);
  gsap.to(fill, {
    x: toX,
    y: toY,
    opacity: 1,
    duration: 0.56,
    ease: "expo.out"
  });
};
</script>

<style scoped>
.ada-cta-button {
  --ada-cta-bg: #14151d;
  --ada-cta-fg: #eae8e8;
  --ada-cta-border: #14151d;
  --ada-cta-hover-bg: var(--ada-cta-bg);
  --ada-cta-hover-fg: var(--ada-cta-fg);
  --ada-cta-hover-border: var(--ada-cta-border);
  --ada-cta-text-color: var(--ada-cta-fg);
  --ada-cta-fill-surface: #14151d;

  position: relative;
  width: max-content;
  min-width: clamp(168px, 9.8vw, 196px);
  max-width: 100%;
  height: clamp(48px, 2.92vw, 56px);
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 1.35vw, 22px);
  overflow: hidden;
  border-radius: 999px;
  border: 0.75px solid var(--ada-cta-border);
  padding: 0 clamp(16px, 1.1vw, 22px);
  background: var(--ada-cta-bg);
  color: var(--ada-cta-fg);
  font-family: Gotham, "Gotham SSm", Montserrat, Inter, system-ui, sans-serif;
  font-size: clamp(13px, 0.78vw, 15px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-decoration: none;
  white-space: nowrap;
  min-inline-size: 0;
  transition:
    background-color 450ms cubic-bezier(0.165, 0.84, 0.44, 1),
    border-color 450ms cubic-bezier(0.165, 0.84, 0.44, 1),
    color 450ms cubic-bezier(0.165, 0.84, 0.44, 1);
}

.ada-cta-button:hover {
  --ada-cta-text-color: var(--ada-cta-hover-fg);

  background: var(--ada-cta-hover-bg);
  border-color: var(--ada-cta-hover-border);
  color: var(--ada-cta-hover-fg);
}

.ada-cta-button__fill {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.08), transparent 34%),
    var(--ada-cta-fill-surface);
  opacity: 0;
  transform: translate3d(-103%, 0, 0);
  pointer-events: none;
  will-change: transform;
}

.ada-cta-button--outline {
  --ada-cta-bg: transparent;
  --ada-cta-fg: #14151d;
  --ada-cta-border: rgba(20, 21, 29, 0.38);
  --ada-cta-hover-bg: transparent;
  --ada-cta-hover-fg: #eae8e8;
  --ada-cta-hover-border: #14151d;
  --ada-cta-fill-surface: #14151d;
}

.ada-cta-button--icon-left {
  padding: 0 clamp(22px, 1.8vw, 34px) 0 clamp(18px, 1.45vw, 26px);
}

.ada-cta-button--no-icon {
  gap: 0;
}

.ada-cta-button__text {
  position: relative;
  z-index: 1;
  display: inline-block;
  height: 1.34em;
  overflow: hidden;
  padding: 0 0.08em;
  color: var(--ada-cta-text-color);
  line-height: 1.34;
}

.ada-cta-button__text-track {
  display: flex;
  flex-direction: column;
  transform: translate3d(0, 0, 0);
  transition: transform 720ms cubic-bezier(0.77, 0, 0.175, 1);
  will-change: transform;
}

.ada-cta-button__text-line {
  display: block;
  height: 1.34em;
  line-height: 1.34;
  white-space: nowrap;
}

.ada-cta-button:hover .ada-cta-button__text-track {
  transform: translate3d(0, -50%, 0);
}

.ada-cta-button__icon {
  position: relative;
  z-index: 1;
  width: clamp(24px, 1.65vw, 30px);
  height: auto;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: currentColor;
  line-height: 1;
  transition: transform 450ms cubic-bezier(0.165, 0.84, 0.44, 1);
}

.ada-cta-button:not(.ada-cta-button--icon-left) .ada-cta-button__icon {
  width: clamp(18px, 1.12vw, 22px);
}

.ada-cta-button__rocket {
  display: block;
  width: 100%;
  height: auto;
  fill-rule: evenodd;
  clip-rule: evenodd;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-miterlimit: 1.5;
}

.ada-cta-button__rocket path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5px;
}

.ada-cta-button__rocket-top,
.ada-cta-button__rocket-bottom {
  stroke-dasharray: 30, 75.39;
  transition:
    stroke-dasharray 800ms cubic-bezier(0.6, 0.33, 0.67, 1.29),
    stroke-dashoffset 800ms cubic-bezier(0.6, 0.33, 0.67, 1.29);
  will-change: stroke-dasharray, stroke-dashoffset;
}

.ada-cta-button:hover .ada-cta-button__rocket-top,
.ada-cta-button:hover .ada-cta-button__rocket-bottom {
  stroke-dasharray: 75.39;
  stroke-dashoffset: -60;
}

@media (max-width: 720px) {
  .ada-cta-button {
    width: auto;
    min-width: 0;
    height: clamp(40px, 11.6vw, 46px);
    padding: 0 clamp(14px, 4.5vw, 17px);
    font-size: clamp(11px, 3.35vw, 13px);
  }
}
</style>
