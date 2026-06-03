<template>
  <div
    v-show="isEnabled"
    ref="cursorRef"
    class="smooth-cursor"
    :class="{ 'smooth-cursor--visible': isVisible }"
    aria-hidden="true"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="54"
      viewBox="0 0 50 54"
      fill="none"
      class="smooth-cursor__svg"
    >
      <g filter="url(#smooth-cursor-shadow)">
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill="black"
        />
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke="white"
          stroke-width="2.25825"
        />
      </g>
      <defs>
        <filter
          id="smooth-cursor-shadow"
          x="0.602397"
          y="0.952444"
          width="49.0584"
          height="52.428"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2.25825" />
          <feGaussianBlur stdDeviation="2.25825" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_91_7928" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_91_7928" result="shape" />
        </filter>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

type Position = {
  x: number;
  y: number;
};

type SpringValue = {
  current: number;
  target: number;
  velocity: number;
};

type SpringConfig = {
  damping: number;
  mass: number;
  restDelta: number;
  stiffness: number;
};

const desktopPointerQuery = "(any-hover: hover) and (any-pointer: fine)";
const cursorRef = ref<HTMLElement | null>(null);
const isEnabled = ref(false);
const isVisible = ref(false);

const springConfig: SpringConfig = {
  damping: 45,
  stiffness: 400,
  mass: 1,
  restDelta: 0.001
};

const rotationSpringConfig: SpringConfig = {
  ...springConfig,
  damping: 60,
  stiffness: 300
};

const scaleSpringConfig: SpringConfig = {
  ...springConfig,
  damping: 35,
  stiffness: 500
};

const cursorX: SpringValue = { current: 0, target: 0, velocity: 0 };
const cursorY: SpringValue = { current: 0, target: 0, velocity: 0 };
const rotation: SpringValue = { current: 0, target: 0, velocity: 0 };
const scale: SpringValue = { current: 1, target: 1, velocity: 0 };

const lastMousePos: Position = { x: 0, y: 0 };
const velocity: Position = { x: 0, y: 0 };

let lastUpdateTime = Date.now();
let lastFrameTime = 0;
let rafId = 0;
let moveRafId = 0;
let scaleTimeout: number | null = null;
let mediaQuery: MediaQueryList | null = null;

const isTrackablePointer = (pointerType: string) => pointerType !== "touch";

const setSpringTarget = (spring: SpringValue, target: number) => {
  spring.target = target;
};

const stepSpring = (spring: SpringValue, config: SpringConfig, deltaSeconds: number) => {
  const displacement = spring.current - spring.target;
  const springForce = -config.stiffness * displacement;
  const dampingForce = -config.damping * spring.velocity;
  const acceleration = (springForce + dampingForce) / config.mass;

  spring.velocity += acceleration * deltaSeconds;
  spring.current += spring.velocity * deltaSeconds;

  if (Math.abs(spring.current - spring.target) < config.restDelta && Math.abs(spring.velocity) < config.restDelta) {
    spring.current = spring.target;
    spring.velocity = 0;
  }
};

const render = (timestamp: number) => {
  const deltaSeconds = Math.min((timestamp - lastFrameTime) / 1000 || 0.016, 0.032);
  lastFrameTime = timestamp;

  stepSpring(cursorX, springConfig, deltaSeconds);
  stepSpring(cursorY, springConfig, deltaSeconds);
  stepSpring(rotation, rotationSpringConfig, deltaSeconds);
  stepSpring(scale, scaleSpringConfig, deltaSeconds);

  if (cursorRef.value) {
    cursorRef.value.style.transform = `translate3d(${cursorX.current}px, ${cursorY.current}px, 0) translate(-50%, -50%) rotate(${rotation.current}deg) scale(${scale.current})`;
  }

  rafId = window.requestAnimationFrame(render);
};

const updateVelocity = (currentPos: Position) => {
  const currentTime = Date.now();
  const deltaTime = currentTime - lastUpdateTime;

  if (deltaTime > 0) {
    velocity.x = (currentPos.x - lastMousePos.x) / deltaTime;
    velocity.y = (currentPos.y - lastMousePos.y) / deltaTime;
  }

  lastUpdateTime = currentTime;
  lastMousePos.x = currentPos.x;
  lastMousePos.y = currentPos.y;
};

const smoothPointerMove = (event: PointerEvent) => {
  if (!isTrackablePointer(event.pointerType)) return;

  isVisible.value = true;

  const currentPos = { x: event.clientX, y: event.clientY };
  updateVelocity(currentPos);

  const speed = Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2));

  setSpringTarget(cursorX, currentPos.x);
  setSpringTarget(cursorY, currentPos.y);

  if (speed <= 0.1) return;

  const currentAngle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) + 90;
  let angleDiff = currentAngle - rotation.target;

  if (angleDiff > 180) angleDiff -= 360;
  if (angleDiff < -180) angleDiff += 360;

  setSpringTarget(rotation, rotation.target + angleDiff);
  setSpringTarget(scale, 0.95);

  if (scaleTimeout !== null) {
    window.clearTimeout(scaleTimeout);
  }

  scaleTimeout = window.setTimeout(() => {
    setSpringTarget(scale, 1);
  }, 150);
};

const throttledPointerMove = (event: PointerEvent) => {
  if (!isTrackablePointer(event.pointerType) || moveRafId) return;

  moveRafId = window.requestAnimationFrame(() => {
    smoothPointerMove(event);
    moveRafId = 0;
  });
};

const enableCursor = () => {
  if (isEnabled.value) return;

  isEnabled.value = true;
  document.documentElement.classList.add("smooth-cursor-active");
  window.addEventListener("pointermove", throttledPointerMove, { passive: true });
  rafId = window.requestAnimationFrame(render);
};

const disableCursor = () => {
  if (!isEnabled.value) return;

  isEnabled.value = false;
  isVisible.value = false;
  document.documentElement.classList.remove("smooth-cursor-active");
  window.removeEventListener("pointermove", throttledPointerMove);

  if (rafId) window.cancelAnimationFrame(rafId);
  if (moveRafId) window.cancelAnimationFrame(moveRafId);
  if (scaleTimeout !== null) window.clearTimeout(scaleTimeout);

  rafId = 0;
  moveRafId = 0;
  scaleTimeout = null;
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
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", updateEnabled);
  disableCursor();
});
</script>

<style scoped>
.smooth-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease;
  will-change: transform;
}

.smooth-cursor--visible {
  opacity: 1;
}

.smooth-cursor__svg {
  display: block;
  transform: scale(0.5);
  transform-origin: center;
}

:global(html.smooth-cursor-active),
:global(html.smooth-cursor-active *) {
  cursor: none !important;
}

:global(html.smooth-cursor-active input),
:global(html.smooth-cursor-active textarea),
:global(html.smooth-cursor-active select) {
  cursor: text !important;
}

@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .smooth-cursor {
    display: none;
  }
}
</style>
