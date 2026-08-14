<script setup lang="ts">
/**
 * EntranceDoorMobile — the mobile entrance, driven by ONE pinned scrub, the
 * same architecture as EntranceDoorLab on desktop.
 *
 * It used to be a position:fixed overlay with its own pointer-gesture engine
 * and a hand-off to the page once the user reached the end. That is what made
 * it feel like a curtain hanging in front of the site: the page could not be
 * scrolled back up into it, every reverse had to be written by hand, and the
 * configure slide read as a panel rather than part of the page.
 *
 * Now the section sits in normal flow and ScrollTrigger pins it. Scroll
 * position IS the progress, so every phase reverses for free — scrolling back
 * up walks out through the door to the hero, exactly like scrolling down walked
 * in. No body lock, no hand-off, no dismissal. One continuous scroll.
 *
 * Master progress map over the pin:
 *   0.00–0.10  HOLD    : hero copy readable, door shut
 *   0.10–0.46  PORTAL  : door opens (sprite) while the scene zooms into the hole
 *   0.46–0.54  SETTLE  : showroom takes the screen
 *   0.54–0.86  ORBIT   : doors 01 → 05
 *   0.86–1.00  SLIDE   : configure panel comes in from the right
 * After the pin releases, the catalog continues in the same flow.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AdaCtaButton from "~/components/home/AdaCtaButton.vue";
import ShowroomLabMobile from "~/components/home/ShowroomLabMobile.vue";
import { registerGsap } from "~/composables/useGSAP";
import { useEntranceInput } from "~/composables/useEntranceInput";
import { useEntranceCopy } from "~/composables/useEntranceCopy";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import { useShowroomAmbience } from "~/composables/useShowroomAmbience";
import { useShowroomDoors } from "~/composables/useShowroomDoors";

interface DoorBox {
  centerX: number;
  top: number;
  width: number;
  height: number;
}

interface MobileHeroVariant {
  aspect: number;
  daySrc: string;
  nightSrc: string;
  doorBox: DoorBox;
  nightDoorBox: DoorBox;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
/** Maps an absolute progress onto a [from, to] band as 0→1. */
const band = (value: number, from: number, to: number) =>
  clamp01((value - from) / (to - from));

const MOBILE_SPRITE_COLUMNS = 6;
const MOBILE_SPRITE_ROWS = 4;
const MOBILE_SPRITE_FRAME_COUNT = MOBILE_SPRITE_COLUMNS * MOBILE_SPRITE_ROWS;
const DOOR_BOTTOM_OVERLAP_PX = 3;

// Phase boundaries on the master progress (see the map in the file header).
const PORTAL_START = 0.1;
const PORTAL_END = 0.46;
const ORBIT_START = 0.54;
const ORBIT_END = 0.86;
const SLIDE_START = 0.86;

// Pin length. Desktop uses 9 viewports; a phone scrolls a shorter distance for
// the same content, and a longer pin here just felt like the page had stalled.
const PIN_VIEWPORTS = 6;

const MOBILE_HERO_VARIANTS: MobileHeroVariant[] = [
  {
    aspect: 1,
    daySrc: "/hero-day-1x1.avif",
    nightSrc: "/hero-night-1x1.avif",
    doorBox: { centerX: 50.959, top: 35.688, width: 17.5, height: 27.537 },
    nightDoorBox: { centerX: 50.936, top: 35.584, width: 17.514, height: 27.517 }
  },
  {
    aspect: 3 / 4,
    daySrc: "/hero-day-3x4.avif",
    nightSrc: "/hero-night-3x4.avif",
    doorBox: { centerX: 49.414, top: 42.347, width: 19.468, height: 22.275 },
    nightDoorBox: { centerX: 49.43, top: 42.197, width: 19.637, height: 22.514 }
  },
  {
    aspect: 9 / 16,
    daySrc: "/hero-day-9x16.avif",
    nightSrc: "/hero-night-9x16.avif",
    doorBox: { centerX: 51.388, top: 43.722, width: 26.608, height: 23.262 },
    nightDoorBox: { centerX: 51.368, top: 43.54, width: 26.723, height: 23.533 }
  }
];

