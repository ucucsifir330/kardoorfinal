<script setup lang="ts">
import { products } from "~/data/products";

definePageMeta({ pageTransition: false });

const seriesProducts = products.filter((product) => product.seriesSlug === "aluminyum-sistemler");
</script>

<template>
  <main class="catalog-subpage catalog-subpage--aluminium">
    <h1>Aluminium Systems</h1>
    <div class="catalog-subpage__grid">
      <NuxtLink v-for="product in seriesProducts" :key="product.slug" :to="`/doors/${product.slug}`">
        <img :src="product.image" :alt="`${product.name} ${product.code}`" />
        <strong>{{ product.name }}</strong>
        <span>{{ product.code }}</span>
      </NuxtLink>
    </div>
  </main>
</template>
