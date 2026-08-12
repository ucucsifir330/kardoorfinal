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
    allFull: "Tümünü Gör",
    model: "model",
    sourceSeries: "Kaynak seri",
    subclasses: "Alt sınıf",
    allSources: "Tümü",
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
        shortName: "Çelik Kapı",
        category: { short: "Sistemler", full: "Çelik Kapı Sistemleri" },
        cardTitle: "Çelik Kapı Sistemleri",
        description: "cam detaylı ve kaplamalı çelik kapı sistemleri",
        sources: {
          "camli-modeller": {
            short: "Camlı",
            full: "Camlı Modeller",
            parts: [
              { id: "mixed-glass", short: "Karma", full: "Karma Cam Seri" },
              { id: "tempered-glass", short: "Temperli", full: "Temperli Cam Seri" }
            ]
          },
          "pvc-laminoks": {
            short: "PVC & Laminoks",
            full: "PVC & Laminoks",
            parts: [
              { id: "lux-pvc", short: "PVC", full: "Lüks PVC Seri" },
              { id: "elit-laminox", short: "Elit", full: "Elit Laminoks Seri" },
              { id: "rustic-laminox", short: "Rustik", full: "Rustik Laminoks Seri" }
            ]
          }
        }
      },
      2: {
        shortName: "Dış İklim",
        category: { short: "Sistemler", full: "Dış İklim Kapı Sistemleri" },
        cardTitle: "Dış İklim Kapı Sistemleri",
        description: "dış iklim uyumlu kapı sistemleri",
        sources: {
          "aluminyum-sistemler": {
            short: "Alüminyum",
            full: "Alüminyum Sistemler",
            parts: [
              { id: "frame", short: "Kasa Seri", full: "Alüminyum Kasa Seri" },
              { id: "leaf", short: "Kanat Seri", full: "Alüminyum Kasa ve Kanat Seri" }
            ]
          },
          "dogal-yuzeyler": {
            short: "Doğal Yüzey",
            full: "Doğal Yüzeyler",
            parts: [
              { id: "wood", short: "Wood Seri", full: "Termo Wood Seri" },
              { id: "stone", short: "Taş Seri", full: "Doğal Taş Seri" }
            ]
          }
        }
      },
      3: {
        shortName: "Ekonomik",
        category: { short: "Sistemler", full: "Ekonomik Kapı Sistemleri" },
        cardTitle: "Ekonomik Kapı Sistemleri",
        description: "dayanıklı metal ve kompozit kapı çözümleri",
        sources: {
          "metal-kompozit": {
            short: "Metal",
            full: "Metal & Kompozit",
            parts: [
              { id: "composite", short: "Kompozit", full: "Kompozit Seri" },
              { id: "sheet-metal", short: "Sac", full: "Komple Sac Metal Seri" }
            ]
          }
        }
      },
      4: {
        shortName: "Bina Giriş",
        category: { short: "Sistemler", full: "Bina Giriş Sistemleri" },
        cardTitle: "Bina Giriş Sistemleri",
        description: "bina girişi, acil çıkış ve şaft sistemleri",
        sources: {
          "giris-teknik": {
            short: "Giriş & Teknik",
            full: "Giriş & Teknik",
            parts: [
              { id: "villa-building-entry", short: "Giriş", full: "Villa ve Bina Giriş Seri" },
              { id: "emergency-exit", short: "Acil", full: "Acil Çıkış Seri" },
              { id: "shaft-cover", short: "Şaft", full: "Şaft Kapakları" }
            ]
          }
        }
      },
      5: {
        shortName: "Özel Proje",
        category: { short: "Sistemler", full: "Özel Proje Sistemleri" },
        cardTitle: "Özel Proje Sistemleri",
        description: "projeye özel mimari kapı çözümleri",
        sources: {
          "mimari-ozel": {
            short: "Mimari Özel",
            full: "Mimari Özel",
            parts: [
              { id: "project-custom", short: "Özel", full: "Projeye Özel" },
              { id: "pivot", short: "Pivot", full: "Pivot" }
            ]
          }
        }
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
    allFull: "View All",
    model: "models",
    sourceSeries: "Source series",
    subclasses: "Subclass",
    allSources: "All",
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
        shortName: "Steel Door",
        category: { short: "Systems", full: "Steel Door Systems" },
        cardTitle: "Steel Door Systems",
        description: "steel door systems with glazed and clad surfaces",
        sources: {
          "camli-modeller": {
            short: "Glazed",
            full: "Glazed Models",
            parts: [
              { id: "mixed-glass", short: "Mixed", full: "Mixed Glass Series" },
              { id: "tempered-glass", short: "Tempered", full: "Tempered Glass Series" }
            ]
          },
          "pvc-laminoks": {
            short: "PVC & Laminox",
            full: "PVC & Laminox",
            parts: [
              { id: "lux-pvc", short: "PVC", full: "Luxury PVC Series" },
              { id: "elit-laminox", short: "Elite", full: "Elite Laminox Series" },
              { id: "rustic-laminox", short: "Rustic", full: "Rustic Laminox Series" }
            ]
          }
        }
      },
      2: {
        shortName: "Exterior Climate",
        category: { short: "Systems", full: "Exterior Climate Door Systems" },
        cardTitle: "Exterior Climate Door Systems",
        description: "door systems engineered for exterior climates",
        sources: {
          "aluminyum-sistemler": {
            short: "Aluminium",
            full: "Aluminium Systems",
            parts: [
              { id: "frame", short: "Frame Series", full: "Aluminium Frame Series" },
              { id: "leaf", short: "Leaf Series", full: "Aluminium Frame and Leaf Series" }
            ]
          },
          "dogal-yuzeyler": {
            short: "Natural Surface",
            full: "Natural Surfaces",
            parts: [
              { id: "wood", short: "Wood Series", full: "Thermo Wood Series" },
              { id: "stone", short: "Stone Series", full: "Natural Stone Series" }
            ]
          }
        }
      },
      3: {
        shortName: "Economical",
        category: { short: "Systems", full: "Economical Door Systems" },
        cardTitle: "Economical Door Systems",
        description: "durable metal and composite door solutions",
        sources: {
          "metal-kompozit": {
            short: "Metal",
            full: "Metal & Composite",
            parts: [
              { id: "composite", short: "Composite", full: "Composite Series" },
              { id: "sheet-metal", short: "Sheet Metal", full: "Full Sheet Metal Series" }
            ]
          }
        }
      },
      4: {
        shortName: "Building Entrance",
        category: { short: "Systems", full: "Building Entrance Systems" },
        cardTitle: "Building Entrance Systems",
        description: "building entrance, emergency exit and shaft systems",
        sources: {
          "giris-teknik": {
            short: "Entrance & Technical",
            full: "Entrance & Technical",
            parts: [
              { id: "villa-building-entry", short: "Entrance", full: "Villa and Building Entrance Series" },
              { id: "emergency-exit", short: "Exit", full: "Emergency Exit Series" },
              { id: "shaft-cover", short: "Shaft", full: "Shaft Covers" }
            ]
          }
        }
      },
      5: {
        shortName: "Special Project",
        category: { short: "Systems", full: "Special Project Systems" },
        cardTitle: "Special Project Systems",
        description: "bespoke architectural door solutions",
        sources: {
          "mimari-ozel": {
            short: "Architectural Special",
            full: "Architectural Special",
            parts: [
              { id: "project-custom", short: "Bespoke", full: "Project-Specific" },
              { id: "pivot", short: "Pivot", full: "Pivot" }
            ]
          }
        }
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
