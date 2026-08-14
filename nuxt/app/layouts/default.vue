<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "#imports";

const route = useRoute();

const normalizePath = (path: string) => {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
};

const isReferencesRoute = computed(() => normalizePath(route.path) === "/references");
const isCatalogRoute = computed(() => normalizePath(route.path) === "/catalog");
</script>

<template>
  <div class="site-layout">
    <!-- Fixed chrome stays outside #smooth-content: a transformed ancestor
         would change the containing block and break position: fixed. -->
    <SiteHeader />
    <ContactHub v-if="!isReferencesRoute && !isCatalogRoute" />
    <SmoothCursor v-if="!isReferencesRoute" />

    <div id="smooth-wrapper">
      <div id="smooth-content">
        <main>
          <slot />
        </main>

        <SiteFooter />
      </div>
    </div>
  </div>
</template>
