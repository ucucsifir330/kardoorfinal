import { gsap } from "gsap";

/**
 * MIKNATIS ETKİSİ: imleç bir bağlantıya yaklaşınca içindeki hedef ona
 * doğru çekilir, uzaklaşınca yaylanarak yerine döner.
 *
 * Neden ayrı dosya: bu davranışın katalogla hiçbir ilişkisi yok — bir
 * bağlantı, bir hedef seçici ve iki fare olayı. HomeCatalog.vue'nun içinde
 * durduğu için aynı etkiyi başka bir yüzeyde kullanmak kopyalamayı
 * gerektiriyordu (memory'deki "aynı şeyin iki kopyası" tuzağı).
 *
 * Kullanım:
 *   const magnet = useMagneticHover();
 *   <a @mousemove="magnet.onMove" @mouseleave="magnet.onLeave">
 *
 * Hedef, bağlantının içindeki `TARGET_SELECTOR`'a uyan ilk eleman; yoksa
 * bağlantının kendisi hareket eder.
 */

/** Çekilen iç eleman. Bulunamazsa bağlantının kendisi kullanılır. */
const TARGET_SELECTOR = ".catalog-tag-part, .catalog-learn-more__circle";

/** Etki yarıçapı: elemanın yarı boyutu, 58-86px arasına kıstırılmış. */
const RADIUS_MIN = 58;
const RADIUS_MAX = 86;

/** İmlece doğru kayma oranı — mesafenin bu kadarı kadar hareket eder. */
const PULL_RATIO = 0.28;
/** Yatay kaymaya bağlı hafif eğilme (derece). */
const TILT_RATIO = 0.045;
/** Merkeze en yakınken uygulanan büyüme. */
const SCALE_GAIN = 0.045;

export const useMagneticHover = () => {
  const resolveTarget = (zone: HTMLElement) =>
    zone.querySelector<HTMLElement>(TARGET_SELECTOR) || zone;

  const onLeave = (event: MouseEvent) => {
    const zone = event.currentTarget as HTMLElement;

    // elastic: bırakınca yaylanarak dönsün — "mıknatıstan kopma" hissi.
    gsap.to(resolveTarget(zone), {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      duration: 0.36,
      ease: "elastic.out(1, 0.45)",
      overwrite: true
    });
  };

  const onMove = (event: MouseEvent) => {
    const zone = event.currentTarget as HTMLElement;
    const rect = zone.getBoundingClientRect();

    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const radius = Math.min(
      Math.max(Math.max(rect.width, rect.height) / 2, RADIUS_MIN),
      RADIUS_MAX
    );
    const distance = Math.hypot(dx, dy);

    // Yarıçap dışında: mouseleave beklemeden bırak. Bağlantı kutusu
    // yarıçaptan geniş olabiliyor; imleç kutu içinde ama etki alanı
    // dışındayken hedef takılı kalmasın.
    if (distance > radius) {
      onLeave(event);
      return;
    }

    const pull = 1 - distance / radius;

    gsap.to(resolveTarget(zone), {
      x: dx * PULL_RATIO * pull,
      y: dy * PULL_RATIO * pull,
      rotate: dx * TILT_RATIO * pull,
      scale: 1 + pull * SCALE_GAIN,
      duration: 0.85,
      ease: "power3.out",
      overwrite: "auto"
    });
  };

  return { onMove, onLeave };
};
