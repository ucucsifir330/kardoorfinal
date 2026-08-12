<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { products } from "~/data/products";

definePageMeta({
  pageTransition: false
});

useSeoMeta({
  title: "Door Prism · WebGL Prototype",
  robots: "noindex, nofollow"
});

useHead({
  bodyAttrs: { class: "door3d-active" }
});

const imageBuilder = useImage();
const imageKitBaseUrl = "https://ik.imagekit.io/kardoor";
const imageKitPath = (source: string) =>
  source.startsWith(imageKitBaseUrl) ? source.slice(imageKitBaseUrl.length) : source;
const specimenSource = (source: string) => imageBuilder.museumSpecimen(imageKitPath(source));

/* ------------------------------------------------------------------ catalogue */

const query = ref("");
const seriesFilter = ref("all");

const seriesOptions = computed(() => {
  const seen = new Map<string, { slug: string; title: string; count: number }>();
  for (const product of products) {
    const entry = seen.get(product.seriesSlug);
    if (entry) entry.count += 1;
    else seen.set(product.seriesSlug, { slug: product.seriesSlug, title: product.seriesTitle, count: 1 });
  }
  return [...seen.values()];
});

const visibleProducts = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase("tr-TR");
  return products.filter((product) => {
    if (seriesFilter.value !== "all" && product.seriesSlug !== seriesFilter.value) return false;
    if (!needle) return true;
    return `${product.code} ${product.name}`.toLocaleLowerCase("tr-TR").includes(needle);
  });
});

const activeCode = ref(products[0]!.code);
const activeProduct = computed(
  () => products.find((product) => product.code === activeCode.value) ?? products[0]!
);
const activeVisibleIndex = computed(() =>
  visibleProducts.value.findIndex((product) => product.code === activeCode.value)
);
const currentSource = computed(() => specimenSource(activeProduct.value.image));

const stepProduct = (delta: number) => {
  const list = visibleProducts.value;
  if (!list.length) return;
  const current = activeVisibleIndex.value;
  activeCode.value = list[current < 0 ? 0 : (current + delta + list.length) % list.length]!.code;
};

watch(visibleProducts, (list) => {
  if (list.length && !list.some((product) => product.code === activeCode.value)) {
    activeCode.value = list[0]!.code;
  }
});

/* --------------------------------------------------------------- scene state */

const canvasElement = ref<HTMLCanvasElement | null>(null);
const stageElement = ref<HTMLElement | null>(null);
const listElement = ref<HTMLElement | null>(null);

const status = ref("başlatılıyor");
const showSkeleton = ref(true);
const skeletonCanvas = ref<HTMLCanvasElement | null>(null);
const structureSummary = ref("");
const rotationDeg = ref(0);
const limitRotation = ref(true);
const thicknessCm = ref(7);
const edgeMetalness = ref(0.55);
const showFloor = ref(true);
const autoSpin = ref(false);
const normalStrength = ref(1.8);

// three objects live outside Vue's reactivity — they are large and mutate every frame
const three = shallowRef<Record<string, any> | null>(null);
let disposed = false;

/**
 * Alpha bounds are still measured per model, but now they drive the texture crop
 * and the mesh aspect instead of CSS boxes. Column/row density rather than a bare
 * alpha test: AL-001's drop shadow reaches 996‰ of the image width, and a naive
 * test stretched the leaf to the shadow's edge.
 */
const measureDoor = async (url: string) => {
  const response = await fetch(url, { mode: "cors" });
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(bitmap, 0, 0);

  const { width, height } = bitmap;
  const { data } = context.getImageData(0, 0, width, height);
  const OPAQUE = 60;
  const columns = new Uint32Array(width);
  const rows = new Uint32Array(height);
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) <= OPAQUE) continue;
      columns[x] += 1;
      rows[y] += 1;
    }
  }
  const columnFloor = (height / 2) * 0.03;
  const rowFloor = (width / 2) * 0.03;
  let left = 0;
  let right = width - 1;
  let top = 0;
  let bottom = height - 1;
  while (left < width && (columns[left] ?? 0) < columnFloor) left += 1;
  while (right > left && (columns[right] ?? 0) < columnFloor) right -= 1;
  while (top < height && (rows[top] ?? 0) < rowFloor) top += 1;
  while (bottom > top && (rows[bottom] ?? 0) < rowFloor) bottom -= 1;

  // Average edge colour drives the extruded side material, so a walnut leaf gets
  // walnut edges and a steel one gets steel — no per-model authoring.
  const sample = (x: number, y: number) => {
    const i = (Math.round(y) * width + Math.round(x)) * 4;
    return (data[i + 3] ?? 0) > OPAQUE ? [data[i]!, data[i + 1]!, data[i + 2]!] : null;
  };
  let r = 0;
  let g = 0;
  let b = 0;
  let hits = 0;
  for (let s = 0; s <= 12; s += 1) {
    const y = top + ((bottom - top) * s) / 12;
    for (const x of [left + 3, right - 3]) {
      const pixel = sample(x, y);
      if (!pixel) continue;
      r += pixel[0];
      g += pixel[1];
      b += pixel[2];
      hits += 1;
    }
  }
  const edge = hits ? [r / hits / 255, g / hits / 255, b / hits / 255] : [0.32, 0.34, 0.4];

  return {
    crop: { x: left / width, y: top / height, w: (right - left) / width, h: (bottom - top) / height },
    aspect: (right - left) / (bottom - top),
    edge
  };
};

/**
 * Surface maps derived from the photograph itself.
 *
 * A single albedo on a flat plane is why the leaf still read as thick paper: the
 * handle, the panel rebates and the frame are painted into the pixels, so they
 * never catch light. Luminance carries that relief information — panel grooves
 * are darker, mouldings catch highlights — so a height field can be recovered
 * from it and turned into a normal map (Sobel) plus a roughness map. Nothing is
 * authored per model; every door gets its own relief for free.
 */
