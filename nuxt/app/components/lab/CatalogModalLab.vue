<script setup lang="ts">
/**
 * KATALOG MODALI — LAB SÜRÜMÜ
 *
 * Eski CatalogProductModal.vue'nun yerine geçmek üzere sıfırdan yazıldı.
 * Production dosyasına dokunulmuyor; lab beğenilirse değiştirme yapılır.
 *
 * Eski sürümün dertleri (ölçüldü):
 *   • 200 satır Tailwind sınıf dizisi, `max-[760px]:` öneki 40+ tekrar
 *   • `min-height` zinciri kırıktı — 674px ekranda 34 eleman taşıyordu
 *   • `fixed` çalışmıyordu: sayfa `#smooth-content` içinde ve o katman
 *     ScrollSmoother yüzünden transform taşıyor
 *
 * Bu sürümde:
 *   • Düzen iki kolon (sol görsel, sağ bilgi) — istenen yapı korundu
 *   • Açılış: perde solar, panel aşağıdan yükselir (motion-v spring)
 *   • İçerik sadeleşti: kod/seri/yüzey + açıklama + iki aksiyon.
 *     Dosya bağlantıları, özellik kartları ve renk seçenekleri çıkarıldı —
 *     bunlar ürün DETAY sayfasının işi, vitrin modalının değil.
 *   • Stiller scoped CSS'te, utility yığını yok
 *
 * `fixed` sorunu: bileşen `<Teleport to="body">` kullanıyor. Bu sürümde
 * layoutId YOK (panel yükseliyor, görsel uçmuyor) — dolayısıyla Teleport
 * güvenli, kart ile modal arasında düzen bağı gerekmiyor.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { motion, AnimatePresence } from "motion-v";
import { gsap } from "gsap";

/**
 * İki hareket kaldı — karar verildi:
 *   g-sahne  masaüstü, GSAP: panel yatayda genişler, görsel derinlikten çıkar
 *   m-olcek  mobil, Motion: merkezden büyür
 * Karşılaştırma için kurulan diğer dört varyant silindi.
 */
type HareketAdi = "g-sahne" | "m-olcek";

const props = withDefaults(defineProps<{
  product: Record<string, any> | null;
  copy: Record<string, any>;
  series: string;
  collection: string;
  system: string;
  /**
   * Hangi açılış oynasın. VERİLMEZSE cihaza göre otomatik:
   * masaüstü → g-sahne, mobil → m-olcek. Lab değiştiricisi bunu ezer.
   */
  hareket?: HareketAdi;
}>(), {});

/**
 * MOBİL EŞİĞİ — modalın tek kolona düştüğü nokta (aşağıdaki media query ile
 * aynı). Değeri tek yerde tutuyoruz ki ikisi ayrışmasın.
 */
const MOBIL_ESIK = 860;

/**
 * Cihaza göre hareket seçimi.
 *
 * Masaüstünde GSAP "sahne açılır": panel yatayda genişliyor, görsel
 * derinlikten çıkıyor. Geniş ekranda sinematik duruyor.
 *
 * Mobilde Motion "merkezden büyür": orada panel zaten TEK KOLON ve tam
 * ekran — yatay genişleme (scaleX 0.82) dar ekranda sıkışık görünüyor.
 * Ayrıca GSAP timeline'ı mobilde gereksiz maliyet; Motion WAAPI'ye
 * derlendiği için ana iş parçacığının dışında oynuyor.
 *
 * `hareket` prop'u verilirse o kazanır — lab değiştiricisi böyle çalışıyor.
 */
const mobilMi = ref(false);

const guncelleCihaz = () => {
  mobilMi.value = window.innerWidth <= MOBIL_ESIK;
};

if (import.meta.client) {
  guncelleCihaz();
  window.addEventListener("resize", guncelleCihaz, { passive: true });
}

/** Prop verilmediyse cihaza göre otomatik seç. */
const etkinHareket = computed<HareketAdi>(() =>
  props.hareket ?? (mobilMi.value ? "m-olcek" : "g-sahne")
);

/** GSAP modu mu? Motion propları o zaman devre dışı kalır. */
const gsapMi = computed(() => etkinHareket.value.startsWith("g-"));

