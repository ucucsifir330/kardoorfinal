import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { TextPlugin } from "gsap/TextPlugin";

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
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, TextPlugin);
  registered = true;
}

export function useGSAP() {
  registerGsap();
  return { gsap, ScrollTrigger, ScrollSmoother, ScrollToPlugin, TextPlugin };
}
