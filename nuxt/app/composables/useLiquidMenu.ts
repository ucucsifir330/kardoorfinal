import { onBeforeUnmount, ref } from "vue";

/**
 * Katalog kartlarının sağ kenarındaki SIVI MENÜ.
 *
 * Kartın kenarında duran ince bir SVG şerit; imleç yaklaşınca kenar bir
 * damla gibi imlece doğru uzuyor, hamburger ikonu onunla birlikte kayıyor.
 * Tıklayınca menü açılıyor ve şerit dinlenme şekline dönüyor.
 *
 * Neden ayrı dosya: bu 197 satır HomeCatalog.vue'nun içindeydi ve dosyanın
 * en yoğun parçasıydı — kendi rAF döngüsü, kendi easing fonksiyonu, kendi
 * fizik durumu (7 modül seviyesi değişken) ve beş ayrı olay işleyicisi var.
 * Katalogla tek ilişkisi kartın kenarında yaşaması; satır açma, modal ya da
 * ürün verisiyle hiç konuşmuyor. Kendi sahibine taşındı.
 *
 * Sahiplik: burası şeridin GEOMETRİSİNİ ve fiziğini bilir, kartın ne
 * olduğunu bilmez. Bileşen `id` verir (kart başına benzersiz), karşılığında
 * ref-toplayıcıları ve olay işleyicilerini alır.
 *
 * NOT: rAF döngüsü yalnız bir kart aktifken (`activeCard`) çalışır ve
 * pointer ayrılınca `cancelAnimationFrame` ile durur — bekleyen kartlar için
 * boşta dönen döngü YOK.
 */

/** Şeridin dinlenme genişliği (px). Hover'da bu değerden uzuyor. */
const BLOB_BASE_WIDTH = 60;
/** İmlece doğru uzayabileceği ek mesafe (px). */
const BLOB_HOVER_WIDTH = 34;
/** İmlecin şeridi tam çekmesi için gereken yatay mesafe (px). */
const PULL_DISTANCE = 72;
/** Kartın sağ kenarından bu uzaklığı geçince açık menü kapanır (px). */
const CARD_DISMISS_DISTANCE = 320;

const restPath = (height: number) =>
  `M${BLOB_BASE_WIDTH},${height} H0 V0 h${BLOB_BASE_WIDTH} V${height} z`;

const clampPull = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * Robert Penner'ın easeOutExpo'su. Kare sayısıyla sürülür (süreyle değil):
 * hedef her karede değişebildiği için (imleç hareket ediyor) zaman tabanlı
 * bir tween burada işe yaramaz.
 */
const easeOutExpo = (
  currentIteration: number,
  startValue: number,
  changeInValue: number,
  totalIterations: number
) =>
  changeInValue * (-Math.pow(2, (-10 * currentIteration) / totalIterations) + 1) +
  startValue;

