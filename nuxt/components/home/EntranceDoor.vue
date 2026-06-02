<script setup lang="ts">
/**
 * EntranceDoor — Gerçek portal sahnesi
 *
 * Yaklaşım:
 *  • Showroom HER ZAMAN arkada (z:0), opacity sabit.
 *  • Hero görseli + kapı frame'i ÜSTTE (z:1).
 *  • Door frame render'ı üst katmanda akarak açılır.
 *  • Showroom katmanı arkada kalır; zoom/fade geçişinde devreye girer.
 *
 * Timeline (master progress):
 *  0.00 → 0.50  PORTAL    : sadece kapı açılıyor, zoom YOK
 *  0.50 → 0.62  HOLD      : kapı tam açık, kısa duraklama
 *  0.62 → 0.82  ZOOM      : kapı boşluğuna doğru yakınlaşma
 *  0.82 → 1.00  TURNTABLE : showroom çarkı döner
 */

import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import AdaCtaButton from "./AdaCtaButton.vue";
import ShowroomTurntable from "./ShowroomTurntable.vue";

// ─────────────────────────────────────────────────────────────
// IMAGEKIT
// ─────────────────────────────────────────────────────────────
const IK_BASE = "https://ik.imagekit.io/kardoor";
const DOOR_SPRITE_METADATA_PATH = "/kardoor-door-sprite.json";
const DOOR_FALLBACK_FRAME_COUNT = 103;

const withImageKitTransform = (url: string, quality = 84) =>
  `${url}&tr=f-webp,q-${quality}`;

