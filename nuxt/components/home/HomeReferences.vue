<template>
  <section ref="sectionRef" class="home-references-flip" aria-labelledby="home-references-title">
    <img
      ref="imageRef"
      src="/images/homenight.jpeg"
      alt="Kardoor dis cephe referans gorseli"
      class="home-references-flip__image"
    >

    <section class="home-references-flip__intro">
      <p class="home-references-flip__eyebrow">KURUMSAL BELGESEL</p>
      <h2 id="home-references-title">
        Sınırların nasıl çizildiğine<br>
        tanık olun.
      </h2>
      <p>
        Ege Kardoor’un üretim felsefesi. Ham çeliğin, yüksek mühendislik ve
        tasarım vizyonuyla premium bir mimari elemente dönüşme serüveni.
      </p>
      <div class="home-references-flip__scroll-hint" aria-hidden="true">
        <span></span>
      </div>
    </section>

    <section ref="initialRef" class="home-references-flip__panel home-references-flip__initial">
      <div class="home-references-flip__copy">
        <p class="home-references-flip__label">ÜRETİMİN RİTMİ</p>
        <h3>
          Mikro detaylardan,<br>
          makro projelere.
        </h3>
        <p>
          Sadece bir güvenlik önlemi değil, yapının karakterini belirleyen o
          ilk temas noktası. Hassas kesimlerden kusursuz yüzey bitişlerine
          kadar, fabrikamızdaki teknoloji ve zanaat entegrasyonunu keşfedin.
        </p>
        <span></span>
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
