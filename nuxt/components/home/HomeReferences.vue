<template>
  <section ref="sectionRef" class="home-references-flip" aria-labelledby="home-references-title">
    <img
      ref="imageRef"
      src="/images/homenight.jpeg"
      alt="Kardoor dis cephe referans gorseli"
      class="home-references-flip__image"
    >

    <section class="home-references-flip__intro">
      <p class="home-references-flip__eyebrow">Referans akisi</p>
      <h2 id="home-references-title">Projeyi once yakindan gorun.</h2>
      <p>
        Kardoor uygulamalarinda malzeme, olcu ve bitis hissini tek bir sahnede
        buyuterek anlatan scroll kontrollu bir referans gecisi.
      </p>
      <div class="home-references-flip__scroll-hint" aria-hidden="true">
        <span>Kaydir</span>
        <span></span>
      </div>
    </section>

    <section ref="initialRef" class="home-references-flip__panel home-references-flip__initial">
      <div class="home-references-flip__copy">
        <p class="home-references-flip__label">Baslangic</p>
        <h3>Detay kadrajindan proje kadrajina</h3>
        <p>
          Gorsel once metnin yaninda, normal akis icindeki kucuk bir isaretciye
          oturur. Scroll ilerledikce ayni gorsel final alanina tasinir.
        </p>
        <span>Flip.fit + ScrollTrigger scrub</span>
      </div>

      <div ref="startMarkerRef" class="home-references-flip__marker home-references-flip__marker--start">
      </div>
    </section>

    <section ref="finalRef" class="home-references-flip__panel home-references-flip__final">
      <div ref="finalMarkerRef" class="home-references-flip__marker home-references-flip__marker--final"></div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { gsap as GsapNamespace } from "gsap";

const sectionRef = ref<HTMLElement | null>(null);
const initialRef = ref<HTMLElement | null>(null);
const finalRef = ref<HTMLElement | null>(null);
const startMarkerRef = ref<HTMLElement | null>(null);
const finalMarkerRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

let flipContext: ReturnType<typeof GsapNamespace.context> | null = null;
let resizeHandler: (() => void) | null = null;

const setupFlip = async () => {
  const section = sectionRef.value;
  const initial = initialRef.value;
  const final = finalRef.value;
  const finalMarker = finalMarkerRef.value;
  const image = imageRef.value;

  if (!section || !initial || !final || !finalMarker || !image) return;

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger")
  ]);

  gsap.registerPlugin(ScrollTrigger);

  const getBounds = (element: HTMLElement) => {
    const sectionRect = section.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    return {
      height: rect.height,
      left: rect.left - sectionRect.left + section.scrollLeft,
      top: rect.top - sectionRect.top + section.scrollTop,
      width: rect.width
    };
  };

  const create = () => {
    flipContext?.revert();

    flipContext = gsap.context(() => {
      if (!imageRef.value || !startMarkerRef.value || !finalMarkerRef.value || !initialRef.value || !finalRef.value) return;

      gsap.fromTo(
        imageRef.value,
        {
          autoAlpha: 1,
          height: () => getBounds(startMarkerRef.value as HTMLElement).height,
          left: () => getBounds(startMarkerRef.value as HTMLElement).left,
          top: () => getBounds(startMarkerRef.value as HTMLElement).top,
          width: () => getBounds(startMarkerRef.value as HTMLElement).width
        },
        {
          height: () => getBounds(finalMarkerRef.value as HTMLElement).height,
          left: () => getBounds(finalMarkerRef.value as HTMLElement).left,
          top: () => getBounds(finalMarkerRef.value as HTMLElement).top,
          width: () => getBounds(finalMarkerRef.value as HTMLElement).width,
          ease: "none",
          immediateRender: true,
          scrollTrigger: {
            trigger: initialRef.value,
            start: "top 24%",
            endTrigger: finalRef.value,
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true
          }
        }
      );

    }, section);

    ScrollTrigger.refresh();
  };

  create();
  resizeHandler = create;
  window.addEventListener("resize", create);
};

onMounted(() => {
  nextTick(() => {
    setupFlip();
  });
});

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }

  flipContext?.revert();
  flipContext = null;
});
</script>
