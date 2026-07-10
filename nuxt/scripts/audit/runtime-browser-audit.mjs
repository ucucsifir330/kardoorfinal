import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const outDir = path.join(root, "reports", "audit");
const baseUrl = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const routes = (process.env.AUDIT_ROUTES || "/,/catalog,/catalog/aluminium,/catalog/steel,/catalog/wood,/catalog/pvc,/catalog/glass,/catalog/technical,/company,/references,/contact,/series,/series/aluminium-frame,/doors/AL-001")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const themes = (process.env.AUDIT_THEMES || "light,dark").split(",").map((theme) => theme.trim()).filter(Boolean);
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 }
];

const normalizePath = (filePath) => path.relative(root, filePath).replaceAll(path.sep, "/");
const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });
const routeUrl = (route) => new URL(route, baseUrl).toString();

function summarizeUsage(styleSheetHeaders, ruleUsage, styleSheetTexts) {
  const bySheet = new Map();

  for (const usage of ruleUsage) {
    if (!bySheet.has(usage.styleSheetId)) {
      const header = styleSheetHeaders.get(usage.styleSheetId) || {};
      bySheet.set(usage.styleSheetId, {
        styleSheetId: usage.styleSheetId,
        sourceURL: header.sourceURL || header.href || header.origin || "inline/no-url",
        usedRanges: 0,
        unusedRanges: 0,
        usedBytes: 0,
        unusedBytes: 0,
        totalBytes: styleSheetTexts.get(usage.styleSheetId)?.length ?? 0
      });
    }

    const sheet = bySheet.get(usage.styleSheetId);
    const bytes = Math.max(0, usage.endOffset - usage.startOffset);
    if (usage.used) {
      sheet.usedRanges++;
      sheet.usedBytes += bytes;
    } else {
      sheet.unusedRanges++;
      sheet.unusedBytes += bytes;
    }
  }

  return [...bySheet.values()]
    .map((sheet) => ({
      ...sheet,
      usedRatio: sheet.totalBytes > 0 ? Number((sheet.usedBytes / sheet.totalBytes).toFixed(4)) : null
    }))
    .sort((a, b) => (b.unusedBytes - a.unusedBytes) || a.sourceURL.localeCompare(b.sourceURL));
}

async function setTheme(page, theme) {
  await page.evaluate(async (nextTheme) => {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    const link = document.querySelector("#kardoor-theme");
    if (link instanceof HTMLLinkElement) {
      link.href = `/themes/${nextTheme}.css`;
      await new Promise((resolve) => {
        link.addEventListener("load", resolve, { once: true });
        setTimeout(resolve, 600);
      });
    }
  }, theme);
}

async function exercisePage(page) {
  await page.evaluate(async () => {
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const steps = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.floor(maxY * ratio));

    for (const y of steps) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 80)));
    }
  });

  const hoverTargets = await page.locator("a, button, [role='button'], .catalog-card, .product-card, .site-header__nav-link").elementHandles();
  for (const handle of hoverTargets.slice(0, 30)) {
    try {
      await handle.hover({ timeout: 250 });
      await page.waitForTimeout(30);
    } catch {}
  }
}

