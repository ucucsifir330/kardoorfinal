<script setup lang="ts">
/**
 * İLETİŞİM HUB'I — LAB SÜRÜMÜ
 *
 * FloatingContactHub.vue'nun yerine geçmek üzere SIFIRDAN yazıldı.
 * Production dosyasına dokunulmuyor.
 *
 * Eski sürümün dertleri (ölçüldü, 2026-08-05):
 *   • rAF SONSUZ DÖNGÜSÜ: saniyede 367 çağrı. Her karede hero'nun
 *     `getComputedStyle`'ını okuyup CSS değişkeni yazıyordu — ana sayfada
 *     hiç durmadan. Burada ScrollTrigger tek sefer kuruluyor, polling yok.
 *   • Tek elemanda 711 karakterlik Tailwind sınıf dizisi (toplam 4143).
 *     Stiller artık scoped CSS'te.
 *   • Animasyon düz CSS transition'dı; GSAP timeline'a alındı — eylemler
 *     kademeli giriyor (stagger).
 *   • Kendi cam sistemi vardı, navbar'la aynı aileden görünmüyordu.
 *     Şimdi navbar token'larını paylaşıyor + flare kıvrımı taşıyor.
 *
 * Tasarım kararı (kullanıcı, 2026-08-05):
 *   renk/biçim → navbar gibi flare'li kart
 *   açılış     → kademeli: panel yükselir, eylemler sırayla girer
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRoute } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const props = withDefaults(defineProps<{
  /** Lab sayfasında hero yok; hub'ı yine de göster. */
  forceVisible?: boolean;
}>(), { forceVisible: false });

const route = useRoute();
const { locale } = useKardoorLocale();

const acik = ref(false);
const kokRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const tetikRef = ref<HTMLButtonElement | null>(null);

/** Hub yalnız hero'lu sayfada: ana sayfa. Lab bunu aşabilir. */
const anaSayfaMi = computed(() => props.forceVisible || route.path === "/");

const metin = computed(() => {
  if (locale.value === "en") {
    return {
      toggle: acik.value ? "Close contact options" : "Open contact options",
      kicker: "Contact",
      title: "Let's talk",
      primary: "Plan a project",
      whatsapp: "WhatsApp",
      phone: "Call",
      mail: "Email"
    };
  }
  return {
    toggle: acik.value ? "İletişim seçeneklerini kapat" : "İletişim seçeneklerini aç",
    kicker: "İletişim",
    title: "Görüşelim",
    primary: "Proje planla",
    whatsapp: "WhatsApp",
    phone: "Ara",
    mail: "E-posta"
  };
});

/* ── AÇILIŞ: KADEMELİ ─────────────────────────────────────────────────────
   Panel yükselir, sonra üç eylem sırayla girer. Eski sürümde düz CSS
   transition vardı — hepsi aynı anda geliyordu, dikkat sırası yoktu. */
const azHareket = () =>
  import.meta.client &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let tl: gsap.core.Timeline | null = null;

const eylemler = () =>
  panelRef.value
    ? [...panelRef.value.querySelectorAll<HTMLElement>(".chub__action")]
    : [];

const birincil = () =>
  panelRef.value?.querySelector<HTMLElement>(".chub__primary") ?? null;

const ac = () => {
  const panel = panelRef.value;
  if (!panel) return;

  tl?.kill();

  if (azHareket()) {
    gsap.set([panel, birincil(), ...eylemler()], { opacity: 1, y: 0, scale: 1 });
    return;
  }

  tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(panel,
      { opacity: 0, y: 14, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.36 }, 0)
    .fromTo(birincil(),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.28 }, 0.08)
    // Eylemler kademeli: soldan sağa, her biri 60ms arayla.
    .fromTo(eylemler(),
      { opacity: 0, y: 12, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.06 }, 0.14);
};

