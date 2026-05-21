<template>
  <HomeCatalog
    :products="products"
    :is-catalog-scrolled="isCatalogScrolled"
    :visible-rows="visibleRows"
    :active-wishlist-key="activeWishlistKey"
    :active-product="activeProduct"
    :active-product-index="activeProductIndex"
    :set-main-ref="setMainRef"
    :set-row-ref="setRowRef"
    :catalog-before-enter="catalogBeforeEnter"
    :catalog-enter="catalogEnter"
    :open-product-modal="openProductModal"
    :handle-wishlist-click="handleWishlistClick"
    :close-product-modal="closeProductModal"
    :show-previous-product="showPreviousProduct"
    :show-next-product="showNextProduct"
    :toggle-like="toggleLike"
  />
  <section class="ada-team-section">
    <HomeManifesto />
    <HomeTeamCards />
  </section>
  <!-- HomeReferences is temporarily disabled while the team/reference split is cleaned up. -->
  <HomeReviews
    :dynamic-gap="dynamicGap"
    :title-width="titleWidth"
    :title-words="titleWords"
    :title-index="titleIndex"
    :row1="row1"
    :row2="row2"
    :set-static-text-ref="setStaticTextRef"
    :set-hidden-span-ref="setHiddenSpanRef"
    :set-inner1-ref="setInner1Ref"
    :set-inner2-ref="setInner2Ref"
    :start-drag="startDrag"
    :set-hover="setHover"
    :tilt-card="tiltCard"
    :reset-tilt="resetTilt"
  />
</template><script setup lang="ts">
// @ts-nocheck
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

interface ProductVariant {
  id: number;
  finish: string;
  code: string;
  image: string;
  liked: boolean;
}

const catalogDoorImages = {
  classicSand: '/images/doors/atelier-classic-sand.png',
  emeraldLine: '/images/doors/atelier-emerald.png',
  monoGraphite: '/images/doors/atelier-mono-graphite.png',
  ivoryLine: '/images/doors/atelier-ivory-line.png',
  graphiteOak: '/images/doors/atelier-graphite-oak.png',
  stone: '/images/doors/door-stone.svg',
  graphite: '/images/doors/door-graphite.svg',
  metal: '/images/doors/door-metal.svg'
} as const
const products = ref([] as ProductVariant[]);
const isCatalogScrolled = ref(false);
const mainRef = ref<HTMLElement | null>(null);
const visibleRows = ref([] as number[]);
const rowRefs = ref([] as HTMLElement[]);
const activeWishlistKey = ref<string | null>(null);
const activeProductIndex = ref<number | null>(null);
let catalogScrollTarget = 0;
let catalogScrollTween: gsap.core.Tween | null = null;
let catalogRowsFrame = 0;
let manifestoGsapContext: ReturnType<typeof gsap.context> | null = null;
let manifestoCleanupTasks: Array<() => void> = [];

const isMobileCatalogViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;

const setRowRef = (el: Element | ComponentPublicInstance | null) => {
  if (el && !rowRefs.value.includes(el)) {
    rowRefs.value.push(el);
  }
};

const mockData: ProductVariant[] = [
  { id: 1, finish: 'saten paslanmaz çelik', code: '2701d002inx00', image: catalogDoorImages.classicSand, liked: false },
  { id: 2, finish: 'saten siyah', code: '2701d002nmx00', image: catalogDoorImages.emeraldLine, liked: false },
  { id: 3, finish: 'PVD saten siyah', code: '2701d002izx00', image: catalogDoorImages.monoGraphite, liked: false },
  { id: 4, finish: 'bronz', code: '2701d002brx00', image: catalogDoorImages.ivoryLine, liked: false },
  { id: 5, finish: 'beyaz', code: '2701d002whx00', image: catalogDoorImages.graphiteOak, liked: false },
  { id: 6, finish: 'PVD saten altın', code: '2701d002gdx00', image: catalogDoorImages.classicSand, liked: false },
  { id: 7, finish: 'PVD açık bronz', code: '2701d002lbx00', image: catalogDoorImages.emeraldLine, liked: false },
  { id: 8, finish: 'PVD şampanya', code: '2701d002chx00', image: catalogDoorImages.monoGraphite, liked: false }
];

products.value = mockData;
visibleRows.value = [1];

const catalogBeforeEnter = (el: HTMLElement) => {
  el.style.opacity = '0';
  el.style.transform = 'translateX(-80px)';
};

const catalogEnter = (el: HTMLElement, done: () => void) => {
  const delay = parseInt(el.dataset.index || '0') * 120;

  setTimeout(() => {
    el.style.transition = 'opacity 0.7s ease-out, transform 0.7s ease-out';
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';

    setTimeout(done, 700);
  }, delay);
};

