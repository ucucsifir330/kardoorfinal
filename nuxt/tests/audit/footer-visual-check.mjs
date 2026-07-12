import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import sharp from "sharp";

const root = process.cwd();
const baseUrl = process.env.VISUAL_BASE_URL || "http://localhost:3000";
const outRoot = path.join(root, "output", "playwright", "footer-visual");
const scenarios = [
  { viewport: "desktop", width: 1440, height: 1000 },
  { viewport: "mobile", width: 390, height: 844 }
];
const themes = ["light", "dark"];
const positions = ["top", "bottom"];
const styleProperties = [
  "display",
  "position",
  "width",
  "height",
  "min-height",
  "padding",
  "margin",
  "margin-top",
  "bottom",
  "right",
  "transform",
  "grid-template-columns",
  "grid-auto-rows",
  "gap",
  "align-items",
  "justify-content",
  "background-color",
  "color",
  "border-radius",
  "box-shadow"
];
const stateSelectors = [
  ".footer-wrapper",
  ".footer-dome",
  ".footer-main",
  ".footer-brand",
  ".footer-logo",
  ".footer-socials",
  ".footer-socials > .social-btn",
  ".footer-socials > .mail-btn",
  ".footer-socials > .phone-btn",
  ".footer-info"
];

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
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
        setTimeout(resolve, 650);
      });
    }
  }, theme);
}

async function stabilize(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `
  });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForSelector(".footer-wrapper", { timeout: 30000 });
  await page.waitForTimeout(300);
}

async function scrollFooter(page, position) {
  await page.evaluate((nextPosition) => {
    const footer = document.querySelector(".footer-wrapper");
    if (!footer) return;
    const rect = footer.getBoundingClientRect();
    const currentY = window.scrollY || document.documentElement.scrollTop || 0;
    const footerTop = currentY + rect.top;
    const footerBottom = currentY + rect.bottom;
    const target = nextPosition === "bottom"
      ? Math.max(0, footerBottom - window.innerHeight)
      : Math.max(0, footerTop);

    window.scrollTo(0, target);
  }, position);
  await page.waitForTimeout(500);
}

async function collectFooterState(page) {
  return page.evaluate(({ selectors, properties }) => {
    return selectors.flatMap((selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map((element, index) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const computed = {};

        for (const property of properties) {
          computed[property] = style.getPropertyValue(property);
        }

        return {
          selector,
          index,
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          rect: {
            x: Number(rect.x.toFixed(2)),
            y: Number(rect.y.toFixed(2)),
            width: Number(rect.width.toFixed(2)),
            height: Number(rect.height.toFixed(2))
          },
          computed
        };
      });
    });
  }, { selectors: stateSelectors, properties: styleProperties });
}

async function capture(label) {
  const dir = path.join(outRoot, label);
  await ensureDir(dir);

  const browser = await chromium.launch();
  const manifest = [];

  for (const scenario of scenarios) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: scenario.width, height: scenario.height },
        reducedMotion: "reduce"
      });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      await setTheme(page, theme);
      await stabilize(page);

      for (const position of positions) {
        await scrollFooter(page, position);
        const name = `${scenario.viewport}-${theme}-${position}.png`;
        const file = path.join(dir, name);
        const state = await collectFooterState(page);
        await page.screenshot({ path: file, fullPage: false });
        manifest.push({
          file: path.relative(root, file).replaceAll(path.sep, "/"),
          viewport: scenario.viewport,
          theme,
          position,
          width: scenario.width,
          height: scenario.height,
          state
        });
      }

      await context.close();
    }
  }

  await browser.close();
  await fs.writeFile(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[footer-visual] captured ${manifest.length} screenshots in ${path.relative(root, dir)}`);
}

async function readRawPng(file) {
  const image = sharp(file).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return { data, info };
}

