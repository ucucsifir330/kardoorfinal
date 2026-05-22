<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

type EntrancePhase =
  | "intro"
  | "door-opening"
  | "portal-reveal"
  | "showroom"
  | "complete";

type ShowroomDoor = {
  id: string;
  name: string;
  series: string;
  image: string;
  fallbackImage: string;
};

const { locale } = useKardoorLocale();

const imageKitBaseUrl = "https://ik.imagekit.io/kardoor";

const homeImages = {
  day: `${imageKitBaseUrl}/EvLight.png`,
  night: `${imageKitBaseUrl}/EvDark.png`
} as const;

const seriesImages = {
  emeraldLine: `${imageKitBaseUrl}/series/4.png?updatedAt=1778762645568`,
  monoGraphite: `${imageKitBaseUrl}/series/5.png?updatedAt=1778762645583`,
  ivoryLine: `${imageKitBaseUrl}/series/1.png?updatedAt=1778762643897`,
  graphiteOak: `${imageKitBaseUrl}/series/2.png?updatedAt=1778762645386`,
  classicSand: `${imageKitBaseUrl}/series/3.png?updatedAt=1778762644382`
} as const;

const frameCount = 120;

const homeDoorRect = {
  x: 658,
  y: 228,
  width: 374,
  height: 418
};

const croppedRenderDoorRect = {
  x: 0,
  y: 0,
  width: 524,
  height: 585
};

const fullRenderDoorRect = {
  x: 1028,
  y: 415,
  width: 524,
  height: 585
};

const heroRef = ref<HTMLElement | null>(null);
const backgroundImageRef = ref<HTMLImageElement | null>(null);
const sequenceRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showroomTrackRef = ref<HTMLElement | null>(null);

const progress = ref(0);
const hasDispatchedOpen = ref(false);

let entranceTrigger: ScrollTrigger | null = null;
let resizeObserver: ResizeObserver | null = null;

const loadedFrames = new Map<number, HTMLImageElement>();
const pendingFrames = new Map<number, Promise<HTMLImageElement>>();

let canvasContext: CanvasRenderingContext2D | null = null;
let currentFrameIndex = -1;

const showroomDoors = computed<ShowroomDoor[]>(() => [
  {
    id: "emerald-line",
    name: "Emerald Line",
    series: locale.value === "tr" ? "Atelier Serisi" : "Atelier Series",
    image: seriesImages.emeraldLine,
    fallbackImage: seriesImages.emeraldLine
  },
  {
    id: "mono-graphite",
    name: "Mono Graphite",
    series: locale.value === "tr" ? "Atelier Serisi" : "Atelier Series",
    image: seriesImages.monoGraphite,
    fallbackImage: seriesImages.monoGraphite
  },
  {
    id: "ivory-line",
    name: "Ivory Line",
    series: locale.value === "tr" ? "Atelier Serisi" : "Atelier Series",
    image: seriesImages.ivoryLine,
    fallbackImage: seriesImages.ivoryLine
  },
  {
    id: "graphite-oak",
    name: "Graphite Oak",
    series: locale.value === "tr" ? "Atelier Serisi" : "Atelier Series",
    image: seriesImages.graphiteOak,
    fallbackImage: seriesImages.graphiteOak
  },
  {
    id: "classic-sand",
    name: "Classic Sand",
    series: locale.value === "tr" ? "Atelier Serisi" : "Atelier Series",
    image: seriesImages.classicSand,
    fallbackImage: seriesImages.classicSand
  }
]);

const portalDoor = computed<ShowroomDoor>(() => showroomDoors.value[0] as ShowroomDoor);

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const smooth = (value: number) => {
  const clamped = clamp(value);
  return clamped * clamped * (3 - 2 * clamped);
};

const phase = computed<EntrancePhase>(() => {
  if (progress.value < 0.16) return "intro";
  if (progress.value < 0.48) return "door-opening";
  if (progress.value < 0.9) return "portal-reveal";
  if (progress.value < 0.99) return "showroom";

  return "complete";
});