const revealCatalogRow = (rowIndex: number) => {
  if (rowIndex && !visibleRows.value.includes(rowIndex)) {
    visibleRows.value.push(rowIndex);
  }
};

const checkCatalogRows = () => {
  catalogRowsFrame = 0;
  const rootEl = mainRef.value as HTMLElement | null;

  if (!rootEl) return;

  const rootRect = rootEl.getBoundingClientRect();
  const revealLine = rootRect.top + rootRect.height * 0.84;

  rowRefs.value.forEach((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const rowIndex = parseInt(el.getAttribute('data-row-index') || '0');

    if (rect.top < revealLine && rect.bottom > rootRect.top) {
      revealCatalogRow(rowIndex);
    }
  });
};

const requestCatalogRowCheck = () => {
  if (catalogRowsFrame) return;
  catalogRowsFrame = requestAnimationFrame(checkCatalogRows);
};

const handleCatalogScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  isCatalogScrolled.value = target.scrollTop > 5;
  catalogScrollTarget = target.scrollTop;
  requestCatalogRowCheck();
};

const handleCatalogWheel = (event: WheelEvent) => {
  if (isMobileCatalogViewport()) return;

  const target = mainRef.value as HTMLElement | null;

  if (!target) return;

  const maxScrollTop = target.scrollHeight - target.clientHeight;
  const deltaMultiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? target.clientHeight : 1;
  const deltaY = event.deltaY * deltaMultiplier;
  const currentScrollTop = target.scrollTop;
  const boundaryThreshold = 42;

  if (maxScrollTop <= 0 || deltaY === 0) {
    return;
  }

  const isAtTop = currentScrollTop <= boundaryThreshold;
  const isAtBottom = maxScrollTop - currentScrollTop <= boundaryThreshold;
  const shouldPassToPage = (deltaY < 0 && isAtTop) || (deltaY > 0 && isAtBottom);

  if (shouldPassToPage) {
    event.preventDefault();
    const boundaryScrollTop = deltaY < 0 ? 0 : maxScrollTop;
    target.scrollTop = boundaryScrollTop;
    catalogScrollTarget = boundaryScrollTop;
    window.scrollBy({
      top: deltaY,
      left: 0,
      behavior: 'auto'
    });
    requestCatalogRowCheck();
    return;
  }

  const nextScrollTop = currentScrollTop + deltaY;
  const clampedScrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
  const leftoverDelta = nextScrollTop - clampedScrollTop;

  event.preventDefault();
  catalogScrollTween?.kill();

  if (clampedScrollTop !== currentScrollTop) {
    target.scrollTop = clampedScrollTop;
    catalogScrollTarget = clampedScrollTop;
    requestCatalogRowCheck();
  }

  if (leftoverDelta !== 0) {
    window.scrollBy({
      top: leftoverDelta,
      left: 0,
      behavior: 'auto'
    });
  }
};

const toggleLike = (index: number) => {
  products.value[index].liked = !products.value[index].liked;
};

const handleWishlistClick = (index: number, key: string) => {
  if (isMobileCatalogViewport()) {
    toggleLike(index);
    activeWishlistKey.value = null;
    return;
  }

  const willOpen = activeWishlistKey.value !== key;
  toggleLike(index);
  activeWishlistKey.value = willOpen ? key : null;
};

const activeProduct = computed(() => {
  if (activeProductIndex.value === null) return null;
  return products.value[activeProductIndex.value] || null;
});

const openProductModal = (index: number) => {
  activeProductIndex.value = index;
  activeWishlistKey.value = null;

  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
};

const closeProductModal = () => {
  activeProductIndex.value = null;

  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
};

const showPreviousProduct = () => {
  if (!products.value.length || activeProductIndex.value === null) return;
  activeProductIndex.value = (activeProductIndex.value - 1 + products.value.length) % products.value.length;
};

const showNextProduct = () => {
  if (!products.value.length || activeProductIndex.value === null) return;
  activeProductIndex.value = (activeProductIndex.value + 1) % products.value.length;
};

const handleProductModalKeydown = (event: KeyboardEvent) => {
  if (activeProductIndex.value === null) return;

  if (event.key === 'Escape') {
    closeProductModal();
  } else if (event.key === 'ArrowLeft') {
    showPreviousProduct();
  } else if (event.key === 'ArrowRight') {
    showNextProduct();
  }
};

const initialTitleWidth =
  typeof window !== 'undefined'
    ? Math.max(180, Math.min(320, window.innerWidth * 0.18))
    : 220;

