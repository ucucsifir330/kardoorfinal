<script setup lang="ts">
import { gsap } from "gsap";
import { computed, reactive, ref } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

const { locale } = useKardoorLocale();

useSeoMeta({
  title: "Contact",
  description: "Contact Ege Kardoor for catalogs, project inquiries and steel door production requests."
});

type ContactFormState = "idle" | "submitting" | "success";

const formState = ref<ContactFormState>("idle");
const newsletter = ref(false);
const mapRef = ref<HTMLElement | null>(null);
let mapMedia: ReturnType<typeof gsap.matchMedia> | undefined;
let mapResizeObserver: ResizeObserver | undefined;

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: ""
});

const branchMaps = [
  {
    id: "izmir",
    labels: {
      en: "IZMIR BRANCH",
      tr: "\u0130ZM\u0130R \u015eUBES\u0130"
    },
    embedUrl: "https://www.google.com/maps?q=38.3553801,27.2286561&z=17&output=embed",
    googleUrl: "https://www.google.com/maps/search/?api=1&query=38.3553801,27.2286561",
    appleUrl: "https://maps.apple.com/?ll=38.3553801,27.2286561&q=Ege%20Kardoor%20Izmir"
  },
  {
    id: "kocaeli",
    labels: {
      en: "KOCAELI BRANCH",
      tr: "KOCAEL\u0130 \u015eUBES\u0130"
    },
    embedUrl:
      "https://www.google.com/maps?q=Mimar%20Sinan%2C%20Ba%C4%9Flar%20Cd.%20No%3A79%2FA%2C%2041780%20K%C3%B6rfez%2FKocaeli&z=17&output=embed",
    googleUrl:
      "https://www.google.com/maps/search/?api=1&query=Mimar%20Sinan%2C%20Ba%C4%9Flar%20Cd.%20No%3A79%2FA%2C%2041780%20K%C3%B6rfez%2FKocaeli",
    appleUrl:
      "https://maps.apple.com/?q=Mimar%20Sinan%2C%20Ba%C4%9Flar%20Cd.%20No%3A79%2FA%2C%2041780%20K%C3%B6rfez%2FKocaeli"
  },
  {
    id: "manisa",
    labels: {
      en: "MANISA BRANCH",
      tr: "MAN\u0130SA \u015eUBES\u0130"
    },
    embedUrl:
      "https://yandex.com.tr/map-widget/v1/?ll=28.068948%2C38.482866&z=16&pt=28.068948,38.482866,pm2rdm",
    googleUrl: "https://www.google.com/maps/search/?api=1&query=38.482866,28.068948",
    appleUrl: "https://maps.apple.com/?ll=38.482866,28.068948&q=Kardoor%20Manisa"
  }
];

const contactBranches = computed(() =>
  branchMaps.map((branch) => ({
    ...branch,
    label: locale.value === "en" ? branch.labels.en : branch.labels.tr
  }))
);

const copy = computed(() => {
  if (locale.value === "en") {
    return {
      title: "Let's talk about more than a door.",
      fields: {
        firstName: "Name",
        lastName: "Surname",
        email: "E-mail",
        phone: "Phone",
        message: "Message"
      },
      newsletter:
        "I want to subscribe to updates about new collections, project launches and Kardoor news.",
      submit: formState.value === "submitting" ? "Sending" : "Start the project",
      success: "Thanks. Our team will get back to you shortly.",
      groups: [
        {
          title: "Social",
          lines: [
            { text: "Instagram", href: "#instagram-link-bekleniyor" },
            { text: "LinkedIn", href: "#linkedin-link-bekleniyor" }
          ]
        },
        {
          title: "Addresses",
          lines: [
            { text: "Izmir: Zafer Mahallesi Turgut Ozal Caddesi No:14/16 Buca / Izmir", href: undefined },
            { text: "Kocaeli: Mimar Sinan Mah. Baglar Cad. No:79/A Korfez / Kocaeli", href: undefined },
            { text: "Manisa: Caferbey Mah. Asfalt Alti Sk No: 110", href: undefined }
          ]
        },
        {
          title: "Contact",
          lines: [
            { text: "Mail: info@egekardoor.com", href: "mailto:info@egekardoor.com" },
            { text: "Izmir Showroom: +90 537 776 53 00", href: "tel:+905377765300" },
            { text: "Kocaeli Showroom: +90 530 614 35 41", href: "tel:+905306143541" },
            { text: "Manisa Showroom: +90 533 969 62 36", href: "tel:+905339696236" }
          ]
        }
      ],
      mapLabel: "Kardoor Steel Door",
      mapTitle: "Kardoor Steel Door location map"
    };
  }

  return {
    title: "Bir kapıdan fazlasını konuşalım.",
    fields: {
      firstName: "Adınız",
      lastName: "Soy Adınız",
      email: "E-posta",
      phone: "Telefon",
      message: "Mesajınız"
    },
    newsletter:
      "Yeni koleksiyonlar, proje ilhamları ve Kardoor'dan haberler için bültene abone olmak istiyorum.",
    submit: formState.value === "submitting" ? "Gönderiliyor" : "Projeyi başlat",
    success: "Teşekkürler. Ekibimiz kısa süre içinde size dönüş yapacak.",
    groups: [
      {
        title: "Sosyal Ağlar",
        lines: [
          { text: "Instagram", href: "#instagram-link-bekleniyor" },
          { text: "LinkedIn", href: "#linkedin-link-bekleniyor" }
        ]
      },
      {
        title: "Adresler",
        lines: [
          { text: "İzmir: Zafer Mahallesi Turgut Özal Caddesi No:14/16 Buca / İzmir", href: undefined },
          { text: "Kocaeli: Mimar Sinan Mah. Bağlar Cad. No:79/A Körfez / Kocaeli", href: undefined },
          { text: "Manisa: Caferbey Mah. Asfalt Altı Sk No: 110", href: undefined }
        ]
      },
      {
        title: "İletişim",
        lines: [
          { text: "Mail: info@egekardoor.com", href: "mailto:info@egekardoor.com" },
          { text: "İzmir Showroom: +90 537 776 53 00", href: "tel:+905377765300" },
          { text: "Kocaeli Showroom: +90 530 614 35 41", href: "tel:+905306143541" },
          { text: "Manisa Showroom: +90 533 969 62 36", href: "tel:+905339696236" }
        ]
      }
    ],
    mapLabel: "Kardoor Çelik Kapı",
    mapTitle: "Kardoor Çelik Kapı konum haritası"
  };
});

