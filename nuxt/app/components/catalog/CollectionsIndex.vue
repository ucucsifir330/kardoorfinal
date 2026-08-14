<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import CollectionsRail from "./CollectionsRail.vue";
import type { DoorProduct } from "~/data/products";

const collectionsCopies = {
  tr: {
    catalog: "Kardoor / Katalog 2026",
    model: "model",
    seriesCount: "07 seri",
    titleTop: "Kapı",
    titleBottom: "Arşivi",
    intro: "Mimari girişler için malzeme, oran ve yüzey araştırması. Her model tek bir satış kartı değil, projenin ilk temas noktası olarak incelenir.",
    explore: "Arşivi incele",
    seriesIndex: "Seri indeksi",
    specimen: "Numune",
    selectedModel: "Seçili model",
    series: "Seri",
    surface: "Yüzey",
    detail: "Model detayı",
    modelIndex: "Model indeksi",
    search: "Model ara",
    searchPlaceholder: "İsim, kod veya malzeme",
    noResult: "Bu aramayla eşleşen model bulunamadı.",
    clearSearch: "Aramayı temizle",
    closingLabel: "Kardoor kapı sistemleri",
    closingLineOne: "Bir giriş yalnızca kapanmaz.",
    closingLineTwo: "Yapının karakterini açar.",
    materialSeries: "malzeme serisi",
    projectCta: "Projenizi konuşalım",
    desktopOnly: "Bu rota yalnızca masaüstü katalog prototipidir."
  },
  en: {
    catalog: "Kardoor / Catalog 2026",
    model: "model",
    seriesCount: "07 series",
    titleTop: "Door",
    titleBottom: "Archive",
    intro: "A study of material, proportion and surface for architectural entrances. Each model is examined not as a sales card, but as the building's first point of contact.",
    explore: "Explore the archive",
    seriesIndex: "Series index",
    specimen: "Specimen",
    selectedModel: "Selected model",
    series: "Series",
    surface: "Surface",
    detail: "Model details",
    modelIndex: "Model index",
    search: "Search models",
    searchPlaceholder: "Name, code or material",
    noResult: "No models match this search.",
    clearSearch: "Clear search",
    closingLabel: "Kardoor door systems",
    closingLineOne: "An entrance does more than close.",
    closingLineTwo: "It opens the character of the building.",
    materialSeries: "material series",
    projectCta: "Discuss your project",
    desktopOnly: "This route is a desktop-only catalog prototype."
  }
} as const;

const englishSeriesTitles: Record<string, string> = {
  "aluminyum-sistemler": "Aluminium Systems",
  "dogal-yuzeyler": "Natural Surfaces",
  "camli-modeller": "Glazed Models",
  "metal-kompozit": "Metal & Composite",
  "pvc-laminoks": "PVC & Laminox",
  "mimari-ozel": "Architectural Special",
  "giris-teknik": "Entrance & Technical"
};

const collectionFamilies = [
  {
    familySlug: "celik-kapi",
    title: { tr: "Çelik Kapı", en: "Steel Door" },
    seriesSlugs: ["camli-modeller", "pvc-laminoks"]
  },
  {
    familySlug: "dis-iklim",
    title: { tr: "Dış İklim", en: "Exterior Climate" },
    seriesSlugs: ["aluminyum-sistemler", "dogal-yuzeyler"]
  },
  {
    familySlug: "ekonomik",
    title: { tr: "Ekonomik", en: "Economical" },
    seriesSlugs: ["metal-kompozit"]
  },
  {
    familySlug: "bina-giris",
    title: { tr: "Bina Giriş", en: "Building Entrance" },
    seriesSlugs: ["giris-teknik"]
  },
  {
    familySlug: "ozel-proje",
    title: { tr: "Özel Proje", en: "Special Project" },
    seriesSlugs: ["mimari-ozel"]
  }
] as const;

const familyIncludesSeries = (seriesSlugs: readonly string[], seriesSlug: string) =>
  seriesSlugs.includes(seriesSlug);

const englishTechnicalCopy: Record<string, string> = {
  "Alüminyum kasa / Alüminyum kanat / Dış iklim sistemleri": "Aluminium frame / Aluminium leaf / Exterior climate systems",
  "Termo Wood / Doğal taş / Ahşap ve taş dokulu yüzeyler": "Thermo wood / Natural stone / Wood and stone-textured surfaces",
  "Karma cam / Temperli cam / Ferforje / Yan camlı": "Mixed glazing / Tempered glass / Wrought iron / Sidelight",
  "Kompozit / Komple sac metal / Özel metal yüzey": "Composite / Full sheet metal / Special metal surface",
  "Exclusive / Lüks PVC / Elit Laminoks / Rustik Laminoks": "Exclusive / Luxury PVC / Elite Laminox / Rustic Laminox",
  "Projeye özel / Pivot / Showroom / Vitrin görseli": "Bespoke project / Pivot / Showroom / Showcase image",
  "Teknik çözümler / Villa ve bina girişi / Acil çıkış / Şaft kapakları": "Technical solutions / Villa and building entrance / Emergency exit / Shaft doors",
  "Alüminyum kasa": "Aluminium frame",
  "Termo wood": "Thermo wood",
  "Temperli cam": "Tempered glass",
  "Metal yüzey": "Metal surface",
  "PVC yüzey": "PVC surface",
  "Mimari yüzey": "Architectural surface",
  "Teknik panel": "Technical panel",
  "Alüminyum": "Aluminium",
  "Termo Wood": "Thermo wood",
  "Doğal taş": "Natural stone",
  "Ahşap yüzey": "Wood surface",
  "Karma cam": "Mixed glazing",
  "Yan cam": "Sidelight",
  "Özel metal": "Special metal",
  "Reflektif yüzey": "Reflective surface",
  "Klasik panel": "Classic panel",
  "Rustik laminoks": "Rustic laminox",
  "Mimari özel": "Architectural special",
  "Giriş": "Entrance",
  "Teknik": "Technical",
  "Şaft": "Shaft",
  "Servis": "Service"
};

const englishTechnicalTerms: Array<[string, string]> = [
  ["Alüminyum", "Aluminium"],
  ["Çelik gövde", "Steel body"],
  ["Doğal taş", "Natural stone"],
  ["Ahşap doku", "Wood texture"],
  ["Ahşap", "Wood"],
  ["Taş", "Stone"],
  ["Temperli cam", "Tempered glass"],
  ["Ferforje", "Wrought iron"],
  ["Metal yüzey", "Metal surface"],
  ["Dış iklim", "Exterior climate"],
  ["Mimari özel", "Architectural special"],
  ["Giriş", "Entrance"],
  ["Teknik", "Technical"],
  ["Yüzey", "Surface"],
  ["Kasa", "Frame"],
  ["Kanat", "Leaf"]
];

const props = defineProps<{
  products: DoorProduct[];
}>();

const { locale } = useKardoorLocale();
const { gsap, ScrollTrigger, ScrollSmoother } = useGSAP();
if (import.meta.client) gsap.registerPlugin(Flip, ScrambleTextPlugin);
const imageBuilder = useImage();
const imageKitBaseUrl = "https://ik.imagekit.io/kardoor";
const copy = computed(() => collectionsCopies[locale.value] ?? collectionsCopies.tr);
const railLabels = computed(() => ({
  modelIndex: copy.value.modelIndex,
  search: copy.value.search,
  searchPlaceholder: copy.value.searchPlaceholder,
  model: copy.value.model,
  noResult: copy.value.noResult,
  clearSearch: copy.value.clearSearch
}));
const pageElement = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const activeProduct = ref<DoorProduct>(props.products[0] as DoorProduct);
const archiveElement = ref<HTMLElement | null>(null);
const shellElement = ref<HTMLElement | null>(null);
const observedElements = new Map<Element, DoorProduct>();
let thumbnailObserver: IntersectionObserver | null = null;
let pageMotionContext: ReturnType<typeof gsap.context> | null = null;
let archiveRevealContext: ReturnType<typeof gsap.context> | null = null;
let atmosphereScrubContext: ReturnType<typeof gsap.context> | null = null;