const emit = defineEmits<{
  close: [];
  prev: [];
  next: [];
}>();

const acik = computed(() => props.product !== null);

/* --- Hareket --------------------------------------------------------------
   Perde sade solar; panel aşağıdan yükselir. Spring bilerek düşük bounce:
   kapı vitrin nesnesi, zıplaması markayı hafifletir. */
const perdeMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }
};

/**
 * Üç açılış hareketi — lab'de yan yana karşılaştırılıyor.
 * Karar verildikten sonra kazanan kalır, diğerleri silinir.
 */
const HAREKETLER = {
  /** Mobil: merkezden büyür. Spring bilerek düşük bounce — kapı vitrin
      nesnesi, zıplaması markayı hafifletir. */
  "m-olcek": {
    initial: { scale: 0.94, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.97, opacity: 0 },
    transition: { type: "spring" as const, visualDuration: 0.4, bounce: 0.14 }
  }
} as const;

const panelMotion = computed(() =>
  gsapMi.value ? {} : HAREKETLER[etkinHareket.value as keyof typeof HAREKETLER]
);

/** İçerik: başlık → açıklama → aksiyonlar sırayla girer. */
const icerikKap = {
  gizli: { opacity: 0 },
  gorunur: {
    opacity: 1,
    transition: { delayChildren: 0.14, staggerChildren: 0.07 }
  }
};

const icerikOge = {
  gizli: { opacity: 0, y: 14 },
  gorunur: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, visualDuration: 0.42, bounce: 0.1 }
  }
};


/* ── GSAP VARYANTLARI ──────────────────────────────────────────────────────
   Motion'ın veremediği şey ÖRTÜŞEN zamanlama: aşağıdaki pozisyon
   parametreleri ("-=0.44") bir adımı öncekinin bitişinden ÖNCE başlatıyor,
   parçalar birbirinin içine giriyor. Motion'ın staggerChildren'ı düz sıra
   verir. Ayrıca `back`/`expo` gibi karakterli easing'ler burada var. */
const perdeRef = ref<any>(null);
const panelRef = ref<any>(null);
let gsapTl: gsap.core.Timeline | null = null;

const azHareket = () =>
  import.meta.client &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const gsapHedefler = () => {
  const panel = panelRef.value?.$el ?? panelRef.value;
  if (!panel) return null;
  return {
    perde: perdeRef.value?.$el ?? perdeRef.value,
    panel,
    gorsel: panel.querySelector(".kmodal__visual"),
    metinler: [
      panel.querySelector(".kmodal__kicker"),
      panel.querySelector(".kmodal__code"),
      panel.querySelector(".kmodal__meta"),
      panel.querySelector(".kmodal__desc"),
      panel.querySelector(".kmodal__details"),
      panel.querySelector(".kmodal__actions")
    ].filter(Boolean)
  };
};

