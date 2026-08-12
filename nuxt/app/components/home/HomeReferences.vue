<template>
  <section ref="sectionRef" class="home-references-flip" aria-labelledby="home-references-title">
    <section
      ref="introRef"
      class="home-references-flip__intro"
      @pointermove="handleSpecimenPointerMove"
      @pointerleave="resetSpecimenPointer"
    >
      <div class="home-references-flip__specimens" aria-hidden="true">
        <figure class="home-references-flip__specimen home-references-flip__specimen--marble">
          <img
            class="home-references-flip__specimen-image"
            src="/images/brand/prism-illustrations/cracked-black-marble-cube.webp"
            alt=""
            decoding="async"
          >
        </figure>

        <figure class="home-references-flip__specimen home-references-flip__specimen--torus">
          <img
            class="home-references-flip__specimen-image"
            :src="torusSpecimenSrc"
            alt=""
            decoding="async"
          >
        </figure>
      </div>

      <h2 id="home-references-title">
        <span v-for="line in referencesCopy.titleLines" :key="line">{{ line }}</span>
      </h2>
      <p>{{ referencesCopy.intro }}</p>
    </section>

    <section ref="initialRef" class="home-references-flip__panel home-references-flip__initial">
      <div class="home-references-flip__copy">
        <h3>
          <template v-for="(line, index) in referencesCopy.panelTitleLines" :key="line">
            <br v-if="index">
            {{ line }}
          </template>
        </h3>
        <p>{{ referencesCopy.panelBody }}</p>
      </div>

      <div ref="startMarkerRef" class="home-references-flip__marker home-references-flip__marker--start"></div>
    </section>

    <section ref="finalRef" class="home-references-flip__panel home-references-flip__final">
      <div class="home-references-flip__marker home-references-flip__marker--final">
        <div ref="mediaRef" class="home-references-flip__media">
          <iframe
            v-if="isDocumentaryStarted"
            class="home-references-flip__video"
            :src="documentaryYoutubeEmbedUrl"
            :title="referencesCopy.videoTitle"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
          <button
            v-if="!isDocumentaryStarted"
            type="button"
            class="home-references-flip__play"
            :style="{ '--references-video-poster': `url(${documentaryYoutubePosterUrl})` }"
            :aria-label="referencesCopy.playAria"
            @click="startDocumentary"
          >
            <span class="home-references-flip__play-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
              </svg>
            </span>
            <span class="home-references-flip__play-text">{{ referencesCopy.playLabel }}</span>
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { locale } = useKardoorLocale();

interface ReferencesCopy {
  videoTitle: string;
  playAria: string;
  playLabel: string;
  titleLines: string[];
  intro: string;
  panelTitleLines: string[];
  panelBody: string;
}

const trCopy: ReferencesCopy = {
  videoTitle: "Ege Kardoor kurumsal belgesel",
  playAria: "Kurumsal belgeseli oynat",
  playLabel: "Tanıtımı İzle",
  titleLines: ["Sınırların nasıl", "çizildiğine", "tanık olun."],
  intro:
    "Ege Kardoor’un üretim felsefesi. Ham çeliğin, yüksek mühendislik ve tasarım vizyonuyla premium bir mimari elemente dönüşme serüveni.",
  panelTitleLines: ["Mikro detaylardan,", "makro projelere."],
  panelBody:
    "Sadece bir güvenlik önlemi değil, yapının karakterini belirleyen o ilk temas noktası. Hassas kesimlerden kusursuz yüzey bitişlerine kadar, fabrikamızdaki teknoloji ve zanaat entegrasyonunu keşfedin."
};

const enCopy: ReferencesCopy = {
  videoTitle: "Ege Kardoor corporate documentary",
  playAria: "Play the corporate documentary",
  playLabel: "Watch Intro",
  titleLines: ["Witness how", "boundaries", "are drawn."],
  intro:
    "Ege Kardoor’s production philosophy: the journey of raw steel becoming a premium architectural element through advanced engineering and a refined design vision.",
  panelTitleLines: ["From micro details,", "to macro projects."],
  panelBody:
    "More than a security measure, the entrance door is the first point of contact that defines a structure’s character. Explore the integration of technology and craft in our factory, from precision cuts to flawless surface finishes."
};

