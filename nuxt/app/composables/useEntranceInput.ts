import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * useEntranceInput — giriş sahnesinin TEK girdi otoritesi.
 *
 * NEDEN VAR
 * Eskiden `EntranceDoorLab` `window`'a `{passive:false}` bir wheel listener
 * bağlıyordu ve bu listener SAYFA ÖMRÜ BOYUNCA duruyordu (unmount'ta
 * sökülüyordu, ama kullanıcı ana sayfadayken hep aktifti). Non-passive bir
 * wheel listener tarayıcıya "bu handler scroll'u iptal edebilir" der; bu
 * yüzden tarayıcı tekerlek olayını compositor'da hızlı yoldan işleyemez,
 * JS'in sonucunu beklemek zorunda kalır — sayfanın TAMAMI için, hero çoktan
 * geçilmiş olsa bile.
 *
 * SÖZLEŞME
 * Girdi burada tek bir anlama indirgenir: yön (+1 aşağı / -1 yukarı) +
 * şiddet + iptal. Tekerlek, klavye ve ileride dokunma aynı `drive()`
 * çağrısına gider; sahne mantığı girdi türünü hiç bilmez.
 *
 * KAPSAM
 * Listener yalnızca sahne "aktif bant"tayken bağlıdır. Bandı `ScrollTrigger`
 * belirler (`onToggle`), yani pin bandı geçildiği anda listener DOM'dan
 * sökülür ve tarayıcı hızlı yoluna geri döner.
 *
 * Bu dosya scroll motorunu (ScrollSmoother / native) BİLMEZ. Motor değişirse
 * burası değişmez — bkz. sahnedeki scroll sink'i.
 */

export type EntranceDirection = 1 | -1;

/** Girdi türünden bağımsız tek karar sözleşmesi. */
export type EntranceDrive = (
  direction: EntranceDirection,
  strength: number,
  cancel: () => void
) => void;

export interface EntranceInputOptions {
  /**
   * Bandı belirleyen eleman. Verilirse kendi ScrollTrigger'ını kurar.
   * Sahnenin ZATEN bir pin trigger'ı varsa `band` kullan — ikinci bir
   * trigger kurmak gereksiz ölçüm maliyeti demektir.
   */
  trigger?: HTMLElement;
  /**
   * Hazır bant kaynağı. Sahne kendi ScrollTrigger'ını yönetiyorsa onun
   * `onToggle`'ından `setActive` çağrılır; composable trigger kurmaz.
   */
  band?: {
    /** Kurulum anındaki durum (onToggle yalnız geçişte ateşler). */
    initialActive: boolean;
  };
  /** Sahnenin karar fonksiyonu. */
  drive: EntranceDrive;
  /**
   * Bandın başı/sonu. ScrollTrigger `start`/`end` sözdizimi.
   * Yalnız `trigger` verildiğinde kullanılır.
   */
  start?: string;
  end?: string | (() => string);
  /**
   * Wheel'i capture fazında yakala. Sahnenin altındaki başka handler'lar
   * olayı görmeden kesmesi gerekiyorsa true.
   */
  capture?: boolean;
  /** Klavye desteği (varsayılan açık). */
  keyboard?: boolean;
  /** Bu şiddetin altındaki tekerlek hareketlerini yok say. */
  minStrength?: number;
  /** Dokunma desteği (varsayılan kapalı — masaüstü sahnesi kullanmıyor). */
  touch?: boolean;
  /** Bir jestin `drive` sayılması için gereken dikey mesafe (px). */
  touchThreshold?: number;
}

/** Klavye tuşu → yön eşlemesi. */
const KEY_DIRECTIONS: Record<string, EntranceDirection> = {
  ArrowDown: 1,
  PageDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  PageUp: -1,
  ArrowLeft: -1
};

/** Tuş basımı kasıtlı bir harekettir; tekerlek şiddet eşiklerine takılmasın. */
const KEY_STRENGTH = 40;

