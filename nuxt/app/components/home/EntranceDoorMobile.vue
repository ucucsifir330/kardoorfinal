<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";
import AdaCtaButton from "~/components/home/AdaCtaButton.vue";
import ShowroomLab from "~/components/home/ShowroomLab.vue";
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

type GestureAxis = "x" | "y";

interface GestureState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
  lastTime: number;
  startEntranceProgress: number;
  startShowroomProgress: number;
  startConfigureProgress: number;
  axis?: GestureAxis;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const MOBILE_SPRITE_COLUMNS = 6;
const MOBILE_SPRITE_ROWS = 4;
const MOBILE_SPRITE_FRAME_COUNT = MOBILE_SPRITE_COLUMNS * MOBILE_SPRITE_ROWS;
const DOOR_BOTTOM_OVERLAP_PX = 3;

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

const copy = computed(() =>
  locale.value === "tr"
    ? {
        line1: "Hayallerinize",
        accent: "Açılan",
        line2: "Kapı",
        subtitleLead: "Güven kapının ardında",
        subtitleAccent: "yaşar.",
        ctaLabel: "Koleksiyonları Keşfet",
        enterCue: "Yukarı kaydırarak gir",
        showroomCue: "Kapılar arasında kaydır",
        exitCue: "Koleksiyona geçmek için kaydırmaya devam et"
      }
    : {
        line1: "The Door",
        accent: "to Your",
        line2: "Dreams",
        subtitleLead: "Confidence lives behind the door",
        subtitleAccent: "",
        ctaLabel: "Explore Collections",
        enterCue: "Swipe up to enter",
        showroomCue: "Swipe between doors",
        exitCue: "Keep swiping to reach the collection"
      }
);

// KURGULAYIN paneli — masaüstündeki entrance-lab__configure slaytının mobil
// karşılığı. Showroom'un son kapısından sonra yatay kaydırınca gelir.
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

const rootRef = ref<HTMLElement | null>(null);
const sceneRef = ref<HTMLElement | null>(null);
const doorStageRef = ref<HTMLElement | null>(null);
const showroomRef = ref<HTMLElement | null>(null);
const copyRef = ref<HTMLElement | null>(null);
const cueRef = ref<HTMLElement | null>(null);

const activeHeroVariant = ref<MobileHeroVariant>(MOBILE_HERO_VARIANTS.at(-1)!);
const showroomProgress = ref(0);
const isEntered = ref(false);
const isDismissed = ref(false);
const phase = ref<"hero" | "transition" | "showroom">("hero");
// Son kapıdan sonraki KURGULAYIN slaytı: 0 = gizli, 1 = tam görünür.
const configureProgress = ref(0);
const isAtLastDoor = computed(() => showroomProgress.value >= 0.999);
const isConfigureOpen = computed(() => configureProgress.value >= 0.999);
const heroSrc = computed(() =>
  isNight.value ? activeHeroVariant.value.nightSrc : activeHeroVariant.value.daySrc
);
const doorSpriteSrc = computed(() =>
  isNight.value ? "/mobile-door-night.webp" : "/mobile-door-light.webp"
);
// Kapı sprite'ı (background-image) yüklenene kadar stage div'i ŞEFFAF, yani
// hero'nun kapı deliği açıkta. Showroom artık baştan görünür olduğu için o
// pencerede kapı çizilmeden delikten sahne sızardı. Sprite ilk kez sonuçlanana
// kadar (başarı VEYA hata) showroom gizli tutulur — bkz. EntranceDoorLab.
const isDoorPainted = ref(false);

let entranceProgress = 0;
let gesture: GestureState | undefined;
let entranceTween: gsap.core.Tween | undefined;
let showroomTween: gsap.core.Tween | undefined;
let configureTween: gsap.core.Tween | undefined;
let resizeFrame = 0;
let showroomBodyState = false;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mobilde header ve iletişim balonu showroom sırasında da erişilebilir kalır;
// masaüstündeki "entrance-lab-showroom-on" gizleme sınıfı bilerek eklenmiyor.
const setShowroomBodyState = (on: boolean) => {
  if (showroomBodyState === on) return;
  showroomBodyState = on;
};

const setEntranceLocked = (locked: boolean) => {
  isDismissed.value = !locked;
  document.body.classList.toggle("entrance-mobile-locked", locked);
};

