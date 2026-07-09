<template>
  <EntranceDoorLab />
  <section ref="catalogStackRef" class="home-catalog-reference-stack">
    <div ref="catalogHandoffRef" class="home-catalog-reference-stack__catalog">
      <div ref="catalogHandoffPinRef" class="home-catalog-reference-stack__catalog-pin">
        <div ref="catalogHandoffFrameRef" class="home-catalog-reference-stack__catalog-frame">
          <HomeCatalog />
        </div>
      </div>
    </div>

    <div class="home-catalog-reference-stack__references">
      <section class="ada-team-section">
        <HomeReferences />
        <HomeManifesto :key="locale" />
      </section>
    </div>
  </section>
  <div ref="reviewsStageRef" class="home-reviews-runtime">
    <HomeReviews
      :key="locale"
      :static-label="reviewCopy.staticLabel"
      :bottom-label="reviewCopy.bottomLabel"
      :dynamic-gap="dynamicGap"
      :title-width="titleWidth"
      :row1="row1"
      :row2="row2"
      :set-static-text-ref="setStaticTextRef"
      :set-hidden-span-ref="setHiddenSpanRef"
      :set-typewriter-ref="setTypewriterRef"
      :set-inner1-ref="setInner1Ref"
      :set-inner2-ref="setInner2Ref"
      :start-drag="startDrag"
      :set-hover="setHover"
      :tilt-card="tiltCard"
      :reset-tilt="resetTilt"
    />
  </div>
</template><script setup lang="ts">
// @ts-nocheck
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useKardoorLocale } from '~/composables/useKardoorLocale'

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

let manifestoGsapContext: ReturnType<typeof gsap.context> | null = null;
let manifestoCleanupTasks: Array<() => void> = [];

const premiumEase = 'power3.out';
const silkEase = 'sine.inOut';
const smoothScrollScrub = 3.2;

const initialTitleWidth =
  typeof window !== 'undefined'
    ? Math.max(180, Math.min(320, window.innerWidth * 0.18))
    : 220;

const { locale } = useKardoorLocale();

const reviewCopies: Record<string, { staticLabel: string; bottomLabel: string; titleWords: string[]; reviews: Review[] }> = {
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
        text: "We discovered Kardoor while searching for an exterior-grade door in Izmir. Mr. Güven guided us beautifully; the insulation and material quality are outstanding.",
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
        text: 'Fast, clear, and highly professional. They delivered the steel-door solution we needed with excellent value and performance.',
        name: 'Serkan A.'
      }
    ]
  }
};

const reviewCopy = computed(() => reviewCopies[locale.value] ?? reviewCopies.tr);
const titleWords = computed(() => reviewCopy.value.titleWords);
const titleIndex = ref(0);
const titleWidth = ref(initialTitleWidth);
const hiddenSpan = ref<HTMLElement | null>(null);
const staticText = ref<HTMLElement | null>(null);
const baseTitleWidth = ref(0);

const inner1 = ref<HTMLElement | null>(null);
const inner2 = ref<HTMLElement | null>(null);
const reviewsStageRef = ref<HTMLElement | null>(null);
const catalogStackRef = ref<HTMLElement | null>(null);
const catalogHandoffRef = ref<HTMLElement | null>(null);
const catalogHandoffPinRef = ref<HTMLElement | null>(null);
const catalogHandoffFrameRef = ref<HTMLElement | null>(null);

let catalogHandoffObserver: ResizeObserver | null = null;
let catalogHandoffFrame = 0;
let catalogHandoffPinFrame = 0;
let catalogHandoffTrigger: ScrollTrigger | null = null;
let catalogCurtainTween: gsap.core.Tween | null = null;

const setHiddenSpanRef = (el: Element | ComponentPublicInstance | null) => {
  hiddenSpan.value = el as HTMLElement | null;
};

const setStaticTextRef = (el: Element | ComponentPublicInstance | null) => {
  staticText.value = el as HTMLElement | null;
};

