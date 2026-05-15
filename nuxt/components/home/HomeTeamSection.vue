<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  shortBio: string;
  bio: string;
  services: string[];
  experience: string;
};

const { locale } = useKardoorLocale();
const lottieSrc = "https://lottie.host/81c9cad9-029d-4a23-905f-29c58b5abe47/CvLTy70sdE.lottie";

const copy = computed(() =>
  locale.value === "tr"
    ? {
        manifesto:
          "Bir kapının değeri yalnızca görünüşüyle değil; yıllara meydan okuyan dayanımı ve taşıdığı güvenle ölçülür. Tavizsiz işçilik ve doğru mühendislikle, sadece bir kapı değil güven üretiyoruz.",
        teamTitle: "Yönetim Kadrosu",
        readMore: "Devamını Oku",
        close: "Kapat",
        closeModal: "Ekip detayını kapat",
        location: "İzmir, Türkiye",
        servicesTitle: "Uzmanlık & sorumluluklar:",
        experienceSuffix: "yıllık tecrübe",
        members: [
          {
            id: "guven",
            name: "Güven Karaboğa",
            role: "Kurucu Ortak",
            image: "https://freepngimg.com/save/22654-man/400x400",
            shortBio: "Üretim, tasarım ve malzeme standartlarını Kardoor'un premium ihracat vaadiyle aynı çizgide tutar.",
            bio:
              "Güven Karaboğa, Ege Kardoor'un üretim ve tasarım standartlarını belirleyen kurucu güçtür. Konut projelerinden ticari tedarike kadar malzeme disiplini ve kusursuz işçiliği markanın premium vizyonuyla birleştirir.",
            services: ["Premium kapı tasarımı", "Üretim optimizasyonu", "Kalite kontrol", "Malzeme mühendisliği"],
            experience: "20"
          },
          {
            id: "yasar",
            name: "Yaşar Karaboğa",
            role: "Kurucu Ortak",
            image: "https://freepngimg.com/save/22654-man/400x400",
            shortBio: "Finansal operasyonları, saha kararlarını ve uluslararası alıcılar için büyüme hedeflerini koordine eder.",
            bio:
              "Yaşar Karaboğa finansal operasyonları ve stratejik büyüme hedeflerini koordine eder. Saha yönetimi ve alıcı ilişkilerindeki tecrübesiyle projelerin ilk talepten teslimata kadar net ilerlemesini sağlar.",
            services: ["Finansal planlama", "Stratejik saha yönetimi", "Proje koordinasyonu", "Alıcı ilişkileri"],
            experience: "18"
          },
          {
            id: "production",
            name: "Ad Soyad",
            role: "Üretim ve Büyüme",
            image: "https://freepngimg.com/save/22654-man/400x400",
            shortBio: "Fabrikadan çıkan her kapının malzeme, güvenlik ve paketleme standartlarını denetler.",
            bio:
              "Modern üretim teknolojilerini disiplinli işçilikle birleştirerek her Kardoor ürününün güvenle taşınmasını ve yıllarca performans göstermesini sağlayan standardı korur.",
            services: ["Güvenlik denetimi", "Ar-Ge", "Tedarik zinciri", "Fabrika eğitimi"],
            experience: "12"
          }
        ] satisfies TeamMember[]
      }
    : {
        manifesto:
          "The value of a door is measured not only by its appearance, but by its endurance against the years and the confidence it carries. With uncompromising workmanship and precise engineering, we create more than a door. We create trust.",
        teamTitle: "Management Team",
        readMore: "Read More",
        close: "Close",
        closeModal: "Close team details",
        location: "Izmir, Turkey",
        servicesTitle: "Expertise & responsibilities:",
        experienceSuffix: "years of experience",
        members: [
          {
            id: "guven",
            name: "Guven Karaboga",
            role: "Founding Partner",
            image: "https://freepngimg.com/save/22654-man/400x400",
            shortBio: "Keeps production, design and material standards aligned with Kardoor's premium export promise.",
            bio:
              "Guven Karaboga is the founding force behind Ege Kardoor's production and design standards. From residential projects to commercial supply, he combines material discipline and flawless workmanship with the brand's premium vision.",
            services: ["Premium door design", "Production optimization", "Quality control", "Material engineering"],
            experience: "20"
          },
          {
            id: "yasar",
            name: "Yasar Karaboga",
            role: "Founding Partner",
            image: "https://freepngimg.com/save/22654-man/400x400",
            shortBio: "Coordinates financial operations, field decisions and growth goals for international buyers.",
            bio:
              "Yasar Karaboga coordinates financial operations and strategic growth goals. With experience in field management and buyer relations, he keeps projects moving clearly from the first request through delivery.",
            services: ["Financial planning", "Strategic field management", "Project coordination", "Buyer relations"],
            experience: "18"
          },
          {
            id: "production",
            name: "Name Surname",
            role: "Production and Growth",
            image: "https://freepngimg.com/save/22654-man/400x400",
            shortBio: "Oversees the material, security and packaging standards of every door leaving the factory.",
            bio:
              "By combining modern production technologies with disciplined workmanship, this role protects the standard that lets every Kardoor product travel securely and perform for years.",
            services: ["Security inspection", "R&D", "Supply chain", "Factory training"],
            experience: "12"
          }
        ] satisfies TeamMember[]
      }
);

