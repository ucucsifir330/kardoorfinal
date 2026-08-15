/**
 * useAppBoot — the boot layer that OWNS first-paint loading.
 *
 * WHY THIS REPLACES useStartupProgress
 *
 * The old layer was passive: it only counted work that components registered
 * with `track()`. Those registrations happen in `EntranceDoorLab.onMounted`,
 * which lives inside `<ClientOnly>` and therefore runs 1-2s after the curtain
 * is already on screen. To cover that gap the curtain guessed — it waited
 * `NO_TASK_GRACE_MS = 2500` in case work showed up late.
 *
 * Two costs, both measured on 2026-08-15:
 *   • /contact registers NOTHING, yet paid the full 2.5s guess. The page was
 *     interactive at 0.9s and the curtain held it until 5.6-6.3s.
 *   • On `/` the loading only STARTED once the hero mounted, so the curtain
 *     was showing while nothing was downloading.
 *
 * This layer inverts that. It knows what a route needs before any component
 * mounts, and it starts those downloads itself. The curtain becomes a view of
 * work that is genuinely in flight, and a route with no work never blocks.
 *
 * Contract: `plan()` is called once per boot, synchronously, from the curtain.
 * Everything after that is just reporting.
 */
import { spriteOnBellek } from "~/composables/useDoorSprite";

interface BootState {
  total: number;
  done: number;
  started: boolean;
}

interface BootTask {
  id: string;
  run: () => Promise<unknown>;
}

/** The hero preload script in nuxt.config publishes the resolved URL here. */
interface KardoorHero {
  href?: string;
  night?: boolean;
}

const STATE_KEY = "kardoor-app-boot";

const isNightTheme = () => {
  try {
    return window.localStorage.getItem("kardoor-showroom-ambience") === "night";
  } catch {
    // Storage can be blocked; day is the documented default.
    return false;
  }
};

/** Resolves when the image is decoded, or immediately if it is already cached. */
const whenImageReady = (src: string) =>
  new Promise<void>((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => resolve(); // a 404 must not hold the curtain
    img.src = src;
    if (img.complete) resolve();
  });

const whenFontsReady = () =>
  document.fonts?.ready ? document.fonts.ready.then(() => undefined) : Promise.resolve();

/**
 * Warms the door sprite into the cache `useDoorSprite` reads from, so the
 * scene finds it already resolved instead of starting a fresh fetch chain.
 */
const whenSpriteReady = (metaUrl: string) => {
  if (spriteOnBellek.has(metaUrl)) return spriteOnBellek.get(metaUrl)!.then(() => undefined);

  const ready = fetch(metaUrl)
    .then((r) => r.json())
    .then(
      (meta) =>
        new Promise<{ meta: unknown; image: HTMLImageElement }>((resolve, reject) => {
          const img = new Image();
          img.decoding = "async";
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ meta, image: img });
          img.onerror = reject;
          img.src = meta.image ?? metaUrl.replace(".json", ".webp");
        })
    );

  spriteOnBellek.set(metaUrl, ready as never);
  return ready.then(() => undefined).catch(() => undefined);
};

/**
 * What each route must have on screen before the curtain may lift.
 *
 * Only `/` declares work: it is the single route whose first frame depends on
 * heavy assets (the LCP hero photo and the door sprite that fills the hole).
 * Every other route returns an empty list and therefore never sees a curtain —
 * that is the whole fix for the 2.5s idle wait.
 */
/**
 * Whether a route has first-paint work at all — pure, and safe to call during
 * SSR. This is what lets the curtain be server-rendered: the server cannot
 * know the theme or read `window`, but it does know the path, and the path
 * alone decides whether a curtain is needed.
 *
 * Without this the curtain could only appear after hydration. Measured in dev
 * on `/`: content was hidden from the first paint but the curtain did not
 * render until 3159ms — 2.4s of blank screen with nothing covering it.
 */
export const routeHasBootWork = (path: string) => {
  const normalized = path.replace(/\/+$/, "") || "/";
  return normalized === "/";
};

const planFor = (path: string): BootTask[] => {
  if (!routeHasBootWork(path)) return [];

  const night = isNightTheme();
  const hero = (window as unknown as { __kardoorHero?: KardoorHero }).__kardoorHero;
  const spriteUrl = night ? "/kardoor-door-night.json" : "/kardoor-door-light.json";

  return [
    // The head script already picked the right variant and started the
    // preload; awaiting the same URL joins that request instead of a new one.
    { id: "hero", run: () => whenImageReady(hero?.href ?? "") },
    { id: "sprite", run: () => whenSpriteReady(spriteUrl) },
    { id: "fonts", run: () => whenFontsReady() },
  ];
};

export const useAppBoot = () => {
  const state = useState<BootState>(STATE_KEY, () => ({ total: 0, done: 0, started: false }));

  /**
   * Declares the route's work and starts every task immediately. Returns how
   * many tasks are in flight so the caller can decide whether to show a
   * curtain at all. Safe to call twice; the second call is a no-op.
   */
  const plan = (path: string): number => {
    if (!import.meta.client || state.value.started) return state.value.total;

    const tasks = planFor(path);
    state.value.started = true;
    state.value.total = tasks.length;
    state.value.done = 0;

    for (const task of tasks) {
      // A rejected task still counts as finished: the goal is a curtain that
      // always lifts, not a guarantee that every asset arrived.
      task
        .run()
        .catch(() => undefined)
        .finally(() => {
          state.value.done += 1;
        });
    }

    return tasks.length;
  };

  const progress = computed(() =>
    state.value.total === 0 ? 1 : state.value.done / state.value.total
  );
  const isReady = computed(() => state.value.done >= state.value.total);
  const hasWork = computed(() => state.value.total > 0);

  return { plan, progress, isReady, hasWork };
};
