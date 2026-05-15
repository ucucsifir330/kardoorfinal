export type DoorProduct = {
  slug: string;
  code: string;
  seriesSlug: string;
  seriesTitle: string;
  name: string;
  category: string;
  description: string;
  specs: string[];
  materials: string[];
  useCases: string[];
  surfaces: string[];
  exportTags: string[];
  image: string;
  accentColor: string;
};

const seriesImages = {
  ivoryLine: "https://ik.imagekit.io/kardoor/series/1.png?updatedAt=1778762643897",
  graphiteOak: "https://ik.imagekit.io/kardoor/series/2.png?updatedAt=1778762645386",
  classicSand: "https://ik.imagekit.io/kardoor/series/3.png?updatedAt=1778762644382",
  emeraldLine: "https://ik.imagekit.io/kardoor/series/4.png?updatedAt=1778762645568",
  monoGraphite: "https://ik.imagekit.io/kardoor/series/5.png?updatedAt=1778762645583"
} as const;

export const products: DoorProduct[] = [
  {
    slug: "k1001",
    code: "K1001",
    seriesSlug: "aluminium-frame",
    seriesTitle: "Aluminium Frame Series",
    name: "K1001 Signature Entry",
    category: "Steel security door",
    description:
      "A sharp aluminium-frame entrance model for modern villas, premium residences and distributor catalogs.",
    specs: ["95 mm panel", "3-point lock", "Thermal insulation"],
    materials: ["Aluminium frame", "Steel leaf", "Satin handle"],
    useCases: ["Villa", "Premium residence", "Project"],
    surfaces: ["Metal", "Minimal"],
    exportTags: ["Custom size", "Project quantity", "Distributor ready"],
    image: seriesImages.monoGraphite,
    accentColor: "#2ce3ff"
  },
  {
    slug: "k1002",
    code: "K1002",
    seriesSlug: "aluminium-frame",
    seriesTitle: "Aluminium Frame Series",
    name: "K1002 Minimal Frame",
    category: "Steel security door",
    description:
      "A minimal model with clean proportions for apartments, villas and contemporary facade systems.",
    specs: ["92 mm panel", "Multipoint lock", "Acoustic profile"],
    materials: ["Aluminium profile", "Composite support", "Titanium handle"],
    useCases: ["Villa", "Apartment", "Project"],
    surfaces: ["Metal", "Minimal"],
    exportTags: ["Custom size", "Catalog model", "Dealer supply"],
    image: seriesImages.graphiteOak,
    accentColor: "#2ce3ff"
  },
  {
    slug: "k1004",
    code: "K1004",
    seriesSlug: "aluminium-frame",
    seriesTitle: "Aluminium Frame Series",
    name: "K1004 Glass Detail",
    category: "Steel security door",
    description:
      "A prestige entrance model with a vertical glass detail and strong aluminium frame language.",
    specs: ["90 mm panel", "4-point lock", "Tempered glass option"],
    materials: ["Aluminium frame", "Tempered glass", "Stainless handle"],
    useCases: ["Villa", "Architectural housing", "Project"],
    surfaces: ["Glass", "Metal"],
    exportTags: ["Custom size", "Project quantity", "Dealer supply"],
    image: seriesImages.emeraldLine,
    accentColor: "#2ce3ff"
  },
  {
    slug: "k1051",
    code: "K1051",
    seriesSlug: "aluminium-frame-leaf",
    seriesTitle: "Aluminium Frame & Leaf Series",
    name: "K1051 Dual Stability",
    category: "Exterior steel door",
    description:
      "Aluminium frame and leaf structure for long-lasting performance in demanding exterior climates.",
    specs: ["98 mm panel", "Smart lock ready", "Exterior climate resistance"],
    materials: ["Aluminium frame", "Aluminium leaf", "Matte black handle"],
    useCases: ["Villa", "Coastal market", "Exterior"],
    surfaces: ["Metal", "Minimal"],
    exportTags: ["Custom size", "Export packaging", "Project quantity"],
    image: seriesImages.graphiteOak,
    accentColor: "#39ddfd"
  },
  {
    slug: "k1054",
    code: "K1054",
    seriesSlug: "aluminium-frame-leaf",
    seriesTitle: "Aluminium Frame & Leaf Series",
    name: "K1054 Residence Entry",
    category: "Project steel door",
    description:
      "A refined model for urban residences, apartment projects and contemporary commercial entrances.",
    specs: ["96 mm panel", "Double seal", "Hidden hinge option"],
    materials: ["Aluminium leaf", "Thermal panel", "Inox handle"],
    useCases: ["Apartment", "Residence", "Project"],
    surfaces: ["Metal", "Minimal"],
    exportTags: ["Project quantity", "Dealer supply", "Catalog model"],
    image: seriesImages.monoGraphite,
    accentColor: "#39ddfd"
  },
  {
    slug: "k1058",
    code: "K1058",
    seriesSlug: "aluminium-frame-leaf",
    seriesTitle: "Aluminium Frame & Leaf Series",
    name: "K1058 Exterior Climate",
    category: "Exterior steel door",
    description:
      "A stable exterior model for coastal, humid and sun-exposed environments.",
    specs: ["98 mm panel", "Exterior durability", "High-security lock"],
    materials: ["Aluminium frame", "Aluminium leaf", "Composite support"],
    useCases: ["Exterior", "Villa", "Coastal market"],
    surfaces: ["Metal", "Composite"],
    exportTags: ["Export packaging", "Custom size", "Project quantity"],
    image: seriesImages.graphiteOak,
    accentColor: "#39ddfd"
  },
  {
    slug: "k1101",
    code: "K1101",
    seriesSlug: "thermo-wood",
    seriesTitle: "Thermo Wood Series",
    name: "K1101 Thermo Wood Signature",
    category: "Wood-effect steel door",
    description:
      "Warm wood-effect surface with a reinforced steel body for premium villa entrances.",
    specs: ["100 mm thermo panel", "3-point lock", "High insulation"],
    materials: ["Thermo wood surface", "Steel body", "Bronze handle"],
    useCases: ["Villa", "Detached house", "Residential"],
    surfaces: ["Wood", "Warm"],
    exportTags: ["Custom size", "Catalog model", "Dealer supply"],
    image: seriesImages.ivoryLine,
    accentColor: "#7cebff"
  },
  {
    slug: "k1104",
    code: "K1104",
    seriesSlug: "thermo-wood",
    seriesTitle: "Thermo Wood Series",
    name: "K1104 Elite Wood",
    category: "Wood-effect steel door",
    description:
      "A premium wood-character entrance balancing insulation, surface warmth and steel security.",
    specs: ["102 mm panel", "Sound barrier", "4-point lock"],
    materials: ["Thermo wood", "Composite core", "Premium pull handle"],
    useCases: ["Villa", "Detached house", "Premium residence"],
    surfaces: ["Wood", "Warm"],
    exportTags: ["Custom size", "Project quantity", "Dealer supply"],
    image: seriesImages.ivoryLine,
    accentColor: "#7cebff"
  },
  {
    slug: "k1108",
    code: "K1108",
    seriesSlug: "thermo-wood",
    seriesTitle: "Thermo Wood Series",
    name: "K1108 Warm Surface",
    category: "Wood-effect steel door",
    description:
      "A wood-effect model focused on insulation, secure structure and residential warmth.",
    specs: ["100 mm panel", "Insulated structure", "Premium handle option"],
    materials: ["Thermo wood surface", "Steel body", "Matte metal hardware"],
    useCases: ["Villa", "Detached house", "Residential"],
    surfaces: ["Wood", "Warm"],
    exportTags: ["Catalog model", "Dealer supply", "Custom size"],
    image: seriesImages.ivoryLine,
    accentColor: "#7cebff"
  },
  {
    slug: "k1201",
    code: "K1201",
    seriesSlug: "natural-stone",
    seriesTitle: "Natural Stone Series",
    name: "K1201 Stone Signature",
    category: "Stone-effect steel door",
    description:
      "A prestige steel entrance with stone-effect surface for high-value villas and projects.",
    specs: ["95 mm panel", "Stone-effect layer", "Reinforced lock"],
    materials: ["Stone-effect surface", "Steel carrier", "Titanium handle"],
    useCases: ["Villa", "Prestige project", "Showroom"],
    surfaces: ["Stone", "Textured"],
    exportTags: ["Custom size", "Project quantity", "Catalog model"],
    image: seriesImages.classicSand,
    accentColor: "#57e2ff"
  },
  {
    slug: "k1204",
    code: "K1204",
    seriesSlug: "natural-stone",
    seriesTitle: "Natural Stone Series",
    name: "K1204 Facade Stone",
    category: "Stone-effect steel door",
    description:
      "A stone-character model built to align the entrance with contemporary facade materials.",
    specs: ["96 mm panel", "Stone-textured surface", "Multipoint lock"],
    materials: ["Stone-effect panel", "Steel body", "Satin handle"],
    useCases: ["Villa", "Architectural project", "Prestige entrance"],
    surfaces: ["Stone", "Textured"],
    exportTags: ["Custom size", "Project quantity", "Dealer supply"],
    image: seriesImages.classicSand,
    accentColor: "#57e2ff"
  },
  {
    slug: "k1208",
    code: "K1208",
    seriesSlug: "natural-stone",
    seriesTitle: "Natural Stone Series",
    name: "K1208 Prestige Stone",
    category: "Stone-effect steel door",
    description:
      "Natural texture and minimal details for a stronger premium entrance impression.",
    specs: ["98 mm panel", "Strong surface coating", "Insulated body"],
    materials: ["Stone-effect surface", "Steel carrier", "Premium hardware"],
    useCases: ["Villa", "Residence", "Prestige project"],
    surfaces: ["Stone", "Textured"],
    exportTags: ["Project quantity", "Catalog model", "Dealer supply"],
    image: seriesImages.classicSand,
    accentColor: "#57e2ff"
  },
  {
    slug: "k1401",
    code: "K1401",
    seriesSlug: "composite",
    seriesTitle: "Composite Series",
    name: "K1401 Climate Guard",
    category: "Composite steel door",
    description:
      "A composite-surface model for difficult climates, coastal markets and exterior-facing entrances.",
    specs: ["104 mm panel", "Water-repellent layer", "Multipoint lock"],
    materials: ["Composite panel", "Steel structure", "Satin handle"],
    useCases: ["Exterior", "Coastal market", "Apartment"],
    surfaces: ["Composite", "Minimal"],
    exportTags: ["Export packaging", "Project quantity", "Custom size"],
    image: seriesImages.monoGraphite,
    accentColor: "#36deff"
  },
  {
    slug: "k1405",
    code: "K1405",
    seriesSlug: "composite",
    seriesTitle: "Composite Series",
    name: "K1405 Coastal Durability",
    category: "Composite steel door",
    description:
      "A durable surface option for markets with humidity, sun exposure and changing exterior conditions.",
    specs: ["104 mm panel", "Composite surface", "Exterior resistance"],
    materials: ["Composite panel", "Steel structure", "Matte handle"],
    useCases: ["Coastal market", "Villa", "Exterior"],
    surfaces: ["Composite", "Textured"],
    exportTags: ["Export packaging", "Custom size", "Dealer supply"],
    image: seriesImages.graphiteOak,
    accentColor: "#36deff"
  },
  {
    slug: "k1408",
    code: "K1408",
    seriesSlug: "composite",
    seriesTitle: "Composite Series",
    name: "K1408 Long-Life Composite",
    category: "Composite steel door",
    description:
      "A low-maintenance composite model for repeated use, apartment projects and exterior applications.",
    specs: ["102 mm panel", "Surface stability", "Multipoint lock"],
    materials: ["Composite surface", "Steel body", "Satin hardware"],
    useCases: ["Apartment", "Project", "Exterior"],
    surfaces: ["Composite", "Minimal"],
    exportTags: ["Project quantity", "Dealer supply", "Catalog model"],
    image: seriesImages.monoGraphite,
    accentColor: "#36deff"
  },
  {
    slug: "l1001",
    code: "L1001",
    seriesSlug: "laminox",
    seriesTitle: "Laminox Series",
    name: "L1001 Laminox Signature",
    category: "Metallic steel door",
    description:
      "A modern metallic door for premium residential entrances and distributor catalogs.",
    specs: ["96 mm panel", "Laminox surface", "Premium lock system"],
    materials: ["Laminox surface", "Steel carrier", "Inox handle"],
    useCases: ["Villa", "Residence", "Premium residence"],
    surfaces: ["Metal", "Metallic"],
    exportTags: ["Catalog model", "Dealer supply", "Custom size"],
    image: seriesImages.graphiteOak,
    accentColor: "#30d5f4"
  },
  {
    slug: "l1004",
    code: "L1004",
    seriesSlug: "laminox",
    seriesTitle: "Laminox Series",
    name: "L1004 Modern Laminox",
    category: "Metallic steel door",
    description:
      "A clean metallic surface language for contemporary villas, apartments and residences.",
    specs: ["95 mm panel", "Metallic surface", "Hidden hinge option"],
    materials: ["Laminox panel", "Steel body", "Satin handle"],
    useCases: ["Villa", "Apartment", "Residence"],
    surfaces: ["Metal", "Metallic"],
    exportTags: ["Catalog model", "Project quantity", "Dealer supply"],
    image: seriesImages.emeraldLine,
    accentColor: "#30d5f4"
  },
  {
    slug: "l1010",
    code: "L1010",
    seriesSlug: "laminox",
    seriesTitle: "Laminox Series",
    name: "L1010 Prestige Laminox",
    category: "Metallic steel door",
    description:
      "A prestige metallic model balancing high security, modern surfaces and premium hardware.",
    specs: ["98 mm panel", "Premium surface", "Smart lock ready"],
    materials: ["Laminox surface", "Steel core", "Premium hardware"],
    useCases: ["Premium residence", "Residence", "Prestige project"],
    surfaces: ["Metal", "Metallic"],
    exportTags: ["Project quantity", "Custom size", "Dealer supply"],
    image: seriesImages.graphiteOak,
    accentColor: "#30d5f4"
  }
];
