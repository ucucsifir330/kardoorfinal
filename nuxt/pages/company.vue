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
  if (!sectionRef.value || window.matchMedia("(max-width: 1100px)").matches) {
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
    <a href="/#home-manifesto" class="company-timeline__back-cta" aria-label="Manifesto bölümüne geri dön">
      <span class="company-timeline__back-icon" aria-hidden="true">
        <span class="company-timeline__back-chevron">‹</span>
      </span>
    </a>

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
