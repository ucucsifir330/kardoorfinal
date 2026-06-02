# Ada CTA Buttons

Nuxt/Vue projesine tak calistir CTA butonu.

## Kurulum

`AdaCtaButton.vue` dosyasini hedef projede `components/AdaCtaButton.vue` olarak kopyala.

## Kullanim

```vue
<template>
  <div class="cta-row">
    <AdaCtaButton href="/catalog" label="Konfiguratoru Deneyin" />
    <AdaCtaButton href="/catalog" label="Koleksiyonu Kesfet" icon-position="left" />
  </div>
</template>

<style scoped>
.cta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(12px, 1.15vw, 22px);
}
</style>
```

## Not

Bu paket sadece buton hover animasyonunu tasir. Ekran goruntusundeki siyah cizgi animasyonu sayfa olcumlerine bagli oldugu icin ayri entegre edilmelidir.
