<template>
  <div class="ada-carousel-wrapper">
    <div class="ada-founders-grid">
      <article v-for="member in teamMembers" :key="member.name" class="ada-card">
        <div class="ada-card-text">
          <span class="ada-role">{{ member.shortRole }}</span>
          <h3 class="ada-name">{{ member.name }}</h3>
        </div>
        <div class="ada-image-container">
          <img :src="member.image" class="ada-person-img" :alt="member.name">
          <div class="ada-hover-overlay">
            <p class="ada-bio">{{ member.summary }}</p>
            <a
              href="#"
              class="ada-read-more"
              :data-name="member.name"
              :data-role="member.role"
              :data-image="member.image"
              :data-bio="member.bio"
              :data-services="member.services.join(', ')"
              :data-exp="member.experience"
              @click.prevent="openMember(member)"
            >
              Devamını Oku
            </a>
          </div>
        </div>
      </article>
    </div>
  </div>

  <Teleport to="body">
    <div class="ada-modal" :class="{ active: activeMember }" id="teamModal">
      <div class="ada-modal-overlay" @click="closeModal"></div>
      <div class="ada-modal-wrapper">
        <div class="ada-modal-left">
          <img :src="activeMember?.image || ''" :alt="activeMember?.name || ''" id="modalImage">
        </div>

        <div class="ada-modal-right">
          <div class="ada-modal-top-fixed">
            <div class="ada-modal-top-content">
              <div class="ada-modal-location">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                İzmir, Türkiye
              </div>
              <button type="button" class="ada-modal-close" id="closeModal" @click="closeModal">
                Kapat
                <span class="close-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div class="ada-modal-right-fixed-panel">
            <div class="ada-modal-services-wrapper">
              <span class="services-title">Uzmanlık & Sorumluluklar</span>
              <ul class="services-list" id="modalServices">
                <li v-for="service in activeMember?.services || []" :key="service">{{ service }}</li>
              </ul>
            </div>
            <div class="ada-modal-experience">
              <div class="exp-line-1"><strong id="modalExp">{{ activeMember?.experience }}</strong> <span>yıllık</span></div>
              <div class="exp-line-2">Tecrübe</div>
            </div>
          </div>

          <div class="ada-modal-scroll-area">
            <div class="ada-modal-scroll-content">
              <h2 class="ada-modal-name" id="modalName">{{ activeMember?.name }}</h2>
              <p class="ada-modal-role" id="modalRole">{{ activeMember?.role }}</p>

              <div class="ada-modal-content-split">
                <div class="ada-modal-bio-col">
                  <a href="#" class="ada-modal-social" target="_blank">
                    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                      <path d="M160,128a32,32,0,1,1-32-32A32.03667,32.03667,0,0,1,160,128Zm68-44v88a56.06353,56.06353,0,0,1-56,56H84a56.06353,56.06353,0,0,1-56-56V84A56.06353,56.06353,0,0,1,84,28h88A56.06353,56.06353,0,0,1,228,84Zm-52,44a48,48,0,1,0-48,48A48.05436,48.05436,0,0,0,176,128Zm16-52a12,12,0,1,0-12,12A12,12,0,0,0,192,76Z"></path>
                    </svg>
                  </a>
                  <p class="ada-modal-bio-text" id="modalBio">{{ activeMember?.bio }}</p>
                </div>

                <div class="ada-modal-services-col"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

interface TeamMember {
  name: string;
  shortRole: string;
  role: string;
  image: string;
  summary: string;
  bio: string;
  services: string[];
  experience: number;
}

const aboutUsImages = {
  guvenkaraboga: "https://ik.imagekit.io/kardoor/aboutus/guvenkaraboga?updatedAt=1778789528553",
  yasarkaraboga: "https://ik.imagekit.io/kardoor/aboutus/yasarkaraboga?updatedAt=1778789528545",
  bulentkaraboga: "https://ik.imagekit.io/kardoor/aboutus/bulentkaraboga?updatedAt=1778789528542"
} as const;

const teamMembers: TeamMember[] = [
  {
    name: "Güven Karaboğa",
    shortRole: "Kurucu Ortak",
    role: "Ege Kardoor Partner & Founder",
    image: aboutUsImages.guvenkaraboga,
    summary: "Üretim bandından tasarıma kadar her detayın markanın premium standartlarına uymasını sağlar.",
    bio: "Güven Karaboğa, Ege Kardoor'un üretim ve tasarım standartlarını belirleyen kurucu güçtür. Konutlardan ticari yapılara kadar geniş bir yelpazede, malzeme mühendisliği ve kusursuz işçiliği bir araya getirerek markanın premium vizyonunu oluşturmuştur.",
    services: ["Premium Kapı Tasarımı", "Üretim Optimizasyonu", "Kalite Kontrol Süreçleri", "Malzeme Mühendisliği"],
    experience: 20
  },
  {
    name: "Yaşar Karaboğa",
    shortRole: "Kurucu Ortak",
    role: "Ege Kardoor Partner & Founder",
    image: aboutUsImages.yasarkaraboga,
    summary: "Kardoor'un finansal operasyonlarını ve stratejik saha yönetimini koordine eder.",
    bio: "Finansal operasyonlar ve stratejik büyüme hedeflerini koordine eden Yaşar Karaboğa, saha yönetimi ve müşteri ilişkileri konusundaki derin tecrübesiyle projelerin kusursuz tamamlanmasını sağlar.",
    services: ["Finansal Planlama", "Stratejik Saha Yönetimi", "Proje Koordinasyonu", "Müşteri İlişkileri"],
    experience: 18
  },
  {
    name: "Bülent Karaboğa",
    shortRole: "Üretim ve Büyüme",
    role: "Üretim Direktörü",
    image: aboutUsImages.bulentkaraboga,
    summary: "Fabrikadan çıkan her ürünün malzeme ve güvenlik standartlarını bizzat denetler.",
    bio: "Modern üretim teknolojilerini geleneksel el işçiliği disipliniyle harmanlayarak, her kapının yıllara meydan okumasını sağlar.",
    services: ["Güvenlik Denetimi", "Ar-Ge Çalışmaları", "Tedarik Zinciri", "Personel Eğitimi"],
    experience: 12
  }
];

const activeMember = ref<TeamMember | null>(null);

const openMember = (member: TeamMember) => {
  activeMember.value = member;
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  activeMember.value = null;
  document.body.style.overflow = "";
};

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>
