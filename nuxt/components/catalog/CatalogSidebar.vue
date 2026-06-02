<script setup lang="ts">
defineProps<{
  filters: readonly string[];
  searchQuery: string;
}>();

defineEmits<{
  "update:searchQuery": [value: string];
}>();
</script>

<template>
  <aside class="catalog-sidebar">
    <NuxtLink class="catalog-brand" to="/">
      <span class="catalog-brand__ege">EGE</span>
      <span class="catalog-brand__kardoor">KARDOOR<span class="catalog-brand__registered">R</span></span>
    </NuxtLink>

    <div class="catalog-search">
      <label class="catalog-label" for="catalog-search">Ara:</label>
      <div class="catalog-search__box">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="catalog-search"
          :value="searchQuery"
          type="search"
          placeholder="Burada ara..."
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="catalog-filters">
      <span class="catalog-label">Filtreler:</span>
      <button v-for="filter in filters" :key="filter" class="catalog-filter" type="button">
        <span>{{ filter }}</span>
        <svg viewBox="0 0 32 10" aria-hidden="true">
          <line x1="0" y1="5" x2="31" y2="5" />
          <polyline points="22,0 31,5 22,10" />
        </svg>
      </button>
    </div>

    <div class="catalog-sample">
      <p>Modelini yakından<br />incelemek ister misiniz?</p>
      <NuxtLink class="catalog-sample__button" to="/request-quote">
        Ücretsiz Numune İste
        <svg viewBox="0 0 32 10" aria-hidden="true">
          <line x1="0" y1="5" x2="31" y2="5" />
          <polyline points="22,0 31,5 22,10" />
        </svg>
      </NuxtLink>
    </div>
  </aside>
</template>
