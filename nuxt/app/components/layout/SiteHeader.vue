<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";
import { useNuxtApp, useRoute } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";
import { useContentReveal } from "~/composables/useContentReveal";

/**
 * Site header — iki bağımsız parça:
 *
 *  1. SOL MARKA ("EGE KARDOOR"): sabit, sayfaya karşı difference-blend edilen
 *     ikiz katmanla birlikte çalışır. Navbar'dan tamamen ayrı, scroll'da
 *     gizlenmez. (bkz. site-header.css → brand-blend-layer)
 *  2. ORTA NAVBAR: ekranın üst kenarına yapışan koyu çubuk; alt köşeleri
 *     yuvarlak, üst köşelerinde ters (concave) flare'ler var ve ortasından
 *     K markası bir damla gibi aşağı sarkıyor. Aşağı scroll'da gizlenir,
 *     yukarı çekince geri gelir. Dar ekranda linkler damlaya dokununca açılan
 *     panele taşınır.
 */

const route = useRoute();
const { $smoother } = useNuxtApp();
const { locale, locales } = useKardoorLocale();

/**
 * Bu genişliğin altında linkler çubuktan panele taşınır ve yerine "Menü"
 * tuşu gelir. Sınır ölçümle bulundu: sol marka 163px + offset ≈ 192px yer
 * kaplıyor, tam nav ise ~610px; 1120'nin altında ikisi çakışıyor.
 */
const MENU_MODE_QUERY = "(max-width: 1120px)";

const isHidden = ref(false);
const isMenuOpen = ref(false);
const isHoveringNav = ref(false);

const navRoot = ref<HTMLElement | null>(null);
const navBarRevealRef = ref<HTMLElement | null>(null);
const panelWrap = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
// Navbar, perde açıldıktan sonra hero ile aynı anda belirir (bkz. useContentReveal).
useContentReveal({ targets: () => [navBarRevealRef.value] });

/**
 * Her öğe İKİ dildeki etiketini de taşır. Şablon, görünen etiketin altına
 * tüm varyantları görünmez bir ölçü katmanı olarak da basar; böylece link
 * genişliği her zaman en uzun varyant kadar olur ve dil değiştirince
 * çubuk yeniden ölçülenmez (damla yerinden oynamaz).
 */
const NAV_ENTRIES = [
  { to: "/", labels: { tr: "Ana Sayfa", en: "Home" } },
  { to: "/catalog", labels: { tr: "Koleksiyonlar", en: "Collections" } },
  { to: "/references", labels: { tr: "Referanslar", en: "References" } },
  { to: "/company", labels: { tr: "Hakkımızda", en: "About Us" } },
  { to: "/contact", labels: { tr: "İletişim", en: "Contact" } }
] as const;

const navItems = computed(() =>
  NAV_ENTRIES.map((entry) => ({
    to: entry.to,
    labels: entry.labels,
    label: entry.labels[locale.value]
  }))
);

// Çubuk düzeni: SOL [Ürünler · Referanslar · Hakkımızda] — ORTA [K = Home]
// — SAĞ [İletişim · tema · dil]. K ortadaki marka işareti olduğu için
// masaüstü link listelerinden ayrı durur; panelde ise (dar ekran) tüm
// öğeler Home dahil navItems'tan gelir.
const navLeft = computed(() =>
  navItems.value.filter(
    (item) => item.to === "/catalog" || item.to === "/references" || item.to === "/company"
  )
);
const navRight = computed(() => navItems.value.filter((item) => item.to === "/contact"));

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";

  return route.path.startsWith(to);
};

const headerClass = computed(() => ({
  "site-header--hidden": isHidden.value && !isHoveringNav.value,
  "site-header--menu-open": isMenuOpen.value
}));

const isTurkish = computed(() => locale.value === "tr");

const brandLabel = computed(() =>
  isTurkish.value ? "Kardoor ana sayfa" : "Kardoor home"
);

const primaryNavLabel = computed(() =>
  isTurkish.value ? "Ana navigasyon" : "Primary navigation"
);

const panelNavLabel = computed(() =>
  isTurkish.value ? "Mobil navigasyon" : "Mobile navigation"
);

const menuWord = computed(() => (isTurkish.value ? "Menü" : "Menu"));

const menuToggleLabel = computed(() => {
  if (isMenuOpen.value) {
    return isTurkish.value ? "Menüyü kapat" : "Close navigation";
  }

  return isTurkish.value ? "Menüyü aç" : "Open navigation";
});