const titleWords = ref(['sözü', 'kararı', 'yorumu']);
const titleIndex = ref(0);
const titleWidth = ref(initialTitleWidth);
const hiddenSpan = ref<HTMLElement | null>(null);
const staticText = ref<HTMLElement | null>(null);
const baseTitleWidth = ref(0);

const inner1 = ref<HTMLElement | null>(null);
const inner2 = ref<HTMLElement | null>(null);

const setMainRef = (el: Element | ComponentPublicInstance | null) => {
  mainRef.value = el as HTMLElement | null;
};

const setHiddenSpanRef = (el: Element | ComponentPublicInstance | null) => {
  hiddenSpan.value = el as HTMLElement | null;
};

const setStaticTextRef = (el: Element | ComponentPublicInstance | null) => {
  staticText.value = el as HTMLElement | null;
};

const setInner1Ref = (el: Element | ComponentPublicInstance | null) => {
  inner1.value = el as HTMLElement | null;
};

const setInner2Ref = (el: Element | ComponentPublicInstance | null) => {
  inner2.value = el as HTMLElement | null;
};

const googleReviews = ref([
  {
    id: 1,
    text: 'Kardoor Çelik kapı ailesi sorunumu özenle dinledi ve çözdü. Güven bey ve montaj ekibi arkadaşlara teşekkür ediyorum. Titizlikle ilgilendiler.',
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
] as Review[]);

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
let titleInterval: ReturnType<typeof setInterval> | null = null;
let catalogObserver: IntersectionObserver | null = null;

const updateTitleWidth = () => {
  const hiddenSpanEl = hiddenSpan.value as HTMLElement | null;
  const staticTextEl = staticText.value as HTMLElement | null;

  if (!hiddenSpanEl) return;

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

const animate = () => {
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

    if (!state.isDragging) {
      const targetVelocity = state.isHovered ? 0 : state.baseSpeed;
      state.currentVelocity += (targetVelocity - state.currentVelocity) * 0.04;
      state.x -= state.currentVelocity;
    }

    if (state.x <= -halfWidth) {
      state.x += halfWidth;
    } else if (state.x > 0) {
      state.x -= halfWidth;
    }

    inner.style.transform = `translateX(${state.x}px)`;
  });

  animationFrameId = requestAnimationFrame(animate);
};

const startDrag = (event: MouseEvent | TouchEvent, trackNum: number) => {
  activeTrack = trackNum;

  const state = trackNum === 1 ? track1State : track2State;

  state.isDragging = true;
  state.startX = getX(event);

  document.body.style.cursor = 'grabbing';
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
};