const placeDoor = () => {
  const root = rootRef.value;
  const scene = sceneRef.value;
  const stage = doorStageRef.value;
  if (!root || !scene || !stage) return;

  const viewportWidth = root.clientWidth;
  const viewportHeight = root.clientHeight;
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

  // Kapı deliğinden görünen showroom, deliğin merkezine doğru ölçeklenir →
  // sahne büyürken delikten görünen kesit kaymaz (bkz. EntranceDoorLab).
  const showroom = showroomRef.value;
  if (showroom) {
    showroom.style.transformOrigin = `${centerX}px ${top + height / 2}px`;
  }
};

const setDoorFrame = (progress: number) => {
  const stage = doorStageRef.value;
  if (!stage) return;

  const doorProgress = clamp01(progress / 0.62);
  const frameIndex = Math.min(
    MOBILE_SPRITE_FRAME_COUNT - 1,
    Math.round(doorProgress * (MOBILE_SPRITE_FRAME_COUNT - 1))
  );
  const column = frameIndex % MOBILE_SPRITE_COLUMNS;
  const row = Math.floor(frameIndex / MOBILE_SPRITE_COLUMNS);
  const x = (column / (MOBILE_SPRITE_COLUMNS - 1)) * 100;
  const y = (row / (MOBILE_SPRITE_ROWS - 1)) * 100;

  stage.style.backgroundPosition = `${x}% ${y}%`;
};

const renderEntrance = (rawProgress: number) => {
  const scene = sceneRef.value;
  const showroom = showroomRef.value;
  const copyElement = copyRef.value;
  const cue = cueRef.value;
  if (!scene || !showroom || !copyElement || !cue) return;

  entranceProgress = clamp01(rawProgress);
  setDoorFrame(entranceProgress);

  const zoomProgress = smoothstep((entranceProgress - 0.16) / 0.84);
  const sceneFade = 1 - smoothstep((entranceProgress - 0.64) / 0.3);
  const showroomFade = smoothstep((entranceProgress - 0.52) / 0.36);
  const copyFade = 1 - smoothstep(entranceProgress / 0.24);
  const cueFade = 1 - smoothstep(entranceProgress / 0.12);

  scene.style.transform = `scale(${1 + zoomProgress * 14})`;
  scene.style.opacity = `${sceneFade}`;
  scene.style.visibility = sceneFade <= 0.002 ? "hidden" : "visible";

  // SHOWROOM = kapının ardındaki SAYFA. Fade YOK: hero'nun kapı deliği şeffaf
  // olduğu için sahne ilk kareden itibaren arkada durur ve kanat aralanınca
  // delikten görünür (eskiden delikten section'ın düz zemini görünüyordu).
  // Sahne 15×'e büyürken showroom 1.12× → 1× iner: parallax = içeri girme.
  showroom.style.opacity = "1";
  showroom.style.transform = `scale(${1 + (1 - zoomProgress) * 0.12})`;
  showroom.style.visibility = isDoorPainted.value ? "visible" : "hidden";
  copyElement.style.opacity = `${copyFade}`;
  copyElement.style.transform = `translate3d(0, calc(-50% - ${24 * (1 - copyFade)}px), 0)`;
  cue.style.opacity = `${cueFade}`;

  setShowroomBodyState(showroomFade > 0.5);
};

const completeEntrance = (target: 0 | 1) => {
  isEntered.value = target === 1;
  phase.value = target === 1 ? "showroom" : "hero";

  if (target === 0) {
    showroomProgress.value = 0;
    configureProgress.value = 0;
    setShowroomBodyState(false);
  }
};

const settleEntrance = (target: 0 | 1) => {
  entranceTween?.kill();
  phase.value = "transition";

  if (prefersReducedMotion()) {
    renderEntrance(target);
    completeEntrance(target);
    return;
  }

  const proxy = { progress: entranceProgress };
  entranceTween = gsap.to(proxy, {
    progress: target,
    duration: target === 1 ? 0.48 : 0.42,
    ease: "power3.out",
    overwrite: true,
    onUpdate: () => renderEntrance(proxy.progress),
    onComplete: () => {
      entranceTween = undefined;
      completeEntrance(target);
    }
  });
};

