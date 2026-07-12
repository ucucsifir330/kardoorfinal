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
 * Bu bileşen `/` ana sayfasında (HomeExperience) kullanılır.
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
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useShowroomAmbience } from "~/composables/useShowroomAmbience";
import { useDoorSprite } from "~/composables/useDoorSprite";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import AdaCtaButton from "~/components/home/AdaCtaButton.vue";
import ShowroomLab from "~/components/home/ShowroomLab.vue";

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeInOut = (t: number) => t * t * (3 - 2 * t);

// Master progress faz haritası (tek pinli scrub boyunca):
//   0.00–0.273 PORTAL     : kapı referans açısına gelir (sprite %65), zoom yok
//   0.273–0.42 PORTAL+ZOOM: kapı açılmaya devam ederken içeri giriş başlar
//   0.42–0.78 ZOOM        : kapı sekansı tamamlanır; içeri giriş sürer
//   0.273–0.56 SHOWROOM   : açık kapı boşluğunun arkasında erkenden hazır olur
//   0.80–0.90  ORBIT      : kapılar arası gezinme (turntable döner)
//   0.90–1.00  HORIZONTAL : showroom + "Kurgulayın" paneli yatay kayar
const PORTAL_PICKUP = 0.273;
const PORTAL_OPEN_END = 0.42;
const HOLD_END = PORTAL_PICKUP;
const ZOOM_END = 0.78;
const SHOWROOM_START = HOLD_END;
const SHOWROOM_COVER = 0.56; // showroom bu noktada opak; sonra ön katman sönmeye başlar
const SHOWROOM_FULL = 0.8; // ilk kapı snap'i ve orbit başlangıcı
const PORTAL_SPRITE_FADE_END = 0.56; // büyütülen canvas'la gelen siyah ara kareyi gizler
const ORBIT_END = 0.9; // turntable dönüşü burada biter
const HORIZONTAL_START = 0.9; // yatay kayma burada başlar
const ZOOM_MAX = 14; // boşluğa girerkenki en yüksek ölçek (tunable)
// Canvas tamponu tam CSS pikseline yuvarlanır. Alpha-kalibre kutunun altında
// oluşabilecek tek satırlık raster sızıntıyı kapatmak için yalnız alta örtüşme.
const DOOR_BOTTOM_OVERLAP_PX = 3;

// Responsive hero varyantları — viewport oranına göre art-direct edilir.
// Her kayıt kendi doğal aspect'ini ve kapı deliği kalibrasyonunu taşır
// (day/night aynı kalibrasyonu paylaşır; delik konumu ±0.1pt farkla özdeş,
// bkz. memory: hero-varyant-kalibrasyon). Kutular hem hero deliğinin hem de
// kapalı sprite karesindeki gerçek opak kanat alanının alpha ölçümünden türetildi.
// Sprite çerçevesindeki şeffaf taşıma payı hesaba katılır; aksi halde kapı deliği
// iki temada da ince bir aralık olarak görünür.
interface DoorBox {
  centerX: number;
  top: number;
  width: number;
  height: number;
}

interface HeroVariant {
  daySrc: string;
  nightSrc: string;
  aspect: number;
  doorBox: DoorBox;
  // Gece görselinin KENDİ alpha-ölçümünden türetilmiş kutu. En büyük sapma
  // 21:9 çiftinde (N-21X9 ayrı render: ΔcX −0.168 / Δtop −0.279 / Δw +0.135 —
  // ekranda ~5px sol + ~2.5px üst kenar açıkta kalıyordu); AVIF çiftlerinde
  // fark ±0.2 içinde ama yine de ölçülmüş gece değerleri kullanılır.
  nightDoorBox: DoorBox;
}

