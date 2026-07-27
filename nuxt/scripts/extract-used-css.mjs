/**
 * extract-used-css.mjs
 *
 * Amac: "hangi CSS kurallari GERCEKTEN render ediliyor?" sorusunu statik
 * dosya okuyarak degil, CDP (Chrome DevTools Protocol) ile olcerek yanitlamak.
 *
 * Neden: repoda olu kurallar ve eski bilesen kalintilari var. Tailwind'e
 * tasirken bunlari da tasimak, mezarligi yeni sisteme kopyalamak olur.
 *
 * Yontem:
 *   1) CSS.startRuleUsageTracking ile sayfayi gez (breakpoint + tema)
 *   2) Her breakpoint/temada kullanilan kurallari topla
 *   3) Birlesimi al -> "canli" kurallar; geri kalan -> olu aday
 *
 * Kullanim:
 *   node scripts/extract-used-css.mjs --url http://localhost:3111/ --out reports/
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const URL = getArg("url", "http://localhost:3111/");
const OUT_DIR = getArg("out", "reports");

/** Gercek cihaz kirilimlari — projenin media query'leriyle hizali. */
const ALL_VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "mobile-420", width: 420, height: 900, mobile: true },
  { name: "tablet-760", width: 760, height: 1024, mobile: true },
  { name: "laptop-1180", width: 1180, height: 800, mobile: false },
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
  { name: "wide-1920", width: 1920, height: 1080, mobile: false }
];

const ONLY = getArg("only", "");
const VIEWPORTS = ONLY ? ALL_VIEWPORTS.filter(v=>ONLY.split(",").includes(v.name)) : ALL_VIEWPORTS;
const THEMES = ["light", "night"];

/** Sayfayi bastan sona gez ki scroll-tetikli kurallar da render olsun. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
    }
    window.scrollTo(0, max);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

async function collectForViewport(browser, viewport, theme) {
  const context = await browser.newContext({
    // Nuxt DevTools + consola her sayfada yuzlerce console satiri basiyor;
    // 1440/1920'de bu birikim GPU/network servisini cokertiyordu.
    bypassCSP: true,
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.mobile,
    isMobile: viewport.mobile,
    deviceScaleFactor: viewport.mobile ? 3 : 1
  });

  const page = await context.newPage();

  // Tema secimini sayfa yuklenmeden once yaz (localStorage tabanli).
  await page.addInitScript((t) => {
    try {
      window.localStorage.setItem("kardoor-showroom-ambience", t);
    } catch {}
    // Nuxt DevTools/consola gurultusu buyuk viewport'larda tarayiciyi
    // cokertiyor. Olcumu etkilemez; sadece log basmayi durdurur.
    const noop = () => {};
    for (const k of ["log", "info", "debug", "group", "groupEnd", "time", "timeEnd", "timeLog"]) {
      try {
        console[k] = noop;
      } catch {}
    }
  }, theme);

  const client = await context.newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  await client.send("CSS.startRuleUsageTracking");

  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  // Hero + lazy bolumlerin mount olmasi icin biraz bekle.
  await page.waitForTimeout(1200);
  await scrollThrough(page);

  const { ruleUsage } = await client.send("CSS.stopRuleUsageTracking");

  // styleSheetId -> gercek dosya URL'i eslesmesi
  const sheets = new Map();
  for (const usage of ruleUsage) {
    if (sheets.has(usage.styleSheetId)) continue;
    try {
      const { headers } = await client.send("CSS.getStyleSheetText", {
        styleSheetId: usage.styleSheetId
      });
      void headers;
    } catch {}
  }

  const used = [];
  for (const u of ruleUsage) {
    if (!u.used) continue;
    used.push({
      sheet: u.styleSheetId,
      start: u.startOffset,
      end: u.endOffset
    });
  }

  // Kullanilan selector metinlerini dogrudan cikar
  const selectors = await page.evaluate(() => {
    const out = new Set();
    const walk = (sheetList) => {
      for (const sheet of sheetList) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // cross-origin
        }
        if (!rules) continue;
        for (const rule of rules) {
          if (rule.type === CSSRule.STYLE_RULE) {
            try {
              if (document.querySelector(rule.selectorText)) {
                out.add(rule.selectorText);
              }
            } catch {}
          } else if (rule.type === CSSRule.MEDIA_RULE) {
            if (window.matchMedia(rule.conditionText).matches) {
              for (const inner of rule.cssRules) {
                if (inner.type === CSSRule.STYLE_RULE) {
                  try {
                    if (document.querySelector(inner.selectorText)) {
                      out.add(inner.selectorText);
                    }
                  } catch {}
                }
              }
            }
          }
        }
      }
    };
    walk(Array.from(document.styleSheets));
    return Array.from(out);
  });

  await context.close();
  return { usedRanges: used, selectors };
}

async function main() {
  const prev = existsSync(join(OUT_DIR,"used-selectors.json")) ? JSON.parse(readFileSync(join(OUT_DIR,"used-selectors.json"),"utf8")) : null;
  const allSelectors = new Set(prev?.selectors ?? []);
  const perContext = Object.fromEntries(Object.entries(prev?.perContext ?? {}).filter(([,v])=>typeof v==="number"));

  // Her baglam icin AYRI tarayici: 1440/1920'de bir cokme digerlerini
  // goturuyordu (tek browser paylasildiginda "browser has been closed").
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const key = `${vp.name}/${theme}`;
      process.stdout.write(`olculuyor: ${key} ... `);

      let browser = null;
      let attempt = 0;
      let ok = false;

      while (attempt < 2 && !ok) {
        attempt += 1;
        try {
          browser = await chromium.launch({
            args: ["--disable-dev-shm-usage", "--disable-gpu", "--no-sandbox"]
          });
          const { selectors } = await collectForViewport(browser, vp, theme);
          selectors.forEach((s) => allSelectors.add(s));
          perContext[key] = selectors.length;
          process.stdout.write(`${selectors.length} selector\n`);
          ok = true;
        } catch (err) {
          if (attempt >= 2) {
            const short = String(err.message).split("\n")[0];
            process.stdout.write(`HATA: ${short}\n`);
            perContext[key] = `hata: ${short}`;
          }
        } finally {
          if (browser) {
            try {
              await browser.close();
            } catch {}
            browser = null;
          }
        }
      }
    }
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const sorted = Array.from(allSelectors).sort();
  const outFile = join(OUT_DIR, "used-selectors.json");
  writeFileSync(
    outFile,
    JSON.stringify(
      { url: URL, capturedAt: new Date().toISOString(), perContext, total: sorted.length, selectors: sorted },
      null,
      2
    )
  );

  console.log(`\nToplam benzersiz CANLI selector: ${sorted.length}`);
  console.log(`Yazildi: ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