const doorProgress = computed(() => {
  const start = 0.12;
  const end = 0.58;

  return smooth((progress.value - start) / (end - start));
});

const portalProgress = computed(() => {
  const start = 0.38;
  const end = 0.86;

  return smooth((progress.value - start) / (end - start));
});

const cameraProgress = computed(() => {
  const start = 0.34;
  const end = 0.86;

  return smooth((progress.value - start) / (end - start));
});

const showroomProgress = computed(() => {
  const start = 0.78;
  const end = 1;

  return smooth((progress.value - start) / (end - start));
});

const handoffProgress = computed(() => {
  const start = 0.82;
  const end = 0.9;

  return smooth((progress.value - start) / (end - start));
});

const entranceStyle = computed(() => ({
  "--entrance-progress": progress.value.toFixed(4),
  "--door-progress": doorProgress.value.toFixed(4),
  "--portal-progress": portalProgress.value.toFixed(4),
  "--camera-progress": cameraProgress.value.toFixed(4),
  "--showroom-progress": showroomProgress.value.toFixed(4),
  "--handoff-progress": handoffProgress.value.toFixed(4)
}));

const copy = computed(() =>
  locale.value === "tr"
    ? {
        sectionLabel: "Kardoor giriş animasyonu",
        imageAlt: "Kardoor çelik kapılı modern villa girişi",
        titleLine: "Hayallerinize",
        accent: "Açılan",
        suffix: "Kapı",
        scroll: "Kaydır",
        ctaTitle: "Güvenle açılan kapılar"
      }
    : {
        sectionLabel: "Kardoor entrance animation",
        imageAlt: "Modern villa entrance with Kardoor steel door",
        titleLine: "The Door",
        accent: "to Your",
        suffix: "Dreams",
        scroll: "Scroll",
        ctaTitle: "See more models"
      }
);

const useImageFallback = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null;
  const fallback = image?.dataset.fallbackSrc;

  if (!image || !fallback || image.src.endsWith(fallback)) return;

  image.src = fallback;
};

const frameUrl = (frameNumber: number) =>
  `${imageKitBaseUrl}/newdoorrender/${String(frameNumber).padStart(4, "0")}.png`;

const loadFrame = (frameNumber: number) => {
  const loadedFrame = loadedFrames.get(frameNumber);
  if (loadedFrame) return Promise.resolve(loadedFrame);

  const pendingFrame = pendingFrames.get(frameNumber);
  if (pendingFrame) return pendingFrame;

  const image = new Image();
  image.decoding = "async";
  image.src = frameUrl(frameNumber);

  const request = (image.decode ? image.decode() : Promise.resolve())
    .catch(
      () =>
        new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject();
        })
    )
    .then(() => {
      loadedFrames.set(frameNumber, image);
      return image;
    })
    .finally(() => {
      pendingFrames.delete(frameNumber);
    });

  pendingFrames.set(frameNumber, request);

  return request;
};

const getRenderDoorRect = (source: HTMLImageElement) => {
  const canUseFullRenderCrop =
    source.naturalWidth >= fullRenderDoorRect.x + fullRenderDoorRect.width &&
    source.naturalHeight >= fullRenderDoorRect.y + fullRenderDoorRect.height;

  return canUseFullRenderCrop ? fullRenderDoorRect : croppedRenderDoorRect;
};

