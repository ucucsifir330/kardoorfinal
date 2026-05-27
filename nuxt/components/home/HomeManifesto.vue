<template>
  <div ref="ctaLineStageRef" class="ada-manifesto-line-stage">
    <svg
      ref="ctaLineSvgRef"
      class="ada-structural-lines"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <path ref="ctaTopLineRef" class="ada-structural-line-path" />
      <path ref="ctaBottomLineRef" class="ada-structural-line-path" />
    </svg>
    <div ref="ctaSpacerRef" class="ada-manifesto-spacer">
    <div class="ada-spacer-copy">
      <h2 class="ada-config-heading" aria-label="Kapınızı yalnızca seçmeyin. Kurgulayın.">
        <span class="ada-heading-k" aria-hidden="true">
          <span class="ada-heading-reveal-char">K</span>
        </span><span
          v-for="(char, index) in headingFirstLineTail"
          :key="'heading-line-a-' + index"
          class="ada-heading-reveal-char"
          aria-hidden="true"
        >{{ char === " " ? "\u00A0" : char }}</span><br><span
          v-for="(char, index) in headingSecondLine"
          :key="'heading-line-b-' + index"
          class="ada-heading-reveal-char"
          aria-hidden="true"
        >{{ char === " " ? "\u00A0" : char }}</span>
      </h2>
      <p class="ada-spacer-manifesto-copy">
        Ege Kardoor kapı konfigüratörüyle
        <span class="manifesto-highlight" data-text="seri, yüzey, renk, cam, kol">seri, yüzey, renk, cam, kol</span> ve
        <span class="manifesto-highlight" data-text="detay">detay</span> seçeneklerini kendi projenize göre deneyimleyin.
        Beğendiğiniz tasarımı bizimle paylaşın,
        <span class="manifesto-highlight" data-text="showroom">showroom</span> veya
        <span class="manifesto-highlight" data-text="proje ekibimiz">proje ekibimiz</span> sizin için netleştirsin.
      </p>
      <div class="ada-spacer-cta-group" aria-label="Konfigüratör ve koleksiyon bağlantıları">
        <a href="/catalog" class="ada-manifesto-cta ada-spacer-cta" aria-label="Konfigüratörü deneyin">
          <span class="ada-manifesto-cta-text" data-text="Konfigüratörü Deneyin">Konfigüratörü Deneyin</span>
          <span class="ada-manifesto-cta-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
            </svg>
          </span>
        </a>
        <a href="/catalog" class="ada-manifesto-cta ada-spacer-cta ada-spacer-cta--icon-left" aria-label="Koleksiyonu keşfet">
          <span class="ada-manifesto-cta-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="ada-manifesto-cta-text" data-text="Koleksiyonu Keşfet">Koleksiyonu Keşfet</span>
        </a>
      </div>
    </div>
  </div>

  <div ref="manifestoContainerRef" class="ada-manifesto-container">
    <div class="ada-scroll-line-wrapper" aria-hidden="true"></div>
    <div class="ada-manifesto-content">
      <h3 class="ada-manifesto-text scroll-reveal" id="manifesto-text">
        Bir kapının değeri yalnızca görünüşüyle değil; yıllara meydan okuyan dayanımı ve taşıdığı güvenle ölçülür. Tavizsiz işçilik ve doğru mühendislikle, sadece bir kapı değil güven üretiyoruz.
      </h3>
      <a href="/company" class="ada-manifesto-cta" aria-label="Hakkımızda sayfasına git">
        <span class="ada-manifesto-cta-text" data-text="Hikâyemizi Keşfet">Hikâyemizi Keşfet</span>
        <span class="ada-manifesto-cta-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
          </svg>
        </span>
      </a>
    </div>
  </div>
  </div>

  <slot name="after-manifesto" />

  <div class="ada-title-container">
    <h4 class="ada-giant-title">
      Referanslarımız
    </h4>
  </div>

  <div class="ada-subtitle-container">
    <div class="ada-loop-track">
      <div v-for="group in 2" :key="'brand-row-a-' + group" class="ada-loop-group" :aria-hidden="group === 2 ? 'true' : undefined">
        <span v-for="brand in primaryBrands" :key="group + brand.name" class="ada-loop-item">
          <img class="ada-brand-logo" :src="brand.src" :alt="brand.name">
        </span>
      </div>
    </div>
  </div>

  <div class="ada-subtitle-container-reverse">
    <div class="ada-loop-track-reverse">
      <div v-for="group in 2" :key="'brand-row-b-' + group" class="ada-loop-group" :aria-hidden="group === 2 ? 'true' : undefined">
        <span v-for="brand in secondaryBrands" :key="group + brand.name" class="ada-loop-item">
          <span v-if="brand.name === 'Microsoft'" class="ada-brand-logo ada-brand-logo-microsoft" aria-label="Microsoft" role="img">
            <svg class="ada-brand-logo-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4h26v26H4V4Zm30 0h26v26H34V4ZM4 34h26v26H4V34Zm30 0h26v26H34V34Z" fill="currentColor"/>
            </svg>
          </span>
          <img v-else class="ada-brand-logo" :src="brand.src" :alt="brand.name">
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap } from "gsap";

