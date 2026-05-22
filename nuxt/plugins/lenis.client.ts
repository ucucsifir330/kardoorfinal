import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    smoothWheel: true,
    wheelMultiplier: 0.82,
    touchMultiplier: 1.05,
    lerp: 0.085
  });

  lenis.on("scroll", () => {
    ScrollTrigger.update();
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  window.addEventListener("beforeunload", () => {
    lenis.scrollTo(0, {
      immediate: true,
      force: true
    });
  });

  return {
    provide: {
      lenis
    }
  };
});