const pickHeroVariant = (viewportAspect: number) => {
  let closest = MOBILE_HERO_VARIANTS[0]!;
  let smallestDelta = Infinity;

  for (const variant of MOBILE_HERO_VARIANTS) {
    const delta = Math.abs(Math.log(viewportAspect / variant.aspect));
    if (delta < smallestDelta) {
      smallestDelta = delta;
      closest = variant;
    }
  }

  return closest;
};

const { isNight, mode } = useShowroomAmbience();
const { locale } = useKardoorLocale();
const { doors } = useShowroomDoors();

// Hero copy comes from the shared source — identical to desktop. Only the
// scroll cues live here, because those really are device specific.
const { copy } = useEntranceCopy();

const cues = computed(() =>
  locale.value === "tr"
    ? {
        enterCue: "Yukarı kaydırarak gir",
        showroomCue: "Kaydır"
      }
    : {
        enterCue: "Swipe up to enter",
        showroomCue: "Swipe"
      }
);

// CONFIGURE panel — mobile counterpart of the desktop entrance-lab__configure
// slide. Same copy, same centred composition, sized for a phone.
const configureCopy = computed(() =>
  locale.value === "tr"
    ? {
        titleLines: ["Kapınızı yalnızca seçmeyin.", "Kurgulayın."],
        body:
          "Ege Kardoor kapı konfigüratörüyle seri, yüzey, renk, cam, kol ve detay seçeneklerini kendi projenize göre deneyimleyin. Beğendiğiniz tasarımı bizimle paylaşın, showroom veya proje ekibimiz sizin için netleştirsin.",
        actionsLabel: "Konfigüratör ve koleksiyon bağlantıları",
        configuratorAria: "Konfigüratörü deneyin — çok yakında",
        configurator: "Konfigüratörü Deneyin",
        soon: "Çok Yakında!",
        collectionAria: "Koleksiyonu keşfet",
        collection: "Koleksiyonu Keşfet"
      }
    : {
        titleLines: ["Do not simply choose your door.", "Compose it."],
        body:
          "Experience each series, finish, colour, glass, handle, and architectural detail through the Ege Kardoor door configurator. Share the composition you prefer, and our showroom or project team will refine it for your space.",
        actionsLabel: "Configurator and collection links",
        configuratorAria: "Try the configurator — coming soon",
        configurator: "Try the Configurator",
        soon: "Coming Soon!",
        collectionAria: "Explore the collection",
        collection: "Explore the Collection"
      }
);

// Word lists for the scroll-choreographed reveal. Split in the template rather
// than by walking the DOM: SSR-safe, and it re-splits itself on locale change.
const configureTitleWords = computed(() =>
  configureCopy.value.titleLines.map((line) => line.split(" "))
);
const configureBodyWords = computed(() => configureCopy.value.body.split(" "));

const rootRef = ref<HTMLElement | null>(null);
const frameRef = ref<HTMLElement | null>(null);
const sceneRef = ref<HTMLElement | null>(null);
const doorStageRef = ref<HTMLElement | null>(null);
const showroomRef = ref<HTMLElement | null>(null);
const copyRef = ref<HTMLElement | null>(null);
const cueRef = ref<HTMLElement | null>(null);
const configureRef = ref<HTMLElement | null>(null);

const activeHeroVariant = ref<MobileHeroVariant>(MOBILE_HERO_VARIANTS.at(-1)!);
const showroomProgress = ref(0);
const isShowroomLive = ref(false);
const isConfigureOpen = ref(false);
const isSwipeHintVisible = ref(false);
const heroSrc = computed(() =>
  isNight.value ? activeHeroVariant.value.nightSrc : activeHeroVariant.value.daySrc
);
const doorSpriteSrc = computed(() =>
  isNight.value ? "/mobile-door-night.webp" : "/mobile-door-light.webp"
);
// Until the door sprite and the hero photo are painted the scene layer is
// empty and the showroom behind the transparent door hole fills the screen.
const isDoorPainted = ref(false);
const isHeroPainted = ref(false);
const isSceneReady = computed(() => isDoorPainted.value && isHeroPainted.value);

