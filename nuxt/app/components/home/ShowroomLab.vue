<script setup lang="ts">
/**
 * ShowroomLab — entrance-lab'in zoom'u kapıdan içeri girince beliren showroom
 * sahnesi. EntranceDoor'un ShowroomTurntable'ının sade/yeniden yazılmış hali:
 *
 *  • Veri GERÇEK katalogdan gelir (useShowroomDoors → nuxt/data/products).
 *  • Kapı SAYISINDAN bağımsız orbit matematiği (magic-number yok).
 *  • Orbit transform'ları Vue reaktivitesiyle DEĞİL, doğrudan DOM'a CSS değişkeni
 *    yazılarak sürülür → progress değişiminde re-render yok (scroll kasmaz).
 *  • Tek prop: progress (0→1). entrance-lab master'ı SHOWROOM fazında besler.
 */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useShowroomDoors } from "~/composables/useShowroomDoors";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import AdaCtaButton from "~/components/home/AdaCtaButton.vue";

const props = defineProps<{
  progress: number; // 0 → 1 (showroom faz ilerlemesi)
}>();

const emit = defineEmits<{
  doorSelect: [index: number];
}>();

const { doors } = useShowroomDoors();

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fadeOut = (t: number) => 1 - t * t * (3 - 2 * t);
const degToRad = (d: number) => (d * Math.PI) / 180;

// Orbit geometrisi — yatay elips. Kapı sayısından bağımsız (STEP buna göre).
const getOrbitRadiusX = () => {
  if (typeof window === "undefined") return 430;
  if (window.innerWidth <= 900) return Math.min(250, window.innerWidth * 0.42);
  return Math.min(620, Math.max(430, window.innerWidth * 0.3));
};
const NEIGHBOR_SCALE = 0.72;
const NEIGHBOR_VISIBLE_RATIO = 0.75;
const AVERAGE_VISIBLE_DOOR_WIDTH_RATIO = 0.52;

// Yan kapının %75'ini sahnede bırakıp %25'ini dış kenara gömer. Hesap, CSS'teki
// responsive stage / slot ölçülerini izler; böylece sabit piksel ofsetin farklı
// viewportlarda ürettiği değişken görünürlük oranı oluşmaz.
const getNeighborEdgeOffset = (step: number) => {
  if (typeof window === "undefined") return 0;

  const viewportWidth = window.innerWidth;
  const stageWidth = viewportWidth <= 900
    ? viewportWidth
    : viewportWidth - clamp(viewportWidth * 0.32, 320, 520);
  const slotHeight = viewportWidth <= 380
    ? clamp(viewportWidth * 0.61, 220, 250)
    : viewportWidth <= 900
      ? clamp(viewportWidth * 0.64, 240, 310)
      : clamp(viewportWidth * 0.35, 330, 560);
  const neighborWidth =
    slotHeight * AVERAGE_VISIBLE_DOOR_WIDTH_RATIO * NEIGHBOR_SCALE;
  const hiddenWidth = neighborWidth * (1 - NEIGHBOR_VISIBLE_RATIO);
  const baseNeighborX = Math.abs(Math.sin(degToRad(step)) * getOrbitRadiusX());

  return Math.max(0, stageWidth / 2 - hiddenWidth - baseNeighborX);
};
const ORBIT_RADIUS_Y = 22;
const stepDeg = computed(() => 360 / Math.max(1, doors.value.length));

// progress → sürekli (float) kapı index'i.
const floatIndex = (p: number) => clamp(p * (doors.value.length - 1), 0, doors.value.length - 1);

// Aktif (oturmuş) kapı — ağır info DOM swap'ini SADECE kapı merkeze yakınken commit et.
const activeIndex = ref(Math.round(floatIndex(props.progress)));
const activeDoor = computed(() => doors.value[activeIndex.value]);

// Slot DOM elemanları (imperatif transform yazımı için).
const slotEls: (HTMLElement | null)[] = [];
const setSlotRef = (el: Element | null, i: number) => {
  slotEls[i] = (el as HTMLElement) ?? null;
};

const applyOrbit = (p: number) => {
  const count = doors.value.length;
  const f = floatIndex(p);
  const step = stepDeg.value;
  const neighborEdgeOffset = getNeighborEdgeOffset(step);

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
    const x = Math.sin(rad) * getOrbitRadiusX() + edgeOffset;
    const scale =
      distance <= 1
        ? lerp(NEIGHBOR_SCALE, 1.34, nearActive)
        : lerp(NEIGHBOR_SCALE, 0.62, 1 - neighborFade);
    const opacity = distance <= 1
      ? lerp(0.22, 1, nearActive)
      : 0.2 * neighborFade;
    const slotY = orbitY + nearActive * 116 + (1 - nearActive) * 128;

    const s = el.style;
    s.setProperty("--slot-x", `${x}px`);
    s.setProperty("--slot-y", `${slotY}px`);
    s.setProperty("--slot-scale", `${opacity <= 0.001 ? 0.001 : scale}`);
    s.setProperty("--slot-opacity", `${opacity}`);
    s.zIndex = `${Math.round(40 - distance * 12)}`;
  }

  // Kapı (neredeyse) oturduğunda info panelini güncelle.
  const idx = Math.round(f);
  if (idx !== activeIndex.value && Math.abs(f - idx) < 0.04) {
    activeIndex.value = idx;
  }
};

