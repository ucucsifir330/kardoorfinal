import { computed } from "vue";
import { products, type DoorProduct } from "~/data/products";

/**
 * useShowroomDoors — turntable'ın gösterdiği kapı listesini GERÇEK katalog
 * verisinden (nuxt/data/products.ts) türetir. Eski ShowroomTurntable'daki
 * elle gömülü LOREM + kopyala-yapıştır ImageKit URL'leri yerine, her katalog
 * ailesinden bir temsilci kapı seçilir; isim/seri/spec/materyal/görsel/accent
 * hepsi koddan bağlıdır.
 *
 * Kapı SAYISI bu listeden gelir — turntable motoru (useTurntable) sayıdan
 * bağımsızdır, yani burada SHOWROOM_SERIES'i uzatıp kısaltmak yeterli.
 */

export type ShowroomDoor = {
  id: string; // ürün slug'ı (stabil key)
  code: string;
  /** Başlık iki parçaya bölünür: ilk kelime "lead", kalanı "tail". */
  nameDisplay: { lead: string; tail: string };
  series: string; // kategori / seri adı (ör. "Alüminyum Sistemler")
  image: string;
  /** Kısa teknik satır — specs'ten birleştirilir. */
  spec: string;
  /** Alt meta — materyaller. */
  meta: string;
  accentColor: string;
};

// Turntable'da dönecek aileler (seriesSlug) — vitrine en uygun, en görsel 5'li.
// Sıra = turntable sırası. Motor sayıdan bağımsız; eklemek/çıkarmak serbest.
const SHOWROOM_SERIES = [
  "aluminyum-sistemler",
  "dogal-yuzeyler",
  "camli-modeller",
  "pvc-laminoks",
  "mimari-ozel"
] as const;

// Bir family içinde temsilci kapı seçimi: vitrin/showcase rolü olan görseller
// turntable'da daha iyi durur (açık kapı, lifestyle, reflektif). Yoksa ilk ürün.
const SHOWCASE_ROLES = new Set(["showcase", "product-showcase"]);

const pickRepresentative = (seriesSlug: string): DoorProduct | undefined => {
  const inSeries = products.filter((p) => p.seriesSlug === seriesSlug);
  if (!inSeries.length) return undefined;
  return inSeries.find((p) => SHOWCASE_ROLES.has(p.visualRole)) ?? inSeries[0];
};

// "Alüminyum Sistemler" → { lead: "Alüminyum", tail: "Sistemler" }
const splitName = (name: string): { lead: string; tail: string } => {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { lead: trimmed, tail: "" };
  return { lead: trimmed.slice(0, space), tail: trimmed.slice(space + 1) };
};

const toShowroomDoor = (product: DoorProduct): ShowroomDoor => ({
  id: product.slug,
  code: product.code,
  // Turntable başlığı seri adını kullanır (ürün adları "Avero" gibi kısa kodlar).
  nameDisplay: splitName(product.category),
  series: product.seriesTitle || product.category,
  image: product.image,
  spec: product.specs.slice(0, 3).join(" · "),
  meta: product.materials.slice(0, 3).join(" · "),
  accentColor: product.accentColor
});

export function useShowroomDoors() {
  const doors = computed<ShowroomDoor[]>(() =>
    SHOWROOM_SERIES.map(pickRepresentative)
      .filter((p): p is DoorProduct => Boolean(p))
      .map(toShowroomDoor)
  );

  return { doors };
}
