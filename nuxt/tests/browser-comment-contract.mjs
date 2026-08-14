import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [
  contact,
  company,
  referencesPage,
  collections,
  showroom,
  homeCatalog,
  catalogStructuralLine,
  homeCatalogData,
  homeReferences,
  homeTeam,
  entranceLab,
  homeReviews,
  homeFooter
] = await Promise.all([
  read("../app/assets/styles/pages/contact.css"),
  read("../app/assets/styles/pages/company.css"),
  read("../app/pages/references.vue"),
  read("../app/components/catalog/CollectionsIndex.vue"),
  read("../app/assets/styles/sections/showroom.css"),
  read("../app/components/home/HomeCatalog.vue"),
  read("../app/composables/useCatalogStructuralLine.ts"),
  read("../app/composables/useHomeCatalog.ts"),
  read("../app/assets/styles/sections/home-references.css"),
  read("../app/assets/styles/sections/home-team.css"),
  read("../app/assets/styles/sections/entrance-lab.css"),
  read("../app/components/home/HomeReviews.vue"),
  read("../app/assets/styles/sections/home-footer.css")
]);

assert.match(contact, /\.app-shell--day:has\(\.contact-page\)[\s\S]*?--footer-surface:\s*var\(--surface-2\)/);
assert.match(company, /--company-right-offset:\s*clamp\(2\.5rem,\s*4vw,\s*5rem\)/);
assert.match(referencesPage, /background:\s*var\(--ref-modal-bg,\s*var\(--surface\)\)/);
assert.match(referencesPage, /\.display-info h3[\s\S]*?color:\s*var\(--ref-modal-ink,\s*var\(--ink\)\)/);
assert.match(referencesPage, /\.panel-location[\s\S]*?color:\s*var\(--ref-modal-sub,\s*var\(--ink-secondary\)\)/);
assert.match(referencesPage, /\.nav-btn\s*\{[\s\S]*?color:\s*var\(--ref-modal-ink,\s*var\(--ink\)\)[\s\S]*?opacity:\s*1/);
assert.match(referencesPage, /\.nav-btn:hover\s*\{[\s\S]*?color:\s*var\(--ref-accent,\s*var\(--brand-action\)\)/);
assert.match(referencesPage, /<Teleport to="\.cards-section">/);
assert.match(referencesPage, /\.project-expansion-panel\s*\{[^}]*position:\s*absolute;[^}]*top:\s*0/);
assert.match(referencesPage, /\.project-expansion-panel::before,[\s\S]*?\.project-expansion-panel::after[\s\S]*?width:\s*28px[\s\S]*?height:\s*28px/);
assert.match(referencesPage, /\.project-expansion-panel::before[\s\S]*?circle at bottom left[\s\S]*?\.project-expansion-panel::after[\s\S]*?circle at bottom right/);
assert.match(referencesPage, /height:\s*"860px"/);
assert.match(referencesPage, /\.panel-inner\s*\{[^}]*height:\s*860px/);
assert.match(referencesPage, /\.image-viewport\s*\{[^}]*height:\s*660px/);

assert.match(collections, /const collectionFamilies = \[/);
assert.equal((collections.match(/familySlug:/g) ?? []).length, 5);
assert.match(collections, /font-family:\s*"PP Mori"/);
assert.match(collections, /--collections-display-font:\s*"PP Telegraf"/);

assert.match(showroom, /height:\s*clamp\(330px,\s*35vw,\s*560px\)/);
assert.match(showroom, /\.showroom-lab__actions\s*\{[\s\S]*?margin-top:\s*auto/);
assert.match(showroom, /\.showroom-lab__counter-current\s*\{[\s\S]*?color:\s*var\(--accent\)/);

assert.match(homeCatalog, /catalog-structural-line-node__dot" cy="-8" r="4\.5"/);
assert.match(catalogStructuralLine, /nodeY:\s*y \+ nodeCircleY/);
assert.match(catalogStructuralLine, /startY = measuredNodes\[0\]\?\.nodeY/);
assert.match(catalogStructuralLine, /endY = Math\.max\(startY, finalNode\?\.nodeY \?\? height\)/);
assert.match(catalogStructuralLine, /clampProgress\(\(nodeY - pathStartY\) \/ pathLength\)/);
assert.match(
  catalogStructuralLine,
  /start:\s*\(\)\s*=>\s*`top\+=\$\{pathStartY\}px \$\{NODE_VIEWPORT_PROGRESS \* 100\}%`/
);
assert.match(
  catalogStructuralLine,
  /end:\s*\(\)\s*=>\s*`top\+=\$\{timelineEndY\}px \$\{NODE_VIEWPORT_PROGRESS \* 100\}%`/
);
assert.match(homeCatalog, /\.catalog-designer\)[\s\S]*?color:\s*var\(--ink\)/);
assert.doesNotMatch(homeCatalog, /\.catalog-designer\)[\s\S]*?mix-blend-mode:\s*difference/);
assert.match(homeCatalog, /\.catalog-source-filter__option\.is-active \.catalog-source-filter__label[\s\S]*?color:\s*var\(--brand-action-on\)/);
assert.match(homeCatalogData, /const combinedPreviewLimit = visibleSources\.length > 1 \? 10 : catalogPreviewLimit/);

assert.match(homeReferences, /specimen--marble\s*\{[\s\S]*?width:\s*clamp\(320px,\s*33vw,\s*640px\)/);
assert.match(homeReferences, /specimen--torus\s*\{[\s\S]*?width:\s*clamp\(360px,\s*34vw,\s*680px\)[\s\S]*?right:\s*0/);
assert.match(homeReferences, /@media \(min-width:\s*761px\)[\s\S]*?specimen--torus \.home-references-flip__specimen-image[\s\S]*?transform:\s*translateX\(40%\)/);
assert.match(homeReferences, /home-references-flip__intro p[\s\S]*?color:\s*var\(--references-ink\)/);
assert.match(homeReferences, /home-references-flip__play-icon[\s\S]*?background:\s*var\(--brand-100\)/);
assert.match(homeReferences, /home-references-flip__intro h2[\s\S]*?font-family:\s*var\(--references-title-font\)/);
assert.match(homeReferences, /home-references-flip__play-text[\s\S]*?font-family:\s*var\(--references-title-font\)/);
assert.match(homeReferences, /home-references-flip__play-text[\s\S]*?text-transform:\s*none/);

assert.match(homeTeam, /\.ada-title-container[\s\S]*?margin-top:\s*clamp\(300px,\s*22vw,\s*420px\)/);
assert.match(homeTeam, /\.ada-subtitle-container\s*\{[\s\S]*?margin-bottom:\s*clamp\(20px,\s*2vw,\s*40px\)/);
assert.match(homeTeam, /\.ada-subtitle-container-reverse\s*\{[\s\S]*?margin-top:\s*clamp\(20px,\s*2vw,\s*40px\)/);

assert.match(entranceLab, /\.app-shell--day \.entrance-lab__configure-actions \.ada-manifesto-cta:hover\s*\{[\s\S]*?--ada-cta-text-color:\s*var\(--slab-fg\)[\s\S]*?background:\s*var\(--slab\)[\s\S]*?color:\s*var\(--slab-fg\)/);

assert.match(homeReviews, /title-area[^"]*pt-\[clamp\(80px,7vw,128px\)\][^"]*pb-\[clamp\(150px,15vw,240px\)\]/);
assert.match(homeReviews, /rotating-text-word inline-flex overflow-hidden pt-\[0\.06em\]/);
assert.match(homeFooter, /\.footer-bottom\s*\{[\s\S]*?padding:\s*10px 56px/);

console.log("Browser comment contract passed.");
