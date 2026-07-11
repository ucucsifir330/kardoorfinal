<template>
  <span class="brand-mark">
    <span class="brand-title">
      <strong class="brand-title__ege">EGE</strong>
      <span class="brand-title__kardoor">KARDOOR</span>
    </span>
  </span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
}

.brand-title {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 1.06rem;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.brand-title__ege {
  display: inline-flex;
  align-items: center;
  height: 1em;
  color: #3a83ff;
  font-size: 1em;
  line-height: 1;
}

/* Beyaz mürekkep: header'ın ink blend katmanı bu rengi sayfaya karşı invert
   eder. Ghost (dokunmatik) kopyada site-header.css tema rengiyle ezer. */
.brand-title__kardoor {
  display: inline-block;
  color: #fff;
  font-size: 1.02em;
  line-height: 1;
  transform: translateY(0.005em) scaleX(1.035);
  transform-origin: left center;
}

@media (max-width: 820px) {
  .brand-title {
    gap: 0.34rem;
    font-size: 0.98rem;
  }
}
</style>
