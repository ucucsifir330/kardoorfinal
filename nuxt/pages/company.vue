<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

type TimelineItem = {
  year: number;
  subtitle: string;
  title: string;
  image: string;
};

const { locale } = useKardoorLocale();

const copy = computed(() => {
  if (locale.value === "tr") {
    return {
      seoTitle: "Hakkımızda",
      seoDescription:
        "Ege Kardoor'un çelik kapı üretimi, tasarım yaklaşımı ve global tedarik yolculuğu.",
      experienceLabel: "Yıllık",
      experienceValue: "deneyim",
      yearsAriaLabel: "Şirket zaman çizelgesi yılları",
      experienceAriaLabel: "18 yıllık deneyim",
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
    experienceAriaLabel: "18 years of experience",
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
const cardStyles = ref<Record<string, string | number>[]>([]);
const timelineData = computed(() => copy.value.timeline);

let cleanupGsap: (() => void) | null = null;

const resetCardStyles = () => {
  cardStyles.value = timelineData.value.map((_, index) => ({
    transform: index === 0 ? "translateY(0) scale(1)" : "translateY(100vh) scale(1)",
    opacity: index === 0 ? 1 : 0,
    zIndex: index + 1
  }));
};

const initScrollTimeline = async () => {
  if (!sectionRef.value || window.matchMedia("(max-width: 820px)").matches) {
    return;
  }

  const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger")
  ]);

  gsap.registerPlugin(ScrollTrigger);

  const context = gsap.context(() => {
    const scrollDistance = timelineData.value.length * 800;
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.value,
      start: "top top",
      end: `+=${scrollDistance}`,
      pin: true,
      scrub: 1,
      snap: {
        snapTo: 1 / (timelineData.value.length - 1),
        duration: 0.3,
        ease: "power1.inOut"
      },
      onUpdate: (self) => {
        const progress = self.progress;
        const maxIndex = timelineData.value.length - 1;
        const currentFloat = progress * maxIndex;

        activeIndex.value = Math.round(currentFloat);
        cardStyles.value = timelineData.value.map((_, index) => {
          const delta = currentFloat - index;

          if (delta >= 0) {
            const scale = Math.max(0, 1 - delta * 0.05);

            return {
              transform: `translateY(0) scale(${scale})`,
              opacity: Math.max(0, 1 - delta),
              zIndex: index + 1
            };
          }

          return {
            transform: `translateY(${Math.abs(delta) * 100}vh) scale(1)`,
            opacity: 1,
            zIndex: index + 1
          };
        });
      }
    });

    cleanupGsap = () => {
      trigger.kill();
      context.revert();
      cleanupGsap = null;
    };
  }, sectionRef.value);

  ScrollTrigger.refresh();
};

onMounted(async () => {
  resetCardStyles();
  await nextTick();
  await initScrollTimeline();
});

watch(timelineData, async () => {
  cleanupGsap?.();
  activeIndex.value = 0;
  resetCardStyles();
  await nextTick();
  await initScrollTimeline();
});

onBeforeUnmount(() => {
  cleanupGsap?.();
});
</script>

<template>
  <section ref="sectionRef" class="company-timeline" aria-labelledby="company-timeline-title">
    <div class="company-timeline__left">
      <div class="company-timeline__cards" aria-hidden="true">
        <div
          v-for="(item, index) in timelineData"
          :key="`card-${item.year}`"
          class="company-timeline__card"
          :style="cardStyles[index]"
        >
          <img :src="item.image" :alt="`${item.year} ${item.subtitle}`" loading="lazy" />
        </div>
      </div>
    </div>

    <div class="company-timeline__center" :aria-label="copy.yearsAriaLabel">
      <div class="company-timeline__track">
        <ul
          class="company-timeline__years"
          :style="{ transform: `translateY(${-activeIndex * 60}px)` }"
        >
          <li
            v-for="(item, index) in timelineData"
            :key="`year-${item.year}`"
            :class="{ 'is-active': activeIndex === index }"
          >
            {{ item.year }}
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
      <span class="company-timeline__number">18</span>
      <span class="company-timeline__experience-copy">
        <span>{{ copy.experienceLabel }}</span>
        <strong>{{ copy.experienceValue }}</strong>
      </span>
    </div>
  </section>
</template>

<style scoped>
.company-timeline {
  width: 100%;
  min-height: 100svh;
  position: relative;
  display: flex;
  overflow: hidden;
  background: #111115;
  color: #fff;
}

