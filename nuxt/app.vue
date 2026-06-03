<script setup lang="ts">
import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { mode, isHydrated } = useShowroomAmbience();
const { locale } = useKardoorLocale();

const shellClasses = computed(() => [
  `app-shell--${mode.value}`,
  {
    "app-shell--hydrated": isHydrated.value
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
    <WelcomeScreen />
    <LoadingScreen />
    <SiteHeader />
    <SmoothCursor />

    <main>
      <NuxtPage />
    </main>

    <HomeFooter />
  </div>
</template>
