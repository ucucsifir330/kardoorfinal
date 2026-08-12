import { computed } from "vue";
import { products, type DoorProduct } from "~/data/products";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

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
  fitScale: number;
  baselineShift: number;
  /** Kısa teknik satır — specs'ten birleştirilir. */
  spec: string;
  /** Alt meta — materyaller. */
  meta: string;
  accentColor: string;
};

const showroomCopies: Record<string, {
  tr: { title: string; series: string; spec: string; meta: string };
  en: { title: string; series: string; spec: string; meta: string };
}> = {
  "aluminyum-sistemler": {
    tr: {
      title: "Çelik Kapı Sistemleri",
      series: "Camlı & Laminasyon",
      spec: "Cam detaylı yüzeyler ve laminasyon kaplama seçenekleriyle şehir tipi girişler",
      meta: "Temperli cam · Laminoks panel · Çelik gövde"
    },
    en: {
      title: "Steel Door Systems",
      series: "Glazed & Lamination",
      spec: "Urban entrances with glazed surfaces and lamination finish options",
      meta: "Tempered glass · Laminox panel · Steel body"
    }
  },
  "dogal-yuzeyler": {
    tr: {
      title: "Dış İklim Kapı Sistemleri",
      series: "Dış İklim",
      spec: "Alüminyum dayanımı ve doğal yüzey dokusunu bir arada sunan dış mekân koleksiyonu",
      meta: "Alüminyum sistem · Ahşap/taş doku · Isı yalıtımı"
    },
    en: {
      title: "Exterior Climate Door Systems",
      series: "Exterior Climate",
      spec: "An exterior collection combining aluminium durability with natural surface textures",
      meta: "Aluminium system · Wood/stone texture · Thermal insulation"
    }
  },
  "camli-modeller": {
    tr: {
      title: "Ekonomik Kapı Sistemleri",
      series: "Metal & Kompozit",
      spec: "Uygun maliyetli, dayanıklı metal ve kompozit yüzeyli giriş çözümleri",
      meta: "Kompozit yüzey · Sac gövde · Çelik detay"
    },
    en: {
      title: "Economical Door Systems",
      series: "Metal & Composite",
      spec: "Cost-effective, durable entrance solutions with metal and composite surfaces",
      meta: "Composite surface · Sheet-metal body · Steel detail"
    }
  },
  "pvc-laminoks": {
    tr: {
      title: "Bina Giriş Sistemleri",
      series: "Giriş & Teknik",
      spec: "Acil çıkış, şaft ve teknik giriş sistemleri için mühendislik odaklı çözümler",
      meta: "Acil çıkış uyumlu · Şaft kapağı seçeneği · Teknik sertifikasyon"
    },
    en: {
      title: "Building Entrance Systems",
      series: "Entrance & Technical",
      spec: "Engineering-led solutions for emergency exits, shafts and technical entrance systems",
      meta: "Emergency-exit compliant · Shaft cover option · Technical certification"
    }
  },
  "mimari-ozel": {
    tr: {
      title: "Özel Proje Sistemleri",
      series: "Mimari Özel · Pivot",
      spec: "Mimari giriş etkisi · Projeye özel kurgu · Pivot veya vitrin kullanımı",
      meta: "Mimari yüzey · Pivot sistem · Cam/metal detay"
    },
    en: {
      title: "Special Project Systems",
      series: "Architectural Bespoke · Pivot",
      spec: "Architectural entrance presence · Project-specific composition · Pivot or showcase use",
      meta: "Architectural finish · Pivot system · Glass/metal detail"
    }
  }
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

type ShowroomSeriesSlug = (typeof SHOWROOM_SERIES)[number];

type ShowroomRepresentative = {
  image: number;
  fitScale: number;
  baselineShift: number;
};

const showroomImagePath = (imageNumber: number) =>
  `/images/katalogwebp/Image${String(imageNumber).padStart(2, "0")}.webp`;

// Showroom orbitinde canvas/ürün ölçeği birbirine yakın duran 5 kapı.
// Otomatik showcase seçimi Image04 gibi geniş bina-giriş kadrajlarını çekiyordu.
const SHOWROOM_REPRESENTATIVES: Record<ShowroomSeriesSlug, ShowroomRepresentative> = {
  // fitScale: görünür alfa yüksekliğini ortak ~%92 seviyesine getirir.
  // baselineShift: kaynak görseldeki farklı alt transparan boşlukları eşitler.
  "aluminyum-sistemler": { image: 41, fitScale: 1.152, baselineShift: 7.5 },
  "dogal-yuzeyler": { image: 57, fitScale: 1, baselineShift: -1.2 },
  "camli-modeller": { image: 17, fitScale: 1.055, baselineShift: 1.6 },
  "pvc-laminoks": { image: 117, fitScale: 1.057, baselineShift: 2.7 },
  "mimari-ozel": { image: 142, fitScale: 1.013, baselineShift: 0.2 }
};

// Bir family içinde temsilci kapı seçimi: vitrin/showcase rolü olan görseller
// turntable'da daha iyi durur (açık kapı, lifestyle, reflektif). Yoksa ilk ürün.
const SHOWCASE_ROLES = new Set(["showcase", "product-showcase"]);

const pickRepresentative = (seriesSlug: string): DoorProduct | undefined => {
  const inSeries = products.filter((p) => p.seriesSlug === seriesSlug);
  if (!inSeries.length) return undefined;

  const representative = SHOWROOM_REPRESENTATIVES[seriesSlug as ShowroomSeriesSlug];
  const preferredProduct = representative
    ? inSeries.find((p) => p.localImage === showroomImagePath(representative.image))
    : undefined;
  if (preferredProduct) return preferredProduct;

  return inSeries.find((p) => SHOWCASE_ROLES.has(p.visualRole)) ?? inSeries[0];
};

// "Çelik Kapı Sistemleri" → { lead: "Çelik Kapı", tail: "Sistemleri" }
const splitName = (name: string): { lead: string; tail: string } => {
  const trimmed = name.trim();
  const systemSuffix = " Sistemleri";

  if (trimmed.endsWith(systemSuffix)) {
    return {
      lead: trimmed.slice(0, -systemSuffix.length),
      tail: systemSuffix.trim()
    };
  }

  const space = trimmed.indexOf(" ");
  if (space === -1) return { lead: trimmed, tail: "" };
  return { lead: trimmed.slice(0, space), tail: trimmed.slice(space + 1) };
};

export function useShowroomDoors() {
  const { locale } = useKardoorLocale();

  const toShowroomDoor = (product: DoorProduct): ShowroomDoor => {
    const copy = showroomCopies[product.seriesSlug]?.[locale.value];
    const title = copy?.title ?? product.category;

    return {
      id: product.slug,
      code: product.code,
      // Turntable başlığı seri adını kullanır (ürün adları "Avero" gibi kısa kodlar).
      nameDisplay: splitName(title),
      series: copy?.series ?? product.seriesTitle ?? product.category,
      image: product.localImage,
      fitScale: SHOWROOM_REPRESENTATIVES[product.seriesSlug as ShowroomSeriesSlug]?.fitScale ?? 1,
      baselineShift:
        SHOWROOM_REPRESENTATIVES[product.seriesSlug as ShowroomSeriesSlug]?.baselineShift ?? 0,
      spec: copy?.spec ?? product.specs.slice(0, 3).join(" · "),
      meta: copy?.meta ?? product.materials.slice(0, 3).join(" · "),
      accentColor: product.accentColor
    };
  };

  const doors = computed<ShowroomDoor[]>(() =>
    SHOWROOM_SERIES.map(pickRepresentative)
      .filter((p): p is DoorProduct => Boolean(p))
      .map(toShowroomDoor)
  );

  return { doors };
}