const settleShowroom = (targetIndex: number) => {
  const maxIndex = Math.max(0, doors.value.length - 1);
  if (!maxIndex) return;

  const boundedIndex = Math.min(maxIndex, Math.max(0, targetIndex));
  const target = boundedIndex / maxIndex;
  showroomTween?.kill();

  if (prefersReducedMotion()) {
    showroomProgress.value = target;
    return;
  }

  const proxy = { progress: showroomProgress.value };
  showroomTween = gsap.to(proxy, {
    progress: target,
    duration: 0.38,
    ease: "power3.out",
    overwrite: true,
    onUpdate: () => {
      showroomProgress.value = proxy.progress;
    },
    onComplete: () => {
      showroomTween = undefined;
    }
  });
};

// KURGULAYIN slaytından sonra yatay kaydırmaya devam edilince overlay yukarı
// kayarak sahneden çıkar, katalog altından görünür. Buton yok; scrollIntoView
// da yok — overlay fixed olduğu için sayfa zaten en üstte, perdeyi kaldırıyoruz.
const exitToCatalog = () => {
  const root = rootRef.value;
  if (!root || isDismissed.value) return;

  entranceTween?.kill();
  showroomTween?.kill();
  configureTween?.kill();
  entranceTween = undefined;
  showroomTween = undefined;
  configureTween = undefined;

  const finish = () => {
    setEntranceLocked(false);
    gsap.set(root, { clearProps: "transform,opacity" });
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  gsap.to(root, {
    yPercent: -100,
    opacity: 0,
    duration: 0.62,
    ease: "power3.inOut",
    onComplete: finish
  });
};

const settleConfigure = (target: 0 | 1) => {
  configureTween?.kill();

  if (prefersReducedMotion()) {
    configureProgress.value = target;
    return;
  }

  const proxy = { progress: configureProgress.value };
  configureTween = gsap.to(proxy, {
    progress: target,
    duration: 0.42,
    ease: "power3.out",
    overwrite: true,
    onUpdate: () => {
      configureProgress.value = proxy.progress;
    },
    onComplete: () => {
      // power3.out sona asimptotik yaklasir; tween bitse bile deger
      // 0.9997 gibi kalabiliyordu. finishGesture'daki ">= 0.999" esigi
      // bu yuzden tutmuyor ve panelden kataloga cikis hic tetiklenmiyordu.
      configureProgress.value = target;
      configureTween = undefined;
    }
  });
};

const onDoorSelect = (index: number) => {
  if (!isEntered.value) return;
  settleShowroom(index);
};

const onPointerDown = (event: PointerEvent) => {
  const target = event.target as Element | null;
  if (target?.closest("a, button")) return;

  entranceTween?.kill();
  showroomTween?.kill();
  configureTween?.kill();
  entranceTween = undefined;
  showroomTween = undefined;
  configureTween = undefined;

  gesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    startTime: performance.now(),
    lastTime: performance.now(),
    startEntranceProgress: entranceProgress,
    startShowroomProgress: showroomProgress.value,
    startConfigureProgress: configureProgress.value
  };

  rootRef.value?.setPointerCapture(event.pointerId);
};

const onPointerMove = (event: PointerEvent) => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;

  const deltaX = event.clientX - gesture.startX;
  const deltaY = event.clientY - gesture.startY;
  const distanceX = Math.abs(deltaX);
  const distanceY = Math.abs(deltaY);

  if (!gesture.axis) {
    if (distanceX < 8 && distanceY < 8) return;
    gesture.axis = distanceX > distanceY ? "x" : "y";
  }

  const root = rootRef.value;
  if (!root) return;

  if (!isEntered.value || gesture.axis === "y") {
    const travel = Math.max(1, root.clientHeight * 0.72);
    const nextProgress =
      gesture.startEntranceProgress + (gesture.startY - event.clientY) / travel;
    phase.value = "transition";
    renderEntrance(nextProgress);
  } else if (gesture.axis === "x") {
    const maxIndex = Math.max(1, doors.value.length - 1);
    const travelPerDoor = Math.max(1, root.clientWidth * 0.72);
    const swipe = (gesture.startX - event.clientX) / travelPerDoor;

    // Son kapıdayken sola kaydırma kapıları değil KURGULAYIN slaytını sürer.
    if (gesture.startShowroomProgress >= 0.999 || gesture.startConfigureProgress > 0) {
      const nextConfigure = clamp01(gesture.startConfigureProgress + swipe);
      configureProgress.value = nextConfigure;
      if (nextConfigure <= 0) {
        showroomProgress.value = clamp01(
          gesture.startShowroomProgress + swipe / maxIndex
        );
      }
    } else {
      showroomProgress.value = clamp01(
        gesture.startShowroomProgress + swipe / maxIndex
      );
    }
  }

  gesture.lastX = event.clientX;
  gesture.lastY = event.clientY;
  gesture.lastTime = performance.now();
};

