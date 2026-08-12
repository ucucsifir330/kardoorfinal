import type { DoorProduct } from "../../../data/products";
import type {
  DoorArchetype,
  DoorDefinition,
  DoorMaterialKey,
  DoorPart,
  DoorPartKind
} from "./doorModelTypes";

const box = (
  id: string,
  label: string,
  kind: DoorPartKind,
  material: DoorMaterialKey,
  size: DoorPart["size"],
  position: DoorPart["position"],
  radius = 0.006,
  rotation?: DoorPart["rotation"]
): DoorPart => ({ id, label, kind, material, size, position, radius, rotation });

const addFrame = (
  parts: DoorPart[],
  id: string,
  label: string,
  material: DoorMaterialKey,
  x: number,
  y: number,
  width: number,
  height: number,
  profile: number,
  depth: number,
  z = 0
) => {
  parts.push(
    box(`${id}-left`, `${label} sol`, "frame", material, [profile, height, depth], [x - width / 2 + profile / 2, y, z]),
    box(`${id}-right`, `${label} sağ`, "frame", material, [profile, height, depth], [x + width / 2 - profile / 2, y, z]),
    box(`${id}-top`, `${label} üst`, "frame", material, [width - profile * 2, profile, depth], [x, y + height / 2 - profile / 2, z]),
    box(`${id}-bottom`, `${label} alt`, "frame", material, [width - profile * 2, profile, depth], [x, y - height / 2 + profile / 2, z])
  );
};

const addOpening = (
  parts: DoorPart[],
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  columns: number,
  rows: number,
  frameMaterial: DoorMaterialKey
) => {
  const profile = Math.min(0.035, width * 0.1);
  addFrame(parts, `${id}-frame`, `${label} çerçevesi`, frameMaterial, x, y, width, height, profile, 0.034, 0.068);
  parts.push(box(id, label, "glass", "glass", [width - profile * 2, height - profile * 2, 0.016], [x, y, 0.078], 0.003));

  const innerWidth = width - profile * 2;
  const innerHeight = height - profile * 2;
  for (let index = 1; index < columns; index += 1) {
    parts.push(box(
      `${id}-v-${index}`,
      `${label} düşey kayıt`,
      "trim",
      frameMaterial,
      [0.007, innerHeight, 0.012],
      [x - innerWidth / 2 + innerWidth * index / columns, y, 0.09],
      0.002
    ));
  }
  for (let index = 1; index < rows; index += 1) {
    parts.push(box(
      `${id}-h-${index}`,
      `${label} yatay kayıt`,
      "trim",
      frameMaterial,
      [innerWidth, 0.007, 0.012],
      [x, y - innerHeight / 2 + innerHeight * index / rows, 0.09],
      0.002
    ));
  }
};

const hashCode = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
};

const hasTag = (product: DoorProduct, value: string) =>
  product.tags.some((tag) => tag.toLocaleLowerCase("tr-TR") === value);

export const resolveDoorArchetype = (product: DoorProduct): DoorArchetype => {
  const doubleLeaf = hasTag(product, "çift kanat");
  const glazed = product.seriesSlug === "camli-modeller" || hasTag(product, "camlı");
  const sideGlazed = hasTag(product, "yan camlı") || hasTag(product, "üst camlı");

  if (hasTag(product, "pivot")) return "pivot";
  if (product.seriesSlug === "giris-teknik") return "technical";
  if (doubleLeaf && (glazed || sideGlazed)) return "double-glazed";
  if (doubleLeaf) return "double-leaf";
  if (sideGlazed) return "side-glazed";
  if (glazed) return "single-glazed";
  return "single-leaf";
};

const familyMaterial = (product: DoorProduct): DoorMaterialKey => {
  if (["dogal-yuzeyler", "pvc-laminoks"].includes(product.seriesSlug)) return "wood";
  if (product.seriesSlug === "camli-modeller" && product.colors.includes("ahşap")) return "wood";
  if (["metal-kompozit", "giris-teknik"].includes(product.seriesSlug)) return "metalDark";
  return "metal";
};

