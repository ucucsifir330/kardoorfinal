import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [tokens, main, entrance, showroom, catalog, references, team, footer, manifesto, darkTheme] = await Promise.all([
  read("../app/assets/styles/base/tokens.css"),
  read("../app/assets/styles/main.css"),
  read("../app/assets/styles/sections/entrance-lab.css"),
  read("../app/assets/styles/sections/showroom.css"),
  read("../app/assets/styles/sections/home-catalog.css"),
  read("../app/assets/styles/sections/home-references.css"),
  read("../app/assets/styles/sections/home-team.css"),
  read("../app/assets/styles/sections/home-footer.css"),
  read("../app/components/home/HomeManifesto.vue"),
  read("../public/themes/dark.css")
]);

const expectedDarkPalette = {
  "--bg-deepest": "#071018",
  "--bg-main": "#0B1822",
  "--bg-navy": "#10293F",
  "--card-bg": "#19354D",
  "--surface-hover": "#21425E",
  "--text-main": "#EEF3F6",
  "--text-soft": "#B9C8D4",
  "--text-muted": "#9CACBA",
  "--text-faint": "#8093A3"
};

for (const [token, value] of Object.entries(expectedDarkPalette)) {
  assert.match(tokens, new RegExp(`${token}\\s*:\\s*${value}`, "i"), `${token} must resolve to ${value}`);
}

const darkBlock = tokens.slice(tokens.indexOf(".app-shell--night"), tokens.indexOf("/* --- MODAL TEMA"));
for (const [token, value] of Object.entries({
  "--bg": "var(--bg-main)",
  "--panel": "var(--bg-navy)",
  "--catalog-stage-bg": "var(--bg-navy)",
  "--catalog-stage-surface-bg": "var(--bg-navy)",
  "--catalog-stage-main-bg": "var(--bg-navy)",
  "--footer-surface": "var(--bg-main)",
  "--footer-dome": "var(--bg-navy)",
  "--surface-raised": "var(--card-bg)"
})) {
  assert.match(darkBlock, new RegExp(`${token}\\s*:\\s*${value.replace(/[()]/g, "\\$&")}`, "i"), `${token} must use ${value}`);
}

assert.match(
  main,
  /\.app-shell--night \.catalog-section,[\s\S]*?--catalog-stage-bg:\s*var\(--bg-navy\);[\s\S]*?--catalog-stage-surface-bg:\s*var\(--bg-navy\);[\s\S]*?--catalog-stage-main-bg:\s*var\(--bg-navy\);[\s\S]*?background-color:\s*var\(--bg-navy\)\s*!important;/,
  "dark catalog backdrop must match the references/video surface"
);

assert.match(
  references,
  /\.home-catalog-reference-stack__references\s*\{[\s\S]*?background:\s*var\(--catalog-stage-surface-bg\);[\s\S]*?\}/,
  "the rounded references panel backdrop must inherit the catalog surface"
);
assert.match(
  references,
  /\.app-shell--night \.home-catalog-reference-stack__references::after\s*\{[\s\S]*?height:\s*var\(--catalog-curtain-extra\);[\s\S]*?background:\s*var\(--bg-main\);[\s\S]*?\}/,
  "the night curtain must paint its transformed handoff gap with the narrative surface"
);

assert.match(
  main,
  /\.app-shell--night \.ada-team-section\s*\{[\s\S]*?--team-section-bg:\s*var\(--catalog-stage-surface-bg\);[\s\S]*?background-color:\s*var\(--catalog-stage-surface-bg\)\s*!important;/,
  "the section exposed by the rounded corners must match the catalog surface"
);

assert.match(manifesto, /<div class="home-manifesto-stage">[\s\S]*?<div class="ada-manifesto-container">/);
assert.match(
  team,
  /\.app-shell--night \.home-manifesto-stage\s*\{[\s\S]*?background:\s*var\(--bg-main\);[\s\S]*?\}/,
  "the manifesto stage must step above the video surface toward the footer"
);
assert.match(
  team,
  /\.app-shell--night :is\(\.ada-subtitle-container, \.ada-subtitle-container-reverse\)\s*\{[\s\S]*?background:\s*var\(--bg-main\);[\s\S]*?\}/,
  "the moving night logo strips must paint the opaque narrative surface at their compositing edges"
);
assert.match(
  team,
  /\.app-shell--night \.ada-team-section:has\(> \.home-manifesto-stage\)\s*\{[\s\S]*?box-shadow:\s*none;[\s\S]*?\}/,
  "the deep manifesto stage must not retain the outer navy seam seal"
);
assert.match(
  main,
  /\.app-shell--night \.testimonial-wrapper\s*\{[\s\S]*?--catalog-stage-surface-bg:\s*var\(--bg-main\);[\s\S]*?\}/,
  "reviews must continue the manifesto surface until the footer"
);
assert.match(
  footer,
  /\.app-shell--night \.footer-wrapper\s*\{[\s\S]*?--footer-surface:\s*var\(--bg-main\);[\s\S]*?\}/,
  "the night footer dome backdrop must continue the reviews surface"
);

for (const [source, rules] of [
  [main, ["background-color: var(--bg-main)", "background-color: var(--bg-deepest)", "background: var(--card-bg)"]],
  [entrance, ["var(--bg-navy)", "var(--bg-main)", "var(--card-bg)", "var(--surface-hover)"]],
  [showroom, ["--sl-bg-1: var(--bg-navy)", "--sl-bg-2: var(--bg-main)", "--sl-text: var(--text-main)"]],
  [catalog, ["background: var(--card-bg)", "background: var(--surface-hover)"]],
  [references, ["--references-bg: var(--bg-deepest)", "--references-accent: var(--accent)"]],
  [darkTheme, ["background-color: var(--bg-main)", "--bg-color: var(--bg-deepest)"]]
]) {
  for (const rule of rules) assert.ok(source.includes(rule), `dark theme must include ${rule}`);
}

const rgb = (hex) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
const luminance = (hex) => rgb(hex)
  .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

assert.ok(contrast("#EEF3F6", "#0B1822") >= 7, "primary dark text must exceed WCAG AAA contrast");
assert.ok(contrast("#B9C8D4", "#0B1822") >= 4.5, "secondary dark text must exceed WCAG AA contrast");
assert.ok(contrast("#95BADA", "#071018") >= 4.5, "dark-theme accent must exceed WCAG AA contrast");

console.log("Dark palette contract passed.");
