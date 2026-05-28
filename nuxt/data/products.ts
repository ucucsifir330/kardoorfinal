export type ProductVisualRole = "product" | "product-showcase" | "showcase";

export type DoorProduct = {
  slug: string;
  code: string;
  name: string;
  category: string;
  subClass: string;
  image: string;
  tags: string[];
  colors: string[];
  visualRole: ProductVisualRole;
  seriesSlug: string;
  seriesTitle: string;
  description: string;
  specs: string[];
  materials: string[];
  useCases: string[];
  surfaces: string[];
  exportTags: string[];
  accentColor: string;
};

type ImageDetail = {
  colors?: string[];
  tags?: string[];
  visualRole?: ProductVisualRole;
};

type ProductFamily = {
  prefix: string;
  seriesSlug: string;
  category: string;
  subClass: string;
  description: string;
  specs: string[];
  materials: string[];
  useCases: string[];
  surfaces: string[];
  exportTags: string[];
  baseTags: string[];
  baseColors: string[];
  accentColor: string;
  names: string[];
  images: number[];
};

const imageDetails: Record<number, ImageDetail> = {
  1: { tags: ["çift kanat", "yan camlı", "ferforje"], colors: ["ahşap", "siyah"] },
  2: { tags: ["camlı", "modern"], colors: ["siyah"] },
  4: { tags: ["yan camlı"], colors: ["beyaz", "siyah"] },
  5: { tags: ["renkli"], colors: ["yeşil"] },
  9: { tags: ["geometrik çizgi", "minimal"], colors: ["gümüş", "turuncu"] },
  13: { tags: ["çift kanat", "yan camlı", "üst camlı"], colors: ["gri"] },
  17: { tags: ["yan camlı"], colors: ["ahşap", "antrasit"] },
  19: { tags: ["renkli"], colors: ["yeşil"] },
  26: { tags: ["çift kanat", "üst camlı", "ferforje"], colors: ["beyaz", "siyah"] },
  29: { tags: ["yan camlı", "ferforje"], colors: ["antrasit"] },
  31: { tags: ["çift kanat", "yan camlı", "üst camlı"], colors: ["gri"] },
  32: { tags: ["çift kanat", "yan camlı", "ferforje"], colors: ["antrasit"] },
  33: { tags: ["çift kanat", "yan camlı"], colors: ["ahşap", "siyah"] },
  35: { tags: ["çift kanat", "yan camlı"], colors: ["ahşap", "antrasit"] },
  38: { tags: ["çift kanat", "üst camlı"], colors: ["ahşap", "siyah"] },
  46: { tags: ["çift kanat", "yan camlı"], colors: ["gri"] },
  47: { tags: ["renkli", "yan camlı"], colors: ["mavi"] },
  60: {
    tags: ["özel yüzey", "reflektif", "mimari", "vitrin"],
    colors: ["siyah", "reflektif"],
    visualRole: "product-showcase"
  },
  63: { tags: ["yan camlı", "üst camlı", "ferforje"], colors: ["ahşap", "siyah"] },
  64: { tags: ["çift kanat", "camlı"], colors: ["gri"] },
  67: { tags: ["renkli"], colors: ["mavi"] },
  71: { tags: ["renkli"], colors: ["kırmızı"] },
  73: { tags: ["renkli"], colors: ["mavi"] },
  81: { tags: ["reflektif", "vitrin görseli"], colors: ["siyah"], visualRole: "product-showcase" },
  84: { tags: ["yan camlı", "üst camlı"], colors: ["ahşap", "siyah"] },
  85: { tags: ["yan camlı"], colors: ["ahşap"] },
  88: { tags: ["reflektif", "mimari"], colors: ["siyah", "taş"] },
  89: { tags: ["vitrin görseli", "mimari"], colors: ["siyah", "taş"], visualRole: "product-showcase" },
  102: { tags: ["yan camlı", "vitrin görseli"], colors: ["ahşap", "siyah"], visualRole: "product-showcase" },
  108: { tags: ["çift kanat"], colors: ["antrasit"] },
  110: { tags: ["yan camlı"], colors: ["beyaz", "siyah"] },
  111: { tags: ["yan camlı", "ferforje"], colors: ["ahşap", "siyah"] },
  112: { tags: ["yan camlı"], colors: ["kahverengi"] },
  115: { tags: ["yan camlı", "ferforje"], colors: ["antrasit"] },
  121: { tags: ["renkli"], colors: ["mavi"] },
  122: { tags: ["reflektif", "vitrin görseli"], colors: ["siyah", "ahşap"], visualRole: "product-showcase" },
  123: { tags: ["açık kapı", "vitrin görseli"], colors: ["ahşap", "siyah"], visualRole: "product-showcase" },
  124: { tags: ["lifestyle", "vitrin görseli"], colors: ["siyah", "ahşap"], visualRole: "showcase" },
  129: { tags: ["çift kanat", "ferforje"], colors: ["siyah"] },
  133: { tags: ["çift kanat", "yan camlı"], colors: ["ahşap", "siyah"] },
  134: { tags: ["yan camlı", "ferforje"], colors: ["antrasit"] },
  137: { tags: ["çift kanat", "yan camlı"], colors: ["beyaz", "siyah"] },
  139: { tags: ["renkli", "ferforje"], colors: ["kırmızı"] },
  142: { tags: ["projeye özel", "mimari", "vitrin görseli"], colors: ["ahşap", "siyah"], visualRole: "product-showcase" },
  145: { tags: ["teknik", "bina girişi"], colors: ["ahşap", "siyah"] },
  150: { tags: ["çift kanat", "modern"], colors: ["beyaz"] },
  151: { tags: ["yan camlı", "ferforje"], colors: ["antrasit"] },
  152: { tags: ["giriş", "teknik", "çift kanat"], colors: ["siyah", "beyaz"] },
  158: { tags: ["çift kanat", "camlı"], colors: ["siyah", "beyaz"] },
  159: { tags: ["yan camlı", "villa"], colors: ["ahşap", "siyah"], visualRole: "product-showcase" },
  161: { tags: ["pivot", "açık kapı", "showroom", "vitrin görseli"], colors: ["antrasit"], visualRole: "showcase" },
  163: { tags: ["pivot", "açık kapı", "lifestyle", "vitrin görseli"], colors: ["ahşap", "siyah"], visualRole: "showcase" },
  165: { tags: ["pivot", "açık kapı", "lifestyle", "vitrin görseli"], colors: ["ahşap"], visualRole: "showcase" },
  166: { tags: ["yan camlı", "vitrin görseli"], colors: ["ahşap", "siyah"], visualRole: "product-showcase" },
  167: { tags: ["açık kapı", "lifestyle", "vitrin görseli"], colors: ["siyah", "ahşap"], visualRole: "showcase" },
  168: { tags: ["siyah cam", "vitrin görseli"], colors: ["siyah"], visualRole: "product-showcase" },
  169: { tags: ["açık kapı", "lifestyle", "vitrin görseli"], colors: ["siyah"], visualRole: "showcase" }
};

