<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const route = useRoute();
const { isNight, theme, setTheme } = useShowroomAmbience();
const { locale, locales, localeLabels, setLocale } = useKardoorLocale();

const isHidden = ref(false);
const isMenuOpen = ref(false);
const menuButtonRef = ref<HTMLButtonElement | null>(null);
let lastScrollY = 0;

const navItems = computed(() => {
  const labels = {
    tr: {
      home: "Ana Sayfa",
      products: "Ürünler",
      references: "Referanslar",
      about: "Hakkımızda",
      contact: "İletişim"
    },
    en: {
      home: "Home",
      products: "Products",
      references: "References",
      about: "About Us",
      contact: "Contact"
    }
  }[locale.value];

  return [
    { to: "/", label: labels.home },
    { to: "/doors", label: labels.products, disabled: true },
    { to: "/references", label: labels.references },
    { to: "/company", label: labels.about },
    { to: "/contact", label: labels.contact, disabled: false }
  ];
});

// Tek bar düzeni: SOL [Products · References] — ORTA [K=Home] — SAĞ [About · Contact].
// Home (K) ortadaki marka işareti olduğundan masaüstü nav linklerinden ayrılır;
// mobil menüde tüm öğeler (Home dahil) navItems'tan gelir.
const navLeft = computed(() =>
  navItems.value.filter(
    (i) => i.to === "/doors" || i.to === "/references" || i.to === "/company"
  )
);
const navRight = computed(() => navItems.value.filter((i) => i.to === "/contact"));

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";

  return route.path.startsWith(to);
};

const headerClass = computed(() => ({
  "site-header--hidden": isHidden.value,
  "site-header--night": isNight.value,
  "site-header--menu-open": isMenuOpen.value
}));

const brandLabel = computed(() =>
  locale.value === "tr" ? "Kardoor ana sayfa" : "Kardoor home"
);

const primaryNavLabel = computed(() =>
  locale.value === "tr" ? "Ana navigasyon" : "Primary navigation"
);

const utilitiesLabel = computed(() =>
  locale.value === "tr" ? "Header araçları" : "Header utilities"
);

const languageLabel = computed(() =>
  locale.value === "tr" ? "Dil seçici" : "Language selector"
);

const themeLabel = computed(() =>
  locale.value === "tr" ? "Tema seçici" : "Theme selector"
);

const getThemeSwitchLabel = (nextTheme: "light" | "dark") =>
  locale.value === "tr"
    ? nextTheme === "light"
      ? "Aydınlık temaya geç"
      : "Karanlık temaya geç"
    : nextTheme === "light"
      ? "Switch to light theme"
      : "Switch to dark theme";

const menuLabel = computed(() =>
  isMenuOpen.value
    ? locale.value === "tr"
      ? "Header menüyü kapat"
      : "Close header navigation"
    : locale.value === "tr"
      ? "Header menüyü aç"
      : "Open header navigation"
);

const mobileNavLabel = computed(() =>
  locale.value === "tr" ? "Mobil navigasyon" : "Mobile navigation"
);

const getLanguageSwitchLabel = (nextLocale: typeof locales[number]) =>
  locale.value === "tr"
    ? `Arayüz dilini ${localeLabels[nextLocale]} yap`
    : `Switch interface language to ${localeLabels[nextLocale]}`;

const closeMenu = () => {
  if (!isMenuOpen.value) return;

  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement && activeElement.closest("#site-mobile-menu")) {
    menuButtonRef.value?.focus();
  }

  isMenuOpen.value = false;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// K (Home) tıklaması: zaten anasayfadaysak yönlendirme yerine sayfanın en başına
// hızlı/smooth scroll yap. Başka sayfadaysak normal link davranışı (/'e gider).
const onBrandHome = (event: MouseEvent) => {
  if (route.path !== "/") return; // farklı sayfa → NuxtLink normal çalışsın

  event.preventDefault();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
};

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
        duration: 650,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  });
};

const onScroll = () => {
  const currentY = window.scrollY;

  // Never hide while the mobile menu is open or near the very top of the page.
  if (isMenuOpen.value || currentY < 80) {
    isHidden.value = false;
    lastScrollY = currentY;
    return;
  }

  const delta = currentY - lastScrollY;

  // Small dead-zone so tiny jitters don't toggle the header.
  if (Math.abs(delta) < 6) return;

  isHidden.value = delta > 0;
  lastScrollY = currentY;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeMenu();
};

onMounted(() => {
  lastScrollY = window.scrollY;
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onKeydown);
});

watch(
  () => route.fullPath,
  () => {
    closeMenu();
  }
);
</script>

