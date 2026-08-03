import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";
import { gsap } from "gsap";
import { useState } from "#app";

/**
 * Sayfa perdesi açıldıktan sonra oynayan ortak blur/scale reveal.
 *
 * Neden ayrı dosya: aynı hazırla/oynat/temizle üçlüsü EntranceDoorLab,
 * SiteHeader ve FloatingContactHub içinde birebir kopyalanmıştı. Üç kopya
 * demek, süre veya ease değişince üçünün ayrışması demek — perde altında
 * beraber görünmesi gereken parçalar için bu doğrudan görünür bir hata.
 *
 * Sahiplik: reveal'in tetiği global `kardoor-page-content-visible` state'i,
 * ama SAHNELEME her bileşenin kendinde kalır — hangi elemanların birlikte
 * açılacağını çağıran bileşen bilir, burası yalnız "nasıl" açılacağını bilir.
 */
const REVEAL_STATE_KEY = "kardoor-page-content-visible";

const FROM = { filter: "blur(20px)", opacity: 0, scale: 0.9 } as const;
const TO = { filter: "blur(0px)", opacity: 1, scale: 1 } as const;
const DURATION = 1.5;
const EASE = "power2.out";
const CLEAR = "filter,opacity,scale";

export interface ContentRevealOptions {
  /** Birlikte açılacak elemanlar. Boş/null olanlar varsa reveal ertelenir. */
  targets: () => Array<HTMLElement | null>;
  /** false dönerse reveal hiç kurulmaz (ör. yalnız ana sayfada oynasın). */
  enabled?: () => boolean;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useContentReveal = (options: ContentRevealOptions) => {
  const isPageContentVisible = useState<boolean>(REVEAL_STATE_KEY, () => true);

  let tween: ReturnType<typeof gsap.to> | undefined;
  let isPrepared = false;
  let hasPlayed = false;

  const isEnabled = () => (options.enabled ? options.enabled() : true);

  // Hepsi hazır değilse boş dizi döner: yarım kadroyla reveal başlatmak,
  // geç bağlanan elemanı görünmez bırakır.
  const resolveTargets = (): HTMLElement[] => {
    const found = options.targets();
    return found.every((el): el is HTMLElement => Boolean(el)) ? found : [];
  };

  const prepare = () => {
    if (isPrepared || hasPlayed || !isEnabled() || prefersReducedMotion()) return;

    const targets = resolveTargets();
    if (targets.length === 0) return;

    gsap.set(targets, FROM);
    isPrepared = true;
  };

  const play = () => {
    if (hasPlayed || !isEnabled()) return;

    const targets = resolveTargets();
    if (targets.length === 0) return;

    hasPlayed = true;

    // Reduced-motion: hazırlıkta yazılmış olabilecek stiller geri alınır,
    // eleman doğrudan son halinde kalır.
    if (prefersReducedMotion()) {
      gsap.set(targets, { clearProps: CLEAR });
      return;
    }

    prepare();
    tween?.kill();
    tween = gsap.to(targets, {
      ...TO,
      duration: DURATION,
      ease: EASE,
      overwrite: "auto",
      clearProps: CLEAR,
      onComplete: () => {
        tween = undefined;
      }
    });
  };

  const cleanup = () => {
    tween?.kill();
    tween = undefined;

    const targets = resolveTargets();
    if (targets.length) gsap.set(targets, { clearProps: CLEAR });
  };

  /**
   * Reveal'i yeniden oynatılabilir hale getirir. Rota değişip aynı bileşen
   * yeni bir elemanla geri bağlandığında gerekir — bileşen unmount olmadığı
   * için "bir kez oynar" kilidi kendiliğinden açılmaz.
   */
  const reset = () => {
    cleanup();
    isPrepared = false;
    hasPlayed = false;
  };

  onMounted(() => {
    prepare();
    // Perde bu bileşen bağlanmadan açılmış olabilir (route değişimi, geri
    // gelme): o durumda watch hiç tetiklenmez, reveal burada başlar.
    if (isPageContentVisible.value) play();
  });

  watch(isPageContentVisible, (isVisible) => {
    if (isVisible) play();
  });

  onBeforeUnmount(cleanup);

  return { isPageContentVisible, play, prepare, reset, cleanup };
};
