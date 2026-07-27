<script setup lang="ts">
/**
 * HomeReviewsTailwind — ORNEK/KARSILASTIRMA dosyasi.
 *
 * HomeReviews.vue + home-reviews.css ikilisinin Tailwind 4 karsiligi.
 * Amac: "Tailwind bu projede nasil duruyor?" sorusunu tek dosyada gostermek.
 *
 * Mevcut HomeReviews.vue ve home-reviews.css'e DOKUNULMADI. Bu dosya
 * silinirse proje hicbir sey kaybetmez.
 *
 * Props HomeReviews.vue ile birebir ayni tutuldu; ayni yerde birebir
 * degistirilerek denenebilsin diye.
 */
defineProps<{
  staticLabel: string;
  bottomLabel: string;
  dynamicGap: number;
  titleWidth: number;
  row1: Array<{ id: number; text: string; name: string }>;
  row2: Array<{ id: number; text: string; name: string }>;
  setStaticTextRef: (el: any) => void;
  setHiddenSpanRef: (el: any) => void;
  setTypewriterRef: (el: any) => void;
  setInner1Ref: (el: any) => void;
  setInner2Ref: (el: any) => void;
  startDrag: (event: MouseEvent | TouchEvent, track: number) => void;
  setHover: (track: number, hovered: boolean) => void;
  tiltCard: (event: MouseEvent) => void;
  resetTilt: (event: MouseEvent) => void;
}>();
</script>