const typewriter = ref<HTMLElement | null>(null);

const setTypewriterRef = (el: Element | ComponentPublicInstance | null) => {
  typewriter.value = el as HTMLElement | null;
};

const setInner1Ref = (el: Element | ComponentPublicInstance | null) => {
  inner1.value = el as HTMLElement | null;
};

const setInner2Ref = (el: Element | ComponentPublicInstance | null) => {
  inner2.value = el as HTMLElement | null;
};

const googleReviews = computed<Review[]>(() => reviewCopy.value.reviews);

const updateCatalogHandoffHeight = () => {
  catalogHandoffFrame = 0;

  const hold = catalogHandoffRef.value;
  const frame = catalogHandoffFrameRef.value;

  if (!hold || !frame) return;

  const frameHeight = frame.scrollHeight;
  hold.style.setProperty('--catalog-handoff-height', `${frameHeight}px`);
};

const requestCatalogHandoffHeight = () => {
  if (catalogHandoffFrame) return;

  catalogHandoffFrame = window.requestAnimationFrame(updateCatalogHandoffHeight);
};

// Manuel pin (updateCatalogHandoffPin / requestCatalogHandoffPin) KALDIRILDI →
// artık GSAP native pin'i kullanılıyor (aşağıdaki onMounted ScrollTrigger.create).
// Eskisi her scroll frame'inde getBoundingClientRect+transform yapıyordu (FPS katili).
const requestCatalogHandoffPin = () => {};

const row1 = computed(() => googleReviews.value.slice(0, 4));
const row2 = computed(() => googleReviews.value.slice(4, 8));

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
let reviewsObserver: IntersectionObserver | null = null;
let reviewsAnimationActive = false;
let typewriterTl: gsap.core.Timeline | null = null;
let cursorTween: gsap.core.Tween | null = null;
let activeTitleWord = titleWords.value[0] ?? '';

// Measure the pill width for `activeTitleWord` via the hidden span and animate
// the static "Son" word a touch to keep the composition balanced. The pill width
// is set to the full word up-front so the centered typewriter has room and the
// caret never clips while characters stream in.
const updateTitleWidth = () => {
  const hiddenSpanEl = hiddenSpan.value as HTMLElement | null;
  const staticTextEl = staticText.value as HTMLElement | null;

  if (!hiddenSpanEl) return;

  hiddenSpanEl.textContent = activeTitleWord;
  const measuredWidth = hiddenSpanEl.getBoundingClientRect().width;
  titleWidth.value = measuredWidth;

  if (!baseTitleWidth.value) {
    baseTitleWidth.value = measuredWidth;
  }

  if (staticTextEl) {
    const offset = (measuredWidth - baseTitleWidth.value) * 0.18;
    staticTextEl.style.transform = `translateX(${offset}px)`;
  }
};

// Feel knobs (seconds). Tuned live with the user — keep these readable.
const TYPE_PER_CHAR = 0.14;
const ERASE_PER_CHAR = 0.07;
const WORD_HOLD = 1.5;

// One GSAP timeline drives the whole "sözü → kararı → yorumu" cycle:
// type the word in (TextPlugin), hold, erase it, advance to the next. The pill
// width is re-measured per word BEFORE typing so the centered word + caret sit
// in a correctly sized pill. The caret blink is a separate stepped tween.
const buildTypewriter = () => {
  const el = typewriter.value as HTMLElement | null;
  if (!el) return;

  typewriterTl?.kill();
  el.textContent = '';

  const cursorEl = el.parentElement?.querySelector(
    '.typewriter-cursor'
  ) as HTMLElement | null;
  if (cursorEl) {
    cursorTween?.kill();
    cursorTween = gsap.to(cursorEl, {
      opacity: 0,
      duration: 0.5,
      ease: 'steps(1)',
      repeat: -1,
      yoyo: true
    });
  }

  const words = titleWords.value;
  typewriterTl = gsap.timeline({ repeat: -1 });

  words.forEach((word) => {
    typewriterTl!
      .call(() => {
        activeTitleWord = word;
        updateTitleWidth();
      })
      .to(el, {
        duration: Math.max(0.4, word.length * TYPE_PER_CHAR),
        text: { value: word, delimiter: '' },
        ease: 'none'
      })
      .to(
        el,
        {
          duration: Math.max(0.3, word.length * ERASE_PER_CHAR),
          text: { value: '', delimiter: '' },
          ease: 'none'
        },
        `+=${WORD_HOLD}`
      );
  });
};

