# Kardoor File Inventory and Cleanup Map

Last checked: 2026-05-18

This file separates what is active, what is generated, and what looks unused. The homepage cleanup now avoids the old deferred/post-entrance naming and uses clear feature names such as catalog, reviews, and footer.

## Current App Entry Points

| File | Status | Evidence |
| --- | --- | --- |
| `nuxt/nuxt.config.ts` | Active Nuxt config | Loads `~/assets/styles/main.css`, registers auto-imported components, and injects `/themes/light.css`. |
| `nuxt/app.vue` | Active app shell | Renders `SiteHeader` and `NuxtPage`; also applies ambience classes from `useShowroomAmbience`. |
| `nuxt/plugins/lenis.client.ts` | Active plugin | Nuxt loads files in `plugins`; this is the Lenis client plugin. |
| `nuxt/composables/useShowroomAmbience.ts` | Active theme controller | Switches `#kardoor-theme` between `/themes/light.css` and `/themes/dark.css`. |
| `nuxt/composables/useKardoorLocale.ts` | Active locale controller | Used by app/header/footer/pages/components for TR/EN state. |
| `nuxt/composables/useKardoorAsset.ts` | Active asset helper | Used by CDN-aware image components/pages. |
| `nuxt/composables/useDoorSelector.ts` | Active door selector helper | Used by `DoorSelector.vue`. |

## Active Vue Shell

| File | Status | Evidence |
| --- | --- | --- |
| `nuxt/components/layout/SiteHeader.vue` | Active global header | Rendered by `app.vue`. |
| `nuxt/components/ui/BrandMark.vue` | Active header child | Rendered by `SiteHeader.vue`. |

## Active Homepage Flow

The homepage currently renders the entrance and a lazy content loader.

| File | Status | Evidence | Rename direction |
| --- | --- | --- | --- |
| `nuxt/pages/index.vue` | Active homepage route | Renders `EntranceDoor` and `HomeContentLoader`. | Keep route file. |
| `nuxt/components/home/EntranceDoor.vue` | Active entrance section | Directly rendered by `pages/index.vue`. | Keep or rename later only if design language changes. |
| `nuxt/components/home/HomeContentLoader.vue` | Active lazy loader | Directly rendered by `pages/index.vue`; loads `LazyHomeExperience`. | Keep while lazy loading remains. |
| `nuxt/components/home/HomeExperience.vue` | Active homepage body orchestrator | Rendered lazily by `HomeContentLoader.vue`. | Keep as thin composer while sections continue splitting. |
| `nuxt/components/home/HomeCatalog.vue` | Active homepage catalog section | Rendered by `HomeExperience.vue`. | Later move catalog state/logic here. |
| `nuxt/components/home/HomeReferences.vue` | Active empty references slot | Rendered by `HomeExperience.vue`; intentionally empty for upcoming custom design. | User will write Vue/CSS later. |
| `nuxt/components/home/HomeReviews.vue` | Active homepage reviews section | Rendered by `HomeExperience.vue`. | Later move reviews state/logic here. |
| `nuxt/components/home/HomeFooter.vue` | Active homepage footer section | Rendered by `HomeExperience.vue`. | Decide later whether footer remains homepage-only or replaces global footer. |

## Home Experience Split Plan

The first split moved catalog, reviews, and footer markup into feature-named components. State and animation logic are still in `HomeExperience.vue` for a low-risk first pass.

| Current lines | Current section/class | New component target | Related CSS target |
| --- | --- | --- | --- |
| 2 | `.catalog-section` | `HomeCatalog.vue` | `home-catalog.css` plus matching theme rules from `light.css`/`dark.css` |
| 415 | `.testimonial-wrapper` | `HomeReviews.vue` | `home-reviews.css` plus matching theme rules from `light.css`/`dark.css` |
| 529 | `.footer-wrapper` / `.footer-dome` | `HomeFooter.vue` or restored global `SiteFooter.vue` | `home-footer.css` plus matching theme rules from `light.css`/`dark.css` |

Next pass:

1. Move catalog state/logic from `HomeExperience.vue` into `HomeCatalog.vue`.
2. Move reviews state/logic from `HomeExperience.vue` into `HomeReviews.vue`.
3. Move footer animation state/logic from `HomeExperience.vue` into `HomeFooter.vue`.
4. References/team content is intentionally removed for now; a new references section will be designed later.

## Active Route-Specific Components

| File | Status | Evidence |
| --- | --- | --- |
| `nuxt/components/doors/DoorSelector.vue` | Active on `/doors` | Rendered by `nuxt/pages/doors/index.vue`. |

## Active Pages

These files are active because Nuxt maps them directly to routes.