const kapat = () => {
  const panel = panelRef.value;
  if (!panel || !acik.value) {
    acik.value = false;
    return;
  }

  tl?.kill();

  if (azHareket()) {
    acik.value = false;
    return;
  }

  // Kapanış açılışın tersi: eylemler önce ve sondan başlayarak çıkar.
  tl = gsap.timeline({ onComplete: () => { acik.value = false; } });
  tl.to(eylemler(),
      { opacity: 0, y: 8, duration: 0.16, stagger: { each: 0.03, from: "end" }, ease: "power2.in" }, 0)
    .to(birincil(), { opacity: 0, y: 6, duration: 0.16, ease: "power2.in" }, 0.04)
    .to(panel, { opacity: 0, y: 10, scale: 0.97, duration: 0.22, ease: "power2.in" }, 0.1);
};

const cevir = () => {
  if (acik.value) {
    kapat();
    return;
  }
  acik.value = true;
  requestAnimationFrame(ac);
};

/**
 * Dışa tıklama, tetiğin KENDİ tıklamasını yakalamamalı.
 *
 * `pointerdown` `click`'ten ÖNCE ateşleniyor: hub kapalıyken tetiğe
 * basıldığında `acik` hâlâ false oluyor, erken çıkış çalışmıyor ve panel
 * açılır açılmaz kapanıyordu (ölçüldü: 279ms'de opacity 1 → 0).
 * Tetiğin içinden gelen pointerdown'ı ayrıca eliyoruz.
 */

/* ── Kapanma yolları ─────────────────────────────────────────────────── */
/** Tetiğe basılan pointerdown'ı işaretle — açılışı yemesin. */
const tetigeMiBasildi = (event: PointerEvent) =>
  event.target instanceof Node && !!tetikRef.value?.contains(event.target);

const disaTiklama = (event: PointerEvent) => {
  if (!kokRef.value) return;
  // Tetiğe basıldıysa karar `cevir`'in: pointerdown click'ten önce geldiği
  // için burada kapatmak açılışı anında geri alıyordu.
  if (tetigeMiBasildi(event)) return;
  if (!acik.value) return;
  if (event.target instanceof Node && kokRef.value.contains(event.target)) return;
  kapat();
};


const klavye = (event: KeyboardEvent) => {
  if (event.key === "Escape" && acik.value) kapat();
};

/* ── HERO SENKRONU: POLLING YOK ───────────────────────────────────────────
   Eski sürüm her karede hero'nun computed style'ını okuyordu (ölçüldü:
   saniyede 367 rAF çağrısı). Aynı iş ScrollTrigger ile tek seferde kurulur:
   hero'nun kapı sahnesi ilerledikçe hub solar, showroom'a geçince kaybolur.

   `onUpdate` yalnız scroll değiştiğinde çalışır — boşta hiç maliyeti yok. */
let heroTrigger: ScrollTrigger | null = null;

const heroSenkronKur = () => {
  heroTrigger?.kill();
  heroTrigger = null;

  if (!anaSayfaMi.value || !kokRef.value) return;

  const hero = document.querySelector<HTMLElement>(".entrance-door, .entrance-lab");
  if (!hero) return;

  heroTrigger = ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => {
      const kok = kokRef.value;
      if (!kok) return;
      // Kapı sahnesi ilerledikçe hub geride kalır.
      const gorunurluk = 1 - self.progress;
      kok.style.setProperty("--chub-opacity", String(gorunurluk));
      kok.style.setProperty("--chub-y", `${self.progress * -18}px`);
      kok.style.setProperty("--chub-pointer", gorunurluk > 0.08 ? "auto" : "none");
      if (gorunurluk <= 0.08 && acik.value) kapat();
    }
  });
};

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger);
  window.addEventListener("pointerdown", disaTiklama, { passive: true });
  window.addEventListener("keydown", klavye);
  heroSenkronKur();
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", disaTiklama);
  window.removeEventListener("keydown", klavye);
  tl?.kill();
  heroTrigger?.kill();
});

watch(() => route.fullPath, () => {
  acik.value = false;
  requestAnimationFrame(heroSenkronKur);
});
</script>

