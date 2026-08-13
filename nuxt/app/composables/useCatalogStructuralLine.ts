import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Katalog bölümünün sol kenarındaki YAPI ÇİZGİSİ.
 *
 * 01 düğümünden 05 düğümüne inen dikey SVG çizgisi; scroll ilerledikçe SVG
 * kırpma alanıyla "çiziliyormuş" gibi uzuyor. Çizginin ucu bir düğüme
 * vardığında o düğüm belirginleşiyor. Uç noktaya varınca sayfa başlığındaki
 * çizgiyle birleştiğini bildiren global bir olay yayıyor
 * (`kardoor:heading-line-connected`).
 *
 * Neden ayrı dosya: geometri (viewBox, düğüm merkezleri, path uzunluğu),
 * ScrollTrigger yaşam döngüsü, font-hazır gecikmesi ve iki ayrı debounce
 * HomeCatalog.vue'nun içine dağılmıştı — üç fonksiyonu onMounted'dan,
 * biri resize'dan, ikisi satır açılışından çağrılıyordu. Çizginin katalog
 * verisiyle hiç ilişkisi yok; yalnız bölümün ve satırların GEOMETRİSİNİ
 * okuyor.
 *
 * Sahiplik: burası çizginin nasıl ölçülüp çizileceğini bilir. Bileşen
 * yalnız "satır açıldı, yeniden ölç" (`scheduleRefresh`) der.
 */

/** Çizginin soldan uzaklığı: 2.1875vw, 18-42px arasına kıstırılmış. */
const lineXFor = (viewportWidth: number) =>
  Math.min(Math.max(viewportWidth * 0.021875, 18), 42);

/** İlk satırın üstünden bırakılan pay: 1.2vh, 8-16px arasında. */
const topPaddingFor = (viewportHeight: number) =>
  Math.min(Math.max(viewportHeight * 0.012, 8), 16);

/** Satır ölçülemezse kullanılan yedek başlangıç: 14vh, 120-170px arasında. */
const fallbackStartFor = (viewportHeight: number) =>
  Math.min(Math.max(viewportHeight * 0.14, 120), 170);

/**
 * Satır açılışı çizgi geometrisini değiştirir (v-if ile mount olan satır
 * kabı büyütür). Art arda gelen açılışları tek ölçüme indirir.
 */
const REVEAL_DEBOUNCE_MS = 180;

/** Genişlik değişiminde yeniden ölçüm gecikmesi. */
const RESIZE_DEBOUNCE_MS = 160;

/**
 * Fontlar yüklendikten sonra çizgiyi göstermeden önce beklenen ek süre.
 * REVEAL_DEBOUNCE_MS'ten uzun olmalı: bekleyen bir satır-açılış ölçümü
 * varsa o tamamlansın, yoksa çizgi görünür olur ve hemen ardından gelen
 * ölçüm startY/endY'yi kaydırıp gözle görülür bir sıçrama yaratır.
 */
const REVEAL_SETTLE_MS = 220;

const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1);

export interface CatalogLineTargets {
  /** Çizginin içine çizileceği bölüm. */
  section: Ref<HTMLElement | null>;
  /** Satır elemanları — ilki başlangıcı, sonuncusu bitişi belirler. */
  rows: Ref<HTMLElement[]>;
}