<template>
  <header class="site-header" :class="headerClass">
    <svg class="site-header__glass-filters" aria-hidden="true" focusable="false">
      <filter id="site-header-liquid-glass" x="-8%" y="-18%" width="116%" height="136%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.008"
          numOctaves="2"
          seed="92"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blur"
          scale="18"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>

    <div class="site-header__inner">
      <NuxtLink
        class="site-header__brand site-header__brand--ghost"
        to="/"
        :aria-label="brandLabel"
      >
        <BrandMark />
      </NuxtLink>

      <!-- TEK BAR — grid [1fr | K | 1fr]. Sol grup ve sağ grup eşit (1fr) pay alır,
           her biri KENDİ İÇİNDE sıkı; K iki grup arasında TAM ORTADA. -->
      <nav
        id="site-primary-nav"
        class="site-header__bar"
        :aria-label="primaryNavLabel"
      >
        <!-- SOL GRUP: Ürünler · Referanslar · Hakkımızda (sıkı, K'ye yaslı) -->
        <div class="site-header__group site-header__group--left">
          <template v-for="item in navLeft" :key="item.to">
            <span
              v-if="item.disabled"
              class="site-header__nav-link site-header__nav-link--disabled"
              aria-disabled="true"
            >
              {{ item.label }}
            </span>
            <NuxtLink
              v-else
              class="site-header__nav-link"
              :class="{ 'is-active': isActive(item.to) }"
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </div>

        <!-- ORTA: K = Home -->
        <NuxtLink
          class="site-header__nav-mark"
          to="/"
          :class="{ 'is-active': isActive('/') }"
          :aria-label="brandLabel"
          :aria-current="isActive('/') ? 'page' : undefined"
          @click="onBrandHome"
        >
          <span aria-hidden="true" />
        </NuxtLink>

        <!-- SAĞ GRUP: İletişim · tema · dil · (mobil) menü (sıkı, K'ye yaslı) -->
        <div class="site-header__group site-header__group--right">
          <template v-for="item in navRight" :key="item.to">
            <span
              v-if="item.disabled"
              class="site-header__nav-link site-header__nav-link--disabled"
              aria-disabled="true"
            >
              {{ item.label }}
            </span>
            <NuxtLink
              v-else
              class="site-header__nav-link"
              :class="{ 'is-active': isActive(item.to) }"
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
            >
              {{ item.label }}
            </NuxtLink>
          </template>

          <!-- Tema segmenti: GÜNEŞ + AY iki ayrı buton, aktif olan vurgulu. -->
          <div class="site-header__segment site-header__segment--theme" role="group" :aria-label="themeLabel">
            <button
              class="site-header__segment-button"
              :class="{ 'is-active': !isNight }"
              type="button"
              :aria-pressed="!isNight"
              :aria-label="getThemeSwitchLabel('light')"
              @click="switchThemeWithTransition('light', $event)"
            >
              <svg class="site-header__theme-icon" viewBox="0 0 24 24" aria-hidden="true">
                <!-- Güneş -->
                <circle cx="12" cy="12" r="4.2" />
                <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <line x1="12" y1="2.6" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="21.4" />
                  <line x1="2.6" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="21.4" y2="12" />
                  <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
                  <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
                  <line x1="5.2" y1="18.8" x2="6.9" y2="17.1" />
                  <line x1="17.1" y1="6.9" x2="18.8" y2="5.2" />
                </g>
              </svg>
            </button>
            <button
              class="site-header__segment-button"
              :class="{ 'is-active': isNight }"
              type="button"
              :aria-pressed="isNight"
              :aria-label="getThemeSwitchLabel('dark')"
              @click="switchThemeWithTransition('dark', $event)"
            >
              <svg class="site-header__theme-icon" viewBox="0 0 24 24" aria-hidden="true">
                <!-- Ay -->
                <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
              </svg>
            </button>
          </div>

          <!-- Dil segmenti: TR + EN iki ayrı buton, aktif olan vurgulu. -->
          <div class="site-header__segment site-header__segment--lang" role="group" :aria-label="languageLabel">
            <button
              v-for="code in locales"
              :key="code"
              class="site-header__segment-button site-header__segment-button--text"
              :class="{ 'is-active': locale === code }"
              type="button"
              :aria-pressed="locale === code"
              :aria-label="getLanguageSwitchLabel(code)"
              @click="setLocale(code)"
            >
              {{ localeLabels[code] }}
            </button>
          </div>

          <button
            ref="menuButtonRef"
            class="site-header__icon-button site-header__menu"
            type="button"
            :aria-label="menuLabel"
            :aria-expanded="isMenuOpen"
            aria-controls="site-mobile-menu"
            @click="toggleMenu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
    </div>

    <div
      id="site-mobile-menu"
      class="site-header__mobile-panel"
      :aria-hidden="!isMenuOpen"
      :inert="!isMenuOpen"
    >
      <nav class="site-header__mobile-nav" :aria-label="mobileNavLabel">
        <template v-for="item in navItems" :key="item.to">
          <span
            v-if="item.disabled"
            class="site-header__mobile-link site-header__mobile-link--disabled"
            aria-disabled="true"
          >
            {{ item.label }}
          </span>
          <NuxtLink
            v-else
            class="site-header__mobile-link"
            :class="{ 'is-active': isActive(item.to) }"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            @click="closeMenu"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </nav>
    </div>
  </header>

  <Teleport to="body">
    <!-- Symbol + KARDOOR: blends against the whole page like the cursor. -->
    <div
      class="brand-blend-layer brand-blend-layer--ink"
      aria-hidden="true"
    >
      <div class="brand-blend-layer__inner">
        <span class="site-header__brand brand-blend-layer__brand">
          <BrandMark />
        </span>
      </div>
    </div>

    <!-- EGE only: rendered normally on top so it keeps its blue. -->
    <div
      class="brand-blend-layer brand-blend-layer--ege"
      aria-hidden="true"
    >
      <div class="brand-blend-layer__inner">
        <span class="site-header__brand brand-blend-layer__brand">
          <BrandMark />
        </span>
      </div>
    </div>
  </Teleport>
</template>
