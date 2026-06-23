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
const ctaPathRef = ref<SVGSVGElement | null>(null);

const turntableProgress = ref(0);
const isShowroomActive = ref(false);
const isShowroomUiActive = ref(false);
const { $smoother } = useNuxtApp();

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

    setVar(hero,"--zoom-origin-x", `${originX}px`);
    setVar(hero,"--zoom-origin-y", `${originY}px`);
    setVar(zoomLayer,"--zoom-origin-x", `${originX}px`);
    setVar(zoomLayer,"--zoom-origin-y", `${originY}px`);

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

  // Cached CSS-var writer: skip setProperty when the value hasn't changed. Across
  // the long pinned section most vars sit at a plateau (e.g. the whole intro is
  // "done" during the showroom phase), so this drops the bulk of the per-frame
  // style invalidations that were thrashing the main thread.
  const varCache = new WeakMap<HTMLElement, Map<string, string>>();
  const setVar = (el: HTMLElement, name: string, value: string) => {
    let m = varCache.get(el);
    if (!m) {
      m = new Map();
      varCache.set(el, m);
    }
    if (m.get(name) === value) return;
    m.set(name, value);
    el.style.setProperty(name, value);
  };

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

    setVar(zoomLayer,"--zoom-scale", `${zoomScale}`);
    setVar(zoomLayer,"--doorway-reveal", `${doorwayReveal}`);
    setVar(zoomLayer,"--doorway-reveal-clip", `${(1 - doorwayReveal) * 100}%`);
    setVar(hero,"--showroom-scale", `${showroomScale}`);
    setVar(hero,"--showroom-align-x", `${showroomAlignX}px`);
    setVar(hero,"--showroom-align-y", `${showroomAlignY}px`);
    setVar(hero,"--showroom-content-opacity", `${showroomContentOpacity}`);
    setVar(hero,"--showroom-ui-opacity", `${showroomUiReveal}`);
    setVar(hero,"--showroom-ui-x", `${(1 - showroomUiReveal) * 76}px`);
    setVar(hero,"--showroom-backdrop-opacity", `${showroomAtmosphereReveal}`);
    setVar(hero,"--showroom-text-clip", `${100 - showroomAtmosphereReveal * 100}%`);
    setVar(hero,"--showroom-text-x", `${(1 - showroomAtmosphereReveal) * 72}px`);
    hero.classList.toggle("entrance-door--backdrop-running", showroomAtmosphereReveal > 0.015);
    setVar(hero,"--showroom-door-rise-y", `${showroomDoorRiseY}px`);
    setVar(hero,"--showroom-neighbor-rise-y", `${showroomNeighborRiseY}px`);
    setVar(hero,"--showroom-orbit-depth", `${showroomOrbitDepth}`);

    const fadeOutStart = FIRST_DOOR_SETTLE_START + (TURNTABLE_START - FIRST_DOOR_SETTLE_START) * 0.42;
    const zoomFade = 1 - easeInOut(clamp01((p - fadeOutStart) / (TURNTABLE_START - fadeOutStart)));
    const showroomLayerOpacity = 1 - zoomFade;
    setVar(zoomLayer,"--zoom-fade", `${zoomFade}`);
    setVar(hero,"--showroom-layer-opacity", `${showroomLayerOpacity}`);

    const copyFade = clamp01((p - 0.04) / 0.2);
    setVar(hero,"--hero-copy-opacity", `${1 - copyFade}`);
    setVar(hero,"--hero-copy-y", `${copyFade * -28}px`);
    setVar(hero,"--hero-cue-opacity", `${1 - clamp01(p / 0.12)}`);

    const ttP = clamp01((p - TURNTABLE_START) / (TURNTABLE_END - TURNTABLE_START));
    const horizontalSlideP = easeInOut(clamp01((p - HORIZONTAL_SLIDE_START) / (HORIZONTAL_SLIDE_END - HORIZONTAL_SLIDE_START)));
    const ctaPathProgress = clamp01((p - CTA_PATH_START) / (1 - CTA_PATH_START));
    setVar(hero,"--showroom-page-x", `${horizontalSlideP * -100}%`);
    updateCtaPathMotion(ctaPathProgress);
    turntableProgress.value = ttP;
    isShowroomActive.value = showroomLayerOpacity > 0.02;
    isShowroomUiActive.value = showroomUiReveal > 0.08;
  };

  // ───────────── SCROLL TRIGGER + AUTO-SETTLE HELPERS ─────────────
  let trigger: ScrollTrigger | undefined;
  let previousProgress = 0;
  let lockedDoorIndex: number | undefined;

  const getProgressY = (progress: number) => {
    if (!trigger) return 0;
    return trigger.start + (trigger.end - trigger.start) * clamp01(progress);
  };

  const getSmoother = () => ($smoother as undefined | (() => any))?.();

  const getNearestDoorIndex = (progress: number) =>
    DOOR_SNAP_POINTS.reduce((nearestIndex, point, index) =>
      Math.abs(point - progress) < Math.abs(DOOR_SNAP_POINTS[nearestIndex]! - progress) ? index : nearestIndex
    , 0);

  // ───────────── PORTAL GRAB (GSAP auto-settle into showroom) ─────────────
  // When the door is ~65% open and the user is scrolling DOWN, take control and
  // pull them through the portal straight to the showroom. Reversible: scrolling
  // up cancels the pull and lets the user climb back out to the hero.
  const DOOR_ENTER_RATIO = 0.65; // door-open % that triggers the grab (tunable)
  const PORTAL_ENTER_PROGRESS = DOOR_ENTER_RATIO * SEQ_END; // ≈ 0.195 (door ~65% open)
  const PORTAL_TARGET_PROGRESS = TURNTABLE_START; // showroom arrival (0.68)
  const PORTAL_DURATION = 2.6; // seconds — slow, silky glide (tunable)
  const PORTAL_EASE = "power2.inOut"; // silky ease in/out (tunable)
  const PORTAL_INTENT = 0.0006; // min progress delta that counts as real scroll intent

  let portalTween: ReturnType<typeof gsap.to> | undefined;
  let isPortalPulling = false;
  let portalDir = 0; // 1 = pulling in (down → showroom), -1 = pulling out (up → door)
  let portalCooldownUntil = 0;

  // Glide to a progress target, taking control from the user. `dir` tags the
  // direction so an opposite-intent wheel can reverse the glide mid-flight.
  const startPortalPull = (targetProgress: number, dir: 1 | -1) => {
    const smoother = getSmoother();
    if (!smoother || !trigger) return;

    const targetY = getProgressY(targetProgress);
    const proxy = { y: smoother.scrollTop() };
    isPortalPulling = true;
    portalDir = dir;
    portalTween?.kill();
    portalTween = gsap.to(proxy, {
      y: targetY,
      duration: PORTAL_DURATION,
      ease: PORTAL_EASE,
      onUpdate: () => smoother.scrollTo(proxy.y, false),
      onComplete: () => {
        isPortalPulling = false;
        portalDir = 0;
        portalTween = undefined;
        portalCooldownUntil = performance.now() + 320;
      }
    });
  };

  // Opposite-direction scroll during a glide reverses it to the other end,
  // so scrolling back up returns you to the door (the pickup point).
  const onPortalWheel = (event: WheelEvent) => {
    if (!isPortalPulling) return;
    if (portalDir === 1 && event.deltaY < -6) startPortalPull(PORTAL_ENTER_PROGRESS, -1);
    else if (portalDir === -1 && event.deltaY > 6) startPortalPull(PORTAL_TARGET_PROGRESS, 1);
  };
  window.addEventListener("wheel", onPortalWheel, { passive: true });

  const maybePortalGrab = (progress: number, delta: number) => {
    if (isPortalPulling || performance.now() < portalCooldownUntil) return;
    if (Math.abs(delta) < PORTAL_INTENT) return;

    // Scrolling DOWN into the tunnel → glide all the way into the showroom.
    if (delta > 0 && progress >= PORTAL_ENTER_PROGRESS && progress < PORTAL_TARGET_PROGRESS - 0.02) {
      startPortalPull(PORTAL_TARGET_PROGRESS, 1);
      return;
    }
    // Scrolling UP out of the showroom → glide back to the door (pickup point).
    if (delta < 0 && progress > PORTAL_ENTER_PROGRESS + 0.02 && progress <= PORTAL_TARGET_PROGRESS) {
      startPortalPull(PORTAL_ENTER_PROGRESS, -1);
    }
  };

  // ───────────── TURNTABLE AUTO-SETTLE (GSAP ScrollSmoother) ─────────────
  // Door-to-door pagination inside the showroom turntable. One scroll gesture
  // glides to the next door and locks there; the next gesture advances again —
  // "hop, hop" — until the user steps past the last door into the horizontal
  // slide (down) or back toward the portal (up). Migrated from the old Lenis
  // snap engine; now drives ScrollSmoother.scrollTo, same as the portal grab.
  const DOOR_STEP_DURATION = 1.0;        // seconds per door hop (tunable)
  const DOOR_STEP_EASE = "power3.inOut"; // silky settle (tunable)
  const DOOR_STEP_COOLDOWN = 260;        // ms lock after a hop before the next (tunable)
  // After the last door, auto-settle through the horizontal slide and stop with the
  // "Kurgulayın" panel centered + the collections card peeking up from the bottom,
  // then hand scroll fully back to the user. CARD_PEEK_PX = how far the card rises
  // above the fold at the settle point (tune this live to match the marked amount).
  const CARD_PEEK_PX = 60;               // VISIBLE px of the collections card at settle (tunable)
  const SLIDE_SETTLE_DURATION = 3.0;     // seconds for the slide → card settle glide
  const SLIDE_SETTLE_EASE = "power2.inOut"; // premium, silky in/out (tunable)

  let doorTween: ReturnType<typeof gsap.to> | undefined;
  let isDoorGliding = false;
  let doorGlideDir = 0; // 1 = toward next door, -1 = toward previous
  let doorCooldownUntil = 0;
  let doorFromIndex = 0;
  let doorToIndex = 0;

  // Low-level glide: take control and ease the smoother to an absolute scroll Y.
  const glideToY = (
    targetY: number,
    dir: number,
    duration = DOOR_STEP_DURATION,
    ease: string = DOOR_STEP_EASE
  ) => {
    const smoother = getSmoother();
    if (!smoother) return;

    isDoorGliding = true;
    doorGlideDir = dir;
    // Kill any residual smoother momentum so the glide doesn't fight the user's
    // leftover scroll inertia for the first few frames (the onset "catch").
    const startY = smoother.scrollTop();
    smoother.scrollTo(startY, false);
    const proxy = { y: startY };
    doorTween?.kill();
    doorTween = gsap.to(proxy, {
      y: targetY,
      duration,
      ease,
      onUpdate: () => smoother.scrollTo(proxy.y, false),
      onComplete: () => {
        isDoorGliding = false;
        doorGlideDir = 0;
        doorTween = undefined;
        doorCooldownUntil = performance.now() + DOOR_STEP_COOLDOWN;
      }
    });
  };

  // Glide to a master-timeline progress target (0..1).
  const glideToProgress = (
    targetProgress: number,
    dir: number,
    duration = DOOR_STEP_DURATION,
    ease: string = DOOR_STEP_EASE
  ) => {
    if (!trigger) return;
    glideToY(getProgressY(clamp01(targetProgress)), dir, duration, ease);
  };

  const glideToDoor = (toIndex: number, fromIndex: number, dir: number) => {
    const clamped = Math.min(DOOR_SNAP_POINTS.length - 1, Math.max(0, toIndex));
    doorFromIndex = fromIndex;
    doorToIndex = clamped;
    lockedDoorIndex = clamped;
    glideToProgress(DOOR_SNAP_POINTS[clamped]!, dir);
  };

  // Scroll position where the collections card peeks exactly CARD_PEEK_PX above the
  // fold. Anchored to the catalog element itself (not the pin end) so CARD_PEEK_PX
  // means literally "how many px of the card show" — easy to dial in so the
  // "Koleksiyonlar" title stays hidden.
  const getSlideSettleY = () => {
    const smoother = getSmoother();
    if (!smoother || !trigger) return 0;
    const catalog = document.querySelector<HTMLElement>(".catalog-section");
    if (catalog) {
      const catalogTopDoc = catalog.getBoundingClientRect().top + smoother.scrollTop();
      return catalogTopDoc - (window.innerHeight - CARD_PEEK_PX);
    }
    return trigger.end + CARD_PEEK_PX; // fallback
  };

  // Past the last door: sweep the whole horizontal slide in one glide and settle so
  // only a sliver of the collections card peeks, then release scroll to the user
  // (free scroll into collections). Purely scroll-driven — no capture after.
  const glideToSlideSettle = () => {
    if (!trigger) return;
    lockedDoorIndex = undefined;
    glideToY(getSlideSettleY(), 1, SLIDE_SETTLE_DURATION, SLIDE_SETTLE_EASE);
  };

  // Inside the turntable band we take the scroll COMPLETELY away from the user.
  // No free scrolling here — the wheel is captured (preventDefault) so the native
  // position never moves on its own and can't fight our glide. Each gesture simply
  // advances exactly one door. At the band edges we hand control back: past the
  // last door we flow into the horizontal slide; before the first we climb back
  // out through the portal. Non-passive listener (preventDefault needs it).
  //
  // CRITICAL: the band must END BEFORE the horizontal slide starts, otherwise the
  // exit glide (to HORIZONTAL_SLIDE_START) lands back inside the captured band and
  // the user gets trapped at the last door — never reaching the slide or anything
  // below it. Last door = TURNTABLE_END (0.86); slide starts at 0.865, so eps must
  // be < 0.005 to leave a clean gap between them.
  const TURNTABLE_BAND_EPS = 0.004;
  const onTurntableWheel = (event: WheelEvent) => {
    if (!trigger || !getSmoother()) return; // desktop + smoother only

    const p = trigger.progress;
    const inBand =
      p >= TURNTABLE_START - TURNTABLE_BAND_EPS && p <= TURNTABLE_END + TURNTABLE_BAND_EPS;

    if (!inBand) {
      // Slide/settle zone = the swept region between the last door and the settle
      // point. Reverse symmetry: scrolling UP here mirrors the down-glide and
      // sweeps back to the showroom (last door) at the same pace/ease. Scrolling
      // DOWN releases into the collections (free scroll).
      const y = getSmoother()!.scrollTop();
      const yLastDoor = getProgressY(TURNTABLE_END);
      const ySettle = getSlideSettleY();
      const inSlideZone = y > yLastDoor + 1 && y <= ySettle;

      if (inSlideZone) {
        if (isDoorGliding || performance.now() < doorCooldownUntil) {
          event.preventDefault();
          return;
        }
        if (event.deltaY < -2) {
          event.preventDefault();
          lockedDoorIndex = DOOR_SNAP_POINTS.length - 1;
          glideToProgress(TURNTABLE_END, -1, SLIDE_SETTLE_DURATION, SLIDE_SETTLE_EASE);
          return;
        }
        return; // scrolling down → native scroll into collections
      }

      lockedDoorIndex = undefined;
      return; // outside everything → native scroll + portal logic handle it
    }

    // We own the scroll here. Block native movement entirely.
    event.preventDefault();

    if (isPortalPulling || isDoorGliding || performance.now() < doorCooldownUntil) return;
    if (Math.abs(event.deltaY) < 2) return;

    const dir = event.deltaY > 0 ? 1 : -1;
    if (lockedDoorIndex === undefined) lockedDoorIndex = getNearestDoorIndex(p);
    const targetIndex = lockedDoorIndex + dir;

    if (targetIndex >= DOOR_SNAP_POINTS.length) {
      glideToSlideSettle();
      return;
    }
    if (targetIndex < 0) {
      lockedDoorIndex = undefined;
      startPortalPull(PORTAL_ENTER_PROGRESS, -1);
      return;
    }

    glideToDoor(targetIndex, lockedDoorIndex, dir);
  };
  window.addEventListener("wheel", onTurntableWheel, { passive: false });

  // Turntable UI (prev/next arrows + dots) drive the same glide engine.
  requestDoorStep = (direction: -1 | 1) => {
    if (!trigger) return;

    const nearest = getNearestDoorIndex(trigger.progress);
    const targetIndex = nearest + direction;

    if (targetIndex < 0) {
      glideToDoor(0, nearest, -1);
      return;
    }

    if (targetIndex >= DOOR_SNAP_POINTS.length) {
      glideToSlideSettle();
      return;
    }

    glideToDoor(targetIndex, nearest, direction);
  };

  requestDoorSelect = (index: number) => {
    if (!trigger || index < 0 || index >= DOOR_SNAP_POINTS.length) return;

    const nearest = getNearestDoorIndex(trigger.progress);
    glideToDoor(index, nearest, Math.sign(index - nearest) || 1);
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

      updateMaster(self.progress);
      maybePortalGrab(self.progress, progressDelta);
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
    portalTween?.kill();
    isPortalPulling = false;
    doorTween?.kill();
    isDoorGliding = false;
    window.removeEventListener("wheel", onPortalWheel);
    window.removeEventListener("wheel", onTurntableWheel);
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
          <!-- During the door-opening reveal the real turntable is always at door 0
               (turntableProgress is 0 until the showroom phase, by which point this
               peek-through layer has faded out). Feeding a constant 0 keeps this
               second turntable from re-rendering every frame for nothing. -->
          <ShowroomTurntable
            class="entrance-door__doorway-interior"
            :progress="0"
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
