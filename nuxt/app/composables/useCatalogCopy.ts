import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

/**
 * Ana sayfa katalog bolumunun TUM metinleri (TR/EN) — baslik, seri
 * adlari/aciklamalari, aksiyonlar, modal etiketleri.
 *
 * Neden ayri dosya: bu sozluk HomeCatalog.vue icinde 280 satir yer
 * kapliyordu — dosyanin dortte biri metin veriydi ve davranis koduyla ic
 * iceydi. Metin duzeltmesi yapmak icin 1100 satirlik bilesene girmek
 * gerekiyordu. useEntranceCopy ile ayni desen: metin tek kaynakta,
 * bilesen yalniz davranis.
 */
const catalogCopies: Record<string, any> = {
  tr: {
    title: "Koleksiyonlar",
    allShort: "Tümü",
    allFull: "Tüm Modelleri Gör",
    productImageAlt: "Kapı modeli",
    actions: {
      viewSeries: "Tüm Seriyi İncele",
      downloadCatalog: "Seri Kataloğunu İndir",
      requestOffer: "Koleksiyon Teklifi Al"
    },
    favorite: {
      add: "Favorilere ekle",
      remove: "Favorilerden kaldır"
    },
    blocks: {
      1: {
        seriesLabel: "Seri 01",
        shortName: "Alüminyum",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "frame", short: "Kasa Seri", full: "Alüminyum Kasa Seri" },
          { id: "leaf", short: "Kanat Seri", full: "Alüminyum Kasa ve Kanat Seri" }
        ],
        cardTitle: "Alüminyum Sistemler",
        description: "dış iklim uyumlu kapı sistemleri"
      },
      2: {
        seriesLabel: "Seri 02",
        shortName: "Doğal",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "wood", short: "Wood Seri", full: "Termo Wood Seri" },
          { id: "stone", short: "Taş Seri", full: "Doğal Taş Seri" }
        ],
        cardTitle: "Doğal Yüzeyler",
        description: "wood ve taş dokulu kapı yüzeyleri"
      },
      3: {
        seriesLabel: "Seri 03",
        shortName: "Cam",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "mixed-glass", short: "Karma", full: "Karma Cam Seri" },
          { id: "tempered-glass", short: "Temperli", full: "Temperli Cam Seri" }
        ],
        cardTitle: "Camlı Modeller",
        description: "cam detaylı dış kapı çözümleri"
      },
      4: {
        seriesLabel: "Seri 04",
        shortName: "Metal",
        category: { short: "Dış İklim", full: "Dış İklim Modelleri" },
        parts: [
          { id: "composite", short: "Kompozit", full: "Kompozit Seri" },
          { id: "sheet-metal", short: "Sac", full: "Komple Sac Metal Seri" }
        ],
        cardTitle: "Metal & Kompozit",
        description: "dayanıklı metal ve kompozit modeller"
      },
      5: {
        seriesLabel: "Seri 05",
        shortName: "Laminoks",
        category: { short: "Exclusive", full: "Exclusive Modeller" },
        parts: [
          { id: "lux-pvc", short: "PVC", full: "Lüks PVC Seri" },
          { id: "elit-laminox", short: "Elit", full: "Elit Laminoks Seri" },
          { id: "rustic-laminox", short: "Rustik", full: "Rustik Laminoks Seri" }
        ],
        cardTitle: "PVC & Laminoks",
        description: "exclusive kaplama seçenekleri"
      },
      6: {
        seriesLabel: "Seri 06",
        shortName: "Mimari",
        category: { short: "Exclusive", full: "Exclusive Modeller" },
        parts: [
          { id: "project-custom", short: "Özel", full: "Projeye Özel Seri" },
          { id: "pivot", short: "Pivot", full: "Pivot Seri" }
        ],
        cardTitle: "Mimari Özel",
        description: "projeye özel ve pivot çözümler"
      },
      7: {
        seriesLabel: "Seri 07",
        shortName: "Teknik",
        category: { short: "Çözümler", full: "Teknik Çözümler" },
        parts: [
          { id: "villa-building-entry", short: "Giriş", full: "Villa ve Bina Giriş Seri" },
          { id: "emergency-exit", short: "Acil", full: "Acil Çıkış Seri" },
          { id: "shaft-cover", short: "Şaft", full: "Bina Şaft Kapakları Seri" }
        ],
        cardTitle: "Giriş & Teknik",
        description: "giriş, acil çıkış ve şaft sistemleri"
      }
    },
    modal: {
      productDetail: "ürün detayı",
      close: "Kapat",
      previous: "Önceki ürün",
      next: "Sonraki ürün",
      seriesFallback: "Kardoor Mimari Kapılar",
      collectionFallback: "Premium Seri",
      categoryFallback: "Giriş Kapısı Sistemi",
      description:
        "Güçlendirilmiş gövde yapısı, rafine yüzey seçenekleri ve çağdaş cephe estetiğiyle villa, rezidans ve özel mimari projeler için geliştirilen premium giriş kapısı sistemi.",
      quote: "Teklif al",
      infoTitle: "Ürün Bilgisi",
      fields: {
        code: "Kod",
        series: "Seri",
        finish: "Yüzey",
        system: "Sistem",
        usage: "Kullanım"
      },
      systemFallback: "Çelik / Alüminyum kapı sistemi",
      usage: "Villa, rezidans, proje ve özel mimari girişler",
      filesTitle: "Dosyalar",
      files: {
        specSheet: "Teknik föy",
        productImage: "Ürün görseli",
        drawing: "Teknik çizim",
        installation: "Montaj detayı"
      },
      specs: {
        body: "Güçlendirilmiş gövde",
        customSize: "Projeye özel ölçü",
        finishes: "Mimari yüzey seçenekleri"
      },
      finishesAria: "Yüzey seçenekleri",
      finishLabels: {
        black: "Siyah yüzey",
        anthracite: "Antrasit yüzey",
        bronze: "Bronz yüzey",
        light: "Açık yüzey",
        brass: "Pirinç yüzey",
        metal: "Metal yüzey"
      }
    }
  },
  en: {
    title: "Collections",
    allShort: "All",
    allFull: "View All Models",
    productImageAlt: "Door model",
    actions: {
      viewSeries: "Explore the Full Series",
      downloadCatalog: "Download Series Catalogue",
      requestOffer: "Request a Collection Proposal"
    },
    favorite: {
      add: "Add to favourites",
      remove: "Remove from favourites"
    },
    blocks: {
      1: {
        seriesLabel: "Series 01",
        shortName: "Aluminium",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "frame", short: "Frame Series", full: "Aluminium Frame Series" },
          { id: "leaf", short: "Leaf Series", full: "Aluminium Frame and Leaf Series" }
        ],
        cardTitle: "Aluminium Systems",
        description: "door systems engineered for exterior climates"
      },
      2: {
        seriesLabel: "Series 02",
        shortName: "Natural",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "wood", short: "Wood Series", full: "Thermo Wood Series" },
          { id: "stone", short: "Stone Series", full: "Natural Stone Series" }
        ],
        cardTitle: "Natural Surfaces",
        description: "wood and stone textured architectural door surfaces"
      },
      3: {
        seriesLabel: "Series 03",
        shortName: "Glass",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "mixed-glass", short: "Mixed", full: "Mixed Glass Series" },
          { id: "tempered-glass", short: "Tempered", full: "Tempered Glass Series" }
        ],
        cardTitle: "Glazed Models",
        description: "exterior door solutions refined with glass detailing"
      },
      4: {
        seriesLabel: "Series 04",
        shortName: "Metal",
        category: { short: "Exterior", full: "Exterior Climate Models" },
        parts: [
          { id: "composite", short: "Composite", full: "Composite Series" },
          { id: "sheet-metal", short: "Sheet Metal", full: "Full Sheet Metal Series" }
        ],
        cardTitle: "Metal & Composite",
        description: "resilient metal and composite entrance models"
      },
      5: {
        seriesLabel: "Series 05",
        shortName: "Laminox",
        category: { short: "Exclusive", full: "Exclusive Models" },
        parts: [
          { id: "lux-pvc", short: "PVC", full: "Luxury PVC Series" },
          { id: "elit-laminox", short: "Elite", full: "Elite Laminox Series" },
          { id: "rustic-laminox", short: "Rustic", full: "Rustic Laminox Series" }
        ],
        cardTitle: "PVC & Laminox",
        description: "exclusive architectural cladding options"
      },
      6: {
        seriesLabel: "Series 06",
        shortName: "Architectural",
        category: { short: "Exclusive", full: "Exclusive Models" },
        parts: [
          { id: "project-custom", short: "Bespoke", full: "Project-Specific Series" },
          { id: "pivot", short: "Pivot", full: "Pivot Series" }
        ],
        cardTitle: "Architectural Bespoke",
        description: "project-specific and pivot door solutions"
      },
      7: {
        seriesLabel: "Series 07",
        shortName: "Technical",
        category: { short: "Solutions", full: "Technical Solutions" },
        parts: [
          { id: "villa-building-entry", short: "Entrance", full: "Villa and Building Entrance Series" },
          { id: "emergency-exit", short: "Exit", full: "Emergency Exit Series" },
          { id: "shaft-cover", short: "Shaft", full: "Building Shaft Cover Series" }
        ],
        cardTitle: "Entrance & Technical",
        description: "entrance, emergency exit, and shaft systems"
      }
    },
    modal: {
      productDetail: "product detail",
      close: "Close",
      previous: "Previous product",
      next: "Next product",
      seriesFallback: "Kardoor Architectural Doors",
      collectionFallback: "Premium Series",
      categoryFallback: "Entrance Door System",
      description:
        "A premium entrance door system developed for villas, residences, and bespoke architectural projects with a reinforced body, refined surface options, and a contemporary facade presence.",
      quote: "Request a quote",
      infoTitle: "Product Information",
      fields: {
        code: "Code",
        series: "Series",
        finish: "Finish",
        system: "System",
        usage: "Use"
      },
      systemFallback: "Steel / aluminium door system",
      usage: "Villas, residences, projects, and bespoke architectural entrances",
      filesTitle: "Files",
      files: {
        specSheet: "Technical sheet",
        productImage: "Product image",
        drawing: "Technical drawing",
        installation: "Installation detail"
      },
      specs: {
        body: "Reinforced body",
        customSize: "Project-specific sizing",
        finishes: "Architectural finish options"
      },
      finishesAria: "Finish options",
      finishLabels: {
        black: "Black finish",
        anthracite: "Anthracite finish",
        bronze: "Bronze finish",
        light: "Light finish",
        brass: "Brass finish",
        metal: "Metal finish"
      }
    }
  }
};

export const useCatalogCopy = () => {
  const { locale } = useKardoorLocale();
  const catalogCopy = computed(() => catalogCopies[locale.value] ?? catalogCopies.tr);
  return { catalogCopy };
};
