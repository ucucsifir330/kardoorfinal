<script setup lang="ts">
import { products } from "~/data/products";

definePageMeta({ pageTransition: false });

useCatalogSubpageSeo(
  { title: "Metal & Kompozit Kapılar", description: "Metal & kompozit serisindeki çelik kapı modelleri: kod, yüzey ve seri bilgileriyle Ege Kardoor kataloğu." },
  { title: "Metal & Composite Doors", description: "Steel door models from the metal & composite series with codes, finishes and series details in the Ege Kardoor catalog." }
);

const seriesProducts = products.filter((product) => product.seriesSlug === "metal-kompozit");
</script>

<template>
  <main class="catalog-subpage catalog-subpage--steel">
    <h1>Metal & Composite</h1>
    <div class="catalog-subpage__grid">
      <NuxtLink v-for="product in seriesProducts" :key="product.slug" :to="`/doors/${product.slug}`">
        <img :src="product.image" :alt="`${product.name} ${product.code}`" />
        <strong>{{ product.name }}</strong>
        <span>{{ product.code }}</span>
      </NuxtLink>
    </div>
  </main>
</template>
