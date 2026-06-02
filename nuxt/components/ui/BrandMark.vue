<template>
  <span class="brand-mark">
    <span class="brand-symbol" aria-hidden="true">
      <span class="brand-symbol__left" />
      <span class="brand-symbol__right" />
      <span class="brand-symbol__core" />
    </span>

    <span class="brand-copy">
      <span class="brand-title"><strong>EGE</strong> KARDOOR</span>
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
  font-size: 1.05rem;
  font-weight: 900;
  text-transform: uppercase;
}

.brand-title strong {
  color: #3a83ff;
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
