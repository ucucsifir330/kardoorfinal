<template>
  <!-- Mobil/masaüstü ayrımı yalnız istemcide bilinir (viewport + pointer),
       o yüzden İNTERAKTİF sahne ClientOnly'de kalır: sunucu masaüstünü basıp
       mobilde hydration uyuşmazlığı üretmesin.

       Ama SSR fallback'i artık boş bir div DEĞİL — sayfanın ana başlığı, alt
       başlığı, CTA'sı ve hero görseli burada, sunucu çıktısında. Böylece
       arama motoru gerçek içerik görür ve tarayıcının preload scanner'ı
       hero'yu HTML'den bulabilir (JS'i beklemeden). Sahne mount olunca bu
       kabuğun yerini alır; metin birebir aynı kaynaktan (useEntranceCopy)
       geldiği için görsel sıçrama olmaz. -->
  <ClientOnly>
    <EntranceDoorMobile v-if="isMobileEntrance" />
    <EntranceDoorLab v-else />
    <template #fallback>
      <section class="entrance-ssr-shell">
        <img
          :src="ssrHeroSrc"
          class="entrance-ssr-shell__bg"
          fetchpriority="high"
          decoding="async"
          alt="Kardoor giriş görseli"
          draggable="false"
        />
        <div class="entrance-ssr-shell__copy">
          <h1 class="entrance-ssr-shell__heading">
            <span>{{ entranceCopy.line1 }}</span>
            <span class="entrance-ssr-shell__heading-accent">
              <em>{{ entranceCopy.accent }}</em> {{ entranceCopy.line2 }}
            </span>
          </h1>
          <p class="entrance-ssr-shell__subtitle">
            {{ entranceCopy.subtitleLead
            }}{{ entranceCopy.subtitleAccent ? " " : ""
            }}<em v-if="entranceCopy.subtitleAccent">{{ entranceCopy.subtitleAccent }}</em>
          </p>
          <div class="entrance-ssr-shell__cta">
            <AdaCtaButton
              :label="entranceCopy.ctaLabel"
              href="/catalog"
              variant="filled"
              icon-position="none"
            />
          </div>
        </div>
      </section>
    </template>
  </ClientOnly>
  <section ref="catalogStackRef" class="home-catalog-reference-stack">
    <div ref="catalogHandoffRef" class="home-catalog-reference-stack__catalog">
      <div ref="catalogHandoffPinRef" class="home-catalog-reference-stack__catalog-pin">
        <div ref="catalogHandoffFrameRef" class="home-catalog-reference-stack__catalog-frame">
          <HomeCatalog />
        </div>
      </div>
    </div>

    <div class="home-catalog-reference-stack__references">
      <section class="ada-team-section">
        <HomeReferences />
        <HomeManifesto :key="locale" />
      </section>
    </div>
  </section>
  <div class="home-reviews-runtime">
    <HomeReviews />
  </div>
</template><script setup lang="ts">
// @ts-nocheck
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useKardoorLocale } from '~/composables/useKardoorLocale'
import { useEntranceCopy } from '~/composables/useEntranceCopy'
import { useShowroomAmbience } from '~/composables/useShowroomAmbience'
import AdaCtaButton from '~/components/home/AdaCtaButton.vue'



let manifestoGsapContext: ReturnType<typeof gsap.context> | null = null;
let manifestoCleanupTasks: Array<() => void> = [];

const premiumEase = 'power3.out';
const silkEase = 'sine.inOut';
const smoothScrollScrub = 3.2;


const isMobileEntrance = ref(
  typeof window !== 'undefined' &&
    window.innerWidth <= 1024 &&
    window.matchMedia('(pointer: coarse)').matches
);

// SSR kabuğunun metni — interaktif sahnelerle AYNI kaynak, yoksa sunucu
// çıktısı ile mount sonrası metin ayrışır.
const { copy: entranceCopy } = useEntranceCopy();
const { isNight } = useShowroomAmbience();

// Sunucu viewport oranını bilemez; varyant seçimi mount'ta placeDoor() ile
// yapılıyor. Kabukta en yaygın masaüstü oranı (16:9) kullanılır — sahne
// mount olunca doğru varyantla değişir. Tema ise inline script'ten gelen
// sınıfla SSR'da doğru biliniyor.
const ssrHeroSrc = computed(() =>
  isNight.value ? '/hero-night-16x9.avif' : '/hero-day-16x9.avif'
);

const { locale } = useKardoorLocale();