| File | Route | Decision |
| --- | --- | --- |
| `nuxt/pages/index.vue` | `/` | Keep. Homepage entry. |
| `nuxt/pages/catalog.vue` | `/catalog` | Keep. Full catalog page and linked from homepage catalog CTA. |
| `nuxt/pages/company.vue` | `/company` | Keep. Header link and homepage company CTA target. |
| `nuxt/pages/contact.vue` | `/contact` | Keep for now. Header link, but page is very thin and should be rewritten or merged later. |
| `nuxt/pages/export.vue` | `/export` | Active route but thin content page. Cleanup decision: rewrite/merge before deleting because footer/navigation may still need it. |
| `nuxt/pages/production.vue` | `/production` | Active route but thin content page. Cleanup decision: rewrite/merge before deleting. |
| `nuxt/pages/references.vue` | `/references` | Keep. Header link and large references page. Also contains the current pre-existing typecheck errors. |
| `nuxt/pages/request-quote.vue` | `/request-quote` | Keep for now. Quote CTAs link here, but page is thin and should become a real form/contact flow. |
| `nuxt/pages/doors/index.vue` | `/doors` | Keep. Renders `DoorSelector`. |
| `nuxt/pages/doors/[slug].vue` | `/doors/:slug` | Keep. Dynamic product detail route. |
| `nuxt/pages/series/index.vue` | `/series` | Keep. Series listing route, linked from series detail pages. |
| `nuxt/pages/series/[slug].vue` | `/series/:slug` | Keep. Dynamic series detail route. |

## Thin Page Decisions

These are real Nuxt routes, so they are not technically unused. The issue is that they are underbuilt compared with the rest of the site.

| File | Current state | Recommended next action |
| --- | --- | --- |
| `nuxt/pages/contact.vue` | 24 lines, simple content page. | Keep because header links to it; later turn into real contact section/page. |
| `nuxt/pages/export.vue` | 30 lines, simple content page. | Keep or merge into company/catalog after navigation decision. |
| `nuxt/pages/production.vue` | 30 lines, simple content page. | Keep or merge into company after navigation decision. |
| `nuxt/pages/request-quote.vue` | 35 lines, simple quote landing page. | Keep because CTAs link to it; later replace with real form or route to contact. |

## Active CSS Entry Points

| File | Status | Evidence |
| --- | --- | --- |
| `nuxt/assets/styles/main.css` | Active global CSS entry | Loaded by `nuxt.config.ts`. |
| `nuxt/assets/styles/base/reset.css` | Active | Imported by `main.css`. |
| `nuxt/assets/styles/base/tokens.css` | Active | Imported by `main.css`. |
| `nuxt/assets/styles/base/transitions.css` | Active | Imported by `main.css`. |
| `nuxt/assets/styles/components/buttons.css` | Active/shared | Imported by `main.css`. |
| `nuxt/assets/styles/components/site-header.css` | Active | Imported by `main.css`; used by `SiteHeader.vue`. |
| `nuxt/assets/styles/sections/entrance-door.css` | Active | Imported by `main.css`; used by `EntranceDoor.vue`. |
| `nuxt/assets/styles/sections/door-selector.css` | Active route CSS | Imported by `main.css`; used by `DoorSelector.vue`. |
| `nuxt/assets/styles/sections/content-pages.css` | Active page CSS | Imported by `main.css`; used by content pages. |
| `nuxt/assets/styles/pages/catalog.css` | Active page CSS | Imported by `main.css`; used by `catalog.vue`. |
| `nuxt/assets/styles/sections/home-references.css` | Active empty homepage section CSS | Imported by `main.css`; intentionally empty for upcoming custom references design. |
| `nuxt/assets/styles/sections/home-reviews.css` | Active homepage section CSS | Extracted from duplicated theme rules; used by `HomeReviews.vue`. |
| `nuxt/assets/styles/sections/home-footer.css` | Active homepage section CSS | Extracted from duplicated theme rules; used by `HomeFooter.vue`. |
| `nuxt/public/themes/light.css` | Active theme CSS | Injected in `nuxt.config.ts`. |
| `nuxt/public/themes/dark.css` | Active theme CSS | Swapped in by `useShowroomAmbience.ts`. |

## CSS Imported But Matching Vue Is Currently Unused

These CSS files are still bundled because `main.css` imports them, but their matching Vue components are not rendered right now.

| CSS file | Matching component | Current risk |
| --- | --- | --- |
| `nuxt/assets/styles/components/footer.css` | `SiteFooter.vue` | CSS is active in bundle, Vue is unused. Embedded active footer uses `.footer-dome`, not `.kardoor-footer`. |

## Currently Unused Vue Components

No active template/import currently renders these files.

| File | Likely purpose | Decision |
| --- | --- | --- |
| `nuxt/components/layout/SiteFooter.vue` | Newer structured global footer | Keep for now and compare against `HomeFooter.vue`. This file is localized and route-aware; likely replacement source if we choose a global footer strategy. |