<template>
  <aside
    v-show="anaSayfaMi"
    ref="kokRef"
    class="chub"
    :class="{ 'is-open': acik }"
  >
    <div
      ref="panelRef"
      class="chub__panel"
      :aria-hidden="!acik"
      :inert="!acik"
    >
      <NuxtLink class="chub__primary" to="/contact" @click="kapat">
        <span class="chub__primary-copy">
          <small>{{ metin.kicker }}</small>
          {{ metin.primary }}
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
          @click="kapat"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.79 1.48h.01c6.57 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.47-8.44ZM12.08 21.82h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.73.98.99-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.29c0-5.46 4.45-9.9 9.92-9.9a9.86 9.86 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.92 9.9Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
          </svg>
          <span>{{ metin.whatsapp }}</span>
        </a>

        <a class="chub__action" href="tel:+905377765300" @click="kapat">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8.45 5.35L10.15 9.15C10.38 9.68 10.25 10.28 9.82 10.65L8.65 11.68C9.55 13.52 11.02 15 12.88 15.92L13.92 14.72C14.28 14.3 14.88 14.17 15.4 14.4L19.2 16.1C19.82 16.38 20.15 17.05 19.98 17.72L19.58 19.28C19.4 19.98 18.78 20.45 18.05 20.42C10.08 20.05 3.95 13.92 3.58 5.95C3.55 5.22 4.02 4.6 4.72 4.42L6.78 4.02C7.45 3.85 8.18 4.72 8.45 5.35Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>{{ metin.phone }}</span>
        </a>

        <a class="chub__action" href="mailto:info@kardoor.com" @click="kapat">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4.25 7.75H19.75C20.58 7.75 21.25 8.42 21.25 9.25V16.75C21.25 17.58 20.58 18.25 19.75 18.25H4.25C3.42 18.25 2.75 17.58 2.75 16.75V9.25C2.75 8.42 3.42 7.75 4.25 7.75Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3.75 8.75L12 14L20.25 8.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>{{ metin.mail }}</span>
        </a>
      </div>
    </div>

    <button
      ref="tetikRef"
      class="chub__trigger"
      type="button"
      :aria-label="metin.toggle"
      :aria-expanded="acik"
      @click="cevir"
    >
      <span class="chub__trigger-copy">
        <small>{{ metin.kicker }}</small>
        {{ metin.title }}
      </span>
      <span class="chub__trigger-icon" aria-hidden="true">
        <svg class="chub__icon chub__icon--chat" viewBox="0 0 24 24" fill="none">
          <path d="M5.6 17.35C4.22 16.05 3.5 14.36 3.5 12.5C3.5 8.63 7.31 5.5 12 5.5C16.69 5.5 20.5 8.63 20.5 12.5C20.5 16.37 16.69 19.5 12 19.5C11.09 19.5 10.21 19.38 9.39 19.16L5.25 20.35L5.6 17.35Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.75 12.35H15.25" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
          <path d="M8.75 15H12.45" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
        </svg>
        <svg class="chub__icon chub__icon--close" viewBox="0 0 24 24" fill="none">
          <path d="M7 7L17 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          <path d="M17 7L7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </span>
    </button>
  </aside>
</template>

<style scoped>
/* ── KİMLİK: NAVBAR AİLESİ ────────────────────────────────────────────────
   Renkler navbar token'larından geliyor (`--nav-bar`, `--nav-ink`), böylece
   ikisi aynı aileden okunuyor. Eski sürüm kendi cam sistemini kuruyordu ve
   navbar'la uyuşmuyordu. */