/**
 * K'nin etiketi HER ZAMAN marka/ana sayfa. Önceden menü modunda
 * "Menüyü aç" diyordu — K artık menü açmıyor, yalnız ana sayfaya
 * gidiyor; o etiket ekran okuyucuya yanlış bilgi veriyordu.
 */
const logoLabel = brandLabel;

/* ── Menü animasyonu ───────────────────────────────────────────────────── */

let animationContext: ReturnType<typeof gsap.context> | null = null;
let menuTimeline: ReturnType<typeof gsap.timeline> | null = null;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getLogoElement = () =>
  navRoot.value?.querySelector<HTMLElement>(".site-nav__logo") ?? null;

const getPanelItems = () =>
  panel.value
    ? Array.from(
        panel.value.querySelectorAll<HTMLElement>(".site-nav__panel-link, .site-nav__panel-row")
      )
    : [];

const killMenuAnimation = (items = getPanelItems()) => {
  menuTimeline?.kill();
  menuTimeline = null;
  gsap.killTweensOf(panel.value ? [panel.value, ...items] : items);
};

/** Panel, damlanın merkezinden büyüyüp yine oraya kapanır. */
/**
 * ≤880px'te menü, K'den büyüyen bir kabarcık DEĞİL — çubuktan aşağı inen
 * bir PERDE. Referanstan ölçüldü (supaste.com 430x932): nav ekranın
 * tepesine yapışık, açılınca yüksekliği 50px → 506px büyüyor.
 */
const isPerdeModu = () =>
  import.meta.client && window.matchMedia("(max-width: 880px)").matches;

const setPanelOrigin = () => {
  if (!panel.value || !panelWrap.value) return;

  // Perde üst kenardan açılır; origin çubuğun üstü.
  if (isPerdeModu()) {
    gsap.set(panel.value, { transformOrigin: "50% 0%" });
    return;
  }

  const logo = getLogoElement();
  if (!logo) return;

  const logoRect = logo.getBoundingClientRect();
  const wrapRect = panelWrap.value.getBoundingClientRect();

  gsap.set(panel.value, {
    transformOrigin: `${logoRect.left + logoRect.width / 2 - wrapRect.left}px ${
      logoRect.top + logoRect.height / 2 - wrapRect.top
    }px`
  });
};

const runInAnimationContext = (callback: () => void) => {
  if (animationContext) animationContext.add(callback);
  else callback();
};

/**
 * Scroll kilidi: ScrollSmoother varsa onu duraklat (native scrollbar'ı
 * bozmaz), yoksa (dokunmatik cihazlar — smoother orada devre dışı) klasik
 * overflow kilidi.
 */
const setScrollLock = (locked: boolean) => {
  const smoother = ($smoother as undefined | (() => { paused: (value: boolean) => void } | null))?.();

  if (smoother) {
    smoother.paused(locked);
    return;
  }

  document.documentElement.style.overflow = locked ? "hidden" : "";
};

const openMenu = () => {
  isMenuOpen.value = true;
  setScrollLock(true);

  const items = getPanelItems();
  killMenuAnimation(items);
  setPanelOrigin();

  runInAnimationContext(() => {
    if (prefersReducedMotion()) {
      gsap.set(panel.value, { scale: 1, scaleY: 1, opacity: 1 });
      gsap.set(items, { y: 0, opacity: 1 });
      return;
    }

    // PERDE (mobil): yalnız DİKEY açılım. Yatayda panel zaten çubukla aynı
    // genişlikte; ölçeklenirse kenarlar oynar ve tek parça hissi bozulur.
    if (isPerdeModu()) {
      menuTimeline = gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .fromTo(panel.value, { scaleY: 0 }, { scaleY: 1, duration: 0.52 }, 0)
        .fromTo(
          items,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.045, ease: "power3.out" },
          0.16
        );
      return;
    }

    menuTimeline = gsap
      .timeline({ defaults: { ease: "power4.out" } })
      .fromTo(panel.value, { scale: 0.08, opacity: 1 }, { scale: 1, opacity: 1, duration: 0.66 }, 0)
      .fromTo(
        items,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.34, stagger: 0.055, ease: "power3.out" },
        0.22
      );
  });
};