const catalogStackRef = ref<HTMLElement | null>(null);
const catalogHandoffRef = ref<HTMLElement | null>(null);
const catalogHandoffPinRef = ref<HTMLElement | null>(null);
const catalogHandoffFrameRef = ref<HTMLElement | null>(null);

let catalogHandoffObserver: ResizeObserver | null = null;
let catalogHandoffFrame = 0;
let catalogHandoffPinFrame = 0;
let catalogHandoffTrigger: ScrollTrigger | null = null;
let catalogCurtainTween: gsap.core.Tween | null = null;








const updateCatalogHandoffHeight = () => {
  catalogHandoffFrame = 0;

  const hold = catalogHandoffRef.value;
  const frame = catalogHandoffFrameRef.value;

  if (!hold || !frame) return;

  const frameHeight = frame.scrollHeight;
  hold.style.setProperty('--catalog-handoff-height', `${frameHeight}px`);
};

const requestCatalogHandoffHeight = () => {
  if (catalogHandoffFrame) return;

  catalogHandoffFrame = window.requestAnimationFrame(updateCatalogHandoffHeight);
};

// Manuel pin (updateCatalogHandoffPin / requestCatalogHandoffPin) KALDIRILDI →
// artık GSAP native pin'i kullanılıyor (aşağıdaki onMounted ScrollTrigger.create).
// Eskisi her scroll frame'inde getBoundingClientRect+transform yapıyordu (FPS katili).
const requestCatalogHandoffPin = () => {};


const addManifestoCleanup = (task: () => void) => {
  manifestoCleanupTasks.push(task);
};

const splitTextToRevealChars = (element: HTMLElement) => {
  const text = element.textContent?.trim().replace(/\s+/g, ' ') || '';

  if (!text || element.dataset.revealReady === 'true') return;

  element.innerHTML = '';
  element.dataset.revealReady = 'true';

  text.split(' ').forEach((word, index, words) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'reveal-word';

    if (word.includes('Ege') || word.includes('Kardoor')) {
      wordSpan.classList.add('brand-gradient-word');
    }

    Array.from(word).forEach((char) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'reveal-char';
      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
    });

    element.appendChild(wordSpan);

    if (index < words.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });
};

const splitTitleToFloatingChars = (element: HTMLElement) => {
  const text = (element.textContent || 'Yönetim Kadrosu').trim().replace(/\s+/g, ' ');

  if (!text || element.dataset.floatReady === 'true') return;

  element.innerHTML = '';
  element.dataset.floatReady = 'true';

  text.split(' ').forEach((word, wordIndex, words) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'ada-title-float-word';

    Array.from(word).forEach((char, charIndex) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'ada-title-float-char';

      if (wordIndex === 0 && charIndex === 0) {
        charSpan.classList.add('ada-first-letter');
      }

      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
    });

    element.appendChild(wordSpan);

    if (wordIndex < words.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });
};

