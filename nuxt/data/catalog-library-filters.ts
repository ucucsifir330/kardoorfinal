import type { LocationQuery } from "vue-router";
import type { DoorProduct } from "~/data/products";
import { products, slugifyProductPart } from "~/data/products";

// Katalog filtreleri URL query'sinden okunur (paylaşılabilir/deep-link).
// Facet değerleri ürün verisinden türetilir — elle liste tutulmaz.

export const CATALOG_FACET_KEYS = ["seri", "renk", "kullanim"] as const;
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

const capitalizeTr = (value: string) =>
  value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1);

// Ürün başına facet değerleri: [urlSlug, görünen etiket] çiftleri.
const facetValues: Record<CatalogFacetKey, (product: DoorProduct) => Array<[string, string]>> = {
  seri: (product) => [[product.seriesSlug, product.seriesTitle]],
  renk: (product) => product.colors.map((color) => [slugifyProductPart(color), capitalizeTr(color)]),
  kullanim: (product) => product.useCases.map((useCase) => [slugifyProductPart(useCase), useCase])
};

const facetTitles: Record<CatalogFacetKey, { tr: string; en: string }> = {
  seri: { tr: "Seri", en: "Series" },
  renk: { tr: "Renk", en: "Color" },
  kullanim: { tr: "Kullanım Alanı", en: "Use Case" }
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
