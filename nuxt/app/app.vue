<script setup lang="ts">
import type PageTransitionOverlay from "~/components/ui/PageTransitionOverlay.vue";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter, useState } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const route = useRoute();
const router = useRouter();
const { mode } = useShowroomAmbience();
const { locale } = useKardoorLocale();
const isReferencesRoute = computed(() => route.path === "/references");
const shouldMountStartupScreens = ref(!isReferencesRoute.value);
const isPageContentVisible = useState<boolean>("kardoor-page-content-visible", () => isReferencesRoute.value);
const transitionOverlay = ref<InstanceType<typeof PageTransitionOverlay> | null>(null);
const transitionRoutes = new Set(["/", "/references", "/company", "/contact"]);

let shouldRunPageTransition = false;

const normalizeTransitionPath = (path: string) => {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
};

const isTransitionRoute = (path: string) => transitionRoutes.has(normalizeTransitionPath(path));

/**
 * Ana sayfaya dönerken kapı sprite'ını ÖNDEN hazırla.
 *
 * Hero `<ClientOnly>` içinde; rota dönüşünde ~1.5sn sonra mount oluyor ve
 * ancak o zaman `useDoorSprite` modülü + sprite JSON + WebP zinciri
 * başlıyor. Ölçüldü: modül 500ms, JSON +361ms, çizim +330ms — kapı deliği
 * ~1.2sn boş (siyah) kalıyordu.
 *
 * Geçiş BAŞLARKEN üçünü de tetikliyoruz; hero mount olduğunda hepsi
 * tarayıcı önbelleğinde hazır oluyor. Hatalar sessizce yutuluyor: bu bir
 * hızlandırma, davranış şartı değil.
 */
const spriteHazirlandi = new Set<string>();

const spriteOnHazirla = () => {
  if (!import.meta.client) return;

  let gece = false;
  try {
    gece = window.localStorage.getItem("kardoor-showroom-ambience") === "night";
  } catch {
    // localStorage kapalıysa gündüz varsayılanıyla devam.
  }

  const metaUrl = gece ? "/kardoor-door-night.json" : "/kardoor-door-light.json";
  if (spriteHazirlandi.has(metaUrl)) return;
  spriteHazirlandi.add(metaUrl);

  // Sonucu `useDoorSprite`in paylaşılan haritasına koyuyoruz; hero mount
  // olduğunda `load()` aynı URL'i yeniden istemek yerine bu sözü bekliyor.
  // Fetch + decode böylece geçiş sırasında, ana iş parçacığı boşken bitiyor.
  import("~/composables/useDoorSprite")
    .then(({ spriteOnBellek }) => {
      if (spriteOnBellek.has(metaUrl)) return;

      const hazirlik = fetch(metaUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`sprite metadata failed: ${res.status}`);
          return res.json();
        })
        .then(async (meta) => {
          // Alan adı `sprite` — bkz. public/kardoor-door-*.json
          const img = new Image();
          img.decoding = "async";
          img.src = meta.sprite;
          await (img.decode?.() ?? Promise.resolve());
          return { meta, image: img };
        });

      // Hata olursa haritadan düşür: hero kendi yolundan tekrar denesin.
      hazirlik.catch(() => spriteOnBellek.delete(metaUrl));
      spriteOnBellek.set(metaUrl, hazirlik);
    })
    .catch(() => {});
};

const removeRouteGuard = import.meta.client
  ? router.beforeEach(async (to, from) => {
      const fromPath = normalizeTransitionPath(from.path);
      const toPath = normalizeTransitionPath(to.path);

      shouldRunPageTransition =
        from.matched.length > 0 &&
        fromPath !== toPath &&
        isTransitionRoute(fromPath) &&
        isTransitionRoute(toPath);

      if (shouldRunPageTransition) {
        // Ana sayfaya dönülüyorsa sprite'ı şimdiden çek.
        if (toPath === "/") spriteOnHazirla();

        isPageContentVisible.value = false;
        shouldMountStartupScreens.value = false;
        await nextTick();
        await transitionOverlay.value?.cover();
      }

      return true;
    })
  : undefined;

