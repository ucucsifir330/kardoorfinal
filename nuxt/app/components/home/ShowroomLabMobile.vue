<script setup lang="ts">
/**
 * ShowroomLabMobile — the showroom as it exists on a phone.
 *
 * Split out of ShowroomLab so the mobile presentation stops living inside
 * desktop media queries. Two things made that split worth the duplication:
 *
 *  1. Every theme rule in showroom.css is written as
 *     `.entrance-lab[data-ambience="day"] .showroom-lab`. The mobile root is
 *     not .entrance-lab, so the day palette and the CTA colours never applied
 *     on a phone — the info card stayed in the night palette under a cream
 *     hero. This component carries its OWN data-ambience, so it cannot drift
 *     from an ancestor selector again.
 *  2. The geometry branched on window.innerWidth at runtime (getOrbitRadiusX,
 *     getNeighborEdgeOffset). Here the phone values are simply the values.
 *
 * Same contract as ShowroomLab — `progress` in, `doorSelect` out — so the
 * entrance can swap one for the other with no other change.
 */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useShowroomDoors } from "~/composables/useShowroomDoors";
import { useShowroomAmbience } from "~/composables/useShowroomAmbience";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import AdaCtaButton from "~/components/home/AdaCtaButton.vue";

const props = defineProps<{
  progress: number; // 0 → 1 across the door band
}>();

const emit = defineEmits<{
  doorSelect: [index: number];
}>();

const { doors } = useShowroomDoors();
const { mode } = useShowroomAmbience();

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fadeOut = (t: number) => 1 - t * t * (3 - 2 * t);
const degToRad = (d: number) => (d * Math.PI) / 180;

// Orbit geometry — phone values, no width branching. The ellipse is flat and
// narrow so the neighbouring doors only peek in from the edges.
const ORBIT_RADIUS_Y = 22;
const NEIGHBOR_SCALE = 0.72;
const NEIGHBOR_VISIBLE_RATIO = 0.75;
const AVERAGE_VISIBLE_DOOR_WIDTH_RATIO = 0.52;
// Matches --slot-height in showroom-mobile.css; the neighbour offset is derived
// from the slot box, so the two must agree.
const SLOT_HEIGHT_VW = 0.71;
const SLOT_HEIGHT_MIN = 266;
const SLOT_HEIGHT_MAX = 340;

const getOrbitRadiusX = () => {
  if (typeof window === "undefined") return 250;
  return Math.min(250, window.innerWidth * 0.42);
};

const getSlotHeight = () => {
  if (typeof window === "undefined") return SLOT_HEIGHT_MIN;
  return clamp(window.innerWidth * SLOT_HEIGHT_VW, SLOT_HEIGHT_MIN, SLOT_HEIGHT_MAX);
};

// Leaves ~75% of the neighbouring door on stage and buries the rest past the
// edge. Derived from the slot box rather than a fixed pixel offset, so the
// visible fraction stays constant across phone widths.
const getNeighborEdgeOffset = (step: number) => {
  if (typeof window === "undefined") return 0;

  const stageWidth = window.innerWidth;
  const neighborWidth =
    getSlotHeight() * AVERAGE_VISIBLE_DOOR_WIDTH_RATIO * NEIGHBOR_SCALE;
  const hiddenWidth = neighborWidth * (1 - NEIGHBOR_VISIBLE_RATIO);
  const baseNeighborX = Math.abs(Math.sin(degToRad(step)) * getOrbitRadiusX());

  return Math.max(0, stageWidth / 2 - hiddenWidth - baseNeighborX);
};

const stepDeg = computed(() => 360 / Math.max(1, doors.value.length));

const floatIndex = (p: number) =>
  clamp(p * (doors.value.length - 1), 0, doors.value.length - 1);

const activeIndex = ref(Math.round(floatIndex(props.progress)));
const activeDoor = computed(() => doors.value[activeIndex.value]);

const slotEls: (HTMLElement | null)[] = [];
const setSlotRef = (el: Element | null, i: number) => {
  slotEls[i] = (el as HTMLElement) ?? null;
};

// Orbit transforms are written straight to the DOM as custom properties, not
// through Vue reactivity — this runs on every frame of a swipe.
const applyOrbit = (p: number) => {
  const count = doors.value.length;
  const f = floatIndex(p);
  const step = stepDeg.value;
  const neighborEdgeOffset = getNeighborEdgeOffset(step);
  const radiusX = getOrbitRadiusX();

  for (let i = 0; i < count; i++) {
    const el = slotEls[i];
    if (!el) continue;

    const offset = i - f;
    const distance = Math.abs(offset);
    const rad = degToRad(offset * step);
    const orbitY = (1 - Math.cos(rad)) * ORBIT_RADIUS_Y;
    const nearActive = clamp(1 - distance, 0, 1);

    const neighborFade = fadeOut(clamp((distance - 1) / 0.38, 0, 1));
    const edgeOffset =
      Math.sign(offset) * neighborEdgeOffset * (1 - nearActive) * neighborFade;
    const x = Math.sin(rad) * radiusX + edgeOffset;
    const scale =
      distance <= 1
        ? lerp(NEIGHBOR_SCALE, 1.34, nearActive)
        : lerp(NEIGHBOR_SCALE, 0.62, 1 - neighborFade);
    const opacity = distance <= 1 ? lerp(0.22, 1, nearActive) : 0.2 * neighborFade;
    const slotY = orbitY + nearActive * 116 + (1 - nearActive) * 128;

    const s = el.style;
    s.setProperty("--slot-x", `${x}px`);
    s.setProperty("--slot-y", `${slotY}px`);
    s.setProperty("--slot-scale", `${opacity <= 0.001 ? 0.001 : scale}`);
    s.setProperty("--slot-opacity", `${opacity}`);
    s.zIndex = `${Math.round(40 - distance * 12)}`;
  }

  // Commit the info card when a door is close enough to be the subject. The
  // window is wider than the desktop's 0.04: a fast flick moves progress in
  // large steps and a narrow window gets skipped entirely, leaving the card on
  // the previous door while the rail already shows the new one.
  const idx = Math.round(f);
  if (idx !== activeIndex.value && Math.abs(f - idx) < 0.28) {
    activeIndex.value = idx;
  }
};