// ULTRA_WIDE: 21:9 masaüstü için orijinal hero — yeni sette 21:9 karşılığı
// yok; 16:9'u bu kadar geniş bir alana cover ile zorlamak kompozisyonu
// dikeyden keser. minAspect eşiğinin üstünde bu varyant seçilir.
const ULTRA_WIDE_MIN_ASPECT = 21 / 9 - 0.15;
const ULTRA_WIDE: HeroVariant = {
  daySrc: "/L-21X9.webp",
  nightSrc: "/N-21X9.webp",
  aspect: 3134 / 1344,
  doorBox: { centerX: 52.19, top: 28.199, width: 14.95, height: 48.743 },
  nightDoorBox: { centerX: 52.02, top: 28.003, width: 15.092, height: 48.617 }
};

// Diğer 5 varyant, genişten dara sıralı — placeDoor() viewport oranına en
// yakın olanı seçer (bkz. pickHeroVariant).
const HERO_VARIANTS: HeroVariant[] = [
  {
    daySrc: "/hero-day-16x9.avif",
    nightSrc: "/hero-night-16x9.avif",
    aspect: 16 / 9,
    doorBox: { centerX: 52.177, top: 34.398, width: 15.414, height: 41.108 },
    nightDoorBox: { centerX: 52.17, top: 34.334, width: 15.496, height: 41.158 }
  },
  {
    daySrc: "/hero-day-4x3.avif",
    nightSrc: "/hero-night-4x3.avif",
    aspect: 4 / 3,
    doorBox: { centerX: 53.523, top: 36.697, width: 16.18, height: 32.448 },
    nightDoorBox: { centerX: 53.578, top: 36.657, width: 16.179, height: 32.58 }
  },
  {
    daySrc: "/hero-day-1x1.avif",
    nightSrc: "/hero-night-1x1.avif",
    aspect: 1,
    doorBox: { centerX: 50.959, top: 35.688, width: 17.5, height: 27.537 },
    nightDoorBox: { centerX: 50.936, top: 35.584, width: 17.514, height: 27.517 }
  },
  {
    daySrc: "/hero-day-3x4.avif",
    nightSrc: "/hero-night-3x4.avif",
    aspect: 3 / 4,
    doorBox: { centerX: 49.414, top: 42.347, width: 19.468, height: 22.275 },
    nightDoorBox: { centerX: 49.43, top: 42.197, width: 19.637, height: 22.514 }
  },
  {
    daySrc: "/hero-day-9x16.avif",
    nightSrc: "/hero-night-9x16.avif",
    aspect: 9 / 16,
    doorBox: { centerX: 51.388, top: 43.722, width: 26.608, height: 23.262 },
    nightDoorBox: { centerX: 51.368, top: 43.54, width: 26.723, height: 23.533 }
  }
];

// Viewport oranına en yakın varyantı seçer (log ölçekte — 16:9 ile 4:3
// arasındaki "yakınlık" çarpımsal, aritmetik fark değil). Viewport
// ultra-wide masaüstü sınırının üzerindeyse orijinal 21:9 hero kullanılır.
//
// NOT (2026-07-12): İlk açılışta (c5d71a2) tüm varyantlar bozuk görünüp
// rollback yemişti (8aa49a5). Kök neden varyantlar/sprite değil, NuxtImg'in
// sabit 2560×1098 IPX cover-crop'uydu — ekrana her varyantın 21:9 kesiti
// gidiyordu. Hero artık düz <img> ile orijinal dosyayı servis ediyor;
// render'ların kapalı-kapı oranı (0.541) delik oranlarıyla (0.52–0.55)
// zaten uyumlu ölçüldü. Sprite yeniden üretilmedi, gerek yok.
const pickHeroVariant = (viewportAspect: number): HeroVariant => {
  if (viewportAspect >= ULTRA_WIDE_MIN_ASPECT) return ULTRA_WIDE;

  let closest = HERO_VARIANTS[0]!;
  let smallestDelta = Infinity;
  for (const variant of HERO_VARIANTS) {
    const delta = Math.abs(Math.log(viewportAspect / variant.aspect));
    if (delta < smallestDelta) {
      smallestDelta = delta;
      closest = variant;
    }
  }
  return closest;
};

