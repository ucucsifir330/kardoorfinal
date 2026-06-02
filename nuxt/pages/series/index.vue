<script setup lang="ts">
import { collections } from "~/data/collections";
import { getProductsByCollectionSlug } from "~/data/catalog";

const { assetUrl } = useKardoorAsset();

const useLocalImageFallback = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null;
  const fallback = image?.dataset.fallbackSrc;

  if (!image || !fallback || image.src.endsWith(fallback)) return;

  image.src = fallback;
};

useSeoMeta({
  title: "Door Series",
  description:
    "Explore Kardoor steel door series for distributors, dealers and project supply."
});
</script>

<template>
  <section class="listing-page">
    <div class="page-intro">
      <p class="eyebrow">Door series</p>
      <h1>Product families for global steel door supply.</h1>
      <p>
        Each series groups model codes, surfaces and use cases so international
        buyers can build a catalog or project order with clarity.
      </p>
    </div>

    <div class="series-grid">
      <NuxtLink
        v-for="series in collections"
        :key="series.slug"
        class="series-card"
        :to="`/series/${series.slug}`"
        :style="{ '--series-accent': series.accentColor }"
      >
        <span>{{ series.number }}</span>
        <NuxtImg
          :src="assetUrl(series.image)"
          :alt="series.title"
          :data-fallback-src="series.image"
          width="210"
          height="420"
          @error="useLocalImageFallback"
        />
        <h2>{{ series.title }}</h2>
        <p>{{ series.description }}</p>
        <small>{{ getProductsByCollectionSlug(series.slug).length }} models</small>
      </NuxtLink>
    </div>
  </section>
</template>
