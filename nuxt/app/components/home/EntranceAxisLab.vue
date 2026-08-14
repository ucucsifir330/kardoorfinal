<script setup lang="ts">
/**
 * EntranceAxisLab — axis prototype. NOT production.
 *
 * Question it exists to answer: does the entrance stop feeling like it "holds
 * you in one screen" when the scroll chain runs horizontally instead of
 * vertically?
 *
 * Two things differ from EntranceDoorLab, deliberately, and both matter:
 *
 *  1. AXIS. Wheel down moves the track LEFT, so panels arrive from the right.
 *     One pinned wrapper, one child track, x driven by scroll. GSAP requires
 *     ease: "none" here or scroll position and track position stop lining up.
 *
 *  2. NO SNAP. EntranceDoorLab intercepts the wheel and tweens the scroll to
 *     the next stop ("one push = one door"). Measured: setting scrollTo(9000)
 *     landed at 6480 and then drifted back to 5625 — the page fights you. Here
 *     scrub is 1:1 and nothing is intercepted.
 *
 * The vertical section below the pin is what proves the chain: horizontal
 * first, then down, in one continuous scroll.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsap } from "~/composables/useGSAP";
import { useDoorSprite } from "~/composables/useDoorSprite";
import { useShowroomDoors } from "~/composables/useShowroomDoors";
import { useShowroomAmbience } from "~/composables/useShowroomAmbience";
import { useEntranceCopy } from "~/composables/useEntranceCopy";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const wrapperRef = ref<HTMLElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const { isNight } = useShowroomAmbience();
const { doors } = useShowroomDoors();
const { copy } = useEntranceCopy();
const door = useDoorSprite(canvasRef);

const heroSrc = computed(() =>
  isNight.value ? "/hero-night-16x9.avif" : "/hero-day-16x9.avif"
);
const spriteMeta = computed(() =>
  isNight.value ? "/kardoor-door-night.json" : "/kardoor-door-light.json"
);

// Live readouts so the prototype can be judged on numbers, not vibes.
const progress = ref(0);
const activeDoor = ref(0);

let tween: gsap.core.Tween | undefined;

const buildChain = () => {
  const wrapper = wrapperRef.value;
  const track = trackRef.value;
  if (!wrapper || !track) return;

  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  tween = gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: wrapper,
      pin: true,
      scrub: true,
      start: "top top",
      end: () => `+=${distance()}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progress.value = self.progress;
        // The door opens across the first quarter of the chain.
        door.showProgress(clamp01(self.progress / 0.25));
        // Doors 01..05 occupy the middle band.
        const band = clamp01((self.progress - 0.35) / 0.45);
        activeDoor.value = Math.min(
          doors.value.length - 1,
          Math.round(band * Math.max(0, doors.value.length - 1))
        );
      }
    }
  });
};

onMounted(async () => {
  registerGsap();
  await door.load(spriteMeta.value).catch(() => {});
  buildChain();
  ScrollTrigger.refresh();
});

onBeforeUnmount(() => {
  tween?.scrollTrigger?.kill();
  tween?.kill();
  door.dispose();
});
</script>

<template>
  <div class="axis-lab">
    <div ref="wrapperRef" class="axis-lab__wrapper">
      <div class="axis-lab__hud">
        <span>progress {{ progress.toFixed(3) }}</span>
        <span>kapı {{ String(activeDoor + 1).padStart(2, "0") }}</span>
        <span>snap: yok · scrub 1:1</span>
      </div>

      <div ref="trackRef" class="axis-lab__track">
        <!-- 1 · HERO -->
        <section class="axis-panel axis-panel--hero">
          <img :src="heroSrc" alt="" class="axis-panel__bg" />
          <div class="axis-panel__copy">
            <h1>
              <span>{{ copy.line1 }}</span>
              <span><em>{{ copy.accent }}</em> {{ copy.line2 }}</span>
            </h1>
            <p>{{ copy.subtitleLead }}</p>
            <span class="axis-panel__cue">sağa kaydır →</span>
          </div>
        </section>

        <!-- 2 · KAPI -->
        <section class="axis-panel axis-panel--door">
          <canvas ref="canvasRef" class="axis-panel__canvas" />
          <span class="axis-panel__label">kapı açılıyor</span>
        </section>

        <!-- 3 · SHOWROOM -->
        <section
          v-for="(d, i) in doors"
          :key="d.id"
          class="axis-panel axis-panel--door-card"
          :class="{ 'is-active': i === activeDoor }"
        >
          <img :src="d.image" :alt="d.code" class="axis-panel__door" />
          <div class="axis-panel__meta">
            <span class="axis-panel__index">{{ String(i + 1).padStart(2, "0") }}</span>
            <strong>{{ d.series }}</strong>
            <span>{{ d.code }}</span>
          </div>
        </section>

        <!-- 4 · KURGULAYIN -->
        <section class="axis-panel axis-panel--configure">
          <h2>Kapınızı yalnızca seçmeyin.<br /><em>Kurgulayın.</em></h2>
          <span class="axis-panel__cue">kaydırmaya devam → aşağı iner</span>
        </section>
      </div>
    </div>

    <!-- The chain turns vertical here. -->
    <section class="axis-lab__after">
      <h2>↓ dikey devam</h2>
      <p>
        Yatay zincir bitti, pin bırakıldı, sayfa normal akışına döndü.
        Tek kesintisiz scroll.
      </p>
    </section>
  </div>
</template>

<style scoped>
.axis-lab__wrapper {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-main, #ebe6db);
}

.axis-lab__hud {
  position: absolute;
  z-index: 10;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 16px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.72);
  color: #fff;
  font: 500 12px/1 ui-monospace, monospace;
  letter-spacing: 0.04em;
}

.axis-lab__track {
  display: flex;
  height: 100%;
  will-change: transform;
}

.axis-panel {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  width: 100vw;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.axis-panel--door-card {
  width: 42vw;
}

.axis-panel__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.axis-panel__copy {
  position: relative;
  max-width: 44ch;
  padding: 0 6vw;
  color: var(--text-main, #16130f);
}

.axis-panel__copy h1 {
  display: grid;
  margin: 0 0 18px;
  font-size: clamp(38px, 5vw, 76px);
  line-height: 0.94;
  letter-spacing: -0.02em;
}

.axis-panel__copy em {
  font-style: italic;
}

.axis-panel__cue {
  display: inline-block;
  margin-top: 28px;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.62;
}

.axis-panel__canvas {
  width: min(48vh, 42vw);
  height: 80%;
}

.axis-panel__label,
.axis-panel__index {
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.5;
}

.axis-panel__door {
  max-height: 62%;
  object-fit: contain;
  transition: transform 0.4s ease, opacity 0.4s ease;
  transform: scale(0.82);
  opacity: 0.45;
}

.axis-panel--door-card.is-active .axis-panel__door {
  transform: scale(1);
  opacity: 1;
}

.axis-panel__meta {
  position: absolute;
  bottom: 12%;
  display: grid;
  gap: 4px;
  text-align: center;
  color: var(--text-main, #16130f);
}

.axis-panel--configure {
  flex-direction: column;
  gap: 18px;
  background: var(--slab, #10293f);
  color: var(--slab-fg, #eef3f6);
}

.axis-panel--configure h2 {
  margin: 0;
  font-size: clamp(30px, 3.6vw, 58px);
  line-height: 1.02;
  text-align: center;
}

.axis-lab__after {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 12px;
  padding: 0 6vw;
  background: var(--bg-main, #ebe6db);
  color: var(--text-main, #16130f);
  text-align: center;
}
</style>
