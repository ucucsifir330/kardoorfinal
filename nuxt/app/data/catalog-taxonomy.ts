import type { DoorProduct } from "~/data/products";

// Kaynak: kullanıcının "KAPI FİLTRELEME SİSTEMİ" sheet'i (Ana Kategori/Kasa
// Tipi/Yüzey/Renk/Kullanım Alanı sütunlarındaki sabit değer listeleri).
// Ürün verisinde bu alanlar hiç tutulmuyordu; aşağıdaki aile bazlı eşleme
// TAHMİNDİR (özellikle Ana Kategori ve Kasa Tipi — gerçek imalat verisi
// değil). Kullanıcı doğrulamadan yayına alınmamalı.

export const ANA_KATEGORI_VALUES = [
  "Çelik Sistemler",
  "Dış İklim Sistemleri",
  "Ekonomik Seriler",
  "Bina Giriş Sistemleri",
  "Özel Proje Sistemleri"
] as const;
export type AnaKategoriValue = (typeof ANA_KATEGORI_VALUES)[number];

export const KASA_TIPI_VALUES = [
  "Standart Kasa",
  "Alüminyum Kasa",
  "Gizli Kasa",
  "Pivot Kasa",
  "Projeye Özel Kasa"
] as const;
export type KasaTipiValue = (typeof KASA_TIPI_VALUES)[number];

export const YUZEY_VALUES = [
  "Laminoks",
  "PVC",
  "Ahşap",
  "Doğal Taş",
  "Cam",
  "Metal",
  "Kompozit",
  "Özel Yüzey"
] as const;
export type YuzeyValue = (typeof YUZEY_VALUES)[number];

export const RENK_VALUES = [
  "Antrasit",
  "Siyah",
  "Beyaz",
  "Gri",
  "Kahverengi",
  "Meşe",
  "Ceviz",
  "Özel Renk"
] as const;
export type RenkValue = (typeof RENK_VALUES)[number];

export const KULLANIM_ALANI_VALUES = [
  "Daire",
  "Villa",
  "Bina Girişi",
  "Dış Mekan",
  "İç Mekan",
  "Proje"
] as const;
export type KullanimAlaniValue = (typeof KULLANIM_ALANI_VALUES)[number];

// Aile (seriesSlug) → varsayılan Ana Kategori/Kasa Tipi/Yüzey.
// Gözden geçirme notu: MK→"Çelik Sistemler" ve PL→"Ekonomik Seriler"
// eşlemeleri en belirsiz olanlar; kullanıcı iş bilgisiyle düzeltmeli.
const familyTaxonomy: Record<
  string,
  { anaKategori: AnaKategoriValue; kasaTipi: KasaTipiValue; yuzey: YuzeyValue }
> = {
  "aluminyum-sistemler": { anaKategori: "Dış İklim Sistemleri", kasaTipi: "Alüminyum Kasa", yuzey: "Metal" },
  "dogal-yuzeyler": { anaKategori: "Dış İklim Sistemleri", kasaTipi: "Standart Kasa", yuzey: "Ahşap" },
  "camli-modeller": { anaKategori: "Bina Giriş Sistemleri", kasaTipi: "Standart Kasa", yuzey: "Cam" },
  "metal-kompozit": { anaKategori: "Çelik Sistemler", kasaTipi: "Standart Kasa", yuzey: "Metal" },
  "pvc-laminoks": { anaKategori: "Ekonomik Seriler", kasaTipi: "Standart Kasa", yuzey: "Laminoks" },
  "mimari-ozel": { anaKategori: "Özel Proje Sistemleri", kasaTipi: "Projeye Özel Kasa", yuzey: "Özel Yüzey" },
  "giris-teknik": { anaKategori: "Bina Giriş Sistemleri", kasaTipi: "Gizli Kasa", yuzey: "Metal" }
};

// Ürün zaten "pivot"/"reflektif"/"özel yüzey" etiketliyse veya rengi "taş"
// ise, aile varsayılanı yerine daha isabetli bir değere geçilir.
const resolveKasaTipi = (product: DoorProduct, familyDefault: KasaTipiValue): KasaTipiValue =>
  product.tags.includes("pivot") ? "Pivot Kasa" : familyDefault;

const resolveYuzey = (product: DoorProduct, familyDefault: YuzeyValue): YuzeyValue => {
  if (product.colors.includes("taş")) return "Doğal Taş";
  if (product.tags.includes("özel yüzey") || product.tags.includes("reflektif")) return "Özel Yüzey";
  return familyDefault;
};

const COLOR_TO_RENK: Partial<Record<string, RenkValue>> = {
  antrasit: "Antrasit",
  siyah: "Siyah",
  beyaz: "Beyaz",
  gri: "Gri",
  kahverengi: "Kahverengi",
  ahşap: "Meşe"
};
export const mapColorToRenk = (color: string): RenkValue => COLOR_TO_RENK[color] ?? "Özel Renk";

const USECASE_TO_KULLANIM: Partial<Record<string, KullanimAlaniValue>> = {
  Villa: "Villa",
  Apartman: "Daire",
  "Dış iklim": "Dış Mekan",
  "Doğal yüzeyli giriş": "Villa",
  "Camlı giriş": "Bina Girişi",
  Proje: "Proje",
  "Modern giriş": "Bina Girişi",
  Konut: "Daire",
  "Bina girişi": "Bina Girişi",
  "Klasik giriş": "Bina Girişi",
  "Projeye özel": "Proje",
  Showroom: "İç Mekan",
  "Mimari vitrin": "İç Mekan",
  "Teknik hacim": "İç Mekan",
  "Acil çıkış": "Bina Girişi"
};
export const mapUseCaseToKullanimAlani = (useCase: string): KullanimAlaniValue =>
  USECASE_TO_KULLANIM[useCase] ?? "Dış Mekan";

const uniqueValues = <T,>(values: T[]) => [...new Set(values)];

export interface ProductTaxonomy {
  anaKategori: AnaKategoriValue;
  kasaTipi: KasaTipiValue;
  yuzey: YuzeyValue;
  renk: RenkValue[];
  kullanimAlani: KullanimAlaniValue[];
}

export const getProductTaxonomy = (product: DoorProduct): ProductTaxonomy => {
  const family = familyTaxonomy[product.seriesSlug];
  return {
    anaKategori: family.anaKategori,
    kasaTipi: resolveKasaTipi(product, family.kasaTipi),
    yuzey: resolveYuzey(product, family.yuzey),
    renk: uniqueValues(product.colors.map(mapColorToRenk)),
    kullanimAlani: uniqueValues(product.useCases.map(mapUseCaseToKullanimAlani))
  };
};
