import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tokens = await readFile(
  new URL("../app/assets/styles/base/tokens.css", import.meta.url),
  "utf8"
);

const expectedLightPalette = {
  "--paper": "#EDEAE0",
  "--surface": "#FAF8F2",
  "--surface-2": "#F4F1E8",
  "--hairline": "#DDD8C9",
  "--ink": "#14120D",
  "--ink-body": "#3B362D",
  "--ink-secondary": "#5E574B",
  "--ink-soft": "#6E6659",
  "--brand-signature": "#10293F",
  "--brand-action": "#0C63B4",
  "--brand-action-on": "#F0F5F9",
  "--brand-300": "#95BADA",
  "--brand-900": "#091825",
  "--slab": "#10293F",
  "--slab-fg": "#EEF3F6",
  "--slab-soft": "#99AFC2",
  "--slab-line": "#223F59",
  "--slab-accent": "#90BADF"
};

for (const [token, value] of Object.entries(expectedLightPalette)) {
  assert.match(
    tokens,
    new RegExp(`${token.replace("--", "--")}\\s*:\\s*${value}`, "i"),
    `${token} must resolve to ${value}`
  );
}

assert.match(tokens, /\.app-shell--day\s*\{[\s\S]*?--signature-fg:\s*var\(--brand-signature\)/);
assert.match(tokens, /\.app-shell--day\s*\{[\s\S]*?--action-fill:\s*var\(--brand-action\)/);
assert.match(tokens, /\.app-shell--day\s*\{[\s\S]*?--accent:\s*var\(--brand-signature\)/);
assert.match(tokens, /\.app-shell--day\s*\{[\s\S]*?--focus-ring:\s*var\(--brand-action\)/);
assert.match(tokens, /:root\s*\{[\s\S]*?--accent:\s*var\(--brand-300\)/);
assert.match(tokens, /:root\s*\{[\s\S]*?--accent-soft:\s*var\(--brand-100\)/);

const lightPaletteSource = tokens.slice(0, tokens.indexOf(".app-shell--night"));

for (const removed of ["#1A1533", "#22318C", "#9990B8", "#2E2750", "#EA4335"]) {
  assert.equal(
    lightPaletteSource.toUpperCase().includes(removed),
    false,
    `${removed} must not remain in the light palette`
  );
}

console.log("Light palette contract passed.");
