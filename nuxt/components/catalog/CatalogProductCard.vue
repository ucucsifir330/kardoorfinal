<script setup lang="ts">
import type { DoorProduct } from "~/data/products";

defineProps<{
  item: DoorProduct;
  index: number;
}>();
</script>

<template>
  <NuxtLink
    class="catalog-product"
    :data-index="index + 1"
    :to="`/doors/${item.slug}`"
  >
    <div class="catalog-product__image">
      <img :src="item.image" :alt="`${item.name} ${item.code}`" />
      <button class="catalog-product__like" type="button" aria-label="Favorilere ekle">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>

    <div class="catalog-product__body">
      <div>
        <p>{{ item.name }}</p>
        <span>{{ item.category.toLocaleUpperCase("tr-TR") }} / {{ item.code }}</span>
      </div>
      <svg viewBox="0 0 32 10" aria-hidden="true">
        <line x1="0" y1="5" x2="31" y2="5" />
        <polyline points="22,0 31,5 22,10" />
      </svg>
    </div>
  </NuxtLink>
</template>
