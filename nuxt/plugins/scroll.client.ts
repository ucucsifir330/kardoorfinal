import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { registerGsap } from "~/composables/useGSAP";

/**
 * GSAP ScrollSmoother — replaces the old Lenis smooth-scroll plugin.
 * The whole site scrolls through GSAP now: ScrollSmoother drives the smoothing,
 * ScrollTrigger reads native scroll position (ScrollSmoother keeps the native
 * scrollbar and offsets #smooth-content via transform).
 *
 * Reference: greensock/gsap-skills (official).
 */
export default defineNuxtPlugin((nuxtApp) => {
  registerGsap();

  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const userAgent = navigator.userAgent;
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android)/i.test(userAgent);

  document.documentElement.classList.toggle("is-touch-device", isCoarsePointer);
  document.documentElement.classList.toggle("is-safari", isSafari);

  // Disable ScrollSmoother (and with it all the GSAP auto-settle) ONLY on genuine
  // touch-primary small screens — real phones/tablets. Chrome DevTools device
  // emulation reports pointer:coarse even at desktop widths (1920x1080 etc.),
  // which previously nuked the smoother so portal/door snaps appeared dead while
  // inspecting responsive sizes. Gating on width keeps desktop-class viewports on
  // the smoother regardless of emulated pointer type.
  const isTouchDevice = isCoarsePointer && window.innerWidth <= 1024;

  // Touch devices use native scrolling (ScrollSmoother smoothing is desktop-only here).
  if (isTouchDevice) {
    return {
      provide: {
        smoother: () => null as ScrollSmoother | null
      }
    };
  }

  const createSmoother = () => {
    if (ScrollSmoother.get()) return ScrollSmoother.get()!;
    return ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      // Safari struggles more with long full-page transform smoothing over the
      // dense homepage catalog. Keep the cinematic feel, but shorten WebKit's
      // compositing window.
      smooth: isSafari ? 0.72 : 1.2,
      // effects: false — projede hiç [data-speed]/[data-lag] elementi YOK, yani
      // parallax effect hiç kullanılmıyordu. effects:true iken ScrollSmoother her
      // frame DOM'u tarayıp effect adaylarını hesaplıyor → boşuna CPU/jank.
      // Kapatmak görsel olarak sıfır fark yaratır (kullanan eleman yok).
      effects: false,
      smoothTouch: 0,
      ignoreMobileResize: true,
      normalizeScroll: false
    });
  };

  // The wrapper exists after the app is mounted.
  nuxtApp.hook("app:mounted", () => {
    createSmoother();
    ScrollTrigger.refresh();

    // While the page is actively scrolling, drop expensive backdrop-filter blur
    // (it re-samples everything behind it every frame). Restored shortly after
    // the scroll settles. Big paint win during the pinned cinematic sections;
    // the glass UI looks identical at rest. CSS keys off html.is-scrolling.
    const root = document.documentElement;
    let scrollIdleTimer = 0;
    const markScrolling = () => {
      root.classList.add("is-scrolling");
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        root.classList.remove("is-scrolling");
      }, isSafari ? 320 : 120);
    };
    window.addEventListener("scroll", markScrolling, { passive: true });
    window.addEventListener("wheel", markScrolling, { passive: true });
  });

  // Page transitions (out-in): jump to top and recalc after the new page settles.
  //
  // Ana sayfanın hero'su (EntranceDoorLab) HomeContentLoader üzerinden LAZY mount
  // edilir → bu hook çalıştığında pin trigger HENÜZ kurulmamış olabilir. Tek bir
  // rAF-refresh, pin var olmadan çalışıp boşa gidiyor; pin sonradan ScrollSmoother'ın
  // güncel transform state'ine göre kuruluyor ve section ~60px kayıp altta/üstte
  // zemin şeridi bırakıyordu. Çözüm: birkaç frame boyunca refresh'i tekrarla — geç
  // mount olan pin de yakalanıp temiz ölçülsün. refresh() idempotent (sadece ölçer).
  nuxtApp.hook("page:finish", () => {
    const smoother = ScrollSmoother.get();
    smoother?.scrollTo(0, false);

    let frame = 0;
    const tick = () => {
      ScrollTrigger.refresh();
      if (++frame < 8) requestAnimationFrame(tick); // ~8 frame boyunca yeniden ölç
    };
    requestAnimationFrame(tick);
    // Fontlar/görseller geç çözülürse son bir ölçüm daha.
    document.fonts?.ready.then(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  });

  window.addEventListener("beforeunload", () => {
    ScrollSmoother.get()?.scrollTo(0, false);
  });

  gsap.ticker.lagSmoothing(0);

  return {
    provide: {
      smoother: () => ScrollSmoother.get()
    }
  };
});
