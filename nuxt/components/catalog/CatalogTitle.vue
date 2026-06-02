<script setup lang="ts">
defineProps<{
  isScrolled: boolean;
}>();
</script>

<template>
  <div class="catalog-main__sticky" :class="{ 'catalog-main__sticky--scrolled': isScrolled }">
    <h1>Katalog</h1>
  </div>
</template>
