import { products } from "../../../data/products";
import { createCatalogDoorDefinition } from "./doorCatalogFactory";
import type { DoorDefinition, DoorMaterialKey, DoorPart, DoorPartKind } from "./doorModelTypes";

export type {
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
  radius = 0.006
): DoorPart => ({ id, label, kind, material, size, position, radius });

const addRectFrame = (
  target: DoorPart[],
  id: string,
  label: string,
  kind: DoorPartKind,
  material: DoorMaterialKey,
  centreX: number,
  centreY: number,
  width: number,
  height: number,
  profile: number,
  depth: number,
  z: number
) => {
  target.push(
    box(`${id}-left`, `${label} sol`, kind, material, [profile, height, depth], [centreX - width / 2 + profile / 2, centreY, z]),
    box(`${id}-right`, `${label} sağ`, kind, material, [profile, height, depth], [centreX + width / 2 - profile / 2, centreY, z]),
    box(`${id}-top`, `${label} üst`, kind, material, [width - profile * 2, profile, depth], [centreX, centreY + height / 2 - profile / 2, z]),
    box(`${id}-bottom`, `${label} alt`, kind, material, [width - profile * 2, profile, depth], [centreX, centreY - height / 2 + profile / 2, z])
  );
};

/**
 * AL-020 read off the reference photograph by eye, part by part.
 *
 * Automatic measurement is not available for this one: unlike CM-019, its
 * photograph has no cut-out — the background is the same grey as the door
 * (0 of 344 edge samples transparent against CM-019's 592 of 592), so there is
 * no silhouette to detect and no colour contrast to separate glazing from metal.
 * Positions below are taken from the image proportionally and converted against
 * the 1.02 x 2.10 frame.
 *
 * The old numbers had the pull at 0.72 tall when the photograph shows a bar
 * running most of the leaf (1.55), only 7 flutes where there are 11, and the
 * glazing 42mm left of where it sits.
 */
const al020Parts = (): DoorPart[] => {
  const parts: DoorPart[] = [];

  /*
   * Image-to-world mapping, and the trap in it: the reference plane is built at
   * the definition's full width and height, so it stretches the WHOLE photograph
   * across 1.02 x 2.10 — background included. Converting a feature therefore uses
   * the plain image fraction:
   *
   *   x = (relX - 0.5) * 1.02        y = (0.5 - relY) * 2.10
   *
   * Dividing by the door's share of the frame (0.91) instead — which is what the
   * first attempt did — shifts everything outward and put the pull noticeably
   * left of where the photograph has it.
   */

  // Frame occupies relX 0.045–0.955, relY 0.015–0.975; profile reads ~90mm.
  addRectFrame(parts, "outer-frame", "Dış kasa", "frame", "metal", 0, 0.011, 0.928, 2.016, 0.092, 0.13, 0);

  parts.push(box("leaf", "Kapı kanadı", "leaf", "metal", [0.755, 1.869, 0.078], [0.005, -0.011, 0.006], 0.012));

  // Glazing sits in a raised, chamfered surround — a distinct step off the leaf.
  addRectFrame(parts, "glass-frame", "Cam çerçevesi", "trim", "metal", -0.184, -0.021, 0.245, 1.428, 0.04, 0.03, 0.05);
  parts.push(box("glass", "Dekoratif cam", "glass", "glass", [0.168, 1.344, 0.016], [-0.176, -0.021, 0.056], 0.004));

  // Lattice: two columns of square motifs, roughly twenty rows down the pane.
  parts.push(box("glass-v-0", "Cam düşey kayıt", "trim", "metalDark", [0.006, 1.3, 0.012], [-0.176, -0.021, 0.07], 0.002));
  for (let index = -9; index <= 9; index += 1) {
    parts.push(box(`glass-h-${index}`, "Cam yatay kayıt", "trim", "metalDark", [0.16, 0.005, 0.012], [-0.176, -0.021 + index * 0.067, 0.07], 0.002));
  }

  // Eleven vertical flutes across the centre of the leaf, ~25mm apart.
  for (let index = 0; index < 11; index += 1) {
    parts.push(box(`flute-${index}`, "Düşey yüzey oluğu", "panel", "metal", [0.012, 1.785, 0.022], [-0.036 + index * 0.0255, 0, 0.05], 0.003));
  }

  parts.push(
    // Hardware on this model is anthracite, not bright chrome — "metalDark".
    box("pull", "Çekme kolu", "hardware", "metalDark", [0.026, 1.491, 0.034], [0.268, 0.011, 0.118], 0.011),
    box("pull-top", "Kol üst bağlantısı", "hardware", "metalDark", [0.046, 0.022, 0.06], [0.268, 0.735, 0.095], 0.008),
    box("pull-bottom", "Kol alt bağlantısı", "hardware", "metalDark", [0.046, 0.022, 0.06], [0.268, -0.714, 0.095], 0.008),
    box("lock-top", "Üst kilit rozeti", "hardware", "metalDark", [0.051, 0.067, 0.03], [0.352, 0.168, 0.094], 0.005),
    box("lock-bottom", "Alt kilit rozeti", "hardware", "metalDark", [0.051, 0.067, 0.03], [0.352, -0.242, 0.094], 0.005)
  );

  return parts;
};