export const useCatalogStructuralLine = (targets: CatalogLineTargets) => {
  const svgRef = ref<SVGSVGElement | null>(null);
  const pathRef = ref<SVGPathElement | null>(null);
  const clipRectRef = ref<SVGRectElement | null>(null);

  let trigger: ScrollTrigger | null = null;
  let pathLength = 0;
  let pathStartY = 0;
  let nodeThresholds: Array<{ element: SVGGElement; progress: number }> = [];
  let headingLineConnected = false;
  let refreshTimer = 0;
  let revealAllowed = false;
  let lastWidth = import.meta.client ? window.innerWidth : 0;

  const connectedRows = (section: HTMLElement) =>
    targets.rows.value
      .filter((row) => row.isConnected && row.closest(".catalog-section") === section)
      .sort(
        (left, right) =>
          Number(left.dataset.rowIndex ?? 0) - Number(right.dataset.rowIndex ?? 0)
      );

  /** Transform animasyonlarını hesaba katmadan bir elemanın bölüm içindeki merkezi. */
  const elementCenterY = (element: HTMLElement, section: HTMLElement) => {
    let y = element.offsetHeight / 2;
    let current: HTMLElement | null = element;

    while (current && current !== section) {
      y += current.offsetTop;
      current = current.offsetParent as HTMLElement | null;
    }

    if (current === section) return y;

    const elementRect = element.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    return elementRect.top - sectionRect.top + elementRect.height / 2;
  };

  const updateGeometry = () => {
    const section = targets.section.value;
    const svg = svgRef.value;
    const path = pathRef.value;
    const clipRect = clipRectRef.value;

    if (!section || !svg || !path || !clipRect) return;

    const sectionRect = section.getBoundingClientRect();
    const rows = connectedRows(section);
    const nodes = Array.from(
      svg.querySelectorAll<SVGGElement>(".catalog-structural-line-node")
    ).sort(
      (left, right) =>
        Number(left.dataset.rowIndex ?? 0) - Number(right.dataset.rowIndex ?? 0)
    );
    const nodeByIndex = new Map(
      nodes.map((node) => [Number(node.dataset.rowIndex ?? 0), node] as const)
    );

    const width = sectionRect.width;
    const height = sectionRect.height;
    const lineX = lineXFor(window.innerWidth);
    const measuredNodes = rows.flatMap((row) => {
      const index = Number(row.dataset.rowIndex ?? 0);
      const node = nodeByIndex.get(index);
      if (!node) return [];

      const heading = row.querySelector<HTMLElement>(".catalog-product-family");
      const y = heading
        ? elementCenterY(heading, section)
        : row.offsetTop + topPaddingFor(window.innerHeight);

      node.setAttribute("transform", `translate(${lineX} ${y})`);
      return [{ element: node, y }];
    });
    const startY = measuredNodes[0]?.y ?? fallbackStartFor(window.innerHeight);
    const endY = Math.max(startY, measuredNodes[measuredNodes.length - 1]?.y ?? height);

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    path.setAttribute("d", `M ${lineX} ${startY} V ${endY}`);
    clipRect.setAttribute("width", `${width}`);

    pathLength = path.getTotalLength();
    pathStartY = startY;
    nodeThresholds = measuredNodes.map(({ element, y }) => ({
      element,
      progress: pathLength ? clampProgress((y - pathStartY) / pathLength) : 0
    }));
    clipRect.setAttribute("height", `${pathStartY}`);
  };

  const draw = (progress: number) => {
    const clipRect = clipRectRef.value;
    if (!clipRect || !pathLength) return;

    const value = clampProgress(progress);
    clipRect.setAttribute("height", `${pathStartY + pathLength * value}`);
    nodeThresholds.forEach(({ element, progress: threshold }) => {
      element.classList.toggle("is-reached", value + 0.001 >= threshold);
    });

    // Histerezis (0.965 bağlan / 0.82 kop): tek eşik olsaydı sınırda gidip
    // gelen scroll olayı bağlan/kop olaylarını sürekli tetiklerdi.
    if (value >= 0.965 && !headingLineConnected) {
      headingLineConnected = true;
      window.dispatchEvent(new CustomEvent("kardoor:heading-line-connected"));
    } else if (value < 0.82 && headingLineConnected) {
      headingLineConnected = false;
      window.dispatchEvent(new CustomEvent("kardoor:heading-line-reset"));
    }
  };

  // Çizgiyi bölümün eski toplam yüksekliğine göre değil, mevcut ilk ve son
  // katalog satırına göre sür. Böylece katalog 01–07'den 01–05'e indiğinde
  // progress aralığı geride kalan iki satırı hesaba katmaz; çizginin ucu da
  // viewport'un okuma bandında kalır.
  //   progress 0: 01 satırının üstü viewport'un %85'inde
  //   progress 1: 05 satırının altı viewport'un %55'inde
  const buildTrigger = () => {
    const section = targets.section.value;
    if (!section) return;

    const rows = connectedRows(section);
    const firstRow = rows[0];
    const finalRow = rows[rows.length - 1];
    if (!firstRow || !finalRow) return;

    trigger?.kill();
    trigger = ScrollTrigger.create({
      trigger: firstRow,
      endTrigger: finalRow,
      start: "top 85%",
      end: "bottom 55%",
      onUpdate: (self) => draw(self.progress),
      onRefresh: (self) => draw(self.progress),
      onLeave: () => draw(1),
      onLeaveBack: () => draw(0)
    });
  };

  const refresh = () => {
    updateGeometry();
    buildTrigger();

    if (trigger) draw(trigger.progress);

    // Görünürlük yalnız fontlar hazır olduktan sonra. Path o ana kadar gizli
    // kaldığı için, erken satır-açılışlarının yol açtığı geometri değişimleri
    // (v-if ile mount olan satırlar kabı büyütür, startY/endY kayar) çizgi
    // görünmezken uygulanır — gözle görülür bir sıçrama olmaz.
    if (revealAllowed) svgRef.value?.classList.add("is-line-ready");
  };

  const runRefreshOnNextFrame = () => {
    nextTick(() => window.requestAnimationFrame(refresh));
  };

  /** Satır açıldı: geometri değişti, yeniden ölç (debounce'lu). */
  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      refreshTimer = 0;
      runRefreshOnNextFrame();
    }, REVEAL_DEBOUNCE_MS);
  };

  const allowReveal = () => {
    window.setTimeout(() => {
      revealAllowed = true;
      runRefreshOnNextFrame();
    }, REVEAL_SETTLE_MS);
  };

  // Genişlik değişmediyse hiçbir şey yapma: mobil tarayıcılarda adres çubuğu
  // gizlenince yükseklik-only resize akışı geliyor (scroll jank suçlularından
  // biri — bkz. memory: mobil-scroll-jank).
  const onResize = () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;

    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      refreshTimer = 0;
      refresh();
    }, RESIZE_DEBOUNCE_MS);
  };

  onMounted(() => {
    nextTick(() => window.requestAnimationFrame(refresh));

    if (document.fonts?.ready) {
      document.fonts.ready.then(allowReveal).catch(allowReveal);
    } else {
      // Fonts API yoksa: bir sonraki karede izin ver, geometri yine de otursun.
      requestAnimationFrame(allowReveal);
    }

    window.addEventListener("resize", onResize, { passive: true });
  });

  onBeforeUnmount(() => {
    trigger?.kill();
    trigger = null;

    window.clearTimeout(refreshTimer);
    refreshTimer = 0;

    window.removeEventListener("resize", onResize);
    // Başlık çizgisi bağlı kalmasın: bu bölüm gidiyor.
    window.dispatchEvent(new CustomEvent("kardoor:heading-line-reset"));
  });

  return { svgRef, pathRef, clipRectRef, scheduleRefresh, refresh };
};