let masterProgress = 0;
let trigger: ScrollTrigger | undefined;
let entranceInput: ReturnType<typeof useEntranceInput> | undefined;
let configureTimeline: gsap.core.Timeline | undefined;
let resizeFrame = 0;
let lastResizeWidth = 0;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const placeDoor = () => {
  const frame = frameRef.value;
  const scene = sceneRef.value;
  const stage = doorStageRef.value;
  if (!frame || !scene || !stage) return;

  const viewportWidth = frame.clientWidth;
  const viewportHeight = frame.clientHeight;
  if (!viewportWidth || !viewportHeight) return;

  const viewportAspect = viewportWidth / viewportHeight;
  const variant = pickHeroVariant(viewportAspect);
  activeHeroVariant.value = variant;

  const coverWidth =
    viewportAspect > variant.aspect ? viewportWidth : viewportHeight * variant.aspect;
  const coverHeight =
    viewportAspect > variant.aspect ? viewportWidth / variant.aspect : viewportHeight;
  const coverLeft = (viewportWidth - coverWidth) / 2;
  const coverTop = (viewportHeight - coverHeight) / 2;
  const box = isNight.value ? variant.nightDoorBox : variant.doorBox;
  const width = (box.width / 100) * coverWidth;
  const height = (box.height / 100) * coverHeight + DOOR_BOTTOM_OVERLAP_PX;
  const centerX = coverLeft + (box.centerX / 100) * coverWidth;
  const top = coverTop + (box.top / 100) * coverHeight;

  stage.style.left = `${centerX - width / 2}px`;
  stage.style.top = `${top}px`;
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  scene.style.transformOrigin = `${centerX}px ${top + height / 2}px`;

  // Door geometry as custom properties — the hero copy sits on the marble under
  // the threshold and the cue beside the frame, so both follow the measured box.
  frame.style.setProperty("--door-center-x", `${centerX}px`);
  frame.style.setProperty("--door-threshold-y", `${top + height}px`);
  frame.style.setProperty("--door-width", `${width}px`);

  const showroom = showroomRef.value;
  if (showroom) {
    showroom.style.transformOrigin = `${centerX}px ${top + height / 2}px`;
  }
};

const setDoorFrame = (progress: number) => {
  const stage = doorStageRef.value;
  if (!stage) return;

  const frameIndex = Math.min(
    MOBILE_SPRITE_FRAME_COUNT - 1,
    Math.round(clamp01(progress) * (MOBILE_SPRITE_FRAME_COUNT - 1))
  );
  const column = frameIndex % MOBILE_SPRITE_COLUMNS;
  const row = Math.floor(frameIndex / MOBILE_SPRITE_COLUMNS);
  const x = (column / (MOBILE_SPRITE_COLUMNS - 1)) * 100;
  const y = (row / (MOBILE_SPRITE_ROWS - 1)) * 100;

  stage.style.backgroundPosition = `${x}% ${y}%`;
};

/**
 * Builds the configure choreography ONCE, paused. The scrub drives its
 * progress, so the whole reveal plays forward on the way down and unplays on
 * the way up — no separate reverse to maintain, and it never fights the finger.
 *
 * Every property here is transform or opacity. The desktop panel reveals with
 * blur + clip-path; both are per-frame paint on a phone.
 */
