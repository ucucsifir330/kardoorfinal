<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";

type ProductVariant = {
  id: number;
  finish: string;
  code: string;
  image: string;
  liked: boolean;
};

type CatalogRow = {
  id: number;
  collection: string;
  designer: string;
  title: string;
  series: string;
  description: string;
  tags: string[];
  variants: ProductVariant[];
};

definePageMeta({
  pageTransition: false
});

const filters = ["Ürün kategorisi", "Ürünler", "Koleksiyon", "Tasarımcı", "Yüzey"];

const searchQuery = ref("");
const isScrolled = ref(false);
const mainRef = ref<HTMLElement | null>(null);
const visibleRows = ref<number[]>([]);

let observer: IntersectionObserver | null = null;
let rowRefs: HTMLElement[] = [];

const seriesImages = {
  ivoryLine: "https://ik.imagekit.io/kardoor/series/1.png?updatedAt=1778762643897",
  graphiteOak: "https://ik.imagekit.io/kardoor/series/2.png?updatedAt=1778762645386",
  classicSand: "https://ik.imagekit.io/kardoor/series/3.png?updatedAt=1778762644382",
  emeraldLine: "https://ik.imagekit.io/kardoor/series/4.png?updatedAt=1778762645568",
  monoGraphite: "https://ik.imagekit.io/kardoor/series/5.png?updatedAt=1778762645583"
} as const;

const baseVariants: ProductVariant[] = [
  {
    id: 1,
    finish: "saten paslanmaz çelik",
    code: "2701d002inx00",
    image: seriesImages.emeraldLine,
    liked: false
  },
  {
    id: 2,
    finish: "saten siyah",
    code: "2701d002nmx00",
    image: seriesImages.monoGraphite,
    liked: false
  },
  {
    id: 3,
    finish: "PVD saten siyah",
    code: "2701d002izx00",
    image: seriesImages.graphiteOak,
    liked: false
  },
  {
    id: 4,
    finish: "bronz",
    code: "2701d002brx00",
    image: seriesImages.classicSand,
    liked: false
  },
  {
    id: 5,
    finish: "beyaz",
    code: "2701d002whx00",
    image: seriesImages.ivoryLine,
    liked: false
  },
  {
    id: 6,
    finish: "PVD saten altın",
    code: "2701d002gdx00",
    image: seriesImages.emeraldLine,
    liked: false
  },
  {
    id: 7,
    finish: "PVD açık bronz",
    code: "2701d002lbx00",
    image: seriesImages.monoGraphite,
    liked: false
  },
  {
    id: 8,
    finish: "PVD şampanya",
    code: "2701d002chx00",
    image: seriesImages.graphiteOak,
    liked: false
  }
];

const catalogRows = ref<CatalogRow[]>(
  Array.from({ length: 7 }, (_, index) => {
    const rowId = index + 1;

    return {
      id: rowId,
      collection: "ONE",
      designer: "Güven Karaboğa",
      title: "PBL15/50",
      series: `Seri 0${rowId}`,
      description: "masif çift yaylı rozetli kapı kolu",
      tags: ["kapı donanımı", "rozetli kapı kolları"],
      variants: baseVariants.map((variant) => ({
        ...variant,
        id: rowId * 100 + variant.id,
        liked: false
      }))
    };
  })
);

const normalizedSearch = computed(() =>
  searchQuery.value.trim().toLocaleLowerCase("tr-TR")
);

const filteredRows = computed(() => {
  const query = normalizedSearch.value;

  if (!query) return catalogRows.value;

  return catalogRows.value
    .map((row) => {
      const rowMatches =
        row.collection.toLocaleLowerCase("tr-TR").includes(query) ||
        row.title.toLocaleLowerCase("tr-TR").includes(query) ||
        row.series.toLocaleLowerCase("tr-TR").includes(query) ||
        row.description.toLocaleLowerCase("tr-TR").includes(query);

      const variants = rowMatches
        ? row.variants
        : row.variants.filter((variant) => {
            return (
              variant.finish.toLocaleLowerCase("tr-TR").includes(query) ||
              variant.code.toLocaleLowerCase("tr-TR").includes(query)
            );
          });

      return {
        ...row,
        variants
      };
    })
    .filter((row) => row.variants.length > 0);
});

const setRowRef = (el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement && !rowRefs.includes(el)) {
    rowRefs.push(el);
  }
};

