# nuxt/devtools

Sadece geliştirme sırasında elle kullanılan araçlar. **Bu klasör Nuxt'un auto-import
taramasının dışında** (`app/components/` altında değil), yani buradaki hiçbir dosya
siteye render edilmez, production bundle'ına girmez.

## DebugLab.vue

Sağ altta açılan dev paneli: tema/CSS katmanı aç-kapat, Vite dev style-tag'lerini dosya
bazında kapatma, GSAP dondurma, katalog grid/flex, radius + font slider, outline ve
12-kolon grid overlay, hover inspector, A/B slot kaydet/yükle, ayarları JSON kopyala.

`?debug=1` ile açılır (localStorage `kardoor-debug-lab-v3`), `?debug=0` kapatır.
Temiz tarayıcı profili (playwright/snapshot araçları) panele hiç dokunmaz — bu kapı
bilerek var, snapshot'ları kirletmemesi için.

### Geri açmak için

`nuxt/app/app.vue` içine:

```vue
<script setup lang="ts">
import DebugLab from "~~/devtools/DebugLab.vue";
const isDevBuild = import.meta.dev;
</script>

<template>
  <ClientOnly>
    <DebugLab v-if="isDevBuild" />
  </ClientOnly>
</template>
```

Not: auto-import olmadığı için `import` satırı şart; `~~/` proje kökünü (`nuxt/`) gösterir.