const marqueeItems = Array.from({ length: 5 }, (_, index) => index);
const manifestoWords = computed(() =>
  copy.value.manifesto.split(" ").map((word) => ({
    word,
    chars: Array.from(word),
    isBrand: word.toLowerCase().includes("ege") || word.toLowerCase().includes("kardoor")
  }))
);
const teamTitleChars = computed(() => Array.from(copy.value.teamTitle));
const teamMembers = computed(() => copy.value.members);

const selectedMemberId = ref<string | null>(null);
const selectedMember = computed(() => teamMembers.value.find((member) => member.id === selectedMemberId.value) ?? null);
const sectionRef = ref<HTMLElement | null>(null);
const manifestoRef = ref<HTMLElement | null>(null);
const lineFillRef = ref<HTMLElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);

const isModalOpen = computed(() => selectedMember.value !== null);
let cleanupAnimations: (() => void) | null = null;

useHead({
  script: [
    {
      src: "https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs",
      type: "module"
    }
  ]
});

const openMember = (member: TeamMember) => {
  selectedMemberId.value = member.id;
  document.body.style.overflow = "hidden";
};

const closeMember = () => {
  selectedMemberId.value = null;
  document.body.style.overflow = "";
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeMember();
};

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);

  const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger")
  ]);

  gsap.registerPlugin(ScrollTrigger);
  const triggersBefore = ScrollTrigger.getAll();

  if (lineFillRef.value && manifestoRef.value) {
    gsap.to(lineFillRef.value, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: manifestoRef.value,
        start: "top 72%",
        end: "bottom 42%",
        scrub: 2,
        invalidateOnRefresh: true
      }
    });
  }

  if (manifestoRef.value) {
    const chars = Array.from(manifestoRef.value.querySelectorAll<HTMLElement>(".reveal-char"));
    const revealSpread = 22;
    let revealFrame = 0;

    const setReveal = (progress: number) => {
      const revealHead = progress * (chars.length + revealSpread);

      chars.forEach((char, index) => {
        const distance = revealHead - index;
        const opacity = gsap.utils.clamp(0.16, 1, 0.16 + (distance / revealSpread) * 0.84);

        char.style.opacity = opacity.toFixed(3);
      });
    };

    const updateRevealFromViewport = () => {
      const rect = manifestoRef.value?.getBoundingClientRect();
      if (!rect) return;

      const start = window.innerHeight * 0.72;
      const end = window.innerHeight * 0.22;
      const progress = gsap.utils.clamp(0, 1, (start - rect.top) / (start - end));

      setReveal(progress);
    };

    const queueReveal = () => {
      cancelAnimationFrame(revealFrame);
      revealFrame = requestAnimationFrame(updateRevealFromViewport);
    };

    queueReveal();
    window.addEventListener("scroll", queueReveal, { passive: true });
    window.addEventListener("resize", queueReveal);

    gsap.fromTo(
      manifestoRef.value,
      { y: 22 },
      {
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: manifestoRef.value,
          start: "top 90%",
          end: "bottom 20%",
          scrub: 1.8,
          invalidateOnRefresh: true
        }
      }
    );

    cleanupAnimations = () => {
      cancelAnimationFrame(revealFrame);
      window.removeEventListener("scroll", queueReveal);
      window.removeEventListener("resize", queueReveal);
      ScrollTrigger.getAll().forEach((trigger) => {
        if (!triggersBefore.includes(trigger)) trigger.kill();
      });
    };
  }

  if (titleRef.value) {
    const titleChars = titleRef.value.querySelectorAll(".ada-title-float-char");
    titleChars[0]?.classList.add("ada-first-letter");

    gsap.fromTo(
      titleChars,
      {
        yPercent: 80,
        opacity: 0,
        clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"
      },
      {
        yPercent: 0,
        opacity: 1,
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1.9,
        ease: "expo.out",
        stagger: { amount: 0.6, ease: "sine.inOut" },
        scrollTrigger: {
          trigger: titleRef.value,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  if (window.matchMedia("(min-width: 1025px)").matches && sectionRef.value) {
    gsap.from(sectionRef.value.querySelectorAll(".ada-card"), {
      y: 80,
      opacity: 0,
      stagger: 0.25,
      duration: 1.8,
      ease: "power4.out",
      scrollTrigger: {
        trigger: sectionRef.value.querySelector(".ada-title-container"),
        start: "top 70%",
        once: true
      }
    });
  }

  if (!cleanupAnimations) {
    cleanupAnimations = () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (!triggersBefore.includes(trigger)) trigger.kill();
      });
    };
  }
});

