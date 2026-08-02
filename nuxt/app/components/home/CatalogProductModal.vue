<script setup lang="ts">
/**
 * CatalogProductModal — HomeCatalog'dan cikarilan urun modali.
 *
 * Kaynak: home-catalog.css satir 1316-2127 (811 satir, 0 !important).
 * Masaustu + mobil BIRLIKTE tasindi (DESIGN.md 12.2).
 *
 * Orijinal sinif adlari KORUNUYOR — themes/*.css degiskenleri ve
 * main.css'teki html.is-scrolling backdrop-filter kurali bunlari hedefliyor.
 *
 * Mobilde (<=760px) tasarim tamamen degisiyor: gorsel tam ekran arka plan,
 * bilgi altta overlay kart. Bu yuzden cogu utility'nin max-[760px] karsiligi var.
 */
defineProps<{
  product: Record<string, any>;
  productIndex: number;
  copy: Record<string, any>;
  series: string;
  collection: string;
  category: string;
  system: string;
}>();

defineEmits<{
  close: [];
  prev: [];
  next: [];
  toggleLike: [index: number];
  imageError: [event: Event, fallback: string];
}>();

/* --- Kabuk --------------------------------------------------------------- */
const modalClass = [
  'product-modal fixed inset-0 z-[3000] flex items-center justify-center overflow-hidden',
  'p-[clamp(24px,3vw,48px)] text-[#07090c]',
  'bg-[radial-gradient(circle_at_18%_18%,rgba(0,0,0,0.035),transparent_34%),radial-gradient(circle_at_74%_62%,rgba(180,160,120,0.075),transparent_30%),var(--catalog-product-modal-backdrop,#f3f3ef)]',
  'backdrop-blur-[18px]',
  // mobil: tam ekran, koyu zemin, blur yok
  'max-[760px]:h-[100dvh] max-[760px]:w-full max-[760px]:items-stretch max-[760px]:justify-stretch',
  'max-[760px]:bg-[#0a0a0a] max-[760px]:p-0 max-[760px]:backdrop-blur-none'
].join(' ');

const panelClass = [
  'product-modal-panel relative grid overflow-hidden',
  'grid-cols-[minmax(420px,0.95fr)_minmax(500px,1.05fr)] gap-[clamp(42px,5vw,78px)]',
  'w-[min(100%,1380px)] min-h-[min(780px,84vh)] max-h-[calc(100dvh-clamp(48px,6vw,96px))]',
  'p-[clamp(42px,4.2vw,68px)]',
  'border border-[rgba(18,18,18,0.065)] bg-[rgba(255,255,255,0.92)]',
  '[box-shadow:0_42px_130px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.72)]',
  'max-[1080px]:grid-cols-[1fr] max-[1080px]:gap-[34px] max-[1080px]:overflow-y-auto',
  // mobil: iki satirli grid — gorsel ust, kart alt
  'max-[760px]:h-[100dvh] max-[760px]:w-full max-[760px]:grid-rows-[1fr_auto] max-[760px]:grid-cols-[1fr]',
  'max-[760px]:min-h-0 max-[760px]:max-h-none max-[760px]:rounded-none max-[760px]:border-0',
  'max-[760px]:bg-transparent max-[760px]:p-0 max-[760px]:[box-shadow:none]'
].join(' ');

/* --- Ust kontroller ------------------------------------------------------ */
const closeClass = [
  'product-modal-close fixed top-[24px] right-[28px] z-[3004] h-[40px] w-[40px] cursor-pointer',
  'rounded-[999px] border border-[rgba(0,0,0,0.045)] bg-[rgba(255,255,255,0.82)]',
  'text-[24px] leading-none text-[#111] [box-shadow:0_18px_44px_rgba(0,0,0,0.13)]',
  '[transition:transform_0.2s_ease,background_0.2s_ease,box-shadow_0.2s_ease]',
  'hover:rotate-90 hover:bg-[var(--surface)]',
  'max-[760px]:top-[calc(14px+env(safe-area-inset-top))] max-[760px]:right-[14px] max-[760px]:z-[3020]',
  'max-[760px]:h-[36px] max-[760px]:w-[36px] max-[760px]:text-[22px]',
  'max-[760px]:border-[rgba(255,255,255,0.14)] max-[760px]:bg-[rgba(0,0,0,0.42)]',
  'max-[760px]:text-[rgba(255,255,255,0.88)] max-[760px]:backdrop-blur-[8px] max-[760px]:[box-shadow:none]'
].join(' ');

