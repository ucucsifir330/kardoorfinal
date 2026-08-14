<script setup lang="ts">
// Prototype route for the horizontal-axis entrance. Not linked from anywhere.
import EntranceAxisLab from "~/components/home/EntranceAxisLab.vue";

definePageMeta({ pageTransition: false });

useSeoMeta({
  title: "Axis Lab",
  robots: "noindex, nofollow"
});
</script>

<template>
  <ClientOnly>
    <EntranceAxisLab />
  </ClientOnly>
</template>
