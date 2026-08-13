<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

type TimelineItem = {
  year: number;
  subtitle: string;
  title: string;
  image: string;
};

type Smoother = {
  scrollTop?: () => number;
  scrollTo?: (target: number | string | Element, smooth?: boolean) => void;
} | null;

const { locale } = useKardoorLocale();
const { $smoother } = useNuxtApp();

const copy = computed(() => {
  if (locale.value === "tr") {
    return {
      seoTitle: "Hakkımızda",
      seoDescription:
        "Ege Kardoor'un çelik kapı üretimi, tasarım yaklaşımı ve global tedarik yolculuğu.",
      experienceLabel: "Yıllık",
      experienceValue: "deneyim",
      yearsAriaLabel: "Şirket zaman çizelgesi yılları",
      experienceAriaLabel: "10 yıllık deneyim",
      timeline: [
        {
          year: 1995,
          subtitle: "Başlangıç",
          title: "Güven Karaboğa ve Yaşar Karaboğa'nın üretim yolculuğu burada başladı.",
          image:
            "https://images.unsplash.com/photo-1531496730074-83b638c0a7ac?auto=format&fit=crop&w=1200&q=80"
        },
        {
          year: 2002,
          subtitle: "İlk atölye",
          title: "Araştırma, üretim ve kalite kontrol için ilk uzman üretim alanı kuruldu.",
          image:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
        },
        {
          year: 2008,
          subtitle: "İnovasyon",
          title: "Akıllı kilit sistemleri ve premium çelik malzemeler ürün gamına eklendi.",
          image:
            "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1200&q=80"
        },
        {
          year: 2013,
          subtitle: "Tasarım evrimi",
          title: "Minimal çizgiler ve bütünleşik mimari çözümler Kardoor dilini güçlendirdi.",
          image:
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
        },
        {
          year: 2018,
          subtitle: "Büyüme",
          title: "Operasyonlar genişledi ve Kardoor daha fazla pazarda görünür hale geldi.",
          image:
            "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?auto=format&fit=crop&w=1200&q=80"
        },
        {
          year: 2026,
          subtitle: "Bugün",
          title: "Güvenlik, üretim disiplini ve premium tasarım odağıyla global pazara açılıyor.",
          image:
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
        }
      ] satisfies TimelineItem[]
    };
  }

  return {
    seoTitle: "Company",
    seoDescription:
      "Ege Kardoor company profile for steel door manufacturing, design and global supply.",
    experienceLabel: "Years of",
    experienceValue: "experience",
    yearsAriaLabel: "Company timeline years",
    experienceAriaLabel: "10 years of experience",
    timeline: [
      {
        year: 1995,
        subtitle: "The beginning",
        title: "Where it all began, Güven Karaboğa met Yaşar Karaboğa.",
        image:
          "https://images.unsplash.com/photo-1531496730074-83b638c0a7ac?auto=format&fit=crop&w=1200&q=80"
      },
      {
        year: 2002,
        subtitle: "First workshop",
        title: "Opening our first dedicated research and manufacturing facility.",
        image:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
      },
      {
        year: 2008,
        subtitle: "Innovation",
        title: "Introducing smart lock systems and premium steel materials.",
        image:
          "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1200&q=80"
      },
      {
        year: 2013,
        subtitle: "Design evolution",
        title: "Pioneering minimalist designs and seamless structural integrations.",
        image:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        year: 2018,
        subtitle: "Expansion",
        title: "Expanding our operations and establishing a wider market presence.",
        image:
          "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?auto=format&fit=crop&w=1200&q=80"
      },
      {
        year: 2026,
        subtitle: "Today",
        title: "Leading the industry with innovative security and premium design aesthetics.",
        image:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
      }
    ] satisfies TimelineItem[]
  };
});

useSeoMeta({
  title: () => copy.value.seoTitle,
  description: () => copy.value.seoDescription
});

const sectionRef = ref<HTMLElement | null>(null);
const activeIndex = ref(0);
const timelineData = computed(() => copy.value.timeline);

let cleanupGsap: (() => void) | null = null;
let goToTimelineIndex: ((index: number) => void) | null = null;

