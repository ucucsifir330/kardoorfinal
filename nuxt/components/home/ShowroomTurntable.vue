<script setup lang="ts">
/**
 * ShowroomTurntable
 *
 * 5 kapı ReactBits orbit mantığıyla yatay elips üzerinde döner.
 * Scroll eşiklerinde snap yapar: aktif kapı merkezde büyük, yan kapılar flu/küçük.
 */

import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import AdaCtaButton from "./AdaCtaButton.vue";

type Door = {
  id: string;
  name: { tr: string; en: string };
  nameDisplay: { lead: string; tail: string };
  series: { tr: string; en: string };
  image: string;
  spec: { tr: string; en: string };
  meta: { tr: string; en: string };
  visual: DoorVisual;
};

type DoorVisual = {
  activeScale: number;
  activeX: number;
  activeY: number;
  backdropScale: number;
  backdropX: string;
  backdropY: string;
  backdropOpacity: number;
};

const IK_BASE = "https://ik.imagekit.io/kardoor";
const ik = (path: string, ver: string) =>
  `${IK_BASE}/${path}?tr=f-webp,q-82&updatedAt=${ver}`;

const LOREM_TR =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const LOREM_EN =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const META_TR = "Çelik gövde · 80mm · Akustik yalıtım";
const META_EN = "Steel core · 80mm · Acoustic insulation";

const defaultVisual: DoorVisual = {
  activeScale: 1,
  activeX: 0,
  activeY: 0,
  backdropScale: 1,
  backdropX: "0vw",
  backdropY: "-4vh",
  backdropOpacity: 1
};

const doors: Door[] = [
  {
    id: "ivory-line",
    name: { tr: "Alüminyum Sistemler", en: "Alüminyum Sistemler" },
    nameDisplay: { lead: "Alüminyum", tail: "Sistemler" },
    series: { tr: "Dış İklim Koleksiyonu", en: "Dış İklim Koleksiyonu" },
    image: ik("series/1.png", "1778762643897"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN },
    visual: {
      activeScale: 1.04,
      activeX: -10,
      activeY: 0,
      backdropScale: 1.05,
      backdropX: "-2vw",
      backdropY: "-4vh",
      backdropOpacity: 1
    }
  },
  {
    id: "graphite-oak",
    name: { tr: "Pivot Sistemler", en: "Pivot Sistemler" },
    nameDisplay: { lead: "Pivot", tail: "Sistemler" },
    series: { tr: "Exclusive Koleksiyonu", en: "Exclusive Koleksiyonu" },
    image: ik("series/2.png", "1778762645386"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN },
    visual: {
      activeScale: 0.98,
      activeX: 0,
      activeY: 0,
      backdropScale: 0.96,
      backdropX: "-1vw",
      backdropY: "-4vh",
      backdropOpacity: 1
    }
  },
  {
    id: "classic-sand",
    name: { tr: "Thermowood Sistemler", en: "Thermowood Sistemler" },
    nameDisplay: { lead: "Thermowood", tail: "Sistemler" },
    series: { tr: "Dış İklim Koleksiyonu", en: "Dış İklim Koleksiyonu" },
    image: ik("series/3.png", "1778762644382"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN },
    visual: {
      activeScale: 1,
      activeX: 0,
      activeY: 0,
      backdropScale: 1,
      backdropX: "0vw",
      backdropY: "-4vh",
      backdropOpacity: 1
    }
  },
  {
    id: "emerald-line",
    name: { tr: "Doğal Yüzeyler", en: "Doğal Yüzeyler" },
    nameDisplay: { lead: "Doğal", tail: "Yüzeyler" },
    series: { tr: "Dış İklim Koleksiyonu", en: "Dış İklim Koleksiyonu" },
    image: ik("series/4.png", "1778762645568"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN },
    visual: {
      activeScale: 1.06,
      activeX: -6,
      activeY: 0,
      backdropScale: 0.94,
      backdropX: "-3vw",
      backdropY: "-4vh",
      backdropOpacity: 1
    }
  },
  {
    id: "mono-graphite",
    name: { tr: "Camlı Yüzeyler", en: "Camlı Yüzeyler" },
    nameDisplay: { lead: "Camlı", tail: "Yüzeyler" },
    series: { tr: "Dış İklim Koleksiyonu", en: "Dış İklim Koleksiyonu" },
    image: ik("series/5.png", "1778762645583"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN },
    visual: {
      activeScale: 0.92,
      activeX: 18,
      activeY: 0,
      backdropScale: 0.96,
      backdropX: "0vw",
      backdropY: "-4vh",
      backdropOpacity: 1
    }
  }
];

const props = defineProps<{
  progress: number; // 0 → 1
}>();

const emit = defineEmits<{
  doorStep: [direction: -1 | 1];
  doorSelect: [index: number];
}>();

const { locale } = useKardoorLocale();

const TOTAL_ROTATION = 360;
const STEP = TOTAL_ROTATION / doors.length;
const ORBIT_RADIUS_X = 360;
const ORBIT_RADIUS_Y = 50;

