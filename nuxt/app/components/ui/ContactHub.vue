<script setup lang="ts">
/**
 * İLETİŞİM HUB'I
 *
 * Sayfanın sağ alt köşesine yapışan iletişim widget'ı. Kapalıyken tek bir
 * hap ("Bize ulaş" + zarf ikonu); tıklanınca üstünde panel açılıyor:
 * birincil eylem (/contact) + üç hızlı kanal (WhatsApp / telefon / e-posta).
 *
 * ÜÇ ŞEYİ AYNI ANDA YÖNETİYOR:
 *   1. Panel açılış/kapanışı — GSAP timeline, kademeli giriş
 *   2. Zarf ikonu — panelin durumunu yansıtır (kapalı/açık), boştayken süzülür
 *   3. Hero senkronu — ana sayfada kapı sahnesi ilerledikçe hub soluyor,
 *      showroom'a geçildiğinde tamamen kayboluyor (bkz. dosya sonundaki
 *      global stil bloğu)
 *
 * Görsel kimlik navbar'la ortak: aynı `--slab` renk ailesi ve aynı flare
 * kıvrımı (bkz. site-header.css). Navbar üstte sayfaya yapışıp alt
 * köşelerinden bağlanıyor; hub altta yapışıp üst/sol köşelerinden.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRoute } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const route = useRoute();
const { locale } = useKardoorLocale();

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const iconRef = ref<SVGSVGElement | null>(null);

/** Hub yalnız hero'lu sayfada görünür: ana sayfa. */
const isHomeRoute = computed(() => route.path === "/");

const copy = computed(() => {
  if (locale.value === "en") {
    return {
      toggle: isOpen.value ? "Close contact options" : "Open contact options",
      kicker: "Contact",
      title: "Contact us",
      primary: "Plan a project",
      whatsapp: "WhatsApp",
      phone: "Call",
      mail: "Email"
    };
  }
  return {
    toggle: isOpen.value ? "İletişim seçeneklerini kapat" : "İletişim seçeneklerini aç",
    kicker: "İletişim",
    title: "Bize ulaş",
    primary: "Proje planla",
    whatsapp: "WhatsApp",
    phone: "Ara",
    mail: "E-posta"
  };
});

/* ── PANEL AÇILIŞI / KAPANIŞI ────────────────────────────────────────────
   Sıra bilinçli: panel önce gelir (zemin oturur), sonra birincil eylem,
   en son üç kanal soldan sağa. Göz doğal olarak bu sırayı takip ediyor. */
const prefersReducedMotion = () =>
  import.meta.client &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let tl: gsap.core.Timeline | null = null;
let closeTimeout = 0;

const actionItems = () =>
  panelRef.value
    ? [...panelRef.value.querySelectorAll<HTMLElement>(".chub__action")]
    : [];

const primaryItem = () =>
  panelRef.value?.querySelector<HTMLElement>(".chub__primary") ?? null;

const openPanel = () => {
  const panel = panelRef.value;
  if (!panel) return;

  tl?.kill();

  if (prefersReducedMotion()) {
    gsap.set([panel, primaryItem(), ...actionItems()], { opacity: 1, y: 0, scale: 1 });
    return;
  }

  tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(panel,
      { opacity: 0, y: 14, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.36 }, 0)
    .fromTo(primaryItem(),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.28 }, 0.08)
    // 60ms'lik stagger: kanallar tek tek girer, blok halinde patlamaz.
    .fromTo(actionItems(),
      { opacity: 0, y: 12, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.06 }, 0.14);
};

const closePanel = () => {
  const panel = panelRef.value;
  if (!panel || !isOpen.value) {
    isOpen.value = false;
    return;
  }

  tl?.kill();

  if (prefersReducedMotion()) {
    isOpen.value = false;
    return;
  }

  // Kapanış açılışın tersi: kanallar sondan başlayarak çıkar.
  //
  // `isOpen` iki yoldan kapanır — timeline biterse `onComplete`, bitmezse
  // 520ms'lik zaman aşımı. İkincisi şart: tarayıcı arka plan sekmesinde
  // rAF'ı saniyede 1-2 kareye düşürüyor, GSAP ilerlemiyor ve panel açık
  // kilitli kalıyor. Hangisi önce çalışırsa diğerini iptal ediyor.
  let didClose = false;
  const finishClose = () => {
    if (didClose) return;
    didClose = true;
    window.clearTimeout(closeTimeout);
    isOpen.value = false;
  };

  closeTimeout = window.setTimeout(finishClose, 520);

  tl = gsap.timeline({ onComplete: finishClose });
  tl.to(actionItems(),
      { opacity: 0, y: 8, duration: 0.16, stagger: { each: 0.03, from: "end" }, ease: "power2.in" }, 0)
    .to(primaryItem(), { opacity: 0, y: 6, duration: 0.16, ease: "power2.in" }, 0.04)
    .to(panel, { opacity: 0, y: 10, scale: 0.97, duration: 0.22, ease: "power2.in" }, 0.1);
};

