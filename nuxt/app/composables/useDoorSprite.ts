import { ref, type Ref } from "vue";

/**
 * useDoorSprite — paketlenmiş kapı sprite sheet'ini bir <canvas>'a frame-frame
 * çizen, scroll progress'iyle sürülebilen küçük motor.
 *
 * EntranceDoor'dan taşınan kanıtlanmış pattern'ler:
 *  • Source-rect çizim  : sheet'ten tek kare kopyalanır (runtime pixel işlemi yok).
 *  • DPR cap (max 2)    : retina'da aşırı çözünürlük israfı önlenir.
 *  • rAF coalescing     : bir frame'de kaç kez istenirse istensin tek çizim yapılır.
 *  • Frame cache        : aynı kare tekrar istenirse çizim atlanır.
 *
 * Metadata, public/kardoor-door-*.json formatındadır
 * (frameWidth/frameHeight/columns/rows/frames[]).
 */

interface SpriteFrame {
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpriteMetadata {
  sprite: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frameCount?: number;
  frames: SpriteFrame[];
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * Rota geçişinde önden hazırlanan sprite'lar.
 *
 * `app.vue` ana sayfaya dönerken bu haritayı dolduruyor; `load()` aynı
 * URL'i yeniden istemek yerine hazır sözü bekliyor. Paylaşmadan önce
 * ölçüldüğünde `load()` JSON'u 1480ms'de TEKRAR istiyordu ve o istek
 * 406ms sürüyordu (boşta aynı istek 10ms) — ana iş parçacığı hero
 * kurulumuyla meşgul olduğu için. Şimdi iş geçiş sırasında bitiyor.
 */
export const spriteOnBellek = new Map<string, Promise<{
  meta: SpriteMetadata;
  image: HTMLImageElement;
}>>();

const loadImage = (src: string): Promise<HTMLImageElement> => {
  const img = new Image();
  img.decoding = "async";
  img.crossOrigin = "anonymous";
  img.src = src;

  const settle = img.decode
    ? img.decode().catch(
        () =>
          new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`sprite load failed: ${src}`));
          })
      )
    : new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`sprite load failed: ${src}`));
      });

  return settle.then(() => img);
};

export function useDoorSprite(canvasRef: Ref<HTMLCanvasElement | null>) {
  const ready = ref(false);

  let ctx: CanvasRenderingContext2D | null = null;
  let image: HTMLImageElement | undefined;
  let meta: SpriteMetadata | undefined;
  let metrics = { w: 0, h: 0, dpr: 1 };
  let currentFrame = -1;
  let queued: SpriteFrame | undefined;
  let raf = 0;

  // Canvas'ın iç buffer çözünürlüğünü CSS boyutu × DPR'a (max 2) eşitle.
  const syncMetrics = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const w = Math.max(1, Math.round(canvas.clientWidth));
    const h = Math.max(1, Math.round(canvas.clientHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(1, Math.round(w * dpr));
    const ch = Math.max(1, Math.round(h * dpr));

    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;

    metrics = { w, h, dpr };
  };

  const drawNow = (frame: SpriteFrame) => {
    if (!image || !ctx) return;
    if (!metrics.w) syncMetrics();

    const { w, h, dpr } = metrics;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // Sheet'teki kareyi canvas kutusuna (kapı boşluğu) kopyala.
    ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height, 0, 0, w, h);
  };

  // Çizimi tek rAF'a topla: aynı frame'de defalarca istense bile bir kez çizilir.
  const draw = (frame: SpriteFrame) => {
    queued = frame;
    if (raf) return;

    raf = window.requestAnimationFrame(() => {
      raf = 0;
      if (!queued) return;
      const next = queued;
      queued = undefined;
      drawNow(next);
    });
  };

  const frameAt = (n: number): SpriteFrame | undefined => {
    if (!meta?.frames.length) return undefined;
    const index = Math.min(meta.frames.length - 1, Math.max(0, n - 1));
    return meta.frames[index];
  };

  /** Belirli bir kareyi göster (1-tabanlı). Aynı kareyse atla. */
  const showFrame = (n: number) => {
    if (n === currentFrame) return;
    const frame = frameAt(n);
    if (!frame) return;
    currentFrame = n;
    draw(frame);
  };

  /** 0→1 progress'i kare numarasına eşle ve göster. */
  const showProgress = (p: number) => {
    const count = meta?.frames.length ?? 0;
    if (!count) return;
    const n = Math.min(count, Math.max(1, Math.floor(clamp01(p) * count) + 1));
    showFrame(n);
  };

  /**
   * Sprite metadata + görselini yükle. Tema değişiminde (light↔night) tekrar
   * çağrılabilir; mevcut kare numarası korunur ve yeni sprite ile yeniden çizilir.
   */
  const load = async (metaUrl: string) => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    if (!ctx) ctx = canvas.getContext("2d");

    // Önden hazırlanmışsa onu kullan; yoksa şimdi indir ve paylaş.
    let hazir = spriteOnBellek.get(metaUrl);
    if (!hazir) {
      hazir = fetch(metaUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`sprite metadata failed: ${res.status}`);
          return res.json() as Promise<SpriteMetadata>;
        })
        .then(async (m) => ({ meta: m, image: await loadImage(m.sprite) }));
      spriteOnBellek.set(metaUrl, hazir);
    }

    const { meta: nextMeta, image: nextImage } = await hazir;

    meta = nextMeta;
    image = nextImage;
    ready.value = true;

    syncMetrics();
    const frame = frameAt(currentFrame > 0 ? currentFrame : 1);
    if (frame) drawNow(frame);
  };

  /** Boyut/DPR değiştiğinde (resize, pin refresh) canvas'ı yeniden ölçüp çiz. */
  const refresh = () => {
    syncMetrics();
    const frame = frameAt(currentFrame > 0 ? currentFrame : 1);
    if (frame) drawNow(frame);
  };

  const dispose = () => {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    queued = undefined;
    image = undefined;
    meta = undefined;
    ctx = null;
    currentFrame = -1;
    ready.value = false;
  };

  return {
    ready,
    load,
    refresh,
    dispose,
    showFrame,
    showProgress,
    get frameCount() {
      return meta?.frames.length ?? 0;
    }
  };
}
