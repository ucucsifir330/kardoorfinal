<template>
  <HomeCatalog />
  <section class="ada-team-section">
    <HomeManifesto>
      <template #after-manifesto>
        <HomeTeamCards />
      </template>
    </HomeManifesto>
  </section>
  <HomeReferences />
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

let manifestoGsapContext: ReturnType<typeof gsap.context> | null = null;
let manifestoCleanupTasks: Array<() => void> = [];

const premiumEase = 'power3.out';
const silkEase = 'sine.inOut';
const smoothScrollScrub = 3.2;

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
    const structuralPaths = Array.from(document.querySelectorAll<SVGPathElement>('.ada-structural-line-path'));
    const spacerLineHost = document.querySelector<HTMLElement>('.ada-manifesto-line-stage');

    const getStructuralPathLength = (path: SVGPathElement) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      return length;
    };

    if (spacerLineHost && structuralPaths.length) {
      let structuralFrame = 0;
      let structuralLengths = structuralPaths.map(getStructuralPathLength);
      let headingLineConnected = false;

      const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1);
      const getDocumentTop = (element: HTMLElement) => window.scrollY + element.getBoundingClientRect().top;

      const updateStructuralLines = () => {
        structuralFrame = 0;

        const viewportHeight = window.innerHeight || 1;
        const stageTop = getDocumentTop(spacerLineHost);
        const stageBottom = stageTop + spacerLineHost.getBoundingClientRect().height;
        const catalogTop = catalogSection ? getDocumentTop(catalogSection) : stageTop;
        const ranges = [
          {
            start: catalogTop - viewportHeight * 0.92,
            end: stageTop - viewportHeight * 0.36
          },
          {
            start: stageTop - viewportHeight * 0.82,
            end: stageBottom - viewportHeight * 0.48
          }
        ];

        structuralPaths.forEach((path, index) => {
          const range = ranges[index] || ranges[0];
          const length = structuralLengths[index] || getStructuralPathLength(path);
          const rawProgress = clampProgress((window.scrollY - range.start) / Math.max(range.end - range.start, 1));
          const progress = rawProgress;

          path.style.strokeDasharray = `${length}`;
          path.style.strokeDashoffset = `${length * (1 - progress)}`;

          if (index === 0) {
            if (rawProgress >= 0.965 && !headingLineConnected) {
              headingLineConnected = true;
              window.dispatchEvent(new CustomEvent('kardoor:heading-line-connected'));
            } else if (rawProgress < 0.82 && headingLineConnected) {
              headingLineConnected = false;
              window.dispatchEvent(new CustomEvent('kardoor:heading-line-reset'));
            }
          }
        });
      };

      const requestStructuralUpdate = () => {
        if (structuralFrame) return;
        structuralFrame = window.requestAnimationFrame(updateStructuralLines);
      };

      const refreshStructuralLines = () => {
        structuralLengths = structuralPaths.map(getStructuralPathLength);
        requestStructuralUpdate();
        ScrollTrigger.refresh();
      };

      updateStructuralLines();
      window.addEventListener('scroll', requestStructuralUpdate, { passive: true });
      window.addEventListener('resize', refreshStructuralLines, { passive: true });
      window.addEventListener('kardoor:structural-lines-updated', refreshStructuralLines);
      addManifestoCleanup(() => {
        if (structuralFrame) window.cancelAnimationFrame(structuralFrame);
        window.removeEventListener('scroll', requestStructuralUpdate);
        window.removeEventListener('resize', refreshStructuralLines);
        window.removeEventListener('kardoor:structural-lines-updated', refreshStructuralLines);
      });
    }

    if (catalogSection && manifestoContainer) {
      gsap.to(catalogSection, {
        '--catalog-line-progress': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: catalogSection,
          start: 'top 86%',
          end: 'bottom 38%',
          scrub: true,
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
          start: catalogSection ? 'bottom 94%' : 'top 82%',
          endTrigger: manifestoContainer,
          end: 'bottom 24%',
          scrub: smoothScrollScrub,
          invalidateOnRefresh: true
        }
      });
    }

    if (revealElement) {
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
          duration: 1.75,
          ease: 'power4.out',
          stagger: { amount: 0.72, from: 'center', ease: silkEase },
          scrollTrigger: {
            trigger: titleElement,
            start: 'top 92%',
            end: 'bottom 34%',
            scrub: 1.4
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

    if (window.matchMedia('(min-width: 1025px)').matches) {
      gsap.from('.ada-promo-card', {
        y: 34,
        opacity: 0,
        duration: 1.45,
        ease: premiumEase,
        scrollTrigger: {
          trigger: '.ada-promo-card',
          start: 'top 88%',
          once: true
        }
      });
    }
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
};

onMounted(() => {
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
});

onBeforeUnmount(() => {
  if (titleInterval) {
    clearInterval(titleInterval);
  }

  cancelAnimationFrame(animationFrameId);

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
});
</script>
