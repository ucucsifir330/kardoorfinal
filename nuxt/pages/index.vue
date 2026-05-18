<script setup lang="ts">
import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { locale } = useKardoorLocale();

const seo = computed(() =>
  locale.value === "tr"
    ? {
        title: "Global Pazarlar İçin Çelik Kapılar",
        description:
          "Ege Kardoor; uluslararası alıcılar, bayiler ve proje tedariği için Türkiye'de çelik kapı üretir."
      }
    : {
        title: "Steel Doors for Global Markets",
        description:
          "Ege Kardoor manufactures steel doors in Turkiye for international buyers, dealers and project supply."
      }
);

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description
});
</script>

<template>
  <div class="home-page">
    <EntranceDoor />
    <HomeContentLoader />
  </div>
</template>
