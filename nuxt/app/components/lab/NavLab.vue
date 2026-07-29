<!--
  Nav.vue — Kardoor navbar
  Nuxt 4 / Vue 3 / TS · GSAP (menü spring) · Lenis (scroll-lock, opsiyonel)

  Kullanım:
    <Nav :lenis="lenis" @theme-change="onTheme" @lang-change="onLang">
      <template #logo>
        <img src="/logo-k.svg" alt="Kardoor" />
      </template>
    </Nav>

  - Ölçüler prop (logoSize/drop/fillet/textGap/flareTop/flareBottom). Default: 90/30/3/40/40/40.
  - Navbar rengi temadan bağımsız sabit koyu; tema toggle yalnız 'theme-change' yayar.
  - Mobil alt-köşe oyuğu sayfa zemini rengiyle oyulur → zeminin farklıysa
    :style="{ '--page-bg': '#xxxxxx' }" ver.
  - Masaüstü: aşağı inince gizlenir, yukarı çekince gelir.
  - Mobil: full-width bar + concave alt köşeler; ortadaki damlaya dokun → menü.
-->

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'

interface NavLink { label: string; href: string }

const props = withDefaults(defineProps<{
  links?: NavLink[]
  contact?: NavLink
  lenis?: any
  logoSize?: number
  drop?: number
  fillet?: number
  textGap?: number
  flareTop?: number
  flareBottom?: number
}>(), {
  links: () => ([
    { label: 'Koleksiyonlar', href: '/koleksiyonlar' },
    { label: 'Referanslar',   href: '/referanslar' },
    { label: 'Hakkımızda',    href: '/hakkimizda' },
  ]),
  contact: () => ({ label: 'İletişim', href: '/iletisim' }),
  lenis: undefined,
  logoSize: 90,
  drop: 30,
  fillet: 3,
  textGap: 40,
  flareTop: 40,
  flareBottom: 40,
})

const emit = defineEmits<{
  (e: 'theme-change', v: 'light' | 'dark'): void
  (e: 'lang-change', v: 'tr' | 'en'): void
}>()

const cssVars = computed(() => {
  const R = props.logoSize / 2
  const overlap = Math.max(2, Math.min(props.logoSize - 2, props.logoSize - props.drop))
  const off = R - overlap
  const a = Math.sqrt(Math.max(0, R * R - off * off))
  return {
    '--rt': `${props.flareTop}px`,
    '--rb': `${props.flareBottom}px`,
    '--logo-size': `${props.logoSize}px`,
    '--overlap': `${overlap}px`,
    '--mouth': `${2 * a}px`,
    '--fillet': `${props.fillet}px`,
    '--slot': `${props.logoSize + 2 * props.textGap}px`,
  } as Record<string, string>
})

const theme = ref<'light' | 'dark'>('dark')
const lang = ref<'tr' | 'en'>('tr')
const setTheme = (v: 'light' | 'dark') => { theme.value = v; emit('theme-change', v) }
const setLang = (v: 'tr' | 'en') => { lang.value = v; emit('lang-change', v) }

const hidden = ref(false)
let lastScroll = 0
function handleScroll(y: number) {
  if (menuOpen.value) { lastScroll = y; return }
  hidden.value = y > lastScroll && y > 90
  lastScroll = y
}

const menuOpen = ref(false)
const panel = ref<HTMLElement | null>(null)
const isMobile = () => import.meta.client && window.matchMedia('(max-width: 680px)').matches

