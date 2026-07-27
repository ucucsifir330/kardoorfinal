<template>
  <div class="footer-wrapper" ref="footerWrapper">
    <footer class="footer-dome" ref="footerDome">
      <div class="footer-main">
        <div class="footer-visual">
          <div class="footer-brand">
            <!-- Inner-shadow filter: turns the K's outer drop-shadow into an
                 inset/debossed shadow that follows the glyph's alpha, so the K
                 reads as carved out of the footer surface. -->
            <svg class="footer-logo-filter" width="0" height="0" aria-hidden="true" focusable="false">
              <filter id="kInnerShadow" x="-25%" y="-25%" width="150%" height="150%">
                <feComponentTransfer in="SourceAlpha" result="invAlpha">
                  <feFuncA type="table" tableValues="1 0"></feFuncA>
                </feComponentTransfer>
                <feGaussianBlur in="invAlpha" stdDeviation="6" result="blur"></feGaussianBlur>
                <feOffset in="blur" dx="0" dy="4" result="ob"></feOffset>
                <feFlood flood-color="#000000" flood-opacity="0.3" result="col"></feFlood>
                <feComposite in="col" in2="ob" operator="in" result="shadow"></feComposite>
                <feComposite in="shadow" in2="SourceAlpha" operator="in" result="sc"></feComposite>
                <feMerge>
                  <feMergeNode in="SourceGraphic"></feMergeNode>
                  <feMergeNode in="sc"></feMergeNode>
                </feMerge>
              </filter>
            </svg>
            <EgeLogo class="footer-logo" title="Ege Kardoor" />
          </div>

          <div class="footer-socials">
            <a href="#instagram-link-bekleniyor" class="social-btn" aria-label="Instagram">
              <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M160,128a32,32,0,1,1-32-32A32.03667,32.03667,0,0,1,160,128Zm68-44v88a56.06353,56.06353,0,0,1-56,56H84a56.06353,56.06353,0,0,1-56-56V84A56.06353,56.06353,0,0,1,84,28h88A56.06353,56.06353,0,0,1,228,84Zm-52,44a48,48,0,1,0-48,48A48.05436,48.05436,0,0,0,176,128Zm16-52a12,12,0,1,0-12,12A12,12,0,0,0,192,76Z"></path>
              </svg>
            </a>

            <a href="#linkedin-link-bekleniyor" class="social-btn linkedin-btn" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.38 4.27 5.47v6.27ZM5.32 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.1 20.45H3.54V9H7.1v11.45Z"></path>
              </svg>
            </a>

            <a href="#" class="social-btn facebook-btn" aria-label="Facebook">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15.82 4.02h-2.33c-2.6 0-4.28 1.73-4.28 4.42v2.03H6.95c-.2 0-.36.16-.36.36v2.95c0 .2.16.36.36.36h2.26v7.48c0 .2.16.36.36.36h3.08c.2 0 .36-.16.36-.36v-7.48h2.76c.18 0 .33-.13.36-.31l.44-2.95c.03-.22-.14-.41-.36-.41h-3.16V8.73c0-.85.2-1.28 1.31-1.28h1.5c.2 0 .36-.16.36-.36V4.38c0-.2-.16-.36-.36-.36Z"></path>
              </svg>
            </a>

            <a href="https://wa.me/905377765300" class="social-btn whatsapp-btn" aria-label="WhatsApp" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.79 1.48h.01c6.57 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.47-8.44ZM12.08 21.82h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.73.98.99-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.29c0-5.46 4.45-9.9 9.92-9.9a9.86 9.86 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.92 9.9Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"></path>
              </svg>
            </a>

            <a href="mailto:info@egekardoor.com" class="social-btn mail-btn" aria-label="Mail">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path class="mail-envelope-body" d="M4.25 8H19.75C20.58 8 21.25 8.67 21.25 9.5V16.75C21.25 17.58 20.58 18.25 19.75 18.25H4.25C3.42 18.25 2.75 17.58 2.75 16.75V9.5C2.75 8.67 3.42 8 4.25 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <path class="mail-envelope-fold-left" d="M4.25 17.35L9.7 12.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
                <path class="mail-envelope-fold-right" d="M19.75 17.35L14.3 12.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
                <path class="mail-envelope-flap" d="M3.75 8.75L12 14L20.25 8.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </a>

            <a href="tel:+905377765300" class="social-btn phone-btn" :aria-label="footerCopy.phoneAria">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8.45 5.35L10.15 9.15C10.38 9.68 10.25 10.28 9.82 10.65L8.65 11.68C9.55 13.52 11.02 15 12.88 15.92L13.92 14.72C14.28 14.3 14.88 14.17 15.4 14.4L19.2 16.1C19.82 16.38 20.15 17.05 19.98 17.72L19.58 19.28C19.4 19.98 18.78 20.45 18.05 20.42C10.08 20.05 3.95 13.92 3.58 5.95C3.55 5.22 4.02 4.6 4.72 4.42L6.78 4.02C7.45 3.85 8.18 4.72 8.45 5.35Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </a>
          </div>
        </div>

        <div class="footer-divider" aria-hidden="true"></div>

        <div class="footer-panel">
          <h2 class="footer-heading">
            <span class="footer-heading__line">{{ footerCopy.heading.line1 }}</span>
            <span class="footer-heading__line">{{ footerCopy.heading.line2 }}</span>
            <span class="footer-heading__line">{{ footerCopy.heading.line3 }}</span>
            <em class="footer-heading__emphasis">{{ footerCopy.heading.emphasis }}</em>
            <span class="footer-heading__line footer-heading__rest">{{ footerCopy.heading.line4 }}</span>
          </h2>

          <div class="location-group">
            <p class="location-label">{{ footerCopy.locationLabel }}</p>

            <div class="location-options">
              <label
                v-for="(location, index) in footerCopy.locationOptions"
                :key="location"
                class="location-option"
              >
                <input
                  :id="`footer-location-${index}`"
                  type="radio"
                  name="location"
                  :value="location"
                  :checked="index === 0"
                >
                <span class="radio-ui"></span>
                <span class="option-text flip-text-link" :data-text="location">{{ location }}</span>
              </label>
            </div>
          </div>

          <form class="footer-form" @submit.prevent>
            <div class="form-row">
              <input
                id="footer-form-name"
                type="text"
                name="name"
                autocomplete="name"
                :placeholder="footerCopy.form.name"
                :aria-label="footerCopy.form.name"
              >
              <input
                id="footer-form-phone"
                type="tel"
                name="phone"
                autocomplete="tel"
                :placeholder="footerCopy.form.phone"
                :aria-label="footerCopy.form.phone"
              >
            </div>

            <div class="form-row form-row-message">
              <input
                id="footer-form-message"
                type="text"
                name="message"
                autocomplete="off"
                :placeholder="footerCopy.form.message"
                :aria-label="footerCopy.form.message"
              >
              <button
                type="submit"
                class="submit-btn"
                :aria-label="footerCopy.form.submitAria"
                @pointerenter="enterDirectionalFill($event, '.submit-btn__fill')"
                @pointerleave="leaveDirectionalFill($event, '.submit-btn__fill')"
              >
                <span class="submit-btn__fill" aria-hidden="true"></span>
                <span class="submit-btn__label">{{ footerCopy.form.submit }}</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M8 5L15 12L8 19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="footer-info">
        <div class="footer-info-left">
          <div class="footer-column">
            <span class="footer-kicker">Kardoor</span>
            <a
              v-for="item in footerCopy.navLinks"
              :key="item"
              href="#"
              class="flip-text-link no-line"
              :data-text="item"
            >{{ item }}</a>
          </div>

          <div class="footer-column">
            <span class="footer-kicker">{{ footerCopy.productsTitle }}</span>
            <a
              v-for="item in footerCopy.productLinks"
              :key="item"
              href="#"
              class="flip-text-link no-line"
              :data-text="item"
            >{{ item }}</a>
          </div>
        </div>

        <div class="footer-locations">
          <span class="footer-kicker">{{ footerCopy.showroomsTitle }}</span>

          <div class="location-cards">
            <div
              v-for="location in footerCopy.showrooms"
              :key="location.name"
              class="location-card"
            >
              <h3><span class="flip-text-link" :data-text="location.name">{{ location.name }}</span></h3>
              <p>
                <template v-for="(line, index) in location.addressLines" :key="line">
                  {{ line }}<br v-if="index < location.addressLines.length - 1">
                </template>
              </p>
              <span class="location-card__phone-label">{{ location.label }}</span>
              <a :href="location.phoneHref" class="location-card__phone">{{ location.phone }}</a>
              <div class="hours">
                <span>{{ footerCopy.hours.days }}</span>
                <span>08:00 - 18:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-wordmark" aria-hidden="true">
        <div class="footer-wordmark__track">
          <div class="footer-wordmark__group">
            <span class="footer-wordmark__item">EGE KARDOOR<span class="footer-wordmark__copyright">©</span></span>
            <span class="footer-wordmark__item">EGE KARDOOR<span class="footer-wordmark__copyright">©</span></span>
          </div>

          <div class="footer-wordmark__group">
            <span class="footer-wordmark__item">EGE KARDOOR<span class="footer-wordmark__copyright">©</span></span>
            <span class="footer-wordmark__item">EGE KARDOOR<span class="footer-wordmark__copyright">©</span></span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div>
          <span>{{ footerCopy.legal.copyright }}</span>
          <strong>{{ footerCopy.legal.rights }}</strong>
        </div>

        <div>
          <template v-for="(link, index) in footerCopy.policyLinks" :key="link">
            <a href="#" class="flip-text-link no-line" :data-text="link">{{ link }}</a><span v-if="index < footerCopy.policyLinks.length - 1">·</span>
          </template>
        </div>

        <a
          class="footer-agency"
          href="https://www.ucucsifir.com"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="footerCopy.legal.agencyAria"
        >
          <span class="footer-agency__lead">{{ footerCopy.legal.agencyLead }}</span>
          <span class="footer-agency__brand">{{ footerCopy.legal.agency }}</span>
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { gsap } from "gsap"
import { useKardoorLocale } from "~/composables/useKardoorLocale"

