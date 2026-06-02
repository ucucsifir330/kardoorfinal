<script setup lang="ts">
import { computed } from "vue";
import type { ComponentPublicInstance } from "vue";
import type { CatalogRow } from "~/composables/useCatalogPage";

const props = defineProps<{
  rows: CatalogRow[];
  visibleRows: number[];
  isScrolled: boolean;
  setRowRef: (el: Element | ComponentPublicInstance | null) => void;
}>();

const aluminiumRow = computed(() => props.rows.find((row) => row.id === 1));
const woodRow = computed(() => props.rows.find((row) => row.id === 2));
const glassRow = computed(() => props.rows.find((row) => row.id === 3));
const steelRow = computed(() => props.rows.find((row) => row.id === 4));
const pvcRow = computed(() => props.rows.find((row) => row.id === 5));
const architecturalRow = computed(() => props.rows.find((row) => row.id === 6));
const technicalRow = computed(() => props.rows.find((row) => row.id === 7));
</script>

<template>
  <main class="catalog-main">
    <CatalogTitle :is-scrolled="isScrolled" />

    <div v-if="rows.length" class="catalog-rows">
      <CatalogAluminiumModel
        v-if="aluminiumRow"
        :ref="setRowRef"
        :row="aluminiumRow"
        :is-visible="visibleRows.includes(1)"
      />
      <CatalogWoodModel
        v-if="woodRow"
        :ref="setRowRef"
        :row="woodRow"
        :is-visible="visibleRows.includes(2)"
      />
      <CatalogGlassModel
        v-if="glassRow"
        :ref="setRowRef"
        :row="glassRow"
        :is-visible="visibleRows.includes(3)"
      />
      <CatalogSteelModel
        v-if="steelRow"
        :ref="setRowRef"
        :row="steelRow"
        :is-visible="visibleRows.includes(4)"
      />
      <CatalogPvcModel
        v-if="pvcRow"
        :ref="setRowRef"
        :row="pvcRow"
        :is-visible="visibleRows.includes(5)"
      />
      <CatalogArchitecturalModel
        v-if="architecturalRow"
        :ref="setRowRef"
        :row="architecturalRow"
        :is-visible="visibleRows.includes(6)"
      />
      <CatalogTechnicalModel
        v-if="technicalRow"
        :ref="setRowRef"
        :row="technicalRow"
        :is-visible="visibleRows.includes(7)"
      />
    </div>

    <CatalogEmpty v-else />
  </main>
</template>
