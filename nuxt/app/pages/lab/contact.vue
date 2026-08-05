<script setup lang="ts">
/**
 * İLETİŞİM HUB LAB — ContactHubLab.vue'nun deneme alanı.
 *
 * Production'a BAĞLI DEĞİL: ana sayfa FloatingContactHub.vue'yu kullanmaya
 * devam ediyor. Bu sayfa yeni hub'ı tek başına ayağa kaldırır.
 *
 * Prod build'de ana sayfaya yönlenir — lab yalnız geliştirmede yaşar.
 */
import { navigateTo } from "#imports";
import ContactHubLab from "~/components/lab/ContactHubLab.vue";

if (!import.meta.dev) {
  navigateTo("/", { redirectCode: 302 });
}

useHead({ title: "İletişim Hub Lab" });
</script>

<template>
  <div class="chub-lab-page">
    <div class="chub-lab-page__note">
      <h1>İletişim Hub — Lab</h1>
      <p>
        Sağ alttaki hap'a bas: panel yükselir, üç eylem kademeli girer.
        Kapatma yolları: tekrar bas, dışarı tıkla, Escape.
      </p>
      <ul>
        <li>Renk/biçim navbar ailesinden — aynı token, flare kıvrımı</li>
        <li>Açılış GSAP timeline (panel → birincil → eylemler stagger)</li>
        <li>rAF polling YOK: hero senkronu ScrollTrigger ile</li>
      </ul>
    </div>

    <!-- Lab'de hero yok; `force-visible` ana sayfa şartını aşar. -->
    <ContactHubLab force-visible />
  </div>
</template>

<style scoped>
.chub-lab-page {
  min-height: 100vh;
  padding: 120px clamp(20px, 5vw, 64px) 80px;
  background: var(--bg-color);
  color: var(--text-primary);
}

.chub-lab-page__note {
  max-width: 56ch;
}

.chub-lab-page__note h1 {
  margin: 0 0 12px;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 500;
}

.chub-lab-page__note p {
  margin: 0 0 16px;
  font-size: 16px;
  line-height: 1.55;
  color: var(--text-secondary);
}

.chub-lab-page__note ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--text-secondary);
}
</style>
