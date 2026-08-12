<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { DoorDefinition, DoorPartKind, DoorMaterialKey } from "./doorDefinitions";

const props = withDefaults(defineProps<{
  definition: DoorDefinition;
  exploded?: number;
  referenceOpacity?: number;
  autoRotate?: boolean;
  selectedKind?: DoorPartKind | "all";
  showReference?: boolean;
  wireframe?: boolean;
  presentation?: "cinema" | "draft" | "assembly" | "editor";
  selectedPartId?: string | null;
  revision?: number;
  textured?: boolean;
}>(), {
  exploded: 0,
  referenceOpacity: 0.72,
  autoRotate: false,
  selectedKind: "all",
  showReference: true,
  wireframe: false,
  presentation: "cinema",
  selectedPartId: null,
  revision: 0,
  textured: false
});

const emit = defineEmits<{
  select: [partId: string | null];
}>();

const hostElement = ref<HTMLElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
const status = ref("Sahne hazırlanıyor");
const angle = ref(18);
const partCount = ref(0);

let disposed = false;
let context: Record<string, any> | null = null;
let root: any = null;
let referencePlane: any = null;
let skinTexture: any = null;
let targetRotation = (18 * Math.PI) / 180;
let currentRotation = targetRotation;
let targetTilt = -0.025;
let currentTilt = targetTilt;
let pointerId: number | null = null;
let pointerStartX = 0;
let pointerStartY = 0;
let rotationStart = 0;
let tiltStart = 0;

const cssColour = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const materialColours = (): Record<DoorMaterialKey, string> => ({
  metal: cssColour("--text-muted", "#9FA7BD"),
  metalDark: cssColour("--card-bg", "#171D3D"),
  wood: cssColour("--warm", "#a77a55"),
  glass: cssColour("--accent", "#8EA2FF"),
  hardware: cssColour("--text-main", "#F4F6FF")
});

