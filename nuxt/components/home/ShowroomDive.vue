<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { CSSProperties } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

type DoorItem = {
  id: string;
  name: string;
  series: string;
  image: string;
  fallbackImage: string;
  material: string;
  tone: string;
  tags: string[];
};

const { locale } = useKardoorLocale();
const { cdnAssetUrl } = useKardoorAsset();

const doorRecords = [
  {
    id: "emerald-line",
    image: "/series/4.png?updatedAt=1778762645568",
    fallbackImage: "/images/doors/atelier-emerald.png",
    i18n: {
      tr: {
        name: "Emerald Line",
        series: "Atelier Serisi",
        material: "Lamine çelik / altın vurgu",
        tone: "Zümrüt yeşili · şampanya",
        tags: ["Laminoks", "Villa", "Özel ölçü"]
      },
      en: {
        name: "Emerald Line",
        series: "Atelier Series",
        material: "Laminated steel / gold accent",
        tone: "Emerald green · champagne",
        tags: ["Laminox", "Villa", "Custom size"]
      }
    }
  },
  {
    id: "mono-graphite",
    image: "/series/5.png?updatedAt=1778762645583",
    fallbackImage: "/images/doors/atelier-mono-graphite.png",
    i18n: {
      tr: {
        name: "Mono Graphite",
        series: "Atelier Serisi",
        material: "Minimal çelik yüzey",
        tone: "Grafit siyah",
        tags: ["Modern", "İhracata hazır", "Güvenli"]
      },
      en: {
        name: "Mono Graphite",
        series: "Atelier Series",
        material: "Minimal steel surface",
        tone: "Graphite black",
        tags: ["Modern", "Export-ready", "Secure"]
      }
    }
  },
  {
    id: "ivory-line",
    image: "/series/1.png?updatedAt=1778762643897",
    fallbackImage: "/images/doors/atelier-ivory-line.png",
    i18n: {
      tr: {
        name: "Ivory Line",
        series: "Atelier Serisi",
        material: "İç mekan premium panel",
        tone: "Sıcak fildişi · pirinç",
        tags: ["İç mekan", "Minimal", "Yumuşak ton"]
      },
      en: {
        name: "Ivory Line",
        series: "Atelier Series",
        material: "Interior premium panel",
        tone: "Warm ivory · brass",
        tags: ["Interior", "Minimal", "Soft tone"]
      }
    }
  },
  {
    id: "graphite-oak",
    image: "/series/2.png?updatedAt=1778762645386",
    fallbackImage: "/images/doors/atelier-graphite-oak.png",
    i18n: {
      tr: {
        name: "Graphite Oak",
        series: "Atelier Serisi",
        material: "Doğal meşe / grafit çelik",
        tone: "Grafit · açık meşe",
        tags: ["Mimari", "Ahşap doku", "Premium"]
      },
      en: {
        name: "Graphite Oak",
        series: "Atelier Series",
        material: "Natural oak / graphite steel",
        tone: "Graphite · light oak",
        tags: ["Architectural", "Wood texture", "Premium"]
      }
    }
  },
  {
    id: "classic-sand",
    image: "/series/3.png?updatedAt=1778762644382",
    fallbackImage: "/images/doors/atelier-classic-sand.png",
    i18n: {
      tr: {
        name: "Classic Sand",
        series: "Atelier Serisi",
        material: "Klasik kabartmalı çelik",
        tone: "Kum beji",
        tags: ["Klasik", "Metal", "Villa"]
      },
      en: {
        name: "Classic Sand",
        series: "Atelier Series",
        material: "Classic embossed steel",
        tone: "Sand beige",
        tags: ["Classic", "Metal", "Villa"]
      }
    }
  }
];

const doors = computed<DoorItem[]>(() =>
  doorRecords.map((door) => ({
    id: door.id,
    image: cdnAssetUrl(door.image, door.fallbackImage),
    fallbackImage: door.fallbackImage,
    ...door.i18n[locale.value]
  }))
);

const useLocalImageFallback = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null;
  const fallback = image?.dataset.fallbackSrc;

  if (!image || !fallback || image.src.endsWith(fallback)) return;

  image.src = fallback;
};

const copy = computed(() =>
  locale.value === "tr"
    ? {
        showDetails: "bilgilerini göster",
        closeDetails: "Bilgileri kapat"
      }
    : {
        showDetails: "show details",
        closeDetails: "Close details"
      }
);