const closeMenu = () => {
  if (!isMenuOpen.value) return;

  setScrollLock(false);

  // Odak panelin içindeyse damlaya geri ver — yoksa kapanan panelde asılı kalır.
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && activeElement.closest(".site-nav__panel")) {
    getLogoElement()?.focus();
  }

  const items = getPanelItems();
  killMenuAnimation(items);
  setPanelOrigin();

  const finishClose = () => {
    isMenuOpen.value = false;
  };

  runInAnimationContext(() => {
    if (prefersReducedMotion()) {
      gsap.set(panel.value, isPerdeModu() ? { scaleY: 0 } : { scale: 0.08, opacity: 0 });
      gsap.set(items, { y: 14, opacity: 0 });
      finishClose();
      return;
    }

    if (isPerdeModu()) {
      menuTimeline = gsap
        .timeline({ onComplete: finishClose })
        .to(
          items,
          { y: -8, opacity: 0, duration: 0.16, stagger: { each: 0.02, from: "end" }, ease: "power2.in" },
          0
        )
        .to(panel.value, { scaleY: 0, duration: 0.34, ease: "power3.in" }, 0.06);
      return;
    }

    menuTimeline = gsap
      .timeline({ onComplete: finishClose })
      .to(
        items,
        { y: -8, opacity: 0, duration: 0.18, stagger: { each: 0.025, from: "end" }, ease: "power2.in" },
        0
      )
      .to(panel.value, { scale: 0.08, opacity: 0, duration: 0.38, ease: "power4.in" }, 0.04);
  });
};

/* ── Etkileşimler ──────────────────────────────────────────────────────── */

const toggleMenu = () => {
  if (isMenuOpen.value) closeMenu();
  else openMenu();
};

/**
 * Damla (K) çift görevli:
 *  - dar ekranda menüyü açar/kapatır,
 *  - geniş ekranda ana sayfa bağlantısıdır. Zaten ana sayfadaysak yönlendirme
 *    yerine sayfanın en başına döner.
 */