async function collectSelectorAndCascadeSamples(page) {
  return page.evaluate(() => {
    const selectorRows = [];
    const cascadeCandidates = [];
    const comparableProperties = new Set([
      "align-items",
      "background",
      "background-color",
      "border",
      "border-color",
      "border-radius",
      "box-shadow",
      "color",
      "display",
      "flex-direction",
      "font-family",
      "font-size",
      "font-weight",
      "gap",
      "grid-template-columns",
      "height",
      "justify-content",
      "left",
      "letter-spacing",
      "line-height",
      "margin",
      "margin-bottom",
      "margin-left",
      "margin-right",
      "margin-top",
      "max-width",
      "min-height",
      "opacity",
      "padding",
      "padding-bottom",
      "padding-left",
      "padding-right",
      "padding-top",
      "position",
      "right",
      "text-transform",
      "top",
      "transform",
      "transition",
      "width",
      "z-index"
    ]);

    const styleSheets = Array.from(document.styleSheets);

    for (const sheet of styleSheets) {
      const owner = sheet.ownerNode;
      const source =
        owner?.dataset?.viteDevId ||
        owner?.getAttribute?.("href") ||
        sheet.href ||
        "inline/no-url";

      let rules = [];
      try {
        rules = Array.from(sheet.cssRules || []);
      } catch {
        continue;
      }

      for (const rule of rules) {
        if (!(rule instanceof CSSStyleRule)) continue;

        const selector = rule.selectorText;
        let elements = [];
        let queryError = null;

        try {
          elements = Array.from(document.querySelectorAll(selector));
        } catch (error) {
          queryError = String(error?.message || error);
        }

        selectorRows.push({
          source,
          selector,
          matchedElements: elements.length,
          queryError
        });

        if (queryError || elements.length === 0) continue;

        for (const property of Array.from(rule.style)) {
          if (property.startsWith("--")) continue;
          if (!comparableProperties.has(property)) continue;

          const expected = rule.style.getPropertyValue(property).trim();
          const priority = rule.style.getPropertyPriority(property);
          const sampled = elements.slice(0, 8).map((element) => {
            const computed = getComputedStyle(element).getPropertyValue(property).trim();
            return {
              tag: element.tagName.toLowerCase(),
              className: typeof element.className === "string" ? element.className : "",
              computed,
              matchesDeclarationText: computed === expected
            };
          });

          const losingSamples = sampled.filter((sample) => !sample.matchesDeclarationText).length;
          if (sampled.length > 0 && losingSamples === sampled.length) {
            cascadeCandidates.push({
              source,
              selector,
              property,
              value: expected,
              important: priority === "important",
              matchedElements: elements.length,
              sampledElements: sampled.length,
              sampled
            });
          }
        }
      }
    }

    return { selectorRows, cascadeCandidates };
  });
}