async function handleSubmit() {
  if (formState.value === "submitting") return;

  formState.value = "submitting";
  await new Promise(resolve => setTimeout(resolve, 800));
  formState.value = "success";
}

function openBranchMap(branch: (typeof branchMaps)[number]) {
  const userAgent = navigator.userAgent || "";
  const isAppleMapsPlatform = /iPad|iPhone|iPod|Macintosh/.test(userAgent);
  window.open(isAppleMapsPlatform ? branch.appleUrl : branch.googleUrl, "_blank", "noopener");
}

onMounted(() => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from(".contact-page__title", {
      opacity: 0,
      y: 24,
      duration: 0.78,
      ease: "expo.out",
      delay: 0.08
    });

    gsap.from(".contact-page__panel", {
      opacity: 0,
      y: 18,
      duration: 0.64,
      ease: "expo.out",
      stagger: 0.12,
      delay: 0.24
    });
  });

  // Keep the iframes sized to the full expanded width so they never re-render
  // mid-animation (only updates on real layout/resize, never during hover).
  const syncMapWidth = () => {
    const map = mapRef.value;
    if (map) map.style.setProperty("--map-expanded-w", `${Math.round(map.clientWidth)}px`);
  };
  syncMapWidth();
  if ("ResizeObserver" in window && mapRef.value) {
    mapResizeObserver = new ResizeObserver(syncMapWidth);
    mapResizeObserver.observe(mapRef.value);
  }

  // ── Map hover: hovered branch opens to the full 3-card width, the other
  //    two collapse and their labels fade out. Silky, interruptible motion.
  mapMedia = gsap.matchMedia();
  mapMedia.add(
    "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    () => {
      const map = mapRef.value;
      if (!map) return;

      const restGap = getComputedStyle(map).columnGap || "0px";
      const EASE = "power3.out";
      const DUR = 0.9;
      let activeIdx = -1;

      // Query live each time so the interaction survives Vue re-rendering the
      // v-for branches (e.g. when the locale settles after mount).
      const liveBranches = () =>
        gsap.utils.toArray<HTMLElement>(".contact-map__branch", map);

      const focus = (active: number) => {
        const branches = liveBranches();
        gsap.to(map, { columnGap: 0, duration: DUR, ease: EASE, overwrite: "auto" });
        branches.forEach((branch, i) => {
          const isActive = i === active;
          gsap.to(branch, {
            flexGrow: isActive ? 1 : 0,
            duration: DUR,
            ease: EASE,
            overwrite: true
          });
          gsap.to(branch.children, {
            autoAlpha: isActive ? 1 : 0,
            duration: isActive ? 0.55 : 0.4,
            ease: "power2.out",
            overwrite: true
          });
        });
      };

      const reset = () => {
        const branches = liveBranches();
        gsap.to(map, { columnGap: restGap, duration: DUR, ease: EASE, overwrite: "auto" });
        branches.forEach((branch) => {
          gsap.to(branch, { flexGrow: 1, duration: DUR, ease: EASE, overwrite: true });
          gsap.to(branch.children, {
            autoAlpha: 1,
            duration: 0.5,
            ease: "power2.out",
            overwrite: true
          });
        });
      };

      const onOver = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        const branchEl = target?.closest?.(".contact-map__branch") as HTMLElement | null;
        if (!branchEl || !map.contains(branchEl)) return;
        const idx = liveBranches().indexOf(branchEl);
        if (idx === -1 || idx === activeIdx) return;
        activeIdx = idx;
        focus(idx);
      };

      const onLeave = () => {
        if (activeIdx === -1) return;
        activeIdx = -1;
        reset();
      };

      map.addEventListener("pointerover", onOver);
      map.addEventListener("pointerleave", onLeave);

      return () => {
        map.removeEventListener("pointerover", onOver);
        map.removeEventListener("pointerleave", onLeave);
        const branches = liveBranches();
        gsap.set(branches, { clearProps: "flexGrow,opacity,visibility" });
        gsap.set(branches.flatMap((b) => [...b.children]), {
          clearProps: "opacity,visibility"
        });
        gsap.set(map, { clearProps: "columnGap" });
      };
    }
  );
});

