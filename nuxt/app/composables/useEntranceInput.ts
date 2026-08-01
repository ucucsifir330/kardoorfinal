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
  /** Bandı belirleyen eleman (hero section). */
  trigger: HTMLElement;
  /** Sahnenin karar fonksiyonu. */
  drive: EntranceDrive;
  /**
   * Bandın bittiği nokta. ScrollTrigger `start`/`end` sözdizimi.
   * Varsayılan: pin bandının tamamı.
   */
  start?: string;
  end?: string | (() => string);
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
  const { trigger, drive, start = "top top", end } = options;

  let attached = false;
  let bandTrigger: ScrollTrigger | null = null;

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;
    drive(event.deltaY > 0 ? 1 : -1, Math.abs(event.deltaY), () => event.preventDefault());
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

  const attach = () => {
    if (attached) return;
    attached = true;
    // passive:false ŞART: sahne bandında tekerleği iptal edebilmemiz gerekiyor.
    // Bandın dışında hiç bağlı olmadığı için maliyeti sayfaya yayılmaz.
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeydown);
  };

  const detach = () => {
    if (!attached) return;
    attached = false;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeydown);
  };

  /** Bandı kur ve mevcut duruma göre bir kez senkronla. */
  const start_ = () => {
    bandTrigger = ScrollTrigger.create({
      trigger,
      start,
      end: end ?? (() => `+=${Math.round(window.innerHeight * 9)}`),
      // onToggle yalnız GEÇİŞTE ateşler; kurulum anında zaten bant içindeysek
      // ilk toggle gelmez. Mevcut durumu aşağıda bir kez senkronluyoruz.
      onToggle: (self) => (self.isActive ? attach() : detach())
    });

    if (bandTrigger.isActive) attach();
  };

  const destroy = () => {
    detach();
    bandTrigger?.kill();
    bandTrigger = null;
  };

  return { start: start_, destroy, isAttached: () => attached };
};