const buildSurfaceMaps = (
  bitmap: ImageBitmap,
  crop: { x: number; y: number; w: number; h: number }
) => {
  const width = 640;
  const height = Math.max(64, Math.round((width * (crop.h * bitmap.height)) / (crop.w * bitmap.width)));

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(
    bitmap,
    crop.x * bitmap.width,
    crop.y * bitmap.height,
    crop.w * bitmap.width,
    crop.h * bitmap.height,
    0,
    0,
    width,
    height
  );

  const source = context.getImageData(0, 0, width, height);
  const pixels = source.data;
  const count = width * height;

  const luminance = new Float32Array(count);
  const alpha = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const p = i * 4;
    alpha[i] = (pixels[p + 3] ?? 0) / 255;
    luminance[i] =
      ((pixels[p] ?? 0) * 0.299 + (pixels[p + 1] ?? 0) * 0.587 + (pixels[p + 2] ?? 0) * 0.114) / 255;
  }

  // Small box blur: raw pixel noise would otherwise become surface sparkle.
  const smoothed = new Float32Array(count);
  const radius = 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let total = 0;
      let samples = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          total += luminance[yy * width + xx]!;
          samples += 1;
        }
      }
      smoothed[y * width + x] = total / samples;
    }
  }

  const normalData = new Uint8ClampedArray(count * 4);
  const roughData = new Uint8ClampedArray(count * 4);
  const heightData = new Uint8ClampedArray(count * 4);
  const strength = 2.6;

  const at = (x: number, y: number) =>
    smoothed[Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))]!;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const p = i * 4;
      const opaque = alpha[i]! > 0.4;

      // Sobel gradient of the height field.
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      let nx = opaque ? dx * strength : 0;
      let ny = opaque ? dy * strength : 0;
      const length = Math.hypot(nx, ny, 1);
      nx /= length;
      ny /= length;
      const nz = 1 / length;

      normalData[p] = (nx * 0.5 + 0.5) * 255;
      normalData[p + 1] = (ny * 0.5 + 0.5) * 255;
      normalData[p + 2] = (nz * 0.5 + 0.5) * 255;
      normalData[p + 3] = 255;

      // Bright pixels are the polished bits — handles, glass, metal trim.
      const level = smoothed[i]!;
      const rough = opaque ? Math.min(1, Math.max(0.12, 1 - level * 0.72)) : 1;
      const value = rough * 255;
      roughData[p] = value;
      roughData[p + 1] = value;
      roughData[p + 2] = value;
      roughData[p + 3] = 255;

      const relief = opaque ? level * 255 : 0;
      heightData[p] = relief;
      heightData[p + 1] = relief;
      heightData[p + 2] = relief;
      heightData[p + 3] = 255;
    }
  }

  return {
    width,
    height,
    normal: new ImageData(normalData, width, height),
    roughness: new ImageData(roughData, width, height),
    displacement: new ImageData(heightData, width, height)
  };
};

type StructureCell = {
  x: number; y: number; w: number; h: number;
  kind: "glass" | "panel" | "rail";
  level: number;
};

type DoorStructure = {
  width: number;
  height: number;
  verticals: number[];
  horizontals: number[];
  cells: StructureCell[];
};

/**
 * Pull the door's skeleton out of the photograph before any geometry is built.
 *
 * A door is a rectangular grid: stiles and rails frame a set of openings that are
 * either solid panels or glazing. Those dividers are long, straight, high-contrast
 * runs, so summing the gradient down each column and across each row makes them
 * stand out as peaks. The peaks become the grid; every cell it encloses is then
 * classified by what is inside it. This is measurement, not guesswork — a door
 * with three panels yields three cells, one with a sidelight yields a tall glazed
 * column at the edge.
 */