const ctaLineStageRef = ref<HTMLElement | null>(null);
const ctaSpacerRef = ref<HTMLElement | null>(null);
const manifestoContainerRef = ref<HTMLElement | null>(null);
const ctaLineSvgRef = ref<SVGSVGElement | null>(null);
const ctaTopLineRef = ref<SVGPathElement | null>(null);
const ctaBottomLineRef = ref<SVGPathElement | null>(null);
const headingFirstLineTail = Array.from("apınızı yalnızca seçmeyin.");
const headingSecondLine = Array.from("Kurgulayın.");

let ctaResizeObserver: ResizeObserver | null = null;
let ctaMeasureFrame = 0;
let headingRevealTimeline: gsap.core.Timeline | null = null;

const getResponsiveClamp = (min: number, preferredVw: number, max: number) =>
  Math.min(Math.max(window.innerWidth * preferredVw, min), max);

const getResponsiveVhClamp = (min: number, preferredVh: number, max: number) =>
  Math.min(Math.max(window.innerHeight * preferredVh, min), max);

const updateCtaLineGeometry = () => {
  if (ctaMeasureFrame) window.cancelAnimationFrame(ctaMeasureFrame);

  ctaMeasureFrame = window.requestAnimationFrame(() => {
    ctaMeasureFrame = 0;

    const lineStage = ctaLineStageRef.value;
    const spacer = ctaSpacerRef.value;
    const manifestoContainer = manifestoContainerRef.value;
    const lineSvg = ctaLineSvgRef.value;
    const topPath = ctaTopLineRef.value;
    const bottomPath = ctaBottomLineRef.value;
    const title = spacer?.querySelector<HTMLElement>(".ada-spacer-copy h2");
    const headingK = spacer?.querySelector<HTMLElement>(".ada-heading-k");
    const button = spacer?.querySelector<HTMLElement>(".ada-spacer-cta");
    const catalogSection = document.querySelector<HTMLElement>(".catalog-section");

    if (!lineStage || !spacer || !manifestoContainer || !lineSvg || !topPath || !bottomPath || !title || !headingK || !button) return;

    const stageRect = lineStage.getBoundingClientRect();
    const catalogRect = catalogSection?.getBoundingClientRect();
    const spacerRect = spacer.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const headingKRect = headingK.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const stageWidth = Math.min(window.innerWidth, 1920);
    const stageLeft = Math.max((window.innerWidth - stageWidth) / 2, 0);
    const lineX = stageLeft + getResponsiveClamp(18, 0.021875, 42);
    const radius = getResponsiveClamp(28, 0.016667, 34);
    const catalogLineStartY = catalogRect
      ? catalogRect.top - stageRect.top + getResponsiveVhClamp(248, 0.25, 310)
      : 0;
    const topY = Math.min(catalogLineStartY, 0);
    const kJoinX = headingKRect.left - stageRect.left + getResponsiveClamp(10, 0.007, 14);
    const kStemBottomY = headingKRect.bottom - stageRect.top - getResponsiveClamp(16, 0.0098, 20);
    const topElbowY = Math.max(topY + radius, kStemBottomY);
    const buttonAnchorX = buttonRect.left - stageRect.left + buttonRect.width * 0.5;
    const buttonCenterY = buttonRect.top - stageRect.top + buttonRect.height * 0.5;
    const bottomElbowX = Math.min(buttonAnchorX - radius, lineX + radius);
    const bottomEndY = stageRect.height;

    spacer.style.setProperty("--cta-heading-left", `${titleRect.left - spacerRect.left}px`);
    spacer.style.setProperty(
      "--cta-k-stem-bottom-y",
      `${headingKRect.bottom - spacerRect.top}px`
    );
    spacer.style.setProperty(
      "--cta-button-anchor-x",
      `${buttonRect.left - spacerRect.left + buttonRect.width * 0.5}px`
    );
    spacer.style.setProperty(
      "--cta-button-center-y",
      `${buttonRect.top - spacerRect.top + buttonRect.height * 0.5}px`
    );

    lineSvg.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);
    topPath.setAttribute(
      "d",
      `M ${lineX} ${topY} V ${topElbowY - radius} Q ${lineX} ${topElbowY} ${lineX + radius} ${topElbowY} H ${kJoinX}`
    );
    bottomPath.setAttribute(
      "d",
      `M ${buttonAnchorX} ${buttonCenterY} H ${bottomElbowX} Q ${lineX} ${buttonCenterY} ${lineX} ${buttonCenterY + radius} V ${bottomEndY}`
    );

    window.dispatchEvent(new CustomEvent("kardoor:structural-lines-updated"));
  });
};