// Paketlenmiş kapı sprite'ları (scripts/pack-door-sprite.cjs çıktısı).
// Tüm hero varyantları AYNI sprite çiftini paylaşır — kapı kanadı
// DOOR_BOX kutusuna stretch edilerek oturur, varyant başına ayrı sprite
// gerekmez (bkz. memory: hero-varyant-kalibrasyon).
const SHOWROOM_DOOR_COUNT = 5;
const DOOR_SNAP_POINTS = Array.from({ length: SHOWROOM_DOOR_COUNT }, (_, index) =>
  SHOWROOM_FULL + (index / (SHOWROOM_DOOR_COUNT - 1)) * (ORBIT_END - SHOWROOM_FULL)
);

const DOOR = {
  day: "/kardoor-door-light.json",
  night: "/kardoor-door-night.json"
} as const;

const { isNight, mode } = useShowroomAmbience();

// Seçili hero varyantı; placeDoor() viewport ölçtükçe günceller (resize/mount).
const activeHeroVariant = ref<HeroVariant>(ULTRA_WIDE);
const heroSrc = computed(() =>
  isNight.value ? activeHeroVariant.value.nightSrc : activeHeroVariant.value.daySrc
);
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

const configureBodyParts = computed(() => {
  const body = configureCopy.value.body.trim();
  const lastSpaceIndex = body.lastIndexOf(" ");

  if (lastSpaceIndex === -1) {
    return {
      lead: "",
      lastWord: body
    };
  }

  return {
    lead: body.slice(0, lastSpaceIndex),
    lastWord: body.slice(lastSpaceIndex + 1)
  };
});

const sectionRef = ref<HTMLElement | null>(null);
const zoomRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const configureHeadingRef = ref<HTMLElement | null>(null);
const configureCopyRef = ref<HTMLElement | null>(null);
const configureCopyLastWordRef = ref<HTMLElement | null>(null);
const isConfigureHeadingIntroVisible = ref(false);
const isConfigureCopyIntroVisible = ref(false);
const isConfigureCopyLastWordVisible = ref(false);

const showroomProgress = ref(0); // 0→1 turntable orbit (kapı dönüşü)
const showroomFadeRef = ref(0); // 0→1 showroom görünürlüğü (fade, orbit'ten ayrı)
const isShowroomActive = ref(false);
const { $smoother } = useNuxtApp();

const door = useDoorSprite(canvasRef);
let trigger: ScrollTrigger | undefined;
let teardown: (() => void) | undefined;
let configureHeadingTween: ReturnType<typeof gsap.to> | undefined;
let configureCopyTween: ReturnType<typeof gsap.to> | undefined;
let configureCopyLastWordTween: ReturnType<typeof gsap.to> | undefined;
let hasPlayedConfigureHeadingIntro = false;
let hasPlayedConfigureCopyIntro = false;
let hasPlayedConfigureCopyLastWordIntro = false;
// Kapı-rayı tıklaması, wheel ile AYNI settle makinesini kullanmalı (ayrı bir
// tween açarsa state — kilit/cooldown/isAutoSettling — güncellenmez, iki tween
// çakışıp scroll'u geri atar). onMounted içinde atanır.
let settleToDoorIndex: ((index: number) => void) | undefined;

