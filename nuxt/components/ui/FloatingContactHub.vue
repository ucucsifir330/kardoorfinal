<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "#imports";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const route = useRoute();
const { locale } = useKardoorLocale();

const isOpen = ref(false);
const hubRef = ref<HTMLElement | null>(null);
const isHomeRoute = computed(() => route.path === "/");

let syncFrame = 0;

const copy = computed(() => {
  if (locale.value === "en") {
    return {
      toggle: isOpen.value ? "Close contact options" : "Open contact options",
      kicker: "Contact",
      title: "Let's talk",
      primary: "Plan a project",
      whatsapp: "WhatsApp",
      phone: "Call",
      mail: "Email"
    };
  }

  return {
    toggle: isOpen.value ? "İletişim seçeneklerini kapat" : "İletişim seçeneklerini aç",
    kicker: "İletişim",
    title: "Görüşelim",
    primary: "Proje planla",
    whatsapp: "WhatsApp",
    phone: "Ara",
    mail: "E-posta"
  };
});

const closeHub = () => {
  isOpen.value = false;
};

const toggleHub = () => {
  isOpen.value = !isOpen.value;
};

const onPointerDown = (event: PointerEvent) => {
  if (!isOpen.value || !hubRef.value) return;
  if (event.target instanceof Node && hubRef.value.contains(event.target)) return;

  closeHub();
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeHub();
};

const syncHeroMotion = () => {
  syncFrame = 0;

  if (!hubRef.value) return;

  if (!isHomeRoute.value) {
    hubRef.value.style.setProperty("--floating-contact-opacity", "0");
    hubRef.value.style.setProperty("--floating-contact-y", "-28px");
    hubRef.value.style.setProperty("--floating-contact-pointer", "none");
    closeHub();
    return;
  }

  const hero = document.querySelector<HTMLElement>(".entrance-door");
  const heroStyles = hero ? window.getComputedStyle(hero) : undefined;
  const opacity = heroStyles?.getPropertyValue("--hero-copy-opacity").trim() || "1";
  const y = heroStyles?.getPropertyValue("--hero-copy-y").trim() || "0px";
  const opacityNumber = Number.parseFloat(opacity);

  hubRef.value.style.setProperty("--floating-contact-opacity", opacity);
  hubRef.value.style.setProperty("--floating-contact-y", y);
  hubRef.value.style.setProperty(
    "--floating-contact-pointer",
    Number.isFinite(opacityNumber) && opacityNumber > 0.08 ? "auto" : "none"
  );

  if (Number.isFinite(opacityNumber) && opacityNumber <= 0.08) {
    closeHub();
  }

  if (isHomeRoute.value) {
    syncFrame = window.requestAnimationFrame(syncHeroMotion);
  }
};

const requestHeroMotionSync = () => {
  if (syncFrame) return;

  syncFrame = window.requestAnimationFrame(syncHeroMotion);
};

onMounted(() => {
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("keydown", onKeydown);
  requestHeroMotionSync();
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onPointerDown);
  window.removeEventListener("keydown", onKeydown);

  if (syncFrame) {
    window.cancelAnimationFrame(syncFrame);
  }
});

watch(
  () => route.fullPath,
  async () => {
    closeHub();
    await nextTick();
    requestHeroMotionSync();
  }
);
</script>

<template>
  <aside
    v-show="isHomeRoute"
    ref="hubRef"
    class="floating-contact"
    :class="{ 'is-open': isOpen }"
  >
    <div class="floating-contact__panel" :aria-hidden="!isOpen" :inert="!isOpen">
      <NuxtLink class="floating-contact__primary" to="/contact" @click="closeHub">
        <span>
          <small>{{ copy.kicker }}</small>
          {{ copy.primary }}
        </span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M9 7H17V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </NuxtLink>

      <div class="floating-contact__actions">
        <a
          class="floating-contact__action"
          href="https://wa.me/905377765300"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="copy.whatsapp"
          @click="closeHub"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.79 1.48h.01c6.57 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.47-8.44ZM12.08 21.82h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.73.98.99-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.29c0-5.46 4.45-9.9 9.92-9.9a9.86 9.86 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.92 9.9Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
          </svg>
          <span>{{ copy.whatsapp }}</span>
        </a>

        <a class="floating-contact__action" href="tel:+905377765300" :aria-label="copy.phone" @click="closeHub">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8.45 5.35L10.15 9.15C10.38 9.68 10.25 10.28 9.82 10.65L8.65 11.68C9.55 13.52 11.02 15 12.88 15.92L13.92 14.72C14.28 14.3 14.88 14.17 15.4 14.4L19.2 16.1C19.82 16.38 20.15 17.05 19.98 17.72L19.58 19.28C19.4 19.98 18.78 20.45 18.05 20.42C10.08 20.05 3.95 13.92 3.58 5.95C3.55 5.22 4.02 4.6 4.72 4.42L6.78 4.02C7.45 3.85 8.18 4.72 8.45 5.35Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>{{ copy.phone }}</span>
        </a>

        <a class="floating-contact__action" href="mailto:info@kardoor.com" :aria-label="copy.mail" @click="closeHub">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4.25 7.75H19.75C20.58 7.75 21.25 8.42 21.25 9.25V16.75C21.25 17.58 20.58 18.25 19.75 18.25H4.25C3.42 18.25 2.75 17.58 2.75 16.75V9.25C2.75 8.42 3.42 7.75 4.25 7.75Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3.75 8.75L12 14L20.25 8.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>{{ copy.mail }}</span>
        </a>
      </div>
    </div>

    <button
      class="floating-contact__trigger"
      type="button"
      :aria-label="copy.toggle"
      :aria-expanded="isOpen"
      @click="toggleHub"
    >
      <span class="floating-contact__trigger-copy">
        <small>{{ copy.kicker }}</small>
        {{ copy.title }}
      </span>
      <span class="floating-contact__trigger-icon" aria-hidden="true">
        <svg class="floating-contact__icon-chat" viewBox="0 0 24 24" fill="none">
          <path d="M5.6 17.35C4.22 16.05 3.5 14.36 3.5 12.5C3.5 8.63 7.31 5.5 12 5.5C16.69 5.5 20.5 8.63 20.5 12.5C20.5 16.37 16.69 19.5 12 19.5C11.09 19.5 10.21 19.38 9.39 19.16L5.25 20.35L5.6 17.35Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.75 12.35H15.25" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
          <path d="M8.75 15H12.45" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
        </svg>
        <svg class="floating-contact__icon-close" viewBox="0 0 24 24" fill="none">
          <path d="M7 7L17 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          <path d="M17 7L7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </span>
    </button>
  </aside>
</template>