watch(
  locale,
  async () => {
    activeTitleWord = titleWords.value[0] ?? '';
    titleIndex.value = 0;
    typewriterTl?.kill();
    typewriterTl = null;
    cursorTween?.kill();
    cursorTween = null;

    if (typewriter.value) {
      typewriter.value.textContent = '';
    }

    await nextTick();
    updateTitleWidth();
    buildTypewriter();
  },
  { flush: 'post' }
);

const dynamicGap = computed(() => {
  const gapValue = 34 + titleWidth.value * 0.04;
  return `${Math.max(38, Math.min(58, gapValue))}px`;
});

const getX = (event: MouseEvent | TouchEvent): number => {
  if ('touches' in event && event.touches.length > 0) {
    return event.touches[0].pageX;
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
    {
      state: track1State,
      inner: inner1.value as HTMLElement | null
    },
    {
      state: track2State,
      inner: inner2.value as HTMLElement | null
    }
  ];

  tracks.forEach(({ state, inner }: { state: TrackState; inner: HTMLElement | null }) => {
    if (!inner) return;

    const halfWidth = inner.scrollWidth / 2;

    if (!state.isDragging && reviewsAnimationActive) {
      const targetVelocity = state.isHovered ? 0 : state.baseSpeed;
      state.currentVelocity += (targetVelocity - state.currentVelocity) * 0.04;
      state.x -= state.currentVelocity;
    }

    if (state.x <= -halfWidth) {
      state.x += halfWidth;
    } else if (state.x > 0) {
      state.x -= halfWidth;
    }

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

  const rotateX = (centerY - y) / 15;
  const rotateY = (x - centerX) / 20;

  card.classList.add('tilting');
  card.style.setProperty('--rx', `${rotateX}deg`);
  card.style.setProperty('--ry', `${rotateY}deg`);
};

const resetTilt = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement;

  card.classList.remove('tilting');
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
};

const addManifestoCleanup = (task: () => void) => {
  manifestoCleanupTasks.push(task);
};

const splitTextToRevealChars = (element: HTMLElement) => {
  const text = element.textContent?.trim().replace(/\s+/g, ' ') || '';

  if (!text || element.dataset.revealReady === 'true') return;

  element.innerHTML = '';
  element.dataset.revealReady = 'true';

  text.split(' ').forEach((word, index, words) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'reveal-word';

    if (word.includes('Ege') || word.includes('Kardoor')) {
      wordSpan.classList.add('brand-gradient-word');
    }

    Array.from(word).forEach((char) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'reveal-char';
      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
    });

    element.appendChild(wordSpan);

    if (index < words.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });
};

const splitTitleToFloatingChars = (element: HTMLElement) => {
  const text = (element.textContent || 'Yönetim Kadrosu').trim().replace(/\s+/g, ' ');

  if (!text || element.dataset.floatReady === 'true') return;

  element.innerHTML = '';
  element.dataset.floatReady = 'true';

  text.split(' ').forEach((word, wordIndex, words) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'ada-title-float-word';

    Array.from(word).forEach((char, charIndex) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'ada-title-float-char';

      if (wordIndex === 0 && charIndex === 0) {
        charSpan.classList.add('ada-first-letter');
      }

      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
    });

    element.appendChild(wordSpan);

    if (wordIndex < words.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });
};

