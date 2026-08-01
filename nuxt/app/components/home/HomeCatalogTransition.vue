<template>
  <section ref="stackRef" class="home-catalog-reference-stack">
    <div ref="holdRef" class="home-catalog-reference-stack__catalog">
      <div ref="pinRef" class="home-catalog-reference-stack__catalog-pin">
        <div ref="frameRef" class="home-catalog-reference-stack__catalog-frame">
          <slot name="catalog" />
        </div>
      </div>
    </div>

    <div class="home-catalog-reference-stack__references">
      <section class="ada-team-section">
        <slot name="references" />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * HomeCatalogTransition — katalog → referanslar geçişinin TEK sahibi.
 *
 * Bu davranış yalnız HomeCatalog'a ait değil: katalog ile referanslar
 * ARASINDAKİ yapısal geçişi yönetiyor (frame ölçüsü, pin geometrisi, perde
 * parallax'ı). O yüzden ikisinden birinin içine değil, aralarındaki bu
 * bileşene taşındı. Eskiden HomeExperience'ta duruyordu; parent hem
 * orkestratör hem de bu geçişin motoruydu.
 *
 * Sorumluluğu:
 *  • Katalog frame yüksekliğinin ölçülüp --catalog-handoff-height'a yazılması
 *  • Pin başlangıç/bitiş geometrisi (GSAP native pin)
 *  • Perde (curtain) parallax progress'i
 *  • Kendi ResizeObserver'ı ve kendi ScrollTrigger'larının temizliği
 */
import { onBeforeUnmount, onMounted, nextTick, ref } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const stackRef = ref<HTMLElement | null>(null);
const holdRef = ref<HTMLElement | null>(null);
const pinRef = ref<HTMLElement | null>(null);
const frameRef = ref<HTMLElement | null>(null);

let resizeObserver: ResizeObserver | null = null;
let heightFrame = 0;
let pinTrigger: ScrollTrigger | null = null;
let curtainTween: gsap.core.Tween | null = null;

/** Katalog frame'inin gerçek yüksekliğini hold elemanına yazar. */
const updateHeight = () => {
  heightFrame = 0;

  const hold = holdRef.value;
  const frame = frameRef.value;
  if (!hold || !frame) return;

  hold.style.setProperty("--catalog-handoff-height", `${frame.scrollHeight}px`);
};

const requestHeight = () => {
  if (heightFrame) return;
  heightFrame = window.requestAnimationFrame(updateHeight);
};

onMounted(() => {
  nextTick(() => {
    requestHeight();
    requestAnimationFrame(requestHeight);

    if (frameRef.value) {
      resizeObserver = new ResizeObserver(requestHeight);
      resizeObserver.observe(frameRef.value);
    }

    // Pin GSAP'in NATIVE pin'i ile yapılıyor. Eskiden onUpdate her scroll
    // frame'inde getBoundingClientRect okuyup translate3d yazıyordu (manuel
    // pin emülasyonu) → sürekli layout reflow, FPS düşüşünün ana
    // kaynaklarından. ScrollTrigger pin'i ScrollSmoother ile uyumlu çalışır ve
    // transform'u kendi yönetir; scroll'da bizim JS'imiz hiç çalışmaz.
    // frame viewport'tan kısa olduğu için onu alt kenara yapıştırıyoruz.
    // Masaüstü (>760) dışında pin yok.
    if (frameRef.value && window.innerWidth > 760) {
      pinTrigger = ScrollTrigger.create({
        trigger: frameRef.value,
        // frame'in altı viewport altına değince yapış (sticky bottom eşdeğeri)
        start: () => "bottom bottom",
        // hold'un (catalog) altı, viewport altına gelince bırak
        endTrigger: holdRef.value,
        end: "bottom bottom",
        pin: pinRef.value,
        pinSpacing: false,
        invalidateOnRefresh: true
      });
    }

    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(() => {
        requestHeight();
        ScrollTrigger.refresh();
      });
    }

    // PERDE (parallax): katalog stack scroll'dan daha hızlı yukarı gelir →
    // "Kurgulayın" panelinin/CTA'ların üzerine biner. --catalog-curtain-y 0'dan
    // -extra'ya scrub edilir. Pin transform'a değil pin div'ine dokunduğu için
    // çakışmaz (ayrı katman). Sadece masaüstü.
    if (stackRef.value && window.innerWidth > 760) {
      const extra =
        parseFloat(
          getComputedStyle(stackRef.value).getPropertyValue("--catalog-curtain-extra")
        ) || 240;

      curtainTween = gsap.fromTo(
        stackRef.value,
        { "--catalog-curtain-y": "0px" },
        {
          "--catalog-curtain-y": `${-extra}px`,
          ease: "none",
          scrollTrigger: {
            trigger: stackRef.value,
            start: "top bottom",
            end: "top center",
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    }
  });

  window.addEventListener("resize", requestHeight);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;

  pinTrigger?.kill();
  pinTrigger = null;

  curtainTween?.scrollTrigger?.kill();
  curtainTween?.kill();
  curtainTween = null;

  if (heightFrame) {
    cancelAnimationFrame(heightFrame);
    heightFrame = 0;
  }

  if (pinRef.value) pinRef.value.style.transform = "";

  window.removeEventListener("resize", requestHeight);
});
</script>