const observeRows = async () => {
  await nextTick();

  observer?.disconnect();

  const rowIds = filteredRows.value.map((row) => row.id);
  const firstRowId = rowIds[0];

  if (!visibleRows.value.length && firstRowId !== undefined) {
    visibleRows.value = [firstRowId];
  }

  if (!("IntersectionObserver" in window)) {
    visibleRows.value = rowIds;
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const rowId = Number(entry.target.getAttribute("data-row-id"));

        if (!visibleRows.value.includes(rowId)) {
          visibleRows.value.push(rowId);
        }

        observer?.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12
    }
  );

  rowRefs
    .filter((row) => !visibleRows.value.includes(Number(row.dataset.rowId)))
    .forEach((row) => observer?.observe(row));
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 5;
};

const toggleLike = (rowId: number, variantId: number) => {
  const row = catalogRows.value.find((item) => item.id === rowId);
  const variant = row?.variants.find((item) => item.id === variantId);

  if (variant) {
    variant.liked = !variant.liked;
  }
};

onBeforeUpdate(() => {
  rowRefs = [];
});

onMounted(() => {
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
  observeRows();
});

watch(
  filteredRows,
  () => {
    visibleRows.value = [];
    observeRows();
  },
  { flush: "post" }
);

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
  observer?.disconnect();
});
</script>

<template>
  <section class="catalog-page">
    <aside class="catalog-sidebar">
      <NuxtLink class="catalog-brand" to="/">
        <span class="catalog-brand__ege">EGE</span>
        <span class="catalog-brand__kardoor">
          KARDOOR
          <span class="catalog-brand__registered">R</span>
        </span>
      </NuxtLink>

      <div class="catalog-search">
        <label class="catalog-label" for="catalog-search">Ara:</label>

        <div class="catalog-search__box">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            id="catalog-search"
            v-model="searchQuery"
            type="search"
            placeholder="Burada ara..."
          />
        </div>
      </div>

      <div class="catalog-filters">
        <span class="catalog-label">Filtreler:</span>

        <button
          v-for="filter in filters"
          :key="filter"
          class="catalog-filter"
          type="button"
        >
          <span>{{ filter }}</span>

          <svg viewBox="0 0 32 10" aria-hidden="true">
            <line x1="0" y1="5" x2="31" y2="5" />
            <polyline points="22,0 31,5 22,10" />
          </svg>
        </button>
      </div>

      <div class="catalog-sample">
        <p>
          Modelini yakından<br />
          incelemek ister misiniz?
        </p>

        <NuxtLink class="catalog-sample__button" to="/request-quote">
          Ücretsiz Numune İste

          <svg viewBox="0 0 32 10" aria-hidden="true">
            <line x1="0" y1="5" x2="31" y2="5" />
            <polyline points="22,0 31,5 22,10" />
          </svg>
        </NuxtLink>
      </div>
    </aside>

    <main ref="mainRef" class="catalog-main">
      <div
        class="catalog-main__sticky"
        :class="{ 'catalog-main__sticky--scrolled': isScrolled }"
      >
        <h1>Katalog</h1>
      </div>

      <div v-if="filteredRows.length" class="catalog-rows">
        <article
          v-for="row in filteredRows"
          :key="row.id"
          :ref="setRowRef"
          class="catalog-row"
          :data-row-id="row.id"
        >
          <div class="catalog-row__meta">
            <div
              :class="{ 'catalog-row__reveal': visibleRows.includes(row.id) }"
              data-index="0"
            >
              <h2>{{ row.collection }}</h2>
              <p>by {{ row.designer }}</p>

              <div class="catalog-row__tags">
                <span v-for="tag in row.tags" :key="tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <div class="catalog-card">
            <div class="catalog-card__head">
              <h3>
                {{ row.title }}
                <span>{{ row.series }}</span>
              </h3>

              <p>{{ row.description }}</p>
            </div>

            <div class="catalog-grid">
              <div
                v-for="(item, index) in row.variants"
                :key="item.id"
                class="catalog-product"
                :data-index="index + 1"
              >
                <div class="catalog-product__image">
                  <img :src="item.image" :alt="`${row.title} ${item.finish}`" />

                  <button
                    class="catalog-product__like"
                    :class="{ 'catalog-product__like--active': item.liked }"
                    type="button"
                    aria-label="Favorilere ekle"
                    @click.stop="toggleLike(row.id, item.id)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      />
                    </svg>
                  </button>
                </div>

                <div class="catalog-product__body">
                  <div>
                    <p>{{ item.finish }}</p>
                    <span>{{ item.code }}</span>
                  </div>

                  <svg viewBox="0 0 32 10" aria-hidden="true">
                    <line x1="0" y1="5" x2="31" y2="5" />
                    <polyline points="22,0 31,5 22,10" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="catalog-empty">
        <p>Aramana uygun ürün bulunamadı.</p>
      </div>
    </main>
  </section>
</template>