const drawFrame = (source: HTMLImageElement) => {
  const sequence = sequenceRef.value;
  const canvas = canvasRef.value;

  if (!sequence || !canvas || !canvasContext) return;

  const displayWidth = Math.max(1, Math.round(sequence.clientWidth));
  const displayHeight = Math.max(1, Math.round(sequence.clientHeight));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const canvasWidth = Math.max(1, Math.round(displayWidth * pixelRatio));
  const canvasHeight = Math.max(1, Math.round(displayHeight * pixelRatio));

  if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
  if (canvas.height !== canvasHeight) canvas.height = canvasHeight;

  canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  canvasContext.clearRect(0, 0, displayWidth, displayHeight);

  const renderDoorRect = getRenderDoorRect(source);
  const sourceAspect = renderDoorRect.width / renderDoorRect.height;
  const displayAspect = displayWidth / displayHeight;
  const drawWidth =
    displayAspect > sourceAspect ? displayHeight * sourceAspect : displayWidth;
  const drawHeight =
    displayAspect > sourceAspect ? displayHeight : displayWidth / sourceAspect;
  const drawX = (displayWidth - drawWidth) / 2;
  const drawY = (displayHeight - drawHeight) / 2;

  canvasContext.drawImage(
    source,
    renderDoorRect.x,
    renderDoorRect.y,
    renderDoorRect.width,
    renderDoorRect.height,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );
};

const updatePortalGeometry = () => {
  const hero = heroRef.value;
  if (!hero) return;

  const bounds = hero.getBoundingClientRect();

  const doorLeft = Number.parseFloat(hero.style.getPropertyValue("--door-left"));
  const doorTop = Number.parseFloat(hero.style.getPropertyValue("--door-top"));
  const doorWidth = Number.parseFloat(hero.style.getPropertyValue("--door-width"));
  const doorHeight = Number.parseFloat(hero.style.getPropertyValue("--door-height"));

  if (![doorLeft, doorTop, doorWidth, doorHeight].every(Number.isFinite)) return;

  const openingLeft = doorLeft + doorWidth * 0.34;
  const openingTop = doorTop + doorHeight * 0.1;
  const openingWidth = doorWidth * 0.2;
  const openingHeight = doorHeight * 0.8;

  const expand = portalProgress.value;
  const zoom = cameraProgress.value;

  const targetScale = Math.max(
    1,
    Math.min(18, Math.max(bounds.width / openingWidth, bounds.height / openingHeight) * 1.08)
  );

  const cameraScale = 1 + (targetScale - 1) * zoom;

  const startTop = openingTop;
  const startRight = bounds.width - openingLeft - openingWidth;
  const startBottom = bounds.height - openingTop - openingHeight;
  const startLeft = openingLeft;

  const clipTop = startTop * (1 - expand);
  const clipRight = startRight * (1 - expand);
  const clipBottom = startBottom * (1 - expand);
  const clipLeft = startLeft * (1 - expand);

  const handoff = handoffProgress.value;
  const portalOpacity = 0;
  const showroomOpacity = clamp((progress.value - 0.38) / 0.12);
  const doorLayerOpacity = 1 - clamp((progress.value - 0.78) / 0.08);

  hero.style.setProperty("--camera-scale", `${cameraScale}`);
  hero.style.setProperty("--portal-opacity", `${portalOpacity}`);
  hero.style.setProperty("--portal-content-opacity", `${1 - handoff}`);
  hero.style.setProperty("--showroom-opacity", `${showroomOpacity}`);
  hero.style.setProperty("--door-layer-opacity", `${doorLayerOpacity}`);
  hero.style.setProperty("--portal-clip-top", `${clipTop}px`);
  hero.style.setProperty("--portal-clip-right", `${clipRight}px`);
  hero.style.setProperty("--portal-clip-bottom", `${clipBottom}px`);
  hero.style.setProperty("--portal-clip-left", `${clipLeft}px`);
};