onBeforeUnmount(() => {
  cleanupAnimations?.();
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <section ref="sectionRef" class="ada-team-section">
    <div class="ada-manifesto-spacer" />

    <div class="ada-manifesto-container">
      <div class="ada-scroll-line-wrapper">
        <div ref="lineFillRef" class="ada-scroll-line-fill" />
      </div>

      <h3 ref="manifestoRef" class="ada-manifesto-text">
        <template v-for="(word, wordIndex) in manifestoWords" :key="`${word.word}-${wordIndex}`">
          <span class="reveal-word" :class="{ 'brand-gradient-word': word.isBrand }">
            <span
              v-for="(char, charIndex) in word.chars"
              :key="`${word.word}-${wordIndex}-${charIndex}`"
              class="reveal-char"
            >
              {{ char }}
            </span>
          </span>
          <span v-if="wordIndex < manifestoWords.length - 1" class="reveal-space" aria-hidden="true">&nbsp;</span>
        </template>
      </h3>
    </div>

    <div class="ada-subtitle-container">
      <div class="ada-loop-track">
        <div v-for="group in 2" :key="`forward-${group}`" class="ada-loop-group" :aria-hidden="group === 2">
          <template v-for="item in marqueeItems" :key="`forward-${group}-${item}`">
            <span class="ada-loop-item">
              <span class="ege-gradient"><span class="kern-after-e">E</span>GE</span>
              <span class="kardoor-word"><span class="kern-after-k">K</span>ARDOOR<span class="reg-mark">®</span></span>
            </span>
            <span class="loop-separator">
              <dotlottie-player :src="lottieSrc" autoplay loop />
            </span>
          </template>
        </div>
      </div>
    </div>

    <div class="ada-subtitle-container-reverse">
      <div class="ada-loop-track-reverse">
        <div v-for="group in 2" :key="`reverse-${group}`" class="ada-loop-group" :aria-hidden="group === 2">
          <template v-for="item in marqueeItems" :key="`reverse-${group}-${item}`">
            <span class="ada-loop-item">
              <span class="ege-gradient"><span class="kern-after-e">E</span>GE</span>
              <span class="kardoor-word"><span class="kern-after-k">K</span>ARDOOR<span class="reg-mark">®</span></span>
            </span>
            <span class="loop-separator">
              <dotlottie-player :src="lottieSrc" autoplay loop />
            </span>
          </template>
        </div>
      </div>
    </div>

    <div class="ada-title-container">
      <h4 ref="titleRef" class="ada-giant-title" :aria-label="copy.teamTitle">
        <span class="ada-title-float-word">
          <span
            v-for="(char, charIndex) in teamTitleChars"
            :key="`${char}-${charIndex}`"
            class="ada-title-float-char"
          >
            {{ char === " " ? "\u00a0" : char }}
          </span>
        </span>
      </h4>
    </div>

    <div class="ada-carousel-wrapper">
      <div class="ada-founders-grid">
        <article v-for="member in teamMembers" :key="member.name" class="ada-card" @click="openMember(member)">
          <div class="ada-card-text">
            <span class="ada-role">{{ member.role }}</span>
            <h3 class="ada-name">{{ member.name }}</h3>
          </div>

          <div class="ada-image-container">
            <img :src="member.image" class="ada-person-img" :alt="member.name" />

            <div class="ada-hover-overlay">
              <p class="ada-bio">{{ member.shortBio }}</p>
              <button class="ada-read-more" type="button" @click.stop="openMember(member)">
                {{ copy.readMore }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isModalOpen && selectedMember" class="ada-modal active">
      <button class="ada-modal-overlay" type="button" :aria-label="copy.closeModal" @click="closeMember" />

      <div class="ada-modal-wrapper" role="dialog" aria-modal="true" :aria-label="selectedMember.name">
        <div class="ada-modal-left">
          <img :src="selectedMember.image" :alt="selectedMember.name" />
        </div>

        <div class="ada-modal-right">
          <div class="ada-modal-top">
            <div class="ada-modal-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {{ copy.location }}
            </div>

            <button class="ada-modal-close" type="button" @click="closeMember">
              {{ copy.close }}
              <span class="close-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </button>
          </div>

          <h2 class="ada-modal-name">{{ selectedMember.name }}</h2>
          <p class="ada-modal-role">{{ selectedMember.role }}</p>

          <div class="ada-modal-content">
            <div class="ada-modal-bio-section">
              <div class="ada-modal-social">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <p class="ada-modal-bio-text">{{ selectedMember.bio }}</p>
            </div>

            <div class="ada-modal-services-section">
              <span class="services-title">{{ copy.servicesTitle }}</span>
              <ul class="services-list">
                <li v-for="service in selectedMember.services" :key="service">
                  {{ service }}
                </li>
              </ul>

              <div class="ada-modal-experience">
                <strong>{{ selectedMember.experience }}</strong>
                <span>{{ copy.experienceSuffix }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
