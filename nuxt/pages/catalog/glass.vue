<script setup lang="ts">
import { products } from "~/data/products";

definePageMeta({ pageTransition: false });

useCatalogSubpageSeo(
  { title: "Camlı Modeller", description: "Camlı kapı modelleri: kod, yüzey ve seri bilgileriyle Ege Kardoor kataloğu." },
  { title: "Glass Models", description: "Glass door models with codes, finishes and series details in the Ege Kardoor catalog." }
);

const seriesProducts = products.filter((product) => product.seriesSlug === "camli-modeller");
</script>

<template>
  <main class="catalog-subpage catalog-subpage--glass">
    <h1>Glass Models</h1>
    <div class="catalog-subpage__grid">
      <NuxtLink v-for="product in seriesProducts" :key="product.slug" :to="`/doors/${product.slug}`">
        <img :src="product.image" :alt="`${product.name} ${product.code}`" />
        <strong>{{ product.name }}</strong>
        <span>{{ product.code }}</span>
      </NuxtLink>
    </div>
  </main>
</template>
