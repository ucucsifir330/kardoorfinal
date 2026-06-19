<template>
  <span class="brand-mark">
    <span class="brand-symbol" aria-hidden="true">
      <span class="brand-symbol__negative" />
    </span>

    <span class="brand-copy">
      <span class="brand-title">
        <strong class="brand-title__ege">EGE</strong>
        <span class="brand-title__kardoor">KARDOOR</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.52rem;
  font-family: Inter, system-ui, sans-serif;
}

.brand-symbol {
  position: relative;
  width: 24px;
  height: 28px;
  flex: 0 0 auto;
  mix-blend-mode: difference;
}

.brand-symbol__negative {
  position: absolute;
  inset: 0;
  display: block;
  background: #fff;
  mask: url("/images/brand/kardoor-footer-mark-tight.png") center / contain no-repeat;
  -webkit-mask: url("/images/brand/kardoor-footer-mark-tight.png") center / contain no-repeat;
}

.brand-copy {
  display: grid;
  gap: 0.2rem;
}

.brand-title {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 1.06rem;
  font-weight: 900;
  letter-spacing: 0;
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

.brand-title__kardoor {
  display: inline-block;
  color: #fff;
  font-size: 1.02em;
  line-height: 1;
  mix-blend-mode: difference;
  transform: translateY(0.005em) scaleX(1.035);
  transform-origin: left center;
}

@media (max-width: 820px) {
  .brand-mark {
    gap: 0.46rem;
  }

  .brand-symbol {
    width: 20px;
    height: 24px;
  }

  .brand-title {
    gap: 0.34rem;
    font-size: 0.98rem;
  }

}
</style>