const degToRad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Sürekli (float) kapı index'i — scrub progress'inden direkt türetilir.
// Math.round YOK; orbit pozisyonları sürekli interpolate edilir.
const floatIndex = computed(() =>
  clamp(props.progress * (doors.length - 1), 0, doors.length - 1)
);

// Info panel için yine ayrık (rounded) index — sadece Vue Transition tetiklensin.
const activeIndex = computed(() => Math.round(floatIndex.value));

const orbitDoors = computed(() => {
  const count = doors.length;
  const f = floatIndex.value;

  return doors.map((door, i) => {
    const rawOffset = i - f;
    let offset = rawOffset;
    if (offset > count / 2) offset -= count;
    if (offset < -count / 2) offset += count;

    const distance = Math.abs(offset);
    const angle = offset * STEP;
    const rad = degToRad(angle);
    const x = Math.sin(rad) * ORBIT_RADIUS_X;
    const y = (1 - Math.cos(rad)) * ORBIT_RADIUS_Y;

    // ── Sürekli eğriler ────────────────────────────────────────
    // distance: 0 = aktif, 1 = komşu, 2+ = uzak
    const nearActive = clamp(1 - distance, 0, 1); // 1 → 0
    const nearNeighbor = clamp(1 - Math.abs(distance - 1), 0, 1); // 0→1→0
    const farTail = clamp(distance - 1, 0, 1.5); // 0 → 1.5

    // Scale: aktif 1.22 → komşu 0.62 → uzak 0.5
    const scale =
      distance <= 1
        ? lerp(0.62, 1.22, nearActive)
        : Math.max(0.5, lerp(0.62, 0.5, clamp(distance - 1, 0, 1)));

    // Opacity: aktif 1 → komşu 0.34 → uzak 0
    const baseOpacity =
      distance <= 1
        ? lerp(0.34, 1, nearActive)
        : Math.max(0, lerp(0.34, 0, clamp(distance - 1, 0, 1)));
    const lastDoorApproach = clamp((f - (count - 1.82)) / 0.18, 0, 1);
    const isWrappedTrailingDoor = rawOffset < -count / 2;
    const trailingFade = isWrappedTrailingDoor ? 1 - lastDoorApproach : 1;
    const isTrailingHidden = isWrappedTrailingDoor && lastDoorApproach >= 0.01;
    const opacity = isTrailingHidden ? 0 : baseOpacity * trailingFade;

    // Blur: aktif 0 → komşu 7 → uzak 10
    const blur =
      distance <= 1
        ? lerp(7, 0, nearActive)
        : Math.min(10, lerp(7, 10, clamp(distance - 1, 0, 1)));

    // zIndex sürekli mesafeye göre — aktife en yakın olan üstte
    const zIndex = isTrailingHidden ? -1 : Math.round(40 - distance * 12);

    // Aktife yakın olduğunda hafifçe yükselsin (cinematic lift)
    const lift = nearActive * -6;
    return {
      door,
      x,
      y: y + lift,
      scale: isTrailingHidden ? 0.001 : scale,
      opacity,
      blur: isTrailingHidden ? 16 : blur,
      zIndex,
      angle,
      nearActive,
      nearNeighbor,
      farTail
    };
  });
});

const activeDoor = computed(() => doors[activeIndex.value]!);
const backdropMarqueeText = computed(() =>
  `${activeDoor.value.nameDisplay.lead} ${activeDoor.value.nameDisplay.tail}`.toLocaleUpperCase("tr-TR")
);
const nameFitScale = computed(() =>
  `${clamp(8.9 / activeDoor.value.nameDisplay.lead.length, 0.82, 1)}`
);
const backdropStyle = computed(() => ({
  "--backdrop-scale": `${activeDoor.value.visual.backdropScale}`,
  "--backdrop-x": activeDoor.value.visual.backdropX,
  "--backdrop-y": activeDoor.value.visual.backdropY,
  "--backdrop-opacity": `calc(var(--showroom-backdrop-opacity, 1) * ${activeDoor.value.visual.backdropOpacity})`
}));
const doorNumber = computed(() => String(activeIndex.value + 1).padStart(2, "0"));
const totalDoors = String(doors.length).padStart(2, "0");
const counterProgress = computed(
  () => `${activeIndex.value / Math.max(1, doors.length - 1)}`
);

const t = (key: { tr: string; en: string }) =>
  locale.value === "tr" ? key.tr : key.en;

const ui = computed(() =>
  locale.value === "tr"
    ? {
        detail: "Detaylar",
        quote: "Teklif Al",
        navigation: "Kapı gezinmesi",
        previousDoor: "Önceki kapı",
        nextDoor: "Sonraki kapı"
      }
    : {
        detail: "Details",
        quote: "Get quote",
        navigation: "Door navigation",
        previousDoor: "Previous door",
        nextDoor: "Next door"
      }
);
</script>

