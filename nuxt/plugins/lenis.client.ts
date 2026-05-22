import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default defineNuxtPlugin(() => {
  const lenis = new Lenis({
    duration: 1.18,
    smoothWheel: true,
    wheelMultiplier: 0.72,
    touchMultiplier: 1.15
  });

  lenis.on("scroll", ScrollTrigger.update);

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return {
    provide: {
      lenis
    }
  };
});