const families: ProductFamily[] = [
  {
    prefix: "AL",
    seriesSlug: "aluminyum-sistemler",
    category: "Alüminyum Sistemler",
    subClass: "Alüminyum kasa / Alüminyum kanat / Dış iklim sistemleri",
    description:
      "Dış iklim uyumlu, sade ve modern alüminyum sistem kapı modeli.",
    specs: ["Alüminyum sistem", "Dış iklim uyumu", "Minimal giriş çizgisi"],
    materials: ["Alüminyum kasa", "Alüminyum kanat", "Metal yüzey", "Çelik gövde"],
    useCases: ["Dış iklim", "Villa", "Apartman"],
    surfaces: ["Alüminyum", "Metal", "Kompozit"],
    exportTags: ["Katalog modeli", "Alüminyum seri", "Bayi tedariki"],
    baseTags: ["tek kanat", "camsız", "minimal", "modern", "alüminyum"],
    baseColors: ["antrasit", "gri", "siyah"],
    accentColor: "#2ce3ff",
    names: ["Avero", "Velora", "Noven", "Altra", "Liven", "Meron", "Savio", "Orlen", "Vanta", "Celon"],
    images: [
      3, 8, 12, 16, 24, 28, 41, 42, 49, 54, 56, 58, 62, 69, 70, 75, 76, 77,
      82, 90, 91, 93, 100, 104, 105, 107, 109, 126, 153, 155, 156, 157
    ]
  },
  {
    prefix: "DY",
    seriesSlug: "dogal-yuzeyler",
    category: "Doğal Yüzeyler",
    subClass: "Termo Wood / Doğal taş / Ahşap ve taş dokulu yüzeyler",
    description:
      "Wood ve taş dokulu kapı yüzeyleri için doğal malzeme hissi taşıyan katalog modeli.",
    specs: ["Doğal yüzey dili", "Termo wood veya taş doku", "Çelik güvenlik yapısı"],
    materials: ["Termo wood", "Ahşap doku", "Doğal taş efekti", "Çelik gövde"],
    useCases: ["Villa", "Dış iklim", "Doğal yüzeyli giriş"],
    surfaces: ["Termo Wood", "Doğal taş", "Ahşap yüzey"],
    exportTags: ["Katalog modeli", "Doğal seri", "Proje tedariki"],
    baseTags: ["tek kanat", "modern", "villa", "doğal yüzey"],
    baseColors: ["ahşap", "taş", "antrasit"],
    accentColor: "#7cebff",
    names: ["Cedra", "Ligna", "Arlo", "Venia", "Caldo", "Rovio", "Selva", "Norra", "Lando", "Evora"],
    images: [
      6, 14, 20, 22, 27, 37, 40, 50, 57, 74, 78, 85, 92, 94, 101, 106, 125,
      131, 135, 140, 159, 162, 164
    ]
  },
  {
    prefix: "CM",
    seriesSlug: "camli-modeller",
    category: "Camlı Modeller",
    subClass: "Karma cam / Temperli cam / Ferforje / Yan camlı",
    description:
      "Cam detaylı dış kapı çözümleri için yan cam, üst cam ve ferforje seçenekli model.",
    specs: ["Camlı giriş kompozisyonu", "Temperli cam detayı", "Villa tipi görünüm"],
    materials: ["Temperli cam", "Ferforje detay", "Metal/ahşap yüzey", "Çelik gövde"],
    useCases: ["Dış iklim", "Villa", "Camlı giriş"],
    surfaces: ["Karma cam", "Temperli cam", "Ferforje", "Yan cam"],
    exportTags: ["Katalog modeli", "Camlı seri", "Proje tedariki"],
    baseTags: ["camlı", "villa", "modern", "dış iklim"],
    baseColors: ["antrasit", "siyah", "ahşap"],
    accentColor: "#57e2ff",
    names: ["Clara", "Lumio", "Glora", "Avena", "Mirra", "Solia", "Elvia", "Noris", "Alira", "Vionna"],
    images: [
      1, 2, 13, 15, 17, 26, 29, 31, 32, 33, 35, 38, 45, 46, 47, 48, 51, 61,
      63, 64, 79, 84, 86, 99, 110, 111, 112, 115, 116, 127, 129, 130, 133,
      134, 137, 143, 144, 150, 151, 158
    ]
  },
  {
    prefix: "MK",
    seriesSlug: "metal-kompozit",
    category: "Metal & Kompozit",
    subClass: "Kompozit / Komple sac metal / Özel metal yüzey",
    description:
      "Dayanıklı metal ve kompozit modeller için koyu yüzeyli, teknik ve geometrik kapı modeli.",
    specs: ["Metal/kompozit yüzey", "Teknik panel karakteri", "Dayanıklı dış kapı yapısı"],
    materials: ["Metal yüzey", "Kompozit panel", "Laminoks detay", "Çelik gövde"],
    useCases: ["Dış iklim", "Proje", "Modern giriş"],
    surfaces: ["Metal", "Kompozit", "Özel metal", "Reflektif yüzey"],
    exportTags: ["Katalog modeli", "Kompozit seri", "Dayanıklı yüzey"],
    baseTags: ["tek kanat", "modern", "metal", "kompozit"],
    baseColors: ["siyah", "antrasit", "gri"],
    accentColor: "#36deff",
    names: ["Krono", "Nexa", "Modra", "Helio", "Brion", "Solix", "Travo", "Monza", "Avex", "Rado"],
    images: [7, 9, 25, 36, 59, 60, 88, 98, 119, 120, 132, 147, 148, 149]
  },
  {
    prefix: "PL",
    seriesSlug: "pvc-laminoks",
    category: "PVC & Laminoks",
    subClass: "Exclusive / Lüks PVC / Elit Laminoks / Rustik Laminoks",
    description:
      "Exclusive kaplama seçenekleri, klasik panel ve rustik laminoks yüzeyleri için katalog modeli.",
    specs: ["PVC veya laminoks yüzey", "Klasik/rustik panel dili", "Renkli panel seçeneği"],
    materials: ["PVC yüzey", "Laminoks", "Lake panel", "Çelik gövde"],
    useCases: ["Konut", "Bina girişi", "Klasik giriş"],
    surfaces: ["PVC", "Laminoks", "Klasik panel", "Rustik laminoks"],
    exportTags: ["Katalog modeli", "Exclusive kaplama", "Bayi tedariki"],
    baseTags: ["tek kanat", "klasik", "panel", "laminoks"],
    baseColors: ["beyaz", "gri", "ahşap"],
    accentColor: "#30d5f4",
    names: ["Noira", "Grisio", "Antra", "Silvio", "Trenza", "Lamora", "Invero", "Noxia", "Argen", "Voltra"],
    images: [
      4, 5, 10, 11, 18, 19, 21, 23, 30, 34, 39, 43, 44, 52, 53, 67, 68, 71,
      72, 73, 80, 83, 87, 96, 97, 103, 108, 113, 114, 117, 118, 121, 128,
      136, 138, 139, 141, 154
    ]
  },
  {
    prefix: "MO",
    seriesSlug: "mimari-ozel",
    category: "Mimari Özel",
    subClass: "Projeye özel / Pivot / Showroom / Vitrin görseli",
    description:
      "Projeye özel ve pivot çözümler için mimari atmosfer taşıyan vitrin modeli.",
    specs: ["Mimari giriş etkisi", "Projeye özel kurgu", "Pivot veya vitrin kullanımı"],
    materials: ["Mimari yüzey", "Pivot sistem", "Cam/metal detay", "Çelik gövde"],
    useCases: ["Projeye özel", "Showroom", "Mimari vitrin"],
    surfaces: ["Mimari özel", "Pivot", "Lifestyle", "Showroom"],
    exportTags: ["Vitrin görseli", "Mimari seri", "Proje sunumu"],
    baseTags: ["mimari", "vitrin görseli", "showroom", "projeye özel"],
    baseColors: ["siyah", "antrasit", "ahşap"],
    accentColor: "#57e2ff",
    names: ["Aureo", "Velaro", "Mareno", "Soreva", "Arlento", "Loreno", "Vareno", "Elvian"],
    images: [81, 89, 102, 122, 123, 124, 142, 161, 163, 165, 166, 167, 168, 169]
  },
  {
    prefix: "GT",
    seriesSlug: "giris-teknik",
    category: "Giriş & Teknik",
    subClass: "Teknik çözümler / Villa ve bina girişi / Acil çıkış / Şaft kapakları",
    description:
      "Giriş, acil çıkış ve şaft sistemleri için sade ve teknik karakterli kapı modeli.",
    specs: ["Teknik giriş profili", "Sade kullanım dili", "Proje odaklı çelik yapı"],
    materials: ["Teknik panel", "Çelik gövde", "Dayanıklı donanım"],
    useCases: ["Bina girişi", "Teknik hacim", "Acil çıkış"],
    surfaces: ["Giriş", "Teknik", "Şaft", "Servis"],
    exportTags: ["Teknik çözüm", "Proje tedariki", "Bina girişi"],
    baseTags: ["tek kanat", "teknik", "giriş", "bina"],
    baseColors: ["beyaz", "gri", "antrasit"],
    accentColor: "#2ce3ff",
    names: ["Sentra", "Guardio", "Dravo", "Korven", "Vardon", "Ralix", "Kavon", "Maxen"],
    images: [55, 65, 66, 95, 145, 146, 152, 160]
  }
];

