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

  /**
   * KARŞILAŞTIRMA ANAHTARI — smooth scroll hissini yan yana görmek için.
   *
   *   ?nosmoother=1   ScrollSmoother kurulmaz (native scroll)
   *   ?nosmoother=0   zorla açık
   *   (parametresiz)  son seçim hatırlanır
   *
   * Ölçüldü (masaüstü Chrome, dev): hero pin bandında native p95 36.5→15.6 ms,
   * jank'lı kare %25→%5. Katalog/footer'da fark yok. Kapı snap'leri iki modda da
   * birebir aynı çalışıyor. Kaybedilen tek şey sinematik yumuşama hissi — bu
   * anahtar tam olarak onu gözle karşılaştırmak için var.
   *
   * GEÇİCİ: motor kararı verilince bu blok ve karşı yol silinecek.
   */
  const SMOOTHER_TERCIH_ANAHTARI = "kardoor:nosmoother";
  const nosmootherParam = new URLSearchParams(window.location.search).get("nosmoother");

  if (nosmootherParam !== null) {
    try {
      if (nosmootherParam === "0") localStorage.removeItem(SMOOTHER_TERCIH_ANAHTARI);
      else localStorage.setItem(SMOOTHER_TERCIH_ANAHTARI, "1");
    } catch {
      // localStorage kapalıysa (gizli sekme vb.) sorun değil — URL yine çalışır.
    }
  }

  let forceNative = nosmootherParam !== null && nosmootherParam !== "0";
  if (nosmootherParam === null) {
    try {
      forceNative = localStorage.getItem(SMOOTHER_TERCIH_ANAHTARI) === "1";
    } catch {
      forceNative = false;
    }
  }

  document.documentElement.classList.toggle("is-native-scroll", forceNative);
  if (forceNative) {
    console.info(
      "[kardoor] ScrollSmoother KAPALI (native scroll). Geri açmak için: ?nosmoother=0"
    );
  }

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
  if (isTouchDevice || forceNative) {
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

    // Sabit 8 frame yerine: trigger sayısı sabitlenene kadar ölç, sonra dur.
    // refresh() tüm sayfa geometrisini okur; her sayfa geçişinde 8 kez tekrar
    // etmek geçişlerdeki takılmanın kaynağıydı. Tavan yine 8, yani en kötü
    // durumda eski davranış korunur.
    let frame = 0;
    let oncekiSayi = -1;
    let sabitFrame = 0;

    const tick = () => {
      ScrollTrigger.refresh();

      const sayi = ScrollTrigger.getAll().length;
      sabitFrame = sayi === oncekiSayi ? sabitFrame + 1 : 0;
      oncekiSayi = sayi;

      if (sabitFrame >= 2 || ++frame >= 8) return;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
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