// Atmosfer scrub'ı paleti <html>'e de yazıyor (zemin sızıntısı için, bkz.
// paintProperty). Rota değişince o değerler kökte asılı kalmasın.
const clearPaletteRoot = () => {
  if (!import.meta.client) return;
  const root = document.documentElement;
  for (const property of ["--collections-bg", "--collections-surface", "--collections-text", "--collections-accent"]) {
    root.style.removeProperty(property);
  }
};
let productStepContext: ReturnType<typeof gsap.context> | null = null;
let archiveTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
let shellTimeline: ReturnType<typeof gsap.timeline> | null = null;
let productTimeline: ReturnType<typeof gsap.timeline> | null = null;
let atmosphereTween: ReturnType<typeof gsap.to> | null = null;
let atmosphereTargetSlug = activeProduct.value.seriesSlug;
let themeObserver: MutationObserver | null = null;
let cleanupProductTransition: (() => void) | null = null;
let productSelectionId = 0;
let detachSpecimenResponse: (() => void) | null = null;
let filterRefreshTimer: number | null = null;
let thumbnailLoadTimer: number | null = null;
let convergenceTimer: number | null = null;
// Kept so convergence can read each row's resolved start offset without touching
// layout — ScrollTrigger already computed these during its last refresh.
let productTriggerEntries: Array<{
  trigger: ReturnType<typeof ScrollTrigger.create>;
  product: DoorProduct;
}> = [];
const thumbnailLoadQueue: HTMLImageElement[] = [];
let queuedThumbnailElements = new WeakSet<HTMLImageElement>();
const warmedSpecimenImages = new Map<string, HTMLImageElement>();
const specimenPreloadPromises = new Map<string, Promise<void>>();

const localizedSeriesTitle = (slug: string, fallback: string) =>
  locale.value === "en" ? englishSeriesTitles[slug] ?? fallback : fallback;

const localizedTechnicalText = (value: string | undefined) => {
  if (!value || locale.value === "tr") return value ?? "";
  if (englishTechnicalCopy[value]) return englishTechnicalCopy[value];
  return englishTechnicalTerms.reduce(
    (translated, [turkish, english]) => translated.replaceAll(turkish, english),
    value
  );
};

// Product data keeps the canonical absolute URL for non-Nuxt consumers. The
// ImageKit provider needs the path below our configured account base URL so the
// CDN, rather than the local IPX server, owns resizing and long-lived caching.
const imageKitPath = (source: string) =>
  source.startsWith(imageKitBaseUrl) ? source.slice(imageKitBaseUrl.length) : source;

const thumbnailSource = (source: string) =>
  imageBuilder.collectionsThumbnail(imageKitPath(source));

const specimenSource = (source: string) =>
  imageBuilder.collectionsSpecimen(imageKitPath(source));

const preloadSpecimen = (source: string) => {
  if (warmedSpecimenImages.has(source)) return Promise.resolve();

  const pendingPreload = specimenPreloadPromises.get(source);
  if (pendingPreload) return pendingPreload;

  let resolvePreload = () => {};
  const preloadPromise = new Promise<void>((resolve) => {
    resolvePreload = resolve;
  });
  specimenPreloadPromises.set(source, preloadPromise);

  const preload = new window.Image();
  let settled = false;
  const finish = (loaded: boolean) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeout);
    specimenPreloadPromises.delete(source);
    if (loaded) {
      warmedSpecimenImages.delete(source);
      warmedSpecimenImages.set(source, preload);
      while (warmedSpecimenImages.size > 14) {
        const oldestSource = warmedSpecimenImages.keys().next().value;
        if (!oldestSource) break;
        warmedSpecimenImages.delete(oldestSource);
      }
    }
    resolvePreload();
  };
  const timeout = window.setTimeout(() => finish(false), 1800);
  const decodePreload = async () => {
    try {
      await preload.decode();
      finish(preload.naturalWidth > 0);
    } catch {
      finish(preload.naturalWidth > 0);
    }
  };
  preload.onload = () => void decodePreload();
  preload.onerror = () => finish(false);
  preload.decoding = "async";
  preload.src = source;
  if (preload.complete) void decodePreload();

  return preloadPromise;
};

const warmSpecimenWindow = (product: DoorProduct) => {
  const productIndex = props.products.findIndex((item) => item.code === product.code);
  if (productIndex < 0) return;

  // Keep only the immediate neighbours warm. The rail has 169 rows, so warming
  // a wide window would create a burst of full-size CDN requests while scrolling.
  const preloadStart = Math.max(0, productIndex - 1);
  props.products.slice(preloadStart, productIndex + 2).forEach((item) => {
    void preloadSpecimen(specimenSource(item.image));
  });
};

const flushThumbnailQueue = () => {
  thumbnailLoadTimer = null;

  for (let index = 0; index < 2 && thumbnailLoadQueue.length; index += 1) {
    const thumbnail = thumbnailLoadQueue.shift();
    if (!thumbnail?.isConnected) continue;
    const source = thumbnail.dataset.collectionsThumbnail;
    if (!source) continue;
    thumbnail.src = source;
    thumbnail.removeAttribute("data-collections-thumbnail");
  }

  if (thumbnailLoadQueue.length) {
    thumbnailLoadTimer = window.setTimeout(flushThumbnailQueue, 45);
  }
};

const queueThumbnail = (row: HTMLElement) => {
  const thumbnail = row.querySelector<HTMLImageElement>("img[data-collections-thumbnail]");
  if (!thumbnail || queuedThumbnailElements.has(thumbnail)) return;
  queuedThumbnailElements.add(thumbnail);
  thumbnailLoadQueue.unshift(thumbnail);
  if (thumbnailLoadTimer === null) {
    thumbnailLoadTimer = window.setTimeout(flushThumbnailQueue, 0);
  }
};

const seriesGroups = computed(() => {
  const groups = new Map<string, { slug: string; title: string; products: DoorProduct[] }>();

  for (const product of props.products) {
    const existing = groups.get(product.seriesSlug);
    if (existing) {
      existing.products.push(product);
      continue;
    }

    groups.set(product.seriesSlug, {
      slug: product.seriesSlug,
      title: product.seriesTitle,
      products: [product]
    });
  }

  return [...groups.values()];
});

const collectionFamilyGroups = computed(() =>
  collectionFamilies.map((family) => {
    const series = seriesGroups.value.filter((group) =>
      familyIncludesSeries(family.seriesSlugs, group.slug)
    );

    return {
      ...family,
      series,
      productCount: series.reduce((count, group) => count + group.products.length, 0)
    };
  })
);

const normalizedQuery = computed(() => searchQuery.value.trim().toLocaleLowerCase("tr-TR"));