const togglePanel = () => {
  if (isOpen.value) {
    closePanel();
    return;
  }
  isOpen.value = true;
  requestAnimationFrame(openPanel);
};

/* ── KAPANMA YOLLARI ─────────────────────────────────────────────────────
   Panel dışına tıklama ve Escape. Dışa tıklamada tetiğin kendi olayı
   elenmeli: `pointerdown` `click`'ten önce ateşlendiği için hub kapalıyken
   tetiğe basıldığında bu handler `isOpen === false` görüp "dışarı tıklandı"
   sanıyor ve panel açılır açılmaz kapanıyor. */
const isTriggerTarget = (event: PointerEvent) =>
  event.target instanceof Node && !!triggerRef.value?.contains(event.target);

const onOutsidePointer = (event: PointerEvent) => {
  if (!rootRef.value) return;
  if (isTriggerTarget(event)) return;
  if (!isOpen.value) return;
  if (event.target instanceof Node && rootRef.value.contains(event.target)) return;
  closePanel();
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && isOpen.value) closePanel();
};

/* ── HERO SENKRONU ───────────────────────────────────────────────────────
   Ana sayfada kapı sahnesi ilerledikçe hub geride kalmalı: solar, hafifçe
   yukarı kayar, showroom'a geçildiğinde tıklanamaz olur.

   ScrollTrigger tek sefer kuruluyor ve `onUpdate` yalnız scroll
   değiştiğinde çalışıyor — boştayken sıfır maliyet. (Production sürümü
   bunu her karede `getComputedStyle` okuyarak yapıyor: saniyede 367 rAF.) */
let heroTrigger: ScrollTrigger | null = null;

const setupHeroSync = () => {
  heroTrigger?.kill();
  heroTrigger = null;

  if (!isHomeRoute.value || !rootRef.value) return;

  const hero = document.querySelector<HTMLElement>(".entrance-door, .entrance-lab");
  if (!hero) return;

  heroTrigger = ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => {
      const root = rootRef.value;
      if (!root) return;

      // Showroom fazında hub'ı `body.entrance-lab-showroom-on` kuralı
      // gizliyor. Buradan inline değer yazmak onu ezer — bırakıyoruz.
      if (document.body.classList.contains("entrance-lab-showroom-on")) {
        root.style.removeProperty("--chub-opacity");
        root.style.removeProperty("--chub-y");
        root.style.removeProperty("--chub-pointer");
        return;
      }

      // Kapı sahnesi ilerledikçe hub geride kalır.
      const visibility = 1 - self.progress;
      root.style.setProperty("--chub-opacity", String(visibility));
      root.style.setProperty("--chub-y", `${self.progress * -18}px`);
      root.style.setProperty("--chub-pointer", visibility > 0.08 ? "auto" : "none");
      if (visibility <= 0.08 && isOpen.value) closePanel();
    }
  });
};

/* ── ZARF İKONU ───────────────────────────────────────────────────────────
   İkon panelin durumunu yansıtıyor: panel kapalıysa zarf kapalı, açıksa
   açık. Ayrı bir kapatma simgesi (X) yok — zarfın hali yeterli.

   Kapak iki ayrı yol olarak çizili (aşağı V / yukarı Λ) ve aralarında
   opacity ile geçiliyor; tek yolu `scaleY: -1` ile çevirmek zarfı arkadan
   açılıyormuş gibi gösteriyor.

   Panel kapalıyken zarf çok hafif süzülüyor (1.2px) — hub'ın canlı
   olduğunu belli ediyor. Hover'da hareket yok: hover + açık/kapalı iki
   ayrı sinyal üretip kafa karıştırıyor.

   `prefers-reduced-motion` açıkken hiçbiri çalışmıyor. */
