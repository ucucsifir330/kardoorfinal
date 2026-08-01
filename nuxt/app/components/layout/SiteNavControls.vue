<script setup lang="ts">
/**
 * Tema (güneş/ay) + dil (TR/EN) segmentleri.
 *
 * Navbar'da İKİ yerde görünür: masaüstü çubuğunun sağ grubunda ve mobil
 * panelin alt satırında. Her iki composable da `useState` tabanlı global
 * store olduğundan bileşen prop/emit almadan tamamen kendi kendine yeter —
 * iki kopya aynı state'i paylaşır, senkron kalır.
 */
import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { isNight, theme, setTheme } = useShowroomAmbience();
const { locale, locales, localeLabels, setLocale } = useKardoorLocale();

const isTurkish = computed(() => locale.value === "tr");

const themeGroupLabel = computed(() =>
  isTurkish.value ? "Tema seçici" : "Theme selector"
);

const languageGroupLabel = computed(() =>
  isTurkish.value ? "Dil seçici" : "Language selector"
);

const getThemeSwitchLabel = (nextTheme: "light" | "dark") =>
  isTurkish.value
    ? nextTheme === "light"
      ? "Aydınlık temaya geç"
      : "Karanlık temaya geç"
    : nextTheme === "light"
      ? "Switch to light theme"
      : "Switch to dark theme";

const getLanguageSwitchLabel = (nextLocale: (typeof locales)[number]) =>
  isTurkish.value
    ? `Arayüz dilini ${localeLabels[nextLocale]} yap`
    : `Switch interface language to ${localeLabels[nextLocale]}`;

/**
 * Tema geçişi: tıklanan noktadan açılan daire (View Transitions API).
 * Destek yoksa ya da kullanıcı hareketi azaltmışsa doğrudan uygulanır.
 *
 * Tarayıcının varsayılan cross-fade'i base/transitions.css'te kapatıldı;
 * geriye tek animasyon olarak buradaki clip-path kalıyor.
 */
const switchThemeWithTransition = (nextTheme: "light" | "dark", event: MouseEvent) => {
  if (nextTheme === theme.value) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !document.startViewTransition) {
    setTheme(nextTheme);
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(() => {
    setTheme(nextTheme);
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  });
};
</script>

<template>
  <div
    class="site-nav__seg site-nav__seg--theme"
    :data-index="isNight ? 1 : 0"
    role="group"
    :aria-label="themeGroupLabel"
  >
    <span class="site-nav__seg-thumb" aria-hidden="true" />
    <button
      class="site-nav__seg-btn"
      :class="{ 'is-active': !isNight }"
      type="button"
      :aria-pressed="!isNight"
      :aria-label="getThemeSwitchLabel('light')"
      @click="switchThemeWithTransition('light', $event)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
    </button>
    <button
      class="site-nav__seg-btn"
      :class="{ 'is-active': isNight }"
      type="button"
      :aria-pressed="isNight"
      :aria-label="getThemeSwitchLabel('dark')"
      @click="switchThemeWithTransition('dark', $event)"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" />
      </svg>
    </button>
  </div>

  <div
    class="site-nav__seg site-nav__seg--lang"
    :data-index="locale === 'en' ? 1 : 0"
    role="group"
    :aria-label="languageGroupLabel"
  >
    <span class="site-nav__seg-thumb" aria-hidden="true" />
    <button
      v-for="code in locales"
      :key="code"
      class="site-nav__seg-btn site-nav__seg-btn--text"
      :class="{ 'is-active': locale === code }"
      type="button"
      :aria-pressed="locale === code"
      :aria-label="getLanguageSwitchLabel(code)"
      @click="setLocale(code)"
    >
      {{ localeLabels[code] }}
    </button>
  </div>
</template>
