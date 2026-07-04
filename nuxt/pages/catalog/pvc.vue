<script setup lang="ts">
import { products } from "~/data/products";

definePageMeta({ pageTransition: false });

useCatalogSubpageSeo(
  { title: "PVC & Laminoks", description: "PVC & laminoks serisindeki kapı modelleri: kod, yüzey ve seri bilgileriyle Ege Kardoor kataloğu." },
  { title: "PVC & Laminox", description: "Door models from the PVC & Laminox series with codes, finishes and series details in the Ege Kardoor catalog." }
);

const seriesProducts = products.filter((product) => product.seriesSlug === "pvc-laminoks");
</script>

<template>
  <main class="catalog-subpage catalog-subpage--pvc">
    <h1>PVC & Laminox</h1>
    <div class="catalog-subpage__grid">
      <NuxtLink v-for="product in seriesProducts" :key="product.slug" :to="`/doors/${product.slug}`">
        <img :src="product.image" :alt="`${product.name} ${product.code}`" />
        <strong>{{ product.name }}</strong>
        <span>{{ product.code }}</span>
      </NuxtLink>
    </div>
  </main>
</template>
