export type DoorPartKind = "frame" | "leaf" | "panel" | "glass" | "trim" | "hardware";

export type DoorMaterialKey = "metal" | "metalDark" | "wood" | "glass" | "hardware";

export type DoorArchetype =
  | "single-leaf"
  | "single-glazed"
  | "side-glazed"
  | "double-leaf"
  | "double-glazed"
  | "pivot"
  | "technical";

export type DoorPart = {
  id: string;
  label: string;
  kind: DoorPartKind;
  material: DoorMaterialKey;
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
};

export type DoorDefinition = {
  code: string;
  name: string;
  family: string;
  referenceImage: string;
  width: number;
  height: number;
  depth: number;
  frameDepth: number;
  parts: DoorPart[];
  archetype?: DoorArchetype | "calibrated";
  modelStatus?: "template" | "calibrated";
  referenceRole?: "product" | "product-showcase" | "showcase";
};