const buildConfigureTimeline = () => {
  const panel = configureRef.value;
  if (!panel) return;

  configureTimeline?.kill();

  const inner = panel.querySelector(".entrance-mobile__configure-inner");
  const headWords = panel.querySelectorAll(
    ".entrance-mobile__configure-line-mask:first-child .entrance-mobile__configure-word"
  );
  const accentWords = panel.querySelectorAll(
    ".entrance-mobile__configure-line-mask:last-child .entrance-mobile__configure-word"
  );
  const bodyWords = panel.querySelectorAll(".entrance-mobile__configure-body-word");
  const pills = panel.querySelectorAll(".entrance-mobile__configure-actions > *");

  const timeline = gsap.timeline({ paused: true, defaults: { force3D: true } });

  if (prefersReducedMotion()) {
    configureTimeline = timeline;
    return;
  }

  timeline
    .fromTo(inner, { y: 34 }, { y: 0, duration: 1, ease: "expo.out" }, 0)
    .fromTo(
      headWords,
      { yPercent: 118, rotateX: -62, opacity: 0 },
      {
        yPercent: 0,
        rotateX: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.07,
        ease: "expo.out"
      },
      0.05
    )
    .fromTo(
      accentWords,
      { yPercent: 118, rotateX: -62, opacity: 0 },
      {
        yPercent: 0,
        rotateX: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: "back.out(1.4)"
      },
      0.28
    )
    .fromTo(
      bodyWords,
      { yPercent: 46, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.012, ease: "power3.out" },
      0.5
    )
    .fromTo(
      pills,
      { y: 20, scale: 0.9, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.09,
        ease: "back.out(1.7)"
      },
      0.78
    );

  configureTimeline = timeline;
};

const updateMaster = (progress: number) => {
  const scene = sceneRef.value;
  const showroom = showroomRef.value;
  const copyElement = copyRef.value;
  const cue = cueRef.value;
  const configure = configureRef.value;
  if (!scene || !showroom || !copyElement || !cue || !configure) return;

  masterProgress = clamp01(progress);

  const portal = band(masterProgress, PORTAL_START, PORTAL_END);
  const zoom = smoothstep(portal);
  const sceneFade = 1 - smoothstep(band(masterProgress, PORTAL_END - 0.14, PORTAL_END));
  const copyFade = 1 - smoothstep(band(masterProgress, 0, PORTAL_START + 0.02));
  const cueFade = 1 - smoothstep(band(masterProgress, 0, PORTAL_START * 0.7));

  setDoorFrame(portal);

  scene.style.transform = `scale(${1 + zoom * 14})`;
  scene.style.opacity = `${sceneFade}`;
  scene.style.visibility = sceneFade <= 0.002 ? "hidden" : "visible";

  // SHOWROOM = the page BEHIND the door. No fade: it sits behind the hero's
  // transparent door hole from the first frame and shows through as the leaf
  // opens. While the scene blows up to 15x the showroom eases 1.12x → 1x; the
  // difference in speed is the parallax that reads as walking in.
  showroom.style.transform = `scale(${1 + (1 - zoom) * 0.12})`;
  showroom.style.visibility = isSceneReady.value ? "visible" : "hidden";

  copyElement.style.opacity = `${copyFade}`;
  copyElement.style.transform = `translate3d(0, ${-22 * (1 - copyFade)}px, 0)`;
  cue.style.opacity = `${cueFade}`;

  showroomProgress.value = band(masterProgress, ORBIT_START, ORBIT_END);

  const slide = band(masterProgress, SLIDE_START, 1);
  configure.style.transform = `translate3d(${(1 - slide) * 100}%, 0, 0)`;
  configure.style.visibility = slide > 0.002 ? "visible" : "hidden";
  // The panel finishes sliding in the first third of the band; the reveal
  // choreography owns the rest, so the words land after the panel has arrived.
  configureTimeline?.progress(band(slide, 0.34, 1));

  const live = masterProgress > PORTAL_END - 0.1;
  if (isShowroomLive.value !== live) isShowroomLive.value = live;

  const openNow = slide >= 0.999;
  if (isConfigureOpen.value !== openNow) isConfigureOpen.value = openNow;

  // The swipe affordance only makes sense while the doors are the subject.
  const hint = masterProgress > PORTAL_END && masterProgress < ORBIT_START + 0.05;
  if (isSwipeHintVisible.value !== hint) isSwipeHintVisible.value = hint;
};

