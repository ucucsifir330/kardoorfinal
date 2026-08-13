<template>
  <section
    ref="stageRef"
    class="testimonial-wrapper relative m-0 flex min-h-[100svh] w-full items-center overflow-hidden bg-[var(--catalog-stage-surface-bg,var(--bg-color))] pt-[clamp(80px,7vw,128px)] pb-[clamp(150px,15vw,240px)] max-[1024px]:min-h-0 max-[1024px]:items-start max-[1024px]:pt-[156px] max-[1024px]:pb-[180px] max-[640px]:flex-col max-[640px]:pt-[124px] max-[640px]:pb-[150px]"
  >
    <div
      class="title-area pointer-events-none absolute top-0 left-0 z-10 flex h-full w-[45%] items-center pl-[3vw] max-[1024px]:relative max-[1024px]:h-auto max-[1024px]:w-full max-[1024px]:items-start max-[1024px]:px-[clamp(18px,4vw,40px)] max-[640px]:px-5"
    >
      <h2
        class="title rotating-title text-rotating relative z-[2] m-0 flex flex-col font-telegraf font-[540] leading-[1.05] tracking-normal text-text max-[1024px]:text-rotating-lg max-[640px]:w-[min(100%,360px)] max-[640px]:text-rotating-sm max-[640px]:leading-[1.04]"
      >
        <div
          class="top-row inline-flex items-center whitespace-nowrap [transition:gap_var(--title-pill-transition-smooth)] max-[640px]:gap-[clamp(8px,2.2vw,12px)]"
          :style="{ gap: dynamicGap }"
        >
          <span
            :ref="setStaticTextRef"
            class="static-text inline-block [transition:transform_var(--title-pill-transition-smooth)] will-change-transform"
          >
            {{ staticLabel }}
          </span>

          <motion.div
            class="rotating-text-wrapper relative block h-[clamp(4.65rem,6.2vw,6.9rem)] overflow-hidden rounded-[clamp(28px,3.2vw,44px)] bg-[var(--brand-700)] bg-[length:300%_300%] [box-shadow:0_18px_44px_rgba(34,49,140,0.18)] [animation:gradientBG_6s_ease_infinite] [transition:box-shadow_var(--title-pill-transition-smooth)] max-[1024px]:h-[clamp(3.75rem,9.25vw,5.85rem)] max-[640px]:h-[clamp(3.1rem,12.25vw,3.8rem)] max-[640px]:rounded-[18px]"
            :style="{ width: titleWidth + 'px' }"
            layout
            :transition="pillTransition"
          >
            <span
              :ref="setHiddenSpanRef"
              class="hidden-measure text-rotating pointer-events-none absolute top-0 left-0 flex h-full items-center whitespace-nowrap px-[clamp(0.75rem,2vw,2rem)] font-telegraf font-[540] tracking-normal invisible max-[1024px]:text-rotating-lg max-[640px]:text-rotating-sm"
            ></span>

            <span class="sr-only">{{ activeTitleWord }}</span>

            <AnimatePresence mode="sync" :initial="false">
              <motion.span
                :key="`${locale}-${activeTitleWord}`"
                class="rotating-text-line pointer-events-none absolute inset-0 flex items-center justify-center px-[clamp(0.75rem,2vw,2rem)]"
                layout
                aria-hidden="true"
              >
                <span class="rotating-text-word inline-flex overflow-hidden pb-[0.06em]">
                  <motion.span
                    v-for="(character, index) in titleCharacters"
                    :key="`${character}-${index}`"
                    class="rotating-text-element text-rotating inline-block translate-y-[-0.03em] whitespace-pre font-telegraf font-[540] leading-none tracking-normal text-[var(--brand-100)] will-change-transform max-[1024px]:text-rotating-lg max-[640px]:text-rotating-sm"
                    :initial="letterInitial"
                    :animate="letterAnimate"
                    :exit="letterExit"
                    :transition="getLetterTransition(index)"
                  >{{ character }}</motion.span>
                </span>
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        <div class="bottom-row block whitespace-nowrap">{{ bottomLabel }}</div>
      </h2>

      <div
        class="gradient-mask absolute top-0 right-[-40%] z-[1] h-full w-[140%] bg-[linear-gradient(to_right,var(--catalog-stage-surface-bg,var(--bg-color))_60%,transparent_100%)] max-[1024px]:hidden"
      ></div>
    </div>

    <div
      class="carousel-area flex w-full flex-col gap-[clamp(1.35rem,2vw,2rem)] pl-[40%] max-[1024px]:relative max-[1024px]:z-[2] max-[1024px]:mt-[clamp(42px,7vw,72px)] max-[1024px]:gap-4 max-[1024px]:pl-0 max-[640px]:mt-[34px] max-[640px]:gap-[0.85rem]"
    >
      <div
        class="track w-full cursor-grab overflow-visible active:cursor-grabbing max-[1024px]:px-[clamp(18px,4vw,40px)] max-[640px]:px-5"
        @mousedown.prevent="startDrag($event, 1)"
        @touchstart="startDrag($event, 1)"
        @mouseenter="setHover(true, 1)"
        @mouseleave="setHover(false, 1)"
      >
        <div
          class="track-inner flex w-max gap-[clamp(1rem,1.5vw,1.5rem)] will-change-transform max-[640px]:gap-[0.85rem]"
          :ref="setInner1Ref"
        >
          <div
            v-for="(review, index) in row1"
            :key="'r1-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row1"
            :key="'clone1-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="track w-full cursor-grab overflow-visible active:cursor-grabbing max-[1024px]:px-[clamp(18px,4vw,40px)] max-[640px]:px-5"
        @mousedown.prevent="startDrag($event, 2)"
        @touchstart="startDrag($event, 2)"
        @mouseenter="setHover(true, 2)"
        @mouseleave="setHover(false, 2)"
      >
        <div
          class="track-inner flex w-max gap-[clamp(1rem,1.5vw,1.5rem)] will-change-transform max-[640px]:gap-[0.85rem]"
          :ref="setInner2Ref"
        >
          <div
            v-for="(review, index) in row2"
            :key="'r2-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>

          <div
            v-for="(review, index) in row2"
            :key="'clone2-' + index"
            :class="reviewCardClass"
            @mousemove="tiltCard"
            @mouseleave="resetTilt"
          >
            <p :class="quoteClass">"{{ review.text }}"</p>

            <div :class="authorClass">
              <div :class="authorInfoClass">
                <span :class="nameClass">{{ review.name }}</span>
                <span :class="ratingClass">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
