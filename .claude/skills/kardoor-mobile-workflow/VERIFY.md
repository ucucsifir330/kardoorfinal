# Mobile Verification Recipe

Evidence rules for Step 3 of `SKILL.md`. Reading source is not evidence.
Dispatching `new TouchEvent(...)` / `new PointerEvent(...)` from page script is
not evidence — it skips the browser's real input path and has produced false
"works on mobile" reports in this repo.

Real input means **CDP-level input**: `Input.dispatchTouchEvent`, or Playwright's
`page.touchscreen` / `page.mouse`, against a browser in device emulation.

## Harness

`playwright` is already a devDependency in `nuxt/`. Put throwaway scripts in the
scratchpad, not in the repo. Start the app with `npm run dev` from `nuxt/`.

```js
import { chromium, devices } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices['iPhone 12'],        // 390x844, hasTouch, isMobile, dpr 3
});

// Theme is app state, NOT prefers-color-scheme — `colorScheme` in the context
// options will not switch it. Seed the store before the first paint:
await context.addInitScript(() => {
  localStorage.setItem('kardoor-showroom-ambience', 'day');  // or 'night'
});

// Synthetic-pointer guard: setPointerCapture throws under emulated pointers,
// aborts the handler mid-gesture, and makes you report a bug that isn't real.
// Neutralize it in the HARNESS. Never patch production code to satisfy a test.
await context.addInitScript(() => {
  const noop = () => {};
  Element.prototype.setPointerCapture = noop;
  Element.prototype.releasePointerCapture = noop;
});

const page = await context.newPage();
await page.goto('http://localhost:3000/');
```

**First assertion, every run** — prove the mobile branch actually mounted, or
everything after it is measuring the desktop component:

```js
await page.evaluate(() => ({
  width: innerWidth,
  coarse: matchMedia('(pointer: coarse)').matches,   // must be true
}));
// then assert the mobile component's own root element is in the DOM
```

If `coarse` is false, the harness is wrong, not the app. Fix it with an explicit
CDP override before continuing:

```js
const cdp = await context.newCDPSession(page);
await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await cdp.send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
```

## Real gestures

Taps: `page.touchscreen.tap(x, y)`.

Swipes and flicks need multi-point sequences — drive them through CDP so they
travel the real input path:

```js
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
  type,
  touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
});

await touch('touchStart', 195, 700);
for (let y = 700; y >= 300; y -= 40) { await touch('touchMove', 195, y); }
await touch('touchEnd', 195, 300);
```

Sample state **before, during, and after** the gesture — a single after-shot
hides the failures that matter (`scrollY`, root `position`, `touch-action`,
`body.style.overflow` / lock class, overlay bounds).

## Matrix

Run the section against:

- **390 x 844** portrait — primary proof viewport.
- **360 x 800** portrait — narrow-screen overflow.
- One pixel **below, at, and above** every breakpoint the change touches.
- Day **and** night when the change touches theme-dependent styles — seeded via
  the `kardoor-showroom-ambience` key above, and confirmed by reading the live
  `data-ambience` attribute rather than assuming the seed took.
- Desktop (1440 x 1000) **only** if an approved shared file changed.

## Evidence to record

Report the ones the change can plausibly break — not a fixed ritual:

- Correct component mounted, correct URL and port.
- Horizontal overflow: `document.documentElement.scrollWidth <= innerWidth`.
- Tap targets on interactive elements (≥44px is the working floor here).
- Safe-area placement for anything pinned to a viewport edge.
- Console errors during load and during the gesture.
- Scroll/lock state across the gesture when scroll handoff is involved.
- Exit, cleanup, and re-entry when lifecycle state is involved.

## What invalidates a run

- The mobile branch never mounted (`coarse` false, or desktop root in DOM).
- Production code was edited to make the harness pass.
- Only synthetic DOM events were dispatched.
- Evidence came from a screenshot alone, with no measured values.

## Existing tooling

`nuxt/tests/audit/runtime-browser-audit.mjs` already sweeps routes at 390x844 in
both themes via Playwright + CDP. Reuse its patterns for anything route-wide
rather than writing a second sweeper.