const { locale } = useKardoorLocale()

const footerCopies = {
  tr: {
    phoneAria: "Telefon",
    heading: {
      line1: "Size en yakın",
      line2: "showroomu seçin;",
      line3: "projeniz için",
      emphasis: "görüşme talebi",
      line4: "bırakın."
    },
    locationLabel: "Şube seçimi:",
    locationOptions: ["İzmir", "Kocaeli", "Manisa"],
    form: {
      name: "Adınız ve soyadınız",
      phone: "Telefon numaranız",
      message: "Mesajınız",
      submit: "Randevu Oluştur",
      submitAria: "Gönder"
    },
    productsTitle: "Ürün Serileri",
    productLinks: [
      "Çelik Kapı Sistemleri",
      "Dış İklim Kapı Sistemleri",
      "Ekonomik Kapı Sistemleri",
      "Bina Giriş Sistemleri",
      "Özel Proje Sistemleri"
    ],
    navLinks: ["Ana Sayfa", "Hakkımızda", "Koleksiyonlar", "Katalog", "İletişim"],
    showroomsTitle: "Şubelerimiz/Showroomlar",
    hours: {
      days: "Pzt-Paz"
    },
    showrooms: [
      {
        name: "İzmir",
        addressLines: ["Zafer Mahallesi Turgut Özal Caddesi", "No:14/16 Buca / İzmir"],
        label: "İzmir Showroom",
        phoneHref: "tel:+905377765300",
        phone: "+90 537 776 53 00"
      },
      {
        name: "Kocaeli",
        addressLines: ["Mimar Sinan Mah. Bağlar Cad.", "No:79/A Körfez / Kocaeli"],
        label: "Kocaeli Showroom",
        phoneHref: "tel:+905306143541",
        phone: "+90 530 614 35 41"
      },
      {
        name: "Manisa",
        addressLines: ["Caferbey Mah. Asfalt Altı Sk", "No: 110"],
        label: "Manisa Showroom",
        phoneHref: "tel:+905339696236",
        phone: "+90 533 969 62 36"
      }
    ],
    legal: {
      copyright: "© 2026 Ege Kardoor Çelik Kapı.",
      rights: "Tüm hakları saklıdır.",
      agencyLead: "Site by",
      agency: "Üç Üç Sıfır ®",
      agencyAria: "Üç Üç Sıfır web sitesini yeni sekmede aç"
    },
    policyLinks: ["Gizlilik Politikası", "KVKK Aydınlatma Metni", "Kullanım Koşulları"]
  },
  en: {
    phoneAria: "Phone",
    heading: {
      line1: "Choose your nearest",
      line2: "showroom;",
      line3: "leave a",
      emphasis: "meeting request",
      line4: "for your project."
    },
    locationLabel: "Branch selection:",
    locationOptions: ["Izmir", "Kocaeli", "Manisa"],
    form: {
      name: "Your full name",
      phone: "Your phone number",
      message: "Your message",
      submit: "Create Appointment",
      submitAria: "Submit"
    },
    productsTitle: "Product Series",
    productLinks: [
      "Steel Door Systems",
      "Exterior Climate Door Systems",
      "Economic Door Systems",
      "Building Entrance Systems",
      "Custom Project Systems"
    ],
    navLinks: ["Home", "About Us", "Collections", "Catalog", "Contact"],
    showroomsTitle: "Branches/Showrooms",
    hours: {
      days: "Mon-Sun"
    },
    showrooms: [
      {
        name: "Izmir",
        addressLines: ["Zafer Mahallesi Turgut Ozal Caddesi", "No:14/16 Buca / Izmir"],
        label: "Izmir Showroom",
        phoneHref: "tel:+905377765300",
        phone: "+90 537 776 53 00"
      },
      {
        name: "Kocaeli",
        addressLines: ["Mimar Sinan Mah. Baglar Cad.", "No:79/A Korfez / Kocaeli"],
        label: "Kocaeli Showroom",
        phoneHref: "tel:+905306143541",
        phone: "+90 530 614 35 41"
      },
      {
        name: "Manisa",
        addressLines: ["Caferbey Mah. Asfalt Alti Sk", "No: 110"],
        label: "Manisa Showroom",
        phoneHref: "tel:+905339696236",
        phone: "+90 533 969 62 36"
      }
    ],
    legal: {
      copyright: "© 2026 Ege Kardoor Steel Door.",
      rights: "All rights reserved.",
      agencyLead: "Site by",
      agency: "Üç Üç Sıfır ®",
      agencyAria: "Open Uc Uc Sifir website in a new tab"
    },
    policyLinks: ["Privacy Policy", "KVKK Disclosure Notice", "Terms of Use"]
  }
}