function openMenu() {
  menuOpen.value = true
  props.lenis?.stop?.()
  document.documentElement.style.overflow = 'hidden'
  const links = panel.value ? Array.from(panel.value.querySelectorAll('.nav__mlink')) : []
  gsap.killTweensOf([panel.value, ...links])
  gsap.fromTo(panel.value,
    { scale: 0.45, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' })
  gsap.fromTo(links,
    { y: 10, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.3, stagger: 0.06, delay: 0.1, ease: 'power2.out' })
}
function closeMenu() {
  props.lenis?.start?.()
  document.documentElement.style.overflow = ''
  gsap.killTweensOf(panel.value)
  gsap.to(panel.value, {
    scale: 0.45, opacity: 0, duration: 0.28, ease: 'power2.in',
    onComplete: () => { menuOpen.value = false },
  })
}
const toggleMenu = () => { if (isMobile()) menuOpen.value ? closeMenu() : openMenu() }

let detachScroll: (() => void) | null = null
onMounted(() => {
  if (props.lenis?.on) {
    const cb = (e: any) => handleScroll(e.scroll ?? e.animatedScroll ?? window.scrollY)
    props.lenis.on('scroll', cb)
    detachScroll = () => props.lenis.off?.('scroll', cb)
  } else {
    const cb = () => handleScroll(window.scrollY)
    window.addEventListener('scroll', cb, { passive: true })
    detachScroll = () => window.removeEventListener('scroll', cb)
  }
})
onBeforeUnmount(() => {
  detachScroll?.()
  if (import.meta.client) document.documentElement.style.overflow = ''
})
</script>

<template>
  <div class="nav-root" :style="cssVars">
    <div class="nav-shell" :class="{ 'is-hidden': hidden, 'menu-open': menuOpen }">
      <nav class="nav" aria-label="Ana menü">
        <div class="nav__group nav__group--left">
          <NuxtLink v-for="l in props.links" :key="l.href" :to="l.href" class="nav__link">{{ l.label }}</NuxtLink>
        </div>

        <div class="nav__slot">
          <div class="nav__node">
            <button class="nav__logo" type="button" aria-label="Menü" @click="toggleMenu">
              <slot name="logo" />
            </button>
          </div>
        </div>

        <div class="nav__group nav__group--right">
          <NuxtLink :to="props.contact.href" class="nav__link">{{ props.contact.label }}</NuxtLink>
          <span class="nav__divider" />
          <div class="seg seg--theme" :data-i="theme === 'dark' ? 1 : 0">
            <span class="seg__thumb" />
            <button type="button" class="seg__btn" :class="{ 'is-active': theme === 'light' }" aria-label="Açık tema" @click="setTheme('light')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
            </button>
            <button type="button" class="seg__btn" :class="{ 'is-active': theme === 'dark' }" aria-label="Koyu tema" @click="setTheme('dark')">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" /></svg>
            </button>
          </div>
          <div class="seg seg--lang" :data-i="lang === 'en' ? 1 : 0">
            <span class="seg__thumb" />
            <button type="button" class="seg__btn" :class="{ 'is-active': lang === 'tr' }" @click="setLang('tr')">TR</button>
            <button type="button" class="seg__btn" :class="{ 'is-active': lang === 'en' }" @click="setLang('en')">EN</button>
          </div>
        </div>
      </nav>
    </div>

    <div class="nav__scrim" :class="{ 'is-open': menuOpen }" @click="closeMenu" />

    <div class="nav__panel-wrap" :class="{ 'is-open': menuOpen }">
      <div ref="panel" class="nav__panel">
        <NuxtLink v-for="l in props.links" :key="l.href" :to="l.href" class="nav__mlink" @click="closeMenu">{{ l.label }}</NuxtLink>
        <NuxtLink :to="props.contact.href" class="nav__mlink" @click="closeMenu">{{ props.contact.label }}</NuxtLink>
        <div class="nav__mrow">
          <div class="seg seg--theme" :data-i="theme === 'dark' ? 1 : 0">
            <span class="seg__thumb" />
            <button type="button" class="seg__btn" :class="{ 'is-active': theme === 'light' }" @click="setTheme('light')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
            </button>
            <button type="button" class="seg__btn" :class="{ 'is-active': theme === 'dark' }" @click="setTheme('dark')">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" /></svg>
            </button>
          </div>
          <div class="seg seg--lang" :data-i="lang === 'en' ? 1 : 0">
            <span class="seg__thumb" />
            <button type="button" class="seg__btn" :class="{ 'is-active': lang === 'tr' }" @click="setLang('tr')">TR</button>
            <button type="button" class="seg__btn" :class="{ 'is-active': lang === 'en' }" @click="setLang('en')">EN</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-root {
  --bar: #050505;
  --ink: #f4f4f5;
  --ink-dim: #8f8f95;
  --seg-bg: rgba(255, 255, 255, .09);
  --seg-thumb: #fff;
  --seg-ink-active: #0a0a0a;
  --divider: rgba(255, 255, 255, .15);
  --bar-pad-y: 15px;
  --bar-pad-x: 30px;
  --bg: var(--page-bg, #2b2be0);
}

.nav-shell {
  position: fixed; inset: 0 0 auto 0; z-index: 50;
  display: flex; justify-content: center; pointer-events: none;
  transition: transform .42s cubic-bezier(.4, 0, .2, 1);
}
.nav-shell.is-hidden { transform: translateY(-150%); }

.nav {
  pointer-events: auto; position: relative; width: auto;
  display: inline-grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  padding: var(--bar-pad-y) var(--bar-pad-x);
  background: var(--bar); border-radius: 0 0 var(--rb) var(--rb);
  box-shadow: 0 16px 44px rgba(0, 0, 0, .28);
}
.nav::before, .nav::after { content: ""; position: absolute; top: 0; width: var(--rt); height: var(--rt); }
.nav::before { right: 100%; background: radial-gradient(circle at bottom left, transparent var(--rt), var(--bar) calc(var(--rt) + .5px)); }
.nav::after  { left: 100%;  background: radial-gradient(circle at bottom right, transparent var(--rt), var(--bar) calc(var(--rt) + .5px)); }

.nav__group { display: flex; align-items: center; }
.nav__group--left { gap: 34px; justify-self: end; }
.nav__group--right { gap: 22px; justify-self: start; }
.nav__link {
  font-size: 16px; font-weight: 500; color: var(--ink-dim);
  text-decoration: none; letter-spacing: .005em; white-space: nowrap; transition: color .25s ease;
}
.nav__link:hover, .nav__link:focus-visible { color: var(--ink); outline: none; }

.nav__slot { width: var(--slot); grid-column: 2; position: relative; align-self: stretch; }

.nav__node { position: absolute; left: 50%; top: calc(100% + var(--bar-pad-y)); transform: translateX(-50%); width: var(--mouth); height: 0; z-index: 2; }
.nav__node::before, .nav__node::after { content: ""; position: absolute; top: 0; width: var(--fillet); height: var(--fillet); }
.nav__node::before { right: 100%; background: radial-gradient(circle at bottom left, transparent var(--fillet), var(--bar) calc(var(--fillet) + .5px)); }
.nav__node::after  { left: 100%;  background: radial-gradient(circle at bottom right, transparent var(--fillet), var(--bar) calc(var(--fillet) + .5px)); }
.nav__logo {
  position: absolute; left: 50%; top: 0;
  transform: translate(-50%, calc(-1 * var(--overlap)));
  width: var(--logo-size); height: var(--logo-size); border-radius: 50%;
  background: var(--bar); box-shadow: 0 12px 22px rgba(0, 0, 0, .26);
  display: grid; place-items: center; padding: 0; border: none; cursor: default; overflow: hidden;
}
.nav__logo :deep(img), .nav__logo :deep(svg) { width: 55%; height: 55%; object-fit: contain; }

.seg { position: relative; display: inline-flex; align-items: center; background: var(--seg-bg); border-radius: 999px; }
.seg__thumb { position: absolute; top: 3px; left: 3px; bottom: 3px; width: calc(50% - 3px); border-radius: 999px; background: var(--seg-thumb); box-shadow: 0 1px 4px rgba(0, 0, 0, .18); transition: transform .34s cubic-bezier(.4, 0, .2, 1); }
.seg[data-i="1"] .seg__thumb { transform: translateX(100%); }
.seg__btn { position: relative; z-index: 1; display: grid; place-items: center; background: none; border: none; cursor: pointer; color: var(--ink-dim); font: inherit; transition: color .28s ease; }
.seg__btn.is-active { color: var(--seg-ink-active); }
.seg--theme .seg__btn { width: 40px; height: 38px; }
.seg--theme svg { width: 18px; height: 18px; }
.seg--lang .seg__btn { width: 50px; height: 38px; font-size: 14px; font-weight: 600; letter-spacing: .04em; }
.nav__divider { width: 1px; height: 22px; background: var(--divider); }

.nav__scrim, .nav__panel-wrap { display: none; }

@media (max-width: 680px) {
  .nav-root {
    --logo-size: 72px; --overlap: 20px; --mouth: 64px; --fillet: 8px;
    --slot: 76px; --bar-pad-x: 16px; --rt: 24px; --rb: 24px;
  }
  .nav { width: 100%; border-radius: 0; }
  .nav::before { top: auto; bottom: 0; right: auto; left: 0; background: radial-gradient(circle at top right, transparent var(--rt), var(--bg) calc(var(--rt) + .5px)); }
  .nav::after  { top: auto; bottom: 0; left: auto; right: 0; background: radial-gradient(circle at top left, transparent var(--rt), var(--bg) calc(var(--rt) + .5px)); }
  .nav__group { display: none; }
  .nav__logo { cursor: pointer; }

  .nav__scrim {
    display: block; position: fixed; inset: 0; z-index: 45;
    background: rgba(0, 0, 0, .5); backdrop-filter: blur(2px);
    opacity: 0; pointer-events: none; transition: opacity .32s ease;
  }
  .nav__scrim.is-open { opacity: 1; pointer-events: auto; }

  .nav__panel-wrap {
    display: block; position: fixed; top: 8px; left: 50%; z-index: 49;
    transform: translateX(-50%); width: min(300px, calc(100vw - 36px));
    pointer-events: none;
  }
  .nav__panel-wrap.is-open { pointer-events: auto; }
  .nav__panel {
    display: flex; flex-direction: column;
    padding: 98px 20px 22px; background: var(--bar); border-radius: 34px;
    transform-origin: top center; transform: scale(.45); opacity: 0;
    box-shadow: 0 30px 60px rgba(0, 0, 0, .42);
  }
  .nav__mlink { color: var(--ink); font-size: 21px; font-weight: 500; text-align: center; text-decoration: none; padding: 13px 8px; border-radius: 14px; }
  .nav__mlink:active { background: rgba(255, 255, 255, .06); }
  .nav__mrow { display: flex; gap: 14px; justify-content: center; margin-top: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .nav-shell { transition: none; }
}
</style>