.chub {
  /* `--nav-bar` DEĞİL: o token yalnız `.site-nav` kapsamında tanımlı,
     buradan okununca boş dönüyor (ölçüldü). Navbar'ın KENDİSİ de
     `--slab` ailesinden besleniyor (site-header.css:234) — aynı kaynağa
     bağlanınca ikisi gerçekten tek aile oluyor. */
  --chub-bar: var(--slab);
  --chub-ink: var(--slab-fg);
  --chub-ink-dim: var(--slab-soft);
  --chub-line: rgba(255, 255, 255, 0.14);
  --chub-radius: 18px;
  --chub-flare: 16px;
  --chub-size: 60px;
  --chub-opacity: 1;
  --chub-y: 0px;
  --chub-pointer: auto;

  position: fixed;
  right: clamp(18px, 2.45vw, 42px);
  bottom: clamp(18px, 2.3vw, 34px);
  z-index: 82;
  display: grid;
  justify-items: end;
  gap: 12px;
  font-family: var(--header-font, var(--font-body));
  opacity: var(--chub-opacity);
  pointer-events: var(--chub-pointer);
  transform: translate3d(0, var(--chub-y), 0);
  will-change: opacity, transform;
}

/* ── PANEL ───────────────────────────────────────────────────────────── */
.chub__panel {
  position: relative;
  display: grid;
  gap: 8px;
  width: min(292px, calc(100vw - 36px));
  padding: 10px;
  border-radius: var(--chub-radius);
  background: var(--chub-bar);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.32);
  /* Başlangıç durumu GSAP'e ait DEĞİL, CSS'e: panel kapalıyken görünmez.
     `is-open` sınıfı gelince CSS opacity'yi serbest bırakıyor, GSAP oradan
     devralıyor. İkisi aynı anda aynı property'yi yönetirse tween başlangıç
     değerinde takılıyor (ölçüldü: opacity 0'da kaldı). */
  opacity: 0;
  pointer-events: none;
}

.chub.is-open .chub__panel {
  opacity: 1;
}

.chub.is-open .chub__panel {
  pointer-events: auto;
}

/* Navbar imzası: panelin alt kenarında içbükey flare kıvrımı. Tetik hapıyla
   panel arasındaki boşlukta duruyor, ikisini tek gövde gibi bağlıyor. */
.chub__panel::after {
  content: "";
  position: absolute;
  top: 100%;
  right: var(--chub-flare);
  width: var(--chub-flare);
  height: var(--chub-flare);
  pointer-events: none;
  background: radial-gradient(
    circle at bottom right,
    transparent var(--chub-flare),
    var(--chub-bar) calc(var(--chub-flare) + 0.5px)
  );
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

.chub__primary-copy small,
.chub__trigger-copy small {
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

.chub__action svg[fill="none"] {
  fill: none;
}

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
  padding: 8px 8px 8px 19px;
  border: 0;
  border-radius: var(--chub-radius);
  background: var(--chub-bar);
  color: var(--chub-ink);
  font: inherit;
  cursor: pointer;
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.30);
  transition: transform 0.28s var(--ease-soft);
}

.chub__trigger:hover {
  transform: translateY(-2px);
}

.chub__trigger:focus-visible {
  outline: 2px solid var(--chub-ink);
  outline-offset: 3px;
}

.chub__trigger-copy {
  display: grid;
  gap: 3px;
  text-align: left;
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

/* İkon geçişi navbar'daki hamburger→X ile aynı dil. */
.chub__icon {
  position: absolute;
  width: 24px;
  height: 24px;
  transition: opacity 0.22s var(--ease-soft), transform 0.22s var(--ease-soft);
}

.chub__icon--chat {
  opacity: 1;
}

.chub__icon--close {
  opacity: 0;
  transform: scale(0.76) rotate(-45deg);
}

.chub.is-open .chub__icon--chat {
  opacity: 0;
  transform: scale(0.76) rotate(45deg);
}

.chub.is-open .chub__icon--close {
  opacity: 1;
  transform: scale(1) rotate(0);
}

/* ── MOBİL ───────────────────────────────────────────────────────────── */
@media (max-width: 720px) {
  .chub {
    --chub-size: 56px;
    right: max(14px, env(safe-area-inset-right));
    bottom: max(14px, env(safe-area-inset-bottom));
  }

  .chub__panel {
    width: min(286px, calc(100vw - 28px));
  }

  /* Dar ekranda tetik yalnız ikon: metin yer yiyor, hap kapıyı örtüyor. */
  .chub__trigger {
    padding: 8px;
    border-radius: 999px;
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