const filteredGroups = computed(() => {
  if (!normalizedQuery.value) return seriesGroups.value;

  return seriesGroups.value
    .map((group) => ({
      ...group,
      products: group.products.filter((product) => {
        const searchable = [
          product.name,
          product.code,
          product.seriesTitle,
          ...product.materials,
          ...product.colors
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        return searchable.includes(normalizedQuery.value);
      })
    }))
    .filter((group) => group.products.length > 0);
});

const filteredCount = computed(() =>
  filteredGroups.value.reduce((count, group) => count + group.products.length, 0)
);

const currentCollectionFamilyIndex = computed(() =>
  Math.max(
    0,
    collectionFamilyGroups.value.findIndex((family) =>
      familyIncludesSeries(family.seriesSlugs, activeProduct.value.seriesSlug)
    )
  )
);

const activeProductIndex = computed(() =>
  Math.max(0, props.products.findIndex((product) => product.code === activeProduct.value.code))
);

/**
 * The seven material families share one controlled lightness range. We animate
 * semantic custom properties instead of individual descendants, so the shell,
 * specimen and rail remain one chromatic field without adding more scroll owners.
 */
const readSeriesPalette = (seriesSlug: string) => {
  const page = pageElement.value;
  if (!page) return null;

  const computedStyle = window.getComputedStyle(page);
  const background = computedStyle.getPropertyValue(`--collections-tone-${seriesSlug}-bg`).trim();
  const surface = computedStyle.getPropertyValue(`--collections-tone-${seriesSlug}-surface`).trim();
  const text = computedStyle.getPropertyValue(`--collections-tone-${seriesSlug}-text`).trim();
  const accent = computedStyle.getPropertyValue(`--collections-tone-${seriesSlug}-accent`).trim();
  if (!background || !surface || !text || !accent) return null;

  return {
    "--collections-bg": background,
    "--collections-surface": surface,
    "--collections-text": text,
    "--collections-accent": accent
  };
};

const transitionSeriesAtmosphere = (seriesSlug: string, immediate = false) => {
  const page = pageElement.value;
  const palette = readSeriesPalette(seriesSlug);
  if (!page || !palette) return;

  atmosphereTargetSlug = seriesSlug;
  atmosphereTween?.kill();
  atmosphereTween = null;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (immediate || reduceMotion) {
    gsap.set(page, palette);
    return;
  }

  atmosphereTween = gsap.to(page, {
    ...palette,
    duration: 1.2,
    ease: "power1.out",
    overwrite: "auto",
    onComplete: () => {
      atmosphereTween = null;
    }
  });
};

// How much scroll a series boundary is given to cross-fade, in pixels. Roughly
// three rail rows — long enough to read as a drift rather than a cut.
const ATMOSPHERE_FADE_PX = 1150;

/**
 * Scroll-linked atmosphere. The seven material families are the page's signature,
 * but a fixed 1.2s tween fired on series change had no relationship to the scroll
 * — the field just re-tinted on its own clock. Scrubbing the same four custom
 * properties ties the colour to the wheel instead: slow the scroll and the field
 * slows with it, reverse and it walks back.
 *
 * One timeline, not one trigger per boundary. Six independent scrubs all wrote the
 * same four properties, and a scrubbed tween parked at progress 0 keeps applying
 * its "from" values, so whichever updated last won — measured at scroll 11613 the
 * page showed the *next* series' palette because that boundary's tween was
 * re-stamping its start state. A single timeline has a single writer.
 *
 * The timeline is measured in pixels (1 time unit = 1px of archive), so boundary
 * positions and fade lengths below read as the distances they actually are.
 *
 * Under reduced motion no scrub is built and selection sets the palette outright.
 */
const rebuildAtmosphereScrub = () => {
  atmosphereScrubContext?.revert();
  atmosphereScrubContext = null;

  const page = pageElement.value;
  const archive = archiveElement.value;
  if (!page || !archive) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const groups = filteredGroups.value;
  if (groups.length < 2) return;

  const scrollTop = ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
  const archiveTop = archive.getBoundingClientRect().top + scrollTop;
  const archiveHeight = archive.offsetHeight;
  if (archiveHeight <= 0) return;

  // Each series contributes one stop: the archive offset where its palette is
  // fully in force. The first series owns the top of the archive.
  const stops = groups
    .map((group, index) => {
      const palette = readSeriesPalette(group.slug);
      if (!palette) return null;
      if (index === 0) return { offset: 0, palette };

      const element = document.getElementById(`collections-series-${group.slug}`);
      if (!element) return null;

      const boundary = element.getBoundingClientRect().top + scrollTop - archiveTop;
      return { offset: Math.max(0, boundary + ATMOSPHERE_FADE_PX * 0.35), palette };
    })
    .filter((entry) => entry !== null);

  if (stops.length < 2) return;

  const properties = ["--collections-bg", "--collections-surface", "--collections-text", "--collections-accent"] as const;

  // Palet köke de yazılır. Sayfa 100svh'den uzun ve zemini kendisi boyuyor;
  // overscroll (rubber band) sırasında ve sayfanın altında görünen katman ise
  // html — orası site kremini (--paper #F2EEE6) gösteriyordu, mavi arşivin
  // altında krem bir şerit olarak. Aynı değerleri köke yazınca aşağıdaki
  // `html:has(.collections-page)` kuralı zemini seriye göre birlikte kaydırıyor.
  const paletteRoot = document.documentElement;
  const paintProperty = (property: string, value: string) => {
    page.style.setProperty(property, value);
    paletteRoot.style.setProperty(property, value);
  };

  atmosphereScrubContext = gsap.context(() => {
    const paint = (self: { progress: number }) => {
      const position = self.progress * archiveHeight;

      let index = 0;
      while (index + 1 < stops.length && position >= stops[index + 1]!.offset) index += 1;

      const current = stops[index]!;
      const next = stops[index + 1];

      if (!next) {
        for (const property of properties) {
          paintProperty(property, current.palette[property]);
        }
        return;
      }

      const span = Math.max(1, Math.min(ATMOSPHERE_FADE_PX, next.offset - current.offset));
      const blend = gsap.utils.clamp(0, 1, (position - (next.offset - span)) / span);

      for (const property of properties) {
        paintProperty(
          property,
          blend <= 0
            ? current.palette[property]
            : gsap.utils.interpolate(current.palette[property], next.palette[property], blend)
        );
      }
    };

    ScrollTrigger.create({
      trigger: archive,
      start: "top top",
      end: "bottom bottom",
      // Deterministic rather than tween-driven. A scrubbed timeline was tried
      // first and it only played forwards reliably: scrolling back to 3000 or
      // 20000 left the field on a later series' colour, because reversing a
      // chain of custom-property tweens under ScrollSmoother and an active pin
      // did not restore earlier states. Computing the blend from scroll position
      // has no history to get wrong — every offset resolves to one colour.
      onUpdate: paint,
      onRefresh: paint
    });
  }, page);
};

type ViewportRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const containedImageRect = (
  bounds: DOMRect,
  naturalWidth: number,
  naturalHeight: number
): ViewportRect | null => {
  if (bounds.width <= 0 || bounds.height <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return null;
  }

  const sourceRatio = naturalWidth / naturalHeight;
  const boundsRatio = bounds.width / bounds.height;
  const width = sourceRatio < boundsRatio ? bounds.height * sourceRatio : bounds.width;
  const height = sourceRatio < boundsRatio ? bounds.height : bounds.width / sourceRatio;

  return {
    top: bounds.top + (bounds.height - height) / 2,
    left: bounds.left + (bounds.width - width) / 2,
    width,
    height
  };
};

const renderedImageRect = (image: HTMLImageElement): ViewportRect | null =>
  containedImageRect(image.getBoundingClientRect(), image.naturalWidth, image.naturalHeight);

const thumbnailRect = (image: HTMLImageElement): ViewportRect | null => {
  const frame = image.closest<HTMLElement>(".collections-models__thumb");
  if (!frame) return null;
  return containedImageRect(frame.getBoundingClientRect(), image.naturalWidth, image.naturalHeight);
};

const productThumbnail = (code: string) => {
  for (const [element, product] of observedElements) {
    if (product.code !== code) continue;
    return element.querySelector<HTMLImageElement>(".collections-models__thumb img");
  }
  return null;
};

const setViewportRect = (element: HTMLElement, rect: ViewportRect) => {
  Object.assign(element.style, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });
};

const createFlipImage = (source: string, rect: ViewportRect) => {
  const image = document.createElement("img");
  image.dataset.collectionsFlipClone = "";
  image.src = source;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  image.draggable = false;
  Object.assign(image.style, {
    position: "fixed",
    display: "block",
    margin: "0",
    maxWidth: "none",
    maxHeight: "none",
    objectFit: "fill",
    pointerEvents: "none",
    transformOrigin: "center center",
    willChange: "transform, opacity",
    zIndex: "3"
  });
  setViewportRect(image, rect);
  document.body.append(image);
  return image;
};

const stopProductTransition = () => {
  productTimeline?.kill();
  productTimeline = null;
  cleanupProductTransition?.();
  cleanupProductTransition = null;
};

/**
 * The specimen header reads like an inventory tag, so the code and the running
 * number are scrambled into place rather than swapped. Vue has already written
 * the new text by the time this runs; the tween only re-rolls the same string,
 * so the DOM ends on exactly what Vue rendered.
 *
 * Kept to the two short spans on purpose: their character count is fixed, so the
 * scramble cannot change text width and cannot cost a reflow per frame.
 */
const scrambleSpecimenTag = () => {
  const shell = shellElement.value;
  if (!shell) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const tags = shell.querySelectorAll<HTMLElement>(".collections-specimen__head span");
  tags.forEach((tag, index) => {
    const finalText = tag.textContent ?? "";
    if (!finalText) return;

    gsap.to(tag, {
      duration: 0.34,
      ease: "none",
      overwrite: true,
      scrambleText: {
        text: finalText,
        chars: "0123456789",
        speed: 0.7,
        revealDelay: index * 0.04
      }
    });
  });
};

/**
 * Selection only paints the atmosphere when no scrub exists to own it. With motion
 * allowed the scroll-linked scrub is the single writer, and a second writer here
 * would fight it mid-transition.
 */
const syncAtmosphereToSelection = (seriesSlug: string) => {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (atmosphereTargetSlug === seriesSlug) return;
  transitionSeriesAtmosphere(seriesSlug, true);
};

