import { collections } from "./collections";
import { products } from "./products";

export const technicalCalloutLabels = ["Frame", "Leaf", "Surface", "Handle", "Lock", "Glass"];

export function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

export function getProductsByCollectionSlug(seriesSlug: string) {
  return products.filter((product) => product.seriesSlug === seriesSlug);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getFeaturedProducts() {
  const featuredCodes = ["K1001", "K1051", "K1101"];
  return featuredCodes
    .map((code) => products.find((product) => product.code === code))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
}

export function getCatalogFilters() {
  return {
    series: collections.map((collection) => collection.title),
    useCases: [...new Set(products.flatMap((product) => product.useCases))],
    surfaces: [...new Set(products.flatMap((product) => product.surfaces))],
    exportTags: [...new Set(products.flatMap((product) => product.exportTags))]
  };
}