const gsapAc = () => {
  const h = gsapHedefler();
  if (!h) return;

  gsapTl?.kill();

  if (azHareket()) {
    gsap.set([h.perde, h.panel, h.gorsel, ...h.metinler],
      { opacity: 1, clearProps: "transform" });
    return;
  }

  gsapTl = gsap.timeline();

  // Sahne açılışı: panel yatayda genişleyerek gelir, görsel derinlikten
  // çıkar. Motion'ın veremediği şey buradaki ÖRTÜŞEN zamanlama —
  // "-=0.7" gibi pozisyonlar bir adımı öncekinin bitişinden önce başlatır.
  gsapTl
    .fromTo(h.perde, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.inOut" })
    .fromTo(h.panel, { scaleX: 0.82, scaleY: 0.94, opacity: 0 },
      { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.78, ease: "power4.out" }, "-=0.2")
    .fromTo(h.gorsel, { scale: 1.2, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.94, ease: "power4.out" }, "-=0.7")
    .fromTo(h.metinler, { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.54, ease: "power3.out", stagger: 0.06 }, "-=0.62");
};

/**
 * GSAP çıkışı ELLE yönetilir: AnimatePresence burada devrede değil, o yüzden
 * kaldırma kararını geciktiriyoruz — önce tween, bitince emit('close').
 * `kapaniyor` bayrağı çift tıklamada iki çıkışın üst üste binmesini önler.
 */
const kapaniyor = ref(false);

const kapat = () => {
  if (!gsapMi.value) {
    emit("close");
    return;
  }
  if (kapaniyor.value) return;

  const h = gsapHedefler();
  if (!h || azHareket()) {
    emit("close");
    return;
  }

  kapaniyor.value = true;
  gsapTl?.kill();
  gsapTl = gsap.timeline({
    onComplete: () => {
      kapaniyor.value = false;
      emit("close");
    }
  });

  gsapTl
    .to(h.panel, { y: 26, opacity: 0, duration: 0.26, ease: "power2.in" })
    .to(h.perde, { opacity: 0, duration: 0.2, ease: "power1.in" }, "-=0.16");
};

/* ── ÜRÜN DEĞİŞİMİ ────────────────────────────────────────────────────────
   Ok tuşları/butonları ürünü değiştirince içerik ANINDA yer değiştiriyordu —
   hangi kapıya geçtiğin belli olmuyordu. Şimdi görsel yön duyarlı kayıyor:
   ileri gidersen sağdan, geri gelirsen soldan giriyor. */
const gecisYonu = ref<1 | -1>(1);
let gecisTl: gsap.core.Timeline | null = null;

const urunDegisti = () => {
  const h = gsapHedefler();
  if (!h || azHareket()) return;

  gecisTl?.kill();
  const x = 34 * gecisYonu.value;

  gecisTl = gsap.timeline();
  gecisTl
    .fromTo(h.gorsel, { x, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.44, ease: "power3.out" })
    .fromTo(h.metinler, { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.36, ease: "power2.out", stagger: 0.04 }, "-=0.32");
};

const oncekiUrun = () => {
  gecisYonu.value = -1;
  emit("prev");
};

const sonrakiUrun = () => {
  gecisYonu.value = 1;
  emit("next");
};

/* ── ODAK TUZAĞI ──────────────────────────────────────────────────────────
   Modal açıkken Tab arkadaki sayfaya kaçıyordu: klavye kullanıcısı modaldan
   çıkıp geri dönemiyordu. Kapanınca odak, modalı açan karta geri döner. */
let oncekiOdak: HTMLElement | null = null;

const odaklanabilirler = (): HTMLElement[] => {
  const kap: HTMLElement | null = perdeRef.value?.$el ?? perdeRef.value;
  if (!kap) return [];
  return [...kap.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((el) => el.offsetParent !== null);
};

const odagiTut = (event: KeyboardEvent) => {
  const liste = odaklanabilirler();
  if (liste.length === 0) return;

  const ilk = liste[0]!;
  const son = liste[liste.length - 1]!;
  const aktif = document.activeElement;

  if (event.shiftKey && aktif === ilk) {
    event.preventDefault();
    son.focus();
  } else if (!event.shiftKey && aktif === son) {
    event.preventDefault();
    ilk.focus();
  }
};

/* --- Klavye + gövde kilidi ------------------------------------------------ */
const onKeydown = (event: KeyboardEvent) => {
  if (!acik.value) return;
  if (event.key === "Escape") kapat();
  if (event.key === "ArrowLeft") oncekiUrun();
  if (event.key === "ArrowRight") sonrakiUrun();
  if (event.key === "Tab") odagiTut(event);
};

watch(acik, async (aciMi) => {
  if (!import.meta.client) return;

  if (aciMi) {
    oncekiOdak = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeydown);
    await nextTick();
    requestAnimationFrame(() => {
      if (gsapMi.value) gsapAc();
      // Odak BİR KARE SONRA modala girer. Aynı karede denenince panel henüz
      // boyanmamış oluyordu: offsetParent null dönüyor, odaklanabilir liste
      // boş çıkıyor ve odak kartta kalıyordu (ölçüldü).
      requestAnimationFrame(() => odaklanabilirler()[0]?.focus());
    });
  } else {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", onKeydown);
    // Odak, modalı açan karta dönsün — sayfanın en başına değil.
    oncekiOdak?.focus();
    oncekiOdak = null;
  }
});

/** Modal AÇIKKEN ürün değişirse geçişi oynat; açılışta gsapAc zaten çalışıyor. */
watch(() => props.product?.code, (yeni, eski) => {
  if (!import.meta.client || !acik.value) return;
  if (!yeni || !eski || yeni === eski) return;
  requestAnimationFrame(urunDegisti);
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  gsapTl?.kill();
  gecisTl?.kill();
  window.removeEventListener("resize", guncelleCihaz);
  document.body.style.overflow = "";
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="product"
        ref="perdeRef"
        class="kmodal"
        :class="{ 'is-gsap': gsapMi }"
        role="dialog"
        aria-modal="true"
        :aria-label="`${product.code} ${copy.modal.productDetail}`"
        v-bind="gsapMi ? {} : perdeMotion"
        @click.self="kapat"
      >
        <button class="kmodal__close" :aria-label="copy.modal.close" @click="kapat">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <button class="kmodal__nav kmodal__nav--prev" :aria-label="copy.modal.previous" @click="oncekiUrun">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15,5 8,12 15,19" /></svg>
        </button>

        <button class="kmodal__nav kmodal__nav--next" :aria-label="copy.modal.next" @click="sonrakiUrun">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9,5 16,12 9,19" /></svg>
        </button>

        <motion.section ref="panelRef" class="kmodal__panel" v-bind="panelMotion">
          <div class="kmodal__visual">
            <img :src="product.image" :alt="product.finish" class="kmodal__image">
          </div>

          <motion.div
            class="kmodal__content"
            v-bind="gsapMi ? {} : { variants: icerikKap, initial: 'gizli', animate: 'gorunur' }"
          >
            <motion.p class="kmodal__kicker" v-bind="gsapMi ? {} : { variants: icerikOge }">
              {{ series || copy.modal.seriesFallback }}
            </motion.p>

            <motion.h2 class="kmodal__code" v-bind="gsapMi ? {} : { variants: icerikOge }">
              {{ product.code }}
            </motion.h2>

            <motion.p class="kmodal__meta" v-bind="gsapMi ? {} : { variants: icerikOge }">
              {{ collection || copy.modal.collectionFallback }}
              <span aria-hidden="true">·</span>
              {{ product.finish }}
            </motion.p>

            <motion.p class="kmodal__desc" v-bind="gsapMi ? {} : { variants: icerikOge }">
              {{ copy.modal.description }}
            </motion.p>

            <!-- Teknik bilgi: sadeleştirmede tamamen çıkarılmıştı ama sağ
                 kolonun %59'u boş kalıyordu (ölçüldü). B2B ziyaretçi
                 sistem/kullanım bilgisini modal içinde bekliyor.
                 CTA'nın ÜSTÜNDE: önce karar bilgisi, sonra eylem. -->
            <motion.div class="kmodal__details" v-bind="gsapMi ? {} : { variants: icerikOge }">
              <div class="kmodal__block">
                <h3>{{ copy.modal.infoTitle }}</h3>
                <dl>
                  <div>
                    <dt>{{ copy.modal.fields.system }}</dt>
                    <dd>{{ system || copy.modal.systemFallback }}</dd>
                  </div>
                  <div>
                    <dt>{{ copy.modal.fields.usage }}</dt>
                    <dd>{{ copy.modal.usage }}</dd>
                  </div>
                </dl>
              </div>

              <div class="kmodal__block">
                <h3>{{ copy.modal.filesTitle }}</h3>
                <div class="kmodal__files">
                  <a href="#">{{ copy.modal.files.specSheet }}</a>
                  <a href="#">{{ copy.modal.files.drawing }}</a>
                </div>
              </div>
            </motion.div>

            <motion.div class="kmodal__actions" v-bind="gsapMi ? {} : { variants: icerikOge }">
              <NuxtLink class="kmodal__cta" to="/contact">{{ copy.modal.quote }}</NuxtLink>
              <NuxtLink class="kmodal__link" to="/catalog">{{ copy.actions.viewSeries }}</NuxtLink>
            </motion.div>
          </motion.div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>

<style scoped>
/* GSAP modunda ilk kare gizli başlar — tween opacity'yi kendisi açıyor,
   aksi halde animasyondan önce bir kare tam görünür yanıp sönüyor. */
.kmodal.is-gsap {
  opacity: 0;
}

.kmodal {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 3vw, 48px);
  background: var(--catalog-product-modal-backdrop, rgba(20, 21, 29, 0.48));
  backdrop-filter: blur(18px);
}

/* --- Panel: iki kolon ---------------------------------------------------- */
.kmodal__panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(32px, 4vw, 64px);
  width: min(100%, 1180px);
  /* Yükseklik tavanı viewport'a bağlı, min-height YOK: eski modalda sabit
     520px'lik iç kural kısa ekranlarda içeriği kesiyordu. */
  max-height: min(86vh, 780px);
  /* Satır kendi payını aşmasın: grid satırının varsayılan `auto` boyu
     içeriğe göre büyüyor ve panelin max-height'ini deliyordu (ölçüldü:
     panel 579px, çocukları 807px'e taşıyordu). */
  grid-template-rows: minmax(0, 1fr);
  padding: clamp(32px, 3.4vw, 56px);
  border-radius: 4px 4px clamp(28px, 2.6vw, 42px);
  background: var(--surface);
  box-shadow: 0 42px 130px rgba(0, 0, 0, 0.16);
}

/* --- Sol: görsel --------------------------------------------------------- */
.kmodal__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  /* min-height: 0 — grid çocuğunun varsayılan `auto` değeri içeriğin altına
     küçülmesini engelliyor, panelin tavanını deliyordu. */
  min-height: 0;
  padding: clamp(16px, 2vw, 32px);
  border-radius: 2px 2px clamp(24px, 2.2vw, 34px);
  background: var(--surface-2);
}

