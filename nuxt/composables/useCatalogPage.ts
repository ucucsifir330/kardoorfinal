import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import { products, type DoorProduct } from "~/data/products";

export type CatalogRow = {
  id: number;
  route: string;
  collection: string;
  title: string;
  series: string;
  description: string;
  tags: readonly string[];
  variants: DoorProduct[];
};

export const catalogFilters = ["Ürün kategorisi", "Ürünler", "Koleksiyon", "Tasarımcı", "Yüzey"];

export const catalogSeries = [
  {
    id: 1,
    route: "/catalog/aluminium",
    slug: "aluminyum-sistemler",
    collection: "01",
    title: "Alüminyum Sistemler",
    series: "Seri 01",
    description: "dış iklim uyumlu kapı sistemleri",
    tags: ["Dış İklim", "Kasa / Kanat", "Tümü"]
  },
  {
    id: 2,
    route: "/catalog/wood",
    slug: "dogal-yuzeyler",
    collection: "02",
    title: "Doğal Yüzeyler",
    series: "Seri 02",
    description: "wood ve taş dokulu kapı yüzeyleri",
    tags: ["Dış İklim", "Wood / Taş", "Tümü"]
  },
  {
    id: 3,
    route: "/catalog/glass",
    slug: "camli-modeller",
    collection: "03",
    title: "Camlı Modeller",
    series: "Seri 03",
    description: "cam detaylı dış kapı çözümleri",
    tags: ["Dış İklim", "Karma / Temperli", "Tümü"]
  },
  {
    id: 4,
    route: "/catalog/steel",
    slug: "metal-kompozit",
    collection: "04",
    title: "Metal & Kompozit",
    series: "Seri 04",
    description: "dayanıklı metal ve kompozit modeller",
    tags: ["Dış İklim", "Kompozit / Sac", "Tümü"]
  },
  {
    id: 5,
    route: "/catalog/pvc",
    slug: "pvc-laminoks",
    collection: "05",
    title: "PVC & Laminoks",
    series: "Seri 05",
    description: "exclusive kaplama seçenekleri",
    tags: ["Exclusive", "PVC / Elit / Rustik", "Tümü"]
  },
  {
    id: 6,
    route: "/catalog/architectural",
    slug: "mimari-ozel",
    collection: "06",
    title: "Mimari Özel",
    series: "Seri 06",
    description: "projeye özel ve pivot çözümler",
    tags: ["Exclusive", "Özel / Pivot", "Tümü"]
  },
  {
    id: 7,
    route: "/catalog/technical",
    slug: "giris-teknik",
    collection: "07",
    title: "Giriş & Teknik",
    series: "Seri 07",
    description: "giriş, acil çıkış ve şaft sistemleri",
    tags: ["Çözümler", "Giriş / Acil / Şaft", "Tümü"]
  }
] as const;

export const useCatalogPage = () => {
  const searchQuery = ref("");
  const isScrolled = ref(false);
  const visibleRows = ref<number[]>([]);

  let observer: IntersectionObserver | null = null;
  let rowRefs: HTMLElement[] = [];

  const catalogRows = computed<CatalogRow[]>(() =>
    catalogSeries.map((series) => ({
      ...series,
      variants: products.filter((product) => product.seriesSlug === series.slug)
    }))
  );

  const normalizedSearch = computed(() => searchQuery.value.trim().toLocaleLowerCase("tr-TR"));

  const filteredRows = computed(() => {
    const query = normalizedSearch.value;

    if (!query) return catalogRows.value;

    return catalogRows.value
      .map((row) => {
        const rowMatches =
          row.title.toLocaleLowerCase("tr-TR").includes(query) ||
          row.series.toLocaleLowerCase("tr-TR").includes(query) ||
          row.description.toLocaleLowerCase("tr-TR").includes(query);

        const variants = rowMatches
          ? row.variants
          : row.variants.filter((variant) =>
              [variant.name, variant.code, variant.category, variant.subClass, ...variant.tags]
                .join(" ")
                .toLocaleLowerCase("tr-TR")
                .includes(query)
            );

        return { ...row, variants };
      })
      .filter((row) => row.variants.length > 0);
  });

  const setRowRef = (el: Element | ComponentPublicInstance | null) => {
    let rowEl: unknown = el;

    if (el && !(el instanceof Element)) {
      rowEl = el.$el;
    }

    if (rowEl instanceof HTMLElement && !rowRefs.includes(rowEl)) rowRefs.push(rowEl);
  };

  const observeRows = async () => {
    await nextTick();
    observer?.disconnect();

    const rowIds = filteredRows.value.map((row) => row.id);
    const firstRowId = rowIds[0];

    if (!visibleRows.value.length && firstRowId !== undefined) visibleRows.value = [firstRowId];

    if (!("IntersectionObserver" in window)) {
      visibleRows.value = rowIds;
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const rowId = Number(entry.target.getAttribute("data-row-id"));
          if (!visibleRows.value.includes(rowId)) visibleRows.value.push(rowId);
          observer?.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    rowRefs
      .filter((row) => !visibleRows.value.includes(Number(row.dataset.rowId)))
      .forEach((row) => observer?.observe(row));
  };

  const handleScroll = () => {
    isScrolled.value = window.scrollY > 5;
  };

  onBeforeUpdate(() => {
    rowRefs = [];
  });

  onMounted(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    observeRows();
  });

  watch(
    filteredRows,
    () => {
      visibleRows.value = [];
      observeRows();
    },
    { flush: "post" }
  );

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
    observer?.disconnect();
  });

  return {
    filters: catalogFilters,
    searchQuery,
    isScrolled,
    visibleRows,
    filteredRows,
    setRowRef
  };
};
