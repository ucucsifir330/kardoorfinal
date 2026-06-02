<script setup lang="ts">
import { getProductBySlug } from "~/data/catalog";
import { products } from "~/data/products";

const route = useRoute();
const product = getProductBySlug(String(route.params.slug));
const { assetUrl } = useKardoorAsset();

const useLocalImageFallback = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null;
  const fallback = image?.dataset.fallbackSrc;

  if (!image || !fallback || image.src.endsWith(fallback)) return;

  image.src = fallback;
};

if (!product) {
  throw createError({ statusCode: 404, statusMessage: "Door model not found" });
}

const similar = products
  .filter((item) => item.slug !== product.slug && item.seriesSlug === product.seriesSlug)
  .slice(0, 3);

useSeoMeta({
  title: `${product.code} Steel Door`,
  description: product.description
});
</script>

<template>
  <section class="detail-page">
    <NuxtLink class="back-link" :to="`/series/${product.seriesSlug}`">← Back to {{ product.seriesTitle }}</NuxtLink>

    <div class="detail-page__grid">
      <div class="detail-page__visual">
        <NuxtImg
          :src="assetUrl(product.image)"
          :alt="product.name"
          :data-fallback-src="product.image"
          width="520"
          height="820"
          @error="useLocalImageFallback"
        />
      </div>

      <div class="detail-page__content">
        <p class="eyebrow">{{ product.seriesTitle }}</p>
        <h1>{{ product.code }}</h1>
        <h2>{{ product.name }}</h2>
        <p>{{ product.description }}</p>

        <div class="detail-specs">
          <span v-for="spec in product.specs" :key="spec">{{ spec }}</span>
        </div>

        <div class="detail-columns">
          <div>
            <h3>Materials</h3>
            <ul>
              <li v-for="material in product.materials" :key="material">{{ material }}</li>
            </ul>
          </div>
          <div>
            <h3>Use Cases</h3>
            <ul>
              <li v-for="useCase in product.useCases" :key="useCase">{{ useCase }}</li>
            </ul>
          </div>
        </div>

        <div class="hero-actions">
          <NuxtLink class="btn btn-primary" to="/request-quote">Request Quote</NuxtLink>
          <NuxtLink class="btn btn-secondary" to="/doors">All Doors</NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="similar.length" class="related-row">
      <NuxtLink v-for="item in similar" :key="item.slug" :to="`/doors/${item.slug}`">
        <span>{{ item.code }}</span>
        <strong>{{ item.name }}</strong>
      </NuxtLink>
    </div>
  </section>
</template>
