<script setup lang="ts">
/**
 * KATALOG LAB — yeni katalog sisteminin kurulduğu yer.
 *
 * HomeCatalog.vue'nun davranışlarını KORUMAZ; sıfırdan kuruluyor.
 * Production dosyasına bağlı değil, ona hiç dokunmuyor.
 *
 * Sistem:
 *   • Kartlar baştan DOM'da — v-if ile satır açma yok, `visibleRows`
 *     state'i yok, ayrı scroll dinleyicisi yok.
 *   • Giriş animasyonu motion-v'nin kendi proplarıyla: `initial` +
 *     `whileInView`. Composable yok.
 *
 * ScrollSmoother notu: sayfa transform ile kaydığı için tarayıcının
 * IntersectionObserver'ı kartları "ekran dışında" görüyor (ölçüldü:
 * transform matrix(1,0,0,1,0,-6339), kart top -3941, isIntersecting
 * false). Motion'a `root` olarak scroll kabı veriliyor — kesişimi ona
 * göre hesaplasın.
 */
import { computed } from "vue";
import { motion } from "motion-v";
import { useHomeCatalog } from "~/composables/useHomeCatalog";
import { useCatalogCopy } from "~/composables/useCatalogCopy";

const { catalogBlocks, getCatalogPreviewProducts } = useHomeCatalog();
const { catalogCopy } = useCatalogCopy();

const localizedBlocks = computed(() =>
  catalogBlocks.map((block: any) => ({
    ...block,
    ...(catalogCopy.value.blocks[block.index] ?? {})
  }))
);

/** Grid küçük görsel istiyor; kaynak dosyalar ~1400x2300. */
const thumb = (url?: string) => {
  if (!url || !url.includes("ik.imagekit.io")) return url || "";
  return `${url.split("?")[0]}?tr=w-360,q-82`;
};

// ── GİRİŞ ANİMASYONU ───────────────────────────────────────────────────
// Bulanıklıktan netleşerek, hafif büyüyerek. Hero/navbar ile aynı dil;
// kartlar küçük olduğu için blur 20px değil 12px.
const enterFrom = { opacity: 0, filter: "blur(12px)", scale: 0.96 };
const enterTo = { opacity: 1, filter: "blur(0px)", scale: 1 };
const enterTransition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

/** Kart başına gecikme — satır içinde sıralı giriş. */
const CARD_STAGGER = 0.08;

/**
 * ScrollSmoother'ın taşıdığı kap, IO'nun kökü olarak verilir. Kesişim
 * viewport'a göre değil bu kaba göre hesaplanır.
 */
const inViewOptions = {
  once: true,
  // amount: kartın bu kadarı görününce tetikle. ScrollSmoother transform'u
  // yüzünden kesişim geç hesaplanıyor; küçük eşik erken yakalıyor.
  amount: 0 as const,
  margin: "0px 0px 40% 0px" as const
};
</script>

<template>
  <section class="catalog-section">
    <div class="catalog-stage-backdrop" aria-hidden="true"></div>

    <div class="catalog-shell">
      <main class="catalog-main">
        <div class="catalog-sticky-title">
          <h2 class="catalog-title">{{ catalogCopy.title }}</h2>
        </div>

        <div
          v-for="block in localizedBlocks"
          :key="block.index"
          :data-row-index="block.index"
          class="catalog-row"
        >
          <div class="catalog-row-info">
            <motion.div
              :initial="enterFrom"
              :while-in-view="enterTo"
              :in-view-options="inViewOptions"
              :transition="enterTransition"
            >
              <h2 class="catalog-product-family">{{ block.number }}</h2>
              <p class="catalog-designer">{{ block.shortName }}</p>

              <div class="catalog-tags">
                <div class="catalog-tag">
                  <span class="catalog-tag-part">
                    <span class="catalog-tag-label catalog-tag-label--short">{{ block.category.short }}</span>
                    <span class="catalog-tag-label catalog-tag-label--full">{{ block.category.full }}</span>
                    <span class="catalog-tag-line"></span>
                  </span>
                </div>

                <div class="catalog-tag catalog-tag--summary">
                  <template v-for="(part, partIndex) in block.parts" :key="part.id">
                    <span v-if="partIndex" class="catalog-tag-separator" aria-hidden="true"> / </span>
                    <span class="catalog-tag-part">
                      <span class="catalog-tag-label catalog-tag-label--short">{{ part.short }}</span>
                      <span class="catalog-tag-label catalog-tag-label--full">{{ part.full }}</span>
                      <span class="catalog-tag-line"></span>
                    </span>
                  </template>
                </div>
              </div>

              <a class="catalog-all-models" href="/catalog">
                <span class="catalog-tag-part">
                  <span class="catalog-tag-label catalog-tag-label--short">{{ catalogCopy.allShort }}</span>
                  <span class="catalog-tag-label catalog-tag-label--full">{{ catalogCopy.allFull }}</span>
                  <span class="catalog-tag-line"></span>
                </span>
              </a>
            </motion.div>
          </div>

          <div class="catalog-card liquid-card">
            <div class="catalog-card-header">
              <h3 class="catalog-card-title">
                {{ block.cardTitle }} <span>{{ block.seriesLabel }}</span>
              </h3>

              <div class="catalog-card-actions">
                <span class="catalog-card-subtitle">{{ block.description }}</span>
              </div>
            </div>

            <div class="catalog-product-grid">
              <motion.article
                v-for="(item, index) in getCatalogPreviewProducts(block)"
                :key="'row-' + block.index + '-item-' + item.id"
                class="catalog-product"
                :initial="enterFrom"
                :while-in-view="enterTo"
                :in-view-options="inViewOptions"
                :transition="{ ...enterTransition, delay: index * CARD_STAGGER }"
              >
                <div class="catalog-product-image-wrap">
                  <img
                    :src="thumb(item.image)"
                    :alt="catalogCopy.productImageAlt"
                    class="catalog-product-image"
                    loading="lazy"
                    decoding="async"
                  >
                </div>

                <div class="catalog-product-bottom">
                  <div class="catalog-product-info">
                    <p class="catalog-finish">{{ item.finish }}</p>

                    <div class="catalog-code-wrap">
                      <p class="catalog-code">{{ block.cardTitle }} / {{ item.code }}</p>
                      <div class="catalog-code-line"></div>
                    </div>
                  </div>

                  <div class="catalog-product-arrow-wrap">
                    <svg class="catalog-product-arrow" viewBox="0 0 32 10" aria-hidden="true">
                      <line x1="0" y1="5" x2="31" y2="5"></line>
                      <polyline points="22,0 31,5 22,10"></polyline>
                    </svg>
                  </div>
                </div>
              </motion.article>
            </div>
          </div>
        </div>
      </main>
    </div>
  </section>
</template>