.company-timeline__left {
  width: 50%;
  min-height: 100svh;
  position: relative;
  display: flex;
  align-items: flex-start;
}

.company-timeline__cards {
  width: 100%;
  height: 96svh;
  position: relative;
  margin-top: 2svh;
  perspective: 1000px;
}

.company-timeline__card {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 0 8px 8px 0;
  box-shadow: 20px 20px 60px rgba(0, 0, 0, 0.5);
  transform-origin: left center;
  will-change: transform, opacity;
}

.company-timeline__card img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.company-timeline__center {
  width: 10%;
  min-height: 100svh;
  display: flex;
  align-items: flex-start;
  padding-top: 35svh;
  padding-left: 40px;
  position: relative;
}

.company-timeline__track {
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 25px;
  overflow: visible;
}

.company-timeline__track::before {
  content: "";
  width: 2px;
  position: absolute;
  left: 0;
  top: -500px;
  bottom: -500px;
  background: rgba(255, 255, 255, 0.15);
}

.company-timeline__track::after {
  content: "";
  width: 4px;
  height: 60px;
  position: absolute;
  left: -1px;
  top: 0;
  z-index: 2;
  border-radius: 2px;
  background: #fff;
}

.company-timeline__years {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

.company-timeline__years li {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.35;
  transition: opacity 0.4s ease, font-size 0.4s ease;
}

.company-timeline__years li.is-active {
  font-size: 1.25rem;
  font-weight: 800;
  opacity: 1;
}

.company-timeline__right {
  flex: 1;
  min-height: 100svh;
  position: relative;
  display: flex;
  flex-direction: column;
  padding-left: 60px;
}

.company-timeline__text {
  width: min(100%, 720px);
  position: absolute;
  top: 35svh;
  left: 80px;
}

.company-timeline__text-item {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  pointer-events: none;
}

.company-timeline__text-item.is-active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.company-timeline__subtitle {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.company-timeline__subtitle span {
  width: 3px;
  height: 22px;
  flex: 0 0 auto;
  margin-right: 20px;
  background: #fff;
}

.company-timeline__subtitle p {
  margin: 0;
  color: #ddd;
  font-size: 1rem;
  font-weight: 400;
  text-transform: capitalize;
}

.company-timeline h1,
.company-timeline h2 {
  max-width: 640px;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.35rem, 3vw, 4rem);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: 0;
}

.company-timeline__experience {
  position: absolute;
  right: 4vw;
  bottom: 4svh;
  z-index: 10;
  display: flex;
  align-items: center;
  color: #fff;
}

.company-timeline__number {
  margin-right: 12px;
  color: #fff;
  font-size: 3.625rem;
  font-weight: 300;
  line-height: 0.75;
}

.company-timeline__experience-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.1;
}

.company-timeline__experience-copy span,
.company-timeline__experience-copy strong {
  color: #a0a0a0;
  font-size: 0.72rem;
  font-weight: 400;
  text-transform: uppercase;
}

.company-timeline__experience-copy strong {
  color: #fff;
  font-weight: 700;
}

@media (max-width: 1180px) {
  .company-timeline__center {
    width: 12%;
    padding-left: 26px;
  }

  .company-timeline__right {
    padding-left: 36px;
  }

  .company-timeline__text {
    left: 42px;
  }
}

@media (max-width: 820px) {
  .company-timeline {
    display: grid;
    min-height: auto;
    padding: calc(var(--header) + 1rem) 1rem 3rem;
    gap: 1rem;
    overflow: visible;
  }

  .company-timeline__left,
  .company-timeline__center,
  .company-timeline__right {
    width: 100%;
    min-height: auto;
    padding: 0;
  }

  .company-timeline__cards {
    height: auto;
    margin-top: 0;
    display: grid;
    gap: 0.75rem;
  }

  .company-timeline__card {
    min-height: 64svh;
    position: relative;
    inset: auto;
    border-radius: 8px;
    opacity: 1 !important;
    transform: none !important;
  }

  .company-timeline__center,
  .company-timeline__experience {
    display: none;
  }

  .company-timeline__text {
    width: 100%;
    position: static;
    display: grid;
    gap: 1.5rem;
  }

  .company-timeline__text-item {
    position: static;
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .company-timeline h1,
  .company-timeline h2 {
    font-size: clamp(2rem, 10vw, 3.15rem);
  }
}
</style>
