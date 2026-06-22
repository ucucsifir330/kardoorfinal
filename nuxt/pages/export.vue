<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

useSeoMeta({
  title: "Export",
  description:
    "Kardoor export support for steel door dealers, importers and project-based shipments."
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
      <h1>Steel doors prepared for international markets.</h1>
      <p>Kardoor supports importers, dealers and development buyers with catalog access, clear model codes and shipment-ready preparation.</p>
    </header>

    <div class="editorial-body">
      <div class="editorial-body__label">
        <p>Export capabilities</p>
      </div>

      <div class="editorial-items">
        <div class="editorial-item">
          <span class="editorial-item__num">01</span>
          <div class="editorial-item__content">
            <h2>Buyer support</h2>
            <p>Catalog flow, product codes and series information help importers evaluate Kardoor quickly. Every model ships with complete technical documentation.</p>
          </div>
        </div>
        <div class="editorial-item">
          <span class="editorial-item__num">02</span>
          <div class="editorial-item__content">
            <h2>Export packaging</h2>
            <p>Products are prepared with international transport, protection and shipment readiness in mind. Packaging is designed for long-haul freight conditions.</p>
          </div>
        </div>
        <div class="editorial-item">
          <span class="editorial-item__num">03</span>
          <div class="editorial-item__content">
            <h2>Project quantities</h2>
            <p>Door selections can be structured for dealers, residential developments and repeat supply. We accommodate both one-time project orders and ongoing dealer volumes.</p>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>
