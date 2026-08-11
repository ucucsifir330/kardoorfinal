<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import DoorModelStage from "./DoorModelStage.vue";
import {
  doorDefinitions,
  type DoorDefinition,
  type DoorMaterialKey,
  type DoorPart,
  type DoorPartKind
} from "./doorDefinitions";

/**
 * Editor over the parametric definitions.
 *
 * The parts are authored by hand, and hand-authoring 169 doors in a source file
 * is not workable — every nudge means an edit, a save and a reload. Here the same
 * definition is live: pick a part in the viewport, move and resize it against the
 * reference photograph, then copy the result back out as the exact TypeScript that
 * belongs in doorDefinitions.ts. Work survives reloads via localStorage, so a long
 * session over the catalogue is not lost to a refresh.
 */

const STORAGE_KEY = "kardoor:door-modeler:drafts";

/**
 * Signature of the shipped definitions. A draft is only restored while the source
 * it was branched from is unchanged — otherwise editing doorDefinitions.ts has no
 * visible effect, because a stale draft silently wins on load. That happened: a
 * 22-part draft with no glass kept overriding a freshly rewritten 40-part door.
 */
const SOURCE_SIGNATURE = (() => {
  const source = JSON.stringify(doorDefinitions.map((item) => ({
    code: item.code,
    width: item.width,
    height: item.height,
    archetype: item.archetype,
    parts: item.parts.map((part) => [part.id, part.kind, part.material, part.size, part.position, part.rotation])
  })));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${doorDefinitions.length}:${(hash >>> 0).toString(36)}`;
})();

const sourceSignature = () => SOURCE_SIGNATURE;

const kinds: DoorPartKind[] = ["frame", "leaf", "panel", "glass", "trim", "hardware"];
const materials: DoorMaterialKey[] = ["metal", "metalDark", "wood", "glass", "hardware"];

const clone = (definition: DoorDefinition): DoorDefinition =>
  JSON.parse(JSON.stringify(definition)) as DoorDefinition;

const drafts = ref<DoorDefinition[]>(doorDefinitions.map(clone));
const activeIndex = ref(0);
const definition = computed(() => drafts.value[activeIndex.value]!);

const selectedPartId = ref<string | null>(null);
const revision = ref(0);
const modelSearch = ref("");
const familyFilter = ref("all");
const partSearch = ref("");
const kindFilter = ref<DoorPartKind | "all">("all");
const referenceOpacity = ref(0.72);
const showReference = ref(true);
const wireframe = ref(false);
const textured = ref(false);
const compare = ref(true);
const exploded = ref(0);
const savedAt = ref("");
const copyState = ref("");
const editedCodes = ref(new Set<string>());

const stage = ref<InstanceType<typeof DoorModelStage> | null>(null);

const selectedPart = computed(
  () => definition.value.parts.find((part) => part.id === selectedPartId.value) ?? null
);

const visibleParts = computed(() => {
  const needle = partSearch.value.trim().toLocaleLowerCase("tr-TR");
  return definition.value.parts.filter((part) => {
    if (kindFilter.value !== "all" && part.kind !== kindFilter.value) return false;
    if (!needle) return true;
    return `${part.id} ${part.label}`.toLocaleLowerCase("tr-TR").includes(needle);
  });
});

const families = computed(() => [...new Set(drafts.value.map((item) => item.family))]);

const visibleModels = computed(() => {
  const needle = modelSearch.value.trim().toLocaleLowerCase("tr-TR");
  return drafts.value
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (familyFilter.value !== "all" && item.family !== familyFilter.value) return false;
      if (!needle) return true;
      return `${item.code} ${item.name} ${item.family} ${item.archetype ?? ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(needle);
    });
});

const modelStats = computed(() => ({
  total: drafts.value.length,
  calibrated: drafts.value.filter((item) => item.modelStatus === "calibrated").length,
  drafts: editedCodes.value.size
}));

const modelState = (item: DoorDefinition) => {
  if (editedCodes.value.has(item.code)) return "taslak";
  return item.modelStatus === "calibrated" ? "kalibre" : "şablon";
};

const kindCounts = computed(() => {
  const counts = new Map<DoorPartKind, number>();
  for (const part of definition.value.parts) {
    counts.set(part.kind, (counts.get(part.kind) ?? 0) + 1);
  }
  return counts;
});

/* ----------------------------------------------------------------- persistence */