const initScrollTimeline = async () => {
  if (!sectionRef.value) return;

  const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger")
  ]);
  gsap.registerPlugin(ScrollTrigger);

  const context = gsap.context(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 1101px)").matches;

    if (reduceMotion) {
      cleanupGsap = () => {
        context.revert();
        cleanupGsap = null;
        goToTimelineIndex = null;
      };
      return;
    }

    if (!isDesktop) {
      cleanupGsap = () => {
        context.revert();
        cleanupGsap = null;
        goToTimelineIndex = null;
      };
      return;
    }

    const section = sectionRef.value!;
    const cards = gsap.utils.toArray<HTMLElement>(".company-timeline__card", section);
    const textItems = gsap.utils.toArray<HTMLElement>(".company-timeline__text-item", section);
    const yearItems = gsap.utils.toArray<HTMLElement>(".company-timeline__years li", section);
    const track = section.querySelector<HTMLElement>(".company-timeline__track");
    const marker = section.querySelector<HTMLElement>(".company-timeline__marker");
    const maxIndex = timelineData.value.length - 1;
    const stepDistance = Math.max(window.innerHeight * 0.82, 760);
    const scrollDistance = maxIndex * stepDistance;
    const getSmoother = () => ($smoother?.() as Smoother) ?? null;
    const WHEEL_THRESHOLD = 24;
    // Trackpad momentum event'leri 8–16 ms aralıklarla akar. 72 ms'lik gerçek
    // sessizlik yeni bir fiziksel hareketi ayırır; hızlı wheel tekrarlarını da
    // 160 ms boyunca kilitleyip 2008 / 2018'de bekletmez.
    const GESTURE_GAP_MS = 72;
    let currentIndex = 0;
    let intentDirection: 1 | -1 | 0 = 0;
    let intentStrength = 0;
    let gestureConsumed = false;
    const queuedDirections: Array<1 | -1> = [];
    let isTransitioning = false;
    let isInternalScroll = false;
    let pendingExit: 1 | -1 | 0 = 0;
    let lastWheelAt = 0;
    let wheelQuietTimer = 0;
    let stepTween: ReturnType<typeof gsap.timeline> | null = null;
    let timelineInput: ReturnType<typeof useEntranceInput> | null = null;

    gsap.set(cards, { yPercent: 100, autoAlpha: 0, scale: 1, willChange: "auto" });
    gsap.set(cards[0], { yPercent: 0, autoAlpha: 1 });
    gsap.set(textItems, { y: 28, autoAlpha: 0 });
    gsap.set(textItems[0], { y: 0, autoAlpha: 1 });
    gsap.set(yearItems, { autoAlpha: 0.34, scale: 1, transformOrigin: "left center" });
    gsap.set(yearItems[0], { autoAlpha: 1, scale: 1.08 });
    if (track) gsap.set(track, { y: 16 });
    if (marker) gsap.set(marker, { y: 0 });

    const syncVisualIndex = (targetIndex: number) => {
      const settled = Math.min(maxIndex, Math.max(0, targetIndex));

      cards.forEach((card, index) => {
        gsap.set(card, {
          yPercent: index <= settled ? 0 : 100,
          scale: 1,
          autoAlpha: index === settled ? 1 : 0,
          willChange: "auto"
        });
      });
      textItems.forEach((item, index) => {
        gsap.set(item, { y: 0, autoAlpha: index === settled ? 1 : 0 });
      });
      yearItems.forEach((item, index) => {
        gsap.set(item, {
          autoAlpha: index === settled ? 1 : 0.34,
          scale: index === settled ? 1.08 : 1
        });
      });
      if (track) gsap.set(track, { y: 16 - (32 * settled) / maxIndex });
      if (marker) gsap.set(marker, { y: settled * 60 });

      currentIndex = settled;
      activeIndex.value = settled;
    };

    let trigger: ReturnType<typeof ScrollTrigger.create>;

    const setBandScroll = (targetY: number) => {
      isInternalScroll = true;
      const smoother = getSmoother();

      if (smoother?.scrollTo) {
        smoother.scrollTo(targetY, false);
      } else {
        window.scrollTo(0, targetY);
      }

      window.requestAnimationFrame(() => {
        isInternalScroll = false;
      });
    };

    const goToIndex = (targetIndex: number) => {
      const settled = Math.min(maxIndex, Math.max(0, targetIndex));
      if (settled === currentIndex) return;

      const previousIndex = currentIndex;
      const direction: 1 | -1 = settled > previousIndex ? 1 : -1;
      const targetY = trigger.start + stepDistance * settled;
      const guardedTargetY = settled === maxIndex ? targetY - 2 : targetY;

      if (isTransitioning) {
        stepTween?.kill();
        syncVisualIndex(previousIndex);
      }

      if (direction > 0) {
        gsap.set(cards[settled], {
          yPercent: 100,
          scale: 1,
          autoAlpha: 1,
          willChange: "transform"
        });
      } else {
        gsap.set(cards[settled], {
          yPercent: 0,
          scale: 1,
          autoAlpha: 1,
          willChange: "transform"
        });
      }
      gsap.set(cards[previousIndex], { autoAlpha: 1, willChange: "transform" });

      currentIndex = settled;
      isTransitioning = true;
      setBandScroll(guardedTargetY);

      stepTween = gsap.timeline({
        onComplete: () => {
          syncVisualIndex(settled);
          isTransitioning = false;
          stepTween = null;

          const nextDirection = queuedDirections.shift() ?? 0;

          if (nextDirection) {
            window.requestAnimationFrame(() => {
              const nextIndex = currentIndex + nextDirection;
              if (nextIndex >= 0 && nextIndex <= maxIndex) {
                goToIndex(nextIndex);
              }
            });
          }
        }
      });

      if (direction > 0) {
        stepTween.to(cards[settled], {
          yPercent: 0,
          duration: 1.02,
          ease: "power2.inOut"
        }, 0);
      } else {
        stepTween.to(cards[previousIndex], {
          yPercent: 100,
          duration: 1.02,
          ease: "power2.inOut"
        }, 0);
      }

      stepTween
        .call(() => {
          activeIndex.value = settled;
        }, [], 0.28)
        .to(textItems[previousIndex], {
          y: direction > 0 ? -12 : 12,
          autoAlpha: 0,
          duration: 0.28,
          ease: "power2.out"
        }, 0.12)
        .fromTo(
          textItems[settled],
          { y: direction > 0 ? 12 : -12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.48, ease: "power3.out", immediateRender: false },
          0.34
        )
        .to(yearItems[previousIndex], {
          autoAlpha: 0.34,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        }, 0.24)
        .to(yearItems[settled], {
          autoAlpha: 1,
          scale: 1.08,
          duration: 0.42,
          ease: "power3.out"
        }, 0.3);

      if (track) {
        stepTween.to(track, {
          y: 16 - (32 * settled) / maxIndex,
          duration: 0.88,
          ease: "power2.inOut"
        }, 0.06);
      }

      if (marker) {
        stepTween.to(marker, {
          y: settled * 60,
          duration: 0.72,
          ease: "power2.inOut"
        }, 0.14);
      }
    };

    const releaseTimeline = (direction: 1 | -1) => {
      const exitOffset = Math.max(4, window.innerHeight * 0.01);
      const exitY = direction > 0
        ? trigger.end + exitOffset
        : Math.max(0, trigger.start - exitOffset);

      pendingExit = 0;
      intentStrength = 0;
      setBandScroll(exitY);
    };

    const releaseExitAfterQuiet = () => {
      window.clearTimeout(wheelQuietTimer);
      wheelQuietTimer = window.setTimeout(() => {
        if (pendingExit) releaseTimeline(pendingExit);
      }, GESTURE_GAP_MS);
    };

    const driveTimeline = (
      direction: 1 | -1,
      strength: number,
      cancel: () => void
    ) => {
      cancel();

      const now = performance.now();
      if (now - lastWheelAt > GESTURE_GAP_MS) {
        gestureConsumed = false;
        intentDirection = 0;
        intentStrength = 0;
      }
      lastWheelAt = now;

      if (pendingExit) {
        if (pendingExit === direction) {
          releaseExitAfterQuiet();
          return;
        }

        pendingExit = 0;
        window.clearTimeout(wheelQuietTimer);
      }

      // Bir fiziksel wheel/trackpad gesture yalnız bir yıl tüketebilir.
      // Aynı gesture'ın momentum event'leri animasyon sırasında kuyruğa alınmaz.
      if (gestureConsumed) return;

      if (isTransitioning) {
        if (intentDirection !== direction) {
          intentDirection = direction;
          intentStrength = 0;
        }

        intentStrength += Math.min(strength, WHEEL_THRESHOLD);
        if (intentStrength >= WHEEL_THRESHOLD) {
          gestureConsumed = true;
          const projectedIndex = currentIndex
            + queuedDirections.reduce((total, queued) => total + queued, 0)
            + direction;

          if (projectedIndex >= 0 && projectedIndex <= maxIndex) {
            queuedDirections.push(direction);
          }
        }
        return;
      }

      if (intentDirection !== direction) {
        intentDirection = direction;
        intentStrength = 0;
      }

      intentStrength += Math.min(strength, WHEEL_THRESHOLD);
      if (intentStrength < WHEEL_THRESHOLD) return;

      const targetIndex = currentIndex + direction;
      intentStrength = 0;
      gestureConsumed = true;

      if (targetIndex < 0 || targetIndex > maxIndex) {
        pendingExit = direction;
        releaseExitAfterQuiet();
        return;
      }

      goToIndex(targetIndex);
    };

    trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${scrollDistance}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => {
        timelineInput?.setActive(self.isActive);
        if (!self.isActive) {
          pendingExit = 0;
          intentDirection = 0;
          intentStrength = 0;
          gestureConsumed = false;
          queuedDirections.length = 0;
          lastWheelAt = 0;
        }
      },
      onUpdate: (self) => {
        if (isInternalScroll || isTransitioning) return;

        const nearestIndex = Math.round(self.progress * maxIndex);
        if (nearestIndex !== currentIndex) syncVisualIndex(nearestIndex);
      },
      onRefresh: (self) => {
        if (isTransitioning) return;
        syncVisualIndex(Math.round(self.progress * maxIndex));
      }
    });

    timelineInput = useEntranceInput({
      band: { initialActive: trigger.isActive },
      drive: driveTimeline,
      capture: true,
      minStrength: 1,
      keyboard: false
    });
    timelineInput.start();

    goToTimelineIndex = goToIndex;

    cleanupGsap = () => {
      stepTween?.kill();
      window.clearTimeout(wheelQuietTimer);
      timelineInput?.destroy();
      timelineInput = null;
      context.revert();
      cleanupGsap = null;
      goToTimelineIndex = null;
    };
  }, sectionRef.value);

  ScrollTrigger.refresh();
};

