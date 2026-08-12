<script setup lang="ts">
import { computed, ref } from "vue";
import DoorModelStage from "./DoorModelStage.vue";
import { doorDefinitionByCode, featuredDoorDefinitions as doorDefinitions } from "./doorDefinitions";
import type { DoorDefinition, DoorPartKind } from "./doorDefinitions";

const activeCode = ref<DoorDefinition["code"]>("CM-019");
const exploded = ref(0.78);
const selectedKind = ref<DoorPartKind | "all">("all");
const referenceOpacity = ref(0.14);
const autoRotate = ref(false);
const wireframe = ref(false);
const stage = ref<InstanceType<typeof DoorModelStage> | null>(null);
const definition = computed(() => doorDefinitionByCode(activeCode.value));

const kinds: Array<{ key: DoorPartKind | "all"; label: string }> = [
  { key: "all", label: "Tüm montaj" },
  { key: "frame", label: "Kasa" },
  { key: "leaf", label: "Kanat" },
  { key: "glass", label: "Cam" },
  { key: "trim", label: "Çıta ve kayıt" },
  { key: "panel", label: "Yüzey paneli" },
  { key: "hardware", label: "Donanım" }
];

const countFor = (kind: DoorPartKind | "all") =>
  kind === "all" ? definition.value.parts.length : definition.value.parts.filter((part) => part.kind === kind).length;

const setModel = (code: DoorDefinition["code"]) => {
  activeCode.value = code;
  selectedKind.value = "all";
};
</script>

<template>
  <section class="assembly">
    <header class="assembly__head">
      <div>
        <p>Montaj görünümü</p>
        <h1>Parçayı gör. Yapıyı anla.</h1>
      </div>
      <div class="assembly__models">
        <button
          v-for="item in doorDefinitions"
          :key="item.code"
          type="button"
          :data-active="item.code === activeCode ? '' : undefined"
          @click="setModel(item.code)"
        >
          {{ item.code }}
        </button>
      </div>
    </header>

    <div class="assembly__workspace">
      <aside class="assembly__rail">
        <div class="assembly__identity">
          <span>{{ definition.code }}</span>
          <strong>{{ definition.name }}</strong>
          <small>{{ definition.family }}</small>
        </div>

        <div class="assembly__parts" aria-label="Parça katmanları">
          <button
            v-for="kind in kinds"
            :key="kind.key"
            type="button"
            :data-active="selectedKind === kind.key ? '' : undefined"
            :disabled="countFor(kind.key) === 0"
            @click="selectedKind = kind.key"
          >
            <span>{{ kind.label }}</span>
            <strong>{{ String(countFor(kind.key)).padStart(2, '0') }}</strong>
          </button>
        </div>

        <div class="assembly__sliders">
          <label>
            <span>Patlatılmış görünüm</span>
            <output>{{ Math.round(exploded * 100) }}%</output>
            <input v-model.number="exploded" type="range" min="0" max="1" step="0.01">
          </label>
          <label>
            <span>Fotoğraf izi</span>
            <output>{{ Math.round(referenceOpacity * 100) }}%</output>
            <input v-model.number="referenceOpacity" type="range" min="0" max="0.7" step="0.01">
          </label>
        </div>
      </aside>

      <div class="assembly__stage">
        <DoorModelStage
          ref="stage"
          :definition="definition"
          :exploded="exploded"
          :reference-opacity="referenceOpacity"
          :show-reference="referenceOpacity > 0.01"
          :selected-kind="selectedKind"
          :auto-rotate="autoRotate"
          :wireframe="wireframe"
          presentation="assembly"
        />

        <div class="assembly__toggles">
          <label><input v-model="wireframe" type="checkbox"><span>Tel kafes</span></label>
          <label><input v-model="autoRotate" type="checkbox"><span>Otomatik dönüş</span></label>
        </div>
      </div>
    </div>

    <footer class="assembly__foot">
      <p>Parçalar bağımsız mesh olarak üretilir. Fotoğraf referansı GLB çıktısına dahil edilmez.</p>
      <div>
        <button type="button" @click="stage?.resetView()">Görünümü sıfırla</button>
        <button type="button" class="assembly__primary" @click="stage?.exportGlb()">Montajı GLB indir</button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.assembly {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 100svh;
  padding: 28px;
  background: var(--bg-deepest);
  color: var(--text-main);
}

