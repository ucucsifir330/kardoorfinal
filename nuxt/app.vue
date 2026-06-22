<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const route = useRoute();
const { mode, isHydrated } = useShowroomAmbience();
const { locale } = useKardoorLocale();
const isReferencesRoute = computed(() => route.path === "/references");

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
</script>

<template>
  <div
    class="app-shell"
    :class="shellClasses"
    :data-ambience="mode"
  >
    <WelcomeScreen v-if="!isReferencesRoute" />
    <LoadingScreen v-if="!isReferencesRoute" />
    <SiteHeader />
    <FloatingContactHub v-if="!isReferencesRoute" />
    <SmoothCursor v-if="!isReferencesRoute" />

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
