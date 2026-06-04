<template>
  <span class="brand-mark">
    <span class="brand-symbol" aria-hidden="true">
      <span class="brand-symbol__left" />
      <span class="brand-symbol__right" />
      <span class="brand-symbol__core" />
    </span>

    <span class="brand-copy">
      <span class="brand-title">
        <strong class="brand-title__ege">EGE</strong>
        <span class="brand-title__kardoor" aria-hidden="true">KARDOOR</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  font-family: Inter, system-ui, sans-serif;
}

.brand-symbol {
  position: relative;
  width: 44px;
  height: 54px;
  flex: 0 0 auto;
}

.brand-symbol__left,
.brand-symbol__right,
.brand-symbol__core {
  position: absolute;
  display: block;
}

.brand-symbol__left {
  left: 0;
  top: 5px;
  width: 22px;
  height: 44px;
  background: linear-gradient(180deg, #0066ff 0%, #0fa6ff 100%);
  clip-path: polygon(0 18%, 100% 0, 100% 32%, 55% 46%, 55% 100%, 0 72%);
}

.brand-symbol__right {
  right: 0;
  top: 5px;
  width: 22px;
  height: 44px;
  background: linear-gradient(180deg, #09338f 0%, #06101c 100%);
  clip-path: polygon(0 0, 100% 18%, 100% 72%, 45% 100%, 45% 46%, 0 32%);
}

.brand-symbol__core {
  left: 18px;
  bottom: 0;
  width: 13px;
  height: 36px;
  background: linear-gradient(180deg, #1558dc 0%, #071b52 100%);
  clip-path: polygon(0 37%, 100% 20%, 100% 100%, 0 78%);
}

.brand-copy {
  display: grid;
  gap: 0.2rem;
}

.brand-title {
  display: inline-flex;
  align-items: baseline;
  gap: 0.26em;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brand-title__ege {
  color: #3a83ff;
}

.brand-title__kardoor {
  display: inline-block;
  position: relative;
  width: 5.42em;
  height: 1.14em;
  overflow: visible;
  color: transparent;
  transform: translateY(0.08em);
}

.brand-title__kardoor::before {
  content: "";
  position: absolute;
  inset: -0.05em -0.02em -0.06em;
  background: rgba(255, 255, 255, 0.01);
  backdrop-filter: invert(1);
  -webkit-backdrop-filter: invert(1);
  mask:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 91 19'%3E%3Ctext x='0' y='15.5' font-family='Inter, Arial, sans-serif' font-size='17' font-weight='900' letter-spacing='0'%3EKARDOOR%3C/text%3E%3C/svg%3E")
    0 0 / 100% 100% no-repeat;
  -webkit-mask:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 91 19'%3E%3Ctext x='0' y='15.5' font-family='Inter, Arial, sans-serif' font-size='17' font-weight='900' letter-spacing='0'%3EKARDOOR%3C/text%3E%3C/svg%3E")
    0 0 / 100% 100% no-repeat;
}

@media (max-width: 820px) {
  .brand-symbol {
    width: 34px;
    height: 42px;
  }

  .brand-symbol__left,
  .brand-symbol__right {
    width: 17px;
    height: 34px;
  }

  .brand-symbol__core {
    left: 14px;
    width: 10px;
    height: 28px;
  }

}
</style>
