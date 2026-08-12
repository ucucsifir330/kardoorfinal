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
    // Pin'ler birkaç frame içinde kurulabildiği için tek refresh yetmiyordu;
    // eskiden SABİT 8 frame refresh atılıyordu. Ama refresh() TÜM sayfanın
    // geometrisini yeniden ölçer — canlıda ölçülen 965ms forced reflow'un
    // büyük kısmı bu tekrarlardan geliyordu.
    //
    // Yeni davranış: trigger SAYISI sabitlenene kadar ölç, sabitlenince dur.
    // Tipik durumda 2-3 frame'de biter; en kötü ihtimalde eski 8 frame tavanı
    // korunur, yani davranış hiçbir zaman eskisinden kötü olamaz.
    let frame = 0;
    let oncekiSayi = -1;
    let sabitFrame = 0;

    const tick = () => {
      ScrollTrigger.refresh();

      const sayi = ScrollTrigger.getAll().length;
      sabitFrame = sayi === oncekiSayi ? sabitFrame + 1 : 0;
      oncekiSayi = sayi;

      // Arka arkaya 2 frame boyunca yeni trigger kurulmadıysa iş bitti.
      if (sabitFrame >= 2 || ++frame >= 8) return;
      requestAnimationFrame(tick);
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