/**
 * Scroll-driven selection. Deliberately does NOT await the specimen preload and
 * does NOT run FLIP — both are valuable for a deliberate click, both are harmful
 * once per scrolled row.
 *
 * Measured on the 169-row rail before this split: scrolling 15000→24000 fired all
 * 23 row triggers, yet the specimen panel updated only twice and stayed 11 rows
 * behind even 4s after the scroll stopped. The `await` below the click path broke
 * the selection chain, and a Chrome trace attributed 890ms of forced reflow in a
 * 2.39s scroll (42 FPS) to this function — Flip's getGlobalMatrix and
 * _getComputedProperty reading layout synchronously on every row.
 *
 * The specimen image is already warm here: warmSpecimenWindow keeps the immediate
 * neighbours preloaded, and scrolling always arrives at a row through its
 * neighbour, so the swap lands on a decoded image without waiting for one.
 */
const selectProductFromScroll = (product: DoorProduct) => {
  if (activeProduct.value.code === product.code) return;

  // Cancel any in-flight click transition; its await would otherwise resolve
  // later and overwrite this newer, scroll-owned selection.
  productSelectionId += 1;
  stopProductTransition();
  syncAtmosphereToSelection(product.seriesSlug);

  warmSpecimenWindow(product);
  activeProduct.value = product;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // The lens listeners are not re-attached here: `visual`, `lens` and the lens
  // image are stable elements, and updateBounds re-queries the specimen image on
  // every pointer move, so the existing binding already tracks the new product.
  void nextTick().then(() => {
    scrambleSpecimenTag();
    const image = shellElement.value?.querySelector<HTMLImageElement>(".collections-specimen__image");
    if (!image) return;
    gsap.fromTo(image, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: "power2.out" });
  });
};

const selectProduct = async (product: DoorProduct) => {
  if (activeProduct.value.code === product.code) return;

  syncAtmosphereToSelection(product.seriesSlug);

  const selectionId = ++productSelectionId;
  warmSpecimenWindow(product);
  await preloadSpecimen(specimenSource(product.image));
  if (selectionId !== productSelectionId) return;

  stopProductTransition();
  const previousProduct = activeProduct.value;
  const shell = shellElement.value;
  const previousImage = shell?.querySelector<HTMLImageElement>(".collections-specimen__image");
  const incomingThumbnail = productThumbnail(product.code);
  const outgoingThumbnail = productThumbnail(previousProduct.code);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const previousRect = previousImage ? renderedImageRect(previousImage) : null;
  const incomingRect = incomingThumbnail ? thumbnailRect(incomingThumbnail) : null;

  if (reduceMotion || !shell || !previousImage || !incomingThumbnail || !outgoingThumbnail || !previousRect || !incomingRect) {
    activeProduct.value = product;
    await nextTick();
    if (selectionId !== productSelectionId) return;

    const image = shell?.querySelector<HTMLImageElement>(".collections-specimen__image");
    const meta = shell?.querySelectorAll<HTMLElement>(
      ".collections-specimen__head, .collections-specimen__meta"
    );
    if (shell) attachSpecimenResponse(shell);
    scrambleSpecimenTag();
    if (!image || !meta?.length) return;

    const finishFallback = () => {
      gsap.set([image, ...meta], { clearProps: "opacity,visibility,transform" });
      if (cleanupProductTransition === finishFallback) cleanupProductTransition = null;
      if (productTimeline === fallbackTimeline) productTimeline = null;
    };
    const fallbackTimeline = gsap.timeline({ onComplete: finishFallback });
    cleanupProductTransition = finishFallback;
    productTimeline = fallbackTimeline;
    fallbackTimeline
      .fromTo(image, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "power3.out" })
      .fromTo(meta, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "power3.out" }, 0.02);
    return;
  }

  const incomingClone = createFlipImage(specimenSource(product.image), incomingRect);
  const outgoingClone = createFlipImage(previousImage.currentSrc || previousImage.src, previousRect);
  const hiddenElements = new Map<HTMLElement, string>();
  let transitionDisposed = false;
  let activeTransitionTimeline: ReturnType<typeof gsap.timeline> | null = null;
  let meta: HTMLElement[] = [];

  const hideElement = (element: HTMLElement) => {
    if (!hiddenElements.has(element)) hiddenElements.set(element, element.style.visibility);
    element.style.visibility = "hidden";
  };

  const finishTransition = () => {
    if (transitionDisposed) return;
    transitionDisposed = true;
    hiddenElements.forEach((visibility, element) => {
      element.style.visibility = visibility;
    });
    hiddenElements.clear();
    incomingClone.remove();
    outgoingClone.remove();
    if (meta.length) gsap.set(meta, { clearProps: "opacity,visibility,transform" });
    if (cleanupProductTransition === finishTransition) cleanupProductTransition = null;
    if (productTimeline === activeTransitionTimeline) productTimeline = null;
  };

  cleanupProductTransition = finishTransition;
  hideElement(previousImage);
  hideElement(incomingThumbnail);
  hideElement(outgoingThumbnail);
  const flipState = Flip.getState([incomingClone, outgoingClone], { props: "opacity" });

  activeProduct.value = product;
  await nextTick();
  if (selectionId !== productSelectionId || transitionDisposed) {
    finishTransition();
    return;
  }

  const activeImage = shell.querySelector<HTMLImageElement>(".collections-specimen__image");
  const outgoingTarget = thumbnailRect(outgoingThumbnail);
  const activeTarget = activeImage ? renderedImageRect(activeImage) : null;
  if (!activeImage || !activeTarget || !outgoingTarget) {
    finishTransition();
    attachSpecimenResponse(shell);
    return;
  }

  hideElement(activeImage);
  meta = [...shell.querySelectorAll<HTMLElement>(
    ".collections-specimen__head, .collections-specimen__meta"
  )];
  setViewportRect(incomingClone, activeTarget);
  setViewportRect(outgoingClone, outgoingTarget);
  attachSpecimenResponse(shell);
  scrambleSpecimenTag();

  const flipTimeline = Flip.from(flipState, {
    scale: true,
    simple: true,
    duration: 0.52,
    ease: "power2.inOut",
    onComplete: finishTransition
  });
  activeTransitionTimeline = flipTimeline;
  productTimeline = flipTimeline;
  flipTimeline
    .to(outgoingClone, { autoAlpha: 0, duration: 0.14, ease: "power2.out" }, 0.38)
    .fromTo(
      meta,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.02, ease: "power3.out" },
      0.24
    );
};

const attachSpecimenResponse = (shell: HTMLElement) => {
  detachSpecimenResponse?.();
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const visual = shell.querySelector<HTMLElement>(".collections-specimen__visual");
  const lens = shell.querySelector<HTMLElement>(".collections-specimen__lens");
  const lensImage = lens?.querySelector<HTMLImageElement>("img");
  if (!visual || !lens || !lensImage) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const zoom = 2.15;
  let visualBounds = visual.getBoundingClientRect();
  let imageBounds: DOMRect | null = null;
  let renderedImageBounds: { top: number; right: number; bottom: number; left: number; width: number; height: number } | null = null;
  let lensSize = lens.offsetWidth;
  let renderedWidth = 0;
  let renderedHeight = 0;
  let lensVisible = false;

  const updateBounds = () => {
    const image = visual.querySelector<HTMLImageElement>(".collections-specimen__image");
    visualBounds = visual.getBoundingClientRect();
    lensSize = lens.offsetWidth;
    imageBounds = image?.getBoundingClientRect() ?? null;
    renderedImageBounds = null;
    if (!image || !imageBounds || !image.naturalWidth || !image.naturalHeight) return;

    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = imageBounds.width / imageBounds.height;
    const width = sourceRatio < boxRatio ? imageBounds.height * sourceRatio : imageBounds.width;
    const height = sourceRatio < boxRatio ? imageBounds.height : imageBounds.width / sourceRatio;
    const left = imageBounds.left + (imageBounds.width - width) / 2;
    const top = imageBounds.top + (imageBounds.height - height) / 2;

    renderedImageBounds = {
      top,
      right: left + width,
      bottom: top + height,
      left,
      width,
      height
    };
    if (width !== renderedWidth || height !== renderedHeight) {
      renderedWidth = width;
      renderedHeight = height;
      gsap.set(lensImage, {
        width: width * zoom,
        height: height * zoom
      });
    }
  };

  const hideLens = () => {
    if (!lensVisible) return;
    lensVisible = false;
    if (reduceMotion) {
      gsap.set(lens, { autoAlpha: 0, scale: 1 });
      return;
    }
    gsap.to(lens, {
      autoAlpha: 0,
      scale: 0.96,
      duration: 0.12,
      ease: "power2.out",
      overwrite: true
    });
  };

  const hideLensForScroll = () => {
    if (!lensVisible) return;
    lensVisible = false;
    gsap.killTweensOf(lens);
    gsap.set(lens, { autoAlpha: 0, scale: 1 });
  };

  const onPointerMove = (event: PointerEvent) => {
    updateBounds();

    const bounds = renderedImageBounds;
    if (
      !bounds ||
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      hideLens();
      return;
    }

    const lensX = event.clientX - visualBounds.left - lensSize / 2;
    const lensY = event.clientY - visualBounds.top - lensSize / 2;
    const imageX = lensSize / 2 - (event.clientX - bounds.left) * zoom;
    const imageY = lensSize / 2 - (event.clientY - bounds.top) * zoom;

    gsap.set(lens, { x: lensX, y: lensY });
    gsap.set(lensImage, { x: imageX, y: imageY });

    if (lensVisible) return;
    lensVisible = true;
    if (reduceMotion) {
      gsap.set(lens, { autoAlpha: 1, scale: 1 });
      return;
    }
    gsap.fromTo(
      lens,
      { autoAlpha: 0, scale: 0.96 },
      { autoAlpha: 1, scale: 1, duration: 0.18, ease: "power3.out", overwrite: true }
    );
  };

  visual.addEventListener("pointerenter", updateBounds, { passive: true });
  visual.addEventListener("pointermove", onPointerMove, { passive: true });
  visual.addEventListener("pointerleave", hideLens, { passive: true });
  window.addEventListener("wheel", hideLensForScroll, { passive: true });
  window.addEventListener("scroll", hideLensForScroll, { passive: true });
  window.addEventListener("resize", updateBounds, { passive: true });
  detachSpecimenResponse = () => {
    visual.removeEventListener("pointerenter", updateBounds);
    visual.removeEventListener("pointermove", onPointerMove);
    visual.removeEventListener("pointerleave", hideLens);
    window.removeEventListener("wheel", hideLensForScroll);
    window.removeEventListener("scroll", hideLensForScroll);
    window.removeEventListener("resize", updateBounds);
    gsap.killTweensOf([lens, lensImage]);
    gsap.set(lens, { autoAlpha: 0, scale: 1 });
    detachSpecimenResponse = null;
  };
};