onMounted(async () => {
  await nextTick();
  updateCtaLineGeometry();

  const headingChars = Array.from(ctaSpacerRef.value?.querySelectorAll<HTMLElement>(".ada-heading-reveal-char") || []);
  const spacerManifestoCopy = ctaSpacerRef.value?.querySelector<HTMLElement>(".ada-spacer-manifesto-copy");
  const spacerHighlightWords = Array.from(ctaSpacerRef.value?.querySelectorAll<HTMLElement>(".manifesto-highlight") || []);
  const playHeadingReveal = () => headingRevealTimeline?.play(0);
  const resetHeadingReveal = () => headingRevealTimeline?.pause(0);

  if (spacerManifestoCopy) {
    gsap.set(spacerManifestoCopy, {
      autoAlpha: 0,
      filter: "blur(18px)",
      y: 20
    });
  }

  if (spacerHighlightWords.length) {
    gsap.set(spacerHighlightWords, {
      "--wipe": 0,
      "--wipe-clip": "100%"
    });
  }

  headingRevealTimeline = gsap.timeline({ paused: true })
    .fromTo(
      headingChars,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.72,
        stagger: 0.024,
        ease: "power4.out"
      }
    )
    .to(
      spacerManifestoCopy,
      {
        autoAlpha: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.78,
        ease: "power3.out"
      },
      "-=0.08"
    )
    .to(
      spacerHighlightWords,
      {
        "--wipe": 1,
        "--wipe-clip": "0%",
        duration: 0.9,
        ease: "power3.out",
        stagger: {
          each: 0.085,
          from: "start"
        }
      },
      "-=0.18"
    );

  window.addEventListener("kardoor:heading-line-connected", playHeadingReveal);
  window.addEventListener("kardoor:heading-line-reset", resetHeadingReveal);

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateCtaLineGeometry).catch(() => undefined);
  }

  const spacer = ctaSpacerRef.value;
  const lineStage = ctaLineStageRef.value;
  const manifestoContainer = manifestoContainerRef.value;
  const title = spacer?.querySelector<HTMLElement>(".ada-spacer-copy h2");
  const headingK = spacer?.querySelector<HTMLElement>(".ada-heading-k");
  const button = spacer?.querySelector<HTMLElement>(".ada-spacer-cta");
  const buttonGroup = spacer?.querySelector<HTMLElement>(".ada-spacer-cta-group");

  ctaResizeObserver = new ResizeObserver(updateCtaLineGeometry);

  [lineStage, spacer, manifestoContainer, title, headingK, button, buttonGroup]
    .filter(Boolean)
    .forEach((element) => ctaResizeObserver?.observe(element as HTMLElement));

  window.addEventListener("resize", updateCtaLineGeometry, { passive: true });

  onBeforeUnmount(() => {
    window.removeEventListener("kardoor:heading-line-connected", playHeadingReveal);
    window.removeEventListener("kardoor:heading-line-reset", resetHeadingReveal);
  });
});

onBeforeUnmount(() => {
  if (ctaMeasureFrame) window.cancelAnimationFrame(ctaMeasureFrame);
  headingRevealTimeline?.kill();
  headingRevealTimeline = null;
  ctaResizeObserver?.disconnect();
  ctaResizeObserver = null;
  window.removeEventListener("resize", updateCtaLineGeometry);
});

const primaryBrands = [
  { name: "Apple", src: "https://cdn.simpleicons.org/apple/EAE8E8" },
  { name: "Nike", src: "https://cdn.simpleicons.org/nike/EAE8E8" },
  { name: "Tesla", src: "https://cdn.simpleicons.org/tesla/EAE8E8" },
  { name: "Sony", src: "https://cdn.simpleicons.org/sony/EAE8E8" },
  { name: "Meta", src: "https://cdn.simpleicons.org/meta/EAE8E8" },
  { name: "Google", src: "https://cdn.simpleicons.org/google/EAE8E8" },
  { name: "IKEA", src: "https://cdn.simpleicons.org/ikea/EAE8E8" },
  { name: "McDonald's", src: "https://cdn.simpleicons.org/mcdonalds/EAE8E8" },
  { name: "Visa", src: "https://cdn.simpleicons.org/visa/EAE8E8" },
  { name: "BMW", src: "https://cdn.simpleicons.org/bmw/EAE8E8" }
];

const secondaryBrands = [
  { name: "Adidas", src: "https://cdn.simpleicons.org/adidas/EAE8E8" },
  { name: "Mastercard", src: "https://cdn.simpleicons.org/mastercard/EAE8E8" },
  { name: "Netflix", src: "https://cdn.simpleicons.org/netflix/EAE8E8" },
  { name: "Samsung", src: "https://cdn.simpleicons.org/samsung/EAE8E8" },
  { name: "Spotify", src: "https://cdn.simpleicons.org/spotify/EAE8E8" },
  { name: "Puma", src: "https://cdn.simpleicons.org/puma/EAE8E8" },
  { name: "Toyota", src: "https://cdn.simpleicons.org/toyota/EAE8E8" },
  { name: "Honda", src: "https://cdn.simpleicons.org/honda/EAE8E8" },
  { name: "Microsoft", src: "" },
  { name: "NVIDIA", src: "https://cdn.simpleicons.org/nvidia/EAE8E8" }
];
</script>