async function collectForScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.viewport.width, height: scenario.viewport.height },
    reducedMotion: "reduce"
  });
  // Seed the app's own ambience storage so Vue applies the real mode classes
  // (.app-shell--day/night); setting data-theme alone misses those selectors.
  await context.addInitScript((ambienceMode) => {
    window.localStorage.setItem("kardoor-showroom-ambience", ambienceMode);
  }, scenario.theme === "dark" ? "night" : "day");
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const styleSheetHeaders = new Map();
  const styleSheetTexts = new Map();

  client.on("CSS.styleSheetAdded", ({ header }) => {
    styleSheetHeaders.set(header.styleSheetId, header);
  });

  await client.send("DOM.enable");
  await client.send("CSS.enable");
  await client.send("CSS.startRuleUsageTracking");

  await page.goto(routeUrl(scenario.route), { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await setTheme(page, scenario.theme);
  await exercisePage(page);

  const { ruleUsage } = await client.send("CSS.stopRuleUsageTracking");

  for (const styleSheetId of styleSheetHeaders.keys()) {
    try {
      const { text } = await client.send("CSS.getStyleSheetText", { styleSheetId });
      styleSheetTexts.set(styleSheetId, text);
    } catch {}
  }

  const cssUsageBySheet = summarizeUsage(styleSheetHeaders, ruleUsage, styleSheetTexts);
  const { selectorRows, cascadeCandidates } = await collectSelectorAndCascadeSamples(page);

  await context.close();

  return {
    scenario,
    cssUsageBySheet,
    selectorRows,
    cascadeCandidates
  };
}

async function main() {
  await ensureDir(outDir);

  const browser = await chromium.launch({ headless: true });
  const scenarios = routes.flatMap((route) =>
    themes.flatMap((theme) =>
      viewports.map((viewport) => ({ route, theme, viewport }))
    )
  );

  const results = [];

  for (const scenario of scenarios) {
    console.log(`[audit:runtime] ${scenario.viewport.name} ${scenario.theme} ${scenario.route}`);
    results.push(await collectForScenario(browser, scenario));
  }

  await browser.close();

  const selectorPresence = new Map();
  const cascadeCandidates = [];
  const cssUsage = [];

  for (const result of results) {
    const scenarioKey = `${result.scenario.viewport.name}:${result.scenario.theme}:${result.scenario.route}`;

    for (const row of result.selectorRows) {
      const key = `${row.source}::${row.selector}`;
      if (!selectorPresence.has(key)) {
        selectorPresence.set(key, {
          source: row.source,
          selector: row.selector,
          scenarios: [],
          totalMatchedElements: 0,
          queryErrors: []
        });
      }

      const entry = selectorPresence.get(key);
      entry.scenarios.push({ scenario: scenarioKey, matchedElements: row.matchedElements });
      entry.totalMatchedElements += row.matchedElements;
      if (row.queryError) entry.queryErrors.push({ scenario: scenarioKey, error: row.queryError });
    }

    for (const candidate of result.cascadeCandidates) {
      cascadeCandidates.push({ scenario: scenarioKey, ...candidate });
    }

    for (const sheet of result.cssUsageBySheet) {
      cssUsage.push({ scenario: scenarioKey, ...sheet });
    }
  }

  const selectorPresenceRows = [...selectorPresence.values()]
    .map((entry) => ({
      ...entry,
      matchedScenarioCount: entry.scenarios.filter((scenario) => scenario.matchedElements > 0).length
    }))
    .sort((a, b) => a.totalMatchedElements - b.totalMatchedElements || a.selector.localeCompare(b.selector));

  const neverMatchedSelectors = selectorPresenceRows.filter((entry) => entry.totalMatchedElements === 0);

  const alwaysLosingGroups = new Map();
  for (const candidate of cascadeCandidates) {
    const key = `${candidate.source}::${candidate.selector}::${candidate.property}::${candidate.value}`;
    if (!alwaysLosingGroups.has(key)) {
      alwaysLosingGroups.set(key, {
        source: candidate.source,
        selector: candidate.selector,
        property: candidate.property,
        value: candidate.value,
        important: candidate.important,
        scenarios: [],
        totalMatchedElements: 0
      });
    }

    const entry = alwaysLosingGroups.get(key);
    entry.scenarios.push(candidate.scenario);
    entry.totalMatchedElements += candidate.matchedElements;
  }

  const scenarioCount = scenarios.length;
  const alwaysLosingDeclarations = [...alwaysLosingGroups.values()]
    .filter((entry) => entry.scenarios.length === scenarioCount)
    .sort((a, b) => b.totalMatchedElements - a.totalMatchedElements || a.selector.localeCompare(b.selector));

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    scenarios: scenarioCount,
    routes,
    themes,
    viewports: viewports.map(({ name, width, height }) => ({ name, width, height })),
    selectorRows: selectorPresenceRows.length,
    neverMatchedSelectors: neverMatchedSelectors.length,
    cascadeCandidates: cascadeCandidates.length,
    alwaysLosingDeclarations: alwaysLosingDeclarations.length,
    warning:
      "Runtime audit is evidence, not an auto-delete list. Clicked/modal/async states not exercised by this script still need targeted checks."
  };

  const writeJson = async (name, data) => {
    await fs.writeFile(path.join(outDir, name), `${JSON.stringify(data, null, 2)}\n`);
  };

  await writeJson("runtime-summary.json", summary);
  await writeJson("runtime-css-rule-usage.json", cssUsage);
  await writeJson("runtime-selector-presence.json", selectorPresenceRows);
  await writeJson("runtime-never-matched-selectors.json", neverMatchedSelectors);
  await writeJson("runtime-cascade-candidates.json", cascadeCandidates);
  await writeJson("runtime-always-losing-declarations.json", alwaysLosingDeclarations);

  const markdown = [
    "# Kardoor Runtime Browser Audit",
    "",
    `Generated: ${summary.generatedAt}`,
    `Base URL: ${baseUrl}`,
    "",
    "## Scenario Matrix",
    "",
    `- Routes: ${routes.join(", ")}`,
    `- Themes: ${themes.join(", ")}`,
    `- Viewports: ${viewports.map((viewport) => `${viewport.name} ${viewport.width}x${viewport.height}`).join(", ")}`,
    `- Scenario count: ${scenarioCount}`,
    "",
    "## Counts",
    "",
    `- Selector rows: ${summary.selectorRows}`,
    `- Never matched selectors: ${summary.neverMatchedSelectors}`,
    `- Cascade losing samples: ${summary.cascadeCandidates}`,
    `- Declarations losing in every sampled scenario: ${summary.alwaysLosingDeclarations}`,
    "",
    "## Important",
    "",
    "This script scrolls and hovers common controls, but it does not click through every modal, form, drawer or language state. Treat reports as ranked evidence for manual cleanup batches."
  ].join("\n");

  await fs.writeFile(path.join(outDir, "RUNTIME.md"), `${markdown}\n`);
  console.log(`[audit:runtime] Wrote runtime audit reports to ${normalizePath(outDir)}`);
  console.log(`[audit:runtime] scenarios=${scenarioCount}, neverMatchedSelectors=${neverMatchedSelectors.length}, alwaysLosingDeclarations=${alwaysLosingDeclarations.length}`);
}

main().catch((error) => {
  console.error(error);
  console.error("");
  console.error("Make sure the Nuxt dev server is running, then retry. Example:");
  console.error("  npm run dev");
  console.error("  npm run audit:runtime");
  process.exitCode = 1;
});