watch(() => props.progress, applyOrbit);
watch(doors, () => nextTick(() => applyOrbit(props.progress)));
onMounted(() => nextTick(() => applyOrbit(props.progress)));

const doorNumber = computed(() => String(activeIndex.value + 1).padStart(2, "0"));
const totalDoors = computed(() => String(doors.value.length).padStart(2, "0"));
const counterProgress = computed(
  () => `${activeIndex.value / Math.max(1, doors.value.length - 1)}`
);
const doorRailProgress = computed(() => {
  const count = doors.value.length;
  const position = props.progress * Math.max(0, count - 1);

  return doors.value.map((door, index) => ({
    id: door.id,
    fill: `${clamp(position - index + 1, 0, 1)}`
  }));
});

const { locale } = useKardoorLocale();
const ui = computed(() =>
  locale.value === "tr"
    ? { detail: "Detaylar", quote: "Teklif Al" }
    : { detail: "Details", quote: "Get quote" }
);

// Marquee band behind the doors — active series name, upper case.
const backdropText = computed(() => {
  const d = activeDoor.value;
  if (!d) return "";
  return `${d.nameDisplay.lead} ${d.nameDisplay.tail}`.toLocaleUpperCase("tr-TR").trim();
});
</script>

<template>
  <div class="showroom-mobile" :data-ambience="mode">
    <div class="showroom-mobile__vignette" aria-hidden="true" />

    <div class="showroom-mobile__backdrop" aria-hidden="true">
      <Transition name="sm-backdrop" mode="out-in">
        <span :key="backdropText" class="showroom-mobile__backdrop-text">
          <span class="showroom-mobile__backdrop-marquee">
            <!-- Three repeats, not six: the desktop band measured 12547px wide
                 and animates every frame. Three still covers a phone twice. -->
            <span class="showroom-mobile__backdrop-group">
              <span v-for="i in 3" :key="`a-${i}`">{{ backdropText }}</span>
            </span>
            <span class="showroom-mobile__backdrop-group" aria-hidden="true">
              <span v-for="i in 3" :key="`b-${i}`">{{ backdropText }}</span>
            </span>
          </span>
        </span>
      </Transition>
    </div>

    <div class="showroom-mobile__stage">
      <div class="showroom-mobile__carousel">
        <div
          v-for="(door, i) in doors"
          :key="door.id"
          :ref="(el) => setSlotRef(el as Element | null, i)"
          class="showroom-mobile__slot"
          :style="{
            '--door-normalize': door.fitScale,
            '--door-baseline-shift': `${door.baselineShift}%`,
            '--door-image-mask': `url(${door.image})`
          }"
        >
          <span class="showroom-mobile__door-shell">
            <img
              :src="door.image"
              :alt="`${door.nameDisplay.lead} ${door.nameDisplay.tail}`"
              class="showroom-mobile__door-image"
              loading="lazy"
              decoding="async"
              draggable="false"
            >
          </span>
        </div>
      </div>
    </div>

    <aside class="showroom-mobile__info" aria-live="polite">
      <div
        class="showroom-mobile__counter"
        :style="{ '--counter-progress': counterProgress }"
      >
        <Transition name="sm-counter" mode="out-in">
          <span :key="doorNumber" class="showroom-mobile__counter-current">{{ doorNumber }}</span>
        </Transition>
        <i class="showroom-mobile__counter-line" />
        <span class="showroom-mobile__counter-total">{{ totalDoors }}</span>
      </div>

      <Transition name="sm-info" mode="out-in">
        <div v-if="activeDoor" :key="activeDoor.id" class="showroom-mobile__info-block">
          <div class="showroom-mobile__identity">
            <h2 class="showroom-mobile__name">
              <span class="showroom-mobile__name-lead">{{ activeDoor.nameDisplay.lead }}</span>
              <em class="showroom-mobile__name-tail">{{ activeDoor.nameDisplay.tail }}</em>
            </h2>
            <p class="showroom-mobile__series">{{ activeDoor.series }}</p>
          </div>

          <div class="showroom-mobile__details">
            <div class="showroom-mobile__divider" />
            <p class="showroom-mobile__spec">{{ activeDoor.spec }}</p>
            <p class="showroom-mobile__meta">{{ activeDoor.meta }}</p>
          </div>

          <div class="showroom-mobile__actions">
            <AdaCtaButton :label="ui.detail" href="#" />
            <AdaCtaButton :label="ui.quote" href="#" variant="outline" icon-position="none" />
          </div>
        </div>
      </Transition>

      <div
        class="showroom-mobile__door-rail"
        :style="{ '--door-rail-count': doorRailProgress.length }"
      >
        <button
          v-for="(segment, index) in doorRailProgress"
          :key="segment.id"
          type="button"
          class="showroom-mobile__door-rail-segment"
          :aria-label="`${index + 1}. kapıya git`"
          :style="{ '--door-rail-fill': segment.fill }"
          @click="emit('doorSelect', index)"
        />
      </div>
    </aside>
  </div>
</template>

<style src="~/assets/styles/sections/showroom-mobile.css"></style>