const initManifestoAnimations = () => {
  if (manifestoGsapContext) {
    manifestoGsapContext.revert();
    manifestoGsapContext = null;
  }

  manifestoCleanupTasks.forEach((task) => task());
  manifestoCleanupTasks = [];

  manifestoGsapContext = gsap.context(() => {
    const revealElement = document.querySelector<HTMLElement>('#manifesto-text');
    const titleElement = document.querySelector<HTMLElement>('.ada-giant-title');
    const titleContainer = document.querySelector<HTMLElement>('.ada-title-container');
    const loopTrack = document.querySelector<HTMLElement>('.ada-loop-track');
    const loopContainer = document.querySelector<HTMLElement>('.ada-subtitle-container');
    const loopTrackReverse = document.querySelector<HTMLElement>('.ada-loop-track-reverse');
    const loopContainerReverse = document.querySelector<HTMLElement>('.ada-subtitle-container-reverse');

    if (revealElement && revealElement.dataset.gsapQuote !== 'true') {
      splitTextToRevealChars(revealElement);
      const chars = Array.from(revealElement.querySelectorAll<HTMLElement>('.reveal-char'));
      let revealFrame = 0;

      const updateManifestoReveal = (progress: number) => {
        const staggerWindow = 0.68;
        const activeWindow = 1 - staggerWindow;
        const maxIndex = Math.max(chars.length - 1, 1);

        chars.forEach((char, index) => {
          const start = (index / maxIndex) * staggerWindow;
          const localProgress = Math.min(Math.max((progress - start) / activeWindow, 0), 1);
          const easedProgress = gsap.parseEase(silkEase)(localProgress);

          char.style.opacity = String(0.12 + easedProgress * 0.88);
          char.style.filter = 'none';
          char.style.transform = 'none';
        });
      };

      const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1);

      const updateManifestoRevealFromScroll = () => {
        revealFrame = 0;
        const viewportHeight = window.innerHeight || 1;
        const rect = revealElement.getBoundingClientRect();
        const top = window.scrollY + rect.top;
        const bottom = top + rect.height;
        const start = top - viewportHeight * 0.94;
        const end = bottom - viewportHeight * 0.18;
        const progress = gsap.parseEase(silkEase)(
          clampProgress((window.scrollY - start) / Math.max(end - start, 1))
        );

        updateManifestoReveal(progress);
      };

      const requestManifestoRevealUpdate = () => {
        if (revealFrame) return;
        revealFrame = window.requestAnimationFrame(updateManifestoRevealFromScroll);
      };

      updateManifestoRevealFromScroll();
      window.addEventListener('scroll', requestManifestoRevealUpdate, { passive: true });
      window.addEventListener('resize', requestManifestoRevealUpdate, { passive: true });
      addManifestoCleanup(() => {
        if (revealFrame) window.cancelAnimationFrame(revealFrame);
        window.removeEventListener('scroll', requestManifestoRevealUpdate);
        window.removeEventListener('resize', requestManifestoRevealUpdate);
      });
    }

    if (titleContainer) {
      titleContainer.style.setProperty('overflow', 'visible', 'important');
    }

    if (titleElement) {
      titleElement.style.setProperty('overflow', 'visible', 'important');
      splitTitleToFloatingChars(titleElement);

      gsap.fromTo(
        titleElement.querySelectorAll('.ada-title-float-char'),
        {
          yPercent: 115,
          rotateX: -72,
          opacity: 0,
          scale: 0.96,
          filter: 'blur(10px)'
        },
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.05,
          ease: 'power4.out',
          stagger: { amount: 0.38, from: 'center', ease: silkEase },
          scrollTrigger: {
            trigger: titleElement,
            start: 'top 92%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    }

    if (loopTrack && loopContainer) {
      const tickerTween = gsap.to(loopTrack, {
        xPercent: -50,
        duration: 160,
        ease: 'none',
        repeat: -1
      });

      gsap.fromTo(
        loopContainer,
        { opacity: 0, y: 70 },
        {
          opacity: 1,
          y: 0,
          duration: 1.75,
          ease: premiumEase,
          scrollTrigger: {
            trigger: loopContainer,
            start: 'top 92%',
            end: 'bottom 34%',
            scrub: 1.35
          }
        }
      );

      const pauseTicker = () => gsap.to(tickerTween, { timeScale: 0, duration: 1.6, ease: premiumEase });
      const playTicker = () => gsap.to(tickerTween, { timeScale: 1, duration: 1.8, ease: silkEase });

      loopContainer.addEventListener('mouseenter', pauseTicker);
      loopContainer.addEventListener('mouseleave', playTicker);
      addManifestoCleanup(() => loopContainer.removeEventListener('mouseenter', pauseTicker));
      addManifestoCleanup(() => loopContainer.removeEventListener('mouseleave', playTicker));
    }

    if (loopTrackReverse && loopContainerReverse) {
      const tickerTweenReverse = gsap.fromTo(
        loopTrackReverse,
        { xPercent: -50 },
        {
          xPercent: 0,
          duration: 160,
          ease: 'none',
          repeat: -1
        }
      );

      gsap.fromTo(
        loopContainerReverse,
        { opacity: 0, y: 70 },
        {
          opacity: 1,
          y: 0,
          duration: 1.75,
          ease: premiumEase,
          scrollTrigger: {
            trigger: loopContainerReverse,
            start: 'top 92%',
            end: 'bottom 34%',
            scrub: 1.35
          }
        }
      );

      const pauseTickerReverse = () => gsap.to(tickerTweenReverse, { timeScale: 0, duration: 1.6, ease: premiumEase });
      const playTickerReverse = () => gsap.to(tickerTweenReverse, { timeScale: 1, duration: 1.8, ease: silkEase });

      loopContainerReverse.addEventListener('mouseenter', pauseTickerReverse);
      loopContainerReverse.addEventListener('mouseleave', playTickerReverse);
      addManifestoCleanup(() => loopContainerReverse.removeEventListener('mouseenter', pauseTickerReverse));
      addManifestoCleanup(() => loopContainerReverse.removeEventListener('mouseleave', playTickerReverse));
    }

  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
};

onMounted(() => {
  nextTick(() => {
    requestCatalogHandoffHeight();
    requestAnimationFrame(requestCatalogHandoffHeight);
    requestAnimationFrame(requestCatalogHandoffPin);

    if (catalogHandoffFrameRef.value) {
      catalogHandoffObserver = new ResizeObserver(requestCatalogHandoffHeight);
      catalogHandoffObserver.observe(catalogHandoffFrameRef.value);
    }

    // Katalog handoff pin'i artık GSAP'in NATIVE pin'i ile yapılıyor.
    // Eskiden onUpdate her scroll frame'inde getBoundingClientRect okuyup
    // translate3d yazıyordu (manuel pin emülasyonu) → sürekli layout reflow,
    // FPS düşüşünün ana kaynaklarından. ScrollTrigger pin'i ScrollSmoother ile
    // uyumlu çalışır ve transform'u kendi yönetir; scroll'da bizim JS'imiz hiç
    // çalışmaz. frame viewport'tan kısa olduğu için onu alt kenara yapıştırıyoruz:
    // pin başlangıcı "frame altı viewport altına değince", bitişi "hold'un sonu".
    // Masaüstü (>760) dışında pin yok.
    if (catalogHandoffFrameRef.value && window.innerWidth > 760) {
      catalogHandoffTrigger = ScrollTrigger.create({
        trigger: catalogHandoffFrameRef.value,
        // frame'in altı viewport altına değince yapış (sticky bottom eşdeğeri)
        start: () => `bottom bottom`,
        // hold'un (catalog) altı, viewport altına gelince bırak
        endTrigger: catalogHandoffRef.value,
        end: 'bottom bottom',
        pin: catalogHandoffPinRef.value,
        pinSpacing: false,
        invalidateOnRefresh: true
      });
    }

    const fonts = (document as any).fonts;

    if (fonts?.ready) {
      fonts.ready.then(() => {
        requestCatalogHandoffHeight();
        requestCatalogHandoffPin();
        ScrollTrigger.refresh();
      });
    }

    initManifestoAnimations();

    // PERDE (parallax): katalog stack scroll'dan daha hızlı yukarı gelir →
    // "Kurgulayın" panelinin/CTA'ların üzerine biner. --catalog-curtain-y 0'dan
    // -extra'ya scrub edilir; katalog ekranın altından üst-orta bölgeye girerken
    // ekstra yukarı tırmanır. catalogHandoff PIN'i transform'a değil pin div'ine
    // dokunduğu için çakışmaz (ayrı katman). Sadece masaüstü.
    if (catalogStackRef.value && window.innerWidth > 760) {
      const extra =
        parseFloat(
          getComputedStyle(catalogStackRef.value).getPropertyValue('--catalog-curtain-extra')
        ) || 240;

      catalogCurtainTween = gsap.fromTo(
        catalogStackRef.value,
        { '--catalog-curtain-y': '0px' },
        {
          '--catalog-curtain-y': `${-extra}px`,
          ease: 'none',
          scrollTrigger: {
            trigger: catalogStackRef.value,
            start: 'top bottom',
            end: 'top center',
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    }
  });

  window.addEventListener('resize', requestCatalogHandoffHeight);
  window.addEventListener('resize', requestCatalogHandoffPin);
});

onBeforeUnmount(() => {
  catalogHandoffObserver?.disconnect();
  catalogHandoffObserver = null;

  catalogHandoffTrigger?.kill();
  catalogHandoffTrigger = null;

  catalogCurtainTween?.scrollTrigger?.kill();
  catalogCurtainTween?.kill();
  catalogCurtainTween = null;

  if (catalogHandoffFrame) {
    cancelAnimationFrame(catalogHandoffFrame);
    catalogHandoffFrame = 0;
  }

  if (catalogHandoffPinFrame) {
    cancelAnimationFrame(catalogHandoffPinFrame);
    catalogHandoffPinFrame = 0;
  }

  if (catalogHandoffPinRef.value) {
    catalogHandoffPinRef.value.style.transform = '';
  }

  if (manifestoGsapContext) {
    manifestoGsapContext.revert();
    manifestoGsapContext = null;
  }

  manifestoCleanupTasks.forEach((task) => task());
  manifestoCleanupTasks = [];

  window.removeEventListener('resize', requestCatalogHandoffHeight);
  window.removeEventListener('resize', requestCatalogHandoffPin);
});
</script>

<style scoped>
.home-reviews-runtime {
  display: block;
  width: 100%;
}
</style>