let idleTl: gsap.core.Timeline | null = null;

const envelopeParts = () => {
  const icon = iconRef.value;
  if (!icon) return null;
  // Gövde (`--box`) hiç animate edilmiyor, o yüzden burada yok.
  const flapClosed = icon.querySelector(".chub__icon-flap--closed");
  const flapOpen = icon.querySelector(".chub__icon-flap--open");
  const note = icon.querySelector(".chub__icon-note");
  if (!flapClosed || !flapOpen || !note) return null;
  return { icon, flapClosed, flapOpen, note };
};

/** Kapalı hal: aşağı bakan kapak görünür, kağıt gövdenin içinde saklı.
    `instant` — ilk kurulumda animasyonsuz, sonrasında geçişli. */
const closeEnvelope = (instant = false) => {
  const p = envelopeParts();
  if (!p) return;

  if (instant || prefersReducedMotion()) {
    gsap.set(p.flapClosed, { opacity: 1 });
    gsap.set(p.flapOpen, { opacity: 0 });
    gsap.set(p.note, { opacity: 0, y: 5 });
    return;
  }

  // Kağıt önce zarfa iner, kapak sonra kapanır — açılışın tersi sıra.
  gsap.timeline({ defaults: { ease: "power2.inOut" } })
    .to(p.note, { opacity: 0, y: 5, duration: 0.22 }, 0)
    .to(p.flapOpen, { opacity: 0, duration: 0.26 }, 0.06)
    .to(p.flapClosed, { opacity: 1, duration: 0.26 }, 0.06);
};

const startIdleFloat = () => {
  const p = envelopeParts();
  if (!p || prefersReducedMotion() || isOpen.value) return;

  idleTl?.kill();
  idleTl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
  idleTl.to(p.icon, { y: -1.2, duration: 1.7 }, 0);
};

const stopIdleFloat = () => {
  idleTl?.kill();
  idleTl = null;
  const p = envelopeParts();
  if (p) gsap.set(p.icon, { y: 0 });
};

/** Açık hal: kapak öne devrilir, kağıt gövdenin arkasından yükselir. */
const openEnvelope = () => {
  const p = envelopeParts();
  if (!p || prefersReducedMotion()) return;
  gsap.timeline({ defaults: { ease: "power3.out" } })
    .to(p.flapClosed, { opacity: 0, duration: 0.24 }, 0)
    .to(p.flapOpen, { opacity: 1, duration: 0.28 }, 0.04)
    .to(p.note, { opacity: 1, y: 0, duration: 0.34 }, 0.12);
};

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger);
  window.addEventListener("pointerdown", onOutsidePointer, { passive: true });
  window.addEventListener("keydown", onKeydown);
  setupHeroSync();
  requestAnimationFrame(() => {
    closeEnvelope(true);
    startIdleFloat();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onOutsidePointer);
  window.removeEventListener("keydown", onKeydown);
  tl?.kill();
  idleTl?.kill();
  heroTrigger?.kill();
  window.clearTimeout(closeTimeout);
});

watch(() => route.fullPath, () => {
  isOpen.value = false;
  requestAnimationFrame(setupHeroSync);
});

/** Panel açılınca zarf açılır ve nefes durur; kapanınca tersi. */
watch(isOpen, (nowOpen) => {
  if (nowOpen) {
    stopIdleFloat();
    requestAnimationFrame(openEnvelope);
    return;
  }
  requestAnimationFrame(() => {
    closeEnvelope();
    startIdleFloat();
  });
});
</script>