const slugifyProductPart = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const imagePath = (imageNumber: number) =>
  `/images/katalogwebp/Image${String(imageNumber).padStart(2, "0")}.webp`;

const uniqueValues = (values: string[]) => [...new Set(values)];

export const products: DoorProduct[] = families.flatMap((family) =>
  family.images.map((imageNumber, index) => {
    const detail = imageDetails[imageNumber] ?? {};
    const code = `${family.prefix}-${String(index + 1).padStart(3, "0")}`;
    const name = family.names[index % family.names.length];
    const colors = uniqueValues(detail.colors ?? family.baseColors);
    const tags = uniqueValues([...family.baseTags, ...(detail.tags ?? []), ...colors]);
    const visualRole = detail.visualRole ?? "product";

    return {
      slug: `${family.seriesSlug}-${slugifyProductPart(code)}-${slugifyProductPart(name)}`,
      code,
      name,
      category: family.category,
      subClass: family.subClass,
      image: imagePath(imageNumber),
      tags,
      colors,
      visualRole,
      seriesSlug: family.seriesSlug,
      seriesTitle: family.category,
      description: family.description,
      specs: [...family.specs],
      materials: [...family.materials],
      useCases: [...family.useCases],
      surfaces: [...family.surfaces],
      exportTags: [...family.exportTags],
      accentColor: family.accentColor
    };
  })
);