// Hero artık section'a full-bleed background (object-fit:cover). Kapı stage'i,
// görselin cover-render kutusuna göre JS ile px olarak konumlanır — böylece
// viewport oranı değişse de kapı deliğe kilitli kalır (overflow kenarı kırpılır).
//
// Viewport oranı değiştikçe (resize, cihaz döndürme) en yakın hero varyantı
// yeniden seçilir; heroSrc computed'ı bunu izleyip <NuxtImg> kaynağını
// günceller. Aynı frame'de DOOR_BOX de yeni varyantın kalibrasyonuna geçer.
const placeDoor = () => {
  const section = sectionRef.value;
  const stage = stageRef.value;
  if (!section || !stage) return;

  const vw = section.clientWidth;
  const vh = section.clientHeight;
  const viewportAspect = vw / vh;

  const variant = pickHeroVariant(viewportAspect);
  activeHeroVariant.value = variant;

  const coverW = viewportAspect > variant.aspect ? vw : vh * variant.aspect;
  const coverH = viewportAspect > variant.aspect ? vw / variant.aspect : vh;
  const coverLeft = (vw - coverW) / 2;
  const coverTop = (vh - coverH) / 2;

  const d = isNight.value ? variant.nightDoorBox : variant.doorBox;
  const w = (d.width / 100) * coverW;
  const h = (d.height / 100) * coverH;
  const stageH = h + DOOR_BOTTOM_OVERLAP_PX;
  const cx = coverLeft + (d.centerX / 100) * coverW;
  const top = coverTop + (d.top / 100) * coverH;

  stage.style.left = `${cx - w / 2}px`;
  stage.style.top = `${top}px`;
  stage.style.width = `${w}px`;
  stage.style.height = `${stageH}px`;

  // Zoom origin = kapı boşluğunun merkezi (section'a göre px). Zoom katmanı bu
  // noktaya doğru ölçeklenir → kamera kapıdan içeri giriyormuş hissi.
  const zoom = zoomRef.value;
  if (zoom) {
    zoom.style.setProperty("--zoom-origin-x", `${cx}px`);
    zoom.style.setProperty("--zoom-origin-y", `${top + stageH / 2}px`);
  }
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const playConfigureHeadingIntro = () => {
  const heading = configureHeadingRef.value;
  if (!heading || hasPlayedConfigureHeadingIntro) return;

  hasPlayedConfigureHeadingIntro = true;

  if (prefersReducedMotion()) {
    isConfigureHeadingIntroVisible.value = true;
    gsap.set(heading, { clearProps: "filter,opacity,scale" });
    return;
  }

  configureHeadingTween?.kill();
  configureHeadingTween = gsap.fromTo(
    heading,
    {
      filter: "blur(20px)",
      opacity: 0,
      scale: 0.9
    },
    {
      filter: "blur(0px)",
      opacity: 1,
      scale: 1,
      duration: 1.5,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        configureHeadingTween = undefined;
        isConfigureHeadingIntroVisible.value = true;
      }
    }
  );
};

const playConfigureCopyIntro = () => {
  const copyElement = configureCopyRef.value;
  if (!copyElement || hasPlayedConfigureCopyIntro) return;

  hasPlayedConfigureCopyIntro = true;

  if (prefersReducedMotion()) {
    isConfigureCopyIntroVisible.value = true;
    gsap.set(copyElement, { clearProps: "clipPath" });
    return;
  }

  configureCopyTween?.kill();
  configureCopyTween = gsap.fromTo(
    copyElement,
    { clipPath: "inset(0 100% 0 0)" },
    {
      clipPath: "inset(0 0% 0 0)",
      duration: 1.8,
      delay: 0.28,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        configureCopyTween = undefined;
        isConfigureCopyIntroVisible.value = true;
      }
    }
  );
};

const playConfigureCopyLastWordIntro = () => {
  const lastWord = configureCopyLastWordRef.value;
  if (!lastWord || hasPlayedConfigureCopyLastWordIntro) return;

  hasPlayedConfigureCopyLastWordIntro = true;

  if (prefersReducedMotion()) {
    isConfigureCopyLastWordVisible.value = true;
    gsap.set(lastWord, { clearProps: "clipPath,opacity" });
    return;
  }

  configureCopyLastWordTween?.kill();
  configureCopyLastWordTween = gsap.fromTo(
    lastWord,
    {
      clipPath: "inset(0 100% 0 0)",
      opacity: 0
    },
    {
      clipPath: "inset(0 0% 0 0)",
      opacity: 1,
      duration: 0.86,
      delay: 1.46,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        configureCopyLastWordTween = undefined;
        isConfigureCopyLastWordVisible.value = true;
      }
    }
  );
};

