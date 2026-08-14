<template>
  <div class="home-manifesto-stage">
    <div class="ada-manifesto-container">
      <div class="ada-scroll-line-wrapper" aria-hidden="true"></div>
      <div class="ada-manifesto-content">
        <h3
          ref="manifestoQuoteRef"
          class="ada-manifesto-text ada-split-quote scroll-reveal"
          id="manifesto-text"
          data-gsap-quote="true"
        >
          {{ manifestoCopy.quote }}
        </h3>
        <a href="/company" class="ada-manifesto-cta" :aria-label="manifestoCopy.ctaAria">
          <span class="ada-manifesto-cta-text" :data-text="manifestoCopy.cta">{{ manifestoCopy.cta }}</span>
          <span class="ada-manifesto-cta-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
            </svg>
          </span>
        </a>
      </div>
    </div>

    <slot name="before-references-title" />

    <div ref="titleContainerRef" class="ada-title-container">
      <h4 ref="titleRef" class="ada-giant-title">
        {{ manifestoCopy.brandsTitle }}
      </h4>
    </div>

    <div ref="loopContainerRef" class="ada-subtitle-container">
      <div ref="loopTrackRef" class="ada-loop-track">
        <div v-for="group in 2" :key="'brand-row-a-' + group" class="ada-loop-group" :aria-hidden="group === 2 ? 'true' : undefined">
          <span v-for="brand in primaryBrands" :key="group + brand.name" class="ada-loop-item">
            <img class="ada-brand-logo" :src="brand.src" :alt="brand.name">
          </span>
        </div>
      </div>
    </div>

    <div ref="loopContainerReverseRef" class="ada-subtitle-container-reverse">
      <div ref="loopTrackReverseRef" class="ada-loop-track-reverse">
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
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { locale } = useKardoorLocale();

const manifestoCopies: Record<string, {
  quote: string;
  cta: string;
  ctaAria: string;
  brandsTitle: string;
}> = {
  tr: {
    quote:
      "Bir kapının değeri yalnızca görünüşüyle değil; yıllara meydan okuyan dayanımı ve taşıdığı güvenle ölçülür. Tavizsiz işçilik ve doğru mühendislikle, sadece bir kapı değil güven üretiyoruz.",
    cta: "Hikâyemizi Keşfet",
    ctaAria: "Hakkımızda sayfasına git",
    brandsTitle: "Birlikte çalıştığımız markalar"
  },
  en: {
    quote:
      "The value of a door is measured not only by its appearance, but by the resilience it carries through the years and the confidence it gives every threshold. With uncompromising craft and precise engineering, we create more than doors; we create trust.",
    cta: "Discover Our Story",
    ctaAria: "Go to the about us page",
    brandsTitle: "Brands We Have Worked With"
  }
};

const manifestoCopy = computed(() => manifestoCopies[locale.value] ?? manifestoCopies.tr);

const manifestoQuoteRef = ref<HTMLElement | null>(null);
let quoteSplit: SplitText | null = null;
let quoteTimeline: gsap.core.Timeline | null = null;
let quoteScrollTrigger: ScrollTrigger | null = null;

const playQuoteEnter = () => {
  if (!quoteTimeline) return;

  quoteTimeline.pause(0).play("enter");
};

// Kurulum ERTELENDİ — sebep ölçüldü:
// SplitText açılışta 188 DOM elemanı (163 harf + 25 kelime) üretiyordu,
// sayfanın toplam DOM'unun %9'u. Üstelik bu bölüm ~7 ekran aşağıda; kullanıcı
// ilk ekrandayken oraya ait animasyon hazırlanıyordu.
let hazirlikTrigger: ScrollTrigger | null = null;

const kurManifestoAnimasyonu = () => {
  const quoteElement = manifestoQuoteRef.value;

  if (quoteElement && !quoteSplit) {
    quoteSplit = SplitText.create(quoteElement, {
      type: "words,chars",
      wordsClass: "ada-manifesto-word",
      charsClass: "ada-manifesto-char"
    });

    const chars = quoteSplit.chars as HTMLElement[];

    quoteTimeline = gsap.timeline({
      delay: 0.2,
      paused: true
    });

    quoteTimeline
      .addLabel("enter")
      .from(
        chars,
        {
          rotationY: -90,
          rotationX: 45,
          transformOrigin: "left center",
          opacity: 0,
          stagger: 0.018,
          duration: 0.46,
          ease: "power3.out"
        },
        "enter"
      )
      .addPause();

    quoteScrollTrigger = ScrollTrigger.create({
      trigger: quoteElement,
      start: "top 82%",
      endTrigger: ".ada-title-container",
      end: "top 54%",
      invalidateOnRefresh: true,
      onEnter: playQuoteEnter,
      once: true
    });

    // Trigger geç kurulduğu için konum bilgisi güncel değil; bir kez ölçtür.
    //
    // YALNIZ KENDİ trigger'ı — global ScrollTrigger.refresh() DEĞİL. Bu
    // kurulum kullanıcı bölüme yaklaşırken çalışıyor; global refresh o anda
    // hero'nun pin'ini ve komşu bölümlerin geometrisini de yeniden ölçüyordu.
    // Aynı kural HomeReferences'ta da yazılı: bir bölüm kendi ölçüsünü
    // tazeler, komşularının pin'ine dokunmaz.
    quoteScrollTrigger.refresh();

    // onEnter yalnızca GEÇİŞTE ateşler. Kurulum anında kullanıcı başlangıç
    // noktasını geçmişse hiç tetiklenmez ve harfler opacity:0 kalırdı.
    // Mevcut durumu bir kez senkronla.
    if (quoteScrollTrigger.isActive) playQuoteEnter();
  }
};

