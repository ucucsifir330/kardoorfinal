<script setup lang="ts">
/**
 * EntranceDoorLab — yeni hero sahnesi (eski EntranceDoor'un yerini alır).
 *
 * Kapsam:
 *  • Tek background hero görseli (day=L, night=N), temaya göre değişir.
 *  • Üstünde kapı canvas'ı: scroll ile kapı KAPALI→AÇIK frame dizisi sürülür.
 *  • Zoom kapı boşluğuna girer → arkadaki ShowroomLab turntable belirir.
 *  • Son fazda "Kurgulayın" paneli yatay kayarak gelir.
 *
 * Bu bileşen hem `/` (HomeExperience) hem `/entrance-lab` sayfası tarafından kullanılır
 * → tek kaynak. Sayfaya özel meta/SEO çağıran sayfalar bu bileşeni sarmalar.
 *
 * Mimari:
 *  • Hero ve kapı, object-fit:cover'a göre JS ile hesaplanan ortak bir
 *    "artboard" kutusunda durur. Kapının konumu artboard'a göre yüzdeyle
 *    verildiği için viewport oranı değişse de kapı boşlukla hizalı kalır.
 *  • Canvas çizim motoru useDoorSprite composable'ında (DPR cap + rAF
 *    coalescing + source-rect + frame cache).
 *  • Tek pinli scrub ScrollTrigger progress'i kapı karesine eşler.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useShowroomAmbience } from "~/composables/useShowroomAmbience";
import { useDoorSprite } from "~/composables/useDoorSprite";
import { useShowroomDoors } from "~/composables/useShowroomDoors";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import AdaCtaButton from "~/components/home/AdaCtaButton.vue";
import ShowroomLab from "~/components/home/ShowroomLab.vue";

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeInOut = (t: number) => t * t * (3 - 2 * t);

// Master progress faz haritası (tek pinli scrub boyunca):
//   0.00–0.42  PORTAL     : kapı kapalıdan açığa (sprite), zoom yok
//   0.42–0.50  HOLD       : kapı tam açık, kısa duraklama
//   0.50–0.72  ZOOM       : hero+kapı katmanı boşluğa doğru ölçeklenip kaybolur
//   0.60–0.72  SHOWROOM   : zoom dolarken erken belirir, 0.72'de TAM görünür
//   0.70–0.90  ORBIT      : kapılar arası gezinme — geniş dilim (tek scroll ≈ tek
//                           kapı). 5 kapı %20'ye yayılır → her geçiş ~%5 yol.
//   0.90–1.00  HORIZONTAL : showroom + "Kurgulayın" paneli yatay kayar — %10'luk
//                           rahat dilim, panel yumuşak gelir (eski %4 çok hızlıydı).
const PORTAL_END = 0.42;
const HOLD_END = 0.5;
const ZOOM_END = 0.7;
const SHOWROOM_START = 0.58;
const SHOWROOM_FULL = 0.7; // showroom'un tam görünür olduğu nokta (fade burada biter)
const ORBIT_END = 0.9; // turntable dönüşü burada biter
const HORIZONTAL_START = 0.9; // yatay kayma burada başlar
const ZOOM_MAX = 14; // boşluğa girerkenki en yüksek ölçek (tunable)

// Tek master hero görseli — tema ile değişen yegâne kaynak.
const HERO = {
  day: "/L-21X9.png", //  3134×1344  (~21:9, light)
  night: "/N-21X9.png" //  3830×1642  (night)
} as const;

// Paketlenmiş kapı sprite'ları (scripts/pack-door-sprite.cjs çıktısı).
const DOOR = {
  day: "/kardoor-door-light.json",
  night: "/kardoor-door-night.json"
} as const;

// Hero görselinin doğal en-boy oranı (L ve N aynı: 2.332). Artboard buna kurulur.
const HERO_ASPECT = 3134 / 1344;

const { isNight, mode } = useShowroomAmbience();
const heroSrc = computed(() => (isNight.value ? HERO.night : HERO.day));
const doorMeta = computed(() => (isNight.value ? DOOR.night : DOOR.day));

const { locale } = useKardoorLocale();
const copy = computed(() =>
  locale.value === "tr"
    ? {
        line1: "Hayallerinize",
        accent: "Açılan",
        line2: "Kapı",
        subtitleLead: "Güven kapının ardında",
        subtitleAccent: "yaşar.",
        ctaLabel: "Koleksiyonları Keşfet",
        scrollCue: "Kaydır"
      }
    : {
        line1: "The Door",
        accent: "to Your",
        line2: "Dreams",
        subtitleLead: "Confidence lives behind the door",
        subtitleAccent: "",
        ctaLabel: "Explore Collections",
        scrollCue: "Scroll"
      }
);

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

const sectionRef = ref<HTMLElement | null>(null);
const zoomRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showroomProgress = ref(0); // 0→1 turntable orbit (kapı dönüşü)
const showroomFadeRef = ref(0); // 0→1 showroom görünürlüğü (fade, orbit'ten ayrı)
const isShowroomActive = ref(false);

const door = useDoorSprite(canvasRef);
const { doors: showroomDoors } = useShowroomDoors();
let trigger: ScrollTrigger | undefined;
let teardown: (() => void) | undefined;

// Orbit fazında (SHOWROOM_FULL→ORBIT_END) kapı sayısı kadar SNAP noktası üret.
// ScrollTrigger.snap GLOBAL progress (0→1) üzerinden çalışır; biz orbit aralığını
// kapı sayısına böler, dışını snap'siz bırakırız (hero/zoom akışı bozulmasın).
const SNAP_GRAB = 0.012; // bu yakınlıkta değer varsa orbit snap'i devreye girer
const snapProgress = (value: number): number => {
  const count = showroomDoors.value.length;
  if (count < 2) return value;
  // Orbit penceresi dışındaysa dokunma.
  if (value < SHOWROOM_FULL - SNAP_GRAB || value > ORBIT_END + SNAP_GRAB) {
    return value;
  }
  const span = ORBIT_END - SHOWROOM_FULL;
  const local = clamp01((value - SHOWROOM_FULL) / span); // 0→1 orbit içi
  const snappedLocal = Math.round(local * (count - 1)) / (count - 1);
  return SHOWROOM_FULL + snappedLocal * span;
};

// Kapı kanadının hero deliğine BİREBİR oturduğu kalibrasyon (cover kutusuna
// göre yüzde). Hero ŞEFFAF delik + render kanat içerik sınırlarından ölçüldü.
// Light/Night hero'ları farklı konumda olduğu için tema bazlı.
const DOOR_BOX = {
  day: { centerX: 52.195, top: 28.704, width: 14.694, height: 47.64 },
  night: { centerX: 52.028, top: 28.424, width: 14.871, height: 47.695 }
} as const;

// Hero artık section'a full-bleed background (object-fit:cover). Kapı stage'i,
// görselin cover-render kutusuna göre JS ile px olarak konumlanır — böylece
// viewport oranı değişse de kapı deliğe kilitli kalır (overflow kenarı kırpılır).
const placeDoor = () => {
  const section = sectionRef.value;
  const stage = stageRef.value;
  if (!section || !stage) return;

  const vw = section.clientWidth;
  const vh = section.clientHeight;
  const viewportAspect = vw / vh;

  const coverW = viewportAspect > HERO_ASPECT ? vw : vh * HERO_ASPECT;
  const coverH = viewportAspect > HERO_ASPECT ? vw / HERO_ASPECT : vh;
  const coverLeft = (vw - coverW) / 2;
  const coverTop = (vh - coverH) / 2;

  const d = isNight.value ? DOOR_BOX.night : DOOR_BOX.day;
  const w = (d.width / 100) * coverW;
  const h = (d.height / 100) * coverH;
  const cx = coverLeft + (d.centerX / 100) * coverW;
  const top = coverTop + (d.top / 100) * coverH;

  stage.style.left = `${cx - w / 2}px`;
  stage.style.top = `${top}px`;
  stage.style.width = `${w}px`;
  stage.style.height = `${h}px`;

  // Zoom origin = kapı boşluğunun merkezi (section'a göre px). Zoom katmanı bu
  // noktaya doğru ölçeklenir → kamera kapıdan içeri giriyormuş hissi.
  const zoom = zoomRef.value;
  if (zoom) {
    zoom.style.setProperty("--zoom-origin-x", `${cx}px`);
    zoom.style.setProperty("--zoom-origin-y", `${top + h / 2}px`);
  }
};

// Master scrub: progress 0→1 boyunca PORTAL → HOLD → ZOOM → SHOWROOM fazları.
const updateMaster = (raw: number) => {
  const p = clamp01(raw);
  const zoom = zoomRef.value;

  // PORTAL: kapı sprite'ı kapalıdan açığa (yalnızca portal fazında ilerler).
  door.showProgress(clamp01(p / PORTAL_END));

  // ZOOM: HOLD bitiminden ZOOM_END'e kadar boşluğa doğru ölçeklen + kaybol.
  const zoomP = easeInOut(clamp01((p - HOLD_END) / (ZOOM_END - HOLD_END)));
  const scale = 1 + zoomP * ZOOM_MAX;
  // Zoom katmanı dolarken (kamera deliğe girerken) yavaşça silinir.
  const zoomFade = 1 - clamp01((zoomP - 0.45) / 0.45);
  if (zoom) {
    zoom.style.setProperty("--zoom-scale", `${scale}`);
    zoom.style.opacity = `${zoomFade}`;
  }

  // SHOWROOM görünürlüğü (fade): zoom dolarken erken belirir, SHOWROOM_FULL'de
  // tam görünür. Orbit'ten AYRI — sahne önce belirir, sonra kapılar döner.
  const showroomFade = easeInOut(clamp01((p - SHOWROOM_START) / (SHOWROOM_FULL - SHOWROOM_START)));
  showroomFadeRef.value = showroomFade;
  isShowroomActive.value = showroomFade > 0.02;

  // SHOWROOM orbit (kapı dönüşü): sahne tam belirdikten sonra ORBIT_END'e kadar.
  showroomProgress.value = clamp01((p - SHOWROOM_FULL) / (ORBIT_END - SHOWROOM_FULL));

  // HORIZONTAL: son kapıdan sonra showroom + "Kurgulayın" paneli yatay kayar.
  const slideP = easeInOut(clamp01((p - HORIZONTAL_START) / (1 - HORIZONTAL_START)));

  // HERO COPY + CUE: scroll başlar başlamaz yumuşakça kaybolur (kapı açılırken).
  const copyFade = clamp01((p - 0.02) / 0.16);

  const section = sectionRef.value;
  if (section) {
    section.style.setProperty("--page-x", `${slideP * -100}vw`);
    section.style.setProperty("--hero-copy-opacity", `${1 - copyFade}`);
    section.style.setProperty("--hero-copy-y", `${copyFade * -28}px`);
    section.style.setProperty("--hero-cue-opacity", `${1 - clamp01(p / 0.08)}`);
  }
};

onMounted(() => {
  const section = sectionRef.value;
  if (!section || !canvasRef.value) return;

  placeDoor();
  door.load(doorMeta.value).catch((error) => {
    console.error("[EntranceDoorLab] Kapı sprite yüklenemedi.", error);
  });

  // Tek pinli scrub: progress 0→1 boyunca PORTAL → HOLD → ZOOM → SHOWROOM.
  trigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * 11)}`, // pin süresi (tunable)
    scrub: true,
    pin: true,
    pinSpacing: true,
    invalidateOnRefresh: true,
    // Orbit fazında kapıya OTUR: scroll bırakılınca en yakın kapı noktasına kayar
    // → kapı tam merkeze gelir. Orbit aralığı dışı snap'siz (snapProgress içinde).
    snap: {
      snapTo: snapProgress,
      duration: { min: 0.15, max: 0.5 },
      ease: "power2.inOut"
    },
    onUpdate: (self) => updateMaster(self.progress),
    onRefresh: (self) => {
      placeDoor();
      door.refresh();
      updateMaster(self.progress);
    }
  });

  const onResize = () => {
    placeDoor();
    door.refresh();
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", onResize);

  teardown = () => {
    window.removeEventListener("resize", onResize);
    trigger?.kill(true);
  };
});

// Tema değişince kapı sprite'ını (light↔night) yeniden yükle + konumu güncelle
// (light/night hero'ları farklı kalibrasyon kutusu). Kare numarası korunur.
watch(doorMeta, (url) => {
  placeDoor();
  door.load(url).catch(() => {});
});

// Showroom fazına girince <body>'ye işaret koy → global "Görüşelim" hub'ı
// (FloatingContactHub) CSS ile gizlenir. Kapı açıldıktan sonra hub görünmesin.
watch(isShowroomActive, (on) => {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("entrance-lab-showroom-on", on);
});

onBeforeUnmount(() => {
  teardown?.();
  door.dispose();
  if (typeof document !== "undefined") {
    document.body.classList.remove("entrance-lab-showroom-on");
  }
});
</script>

<template>
  <div class="entrance-lab-page">
  <section
    ref="sectionRef"
    class="entrance-lab"
    :data-ambience="mode"
    aria-label="Kardoor giriş — hero zemini"
  >
    <!-- SHOWROOM + KURGULAYIN — zoom içeri girince fade-in (z:0, en arka).
         İçinde yatay kayan track: [showroom] [configure paneli]. Son kapıdan
         sonra --page-x track'i sola kaydırır → panel gelir. -->
    <div
      class="entrance-lab__showroom"
      :class="{ 'is-active': isShowroomActive }"
      :style="{ '--showroom-p': showroomFadeRef }"
    >
      <div class="entrance-lab__slider">
        <div class="entrance-lab__slide">
          <ShowroomLab :progress="showroomProgress" />
        </div>

        <!-- KURGULAYIN paneli — yatay kayma ile gelir. -->
        <div class="entrance-lab__slide entrance-lab__configure">
          <div class="entrance-lab__configure-inner">
            <h2 class="entrance-lab__configure-heading">
              <span v-for="line in configureCopy.titleLines" :key="line">{{ line }}</span>
            </h2>
            <p class="entrance-lab__configure-copy">
              {{ configureCopy.body }}
            </p>
            <div class="entrance-lab__configure-actions" :aria-label="configureCopy.actionsLabel">
              <button type="button" class="ada-manifesto-cta entrance-lab__soon-cta" aria-disabled="true" :aria-label="configureCopy.configuratorAria">
                <span class="ada-manifesto-cta-text" :data-text="configureCopy.configurator" :data-hover="configureCopy.soon">{{ configureCopy.configurator }}</span>
                <span class="ada-manifesto-cta-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                    <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                  </svg>
                </span>
              </button>
              <a href="/catalog" class="ada-manifesto-cta entrance-lab__cta--icon-left" :aria-label="configureCopy.collectionAria">
                <span class="ada-manifesto-cta-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                    <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                  </svg>
                </span>
                <span class="ada-manifesto-cta-text" :data-text="configureCopy.collection">{{ configureCopy.collection }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ZOOM KATMANI — hero + kapı; kapı boşluğuna doğru ölçeklenip kaybolur. -->
    <div ref="zoomRef" class="entrance-lab__zoom">
      <!-- TEK hero görseli — full-bleed (object-fit:cover). -->
      <NuxtImg
        :src="heroSrc"
        class="entrance-lab__bg"
        width="2560"
        height="1098"
        densities="x1"
        format="webp"
        fit="cover"
        preload
        fetchpriority="high"
        alt="Kardoor giriş görseli"
        draggable="false"
      />

      <!-- Kapı canvas'ı — hero deliğinin üstüne JS ile (px) konumlanır. -->
      <div ref="stageRef" class="entrance-lab__stage" aria-hidden="true">
        <canvas ref="canvasRef" class="entrance-lab__canvas" />
      </div>
    </div>

    <!-- HERO COPY — scroll başlayınca kaybolur (--hero-copy-* JS'ten). -->
    <div class="entrance-lab__copy-mask">
      <div class="entrance-lab__copy">
        <h1 class="entrance-lab__heading">
          <span class="entrance-lab__heading-line">{{ copy.line1 }}</span>
          <span class="entrance-lab__heading-line entrance-lab__heading-line--accent">
            <em>{{ copy.accent }}</em> {{ copy.line2 }}
          </span>
        </h1>
        <p class="entrance-lab__subtitle">
          {{ copy.subtitleLead }}{{ copy.subtitleAccent ? " " : "" }}<em v-if="copy.subtitleAccent">{{ copy.subtitleAccent }}</em>
        </p>
        <div class="entrance-lab__cta-row">
          <AdaCtaButton :label="copy.ctaLabel" href="#" variant="filled" icon-position="none" />
          <a class="entrance-lab__cta-arrow" href="#" :aria-label="copy.ctaLabel">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12H19" />
              <path d="M14 7L19 12L14 17" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- KAYDIR ipucu — scroll başlayınca kaybolur (--hero-cue-opacity). -->
    <div class="entrance-lab__cue" aria-hidden="true">
      <span>{{ copy.scrollCue }}</span>
      <i />
    </div>
  </section>

  <!-- Pin'in temiz açılmasını sağlayan kısa tampon (ScrollSmoother rubber-band'i
       önler). Configure paneliyle aynı zemin → panel'den sonra "boş siyah sayfa"
       hissi olmaz; akış sorunsuz biter. Gerçek içerik (katalog) buraya gelecek. -->
  <section class="entrance-lab__next" :data-ambience="mode" aria-hidden="true" />
  </div>
</template>

<style src="~/assets/styles/sections/entrance-lab.css"></style>