onMounted(async () => {
  await nextTick();
  await initScrollTimeline();
});

watch(timelineData, async () => {
  cleanupGsap?.();
  activeIndex.value = 0;
  await nextTick();
  await initScrollTimeline();
});

onBeforeUnmount(() => {
  cleanupGsap?.();
});

const handleYearClick = (index: number) => {
  if (goToTimelineIndex) {
    goToTimelineIndex(index);
    return;
  }

  activeIndex.value = index;
};
</script>

<template>
  <section ref="sectionRef" class="company-timeline" aria-labelledby="company-timeline-title">
    <div class="company-timeline__mobile-list">
      <article
        v-for="(item, index) in timelineData"
        :key="`mobile-${item.year}`"
        class="company-timeline__mobile-card"
      >
        <img :src="item.image" :alt="`${item.year} ${item.subtitle}`" loading="lazy" />
        <div class="company-timeline__mobile-copy">
          <div class="company-timeline__subtitle">
            <span></span>
            <p>{{ item.year }} · {{ item.subtitle }}</p>
          </div>
          <h1 v-if="index === 0">{{ item.title }}</h1>
          <h2 v-else>{{ item.title }}</h2>
        </div>
      </article>
    </div>

    <div class="company-timeline__left">
      <div class="company-timeline__cards" aria-hidden="true">
        <div
          v-for="(item, index) in timelineData"
          :key="`card-${item.year}`"
          class="company-timeline__card"
          :style="{ zIndex: index + 1 }"
        >
          <img :src="item.image" :alt="`${item.year} ${item.subtitle}`" loading="lazy" />
        </div>
      </div>
    </div>

    <div class="company-timeline__center" :aria-label="copy.yearsAriaLabel">
      <div class="company-timeline__track">
        <span class="company-timeline__marker" aria-hidden="true"></span>
        <ul class="company-timeline__years">
          <li
            v-for="(item, index) in timelineData"
            :key="`year-${item.year}`"
            :class="{ 'is-active': activeIndex === index }"
            @click="handleYearClick(index)"
          >
            <button
              type="button"
              :aria-current="activeIndex === index ? 'step' : undefined"
              @click="handleYearClick(index)"
            >
              {{ item.year }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="company-timeline__right">
      <div class="company-timeline__text">
        <article
          v-for="(item, index) in timelineData"
          :key="`text-${item.year}`"
          class="company-timeline__text-item"
          :class="{ 'is-active': activeIndex === index }"
        >
          <div class="company-timeline__subtitle">
            <span></span>
            <p>{{ item.subtitle }}</p>
          </div>
          <h1 v-if="index === 0" id="company-timeline-title">{{ item.title }}</h1>
          <h2 v-else>{{ item.title }}</h2>
        </article>
      </div>
    </div>

    <div class="company-timeline__experience" :aria-label="copy.experienceAriaLabel">
      <span class="company-timeline__number">10</span>
      <span class="company-timeline__experience-copy">
        <span>{{ copy.experienceLabel }}</span>
        <strong>{{ copy.experienceValue }}</strong>
      </span>
    </div>
  </section>
</template>