const referencesCopy = computed(() => (locale.value === "en" ? enCopy : trCopy));

// Statik src, Nuxt dev'de virtual:public + HMR cache-bust (?t=...&) etkileşimiyle
// yolu bozabiliyor; dinamik binding asset transform'unu atlayarak bundan kaçınır.
const torusSpecimenSrc = "/images/brand/prism-illustrations/metallic-inflated-torus-sculpture.webp";

const sectionRef = ref<HTMLElement | null>(null);
const initialRef = ref<HTMLElement | null>(null);
const finalRef = ref<HTMLElement | null>(null);
const startMarkerRef = ref<HTMLElement | null>(null);
const mediaRef = ref<HTMLElement | null>(null);
const introRef = ref<HTMLElement | null>(null);
const isDocumentaryStarted = ref(false);
const documentaryYoutubeId = "yiZm36w4qiQ";
const documentaryYoutubePosterUrl = `https://i.ytimg.com/vi/${documentaryYoutubeId}/maxresdefault.jpg`;
const documentaryYoutubeEmbedUrl = computed(() => {
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    modestbranding: "1",
    playsinline: "1",
    rel: "0"
  });

  return `https://www.youtube.com/embed/${documentaryYoutubeId}?${params.toString()}`;
});

// Play içeriği (ikon + yazı) kartla birlikte salt orantısal küçülürse yazı
// ~7px'e düşüp okunmaz oluyor; kart durumunda tam boyutun bu oranında kalacak
// şekilde ters ölçekle telafi edilir (scrub sonunda 1'e iner).
const PLAY_CONTENT_START_SCALE = 0.3;

type FlipContext = { revert: () => void };
type FlipFitVars = { x?: number; y?: number; scaleX?: number; scaleY?: number };

let flipContext: FlipContext | null = null;
let rebuildFlip: (() => void) | null = null;
let documentaryStartScrollY = 0;
// Catalog rows reserve their final height before product batches reveal, so this
// trigger should not drift during normal scroll. If an upstream responsive/layout
// change still moves this section, rebuild ONLY this section. A global
// ScrollTrigger.refresh() would re-pin the hero/turntable and yank the scroll
// position.
//
// Neden refresh() DEĞİL de tam rebuild: refresh yalnız trigger'ın başlangıç/bitiş
// scroll noktalarını yeniden ölçer; Flip.fit ile hesaplanan fitVars tween'in
// içine gömülüdür ve olduğu gibi kalır. Katalog yüksekliği değiştiğinde başlangıç
// kartının yeri de kayabildiği için eski fit değerleri yanlış kalırdı.
let catalogResizeObserver: ResizeObserver | null = null;
let catalogResizeTimer = 0;

const scheduleFlipRebuild = () => {
  window.clearTimeout(catalogResizeTimer);
  catalogResizeTimer = window.setTimeout(() => {
    catalogResizeTimer = 0;
    window.requestAnimationFrame(() => {
      rebuildFlip?.();
    });
  }, 180);
};

const stopDocumentary = () => {
  isDocumentaryStarted.value = false;
  documentaryStartScrollY = 0;
};

const setSpecimenPointer = (x: number, y: number) => {
  const intro = introRef.value;
  if (!intro) return;

  intro.style.setProperty("--references-pointer-x", x.toFixed(3));
  intro.style.setProperty("--references-pointer-y", y.toFixed(3));
};

const resetSpecimenPointer = () => {
  setSpecimenPointer(0, 0);
};