const initManifestoAnimations = () => {
  if (manifestoGsapContext) {
    manifestoGsapContext.revert();
    manifestoGsapContext = null;
  }

  manifestoCleanupTasks.forEach((task) => task());
  manifestoCleanupTasks = [];

  manifestoGsapContext = gsap.context(() => {
    const revealElement = document.querySelector<HTMLElement>('#manifesto-text');
    const titleElement = document.querySelector<HTMLElement>('.ada-giant-title');
    const titleContainer = document.querySelector<HTMLElement>('.ada-title-container');
    const loopTrack = document.querySelector<HTMLElement>('.ada-loop-track');
    const loopContainer = document.querySelector<HTMLElement>('.ada-subtitle-container');
    const loopTrackReverse = document.querySelector<HTMLElement>('.ada-loop-track-reverse');
    const loopContainerReverse = document.querySelector<HTMLElement>('.ada-subtitle-container-reverse');

    if (revealElement && revealElement.dataset.gsapQuote !== 'true') {
      splitTextToRevealChars(revealElement);
      const chars = Array.from(revealElement.querySelectorAll<HTMLElement>('.reveal-char'));
      let revealFrame = 0;

      const updateManifestoReveal = (progress: number) => {
        const staggerWindow = 0.68;
        const activeWindow = 1 - staggerWindow;
        const maxIndex = Math.max(chars.length - 1, 1);

        chars.forEach((char, index) => {
          const start = (index / maxIndex) * staggerWindow;
          const localProgress = Math.min(Math.max((progress - start) / activeWindow, 0), 1);
          const easedProgress = gsap.parseEase(silkEase)(localProgress);

          char.style.opacity = String(0.12 + easedProgress * 0.88);
          char.style.filter = 'none';
          char.style.transform = 'none';
        });
      };

      const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1);

      const updateManifestoRevealFromScroll = () => {
        revealFrame = 0;
        const viewportHeight = window.innerHeight || 1;
        const rect = revealElement.getBoundingClientRect();
        const top = window.scrollY + rect.top;
        const bottom = top + rect.height;
        const start = top - viewportHeight * 0.94;
        const end = bottom - viewportHeight * 0.18;
        const progress = gsap.parseEase(silkEase)(
          clampProgress((window.scrollY - start) / Math.max(end - start, 1))
        );

        updateManifestoReveal(progress);
      };

      const requestManifestoRevealUpdate = () => {
        if (revealFrame) return;
        revealFrame = window.requestAnimationFrame(updateManifestoRevealFromScroll);
      };

      updateManifestoRevealFromScroll();
      window.addEventListener('scroll', requestManifestoRevealUpdate, { passive: true });
      window.addEventListener('resize', requestManifestoRevealUpdate, { passive: true });
      addManifestoCleanup(() => {
        if (revealFrame) window.cancelAnimationFrame(revealFrame);
        window.removeEventListener('scroll', requestManifestoRevealUpdate);
        window.removeEventListener('resize', requestManifestoRevealUpdate);
      });
    }

    if (titleContainer) {
      titleContainer.style.setProperty('overflow', 'visible', 'important');
    }

    if (titleElement) {
      titleElement.style.setProperty('overflow', 'visible', 'important');
      splitTitleToFloatingChars(titleElement);

      gsap.fromTo(
        titleElement.querySelectorAll('.ada-title-float-char'),
        {
          yPercent: 115,
          rotateX: -72,
          opacity: 0,
          scale: 0.96,
          filter: 'blur(10px)'
        },
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.05,
          ease: 'power4.out',
          stagger: { amount: 0.38, from: 'center', ease: silkEase },
          scrollTrigger: {
            trigger: titleElement,
            start: 'top 92%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    }

    if (loopTrack && loopContainer) {
      const tickerTween = gsap.to(loopTrack, {
        xPercent: -50,
        duration: 160,
        ease: 'none',
        repeat: -1
      });

      gsap.fromTo(
        loopContainer,
        { opacity: 0, y: 70 },
        {
          opacity: 1,
          y: 0,
          duration: 1.75,
          ease: premiumEase,
          scrollTrigger: {
            trigger: loopContainer,
            start: 'top 92%',
            end: 'bottom 34%',
            scrub: 1.35
          }
        }
      );

      const pauseTicker = () => gsap.to(tickerTween, { timeScale: 0, duration: 1.6, ease: premiumEase });
      const playTicker = () => gsap.to(tickerTween, { timeScale: 1, duration: 1.8, ease: silkEase });

      loopContainer.addEventListener('mouseenter', pauseTicker);
      loopContainer.addEventListener('mouseleave', playTicker);
      addManifestoCleanup(() => loopContainer.removeEventListener('mouseenter', pauseTicker));
      addManifestoCleanup(() => loopContainer.removeEventListener('mouseleave', playTicker));
    }

    if (loopTrackReverse && loopContainerReverse) {
      const tickerTweenReverse = gsap.fromTo(
        loopTrackReverse,
        { xPercent: -50 },
        {
          xPercent: 0,
          duration: 160,
          ease: 'none',
          repeat: -1
        }
      );

      gsap.fromTo(
        loopContainerReverse,
        { opacity: 0, y: 70 },
        {
          opacity: 1,
          y: 0,
          duration: 1.75,
          ease: premiumEase,
          scrollTrigger: {
            trigger: loopContainerReverse,
            start: 'top 92%',
            end: 'bottom 34%',
            scrub: 1.35
          }
        }
      );

      const pauseTickerReverse = () => gsap.to(tickerTweenReverse, { timeScale: 0, duration: 1.6, ease: premiumEase });
      const playTickerReverse = () => gsap.to(tickerTweenReverse, { timeScale: 1, duration: 1.8, ease: silkEase });

      loopContainerReverse.addEventListener('mouseenter', pauseTickerReverse);
      loopContainerReverse.addEventListener('mouseleave', playTickerReverse);
      addManifestoCleanup(() => loopContainerReverse.removeEventListener('mouseenter', pauseTickerReverse));
      addManifestoCleanup(() => loopContainerReverse.removeEventListener('mouseleave', playTickerReverse));
    }

  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
};

onMounted(() => {
  updateTitleWidth();

  nextTick(() => {
    updateTitleWidth();
    requestCatalogHandoffHeight();
    requestAnimationFrame(updateTitleWidth);
    requestAnimationFrame(requestCatalogHandoffHeight);
    requestAnimationFrame(requestCatalogHandoffPin);

    if (catalogHandoffFrameRef.value) {
      catalogHandoffObserver = new ResizeObserver(requestCatalogHandoffHeight);
      catalogHandoffObserver.observe(catalogHandoffFrameRef.value);
    }

    // Katalog handoff pin'i artık GSAP'in NATIVE pin'i ile yapılıyor.
    // Eskiden onUpdate her scroll frame'inde getBoundingClientRect okuyup
    // translate3d yazıyordu (manuel pin emülasyonu) → sürekli layout reflow,
    // FPS düşüşünün ana kaynaklarından. ScrollTrigger pin'i ScrollSmoother ile
    // uyumlu çalışır ve transform'u kendi yönetir; scroll'da bizim JS'imiz hiç
    // çalışmaz. frame viewport'tan kısa olduğu için onu alt kenara yapıştırıyoruz:
    // pin başlangıcı "frame altı viewport altına değince", bitişi "hold'un sonu".
    // Masaüstü (>760) dışında pin yok.
    if (catalogHandoffFrameRef.value && window.innerWidth > 760) {
      catalogHandoffTrigger = ScrollTrigger.create({
        trigger: catalogHandoffFrameRef.value,
        // frame'in altı viewport altına değince yapış (sticky bottom eşdeğeri)
        start: () => `bottom bottom`,
        // hold'un (catalog) altı, viewport altına gelince bırak
        endTrigger: catalogHandoffRef.value,
        end: 'bottom bottom',
        pin: catalogHandoffPinRef.value,
        pinSpacing: false,
        invalidateOnRefresh: true
      });
    }

    const fonts = (document as any).fonts;

    if (fonts?.ready) {
      fonts.ready.then(() => {
        updateTitleWidth();
        requestCatalogHandoffHeight();
        requestCatalogHandoffPin();
        ScrollTrigger.refresh();
      });
    }

    initManifestoAnimations();

    // PERDE (parallax): katalog stack scroll'dan daha hızlı yukarı gelir →
    // "Kurgulayın" panelinin/CTA'ların üzerine biner. --catalog-curtain-y 0'dan
    // -extra'ya scrub edilir; katalog ekranın altından üst-orta bölgeye girerken
    // ekstra yukarı tırmanır. catalogHandoff PIN'i transform'a değil pin div'ine
    // dokunduğu için çakışmaz (ayrı katman). Sadece masaüstü.
    if (catalogStackRef.value && window.innerWidth > 760) {
      const extra =
        parseFloat(
          getComputedStyle(catalogStackRef.value).getPropertyValue('--catalog-curtain-extra')
        ) || 240;

      catalogCurtainTween = gsap.fromTo(
        catalogStackRef.value,
        { '--catalog-curtain-y': '0px' },
        {
          '--catalog-curtain-y': `${-extra}px`,
          ease: 'none',
          scrollTrigger: {
            trigger: catalogStackRef.value,
            start: 'top bottom',
            end: 'top center',
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    }
  });

  window.addEventListener('resize', updateTitleWidth);
  window.addEventListener('resize', requestCatalogHandoffHeight);
  window.addEventListener('resize', requestCatalogHandoffPin);

  buildTypewriter();

  track2State.x = -400;

  if (reviewsStageRef.value) {
    reviewsObserver = new IntersectionObserver(
      (entries) => {
        reviewsAnimationActive = entries.some((entry) => entry.isIntersecting);
        if (reviewsAnimationActive) requestReviewsAnimation();
        else if (!track1State.isDragging && !track2State.isDragging) stopReviewsAnimation();
      },
      { rootMargin: '260px 0px', threshold: 0.01 }
    );
    reviewsObserver.observe(reviewsStageRef.value);
  }

  window.addEventListener('mousemove', onDrag as EventListener);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchmove', onDrag as EventListener, { passive: false });
  window.addEventListener('touchend', endDrag);
});

onBeforeUnmount(() => {
  typewriterTl?.kill();
  typewriterTl = null;
  cursorTween?.kill();
  cursorTween = null;

  stopReviewsAnimation();
  reviewsObserver?.disconnect();
  reviewsObserver = null;
  catalogHandoffObserver?.disconnect();
  catalogHandoffObserver = null;

  catalogHandoffTrigger?.kill();
  catalogHandoffTrigger = null;

  catalogCurtainTween?.scrollTrigger?.kill();
  catalogCurtainTween?.kill();
  catalogCurtainTween = null;

  if (catalogHandoffFrame) {
    cancelAnimationFrame(catalogHandoffFrame);
    catalogHandoffFrame = 0;
  }

  if (catalogHandoffPinFrame) {
    cancelAnimationFrame(catalogHandoffPinFrame);
    catalogHandoffPinFrame = 0;
  }

  if (catalogHandoffPinRef.value) {
    catalogHandoffPinRef.value.style.transform = '';
  }

  if (manifestoGsapContext) {
    manifestoGsapContext.revert();
    manifestoGsapContext = null;
  }

  manifestoCleanupTasks.forEach((task) => task());
  manifestoCleanupTasks = [];

  window.removeEventListener('resize', updateTitleWidth);
  window.removeEventListener('resize', requestCatalogHandoffHeight);
  window.removeEventListener('resize', requestCatalogHandoffPin);
  window.removeEventListener('mousemove', onDrag as EventListener);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchmove', onDrag as EventListener);
  window.removeEventListener('touchend', endDrag);
});
</script>

<style scoped>
.home-reviews-runtime {
  display: block;
  width: 100%;
}
</style>
