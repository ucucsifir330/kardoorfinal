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

type LenisScrollToOptions = {
  duration?: number;
  easing?: (t: number) => number;
  force?: boolean;
  immediate?: boolean;
  lock?: boolean;
  onComplete?: () => void;
};

type LenisInstance = {
  scrollTo: (target: number | string | HTMLElement, options?: LenisScrollToOptions) => void;
  start: () => void;
  stop: () => void;
};

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
const ctaPathRef = ref<SVGSVGElement | null>(null);

const turntableProgress = ref(0);
const isShowroomActive = ref(false);
const isShowroomUiActive = ref(false);
const { $lenis } = useNuxtApp();

let teardown: (() => void) | undefined;
let requestDoorStep: ((direction: -1 | 1) => void) | undefined;
let requestDoorSelect: ((index: number) => void) | undefined;

const CTA_PATH_LENGTH = 1320;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const updateCtaPathMotion = (rawProgress: number) => {
  const path = ctaPathRef.value;

  if (!path) {
    return;
  }

  const progress = clamp01(rawProgress);
  const eased = 1 - Math.pow(1 - progress, 3);

  path.style.setProperty("--cta-path-dashoffset", `${CTA_PATH_LENGTH * (1 - eased)}`);
  path.style.setProperty("--cta-path-y", `${-34 * eased}px`);
  path.style.setProperty("--cta-path-opacity", `${0.26 + eased * 0.56}`);

  path.style.setProperty("--cta-dot-opacity", `${clamp01((progress - 0.82) / 0.16) * 0.46}`);

  path.style.setProperty("--cta-dot-scale", `${0.55 + clamp01((progress - 0.82) / 0.16) * 0.45}`);
};

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
  const lenis = $lenis as LenisInstance | undefined;
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
  const HORIZONTAL_SLIDE_START = 0.865;
  const HORIZONTAL_SLIDE_END = 0.985;
  const CTA_PATH_START = 0.965;
  const DOOR_SNAP_POINTS = Array.from({ length: 5 }, (_, i) =>
    TURNTABLE_START + (i / 4) * (TURNTABLE_END - TURNTABLE_START)
  );

  const easeInOut = (t: number) => t * t * (3 - 2 * t);
  const snapEase = (t: number) => 1 - Math.pow(1 - t, 3);

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
    const showroomLayerOpacity = 1 - zoomFade;
    zoomLayer.style.setProperty("--zoom-fade", `${zoomFade}`);
    hero.style.setProperty("--showroom-layer-opacity", `${showroomLayerOpacity}`);

    const copyFade = clamp01((p - 0.04) / 0.2);
    hero.style.setProperty("--hero-copy-opacity", `${1 - copyFade}`);
    hero.style.setProperty("--hero-copy-y", `${copyFade * -28}px`);
    hero.style.setProperty("--hero-cue-opacity", `${1 - clamp01(p / 0.12)}`);

    const ttP = clamp01((p - TURNTABLE_START) / (TURNTABLE_END - TURNTABLE_START));
    const horizontalSlideP = easeInOut(clamp01((p - HORIZONTAL_SLIDE_START) / (HORIZONTAL_SLIDE_END - HORIZONTAL_SLIDE_START)));
    const ctaPathProgress = clamp01((p - CTA_PATH_START) / (1 - CTA_PATH_START));
    hero.style.setProperty("--showroom-page-x", `${horizontalSlideP * -100}%`);
    updateCtaPathMotion(ctaPathProgress);
    turntableProgress.value = ttP;
    isShowroomActive.value = showroomLayerOpacity > 0.02;
    isShowroomUiActive.value = showroomUiReveal > 0.08;
  };

  // ───────────── SCROLL TRIGGER ─────────────
  let trigger: ScrollTrigger | undefined;
  let snapIdleTimer = 0;
  let snapCooldownUntil = 0;
  let isSnapScrolling = false;
  let snapStartedAt = 0;
  let snapTargetProgress: number | undefined;
  let snapHoldTimer = 0;
  let previousProgress = 0;
  let lockedDoorIndex: number | undefined;

  const getProgressY = (progress: number) => {
    if (!trigger) return 0;
    return trigger.start + (trigger.end - trigger.start) * clamp01(progress);
  };

  const getNearestDoorSnap = (progress: number) =>
    DOOR_SNAP_POINTS.reduce((nearest, point) =>
      Math.abs(point - progress) < Math.abs(nearest - progress) ? point : nearest
    );

  const getNearestDoorIndex = (progress: number) =>
    DOOR_SNAP_POINTS.reduce((nearestIndex, point, index) =>
      Math.abs(point - progress) < Math.abs(DOOR_SNAP_POINTS[nearestIndex]! - progress) ? index : nearestIndex
    , 0);

  const getIdleSnapTarget = (progress: number) => {
    if (progress >= FIRST_DOOR_SETTLE_START + 0.005 && progress < TURNTABLE_START - 0.025) {
      const midpoint = FIRST_DOOR_SETTLE_START + (TURNTABLE_START - FIRST_DOOR_SETTLE_START) * 0.5;
      return progress >= midpoint ? TURNTABLE_START : FIRST_DOOR_SETTLE_START;
    }

    if (progress >= TURNTABLE_START - 0.02 && progress <= TURNTABLE_END + 0.006) {
      return getNearestDoorSnap(progress);
    }

    return undefined;
  };

  const cancelActiveSnap = () => {
    if (!lenis) return;

    window.clearTimeout(snapIdleTimer);
    window.clearTimeout(snapHoldTimer);
    isSnapScrolling = false;
    snapTargetProgress = undefined;
    snapCooldownUntil = performance.now() + 320;
    lenis.start();
    lenis.scrollTo(window.scrollY, {
      immediate: true,
      force: true,
      lock: false
    });
  };

  const holdSnap = (holdMs: number) => {
    if (!lenis || holdMs <= 0) return;

    window.clearTimeout(snapHoldTimer);
    lenis.stop();
    snapHoldTimer = window.setTimeout(() => {
      lenis.start();
      snapCooldownUntil = performance.now() + 420;
    }, holdMs);
  };

  const snapToProgress = (
    progress: number,
    duration = 1.05,
    correctionCount = 0,
    holdMs = 0,
    lock = false
  ) => {
    if (!lenis || !trigger) return;

    const targetProgress = clamp01(progress);
    const targetY = getProgressY(targetProgress);
    const doorIndex = DOOR_SNAP_POINTS.findIndex((point) => Math.abs(point - targetProgress) < 0.002);

    if (Math.abs(trigger.progress - targetProgress) < 0.004) return;

    isSnapScrolling = true;
    snapStartedAt = performance.now();
    snapTargetProgress = targetProgress;
    snapCooldownUntil = performance.now() + duration * 1000 + holdMs + 360;
    window.clearTimeout(snapIdleTimer);
    window.clearTimeout(snapHoldTimer);
    lenis.start();

    lenis.scrollTo(targetY, {
      duration,
      easing: snapEase,
      force: true,
      lock,
      onComplete: () => {
        const remaining = trigger ? Math.abs(trigger.progress - targetProgress) : 0;
        isSnapScrolling = false;
        snapTargetProgress = undefined;
        if (doorIndex >= 0) {
          lockedDoorIndex = doorIndex;
        }

        if (remaining > 0.012 && correctionCount < 1) {
          window.setTimeout(() => snapToProgress(targetProgress, 0.34, correctionCount + 1, holdMs, lock), 80);
          return;
        }

        holdSnap(holdMs);
      }
    });
  };

  const scheduleIdleSnap = (self: ScrollTrigger) => {
    if (!lenis || isSnapScrolling || performance.now() < snapCooldownUntil) return;

    window.clearTimeout(snapIdleTimer);
    snapIdleTimer = window.setTimeout(() => {
      if (!trigger || isSnapScrolling || performance.now() < snapCooldownUntil) return;

      const target = getIdleSnapTarget(trigger.progress);
      if (target === undefined) return;

      const isDoorTarget = target >= TURNTABLE_START && target <= TURNTABLE_END;
      snapToProgress(
        target,
        target === TURNTABLE_START || target === FIRST_DOOR_SETTLE_START ? 0.86 : 0.52,
        0,
        isDoorTarget ? 1250 : 0,
        isDoorTarget
      );
    }, Math.abs(self.getVelocity()) > 40 ? 520 : 360);
  };

  const lockTurntableDoor = (progress: number, progressDelta: number) => {
    if (
      !trigger ||
      isSnapScrolling ||
      performance.now() < snapCooldownUntil ||
      progress < TURNTABLE_START - 0.012 ||
      progress > TURNTABLE_END + 0.012
    ) {
      return;
    }

    if (lockedDoorIndex === undefined) {
      lockedDoorIndex = getNearestDoorIndex(progress);
    }

    const direction = Math.sign(progressDelta);
    if (direction === 0) return;

    const targetIndex = direction > 0 ? lockedDoorIndex + 1 : lockedDoorIndex - 1;
    if (targetIndex >= DOOR_SNAP_POINTS.length) {
      lockedDoorIndex = undefined;
      return;
    }

    if (targetIndex < 0) return;

    const currentPoint = DOOR_SNAP_POINTS[lockedDoorIndex]!;
    const target = DOOR_SNAP_POINTS[targetIndex]!;
    const threshold = currentPoint + (target - currentPoint) * 0.5;

    if (direction > 0 && progress < threshold) return;
    if (direction < 0 && progress > threshold) return;

    snapToProgress(target, 0.38, 0, 1250, true);
  };

  requestDoorStep = (direction: -1 | 1) => {
    if (!trigger) return;

    const current = trigger.progress;
    const nearestIndex = getNearestDoorIndex(current);
    const targetIndex = nearestIndex + direction;

    if (targetIndex < 0) {
      snapToProgress(FIRST_DOOR_SETTLE_START, 0.72);
      return;
    }

    if (targetIndex >= DOOR_SNAP_POINTS.length) {
      snapToProgress(HORIZONTAL_SLIDE_END, 1.55);
      return;
    }

    snapToProgress(DOOR_SNAP_POINTS[targetIndex]!, 0.38, 0, 1050, true);
  };

  requestDoorSelect = (index: number) => {
    const target = DOOR_SNAP_POINTS[index];
    if (target === undefined) return;

    snapToProgress(target, 0.38, 0, 1050, true);
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
      const progressDelta = self.progress - previousProgress;
      previousProgress = self.progress;

      if (
        isSnapScrolling &&
        snapTargetProgress !== undefined &&
        performance.now() - snapStartedAt > 160 &&
        Math.sign(progressDelta) !== 0 &&
        Math.sign(progressDelta) !== Math.sign(snapTargetProgress - self.progress)
      ) {
        cancelActiveSnap();
      }

      if (isSnapScrolling && snapTargetProgress !== undefined && Math.abs(self.progress - snapTargetProgress) < 0.006) {
        isSnapScrolling = false;
        snapTargetProgress = undefined;
      }

      lockTurntableDoor(self.progress, progressDelta);
      updateMaster(self.progress);
      scheduleIdleSnap(self);
    },
    onRefresh: (self) => {
      updateStagePosition();
      updateMaster(self.progress);
      previousProgress = self.progress;
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

  const onPageShow = () => {
    updateStagePosition();
    trigger?.refresh();
  };
  window.addEventListener("pageshow", onPageShow);

  teardown = () => {
    copyRevealTween?.kill();
    window.clearTimeout(snapIdleTimer);
    window.clearTimeout(snapHoldTimer);
    snapTargetProgress = undefined;
    lenis?.start();
    trigger?.kill(true);
    window.removeEventListener("resize", onResize);
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
    :class="{
      'entrance-door--showroom-active': isShowroomActive,
      'entrance-door--showroom-ui-active': isShowroomUiActive
    }"
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

    <div class="entrance-door__next-panel">
      <div class="entrance-door__cta-panel">
        <svg
          ref="ctaPathRef"
          class="entrance-door__cta-path"
          viewBox="0 0 1920 980"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            class="entrance-door__cta-path-line entrance-door__cta-path-line--shadow"
            d="M 960 0
       C 960 78 914 110 914 178
       C 914 252 1018 246 1037 317
       C 1056 388 963 414 925 370
       C 887 326 928 268 993 292
       C 1084 326 1081 456 1004 506
       C 934 552 873 514 872 604
       C 871 704 1038 684 1055 789
       C 1069 877 980 904 960 980"
          />

          <path
            class="entrance-door__cta-path-line"
            d="M 960 0
       C 960 78 914 110 914 178
       C 914 252 1018 246 1037 317
       C 1056 388 963 414 925 370
       C 887 326 928 268 993 292
       C 1084 326 1081 456 1004 506
       C 934 552 873 514 872 604
       C 871 704 1038 684 1055 789
       C 1069 877 980 904 960 980"
          />

          <circle class="entrance-door__cta-path-dot" cx="960" cy="980" r="5" />
        </svg>
        <div class="ada-spacer-copy">
          <h2 class="ada-config-heading" aria-label="Kapınızı yalnızca seçmeyin. Kurgulayın.">
            <span class="ada-heading-line"><span class="ada-heading-k">K</span>apınızı yalnızca seçmeyin.</span>
            <span class="ada-heading-line">Kurgulayın.</span>
          </h2>
          <p class="ada-spacer-manifesto-copy">
            Ege Kardoor kapı konfigüratörüyle seri, yüzey, renk, cam, kol ve detay seçeneklerini kendi projenize göre
            deneyimleyin. Beğendiğiniz tasarımı bizimle paylaşın, showroom veya proje ekibimiz sizin için netleştirsin.
          </p>
          <div class="ada-spacer-cta-group" aria-label="Konfigüratör ve koleksiyon bağlantıları">
            <a href="/catalog" class="ada-manifesto-cta ada-spacer-cta" aria-label="Konfigüratörü deneyin">
              <span class="ada-manifesto-cta-text" data-text="Konfigüratörü Deneyin">Konfigüratörü Deneyin</span>
              <span class="ada-manifesto-cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                  <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                </svg>
              </span>
            </a>
            <a href="/catalog" class="ada-manifesto-cta ada-spacer-cta ada-spacer-cta--icon-left" aria-label="Koleksiyonu keşfet">
              <span class="ada-manifesto-cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                  <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="ada-manifesto-cta-text" data-text="Koleksiyonu Keşfet">Koleksiyonu Keşfet</span>
            </a>
          </div>
        </div>
      </div>
    </div>

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