const extractStructure = (
  bitmap: ImageBitmap,
  crop: { x: number; y: number; w: number; h: number }
): DoorStructure => {
  const width = 300;
  const height = Math.max(80, Math.round((width * (crop.h * bitmap.height)) / (crop.w * bitmap.width)));
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(
    bitmap,
    crop.x * bitmap.width, crop.y * bitmap.height,
    crop.w * bitmap.width, crop.h * bitmap.height,
    0, 0, width, height
  );
  const { data } = context.getImageData(0, 0, width, height);

  const grey = new Float32Array(width * height);
  const sat = new Float32Array(width * height);
  const warmth = new Float32Array(width * height);
  const opaque = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const p = i * 4;
    opaque[i] = (data[p + 3] ?? 0) > 120 ? 1 : 0;
    const r = data[p]!;
    const g = data[p + 1]!;
    const b = data[p + 2]!;
    grey[i] = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    sat[i] = max === 0 ? 0 : (max - min) / max;
    // Red minus blue: timber and laminate run warm, glazing and steel do not.
    warmth[i] = (r - b) / 255;
  }

  /**
   * Continuity, not energy.
   *
   * Summing gradient magnitude per axis counted wood grain as structure: on
   * CM-019 it reported 13 horizontal rails and split the door into 84 cells. A
   * real stile or rail runs the whole length of the leaf, whereas grain is short
   * and broken. So instead of "how much edge is in this column", the measure is
   * "what fraction of this column is edge" — grain never clears that bar.
   */
  const gradientAt = (i: number, horizontal: boolean) =>
    horizontal ? Math.abs(grey[i + 1]! - grey[i - 1]!) : Math.abs(grey[i + width]! - grey[i - width]!);

  // Adaptive threshold from the gradient distribution itself.
  const magnitudes: number[] = [];
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = y * width + x;
      if (!opaque[i]) continue;
      magnitudes.push(Math.max(gradientAt(i, true), gradientAt(i, false)));
    }
  }
  magnitudes.sort((a, b) => a - b);
  const edgeCutoff = Math.max(0.055, magnitudes[Math.floor(magnitudes.length * 0.9)] ?? 0.1);

  const continuity = (horizontal: boolean) => {
    const span = horizontal ? width : height;
    const cross = horizontal ? height : width;
    const ratio = new Float32Array(span);
    for (let s = 1; s < span - 1; s += 1) {
      let hits = 0;
      let covered = 0;
      for (let c = 1; c < cross - 1; c += 1) {
        const i = horizontal ? c * width + s : s * width + c;
        if (!opaque[i]) continue;
        covered += 1;
        if (gradientAt(i, horizontal) > edgeCutoff) hits += 1;
      }
      ratio[s] = covered > cross * 0.3 ? hits / covered : 0;
    }
    return ratio;
  };

  /**
   * Rank candidates and keep the strongest few, rather than accepting everything
   * over a fixed bar. A single threshold cannot serve the whole range: at 0.5 it
   * found only three dividers on CM-019 (missing the glazing bars entirely) while
   * flooding flatter doors. Taking the best N separated peaks adapts per door.
   */
  const dividersFrom = (ratio: Float32Array, span: number, minGap: number, maxCount: number) => {
    const candidates: Array<{ index: number; value: number }> = [];
    for (let s = 2; s < span - 2; s += 1) {
      const value = ratio[s] ?? 0;
      if (value < 0.3) continue;
      if (value < (ratio[s - 1] ?? 0) || value < (ratio[s + 1] ?? 0)) continue;
      candidates.push({ index: s, value });
    }
    candidates.sort((a, b) => b.value - a.value);

    const chosen: number[] = [];
    for (const candidate of candidates) {
      if (chosen.length >= maxCount) break;
      if (chosen.some((index) => Math.abs(index - candidate.index) < minGap)) continue;
      chosen.push(candidate.index);
    }
    return chosen.sort((a, b) => a - b);
  };

  const columnRatio = continuity(true);
  const rowRatio = continuity(false);

  const verticals = [0, ...dividersFrom(columnRatio, width, Math.round(width * 0.07), 6), width - 1];
  const horizontals = [0, ...dividersFrom(rowRatio, height, Math.round(height * 0.05), 6), height - 1];

  const cells: StructureCell[] = [];
  for (let row = 0; row < horizontals.length - 1; row += 1) {
    for (let column = 0; column < verticals.length - 1; column += 1) {
      const x0 = verticals[column]!;
      const x1 = verticals[column + 1]!;
      const y0 = horizontals[row]!;
      const y1 = horizontals[row + 1]!;
      const cellW = x1 - x0;
      const cellH = y1 - y0;
      if (cellW < width * 0.04 || cellH < height * 0.02) continue;

      let total = 0;
      let totalSat = 0;
      let totalWarmth = 0;
      let squared = 0;
      let samples = 0;
      let covered = 0;
      let detailed = 0;
      for (let y = y0 + 2; y < y1 - 1; y += 2) {
        for (let x = x0 + 2; x < x1 - 1; x += 2) {
          const i = y * width + x;
          samples += 1;
          if (!opaque[i]) continue;
          covered += 1;
          const value = grey[i]!;
          total += value;
          squared += value * value;
          totalSat += sat[i]!;
          totalWarmth += warmth[i]!;
          if (Math.max(gradientAt(i, true), gradientAt(i, false)) > edgeCutoff) detailed += 1;
        }
      }
      if (!covered || covered / Math.max(1, samples) < 0.55) continue;

      const level = total / covered;
      const variance = squared / covered - level * level;
      const saturation = totalSat / covered;
      const warm = totalWarmth / covered;

      /**
       * Pattern density is the deciding signal, with colour temperature only
       * breaking ties.
       *
       * Two earlier passes each failed in one direction: keying on brightness
       * reported zero glass on CM-019 (its leaded panes are dark), then keying on
       * neutral colour called AL-001 all glass (it is grey aluminium). What glass
       * actually has — leaded bars, etched motifs, whatever is behind it — is
       * detail. A flat metal or timber panel has almost none.
       */
      const detail = detailed / covered;
      const slim = cellW < width * 0.09 || cellH < height * 0.045;
      const warmMaterial = warm > 0.1;
      const kind: StructureCell["kind"] = slim
        ? "rail"
        : detail > 0.2 && !warmMaterial
          ? "glass"
          : detail > 0.32
            ? "glass"
            : "panel";

      cells.push({ x: x0 / width, y: y0 / height, w: cellW / width, h: cellH / height, kind, level });
    }
  }

  return { width, height, verticals, horizontals, cells };
};

/**
 * Find the handle in the photograph.
 *
 * Hardware is the brightest, most saturated-free thing on a door and it always
 * lives in the same band: roughly mid-height, near one vertical edge. Threshold
 * for specular pixels inside that band, group them with a flood fill, then keep
 * the blob whose shape and position actually look like a handle. What comes back
 * is a real measurement off that specific door, so a long bar pull and a small
 * round knob produce different geometry.
 */
