<script setup lang="ts">
import { getProductByCode } from "~/data/catalog";
import { getProductTaxonomy } from "~/data/catalog-taxonomy";
import { products, slugifyProductPart } from "~/data/products";

const route = useRoute();
const product = getProductByCode(String(route.params.code));
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
  .filter((item) => item.code !== product.code && item.seriesSlug === product.seriesSlug)
  .slice(0, 3);

// /series/* rotası yok; seri sayfalarının gerçek karşılığı katalog kütüphanesi.
// Ana kategori facet'iyle deep-link'lenir (filtreler URL query'sinden okunuyor).
const backLink = {
  path: "/catalog",
  query: { anaKategori: slugifyProductPart(getProductTaxonomy(product).anaKategori) }
};

useSeoMeta({
  title: `${product.code} Steel Door`,
  description: product.description
});
</script>

<template>
  <section class="detail-page">
    <!-- Hedef seri sayfası değil, ana-kategori filtreli katalog — metin hedefle uyumlu. -->
    <NuxtLink class="back-link" :to="backLink">← Back to Catalog</NuxtLink>

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
          <NuxtLink class="btn btn-primary" to="/contact">Request Quote</NuxtLink>
          <NuxtLink class="btn btn-secondary" to="/catalog">All Doors</NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="similar.length" class="related-row">
      <NuxtLink v-for="item in similar" :key="item.code" :to="`/doors/${item.code}`">
        <span>{{ item.code }}</span>
        <strong>{{ item.name }}</strong>
      </NuxtLink>
    </div>
  </section>
</template>