const heroAssets = {
  day: {
    master: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-daylight-final-3840x2160.png?updatedAt=1780265736700`),
    tabletLandscape: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-daylight-tablet-landscape-2732x2048.png?updatedAt=1780265734510`),
    tabletPortrait: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-daylight-tablet-portrait-2048x2732.png?updatedAt=1780265734863`),
    mobile: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-daylight-mobile-1440x2560.png?updatedAt=1780265732301`)
  },
  night: {
    master: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-night-final-3840x2160.png?updatedAt=1780265734751`),
    tabletLandscape: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-night-tablet-landscape-2732x2048.png?updatedAt=1780265732355`),
    tabletPortrait: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-night-tablet-portrait-2048x2732.png?updatedAt=1780265734871`),
    mobile: withImageKitTransform(`${IK_BASE}/Ege%20Kardoor%20Home%20Mask/Ege%20Kardoor%20Home%20Mask/kardoor-hero-night-mobile-1440x2560.png?updatedAt=1780265729829`)
  }
};

// ─────────────────────────────────────────────────────────────
// COPY (TR / EN)
// ─────────────────────────────────────────────────────────────
const { locale } = useKardoorLocale();

const copy = computed(() =>
  locale.value === "tr"
    ? {
        sectionLabel: "Kardoor giriş ve showroom",
        imageAlt: "Modern villa girişi — Kardoor çelik kapı",
        line1: "Hayallerinize",
        accent: "Açılan",
        line2: "Kapı",
        subtitleLead: "Güven kapının ardında",
        subtitleAccent: "yaşar.",
        ctaLabel: "Koleksiyonları Keşfet",
        scrollCue: "Kaydır"
      }
    : {
        sectionLabel: "Kardoor entrance and showroom",
        imageAlt: "Modern villa entrance — Kardoor steel door",
        line1: "The Door",
        accent: "to Your",
        line2: "Dreams",
        subtitleLead: "Confidence lives behind the door",
        subtitleAccent: "",
        ctaLabel: "Explore Collections",
        scrollCue: "Scroll"
      }
);

// ─────────────────────────────────────────────────────────────
// REFS
// ─────────────────────────────────────────────────────────────
const heroRef = ref<HTMLElement | null>(null);
const heroImageRef = ref<HTMLImageElement | null>(null);
const zoomLayerRef = ref<HTMLElement | null>(null);
const artboardRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const turntableProgress = ref(0);
const isShowroomActive = ref(false);

let teardown: (() => void) | undefined;
let requestDoorStep: ((direction: -1 | 1) => void) | undefined;
let requestDoorSelect: ((index: number) => void) | undefined;

const onDoorStep = (direction: -1 | 1) => {
  requestDoorStep?.(direction);
};

const onDoorSelect = (index: number) => {
  requestDoorSelect?.(index);
};

// ─────────────────────────────────────────────────────────────
// MOUNTED
// ─────────────────────────────────────────────────────────────
onMounted(() => {
  const hero = heroRef.value;
  const heroImage = heroImageRef.value;
  const zoomLayer = zoomLayerRef.value;
  const artboard = artboardRef.value;
  const stage = stageRef.value;
  const canvas = canvasRef.value;

  if (!hero || !heroImage || !zoomLayer || !artboard || !stage || !canvas) return;

  gsap.registerPlugin(ScrollTrigger);

  const context = canvas.getContext("2d");
  if (!context) return;

  const copyMask = hero.querySelector<HTMLElement>(".entrance-door__copy-mask");
  const copyItems = copyMask
    ? gsap.utils.toArray<HTMLElement>(".entrance-door__copy-reveal", copyMask)
    : [];
  let copyRevealTween: gsap.core.Tween | undefined;

  const runCopyReveal = () => {
    if (!copyMask || !copyItems.length) return;

    copyRevealTween?.kill();

    gsap.set(copyItems, {
      opacity: 0,
      y: (_index, el) => {
        const maskBottom = copyMask.getBoundingClientRect().bottom;
        const itemTop = (el as HTMLElement).getBoundingClientRect().top;
        return Math.max(42, maskBottom - itemTop + 8);
      }
    });

    copyRevealTween = gsap.to(copyItems, {
      opacity: 1,
      y: 0,
      duration: 1.22,
      ease: "expo.out",
      stagger: 0.15,
      delay: 0.12,
      overwrite: true,
      clearProps: "transform,opacity"
    });
  };

  let showroomOriginX = 0;
  let showroomOriginY = 0;
  let showroomAnchorX = 0;
  let showroomAnchorY = 0;

  type DoorSpriteFrame = {
    frame: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };

  type DoorSpriteMetadata = {
    sprite: string;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    frames: DoorSpriteFrame[];
  };

  // ───────────── SPRITE LOADER ─────────────
  let spriteImage: HTMLImageElement | undefined;
  let spriteMetadata: DoorSpriteMetadata | undefined;
  let currentFrameNumber = -1;
  let pendingFrameNumber = -1;
  let drawRaf = 0;
  let queuedDraw:
    | {
        frameNumber: number;
        frame: DoorSpriteFrame;
      }
    | undefined;
  let canvasMetrics = {
    w: 0,
    h: 0,
    dpr: 1,
    cw: 0,
    ch: 0
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;

    return (img.decode
      ? img.decode().catch(
          () =>
            new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error(`sprite load failed: ${src}`));
            })
        )
      : new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`sprite load failed: ${src}`));
        })
    ).then(() => img);
  };

  const loadDoorSprite = async () => {
    const metadata = await fetch(DOOR_SPRITE_METADATA_PATH).then((response) => {
      if (!response.ok) {
        throw new Error(`door sprite metadata failed: ${response.status}`);
      }

      return response.json() as Promise<DoorSpriteMetadata>;
    });

    const image = await loadImage(metadata.sprite);
    spriteMetadata = metadata;
    spriteImage = image;

    const frameNumber = pendingFrameNumber > 0 ? pendingFrameNumber : metadata.frames[0]?.frame ?? 1;
    const frame = getSpriteFrame(frameNumber);
    if (frame) drawFrame(frameNumber, frame);
  };

  // ───────────── CANVAS DRAW ─────────────
  const syncCanvasMetrics = () => {
    const w = Math.max(1, Math.round(stage.clientWidth));
    const h = Math.max(1, Math.round(stage.clientHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(1, Math.round(w * dpr));
    const ch = Math.max(1, Math.round(h * dpr));

    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;

    canvasMetrics = { w, h, dpr, cw, ch };
  };

  const drawFrameNow = (frame: DoorSpriteFrame) => {
    if (!spriteImage) return;

    if (!canvasMetrics.w || !canvasMetrics.h) {
      syncCanvasMetrics();
    }

    const { w, h, dpr } = canvasMetrics;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, w, h);
    context.drawImage(
      spriteImage,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      0,
      0,
      w,
      h
    );
  };

  const drawFrame = (frameNumber: number, frame: DoorSpriteFrame) => {
    queuedDraw = { frameNumber, frame };
    currentFrameNumber = frameNumber;

    if (drawRaf) return;

    drawRaf = window.requestAnimationFrame(() => {
      drawRaf = 0;
      if (!queuedDraw) return;

      const next = queuedDraw;
      queuedDraw = undefined;
      drawFrameNow(next.frame);
    });
  };

  const getSpriteFrame = (frameNumber: number) => {
    if (!spriteMetadata?.frames.length) return undefined;
    const index = Math.min(spriteMetadata.frames.length - 1, Math.max(0, frameNumber - 1));
    return spriteMetadata.frames[index];
  };

  const requestFrame = (frameNumber: number) => {
    if (currentFrameNumber === frameNumber) return;

    pendingFrameNumber = frameNumber;
    const frame = getSpriteFrame(frameNumber);
    if (frame) drawFrame(frameNumber, frame);
  };

  // ───────────── DOOR ALIGNMENT ─────────────
  const getHeroArtboardAspect = () => {
    if (window.matchMedia("(max-width: 768px)").matches) return 1440 / 2560;
    if (window.matchMedia("(min-width: 769px) and (max-width: 1180px) and (orientation: portrait)").matches) {
      return 2048 / 2732;
    }
    if (window.matchMedia("(min-width: 769px) and (max-width: 1180px) and (orientation: landscape)").matches) {
      return 2732 / 2048;
    }
    return 3840 / 2160;
  };

  const updateArtboardBox = () => {
    const stageWidth = Math.max(1, hero.clientWidth);
    const stageHeight = Math.max(1, hero.clientHeight);
    const imageAspect = getHeroArtboardAspect();
    const stageAspect = stageWidth / stageHeight;

    const renderedWidth = stageAspect > imageAspect
      ? stageWidth
      : stageHeight * imageAspect;
    const renderedHeight = stageAspect > imageAspect
      ? stageWidth / imageAspect
      : stageHeight;
    const renderedLeft = (stageWidth - renderedWidth) / 2;
    const renderedTop = (stageHeight - renderedHeight) / 2;

    artboard.style.setProperty("--hero-artboard-left", `${renderedLeft}px`);
    artboard.style.setProperty("--hero-artboard-top", `${renderedTop}px`);
    artboard.style.setProperty("--hero-artboard-width", `${renderedWidth}px`);
    artboard.style.setProperty("--hero-artboard-height", `${renderedHeight}px`);
  };

  const updateStagePosition = () => {
    updateArtboardBox();

    const bounds = hero.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    const doorLeft = stageBounds.left - bounds.left;
    const doorTop = stageBounds.top - bounds.top;
    const doorW = stageBounds.width;
    const doorH = stageBounds.height;

    const originX = doorLeft + doorW * 0.5;
    const originY = doorTop + doorH * 0.5;
    const showroomInfoW = Math.min(540, Math.max(360, bounds.width * 0.38));
    const showroomStageW = Math.max(1, bounds.width - showroomInfoW);
    const showroomStageX = Math.min(
      showroomStageW * 0.34,
      Math.max(showroomStageW * 0.18, bounds.width * 0.28)
    );
    const showroomStageY = bounds.height * 0.96;
    const showroomDoorH = Math.min(640, Math.max(420, bounds.height * 0.58));

    showroomOriginX = originX;
    showroomOriginY = originY;
    showroomAnchorX = showroomStageX;
    showroomAnchorY = showroomStageY - showroomDoorH * 1.22 * 0.5;

    hero.style.setProperty("--zoom-origin-x", `${originX}px`);
    hero.style.setProperty("--zoom-origin-y", `${originY}px`);
    zoomLayer.style.setProperty("--zoom-origin-x", `${originX}px`);
    zoomLayer.style.setProperty("--zoom-origin-y", `${originY}px`);

    syncCanvasMetrics();
    const cur = getSpriteFrame(currentFrameNumber);
    if (cur) drawFrame(currentFrameNumber, cur);
  };

  // ───────────── MASTER PROGRESS ─────────────
  const SEQ_END = 0.30;
  const HOLD_END = 0.25;
  const FIRST_DOOR_SETTLE_START = 0.36;
  const TURNTABLE_START = 0.68;
  const TURNTABLE_END = 0.86;
  const HORIZONTAL_SLIDE_START = 0.88;

  const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
  const easeInOut = (t: number) => t * t * (3 - 2 * t);

  const updateMaster = (raw: number) => {
    const p = clamp01(raw);

    const seqP = clamp01(p / SEQ_END);
    const doorwayReveal = easeInOut(clamp01((seqP - 0.08) / 0.72));
    const frameCount = spriteMetadata?.frames.length ?? DOOR_FALLBACK_FRAME_COUNT;
    const frameNumber = Math.min(frameCount, Math.max(1, Math.floor(seqP * frameCount) + 1));
    requestFrame(frameNumber);

    const settleP = clamp01((p - FIRST_DOOR_SETTLE_START) / (TURNTABLE_START - FIRST_DOOR_SETTLE_START));
    const zoomP = easeInOut(clamp01((p - HOLD_END) / (TURNTABLE_START - HOLD_END)));
    const zoomScale = 1 + zoomP * 16;
    const showroomScale = 0.14 + zoomP * 0.86;
    const showroomContentOpacity = 0.12 + easeInOut(clamp01((settleP - 0.04) / 0.48)) * 0.88;
    const showroomPortalLock = 1 - easeInOut(clamp01((settleP - 0.56) / 0.26));
    const showroomAlignX =
      (1 - showroomScale) * (showroomOriginX - showroomAnchorX) * showroomPortalLock;
    const showroomAlignY =
      (1 - showroomScale) * (showroomOriginY - showroomAnchorY) * showroomPortalLock;
    const showroomUiReveal = easeInOut(clamp01((settleP - 0.28) / 0.42));
    const showroomAtmosphereReveal = easeInOut(clamp01((settleP - 0.72) / 0.24));
    const showroomDoorRiseY = (1 - easeInOut(clamp01((settleP - 0.08) / 0.58))) * 86;
    const showroomOrbitDepth = showroomAtmosphereReveal;
    const showroomNeighborRiseY = (1 - showroomOrbitDepth) * 82;

    zoomLayer.style.setProperty("--zoom-scale", `${zoomScale}`);
    zoomLayer.style.setProperty("--doorway-reveal", `${doorwayReveal}`);
    zoomLayer.style.setProperty("--doorway-reveal-clip", `${(1 - doorwayReveal) * 100}%`);
    hero.style.setProperty("--showroom-scale", `${showroomScale}`);
    hero.style.setProperty("--showroom-align-x", `${showroomAlignX}px`);
    hero.style.setProperty("--showroom-align-y", `${showroomAlignY}px`);
    hero.style.setProperty("--showroom-content-opacity", `${showroomContentOpacity}`);
    hero.style.setProperty("--showroom-ui-opacity", `${showroomUiReveal}`);
    hero.style.setProperty("--showroom-ui-x", `${(1 - showroomUiReveal) * 76}px`);
    hero.style.setProperty("--showroom-backdrop-opacity", `${showroomAtmosphereReveal}`);
    hero.style.setProperty("--showroom-text-clip", `${100 - showroomAtmosphereReveal * 100}%`);
    hero.style.setProperty("--showroom-text-x", `${(1 - showroomAtmosphereReveal) * 72}px`);
    hero.classList.toggle("entrance-door--backdrop-running", showroomAtmosphereReveal > 0.015);
    hero.style.setProperty("--showroom-door-rise-y", `${showroomDoorRiseY}px`);
    hero.style.setProperty("--showroom-neighbor-rise-y", `${showroomNeighborRiseY}px`);
    hero.style.setProperty("--showroom-orbit-depth", `${showroomOrbitDepth}`);

    const fadeOutStart = FIRST_DOOR_SETTLE_START + (TURNTABLE_START - FIRST_DOOR_SETTLE_START) * 0.42;
    const zoomFade = 1 - easeInOut(clamp01((p - fadeOutStart) / (TURNTABLE_START - fadeOutStart)));
    zoomLayer.style.setProperty("--zoom-fade", `${zoomFade}`);

    const copyFade = clamp01((p - 0.04) / 0.2);
    hero.style.setProperty("--hero-copy-opacity", `${1 - copyFade}`);
    hero.style.setProperty("--hero-copy-y", `${copyFade * -28}px`);
    hero.style.setProperty("--hero-cue-opacity", `${1 - clamp01(p / 0.12)}`);

    const ttP = clamp01((p - TURNTABLE_START) / (TURNTABLE_END - TURNTABLE_START));
    const horizontalSlideP = easeInOut(clamp01((p - HORIZONTAL_SLIDE_START) / (1 - HORIZONTAL_SLIDE_START)));
    hero.style.setProperty("--showroom-page-x", `${horizontalSlideP * -100}%`);
    turntableProgress.value = ttP;
    isShowroomActive.value = p >= HOLD_END;
  };

  // ───────────── SCROLL TRIGGER ─────────────
  const DOOR_COUNT_TT = 5;
  const DOOR_SNAP_POINTS = Array.from({ length: DOOR_COUNT_TT }, (_, i) =>
    TURNTABLE_START + (i / (DOOR_COUNT_TT - 1)) * (TURNTABLE_END - TURNTABLE_START)
  );
  const DOOR_SNAP_PAD = 0.018;
  const DOOR_SNAP_COOLDOWN_MS = 560;
  const HORIZONTAL_SLIDE_COOLDOWN_MS = 700;

  let trigger: ScrollTrigger | undefined;
  let isAutoSettling = false;
  let hasAutoSettledIntoShowroom = false;
  let settleTween: gsap.core.Tween | undefined;
  let unlockInput: (() => void) | undefined;
  let lastTouchY = 0;
  let doorSnapCooldownUntil = 0;
  let horizontalSlideCooldownUntil = 0;

  const consumeScrollEvent = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    if ("stopImmediatePropagation" in event) {
      event.stopImmediatePropagation();
    }
  };

  const blockScrollInput = () => {
    unlockInput?.();

    const stop = (event: Event) => {
      consumeScrollEvent(event);
    };
    const stopKeys = (event: KeyboardEvent) => {
      if (
        [
          " ",
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End"
        ].includes(event.key)
      ) {
        stop(event);
      }
    };
    const options: AddEventListenerOptions = { capture: true, passive: false };

    window.addEventListener("wheel", stop, options);
    window.addEventListener("touchmove", stop, options);
    window.addEventListener("keydown", stopKeys, { capture: true });

    unlockInput = () => {
      window.removeEventListener("wheel", stop, options);
      window.removeEventListener("touchmove", stop, options);
      window.removeEventListener("keydown", stopKeys, { capture: true });
      unlockInput = undefined;
    };
  };

  const autoSettleTo = (
    progress: number,
    options: {
      duration?: number;
      ease?: string;
      markShowroomSettled?: boolean;
      onComplete?: () => void;
    } = {}
  ) => {
    if (!trigger || isAutoSettling) return;

    const startProgress = trigger.progress;
    const startY = trigger.start + (trigger.end - trigger.start) * startProgress;
    const targetY = trigger.start + (trigger.end - trigger.start) * progress;
    const scrollState = { progress: trigger.progress };

    isAutoSettling = true;
    blockScrollInput();
    settleTween?.kill();
    settleTween = gsap.to(scrollState, {
      progress,
      duration: options.duration ?? 2.15,
      ease: options.ease ?? "sine.inOut",
      overwrite: true,
      onUpdate: () => {
        const t = (scrollState.progress - startProgress) / (progress - startProgress || 1);
        const y = startY + (targetY - startY) * clamp01(t);
        window.scrollTo(0, y);
        updateMaster(scrollState.progress);
      },
      onComplete: () => {
        window.scrollTo(0, targetY);
        updateMaster(progress);
        isAutoSettling = false;
        if (options.markShowroomSettled !== false) {
          hasAutoSettledIntoShowroom = true;
        }
        unlockInput?.();
        options.onComplete?.();
      },
      onInterrupt: () => {
        isAutoSettling = false;
        unlockInput?.();
      }
    });
  };

  const shouldTakeOverSettle = (direction: number) =>
    Boolean(
      trigger &&
        direction > 0 &&
        !hasAutoSettledIntoShowroom &&
        trigger.progress >= FIRST_DOOR_SETTLE_START - 0.025 &&
        trigger.progress < TURNTABLE_START
    );

  const shouldReverseSettle = (direction: number) =>
    Boolean(
      trigger &&
        direction < 0 &&
        hasAutoSettledIntoShowroom &&
        trigger.progress > FIRST_DOOR_SETTLE_START + 0.018 &&
        trigger.progress <= TURNTABLE_START + DOOR_SNAP_PAD
    );

  const getNearestDoorIndex = (progress: number) => {
    let nearestIndex = 0;
    let nearestDistance = Math.abs(progress - DOOR_SNAP_POINTS[0]!);

    for (let i = 1; i < DOOR_SNAP_POINTS.length; i++) {
      const distance = Math.abs(progress - DOOR_SNAP_POINTS[i]!);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    return nearestIndex;
  };

  const shouldSnapDoor = (direction: number) =>
    Boolean(
      trigger &&
        direction !== 0 &&
        hasAutoSettledIntoShowroom &&
        trigger.progress >= TURNTABLE_START - DOOR_SNAP_PAD &&
        trigger.progress <= TURNTABLE_END + DOOR_SNAP_PAD
    );

  const isDoorSnapCoolingDown = () =>
    Boolean(
      trigger &&
        performance.now() < doorSnapCooldownUntil &&
        trigger.progress >= TURNTABLE_START - DOOR_SNAP_PAD &&
        trigger.progress <= TURNTABLE_END + DOOR_SNAP_PAD
    );

  const isHorizontalSlideCoolingDown = () =>
    Boolean(trigger && performance.now() < horizontalSlideCooldownUntil);

  const snapDoor = (direction: number, event?: Event) => {
    if (!trigger || !shouldSnapDoor(direction)) return false;

    const currentIndex = getNearestDoorIndex(trigger.progress);
    const targetIndex = currentIndex + (direction > 0 ? 1 : -1);

    if (targetIndex < 0 || targetIndex >= DOOR_SNAP_POINTS.length) {
      return false;
    }

    if (event) {
      consumeScrollEvent(event);
    }

    doorSnapCooldownUntil = performance.now() + 920 + DOOR_SNAP_COOLDOWN_MS;

    autoSettleTo(DOOR_SNAP_POINTS[targetIndex]!, {
      duration: 0.92,
      ease: "power3.inOut",
      markShowroomSettled: false
    });

    return true;
  };

  requestDoorStep = (direction: -1 | 1) => {
    if (!trigger) return;

    const currentProgress = clamp01(trigger.progress);
    const currentIndex = getNearestDoorIndex(currentProgress);
    const targetIndex = currentIndex + direction;

    if (targetIndex < 0) return;

    if (targetIndex >= DOOR_SNAP_POINTS.length) {
      horizontalSlideCooldownUntil = performance.now() + 2600 + HORIZONTAL_SLIDE_COOLDOWN_MS;
      autoSettleTo(1, {
        duration: 2.6,
        ease: "sine.inOut",
        markShowroomSettled: false
      });
      return;
    }

    if (!hasAutoSettledIntoShowroom && currentProgress < TURNTABLE_START) {
      hasAutoSettledIntoShowroom = true;
    }

    doorSnapCooldownUntil = performance.now() + 860 + DOOR_SNAP_COOLDOWN_MS;
    autoSettleTo(DOOR_SNAP_POINTS[targetIndex]!, {
      duration: 0.86,
      ease: "power3.inOut",
      markShowroomSettled: true
    });
  };

  requestDoorSelect = (index: number) => {
    if (!trigger || index < 0 || index >= DOOR_SNAP_POINTS.length) return;

    if (!hasAutoSettledIntoShowroom && trigger.progress < TURNTABLE_START) {
      hasAutoSettledIntoShowroom = true;
    }

    doorSnapCooldownUntil = performance.now() + 780 + DOOR_SNAP_COOLDOWN_MS;
    autoSettleTo(DOOR_SNAP_POINTS[index]!, {
      duration: 0.78,
      ease: "power3.inOut",
      markShowroomSettled: true
    });
  };

  const shouldAutoSlideHorizontal = (direction: number) =>
    Boolean(
      trigger &&
        direction > 0 &&
        hasAutoSettledIntoShowroom &&
        trigger.progress >= TURNTABLE_END - DOOR_SNAP_PAD &&
        trigger.progress < 1
    );

  const autoSlideHorizontal = (event?: Event) => {
    if (!trigger || !shouldAutoSlideHorizontal(1)) return false;

    if (event) {
      consumeScrollEvent(event);
    }

    horizontalSlideCooldownUntil = performance.now() + 2600 + HORIZONTAL_SLIDE_COOLDOWN_MS;
    autoSettleTo(1, {
      duration: 2.6,
      ease: "sine.inOut",
      markShowroomSettled: false
    });

    return true;
  };

  const shouldReverseSlideHorizontal = (direction: number) =>
    Boolean(
      trigger &&
        direction < 0 &&
        hasAutoSettledIntoShowroom &&
        trigger.progress > TURNTABLE_END + DOOR_SNAP_PAD &&
        trigger.progress <= 1
    );

  const reverseSlideHorizontal = (event?: Event) => {
    if (!trigger || !shouldReverseSlideHorizontal(-1)) return false;

    if (event) {
      consumeScrollEvent(event);
    }

    horizontalSlideCooldownUntil = performance.now() + 2600 + HORIZONTAL_SLIDE_COOLDOWN_MS;
    autoSettleTo(TURNTABLE_END, {
      duration: 2.6,
      ease: "sine.inOut"
    });

    return true;
  };

  const reverseSettleToEntrance = (event?: Event) => {
    if (!trigger || !shouldReverseSettle(-1)) return false;

    if (event) {
      consumeScrollEvent(event);
    }

    doorSnapCooldownUntil = performance.now() + 1750;
    autoSettleTo(FIRST_DOOR_SETTLE_START, {
      duration: 1.55,
      ease: "sine.inOut",
      markShowroomSettled: false,
      onComplete: () => {
        hasAutoSettledIntoShowroom = false;
      }
    });

    return true;
  };

  const takeOverSettle = (event?: Event) => {
    if (event) {
      consumeScrollEvent(event);
    }
    autoSettleTo(TURNTABLE_START);
  };

  const onSettleWheel = (event: WheelEvent) => {
    if (isHorizontalSlideCoolingDown()) {
      consumeScrollEvent(event);
      return;
    }

    if (event.deltaY > 0 && autoSlideHorizontal(event)) {
      return;
    }

    if (isDoorSnapCoolingDown()) {
      consumeScrollEvent(event);
      return;
    }

    if (isAutoSettling) {
      takeOverSettle(event);
      return;
    }

    if (snapDoor(event.deltaY, event)) {
      return;
    }

    if (event.deltaY < 0 && reverseSettleToEntrance(event)) {
      return;
    }

    if (event.deltaY < 0 && reverseSlideHorizontal(event)) {
      return;
    }

    if (shouldTakeOverSettle(event.deltaY)) {
      takeOverSettle(event);
    }
  };

  const onSettleTouchStart = (event: TouchEvent) => {
    lastTouchY = event.touches[0]?.clientY ?? 0;
  };

  const onSettleTouchMove = (event: TouchEvent) => {
    const y = event.touches[0]?.clientY ?? lastTouchY;
    const direction = lastTouchY - y;
    lastTouchY = y;

    if (isHorizontalSlideCoolingDown()) {
      consumeScrollEvent(event);
      return;
    }

    if (direction > 0 && autoSlideHorizontal(event)) {
      return;
    }

    if (isDoorSnapCoolingDown()) {
      consumeScrollEvent(event);
      return;
    }

    if (isAutoSettling) {
      takeOverSettle(event);
      return;
    }

    if (snapDoor(direction, event)) {
      return;
    }

    if (direction < 0 && reverseSettleToEntrance(event)) {
      return;
    }

    if (direction < 0 && reverseSlideHorizontal(event)) {
      return;
    }

    if (shouldTakeOverSettle(direction)) {
      takeOverSettle(event);
    }
  };

  const onSettleKeydown = (event: KeyboardEvent) => {
    const forwardKeys = [" ", "ArrowDown", "PageDown", "End"];
    const backwardKeys = ["ArrowUp", "PageUp", "Home"];
    const direction = forwardKeys.includes(event.key)
      ? 1
      : backwardKeys.includes(event.key)
        ? -1
      : 0;

    if (isHorizontalSlideCoolingDown()) {
      consumeScrollEvent(event);
      return;
    }

    if (direction > 0 && autoSlideHorizontal(event)) {
      return;
    }

    if (isDoorSnapCoolingDown()) {
      consumeScrollEvent(event);
      return;
    }

    if (isAutoSettling) {
      takeOverSettle(event);
      return;
    }

    if (snapDoor(direction, event)) {
      return;
    }

    if (direction < 0 && reverseSettleToEntrance(event)) {
      return;
    }

    if (direction < 0 && reverseSlideHorizontal(event)) {
      return;
    }

    if (shouldTakeOverSettle(direction)) {
      takeOverSettle(event);
    }
  };

  trigger = ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * 8.5)}`,
    scrub: true,
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (isAutoSettling) return;

      updateMaster(self.progress);

      if (
        self.direction > 0 &&
        !isAutoSettling &&
        !hasAutoSettledIntoShowroom &&
        self.progress >= FIRST_DOOR_SETTLE_START &&
        self.progress < TURNTABLE_START
      ) {
        autoSettleTo(TURNTABLE_START);
      }

      if (self.direction < 0 && self.progress < FIRST_DOOR_SETTLE_START - 0.045) {
        hasAutoSettledIntoShowroom = false;
      }
    },
    onRefresh: (self) => {
      updateStagePosition();
      updateMaster(self.progress);
    }
  });

  // ───────────── INIT ─────────────
  const onResize = () => {
    updateStagePosition();
    ScrollTrigger.refresh();
  };

  loadDoorSprite()
    .then(() => {
      updateStagePosition();
      requestFrame(1);
    })
    .catch((error) => {
      console.error("[EntranceDoor] Door sprite could not be loaded.", error);
    });

  heroImage.addEventListener("load", updateStagePosition);
  if (heroImage.complete) updateStagePosition();
  requestAnimationFrame(runCopyReveal);

  window.addEventListener("resize", onResize);
  window.addEventListener("wheel", onSettleWheel, { capture: true, passive: false });
  window.addEventListener("touchstart", onSettleTouchStart, { capture: true, passive: true });
  window.addEventListener("touchmove", onSettleTouchMove, { capture: true, passive: false });
  window.addEventListener("keydown", onSettleKeydown, { capture: true });

  const onPageShow = () => {
    updateStagePosition();
    trigger?.refresh();
  };
  window.addEventListener("pageshow", onPageShow);

  teardown = () => {
    copyRevealTween?.kill();
    settleTween?.kill();
    unlockInput?.();
    trigger?.kill(true);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("wheel", onSettleWheel, { capture: true });
    window.removeEventListener("touchstart", onSettleTouchStart, { capture: true });
    window.removeEventListener("touchmove", onSettleTouchMove, { capture: true });
    window.removeEventListener("keydown", onSettleKeydown, { capture: true });
    window.removeEventListener("pageshow", onPageShow);
    heroImage.removeEventListener("load", updateStagePosition);
    requestDoorStep = undefined;
    requestDoorSelect = undefined;
    spriteImage = undefined;
    spriteMetadata = undefined;
    if (drawRaf) {
      window.cancelAnimationFrame(drawRaf);
      drawRaf = 0;
    }
  };
});

