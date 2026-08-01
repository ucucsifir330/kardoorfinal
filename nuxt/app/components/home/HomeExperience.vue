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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useKardoorLocale } from '~/composables/useKardoorLocale'
import { useEntranceCopy } from '~/composables/useEntranceCopy'
import { useShowroomAmbience } from '~/composables/useShowroomAmbience'
import AdaCtaButton from '~/components/home/AdaCtaButton.vue'





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
