import { computed, ref } from "vue";
import { collections } from "~/data/collections";
import type { DoorProduct } from "~/data/products";
import { products } from "~/data/products";

type DoorProductAsset = DoorProduct & {
  fallbackImage: string;
};

export function useDoorSelector() {
  const { assetUrl } = useKardoorAsset();
  const activeIndex = ref(0);
  const selectedSeries = ref<string[]>([]);
  const selectedUseCases = ref<string[]>([]);
  const selectedSurfaces = ref<string[]>([]);
  const selectedExportTags = ref<string[]>([]);
  const cdnProducts = computed<DoorProductAsset[]>(() =>
    products.map((product) => ({
      ...product,
      image: assetUrl(product.image),
      fallbackImage: product.image
    }))
  );
  const cdnCollections = computed(() =>
    collections.map((collection) => ({
      ...collection,
      image: assetUrl(collection.image)
    }))
  );
  const fallbackProduct = computed(() => cdnProducts.value[0] as DoorProductAsset);

  const filterOptions = computed(() => ({
    series: cdnCollections.value,
    useCases: [...new Set(cdnProducts.value.flatMap((product) => product.useCases))],
    surfaces: [...new Set(cdnProducts.value.flatMap((product) => product.surfaces))],
    exportTags: [...new Set(cdnProducts.value.flatMap((product) => product.exportTags))]
  }));

  const filteredProducts = computed(() =>
    cdnProducts.value.filter((product) => {
      const matchesSeries =
        selectedSeries.value.length === 0 || selectedSeries.value.includes(product.seriesSlug);
      const matchesUseCase =
        selectedUseCases.value.length === 0 ||
        product.useCases.some((useCase) => selectedUseCases.value.includes(useCase));
      const matchesSurface =
        selectedSurfaces.value.length === 0 ||
        product.surfaces.some((surface) => selectedSurfaces.value.includes(surface));
      const matchesExport =
        selectedExportTags.value.length === 0 ||
        product.exportTags.some((tag) => selectedExportTags.value.includes(tag));

      return matchesSeries && matchesUseCase && matchesSurface && matchesExport;
    })
  );

  const activeProduct = computed(() => filteredProducts.value[activeIndex.value] ?? fallbackProduct.value);
  const previousProduct = computed(() => {
    const list = filteredProducts.value.length ? filteredProducts.value : cdnProducts.value;
    return list[(activeIndex.value - 1 + list.length) % list.length] ?? fallbackProduct.value;
  });
  const nextProduct = computed(() => {
    const list = filteredProducts.value.length ? filteredProducts.value : cdnProducts.value;
    return list[(activeIndex.value + 1) % list.length] ?? fallbackProduct.value;
  });

  function clampActiveIndex() {
    if (activeIndex.value > filteredProducts.value.length - 1) activeIndex.value = 0;
  }

  function toggle(list: string[], value: string) {
    const index = list.indexOf(value);
    if (index >= 0) list.splice(index, 1);
    else list.push(value);
    clampActiveIndex();
  }

  function selectIndex(index: number) {
    const total = filteredProducts.value.length || cdnProducts.value.length;
    activeIndex.value = (index + total) % total;
  }

  function next() {
    selectIndex(activeIndex.value + 1);
  }

  function previous() {
    selectIndex(activeIndex.value - 1);
  }

  function clearFilters() {
    selectedSeries.value = [];
    selectedUseCases.value = [];
    selectedSurfaces.value = [];
    selectedExportTags.value = [];
    activeIndex.value = 0;
  }

  return {
    activeIndex,
    activeProduct,
    previousProduct,
    nextProduct,
    filteredProducts,
    filterOptions,
    selectedSeries,
    selectedUseCases,
    selectedSurfaces,
    selectedExportTags,
    toggle,
    next,
    previous,
    selectIndex,
    clearFilters
  };
}