/**
 * AL-001 "Avero" — read off Image03.
 *
 * A different arrangement to AL-020 entirely: a wide fixed sidelight in fluted
 * obscure glass on the left, a ribbed metal strip beside it, then a plain dark
 * leaf on the right carrying two brass escutcheons. The frame is heavy and
 * carries a deep head band across the top.
 *
 * Photograph is 0.635 wide for 1.0 high, so at a 2.10 leaf the reference plane
 * spans 1.334 across; every figure below is (relX − 0.5) × 1.334 and
 * (0.5 − relY) × 2.10 as established on AL-020.
 */
const al001Parts = (): DoorPart[] => {
  const parts: DoorPart[] = [];

  // Frame spans image 0.071–0.893 across and 0.040–0.942 down; profile ~119mm.
  addRectFrame(parts, "outer-frame", "Dış kasa", "frame", "metal", -0.024, 0.02, 1.097, 1.894, 0.119, 0.15, 0);

  // Deep head band above the opening.
  parts.push(box("head-band", "Üst lento", "frame", "metal", [0.84, 0.147, 0.14], [-0.024, 0.845, 0.01], 0.008));

  /*
   * Zone boundaries taken from the column-brightness profile and then drawn back
   * over the photograph to check them, rather than judged by eye:
   *
   *   frame     image x 0.071–0.893     lum ~0.50–0.64
   *   sidelight image x 0.200–0.428     lum  0.70–0.90  (near-white obscure glass)
   *   rib strip image x 0.437–0.535     lum  0.50–0.55  (mid grey)
   *   reveal    image x 0.535–0.572     fully transparent in the source
   *   leaf      image x 0.572–0.790     lum  0.24–0.51  (dark, darkening right)
   *
   * Two earlier passes had the pane at 0.334 and then 0.284 wide; the profile puts
   * it at 0.304, and the leaf a good deal wider than either attempt allowed.
   */
  addRectFrame(parts, "sidelight-frame", "Cam kasası", "trim", "metal", -0.248, -0.089, 0.324, 1.669, 0.022, 0.05, 0.03);
  parts.push(box("sidelight", "Yan cam paneli", "glass", "glass", [0.304, 1.649, 0.02], [-0.248, -0.089, 0.048], 0.004));

  // Obscure glass: many fine vertical flutes, distinctly thinner than the strip's.
  for (let index = 0; index < 22; index += 1) {
    parts.push(box(`sidelight-flute-${index}`, "Cam düşey nervür", "trim", "glass", [0.004, 1.61, 0.008], [-0.393 + index * 0.0138, -0.089, 0.058], 0.001));
  }

  // Ribbed metal strip: fewer, heavier ribs — this is what tells it apart from
  // the glass beside it, and the previous version made both look the same.
  parts.push(box("rib-strip", "Nervürlü metal şerit", "panel", "metalDark", [0.131, 1.695, 0.05], [-0.019, -0.066, 0.05], 0.006));
  for (let index = 0; index < 6; index += 1) {
    parts.push(box(`rib-${index}`, "Şerit nervürü", "trim", "metalDark", [0.014, 1.64, 0.022], [-0.073 + index * 0.0218, -0.066, 0.08], 0.003));
  }

  // Dark separating reveal, then the leaf itself.
  /*
   * Image x 0.535–0.572 comes back fully transparent, and that is a cut-out
   * artefact, not geometry: the pull is a black bar and the background removal
   * took it out along with the backdrop. It was modelled as a recess on the first
   * pass, which is exactly backwards — there is more material there, not less.
   *
   * Because the photograph has a hole at that spot, this part must keep its own
   * material when the skin goes on; hardware is excluded from texturing for that
   * reason.
   */
  parts.push(
    // Brushed aluminium, not anthracite — the bar only reads dark in the
    // photograph because the cut-out removed it and left a hole.
    box("pull", "Alüminyum çekme kolu", "hardware", "metal", [0.042, 1.62, 0.05], [0.071, -0.066, 0.115], 0.014),
    box("pull-top", "Kol üst bağlantısı", "hardware", "metal", [0.05, 0.022, 0.07], [0.071, 0.735, 0.085], 0.008),
    box("pull-bottom", "Kol alt bağlantısı", "hardware", "metal", [0.05, 0.022, 0.07], [0.071, -0.867, 0.085], 0.008),
    box("leaf", "Kapı kanadı", "leaf", "metalDark", [0.291, 1.695, 0.08], [0.241, -0.066, 0.045], 0.01)
  );

  // Brass escutcheons — round, unlike AL-020's square anthracite plates.
  parts.push(
    box("lock-top", "Üst kilit rozeti", "hardware", "hardware", [0.062, 0.062, 0.026], [0.327, 0.336, 0.09], 0.029),
    box("lock-bottom", "Alt kilit rozeti", "hardware", "hardware", [0.062, 0.062, 0.026], [0.327, -0.021, 0.09], 0.029),
    box("sidelight-catch", "Cam kilidi", "hardware", "hardware", [0.026, 0.026, 0.018], [-0.238, 0.2, 0.062], 0.012)
  );

  /*
   * Hinges and the latch — only visible off-axis, which is why they were missed:
   * the model was being checked head-on and read as finished. The pull sits on
   * the leaf's left edge, so the leaf swings from the right and the hinges belong
   * on that edge, with the latch opposite them.
   */
  const leafLeft = 0.241 - 0.291 / 2;
  const leafRight = 0.241 + 0.291 / 2;
  for (const [index, y] of [0.62, -0.05, -0.72].entries()) {
    parts.push(box(`hinge-${index}`, "Menteşe", "hardware", "metal", [0.034, 0.115, 0.058], [leafRight - 0.004, y, 0.05], 0.016));
  }
  parts.push(
    box("latch", "Kilit dili", "hardware", "metal", [0.018, 0.085, 0.028], [leafLeft + 0.002, -0.02, 0.055], 0.004),
    box("strike", "Karşılık plakası", "hardware", "metal", [0.014, 0.16, 0.03], [leafLeft - 0.014, -0.02, 0.04], 0.003),
    // Spy hole at eye height, centred on the leaf. It passes right through, so it
    // has to show on both faces — the leaf is 80mm deep and this is 96mm long.
    box("spy-hole", "Kapı gözetleme deliği", "hardware", "metal", [0.026, 0.026, 0.096], [0.241, 0.5, 0.045], 0.012),
    // Hinge knuckles read from behind too; the barrels stand proud of both faces.
    box("hinge-0-back", "Menteşe arka göbek", "hardware", "metal", [0.026, 0.115, 0.03], [leafRight - 0.004, 0.62, -0.005], 0.012),
    box("hinge-1-back", "Menteşe arka göbek", "hardware", "metal", [0.026, 0.115, 0.03], [leafRight - 0.004, -0.05, -0.005], 0.012),
    box("hinge-2-back", "Menteşe arka göbek", "hardware", "metal", [0.026, 0.115, 0.03], [leafRight - 0.004, -0.72, -0.005], 0.012)
  );

  // Metal threshold across the base of the opening.
  parts.push(box("threshold", "Eşik", "frame", "metal", [0.79, 0.062, 0.16], [-0.014, -0.905, 0.015], 0.006));

  return parts;
};