export const useLiquidMenu = () => {
  const activeCard = ref<string | null>(null);
  const expanded = ref<Record<string, boolean>>({});

  const blobPaths = ref<Record<string, SVGPathElement>>({});
  const blobContainers = ref<Record<string, SVGSVGElement>>({});
  const hamburgers = ref<Record<string, HTMLElement>>({});

  const setBlobPathRef = (el: any, id: string) => {
    if (el) blobPaths.value[id] = el as SVGPathElement;
  };
  const setBlobContainerRef = (el: any, id: string) => {
    if (el) blobContainers.value[id] = el as SVGSVGElement;
  };
  const setHamburgerRef = (el: any, id: string) => {
    if (el) hamburgers.value[id] = el as HTMLElement;
  };

  // Fizik durumu. Reactive DEĞİL bilerek: her karede yazılıyor, Vue'nun
  // değişiklik takibine sokmak boşa maliyet olurdu.
  let raf: number | null = null;
  let pointerX = 0;
  let pointerY = 0;
  let pull = 0;
  let curveX = BLOB_BASE_WIDTH;
  let curveY = 0;
  let targetX = 0;
  let xIter = 0;
  let yIter = 0;
  let height = 190;

  const stopLoop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  };

  const resetShape = (id: string) => {
    const path = blobPaths.value[id];
    const container = blobContainers.value[id];
    const hamburger = hamburgers.value[id];
    const currentHeight = container?.getBoundingClientRect().height || height;

    pull = 0;
    if (path) path.setAttribute("d", restPath(currentHeight));
    if (container) container.style.width = `${BLOB_BASE_WIDTH}px`;
    if (hamburger) {
      hamburger.style.setProperty("--hamburger-shift", "0px");
      hamburger.style.setProperty("--hamburger-lift", "0px");
    }
  };

  const tick = () => {
    if (!activeCard.value) {
      raf = null;
      return;
    }

    const id = activeCard.value;
    const path = blobPaths.value[id];
    const container = blobContainers.value[id];
    const hamburger = hamburgers.value[id];

    if (!path || !container || !hamburger) {
      raf = requestAnimationFrame(tick);
      return;
    }

    if (expanded.value[id]) {
      resetShape(id);
      raf = null;
      return;
    }

    targetX = BLOB_BASE_WIDTH + BLOB_HOVER_WIDTH * pull;

    // Hedefe yaklaşınca sayaç sıfırlanır: easing eğrisi her yeni hedefte
    // baştan başlasın, yoksa hareket giderek donuklaşır.
    if (Math.abs(curveX - targetX) < 1) xIter = 0;
    else xIter++;

    if (Math.abs(curveY - pointerY) < 1) yIter = 0;
    else yIter++;

    curveX = easeOutExpo(xIter, curveX, targetX - curveX, 100);
    curveY = easeOutExpo(yIter, curveY, pointerY - curveY, 100);

    const anchorDistance = Math.min(76, Math.max(62, height * 0.34));
    const curviness = anchorDistance * 0.56;
    const safeCurveY = Math.min(
      Math.max(curveY, anchorDistance),
      height - anchorDistance
    );
    const shoulderTop = safeCurveY - anchorDistance;
    const shoulderBottom = safeCurveY + anchorDistance;

    const newCurve = `M0,0H${BLOB_BASE_WIDTH}V${shoulderTop}C${BLOB_BASE_WIDTH},${shoulderTop + curviness} ${curveX},${safeCurveY - curviness} ${curveX},${safeCurveY}C${curveX},${safeCurveY + curviness} ${BLOB_BASE_WIDTH},${shoulderBottom - curviness} ${BLOB_BASE_WIDTH},${shoulderBottom}V${height}H0Z`;

    path.setAttribute("d", newCurve);
    container.style.width = `${Math.max(BLOB_BASE_WIDTH, curveX)}px`;

    // Hamburger şeritle birlikte kayar: uzama oranı ikonun kaymasına eşlenir.
    const curvePull = clampPull((curveX - BLOB_BASE_WIDTH) / BLOB_HOVER_WIDTH);
    hamburger.style.setProperty("--hamburger-shift", `${curvePull * 11}px`);
    hamburger.style.setProperty("--hamburger-lift", `${curvePull * -0.8}px`);

    raf = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onZoneMouseMove = (e: MouseEvent, id: string) => {
    if (expanded.value[id]) {
      resetShape(id);
      return;
    }

    const target = e.currentTarget as HTMLElement;
    const container = blobContainers.value[id];
    const hamburger = hamburgers.value[id];
    if (!container) return;

    const blobRect = container.getBoundingClientRect();
    // Çekim merkezi hamburger ikonu; yoksa hover bölgesinin ortası.
    const centerX = hamburger
      ? hamburger.getBoundingClientRect().left +
        hamburger.getBoundingClientRect().width / 2
      : target.getBoundingClientRect().left +
        target.getBoundingClientRect().width / 2;

    pointerX = e.clientX - centerX;
    pull = clampPull(pointerX / PULL_DISTANCE);
    pointerY = Math.max(0, Math.min(blobRect.height, e.clientY - blobRect.top));
    height = blobRect.height;

    // Başka bir karttan geçildiyse fiziği sıfırdan kur: eski kartın eğrisi
    // yeni karta miras kalmasın.
    if (activeCard.value !== id) {
      activeCard.value = id;
      curveY = pointerY;
      xIter = 0;
      yIter = 0;
      curveX = BLOB_BASE_WIDTH;
    }

    startLoop();
  };

  const onZoneEnter = (id: string, e: MouseEvent) => {
    if (expanded.value[id]) {
      resetShape(id);
      return;
    }

    activeCard.value = id;
    const container = blobContainers.value[id];

    if (container) {
      const rect = container.getBoundingClientRect();
      height = rect.height;
      pointerY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      curveY = pointerY;
    }

    xIter = 0;
    yIter = 0;
    pull = 0;
    curveX = BLOB_BASE_WIDTH;

    startLoop();
  };

  const onZoneLeave = (id: string) => {
    if (activeCard.value !== id) return;

    activeCard.value = null;
    stopLoop();
    resetShape(id);
  };

  const toggle = (id: string) => {
    expanded.value[id] = !expanded.value[id];

    if (expanded.value[id]) {
      activeCard.value = id;
      stopLoop();
      resetShape(id);
    }
  };

  const onZoneClick = (e: MouseEvent, id: string) => {
    // Menü içeriğine yapılan tıklama menüyü kapatmamalı.
    const target = e.target as HTMLElement;
    if (target.closest(".liquid-menu-inner")) return;
    toggle(id);
  };

  /**
   * Kart üzerinde imleç menüden yeterince uzaklaşınca açık menüyü kapatır.
   * Hover bölgesinin `mouseleave`'i yetmiyor: menü açıkken şerit geniş
   * olduğu için imleç bölgeden çıkmadan kartın soluna geçebiliyor.
   */
  const onCardMouseMove = (e: MouseEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (target.closest(".liquid-menu, .hamburger")) return;

    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();

    if (rect.right - e.clientX > CARD_DISMISS_DISTANCE) {
      expanded.value[id] = false;
    }
  };

  onBeforeUnmount(stopLoop);

  return {
    activeCard,
    expanded,
    setBlobPathRef,
    setBlobContainerRef,
    setHamburgerRef,
    onZoneMouseMove,
    onZoneEnter,
    onZoneLeave,
    onZoneClick,
    onCardMouseMove
  };
};