const activeIndex = ref(0);
const direction = ref<"next" | "prev">("next");
const isDetailVisible = ref(false);
const isShowroomPaused = ref(false);

const fallbackDoor = computed(() => doors.value[0] as DoorItem);

const activeDoor = computed<DoorItem>(() => doors.value[activeIndex.value] ?? fallbackDoor.value);

const previousIndex = computed(() =>
  activeIndex.value === 0 ? doors.value.length - 1 : activeIndex.value - 1
);

const nextIndex = computed(() =>
  activeIndex.value === doors.value.length - 1 ? 0 : activeIndex.value + 1
);

const goToDoor = (index: number) => {
  if (index === activeIndex.value) return;

  direction.value = index > activeIndex.value ? "next" : "prev";
  activeIndex.value = index;
};

const nextDoor = () => {
  direction.value = "next";
  activeIndex.value = nextIndex.value;
};

const previousDoor = () => {
  direction.value = "prev";
  activeIndex.value = previousIndex.value;
};

const getOrbitStyle = (index: number): CSSProperties =>
  ({
    "--orbit-delay": `${index * -8.4}s`
  }) as CSSProperties;

const revealDoor = () => {
  isDetailVisible.value = true;
};

const resumeShowcase = () => {
  isShowroomPaused.value = false;
  isDetailVisible.value = false;
};

const selectDoor = (index: number) => {
  goToDoor(index);
  revealDoor();
};

const selectNextDoor = () => {
  nextDoor();
  revealDoor();
};

const selectPreviousDoor = () => {
  previousDoor();
  revealDoor();
};

let touchStartX = 0;
let touchStartY = 0;

const onTouchStart = (event: TouchEvent) => {
  touchStartX = event.touches[0]?.clientX ?? 0;
  touchStartY = event.touches[0]?.clientY ?? 0;
};

const onTouchEnd = (event: TouchEvent) => {
  const touch = event.changedTouches[0];

  if (!touch) return;

  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;

  if (deltaX < 0) {
    selectNextDoor();
  } else {
    selectPreviousDoor();
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowRight") selectNextDoor();
  if (event.key === "ArrowLeft") selectPreviousDoor();
};

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <section
    class="showroom-dive"
    :class="{
      'showroom-dive--details': isDetailVisible,
      'showroom-dive--paused': isShowroomPaused
    }"
    :data-direction="direction"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="showroom-dive__wall" aria-hidden="true" />
    <div class="showroom-dive__light" aria-hidden="true" />
    <div class="showroom-dive__floor" aria-hidden="true" />

    <div class="showroom-dive__stage" aria-live="polite">
      <article
        v-for="(door, index) in doors"
        :key="door.id"
        class="showroom-dive__door-card"
        :class="{ 'showroom-dive__door-card--selected': index === activeIndex }"
        :style="getOrbitStyle(index)"
        role="button"
        tabindex="0"
        :aria-label="`${door.name} ${copy.showDetails}`"
        :aria-pressed="index === activeIndex && isDetailVisible"
        @click="selectDoor(index)"
        @keydown.enter.prevent="selectDoor(index)"
        @keydown.space.prevent="selectDoor(index)"
      >
        <NuxtImg
          class="showroom-dive__door-image"
          :src="door.image"
          :alt="door.name"
          :data-fallback-src="door.fallbackImage"
          width="520"
          height="820"
          sizes="sm:220px md:320px lg:420px xl:520px"
          densities="1x 2x"
          format="webp"
          :loading="index === activeIndex ? 'eager' : 'lazy'"
          decoding="async"
          draggable="false"
          @error="useLocalImageFallback"
        />
      </article>
    </div>

    <div v-if="activeDoor" class="showroom-dive__product">
      <button
        class="showroom-dive__product-close"
        type="button"
        :aria-label="copy.closeDetails"
        @click="resumeShowcase"
      >
        x
      </button>

      <h2 class="showroom-dive__product-name">
        {{ activeDoor.name }}
      </h2>

      <p class="showroom-dive__material">
        {{ activeDoor.material }}
      </p>

      <p class="showroom-dive__tone">
        {{ activeDoor.tone }}
      </p>

      <div class="showroom-dive__tags">
        <span
          v-for="tag in activeDoor.tags"
          :key="tag"
          class="showroom-dive__tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>

  </section>
</template>