/**
 * Plain single-leaf archetype — the backbone of the catalogue.
 *
 * Scanning all 169 photographs put 53 doors in "single leaf, no glazing" and
 * another 33 in the wider variant of the same thing: 86 of 169 share one layout.
 * They differ in proportion and in where the hardware sits, not in what parts
 * exist. So this takes measurements and returns the parts, instead of each door
 * being written out by hand.
 *
 * What is deliberately NOT modelled: the decorative grooves on the face — AL-005's
 * chevrons, another door's horizontal bands. Those are shallow surface cuts that
 * differ on every single door, and the photograph already carries them once the
 * skin is on. Building them as geometry would be 169 bespoke jobs for something
 * the texture renders for free.
 *
 * All figures are fractions of the reference image, converted with the mapping
 * established on AL-020: x = (relX − 0.5) × width, y = (0.5 − relY) × height.
 */
export type PlainLeafSpec = {
  /** Image fractions: [left, right] and [top, bottom]. */
  frameOuter: [number, number, number, number];
  leaf: [number, number, number, number];
  /** Frame profile width, as an image fraction. */
  frameProfile: number;
  /** Vertical bar pull: x centre, and its top/bottom. */
  pull: { x: number; top: number; bottom: number };
  /** Escutcheons down the lock stile. */
  locks: Array<{ x: number; y: number }>;
  spyHole?: { x: number; y: number };
  /** Threshold band at the foot of the opening. */
  threshold?: [number, number, number, number];
  /** Which edge the leaf swings from; the pull sits opposite. */
  hingeSide?: "left" | "right";
  leafDepth?: number;
  frameDepth?: number;
};