const footerCopy = computed(() => footerCopies[locale.value] ?? footerCopies.tr)

const footerWrapper = ref<HTMLElement | null>(null)
const footerDome = ref<HTMLElement | null>(null)

let cleanupFooter: (() => void) | null = null

const enterDirectionalFill = (event: PointerEvent, fillSelector: string) => {
  const target = event.currentTarget as HTMLElement | null
  const fill = target?.querySelector<HTMLElement>(fillSelector)
  if (!target || !fill) return

  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left - rect.width / 2
  const y = event.clientY - rect.top - rect.height / 2
  const fromHorizontal = Math.abs(x / rect.width) > Math.abs(y / rect.height)
  const fromX = fromHorizontal ? (x < 0 ? "-103%" : "103%") : "0%"
  const fromY = fromHorizontal ? "0%" : y < 0 ? "-103%" : "103%"

  gsap.killTweensOf(fill)
  gsap.set(fill, { x: fromX, y: fromY, opacity: 1 })
  gsap.to(fill, {
    x: "0%",
    y: "0%",
    duration: 0.72,
    ease: "expo.out"
  })
}

const leaveDirectionalFill = (event: PointerEvent, fillSelector: string) => {
  const target = event.currentTarget as HTMLElement | null
  const fill = target?.querySelector<HTMLElement>(fillSelector)
  if (!target || !fill) return

  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left - rect.width / 2
  const y = event.clientY - rect.top - rect.height / 2
  const fromHorizontal = Math.abs(x / rect.width) > Math.abs(y / rect.height)
  const toX = fromHorizontal ? (x < 0 ? "-103%" : "103%") : "0%"
  const toY = fromHorizontal ? "0%" : y < 0 ? "-103%" : "103%"

  gsap.killTweensOf(fill)
  gsap.to(fill, {
    x: toX,
    y: toY,
    opacity: 1,
    duration: 0.56,
    ease: "expo.out"
  })
}