watch(() => props.progress, applyOrbit);
// doors yüklenince / değişince yeniden yerleş. nextTick: slot ref'leri bağlandıktan
// sonra (DOM güncel) uygula — yoksa --slot-* değişkenleri boş kalır.
watch(doors, () => nextTick(() => applyOrbit(props.progress)));

// İlk yerleşim: mount sonrası slot ref'leri kesin bağlı. progress 0 olsa bile
// orbit transform'larını yaz, yoksa kapılar 1×1px görünmez kalır.
onMounted(() => nextTick(() => applyOrbit(props.progress)));

const doorNumber = computed(() => String(activeIndex.value + 1).padStart(2, "0"));
const totalDoors = computed(() => String(doors.value.length).padStart(2, "0"));
// 01—05 çizgisinin dolum oranı (aktif kapıya göre 0→1).
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

// Arkadan akan dev yazı bandı — aktif kapının seri adı, büyük harf.
const backdropText = computed(() => {
  const d = activeDoor.value;
  if (!d) return "";
  return `${d.nameDisplay.lead} ${d.nameDisplay.tail}`.toLocaleUpperCase("tr-TR").trim();
});
</script>

<template>
  <div class="showroom-lab">
    <div class="showroom-lab__vignette" aria-hidden="true" />

    <!-- ARKADAN AKAN DEV YAZI BANDI — aktif kapı seri adı, kapıların gerisinde. -->
    <div class="showroom-lab__backdrop" aria-hidden="true">
      <Transition name="sl-backdrop" mode="out-in">
        <span :key="backdropText" class="showroom-lab__backdrop-text">
          <span class="showroom-lab__backdrop-marquee">
            <span class="showroom-lab__backdrop-group">
              <span v-for="i in 6" :key="`a-${i}`">{{ backdropText }}</span>
            </span>
            <span class="showroom-lab__backdrop-group" aria-hidden="true">
              <span v-for="i in 6" :key="`b-${i}`">{{ backdropText }}</span>
            </span>
          </span>
        </span>
      </Transition>
    </div>

    <!-- ORBIT SAHNESİ -->
    <div class="showroom-lab__stage">
      <div class="showroom-lab__carousel">
        <div
          v-for="(door, i) in doors"
          :key="door.id"
          :ref="(el) => setSlotRef(el as Element | null, i)"
          class="showroom-lab__slot"
          :style="{
            '--door-normalize': door.fitScale,
            '--door-baseline-shift': `${door.baselineShift}%`,
            '--door-image-mask': `url(${door.image})`
          }"
        >
          <span class="showroom-lab__door-shell">
            <img
              :src="door.image"
              :alt="`${door.nameDisplay.lead} ${door.nameDisplay.tail}`"
              class="showroom-lab__door-image"
              loading="lazy"
              decoding="async"
              draggable="false"
            >
          </span>
        </div>
      </div>
    </div>

    <!-- INFO PANELİ -->
    <aside class="showroom-lab__info" aria-live="polite">
      <div
        class="showroom-lab__counter"
        :style="{ '--counter-progress': counterProgress }"
      >
        <Transition name="sl-counter" mode="out-in">
          <span :key="doorNumber" class="showroom-lab__counter-current">{{ doorNumber }}</span>
        </Transition>
        <i class="showroom-lab__counter-line" />
        <span class="showroom-lab__counter-total">{{ totalDoors }}</span>
      </div>

      <Transition name="sl-info" mode="out-in">
        <div v-if="activeDoor" :key="activeDoor.id" class="showroom-lab__info-block">
          <h2 class="showroom-lab__name">
            <span class="showroom-lab__name-lead">{{ activeDoor.nameDisplay.lead }}</span>
            <em class="showroom-lab__name-tail">{{ activeDoor.nameDisplay.tail }}</em>
          </h2>
          <p class="showroom-lab__series">{{ activeDoor.series }}</p>
          <div class="showroom-lab__divider" />
          <p class="showroom-lab__spec">{{ activeDoor.spec }}</p>
          <p class="showroom-lab__meta">{{ activeDoor.meta }}</p>

          <div class="showroom-lab__actions">
            <AdaCtaButton :label="ui.detail" href="#" />
            <AdaCtaButton :label="ui.quote" href="#" variant="outline" icon-position="none" />
          </div>
        </div>
      </Transition>

      <div
        class="showroom-lab__door-rail"
        :style="{ '--door-rail-count': doorRailProgress.length }"
        aria-hidden="true"
      >
        <button
          v-for="(segment, index) in doorRailProgress"
          :key="segment.id"
          type="button"
          class="showroom-lab__door-rail-segment"
          :aria-label="`${index + 1}. kapıya git`"
          :style="{ '--door-rail-fill': segment.fill }"
          @click="emit('doorSelect', index)"
        />
      </div>
    </aside>
  </div>
</template>

<style src="~/assets/styles/sections/showroom.css"></style>