const navBase = [
  'product-modal-nav fixed top-1/2 z-[3003] flex h-[56px] w-[76px] items-center justify-center',
  'rounded-[999px] border border-[rgba(0,0,0,0.045)] cursor-pointer',
  'max-[760px]:top-[30dvh] max-[760px]:z-[3010] max-[760px]:h-[40px] max-[760px]:w-[40px]',
  'max-[760px]:border-[rgba(255,255,255,0.14)] max-[760px]:bg-[rgba(0,0,0,0.36)]',
  'max-[760px]:backdrop-blur-[8px] max-[760px]:transform-none max-[760px]:[box-shadow:none]'
].join(' ');

const prevClass = `${navBase} product-modal-prev max-[760px]:left-[12px]`;
const nextClass = `${navBase} product-modal-next max-[760px]:right-[12px]`;

/* --- Gorsel -------------------------------------------------------------- */
const visualClass = [
  'product-modal-visual relative flex min-w-0 flex-col justify-center',
  'max-[760px]:row-start-1 max-[760px]:h-full max-[760px]:w-full max-[760px]:overflow-hidden max-[760px]:p-0'
].join(' ');

const visualFrameClass = [
  'product-modal-visual-frame flex items-center justify-center overflow-hidden',
  'min-h-[clamp(520px,65vh,680px)] border border-[rgba(0,0,0,0.05)]',
  'bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(242,242,238,0.96)),#f4f4f1]',
  'max-[1080px]:min-h-[420px]',
  'max-[760px]:h-full max-[760px]:w-full max-[760px]:min-h-0 max-[760px]:rounded-none',
  'max-[760px]:border-0 max-[760px]:bg-[#0e0e0e] max-[760px]:p-0'
].join(' ');

const imageClass = [
  'product-modal-image block w-auto max-w-[92%] max-h-[66vh] object-contain',
  '[filter:drop-shadow(0_34px_42px_rgba(0,0,0,0.20))]',
  'max-[1080px]:max-h-[420px]',
  'max-[760px]:h-full max-[760px]:w-full max-[760px]:max-h-none max-[760px]:max-w-full',
  'max-[760px]:px-[12%] max-[760px]:py-[8%]',
  'max-[760px]:[filter:drop-shadow(0_20px_32px_rgba(0,0,0,0.5))]'
].join(' ');

const captionClass = [
  'product-modal-visual-caption flex justify-between gap-5 mt-[18px]',
  'text-[11px] uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]',
  'max-[760px]:hidden'
].join(' ');

/* --- Icerik -------------------------------------------------------------- */
const contentClass = [
  'product-modal-content flex min-w-0 min-h-0 flex-col justify-center overflow-y-auto py-0',
  '[scrollbar-width:thin]',
  'max-[760px]:row-start-2 max-[760px]:block max-[760px]:max-h-[52dvh]',
  'max-[760px]:px-5 max-[760px]:pt-5 max-[760px]:pb-7',
  'max-[760px]:bg-[rgba(248,247,243,0.97)] max-[760px]:backdrop-blur-[18px]',
  'max-[760px]:rounded-none max-[760px]:border-t max-[760px]:border-t-[rgba(0,0,0,0.06)]',
  'max-[760px]:[overscroll-behavior:contain] max-[760px]:[-webkit-overflow-scrolling:touch]',
  'max-[420px]:max-h-[55dvh] max-[420px]:px-4 max-[420px]:pt-4 max-[420px]:pb-6'
].join(' ');

const kickerClass = [
  'product-modal-kicker m-0 mb-3 text-[11px] uppercase tracking-[0.22em] text-[rgba(0,0,0,0.48)]',
  'max-[760px]:mb-1 max-[760px]:text-[9px] max-[760px]:text-[rgba(0,0,0,0.4)]'
].join(' ');

const metaClass = [
  'product-modal-meta flex flex-wrap items-center gap-x-[14px] gap-y-2 mt-6',
  'text-[11px] uppercase leading-[1.45] tracking-[0.11em] text-[rgba(0,0,0,0.54)]',
  'max-[760px]:mt-2 max-[760px]:gap-x-[6px] max-[760px]:gap-y-1 max-[760px]:text-[9px] max-[760px]:tracking-[0.08em]'
].join(' ');

