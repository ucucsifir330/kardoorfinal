import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const root = process.cwd();
const outDir = path.join(root, "reports", "audit");
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const routes = (process.env.SMOKE_ROUTES || "/,/catalog,/company,/references,/contact")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const themes = (process.env.SMOKE_THEMES || "light,dark")
  .split(",")
  .map((theme) => theme.trim())
  .filter(Boolean);
const viewport = {
  width: Number(process.env.SMOKE_WIDTH || 1366),
  height: Number(process.env.SMOKE_HEIGHT || 900)
};

const routeChecks = {
  "/": [".home-page"],
  "/catalog": [".catalog-lib"],
  "/company": [".company-timeline"],
  "/references": [".viewport-wrapper", ".ref-stack"],
  "/contact": [".contact-page"]
};
const ambienceStorageKey = "kardoor-showroom-ambience";

function routeUrl(route) {
  return new URL(route, baseUrl).toString();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function themeToMode(theme) {
  return theme === "dark" ? "night" : "day";
}

async function collectPageFacts(page, route) {
  return page.evaluate((expectedSelectors) => {
    const text = document.body?.innerText || "";
    const htmlTheme = document.documentElement.dataset.theme || "";
    const matchedSelectors = expectedSelectors.filter((selector) => document.querySelector(selector));
    const title = document.title || "";
    const appMounted = Boolean(document.querySelector("#__nuxt .app-shell"));
    const nuxtWelcome =
      text.includes("Welcome to Nuxt") ||
      Boolean(document.querySelector(".nuxt-welcome, #nuxt-devtools-anchor"));

    return {
      title,
      htmlTheme,
      appMounted,
      textLength: text.trim().length,
      matchedSelectors,
      nuxtWelcome
    };
  }, routeChecks[route] || []);
}

async function checkScenario(browser, route, theme) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce"
  });
  await context.addInitScript(
    ({ storageKey, mode }) => {
      window.localStorage.setItem(storageKey, mode);
    },
    { storageKey: ambienceStorageKey, mode: themeToMode(theme) }
  );
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error?.message || error));
  });

  const result = {
    route,
    theme,
    url: routeUrl(route),
    ok: false,
    status: null,
    facts: null,
    consoleErrors,
    pageErrors,
    failures: []
  };

  try {
    const response = await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    result.status = response?.status() ?? null;
    await page.waitForFunction(
      (expectedTheme) => document.documentElement.dataset.theme === expectedTheme,
      theme,
      { timeout: 5000 }
    ).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(250);

    result.facts = await collectPageFacts(page, route);

    if (!result.status || result.status >= 400) {
      result.failures.push(`HTTP status ${result.status || "unknown"}`);
    }
    if (!result.facts.appMounted) {
      result.failures.push("Nuxt app shell was not mounted");
    }
    if (result.facts.nuxtWelcome) {
      result.failures.push("Page looks like the Nuxt welcome screen");
    }
    if (result.facts.textLength < 80) {
      result.failures.push(`Page text is too small (${result.facts.textLength} chars)`);
    }
    if ((routeChecks[route] || []).length > 0 && result.facts.matchedSelectors.length === 0) {
      result.failures.push(`Expected route marker missing: ${(routeChecks[route] || []).join(", ")}`);
    }
    if (result.facts.htmlTheme !== theme) {
      result.failures.push(`Theme did not settle to ${theme}; got ${result.facts.htmlTheme || "empty"}`);
    }
    if (pageErrors.length > 0) {
      result.failures.push(`${pageErrors.length} page error(s)`);
    }

    result.ok = result.failures.length === 0;
  } catch (error) {
    result.failures.push(String(error?.message || error));
  } finally {
    await context.close();
  }

  return result;
}

function markdownFor(results) {
  const failed = results.filter((result) => !result.ok);
  const lines = [
    "# Kardoor Route Smoke",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    `Viewport: ${viewport.width}x${viewport.height}`,
    "",
    `Result: ${failed.length === 0 ? "PASS" : "FAIL"}`,
    "",
    "## Routes",
    "",
    "| Route | Theme | Status | Markers | Text | Result |",
    "| --- | --- | ---: | --- | ---: | --- |"
  ];

  for (const result of results) {
    lines.push(
      `| \`${result.route}\` | \`${result.theme}\` | ${result.status || ""} | ${result.facts?.matchedSelectors?.join(", ") || "-"} | ${result.facts?.textLength ?? ""} | ${result.ok ? "PASS" : `FAIL: ${result.failures.join("; ")}`} |`
    );
  }

  if (failed.length > 0) {
    lines.push("", "## Failures", "");
    for (const result of failed) {
      lines.push(`- ${result.route} ${result.theme}: ${result.failures.join("; ")}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  await ensureDir(outDir);

  const browser = await chromium.launch();
  const results = [];

  try {
    for (const route of routes) {
      for (const theme of themes) {
        results.push(await checkScenario(browser, route, theme));
      }
    }
  } finally {
    await browser.close();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    viewport,
    routes,
    themes,
    passed: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results
  };

  await fs.writeFile(path.join(outDir, "route-smoke.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "ROUTE_SMOKE.md"), markdownFor(results));

  console.log(`Route smoke: ${summary.passed} passed, ${summary.failed} failed`);
  console.log("Wrote reports/audit/route-smoke.json");
  console.log("Wrote reports/audit/ROUTE_SMOKE.md");

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
