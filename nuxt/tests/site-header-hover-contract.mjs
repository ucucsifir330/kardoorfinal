import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [siteHeader, siteHeaderStyles] = await Promise.all([
  readFile(new URL("../app/components/layout/SiteHeader.vue", import.meta.url), "utf8"),
  readFile(new URL("../app/assets/styles/components/site-header.css", import.meta.url), "utf8")
]);

assert.match(siteHeader, /const isHoveringNav = ref\(false\)/);
assert.match(
  siteHeader,
  /"site-header--hidden":\s*isHidden\.value\s*&&\s*!isHoveringNav\.value/
);
assert.match(siteHeader, /class="site-nav"[\s\S]*?@mouseenter="isHoveringNav = true"/);
assert.match(siteHeader, /class="site-nav"[\s\S]*?@mouseleave="isHoveringNav = false"/);
assert.match(siteHeader, /class="site-nav__hover-reveal"/);
assert.match(
  siteHeaderStyles,
  /\.site-nav__hover-reveal\s*\{[\s\S]*?height:\s*var\(--header-offset-y\);[\s\S]*?pointer-events:\s*auto;/
);

console.log("Site header hover contract passed.");