function diffPixels(before, after, threshold = 4) {
  const length = Math.min(before.data.length, after.data.length);
  const diff = Buffer.alloc(length);
  let changedPixels = 0;
  let totalDelta = 0;

  for (let index = 0; index < length; index += 4) {
    const dr = Math.abs(before.data[index] - after.data[index]);
    const dg = Math.abs(before.data[index + 1] - after.data[index + 1]);
    const db = Math.abs(before.data[index + 2] - after.data[index + 2]);
    const da = Math.abs(before.data[index + 3] - after.data[index + 3]);
    const changed = dr > threshold || dg > threshold || db > threshold || da > threshold;

    if (changed) {
      changedPixels++;
      totalDelta += dr + dg + db + da;
      diff[index] = 255;
      diff[index + 1] = 48;
      diff[index + 2] = 48;
      diff[index + 3] = 255;
    } else {
      diff[index] = after.data[index];
      diff[index + 1] = after.data[index + 1];
      diff[index + 2] = after.data[index + 2];
      diff[index + 3] = 80;
    }
  }

  const pixels = length / 4;
  return {
    changedPixels,
    totalPixels: pixels,
    changedRatio: pixels > 0 ? Number((changedPixels / pixels).toFixed(6)) : 0,
    totalDelta,
    diff
  };
}

function compareState(beforeState = [], afterState = []) {
  const afterByKey = new Map(
    afterState.map((entry) => [`${entry.selector}::${entry.index}`, entry])
  );
  let changes = 0;

  for (const beforeEntry of beforeState) {
    const key = `${beforeEntry.selector}::${beforeEntry.index}`;
    const afterEntry = afterByKey.get(key);
    if (!afterEntry) {
      changes++;
      continue;
    }

    const beforeBox = {
      x: beforeEntry.rect.x,
      width: beforeEntry.rect.width,
      height: beforeEntry.rect.height
    };
    const afterBox = {
      x: afterEntry.rect.x,
      width: afterEntry.rect.width,
      height: afterEntry.rect.height
    };

    if (JSON.stringify(beforeBox) !== JSON.stringify(afterBox)) {
      changes++;
      continue;
    }

    if (JSON.stringify(beforeEntry.computed) !== JSON.stringify(afterEntry.computed)) {
      changes++;
    }
  }

  changes += Math.max(0, afterState.length - beforeState.length);
  return changes;
}

async function compare(beforeLabel, afterLabel) {
  const beforeDir = path.join(outRoot, beforeLabel);
  const afterDir = path.join(outRoot, afterLabel);
  const diffDir = path.join(outRoot, `${beforeLabel}-vs-${afterLabel}`);
  await ensureDir(diffDir);

  const beforeManifest = JSON.parse(await fs.readFile(path.join(beforeDir, "manifest.json"), "utf8"));
  const afterManifest = JSON.parse(await fs.readFile(path.join(afterDir, "manifest.json"), "utf8"));
  const afterManifestByFile = new Map(
    afterManifest.map((entry) => [path.basename(entry.file), entry])
  );
  const summary = [];

  for (const entry of beforeManifest) {
    const name = path.basename(entry.file);
    const beforeFile = path.join(beforeDir, name);
    const afterFile = path.join(afterDir, name);
    const before = await readRawPng(beforeFile);
    const after = await readRawPng(afterFile);

    if (before.info.width !== after.info.width || before.info.height !== after.info.height) {
      summary.push({ ...entry, status: "size-mismatch" });
      continue;
    }

    const result = diffPixels(before, after);
    const diffFile = path.join(diffDir, name.replace(/\.png$/, ".diff.png"));
    await sharp(result.diff, {
      raw: {
        width: before.info.width,
        height: before.info.height,
        channels: 4
      }
    }).png().toFile(diffFile);

    summary.push({
      ...entry,
      status: result.changedPixels === 0 ? "identical" : "changed",
      changedPixels: result.changedPixels,
      totalPixels: result.totalPixels,
      changedRatio: result.changedRatio,
      totalDelta: result.totalDelta,
      stateChanges: compareState(entry.state, afterManifestByFile.get(name)?.state),
      diff: path.relative(root, diffFile).replaceAll(path.sep, "/")
    });
  }

  await fs.writeFile(path.join(diffDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.table(summary.map((entry) => ({
    file: path.basename(entry.file),
    status: entry.status,
    changedRatio: entry.changedRatio ?? null,
    changedPixels: entry.changedPixels ?? null,
    stateChanges: entry.stateChanges ?? null
  })));
  console.log(`[footer-visual] wrote ${path.relative(root, diffDir)}`);
}

const command = process.argv[2];

if (command === "capture") {
  const label = argValue("label");
  if (!label) throw new Error("Missing --label");
  await capture(label);
} else if (command === "compare") {
  const before = argValue("before", "before");
  const after = argValue("after", "after");
  await compare(before, after);
} else {
  console.log("Usage:");
  console.log("  node scripts/audit/footer-visual-check.mjs capture --label before");
  console.log("  node scripts/audit/footer-visual-check.mjs compare --before before --after after");
}
