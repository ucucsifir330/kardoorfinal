<template>
  <section
    class="testimonial-wrapper relative m-0 flex min-h-[100svh] w-full items-center overflow-hidden bg-[var(--catalog-stage-surface-bg,var(--bg-color))] pt-[clamp(80px,7vw,128px)] pb-[clamp(150px,15vw,240px)] max-[1024px]:min-h-0 max-[1024px]:items-start max-[1024px]:pt-[156px] max-[1024px]:pb-[180px] max-[640px]:flex-col max-[640px]:pt-[124px] max-[640px]:pb-[150px]"
  >
    <div
      class="title-area pointer-events-none absolute top-0 left-0 z-10 flex h-full w-[45%] items-center pl-[3vw] max-[1024px]:relative max-[1024px]:h-auto max-[1024px]:w-full max-[1024px]:items-start max-[1024px]:px-[clamp(18px,4vw,40px)] max-[640px]:px-5"
    >
      <h2
        class="title rotating-title text-rotating relative z-[2] m-0 flex flex-col font-telegraf font-[540] leading-[1.05] tracking-normal text-[var(--ink)] max-[1024px]:text-rotating-lg max-[640px]:w-[min(100%,360px)] max-[640px]:text-rotating-sm max-[640px]:leading-[1.04]"
      >
        <div
          class="top-row inline-flex items-center whitespace-nowrap [transition:gap_var(--title-pill-transition-smooth)] max-[640px]:gap-[clamp(8px,2.2vw,12px)]"
          :style="{ gap: dynamicGap }"
        >
          <span
            :ref="setStaticTextRef"
            class="static-text inline-block [transition:transform_var(--title-pill-transition-smooth)] will-change-transform"
          >
            {{ staticLabel }}
          </span>

          <div
            class="rotating-text-wrapper relative block h-[clamp(4.85rem,6.55vw,7.25rem)] overflow-visible [transition:width_var(--title-pill-transition-smooth)] max-[1024px]:h-[clamp(3.95rem,9.7vw,6.05rem)] max-[640px]:h-[clamp(3.25rem,12.8vw,4rem)]"
            :style="{ width: titleWidth + 'px' }"
          >
            <span
              :ref="setHiddenSpanRef"
              class="hidden-measure text-rotating pointer-events-none absolute top-0 left-0 flex h-full items-center whitespace-nowrap font-telegraf font-[540] tracking-normal invisible max-[1024px]:text-rotating-lg max-[640px]:text-rotating-sm"
            ></span>

            <div
              class="typewriter-line pointer-events-none absolute inset-0 flex items-center justify-start"
            >
              <span
                :ref="setTypewriterRef"
                class="typewriter-text text-rotating whitespace-nowrap font-telegraf font-[540] leading-[1.08] tracking-normal max-[1024px]:text-rotating-lg max-[640px]:text-rotating-sm"
              ></span><span
                class="typewriter-cursor text-rotating ml-[0.04em] whitespace-nowrap font-telegraf font-normal leading-[1.08] tracking-normal text-[var(--typewriter-caret,var(--brand-500))] will-change-[opacity] max-[1024px]:text-rotating-lg max-[640px]:text-rotating-sm"
                aria-hidden="true"
                >|</span
              >
            </div>
          </div>
        </div>

        <div class="bottom-row block whitespace-nowrap">{{ bottomLabel }}</div>
      </h2>

      <div
        class="gradient-mask absolute top-0 right-[-40%] z-[1] h-full w-[140%] bg-[linear-gradient(to_right,var(--catalog-stage-surface-bg,var(--bg-color))_60%,transparent_100%)] max-[1024px]:hidden"
      ></div>
    </div>

    <div
      class="carousel-area flex w-full flex-col gap-[clamp(1.35rem,2vw,2rem)] pl-[40%] max-[1024px]:relative max-[1024px]:z-[2] max-[1024px]:mt-[clamp(42px,7vw,72px)] max-[1024px]:gap-4 max-[1024px]:pl-0 max-[640px]:mt-[34px] max-[640px]:gap-[0.85rem]"
    >
      <div
        class="track w-full cursor-grab overflow-visible active:cursor-grabbing max-[1024px]:px-[clamp(18px,4vw,40px)] max-[640px]:px-5"
        @mousedown.prevent="startDrag($event, 1)"
        @touchstart="startDrag($event, 1)"
        @mouseenter="setHover(true, 1)"
        @mouseleave="setHover(false, 1)"
      >
        <div
          class="track-inner flex w-max gap-[clamp(1rem,1.5vw,1.5rem)] will-change-transform max-[640px]:gap-[0.85rem]"
          :ref="setInner1Ref"
        >
          <div
            v-for="(review, index) in row1"
            :key="'r1-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row1"
            :key="'clone1-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="track w-full cursor-grab overflow-visible active:cursor-grabbing max-[1024px]:px-[clamp(18px,4vw,40px)] max-[640px]:px-5"
        @mousedown.prevent="startDrag($event, 2)"
        @touchstart="startDrag($event, 2)"
        @mouseenter="setHover(true, 2)"
        @mouseleave="setHover(false, 2)"
      >
        <div
          class="track-inner flex w-max gap-[clamp(1rem,1.5vw,1.5rem)] will-change-transform max-[640px]:gap-[0.85rem]"
          :ref="setInner2Ref"
        >
          <div
            v-for="(review, index) in row2"
            :key="'r2-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row2"
            :key="'clone2-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
