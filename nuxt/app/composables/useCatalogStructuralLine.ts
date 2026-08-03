import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Katalog bölümünün sol kenarındaki YAPI ÇİZGİSİ.
 *
 * İlk satırın üstünden son satırın altına inen dikey SVG çizgisi; scroll
 * ilerledikçe stroke-dashoffset ile "çiziliyormuş" gibi uzuyor. Uç noktaya
 * varınca sayfa başlığındaki çizgiyle birleştiğini bildiren global bir olay
 * yayıyor (`kardoor:heading-line-connected`).
 *
 * Neden ayrı dosya: geometri (viewBox, gradient uçları, path uzunluğu),
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
  const gradientRef = ref<SVGLinearGradientElement | null>(null);

  let trigger: ScrollTrigger | null = null;
  let pathLength = 0;
  let headingLineConnected = false;
  let refreshTimer = 0;
  let revealAllowed = false;
  let lastWidth = import.meta.client ? window.innerWidth : 0;

  const updateGeometry = () => {
    const section = targets.section.value;
    const svg = svgRef.value;
    const path = pathRef.value;
    const gradient = gradientRef.value;

    if (!section || !svg || !path) return;

    const sectionRect = section.getBoundingClientRect();
    const rows = targets.rows.value;
    const firstRowRect = rows[0]?.getBoundingClientRect();
    const finalRowRect = rows[rows.length - 1]?.getBoundingClientRect();

    const width = sectionRect.width;
    const height = sectionRect.height;
    const lineX = lineXFor(window.innerWidth);
    const startY = firstRowRect
      ? firstRowRect.top - sectionRect.top + topPaddingFor(window.innerHeight)
      : fallbackStartFor(window.innerHeight);
    const endY = finalRowRect
      ? Math.max(startY, finalRowRect.bottom - sectionRect.top)
      : height;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (gradient) {
      gradient.setAttribute("x1", `${lineX}`);
      gradient.setAttribute("x2", `${lineX}`);
      gradient.setAttribute("y1", `${startY}`);
      gradient.setAttribute("y2", `${endY}`);
    }
    path.setAttribute("d", `M ${lineX} ${startY} V ${endY}`);

    pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength}`;
    path.style.strokeDashoffset = `${pathLength}`;
  };

  const draw = (progress: number) => {
    const path = pathRef.value;
    if (!path || !pathLength) return;

    const value = clampProgress(progress);
    path.style.strokeDashoffset = `${pathLength * (1 - value)}`;

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

  // Çizgiyi GSAP ScrollTrigger'dan sür: ScrollSmoother'ın yumuşatılmış
  // playhead'iyle AYNI kaynağı örneklemesi için. Eski motor ham (yumuşatılmamış)
  // window.scrollY'yi manuel bir rAF döngüsünde okuyordu; çizgi gecikmeli
  // içerikle yarışıyor ve takılıyormuş gibi görünüyordu.
  //   progress 0: bölümün üstü viewport'un %20'sinde
  //   progress 1: bölümün altı viewport'un %28'inde
  const buildTrigger = () => {
    const section = targets.section.value;
    if (!section) return;

    trigger?.kill();
    trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 20%",
      end: "bottom 28%",
      onUpdate: (self) => draw(self.progress),
      onRefresh: (self) => draw(self.progress),
      onLeave: () => draw(1),
      onLeaveBack: () => draw(0)
    });
  };

  const refresh = () => {
    updateGeometry();

    if (trigger) trigger.refresh();
    else buildTrigger();

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

  return { svgRef, pathRef, gradientRef, scheduleRefresh, refresh };
};
