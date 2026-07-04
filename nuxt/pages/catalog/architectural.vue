<script setup lang="ts">
import { products } from "~/data/products";

definePageMeta({ pageTransition: false });

useCatalogSubpageSeo(
  { title: "Mimari Özel Tasarımlar", description: "Mimari özel seri kapı modelleri: kod, yüzey ve seri bilgileriyle Ege Kardoor kataloğu." },
  { title: "Architectural Special", description: "Architectural special series door models with codes, finishes and series details in the Ege Kardoor catalog." }
);

const seriesProducts = products.filter((product) => product.seriesSlug === "mimari-ozel");
</script>

<template>
  <main class="catalog-subpage catalog-subpage--architectural">
    <h1>Architectural Special</h1>
    <div class="catalog-subpage__grid">
      <NuxtLink v-for="product in seriesProducts" :key="product.code" :to="`/doors/${product.code}`">
        <img :src="product.image" :alt="`${product.name} ${product.code}`" />
        <strong>{{ product.name }}</strong>
        <span>{{ product.code }}</span>
      </NuxtLink>
    </div>
  </main>
</template>