// ── BAŞLIK + LOGO TICKER'LARI ─────────────────────────────────────────────
// Bu blok HomeExperience'tan taşındı. Orada parent, bu bileşenin DOM'unu
// document.querySelector ile bulup ('.ada-giant-title', '.ada-loop-track' …)
// üzerine kendi animasyonlarını kuruyordu — yani manifesto'nun İKİ sahibi
// vardı. Artık her şey burada ve kök scope'a bağlı bir gsap.context içinde;
// dışarıdan global seçici ile erişim yok, unmount'ta tek revert temizliyor.
const titleRef = ref<HTMLElement | null>(null);
const titleContainerRef = ref<HTMLElement | null>(null);
const loopTrackRef = ref<HTMLElement | null>(null);
const loopContainerRef = ref<HTMLElement | null>(null);
const loopTrackReverseRef = ref<HTMLElement | null>(null);
const loopContainerReverseRef = ref<HTMLElement | null>(null);

const premiumEase = "power3.out";
const silkEase = "sine.inOut";

let brandsContext: ReturnType<typeof gsap.context> | null = null;
let brandsCleanup: Array<() => void> = [];

const splitTitleToFloatingChars = (element: HTMLElement) => {
  const text = (element.textContent || "").trim().replace(/\s+/g, " ");

  if (!text || element.dataset.floatReady === "true") return;

  element.innerHTML = "";
  element.dataset.floatReady = "true";

  text.split(" ").forEach((word, wordIndex, words) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "ada-title-float-word";

    Array.from(word).forEach((char, charIndex) => {
      const charSpan = document.createElement("span");
      charSpan.className = "ada-title-float-char";
      if (wordIndex === 0 && charIndex === 0) charSpan.classList.add("ada-first-letter");
      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
    });

    element.appendChild(wordSpan);
    if (wordIndex < words.length - 1) element.appendChild(document.createTextNode(" "));
  });
};

/** Sonsuz kayan logo şeridi + hover'da yumuşak duraklatma. */
const kurTicker = (track: HTMLElement, container: HTMLElement, reverse: boolean) => {
  const tween = reverse
    ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 160, ease: "none", repeat: -1 })
    : gsap.to(track, { xPercent: -50, duration: 160, ease: "none", repeat: -1 });

  gsap.fromTo(
    container,
    { opacity: 0, y: 70 },
    {
      opacity: 1,
      y: 0,
      duration: 1.75,
      ease: premiumEase,
      scrollTrigger: { trigger: container, start: "top 92%", end: "bottom 34%", scrub: 1.35 }
    }
  );

  const pause = () => gsap.to(tween, { timeScale: 0, duration: 1.6, ease: premiumEase });
  const play = () => gsap.to(tween, { timeScale: 1, duration: 1.8, ease: silkEase });

  container.addEventListener("mouseenter", pause);
  container.addEventListener("mouseleave", play);
  brandsCleanup.push(() => {
    container.removeEventListener("mouseenter", pause);
    container.removeEventListener("mouseleave", play);
  });
};

const kurMarkaAnimasyonlari = () => {
  brandsContext = gsap.context(() => {
    const titleContainer = titleContainerRef.value;
    const title = titleRef.value;

    if (titleContainer) titleContainer.style.setProperty("overflow", "visible", "important");

    if (title) {
      title.style.setProperty("overflow", "visible", "important");
      splitTitleToFloatingChars(title);

      gsap.fromTo(
        title.querySelectorAll(".ada-title-float-char"),
        { yPercent: 115, rotateX: -72, opacity: 0, scale: 0.96, filter: "blur(10px)" },
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.05,
          ease: "power4.out",
          stagger: { amount: 0.38, from: "center", ease: silkEase },
          scrollTrigger: { trigger: title, start: "top 92%", toggleActions: "play none none none", once: true }
        }
      );
    }

    if (loopTrackRef.value && loopContainerRef.value) {
      kurTicker(loopTrackRef.value, loopContainerRef.value, false);
    }
    if (loopTrackReverseRef.value && loopContainerReverseRef.value) {
      kurTicker(loopTrackReverseRef.value, loopContainerReverseRef.value, true);
    }
  }, manifestoQuoteRef.value?.closest("section") ?? undefined);
};

onMounted(async () => {
  await nextTick();

  kurMarkaAnimasyonlari();

  const quoteElement = manifestoQuoteRef.value;
  if (!quoteElement) return;

  // NOT: IntersectionObserver burada çalışmaz — sayfa ScrollSmoother ile
  // transform üzerinden kayıyor, IO'nun viewport kesişimi tetiklenmiyor
  // (denendi, animasyon hiç kurulmadı). ScrollTrigger smoother'ın scroll
  // pozisyonunu doğrudan okur.
  hazirlikTrigger = ScrollTrigger.create({
    trigger: quoteElement,
    // 2 ekran kala hazırla: kullanıcı varmadan animasyon hazır olsun,
    // ama açılış maliyeti ödenmesin.
    start: "top bottom+=200%",
    once: true,
    onEnter: kurManifestoAnimasyonu
  });
});

onBeforeUnmount(() => {
  hazirlikTrigger?.kill();
  hazirlikTrigger = null;
  quoteScrollTrigger?.kill();
  quoteScrollTrigger = null;
  quoteTimeline?.kill();
  quoteTimeline = null;
  quoteSplit?.revert();
  quoteSplit = null;

  // Marka bloğu: context tüm tween/ScrollTrigger'ları tek seferde geri alır,
  // listener'lar ayrıca sökülür.
  brandsContext?.revert();
  brandsContext = null;
  brandsCleanup.forEach((task) => task());
  brandsCleanup = [];
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