const finishGesture = (event: PointerEvent) => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;

  const elapsed = Math.max(1, performance.now() - gesture.startTime);
  const deltaX = event.clientX - gesture.startX;
  const velocityX = deltaX / elapsed;
  const velocityY = (event.clientY - gesture.startY) / elapsed;
  const axis = gesture.axis;
  const wasEntered = isEntered.value;
  const startedAtLastDoor = gesture.startShowroomProgress >= 0.999;
  // Panel "acik sayilir" esigi 0.999 idi. Ama onPointerDown her dokunusta
  // configureTween'i kill ediyor; kullanici paneli acan jestin hemen ardindan
  // tekrar kaydirinca startConfigureProgress 0.87 gibi bir yerde kaliyor,
  // sart tutmuyor ve exitToCatalog() HIC cagrilmiyordu → koleksiyonlara
  // gecilemiyor, panel acik kaliyordu. Panel gorsel olarak acik oldugunda
  // (>= 0.85) cikis calismali.
  const startedAtConfigure = gesture.startConfigureProgress >= 0.85;

  rootRef.value?.releasePointerCapture(event.pointerId);
  gesture = undefined;

  if (!axis) {
    phase.value = wasEntered ? "showroom" : "hero";
    return;
  }

  if (!wasEntered || axis === "y") {
    const shouldEnter =
      entranceProgress >= 0.42 || (velocityY < -0.45 && entranceProgress > 0.12);
    const shouldExit =
      wasEntered && entranceProgress < 0.82 && velocityY >= -0.1;
    let target: 0 | 1 = wasEntered ? 1 : 0;
    if (shouldEnter) target = 1;
    if (shouldExit) target = 0;
    settleEntrance(target);
    return;
  }

  // KURGULAYIN slaytı açıkken (veya açılmak üzereyken) yatay jest onu sürer.
  if (startedAtLastDoor || configureProgress.value > 0) {
    const flickLeft = velocityX < -0.45;
    const flickRight = velocityX > 0.45;

    // Panel tam açıkken sola kaydırmaya devam etmek kataloğa geçirir.
    if (startedAtConfigure && (deltaX < -48 || flickLeft)) {
      exitToCatalog();
      return;
    }

    const shouldOpen = flickLeft || (!flickRight && configureProgress.value >= 0.4);
    settleConfigure(shouldOpen ? 1 : 0);
    return;
  }

  const maxIndex = Math.max(0, doors.value.length - 1);
  if (!maxIndex) return;
  const rawIndex = showroomProgress.value * maxIndex;
  let targetIndex = Math.round(rawIndex);

  if (Math.abs(velocityX) > 0.45) {
    targetIndex = velocityX < 0 ? Math.ceil(rawIndex) : Math.floor(rawIndex);
  }

  settleShowroom(targetIndex);
};

const onPointerCancel = (event: PointerEvent) => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  const target = isEntered.value ? 1 : entranceProgress >= 0.5 ? 1 : 0;
  gesture = undefined;
  settleEntrance(target);
};

const handleHome = () => {
  entranceTween?.kill();
  showroomTween?.kill();
  configureTween?.kill();
  entranceTween = undefined;
  showroomTween = undefined;
  configureTween = undefined;

  const root = rootRef.value;
  if (root) gsap.set(root, { clearProps: "transform,opacity" });

  showroomProgress.value = 0;
  configureProgress.value = 0;
  renderEntrance(0);
  completeEntrance(0);
  setEntranceLocked(true);
  window.scrollTo({ top: 0, behavior: "auto" });
};

const handleResize = () => {
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0;
    placeDoor();
    renderEntrance(entranceProgress);
  });
};

