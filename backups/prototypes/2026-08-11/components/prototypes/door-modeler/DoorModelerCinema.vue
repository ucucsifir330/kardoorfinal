<script setup lang="ts">
import { computed, ref } from "vue";
import DoorModelStage from "./DoorModelStage.vue";
import { doorDefinitionByCode, featuredDoorDefinitions as doorDefinitions } from "./doorDefinitions";
import type { DoorDefinition } from "./doorDefinitions";

const activeCode = ref<DoorDefinition["code"]>("AL-020");
const referenceOpacity = ref(0.76);
const exploded = ref(0);
const autoRotate = ref(false);
const stage = ref<InstanceType<typeof DoorModelStage> | null>(null);
const definition = computed(() => doorDefinitionByCode(activeCode.value));

const downloadJson = () => {
  const blob = new Blob([JSON.stringify(definition.value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${definition.value.code.toLowerCase()}-door-definition.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <section class="cinema">
    <header class="cinema__head">
      <div>
        <p>Parametrik kapı atölyesi</p>
        <h1>Kapının içindeki mimari</h1>
      </div>
      <p class="cinema__intro">Fotoğraf referansı ve gerçek parça geometrisi aynı eksende. Sürükleyerek yapıyı kontrol et.</p>
    </header>

    <div class="cinema__stage">
      <DoorModelStage
        ref="stage"
        :definition="definition"
        :exploded="exploded"
        :reference-opacity="referenceOpacity"
        :auto-rotate="autoRotate"
        :show-reference="referenceOpacity > 0.01"
        presentation="cinema"
      />

      <div class="cinema__models" aria-label="Model seçimi">
        <button
          v-for="item in doorDefinitions"
          :key="item.code"
          type="button"
          :data-active="item.code === activeCode ? '' : undefined"
          @click="activeCode = item.code"
        >
          <span>{{ item.code }}</span>
          <strong>{{ item.name }}</strong>
        </button>
      </div>

      <aside class="cinema__controls">
        <label>
          <span>Fotoğraf katmanı</span>
          <output>{{ Math.round(referenceOpacity * 100) }}%</output>
          <input v-model.number="referenceOpacity" type="range" min="0" max="1" step="0.01">
        </label>
        <label>
          <span>Parça ayrımı</span>
          <output>{{ Math.round(exploded * 100) }}%</output>
          <input v-model.number="exploded" type="range" min="0" max="1" step="0.01">
        </label>
        <label class="cinema__toggle">
          <input v-model="autoRotate" type="checkbox">
          <span>Otomatik dönüş</span>
        </label>
      </aside>
    </div>

    <footer class="cinema__foot">
      <div>
        <span>{{ definition.family }}</span>
        <strong>{{ definition.width.toFixed(2) }} m genişlik</strong>
        <strong>{{ definition.height.toFixed(2) }} m yükseklik</strong>
      </div>
      <div>
        <button type="button" @click="stage?.resetView()">Görünümü sıfırla</button>
        <button type="button" @click="downloadJson">JSON indir</button>
        <button type="button" class="cinema__primary" @click="stage?.exportGlb()">GLB indir</button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.cinema {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 100svh;
  padding: 32px;
  background: var(--bg-deepest);
  color: var(--text-main);
}

.cinema__head,
.cinema__foot {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 28px;
}

.cinema__head {
  align-items: flex-start;
  padding-bottom: 22px;
}

.cinema__head p:first-child {
  margin: 0 0 8px;
  color: var(--text-muted);
  font: 600 11px/1 var(--font-body);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.cinema__head h1 {
  max-width: 760px;
  margin: 0;
  font: 600 clamp(42px, 5.2vw, 84px)/0.88 var(--font-display);
  letter-spacing: -0.035em;
  text-transform: uppercase;
}

.cinema__intro {
  max-width: 310px;
  margin: 6px 0 0;
  color: var(--text-soft);
  font: 400 13px/1.55 var(--font-body);
}

.cinema__stage {
  position: relative;
  min-height: 0;
  border: 1px solid var(--line);
  overflow: hidden;
}

.cinema__stage > :deep(.model-stage) {
  height: 100%;
  min-height: 580px;
}

.cinema__models {
  position: absolute;
  top: 22px;
  left: 22px;
  display: grid;
  gap: 6px;
  width: min(220px, calc(100% - 44px));
}

.cinema__models button {
  display: grid;
  grid-template-columns: 58px 1fr;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: var(--panel-soft);
  color: var(--text-muted);
  text-align: left;
  cursor: pointer;
  transition: color 160ms var(--ease-out), border-color 160ms var(--ease-out), transform 160ms var(--ease-out);
}

.cinema__models button[data-active] {
  border-color: var(--accent-fg);
  color: var(--text-main);
}

.cinema__models button:active,
.cinema__foot button:active {
  transform: scale(0.97);
}

.cinema__models span {
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.08em;
}

.cinema__models strong {
  font: 600 13px/1 var(--font-body);
}

.cinema__controls {
  position: absolute;
  top: 22px;
  right: 22px;
  display: grid;
  gap: 18px;
  width: 210px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: var(--panel-soft);
  color: var(--text-soft);
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.cinema__controls label:not(.cinema__toggle) {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.cinema__controls output {
  color: var(--text-main);
}

.cinema__controls input[type="range"] {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--accent-fg);
}

.cinema__toggle {
  display: flex;
  align-items: center;
  gap: 9px;
}

.cinema__toggle input {
  accent-color: var(--accent-fg);
}

.cinema__foot {
  align-items: center;
  padding-top: 18px;
}

.cinema__foot > div {
  display: flex;
  align-items: center;
  gap: 18px;
}

.cinema__foot span,
.cinema__foot strong,
.cinema__foot button {
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.cinema__foot span {
  color: var(--text-muted);
}

.cinema__foot strong {
  color: var(--text-soft);
}

.cinema__foot button {
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-main);
  cursor: pointer;
  transition: transform 150ms var(--ease-out), border-color 150ms var(--ease-out);
}

.cinema__foot .cinema__primary {
  border-color: var(--accent-fill);
  background: var(--accent-fill);
  color: var(--accent-on);
}

@media (max-width: 900px) {
  .cinema {
    padding: 18px;
  }

  .cinema__head {
    display: block;
  }

  .cinema__intro {
    margin-top: 14px;
  }

  .cinema__stage > :deep(.model-stage) {
    min-height: 62svh;
  }

  .cinema__controls {
    top: auto;
    right: 14px;
    bottom: 50px;
    width: min(190px, calc(100% - 28px));
  }

  .cinema__models {
    top: 14px;
    left: 14px;
  }

  .cinema__foot,
  .cinema__foot > div {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .cinema__foot > div:first-child {
    display: none;
  }
}
</style>
