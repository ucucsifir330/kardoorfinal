<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const shouldRender = ref(false);
const mountRef = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let renderFrame: number | null = null;
let renderFallbackTimer = 0;

const refreshScrollTriggers = async () => {
  try {
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    // HomeExperience LAZY mount edilir; içindeki EntranceDoorLab'ın pinli ScrollTrigger'ı
    // bu noktadan birkaç frame sonra kurulur. Tek bir refresh, pin var olmadan çalışıp
    // boşa gidebiliyor (pin sonra ScrollSmoother'ın güncel transform'una göre kurulup
    // section'ı kaydırıyor → kenarda zemin şeridi). Birkaç frame boyunca yeniden ölç
    // ki geç kurulan pin de temiz hizalansın. refresh() idempotent.
    let frame = 0;
    const tick = () => {
      ScrollTrigger.refresh();
      if (++frame < 8) requestAnimationFrame(tick);
    };
    tick();
  } catch {
    // The page still works without GSAP refresh; this only keeps scroll-linked reveals in sync.
  }
};

const renderFlow = () => {
  if (shouldRender.value) return;
  shouldRender.value = true;
  observer?.disconnect();
  observer = null;

  requestAnimationFrame(() => {
    refreshScrollTriggers();
  });
};

const scheduleRenderFlow = () => {
  if (shouldRender.value || renderFrame) return;

  const run = () => {
    renderFrame = null;
    window.clearTimeout(renderFallbackTimer);
    renderFallbackTimer = 0;
    renderFlow();
  };

  renderFrame = window.requestAnimationFrame(run);
  renderFallbackTimer = window.setTimeout(run, 120);
};

onMounted(() => {
  // LCP DUZELTMESI — hero'yu rAF beklemeden SENKRON mount et.
  //
  // Olculen sorun: hero (LCP elemani) rAF arkasinda mount ediliyordu.
  // ScrollSmoother "app:mounted"ta hero HENUZ YOKKEN kuruluyor, hero sonradan
  // gelince translateY(1400px) ile ekran disinda konumlaniyor ve
  // ScrollTrigger.refresh() 8 frame boyunca duzeltmeye calisiyordu.
  // Sonuc: gorsel 131ms'de hazir, ekrana 4784ms'de ciziliyordu (%97.6 render delay).
  //
  // Senkron mount edince ScrollSmoother hero'yu GORE­REK kuruluyor, duzeltme
  // turuna gerek kalmiyor. Alttaki rAF/timeout yolu yalnizca guvenlik agi
  // olarak duruyor (shouldRender zaten true ise no-op).
  shouldRender.value = true;

  scheduleRenderFlow();

  if (mountRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) renderFlow();
      },
      { rootMargin: "1600px 0px", threshold: 0.01 }
    );
    observer.observe(mountRef.value);
  }
});

onBeforeUnmount(() => {
  if (renderFrame) window.cancelAnimationFrame(renderFrame);
  window.clearTimeout(renderFallbackTimer);
  observer?.disconnect();
});
</script>

<template>
  <div ref="mountRef" class="home-content-loader">
    <ClientOnly>
      <LazyHomeExperience v-if="shouldRender" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.home-content-loader {
  min-height: 1px;
}
</style>