<template>
  <!-- `<Teleport to="body">` ŞART: bileşen `#smooth-content` içinde kalıyor
       ve o katman ScrollSmoother yüzünden transform taşıyor; transform'lu
       ata `position: fixed`i kırıyor. -->
  <Teleport to="body">
    <aside
      v-show="isHomeRoute"
      ref="rootRef"
      class="chub"
      :class="{ 'is-open': isOpen }"
    >
      <div
        ref="panelRef"
        class="chub__panel"
        :aria-hidden="!isOpen"
        :inert="!isOpen"
      >
        <NuxtLink class="chub__primary" to="/contact" @click="closePanel">
          <span class="chub__primary-copy">
            <small>{{ copy.kicker }}</small>
            {{ copy.primary }}
          </span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M9 7H17V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </NuxtLink>

        <div class="chub__actions">
          <a
            class="chub__action"
            href="https://wa.me/905377765300"
            target="_blank"
            rel="noopener noreferrer"
            @click="closePanel"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.79 1.48h.01c6.57 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.47-8.44ZM12.08 21.82h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.73.98.99-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.29c0-5.46 4.45-9.9 9.92-9.9a9.86 9.86 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.92 9.9Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
            </svg>
            <span>{{ copy.whatsapp }}</span>
          </a>

          <a class="chub__action" href="tel:+905377765300" @click="closePanel">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8.45 5.35L10.15 9.15C10.38 9.68 10.25 10.28 9.82 10.65L8.65 11.68C9.55 13.52 11.02 15 12.88 15.92L13.92 14.72C14.28 14.3 14.88 14.17 15.4 14.4L19.2 16.1C19.82 16.38 20.15 17.05 19.98 17.72L19.58 19.28C19.4 19.98 18.78 20.45 18.05 20.42C10.08 20.05 3.95 13.92 3.58 5.95C3.55 5.22 4.02 4.6 4.72 4.42L6.78 4.02C7.45 3.85 8.18 4.72 8.45 5.35Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ copy.phone }}</span>
          </a>

          <a class="chub__action" href="mailto:info@kardoor.com" @click="closePanel">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4.25 7.75H19.75C20.58 7.75 21.25 8.42 21.25 9.25V16.75C21.25 17.58 20.58 18.25 19.75 18.25H4.25C3.42 18.25 2.75 17.58 2.75 16.75V9.25C2.75 8.42 3.42 7.75 4.25 7.75Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M3.75 8.75L12 14L20.25 8.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ copy.mail }}</span>
          </a>
        </div>
      </div>

      <button
        ref="triggerRef"
        class="chub__trigger"
        type="button"
        :aria-label="copy.toggle"
        :aria-expanded="isOpen"
        @click="togglePanel"
      >
        <!-- Kicker yok: tetikte "İLETİŞİM" + "Bize ulaş" aynı şeyi iki kez
             söylüyor. Panel içindeki birincil eylemde duruyor. -->
        <span class="chub__trigger-copy">{{ copy.title }}</span>

        <span class="chub__trigger-icon" aria-hidden="true">
          <!-- ZARF — üç parça, çizim sırası katman sırası:
               kağıt (arkada) → gövde (kağıdın altını örter) → kapak (üstte).
               Kağıt ve gövde `fill` taşıyor; boş bırakılırsa arkadaki kapak
               çizgisi kağıdın ortasından geçip çubuk gibi görünüyor. -->
          <svg ref="iconRef" class="chub__icon" viewBox="0 0 24 24" fill="none">
            <rect
              class="chub__icon-note"
              x="7.5" y="3" width="9" height="10" rx="1"
              fill="var(--chub-bar)" stroke="currentColor" stroke-width="1.6"
            />
            <rect
              class="chub__icon-box"
              x="3" y="7" width="18" height="11" rx="2"
              fill="var(--chub-bar)" stroke="currentColor" stroke-width="1.9"
            />
            <path
              class="chub__icon-flap chub__icon-flap--closed"
              d="M3 7.6L12 13.5L21 7.6"
              stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"
            />
            <path
              class="chub__icon-flap chub__icon-flap--open"
              d="M3 7.6L12 1.8L21 7.6"
              stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>
    </aside>
  </Teleport>
</template>

<style scoped>
/* ── KİMLİK ──────────────────────────────────────────────────────────────
   Renk ailesi navbar'la ORTAK: ikisi de `--slab` üçlüsünden besleniyor
   (bkz. site-header.css). `--nav-bar` doğrudan kullanılamıyor — o token
   yalnız `.site-nav` kapsamında tanımlı, dışarıdan okununca boş dönüyor. */
