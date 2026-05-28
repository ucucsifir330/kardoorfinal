import { computed, ref } from "vue";
import { products as doorProducts } from "~/data/products";

export interface ProductVariant {
  id: string;
  finish: string;
  code: string;
  seriesTitle: string;
  image: string;
  liked: boolean;
}

export interface CatalogBlock {
  index: number;
  productPrefix: string;
  number: string;
  seriesLabel: string;
  shortName: string;
  category: {
    short: string;
    full: string;
  };
  parts: {
    id: string;
    short: string;
    full: string;
  }[];
  cardTitle: string;
  description: string;
}

const catalogPreviewLimit = 10;

const catalogBlocks: CatalogBlock[] = [
  {
    index: 1,
    productPrefix: "AL",
    number: "01",
    seriesLabel: "Seri 01",
    shortName: "Alüminyum",
    category: {
      short: "Dış İklim",
      full: "Dış İklim Modelleri"
    },
    parts: [
      { id: "aluminium-frame", short: "Kasa", full: "Alüminyum Kasa Seri" },
      { id: "aluminium-frame-wing", short: "Kanat", full: "Alüminyum Kasa ve Kanat Seri" }
    ],
    cardTitle: "Alüminyum Sistemler",
    description: "dış iklim uyumlu kapı sistemleri"
  },
  {
    index: 2,
    productPrefix: "DY",
    number: "02",
    seriesLabel: "Seri 02",
    shortName: "Doğal",
    category: {
      short: "Dış İklim",
      full: "Dış İklim Modelleri"
    },
    parts: [
      { id: "termo-wood", short: "Wood", full: "Termo Wood Seri" },
      { id: "natural-stone", short: "Taş", full: "Doğal Taş Seri" }
    ],
    cardTitle: "Doğal Yüzeyler",
    description: "wood ve taş dokulu kapı yüzeyleri"
  },
  {
    index: 3,
    productPrefix: "CM",
    number: "03",
    seriesLabel: "Seri 03",
    shortName: "Cam",
    category: {
      short: "Dış İklim",
      full: "Dış İklim Modelleri"
    },
    parts: [
      { id: "mixed-glass", short: "Karma", full: "Karma Cam Seri" },
      { id: "tempered-glass", short: "Temperli", full: "Temperli Cam Seri" }
    ],
    cardTitle: "Camlı Modeller",
    description: "cam detaylı dış kapı çözümleri"
  },
  {
    index: 4,
    productPrefix: "MK",
    number: "04",
    seriesLabel: "Seri 04",
    shortName: "Metal",
    category: {
      short: "Dış İklim",
      full: "Dış İklim Modelleri"
    },
    parts: [
      { id: "composite", short: "Kompozit", full: "Kompozit Seri" },
      { id: "sheet-metal", short: "Sac", full: "Komple Sac Metal Seri" }
    ],
    cardTitle: "Metal & Kompozit",
    description: "dayanıklı metal ve kompozit modeller"
  },
  {
    index: 5,
    productPrefix: "PL",
    number: "05",
    seriesLabel: "Seri 05",
    shortName: "Laminoks",
    category: {
      short: "Exclusive",
      full: "Exclusive Modeller"
    },
    parts: [
      { id: "lux-pvc", short: "PVC", full: "Lüks PVC Seri" },
      { id: "elit-laminox", short: "Elit", full: "Elit Laminoks Seri" },
      { id: "rustic-laminox", short: "Rustik", full: "Rustik Laminoks Seri" }
    ],
    cardTitle: "PVC & Laminoks",
    description: "exclusive kaplama seçenekleri"
  },
  {
    index: 6,
    productPrefix: "MO",
    number: "06",
    seriesLabel: "Seri 06",
    shortName: "Mimari",
    category: {
      short: "Exclusive",
      full: "Exclusive Modeller"
    },
    parts: [
      { id: "project-custom", short: "Özel", full: "Projeye Özel Seri" },
      { id: "pivot", short: "Pivot", full: "Pivot Seri" }
    ],
    cardTitle: "Mimari Özel",
    description: "projeye özel ve pivot çözümler"
  },
  {
    index: 7,
    productPrefix: "GT",
    number: "07",
    seriesLabel: "Seri 07",
    shortName: "Teknik",
    category: {
      short: "Çözümler",
      full: "Teknik Çözümler"
    },
    parts: [
      { id: "villa-building-entry", short: "Giriş", full: "Villa ve Bina Giriş Seri" },
      { id: "emergency-exit", short: "Acil", full: "Acil Çıkış Seri" },
      { id: "shaft-cover", short: "Şaft", full: "Bina Şaft Kapakları Seri" }
    ],
    cardTitle: "Giriş & Teknik",
    description: "giriş, acil çıkış ve şaft sistemleri"
  }
];

const catalogProducts: ProductVariant[] = doorProducts.map((product) => ({
  ...product,
  id: product.slug,
  finish: product.name,
  code: product.code,
  seriesTitle: product.seriesTitle,
  image: product.image,
  liked: false
}));

const isMobileCatalogViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;

export const useHomeCatalog = () => {
  const products = ref<ProductVariant[]>(catalogProducts.map((product) => ({ ...product })));
  const visibleRows = ref<number[]>([1]);
  const activeWishlistKey = ref<string | null>(null);
  const activeProductIndex = ref<number | null>(null);

  const getCatalogPreviewProducts = (block: CatalogBlock) =>
    products.value
      .map((product, productIndex) => ({ ...product, productIndex }))
      .filter((product) => product.code.startsWith(`${block.productPrefix}-`))
      .slice(0, catalogPreviewLimit);

  const toggleLike = (index: number | null) => {
    if (index === null || !products.value[index]) return;
    products.value[index].liked = !products.value[index].liked;
  };

  const handleWishlistClick = (index: number, key: string) => {
    if (isMobileCatalogViewport()) {
      toggleLike(index);
      activeWishlistKey.value = null;
      return;
    }

    const willOpen = activeWishlistKey.value !== key;
    toggleLike(index);
    activeWishlistKey.value = willOpen ? key : null;
  };

  const activeProduct = computed(() => {
    if (activeProductIndex.value === null) return null;
    return products.value[activeProductIndex.value] || null;
  });

  const openProductModal = (index: number) => {
    activeProductIndex.value = index;
    activeWishlistKey.value = null;

    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const closeProductModal = () => {
    activeProductIndex.value = null;

    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  const showPreviousProduct = () => {
    if (!products.value.length || activeProductIndex.value === null) return;
    activeProductIndex.value = (activeProductIndex.value - 1 + products.value.length) % products.value.length;
  };

  const showNextProduct = () => {
    if (!products.value.length || activeProductIndex.value === null) return;
    activeProductIndex.value = (activeProductIndex.value + 1) % products.value.length;
  };

  const handleProductModalKeydown = (event: KeyboardEvent) => {
    if (activeProductIndex.value === null) return;

    if (event.key === "Escape") {
      closeProductModal();
    } else if (event.key === "ArrowLeft") {
      showPreviousProduct();
    } else if (event.key === "ArrowRight") {
      showNextProduct();
    }
  };

  const resetCatalogModalState = () => {
    closeProductModal();
    activeWishlistKey.value = null;
  };

  return {
    products,
    catalogBlocks,
    visibleRows,
    activeProduct,
    activeProductIndex,
    activeWishlistKey,
    getCatalogPreviewProducts,
    toggleLike,
    handleWishlistClick,
    openProductModal,
    closeProductModal,
    showPreviousProduct,
    showNextProduct,
    handleProductModalKeydown,
    resetCatalogModalState
  };
};
