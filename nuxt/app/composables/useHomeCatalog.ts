import { computed, ref } from "vue";
import { products as doorProducts } from "~/data/products";

export interface ProductVariant {
  id: string;
  finish: string;
  code: string;
  seriesTitle: string;
  series?: string;
  collection?: string;
  category?: string;
  system?: string;
  seriesSlug: string;
  image: string;
  localImage: string;
  liked: boolean;
}

export interface CatalogSourceSeries {
  seriesSlug: string;
  productPrefix: string;
  emphasizedFacetIds?: string[];
  short?: string;
  full?: string;
  parts?: Array<{
    id: string;
    short: string;
    full: string;
  }>;
}

export interface CatalogBlock {
  index: number;
  heroGroup: string;
  number: string;
  sources: CatalogSourceSeries[];
}

export interface CatalogPreviewGroup {
  source: CatalogSourceSeries;
  totalCount: number;
  products: Array<ProductVariant & { productIndex: number }>;
}

const catalogPreviewLimit = 10;

const catalogBlocks: CatalogBlock[] = [
  {
    index: 1,
    heroGroup: "steel-door-systems",
    number: "01",
    sources: [
      { seriesSlug: "camli-modeller", productPrefix: "CM" },
      { seriesSlug: "pvc-laminoks", productPrefix: "PL" }
    ]
  },
  {
    index: 2,
    heroGroup: "exterior-climate-door-systems",
    number: "02",
    sources: [
      { seriesSlug: "aluminyum-sistemler", productPrefix: "AL" },
      { seriesSlug: "dogal-yuzeyler", productPrefix: "DY" }
    ]
  },
  {
    index: 3,
    heroGroup: "economical-door-systems",
    number: "03",
    sources: [{ seriesSlug: "metal-kompozit", productPrefix: "MK" }]
  },
  {
    index: 4,
    heroGroup: "building-entrance-systems",
    number: "04",
    sources: [
      {
        seriesSlug: "giris-teknik",
        productPrefix: "GT",
        emphasizedFacetIds: ["shaft-cover"]
      }
    ]
  },
  {
    index: 5,
    heroGroup: "special-project-systems",
    number: "05",
    sources: [{ seriesSlug: "mimari-ozel", productPrefix: "MO" }]
  }
];

const catalogProducts: ProductVariant[] = doorProducts.map((product) => ({
  ...product,
  id: product.slug,
  finish: product.name,
  code: product.code,
  seriesTitle: product.seriesTitle,
  series: product.seriesTitle,
  collection: product.category,
  category: product.subClass,
  system: product.materials.join(" / "),
  seriesSlug: product.seriesSlug,
  image: product.image,
  liked: false
}));

export const useHomeCatalog = () => {
  const products = ref<ProductVariant[]>(catalogProducts.map((product) => ({ ...product })));
  const visibleRows = ref<number[]>([1]);
  const activeProductIndex = ref<number | null>(null);

  const sourceProducts = (source: CatalogSourceSeries) =>
    products.value
      .map((product, productIndex) => ({ ...product, productIndex }))
      .filter((product) => product.seriesSlug === source.seriesSlug);

  const getCatalogProductCount = (block: CatalogBlock) =>
    block.sources.reduce((count, source) => count + sourceProducts(source).length, 0);

  const getCatalogPreviewGroups = (
    block: CatalogBlock,
    selectedSourceSlug = "all"
  ): CatalogPreviewGroup[] => {
    const visibleSources = selectedSourceSlug === "all"
      ? block.sources
      : block.sources.filter((source) => source.seriesSlug === selectedSourceSlug);
    const combinedPreviewLimit = visibleSources.length > 1 ? 8 : catalogPreviewLimit;
    const previewLimit = Math.max(1, Math.floor(combinedPreviewLimit / visibleSources.length));

    return visibleSources.map((source) => {
      const matchingProducts = sourceProducts(source);
      return {
        source,
        totalCount: matchingProducts.length,
        products: matchingProducts.slice(0, previewLimit)
      };
    });
  };

  const toggleLike = (index: number | null) => {
    if (index === null || !products.value[index]) return;
    products.value[index].liked = !products.value[index].liked;
  };

  const activeProduct = computed(() => {
    if (activeProductIndex.value === null) return null;
    return products.value[activeProductIndex.value] || null;
  });

  const openProductModal = (index: number) => {
    activeProductIndex.value = index;

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
  };

  return {
    products,
    catalogBlocks,
    visibleRows,
    activeProduct,
    activeProductIndex,
    getCatalogProductCount,
    getCatalogPreviewGroups,
    toggleLike,
    openProductModal,
    closeProductModal,
    showPreviousProduct,
    showNextProduct,
    handleProductModalKeydown,
    resetCatalogModalState
  };
};