const updateDoorGeometry = () => {
  const hero = heroRef.value;
  const backgroundImage = backgroundImageRef.value;

  if (!hero || !backgroundImage) return;

  const naturalWidth = backgroundImage.naturalWidth || 1376;
  const naturalHeight = backgroundImage.naturalHeight || 768;
  const bounds = hero.getBoundingClientRect();

  const [positionX = "50%", positionY = "0%"] = window
    .getComputedStyle(backgroundImage)
    .objectPosition.split(/\s+/);

  const xRatio = Number.parseFloat(positionX) / 100;
  const yRatio = Number.parseFloat(positionY) / 100;

  const scale = Math.max(bounds.width / naturalWidth, bounds.height / naturalHeight);
  const renderedWidth = naturalWidth * scale;
  const renderedHeight = naturalHeight * scale;

  const offsetX = (bounds.width - renderedWidth) * (Number.isFinite(xRatio) ? xRatio : 0.5);
  const offsetY = (bounds.height - renderedHeight) * (Number.isFinite(yRatio) ? yRatio : 0);

  const doorLeft = offsetX + homeDoorRect.x * scale;
  const doorTop = offsetY + homeDoorRect.y * scale;
  const doorWidth = homeDoorRect.width * scale;
  const doorHeight = homeDoorRect.height * scale;
  const doorCenterX = doorLeft + doorWidth * 0.5;
  const doorCenterY = doorTop + doorHeight * 0.5;

  hero.style.setProperty("--door-left", `${doorLeft}px`);
  hero.style.setProperty("--door-top", `${doorTop}px`);
  hero.style.setProperty("--door-width", `${doorWidth}px`);
  hero.style.setProperty("--door-height", `${doorHeight}px`);
  hero.style.setProperty("--door-center-x", `${doorCenterX}px`);
  hero.style.setProperty("--door-center-y", `${doorCenterY}px`);

  updatePortalGeometry();
  updateShowroomTrack();

  const currentFrameNumber = currentFrameIndex + 1;
  const currentFrame = loadedFrames.get(currentFrameNumber);

  if (currentFrame) drawFrame(currentFrame);
};

const updateShowroomTrack = () => {
  const track = showroomTrackRef.value;
  if (!track) return;

  const distance = Math.max(0, track.scrollWidth - window.innerWidth);
  const trackX = -distance * showroomProgress.value;

  track.style.setProperty("--showroom-track-x", `${trackX}px`);
};

const updateFrameFromProgress = async () => {
  const frameIndex = Math.min(
    frameCount - 1,
    Math.max(0, Math.floor(doorProgress.value * (frameCount - 1)))
  );

  if (frameIndex === currentFrameIndex) return;

  currentFrameIndex = frameIndex;

  const frameNumber = frameIndex + 1;
  const frame = await loadFrame(frameNumber);

  drawFrame(frame);
};

const preloadImportantFrames = () => {
  [1, 12, 24, 48, 72, 96, 120].forEach((frameNumber) => {
    loadFrame(frameNumber).catch(() => undefined);
  });
};

const preloadFirstShowroomDoor = () => {
  const door = portalDoor.value;
  const image = new Image();
  image.decoding = "async";
  image.src = door.image;
};

const dispatchDoorState = (isOpen: boolean) => {
  window.dispatchEvent(
    new CustomEvent("kardoor:entrance-door-state", {
      detail: { isOpen }
    })
  );
};

watch(doorProgress, () => {
  updateFrameFromProgress();
});

watch([portalProgress, cameraProgress, handoffProgress, progress], () => {
  updatePortalGeometry();
});

watch(showroomProgress, () => {
  updateShowroomTrack();
});

watch(handoffProgress, (nextHandoffProgress) => {
  if (nextHandoffProgress < 0.35 || hasDispatchedOpen.value) return;

  hasDispatchedOpen.value = true;
  dispatchDoorState(true);
});

onMounted(async () => {
  await nextTick();

  const hero = heroRef.value;
  const backgroundImage = backgroundImageRef.value;
  const canvas = canvasRef.value;

  if (!hero || !backgroundImage || !canvas) return;

  gsap.registerPlugin(ScrollTrigger);

  canvasContext = canvas.getContext("2d");
  if (!canvasContext) return;

  if (backgroundImage.complete) {
    updateDoorGeometry();
  } else {
    backgroundImage.addEventListener("load", updateDoorGeometry, { once: true });
  }

  preloadImportantFrames();
  preloadFirstShowroomDoor();
  await updateFrameFromProgress();

  resizeObserver = new ResizeObserver(() => {
    updateDoorGeometry();
  });

  resizeObserver.observe(hero);

  entranceTrigger = ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: () => `+=${Math.max(window.innerHeight * 9, window.innerWidth * 5.5)}`,
    scrub: 0.6,
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onRefresh: () => {
      updateDoorGeometry();
      updatePortalGeometry();
      updateShowroomTrack();
    },
    onUpdate: (self) => {
      progress.value = self.progress;
    },
    onLeaveBack: () => {
      progress.value = 0;
      hasDispatchedOpen.value = false;
      updatePortalGeometry();
      updateShowroomTrack();
      dispatchDoorState(false);
    }
  });
});