const scrollToSeries = (slug: string) => {
  const target = document.getElementById(`collections-series-${slug}`);
  if (!target) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smoother = ScrollSmoother.get();
  if (smoother && !reduceMotion) {
    smoother.scrollTo(target, true, "top top");
    return;
  }

  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
};

const setProductElement = (element: Element | null, product: DoorProduct) => {
  for (const [registeredElement, registeredProduct] of observedElements) {
    if (registeredProduct.code === product.code && registeredElement !== element) {
      thumbnailObserver?.unobserve(registeredElement);
      observedElements.delete(registeredElement);
    }
  }

  if (!element) return;
  observedElements.set(element, product);
  thumbnailObserver?.observe(element);
};

/**
 * Safety net for jumped scrolls — dragging the scrollbar, an in-page anchor, or
 * ScrollSmoother overshooting a target. Those can settle between two row
 * triggers, or land just past one without its neighbour ever entering, leaving
 * the specimen a row off. Reading `trigger.start` costs nothing: ScrollTrigger
 * resolved those offsets during its last refresh, so no layout is forced here.
 */
const convergeSelectionToScroll = () => {
  if (!productTriggerEntries.length) return;

  const scrollTop = ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
  let candidate: DoorProduct | null = null;
  let candidateStart = -Infinity;

  for (const { trigger, product } of productTriggerEntries) {
    if (trigger.start <= scrollTop && trigger.start > candidateStart) {
      candidateStart = trigger.start;
      candidate = product;
    }
  }

  if (candidate) selectProductFromScroll(candidate);
};

const scheduleConvergence = () => {
  if (convergenceTimer !== null) window.clearTimeout(convergenceTimer);
  convergenceTimer = window.setTimeout(() => {
    convergenceTimer = null;
    convergeSelectionToScroll();
  }, 160);
};

const rebuildProductSteps = () => {
  productStepContext?.revert();
  productStepContext = null;
  productTriggerEntries = [];

  const page = pageElement.value;
  if (!page) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rows = [...page.querySelectorAll<HTMLElement>("[data-collections-product]")];

  productStepContext = gsap.context(() => {
    rows.forEach((row) => {
      const product = observedElements.get(row);
      if (!product) return;

      const rowContent = row.querySelectorAll<HTMLElement>(
        ".collections-models__thumb, .collections-models__identity, .collections-models__material"
      );
      // fromTo, not to: a bare `to` makes GSAP read the start value off the DOM
      // the first time each of these 169 timelines plays, and that read lands
      // inside the scroll tick as a forced reflow. Stating x:0 explicitly keeps
      // the whole rail off the layout path.
      const stepTimeline = reduceMotion
        ? undefined
        : gsap.timeline({ paused: true }).fromTo(
            rowContent,
            { x: 0 },
            {
              x: 4,
              duration: 0.22,
              stagger: 0.025,
              ease: "power3.out"
            }
          );

      const rowTrigger = ScrollTrigger.create({
        id: `collections-product-${product.code}`,
        trigger: row,
        start: "center center",
        end: "bottom center",
        animation: stepTimeline,
        toggleActions: "play reverse play reverse",
        // No refreshPriority here, deliberately. `index + 1` used to order these
        // rows and ScrollTrigger sorts higher priority first, which reversed the
        // update order: getAll() returned the last row at position 0 and the
        // first row at position 168. Whenever one update crossed several rows the
        // callbacks then ran bottom-up, so the final say belonged to the topmost
        // row and the specimen settled behind the rail — 10 rows behind at
        // 300px/30ms, and it never caught up because nothing re-converged.
        onEnter: () => selectProductFromScroll(product),
        onEnterBack: () => selectProductFromScroll(product),
        onRefresh: (self) => {
          if (self.isActive) selectProductFromScroll(product);
        }
      });

      productTriggerEntries.push({ trigger: rowTrigger, product });
    });
  }, page);
};

const rebuildObserver = async () => {
  thumbnailObserver?.disconnect();
  productStepContext?.revert();
  productStepContext = null;
  observedElements.clear();
  await nextTick();

  document.querySelectorAll<HTMLElement>("[data-collections-product]").forEach((element) => {
    const product = props.products.find((item) => item.code === element.dataset.collectionsProduct);
    if (!product) return;
    observedElements.set(element, product);
    thumbnailObserver?.observe(element);
  });

  rebuildProductSteps();

  const firstVisibleProduct = filteredGroups.value[0]?.products[0];
  if (firstVisibleProduct && !filteredGroups.value.some((group) =>
    group.products.some((product) => product.code === activeProduct.value.code)
  )) {
    activeProduct.value = firstVisibleProduct;
  }

};

const rebuildArchiveReveals = () => {
  archiveRevealContext?.revert();
  const page = pageElement.value;
  if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  archiveRevealContext = gsap.context(() => {
    page.querySelectorAll<HTMLElement>(".collections-group").forEach((group) => {
      const heading = group.querySelector(".collections-group__head");
      gsap.timeline({
        scrollTrigger: {
          trigger: group,
          start: "top 84%",
          toggleActions: "play none none reverse"
        },
        defaults: { ease: "power3.out" }
      })
        .fromTo(heading, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.5 });
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: ".collections-closing",
        start: "top 80%",
        toggleActions: "play none none reverse"
      },
      defaults: { ease: "power3.out" }
    })
      .fromTo(
        ".collections-closing__statement",
        { autoAlpha: 0, y: 46 },
        { autoAlpha: 1, y: 0, duration: 0.72 }
      )
      .fromTo(
        ".collections-closing__stats > *",
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.05 },
        "<0.18"
      );
  }, page);
};