const detectHandle = (
  bitmap: ImageBitmap,
  crop: { x: number; y: number; w: number; h: number }
) => {
  const width = 240;
  const height = Math.max(64, Math.round((width * (crop.h * bitmap.height)) / (crop.w * bitmap.width)));
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(
    bitmap,
    crop.x * bitmap.width, crop.y * bitmap.height,
    crop.w * bitmap.width, crop.h * bitmap.height,
    0, 0, width, height
  );
  const { data } = context.getImageData(0, 0, width, height);

  const bandTop = Math.floor(height * 0.3);
  const bandBottom = Math.ceil(height * 0.72);

  // Specular = bright and close to neutral. Wood grain highlights are warm and
  // get rejected by the saturation test.
  const bright: boolean[] = new Array(width * height).fill(false);
  const values: number[] = [];
  for (let y = bandTop; y < bandBottom; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = (y * width + x) * 4;
      if ((data[p + 3] ?? 0) < 120) continue;
      const r = data[p]!;
      const g = data[p + 1]!;
      const b = data[p + 2]!;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const level = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      if (saturation < 0.28) values.push(level);
    }
  }
  if (values.length < 50) return null;
  values.sort((a, b) => a - b);
  const cutoff = Math.max(0.5, values[Math.floor(values.length * 0.985)] ?? 0.8);

  for (let y = bandTop; y < bandBottom; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = (y * width + x) * 4;
      if ((data[p + 3] ?? 0) < 120) continue;
      const r = data[p]!;
      const g = data[p + 1]!;
      const b = data[p + 2]!;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const level = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      bright[y * width + x] = saturation < 0.28 && level >= cutoff;
    }
  }

  const seen = new Uint8Array(width * height);
  type Blob = { minX: number; maxX: number; minY: number; maxY: number; count: number };
  const blobs: Blob[] = [];
  const stack: number[] = [];

  for (let y = bandTop; y < bandBottom; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (!bright[start] || seen[start]) continue;
      const blob: Blob = { minX: x, maxX: x, minY: y, maxY: y, count: 0 };
      stack.push(start);
      seen[start] = 1;
      while (stack.length) {
        const index = stack.pop()!;
        const cx = index % width;
        const cy = (index - cx) / width;
        blob.count += 1;
        if (cx < blob.minX) blob.minX = cx;
        if (cx > blob.maxX) blob.maxX = cx;
        if (cy < blob.minY) blob.minY = cy;
        if (cy > blob.maxY) blob.maxY = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= width || ny < bandTop || ny >= bandBottom) continue;
          const next = ny * width + nx;
          if (bright[next] && !seen[next]) {
            seen[next] = 1;
            stack.push(next);
          }
        }
      }
      if (blob.count >= 12) blobs.push(blob);
    }
  }
  if (!blobs.length) return null;

  // Score: prefer blobs sitting off-centre horizontally (handles hug an edge),
  // near mid-height, and tall rather than wide.
  let best: { blob: Blob; score: number } | null = null;
  for (const blob of blobs) {
    const cx = (blob.minX + blob.maxX) / 2 / width;
    const cy = (blob.minY + blob.maxY) / 2 / height;
    const bw = (blob.maxX - blob.minX + 1) / width;
    const bh = (blob.maxY - blob.minY + 1) / height;
    if (bw > 0.32 || bh > 0.62) continue;         // frame or glazing, not hardware
    const edgeAffinity = Math.abs(cx - 0.5);       // 0 centre, 0.5 at the edge
    const verticality = bh / Math.max(bw, 0.004);
    const score =
      edgeAffinity * 2.4 +
      (1 - Math.abs(cy - 0.5) * 2) * 1.2 +
      Math.min(verticality, 8) * 0.16 +
      Math.min(blob.count / (width * height), 0.02) * 6;
    if (!best || score > best.score) best = { blob, score };
  }
  if (!best) return null;

  const { blob } = best;
  return {
    // Normalised to the leaf: 0..1 across, 0..1 down.
    x: (blob.minX + blob.maxX) / 2 / width,
    y: (blob.minY + blob.maxY) / 2 / height,
    w: (blob.maxX - blob.minX + 1) / width,
    h: (blob.maxY - blob.minY + 1) / height,
    onLeft: (blob.minX + blob.maxX) / 2 / width < 0.5
  };
};

/**
 * Build the handle as real geometry from those measurements — a bar pull when the
 * blob is tall, a lever/knob when it is compact. Both stand off the leaf on
 * rosettes, so they cast their own shadow and break the silhouette at an angle,
 * which a normal map can never do.
 */
const buildHandle = (
  THREE: any,
  handle: { x: number; y: number; w: number; h: number; onLeft: boolean },
  leafWidth: number,
  thickness: number
) => {
  const group = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xd6dae2,
    metalness: 0.96,
    roughness: 0.22,
    clearcoat: 0.4
  });

  const barHeight = Math.max(0.11, handle.h * DOOR_HEIGHT);
  const isBar = handle.h / Math.max(handle.w, 0.005) > 2.2;
  const standOff = 0.055;

  if (isBar) {
    const bar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.0135, Math.max(0.06, barHeight - 0.027), 6, 16),
      metal
    );
    bar.position.z = thickness / 2 + standOff;
    bar.castShadow = true;
    group.add(bar);

    for (const offset of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, standOff, 14), metal);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(0, (offset * (barHeight - 0.05)) / 2, thickness / 2 + standOff / 2);
      arm.castShadow = true;
      group.add(arm);
    }
  } else {
    const rosette = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.012, 24), metal);
    rosette.rotation.x = Math.PI / 2;
    rosette.position.z = thickness / 2 + 0.006;
    rosette.castShadow = true;
    group.add(rosette);

    const lever = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.085, 6, 14), metal);
    lever.rotation.z = Math.PI / 2;
    lever.position.set(handle.onLeft ? 0.045 : -0.045, 0, thickness / 2 + 0.03);
    lever.castShadow = true;
    group.add(lever);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.03, 14), metal);
    neck.rotation.x = Math.PI / 2;
    neck.position.z = thickness / 2 + 0.02;
    neck.castShadow = true;
    group.add(neck);
  }

  group.position.set((handle.x - 0.5) * leafWidth, (0.5 - handle.y) * DOOR_HEIGHT, 0);
  return { group, metal, isBar };
};

/* ------------------------------------------------------------------- geometry */

const DOOR_HEIGHT = 2.1; // metres — the constant across the range

const buildDoorGeometry = (THREE: any, aspect: number, thickness: number) => {
  const width = DOOR_HEIGHT * aspect;
  const half = { w: width / 2, h: DOOR_HEIGHT / 2 };

  // A bevelled extrusion, not a box: the chamfer is what catches the key light
  // along the edge and is the single biggest reason a CSS box reads as cardboard.
  const bevel = Math.min(0.012, thickness * 0.28);
  const shape = new THREE.Shape();
  shape.moveTo(-half.w + bevel, -half.h);
  shape.lineTo(half.w - bevel, -half.h);
  shape.quadraticCurveTo(half.w, -half.h, half.w, -half.h + bevel);
  shape.lineTo(half.w, half.h - bevel);
  shape.quadraticCurveTo(half.w, half.h, half.w - bevel, half.h);
  shape.lineTo(-half.w + bevel, half.h);
  shape.quadraticCurveTo(-half.w, half.h, -half.w, half.h - bevel);
  shape.lineTo(-half.w, -half.h + bevel);
  shape.quadraticCurveTo(-half.w, -half.h, -half.w + bevel, -half.h);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 3
  });
  geometry.center();
  geometry.computeVertexNormals();

  // Extrude UVs come out in shape space; remap the caps so the photograph lands
  // square on the leaf.
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i += 1) {
    uv.setXY(i, (position.getX(i) + half.w) / width, (position.getY(i) + half.h) / DOOR_HEIGHT);
  }
  uv.needsUpdate = true;

  return { geometry, width };
};