const resetConfigureHeadingIntro = () => {
  const heading = configureHeadingRef.value;
  if (!hasPlayedConfigureHeadingIntro && !isConfigureHeadingIntroVisible.value && !configureHeadingTween) return;

  hasPlayedConfigureHeadingIntro = false;
  isConfigureHeadingIntroVisible.value = false;
  configureHeadingTween?.kill();
  configureHeadingTween = undefined;
  if (heading) gsap.set(heading, { clearProps: "filter,opacity,scale" });
};

const resetConfigureCopyIntro = () => {
  const copyElement = configureCopyRef.value;
  if (!hasPlayedConfigureCopyIntro && !isConfigureCopyIntroVisible.value && !configureCopyTween) return;

  hasPlayedConfigureCopyIntro = false;
  isConfigureCopyIntroVisible.value = false;
  configureCopyTween?.kill();
  configureCopyTween = undefined;
  if (copyElement) gsap.set(copyElement, { clearProps: "clipPath" });
};

const resetConfigureCopyLastWordIntro = () => {
  const lastWord = configureCopyLastWordRef.value;
  if (
    !hasPlayedConfigureCopyLastWordIntro &&
    !isConfigureCopyLastWordVisible.value &&
    !configureCopyLastWordTween
  ) return;

  hasPlayedConfigureCopyLastWordIntro = false;
  isConfigureCopyLastWordVisible.value = false;
  configureCopyLastWordTween?.kill();
  configureCopyLastWordTween = undefined;
  if (lastWord) gsap.set(lastWord, { clearProps: "clipPath,opacity" });
};