onBeforeUnmount(() => {
  mapResizeObserver?.disconnect();
  mapMedia?.revert();
});
</script>

<template>
  <section class="contact-page" aria-labelledby="contact-title">
    <h1 id="contact-title" class="contact-page__title">
      {{ copy.title }}
    </h1>

    <div class="contact-page__grid">
      <form
        class="contact-page__panel contact-form"
        :class="{ 'contact-form--sent': formState === 'success' }"
        @submit.prevent="handleSubmit"
      >
        <label
          class="contact-form__field"
          :class="{ 'contact-form__field--filled': form.firstName.trim().length > 0 }"
          for="contact-first-name"
        >
          <span>{{ copy.fields.firstName }}</span>
          <input
            id="contact-first-name"
            v-model="form.firstName"
            name="firstName"
            type="text"
            autocomplete="given-name"
            required
          />
        </label>

        <label
          class="contact-form__field"
          :class="{ 'contact-form__field--filled': form.lastName.trim().length > 0 }"
          for="contact-last-name"
        >
          <span>{{ copy.fields.lastName }}</span>
          <input
            id="contact-last-name"
            v-model="form.lastName"
            name="lastName"
            type="text"
            autocomplete="family-name"
          />
        </label>

        <label
          class="contact-form__field"
          :class="{ 'contact-form__field--filled': form.email.trim().length > 0 }"
          for="contact-email"
        >
          <span>{{ copy.fields.email }}</span>
          <input
            id="contact-email"
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            required
          />
        </label>

        <label
          class="contact-form__field"
          :class="{ 'contact-form__field--filled': form.phone.trim().length > 0 }"
          for="contact-phone"
        >
          <span>{{ copy.fields.phone }}</span>
          <input
            id="contact-phone"
            v-model="form.phone"
            name="phone"
            type="tel"
            autocomplete="tel"
          />
        </label>

        <label
          class="contact-form__field"
          :class="{ 'contact-form__field--filled': form.message.trim().length > 0 }"
          for="contact-message"
        >
          <span>{{ copy.fields.message }}</span>
          <textarea
            id="contact-message"
            v-model="form.message"
            name="message"
            rows="1"
            required
          />
        </label>

        <label class="contact-form__consent" for="contact-newsletter">
          <input
            id="contact-newsletter"
            v-model="newsletter"
            type="checkbox"
            name="newsletter"
          />
          <span>{{ copy.newsletter }}</span>
        </label>

        <button
          class="contact-form__submit"
          type="submit"
          :disabled="formState === 'submitting'"
        >
          <span>{{ copy.submit }}</span>
          <span class="contact-form__submit-icon" aria-hidden="true">
            <svg width="25" height="18" viewBox="0 0 25 18" fill="none">
              <path d="M1 9H23M16 2L23 9L16 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>

        <p v-if="formState === 'success'" class="contact-form__status" role="status">
          {{ copy.success }}
        </p>
      </form>

      <aside class="contact-page__panel contact-info" aria-label="Kardoor contact information">
        <section
          v-for="group in copy.groups"
          :key="group.title"
          class="contact-info__group"
        >
          <h2>
            <span class="flip-text-link" :data-text="group.title">{{ group.title }}</span>
          </h2>
          <p v-for="line in group.lines" :key="line.text">
            <a
              v-if="line.href"
              :href="line.href"
              class="contact-info__link flip-text-link no-line"
              :data-text="line.text"
            >
              {{ line.text }}
            </a>
            <span v-else class="flip-text-link no-line" :data-text="line.text">
              {{ line.text }}
            </span>
          </p>
        </section>
      </aside>

      <div ref="mapRef" class="contact-page__panel contact-map" aria-label="Kardoor map preview">
        <article
          v-for="branch in contactBranches"
          :key="branch.id"
          class="contact-map__branch"
        >
          <div class="contact-map__frame">
            <iframe
              :src="branch.embedUrl"
              :title="`${copy.mapTitle} - ${branch.label}`"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
            <span class="contact-map__pin" aria-hidden="true">
              <svg viewBox="0 0 48 64" focusable="false">
                <path d="M24 4C13.51 4 5 12.51 5 23c0 15.25 19 37 19 37s19-21.75 19-37C43 12.51 34.49 4 24 4Z" />
                <circle cx="24" cy="23" r="7.25" />
              </svg>
            </span>
            <button
              type="button"
              class="contact-map__link"
              :aria-label="`${branch.label} haritasını aç`"
              @click="openBranchMap(branch)"
            />
          </div>
          <p>
            <span class="contact-map__label flip-text-link" :data-text="branch.label">
              {{ branch.label }}
            </span>
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