/**
 * Draw the recovered skeleton: the stile/rail grid as bars, each opening tinted
 * by what it was classified as, and the handle marked where it was found. This is
 * the check before anything is modelled — if the drawing is wrong, the 3D will be
 * wrong in exactly the same way, and it is visible here in one glance.
 */
const drawSkeleton = (
  structure: DoorStructure,
  handle: { x: number; y: number; w: number; h: number } | null
) => {
  const canvas = skeletonCanvas.value;
  if (!canvas) return;

  const scale = 190 / structure.width;
  const w = Math.round(structure.width * scale);
  const h = Math.round(structure.height * scale);
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d")!;

  context.clearRect(0, 0, w, h);
  context.fillStyle = "rgba(4, 8, 20, 0.92)";
  context.fillRect(0, 0, w, h);

  const tint: Record<StructureCell["kind"], string> = {
    glass: "rgba(120, 190, 255, 0.30)",
    panel: "rgba(226, 150, 78, 0.26)",
    rail: "rgba(190, 200, 225, 0.10)"
  };

  for (const cell of structure.cells) {
    context.fillStyle = tint[cell.kind];
    context.fillRect(cell.x * w, cell.y * h, cell.w * w, cell.h * h);
  }

  // The grid itself — these are the bars the frame will be built from.
  context.strokeStyle = "rgba(235, 240, 255, 0.75)";
  context.lineWidth = 1;
  context.beginPath();
  for (const x of structure.verticals) {
    const px = Math.round((x / structure.width) * w) + 0.5;
    context.moveTo(px, 0);
    context.lineTo(px, h);
  }
  for (const y of structure.horizontals) {
    const py = Math.round((y / structure.height) * h) + 0.5;
    context.moveTo(0, py);
    context.lineTo(w, py);
  }
  context.stroke();

  context.strokeStyle = "rgba(134, 163, 251, 0.95)";
  context.lineWidth = 2;
  context.strokeRect(1, 1, w - 2, h - 2);

  if (handle) {
    context.fillStyle = "rgba(255, 96, 96, 0.9)";
    const hw = Math.max(4, handle.w * w);
    const hh = Math.max(4, handle.h * h);
    context.fillRect(handle.x * w - hw / 2, handle.y * h - hh / 2, hw, hh);
  }
};

/* ---------------------------------------------------------------- scene setup */

const initScene = async () => {
  const THREE = await import("three");
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
  if (disposed) return;

  const canvas = canvasElement.value!;
  const host = stageElement.value!;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap is deprecated in three 0.185; softness comes from
  // shadow.radius on the light instead.
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();

  // Procedural room environment: gives metal and glass something to reflect
  // without shipping an HDR file. Held well below 1 — at full strength the room
  // washed the leaf out to near-white and buried the photograph's own contrast.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
  camera.position.set(0, 1.24, 7.3);
  camera.lookAt(0, 1.04, 0);

  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-3.2, 4.4, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 18;
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -1;
  key.shadow.bias = -0.0008;
  key.shadow.radius = 3;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9db4ff, 0.75);
  rim.position.set(4.5, 2.2, -3.5);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0x415072, 0.28));

  /**
   * Shadow catcher, not a floor slab. A lit plane read as a huge grey sheet
   * stretching to the horizon and fought the page background; ShadowMaterial
   * draws nothing but the shadow itself, so the CSS gradient stays the ground.
   */
  const floor = new THREE.Group();
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.ShadowMaterial({ opacity: 0.55 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.receiveShadow = true;
  floor.add(shadowCatcher);

  // A shallow polished pool right under the leaf carries a soft reflection
  // without turning the whole scene into a mirror.
  // Radial alpha so the pool dissolves instead of ending on a hard circle edge.
  const fade = document.createElement("canvas");
  fade.width = 256;
  fade.height = 256;
  const fadeContext = fade.getContext("2d")!;
  const gradient = fadeContext.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.72)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  fadeContext.fillStyle = gradient;
  fadeContext.fillRect(0, 0, 256, 256);
  const fadeTexture = new THREE.CanvasTexture(fade);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.1, 64),
    new THREE.MeshStandardMaterial({
      color: 0x0a1128,
      roughness: 0.16,
      metalness: 0.85,
      transparent: true,
      opacity: 0.78,
      alphaMap: fadeTexture
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.001;
  floor.add(pool);
  scene.add(floor);

  const doorGroup = new THREE.Group();
  scene.add(doorGroup);

  /**
   * The photograph lives on its own dense plane in front of the body, not on the
   * extrusion's cap. The extrusion has no interior tessellation, so it cannot be
   * displaced — and displacement is what lifts the handle and the panel rebates
   * off the surface instead of leaving them painted on.
   */
  const faceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.12,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    transparent: true,
    alphaTest: 0.5
  });

  const backMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x141a2e,
    roughness: 0.6,
    metalness: 0.25
  });
  const edgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2b3350,
    roughness: 0.34,
    metalness: edgeMetalness.value
  });

  let mesh: any = null;

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(320, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  let frame = 0;
  const render = () => {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    if (autoSpin.value) rotationDeg.value += 0.35;
    if (doorGroup) doorGroup.rotation.y = (rotationDeg.value * Math.PI) / 180;
    renderer.render(scene, camera);
  };
  render();

  three.value = {
    THREE, renderer, scene, camera, doorGroup, faceMaterial, backMaterial, edgeMaterial, floor,
    pmrem, observer,
    getMesh: () => mesh,
    setMesh: (next: any) => { mesh = next; },
    stop: () => cancelAnimationFrame(frame)
  };
};