const descriptionClass = [
  'product-modal-description max-w-[650px] mt-[26px] mb-0',
  'text-[clamp(20px,1.45vw,25px)] leading-[1.36] tracking-[-0.035em] text-[rgba(0,0,0,0.76)]',
  'max-[760px]:mt-3 max-[760px]:max-w-none max-[760px]:text-[14px]',
  'max-[760px]:leading-[1.48] max-[760px]:tracking-[-0.01em] max-[760px]:text-[rgba(0,0,0,0.68)]'
].join(' ');

const actionsClass = [
  'product-modal-actions flex flex-wrap items-center gap-[14px] mt-6',
  'max-[760px]:mt-[14px] max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:gap-2'
].join(' ');

const actionBase = [
  // py-0 gerekli: tarayicinin buton varsayilani padding-block:1px birakiyor.
  'inline-flex items-center justify-center min-h-[40px] px-[18px] py-0',
  'rounded-[999px] no-underline cursor-pointer',
  'max-[760px]:min-h-[42px] max-[760px]:w-full max-[760px]:rounded-[10px] max-[760px]:px-3 max-[760px]:text-[13px]'
].join(' ');

const likeClass = `product-modal-like ${actionBase} gap-2 m-0 border border-[rgba(0,0,0,0.12)] bg-transparent text-[#111]`;
const quoteClass = `product-modal-quote ${actionBase} border border-[#111] bg-[#111] text-white`;

const detailsClass = [
  'product-modal-details grid grid-cols-[minmax(250px,1fr)_minmax(170px,0.62fr)]',
  'gap-[clamp(42px,5vw,78px)] mt-[clamp(42px,4.4vw,58px)]',
  'max-[1080px]:grid-cols-[1fr] max-[1080px]:gap-[30px]',
  'max-[760px]:mt-5 max-[760px]:grid-cols-[1fr] max-[760px]:gap-5',
  'max-[760px]:pt-4 max-[760px]:border-t max-[760px]:border-t-[rgba(0,0,0,0.07)]'
].join(' ');

const filesClass = [
  'product-modal-files grid gap-[10px]',
  'max-[760px]:grid-cols-2 max-[760px]:gap-[7px]'
].join(' ');

const specsClass = [
  'product-modal-specs grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[10px] mt-[38px]',
  'max-[1080px]:grid-cols-[1fr]',
  'max-[760px]:mt-5 max-[760px]:flex max-[760px]:flex-col max-[760px]:gap-[5px]'
].join(' ');

const finishesClass = [
  'product-modal-finishes flex flex-wrap items-center gap-[13px] mt-[30px]',
  'max-[760px]:static max-[760px]:z-auto max-[760px]:mt-[18px] max-[760px]:gap-[10px]',
  'max-[760px]:border-0 max-[760px]:bg-transparent max-[760px]:p-0 max-[760px]:backdrop-blur-none'
].join(' ');
</script>

