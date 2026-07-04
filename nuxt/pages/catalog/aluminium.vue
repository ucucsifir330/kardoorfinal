<script setup lang="ts">
import { products } from "~/data/products";

definePageMeta({ pageTransition: false });

useCatalogSubpageSeo(
  { title: "Alüminyum Sistemler", description: "Alüminyum sistemler serisindeki kapı modelleri: kod, yüzey ve seri bilgileriyle Ege Kardoor kataloğu." },
  { title: "Aluminium Systems", description: "Door models from the aluminium systems series with codes, finishes and series details in the Ege Kardoor catalog." }
);

const seriesProducts = products.filter((product) => product.seriesSlug === "aluminyum-sistemler");
</script>

<template>
  <main class="catalog-subpage catalog-subpage--aluminium">
    <h1>Aluminium Systems</h1>
    <div class="catalog-subpage__grid">
      <NuxtLink v-for="product in seriesProducts" :key="product.code" :to="`/doors/${product.code}`">
        <img :src="product.image" :alt="`${product.name} ${product.code}`" />
        <strong>{{ product.name }}</strong>
        <span>{{ product.code }}</span>
      </NuxtLink>
    </div>
  </main>
</template>