const onLogoClick = (event: MouseEvent) => {
  // K yalnız ANA SAYFAYA döner. Eskiden menü modunda paneli açıyordu:
  // menünün iki ayrı tetikleyicisi olması (K + hamburger) kafa karıştırıyordu.
  // Tek giriş noktası sağdaki hamburger.
  if (route.path !== "/") return; // başka sayfa → NuxtLink normal çalışsın

  event.preventDefault();

  // Hero (EntranceDoorLab) tek-pinli scrub + portal auto-settle ile çalışıyor.
  // Düz scrollTo yukarı çıkarken portal-pull tarafından HOLD'a (kapı yarı açık)
  // kaçırılıyordu. Hero varsa ona olay gönder; o kendi settle'ıyla (pull
  // bastırılı) progress'i 0'a (kapı tam kapalı) götürür.
  if (document.querySelector(".entrance-lab")) {
    window.dispatchEvent(new CustomEvent("kardoor:home"));
    return;
  }

  const smoother = ($smoother as undefined | (() => { scrollTo: (y: number, smooth: boolean) => void } | null))?.();

  if (smoother) {
    smoother.scrollTo(0, !prefersReducedMotion());
  } else {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
};

/* ── Scroll & yaşam döngüsü ────────────────────────────────────────────── */

let lastScrollY = 0;

const onScroll = () => {
  const currentY = window.scrollY;

  // Menü açıkken ya da sayfanın en üstündeyken asla gizleme.
  if (isMenuOpen.value || currentY < 90) {
    isHidden.value = false;
    lastScrollY = currentY;
    return;
  }

  const delta = currentY - lastScrollY;

  // Küçük titremeler çubuğu zıplatmasın.
  if (Math.abs(delta) < 6) return;

  isHidden.value = delta > 0;
  lastScrollY = currentY;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeMenu();
};

// ref DEĞİL: Vue, ref'e konan MediaQueryList'i reactive proxy'ye sarar ve
// addEventListener'ın `this` bağlaması bozulur.
let menuModeQuery: MediaQueryList | null = null;

const onMenuModeChange = (event: MediaQueryListEvent | MediaQueryList) => {
  if (event.matches || !isMenuOpen.value) return;

  // Masaüstüne genişlerken panel display:none olur. Açılış tween'i yarıda
  // kalmışsa inline scale/opacity panelde asılı kalır → temizle.
  killMenuAnimation();
  setScrollLock(false);
  isMenuOpen.value = false;
  gsap.set([panel.value, ...getPanelItems()], { clearProps: "transform,opacity" });
};

onMounted(() => {
  if (navRoot.value) animationContext = gsap.context(() => {}, navRoot.value);

  menuModeQuery = window.matchMedia(MENU_MODE_QUERY);
  onMenuModeChange(menuModeQuery);
  menuModeQuery.addEventListener("change", onMenuModeChange);

  lastScrollY = window.scrollY;
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  menuTimeline?.kill();
  animationContext?.revert();
  menuModeQuery?.removeEventListener("change", onMenuModeChange);
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onKeydown);

  if (import.meta.client) document.documentElement.style.overflow = "";
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
    <!-- SOL MARKA — navbar'dan bağımsız, scroll'da gizlenmez. -->
    <div class="site-header__inner">
      <NuxtLink
        class="site-header__brand site-header__brand--ghost"
        to="/"
        :aria-label="brandLabel"
      >
        <BrandMark />
      </NuxtLink>
    </div>

    <div
      ref="navRoot"
      class="site-nav"
      @mouseenter="isHoveringNav = true"
      @mouseleave="isHoveringNav = false"
    >
      <div class="site-nav__hover-reveal" aria-hidden="true" />

      <div class="site-nav__shell">
        <nav ref="navBarRevealRef" class="site-nav__bar" :aria-label="primaryNavLabel">
          <div class="site-nav__group site-nav__group--left">
            <!-- Linkler panele taşındığı ara ölçülerde çubuğun sol tarafını
                 doldurur; damla ile aynı paneli açar. Geniş ekranda gizli. -->
            <button
              class="site-nav__menu-toggle"
              type="button"
              :aria-expanded="isMenuOpen"
              aria-controls="site-nav-panel"
              :aria-label="menuToggleLabel"
              @click="toggleMenu"
            >
              <span class="site-nav__menu-icon" aria-hidden="true">
                <span />
                <span />
              </span>
              {{ menuWord }}
            </button>

            <NuxtLink
              v-for="item in navLeft"
              :key="item.to"
              class="site-nav__link"
              :class="{ 'is-active': isActive(item.to) }"
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
            >
              <span class="site-nav__link-text">{{ item.label }}</span>
              <span class="site-nav__link-sizer" aria-hidden="true">
                <span v-for="code in locales" :key="code">{{ item.labels[code] }}</span>
              </span>
            </NuxtLink>
          </div>

          <!-- ORTA: çubuktan aşağı sarkan damla. Oyuk (mouth) + fillet'ler
               salt CSS; ölçüler site-header.css'teki --nav-* değişkenlerinden. -->
          <div class="site-nav__slot">
            <div class="site-nav__node">
              <NuxtLink
                class="site-nav__logo"
                to="/"
                :aria-label="logoLabel"
                :aria-current="isActive('/') ? 'page' : undefined"
                @click="onLogoClick"
              >
                <span class="site-nav__logo-mark">
                  <EgeLogo />
                </span>
              </NuxtLink>
            </div>
          </div>

          <div class="site-nav__group site-nav__group--right">
            <NuxtLink
              v-for="item in navRight"
              :key="item.to"
              class="site-nav__link"
              :class="{ 'is-active': isActive(item.to) }"
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
            >
              <span class="site-nav__link-text">{{ item.label }}</span>
              <span class="site-nav__link-sizer" aria-hidden="true">
                <span v-for="code in locales" :key="code">{{ item.labels[code] }}</span>
              </span>
            </NuxtLink>

            <span class="site-nav__divider" aria-hidden="true" />

            <SiteNavControls />
          </div>
        </nav>
      </div>

      <div
        class="site-nav__scrim"
        :class="{ 'is-open': isMenuOpen }"
        aria-hidden="true"
        @click="closeMenu"
      />

      <div ref="panelWrap" class="site-nav__panel-wrap" :class="{ 'is-open': isMenuOpen }">
        <div
          id="site-nav-panel"
          ref="panel"
          class="site-nav__panel"
          :aria-hidden="!isMenuOpen"
          :inert="!isMenuOpen"
        >
          <nav class="site-nav__panel-nav" :aria-label="panelNavLabel">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              class="site-nav__panel-link"
              :class="{ 'is-active': isActive(item.to) }"
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              @click="closeMenu"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <div class="site-nav__panel-row">
            <SiteNavControls />
          </div>
        </div>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <!-- Symbol + KARDOOR: blends against the whole page like the cursor. -->
    <div
      class="brand-blend-layer brand-blend-layer--ink"
      :class="{ 'is-dimmed': isMenuOpen }"
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
      :class="{ 'is-dimmed': isMenuOpen }"
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
