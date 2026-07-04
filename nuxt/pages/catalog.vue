<script setup lang="ts">
import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import { products } from "~/data/products";

definePageMeta({
  pageTransition: false
});

const { locale } = useKardoorLocale();

const seo = computed(() =>
  locale.value === "tr"
    ? {
        title: "Kapı Kataloğu",
        description:
          "Ege Kardoor kapı kataloğu: çelik, alüminyum, ahşap, PVC ve cam kapı serilerini filtreleyin, projeniz için doğru modeli bulun."
      }
    : {
        title: "Door Catalog",
        description:
          "Ege Kardoor door catalog: browse steel, aluminium, wood, PVC and glass door series and find the right model for your project."
      }
);

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description
});
</script>

<template>
  <section id="main-content" class="catalog-lib">
    <h1 class="catalog-lib__heading">{{ seo.title }}</h1>

    <ul class="catalog-lib__grid">
      <li
        v-for="(product, index) in products"
        :key="product.slug"
        class="catalog-lib__item"
      >
        <NuxtLink
          class="catalog-lib__card"
          :to="`/doors/${product.slug}`"
          :aria-label="`${product.name}, ${product.code}`"
        >
          <span class="catalog-lib__visual">
            <img
              :src="product.localImage"
              :alt="`${product.name} ${product.code}`"
              width="320"
              height="426"
              :loading="index < 6 ? 'eager' : 'lazy'"
              :fetchpriority="index < 2 ? 'high' : 'auto'"
            />
            <span class="catalog-lib__add" aria-hidden="true">+</span>
          </span>

          <span class="catalog-lib__meta">
            <strong>{{ product.name }}</strong>
            <span>{{ product.code }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