onBeforeUnmount(() => {
  teardown?.();
});
</script>

<template>
  <section
    ref="heroRef"
    class="entrance-door"
    :class="{ 'entrance-door--showroom-active': isShowroomActive }"
    :aria-label="copy.sectionLabel"
  >
    <!-- SHOWROOM (her zaman arkada, opacity sabit) -->
    <div class="entrance-door__showroom" aria-hidden="false">
      <ShowroomTurntable
        :progress="turntableProgress"
        @door-step="onDoorStep"
        @door-select="onDoorSelect"
      />
    </div>

    <div class="entrance-door__next-panel" aria-hidden="true" />

    <!-- HERO + FRAME (üstte, zoom ile kaybolur) -->
    <div ref="zoomLayerRef" class="entrance-door__zoom-layer">
      <div ref="artboardRef" class="entrance-door__artboard">
        <picture class="entrance-door__hero-picture entrance-door__hero-picture--day">
          <source :srcset="heroAssets.day.mobile" media="(max-width: 767px)">
          <source :srcset="heroAssets.day.tabletPortrait" media="(min-width: 768px) and (max-width: 1180px) and (orientation: portrait)">
          <source :srcset="heroAssets.day.tabletLandscape" media="(min-width: 768px) and (max-width: 1180px) and (orientation: landscape)">
          <img
            ref="heroImageRef"
            :src="heroAssets.day.master"
            :alt="copy.imageAlt"
            class="entrance-door__hero-image"
            decoding="async"
            loading="eager"
            fetchpriority="high"
            draggable="false"
            crossorigin="anonymous"
          >
        </picture>

        <picture class="entrance-door__hero-picture entrance-door__hero-picture--night" aria-hidden="true">
          <source :srcset="heroAssets.night.mobile" media="(max-width: 767px)">
          <source :srcset="heroAssets.night.tabletPortrait" media="(min-width: 768px) and (max-width: 1180px) and (orientation: portrait)">
          <source :srcset="heroAssets.night.tabletLandscape" media="(min-width: 768px) and (max-width: 1180px) and (orientation: landscape)">
          <img
            :src="heroAssets.night.master"
            alt=""
            class="entrance-door__hero-image"
            decoding="async"
            loading="eager"
            draggable="false"
            crossorigin="anonymous"
          >
        </picture>

        <div class="entrance-door__doorway-reveal" aria-hidden="true">
          <ShowroomTurntable
            class="entrance-door__doorway-interior"
            :progress="turntableProgress"
          />
        </div>

        <!-- Canvas: kapı açılış sekansı (siyah alanlar şeffaf) -->
        <div ref="stageRef" class="entrance-door__stage" aria-hidden="true">
          <canvas ref="canvasRef" class="entrance-door__canvas" />
        </div>
      </div>
    </div>

    <!-- HERO COPY -->
    <div class="entrance-door__copy-mask">
      <div class="entrance-door__copy">
        <div class="entrance-door__copy-stack">
          <h1 class="entrance-door__heading">
            <span class="entrance-door__heading-line entrance-door__copy-reveal">
              <span>{{ copy.line1 }}</span>
            </span>
            <span class="entrance-door__heading-line entrance-door__heading-line--accent entrance-door__copy-reveal">
              <span>
                <em>{{ copy.accent }}</em> {{ copy.line2 }}
              </span>
            </span>
          </h1>
          <p class="entrance-door__subtitle entrance-door__copy-reveal">
            <span class="entrance-door__subtitle-line">
              <span>
                {{ copy.subtitleLead }}{{ copy.subtitleAccent ? " " : "" }}<em v-if="copy.subtitleAccent">{{ copy.subtitleAccent }}</em>
              </span>
            </span>
          </p>
          <div class="entrance-door__cta-row entrance-door__copy-reveal" aria-label="Hero aksiyonları">
            <AdaCtaButton :label="copy.ctaLabel" href="#" variant="filled" icon-position="none" />
            <a class="entrance-door__cta-arrow" href="#" :aria-label="copy.ctaLabel">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12H19" />
                <path d="M14 7L19 12L14 17" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="entrance-door__cue" aria-hidden="true">
      <span>{{ copy.scrollCue }}</span>
      <i />
    </div>
  </section>
</template>
