<template>
  <div class="ada-carousel-wrapper ada-promo-wrapper">
    <button
      type="button"
      class="ada-promo-card"
      aria-label="Ege Kardoor tanıtım belgesini oynat"
      @click="openVideo"
    >
      <span class="ada-promo-media" aria-hidden="true">
        <img class="ada-promo-poster" :src="previewSrc" alt="">
        <span class="ada-promo-sheen"></span>
      </span>

      <span class="ada-promo-copy">
        <span class="ada-promo-kicker">Tanıtım Belgesi</span>
        <span class="ada-promo-title">Ege Kardoor'u yakından görün.</span>
        <span class="ada-promo-text">
          Üretim gücü, malzeme kalitesi ve proje yaklaşımını tek bir akışta izleyin.
        </span>
      </span>

      <span class="ada-promo-action" aria-hidden="true">
        <span class="ada-promo-play">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
          </svg>
        </span>
        <span class="ada-promo-action-text">Videoyu Oynat</span>
      </span>
    </button>
  </div>

  <Teleport to="body">
    <div class="ada-video-modal" :class="{ active: isVideoOpen }">
      <button
        type="button"
        class="ada-video-modal-overlay"
        aria-label="Tanıtım videosunu kapat"
        @click="closeVideo"
      ></button>

      <div class="ada-video-modal-panel" role="dialog" aria-modal="true" aria-label="Ege Kardoor tanıtım videosu">
        <div class="ada-video-modal-top">
          <div>
            <span class="ada-video-modal-kicker">Ege Kardoor</span>
            <h3>Tanıtım Belgesi</h3>
          </div>
          <button type="button" class="ada-video-close" aria-label="Kapat" @click="closeVideo">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="ada-video-stage">
          <video
            v-if="videoAvailable && !videoFailed"
            ref="videoRef"
            class="ada-video-player"
            :poster="posterSrc"
            controls
            playsinline
            preload="metadata"
            @error="videoFailed = true"
          >
            <source :src="videoSrc" type="video/mp4">
          </video>

          <img
            v-else
            class="ada-video-player ada-video-preview"
            :src="previewSrc"
            alt="Ege Kardoor kapı tanıtım önizlemesi"
          >
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const isVideoOpen = ref(false);
const videoFailed = ref(false);
const videoAvailable = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);

const videoSrc = "/videos/kardoor-intro.mp4";
const previewSrc = "/videos/kardoor-intro-preview.webp";
const posterSrc = "/images/doorrrender/render0060.png";

const openVideo = async () => {
  isVideoOpen.value = true;
  document.body.style.overflow = "hidden";

  await nextTick();
  videoRef.value?.play().catch(() => undefined);
};

const closeVideo = () => {
  isVideoOpen.value = false;
  document.body.style.overflow = "";

  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.currentTime = 0;
  }
};

onMounted(async () => {
  try {
    const response = await fetch(videoSrc, { method: "HEAD" });
    videoAvailable.value = response.ok;
  } catch {
    videoAvailable.value = false;
  }
});

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>
