import type { LocationQuery } from "vue-router";
import type { DoorProduct } from "~/data/products";
import { products, slugifyProductPart } from "~/data/products";
import { getProductTaxonomy } from "~/data/catalog-taxonomy";

// Katalog filtreleri URL query'sinden okunur (paylaşılabilir/deep-link).
// Facet değerleri ürün verisinden türetilir — elle liste tutulmaz.

export const CATALOG_FACET_KEYS = ["anaKategori", "kasaTipi", "yuzey", "renk", "kullanimAlani"] as const;
export type CatalogFacetKey = (typeof CATALOG_FACET_KEYS)[number];

export type CatalogFilterState = Record<CatalogFacetKey, string[]>;

export interface CatalogFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface CatalogFacetGroup {
  key: CatalogFacetKey;
  title: { tr: string; en: string };
  options: CatalogFacetOption[];
}

// Ürün başına facet değerleri: [urlSlug, görünen etiket] çiftleri.
const facetValues: Record<CatalogFacetKey, (product: DoorProduct) => Array<[string, string]>> = {
  anaKategori: (product) => {
    const { anaKategori } = getProductTaxonomy(product);
    return [[slugifyProductPart(anaKategori), anaKategori]];
  },
  kasaTipi: (product) => {
    const { kasaTipi } = getProductTaxonomy(product);
    return [[slugifyProductPart(kasaTipi), kasaTipi]];
  },
  yuzey: (product) => {
    const { yuzey } = getProductTaxonomy(product);
    return [[slugifyProductPart(yuzey), yuzey]];
  },
  renk: (product) => getProductTaxonomy(product).renk.map((value) => [slugifyProductPart(value), value]),
  kullanimAlani: (product) =>
    getProductTaxonomy(product).kullanimAlani.map((value) => [slugifyProductPart(value), value])
};

const facetTitles: Record<CatalogFacetKey, { tr: string; en: string }> = {
  anaKategori: { tr: "Ana Kategori", en: "Main Category" },
  kasaTipi: { tr: "Kasa Tipi", en: "Frame Type" },
  yuzey: { tr: "Yüzey", en: "Surface" },
  renk: { tr: "Renk", en: "Color" },
  kullanimAlani: { tr: "Kullanım Alanı", en: "Use Case" }
};

const buildFacetGroups = (): CatalogFacetGroup[] =>
  CATALOG_FACET_KEYS.map((key) => {
    const counts = new Map<string, { label: string; count: number }>();

    for (const product of products) {
      for (const [value, label] of facetValues[key](product)) {
        const entry = counts.get(value);
        if (entry) {
          entry.count += 1;
        } else {
          counts.set(value, { label, count: 1 });
        }
      }
    }

    return {
      key,
      title: facetTitles[key],
      options: [...counts.entries()]
        .map(([value, { label, count }]) => ({ value, label, count }))
        .sort((a, b) => a.label.localeCompare(b.label, "tr"))
    };
  });

// Ürün verisi statik olduğundan gruplar modül yüklenirken bir kez hesaplanır.
export const catalogFacetGroups = buildFacetGroups();

// Bağımlı facet sayaçları (ICG tarzı): bir grubun sayıları, DİĞER gruplardaki
// aktif seçimlerle daraltılmış ürün kümesinden hesaplanır — üstte seçilen
// kategori alttaki grupların sayılarına yansır. Grup kendi seçimini daraltmaz
// (yoksa aynı gruptaki diğer VEYA seçenekleri işaretlenemez hale gelir).
// Seçenek listesi sabit kalır; kümede kalmayanlar 0 sayacıyla döner.
export const getCatalogFacetGroups = (state: CatalogFilterState): CatalogFacetGroup[] =>
  catalogFacetGroups.map((group) => {
    const subset = filterCatalogProducts(products, { ...state, [group.key]: [] });
    const counts = new Map<string, number>();

    for (const product of subset) {
      for (const [value] of facetValues[group.key](product)) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    return {
      ...group,
      options: group.options.map((option) => ({
        ...option,
        count: counts.get(option.value) ?? 0
      }))
    };
  });

const knownValues = new Map<CatalogFacetKey, Set<string>>(
  catalogFacetGroups.map((group) => [group.key, new Set(group.options.map((o) => o.value))])
);

export const parseCatalogFilterQuery = (query: LocationQuery): CatalogFilterState => {
  const state = {} as CatalogFilterState;

  for (const key of CATALOG_FACET_KEYS) {
    const raw = query[key];
    const joined = Array.isArray(raw) ? raw.join(",") : raw ?? "";
    state[key] = joined
      .split(",")
      .map((value) => value.trim())
      .filter((value) => knownValues.get(key)!.has(value));
  }

  return state;
};

export const serializeCatalogFilterState = (state: CatalogFilterState) => {
  const query: Record<string, string | undefined> = {};
  for (const key of CATALOG_FACET_KEYS) {
    query[key] = state[key].length ? [...state[key]].sort().join(",") : undefined;
  }
  return query;
};

export const countActiveCatalogFilters = (state: CatalogFilterState) =>
  CATALOG_FACET_KEYS.reduce((total, key) => total + state[key].length, 0);

// Gruplar arası VE, grup içi VEYA.
export const filterCatalogProducts = (items: DoorProduct[], state: CatalogFilterState) =>
  items.filter((product) =>
    CATALOG_FACET_KEYS.every((key) => {
      if (!state[key].length) return true;
      const values = facetValues[key](product).map(([value]) => value);
      return state[key].some((selected) => values.includes(selected));
    })
  );