<template>
  <Teleport to="body">
    <div
      v-if="product"
      :class="modalClass"
      role="dialog"
      aria-modal="true"
      :aria-label="`${product.code} ${copy.modal.productDetail}`"
      @click.self="$emit('close')"
    >
      <button type="button" :class="closeClass" :aria-label="copy.modal.close" @click="$emit('close')">×</button>

      <button type="button" :class="prevClass" :aria-label="copy.modal.previous" @click="$emit('prev')">
        <svg viewBox="0 0 44 16" aria-hidden="true">
          <line x1="43" y1="8" x2="2" y2="8" />
          <polyline points="9,1 2,8 9,15" />
        </svg>
      </button>

      <button type="button" :class="nextClass" :aria-label="copy.modal.next" @click="$emit('next')">
        <svg viewBox="0 0 44 16" aria-hidden="true">
          <line x1="1" y1="8" x2="42" y2="8" />
          <polyline points="35,1 42,8 35,15" />
        </svg>
      </button>

      <section :class="panelClass">
        <div :class="visualClass">
          <div :class="visualFrameClass">
            <img
              :src="product.image"
              :alt="product.finish"
              :class="imageClass"
              @error="$emit('imageError', $event, product.localImage)"
            >
          </div>

          <div :class="captionClass">
            <span>{{ product.code }}</span>
            <span>{{ product.finish }}</span>
          </div>
        </div>

        <div :class="contentClass">
          <div class="product-modal-heading min-w-0">
            <p :class="kickerClass">{{ series || copy.modal.seriesFallback }}</p>

            <h2>{{ product.code }}</h2>

            <div :class="metaClass">
              <span>{{ collection || copy.modal.collectionFallback }}</span>
              <span>{{ category || copy.modal.categoryFallback }}</span>
              <span>{{ product.finish }}</span>
            </div>
          </div>

          <p :class="descriptionClass">{{ copy.modal.description }}</p>

          <div :class="actionsClass">
            <button type="button" :class="likeClass" @click.stop="$emit('toggleLike', productIndex)">
              <span aria-hidden="true">♥</span>
              {{ product.liked ? copy.favorite.remove : copy.favorite.add }}
            </button>

            <NuxtLink :class="quoteClass" to="/contact">{{ copy.modal.quote }}</NuxtLink>
          </div>

          <div :class="detailsClass">
            <div class="product-modal-info-block relative">
              <h3>{{ copy.modal.infoTitle }}</h3>

              <dl>
                <div><dt>{{ copy.modal.fields.code }}</dt><dd>{{ product.code }}</dd></div>
                <div><dt>{{ copy.modal.fields.series }}</dt><dd>{{ series || copy.modal.collectionFallback }}</dd></div>
                <div><dt>{{ copy.modal.fields.finish }}</dt><dd>{{ product.finish }}</dd></div>
                <div><dt>{{ copy.modal.fields.system }}</dt><dd>{{ system || copy.modal.systemFallback }}</dd></div>
                <div><dt>{{ copy.modal.fields.usage }}</dt><dd>{{ copy.modal.usage }}</dd></div>
              </dl>
            </div>

            <div class="product-modal-info-block relative">
              <h3>{{ copy.modal.filesTitle }}</h3>

              <div :class="filesClass">
                <a href="#">{{ copy.modal.files.specSheet }}</a>
                <a href="#">{{ copy.modal.files.productImage }}</a>
                <a href="#">{{ copy.modal.files.drawing }}</a>
                <a href="#">{{ copy.modal.files.installation }}</a>
              </div>
            </div>
          </div>

          <div :class="specsClass">
            <div><span>01</span><strong>{{ copy.modal.specs.body }}</strong></div>
            <div><span>02</span><strong>{{ copy.modal.specs.customSize }}</strong></div>
            <div><span>03</span><strong>{{ copy.modal.specs.finishes }}</strong></div>
          </div>

          <div :class="finishesClass" :aria-label="copy.modal.finishesAria">
            <button type="button" style="--finish: #111111" :aria-label="copy.modal.finishLabels.black"></button>
            <button type="button" style="--finish: #2f3335" :aria-label="copy.modal.finishLabels.anthracite"></button>
            <button type="button" style="--finish: #7a6f5f" :aria-label="copy.modal.finishLabels.bronze"></button>
            <button type="button" style="--finish: #f3f0e9" :aria-label="copy.modal.finishLabels.light"></button>
            <button type="button" style="--finish: #c99354" :aria-label="copy.modal.finishLabels.brass"></button>
            <button type="button" class="is-metal" :aria-label="copy.modal.finishLabels.metal"></button>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
/* Tailwind'e GIRMEYEN kisim — bilerek burada:
   pseudo-element icerikleri, eleman-secici (h2/h3/dt/dd) kurallari ve
   scrollbar stilleri utility ile ifade edilemiyor. */

/* main.css'teki "button,input,textarea { font: inherit }" reset'i Tailwind'in
   tek-sinifli utility'siyle ayni ozgullukte oldugu icin font-size/weight'i
   eziyordu. Iki-sinifli secici ile yeniliyor. Ayni tuzak wishlist'te de vardi. */
.product-modal-like,
.product-modal-quote {
  font-size: 13px;
  font-weight: 600;
}

.product-modal-close {
  font-size: 24px;
}

/* NuxtLink <a> uretiyor; .product-modal koku "color:#07090c" veriyor ve
   utility ile ayni ozgullukte kalinca miras kazaniyordu. */
.product-modal-quote {
  color: #fff;
}

/* max-w-[92%] uygulanmiyordu: img'in yuzde genisligi flex parent'ta
   cozulmuyor; acik kural gerekiyor. */
.product-modal-image {
  max-width: 92%;
}

@media (max-width: 760px) {
  .product-modal-image { max-width: 100%; }
  .product-modal-like,
  .product-modal-quote { font-size: 13px; }
  .product-modal-close { font-size: 22px; }
}

.product-modal-panel::before {
  content: "";
  position: absolute;
  top: clamp(30px, 3vw, 48px);
  left: clamp(32px, 4vw, 68px);
  right: clamp(32px, 4vw, 68px);
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent);
}

