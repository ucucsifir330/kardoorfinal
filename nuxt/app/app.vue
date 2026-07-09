<script setup lang="ts">
import type PageTransitionOverlay from "~/components/ui/PageTransitionOverlay.vue";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const route = useRoute();
const router = useRouter();
const isDevBuild = import.meta.dev;
const { mode, isHydrated } = useShowroomAmbience();
const { locale } = useKardoorLocale();
const isReferencesRoute = computed(() => route.path === "/references");
const shouldMountStartupScreens = ref(!isReferencesRoute.value);
const transitionOverlay = ref<InstanceType<typeof PageTransitionOverlay> | null>(null);
const transitionRoutes = new Set(["/", "/references", "/company", "/contact"]);

let shouldRunPageTransition = false;

const normalizeTransitionPath = (path: string) => {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
};

const isTransitionRoute = (path: string) => transitionRoutes.has(normalizeTransitionPath(path));

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
        shouldMountStartupScreens.value = false;
        await nextTick();
        await transitionOverlay.value?.cover();
      }

      return true;
    })
  : undefined;

const removeRouteAfterHook = import.meta.client
  ? router.afterEach(async () => {
      if (!shouldRunPageTransition) return;

      await nextTick();
      await transitionOverlay.value?.reveal();
      shouldRunPageTransition = false;
    })
  : undefined;

const handleStartupComplete = async () => {
  if (!shouldMountStartupScreens.value) return;

  await transitionOverlay.value?.primeCovered();
  shouldMountStartupScreens.value = false;
  await nextTick();
  await transitionOverlay.value?.reveal();
};

const shellClasses = computed(() => [
  `app-shell--${mode.value}`,
  {
    "app-shell--hydrated": isHydrated.value,
    "app-shell--references": isReferencesRoute.value
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
  <div
    class="app-shell"
    :class="shellClasses"
    :data-ambience="mode"
  >
    <PageTransitionOverlay ref="transitionOverlay" />
    <ClientOnly>
      <DebugLab v-if="isDevBuild" />
    </ClientOnly>
    <WelcomeScreen
      v-if="shouldMountStartupScreens"
      @complete="handleStartupComplete"
    />
    <SiteHeader />
    <FloatingContactHub v-if="!isReferencesRoute" />
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