const setHover = (value: boolean, trackNum: number) => {
  const state = trackNum === 1 ? track1State : track2State;
  state.isHovered = value;
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

const initCatalogObserver = () => {
  const rootEl = mainRef.value as HTMLElement | null;

  if (!rootEl) return;

  if (catalogObserver) {
    catalogObserver.disconnect();
  }

  catalogObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        const rowIndex = parseInt(entry.target.getAttribute('data-row-index') || '0');

        revealCatalogRow(rowIndex);

        catalogObserver?.unobserve(entry.target);
      }
    });
  }, {
    root: rootEl,
    rootMargin: '0px 0px 42% 0px',
    threshold: 0.01
  });

  rowRefs.value.forEach((el: HTMLElement) => {
    catalogObserver?.observe(el);
  });

  requestCatalogRowCheck();
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

  gsap.registerPlugin(ScrollTrigger);

  manifestoGsapContext = gsap.context(() => {
    const scrollLineFill = document.querySelector<HTMLElement>('.ada-scroll-line-fill');
    const manifestoContainer = document.querySelector<HTMLElement>('.ada-manifesto-container');
    const catalogSection = document.querySelector<HTMLElement>('.catalog-section');
    const revealElement = document.querySelector<HTMLElement>('#manifesto-text');
    const titleElement = document.querySelector<HTMLElement>('.ada-giant-title');
    const titleContainer = document.querySelector<HTMLElement>('.ada-title-container');
    const loopTrack = document.querySelector<HTMLElement>('.ada-loop-track');
    const loopContainer = document.querySelector<HTMLElement>('.ada-subtitle-container');
    const loopTrackReverse = document.querySelector<HTMLElement>('.ada-loop-track-reverse');
    const loopContainerReverse = document.querySelector<HTMLElement>('.ada-subtitle-container-reverse');

    if (catalogSection && manifestoContainer) {
      gsap.to(catalogSection, {
        '--catalog-line-progress': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: catalogSection,
          start: 'top 72%',
          end: 'bottom 58%',
          scrub: 2,
          invalidateOnRefresh: true
        }
      });
    }

    if (scrollLineFill && manifestoContainer) {
      gsap.set(scrollLineFill, { scaleY: 0 });
      gsap.to(scrollLineFill, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: catalogSection || manifestoContainer,
          start: catalogSection ? 'bottom bottom' : 'top 72%',
          endTrigger: manifestoContainer,
          end: 'bottom 42%',
          scrub: 2,
          invalidateOnRefresh: true
        }
      });
    }

    if (revealElement) {
      splitTextToRevealChars(revealElement);
      gsap.to(revealElement.querySelectorAll('.reveal-char'), {
        opacity: 1,
        stagger: 0.02,
        ease: 'none',
        scrollTrigger: {
          trigger: revealElement,
          start: 'top 85%',
          end: 'bottom 50%',
          scrub: 2
        }
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
          duration: 1.28,
          ease: 'expo.out',
          stagger: { amount: 0.44, from: 'center', ease: 'power2.out' },
          scrollTrigger: {
            trigger: titleElement,
            start: 'top 88%',
            end: 'bottom 56%',
            toggleActions: 'play none none reverse'
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
          duration: 1.35,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: loopContainer,
            start: 'top 88%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      const pauseTicker = () => gsap.to(tickerTween, { timeScale: 0, duration: 1.2, ease: 'power2.out' });
      const playTicker = () => gsap.to(tickerTween, { timeScale: 1, duration: 1.2, ease: 'power2.inOut' });

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
          duration: 1.35,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: loopContainerReverse,
            start: 'top 88%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      const pauseTickerReverse = () => gsap.to(tickerTweenReverse, { timeScale: 0, duration: 1.2, ease: 'power2.out' });
      const playTickerReverse = () => gsap.to(tickerTweenReverse, { timeScale: 1, duration: 1.2, ease: 'power2.inOut' });

      loopContainerReverse.addEventListener('mouseenter', pauseTickerReverse);
      loopContainerReverse.addEventListener('mouseleave', playTickerReverse);
      addManifestoCleanup(() => loopContainerReverse.removeEventListener('mouseenter', pauseTickerReverse));
      addManifestoCleanup(() => loopContainerReverse.removeEventListener('mouseleave', playTickerReverse));
    }

    if (window.matchMedia('(min-width: 1025px)').matches) {
      gsap.from('.ada-card', {
        y: 44,
        opacity: 0,
        stagger: 0.14,
        duration: 1.15,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.ada-founders-grid',
          start: 'top 88%',
          once: true
        }
      });
    }
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
};

onMounted(() => {
  products.value = mockData;
  visibleRows.value = [1];

  nextTick(() => {
    const catalogMainEl = mainRef.value as HTMLElement | null;
    if (catalogMainEl) {
      catalogMainEl.scrollTop = 0;
      catalogScrollTarget = 0;
      isCatalogScrolled.value = false;
    }

    requestAnimationFrame(() => {
      initCatalogObserver();
    });
  });

  updateTitleWidth();

  nextTick(() => {
    updateTitleWidth();
    requestAnimationFrame(updateTitleWidth);

    const fonts = (document as any).fonts;

    if (fonts?.ready) {
      fonts.ready.then(() => {
        updateTitleWidth();
        ScrollTrigger.refresh();
      });
    }

    initManifestoAnimations();
  });

  window.addEventListener('resize', updateTitleWidth);

  titleInterval = setInterval(() => {
    titleIndex.value = (titleIndex.value + 1) % titleWords.value.length;

    nextTick(() => {
      updateTitleWidth();
    });
  }, 7000);

  track2State.x = -400;
  animate();

  window.addEventListener('mousemove', onDrag as EventListener);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchmove', onDrag as EventListener, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('keydown', handleProductModalKeydown);
});

onBeforeUnmount(() => {
  if (titleInterval) {
    clearInterval(titleInterval);
  }

  cancelAnimationFrame(animationFrameId);
  if (catalogRowsFrame) {
    cancelAnimationFrame(catalogRowsFrame);
    catalogRowsFrame = 0;
  }

  if (catalogObserver) {
    catalogObserver.disconnect();
  }

  if (manifestoGsapContext) {
    manifestoGsapContext.revert();
    manifestoGsapContext = null;
  }

  manifestoCleanupTasks.forEach((task) => task());
  manifestoCleanupTasks = [];

  window.removeEventListener('resize', updateTitleWidth);
  window.removeEventListener('mousemove', onDrag as EventListener);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchmove', onDrag as EventListener);
  window.removeEventListener('touchend', endDrag);
  window.removeEventListener('keydown', handleProductModalKeydown);
  document.body.style.overflow = '';
});
</script>