/** Swap the door: measure, crop the texture, rebuild the extrusion. */
const loadDoor = async (url: string) => {
  const ctx = three.value;
  if (!ctx) return;
  const { THREE, doorGroup, edgeMaterial } = ctx;

  status.value = "ölçülüyor";
  let measured;
  try {
    measured = await measureDoor(url);
  } catch {
    status.value = "ölçüm başarısız";
    return;
  }
  if (disposed) return;

  status.value = "iskelet çıkarılıyor";

  const bitmap = await createImageBitmap(await (await fetch(url, { mode: "cors" })).blob());
  if (disposed) return;

  const structure = extractStructure(bitmap, measured.crop);
  const handle = detectHandle(bitmap, measured.crop);
  drawSkeleton(structure, handle);

  const glass = structure.cells.filter((cell) => cell.kind === "glass").length;
  const panels = structure.cells.filter((cell) => cell.kind === "panel").length;
  structureSummary.value =
    `${structure.verticals.length - 2} dikey · ${structure.horizontals.length - 2} yatay çıta · ` +
    `${panels} panel · ${glass} cam${handle ? " · kol bulundu" : " · kol yok"}`;

  status.value = "yüzey çıkarılıyor";
  const maps = buildSurfaceMaps(bitmap, measured.crop);

  const toTexture = (data: ImageData, srgb: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = data.width;
    canvas.height = data.height;
    canvas.getContext("2d")!.putImageData(data, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    return texture;
  };

  // Albedo is the cropped photograph itself, drawn once at the same resolution
  // as the derived maps so every channel shares one UV space.
  const albedoCanvas = document.createElement("canvas");
  albedoCanvas.width = maps.width;
  albedoCanvas.height = maps.height;
  albedoCanvas.getContext("2d")!.drawImage(
    bitmap,
    measured.crop.x * bitmap.width,
    measured.crop.y * bitmap.height,
    measured.crop.w * bitmap.width,
    measured.crop.h * bitmap.height,
    0,
    0,
    maps.width,
    maps.height
  );
  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy();

  if (import.meta.dev) {
    const probe = albedoCanvas.getContext("2d")!.getImageData(
      Math.floor(maps.width / 2),
      Math.floor(maps.height / 2),
      1,
      1
    ).data;
    (window as unknown as Record<string, unknown>).__albedoProbe = [...probe];
  }

  /**
   * A fresh material per door rather than re-pointing the maps on a shared one.
   * The shared instance was first compiled with no map at all, and swapping the
   * textures in afterwards left the panel rendering black even though the albedo
   * canvas was verified correct — building the material once the maps exist
   * sidesteps the recompile entirely.
   */
  const previousFace = ctx.faceMaterial;
  const faceMaterial = new THREE.MeshPhysicalMaterial({
    map: albedo,
    normalMap: toTexture(maps.normal, false),
    roughnessMap: toTexture(maps.roughness, false),
    roughness: 1,
    metalness: 0.12,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    transparent: true,
    alphaTest: 0.5
  });
  faceMaterial.normalScale.set(normalStrength.value, normalStrength.value);
  ctx.faceMaterial = faceMaterial;

  edgeMaterial.color.setRGB(measured.edge[0], measured.edge[1], measured.edge[2]);
  bitmap.close();

  const previous = ctx.getMesh();
  if (previous) {
    doorGroup.remove(previous);
    previous.traverse((child: any) => child.geometry?.dispose?.());
  }
  if (previousFace && previousFace !== faceMaterial) {
    for (const key of ["map", "normalMap", "roughnessMap"] as const) {
      previousFace[key]?.dispose();
    }
    previousFace.dispose();
  }

  const thickness = thicknessCm.value / 100;
  const { geometry, width } = buildDoorGeometry(THREE, measured.aspect, thickness);

  /**
   * The photograph goes back on the extrusion's own cap rather than a separate
   * displaced plane. The plane was tried first and kept losing the depth test to
   * the body's front cap, rendering the leaf as a flat dark rectangle. Displacement
   * is given up with it — the cap has no interior tessellation — but the normal
   * map does the heavy lifting anyway: the handle, panel rebates and mouldings
   * now catch and lose light as the door turns, which is the part that read wrong.
   */
  const group = new THREE.Group();

  const body = new THREE.Mesh(geometry, [faceMaterial, edgeMaterial]);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  group.position.y = DOOR_HEIGHT / 2;
  doorGroup.add(group);
  ctx.setMesh(group);

  status.value = `hazır · ${measured.aspect.toFixed(2)} en/boy · ${maps.width}×${maps.height} yüzey`;
};

/* -------------------------------------------------------------- interactions */

const clampRotation = (value: number) => (limitRotation.value ? Math.max(-70, Math.min(70, value)) : value);

let dragging = false;
let lastX = 0;
let velocity = 0;

const onPointerDown = (event: PointerEvent) => {
  dragging = true;
  autoSpin.value = false;
  lastX = event.clientX;
  velocity = 0;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
};

const onPointerMove = (event: PointerEvent) => {
  if (!dragging) return;
  const delta = event.clientX - lastX;
  lastX = event.clientX;
  velocity = delta;
  rotationDeg.value = clampRotation(rotationDeg.value + delta * 0.42);
};

const onPointerUp = (event: PointerEvent) => {
  if (!dragging) return;
  dragging = false;
  (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);

  // Inertia, decayed on the render loop rather than tweened, so it interacts
  // cleanly with auto-spin and with a new drag landing mid-glide.
  const settle = () => {
    if (disposed || dragging || Math.abs(velocity) < 0.15) return;
    velocity *= 0.93;
    rotationDeg.value = clampRotation(rotationDeg.value + velocity * 0.42);
    requestAnimationFrame(settle);
  };
  settle();
};

const resetView = () => {
  autoSpin.value = false;
  rotationDeg.value = 0;
};

const normalisedAngle = computed(() => Math.round(((rotationDeg.value % 360) + 360) % 360));
const facingBack = computed(() => normalisedAngle.value > 90 && normalisedAngle.value < 270);

const onKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
  if (event.key === "ArrowLeft") rotationDeg.value = clampRotation(rotationDeg.value - 8);
  if (event.key === "ArrowRight") rotationDeg.value = clampRotation(rotationDeg.value + 8);
  if (event.key === "ArrowDown") { event.preventDefault(); stepProduct(1); }
  if (event.key === "ArrowUp") { event.preventDefault(); stepProduct(-1); }
  if (event.key.toLowerCase() === "r") resetView();
};

