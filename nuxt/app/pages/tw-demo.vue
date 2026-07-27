<script setup lang="ts">
/**
 * GECICI karsilastirma sayfasi — /tw-demo
 *
 * Solda mevcut CSS'li HomeReviews, altta Tailwind'li HomeReviewsTailwind.
 * Karar verildikten sonra bu dosya SILINIR; hicbir sey ona bagli degil.
 */
import { ref } from "vue";
import HomeReviewsTailwind from "~/components/home/HomeReviewsTailwind.vue";

const reviews = [
  { id: 1, text: "Kardoor Çelik Kapı ailesi sorunumu özenle dinledi ve çözdü. Güven bey ve montaj ekibi arkadaşlara teşekkür ediyorum.", name: "Nadire Ş." },
  { id: 2, text: "Kendi evime ve oğlumun evine kapı yaptırdık. Çok memnun kaldık. Personeller işi beklediğimden hızlı teslim ettiler.", name: "Ahmet M." },
  { id: 3, text: "Yaptıkları işlerde gerek kaliteleri olsun gerek hızları olsun 20 yıldır böyle bir firmayla hiç çalışmamıştım.", name: "Mustafa K." },
  { id: 4, text: "İzmir'de dış iklim kapısı ararken Kardoor'u bulduk. Kapının yalıtımı ve malzeme kalitesi gerçekten muazzam.", name: "Elif T." }
];

const noop = () => {};
const titleWidth = ref(320);
</script>

<template>
  <main class="app-shell app-shell--day">
    <HomeReviewsTailwind
      static-label="Son"
      bottom-label="size bırakıyoruz."
      :dynamic-gap="16"
      :title-width="titleWidth"
      :row1="reviews"
      :row2="reviews"
      :set-static-text-ref="noop"
      :set-hidden-span-ref="noop"
      :set-typewriter-ref="noop"
      :set-inner1-ref="noop"
      :set-inner2-ref="noop"
      :start-drag="noop"
      :set-hover="noop"
      :tilt-card="noop"
      :reset-tilt="noop"
    />
  </main>
</template>
