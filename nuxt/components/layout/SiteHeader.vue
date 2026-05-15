<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const route = useRoute();
const { isNight, theme, setTheme } = useShowroomAmbience();
const { locale, locales, localeLabels, setLocale } = useKardoorLocale();

const isScrolled = ref(false);
const isMenuOpen = ref(false);
const menuButtonRef = ref<HTMLButtonElement | null>(null);

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
    { to: "/doors", label: labels.products },
    { to: "/references", label: labels.references },
    { to: "/company", label: labels.about },
    { to: "/contact", label: labels.contact }
  ];
});

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";

  return route.path.startsWith(to);
};

const headerClass = computed(() => ({
  "site-header--scrolled": isScrolled.value,
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

const onScroll = () => {
  isScrolled.value = window.scrollY > 24;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeMenu();
};

onMounted(() => {
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
    <div class="site-header__inner">
      <NuxtLink class="site-header__brand" to="/" :aria-label="brandLabel">
        <BrandMark />
      </NuxtLink>

      <nav
        id="site-primary-nav"
        class="site-header__nav"
        :aria-label="primaryNavLabel"
        :aria-hidden="!isMenuOpen"
        :inert="!isMenuOpen"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          class="site-header__nav-link"
          :class="{ 'is-active': isActive(item.to) }"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="site-header__utility" :aria-label="utilitiesLabel">
        <div class="site-header__theme" :aria-label="themeLabel">
          <button
            class="site-header__theme-button"
            :class="{ 'is-active': theme === 'light' }"
            type="button"
            :aria-label="getThemeSwitchLabel('light')"
            :aria-pressed="theme === 'light'"
            @click="setTheme('light')"
          >
            Light
          </button>
          <button
            class="site-header__theme-button"
            :class="{ 'is-active': theme === 'dark' }"
            type="button"
            :aria-label="getThemeSwitchLabel('dark')"
            :aria-pressed="theme === 'dark'"
            @click="setTheme('dark')"
          >
            Dark
          </button>
        </div>

        <div class="site-header__language" :aria-label="languageLabel">
          <button
            v-for="availableLocale in locales"
            :key="availableLocale"
            class="site-header__language-button"
            :class="{ 'is-active': locale === availableLocale }"
            type="button"
            :aria-label="getLanguageSwitchLabel(availableLocale)"
            :aria-pressed="locale === availableLocale"
            @click="setLocale(availableLocale)"
          >
            {{ localeLabels[availableLocale] }}
          </button>
        </div>

        <button
          ref="menuButtonRef"
          class="site-header__icon-button site-header__menu"
          type="button"
          :aria-label="menuLabel"
          :aria-expanded="isMenuOpen"
          aria-controls="site-primary-nav site-mobile-menu"
          @click="toggleMenu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>

    <div
      id="site-mobile-menu"
      class="site-header__mobile-panel"
      :aria-hidden="!isMenuOpen"
      :inert="!isMenuOpen"
    >
      <nav class="site-header__mobile-nav" :aria-label="mobileNavLabel">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          class="site-header__mobile-link"
          :class="{ 'is-active': isActive(item.to) }"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          @click="closeMenu"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
