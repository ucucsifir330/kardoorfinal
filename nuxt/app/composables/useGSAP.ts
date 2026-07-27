import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import { SplitText } from "gsap/SplitText";

/**
 * Single source of truth for GSAP plugin registration.
 * Reference: greensock/gsap-skills (official) — Nuxt 4 SSR-safe pattern.
 *
 * GSAP plugins touch `window`, so registration must run on the client only.
 * Idempotent: registerPlugin can be called multiple times safely.
 */

let registered = false;

export function registerGsap() {
  if (registered || !import.meta.client) return;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, TextPlugin, SplitText);
  // Mobilde dikey scroll adres çubuğunu gizleyince yükseklik değişir ve GSAP
  // varsayılan olarak her seferinde global ScrollTrigger.refresh() yapar (trace:
  // _getBounds/_getComputedProperty birikimi = mobil scroll jank). ignoreMobileResize
  // bu yükseklik-only resize'ları yok sayar; gerçek genişlik/rotasyon değişiminde
  // refresh yine bizim bileşen handler'larımızdan tetiklenir.
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

export function useGSAP() {
  registerGsap();
  return { gsap, ScrollTrigger, ScrollSmoother, ScrollToPlugin, TextPlugin, SplitText };
}