// Master scrub: progress 0→1 boyunca PORTAL → HOLD → ZOOM → SHOWROOM fazları.
const updateMaster = (raw: number) => {
  const p = clamp01(raw);
  const zoom = zoomRef.value;

  // PORTAL: zoom referans açısında başlasa da kapı sekansı açılmaya devam eder.
  door.showProgress(clamp01(p / PORTAL_OPEN_END));
  const portalSpriteOpacity = 1 - easeInOut(
    clamp01((p - HOLD_END) / (PORTAL_SPRITE_FADE_END - HOLD_END))
  );
  if (stageRef.value) stageRef.value.style.opacity = `${portalSpriteOpacity}`;

  // ZOOM: HOLD bitiminden ZOOM_END'e kadar boşluğa doğru ölçeklen + kaybol.
  const zoomP = easeInOut(clamp01((p - HOLD_END) / (ZOOM_END - HOLD_END)));
  const scale = 1 + zoomP * ZOOM_MAX;
  // Showroom arkada tamamen opaklaştıktan sonra ön katmanı sil. Bu sıra geri
  // oynatıldığında da hero önce tam gelir; siyah ara kare oluşmaz.
  const zoomFade = 1 - easeInOut(clamp01((p - SHOWROOM_COVER) / (ZOOM_END - SHOWROOM_COVER)));
  if (zoom) {
    zoom.style.setProperty("--zoom-scale", `${scale}`);
    zoom.style.opacity = `${zoomFade}`;
  }

  // SHOWROOM görünürlüğü (fade): ön katman sönmeden önce tamamlanır.
  // Orbit'ten AYRI — sahne önce belirir, sonra kapılar döner.
  const showroomFade = easeInOut(clamp01((p - SHOWROOM_START) / (SHOWROOM_COVER - SHOWROOM_START)));
  showroomFadeRef.value = showroomFade;
  isShowroomActive.value = showroomFade > 0.02;

  // SHOWROOM orbit (kapı dönüşü): sahne tam belirdikten sonra ORBIT_END'e kadar.
  showroomProgress.value = clamp01((p - SHOWROOM_FULL) / (ORBIT_END - SHOWROOM_FULL));

  // HORIZONTAL: son kapıdan sonra showroom + "Kurgulayın" paneli yatay kayar.
  const slideP = easeInOut(clamp01((p - HORIZONTAL_START) / (1 - HORIZONTAL_START)));
  if (slideP >= 0.46) {
    playConfigureHeadingIntro();
    playConfigureCopyIntro();
    playConfigureCopyLastWordIntro();
  } else if (p < HORIZONTAL_START - 0.02) {
    resetConfigureHeadingIntro();
    resetConfigureCopyIntro();
    resetConfigureCopyLastWordIntro();
  }

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

const handleShowroomDoorSelect = (index: number) => {
  // wheel ile aynı settle yolundan geç → kilit/cooldown/aktif-settle bayrakları
  // tek elden yönetilir, tıklama sonrası scroll geri atmaz.
  settleToDoorIndex?.(index);
};

onMounted(() => {
  const section = sectionRef.value;
  if (!section || !canvasRef.value) return;

  placeDoor();
  let previousProgress = 0;
  let scrollTween: ReturnType<typeof gsap.to> | undefined;
  let isAutoSettling = false;
  let isPortalSettling = false;
  let settleDirection = 0;
  let settleCooldownUntil = 0;
  let lockedDoorIndex: number | undefined;
  // Tek itiş = tek kapı. Kilit, snap tween'i TAMAMLANINCA (settleToProgress
  // onComplete) bırakılır — eskiden her wheel olayında resetlenen 180ms'lik
  // "sessizlik" timer'ına bağlıydı; trackpad gibi sürekli olay üreten girdilerde
  // timer hiç dolmaz, kilit hiç açılmaz, native scroll da preventDefault'lu
  // olduğu için orbit bandında scroll tamamen donardı.
  let wheelGestureLocked = false;

  const getSmoother = () => ($smoother as undefined | (() => any))?.();
  const getProgressY = (progress: number) => {
    if (!trigger) return 0;
    return trigger.start + (trigger.end - trigger.start) * clamp01(progress);
  };
  const getNearestDoorIndex = (progress: number) =>
    DOOR_SNAP_POINTS.reduce((nearest, point, index) =>
      Math.abs(point - progress) < Math.abs(DOOR_SNAP_POINTS[nearest]! - progress) ? index : nearest
    , 0);

  const settleToProgress = (
    targetProgress: number,
    direction: number,
    duration = 1.05,
    ease = "power3.inOut"
  ) => {
    if (!trigger) return;
    const smoother = getSmoother();

    // Önce eski tween ölsün: kill() onInterrupt'ı tetikler ve kilitleri
    // sıfırlar — bayraklar bu yüzden kill'den SONRA set edilir.
    scrollTween?.kill();
    isAutoSettling = true;
    settleDirection = direction;

    // Snap bitince/kesilince: bir sonraki itiş yeni kapıyı tetikleyebilsin.
    // Kilidi burada bırakmak orbit bandındaki donmayı önler (cooldown yine de
    // ardışık snap'ler arasına kısa bir boşluk koyar).
    const releaseLocks = () => {
      isAutoSettling = false;
      isPortalSettling = false;
      settleDirection = 0;
      scrollTween = undefined;
      settleCooldownUntil = performance.now() + 320;
      wheelGestureLocked = false;
    };

    const targetY = getProgressY(targetProgress);

    if (smoother) {
      const startY = smoother.scrollTop();
      smoother.scrollTo(startY, false);
      const proxy = { y: startY };
      scrollTween = gsap.to(proxy, {
        y: targetY,
        duration,
        ease,
        overwrite: true,
        onUpdate: () => smoother.scrollTo(proxy.y, false),
        onInterrupt: releaseLocks,
        onComplete: releaseLocks
      });
      return;
    }

    // Touch/native scroll (smoother yok): tween doğrudan window'a yazar.
    // autoKill — kullanıcı parmağıyla araya girerse tween ölür; onInterrupt
    // kilitleri bırakır, scroll asla kilitli kalmaz.
    scrollTween = gsap.to(window, {
      scrollTo: { y: targetY, autoKill: true },
      duration,
      ease,
      overwrite: true,
      onInterrupt: releaseLocks,
      onComplete: releaseLocks
    });
  };

  // Kapı-rayı tıklaması: wheel-snap ile aynı settle yolunu kullanır → state
  // (kilit/cooldown/aktif-settle) tek elden güncellenir; tıklama sonrası scroll
  // geri atmaz. handleShowroomDoorSelect bunu çağırır.
  settleToDoorIndex = (index: number) => {
    const target = DOOR_SNAP_POINTS[index];
    if (target === undefined || !trigger) return;
    const direction = target >= trigger.progress ? 1 : -1;
    lockedDoorIndex = index;
    isPortalSettling = false;
    settleToProgress(target, direction, 0.9, "power3.inOut");
  };

  const pullThroughPortal = (direction: 1 | -1) => {
    isPortalSettling = true;
    lockedDoorIndex = direction === 1 ? 0 : undefined;
    settleToProgress(
      direction === 1 ? SHOWROOM_FULL : HOLD_END,
      direction,
      2.35,
      "power3.inOut"
    );
  };

  const maybePullThroughPortal = (progress: number, delta: number) => {
    // Native (touch) scroll'da da çalışır — smoother şartı yok.
    if (isAutoSettling || performance.now() < settleCooldownUntil) return;
    if (Math.abs(delta) < 0.0006) return;

    if (delta > 0 && progress >= HOLD_END && progress < SHOWROOM_FULL - 0.01) {
      pullThroughPortal(1);
    } else if (delta < 0 && progress > HOLD_END + 0.01 && progress <= SHOWROOM_FULL) {
      pullThroughPortal(-1);
    }
  };

  const onWheel = (event: WheelEvent) => {
    if (!trigger || !getSmoother()) return;

    if (isAutoSettling) {
      event.preventDefault();
      if (isPortalSettling && settleDirection > 0 && event.deltaY < -8) pullThroughPortal(-1);
      else if (isPortalSettling && settleDirection < 0 && event.deltaY > 8) pullThroughPortal(1);
      return;
    }

    const progress = trigger.progress;
    const inOrbitBand = progress >= SHOWROOM_FULL - 0.003 && progress <= ORBIT_END + 0.003;
    if (!inOrbitBand) {
      lockedDoorIndex = undefined;
      return;
    }

    event.preventDefault();
    if (performance.now() < settleCooldownUntil || Math.abs(event.deltaY) < 2) return;
    if (wheelGestureLocked) return;
    wheelGestureLocked = true;

    const direction = event.deltaY > 0 ? 1 : -1;
    if (lockedDoorIndex === undefined) lockedDoorIndex = getNearestDoorIndex(progress);
    const targetIndex = lockedDoorIndex + direction;

    if (targetIndex < 0) {
      pullThroughPortal(-1);
      return;
    }
    if (targetIndex >= DOOR_SNAP_POINTS.length) {
      lockedDoorIndex = undefined;
      isPortalSettling = false;
      settleToProgress(1, 1, 2.1, "power2.inOut");
      return;
    }

    lockedDoorIndex = targetIndex;
    isPortalSettling = false;
    settleToProgress(DOOR_SNAP_POINTS[targetIndex]!, direction);
  };
  // Wheel dinleyicisi yalnız masaüstünde: touch cihazda takılırsa passive:false
  // yüzünden native scroll'u engelleme riski var, wheel olayı da zaten üretilmez.
  // Plugin'deki gate ile aynı koşul (emülatörde pointer:coarse + geniş ekran
  // kombinasyonunda smoother'lı akış korunur).
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 1024;
  if (!isTouchDevice) window.addEventListener("wheel", onWheel, { passive: false });

  door.load(doorMeta.value).catch((error) => {
    console.error("[EntranceDoorLab] Kapı sprite yüklenemedi.", error);
  });

  // Tek pinli scrub: progress 0→1 boyunca PORTAL → HOLD → ZOOM → SHOWROOM.
  trigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * 9)}`, // pin süresi (tunable)
    scrub: true,
    pin: true,
    pinSpacing: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const delta = self.progress - previousProgress;
      previousProgress = self.progress;
      updateMaster(self.progress);
      maybePullThroughPortal(self.progress, delta);
    },
    onRefresh: (self) => {
      placeDoor();
      door.refresh();
      updateMaster(self.progress);
      previousProgress = self.progress;
    }
  });

  const onResize = () => {
    placeDoor();
    door.refresh();
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", onResize);

  // K (Home) → "kardoor:home" olayı: hero'yu progress 0'a (kapı TAM kapalı) getir.
  // settleToProgress isAutoSettling=true yapar → maybePullThroughPortal bastırılır;
  // aksi halde yukarı çıkış HOLD_END'e (kapı yarı açık) park ediyordu. Smoother'ın
  // kendi scroll'unu kullandığı için scroll pozisyonuyla progress senkron kalır.
  const goHome = () => {
    if (!trigger) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollTween?.kill();
    isPortalSettling = false;
    lockedDoorIndex = undefined;
    settleToProgress(0, -1, prefersReduced ? 0.01 : 1.2, "power3.inOut");
  };
  window.addEventListener("kardoor:home", goHome);

  teardown = () => {
    scrollTween?.kill();
    configureHeadingTween?.kill();
    configureCopyTween?.kill();
    configureCopyLastWordTween?.kill();
    settleToDoorIndex = undefined;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("kardoor:home", goHome);
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
          <ShowroomLab :progress="showroomProgress" @door-select="handleShowroomDoorSelect" />
        </div>

        <!-- KURGULAYIN paneli — yatay kayma ile gelir. -->
        <div class="entrance-lab__slide entrance-lab__configure">
          <div class="entrance-lab__configure-inner">
            <h2
              ref="configureHeadingRef"
              class="entrance-lab__configure-heading"
              :class="{ 'is-intro-visible': isConfigureHeadingIntroVisible }"
            >
              <span v-for="line in configureCopy.titleLines" :key="line">{{ line }}</span>
            </h2>
            <p
              ref="configureCopyRef"
              class="entrance-lab__configure-copy"
              :class="{ 'is-intro-visible': isConfigureCopyIntroVisible }"
            >
              {{ configureBodyParts.lead }}
              <span
                ref="configureCopyLastWordRef"
                class="entrance-lab__configure-copy-last-word"
                :class="{ 'is-intro-visible': isConfigureCopyLastWordVisible }"
              >{{ configureBodyParts.lastWord }}</span>
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
      <!-- Hero görseli — full-bleed (object-fit:cover). Kasten DÜZ <img>:
           NuxtImg'in sabit width/height'ı IPX'te her varyantı 2560×1098'e
           cover-CROP'luyordu; ekrana varyantın kendisi değil 21:9 kesiti
           gidiyor, placeDoor()'un varyant-oranlı cover matematiği ekrandaki
           görüntüyle uyuşmuyordu (kapı deliğe küçük düşüyordu). Varyant
           AVIF'leri zaten elde optimize (150–310KB), IPX resize gereksiz. -->
      <img
        :src="heroSrc"
        class="entrance-lab__bg"
        fetchpriority="high"
        decoding="async"
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
          <AdaCtaButton :label="copy.ctaLabel" href="/catalog" variant="filled" icon-position="none" />
          <a class="entrance-lab__cta-arrow" href="/catalog" :aria-label="copy.ctaLabel">
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
      <span class="entrance-lab__cue-label">{{ copy.scrollCue }}</span>
      <span class="entrance-lab__scroll-device">
        <span class="entrance-lab__scroll-motion" />
      </span>
    </div>
  </section>

  <!-- Pin'in temiz açılmasını sağlayan kısa tampon (ScrollSmoother rubber-band'i
       önler). Configure paneliyle aynı zemin → panel'den sonra "boş siyah sayfa"
       hissi olmaz; akış sorunsuz biter. Gerçek içerik (katalog) buraya gelecek. -->
  <section class="entrance-lab__next" :data-ambience="mode" aria-hidden="true" />
</template>

<style src="~/assets/styles/sections/entrance-lab.css"></style>