const persist = (markEdited = true) => {
  try {
    if (markEdited) editedCodes.value = new Set(editedCodes.value).add(definition.value.code);
    const overrides = drafts.value.filter((item) => editedCodes.value.has(item.code));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ signature: sourceSignature(), drafts: overrides, edited: [...editedCodes.value] })
    );
    savedAt.value = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    savedAt.value = "kaydedilemedi";
  }
};

const restore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as { signature?: string; drafts?: DoorDefinition[]; edited?: string[] };

    // Source moved on since this draft was saved — drop it rather than let it
    // mask the new definitions.
    if (stored?.signature !== sourceSignature()) {
      localStorage.removeItem(STORAGE_KEY);
      savedAt.value = "kaynak değişti, taslak atıldı";
      return;
    }

    const list = stored.drafts;
    if (!Array.isArray(list)) return;
    editedCodes.value = new Set(Array.isArray(stored.edited) ? stored.edited : list.map((item) => item.code));
    drafts.value = doorDefinitions.map((source) => {
      const match = list.find((item) => item.code === source.code);
      return match?.parts?.length ? (match as DoorDefinition) : clone(source);
    });
    revision.value += 1;
    savedAt.value = "geri yüklendi";
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
};

const resetDoor = () => {
  const source = doorDefinitions.find((item) => item.code === definition.value.code);
  if (!source) return;
  drafts.value[activeIndex.value] = clone(source);
  editedCodes.value = new Set([...editedCodes.value].filter((code) => code !== source.code));
  selectedPartId.value = null;
  revision.value += 1;
  persist(false);
};

/* --------------------------------------------------------------------- editing */

/** Live transform while dragging; the scene patches one mesh instead of rebuilding. */
const pushTransform = (part: DoorPart) => {
  stage.value?.applyPartTransform?.(part.id, [...part.position], [...part.size]);
};

const setVector = (
  field: "position" | "size",
  axis: 0 | 1 | 2,
  value: number
) => {
  const part = selectedPart.value;
  if (!part || Number.isNaN(value)) return;
  part[field][axis] = field === "size" ? Math.max(0.002, value) : value;
  pushTransform(part);
  persist();
};

const nudge = (axis: 0 | 1 | 2, amount: number) => {
  const part = selectedPart.value;
  if (!part) return;
  part.position[axis] = Number((part.position[axis]! + amount).toFixed(4));
  pushTransform(part);
  persist();
};

const changeMeta = () => {
  // Kind and material decide geometry and shading, so the scene has to rebuild.
  revision.value += 1;
  persist();
};

const uniqueId = (base: string) => {
  let candidate = base;
  let counter = 2;
  const taken = new Set(definition.value.parts.map((part) => part.id));
  while (taken.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
};

const duplicatePart = () => {
  const part = selectedPart.value;
  if (!part) return;
  const copy: DoorPart = JSON.parse(JSON.stringify(part));
  copy.id = uniqueId(`${part.id}-kopya`);
  copy.label = `${part.label} (kopya)`;
  copy.position[0] = Number((copy.position[0]! + 0.05).toFixed(4));
  definition.value.parts.push(copy);
  selectedPartId.value = copy.id;
  revision.value += 1;
  persist();
};

const addPart = () => {
  const part: DoorPart = {
    id: uniqueId("yeni-parca"),
    label: "Yeni parça",
    kind: "trim",
    material: "metalDark",
    size: [0.06, 0.4, 0.03],
    position: [0, 0, 0.1],
    radius: 0.004
  };
  definition.value.parts.push(part);
  selectedPartId.value = part.id;
  revision.value += 1;
  persist();
};

const deletePart = () => {
  const part = selectedPart.value;
  if (!part) return;
  definition.value.parts = definition.value.parts.filter((item) => item.id !== part.id);
  selectedPartId.value = null;
  revision.value += 1;
  persist();
};

/* ---------------------------------------------------------------------- export */

const round = (value: number) => Number(value.toFixed(4));

const exportSource = computed(() => {
  const lines = definition.value.parts.map((part) => {
    const size = part.size.map(round).join(", ");
    const position = part.position.map(round).join(", ");
    const radius = part.radius === undefined ? "" : `, ${round(part.radius)}`;
    return `  box(${JSON.stringify(part.id)}, ${JSON.stringify(part.label)}, ${JSON.stringify(part.kind)}, ` +
      `${JSON.stringify(part.material)}, [${size}], [${position}]${radius}),`;
  });
  return `const ${definition.value.code.toLowerCase().replace("-", "")}Parts = (): DoorPart[] => [\n${lines.join("\n")}\n];`;
});

const copySource = async () => {
  try {
    await navigator.clipboard.writeText(exportSource.value);
    copyState.value = "kopyalandı";
  } catch {
    copyState.value = "kopyalanamadı";
  }
  window.setTimeout(() => { copyState.value = ""; }, 2200);
};

/* ------------------------------------------------------------------- lifecycle */

const onSelect = (partId: string | null) => {
  selectedPartId.value = partId;
};

const onKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
  if (!selectedPart.value) return;

  const step = event.shiftKey ? 0.05 : 0.005;
  const map: Record<string, [0 | 1 | 2, number]> = {
    a: [0, -step], d: [0, step],
    s: [1, -step], w: [1, step],
    q: [2, -step], e: [2, step]
  };
  const move = map[event.key.toLowerCase()];
  if (move) {
    event.preventDefault();
    nudge(move[0], move[1]);
  }
  if (event.key === "Delete") deletePart();
};

