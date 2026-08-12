import { computed } from "vue";
import { useState } from "#app";

/**
 * Açılış perdesinin GERÇEK ilerlemesi.
 *
 * Eskiden WelcomeScreen sabit bir GSAP zaman çizelgesiydi: dolum 4.55s +
 * bekleme 0.62s + çıkış 1.38s ≈ 7s, üstüne 9.8s'lik fallback. Hiçbir şey
 * ölçmüyordu — hızlı bağlantıda gereksiz bekletiyor, yavaş bağlantıda ise
 * varlıklar hazır olmadan perdeyi açıyordu.
 *
 * Artık ilerleme, hero'nun görünür olması için gerçekten gereken işlere
 * bağlı. Görev listesi burada sabit DEĞİL: sahne kendi bağımlılıklarını
 * `track` ile bildirir, bu katman yalnız sayar.
 */
const STATE_KEY = "kardoor-startup-progress";

interface StartupProgressState {
  total: number;
  done: number;
  ids: string[];
}

export const useStartupProgress = () => {
  const state = useState<StartupProgressState>(STATE_KEY, () => ({
    total: 0,
    done: 0,
    ids: []
  }));

  /**
   * Bir yükleme işini ilerlemeye dahil eder. Reddedilen promise de "bitti"
   * sayılır: amaç hatasız yükleme değil, perdeyi sonsuza dek açık
   * bırakmamak (sprite 404'lerse de sahne açılmalı).
   */
  const track = <T>(id: string, promise: Promise<T>): Promise<T> => {
    if (state.value.ids.includes(id)) return promise;

    state.value.ids = [...state.value.ids, id];
    state.value.total += 1;

    promise
      .catch(() => undefined)
      .finally(() => {
        state.value.done += 1;
      });

    return promise;
  };

  // Henüz kimse kaydolmadıysa 0 — "bölme sıfıra" değil, ilerleme yok demek.
  const progress = computed(() =>
    state.value.total === 0 ? 0 : state.value.done / state.value.total
  );

  const isComplete = computed(
    () => state.value.total > 0 && state.value.done >= state.value.total
  );

  // Hero'suz sayfalarda (alt sayfalar, lab) hiç görev kaydolmaz; perde bunu
  // "hiç bitmedi" değil "bekleyecek şey yok" diye okuyabilsin.
  const hasTasks = computed(() => state.value.total > 0);

  return { track, progress, isComplete, hasTasks };
};

/**
 * Bir görselin inip çözülmesini bekler. Hata durumunda da resolve olur —
 * bkz. track() notu.
 */
export const whenImageReady = (src: string): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();

  const img = new Image();
  img.src = src;

  if (img.decode) return img.decode().catch(() => undefined);

  return new Promise<void>((resolve) => {
    if (img.complete) return resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
};

/** Web fontlarının yerleşmesini bekler; desteklenmiyorsa hemen geçer. */
export const whenFontsReady = (): Promise<void> => {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return Promise.resolve();
  }
  return (document as Document & { fonts: FontFaceSet }).fonts.ready.then(
    () => undefined
  );
};