onMounted(() => {
  setEntranceLocked(true);
  placeDoor();
  renderEntrance(0);

  // Sprite'ı ayrıca ön-yükle ki "çizildi" anını yakalayabilelim. Aynı URL
  // olduğu için CSS background-image bunu cache'ten alır, ikinci indirme yok.
  const probe = new Image();
  const reveal = () => {
    isDoorPainted.value = true;
  };
  probe.onload = reveal;
  probe.onerror = reveal; // 404 olsa bile sahne sonsuza dek kilitli kalmasın
  probe.src = doorSpriteSrc.value;
  if (probe.complete) reveal();

  window.addEventListener("resize", handleResize);
  window.addEventListener("kardoor:home", handleHome);
});

// Sprite çizildiği anda showroom'u aç: renderEntrance visibility'yi
// isDoorPainted'e göre kuruyor, ama bayrak async geldiği için yeniden
// çalıştırılması gerekir.
watch(isDoorPainted, () => renderEntrance(entranceProgress));

watch([isNight, doorSpriteSrc], async () => {
  await nextTick();
  placeDoor();
  renderEntrance(entranceProgress);
});

onBeforeUnmount(() => {
  entranceTween?.kill();
  showroomTween?.kill();
  configureTween?.kill();
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("kardoor:home", handleHome);
  document.body.classList.remove("entrance-mobile-locked");
  setShowroomBodyState(false);
});
</script>

<template>
  <section
    ref="rootRef"
    class="entrance-mobile"
    :class="[`entrance-mobile--${phase}`, { 'is-dismissed': isDismissed }]"
    :data-ambience="mode"
    aria-label="Kardoor mobil giriş"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="finishGesture"
    @pointercancel="onPointerCancel"
  >
    <div
      ref="showroomRef"
      class="entrance-mobile__showroom"
      :class="{ 'is-active': isEntered }"
      :inert="!isEntered"
    >
      <ShowroomLab :progress="showroomProgress" @door-select="onDoorSelect" />

      <div class="entrance-mobile__showroom-nav">
        <span class="entrance-mobile__showroom-cue">
          {{ isAtLastDoor ? copy.exitCue : copy.showroomCue }}
        </span>
      </div>

      <!-- KURGULAYIN slaytı — son kapıdan sonra yatay kaydırma ile sağdan gelir. -->
      <div
        class="entrance-mobile__configure"
        :class="{ 'is-open': isConfigureOpen }"
        :style="{
          transform: `translate3d(${(1 - configureProgress) * 100}%, 0, 0)`,
          visibility: configureProgress > 0.002 ? 'visible' : 'hidden'
        }"
        :aria-hidden="!isConfigureOpen"
      >
        <div class="entrance-mobile__configure-inner">
          <h2 class="entrance-mobile__configure-heading">
            <span v-for="line in configureCopy.titleLines" :key="line">{{ line }}</span>
          </h2>
          <p class="entrance-mobile__configure-copy">{{ configureCopy.body }}</p>
          <div
            class="entrance-mobile__configure-actions"
            :aria-label="configureCopy.actionsLabel"
          >
            <button
              type="button"
              class="ada-manifesto-cta entrance-mobile__soon-cta"
              aria-disabled="true"
              :tabindex="isConfigureOpen ? 0 : -1"
              :aria-label="configureCopy.configuratorAria"
            >
              <span class="ada-manifesto-cta-text">{{ configureCopy.configurator }}</span>
            </button>
            <a
              href="/catalog"
              class="ada-manifesto-cta entrance-mobile__configure-link"
              :tabindex="isConfigureOpen ? 0 : -1"
              :aria-label="configureCopy.collectionAria"
            >
              <span class="ada-manifesto-cta-text">{{ configureCopy.collection }}</span>
            </a>
          </div>
          <span class="entrance-mobile__configure-cue">{{ copy.exitCue }}</span>
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
        <span>{{ copy.line1 }}</span>
        <span class="entrance-mobile__heading-accent">
          <em>{{ copy.accent }}</em> {{ copy.line2 }}
        </span>
      </h1>
      <p class="entrance-mobile__subtitle">
        {{ copy.subtitleLead }}{{ copy.subtitleAccent ? " " : "" }}
        <em v-if="copy.subtitleAccent">{{ copy.subtitleAccent }}</em>
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

    <div ref="cueRef" class="entrance-mobile__cue" aria-hidden="true">
      <span>{{ copy.enterCue }}</span>
      <span class="entrance-mobile__gesture-line" />
    </div>
  </section>
</template>

<style src="~/assets/styles/sections/entrance-mobile.css"></style>
