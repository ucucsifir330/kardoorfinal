<script setup lang="ts">
import { computed } from "vue";
import type { DoorDefinition, DoorPartKind } from "./doorDefinitions";

const props = withDefaults(defineProps<{
  definition: DoorDefinition;
  selectedKind?: DoorPartKind | "all";
  showReference?: boolean;
}>(), {
  selectedKind: "all",
  showReference: true
});

const emit = defineEmits<{
  select: [kind: DoorPartKind | "all"];
}>();

const padding = 0.12;
const viewBox = computed(() => [
  -props.definition.width / 2 - padding,
  -props.definition.height / 2 - padding,
  props.definition.width + padding * 2,
  props.definition.height + padding * 2
].join(" "));

const projectedParts = computed(() =>
  props.definition.parts
    .filter((part) => part.size[0] > 0.004 && part.size[1] > 0.004)
    .map((part) => ({
      ...part,
      x: part.position[0] - part.size[0] / 2,
      y: -part.position[1] - part.size[1] / 2,
      width: part.size[0],
      height: part.size[1]
    }))
);
</script>

<template>
  <section class="blueprint" aria-label="Kapı teknik çizimi">
    <div class="blueprint__head">
      <span>Teknik çizim</span>
      <strong>{{ definition.width.toFixed(2) }} × {{ definition.height.toFixed(2) }} m</strong>
    </div>

    <svg
      class="blueprint__drawing"
      :viewBox="viewBox"
      role="img"
      :aria-label="`${definition.code} ön görünüş teknik çizimi`"
      preserveAspectRatio="xMidYMid meet"
    >
      <image
        v-if="showReference"
        :href="definition.referenceImage"
        :x="-definition.width / 2"
        :y="-definition.height / 2"
        :width="definition.width"
        :height="definition.height"
        preserveAspectRatio="none"
        opacity="0.28"
      />

      <rect
        v-for="part in projectedParts"
        :key="part.id"
        class="blueprint__part"
        :class="[
          `blueprint__part--${part.kind}`,
          { 'blueprint__part--muted': selectedKind !== 'all' && selectedKind !== part.kind }
        ]"
        :x="part.x"
        :y="part.y"
        :width="part.width"
        :height="part.height"
        :rx="Math.min(part.radius ?? 0, part.width / 2, part.height / 2)"
        tabindex="0"
        role="button"
        :aria-label="`${part.label} parçasını seç`"
        @click="emit('select', part.kind)"
        @keydown.enter="emit('select', part.kind)"
      />

      <line
        :x1="-definition.width / 2"
        :x2="definition.width / 2"
        :y1="definition.height / 2 + 0.07"
        :y2="definition.height / 2 + 0.07"
        class="blueprint__dimension"
      />
      <line
        :x1="-definition.width / 2 - 0.07"
        :x2="-definition.width / 2 - 0.07"
        :y1="-definition.height / 2"
        :y2="definition.height / 2"
        class="blueprint__dimension"
      />
    </svg>

    <div class="blueprint__legend">
      <button type="button" :data-active="selectedKind === 'all' ? '' : undefined" @click="emit('select', 'all')">Tümü</button>
      <button type="button" :data-active="selectedKind === 'frame' ? '' : undefined" @click="emit('select', 'frame')">Kasa</button>
      <button type="button" :data-active="selectedKind === 'leaf' ? '' : undefined" @click="emit('select', 'leaf')">Kanat</button>
      <button type="button" :data-active="selectedKind === 'glass' ? '' : undefined" @click="emit('select', 'glass')">Cam</button>
      <button type="button" :data-active="selectedKind === 'trim' ? '' : undefined" @click="emit('select', 'trim')">Çıta</button>
      <button type="button" :data-active="selectedKind === 'hardware' ? '' : undefined" @click="emit('select', 'hardware')">Donanım</button>
    </div>
  </section>
</template>

<style scoped>
.blueprint {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  padding: 22px;
  background: var(--bg-navy);
  color: var(--text-main);
}

.blueprint__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.blueprint__head span {
  color: var(--text-muted);
}

.blueprint__head strong {
  font-weight: 600;
}

.blueprint__drawing {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 360px;
  padding: 22px 0;
}

.blueprint__part {
  vector-effect: non-scaling-stroke;
  stroke-width: 1;
  transition: opacity 180ms var(--ease-out), stroke-width 180ms var(--ease-out);
  cursor: pointer;
}

.blueprint__part:focus-visible {
  outline: none;
  stroke-width: 3;
}

.blueprint__part--frame {
  fill: color-mix(in srgb, var(--accent) 14%, transparent);
  stroke: var(--accent);
}

.blueprint__part--leaf,
.blueprint__part--panel {
  fill: color-mix(in srgb, var(--warm) 18%, transparent);
  stroke: var(--warm);
}

.blueprint__part--glass {
  fill: color-mix(in srgb, var(--accent-soft) 24%, transparent);
  stroke: var(--accent-soft);
}

.blueprint__part--trim {
  fill: color-mix(in srgb, var(--text-soft) 12%, transparent);
  stroke: var(--text-soft);
}

.blueprint__part--hardware {
  fill: var(--text-main);
  stroke: var(--text-main);
}

.blueprint__part--muted {
  opacity: 0.12;
}

.blueprint__dimension {
  vector-effect: non-scaling-stroke;
  stroke: var(--text-muted);
  stroke-width: 1;
  stroke-dasharray: 4 5;
}

.blueprint__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.blueprint__legend button {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 150ms var(--ease-out), border-color 150ms var(--ease-out), transform 150ms var(--ease-out);
}

.blueprint__legend button[data-active] {
  border-color: var(--accent-fg);
  color: var(--text-main);
}

.blueprint__legend button:active {
  transform: scale(0.97);
}

@media (max-width: 760px) {
  .blueprint {
    padding: 16px;
  }

  .blueprint__drawing {
    min-height: 330px;
  }
}
</style>