onMounted(async () => {
  transitionSeriesAtmosphere(activeProduct.value.seriesSlug, true);

  // Theme values live in CSS. Re-read them only when the root theme changes,
  // rather than polling inside the scroll path or duplicating theme state in JS.
  themeObserver = new MutationObserver(() => {
    // The scrub baked the old theme's colours into its fromTo values, so it has
    // to be rebuilt rather than refreshed before the field is repainted.
    transitionSeriesAtmosphere(atmosphereTargetSlug, true);
    rebuildAtmosphereScrub();
    ScrollTrigger.refresh();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  warmSpecimenWindow(activeProduct.value);

  thumbnailObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        queueThumbnail(entry.target as HTMLElement);
        thumbnailObserver?.unobserve(entry.target);
      }
    },
    {
      rootMargin: "900px 0px",
      threshold: 0
    }
  );

  await rebuildObserver();

  await nextTick();
  const page = pageElement.value;
  const archive = archiveElement.value;
  const shell = shellElement.value;
  if (!page || !archive || !shell) return;

  attachSpecimenResponse(shell);

  pageMotionContext = gsap.context(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".collections-hero__title span",
          { autoAlpha: 0, y: 74 },
          { autoAlpha: 1, y: 0, duration: 0.86, stagger: 0.1 }
        )
        .fromTo(
          ".collections-hero__eyebrow",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.46 },
          "<0.22"
        )
        .fromTo(
          ".collections-hero__foot > *",
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.06 },
          "<0.08"
        );

    }

    const series = shell.querySelector<HTMLElement>(".collections-series");
    const specimen = shell.querySelector<HTMLElement>(".collections-specimen");
    const image = shell.querySelector<HTMLElement>(".collections-specimen__image");
    const detail = shell.querySelectorAll<HTMLElement>(
      ".collections-series__list li, .collections-specimen__head, .collections-specimen__meta"
    );

    shellTimeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    if (reduceMotion) {
      shellTimeline.fromTo(
        [series, specimen],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.12 }
      );
    } else {
      shellTimeline
        .fromTo(series, { autoAlpha: 0, x: -36 }, { autoAlpha: 1, x: 0, duration: 0.56 })
        .fromTo(specimen, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.64 }, "<0.06")
        .fromTo(image, { scale: 0.955, y: 24 }, { scale: 1, y: 0, duration: 0.72 }, "<")
        .fromTo(
          detail,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.025 },
          "<0.12"
        );
    }

    ScrollTrigger.create({
      trigger: archive,
      start: "top 82%",
      end: "top top",
      animation: shellTimeline,
      toggleActions: "play none none reverse",
      refreshPriority: -1
    });

    archiveTrigger = ScrollTrigger.create({
      trigger: archive,
      start: "top top",
      end: "bottom bottom",
      pin: shell,
      pinSpacing: false,
      pinReparent: true,
      anticipatePin: 1,
      refreshPriority: 0
    });
  }, page);

  rebuildArchiveReveals();
  rebuildAtmosphereScrub();
  ScrollTrigger.refresh();

  window.addEventListener("scroll", scheduleConvergence, { passive: true });
});

watch(
  () => activeProduct.value.seriesSlug,
  (seriesSlug) => syncAtmosphereToSelection(seriesSlug)
);

watch(filteredGroups, () => {
  if (filterRefreshTimer !== null) window.clearTimeout(filterRefreshTimer);
  filterRefreshTimer = window.setTimeout(async () => {
    await rebuildObserver();
    rebuildArchiveReveals();
    // Filtering changes which series survive, so the boundaries the scrub is
    // pinned to move with them.
    rebuildAtmosphereScrub();
    ScrollTrigger.refresh();
    filterRefreshTimer = null;
  }, 90);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", scheduleConvergence);
  if (convergenceTimer !== null) window.clearTimeout(convergenceTimer);
  convergenceTimer = null;
  productTriggerEntries = [];
  if (filterRefreshTimer !== null) window.clearTimeout(filterRefreshTimer);
  filterRefreshTimer = null;
  if (thumbnailLoadTimer !== null) window.clearTimeout(thumbnailLoadTimer);
  thumbnailLoadTimer = null;
  thumbnailLoadQueue.length = 0;
  queuedThumbnailElements = new WeakSet<HTMLImageElement>();
  pageMotionContext?.revert();
  pageMotionContext = null;
  archiveRevealContext?.revert();
  archiveRevealContext = null;
  atmosphereScrubContext?.revert();
  atmosphereScrubContext = null;
  clearPaletteRoot();
  productStepContext?.revert();
  productStepContext = null;
  archiveTrigger = null;
  shellTimeline?.kill();
  shellTimeline = null;
  atmosphereTween?.kill();
  atmosphereTween = null;
  themeObserver?.disconnect();
  themeObserver = null;
  stopProductTransition();
  detachSpecimenResponse?.();
  thumbnailObserver?.disconnect();
  thumbnailObserver = null;
  observedElements.clear();
});
</script>

<template>
  <section
    id="main-content"
    ref="pageElement"
    class="collections-page"
    :data-desktop-message="copy.desktopOnly"
  >
    <header class="collections-hero">
      <div class="collections-hero__eyebrow" aria-hidden="true"></div>

      <h1 class="collections-hero__title">
        <span>{{ copy.titleTop }}</span>
        <span>{{ copy.titleBottom }}</span>
      </h1>

      <div class="collections-hero__foot">
        <p>{{ copy.intro }}</p>
        <a class="collections-hero__jump" href="#collections-archive">
          {{ copy.explore }}
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </header>

    <div id="collections-archive" ref="archiveElement" class="collections-archive">
      <div class="collections-series-slot" aria-hidden="true"></div>
      <div class="collections-specimen-slot" aria-hidden="true"></div>

      <div class="collections-shell-pin">
        <div ref="shellElement" class="collections-fixed-shell">
          <aside class="collections-series" :aria-label="copy.seriesIndex">
            <div class="collections-series__sticky">
          <p class="collections-label">{{ copy.seriesIndex }}</p>
          <ol class="collections-series__list">
            <li v-for="(family, index) in collectionFamilyGroups" :key="family.familySlug">
              <button
                type="button"
                :class="{ 'is-active': familyIncludesSeries(family.seriesSlugs, activeProduct.seriesSlug) }"
                @click="family.series[0] && scrollToSeries(family.series[0].slug)"
              >
                <span>{{ String(index + 1).padStart(2, "0") }}</span>
                <strong>{{ family.title[locale] }}</strong>
                <small>{{ family.productCount }}</small>
                <em>
                  {{ family.series.map((group) => localizedSeriesTitle(group.slug, group.title)).join(" · ") }}
                </em>
              </button>
            </li>
          </ol>

          <div class="collections-series__position" aria-hidden="true">
            <span :style="{ transform: `scaleX(${(currentCollectionFamilyIndex + 1) / collectionFamilyGroups.length})` }"></span>
          </div>
            </div>
          </aside>

          <article class="collections-specimen" aria-live="polite">
            <div class="collections-specimen__sticky">
          <header class="collections-specimen__head">
            <span>{{ activeProduct.code }}</span>
            <span>{{ copy.specimen }} {{ String(activeProductIndex + 1).padStart(3, "0") }}</span>
          </header>

          <div class="collections-specimen__visual">
              <img
                :key="activeProduct.code"
                class="collections-specimen__image"
                :src="specimenSource(activeProduct.image)"
                :alt="`${activeProduct.name} ${activeProduct.code}`"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            <span class="collections-specimen__lens" aria-hidden="true">
              <img
                :src="specimenSource(activeProduct.image)"
                alt=""
                draggable="false"
                decoding="async"
              >
            </span>
          </div>

          <footer class="collections-specimen__meta">
            <div>
              <p class="collections-label">{{ copy.selectedModel }}</p>
              <h2>{{ activeProduct.name }}</h2>
            </div>
            <dl>
              <div>
                <dt>{{ copy.series }}</dt>
                <dd>{{ localizedSeriesTitle(activeProduct.seriesSlug, activeProduct.seriesTitle) }}</dd>
              </div>
              <div>
                <dt>{{ copy.surface }}</dt>
                <dd>{{ localizedTechnicalText(activeProduct.surfaces[0]) }}</dd>
              </div>
            </dl>
            <NuxtLink :to="`/doors/${activeProduct.code}`" :prefetch="false">
              {{ copy.detail }}
              <span aria-hidden="true">↗</span>
            </NuxtLink>
          </footer>
            </div>
          </article>
        </div>
      </div>

      <CollectionsRail
        v-model:search-query="searchQuery"
        :groups="filteredGroups"
        :all-groups="seriesGroups"
        :active-product-code="activeProduct.code"
        :filtered-count="filteredCount"
        :total-count="products.length"
        :labels="railLabels"
        :thumbnail-source="thumbnailSource"
        :localize-series-title="localizedSeriesTitle"
        :localize-technical-text="localizedTechnicalText"
        :register-product-element="setProductElement"
        @select="selectProduct"
      />
    </div>

    <footer class="collections-closing">
      <p class="collections-label">{{ copy.closingLabel }}</p>
      <p class="collections-closing__statement">
        {{ copy.closingLineOne }}<br>
        {{ copy.closingLineTwo }}
      </p>
      <div class="collections-closing__stats">
        <span><strong>{{ products.length }}</strong> {{ copy.model }}</span>
        <span><strong>{{ collectionFamilyGroups.length }}</strong> {{ copy.materialSeries }}</span>
        <NuxtLink to="/contact">{{ copy.projectCta }} ↗</NuxtLink>
      </div>
    </footer>
  </section>