const addHardware = (
  parts: DoorPart[],
  leafX: number,
  leafY: number,
  leafWidth: number,
  leafHeight: number,
  leafDepth: number,
  pullSide: "left" | "right",
  seed: number
) => {
  const side = pullSide === "right" ? 1 : -1;
  const pullX = leafX + side * leafWidth * 0.34;
  const pullHeight = 0.62 + (seed % 4) * 0.12;
  const pullY = leafY - 0.03;
  const hardwareZ = leafDepth / 2 + 0.075;

  parts.push(
    box("pull", "Çekme kolu", "hardware", "hardware", [0.026, pullHeight, 0.034], [pullX, pullY, hardwareZ], 0.012),
    box("pull-top", "Kol üst bağlantısı", "hardware", "hardware", [0.046, 0.024, 0.06], [pullX, pullY + pullHeight / 2 - 0.04, hardwareZ - 0.025], 0.008),
    box("pull-bottom", "Kol alt bağlantısı", "hardware", "hardware", [0.046, 0.024, 0.06], [pullX, pullY - pullHeight / 2 + 0.04, hardwareZ - 0.025], 0.008),
    box("lock-0", "Üst kilit rozeti", "hardware", "hardware", [0.048, 0.062, 0.026], [pullX + side * 0.075, leafY + 0.12, hardwareZ - 0.018], 0.006),
    box("lock-1", "Alt kilit rozeti", "hardware", "hardware", [0.048, 0.062, 0.026], [pullX + side * 0.075, leafY - 0.19, hardwareZ - 0.018], 0.006)
  );

  const hingeX = leafX - side * leafWidth / 2;
  [-0.34, 0, 0.34].forEach((offset, index) => {
    parts.push(box(
      `hinge-${index}`,
      "Menteşe",
      "hardware",
      "metal",
      [0.032, 0.11, leafDepth * 0.72],
      [hingeX, leafY + offset * leafHeight, 0.01],
      0.014
    ));
  });
};

const addSurfacePattern = (
  parts: DoorPart[],
  family: string,
  leafX: number,
  leafY: number,
  leafWidth: number,
  leafHeight: number,
  material: DoorMaterialKey,
  seed: number
) => {
  const mode = seed % 4;
  const trimMaterial: DoorMaterialKey = material === "wood" ? "wood" : "metalDark";
  const usableWidth = leafWidth * 0.72;
  const usableHeight = leafHeight * 0.78;

  if (family === "pvc-laminoks" || mode === 2) {
    const rows = family === "pvc-laminoks" ? 3 : 2;
    for (let row = 0; row < rows; row += 1) {
      const panelHeight = usableHeight / rows - 0.055;
      const y = leafY + usableHeight / 2 - panelHeight / 2 - row * (usableHeight / rows);
      addFrame(parts, `relief-${row}`, "Yüzey paneli", trimMaterial, leafX, y, usableWidth, panelHeight, 0.022, 0.018, 0.058);
    }
    return;
  }

  if (mode === 1) {
    const count = 7 + seed % 5;
    for (let index = 0; index < count; index += 1) {
      const x = leafX - usableWidth / 2 + usableWidth * index / Math.max(1, count - 1);
      parts.push(box(`rib-${index}`, "Düşey yüzey oluğu", "panel", trimMaterial, [0.012, usableHeight, 0.018], [x, leafY, 0.058], 0.003));
    }
    return;
  }

  if (mode === 3) {
    const bands = 4;
    for (let index = 0; index < bands; index += 1) {
      const y = leafY + usableHeight * 0.36 - index * usableHeight * 0.24;
      parts.push(
        box(`chevron-left-${index}`, "Geometrik yüzey çizgisi", "panel", trimMaterial, [usableWidth * 0.56, 0.012, 0.018], [leafX - usableWidth * 0.2, y, 0.058], 0.003, [0, 0, -0.56]),
        box(`chevron-right-${index}`, "Geometrik yüzey çizgisi", "panel", trimMaterial, [usableWidth * 0.56, 0.012, 0.018], [leafX + usableWidth * 0.2, y, 0.058], 0.003, [0, 0, 0.56])
      );
    }
    return;
  }

  const count = 5 + seed % 4;
  for (let index = 0; index < count; index += 1) {
    const y = leafY - usableHeight / 2 + usableHeight * index / Math.max(1, count - 1);
    parts.push(box(`band-${index}`, "Yatay yüzey bandı", "panel", trimMaterial, [usableWidth, 0.014, 0.018], [leafX, y, 0.058], 0.003));
  }
};