.chub {
  --chub-bar: var(--slab);
  --chub-ink: var(--slab-fg);
  --chub-ink-dim: var(--slab-soft);
  --chub-radius: 18px;
  --chub-gap: 12px;
  /* Flare = tetiğin üst kenarındaki içbükey kıvrım; navbar'ın imzası. */
  --chub-flare: 18px;
  --chub-size: 60px;
  --chub-opacity: 1;
  --chub-y: 0px;
  --chub-pointer: auto;

  position: fixed;
  /* Köşeye YAPIŞIK duruyor — kenar boşluğu yok. Flare kıvrımı ancak iki
     yüzey bitişikse anlam kazanıyor; havada duran kutuda tutunacak yüzey
     olmuyor. Navbar'ın ayna simetriği: o üstte yapışıp alt köşelerinden
     bağlanıyor, hub altta yapışıp üst/sol köşelerinden. */
  right: 0;
  bottom: 0;
  z-index: 82;
  display: grid;
  justify-items: end;
  gap: var(--chub-gap);
  font-family: var(--header-font, var(--font-body));
  opacity: var(--chub-opacity);
  /* The wrapper is pure layout. It kept `pointer-events: auto`, and because the
     CLOSED panel still takes up its grid cell the box measured 286x220 in the
     bottom-right corner at z-index 82 — above everything — so it swallowed any
     swipe that started there (measured on a 390x844 phone: it sat right on the
     hero CTA). Only the real controls take pointers. */
  pointer-events: none;
  transform: translate3d(0, var(--chub-y), 0);
  will-change: opacity, transform;
}

.chub__trigger {
  pointer-events: var(--chub-pointer);
}

/* ── PANEL ───────────────────────────────────────────────────────────── */
.chub__panel {
  position: relative;
  display: grid;
  gap: 8px;
  width: min(292px, calc(100vw - 36px));
  padding: 10px;
  /* Sağ kenara yapışık: sağ alt köşe düz, diğerleri yuvarlak. */
  border-radius: var(--chub-radius) 0 0 var(--chub-radius);
  background: var(--chub-bar);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.32);
  /* Kapalı başlangıç CSS'in, geçiş GSAP'in. `is-open` gelince CSS
     opacity'yi serbest bırakıyor ve GSAP devralıyor — ikisi aynı anda
     aynı property'yi sürerse tween başlangıç değerinde takılıyor. */
  opacity: 0;
  pointer-events: none;
}

.chub.is-open .chub__panel {
  opacity: 1;
  pointer-events: var(--chub-pointer);
}

/* ── BİRİNCİL EYLEM ──────────────────────────────────────────────────── */
.chub__primary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 62px;
  padding: 12px 14px 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.07);
  color: var(--chub-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.1;
  text-decoration: none;
  transition: background 0.24s var(--ease-soft);
}

.chub__primary:hover {
  background: rgba(255, 255, 255, 0.12);
}

.chub__primary-copy {
  display: grid;
  gap: 3px;
  text-align: left;
  white-space: nowrap;
}

.chub__primary-copy small {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--chub-ink-dim);
}

.chub__primary svg {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

/* ── ÜÇ EYLEM ────────────────────────────────────────────────────────── */
.chub__actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}

.chub__action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 62px;
  padding: 9px 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--chub-ink);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition: background 0.24s var(--ease-soft);
}

.chub__action:hover {
  background: rgba(255, 255, 255, 0.11);
}

.chub__action svg {
  width: 21px;
  height: 21px;
}

/* WhatsApp ikonu dolu çizim (fill), diğer ikisi çizgi (stroke + fill="none"
   attribute'u). Yalnız dolu olana renk veriyoruz. */
.chub__action > svg:not([fill="none"]) {
  fill: currentColor;
}

/* ── TETİK ───────────────────────────────────────────────────────────── */
.chub__trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: var(--chub-size);
  padding: 8px 22px 8px 19px;
  border: 0;
  /* Yalnız SOL ÜST köşe yuvarlak — sağ ve alt kenarlar ekrana yapışık,
     kıvrımı flare veriyor. Navbar'ın "üst köşeler düz, alt köşeler
     yuvarlak" kuralının ayna simetriği. */
  border-radius: var(--chub-radius) 0 0 0;
  background: var(--chub-bar);
  color: var(--chub-ink);
  font: inherit;
  cursor: pointer;
  box-shadow: -8px -8px 38px rgba(0, 0, 0, 0.28);
  transition: filter 0.28s var(--ease-soft);
}