/* ──────────────────────────────────────────────────────────────────────
   THE PULL. The scrub above is only the visual mapping; on its own it makes
   the scene follow the finger 1:1, which is not what the desktop does.
   Desktop intercepts the input and TWEENS THE SCROLL POSITION to the next
   stop — one push, and you are drawn through as if on a rope.

   Same contract here, through the same composable: useEntranceInput reduces a
   swipe to drive(direction, strength, cancel), and settleToProgress animates
   window scroll to the target. Because the scrub still owns the rendering,
   every pull reverses by pulling the other way.
   ────────────────────────────────────────────────────────────────────── */
const doorSnapPoints = computed(() => {
  const count = Math.max(1, doors.value.length);
  if (count === 1) return [ORBIT_START];
  return Array.from(
    { length: count },
    (_, index) => ORBIT_START + (index / (count - 1)) * (ORBIT_END - ORBIT_START)
  );
});

let scrollTween: gsap.core.Tween | undefined;
let isSettling = false;
let settleCooldownUntil = 0;

const progressToScroll = (progress: number) => {
  if (!trigger) return 0;
  return trigger.start + (trigger.end - trigger.start) * clamp01(progress);
};

const settleToProgress = (
  targetProgress: number,
  duration = 0.9,
  ease = "power3.inOut"
) => {
  if (!trigger) return;

  scrollTween?.kill();
  isSettling = true;

  const release = () => {
    isSettling = false;
    scrollTween = undefined;
    settleCooldownUntil = performance.now() + 260;
  };

  if (prefersReducedMotion()) {
    window.scrollTo({ top: progressToScroll(targetProgress), behavior: "auto" });
    release();
    return;
  }

  scrollTween = gsap.to(window, {
    scrollTo: progressToScroll(targetProgress),
    duration,
    ease,
    overwrite: true,
    onInterrupt: release,
    onComplete: release
  });
};

const nearestDoorIndex = (progress: number) =>
  doorSnapPoints.value.reduce(
    (nearest, point, index) =>
      Math.abs(point - progress) < Math.abs(doorSnapPoints.value[nearest]! - progress)
        ? index
        : nearest,
    0
  );

const driveEntrance = (direction: 1 | -1, _strength: number, cancel: () => void) => {
  if (!trigger) return;
  if (isSettling || performance.now() < settleCooldownUntil) {
    cancel();
    return;
  }

  const progress = masterProgress;
  const points = doorSnapPoints.value;
  const firstDoor = points[0]!;
  const lastDoor = points[points.length - 1]!;

  // HERO → SHOWROOM. One swipe walks the whole portal, slowly. This is the
  // long pull the desktop plays when you first push into the door.
  if (progress < firstDoor - 0.02) {
    if (direction < 0) return; // already at the top — let the page be
    cancel();
    settleToProgress(firstDoor, 2.2, "power3.inOut");
    return;
  }

  // CONFIGURE → CATALOG. Do NOT cancel: the pin is finished, the page should
  // just keep scrolling into the catalog.
  if (progress >= 0.999 && direction > 0) return;

  // Back out through the door — the reverse of the long pull.
  if (progress <= firstDoor + 0.02 && direction < 0) {
    cancel();
    settleToProgress(0, 2, "power3.inOut");
    return;
  }

  cancel();

  // On the last door a forward push brings the configure panel in.
  if (progress >= lastDoor - 0.02 && direction > 0) {
    settleToProgress(1, 1.1, "power3.inOut");
    return;
  }

  // Coming back off the configure panel lands on the last door.
  if (progress > lastDoor + 0.02 && direction < 0) {
    settleToProgress(lastDoor, 1.1, "power3.inOut");
    return;
  }

  // ONE PUSH = ONE DOOR.
  const index = nearestDoorIndex(progress);
  const target = Math.min(points.length - 1, Math.max(0, index + direction));
  settleToProgress(points[target]!, 0.85, "power3.inOut");
};

