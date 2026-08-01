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
  <HomeCatalogTransition>
    <template #catalog>
      <HomeCatalog />
    </template>
    <template #references>
      <HomeReferences />
      <HomeManifesto :key="locale" />
    </template>
  </HomeCatalogTransition>
  <div class="home-reviews-runtime">
    <HomeReviews />
  </div>
</template><script setup lang="ts">
import { computed, ref } from 'vue'
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
</script>

<style scoped>
.home-reviews-runtime {
  display: block;
  width: 100%;
}
</style>