export const createCatalogDoorDefinition = (product: DoorProduct): DoorDefinition => {
  const archetype = resolveDoorArchetype(product);
  const seed = hashCode(product.code);
  const height = 2.1;
  const doubleLeaf = ["double-leaf", "double-glazed"].includes(archetype);
  const sideGlass = archetype === "side-glazed" || archetype === "double-glazed";
  const topGlass = hasTag(product, "üst camlı");
  const leafGlass = archetype === "single-glazed" || archetype === "double-glazed";
  const sideCount = sideGlass ? (seed % 3 === 0 ? 2 : 1) : 0;
  const width = archetype === "pivot"
    ? 1.28
    : (doubleLeaf ? 1.38 : 1.04) + sideCount * 0.3;
  const frameDepth = archetype === "technical" ? 0.12 : 0.15;
  const leafDepth = archetype === "pivot" ? 0.095 : 0.078;
  const frameProfile = archetype === "technical" ? 0.065 : 0.085;
  const material = familyMaterial(product);
  const trimMaterial: DoorMaterialKey = material === "wood" ? "wood" : "metalDark";
  const parts: DoorPart[] = [];

  addFrame(parts, "outer-frame", "Dış kasa", material, 0, 0, width, height, frameProfile, frameDepth);

  const innerWidth = width - frameProfile * 2;
  const transomHeight = topGlass ? 0.23 : 0;
  const mainHeight = height - frameProfile * 2 - transomHeight;
  const mainY = -transomHeight / 2;
  const sideWidth = sideCount ? 0.25 : 0;
  const gap = sideCount ? 0.035 : 0;
  const leafZoneWidth = innerWidth - sideCount * sideWidth - sideCount * gap;
  const leafWidth = doubleLeaf ? leafZoneWidth / 2 - 0.012 : leafZoneWidth;
  const leafXBase = sideCount === 1 ? (seed % 2 === 0 ? -(sideWidth + gap) / 2 : (sideWidth + gap) / 2) : 0;

  if (topGlass) {
    addOpening(parts, "transom", "Üst cam", 0, height / 2 - frameProfile - transomHeight / 2, innerWidth, transomHeight, 5 + seed % 4, 1, trimMaterial);
  }

  if (sideCount) {
    const sideXs = sideCount === 2
      ? [-innerWidth / 2 + sideWidth / 2, innerWidth / 2 - sideWidth / 2]
      : [seed % 2 === 0 ? innerWidth / 2 - sideWidth / 2 : -innerWidth / 2 + sideWidth / 2];
    sideXs.forEach((x, index) => {
      addOpening(parts, `sidelight-${index}`, "Yan cam", x, mainY, sideWidth, mainHeight, 2 + seed % 2, 5 + seed % 4, trimMaterial);
    });
  }

  const leafXs = doubleLeaf
    ? [leafXBase - leafZoneWidth / 4, leafXBase + leafZoneWidth / 4]
    : [leafXBase];

  leafXs.forEach((leafX, index) => {
    const id = doubleLeaf ? `leaf-${index}` : "leaf";
    parts.push(box(id, doubleLeaf ? `Kapı kanadı ${index + 1}` : "Kapı kanadı", "leaf", material, [leafWidth, mainHeight, leafDepth], [leafX, mainY, 0.012], 0.012));

    if (leafGlass) {
      const glassWidth = leafWidth * (doubleLeaf ? 0.46 : 0.42);
      const glassHeight = mainHeight * (0.48 + (seed % 3) * 0.08);
      addOpening(parts, `${id}-glass`, "Kanat camı", leafX, mainY + 0.08, glassWidth, glassHeight, 2 + seed % 3, 4 + seed % 5, trimMaterial);
    } else {
      addSurfacePattern(parts, product.seriesSlug, leafX, mainY, leafWidth, mainHeight, material, seed + index);
    }
  });

  const primaryLeafX = doubleLeaf ? leafXs[seed % 2] ?? leafXs[0]! : leafXs[0]!;
  const pullSide = seed % 2 === 0 ? "right" : "left";
  addHardware(parts, primaryLeafX, mainY, leafWidth, mainHeight, leafDepth, pullSide, seed);

  if (archetype === "technical") {
    parts.push(box("closer", "Kapı kapatıcı", "hardware", "metalDark", [leafWidth * 0.34, 0.055, 0.05], [primaryLeafX, mainY + mainHeight * 0.4, 0.08], 0.008));
  }

  return {
    code: product.code,
    name: product.name,
    family: product.category,
    referenceImage: product.localImage,
    width,
    height,
    depth: leafDepth,
    frameDepth,
    parts,
    archetype,
    modelStatus: "template",
    referenceRole: product.visualRole
  };
};
