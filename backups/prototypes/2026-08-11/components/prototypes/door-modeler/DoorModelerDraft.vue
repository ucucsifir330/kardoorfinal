<script setup lang="ts">
import { computed, ref } from "vue";
import DoorBlueprint from "./DoorBlueprint.vue";
import DoorModelStage from "./DoorModelStage.vue";
import { doorDefinitionByCode, featuredDoorDefinitions as doorDefinitions } from "./doorDefinitions";
import type { DoorDefinition, DoorPartKind } from "./doorDefinitions";

const activeCode = ref<DoorDefinition["code"]>("CM-019");
const selectedKind = ref<DoorPartKind | "all">("all");
const referenceOpacity = ref(0.42);
const showReference = ref(true);
const wireframe = ref(false);
const stage = ref<InstanceType<typeof DoorModelStage> | null>(null);
const definition = computed(() => doorDefinitionByCode(activeCode.value));

const onModelChange = (code: DoorDefinition["code"]) => {
  activeCode.value = code;
  selectedKind.value = "all";
};
</script>

<template>
  <section class="draft">
    <header class="draft__head">
      <div>
        <p>Çizim masası</p>
        <h1>Önce yapı, sonra yüzey</h1>
      </div>
      <div class="draft__model-tabs" aria-label="Model seçimi">
        <button
          v-for="item in doorDefinitions"
          :key="item.code"
          type="button"
          :data-active="item.code === activeCode ? '' : undefined"
          @click="onModelChange(item.code)"
        >
          {{ item.code }} <span>{{ item.name }}</span>
        </button>
      </div>
    </header>

    <div class="draft__workspace">
      <DoorBlueprint
        :definition="definition"
        :selected-kind="selectedKind"
        :show-reference="showReference"
        @select="selectedKind = $event"
      />

      <div class="draft__preview">
        <DoorModelStage
          ref="stage"
          :definition="definition"
          :reference-opacity="showReference ? referenceOpacity : 0"
          :show-reference="showReference"
          :selected-kind="selectedKind"
          :wireframe="wireframe"
          presentation="draft"
        />

        <aside class="draft__controls">
          <div>
            <span>Aktif katman</span>
            <strong>{{ selectedKind === 'all' ? 'Tüm yapı' : selectedKind }}</strong>
          </div>
          <label>
            <input v-model="showReference" type="checkbox">
            <span>Fotoğrafı göster</span>
          </label>
          <label>
            <input v-model="wireframe" type="checkbox">
            <span>Tel kafes</span>
          </label>
          <label class="draft__range">
            <span>Fotoğraf yoğunluğu</span>
            <input v-model.number="referenceOpacity" type="range" min="0" max="0.9" step="0.01" :disabled="!showReference">
          </label>
        </aside>
      </div>
    </div>

    <footer class="draft__foot">
      <dl>
        <div><dt>Kasa</dt><dd>{{ definition.width.toFixed(2) }} m</dd></div>
        <div><dt>Yükseklik</dt><dd>{{ definition.height.toFixed(2) }} m</dd></div>
        <div><dt>Derinlik</dt><dd>{{ Math.round(definition.frameDepth * 100) }} cm</dd></div>
        <div><dt>Geometri</dt><dd>{{ definition.parts.length }} parça</dd></div>
      </dl>
      <div>
        <button type="button" @click="stage?.resetView()">Ön görünüş</button>
        <button type="button" class="draft__primary" @click="stage?.exportGlb()">GLB üret</button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.draft {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 100svh;
  padding: 26px;
  background: var(--bg-main);
  color: var(--text-main);
}

.draft__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding-bottom: 20px;
}

.draft__head p {
  margin: 0 0 6px;
  color: var(--text-muted);
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.draft__head h1 {
  margin: 0;
  font: 600 clamp(36px, 4.3vw, 66px)/0.92 var(--font-display);
  letter-spacing: -0.025em;
  text-transform: uppercase;
}

.draft__model-tabs {
  display: flex;
  gap: 6px;
}

.draft__model-tabs button,
.draft__foot button {
  min-height: 38px;
  padding: 0 14px;
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

.draft__model-tabs button[data-active] {
  border-color: var(--accent-fg);
  color: var(--text-main);
}

.draft__model-tabs span {
  margin-left: 8px;
  color: var(--text-soft);
  text-transform: none;
}

.draft__model-tabs button:active,
.draft__foot button:active {
  transform: scale(0.97);
}

.draft__workspace {
  display: grid;
  grid-template-columns: minmax(330px, 0.78fr) minmax(0, 1.4fr);
  min-height: 0;
  border: 1px solid var(--line);
}

.draft__workspace > :deep(.blueprint) {
  border-right: 1px solid var(--line);
}

.draft__preview {
  position: relative;
  min-width: 0;
  min-height: 600px;
}

.draft__preview > :deep(.model-stage) {
  height: 100%;
}

.draft__controls {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  gap: 13px;
  width: 194px;
  padding: 15px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: var(--panel-soft);
  color: var(--text-soft);
  font: 600 10px/1.2 var(--font-body);
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.draft__controls > div {
  display: grid;
  gap: 5px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.draft__controls > div span {
  color: var(--text-muted);
}

.draft__controls > div strong {
  color: var(--text-main);
}

.draft__controls label:not(.draft__range) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.draft__controls input {
  accent-color: var(--accent-fg);
}

.draft__range {
  display: grid;
  gap: 8px;
}

.draft__range input {
  width: 100%;
}

.draft__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding-top: 17px;
}

.draft__foot dl,
.draft__foot > div {
  display: flex;
  align-items: center;
  gap: 24px;
  margin: 0;
}

.draft__foot dl > div {
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px;
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.draft__foot dt {
  color: var(--text-muted);
}

.draft__foot dd {
  margin: 0;
  color: var(--text-main);
}

.draft__foot .draft__primary {
  border-color: var(--accent-fill);
  background: var(--accent-fill);
  color: var(--accent-on);
}

@media (max-width: 980px) {
  .draft {
    padding: 16px;
  }

  .draft__head {
    display: grid;
  }

  .draft__workspace {
    grid-template-columns: 1fr;
  }

  .draft__workspace > :deep(.blueprint) {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .draft__preview {
    min-height: 62svh;
  }

  .draft__foot dl {
    display: none;
  }

  .draft__foot {
    justify-content: flex-end;
  }
}
</style>