## Removed Unused Components

| File | Removed with | Reason |
| --- | --- | --- |
| `nuxt/components/home/ShowroomDive.vue` | `nuxt/assets/styles/sections/showroom-dive.css` | Replaced by the active `HomeCatalog.vue` flow. |
| `nuxt/components/home/UserReview.vue` | `nuxt/assets/styles/sections/user-review.css` | Replaced by the active `HomeReviews.vue` flow. |
| `nuxt/components/home/HomeTeamSection.vue` | `nuxt/assets/styles/sections/home-team.css` | Old team/reference section removed intentionally; a new references section will be designed later. |

## Current Unused Component Decisions

Recommended decisions before more splitting:

1. Team/reference section is intentionally removed from the current homepage flow.
2. `SiteFooter.vue` should not be deleted yet; decide whether to replace `HomeFooter.vue` with this localized global footer, or keep the animated homepage-only footer.

## Public Assets and Themes

| Path | Status | Notes |
| --- | --- | --- |
| `nuxt/public/themes/light.css` | Active theme | Injected by `nuxt.config.ts` and used as the default theme stylesheet. Do not delete. Split later. |
| `nuxt/public/themes/dark.css` | Active theme | Runtime-swapped by `useShowroomAmbience.ts`. Do not delete. Split later. |
| `nuxt/public/images/doorrrender/*.png` | Likely local render cache/fallback | Large 120-frame render set. Keep until entrance render CDN parity and fallback strategy are confirmed. |
| `nuxt/public/images/homelight.png` | Local copy candidate | Current `EntranceDoor.vue` uses ImageKit `homelight.png`, not this local file. Keep only if we want local fallback. |
| `nuxt/public/images/homenight.png` | Local copy candidate | Current `EntranceDoor.vue` uses ImageKit `homenight.png`, not this local file. Keep only if we want local fallback. |
| `nuxt/public/images/homenight.jpeg` | Cleanup candidate | No current code reference found. Likely older duplicate. |
| `nuxt/public/images/doors/atelier-*.png` | Cleanup candidate or backup | Current `products.ts` and `collections.ts` use ImageKit URLs directly; no current local references found. |
| `nuxt/public/images/doors/door-*.svg`, `1.svg`, `indir (4).svg` | Cleanup candidate | No current code reference found. Looks like older placeholder door art. |
| `nuxt/public/models/kardoor.glb` | Cleanup candidate | No current code reference found. Likely older 3D asset. |

## Theme Split Decision

`public/themes/light.css` and `public/themes/dark.css` are active, but they are too broad. They should not stay as two giant files long-term.

| Area | Current location | Better target |
| --- | --- | --- |
| Entrance ambience variables | `public/themes/light.css`, `public/themes/dark.css` | Keep in compact theme files. |
| Reviews base styling | `assets/styles/sections/home-reviews.css` | Done. Responsive/theme override leftovers still need a later pass. |
| Homepage footer base styling | `assets/styles/sections/home-footer.css` | Done. Responsive/theme override leftovers still need a later pass. |
| Catalog section styling | `public/themes/light.css`, `public/themes/dark.css` | Move next after comparing light/dark differences. |
| Pure component layout rules | Theme files and `assets/styles/sections/*` mixed together | Move to `assets/styles/sections/*`; leave only color/token overrides in themes. |

## Generated or Local Working Files

These are not app source files and should normally be ignored or cleaned separately.

| Path | Status |
| --- | --- |
| `node_modules/` | Dependency install output. |
| `nuxt/node_modules/` | Dependency install output. |
| `nuxt/.nuxt/` | Nuxt generated dev output. |
| `nuxt/.output/` | Nuxt generated build output. |
| `nuxt/.playwright-cli/` | Playwright/browser tooling output. |
| `nuxt/127.0.0.1/` | Generated by an incorrect dev-server command; contains only `.nuxt` and cache output. Safe cleanup candidate. |
| `nuxt/output/` | Generated output or local artifact; verify before deleting. |
| `chrome-*.png` | Browser verification screenshots. |
| `codex-*.log`, `nuxt-dev-*.log` | Dev server logs. |

## Cleanup Order

1. Clean or ignore generated artifacts: root `chrome-*.png`, root `*.log`, `nuxt/.playwright-cli/`, `nuxt/output/`, and `nuxt/127.0.0.1/`.
2. Decide public asset cleanup: `homenight.jpeg`, old door SVGs, `kardoor.glb`, and possibly local `atelier-*.png` copies.
3. Decide thin page strategy for `/contact`, `/export`, `/production`, and `/request-quote`.
4. Compare `SiteFooter.vue` against `HomeFooter.vue`; choose one footer strategy.
5. Move remaining section-specific state/logic out of `HomeExperience.vue`.
6. Move matching CSS out of huge/global theme files only after each component split is stable.
