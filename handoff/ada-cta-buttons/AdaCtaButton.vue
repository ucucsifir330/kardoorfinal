<template>
  <a
    class="ada-cta-button"
    :class="{ 'ada-cta-button--icon-left': iconPosition === 'left' }"
    :href="href"
    :aria-label="ariaLabel || label"
  >
    <span v-if="iconPosition === 'left'" class="ada-cta-button__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
    </span>

    <span class="ada-cta-button__text" :data-text="label">{{ label }}</span>

    <span v-if="iconPosition === 'right'" class="ada-cta-button__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
    </span>
  </a>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    href?: string;
    label: string;
    ariaLabel?: string;
    iconPosition?: "left" | "right";
  }>(),
  {
    href: "#",
    ariaLabel: "",
    iconPosition: "right"
  }
);
</script>

<style scoped>
.ada-cta-button {
  --ada-cta-bg: #14151d;
  --ada-cta-fg: #eae8e8;
  --ada-cta-hover-bg: #eae8e8;
  --ada-cta-hover-fg: #14151d;
  --ada-cta-text-color: var(--ada-cta-fg);

  width: clamp(260px, 17vw, 340px);
  min-width: clamp(260px, 17vw, 340px);
  height: clamp(54px, 3.4375vw, 66px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 1.35vw, 22px);
  overflow: hidden;
  border-radius: 999px;
  padding: 0 clamp(18px, 1.45vw, 26px) 0 clamp(22px, 1.8vw, 34px);
  background: var(--ada-cta-bg);
  color: var(--ada-cta-fg);
  font-family: Gotham, "Gotham SSm", Montserrat, Inter, system-ui, sans-serif;
  font-size: clamp(15px, 0.9375vw, 18px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 450ms cubic-bezier(0.165, 0.84, 0.44, 1),
    color 450ms cubic-bezier(0.165, 0.84, 0.44, 1);
}

.ada-cta-button:hover {
  --ada-cta-text-color: var(--ada-cta-hover-fg);

  background: var(--ada-cta-hover-bg);
  color: var(--ada-cta-hover-fg);
}

.ada-cta-button--icon-left {
  padding: 0 clamp(22px, 1.8vw, 34px) 0 clamp(18px, 1.45vw, 26px);
}

.ada-cta-button__text {
  position: relative;
  display: inline-block;
  min-height: 1.34em;
  overflow: hidden;
  padding: 0 0.08em;
  color: transparent;
  line-height: 1.34;
  perspective: 700px;
}

.ada-cta-button__text::before,
.ada-cta-button__text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  color: var(--ada-cta-text-color);
  backface-visibility: hidden;
  transform-origin: 50% 50%;
  transform-style: preserve-3d;
  transition:
    transform 720ms cubic-bezier(0.77, 0, 0.175, 1),
    opacity 720ms cubic-bezier(0.77, 0, 0.175, 1);
  will-change: transform, opacity;
}

.ada-cta-button__text::before {
  opacity: 1;
  transform: translateY(0%) rotateX(0deg);
}

.ada-cta-button__text::after {
  opacity: 0;
  transform: translateY(100%) rotateX(-90deg);
}

.ada-cta-button:hover .ada-cta-button__text::before {
  opacity: 0;
  transform: translateY(-100%) rotateX(90deg);
}

.ada-cta-button:hover .ada-cta-button__text::after {
  opacity: 1;
  transform: translateY(0%) rotateX(0deg);
}

.ada-cta-button__icon {
  width: clamp(18px, 1.45vw, 22px);
  height: clamp(18px, 1.45vw, 22px);
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: currentColor;
  line-height: 1;
  transition: transform 450ms cubic-bezier(0.165, 0.84, 0.44, 1);
}

.ada-cta-button__icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.ada-cta-button:hover .ada-cta-button__icon {
  transform: rotate(90deg);
}

@media (max-width: 720px) {
  .ada-cta-button {
    width: min(100%, 340px);
    min-width: 0;
  }
}
</style>
