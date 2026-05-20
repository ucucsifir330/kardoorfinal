<template>
  <div class="ada-manifesto-spacer"></div>

  <div class="ada-manifesto-container">
    <div class="ada-scroll-line-wrapper">
      <div class="ada-scroll-line-fill"></div>
    </div>
    <div class="ada-manifesto-content">
      <h3 class="ada-manifesto-text scroll-reveal" id="manifesto-text">
        Bir kapının değeri yalnızca görünüşüyle değil; yıllara meydan okuyan dayanımı ve taşıdığı güvenle ölçülür. Tavizsiz işçilik ve doğru mühendislikle, sadece bir kapı değil güven üretiyoruz.
      </h3>
      <a href="/company" class="ada-manifesto-cta" aria-label="Hakkımızda sayfasına git">
        <span class="ada-manifesto-cta-text" data-text="Hikâyemizi Keşfet">Hikâyemizi Keşfet</span>
        <span class="ada-manifesto-cta-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V8.5C12 10.433 13.567 12 15.5 12H20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M4 12H8.5C10.433 12 12 13.567 12 15.5V20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
          </svg>
        </span>
      </a>
    </div>
  </div>

  <div class="ada-subtitle-container">
    <div class="ada-loop-track">
      <div v-for="group in 2" :key="'brand-row-a-' + group" class="ada-loop-group" :aria-hidden="group === 2 ? 'true' : undefined">
        <span v-for="brand in primaryBrands" :key="group + brand.name" class="ada-loop-item">
          <img class="ada-brand-logo" :src="brand.src" :alt="brand.name">
        </span>
      </div>
    </div>
  </div>

  <div class="ada-subtitle-container-reverse">
    <div class="ada-loop-track-reverse">
      <div v-for="group in 2" :key="'brand-row-b-' + group" class="ada-loop-group" :aria-hidden="group === 2 ? 'true' : undefined">
        <span v-for="brand in secondaryBrands" :key="group + brand.name" class="ada-loop-item">
          <span v-if="brand.name === 'Microsoft'" class="ada-brand-logo ada-brand-logo-microsoft" aria-label="Microsoft" role="img">
            <svg class="ada-brand-logo-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4h26v26H4V4Zm30 0h26v26H34V4ZM4 34h26v26H4V34Zm30 0h26v26H34V34Z" fill="currentColor"/>
            </svg>
          </span>
          <img v-else class="ada-brand-logo" :src="brand.src" :alt="brand.name">
        </span>
      </div>
    </div>
  </div>

  <div class="ada-title-container">
    <h4 class="ada-giant-title">
      Yönetim Kadrosu
    </h4>
  </div>
</template>

<script setup lang="ts">
const primaryBrands = [
  { name: "Apple", src: "https://cdn.simpleicons.org/apple/EAE8E8" },
  { name: "Nike", src: "https://cdn.simpleicons.org/nike/EAE8E8" },
  { name: "Tesla", src: "https://cdn.simpleicons.org/tesla/EAE8E8" },
  { name: "Sony", src: "https://cdn.simpleicons.org/sony/EAE8E8" },
  { name: "Meta", src: "https://cdn.simpleicons.org/meta/EAE8E8" },
  { name: "Google", src: "https://cdn.simpleicons.org/google/EAE8E8" },
  { name: "IKEA", src: "https://cdn.simpleicons.org/ikea/EAE8E8" },
  { name: "McDonald's", src: "https://cdn.simpleicons.org/mcdonalds/EAE8E8" },
  { name: "Visa", src: "https://cdn.simpleicons.org/visa/EAE8E8" },
  { name: "BMW", src: "https://cdn.simpleicons.org/bmw/EAE8E8" }
];

const secondaryBrands = [
  { name: "Adidas", src: "https://cdn.simpleicons.org/adidas/EAE8E8" },
  { name: "Mastercard", src: "https://cdn.simpleicons.org/mastercard/EAE8E8" },
  { name: "Netflix", src: "https://cdn.simpleicons.org/netflix/EAE8E8" },
  { name: "Samsung", src: "https://cdn.simpleicons.org/samsung/EAE8E8" },
  { name: "Spotify", src: "https://cdn.simpleicons.org/spotify/EAE8E8" },
  { name: "Puma", src: "https://cdn.simpleicons.org/puma/EAE8E8" },
  { name: "Toyota", src: "https://cdn.simpleicons.org/toyota/EAE8E8" },
  { name: "Honda", src: "https://cdn.simpleicons.org/honda/EAE8E8" },
  { name: "Microsoft", src: "" },
  { name: "NVIDIA", src: "https://cdn.simpleicons.org/nvidia/EAE8E8" }
];
</script>
