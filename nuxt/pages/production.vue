<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

useSeoMeta({
  title: "Production",
  description:
    "Kardoor steel door production capabilities for international orders and project quantities."
});

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from(".editorial-page__header", {
      opacity: 0,
      y: 24,
      duration: 0.72,
      ease: "expo.out",
      delay: 0.08
    });

    gsap.from(".editorial-item", {
      opacity: 0,
      y: 18,
      duration: 0.6,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: ".editorial-items",
        start: "top 80%",
        once: true
      }
    });
  });
});
</script>

<template>
  <section class="editorial-page">

    <header class="editorial-page__header">
      <h1>Steel door production organized for repeatable export quality.</h1>
      <p>Every Kardoor door is produced against a defined model code, surface specification and series family — making reorders and project quantities reliable at scale.</p>
    </header>

    <div class="editorial-body">
      <div class="editorial-body__label">
        <p>Production capabilities</p>
      </div>

      <div class="editorial-items">
        <div class="editorial-item">
          <span class="editorial-item__num">01</span>
          <div class="editorial-item__content">
            <h2>Series-based manufacturing</h2>
            <p>Model codes, surfaces and series families help buyers order with clear repeatability. Each series is produced against consistent tolerances and finish specifications.</p>
          </div>
        </div>
        <div class="editorial-item">
          <span class="editorial-item__num">02</span>
          <div class="editorial-item__content">
            <h2>Material control</h2>
            <p>Steel body, frame, surface, lock and accessories are managed around durability and finish quality. Material sourcing and inspection are part of every production run.</p>
          </div>
        </div>
        <div class="editorial-item">
          <span class="editorial-item__num">03</span>
          <div class="editorial-item__content">
            <h2>Order preparation</h2>
            <p>Orders are prepared for model selection, project quantities and shipment-ready packaging. Production schedules accommodate dealer volumes and development timelines.</p>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>
