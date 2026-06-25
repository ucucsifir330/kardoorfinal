<script setup lang="ts">
/**
 * /entrance-lab — yeni hero deneyiminin bağımsız route'u.
 * Asıl deneyim EntranceDoorLab bileşeninde (ana sayfa da aynı bileşeni kullanır).
 * Bu sayfa yalnızca route-meta + SEO sarmalayıcısı.
 */
import EntranceDoorLab from "~/components/home/EntranceDoorLab.vue";

definePageMeta({ pageTransition: false });

useSeoMeta({
  title: "Entrance Lab",
  description: "Hero yeniden yazım zemini — tek background görsel + kapı sprite."
});
</script>

<template>
  <EntranceDoorLab />
</template>