watch(activeIndex, () => {
  selectedPartId.value = null;
  revision.value += 1;
});

onMounted(() => {
  restore();
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <section class="editor">
    <aside class="editor__parts">
      <header class="editor__head">
        <p class="editor__label">Model</p>
        <p class="editor__model-progress">
          {{ modelStats.total }} model · {{ modelStats.calibrated }} kalibre · {{ modelStats.drafts }} taslak
        </p>
        <div class="editor__model-tools">
          <input v-model="modelSearch" class="editor__search" type="search" placeholder="Kod, isim veya arketip ara">
          <select v-model="familyFilter" class="editor__select" aria-label="Model ailesi">
            <option value="all">Tüm aileler</option>
            <option v-for="family in families" :key="family" :value="family">{{ family }}</option>
          </select>
        </div>
      </header>

      <ol class="editor__model-list">
        <li v-for="entry in visibleModels" :key="entry.item.code">
          <button
            type="button"
            :data-active="entry.index === activeIndex ? '' : undefined"
            @click="activeIndex = entry.index"
          >
            <span><strong>{{ entry.item.code }}</strong>{{ entry.item.name }}</span>
            <small>{{ modelState(entry.item) }}</small>
          </button>
        </li>
      </ol>

      <input v-model="partSearch" class="editor__search" type="search" placeholder="Parça ara">

      <div class="editor__chips editor__chips--kinds">
        <button type="button" :data-active="kindFilter === 'all' ? '' : undefined" @click="kindFilter = 'all'">
          Tümü {{ definition.parts.length }}
        </button>
        <button
          v-for="kind in kinds"
          :key="kind"
          type="button"
          :data-active="kindFilter === kind ? '' : undefined"
          @click="kindFilter = kind"
        >
          {{ kind }} {{ kindCounts.get(kind) ?? 0 }}
        </button>
      </div>

      <ol class="editor__list">
        <li v-for="part in visibleParts" :key="part.id">
          <button
            type="button"
            :data-active="part.id === selectedPartId ? '' : undefined"
            @click="selectedPartId = part.id"
          >
            <span class="editor__list-kind" :data-kind="part.kind" />
            <span class="editor__list-label">{{ part.label }}</span>
            <span class="editor__list-id">{{ part.id }}</span>
          </button>
        </li>
      </ol>

      <div class="editor__actions">
        <button type="button" @click="addPart">+ Parça</button>
        <button type="button" :disabled="!selectedPart" @click="duplicatePart">Çoğalt</button>
        <button type="button" :disabled="!selectedPart" @click="deletePart">Sil</button>
      </div>
    </aside>

    <!--
      Side-by-side reference. Judging the model against a photograph that is
      painted onto it, or held behind it, is guesswork — the two need to sit
      apart at the same scale to see what is actually off.
    -->
    <figure v-if="compare" class="editor__reference">
      <img :src="definition.referenceImage" :alt="`${definition.code} referans fotoğrafı`">
      <figcaption>Orijinal · {{ definition.code }}</figcaption>
    </figure>

    <DoorModelStage
      ref="stage"
      class="editor__stage"
      :definition="definition"
      :exploded="exploded"
      :reference-opacity="referenceOpacity"
      :show-reference="showReference"
      :wireframe="wireframe"
      :selected-part-id="selectedPartId"
      :revision="revision"
      :textured="textured"
      presentation="editor"
      @select="onSelect"
    />

    <aside class="editor__inspector">
      <header class="editor__head">
        <p class="editor__label">Görünüm</p>
      </header>

      <label class="editor__range">
        <span>Fotoğraf katmanı · {{ Math.round(referenceOpacity * 100) }}%</span>
        <input v-model.number="referenceOpacity" type="range" min="0" max="1" step="0.02">
      </label>
      <label class="editor__range">
        <span>Parça ayrımı · {{ Math.round(exploded * 100) }}%</span>
        <input v-model.number="exploded" type="range" min="0" max="1" step="0.02">
      </label>
      <label class="editor__toggle">
        <input v-model="compare" type="checkbox"><span>Orijinali yanda göster</span>
      </label>
      <label class="editor__toggle">
        <input v-model="textured" type="checkbox"><span>Fotoğrafı modele giydir</span>
      </label>
      <label class="editor__toggle">
        <input v-model="showReference" type="checkbox"><span>Fotoğrafı önde göster</span>
      </label>
      <label class="editor__toggle">
        <input v-model="wireframe" type="checkbox"><span>Tel kafes</span>
      </label>
      <p class="editor__hint">
        Giydirince fotoğraf düzlemi kalkar; doku parçaların üstüne düşer, kenarlarda
        ve kabartmalarda nasıl kırıldığını görürsün.
      </p>
      <p class="editor__model-meta">
        <span>{{ definition.archetype ?? 'özel' }}</span>
        <strong>{{ modelState(definition) }}</strong>
      </p>

      <template v-if="selectedPart">
        <header class="editor__head editor__head--gap">
          <p class="editor__label">Seçili parça</p>
          <input v-model="selectedPart.label" class="editor__search" type="text" @change="persist()">
        </header>

        <div class="editor__grid">
          <label>
            <span>Tip</span>
            <select v-model="selectedPart.kind" @change="changeMeta">
              <option v-for="kind in kinds" :key="kind" :value="kind">{{ kind }}</option>
            </select>
          </label>
          <label>
            <span>Malzeme</span>
            <select v-model="selectedPart.material" @change="changeMeta">
              <option v-for="material in materials" :key="material" :value="material">{{ material }}</option>
            </select>
          </label>
        </div>

        <p class="editor__label editor__label--gap">Konum (m)</p>
        <div class="editor__grid editor__grid--three">
          <label v-for="(axis, index) in ['X', 'Y', 'Z']" :key="`p${axis}`">
            <span>{{ axis }}</span>
            <input
              type="number"
              step="0.005"
              :value="selectedPart.position[index]"
              @input="setVector('position', index as 0 | 1 | 2, Number(($event.target as HTMLInputElement).value))"
            >
          </label>
        </div>

        <p class="editor__label editor__label--gap">Ölçü (m)</p>
        <div class="editor__grid editor__grid--three">
          <label v-for="(axis, index) in ['G', 'Y', 'D']" :key="`s${axis}`">
            <span>{{ axis }}</span>
            <input
              type="number"
              step="0.005"
              min="0.002"
              :value="selectedPart.size[index]"
              @input="setVector('size', index as 0 | 1 | 2, Number(($event.target as HTMLInputElement).value))"
            >
          </label>
        </div>

        <p class="editor__hint">W/S yukarı-aşağı · A/D sağa-sola · Q/E derinlik · Shift ile 10 kat · Delete siler</p>
      </template>

      <p v-else class="editor__hint editor__hint--empty">
        Sahnede bir parçaya tıkla ya da listeden seç.
      </p>

      <div class="editor__actions editor__actions--footer">
        <button type="button" @click="stage?.exportGlb()">GLB indir</button>
        <button type="button" @click="copySource">
          {{ copyState || "Kaynağı kopyala" }}
        </button>
        <button type="button" @click="resetDoor">Sıfırla</button>
      </div>
      <p class="editor__hint">{{ definition.parts.length }} parça · kayıt {{ savedAt || "—" }}</p>
    </aside>
  </section>
</template>

<style scoped>
.editor {
  display: grid;
  min-height: 100svh;
  grid-template-columns: 240px auto minmax(0, 1fr) 290px;
  background: var(--bg-deepest);
  color: var(--text-main);
  font-family: var(--font-body);
}

.editor__parts,
.editor__inspector {
  display: flex;
  max-height: 100svh;
  flex-direction: column;
  gap: 12px;
  padding: 20px 16px 24px;
  overflow-y: auto;
  background: var(--bg-main);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.editor__parts { border-right: 1px solid var(--line); }
.editor__inspector { border-left: 1px solid var(--line); }

.editor__stage { min-height: 100svh; }

/* Reference column: matched to the stage height so the two doors read at the
   same size without any manual zooming. */
.editor__reference {
  display: flex;
  max-height: 100svh;
  margin: 0;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 14px;
  border-right: 1px solid var(--line);
  background: var(--bg-main);
}

.editor__reference img {
  min-height: 0;
  max-width: 320px;
  flex: 1;
  object-fit: contain;
}

.editor__reference figcaption {
  color: var(--text-faint);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.editor__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor__head--gap { margin-top: 10px; }

.editor__model-progress {
  margin: 0;
  color: var(--text-soft);
  font-size: 10px;
  line-height: 1.4;
}

.editor__model-tools {
  display: grid;
  gap: 6px;
}

.editor__label {
  margin: 0;
  color: var(--text-faint);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.editor__label--gap { margin-top: 6px; }

.editor__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.editor__chips button,
.editor__actions button {
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--text-soft);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.editor__chips button:hover,
.editor__actions button:hover:not(:disabled) {
  border-color: var(--line-strong);
  color: var(--text-main);
}

.editor__chips button[data-active] {
  border-color: var(--accent-fg);
  color: var(--text-main);
}

.editor__chips--kinds button { text-transform: capitalize; }

.editor__search,
.editor__select,
.editor__grid input,
.editor__grid select {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.24);
  color: var(--text-main);
  font: inherit;
  font-size: 12px;
  outline: none;
}

.editor__search:focus-visible,
.editor__select:focus-visible,
.editor__grid input:focus-visible,
.editor__grid select:focus-visible {
  border-color: var(--accent-fg);
}

.editor__model-list {
  display: flex;
  max-height: 190px;
  margin: 0;
  padding: 0;
  flex: 0 0 auto;
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--line-strong) transparent;
}

.editor__model-list button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 9px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  color: var(--text-soft);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.editor__model-list li:last-child button { border-bottom: 0; }

.editor__model-list button:hover,
.editor__model-list button[data-active] {
  background: color-mix(in srgb, var(--accent-fg) 16%, transparent);
  color: var(--text-main);
}

.editor__model-list button > span {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7px;
  font-size: 10px;
}

.editor__model-list button > span strong { color: var(--text-main); }
.editor__model-list button > span:not(strong) { overflow: hidden; }

.editor__model-list small {
  color: var(--text-faint);
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.editor__model-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 8px 0;
  border-block: 1px solid var(--line);
  color: var(--text-faint);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.editor__model-meta strong { color: var(--text-main); }

.editor__list {
  display: flex;
  min-height: 120px;
  margin: 0;
  padding: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.editor__list button {
  display: grid;
  width: 100%;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  border: 0;
  background: transparent;
  color: var(--text-soft);
  font: inherit;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
}

.editor__list button:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
.editor__list button[data-active] { background: color-mix(in srgb, var(--accent-fg) 22%, transparent); color: var(--text-main); }

.editor__list-kind {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--text-faint);
}

.editor__list-kind[data-kind="frame"] { background: #9fa7bd; }
.editor__list-kind[data-kind="leaf"] { background: #c8cee0; }
.editor__list-kind[data-kind="panel"] { background: #a77a55; }
.editor__list-kind[data-kind="glass"] { background: #8ea2ff; }
.editor__list-kind[data-kind="trim"] { background: #5d6788; }
.editor__list-kind[data-kind="hardware"] { background: #f4f6ff; }

.editor__list-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.editor__list-id { color: var(--text-faint); font-size: 9px; }

.editor__actions {
  display: flex;
  gap: 6px;
}

.editor__actions--footer {
  margin-top: auto;
  flex-wrap: wrap;
}
.editor__actions button:disabled { opacity: 0.4; cursor: not-allowed; }

.editor__range {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--text-soft);
  font-size: 11px;
}

.editor__range input { width: 100%; accent-color: var(--accent-fg); }

.editor__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-soft);
  font-size: 12px;
  cursor: pointer;
}

.editor__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.editor__grid--three { grid-template-columns: repeat(3, 1fr); }

.editor__grid label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text-faint);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.editor__hint {
  margin: 0;
  color: var(--text-faint);
  font-size: 10px;
  line-height: 1.55;
}

.editor__hint--empty { margin-top: 12px; }

@media (max-width: 1400px) {
  .editor { grid-template-columns: 220px minmax(0, 1fr) 280px; }
  .editor__reference { display: none; }
}

@media (max-width: 1100px) {
  .editor { grid-template-columns: minmax(0, 1fr); }
  .editor__parts, .editor__inspector { max-height: none; }
  .editor__stage { min-height: 60svh; }
}
</style>