const plainLeafParts = (spec: PlainLeafSpec, width: number, height: number): DoorPart[] => {
  const parts: DoorPart[] = [];
  const X = (rel: number) => (rel - 0.5) * width;
  const Y = (rel: number) => (0.5 - rel) * height;
  const W = (span: number) => span * width;
  const H = (span: number) => span * height;

  const [fx0, fx1, fy0, fy1] = spec.frameOuter;
  const [lx0, lx1, ly0, ly1] = spec.leaf;
  const leafDepth = spec.leafDepth ?? 0.078;
  const frameDepth = spec.frameDepth ?? 0.14;

  addRectFrame(
    parts, "outer-frame", "Dış kasa", "frame", "metal",
    X((fx0 + fx1) / 2), Y((fy0 + fy1) / 2),
    W(fx1 - fx0), H(fy1 - fy0),
    W(spec.frameProfile), frameDepth, 0
  );

  parts.push(box(
    "leaf", "Kapı kanadı", "leaf", "metal",
    [W(lx1 - lx0), H(ly1 - ly0), leafDepth],
    [X((lx0 + lx1) / 2), Y((ly0 + ly1) / 2), 0.006],
    0.012
  ));

  // Bar pull, standing off the face on two spigots.
  const pullHeight = H(spec.pull.bottom - spec.pull.top);
  const pullY = Y((spec.pull.top + spec.pull.bottom) / 2);
  parts.push(
    box("pull", "Çekme kolu", "hardware", "hardware", [0.026, pullHeight, 0.03], [X(spec.pull.x), pullY, leafDepth / 2 + 0.06], 0.012),
    box("pull-top", "Kol üst bağlantısı", "hardware", "hardware", [0.044, 0.022, 0.055], [X(spec.pull.x), Y(spec.pull.top) - 0.03, leafDepth / 2 + 0.03], 0.008),
    box("pull-bottom", "Kol alt bağlantısı", "hardware", "hardware", [0.044, 0.022, 0.055], [X(spec.pull.x), Y(spec.pull.bottom) + 0.03, leafDepth / 2 + 0.03], 0.008)
  );

  spec.locks.forEach((lock, index) => {
    parts.push(box(
      `lock-${index}`, `Kilit rozeti ${index + 1}`, "hardware", "hardware",
      [0.05, 0.055, 0.026], [X(lock.x), Y(lock.y), leafDepth / 2 + 0.014], 0.006
    ));
  });

  if (spec.spyHole) {
    parts.push(box(
      "spy-hole", "Kapı gözetleme deliği", "hardware", "hardware",
      [0.024, 0.024, leafDepth + 0.02], [X(spec.spyHole.x), Y(spec.spyHole.y), 0.006], 0.011
    ));
  }

  // Hinges on the stile opposite the pull, latch on the pull side.
  const hingeSide = spec.hingeSide ?? (spec.pull.x < 0.5 ? "right" : "left");
  const hingeX = hingeSide === "right" ? lx1 : lx0;
  const latchX = hingeSide === "right" ? lx0 : lx1;
  const leafTop = ly0;
  const leafBottom = ly1;
  [0.18, 0.5, 0.82].forEach((t, index) => {
    const y = leafTop + (leafBottom - leafTop) * t;
    parts.push(box(`hinge-${index}`, "Menteşe", "hardware", "metal", [0.03, 0.1, leafDepth * 0.7], [X(hingeX), Y(y), 0.006], 0.014));
  });
  parts.push(box("latch", "Kilit dili", "hardware", "metal", [0.016, 0.08, 0.026], [X(latchX), Y((leafTop + leafBottom) / 2), 0.02], 0.004));

  if (spec.threshold) {
    const [tx0, tx1, ty0, ty1] = spec.threshold;
    parts.push(box(
      "threshold", "Eşik", "frame", "metal",
      [W(tx1 - tx0), H(ty1 - ty0), frameDepth],
      [X((tx0 + tx1) / 2), Y((ty0 + ty1) / 2), 0.01], 0.005
    ));
  }

  return parts;
};