export const useEntranceInput = (options: EntranceInputOptions) => {
  const {
    trigger,
    band,
    drive,
    start = "top top",
    end,
    capture = false,
    keyboard = true,
    minStrength = 0,
    touch = false,
    touchThreshold = 26
  } = options;

  let attached = false;
  let bandTrigger: ScrollTrigger | null = null;

  // TEK JEST = TEK KARAR. Parmak sürüklendiği sürece onlarca touchmove gelir;
  // hepsini `drive`a geçirmek "tek hamlede bir kapı" sözleşmesini bozar. Jest
  // başına yalnız BİR kez sürülür, parmak kalkınca kilit açılır.
  let touchStartY = 0;
  let touchDriven = false;
  let touchActive = false;

  const onWheel = (event: WheelEvent) => {
    const strength = Math.abs(event.deltaY);
    if (strength === 0 || strength < minStrength) return;
    drive(event.deltaY > 0 ? 1 : -1, strength, () => {
      event.preventDefault();
      if (capture) event.stopImmediatePropagation();
    });
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    // Form alanı / düzenlenebilir içerik odaktayken sahneyi sürme.
    const el = document.activeElement as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;

    const direction =
      KEY_DIRECTIONS[event.key] ??
      (event.key === " " ? ((event.shiftKey ? -1 : 1) as EntranceDirection) : undefined);
    if (!direction) return;

    drive(direction, KEY_STRENGTH, () => event.preventDefault());
  };

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    touchStartY = event.touches[0]!.clientY;
    touchDriven = false;
    touchActive = true;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!touchActive || touchDriven || event.touches.length !== 1) return;

    // Parmak YUKARI gidince içerik yukarı akar = ileri (+1), tekerlekteki
    // deltaY > 0 ile aynı anlam.
    const delta = touchStartY - event.touches[0]!.clientY;
    const strength = Math.abs(delta);
    if (strength < touchThreshold) return;

    touchDriven = true;
    drive(delta > 0 ? 1 : -1, strength, () => {
      if (event.cancelable) event.preventDefault();
      if (capture) event.stopImmediatePropagation();
    });
  };

  const onTouchEnd = () => {
    touchActive = false;
    touchDriven = false;
  };

  const attach = () => {
    if (attached) return;
    attached = true;
    // passive:false ŞART: sahne bandında girdiyi iptal edebilmemiz gerekiyor.
    // Bandın dışında hiç bağlı olmadığı için maliyeti sayfaya yayılmaz.
    window.addEventListener("wheel", onWheel, { passive: false, capture });
    if (keyboard) window.addEventListener("keydown", onKeydown);
    if (touch) {
      window.addEventListener("touchstart", onTouchStart, { passive: true, capture });
      window.addEventListener("touchmove", onTouchMove, { passive: false, capture });
      window.addEventListener("touchend", onTouchEnd, { passive: true, capture });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true, capture });
    }
  };

  const detach = () => {
    if (!attached) return;
    attached = false;
    window.removeEventListener("wheel", onWheel, { capture });
    if (keyboard) window.removeEventListener("keydown", onKeydown);
    if (touch) {
      window.removeEventListener("touchstart", onTouchStart, { capture });
      window.removeEventListener("touchmove", onTouchMove, { capture });
      window.removeEventListener("touchend", onTouchEnd, { capture });
      window.removeEventListener("touchcancel", onTouchEnd, { capture });
    }
    touchActive = false;
    touchDriven = false;
  };

  /** Sahne kendi trigger'ını yönetiyorsa onun onToggle'ından çağrılır. */
  const setActive = (active: boolean) => (active ? attach() : detach());

  /** Bandı kur (ya da hazır bandın ilk durumuna göre senkronla). */
  const start_ = () => {
    if (band) {
      setActive(band.initialActive);
      return;
    }

    if (!trigger) return;

    bandTrigger = ScrollTrigger.create({
      trigger,
      start,
      end: end ?? (() => `+=${Math.round(window.innerHeight * 9)}`),
      // onToggle yalnız GEÇİŞTE ateşler; kurulum anında zaten bant içindeysek
      // ilk toggle gelmez. Mevcut durumu aşağıda bir kez senkronluyoruz.
      onToggle: (self) => setActive(self.isActive)
    });

    if (bandTrigger.isActive) attach();
  };

  const destroy = () => {
    detach();
    bandTrigger?.kill();
    bandTrigger = null;
  };

  return { start: start_, setActive, destroy, isAttached: () => attached };
};