.kmodal__image {
  display: block;
  width: auto;
  max-width: 92%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 28px 38px rgba(0, 0, 0, 0.18));
}

/* --- Sağ: bilgi ---------------------------------------------------------- */
.kmodal__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  overflow-y: auto;
  /* DİKKAT: burada `scrollbar-width`/`scrollbar-color` BİLEREK YOK.
     Chrome bu standart özelliklerden birini görünce elemanı standart
     scrollbar yoluna alıp `::-webkit-scrollbar` kurallarını tamamen yok
     sayıyor — `!important` ile bile geçilemiyor (ölçüldü: çubuk 4px yerine
     10px, `scrollbar-color` eklenince 15px kaldı).
     Chrome/Safari inceltmeyi aşağıdaki webkit kurallarından alıyor;
     Firefox kendi bloğunda, dosyanın sonunda. */
  /* Çubuk metne değmesin. `padding` yerine `scrollbar-gutter` kullanmıyoruz:
     çubuk yokken de yer ayırıp kolonu daraltıyordu. */
  padding-right: 14px;
  margin-right: -14px;
}

/* Scrollbar kuralları AŞAĞIDAKİ global blokta — buraya yazılamıyor,
   nedeni orada anlatıldı. */

.kmodal__kicker {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.kmodal__code {
  margin: 0;
  font-family: "PP Telegraf", "General Sans", Inter, system-ui, sans-serif;
  font-size: clamp(44px, 4.4vw, 76px);
  font-weight: 500;
  line-height: 0.94;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.kmodal__meta {
  margin: 16px 0 0;
  font-size: 12px;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.kmodal__meta span {
  margin: 0 6px;
}

.kmodal__desc {
  margin: 24px 0 0;
  max-width: 46ch;
  font-size: clamp(16px, 1.15vw, 19px);
  line-height: 1.5;
  color: var(--ink-body);
}

/* Teknik bilgi bloğu. İki sütun değil TEK kolon içinde iki blok: sağ kolon
   zaten dar, ikiye bölünce dt/dd satırları sarmalanıyordu. */
.kmodal__details {
  display: grid;
  gap: 19px;
  margin-top: 25px;
  padding-top: 21px;
  border-top: 1px solid var(--hairline);
}

.kmodal__block h3 {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.kmodal__block dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

/* Etiket sabit genişlikte, değer kalan alanı alır — değerler aynı hizada
   başlasın diye. Dar ekranda tek sütuna düşer. */
.kmodal__block dl > div {
  display: grid;
  grid-template-columns: minmax(88px, 0.34fr) 1fr;
  gap: 4px 18px;
  align-items: baseline;
}

.kmodal__block dt {
  font-size: 13px;
  color: var(--ink-soft);
}

.kmodal__block dd {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.45;
  color: var(--ink);
}

.kmodal__files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kmodal__files a {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  font-size: 13px;
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.22s ease, background 0.22s ease;
}

.kmodal__files a:hover {
  border-color: var(--brand-500);
  background: var(--surface-2);
}

.kmodal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.kmodal__cta,
.kmodal__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease;
}

.kmodal__cta {
  color: var(--brand-100);
  background: var(--brand-700);
}

.kmodal__cta:hover {
  background: var(--brand-500);
}

.kmodal__link {
  color: var(--ink-body);
  border: 1px solid var(--hairline);
}

.kmodal__link:hover {
  color: var(--ink);
  border-color: var(--ink-soft);
}

/* --- Kontroller ---------------------------------------------------------- */
.kmodal__close,
.kmodal__nav {
  position: fixed;
  z-index: 3004;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.22s ease, background 0.22s ease;
}

.kmodal__close svg,
.kmodal__nav svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.kmodal__close {
  top: 24px;
  right: 28px;
  width: 42px;
  height: 42px;
}

.kmodal__close:hover {
  transform: rotate(90deg);
}

.kmodal__nav {
  top: 50%;
  width: 48px;
  height: 48px;
  margin-top: -24px;
}

.kmodal__nav--prev { left: 24px; }
.kmodal__nav--next { right: 24px; }

.kmodal__nav:hover {
  background: var(--surface-2);
}

/* --- Mobil: tek kolon ---------------------------------------------------- */
@media (max-width: 860px) {
  .kmodal {
    padding: 0;
  }

  .kmodal__panel {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0;
    width: 100%;
    height: 100dvh;
    max-height: none;
    padding: 0;
    border-radius: 0;
  }

  .kmodal__visual {
    border-radius: 0;
  }

  .kmodal__content {
    padding: 24px 20px 32px;
    max-height: 46dvh;
    border-top: 1px solid var(--hairline);
  }

  .kmodal__code {
    font-size: clamp(34px, 9vw, 46px);
  }

  .kmodal__nav {
    top: auto;
    bottom: calc(46dvh + 20px);
    margin-top: 0;
  }
}

/* Hareket kısıtlıysa: konum değişimi yok, yalnız solma. */
@media (prefers-reduced-motion: reduce) {
  .kmodal__close:hover {
    transform: none;
  }
}
</style>

<!--
  Scrollbar kuralları GLOBAL blokta olmak zorunda.

  Neden: modal `<Teleport to="body">` ile gövdeye taşınıyor ve
  `::-webkit-scrollbar` bir pseudo-element. `<style scoped>` seçicinin
  sonuna kendi data attribute'ünü ekleyemediği için düz yazım hiç
  tutmuyordu; `:deep()` de Teleport zinciri koptuğu için tutmadı
  (ikisi de ölçüldü: çubuk 10px kalmaya devam etti).

  `.kmodal__content` yalnız bu bileşende geçen bir sınıf, global olması
  sızıntı üretmiyor.
-->
<style>
.kmodal__content::-webkit-scrollbar {
  width: 4px;
}

.kmodal__content::-webkit-scrollbar-track {
  background: transparent;
}

.kmodal__content::-webkit-scrollbar-thumb {
  background: var(--hairline);
  border-radius: 999px;
}

.kmodal__content::-webkit-scrollbar-thumb:hover {
  background: var(--ink-soft);
}

/* Firefox: webkit pseudo-element'lerini bilmiyor, standart özelliklere
   ihtiyacı var. `@supports not selector(::-webkit-scrollbar)` sayesinde bu
   blok Chrome'a HİÇ ulaşmıyor — yukarıdaki çakışma orada tekrar doğmuyor. */
@supports not selector(::-webkit-scrollbar) {
  .kmodal__content {
    scrollbar-width: thin;
    scrollbar-color: var(--hairline) transparent;
  }
}
</style>