const createMaterial = (THREE: any, key: DoorMaterialKey) => {
  const colours = materialColours();
  if (key === "glass") {
    return new THREE.MeshPhysicalMaterial({
      color: colours.glass,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 0.22,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  const isHardware = key === "hardware";
  const isMetal = key === "metal" || key === "metalDark" || isHardware;
  return new THREE.MeshPhysicalMaterial({
    color: colours[key],
    roughness: key === "wood" ? 0.58 : isHardware ? 0.16 : 0.32,
    metalness: isMetal ? (isHardware ? 0.94 : 0.68) : 0.05,
    clearcoat: isHardware ? 0.48 : 0.18,
    clearcoatRoughness: 0.32
  });
};

const explodeVector = (THREE: any, kind: DoorPartKind, x: number, y: number) => {
  if (kind === "hardware") return new THREE.Vector3(Math.sign(x || 1) * 0.08, 0, 0.72);
  if (kind === "trim") return new THREE.Vector3(Math.sign(x) * 0.07, Math.sign(y) * 0.035, 0.46);
  if (kind === "glass") return new THREE.Vector3(Math.sign(x) * 0.2, Math.sign(y) * 0.08, 0.28);
  if (kind === "panel") return new THREE.Vector3(Math.sign(x) * 0.08, 0, 0.22);
  if (kind === "leaf") return new THREE.Vector3(0, 0, -0.22);
  return new THREE.Vector3(Math.sign(x) * 0.2, Math.sign(y) * 0.1, -0.08);
};

/**
 * Project the reference photograph onto a part, flat along the door's face.
 *
 * Every vertex takes its UV from where it actually sits on the leaf, so the
 * picture lands on the geometry exactly where it lands on the photograph — the
 * glazing pattern falls on the glazing box, the flutes carry their own shading,
 * and the frame gets the frame. Side faces inherit the same projection and end up
 * smeared along Z, which is the correct read for a chamfer seen from the front.
 */
const applyProjectedUv = (geometry: any, part: DoorDefinition["parts"][number], definition: DoorDefinition) => {
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  if (!position || !uv) return;

  for (let index = 0; index < position.count; index += 1) {
    const worldX = position.getX(index) + part.position[0];
    const worldY = position.getY(index) + part.position[1];
    uv.setXY(
      index,
      (worldX + definition.width / 2) / definition.width,
      (worldY + definition.height / 2) / definition.height
    );
  }
  uv.needsUpdate = true;
};

const disposeObject = (object: any) => {
  if (!object) return;
  const geometries = new Set<any>();
  const materials = new Set<any>();
  object.traverse((child: any) => {
    if (child.geometry) geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of childMaterials) if (material) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose?.();
  for (const material of materials) {
    material.map?.dispose?.();
    material.dispose?.();
  }
};

const updateAppearance = () => {
  if (!root) return;
  root.traverse((child: any) => {
    if (!child.isMesh || child.userData.isReference) return;
    const material = child.material;
    if (!material) return;
    const selected = props.selectedKind === "all" || child.userData.kind === props.selectedKind;
    const baseOpacity = child.userData.baseOpacity ?? 1;
    material.transparent = baseOpacity < 1 || !selected;
    material.opacity = selected ? baseOpacity : Math.min(baseOpacity, 0.16);
    material.wireframe = props.wireframe;
    material.depthWrite = child.userData.kind !== "glass" && selected;

    // Editing needs the active part to be unmistakable, and materials are shared
    // between parts of the same kind — so the highlight rides on the mesh's own
    // outline box rather than tinting a material several parts are using.
    const isActive = !!props.selectedPartId && child.userData.partId === props.selectedPartId;
    if (child.userData.outline) child.userData.outline.visible = isActive;
  });
  if (referencePlane) {
    // With the skin on, the floating plane would just sit in front of the model
    // it is already painted onto.
    referencePlane.visible =
      !props.textured && props.showReference && props.referenceOpacity > 0.01;
    referencePlane.material.opacity = props.referenceOpacity;
  }
};

/**
 * Dress every part in the photograph. Materials are shared per kind, so one
 * assignment covers the whole model; the projected UVs are what make each part
 * pick up its own slice of the image.
 */
const applyTexturedSkin = (texture: any, modelRoot: any) => {
  const seen = new Set<any>();
  modelRoot.traverse((child: any) => {
    if (!child.isMesh || child.userData.isReference || seen.has(child.material)) return;
    seen.add(child.material);

    /*
     * Hardware never takes the skin. Handles and pulls are the parts the
     * background removal tends to eat — AL-001's aluminium bar is a hole in its
     * own photograph — so texturing them paints a gap onto the geometry. They
     * keep their own metal instead, which is also closer to the truth: brushed
     * aluminium reflects the room, it does not carry a printed image.
     */
    if (child.userData.kind === "hardware") {
      child.material.map = null;
      child.material.needsUpdate = true;
      return;
    }

    child.material.map = props.textured ? texture : null;
    // Under the skin the tint has to step aside, otherwise the wood and metal
    // colours multiply into the photograph and everything goes muddy. The base
    // colour is stashed on first use so it can come back when the skin is off.
    if (child.material.userData.baseColour === undefined) {
      child.material.userData.baseColour = child.material.color.getHex();
    }
    child.material.color.setHex(
      props.textured ? 0xffffff : child.material.userData.baseColour
    );
    if (child.userData.kind === "glass") {
      child.material.opacity = props.textured ? 0.92 : (child.userData.baseOpacity ?? 0.24);
      child.material.depthWrite = props.textured;
    }
    child.material.needsUpdate = true;
  });
};

const loadReference = async (THREE: any, definition: DoorDefinition, modelRoot: any) => {
  const texture = await new THREE.TextureLoader().loadAsync(definition.referenceImage);
  if (disposed || root !== modelRoot) {
    texture.dispose();
    return;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = context?.renderer?.capabilities?.getMaxAnisotropy?.() ?? 1;
  skinTexture = texture;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: props.referenceOpacity,
    alphaTest: 0.02,
    depthWrite: false,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(definition.width, definition.height), material);
  plane.name = "Fotoğraf referansı";
  plane.position.z = definition.frameDepth / 2 + 0.004;
  plane.userData.isReference = true;
  modelRoot.add(plane);
  referencePlane = plane;
  applyTexturedSkin(texture, modelRoot);
  updateAppearance();
};

const buildDoor = async () => {
  if (!context) return;
  const { THREE, RoundedBoxGeometry, assembly } = context;
  status.value = "Geometri kuruluyor";

  if (root) {
    assembly.remove(root);
    disposeObject(root);
  }

  const modelRoot = new THREE.Group();
  modelRoot.name = `${props.definition.code} ${props.definition.name}`;
  modelRoot.position.y = props.definition.height / 2;
  assembly.add(modelRoot);
  root = modelRoot;
  referencePlane = null;
  const materialCache = new Map<string, any>();

  for (const part of props.definition.parts) {
    const radius = Math.min(part.radius ?? 0.006, Math.min(...part.size) * 0.38);
    const needsBevel = part.kind === "frame" || part.kind === "leaf" || part.kind === "hardware";
    const geometry = needsBevel
      ? new RoundedBoxGeometry(part.size[0], part.size[1], part.size[2], 2, radius)
      : new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]);
    applyProjectedUv(geometry, part, props.definition);
    const materialKey = `${part.material}:${part.kind}`;
    const material = materialCache.get(materialKey) ?? createMaterial(THREE, part.material);
    materialCache.set(materialKey, material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = part.label;
    mesh.position.set(...part.position);
    if (part.rotation) mesh.rotation.set(...part.rotation);
    mesh.castShadow = part.kind !== "glass";
    mesh.receiveShadow = part.kind !== "glass";
    mesh.userData.kind = part.kind;
    mesh.userData.partId = part.id;
    mesh.userData.home = mesh.position.clone();
    mesh.userData.explode = explodeVector(THREE, part.kind, part.position[0], part.position[1]);
    mesh.userData.baseOpacity = part.kind === "glass" ? 0.24 : 1;

    if (props.presentation === "editor") {
      const outline = new THREE.Box3Helper(
        new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(part.size[0] * 1.04, part.size[1] * 1.04, part.size[2] * 1.6)
        ),
        cssColour("--accent", "#8EA2FF")
      );
      outline.visible = false;
      mesh.add(outline);
      mesh.userData.outline = outline;
    }

    modelRoot.add(mesh);
  }

  partCount.value = props.definition.parts.length;
  const cameraDistance = Math.max(5.2, 3.9 + props.definition.width * 1.35);
  context.camera.position.set(
    props.presentation === "draft" ? 0.18 : 0,
    props.presentation === "assembly" ? 1.4 : 1.28,
    cameraDistance
  );
  context.camera.lookAt(0, props.definition.height * 0.5, 0);
  updateAppearance();

  try {
    await loadReference(THREE, props.definition, modelRoot);
    status.value = "Model hazır";
  } catch {
    status.value = "Model hazır, fotoğraf yüklenemedi";
  }
};

const initialise = async () => {
  const THREE = await import("three");
  const [{ RoomEnvironment }, { RoundedBoxGeometry }] = await Promise.all([
    import("three/examples/jsm/environments/RoomEnvironment.js"),
    import("three/examples/jsm/geometries/RoundedBoxGeometry.js")
  ]);
  if (disposed || !canvasElement.value || !hostElement.value) return;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement.value,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    // Needed so the render can be read back and diffed against the reference
    // photograph; without it the buffer is cleared before any readback.
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.5;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const assembly = new THREE.Group();
  scene.add(assembly);

  const key = new THREE.DirectionalLight(cssColour("--text-main", "#F4F6FF"), 3.1);
  key.position.set(-3.4, 4.8, 4.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 16;
  key.shadow.camera.left = -3.2;
  key.shadow.camera.right = 3.2;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -1;
  key.shadow.bias = -0.0006;
  key.shadow.radius = 4;
  scene.add(key);

  const rim = new THREE.DirectionalLight(cssColour("--accent", "#8EA2FF"), 1.05);
  rim.position.set(4, 2.6, -3.4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(cssColour("--bg-navy", "#131937"), 0.82));

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.6, 72),
    new THREE.MeshPhysicalMaterial({
      color: cssColour("--bg-navy", "#131937"),
      roughness: 0.24,
      metalness: 0.5,
      transparent: true,
      opacity: 0.68
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.position.y = -0.004;
  scene.add(floor);

  const resize = () => {
    if (!hostElement.value) return;
    const rect = hostElement.value.getBoundingClientRect();
    renderer.setSize(Math.max(320, rect.width), Math.max(320, rect.height), false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(hostElement.value);
  resize();

  context = { THREE, RoundedBoxGeometry, renderer, scene, camera, assembly, observer, pmrem, environment, floor };
  await buildDoor();

  const render = () => {
    if (disposed || !context) return;
    context.frame = requestAnimationFrame(render);
    if (props.autoRotate) targetRotation += 0.0024;
    currentRotation += (targetRotation - currentRotation) * 0.085;
    currentTilt += (targetTilt - currentTilt) * 0.085;
    assembly.rotation.y = currentRotation;
    assembly.rotation.x = currentTilt;

    if (root) {
      root.traverse((child: any) => {
        if (!child.isMesh || child.userData.isReference || !child.userData.home) return;
        const home = child.userData.home;
        const offset = child.userData.explode;
        child.position.x += (home.x + offset.x * props.exploded - child.position.x) * 0.1;
        child.position.y += (home.y + offset.y * props.exploded - child.position.y) * 0.1;
        child.position.z += (home.z + offset.z * props.exploded - child.position.z) * 0.1;
      });
    }

    angle.value = Math.round((((currentRotation * 180) / Math.PI) % 360 + 360) % 360);
    renderer.render(scene, camera);
  };
  render();
};

const onPointerDown = (event: PointerEvent) => {
  if (pointerId !== null) return;
  pointerId = event.pointerId;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  rotationStart = targetRotation;
  tiltStart = targetTilt;
  // Capture is a convenience, not a requirement — a failure here must not take
  // the rest of the interaction down with it.
  try { hostElement.value?.setPointerCapture(event.pointerId); } catch { /* ignore */ }
};

/** Click (as opposed to drag) picks the part under the cursor. */
const pickPart = (event: PointerEvent) => {
  if (!context || !root || props.presentation !== "editor") return;
  const host = hostElement.value;
  if (!host) return;

  const { THREE, camera } = context;
  const rect = host.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);

  const targets: any[] = [];
  root.traverse((child: any) => {
    if (child.isMesh && !child.userData.isReference && child.userData.partId) targets.push(child);
  });

  const hit = raycaster.intersectObjects(targets, false)[0];
  emit("select", hit ? hit.object.userData.partId : null);
};

const onPointerMove = (event: PointerEvent) => {
  if (pointerId !== event.pointerId) return;
  targetRotation = rotationStart + (event.clientX - pointerStartX) * 0.009;
  targetTilt = Math.max(-0.16, Math.min(0.12, tiltStart + (event.clientY - pointerStartY) * 0.0025));
};

const onPointerUp = (event: PointerEvent) => {
  if (pointerId !== event.pointerId) return;
  try { hostElement.value?.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
  pointerId = null;
  const travelled = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);
  if (travelled < 4) pickPart(event);
};

const resetView = () => {
  targetRotation = (18 * Math.PI) / 180;
  targetTilt = -0.025;
};

const exportGlb = async () => {
  if (!context || !root) return;
  status.value = "GLB hazırlanıyor";
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const wasVisible = referencePlane?.visible;
  if (referencePlane) referencePlane.visible = false;

  try {
    const exporter = new GLTFExporter();
    const result = await exporter.parseAsync(root, { binary: true, onlyVisible: true });
    const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${props.definition.code.toLowerCase()}-${props.definition.name.toLowerCase()}.glb`;
    anchor.click();
    URL.revokeObjectURL(url);
    status.value = "GLB indirildi";
  } catch {
    status.value = "GLB oluşturulamadı";
  } finally {
    if (referencePlane) referencePlane.visible = wasVisible;
  }
};

/**
 * Move or resize one part without rebuilding the scene. Dragging a slider fires
 * on every frame, and a full rebuild of 62 rounded boxes per frame is far too
 * heavy — this touches only the mesh being edited.
 */
const applyPartTransform = (
  partId: string,
  position: [number, number, number],
  size: [number, number, number]
) => {
  if (!context || !root) return;
  const { THREE, RoundedBoxGeometry } = context;

  root.traverse((child: any) => {
    if (!child.isMesh || child.userData.partId !== partId) return;

    child.position.set(...position);
    child.userData.home = child.position.clone();
    child.userData.explode = explodeVector(THREE, child.userData.kind, position[0], position[1]);

    const current = child.geometry?.parameters;
    const changed =
      !current ||
      Math.abs((current.width ?? 0) - size[0]) > 1e-5 ||
      Math.abs((current.height ?? 0) - size[1]) > 1e-5 ||
      Math.abs((current.depth ?? 0) - size[2]) > 1e-5;

    if (changed) {
      const needsBevel = ["frame", "leaf", "hardware"].includes(child.userData.kind);
      const radius = Math.min(0.006, Math.min(...size) * 0.38);
      child.geometry.dispose();
      child.geometry = needsBevel
        ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius)
        : new THREE.BoxGeometry(size[0], size[1], size[2]);
    }

    if (child.userData.outline) {
      child.remove(child.userData.outline);
      const outline = new THREE.Box3Helper(
        new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(size[0] * 1.04, size[1] * 1.04, size[2] * 1.6)
        ),
        cssColour("--accent", "#8EA2FF")
      );
      outline.visible = true;
      child.add(outline);
      child.userData.outline = outline;
    }
  });
};

watch(() => props.definition.code, () => void buildDoor());
// Structural edits (add, delete, material change) bump the revision counter.
watch(() => props.revision, () => void buildDoor());
watch(() => props.selectedPartId, updateAppearance);
watch(() => props.textured, () => {
  if (skinTexture && root) applyTexturedSkin(skinTexture, root);
  updateAppearance();
});
watch(
  () => [props.referenceOpacity, props.showReference, props.selectedKind, props.wireframe],
  updateAppearance
);

onMounted(() => void initialise());

onBeforeUnmount(() => {
  disposed = true;
  if (!context) return;
  cancelAnimationFrame(context.frame);
  context.observer.disconnect();
  disposeObject(root);
  context.floor.geometry.dispose();
  context.floor.material.dispose();
  context.environment.dispose();
  context.pmrem.dispose();
  context.renderer.dispose();
  context = null;
});

defineExpose({ exportGlb, resetView, applyPartTransform });
</script>

<template>
  <section
    ref="hostElement"
    class="model-stage"
    :data-presentation="presentation"
    role="application"
    :aria-label="`${definition.code} parametrik kapı modelini döndür`"
    tabindex="0"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <canvas ref="canvasElement" class="model-stage__canvas" />
    <div class="model-stage__readout" aria-live="polite">
      <span>{{ definition.code }}</span>
      <span>{{ angle }}°</span>
      <span>{{ partCount }} parça</span>
      <span>{{ status }}</span>
    </div>
  </section>
</template>

<style scoped>
.model-stage {
  position: relative;
  min-width: 0;
  min-height: 420px;
  overflow: hidden;
  isolation: isolate;
  background: var(--bg-deepest);
  touch-action: none;
  cursor: grab;
}

.model-stage:active {
  cursor: grabbing;
}

.model-stage:focus-visible {
  outline: 2px solid var(--accent-fg);
  outline-offset: -2px;
}

.model-stage__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.model-stage__readout {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 18px;
  display: flex;
  align-items: center;
  gap: 18px;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  pointer-events: none;
}

.model-stage__readout span:first-child {
  color: var(--text-main);
  font-weight: 700;
}

.model-stage__readout span:last-child {
  margin-left: auto;
  color: var(--text-muted);
}

@media (max-width: 760px) {
  .model-stage {
    min-height: 55svh;
  }

  .model-stage__readout {
    left: 14px;
    right: 14px;
    bottom: 14px;
    gap: 10px;
    font-size: 9px;
  }

  .model-stage__readout span:last-child {
    display: none;
  }
}
</style>