.assembly__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding-bottom: 20px;
}

.assembly__head p {
  margin: 0 0 7px;
  color: var(--text-muted);
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.assembly__head h1 {
  margin: 0;
  font: 600 clamp(38px, 4.7vw, 72px)/0.9 var(--font-display);
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.assembly__models {
  display: flex;
  gap: 6px;
}

.assembly__models button,
.assembly__foot button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 150ms var(--ease-out), border-color 150ms var(--ease-out), transform 150ms var(--ease-out);
}

.assembly__models button[data-active] {
  border-color: var(--accent-fg);
  color: var(--text-main);
}

.assembly__models button:active,
.assembly__foot button:active {
  transform: scale(0.97);
}

.assembly__workspace {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 0;
  border: 1px solid var(--line);
}

.assembly__rail {
  display: grid;
  align-content: start;
  gap: 24px;
  padding: 20px;
  border-right: 1px solid var(--line);
  background: var(--bg-navy);
}

.assembly__identity {
  display: grid;
  gap: 4px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.assembly__identity span,
.assembly__identity small {
  color: var(--text-muted);
  font: 600 10px/1.3 var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.assembly__identity strong {
  font: 600 34px/1 var(--font-display);
  text-transform: uppercase;
}

.assembly__parts {
  display: grid;
}

.assembly__parts button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 40px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  color: var(--text-muted);
  font: 600 11px/1 var(--font-body);
  text-align: left;
  cursor: pointer;
  transition: color 150ms var(--ease-out), transform 150ms var(--ease-out);
}

.assembly__parts button[data-active] {
  color: var(--text-main);
}

.assembly__parts button:disabled {
  opacity: 0.28;
  cursor: default;
}

.assembly__parts button:not(:disabled):active {
  transform: translateX(2px);
}

.assembly__parts strong {
  color: var(--accent-fg);
  font-size: 10px;
}

.assembly__sliders {
  display: grid;
  gap: 18px;
}

.assembly__sliders label {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  color: var(--text-soft);
  font: 600 10px/1 var(--font-body);
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.assembly__sliders output {
  color: var(--text-main);
}

.assembly__sliders input {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--accent-fg);
}

.assembly__stage {
  position: relative;
  min-width: 0;
  min-height: 610px;
}

.assembly__stage > :deep(.model-stage) {
  height: 100%;
}

.assembly__toggles {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  gap: 14px;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: var(--panel-soft);
}

.assembly__toggles label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-soft);
  font: 600 9px/1 var(--font-body);
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.assembly__toggles input {
  accent-color: var(--accent-fg);
}

.assembly__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding-top: 17px;
}

.assembly__foot p {
  max-width: 560px;
  margin: 0;
  color: var(--text-muted);
  font: 400 11px/1.45 var(--font-body);
}

.assembly__foot > div {
  display: flex;
  gap: 6px;
}

.assembly__foot .assembly__primary {
  border-color: var(--accent-fill);
  background: var(--accent-fill);
  color: var(--accent-on);
}

@media (max-width: 900px) {
  .assembly {
    padding: 16px;
  }

  .assembly__head {
    display: grid;
  }

  .assembly__workspace {
    grid-template-columns: 1fr;
  }

  .assembly__rail {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .assembly__parts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 18px;
  }

  .assembly__stage {
    min-height: 62svh;
  }

  .assembly__foot {
    align-items: flex-end;
  }

  .assembly__foot p {
    display: none;
  }
}
</style>
