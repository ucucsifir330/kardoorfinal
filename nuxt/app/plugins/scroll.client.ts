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

  // While the page is actively scrolling, drop expensive backdrop-filter blur
  // (it re-samples everything behind it every frame). Restored shortly after
  // the scroll settles. CSS keys off html.is-scrolling. Bu HER cihazda kurulur:
  // mobil Safari'de backdrop-filter masaüstünden de pahalı, optimizasyonun asıl
  // sahibi orası (eskiden touch erken dönüşü yüzünden mobilde hiç çalışmıyordu).
  const setupScrollingMarker = () => {
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
    window.addEventListener("touchmove", markScrolling, { passive: true });
  };

  // lagSmoothing HER cihazda kapatılır. Varsayılan davranış (500ms üstü kare →
  // "33ms geçti" say) ağır karelerde zaman-bazlı tween'leri kat kat uzatıyor;
  // mobilde dokunmatik portal girişi (1.9s) bu yüzden ~15-20s sürüyordu.
  gsap.ticker.lagSmoothing(0);

  // Touch devices use native scrolling (ScrollSmoother smoothing is desktop-only here).
  if (isTouchDevice) {
    nuxtApp.hook("app:mounted", setupScrollingMarker);
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
    setupScrollingMarker();
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

    // Kare saymak YETMİYOR: hero `<ClientOnly>` içinde ve rota dönüşünde
    // ~1400ms sonra mount oluyor (ölçüldü). 8 karelik döngü ~130ms'de bitip
    // pin daha yokken duruyordu; pin sonradan ScrollSmoother'ın o anki
    // transform'una göre kuruluyor ve hero ~57px kayıyordu — altında zemin
    // şeridi ("çukur") kalıyordu.
    //
    // Onun yerine DOM'u izliyoruz: pin kurulunca (ya da geometrisi
    // oturunca) ölçüyoruz. Zaman aşımı 3sn — gözlemci asla asılı kalmaz.
    let sonPinYuksekligi = -1;
    let sabitTur = 0;
    let bitti = false;

    const olcVeKontrolEt = () => {
      if (bitti) return;
      ScrollTrigger.refresh();

      const pin = document.querySelector<HTMLElement>(".pin-spacer");
      const yukseklik = pin ? Math.round(pin.getBoundingClientRect().height) : -1;

      // Yükseklik iki tur üst üste aynıysa geometri oturmuş demektir.
      sabitTur = yukseklik === sonPinYuksekligi && yukseklik > 0 ? sabitTur + 1 : 0;
      sonPinYuksekligi = yukseklik;

      if (sabitTur >= 2) durdur();
    };

    const gozlemci = new MutationObserver(() => requestAnimationFrame(olcVeKontrolEt));
    const zamanAsimi = window.setTimeout(() => durdur(), 3000);

    function durdur() {
      if (bitti) return;
      bitti = true;
      gozlemci.disconnect();
      window.clearTimeout(zamanAsimi);

      // GECİKMELİ SON ÖLÇÜM ŞART. Pin kurulup yüksekliği sabitlense bile
      // hero'nun iç geometrisi (görsel yükleme, font, kapı yerleşimi) bir
      // sonraki karelerde oturmaya devam ediyor. Bu ölçüm olmadan pin
      // ~57px kaymış kalıyor ve hero'nun altında zemin şeridi görünüyor
      // (ölçüldü: elle `refresh()` çağırınca boşluk 57 → 0).
      requestAnimationFrame(() => ScrollTrigger.refresh());
      window.setTimeout(() => ScrollTrigger.refresh(), 400);
      window.setTimeout(() => ScrollTrigger.refresh(), 1200);
    }

    gozlemci.observe(document.body, { childList: true, subtree: true });
    requestAnimationFrame(olcVeKontrolEt);

    // Fontlar/görseller geç çözülürse son bir ölçüm daha.
    document.fonts?.ready.then(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  });

  window.addEventListener("beforeunload", () => {
    ScrollSmoother.get()?.scrollTo(0, false);
  });

  return {
    provide: {
      smoother: () => ScrollSmoother.get()
    }
  };
});