<template>
  <div class="showroom-turntable">
    <!-- ATMOSPHERE LAYERS -->
    <div class="showroom-turntable__vignette" aria-hidden="true" />
    <div class="showroom-turntable__grain" aria-hidden="true" />

    <!-- LEFT: STAGE -->
    <div class="showroom-turntable__stage">
      <!-- Backdrop typography (kapının arkasında dev isim) -->
      <div class="showroom-turntable__backdrop" aria-hidden="true">
        <Transition name="st-backdrop" mode="out-in">
          <span
            :key="activeDoor.id"
            class="showroom-turntable__backdrop-text"
            :style="backdropStyle"
          >
            <span class="showroom-turntable__backdrop-marquee">
              <span class="showroom-turntable__backdrop-marquee-group">
                <span v-for="i in 6" :key="`a-${i}`">{{ backdropMarqueeText }}</span>
              </span>
              <span class="showroom-turntable__backdrop-marquee-group" aria-hidden="true">
                <span v-for="i in 6" :key="`b-${i}`">{{ backdropMarqueeText }}</span>
              </span>
            </span>
          </span>
        </Transition>
      </div>

      <!-- Spotlight cone -->
      <div class="showroom-turntable__spotlight" aria-hidden="true" />

      <!-- Orbit Carousel -->
      <div class="showroom-turntable__scene">
        <div class="showroom-turntable__carousel">
          <div
            v-for="item in orbitDoors"
            :key="item.door.id"
            class="showroom-turntable__slot"
            :style="{
              '--slot-x': `${item.x}px`,
              '--slot-y': `${item.y}px`,
              '--slot-scale': `${item.scale}`,
              '--slot-opacity': `${item.opacity}`,
              '--slot-blur': `${item.blur}px`,
              '--slot-non-active': `${1 - item.nearActive}`,
              '--slot-neighbor-rise': `calc(var(--showroom-neighbor-rise-y, 0px) * ${1 - item.nearActive})`,
              zIndex: item.zIndex
            }"
          >
            <img
              :src="item.door.image"
              :alt="t(item.door.name)"
              class="showroom-turntable__door-image"
              :class="`showroom-turntable__door-image--${item.door.id}`"
              loading="lazy"
              decoding="async"
              draggable="false"
            >
          </div>
        </div>

        <!-- Floor disc (oval platform) -->
        <div class="showroom-turntable__platform" aria-hidden="true">
          <div class="showroom-turntable__platform-ring" />
          <div class="showroom-turntable__platform-glow" />
        </div>
      </div>
    </div>

    <!-- RIGHT: INFO PANEL -->
    <aside class="showroom-turntable__info" aria-live="polite">
      <div
        class="showroom-turntable__counter"
        :style="{ '--counter-progress': counterProgress }"
      >
        <Transition name="st-counter-number" mode="out-in">
          <span :key="doorNumber" class="showroom-turntable__counter-current">
            {{ doorNumber }}
          </span>
        </Transition>
        <i class="showroom-turntable__counter-line" />
        <span class="showroom-turntable__counter-total">{{ totalDoors }}</span>
      </div>

      <Transition name="st-info" mode="out-in">
        <div :key="activeDoor.id" class="showroom-turntable__info-block">
          <h2
            class="showroom-turntable__name"
            :style="{ '--name-fit-scale': nameFitScale }"
          >
            <span class="showroom-turntable__name-lead">
              {{ activeDoor.nameDisplay.lead }}
            </span>
            <em class="showroom-turntable__name-tail">
              {{ activeDoor.nameDisplay.tail }}
            </em>
          </h2>

          <p class="showroom-turntable__series">
            {{ t(activeDoor.series) }}
          </p>

          <div class="showroom-turntable__divider" />

          <p class="showroom-turntable__spec">
            {{ t(activeDoor.spec) }}
          </p>

          <p class="showroom-turntable__meta">
            {{ t(activeDoor.meta) }}
          </p>

          <div class="showroom-turntable__actions">
            <AdaCtaButton :label="ui.detail" href="#" />
            <AdaCtaButton :label="ui.quote" href="#" variant="outline" icon-position="none" />
          </div>
        </div>
      </Transition>

      <!-- Pagination dots -->
      <div class="showroom-turntable__dots" aria-label="Kapı seçimi">
        <button
          v-for="(_, i) in doors"
          :key="i"
          type="button"
          class="showroom-turntable__dot"
          :class="{ 'showroom-turntable__dot--active': i === activeIndex }"
          :aria-label="`${i + 1}. kapıya geç`"
          :aria-current="i === activeIndex ? 'true' : undefined"
          @click="emit('doorSelect', i)"
        />
      </div>
    </aside>

    <nav class="showroom-turntable__door-nav" :aria-label="ui.navigation">
      <button
        class="showroom-turntable__door-nav-button"
        data-direction="prev"
        type="button"
        :aria-label="ui.previousDoor"
        :disabled="activeIndex === 0"
        @click="emit('doorStep', -1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6L9 12L15 18" />
        </svg>
      </button>
      <button
        class="showroom-turntable__door-nav-button"
        data-direction="next"
        type="button"
        :aria-label="ui.nextDoor"
        @click="emit('doorStep', 1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6L15 12L9 18" />
        </svg>
      </button>
    </nav>
  </div>
</template>