/**
 * HomeReviews — yorumlar bölümü. KENDİ davranışının sahibi.
 *
 * Eskiden bu bileşen 16 prop alan bir kabuktu ve 9'u FONKSİYONDU: veri,
 * sürükleme, hover, eğilme, daktilo ve rAF döngüsünün tamamı
 * HomeExperience'ta duruyordu. Parent hem orkestratör hem de bu bölümün
 * motoruydu; bölüm tek başına anlaşılamıyor, taşınamıyor, test edilemiyordu.
 *
 * Artık dışarıdan hiçbir şey almıyor. Veri, ölçüm, animasyon ve temizlik
 * burada; parent yalnızca <HomeReviews /> yazıyor.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { AnimatePresence, motion, useReducedMotion } from 'motion-v';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useKardoorLocale } from '~/composables/useKardoorLocale';

interface Review {
  id: number;
  text: string;
  name: string;
}

interface TrackState {
  x: number;
  isDragging: boolean;
  startX: number;
  isHovered: boolean;
  baseSpeed: number;
  currentVelocity: number;
}

const { locale } = useKardoorLocale();

const reviewCopies: Record<
  string,
  { staticLabel: string; bottomLabel: string; titleWords: string[]; reviews: Review[] }
> = {
  tr: {
    staticLabel: 'Son',
    bottomLabel: 'size bırakıyoruz.',
    titleWords: ['sözü', 'kararı', 'yorumu'],
    reviews: [
      {
        id: 1,
        text: 'Kardoor Çelik Kapı ailesi sorunumu özenle dinledi ve çözdü. Güven bey ve montaj ekibi arkadaşlara teşekkür ediyorum. Titizlikle ilgilendiler.',
        name: 'Nadire Ş.'
      },
      {
        id: 2,
        text: 'Kendi evime ve oğlumun evine kapı yaptırdık. Çok memnun kaldık. Personeller işi beklediğimden hızlı teslim ettiler.',
        name: 'Ahmet M.'
      },
      {
        id: 3,
        text: 'Yaptıkları işlerde gerek kaliteleri olsun gerek hızları olsun 20 yıldır böyle bir firmayla hiç çalışmamıştım. Teşekkürler Kardoor Çelik Kapı.',
        name: 'Mustafa K.'
      },
      {
        id: 4,
        text: "İzmir'de dış iklim kapısı ararken Kardoor'u bulduk. Güven Bey çok yardımcı oldu. Kapının yalıtımı ve malzeme kalitesi gerçekten muazzam.",
        name: 'Elif T.'
      },
      {
        id: 5,
        text: 'Bina giriş kapımızı yeniledik. Cam kapı detayları ve işçilik çok başarılı. Tüm süreçte profesyonelce yaklaştılar, tavsiye ederim.',
        name: 'Kemal S.'
      },
      {
        id: 6,
        text: 'Montaj ekibi söz verdikleri gün ve saatte gelip tertemiz çalıştı. Hem estetik hem de güven veren, sağlam bir yapısı var. Elinize sağlık.',
        name: 'Ayşe Y.'
      },
      {
        id: 7,
        text: "Showroom'daki 3D sunum ile evimize uygulanacak kapıyı önceden görmek harikaydı. Sonuç beklediğimizden de şık oldu.",
        name: 'Burak D.'
      },
      {
        id: 8,
        text: 'Hızlı, net ve profesyonel yaklaşım. İhtiyacımız olan çelik kapı çözümünü doğrudan aldık, fiyat ve performans çok iyi.',
        name: 'Serkan A.'
      }
    ]
  },
  en: {
    staticLabel: 'Your',
    bottomLabel: 'is the final word.',
    titleWords: ['verdict', 'review', 'impression'],
    reviews: [
      {
        id: 1,
        text: 'The Kardoor team listened carefully and resolved our concern with real attention. Mr. Güven and the installation crew were meticulous from start to finish.',
        name: 'Nadire Ş.'
      },
      {
        id: 2,
        text: 'We commissioned doors for both my home and my son’s. The result was excellent, and the team delivered sooner than I expected.',
        name: 'Ahmet M.'
      },
      {
        id: 3,
        text: 'Their quality, pace, and discipline are rare. In twenty years, I have not worked with a company this composed and capable.',
        name: 'Mustafa K.'
      },
      {
        id: 4,
        text: 'We discovered Kardoor while searching for an exterior-grade door in Izmir. Mr. Güven guided us beautifully; the insulation and material quality are outstanding.',
        name: 'Elif T.'
      },
      {
        id: 5,
        text: 'We renewed the entrance door of our building. The glass detailing and workmanship are exceptional, and the entire process felt thoroughly professional.',
        name: 'Kemal S.'
      },
      {
        id: 6,
        text: 'The installation team arrived exactly when promised and worked impeccably. The door feels elegant, reassuring, and truly solid.',
        name: 'Ayşe Y.'
      },
      {
        id: 7,
        text: "Seeing the door in the showroom's 3D presentation before installation was remarkable. The finished result is even more refined than we imagined.",
        name: 'Burak D.'
      },
      {
        id: 8,
        text: 'Fast, clear and professional. We got exactly the steel door solution we needed; the price and performance are excellent.',
        name: 'Serkan A.'
      }
    ]
  }
};

const reviewCopy = computed(() => reviewCopies[locale.value] ?? reviewCopies.tr!);
const staticLabel = computed(() => reviewCopy.value.staticLabel);
const bottomLabel = computed(() => reviewCopy.value.bottomLabel);
const titleWords = computed(() => reviewCopy.value.titleWords);
const googleReviews = computed<Review[]>(() => reviewCopy.value.reviews);
const row1 = computed(() => googleReviews.value.slice(0, 4));
const row2 = computed(() => googleReviews.value.slice(4, 8));
const shouldReduceMotion = useReducedMotion();

const currentTitleWordIndex = ref(0);
const activeTitleWord = computed(
  () => titleWords.value[currentTitleWordIndex.value] ?? titleWords.value[0] ?? ''
);

const splitIntoCharacters = (text: string) => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(locale.value, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (segment) => segment.segment);
  }

  return Array.from(text);
};

const titleCharacters = computed(() => splitIntoCharacters(activeTitleWord.value));
const letterInitial = computed(() =>
  shouldReduceMotion.value ? { opacity: 0 } : { y: '100%' }
);
const letterAnimate = computed(() =>
  shouldReduceMotion.value ? { opacity: 1 } : { y: 0 }
);
const letterExit = computed(() =>
  shouldReduceMotion.value ? { opacity: 0 } : { y: '-120%' }
);
const pillTransition = computed(() =>
  shouldReduceMotion.value
    ? { duration: 0.14, ease: 'easeOut' as const }
    : { type: 'spring' as const, visualDuration: 0.48, bounce: 0.08 }
);

const getLetterTransition = (index: number) => {
  if (shouldReduceMotion.value) {
    return { duration: 0.14, ease: 'easeOut' as const };
  }

  return {
    type: 'spring' as const,
    visualDuration: 0.48,
    bounce: 0.08,
    delay: (titleCharacters.value.length - 1 - index) * 0.025
  };
};

// SSR/hydration sözleşmesi: ilk render'da sunucu ve istemci AYNI değeri
// üretmeli. Gerçek ölçüm onMounted'daki updateTitleWidth() ile yapılır.
const initialTitleWidth = 220;
const pillExtraWidth = 10;
const titleWidth = ref(initialTitleWidth);
const baseTitleWidth = ref(0);

const hiddenSpan = ref<HTMLElement | null>(null);
const staticText = ref<HTMLElement | null>(null);
const inner1 = ref<HTMLElement | null>(null);
const inner2 = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);

const setHiddenSpanRef = (el: unknown) => {
  hiddenSpan.value = el as HTMLElement | null;
};
const setStaticTextRef = (el: unknown) => {
  staticText.value = el as HTMLElement | null;
};
const setInner1Ref = (el: unknown) => {
  inner1.value = el as HTMLElement | null;
};
const setInner2Ref = (el: unknown) => {
  inner2.value = el as HTMLElement | null;
};

const track1State: TrackState = {
  x: 0,
  isDragging: false,
  startX: 0,
  isHovered: false,
  baseSpeed: 0.4,
  currentVelocity: 0.4
};

const track2State: TrackState = {
  x: 0,
  isDragging: false,
  startX: 0,
  isHovered: false,
  baseSpeed: 0.25,
  currentVelocity: 0.25
};

let activeTrack: number | null = null;
let animationFrameId = 0;
let reviewsTrigger: ScrollTrigger | null = null;
let reviewsAnimationActive = false;
let titleRotationTimer: ReturnType<typeof setInterval> | null = null;
let titleRotationTrigger: ScrollTrigger | null = null;

// Aynı kelime + aynı viewport genişliği için ölçüm sonucunu sakla. Sebep:
// textContent YAZIP hemen getBoundingClientRect() OKUMAK senkron reflow'a
// zorluyor (layout thrashing).
const titleWidthCache = new Map<string, number>();

const updateTitleWidth = () => {
  const hiddenSpanEl = hiddenSpan.value;
  const staticTextEl = staticText.value;

  if (!hiddenSpanEl) return;

  const cacheKey = `${activeTitleWord.value}@${window.innerWidth}`;
  let measuredWidth = titleWidthCache.get(cacheKey) ?? 0;

  if (!measuredWidth) {
    hiddenSpanEl.textContent = activeTitleWord.value;
    measuredWidth = hiddenSpanEl.getBoundingClientRect().width;
    // 0 gelirse (font henüz yüklenmemiş) önbelleğe alma — sonraki çağrı ölçsün.
    if (measuredWidth) titleWidthCache.set(cacheKey, measuredWidth);
  }

  const measuredPillWidth = measuredWidth + pillExtraWidth;
  titleWidth.value = measuredPillWidth;

  if (!baseTitleWidth.value) baseTitleWidth.value = measuredPillWidth;

  if (staticTextEl) {
    const offset = (measuredPillWidth - baseTitleWidth.value) * 0.18;
    staticTextEl.style.transform = `translateX(${offset}px)`;
  }
};

const stopTitleRotation = () => {
  if (!titleRotationTimer) return;
  clearInterval(titleRotationTimer);
  titleRotationTimer = null;
};

const startTitleRotation = () => {
  if (titleRotationTimer || titleWords.value.length < 2) return;

  titleRotationTimer = setInterval(() => {
    currentTitleWordIndex.value =
      (currentTitleWordIndex.value + 1) % titleWords.value.length;
  }, 2600);
};

watch(activeTitleWord, () => {
  updateTitleWidth();
}, { flush: 'sync' });

watch(locale, async () => {
  currentTitleWordIndex.value = 0;
  await nextTick();
  updateTitleWidth();
}, { flush: 'post' });

const dynamicGap = computed(() => {
  const gapValue = 26 + titleWidth.value * 0.04;
  return `${Math.max(30, Math.min(50, gapValue))}px`;
});

const getX = (event: MouseEvent | TouchEvent): number => {
  if ('touches' in event && event.touches.length > 0) {
    return event.touches[0]!.pageX;
  }
  return (event as MouseEvent).pageX;
};

const shouldRunReviewsAnimation = () =>
  reviewsAnimationActive || track1State.isDragging || track2State.isDragging;

const requestReviewsAnimation = () => {
  if (!animationFrameId && shouldRunReviewsAnimation()) {
    animationFrameId = requestAnimationFrame(animate);
  }
};

const stopReviewsAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
  }
};

const animate = () => {
  animationFrameId = 0;

  if (!shouldRunReviewsAnimation()) return;

  const tracks: Array<{ state: TrackState; inner: HTMLElement | null }> = [
    { state: track1State, inner: inner1.value },
    { state: track2State, inner: inner2.value }
  ];

  tracks.forEach(({ state, inner }) => {
    if (!inner) return;

    const halfWidth = inner.scrollWidth / 2;

    if (!state.isDragging && reviewsAnimationActive) {
      const targetVelocity = state.isHovered ? 0 : state.baseSpeed;
      state.currentVelocity += (targetVelocity - state.currentVelocity) * 0.04;
      state.x -= state.currentVelocity;
    }

    if (state.x <= -halfWidth) state.x += halfWidth;
    else if (state.x > 0) state.x -= halfWidth;

    inner.style.transform = `translate3d(${state.x}px, 0, 0)`;
  });

  animationFrameId = requestAnimationFrame(animate);
};

const startDrag = (event: MouseEvent | TouchEvent, trackNum: number) => {
  activeTrack = trackNum;

  const state = trackNum === 1 ? track1State : track2State;

  state.isDragging = true;
  state.startX = getX(event);

  document.body.style.cursor = 'grabbing';
  requestReviewsAnimation();
};

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (activeTrack === null) return;

  const state = activeTrack === 1 ? track1State : track2State;
  if (!state.isDragging) return;

  const currentX = getX(event);

  state.x += currentX - state.startX;
  state.startX = currentX;
};

const endDrag = () => {
  track1State.isDragging = false;
  track2State.isDragging = false;
  activeTrack = null;

  document.body.style.cursor = 'default';
  if (!reviewsAnimationActive) stopReviewsAnimation();
};

const setHover = (value: boolean, trackNum: number) => {
  const state = trackNum === 1 ? track1State : track2State;
  state.isHovered = value;
  requestReviewsAnimation();
};

const tiltCard = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement;
  const box = card.getBoundingClientRect();

  const x = event.clientX - box.left;
  const y = event.clientY - box.top;

  card.style.setProperty('--x', `${x}px`);
  card.style.setProperty('--y', `${y}px`);

  const centerX = box.width / 2;
  const centerY = box.height / 2;

  card.classList.add('tilting');
  card.style.setProperty('--rx', `${(centerY - y) / 15}deg`);
  card.style.setProperty('--ry', `${(x - centerX) / 20}deg`);
};

const resetTilt = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement;

  card.classList.remove('tilting');
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
};

onMounted(() => {
  updateTitleWidth();

  const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
  if (fonts?.ready) {
    fonts.ready.then(() => {
      // Fontlar değişince önceki ölçümler geçersiz — önbelleği boşalt.
      titleWidthCache.clear();
      updateTitleWidth();
    });
  }

  window.addEventListener('resize', updateTitleWidth);

  if (stageRef.value) {
    titleRotationTrigger = ScrollTrigger.create({
      trigger: stageRef.value,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) startTitleRotation();
        else stopTitleRotation();
      }
    });

    if (titleRotationTrigger.isActive) startTitleRotation();
  }

  track2State.x = -400;

  if (stageRef.value) {
    // IntersectionObserver, ScrollSmoother'ın transform tabanlı scroll'unda
    // TETİKLENMEZ (viewport gerçekten kaymadığı için) — ScrollTrigger şart.
    reviewsTrigger = ScrollTrigger.create({
      trigger: stageRef.value,
      start: 'top bottom+=260',
      end: 'bottom top-=260',
      onToggle: (self) => {
        reviewsAnimationActive = self.isActive;
        if (reviewsAnimationActive) requestReviewsAnimation();
        else if (!track1State.isDragging && !track2State.isDragging) stopReviewsAnimation();
      }
    });
    reviewsAnimationActive = reviewsTrigger.isActive;
    if (reviewsAnimationActive) requestReviewsAnimation();
  }

  window.addEventListener('mousemove', onDrag as EventListener);
  window.addEventListener('mouseup', endDrag);
  // passive:true — onDrag preventDefault ÇAĞIRMIYOR.
  window.addEventListener('touchmove', onDrag as EventListener, { passive: true });
  window.addEventListener('touchend', endDrag);
});

onBeforeUnmount(() => {
  stopTitleRotation();

  stopReviewsAnimation();
  reviewsTrigger?.kill();
  reviewsTrigger = null;
  titleRotationTrigger?.kill();
  titleRotationTrigger = null;

  window.removeEventListener('resize', updateTitleWidth);
  window.removeEventListener('mousemove', onDrag as EventListener);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchmove', onDrag as EventListener);
  window.removeEventListener('touchend', endDrag);
});

const reviewCardClass = [
  'review-card relative flex w-[clamp(340px,27vw,410px)] shrink-0 select-none flex-col justify-between',
  // Kart ZEMINDEN YUKSELEN yuzey: bg-surface-raised + border-surface-line.
  // Ikisi de tema-duyarli (bkz. tokens.css YUZEY SOZLESMESI), bu yuzden
  // main.css'te ayrica `.app-shell--night .review-card {...!important}`
  // yazmaya gerek yok — o kural kaldirildi.
  'gap-[clamp(1.35rem,1.8vw,1.75rem)] rounded-[14px] border border-surface-line bg-surface-raised',
  'px-[clamp(1.35rem,1.7vw,1.75rem)] py-[clamp(1.55rem,2vw,2rem)]',
  '[box-shadow:0_16px_44px_rgba(0,0,0,0.035)] [--scale:1] [transform-style:preserve-3d]',
  '[transform:perspective(1000px)_scale(var(--scale))_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]',
  '[transition:transform_var(--transition-smooth),box-shadow_var(--transition-smooth),border-color_var(--transition-smooth)]',
  'hover:z-10 hover:border-[var(--brand-700)] hover:[--scale:1.045]',
  'hover:[box-shadow:0_0_0_1px_rgba(251,249,245,0.9),0_0_32px_rgba(251,249,245,0.95),0_18px_38px_rgba(0,0,0,0.08)]',
  'max-[1024px]:w-[min(74vw,340px)] max-[1024px]:p-[1.45rem]',
  // rounded-xl projenin --radius-xl token'ina (20px) baglaniyor; orijinal
  // CSS'te mobil kart radius'u 12px idi. Birebir esitlik icin acik deger.
  'max-[640px]:min-h-[220px] max-[640px]:w-[min(72vw,280px)] max-[640px]:rounded-[12px] max-[640px]:p-5',
  'max-[640px]:hover:[--scale:1]'
].join(' ');

const quoteClass =
  'quote relative z-[2] m-0 font-body text-quote leading-[1.58] text-text max-[640px]:text-[0.96rem] max-[640px]:leading-[1.52]';
const authorClass =
  'author relative z-[2] flex items-center justify-between border-t border-t-surface-line pt-6 max-[640px]:pt-4';
const authorInfoClass = 'author-info flex flex-col gap-[0.3rem]';
const nameClass =
  'name font-mori text-name font-semibold text-text max-[640px]:text-[0.95rem]';
const ratingClass =
  'rating font-body text-rating tracking-[0.08em] text-[var(--brand-700)] max-[640px]:text-[1.02rem]';
</script>

<style scoped>
.review-card.tilting {
  transition:
    transform var(--transition-tilt),
    box-shadow var(--transition-smooth),
    border-color var(--transition-smooth);
}

.review-card::before {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  content: "";
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    800px circle at var(--x, 50%) var(--y, 50%),
    rgba(255, 255, 255, 0.22),
    transparent 42%
  );
  opacity: 0;
  transition: opacity var(--transition-smooth);
}

.review-card:hover::before {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .rotating-text-element {
    transform: none !important;
  }
}

@media (max-width: 760px) {
  .rotating-text-wrapper {
    height: clamp(39px, 10.8vw, 49px) !important;
  }
}
</style>