/**
 * Perdenin açılabilmesi için yeni sayfanın gerçekten yerinde olmasını bekler.
 *
 * Neden gerekli: ana sayfanın hero'su `<ClientOnly>` içinde. Sunucu
 * render'ında yerini SSR kabuğu tutuyor, ama ROTA GEÇİŞİNDE o kabuk
 * basılmıyor — geçiş tamamen istemcide oluyor. Perde `afterEach`'te hemen
 * açılınca hero henüz mount olmamış oluyordu ve altında boş bir şerit
 * görünüyordu (ölçüldü: perde opacity 0 olduğunda heroH null, bir kare
 * sonra hero 725px/818 bottom ile geliyordu).
 *
 * İki kare bekliyoruz: birincisi Vue'nun DOM'u yazması, ikincisi tarayıcının
 * düzeni hesaplaması için. Sayfa hâlâ gelmediyse zaman aşımı devreye girer —
 * perde asla asılı kalmaz.
 */
const PAGE_SETTLE_TIMEOUT_MS = 600;

const waitForPageContent = () =>
  new Promise<void>((resolve) => {
    const started = performance.now();

    const check = () => {
      const main = document.querySelector("main");
      const hasContent = (main?.getBoundingClientRect().height ?? 0) > 0;

      if (hasContent || performance.now() - started > PAGE_SETTLE_TIMEOUT_MS) {
        // Bir kare daha: içerik DOM'da ama düzeni henüz oturmamış olabilir.
        requestAnimationFrame(() => resolve());
        return;
      }

      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  });

const removeRouteAfterHook = import.meta.client
  ? router.afterEach(async () => {
      if (!shouldRunPageTransition) return;

      await nextTick();
      // İçerik perde ALTINDA görünür olsun: perde zaten üstünü örtüyor,
      // sızıntı üretmez ama açıldığında altı dolu olur.
      isPageContentVisible.value = true;
      await waitForPageContent();
      await transitionOverlay.value?.reveal();
      shouldRunPageTransition = false;
    })
  : undefined;

const handleStartupComplete = async () => {
  if (!shouldMountStartupScreens.value) return;

  await transitionOverlay.value?.primeCovered();
  shouldMountStartupScreens.value = false;

  // İçerik perde AÇILMADAN ÖNCE görünür olmalı. Sırayı ters kurmak (önce
  // reveal, sonra visible) perdenin açıldığı ~1.4s boyunca sayfayı boş
  // bırakıyordu: loader gitmiş, panel kalkıyor, altında hiçbir şey yok.
  // Perde zaten üstünü örttüğü için burada görünür yapmak sızıntı üretmez.
  isPageContentVisible.value = true;
  await nextTick();
  await transitionOverlay.value?.reveal();
};

const shellClasses = computed(() => [
  `app-shell--${mode.value}`,
  {
    "app-shell--references": isReferencesRoute.value,
    // Gizleme YALNIZ AÇILIŞ PERDESİ (WelcomeScreen) için.
    //
    // Neden gerekli: SSR sayfayı opak basıyor ama WelcomeScreen'i basmıyor —
    // o `v-if` ile yalnız istemcide mount oluyor. JS yüklenene kadar sayfa
    // ham haliyle görünüyordu (ölçüldü: loader gelmeden 30 kare boyunca
    // navbar+hero+katalog ekranda).
    //
    // Neden ROTA GEÇİŞİNDE YOK: orada mavi perde zaten üstü örtüyor, ayrıca
    // gizlemeye gerek yok. `shouldMountStartupScreens` tam bu ayrımı taşıyor:
    // yalnız ilk açılışta true, geçişte false.
    "app-shell--content-hidden":
      shouldMountStartupScreens.value && !isPageContentVisible.value
  }
]);

useHead({
  htmlAttrs: {
    lang: locale
  }
});

onBeforeUnmount(() => {
  removeRouteGuard?.();
  removeRouteAfterHook?.();
});
</script>

<template>
  <div class="app-shell" :class="shellClasses">
    <PageTransitionOverlay ref="transitionOverlay" />
    <WelcomeScreen
      v-if="shouldMountStartupScreens"
      @complete="handleStartupComplete"
    />
    <SiteHeader />
    <ContactHub v-if="!isReferencesRoute" />
    <SmoothCursor v-if="!isReferencesRoute" />
    <!-- Katalog filtre dock'u da fixed: smooth-content dışında durmalı.
         v-if ile route değişince unmount olur, panel DOM'da asılı kalmaz. -->
    <CatalogFilterDock v-if="normalizeTransitionPath(route.path) === '/catalog'" />

    <!-- ScrollSmoother containers. Fixed overlays above stay OUTSIDE so the
         #smooth-content transform doesn't break their positioning. -->
    <div id="smooth-wrapper">
      <div id="smooth-content">
        <main>
          <NuxtPage />
        </main>

        <HomeFooter />
      </div>
    </div>
  </div>
</template>