/* ------------------------------------------------------------------ lifecycle */

watch(currentSource, (url) => void loadDoor(url));

watch(thicknessCm, () => void loadDoor(currentSource.value));

watch(edgeMetalness, (value) => {
  const ctx = three.value;
  if (ctx) ctx.edgeMaterial.metalness = value;
});


watch(normalStrength, (value) => {
  const ctx = three.value;
  if (ctx) ctx.faceMaterial.normalScale.set(value, value);
});

watch(showFloor, (value) => {
  const ctx = three.value;
  if (ctx) ctx.floor.visible = value;
});

watch(limitRotation, (limited) => {
  if (limited) rotationDeg.value = clampRotation(rotationDeg.value);
});

watch(activeCode, async () => {
  await nextTick();
  listElement.value
    ?.querySelector(`[data-code="${activeCode.value}"]`)
    ?.scrollIntoView({ block: "nearest" });
});

onMounted(async () => {
  document.addEventListener("keydown", onKeydown);
  await initScene();
  await loadDoor(currentSource.value);
});

onBeforeUnmount(() => {
  disposed = true;
  document.removeEventListener("keydown", onKeydown);
  const ctx = three.value;
  if (!ctx) return;
  ctx.stop();
  ctx.observer.disconnect();
  ctx.getMesh()?.geometry.dispose();
  ctx.faceMaterial.map?.dispose();
  ctx.faceMaterial.dispose();
  ctx.edgeMaterial.dispose();
  ctx.pmrem.dispose();
  ctx.renderer.dispose();
});
</script>

<template>
  <section id="main-content" class="prism-page">
    <header class="prism-head">
      <p class="prism-label">Kardoor / Kapı prizması · WebGL</p>
      <h1>Sürükle, döndür</h1>
      <p class="prism-note">
        Gerçek ışık, gerçek gölge, pahlı kenar. Fotoğraf dokuya, alfa sınırı gövde
        oranına, kenar rengi de kapının kendi kenarına bağlı — 169 model için tek sahne.
      </p>
    </header>

    <div class="prism-stage-wrap">
      <div
        ref="stageElement"
        class="prism-viewport"
        role="application"
        aria-label="Kapıyı döndürmek için sürükleyin"
        tabindex="0"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <canvas ref="canvasElement" class="prism-canvas" />

        <figure v-show="showSkeleton" class="prism-skeleton">
          <canvas ref="skeletonCanvas" />
          <figcaption>
            <span>İskelet</span>
            <em>{{ structureSummary }}</em>
            <span class="prism-skeleton__key">
              <i data-kind="glass" />cam
              <i data-kind="panel" />panel
              <i data-kind="handle" />kol
            </span>
          </figcaption>
        </figure>
      </div>

      <p class="prism-readout">
        <span>{{ activeProduct.code }}</span>
        <span>{{ normalisedAngle }}°</span>
        <span>{{ facingBack ? "arka yüz" : "ön yüz" }}</span>
        <span>{{ status }}</span>
      </p>
    </div>

    <aside class="prism-panel">
      <div class="prism-field">
        <p class="prism-label">
          Model · {{ activeVisibleIndex + 1 }} / {{ visibleProducts.length }}
        </p>
        <input v-model="query" class="prism-search" type="search" placeholder="Kod veya isim ara" autocomplete="off">

        <div class="prism-chips">
          <button type="button" :data-active="seriesFilter === 'all' ? '' : undefined" @click="seriesFilter = 'all'">
            Tümü {{ products.length }}
          </button>
          <button
            v-for="series in seriesOptions"
            :key="series.slug"
            type="button"
            :data-active="seriesFilter === series.slug ? '' : undefined"
            @click="seriesFilter = series.slug"
          >
            {{ series.title }} {{ series.count }}
          </button>
        </div>

        <div class="prism-actions">
          <button type="button" @click="stepProduct(-1)">‹ Önceki</button>
          <button type="button" @click="stepProduct(1)">Sonraki ›</button>
        </div>

        <ol ref="listElement" class="prism-list">
          <li v-for="product in visibleProducts" :key="product.code">
            <button
              type="button"
              :data-code="product.code"
              :data-active="product.code === activeCode ? '' : undefined"
              @click="activeCode = product.code"
            >
              <span class="prism-list__code">{{ product.code }}</span>
              <span class="prism-list__name">{{ product.name }}</span>
            </button>
          </li>
        </ol>
      </div>

      <div class="prism-field">
        <p class="prism-label">Dönüş</p>
        <label class="prism-toggle">
          <input v-model="limitRotation" type="checkbox">
          <span>±70° ile sınırla</span>
        </label>
        <label class="prism-toggle">
          <input v-model="autoSpin" type="checkbox">
          <span>Kendi kendine dönsün</span>
        </label>
      </div>

      <div class="prism-field">
        <p class="prism-label">Kanat kalınlığı · {{ thicknessCm }} cm</p>
        <input v-model.number="thicknessCm" type="range" min="3" max="14" step="0.5">
      </div>

      <div class="prism-field">
        <p class="prism-label">Kenar metalliği · {{ edgeMetalness.toFixed(2) }}</p>
        <input v-model.number="edgeMetalness" type="range" min="0" max="1" step="0.05">
      </div>

      <div class="prism-field">
        <label class="prism-toggle">
          <input v-model="showSkeleton" type="checkbox">
          <span>İskeleti göster</span>
        </label>
        <p class="prism-hint">
          Fotoğraftan çıkarılan çıta ızgarası, panel/cam ayrımı ve kol konumu.
          Model bunun üstüne kurulacak — önce çizim doğru olmalı.
        </p>
      </div>

      <div class="prism-field">
        <p class="prism-label">Yüzey kabartması · {{ normalStrength.toFixed(1) }}</p>
        <input v-model.number="normalStrength" type="range" min="0" max="4" step="0.1">
        <p class="prism-hint">
          Kol, panel kenarları ve profiller ışığa tepki verir. Her kapının kendi
          fotoğrafından çıkarılıyor — 0 = düz kâğıt.
        </p>
      </div>

      <div class="prism-field">
        <label class="prism-toggle">
          <input v-model="showFloor" type="checkbox">
          <span>Zemin ve gölge</span>
        </label>
      </div>

      <div class="prism-actions">
        <button type="button" @click="resetView">Sıfırla</button>
      </div>

      <p class="prism-hint">Sürükle · ← → döndürür · ↑ ↓ model · R sıfırlar</p>
    </aside>
  </section>