<template>
  <!-- testimonial-wrapper -->
  <section
    class="relative flex w-full items-center overflow-hidden
           min-h-[100svh] max-lg:min-h-auto max-lg:items-start
           bg-[var(--catalog-stage-surface-bg,var(--bg-color))]
           m-0 pt-[clamp(80px,7vw,128px)] pb-[clamp(150px,15vw,240px)]
           max-lg:py-[156px] max-lg:pb-[180px]
           max-sm:flex-col max-sm:pt-[124px] max-sm:pb-[150px]"
  >
    <!-- title-area -->
    <div
      class="pointer-events-none absolute top-0 left-0 z-10 flex h-full w-[45%] items-center pl-[3vw]
             max-lg:relative max-lg:h-auto max-lg:w-full max-lg:items-start
             max-lg:px-[clamp(18px,4vw,40px)] max-lg:pl-[clamp(18px,4vw,40px)]
             max-sm:px-5"
    >
      <!-- rotating-title -->
      <h2
        class="relative z-[2] m-0 flex flex-col font-telegraf font-[540] tracking-normal
               text-[#424346] leading-[1.05]
               text-rotating max-lg:text-rotating-lg max-sm:text-rotating-sm
               max-sm:w-[min(100%,360px)] max-sm:leading-[1.04]"
      >
        <!-- top-row -->
        <span
          class="inline-flex items-center whitespace-nowrap
                 transition-[gap] duration-[var(--title-pill-transition-smooth)]
                 max-sm:gap-[clamp(8px,2.2vw,12px)]"
          :style="{ gap: `${dynamicGap}px` }"
        >
          <!-- static-text -->
          <span
            :ref="setStaticTextRef"
            class="inline-block will-change-transform
                   transition-transform duration-[var(--title-pill-transition-smooth)]"
          >{{ staticLabel }}</span>

          <!-- rotating-text-wrapper: animate-[gradientBG] keyframe CSS'te kaldi -->
          <span
            class="relative block overflow-hidden bg-[#1b39bf] bg-[length:300%_300%]
                   h-[clamp(4.5rem,6.05vw,6.75rem)] rounded-[clamp(28px,3.2vw,44px)]
                   shadow-[0_18px_44px_rgba(27,57,191,0.18)]
                   [animation:gradientBG_6s_ease_infinite]
                   transition-[width,box-shadow] duration-[var(--title-pill-transition-smooth)]
                   max-lg:h-[clamp(3.65rem,9.1vw,5.7rem)]
                   max-sm:h-[clamp(3rem,12vw,3.7rem)] max-sm:rounded-[18px]"
            :style="{ width: `${titleWidth}px` }"
          >
            <!-- hidden-measure -->
            <span
              :ref="setHiddenSpanRef"
              aria-hidden="true"
              class="pointer-events-none invisible absolute top-0 left-0 flex h-full items-center
                     whitespace-nowrap px-[2vw] font-telegraf font-[540] tracking-normal
                     text-rotating max-lg:text-rotating-lg max-sm:text-rotating-sm"
            />
            <!-- typewriter-line -->
            <span
              class="pointer-events-none absolute inset-0 flex items-center justify-center px-[2vw]"
            >
              <span
                :ref="setTypewriterRef"
                class="whitespace-nowrap font-telegraf font-[540] tracking-normal
                       leading-none text-[#EAE8E8] translate-y-[-0.03em]
                       text-rotating max-lg:text-rotating-lg max-sm:text-rotating-sm"
              />
              <span
                class="ml-[0.04em] whitespace-nowrap font-telegraf font-normal tracking-normal
                       leading-none text-[#EAE8E8] translate-y-[-0.03em] will-change-[opacity]
                       text-rotating max-lg:text-rotating-lg max-sm:text-rotating-sm"
              >|</span>
            </span>
          </span>
        </span>

        <!-- bottom-row -->
        <span class="block whitespace-nowrap">{{ bottomLabel }}</span>
      </h2>
    </div>

    <!-- gradient-mask: mobilde gizli -->
    <div
      aria-hidden="true"
      class="absolute top-0 right-[-40%] z-[1] h-full w-[140%] max-lg:hidden
             bg-[linear-gradient(to_right,var(--catalog-stage-surface-bg,var(--bg-color))_60%,transparent_100%)]"
    />

    <!-- carousel-area -->
    <div
      class="flex w-full flex-col pl-[40%] gap-[clamp(1.35rem,2vw,2rem)]
             max-lg:relative max-lg:z-[2] max-lg:pl-0 max-lg:gap-4
             max-lg:mt-[clamp(42px,7vw,72px)] max-sm:mt-[34px] max-sm:gap-[0.85rem]"
    >
      <!-- track 1 -->
      <div
        class="w-full cursor-grab overflow-visible active:cursor-grabbing
               max-lg:px-[clamp(18px,4vw,40px)] max-sm:px-5"
        @mousedown="startDrag($event, 1)"
        @touchstart="startDrag($event, 1)"
        @mouseenter="setHover(1, true)"
        @mouseleave="setHover(1, false)"
      >
        <div
          :ref="setInner1Ref"
          class="flex w-max will-change-transform gap-[clamp(1rem,1.5vw,1.5rem)] max-sm:gap-[0.85rem]"
        >
          <article
            v-for="review in row1"
            :key="`r1-${review.id}`"
            class="group relative flex shrink-0 select-none flex-col justify-between
                   border border-black/[0.03] bg-white rounded-[14px]
                   [box-shadow:0_16px_44px_rgba(0,0,0,0.035)]
                   px-[clamp(1.35rem,1.7vw,1.75rem)] py-[clamp(1.55rem,2vw,2rem)]
                   w-[clamp(340px,27vw,410px)] gap-[clamp(1.35rem,1.8vw,1.75rem)]
                   [transform-style:preserve-3d]
                   [transform:perspective(1000px)_scale(var(--scale,1))_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]
                   transition-[transform,box-shadow,border-color] duration-[var(--transition-smooth)]
                   hover:[--scale:1.045] hover:z-10 hover:border-white/90
                   hover:[box-shadow:0_0_0_1px_rgba(255,255,255,0.9),0_0_32px_rgba(255,255,255,0.95),0_18px_38px_rgba(0,0,0,0.08)]
                   max-lg:w-[min(74vw,340px)] max-lg:p-[1.45rem]
                   max-sm:w-[min(72vw,280px)] max-sm:min-h-[220px] max-sm:p-5
                   max-sm:rounded-xl max-sm:hover:[--scale:1]"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <!-- review-card::before parlama katmani -->
            <span
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0
                     transition-opacity duration-[var(--transition-smooth)] group-hover:opacity-100
                     bg-[radial-gradient(800px_circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.22),transparent_42%)]"
            />
            <p
              class="relative z-[2] m-0 font-body leading-[1.58] text-[var(--text-primary)]
                     text-quote max-sm:text-[0.96rem] max-sm:leading-[1.52]"
            >{{ review.text }}</p>

            <footer
              class="relative z-[2] flex items-center justify-between
                     border-t border-[#f0f0f0] pt-6 max-sm:pt-4"
            >
              <div class="flex flex-col gap-[0.3rem]">
                <span
                  class="font-mori font-semibold text-[var(--text-primary)]
                         text-name max-sm:text-[0.95rem]"
                >{{ review.name }}</span>
              </div>
              <span
                class="font-body tracking-[0.08em] text-[#FFB800]
                       text-rating max-sm:text-[1.02rem]"
              >★★★★★</span>
            </footer>
          </article>
        </div>
      </div>

      <!-- track 2 -->
      <div
        class="w-full cursor-grab overflow-visible active:cursor-grabbing
               max-lg:px-[clamp(18px,4vw,40px)] max-sm:px-5"
        @mousedown="startDrag($event, 2)"
        @touchstart="startDrag($event, 2)"
        @mouseenter="setHover(2, true)"
        @mouseleave="setHover(2, false)"
      >
        <div
          :ref="setInner2Ref"
          class="flex w-max will-change-transform gap-[clamp(1rem,1.5vw,1.5rem)] max-sm:gap-[0.85rem]"
        >
          <article
            v-for="review in row2"
            :key="`r2-${review.id}`"
            class="group relative flex shrink-0 select-none flex-col justify-between
                   border border-black/[0.03] bg-white rounded-[14px]
                   [box-shadow:0_16px_44px_rgba(0,0,0,0.035)]
                   px-[clamp(1.35rem,1.7vw,1.75rem)] py-[clamp(1.55rem,2vw,2rem)]
                   w-[clamp(340px,27vw,410px)] gap-[clamp(1.35rem,1.8vw,1.75rem)]
                   [transform-style:preserve-3d]
                   [transform:perspective(1000px)_scale(var(--scale,1))_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]
                   transition-[transform,box-shadow,border-color] duration-[var(--transition-smooth)]
                   hover:[--scale:1.045] hover:z-10 hover:border-white/90
                   hover:[box-shadow:0_0_0_1px_rgba(255,255,255,0.9),0_0_32px_rgba(255,255,255,0.95),0_18px_38px_rgba(0,0,0,0.08)]
                   max-lg:w-[min(74vw,340px)] max-lg:p-[1.45rem]
                   max-sm:w-[min(72vw,280px)] max-sm:min-h-[220px] max-sm:p-5
                   max-sm:rounded-xl max-sm:hover:[--scale:1]"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <span
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0
                     transition-opacity duration-[var(--transition-smooth)] group-hover:opacity-100
                     bg-[radial-gradient(800px_circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.22),transparent_42%)]"
            />
            <p
              class="relative z-[2] m-0 font-body leading-[1.58] text-[var(--text-primary)]
                     text-quote max-sm:text-[0.96rem] max-sm:leading-[1.52]"
            >{{ review.text }}</p>

            <footer
              class="relative z-[2] flex items-center justify-between
                     border-t border-[#f0f0f0] pt-6 max-sm:pt-4"
            >
              <div class="flex flex-col gap-[0.3rem]">
                <span
                  class="font-mori font-semibold text-[var(--text-primary)]
                         text-name max-sm:text-[0.95rem]"
                >{{ review.name }}</span>
              </div>
              <span
                class="font-body tracking-[0.08em] text-[#FFB800]
                       text-rating max-sm:text-[1.02rem]"
              >★★★★★</span>
            </footer>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