onBeforeUnmount(() => {
  entranceTrigger?.kill();
  entranceTrigger = null;

  resizeObserver?.disconnect();
  resizeObserver = null;

  loadedFrames.clear();
  pendingFrames.clear();

  dispatchDoorState(false);
});
</script>

<template>
  <section
    ref="heroRef"
    class="entrance-door"
    :class="`entrance-door--${phase}`"
    :data-phase="phase"
    :style="entranceStyle"
    :aria-label="copy.sectionLabel"
  >
    <div class="entrance-door__background" aria-hidden="true">
      <img
        ref="backgroundImageRef"
        :src="homeImages.day"
        :alt="copy.imageAlt"
        class="entrance-door__image entrance-door__image--day"
        decoding="async"
        loading="eager"
      >

      <img
        :src="homeImages.night"
        alt=""
        class="entrance-door__image entrance-door__image--night"
        decoding="async"
        loading="eager"
      >
    </div>

    <div class="entrance-door__portal" aria-hidden="true">
      <article class="entrance-door__portal-panel">
        <h2 class="entrance-door__portal-title">
          {{ portalDoor.name }}
        </h2>

        <p class="entrance-door__portal-series">
          {{ portalDoor.series }}
        </p>

        <div class="entrance-door__portal-door">
          <img
            class="entrance-door__portal-image"
            :src="portalDoor.image"
            :alt="portalDoor.name"
            :data-fallback-src="portalDoor.fallbackImage"
            width="520"
            height="820"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            draggable="false"
            @error="useImageFallback"
          >
        </div>
      </article>
    </div>

    <div class="entrance-door__showroom" aria-live="polite">
      <div ref="showroomTrackRef" class="entrance-door__showroom-track">
        <article
          v-for="(door, index) in showroomDoors"
          :key="door.id"
          class="entrance-door__showroom-panel"
        >
          <h2 class="entrance-door__showroom-title">
            {{ door.name }}
          </h2>

          <p class="entrance-door__showroom-series">
            {{ door.series }}
          </p>

          <div class="entrance-door__showroom-door">
            <img
              class="entrance-door__showroom-image"
              :src="door.image"
              :alt="door.name"
              :data-fallback-src="door.fallbackImage"
              width="520"
              height="820"
              :loading="index === 0 ? 'eager' : 'lazy'"
              :fetchpriority="index === 0 ? 'high' : 'auto'"
              decoding="async"
              draggable="false"
              @error="useImageFallback"
            >
          </div>
        </article>

        <article class="entrance-door__showroom-panel entrance-door__showroom-panel--cta">
          <h2 class="entrance-door__showroom-cta">
            {{ copy.ctaTitle }}
          </h2>
        </article>
      </div>
    </div>

    <div class="entrance-door__door-layer" aria-hidden="true">
      <div ref="sequenceRef" class="entrance-door__sequence">
        <canvas ref="canvasRef" class="entrance-door__frame" />
      </div>
    </div>

    <div class="entrance-door__content">
      <h1 class="entrance-door__title">
        <span>{{ copy.titleLine }}</span>
        <span>
          <span class="entrance-door__title-accent">{{ copy.accent }}</span>
          {{ copy.suffix }}
        </span>
      </h1>
    </div>

    <div class="entrance-door__scroll-cue" aria-hidden="true">
      <span>{{ copy.scroll }}</span>
      <i />
    </div>
  </section>
</template>