</template>

<style scoped>
.prism-page {
  --prism-bg: #070c1c;
  --prism-surface: #141e40;
  --prism-text: #ebeef8;
  --prism-soft: #8ea0c8;
  --prism-accent: #86a3fb;
  display: grid;
  min-height: 100svh;
  grid-template-columns: minmax(0, 1fr) 320px;
  grid-template-rows: auto 1fr;
  gap: 0 44px;
  padding: 100px clamp(24px, 4vw, 64px) 32px;
  background: var(--prism-bg);
  color: var(--prism-text);
  font-family: var(--font-body);
}

.prism-head {
  grid-column: 1 / -1;
  max-width: 760px;
  margin-bottom: 8px;
}

.prism-head h1 {
  margin: 8px 0 10px;
  font-family: var(--font-display);
  font-size: clamp(36px, 4.2vw, 60px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 0.92;
  text-transform: uppercase;
}

.prism-note {
  max-width: 62ch;
  margin: 0;
  color: var(--prism-soft);
  font-size: 13px;
  line-height: 1.55;
}

.prism-label {
  margin: 0;
  color: var(--prism-soft);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.prism-stage-wrap {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
}

.prism-viewport {
  position: relative;
  width: 100%;
  min-height: 560px;
  flex: 1;
  border-radius: 16px;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 30%, #101a34, #05091a 70%);
  cursor: grab;
  touch-action: none;
}

.prism-viewport:active {
  cursor: grabbing;
}

.prism-viewport:focus-visible {
  outline: 2px solid var(--prism-accent);
  outline-offset: 4px;
}

.prism-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.prism-skeleton {
  position: absolute;
  top: 18px;
  left: 18px;
  display: flex;
  margin: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(5, 9, 22, 0.72);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.prism-skeleton canvas {
  display: block;
  width: 118px;
  height: auto;
  border-radius: 4px;
}

.prism-skeleton figcaption {
  display: flex;
  max-width: 150px;
  flex-direction: column;
  gap: 7px;
  color: var(--prism-soft);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.prism-skeleton figcaption span:first-child {
  color: var(--prism-text);
  font-weight: 600;
}

.prism-skeleton em {
  font-style: normal;
  letter-spacing: 0.02em;
  line-height: 1.5;
  text-transform: none;
}

.prism-skeleton__key {
  display: flex;
  align-items: center;
  gap: 5px;
  text-transform: none;
}

.prism-skeleton__key i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}

.prism-skeleton__key i[data-kind="glass"] { background: rgba(120, 190, 255, 0.75); }
.prism-skeleton__key i[data-kind="panel"] { background: rgba(226, 150, 78, 0.75); }
.prism-skeleton__key i[data-kind="handle"] { background: rgba(255, 96, 96, 0.9); }

.prism-readout {
  display: flex;
  margin: 0;
  gap: 18px;
  color: var(--prism-soft);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.prism-readout span:nth-child(2) {
  color: var(--prism-accent);
  font-variant-numeric: tabular-nums;
}

.prism-panel {
  display: flex;
  max-height: calc(100svh - 140px);
  flex-direction: column;
  gap: 18px;
  align-self: start;
  padding: 20px 18px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: var(--prism-surface);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
}

.prism-field {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.prism-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prism-chips button,
.prism-actions button {
  padding: 7px 11px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: transparent;
  color: var(--prism-soft);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: color 160ms var(--ease-out), border-color 160ms var(--ease-out);
}

.prism-chips button:hover,
.prism-actions button:hover {
  border-color: rgba(255, 255, 255, 0.34);
  color: var(--prism-text);
}

.prism-chips button[data-active] {
  border-color: var(--prism-accent);
  color: var(--prism-text);
}

.prism-search {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.22);
  color: var(--prism-text);
  font: inherit;
  font-size: 12px;
  outline: none;
}

.prism-search:focus-visible {
  border-color: var(--prism-accent);
}

.prism-list {
  display: flex;
  max-height: 210px;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
}

.prism-list button {
  display: grid;
  width: 100%;
  grid-template-columns: 62px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 0;
  background: transparent;
  color: var(--prism-soft);
  font: inherit;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
}

.prism-list button:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--prism-text);
}

.prism-list button[data-active] {
  background: rgba(134, 163, 251, 0.16);
  color: var(--prism-text);
}

.prism-list__code {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.prism-list__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prism-toggle {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  cursor: pointer;
}

.prism-hint {
  margin: 0;
  color: var(--prism-soft);
  font-size: 11px;
  line-height: 1.5;
}

.prism-actions {
  display: flex;
  gap: 8px;
}

input[type="range"] {
  width: 100%;
  accent-color: var(--prism-accent);
}

@media (max-width: 900px) {
  .prism-page {
    grid-template-columns: minmax(0, 1fr);
  }
}

:global(body.door3d-active .chub) {
  display: none;
}
</style>