</template>

<style scoped>
/*
 * Arşivin altındaki zemin. Sayfa kendi zeminini boyuyor ama overscroll'da ve
 * sayfa yüksekliğinin bittiği yerde görünen katman <html>; orası site kremini
 * (--paper) gösteriyordu ve mavi arşivin altında krem şerit olarak sırıtıyordu.
 * Değişkenler atmosfer scrub'ı tarafından köke de yazılıyor (paintProperty), bu
 * yüzden zemin seriden seriye sayfayla BİRLİKTE kayıyor. Fallback ilk serinin
 * tonudur: scrub kurulmadan (reduced-motion, tek seri) da doğru renk basar.
 */
:global(html:has(.collections-page)),
:global(body:has(.collections-page)) {
  /* İkisi birden: reset.css ikisine de zemin veriyor ve body'nin zemini
     canvas'a devrolmuyor. !important zorunlu — themes/light.css
     `html, body, .app-shell, .app-shell--day { background-color: var(--paper) !important }`
     diyor. references.vue aynı çakışmayı aynı şekilde çözüyor.
     Fallback ilk serinin (Alüminyum Sistemler) gündüz tonu. */
  background: var(--collections-bg, #dfedf9) !important;
}

:global(html[data-theme="dark"]:has(.collections-page)),
:global(html[data-theme="dark"] body:has(.collections-page)) {
  /* Yalnızca fallback için: scrub kökü boyayana kadar geceyi krem/mavi
     yakalamasın. Değer ilk serinin gece tonu (--bg-deepest komşusu).
     Gece tarafında `html[data-theme="dark"] body` kuralı da !important. */
  background: var(--collections-bg, #010e1b) !important;
}

.collections-page {
  --collections-gutter: clamp(24px, 3.4vw, 64px);
  --collections-display-font: "PP Telegraf", "General Sans", Inter, system-ui, sans-serif;
  /*
   * Palette is bound to the project's navy contract, not to a separate mineral
   * scheme. Measured from base/tokens.css: --bg-navy, --card-bg, --accent and
   * the whole --brand-* ramp all sit at OKLCH hue ~272 — one family, three
   * altitudes. The seven series walk that hue from 245 to 315 (navy toward
   * violet) while lightness and chroma stay on the token bands:
   *
   *   night bg      L .158 C .036   next to --bg-main   (L .154 C .028)
   *   night surface L .246 C .066   next to --card-bg   (L .244 C .061)
   *   night accent  L .730 C .132   next to --accent    (L .735 C .137)
   *   day   accent  L .378 C .150   next to --brand-700 (L .365 C .151)
   *
   * So the archive reads as one chromatic journey rather than seven unrelated
   * swatches, and every stop is a sibling of the palette the rest of the site
   * already uses. Contrast was checked across all 14 combinations: worst text
   * on surface is 11.78:1 by day, 13.92:1 by night; worst accent on background
   * is 7.74:1 — all comfortably past AAA.
   *
   * Day values live here; the dark block below re-states the same hues on the
   * night bands. Closing section deliberately stays on the footer contract.
   */
  --collections-hero-bg: #d7ddef;
  --collections-hero-text: #161d3b;
  --collections-hero-accent: #2a3490;
  /* Aluminium systems — hue 245, the blue end of the walk */
  --collections-tone-aluminyum-sistemler-bg: #dfedf9;
  --collections-tone-aluminyum-sistemler-surface: #c9def1;
  --collections-tone-aluminyum-sistemler-text: #022239;
  --collections-tone-aluminyum-sistemler-accent: #00438a;
  /* Natural surfaces — hue 257 */
  --collections-tone-dogal-yuzeyler-bg: #e1ebfa;
  --collections-tone-dogal-yuzeyler-surface: #cdddf2;
  --collections-tone-dogal-yuzeyler-text: #0c203b;
  --collections-tone-dogal-yuzeyler-accent: #003c8f;
  /* Glazed models — hue 269, sitting on the token core */
  --collections-tone-camli-modeller-bg: #e4eafa;
  --collections-tone-camli-modeller-surface: #d2dbf3;
  --collections-tone-camli-modeller-text: #141e3b;
  --collections-tone-camli-modeller-accent: #233690;
  /* Metal and composite — hue 280 */
  --collections-tone-metal-kompozit-bg: #e7e9fa;
  --collections-tone-metal-kompozit-surface: #d6daf2;
  --collections-tone-metal-kompozit-text: #1b1c3a;
  --collections-tone-metal-kompozit-accent: #37308e;
  /* PVC and Laminox — hue 292 */
  --collections-tone-pvc-laminoks-bg: #eae8f9;
  --collections-tone-pvc-laminoks-surface: #dbd8f1;
  --collections-tone-pvc-laminoks-text: #211a39;
  --collections-tone-pvc-laminoks-accent: #472989;
  /* Bespoke architecture — hue 303 */
  --collections-tone-mimari-ozel-bg: #ede7f7;
  --collections-tone-mimari-ozel-surface: #e0d6ef;
  --collections-tone-mimari-ozel-text: #251836;
  --collections-tone-mimari-ozel-accent: #532381;
  /* Entrance and technical — hue 315, the violet end */
  --collections-tone-giris-teknik-bg: #f0e6f5;
  --collections-tone-giris-teknik-surface: #e4d5eb;
  --collections-tone-giris-teknik-text: #2a1632;
  --collections-tone-giris-teknik-accent: #5e1d77;
  --collections-bg: var(--collections-tone-aluminyum-sistemler-bg);
  --collections-surface: var(--collections-tone-aluminyum-sistemler-surface);
  --collections-text: var(--collections-tone-aluminyum-sistemler-text);
  --collections-accent: var(--collections-tone-aluminyum-sistemler-accent);
  --collections-body: color-mix(in oklch, var(--collections-text) 72%, var(--collections-bg));
  --collections-soft: color-mix(in oklch, var(--collections-text) 52%, var(--collections-bg));
  --collections-line: color-mix(in oklch, var(--collections-text) 18%, var(--collections-bg));
  --collections-closing-bg: var(--footer-dome);
  --collections-closing-text: var(--footer-dome-fg);
  --collections-closing-soft: var(--slab-soft);
  --collections-closing-line: var(--line);
  min-height: 100svh;
  overflow: clip;
  background: var(--collections-bg);
  color: var(--collections-text);
  font-family: "PP Mori", "General Sans", Inter, system-ui, sans-serif;
}

:global(html[data-theme="dark"] .collections-page) {
  /* Same seven hues, moved onto the night bands. The hero lands on #050714,
     which is --bg-deepest exactly — the archive opens on the site's own floor. */
  --collections-hero-bg: #050714;
  --collections-hero-text: #ebeef8;
  --collections-hero-accent: #8ba1fb;
  --collections-tone-aluminyum-sistemler-bg: #010e1b;
  --collections-tone-aluminyum-sistemler-surface: #00233e;
  --collections-tone-aluminyum-sistemler-text: #e8f0f7;
  --collections-tone-aluminyum-sistemler-accent: #58aff5;
  --collections-tone-dogal-yuzeyler-bg: #040d1c;
  --collections-tone-dogal-yuzeyler-surface: #09203f;
  --collections-tone-dogal-yuzeyler-text: #e9eff7;
  --collections-tone-dogal-yuzeyler-accent: #70a9fa;
  --collections-tone-camli-modeller-bg: #070c1c;
  --collections-tone-camli-modeller-surface: #141e40;
  --collections-tone-camli-modeller-text: #ebeef8;
  --collections-tone-camli-modeller-accent: #86a3fb;
  --collections-tone-metal-kompozit-bg: #0a0b1c;
  --collections-tone-metal-kompozit-surface: #1b1c3f;
  --collections-tone-metal-kompozit-text: #eceef7;
  --collections-tone-metal-kompozit-accent: #989df9;
  --collections-tone-pvc-laminoks-bg: #0d091b;
  --collections-tone-pvc-laminoks-surface: #22193d;
  --collections-tone-pvc-laminoks-text: #eeedf7;
  --collections-tone-pvc-laminoks-accent: #aa97f3;
  --collections-tone-mimari-ozel-bg: #100919;
  --collections-tone-mimari-ozel-surface: #27173a;
  --collections-tone-mimari-ozel-text: #f0edf6;
  --collections-tone-mimari-ozel-accent: #b992ec;
  --collections-tone-giris-teknik-bg: #130817;
  --collections-tone-giris-teknik-surface: #2c1536;
  --collections-tone-giris-teknik-text: #f2ecf5;
  --collections-tone-giris-teknik-accent: #c78de0;
  --collections-closing-soft: var(--text-soft);
}

.collections-label {
  margin: 0;
  color: var(--collections-soft);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.collections-hero {
  --collections-bg: var(--collections-hero-bg);
  --collections-text: var(--collections-hero-text);
  --collections-accent: var(--collections-hero-accent);
  --collections-body: color-mix(in oklch, var(--collections-hero-text) 72%, var(--collections-hero-bg));
  --collections-soft: color-mix(in oklch, var(--collections-hero-text) 52%, var(--collections-hero-bg));
  --collections-line: color-mix(in oklch, var(--collections-hero-text) 18%, var(--collections-hero-bg));
  display: flex;
  min-height: 96svh;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(150px, 15vw, 230px) var(--collections-gutter) clamp(48px, 6vw, 96px);
  border-bottom: 1px solid var(--collections-line);
  background: var(--collections-hero-bg);
  color: var(--collections-hero-text);
}

.collections-hero__eyebrow,
.collections-hero__foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.collections-hero__eyebrow span:last-child {
  color: var(--collections-soft);
}

.collections-hero__title {
  display: flex;
  margin: 0;
  flex-direction: column;
  font-family: var(--collections-display-font);
  font-size: clamp(112px, 18vw, 330px);
  font-weight: 500;
  letter-spacing: -0.065em;
  line-height: 0.68;
  text-transform: uppercase;
}

.collections-hero__title span:last-child {
  align-self: flex-end;
  color: var(--collections-accent);
}

.collections-hero__foot {
  align-items: flex-end;
  text-transform: none;
}

.collections-hero__foot p {
  max-width: 490px;
  margin: 0;
  color: var(--collections-body);
  font-size: clamp(16px, 1.25vw, 21px);
  letter-spacing: -0.02em;
  line-height: 1.45;
}

.collections-hero__jump {
  display: inline-flex;
  min-width: 170px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--collections-text);
  color: inherit;
  text-decoration: none;
}

.collections-archive {
  display: grid;
  grid-template-columns: minmax(190px, 2fr) minmax(540px, 7fr) minmax(360px, 3fr);
  align-items: stretch;
  border-bottom: 1px solid var(--collections-line);
}

.collections-series-slot {
  grid-column: 1;
  grid-row: 1;
}

.collections-specimen-slot {
  grid-column: 2;
  grid-row: 1;
}

.collections-series-slot,
.collections-specimen-slot {
  min-width: 0;
  border-right: 1px solid var(--collections-line);
}

.collections-shell-pin {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100svh;
  grid-column: 1 / 3;
  grid-row: 1;
  align-self: start;
}

.collections-fixed-shell {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: 2fr 7fr;
  color: var(--collections-text);
  font-family: inherit;
  pointer-events: none;
}

.collections-series,
.collections-specimen {
  min-width: 0;
  border-right: 1px solid var(--collections-line);
  pointer-events: auto;
}

.collections-series__sticky,
.collections-specimen__sticky {
  height: 100svh;
  box-sizing: border-box;
}

.collections-series__sticky {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(124px, 9vw, 160px) clamp(20px, 2vw, 40px) 42px;
}

.collections-series__list {
  display: flex;
  margin: auto 0;
  padding: 0;
  flex-direction: column;
  list-style: none;
}

.collections-series__list button {
  display: grid;
  width: 100%;
  grid-template-columns: 28px 1fr auto;
  align-items: baseline;
  gap: 8px;
  padding: 13px 0;
  border: 0;
  border-bottom: 1px solid var(--collections-line);
  background: transparent;
  color: var(--collections-soft);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: color 180ms var(--ease-out);
}

.collections-series__list button:hover,
.collections-series__list button.is-active {
  color: var(--collections-text);
}

.collections-series__list button span,
.collections-series__list button small {
  font-size: 10px;
  font-weight: 500;
}

.collections-series__list button strong {
  font-size: 12px;
  font-weight: 500;
}

.collections-series__list button em {
  grid-column: 2 / -1;
  color: var(--collections-soft);
  font-size: 9px;
  font-style: normal;
  line-height: 1.35;
}

.collections-series__position {
  height: 1px;
  overflow: hidden;
  background: var(--collections-line);
}

.collections-series__position span {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left;
  background: var(--collections-accent);
  transition: transform 320ms var(--ease-out);
}

.collections-specimen__sticky {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: clamp(118px, 8.5vw, 150px) clamp(26px, 3vw, 58px) 34px;
  background: var(--collections-surface);
}

.collections-specimen__head {
  display: flex;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--collections-line);
  color: var(--collections-soft);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.collections-specimen__visual {
  position: relative;
  display: grid;
  min-height: 0;
  place-items: center;
  overflow: hidden;
}

.collections-specimen__image {
  position: relative;
  display: block;
  width: min(72%, 620px);
  height: 92%;
  max-height: 64svh;
  object-fit: contain;
}

.collections-specimen__lens {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  width: clamp(132px, 11vw, 176px);
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--collections-soft);
  border-radius: var(--radius-full);
  background: var(--collections-surface);
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  will-change: transform, opacity;
}

.collections-specimen__lens img {
  position: absolute;
  display: block;
  max-width: none;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  will-change: transform;
}

.collections-specimen__meta {
  display: grid;
  grid-template-columns: minmax(150px, 1.2fr) minmax(240px, 1fr) auto;
  align-items: end;
  gap: 26px;
  padding-top: 18px;
  border-top: 1px solid var(--collections-line);
}

.collections-specimen__meta h2 {
  margin: 4px 0 0;
  font-family: var(--collections-display-font);
  font-size: clamp(34px, 3vw, 56px);
  font-weight: 500;
  letter-spacing: -0.035em;
  line-height: 0.95;
}

.collections-specimen__meta dl {
  display: grid;
  margin: 0;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.collections-specimen__meta dt {
  margin-bottom: 4px;
  color: var(--collections-soft);
  font-size: 9px;
  text-transform: uppercase;
}

.collections-specimen__meta dd {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
}

.collections-specimen__meta a {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--collections-text);
  color: inherit;
  font-size: 11px;
  text-decoration: none;
  white-space: nowrap;
}

.collections-series__list button:focus-visible,
.collections-hero__jump:focus-visible,
.collections-specimen__meta a:focus-visible,
.collections-closing__stats a:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}

