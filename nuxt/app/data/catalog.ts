import { collections } from "./collections";
import { products } from "./products";

export function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

export function getProductsByCollectionSlug(seriesSlug: string) {
  return products.filter((product) => product.seriesSlug === seriesSlug);
}

export function getProductByCode(code: string) {
  const normalized = code.toLocaleUpperCase("tr-TR");
  return products.find((product) => product.code.toLocaleUpperCase("tr-TR") === normalized);
}