.chub__trigger:hover {
  filter: brightness(1.12);
}

/* ── FLARE: İKİ KÖŞEDE ────────────────────────────────────────────────────
   Navbar'da flare çubuğun İKİ yan ucunda; hub sağ alt köşede olduğu için
   ikisi de tetiğin dışına bakıyor:

     ::before → ÜST kenarda, yukarı kıvrılır (tetiği sağ kenara bağlar)
     ::after  → SOL kenarda, sola kıvrılır (tetiği alt kenara bağlar)

   İkisi birlikte tetiği köşeye "kaynatıyor" — navbar imzasının ayna
   simetriği. */
.chub__trigger::before,
.chub__trigger::after {
  content: "";
  position: absolute;
  width: var(--chub-flare);
  height: var(--chub-flare);
  pointer-events: none;
}

/* Üst köşe: tetiğin üstünde, sağ kenara yaslı. */
.chub__trigger::before {
  bottom: 100%;
  right: 0;
  background: radial-gradient(
    circle at top left,
    transparent var(--chub-flare),
    var(--chub-bar) calc(var(--chub-flare) + 0.5px)
  );
}

/* Sol köşe: tetiğin solunda, alt kenara yaslı. */
.chub__trigger::after {
  right: 100%;
  bottom: 0;
  background: radial-gradient(
    circle at top left,
    transparent var(--chub-flare),
    var(--chub-bar) calc(var(--chub-flare) + 0.5px)
  );
}

.chub__trigger:focus-visible {
  outline: 2px solid var(--chub-ink);
  outline-offset: 3px;
}

.chub__trigger-copy {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}

.chub__trigger-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: calc(var(--chub-size) - 16px);
  height: calc(var(--chub-size) - 16px);
  border-radius: 999px;
  background: var(--brand-700);
  color: #fff;
}

/* Zarfın tüm hareketini GSAP sürüyor — burada `transition` YOK, ikisi
   aynı property'yi yönetirse çakışıyor. */
.chub__icon {
  width: 24px;
  height: 24px;
}

/* Açık kapak başlangıçta gizli: GSAP açılışta devralıyor. */
.chub__icon-flap--open {
  opacity: 0;
}

/* ── MOBİL ───────────────────────────────────────────────────────────── */
@media (max-width: 720px) {
  /* Köşeye yapışıklık MOBİLDE DE korunuyor — kenar boşluğu verilirse flare
     kıvrımının bağlanacağı yüzey kalmıyor. Güvenli alan payı yalnız iç
     dolguya ekleniyor (aşağıda), konuma değil. */
  .chub {
    --chub-size: 56px;
  }

  .chub__panel {
    width: min(286px, calc(100vw - 28px));
  }

  /* Dar ekranda tetik yalnız ikon: metin yer yiyor. Sağ/alt dolgu güvenli
     alanı da içeriyor (çentikli ekranlarda ikon kenara sıkışmasın). */
  .chub__trigger {
    padding:
      8px
      calc(8px + env(safe-area-inset-right))
      calc(8px + env(safe-area-inset-bottom))
      8px;
    border-radius: var(--chub-radius) 0 0 0;
  }

  .chub__trigger-copy {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chub,
  .chub * {
    transition-duration: 0.01ms;
  }
}
</style>

<!--
  KAPIDAN İÇERİ GİRİNCE GİZLEN

  `EntranceDoorLab` showroom fazına girdiğinde `<body>`'ye
  `entrance-lab-showroom-on` sınıfı koyuyor. Hub o an kayboluyor: kapı
  açılıp içeri girildikten sonra sahnenin önünde durmamalı.

  Kural GLOBAL blokta olmak zorunda: hub `<Teleport to="body">` ile gövdeye
  taşınıyor, scoped stil ona `body` üzerinden ulaşamıyor.
-->
<style>
body.entrance-lab-showroom-on .chub {
  /* `!important` ŞART: hub'ın kendi kuralı scoped (`[data-v-*]` niteliği
     taşıyor) ve bu global bloktan daha spesifik. Değişkeni ezmek de
     yetmiyor — scoped kural `opacity: var(--chub-opacity)` yazarken
     kendi kapsamındaki değeri okuyor. */
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translate3d(0, 16px, 0) !important;
  transition: opacity 400ms ease, transform 400ms ease;
}
</style>