const handleSpecimenPointerMove = (event: PointerEvent) => {
  if (event.pointerType === "touch") return;

  const intro = introRef.value;
  if (!intro) return;

  const rect = intro.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

  setSpecimenPointer(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
};

const startDocumentary = () => {
  documentaryStartScrollY = window.scrollY;
  isDocumentaryStarted.value = true;
};

const handleDocumentaryScroll = () => {
  if (!isDocumentaryStarted.value) return;

  if (Math.abs(window.scrollY - documentaryStartScrollY) > 90) {
    stopDocumentary();
  }
};

const setupFlip = async () => {
  const section = sectionRef.value;
  if (!section) return;

  const [{ gsap }, { ScrollTrigger }, { Flip }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/Flip")
  ]);

  gsap.registerPlugin(ScrollTrigger, Flip);

  // PERDE TELAFİSİ.
  //
  // `.home-catalog-reference-stack` scroll boyunca --catalog-curtain-y ile
  // YUKARI ötelenir (0 → -240px, bkz. HomeCatalogTransition). ScrollTrigger ise
  // trigger'ın yerini refresh anında ölçer; refresh sayfa açılışında, yani perde
  // daha 0'ken çalıştığı için bu bölümü olduğundan --catalog-curtain-extra kadar
  // AŞAĞIDA sanıyor ve scrub o kadar geç başlıyordu.
  //
  // Ölçüldü (1703x741, aynı sayfa): telafisiz start/end 13289/13971, olması
  // gereken 13049/13731 — kart, panel %24 çizgisini geçtikten 240px sonra
  // büyümeye başlıyordu.
  //
  // Telafi SABİT alınabilir: perde kendi trigger'ını referans bölümü ekrana
  // girmeden çok önce bitirir (~6940px; bu scrub ~13049px'te başlar), yani bu
  // bölüm görünürken öteleme her zaman tam değerindedir. Fonksiyon olarak
  // veriliyor ki her refresh'te yeniden okunsun — mobilde perde CSS ile
  // kapatıldığı için 0 döner.
  const curtainOffset = () => {
    if (window.innerWidth <= 760) return 0;

    const stack = section.closest(".home-catalog-reference-stack");
    if (!stack) return 0;

    return (
      Number.parseFloat(
        window.getComputedStyle(stack).getPropertyValue("--catalog-curtain-extra")
      ) || 0
    );
  };

  const create = () => {
    flipContext?.revert();

    flipContext = gsap.context(() => {
      const media = mediaRef.value;
      const startMarker = startMarkerRef.value;
      const initial = initialRef.value;
      const final = finalRef.value;

      if (!media || !startMarker || !initial || !final) return;

      // Medya layout'ta hep final marker'ı (tam ekran) doldurur; Flip.fit onu
      // başlangıç kartına oturtan x/y/scale değerlerini verir. Scrub boyunca
      // yalnızca transform değişir: relayout yok, CLS'e kayma yazılmaz.
      const fitVars = Flip.fit(media, startMarker, { scale: true, getVars: true }) as FlipFitVars;
      const fitScaleX = Number(fitVars.scaleX) || 1;
      const fitScaleY = Number(fitVars.scaleY) || 1;
      const mediaRadius = Number.parseFloat(window.getComputedStyle(media).borderTopLeftRadius) || 0;
      const startMediaRadiusX = `${mediaRadius / Math.max(Math.abs(fitScaleX), 0.001)}px`;
      const startMediaRadiusY = `${mediaRadius / Math.max(Math.abs(fitScaleY), 0.001)}px`;

      gsap.set(media, { autoAlpha: 1 });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: initial,
          // `top-=<perde>` → ölçüm noktası perdenin götüreceği kadar yukarı
          // alınır, böylece scrub panelin GÖRÜNEN yerine göre başlar/biter.
          // İki uç da aynı miktarda kaydığı için scrub mesafesi (682px) değişmez.
          start: () => `top-=${curtainOffset()} 24%`,
          endTrigger: final,
          end: () => `bottom-=${curtainOffset()} bottom`,
          // ScrollSmoother already eases the page; keep this card locked to
          // that smoothed playhead instead of adding a second one-second lag.
          scrub: true
        }
      });

      timeline.fromTo(
        media,
        {
          ...fitVars,
          "--references-media-radius-x": startMediaRadiusX,
          "--references-media-radius-y": startMediaRadiusY
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          "--references-media-radius-x": "0px",
          "--references-media-radius-y": "0px"
        },
        0
      );

      const playContent = media.querySelectorAll<HTMLElement>(
        ".home-references-flip__play-icon, .home-references-flip__play-text"
      );

      if (playContent.length) {
        timeline.fromTo(
          playContent,
          {
            scaleX: Math.max(1, PLAY_CONTENT_START_SCALE / fitScaleX),
            scaleY: Math.max(1, PLAY_CONTENT_START_SCALE / fitScaleY)
          },
          { scaleX: 1, scaleY: 1 },
          0
        );
      }

    }, section);
  };

  create();
  rebuildFlip = create;
  window.addEventListener("resize", create);

  // FONT SONRASI YENİDEN KURULUM ŞART.
  //
  // Scrub'ın start/end'i fonksiyon (yukarıda), yani ancak bir refresh'te
  // yeniden okunur; fitVars ise refresh'te HİÇ güncellenmez, yalnız create()
  // ile. Fontlar geç çözüldüğünde üstteki katalog/panel yüksekliği oynuyor ve
  // ikisi de mount anındaki ölçüde kalıyordu — kart yanlış scroll noktasında
  // büyümeye başlıyordu.
  //
  // Eskiden bunu HomeExperience'taki global ScrollTrigger.refresh() örtüyordu;
  // o çağrı hero pin'ini de yeniden ölçtüğü için kaldırıldı (bkz.
  // HomeCatalogTransition.vue fonts.ready notu). Buradaki rebuild gsap.context
  // ile `section`'a kapsanmıştır: hero'ya dokunmaz.
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;

  if (fonts?.ready) {
    fonts.ready.then(() => {
      // unmount olduysa rebuildFlip null'lanmıştır.
      if (!rebuildFlip) return;
      requestAnimationFrame(() => rebuildFlip?.());
    });
  }

  if ("ResizeObserver" in window) {
    catalogResizeObserver?.disconnect();

    const upstreamTargets = [
      document.querySelector<HTMLElement>(".catalog-section"),
      document.querySelector<HTMLElement>(".home-catalog-reference-stack__catalog-frame")
    ].filter((target): target is HTMLElement => Boolean(target));

    if (upstreamTargets.length) {
      let lastHeight = upstreamTargets.reduce((height, target) => height + target.getBoundingClientRect().height, 0);

      catalogResizeObserver = new ResizeObserver(() => {
        const nextHeight = upstreamTargets.reduce((height, target) => height + target.getBoundingClientRect().height, 0);
        if (Math.abs(nextHeight - lastHeight) < 1) return;

        lastHeight = nextHeight;
        scheduleFlipRebuild();
      });

      upstreamTargets.forEach((target) => catalogResizeObserver?.observe(target));
    }
  }
};

// Buton <-> iframe geçişinde play içeriği yeniden mount olur; ters ölçek
// tween'inin yeni node'ları yakalaması için kurulum tazelenir.
watch(isDocumentaryStarted, async () => {
  await nextTick();
  rebuildFlip?.();
});

onMounted(() => {
  nextTick(() => {
    setupFlip();
  });

  window.addEventListener("scroll", handleDocumentaryScroll, { passive: true });
});

onBeforeUnmount(() => {
  if (rebuildFlip) {
    window.removeEventListener("resize", rebuildFlip);
    rebuildFlip = null;
  }

  window.clearTimeout(catalogResizeTimer);
  catalogResizeTimer = 0;
  catalogResizeObserver?.disconnect();
  catalogResizeObserver = null;

  flipContext?.revert();
  flipContext = null;
  window.removeEventListener("scroll", handleDocumentaryScroll);
});
</script>
