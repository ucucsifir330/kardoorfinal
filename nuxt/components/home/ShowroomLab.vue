<script setup lang="ts">
/**
 * ShowroomLab — entrance-lab'in zoom'u kapıdan içeri girince beliren showroom
 * sahnesi.
 *
 *  • Veri GERÇEK katalogdan gelir (useShowroomDoors → nuxt/data/products).
 *  • Kapı SAYISINDAN bağımsız orbit matematiği (magic-number yok).
 *  • Orbit transform'ları Vue reaktivitesiyle DEĞİL, doğrudan DOM'a CSS değişkeni
 *    yazılarak sürülür → re-render yok (scroll kasmaz).
 *  • Tek prop: progress (0→1). entrance-lab master'ı SHOWROOM fazında besler.
 *
 *  AKIŞ: Gelen `progress` ScrollTrigger scrub + SNAP ile sürülür → scroll
 *  bırakılınca scroll'un kendisi en yakın kapıya kayar, yani `progress` bir kapı
 *  noktasına oturur. ShowroomLab burada sadece o hedefi RAF ile YUMUŞATARAK takip
 *  eder (görünen değer hedefe lerp'lenir) → ani sıçrama / "patlama" olmaz, kapı
 *  da snap sayesinde tam merkeze oturur. İç idle-snap YOK; kavga etmesin diye
 *  snap kararı tek yerde (ScrollTrigger) verilir. Aktif kapıda büyüme/zıplama yok.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useShowroomDoors } from "~/composables/useShowroomDoors";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import AdaCtaButton from "~/components/home/AdaCtaButton.vue";

const props = defineProps<{
  progress: number; // 0 → 1 (showroom faz ilerlemesi) — HAM scroll hedefi
}>();

const { doors } = useShowroomDoors();

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const degToRad = (d: number) => (d * Math.PI) / 180;

// Orbit geometrisi — yatay elips. Kapı sayısından bağımsız (STEP buna göre).
const ORBIT_RADIUS_X = 360;
const ORBIT_RADIUS_Y = 50;
const stepDeg = computed(() => 360 / Math.max(1, doors.value.length));

const maxIndex = () => Math.max(0, doors.value.length - 1);
// progress (0→1) → sürekli (float) kapı index'i.
const floatIndex = (p: number) => clamp(p * maxIndex(), 0, maxIndex());

// ── SMOOTH FOLLOW state ────────────────────────────────────────────
// targetFloat : ScrollTrigger scrub+snap'ten gelen hedef float index.
// displayFloat: ekrana çizilen yumuşatılmış float index (hedefe lerp).
let targetFloat = floatIndex(props.progress);
let displayFloat = targetFloat;

// Yumuşak takip katsayısı (frame başına lerp). Yüksek = çevik, düşük = yumuşak.
const FOLLOW = 0.16;

let rafId = 0;
let running = false;
let reduceMotion = false;

// Aktif (oturmuş) kapı — ağır info DOM swap'i SADECE kapı merkeze yakınken.
const activeIndex = ref(Math.round(displayFloat));
const activeDoor = computed(() => doors.value[activeIndex.value]);

// Slot DOM elemanları (imperatif transform yazımı için).
const slotEls: (HTMLElement | null)[] = [];
const setSlotRef = (el: Element | null, i: number) => {
  slotEls[i] = (el as HTMLElement) ?? null;
};

const applyOrbit = (f: number) => {
  const count = doors.value.length;
  const step = stepDeg.value;

  for (let i = 0; i < count; i++) {
    const el = slotEls[i];
    if (!el) continue;

    let offset = i - f;
    if (offset > count / 2) offset -= count;
    if (offset < -count / 2) offset += count;

    const distance = Math.abs(offset);
    const rad = degToRad(offset * step);
    const x = Math.sin(rad) * ORBIT_RADIUS_X;
    const y = (1 - Math.cos(rad)) * ORBIT_RADIUS_Y;
    const nearActive = clamp(1 - distance, 0, 1);

    const scale =
      distance <= 1
        ? lerp(0.64, 1.16, nearActive)
        : Math.max(0.52, lerp(0.64, 0.52, clamp(distance - 1, 0, 1)));
    const opacity =
      distance <= 1
        ? lerp(0.32, 1, nearActive)
        : Math.max(0, lerp(0.32, 0, clamp(distance - 1, 0, 1)));

    const s = el.style;
    s.setProperty("--slot-x", `${x}px`);
    s.setProperty("--slot-y", `${y - nearActive * 8}px`);
    s.setProperty("--slot-scale", `${scale}`);
    s.setProperty("--slot-opacity", `${opacity}`);
    s.zIndex = `${Math.round(40 - distance * 12)}`;
  }

  // Kapı (neredeyse) oturduğunda info panelini güncelle.
  const idx = clamp(Math.round(f), 0, maxIndex());
  if (idx !== activeIndex.value && Math.abs(f - idx) < 0.06) {
    activeIndex.value = idx;
  }
};

// ── RAF döngüsü: hedefi yumuşatarak takip et ───────────────────────
const tick = () => {
  displayFloat += (targetFloat - displayFloat) * FOLLOW;

  // Hedefe yeterince yakınsak yapış ve döngüyü durdur (boşa CPU yok).
  const settled = Math.abs(targetFloat - displayFloat) < 0.0008;
  if (settled) displayFloat = targetFloat;

  applyOrbit(displayFloat);

  if (settled) {
    running = false;
    rafId = 0;
    return;
  }
  rafId = requestAnimationFrame(tick);
};

const ensureRunning = () => {
  if (running) return;
  running = true;
  rafId = requestAnimationFrame(tick);
};

// Ham progress değişince hedefi güncelle ve döngüyü uyandır.
watch(
  () => props.progress,
  (p) => {
    targetFloat = floatIndex(p);
    if (reduceMotion) {
      // Hareket azaltılmışsa: animasyon yok, anında en yakın kapıya otur.
      displayFloat = clamp(Math.round(targetFloat), 0, maxIndex());
      applyOrbit(displayFloat);
      return;
    }
    ensureRunning();
  }
);

// doors yüklenince / değişince yeniden yerleş (slot ref'leri bağlandıktan sonra).
watch(doors, () =>
  nextTick(() => {
    targetFloat = floatIndex(props.progress);
    displayFloat = targetFloat;
    applyOrbit(displayFloat);
  })
);

onMounted(() => {
  reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  nextTick(() => {
    targetFloat = floatIndex(props.progress);
    displayFloat = targetFloat;
    applyOrbit(displayFloat);
  });
});

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  running = false;
});

const doorNumber = computed(() => String(activeIndex.value + 1).padStart(2, "0"));
const totalDoors = computed(() => String(doors.value.length).padStart(2, "0"));
// 01—05 çizgisinin dolum oranı (aktif kapıya göre 0→1).
const counterProgress = computed(
  () => `${activeIndex.value / Math.max(1, doors.value.length - 1)}`
);

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
  return `${d.nameDisplay.lead} ${d.nameDisplay.tail}`
    .toLocaleUpperCase(locale.value === "tr" ? "tr-TR" : "en-US")
    .trim();
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
        >
          <img
            :src="door.image"
            :alt="`${door.nameDisplay.lead} ${door.nameDisplay.tail}`.trim()"
            class="showroom-lab__door-image"
            loading="lazy"
            decoding="async"
            draggable="false"
          >
        </div>
      </div>

      <div class="showroom-lab__platform" aria-hidden="true" />
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
        <div v-if="activeDoor" :key="`${activeDoor.id}-${locale}`" class="showroom-lab__info-block">
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
    </aside>
  </div>
</template>

<style src="~/assets/styles/sections/showroom.css"></style>