.collections-closing {
  min-height: 88svh;
  padding: clamp(112px, 12vw, 210px) var(--collections-gutter) 64px;
  background: var(--collections-closing-bg);
  color: var(--collections-closing-text);
}

.collections-closing .collections-label {
  color: var(--collections-closing-soft);
}

.collections-closing__statement {
  margin: clamp(90px, 11vw, 190px) 0;
  font-family: var(--collections-display-font);
  font-size: clamp(64px, 9vw, 172px);
  font-weight: 500;
  letter-spacing: -0.055em;
  line-height: 0.85;
  text-transform: uppercase;
}

.collections-closing__stats {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: end;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--collections-closing-line);
  color: var(--collections-closing-soft);
  font-size: 12px;
}

.collections-closing__stats span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collections-closing__stats strong {
  color: var(--collections-closing-text);
  font-size: 30px;
  font-weight: 500;
}

.collections-closing__stats a {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--collections-closing-text);
  color: var(--collections-closing-text);
  text-decoration: none;
}

@media (max-width: 1180px) {
  .collections-archive {
    grid-template-columns: 170px minmax(460px, 1fr) 340px;
  }

  .collections-fixed-shell {
    width: 100%;
    grid-template-columns: 170px minmax(460px, 1fr);
  }

  .collections-specimen__meta {
    grid-template-columns: 1fr auto;
  }

  .collections-specimen__meta dl {
    display: none;
  }

}

@media (max-width: 900px) {
  .collections-page::before {
    display: block;
    min-height: 100svh;
    box-sizing: border-box;
    padding: 160px 24px 48px;
    color: var(--collections-text);
    font-family: var(--collections-display-font);
    font-size: 56px;
    line-height: 0.92;
    text-transform: uppercase;
    content: attr(data-desktop-message);
  }

  .collections-hero,
  .collections-archive,
  .collections-closing {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .collections-series__position span {
    transition: none;
  }
}
</style>