.product-modal-panel::after {
  content: "KARDOOR  /  ARCHITECTURAL ENTRANCE SYSTEM";
  position: absolute;
  right: clamp(34px, 4.5vw, 76px);
  bottom: clamp(28px, 3vw, 44px);
  pointer-events: none;
  color: rgba(0, 0, 0, 0.28);
  font-size: 9px;
  letter-spacing: 0.22em;
}

.product-modal-content::-webkit-scrollbar { width: 6px; }
.product-modal-content::-webkit-scrollbar-track { background: transparent; }
.product-modal-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 999px;
}

.product-modal-content h2 {
  margin: 0;
  color: #050505;
  font-size: clamp(78px, 7.6vw, 116px);
  font-weight: 520;
  line-height: 0.86;
  letter-spacing: -0.078em;
}

.product-modal-meta span:not(:last-child)::after {
  content: "";
  display: inline-block;
  width: 1px;
  height: 12px;
  margin-left: 14px;
  vertical-align: -2px;
  background: rgba(150, 126, 74, 0.72);
}

.product-modal-meta span + span::before { content: none; }

.product-modal-info-block h3,
.product-modal-details h3 {
  position: relative;
  margin: 0 0 18px;
  padding-bottom: 10px;
  color: #080a0c;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.product-modal-details dl { display: grid; gap: 0; margin: 0; }

.product-modal-info-block dl div,
.product-modal-details dl div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 18px;
  padding: 0 0 7px;
  margin: 0 0 11px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.045);
  font-size: 15px;
  line-height: 1.3;
}

.product-modal-info-block dl div:last-child,
.product-modal-details dl div:last-child { border-bottom: 0; }

.product-modal-info-block dt,
.product-modal-details dt { color: rgba(0, 0, 0, 0.46); }

.product-modal-info-block dd,
.product-modal-details dd { margin: 0; color: rgba(0, 0, 0, 0.82); }

.product-modal-files a,
.product-modal-details a {
  position: relative;
  display: block;
  width: max-content;
  padding-bottom: 3px;
  color: rgba(0, 0, 0, 0.68);
  border-bottom: 1px dotted rgba(0, 0, 0, 0.24);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.product-modal-files a:hover,
.product-modal-details a:hover {
  color: #000;
  border-bottom-color: rgba(0, 0, 0, 0.72);
}

.product-modal-specs div {
  min-height: 72px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.36);
  border: 1px solid rgba(0, 0, 0, 0.075);
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.product-modal-specs div:hover { transform: translateY(-3px); }

.product-modal-finishes button,
.product-modal-finishes span {
  display: block;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  background: var(--finish, transparent);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.35),
    0 10px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.product-modal-nav svg {
  width: 44px;
  height: 16px;
  stroke: rgba(0, 0, 0, 0.62);
  stroke-width: 1;
  fill: none;
}

/* --- Mobil: eleman-secici override'lari ------------------------------- */
@media (max-width: 760px) {
  .product-modal-content h2 {
    margin: 0 0 8px;
    font-size: clamp(30px, 9vw, 44px);
    line-height: 0.95;
    letter-spacing: -0.04em;
  }

  .product-modal-content::-webkit-scrollbar { display: none; }

  .product-modal-meta span:not(:last-child)::after { display: none; }

  .product-modal-meta span {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.6);
  }

  .product-modal-info-block h3,
  .product-modal-details h3 {
    margin-bottom: 10px;
    padding-bottom: 8px;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.42);
  }

  .product-modal-info-block dl div,
  .product-modal-details dl div {
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 10px;
    padding: 8px 0;
    margin: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 13px;
    line-height: 1.35;
  }

  .product-modal-files a,
  .product-modal-details a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid rgba(0, 0, 0, 0.09);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    text-align: center;
    text-decoration: none;
    color: rgba(0, 0, 0, 0.64);
  }

  .product-modal-specs div {
    display: grid;
    grid-template-columns: 26px 1fr;
    align-items: center;
    min-height: 40px;
    padding: 8px 12px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .product-modal-specs span { margin: 0; font-size: 9px; }
  .product-modal-specs strong { font-size: 12.5px; }

  .product-modal-finishes button,
  .product-modal-finishes span { width: 32px; height: 32px; }

  .product-modal-nav svg {
    width: 24px;
    height: 10px;
    stroke: rgba(255, 255, 255, 0.82);
    stroke-width: 1.5;
  }
}

@media (max-width: 420px) {
  .product-modal-content h2 { font-size: clamp(28px, 8.5vw, 38px); }
}
</style>
