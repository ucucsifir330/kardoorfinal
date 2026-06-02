<template>
<section class="testimonial-wrapper">
    <div class="title-area">
      <h2 class="title rotating-title">
        <div class="top-row" :style="{ gap: dynamicGap }">
          <span :ref="setStaticTextRef" class="static-text">Son</span>

          <div class="rotating-text-wrapper" :style="{ width: titleWidth + 'px' }">
            <span :ref="setHiddenSpanRef" class="hidden-measure">{{ titleWords[titleIndex] }}</span>

            <transition-group name="slide-word" tag="div" class="word-slider">
              <span :key="titleWords[titleIndex]" class="word-slide-item">
                {{ titleWords[titleIndex] }}
              </span>
            </transition-group>
          </div>
        </div>

        <div class="bottom-row">size bırakıyoruz.</div>
      </h2>

      <div class="gradient-mask"></div>
    </div>

    <div class="carousel-area">
      <div
        class="track"
        @mousedown.prevent="startDrag($event, 1)"
        @touchstart="startDrag($event, 1)"
        @mouseenter="setHover(true, 1)"
        @mouseleave="setHover(false, 1)"
      >
        <div class="track-inner" :ref="setInner1Ref">
          <div
            v-for="(review, index) in row1"
            :key="'r1-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row1"
            :key="'clone1-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="track"
        @mousedown.prevent="startDrag($event, 2)"
        @touchstart="startDrag($event, 2)"
        @mouseenter="setHover(true, 2)"
        @mouseleave="setHover(false, 2)"
      >
        <div class="track-inner" :ref="setInner2Ref">
          <div
            v-for="(review, index) in row2"
            :key="'r2-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row2"
            :key="'clone2-' + index"
            class="review-card"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p class="quote">"{{ review.text }}"</p>

            <div class="author">
              <div class="author-info">
                <span class="name">{{ review.name }}</span>
                <span class="rating">★★★★★</span>
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
  dynamicGap: string;
  titleWidth: number;
  titleWords: string[];
  titleIndex: number;
  row1: any[];
  row2: any[];
  setStaticTextRef: (el: any) => void;
  setHiddenSpanRef: (el: any) => void;
  setInner1Ref: (el: any) => void;
  setInner2Ref: (el: any) => void;
  startDrag: (event: MouseEvent | TouchEvent, trackNum: number) => void;
  setHover: (value: boolean, trackNum: number) => void;
  tiltCard: (event: MouseEvent) => void;
  resetTilt: (event: MouseEvent) => void;
}>();
</script>