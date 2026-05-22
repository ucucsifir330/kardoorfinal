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

type CatalogProductGroup = {
  prefix: string;
  seriesSlug: string;
  seriesTitle: string;
  category: string;
  description: string;
  specs: string[];
  materials: string[];
  useCases: string[];
  surfaces: string[];
  exportTags: string[];
  imageKeys: Array<keyof typeof seriesImages>;
  accentColor: string;
  names: string[];
};

const catalogProductGroups: CatalogProductGroup[] = [
  {
    prefix: "AL",
    seriesSlug: "aluminyum",
    seriesTitle: "Aluminyum",
    category: "Aluminyum steel door",
    description: "Aluminyum collection model for premium exterior door catalogs and project supply.",
    specs: ["Aluminyum system", "Steel security core", "Exterior-ready profile"],
    materials: ["Aluminyum surface", "Steel leaf", "Premium hardware"],
    useCases: ["Villa", "Exterior", "Project"],
    surfaces: ["Aluminyum", "Metal"],
    exportTags: ["Catalog model", "Custom size", "Dealer supply"],
    imageKeys: ["monoGraphite", "graphiteOak", "emeraldLine"],
    accentColor: "#2ce3ff",
    names: [
      "Avero", "Velora", "Noven", "Altra", "Liven", "Meron", "Savio", "Orlen",
      "Vanta", "Celon", "Arven", "Nexo", "Virel", "Moren", "Avion", "Zedra",
      "Coren", "Valen", "Serio", "Elvon", "Rovan", "Lento", "Soren", "Daxon",
      "Olven", "Rixon", "Calen", "Asten", "Verio", "Lorix", "Naron", "Evaro",
      "Paxon", "Taren", "Silon", "Orvia", "Relon", "Cevio", "Alven", "Monex",
      "Vario", "Leron", "Zenvo", "Marix", "Solen", "Altivo", "Rivon", "Avel",
      "Novaro", "Calvo", "Veron", "Orvio", "Laxen", "Mirov", "Arelon", "Senvo"
    ]
  },
  {
    prefix: "DY",
    seriesSlug: "dogal",
    seriesTitle: "Dogal",
    category: "Natural-surface steel door",
    description: "Dogal collection model with warm and mineral surface language for refined entrances.",
    specs: ["Natural surface finish", "Steel body", "Insulated entry panel"],
    materials: ["Wood or stone surface", "Steel carrier", "Satin hardware"],
    useCases: ["Villa", "Residence", "Architectural project"],
    surfaces: ["Dogal", "Textured"],
    exportTags: ["Catalog model", "Project quantity", "Custom size"],
    imageKeys: ["ivoryLine", "classicSand", "graphiteOak"],
    accentColor: "#57e2ff",
    names: [
      "Cedra", "Ligna", "Arlo", "Venia", "Caldo", "Rovio", "Selva", "Norra",
      "Lando", "Evora", "Tavon", "Morva", "Lunor", "Alera", "Verno", "Carvo",
      "Dalen", "Senda", "Olira", "Viora", "Renzo", "Madra", "Lorva", "Telon",
      "Brava", "Sovia", "Orlan", "Melio", "Tavira", "Norel", "Ravon", "Merlo",
      "Albio", "Davor", "Lenia", "Voren", "Solva", "Carya", "Nelio", "Varlo",
      "Auron", "Fello", "Petra", "Roca", "Travia", "Grava", "Onixa", "Marvo",
      "Stona", "Ardes", "Obra", "Lavio", "Terron", "Volca", "Rocen", "Satra"
    ]
  },
  {
    prefix: "CM",
    seriesSlug: "cam",
    seriesTitle: "Cam",
    category: "Glass detail steel door",
    description: "Cam collection model for luminous entrance compositions and secure steel door projects.",
    specs: ["Glass detail option", "Steel structure", "Secure entry profile"],
    materials: ["Glass surface", "Steel body", "Metal hardware"],
    useCases: ["Villa", "Residence", "Showroom"],
    surfaces: ["Cam", "Glass"],
    exportTags: ["Catalog model", "Custom size", "Project quantity"],
    imageKeys: ["emeraldLine", "ivoryLine", "monoGraphite"],
    accentColor: "#7cebff",
    names: [
      "Clara", "Lumio", "Glora", "Avena", "Mirra", "Solia", "Elvia", "Noris",
      "Alira", "Vionna", "Velia", "Ravena", "Oria", "Calira", "Lenora", "Azora",
      "Celia", "Novia", "Selia", "Melora", "Arina", "Luvia", "Seria", "Luma",
      "Vela", "Orelia", "Avira", "Ralia", "Lorena", "Soria", "Meria", "Vania",
      "Ilora", "Solara", "Lunia", "Aural", "Verina", "Delia", "Fiora", "Noria",
      "Elina", "Livia", "Amora", "Nella", "Sorena", "Velina", "Mirel", "Lavina",
      "Evina", "Alora", "Mirea", "Celora", "Solina", "Arvia", "Venora", "Elora"
    ]
  },
  {
    prefix: "MK",
    seriesSlug: "metal-kompozit",
    seriesTitle: "Metal & Kompozit",
    category: "Metal and composite steel door",
    description: "Metal and composite collection model for durable, modern and exterior-facing entries.",
    specs: ["Composite-ready surface", "Reinforced steel core", "Durable entry panel"],
    materials: ["Metal finish", "Composite panel", "Steel carrier"],
    useCases: ["Exterior", "Apartment", "Project"],
    surfaces: ["Metal", "Kompozit"],
    exportTags: ["Export packaging", "Catalog model", "Dealer supply"],
    imageKeys: ["monoGraphite", "graphiteOak", "classicSand"],
    accentColor: "#36deff",
    names: [
      "Krono", "Nexa", "Modra", "Helio", "Brion", "Solix", "Travo", "Monza",
      "Avex", "Rado", "Vexen", "Corel", "Sylon", "Maxor", "Trion", "Voxa",
      "Faron", "Novix", "Merix", "Loxen", "Ortex", "Valto", "Zenix", "Dario",
      "Rekta", "Polix", "Favio", "Toren", "Nexor", "Miron", "Lavia", "Gravo",
      "Dexio", "Morix", "Ronel", "Laxor", "Vion", "Stravo", "Calix", "Feron",
      "Zento", "Alcor", "Mavix", "Varon", "Sanor", "Bravio", "Axton", "Rexion",
      "Ziron", "Valcor", "Armax", "Ferron", "Galvo", "Kordo", "Tario", "Niron"
    ]
  },
  {
    prefix: "PL",
    seriesSlug: "pvc-laminoks",
    seriesTitle: "PVC & Laminoks",
    category: "PVC and laminoks steel door",
    description: "PVC and Laminoks collection model for exclusive finish programs and dealer catalogs.",
    specs: ["Exclusive surface", "Steel door structure", "Premium finish option"],
    materials: ["PVC or laminoks finish", "Steel body", "Inox hardware"],
    useCases: ["Residence", "Villa", "Dealer catalog"],
    surfaces: ["PVC", "Laminoks"],
    exportTags: ["Catalog model", "Dealer supply", "Custom size"],
    imageKeys: ["graphiteOak", "emeraldLine", "monoGraphite"],
    accentColor: "#30d5f4",
    names: [
      "Noira", "Grisio", "Antra", "Silvio", "Trenza", "Lamora", "Invero", "Noxia",
      "Argen", "Voltra", "Satrix", "Nervia", "Lineo", "Vexia", "Lorvo", "Zelta",
      "Axira", "Monel", "Lunessa", "Velissa", "Marena", "Ovidia", "Calina", "Sorell",
      "Vionel", "Arlina", "Novela", "Melian", "Corvia", "Elian", "Savena", "Lorina",
      "Venita", "Arelia", "Nivora", "Ravina", "Celina", "Alessa", "Davia", "Merina",
      "Olena", "Serova", "Valina", "Neriva", "Polina", "Savira", "Leniva", "Morina",
      "Elviana", "Virella", "Narella", "Orlina", "Mavena", "Seleno", "Alvoria", "Verenia"
    ]
  },
  {
    prefix: "MO",
    seriesSlug: "mimari-ozel",
    seriesTitle: "Mimari Ozel",
    category: "Architectural custom steel door",
    description: "Mimari Ozel collection model for tailored entrance concepts and project-led supply.",
    specs: ["Project-ready format", "Custom door detail", "Steel security system"],
    materials: ["Architectural surface", "Steel carrier", "Premium hardware"],
    useCases: ["Architectural project", "Villa", "Custom entry"],
    surfaces: ["Mimari", "Ozel"],
    exportTags: ["Project quantity", "Custom size", "Dealer supply"],
    imageKeys: ["ivoryLine", "monoGraphite", "emeraldLine"],
    accentColor: "#39ddfd",
    names: [
      "Aureo", "Velaro", "Mareno", "Soreva", "Arlento", "Loreno", "Vareno", "Elvian",
      "Avora", "Selaro", "Torvian", "Navora", "Mavora", "Celnor", "Ravello", "Vellon",
      "Aleron", "Delaro", "Solvian", "Tervia", "Lioren", "Valora", "Novento", "Arvento",
      "Merano", "Savora", "Calvero", "Lavoro", "Vionor", "Corvian", "Alvoro", "Renova",
      "Toreno", "Miravo", "Sorello", "Verano", "Orvanto", "Laveno", "Cavoro", "Novian",
      "Meravo", "Avenor", "Telaro", "Solvaro", "Venaro", "Loravo", "Doreva", "Elvaro",
      "Ravino", "Moravo", "Arelto", "Vantio", "Calvora", "Senaro", "Ovello", "Varenza"
    ]
  },
  {
    prefix: "GT",
    seriesSlug: "giris-teknik",
    seriesTitle: "Giris & Teknik",
    category: "Entry and technical steel door",
    description: "Giris and technical collection model for protected entries and project-specific access.",
    specs: ["Technical entry profile", "Steel security body", "Project hardware option"],
    materials: ["Technical steel panel", "Secure core", "Durable hardware"],
    useCases: ["Building entry", "Technical access", "Project"],
    surfaces: ["Giris", "Teknik"],
    exportTags: ["Project quantity", "Catalog model", "Export packaging"],
    imageKeys: ["classicSand", "graphiteOak", "monoGraphite"],
    accentColor: "#2ce3ff",
    names: [
      "Sentra", "Guardio", "Dravo", "Korven", "Vardon", "Ralix", "Kavon", "Maxen",
      "Ronar", "Atrix", "Savon", "Kavor", "Brenton", "Galron", "Zentro", "Marcon",
      "Orvan", "Rexa", "Valtor", "Arcon", "Daxor", "Kalven", "Tiron", "Bastio",
      "Fortis", "Valkan", "Bravon", "Helion", "Stren", "Norax", "Karden", "Velkor",
      "Torax", "Vexor", "Kasten", "Ralven", "Dorix", "Arvenor", "Vostro", "Rexiona",
      "Soltan", "Kervon", "Navor", "Valtro", "Tervon", "Galven", "Morven", "Darion",
      "Sarnox", "Revon", "Kaldan", "Zarton", "Mervon", "Arvex", "Kovian", "Sentro"
    ]
  }
];

const slugifyProductPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const products: DoorProduct[] = catalogProductGroups.flatMap((group) =>
  group.names.map((name, index) => {
    const code = `${group.prefix}-${String(index + 1).padStart(3, "0")}`;
    const imageKey = group.imageKeys[index % group.imageKeys.length];

    return {
      slug: `${group.seriesSlug}-${slugifyProductPart(code)}-${slugifyProductPart(name)}`,
      code,
      seriesSlug: group.seriesSlug,
      seriesTitle: group.seriesTitle,
      name,
      category: group.category,
      description: group.description,
      specs: [...group.specs],
      materials: [...group.materials],
      useCases: [...group.useCases],
      surfaces: [...group.surfaces],
      exportTags: [...group.exportTags],
      image: seriesImages[imageKey],
      accentColor: group.accentColor
    };
  })
);