const initFooterAnimation = () => {
  const footer = footerDome.value
  const wrapper = footerWrapper.value

  if (!footer || !wrapper) return

  const isMobileFooter = () => window.matchMedia("(max-width: 760px)").matches
  const getFooterMotion = () => {
    if (isMobileFooter()) {
      return { y: 0, radius: 220, divisor: 1.18 }
    }

    return { y: 24, radius: 520, divisor: 1.35 }
  }

  const initialMotion = getFooterMotion()

  gsap.set(footer, {
    y: initialMotion.y,
    "--dome-radius": `${initialMotion.radius}px`,
    borderTopLeftRadius: `50% ${initialMotion.radius}px`,
    borderTopRightRadius: `50% ${initialMotion.radius}px`,
    force3D: true
  })

  let ticking = false
  let footerNearViewport = false
  let lastEasedProgress = -1

  const updateFooterShape = () => {
    ticking = false

    const rect = wrapper.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const motion = getFooterMotion()
    const rawProgress = (viewportHeight - rect.top) / (viewportHeight * motion.divisor)
    const progress = Math.min(1, Math.max(0, rawProgress))
    const easedProgress = gsap.parseEase("sine.inOut")(progress)

    // Değer değişmediyse (footer ekran dışında progress 0/1'de sabit) tween'i
    // yeniden başlatma — eskiden her scroll frame'inde 0.9s'lik gsap.to restart
    // ediliyordu, sayfanın tepesinde bile.
    if (Math.abs(easedProgress - lastEasedProgress) < 0.002) return
    lastEasedProgress = easedProgress
    const y = Math.max(0, motion.y * (1 - easedProgress))
    const radius = Math.max(0, motion.radius * (1 - easedProgress))
    const radiusValue = `50% ${radius}px`

    gsap.to(footer, {
      y,
      "--dome-radius": `${radius}px`,
      borderTopLeftRadius: radiusValue,
      borderTopRightRadius: radiusValue,
      duration: 0.9,
      ease: "power2.out",
      overwrite: true,
      force3D: true
    })
  }

  const requestFooterUpdate = () => {
    // Footer viewport'a yaklaşmadan rect bile okuma: scroll listener tüm sayfa
    // boyunca aktif ama iş sadece footer görünürlüğe yaklaşınca yapılır.
    if (!footerNearViewport || ticking) return

    ticking = true
    requestAnimationFrame(updateFooterShape)
  }

  const footerObserver = new IntersectionObserver(
    (entries) => {
      footerNearViewport = entries.some((entry) => entry.isIntersecting)
      if (footerNearViewport) requestFooterUpdate()
    },
    { rootMargin: "80% 0px" }
  )
  footerObserver.observe(wrapper)

  updateFooterShape()
  window.addEventListener("scroll", requestFooterUpdate, { passive: true })
  window.addEventListener("resize", requestFooterUpdate)

  cleanupFooter = () => {
    footerObserver.disconnect()
    window.removeEventListener("scroll", requestFooterUpdate)
    window.removeEventListener("resize", requestFooterUpdate)
  }
}

onMounted(() => {
  initFooterAnimation()
})

onBeforeUnmount(() => {
  cleanupFooter?.()
  cleanupFooter = null
})
</script>