const onDoorSelect = (index: number) => {
  const target = doorSnapPoints.value[index];
  if (target === undefined) return;
  settleToProgress(target, 0.7);
};

// A TAP on the hero also walks you in — same pull as the swipe, no gesture to
// discover. Only from the hero, and never from a link or button.
let tapStartX = 0;
let tapStartY = 0;
let tapCandidate = false;

const onScenePointerDown = (event: PointerEvent) => {
  const target = event.target as Element | null;
  tapCandidate =
    !target?.closest("a, button") &&
    masterProgress < doorSnapPoints.value[0]! - 0.02 &&
    !isSettling;
  tapStartX = event.clientX;
  tapStartY = event.clientY;
};

const onScenePointerUp = (event: PointerEvent) => {
  if (!tapCandidate) return;
  tapCandidate = false;

  // A drag is the swipe path's business; only a still finger counts as a tap.
  const moved =
    Math.abs(event.clientX - tapStartX) > 10 || Math.abs(event.clientY - tapStartY) > 10;
  if (moved) return;

  settleToProgress(doorSnapPoints.value[0]!, 2.2, "power3.inOut");
};

const buildTrigger = () => {
  const root = rootRef.value;
  if (!root) return;

  trigger?.kill();
  trigger = ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * PIN_VIEWPORTS)}`,
    scrub: true,
    pin: true,
    pinSpacing: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => updateMaster(self.progress),
    onRefresh: (self) => {
      placeDoor();
      updateMaster(self.progress);
    }
  });

  // The scene already owns a pin trigger, so the input layer reuses that band
  // (`band`, not `trigger`) instead of measuring a second one. Attachment is
  // synced from scroll position rather than ScrollTrigger's onToggle:
  // isActive turns false exactly AT the end of the pin, which is precisely
  // where the configure panel sits — the listeners came off at the one spot
  // the user needs to pull back from.
  entranceInput?.destroy();
  entranceInput = useEntranceInput({
    band: { initialActive: true },
    drive: driveEntrance,
    touch: true,
    keyboard: true,
    // Momentum scrolling emits a stream of tiny wheel deltas; ignore the noise.
    minStrength: 2
  });
  entranceInput.start();
  syncInputBand();
};

// Attached while the scroll sits inside the pin, end INCLUSIVE. Past that the
// listeners come off so the rest of the page keeps the browser's fast path.
const syncInputBand = () => {
  if (!trigger || !entranceInput) return;
  entranceInput.setActive(window.scrollY <= trigger.end + 2);
};

const handleResize = () => {
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0;
    placeDoor();
    updateMaster(masterProgress);

    // Width-only gate: a full ScrollTrigger.refresh() re-measures every trigger
    // on the page. Height changes on mobile are the address bar, and the pin
    // geometry does not depend on height.
    if (window.innerWidth !== lastResizeWidth) {
      lastResizeWidth = window.innerWidth;
      ScrollTrigger.refresh();
    }
  });
};

const handleHome = () => {
  window.scrollTo({ top: 0, behavior: "auto" });
};

onMounted(() => {
  registerGsap();
  lastResizeWidth = window.innerWidth;

  // The address bar showing/hiding fires resize on every mobile browser. Without
  // this the pin re-measures mid-scroll and the scene jumps.
  ScrollTrigger.config({ ignoreMobileResize: true });

  placeDoor();
  buildConfigureTimeline();
  updateMaster(0);
  buildTrigger();

  // Preload both layers so we know when they are actually painted. Same URLs as
  // the markup/CSS, so these come from cache — no second download.
  const watchImage = (src: string, flag: { value: boolean }) => {
    const probe = new Image();
    const reveal = () => {
      flag.value = true;
      ScrollTrigger.refresh();
    };
    probe.onload = reveal;
    probe.onerror = reveal; // a 404 must not lock the scene forever
    probe.src = src;
    if (probe.complete) reveal();
  };

  watchImage(doorSpriteSrc.value, isDoorPainted);
  watchImage(heroSrc.value, isHeroPainted);

  window.addEventListener("resize", handleResize);
  window.addEventListener("kardoor:home", handleHome);
  window.addEventListener("scroll", syncInputBand, { passive: true });
});

// The showroom's visibility is decided from these flags and they arrive async.
watch(isSceneReady, () => updateMaster(masterProgress));

// Locale change re-renders the word spans, so the timeline must be rebuilt
// against the new nodes.
watch(configureTitleWords, async () => {
  await nextTick();
  buildConfigureTimeline();
  updateMaster(masterProgress);
});

watch([isNight, doorSpriteSrc], async () => {
  await nextTick();
  placeDoor();
  updateMaster(masterProgress);
});

onBeforeUnmount(() => {
  entranceInput?.destroy();
  scrollTween?.kill();
  trigger?.kill();
  configureTimeline?.kill();
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("kardoor:home", handleHome);
  window.removeEventListener("scroll", syncInputBand);
});
</script>

<template>
  <section
    ref="rootRef"
    class="entrance-mobile"
    :data-ambience="mode"
    aria-label="Kardoor mobil giriş"
    @pointerdown="onScenePointerDown"
    @pointerup="onScenePointerUp"
  >
    <div ref="frameRef" class="entrance-mobile__frame">
      <div
        ref="showroomRef"
        class="entrance-mobile__showroom"
        :class="{ 'is-active': isShowroomLive }"
        :inert="!isShowroomLive"
      >
        <ShowroomLabMobile :progress="showroomProgress" @door-select="onDoorSelect" />

        <!-- Right-edge swipe affordance — a ball riding a hairline track,
             shown only while the doors are the subject. -->
        <div
          class="entrance-mobile__swipe"
          :class="{ 'is-visible': isSwipeHintVisible }"
          aria-hidden="true"
        >
          <svg class="entrance-mobile__swipe-mark" viewBox="0 0 80 16" fill="none">
            <defs>
              <linearGradient id="em-swipe-track" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="currentColor" stop-opacity="0" />
                <stop offset="0.35" stop-color="currentColor" stop-opacity="0.55" />
                <stop offset="1" stop-color="currentColor" stop-opacity="0.55" />
              </linearGradient>
            </defs>
            <line x1="4" y1="8" x2="76" y2="8" stroke="url(#em-swipe-track)" stroke-width="1" stroke-linecap="round" />
            <circle class="entrance-mobile__swipe-ball" cx="70" cy="8" r="3.5" fill="currentColor" />
          </svg>
          <span class="entrance-mobile__swipe-label">{{ cues.showroomCue }}</span>
        </div>

        <!-- CONFIGURE — the last band of the pin. Part of the scroll, so
             scrolling back up takes it out again. -->
        <div
          ref="configureRef"
          class="entrance-mobile__configure"
          :class="{ 'is-open': isConfigureOpen }"
          :aria-hidden="!isConfigureOpen"
        >
          <div class="entrance-mobile__configure-inner">
            <!-- Words are individually wrapped so each can rise out of a
                 per-line overflow mask. No clip-path, no blur. -->
            <h2 class="entrance-mobile__configure-heading">
              <span
                v-for="(words, lineIndex) in configureTitleWords"
                :key="lineIndex"
                class="entrance-mobile__configure-line-mask"
              ><span
                v-for="(word, wordIndex) in words"
                :key="`${lineIndex}-${wordIndex}`"
                class="entrance-mobile__configure-word"
              >{{ word }}<span v-if="wordIndex < words.length - 1"> </span></span></span>
            </h2>
            <p class="entrance-mobile__configure-copy">
              <span
                v-for="(word, index) in configureBodyWords"
                :key="index"
                class="entrance-mobile__configure-body-word"
              >{{ word }}<span v-if="index < configureBodyWords.length - 1"> </span></span>
            </p>
            <div
              class="entrance-mobile__configure-actions"
              :aria-label="configureCopy.actionsLabel"
            >
              <!-- data-text / data-hover are REQUIRED: .ada-manifesto-cta-text
                   paints its label through content: attr(data-text) on a
                   transparent span. Without them the button renders empty. -->
              <button
                type="button"
                class="ada-manifesto-cta entrance-mobile__soon-cta"
                aria-disabled="true"
                :tabindex="isConfigureOpen ? 0 : -1"
                :aria-label="configureCopy.configuratorAria"
              >
                <span
                  class="ada-manifesto-cta-text"
                  :data-text="configureCopy.configurator"
                  :data-hover="configureCopy.soon"
                >{{ configureCopy.configurator }}</span>
                <span class="ada-manifesto-cta-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                    <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                  </svg>
                </span>
              </button>
              <a
                href="/catalog"
                class="ada-manifesto-cta entrance-mobile__configure-link"
                :tabindex="isConfigureOpen ? 0 : -1"
                :aria-label="configureCopy.collectionAria"
              >
                <span class="ada-manifesto-cta-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                    <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                  </svg>
                </span>
                <span
                  class="ada-manifesto-cta-text"
                  :data-text="configureCopy.collection"
                >{{ configureCopy.collection }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div ref="sceneRef" class="entrance-mobile__scene" aria-hidden="true">
        <img
          :src="heroSrc"
          class="entrance-mobile__background"
          fetchpriority="high"
          decoding="async"
          alt=""
          draggable="false"
        />
        <div
          ref="doorStageRef"
          class="entrance-mobile__door"
          :style="{ backgroundImage: `url(${doorSpriteSrc})` }"
        />
      </div>

      <div ref="copyRef" class="entrance-mobile__copy">
        <h1 class="entrance-mobile__heading">
          <span class="entrance-mobile__heading-line">{{ copy.line1 }}</span>
          <span class="entrance-mobile__heading-line entrance-mobile__heading-line--accent">
            <em>{{ copy.accent }}</em> {{ copy.line2 }}
          </span>
        </h1>
        <p class="entrance-mobile__subtitle">
          {{ copy.subtitleLead }}{{ copy.subtitleAccent ? " " : ""
          }}<em v-if="copy.subtitleAccent">{{ copy.subtitleAccent }}</em>
        </p>
        <div class="entrance-mobile__actions">
          <AdaCtaButton
            :label="copy.ctaLabel"
            href="/catalog"
            variant="filled"
            icon-position="none"
          />
          <a class="entrance-mobile__arrow" href="/catalog" :aria-label="copy.ctaLabel">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12H19" />
              <path d="M14 7L19 12L14 17" />
            </svg>
          </a>
        </div>
      </div>

      <!-- ENTER CUE — right margin, beside the door. The label reads
           bottom-to-top so it stays in the gutter. -->
      <div ref="cueRef" class="entrance-mobile__cue" aria-hidden="true">
        <span class="entrance-mobile__cue-label">{{ cues.enterCue }}</span>
        <svg class="entrance-mobile__cue-mark" viewBox="0 0 16 72" fill="none">
          <defs>
            <linearGradient id="em-cue-track" x1="8" y1="0" x2="8" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="currentColor" stop-opacity="0" />
              <stop offset="0.45" stop-color="currentColor" stop-opacity="0.8" />
              <stop offset="1" stop-color="currentColor" stop-opacity="0.8" />
            </linearGradient>
          </defs>
          <line x1="8" y1="4" x2="8" y2="68" stroke="url(#em-cue-track)" stroke-width="1" stroke-linecap="round" />
          <circle class="entrance-mobile__cue-ball" cx="8" cy="62" r="3.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  </section>
</template>

<style src="~/assets/styles/sections/entrance-mobile.css"></style>