// @ts-nocheck
defineProps<{
  staticLabel: string;
  bottomLabel: string;
  dynamicGap: string;
  titleWidth: number;
  row1: any[];
  row2: any[];
  setStaticTextRef: (el: any) => void;
  setHiddenSpanRef: (el: any) => void;
  setTypewriterRef: (el: any) => void;
  setInner1Ref: (el: any) => void;
  setInner2Ref: (el: any) => void;
  startDrag: (event: MouseEvent | TouchEvent, trackNum: number) => void;
  setHover: (value: boolean, trackNum: number) => void;
  tiltCard: (event: MouseEvent) => void;
  resetTilt: (event: MouseEvent) => void;
}>();

const reviewCardClass = [
  'review-card relative flex w-[clamp(340px,27vw,410px)] shrink-0 select-none flex-col justify-between',
  'gap-[clamp(1.35rem,1.8vw,1.75rem)] rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)]',
  'px-[clamp(1.35rem,1.7vw,1.75rem)] py-[clamp(1.55rem,2vw,2rem)]',
  '[box-shadow:0_16px_44px_rgba(0,0,0,0.035)] [--scale:1] [transform-style:preserve-3d]',
  '[transform:perspective(1000px)_scale(var(--scale))_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]',
  '[transition:transform_var(--transition-smooth),box-shadow_var(--transition-smooth),border-color_var(--transition-smooth)]',
  'hover:z-10 hover:border-[var(--brand-700)] hover:[--scale:1.045]',
  'hover:[box-shadow:0_0_0_1px_rgba(251,249,245,0.9),0_0_32px_rgba(251,249,245,0.95),0_18px_38px_rgba(0,0,0,0.08)]',
  'max-[1024px]:w-[min(74vw,340px)] max-[1024px]:p-[1.45rem]',
  // rounded-xl projenin --radius-xl token'ina (20px) baglaniyor; orijinal
  // CSS'te mobil kart radius'u 12px idi. Birebir esitlik icin acik deger.
  'max-[640px]:min-h-[220px] max-[640px]:w-[min(72vw,280px)] max-[640px]:rounded-[12px] max-[640px]:p-5',
  'max-[640px]:hover:[--scale:1]'
].join(' ');

const quoteClass =
  'quote relative z-[2] m-0 font-body text-quote leading-[1.58] text-[var(--text-primary)] max-[640px]:text-[0.96rem] max-[640px]:leading-[1.52]';
const authorClass =
  'author relative z-[2] flex items-center justify-between border-t border-t-[var(--hairline)] pt-6 max-[640px]:pt-4';
const authorInfoClass = 'author-info flex flex-col gap-[0.3rem]';
const nameClass =
  'name font-mori text-name font-semibold text-[var(--text-primary)] max-[640px]:text-[0.95rem]';
const ratingClass =
  'rating font-body text-rating tracking-[0.08em] text-[var(--brand-700)] max-[640px]:text-[1.02rem]';
</script>

<style scoped>
.typewriter-text {
  background-image: var(--typewriter-gradient);
  background-position:
    0% 20%,
    100% 80%,
    0 0;
  background-size:
    145% 145%,
    155% 155%,
    100% 100%;
  background-repeat: no-repeat;
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  will-change: background-position;
  animation: typewriter-gradient-flow 16s cubic-bezier(0.45, 0, 0.2, 1) infinite alternate;
}

.typewriter-line[data-gradient='word-0'] {
  --typewriter-caret: #35bfa0;
  --typewriter-gradient:
    radial-gradient(
      circle at 30% 35%,
      #2b4bf2 0%,
      transparent 52%
    ),
    radial-gradient(circle at 72% 66%, #35bfa0 0%, transparent 50%),
    linear-gradient(118deg in oklab, #12336b 0%, #77d5b3 100%);
}

.typewriter-line[data-gradient='word-1'] {
  --typewriter-caret: #7657ee;
  --typewriter-gradient:
    radial-gradient(circle at 24% 68%, #2b4bf2 0%, transparent 50%),
    radial-gradient(circle at 76% 28%, #7657ee 0%, transparent 54%),
    linear-gradient(118deg in oklab, #142f78 0%, #b497cf 100%);
}

.typewriter-line[data-gradient='word-2'] {
  --typewriter-caret: #ff9ffc;
  --typewriter-gradient:
    radial-gradient(circle at 34% 24%, #2b4bf2 0%, transparent 49%),
    radial-gradient(circle at 70% 74%, #ff9ffc 0%, transparent 52%),
    linear-gradient(118deg in oklab, #153b7a 0%, #8c6ff0 100%);
}

@keyframes typewriter-gradient-flow {
  0% {
    background-position:
      0% 20%,
      100% 80%,
      0 0;
  }

  100% {
    background-position:
      78% 74%,
      24% 18%,
      0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typewriter-text {
    animation: none;
  }
}

.review-card.tilting {
  transition:
    transform var(--transition-tilt),
    box-shadow var(--transition-smooth),
    border-color var(--transition-smooth);
}

.review-card::before {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  content: "";
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    800px circle at var(--x, 50%) var(--y, 50%),
    rgba(255, 255, 255, 0.22),
    transparent 42%
  );
  opacity: 0;
  transition: opacity var(--transition-smooth);
}

.review-card:hover::before {
  opacity: 1;
}
</style>