const addGlassGrid = (
  target: DoorPart[],
  id: string,
  centreX: number,
  centreY: number,
  width: number,
  height: number,
  columns: number,
  rows: number,
  z: number
) => {
  for (let index = 1; index < columns; index += 1) {
    const x = centreX - width / 2 + (width * index) / columns;
    target.push(box(`${id}-v-${index}`, "Cam düşey kayıt", "trim", "metalDark", [0.006, height, 0.012], [x, centreY, z], 0.002));
  }
  for (let index = 1; index < rows; index += 1) {
    const y = centreY - height / 2 + (height * index) / rows;
    target.push(box(`${id}-h-${index}`, "Cam yatay kayıt", "trim", "metalDark", [width, 0.006, 0.012], [centreX, y, z], 0.002));
  }
};

const cm019Parts = (): DoorPart[] => {
  const parts: DoorPart[] = [];

  /**
   * Openings measured off the reference photograph rather than eyeballed.
   *
   * Method: sample the leaf's alpha box, then for each column take the share of
   * pixels down the body that read neutral-and-light (glazing) against warm
   * (timber). Glass columns come out as clean runs; the same sweep across rows
   * gives their vertical extent. Values below are those measurements converted
   * to metres against a 1.58 x 2.10 leaf.
   *
   * What it corrected: the centre pane was modelled 0.76 tall when the photograph
   * puts it at 1.28, the sidelights sat 42mm too far out, and the leaf was 250mm
   * narrower than the gap it has to fill.
   */
  addRectFrame(parts, "portal", "Portal kasa", "frame", "wood", 0, 0, 1.58, 2.1, 0.1, 0.16, 0);
  parts.push(
    box("left-stile", "Sol ahşap dikme", "frame", "wood", [0.1, 1.5, 0.13], [-0.375, -0.19, 0.018], 0.01),
    box("right-stile", "Sağ ahşap dikme", "frame", "wood", [0.1, 1.5, 0.13], [0.375, -0.19, 0.018], 0.01),
    box("transom-rail", "Üst kayıt", "frame", "wood", [1.36, 0.1, 0.13], [0, 0.6, 0.018], 0.01),
    box("leaf", "Merkez kanat", "leaf", "wood", [0.62, 1.46, 0.09], [0, -0.23, 0.02], 0.012)
  );

  const openings = [
    { id: "left-glass", label: "Sol yan cam", x: -0.528, y: -0.172, w: 0.179, h: 1.412, cols: 3, rows: 7 },
    { id: "right-glass", label: "Sağ yan cam", x: 0.526, y: -0.172, w: 0.183, h: 1.415, cols: 3, rows: 7 },
    // Height needed a second pass: "neutral and light" alone swept the pale
    // concrete threshold in under the pane and stretched it to 1.278. Requiring
    // pattern density as well — the leaded bars — ends the pane where it really
    // ends, at 0.837 of the leaf.
    { id: "centre-glass", label: "Merkez cam", x: 0, y: -0.192, w: 0.265, h: 1.031, cols: 4, rows: 7 },
    { id: "top-glass", label: "Üst cam", x: 0, y: 0.743, w: 1.3, h: 0.186, cols: 8, rows: 1 }
  ] as const;

  for (const opening of openings) {
    parts.push(box(opening.id, opening.label, "glass", "glass", [opening.w, opening.h, 0.018], [opening.x, opening.y, 0.078], 0.004));
    addRectFrame(parts, `${opening.id}-frame`, `${opening.label} çerçevesi`, "trim", "metalDark", opening.x, opening.y, opening.w + 0.05, opening.h + 0.05, 0.022, 0.024, 0.092);
    addGlassGrid(parts, opening.id, opening.x, opening.y, opening.w, opening.h, opening.cols, opening.rows, 0.096);
  }

  parts.push(
    box("pull", "Düşey çekme kolu", "hardware", "hardware", [0.024, 0.5, 0.034], [0.25, -0.14, 0.126], 0.012),
    box("pull-top", "Kol üst bağlantısı", "hardware", "hardware", [0.05, 0.024, 0.065], [0.25, 0.08, 0.103], 0.008),
    box("pull-bottom", "Kol alt bağlantısı", "hardware", "hardware", [0.05, 0.024, 0.065], [0.25, -0.36, 0.103], 0.008),
    box("lock", "Kilit rozeti", "hardware", "hardware", [0.045, 0.07, 0.034], [0.2, -0.2, 0.112], 0.006)
  );

  return parts;
};

