export type DoorSeries = {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  modelCodes: string[];
  materials: string[];
  accentColor: string;
  image: string;
};

const seriesImages = {
  ivoryLine: "https://ik.imagekit.io/kardoor/series/1.png?updatedAt=1778762643897",
  graphiteOak: "https://ik.imagekit.io/kardoor/series/2.png?updatedAt=1778762645386",
  classicSand: "https://ik.imagekit.io/kardoor/series/3.png?updatedAt=1778762644382",
  emeraldLine: "https://ik.imagekit.io/kardoor/series/4.png?updatedAt=1778762645568",
  monoGraphite: "https://ik.imagekit.io/kardoor/series/5.png?updatedAt=1778762645583"
} as const;

export const collections: DoorSeries[] = [
  {
    slug: "aluminium-frame",
    number: "01",
    title: "Aluminium Frame Series",
    shortTitle: "Aluminium Frame",
    description:
      "A clean, durable steel door family for modern facades, villas and premium residential entrances.",
    longDescription:
      "The Aluminium Frame Series combines steel door security with a precise, contemporary frame character. It is positioned for villas, apartments and high-value residential entrances that need a strong first impression.",
    modelCodes: ["K1001", "K1002", "K1004"],
    materials: ["Frame", "Leaf", "Surface", "Handle", "Lock", "Glass"],
    accentColor: "#2ce3ff",
    image: seriesImages.monoGraphite
  },
  {
    slug: "aluminium-frame-leaf",
    number: "02",
    title: "Aluminium Frame & Leaf Series",
    shortTitle: "Frame & Leaf",
    description:
      "Aluminium stability on frame and leaf for long-lasting exterior performance.",
    longDescription:
      "The Aluminium Frame & Leaf Series is developed for exterior exposure, coastal markets and projects where form stability matters as much as refined appearance.",
    modelCodes: ["K1051", "K1054", "K1058"],
    materials: ["Frame", "Leaf", "Surface", "Handle", "Lock", "Glass"],
    accentColor: "#39ddfd",
    image: seriesImages.graphiteOak
  },
  {
    slug: "thermo-wood",
    number: "03",
    title: "Thermo Wood Series",
    shortTitle: "Thermo Wood",
    description:
      "Warm wood character with a secure steel core for villas and detached homes.",
    longDescription:
      "The Thermo Wood Series brings natural warmth to premium entrances while keeping the steel security structure intact. It is especially suited for villas, detached houses and hospitality-style residential projects.",
    modelCodes: ["K1101", "K1104", "K1108"],
    materials: ["Frame", "Leaf", "Surface", "Handle", "Lock", "Glass"],
    accentColor: "#7cebff",
    image: seriesImages.ivoryLine
  },
  {
    slug: "natural-stone",
    number: "04",
    title: "Natural Stone Series",
    shortTitle: "Natural Stone",
    description:
      "Stone-effect surfaces paired with modern steel door security for prestige entrances.",
    longDescription:
      "The Natural Stone Series helps the entrance align with architectural facade language. It combines a strong security structure with a permanent, premium surface impression.",
    modelCodes: ["K1201", "K1204", "K1208"],
    materials: ["Frame", "Leaf", "Surface", "Handle", "Lock", "Glass"],
    accentColor: "#57e2ff",
    image: seriesImages.classicSand
  },
  {
    slug: "composite",
    number: "05",
    title: "Composite Series",
    shortTitle: "Composite",
    description:
      "Composite surface technology for coastal, humid and exterior-facing applications.",
    longDescription:
      "The Composite Series focuses on exterior durability, lower maintenance and surface stability for coastal markets, open facades and high-humidity locations.",
    modelCodes: ["K1401", "K1405", "K1408"],
    materials: ["Frame", "Leaf", "Surface", "Handle", "Lock", "Glass"],
    accentColor: "#36deff",
    image: seriesImages.monoGraphite
  },
  {
    slug: "laminox",
    number: "06",
    title: "Laminox Series",
    shortTitle: "Laminox",
    description:
      "A modern metallic entrance language for premium residential and project supply.",
    longDescription:
      "The Laminox Series is designed for residential entrances that need a modern, timeless and high-value surface character while keeping a reinforced steel structure.",
    modelCodes: ["L1001", "L1004", "L1010"],
    materials: ["Frame", "Leaf", "Surface", "Handle", "Lock", "Glass"],
    accentColor: "#30d5f4",
    image: seriesImages.graphiteOak
  }
];