/**
 * AL-005 measured off Image24.
 *
 * Hardware positions are measured, not judged: bright metal against the dark leaf
 * separates cleanly, so the escutcheons and the spy hole come out of a blob pass
 * and the pull out of a "which columns stay bright top to bottom" pass. Eyeballing
 * them first put the lower lock 81‰ high and the pull 34‰ to the right — visible
 * straight away once the model sat next to the photograph.
 */
const al005Spec: PlainLeafSpec = {
  frameOuter: [0.090, 0.900, 0.025, 0.975],
  frameProfile: 0.095,
  leaf: [0.190, 0.800, 0.085, 0.940],
  pull: { x: 0.296, top: 0.190, bottom: 0.860 },
  locks: [{ x: 0.197, y: 0.325 }, { x: 0.197, y: 0.551 }],
  spyHole: { x: 0.507, y: 0.285 },
  threshold: [0.190, 0.800, 0.940, 0.965],
  hingeSide: "right"
};

const calibratedDoorDefinitions: DoorDefinition[] = [
  {
    code: "AL-005",
    name: "Liven",
    family: "Alüminyum Sistemler",
    referenceImage: "/images/katalogwebp/Image24.webp",
    width: 1.3,
    height: 2.1,
    depth: 0.078,
    frameDepth: 0.14,
    parts: plainLeafParts(al005Spec, 1.3, 2.1),
    archetype: "calibrated",
    modelStatus: "calibrated",
    referenceRole: "product"
  },
  {
    code: "AL-001",
    name: "Avero",
    family: "Alüminyum Sistemler",
    referenceImage: "/images/katalogwebp/Image03.webp",
    width: 1.334,
    height: 2.1,
    depth: 0.08,
    frameDepth: 0.15,
    parts: al001Parts(),
    archetype: "calibrated",
    modelStatus: "calibrated",
    referenceRole: "product"
  },
  {
    code: "AL-020",
    name: "Celon",
    family: "Alüminyum Sistemler",
    referenceImage: "/images/katalogwebp/Image90.webp",
    width: 1.02,
    height: 2.1,
    depth: 0.078,
    frameDepth: 0.13,
    parts: al020Parts(),
    archetype: "calibrated",
    modelStatus: "calibrated",
    referenceRole: "product"
  },
  {
    code: "CM-019",
    name: "Alira",
    family: "Camlı Modeller",
    referenceImage: "/images/katalogwebp/Image63.webp",
    width: 1.58,
    height: 2.1,
    depth: 0.09,
    frameDepth: 0.16,
    parts: cm019Parts(),
    archetype: "calibrated",
    modelStatus: "calibrated",
    referenceRole: "product"
  }
];

/** Curated, visually checked models used by the three presentation variants. */
export const featuredDoorDefinitions = calibratedDoorDefinitions;

const calibratedByCode = new Map(
  calibratedDoorDefinitions.map((definition) => [definition.code, definition])
);

/**
 * Catalogue order is the source of truth: all 169 products always get a mesh.
 * A calibrated definition replaces its generated archetype without changing the
 * consumer API, so the editor and GLB exporter do not need per-door branches.
 */
export const doorDefinitions: DoorDefinition[] = products.map((product) =>
  calibratedByCode.get(product.code) ?? createCatalogDoorDefinition(product)
);

export const doorDefinitionByCode = (code: DoorDefinition["code"]) =>
  doorDefinitions.find((definition) => definition.code === code) ?? doorDefinitions[0]!;
