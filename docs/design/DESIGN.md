# Ege Kardoor DESIGN.md

> Premium architectural steel door systems. Cinematic, industrial, tactile, controlled.
> Not SaaS. Not a generic AI landing page. Not decoration-first.

The design contract for anyone working in this repository. Read it before UI,
CSS, Vue, animation, or theme work.

Rewritten 2026-08-14. The previous version contradicted itself on Tailwind in
three places, described Lenis and `HomeContentLoader` as live when both are
gone, and pointed at paths missing the `app/` segment. Every path below was
verified on that date. **If a rule points at a file that has moved, fix the rule
in the same change — a stale contract protects nothing.**

---

## 1. Brand feeling

Kardoor should feel like: architectural precision · heavy material quality ·
cinematic entrance and reveal · industrial luxury · calm confidence ·
manufactured craft · premium showroom.

Never: generic SaaS gradients · random glassmorphism · decorative glow without
purpose · over-rounded marketing cards · dashboard aesthetics · stock AI visual
language · playful motion where the subject needs weight · redesigning a section
because it could be "nicer".

## 2. Visual principles

- Door imagery and material presence carry the experience.
- Typography is deliberate, architectural, editorial.
- Fewer elements, stronger hierarchy.
- Negative space is part of the premium feeling.
- One clear visual idea per section.
- UI chrome supports the product; it never competes with it.
- Catalog surfaces read as architectural presentation, not a cheap product grid.
- Decorative effects are rare and tied to an existing system purpose.

### Composition recipes

Approved starting points, not templates to copy.

**Cinematic Split** — hero, entrance, showroom. One dominant image or render
carries the emotional weight; copy stays compact and anchored to one alignment
line. Avoid equal halves. Motion reads as camera movement, door mechanics, or
material reveal.

**Editorial Broadsheet** — manifesto, company story, reference narrative. Large
type behaves like an image. Strict hierarchy, narrow body text, generous space.
Translate the discipline, never newspaper aesthetics literally.

**Material Showcase** — finishes, construction detail, closeups. Surface,
texture, shadow, and physical scale are the story. Fewer cards, larger
inspection moments. Real imagery over illustration. No glow that hides material.

**Technical Archive** — specifications, dimensions, certifications, export data.
Dense information organized with calm hierarchy. Tables, rows, metadata labels,
restrained dividers before decorative cards. No fake dashboards, no meaningless
metrics.

**Catalog Architecture** — families, series, browsing. An architectural archive
or showroom wall, not a store grid. Hierarchy: family → model → finish →
technical code → action. Repeated items may be card-like but stay restrained.

### AI slop signatures — prohibited

Unless an existing component already depends on one and the task is to maintain
that component: generic SaaS gradients · floating blurred blobs · random
glassmorphism · fake dashboard panels · meaningless icon grids · generic 3-card
marketing blocks · over-rounded pill CTAs · decorative glow without system
purpose · stock abstract backgrounds that reveal no door, material, production
or real product state · symmetric feature blocks that could belong to any
startup.

## 3. Color language

Token layer:

- `nuxt/app/assets/styles/base/tokens.css` — primary token source
- `nuxt/public/themes/light.css`, `nuxt/public/themes/dark.css` — active runtime
  override layers, not a clean system yet
- `nuxt/app/assets/styles/sections/`, `nuxt/app/assets/styles/pages/`

Current token families:

- Night foundations: `#050714`, `#080B18`, `#131937`, `#171D3D`, `#1D244A`
- Day mineral surfaces: `#EBE6DB`, `#FDFCFA`, `#F1F0EC`
- Day ink: `#16130F`, `#3A352D`, `#8A8073`
- Brand blue scale: `#EEF0FF`, `#8B9BFA`, `#2B4BF2`, `#22318C`, `#0E1338`
- Warm metal remains a restrained legacy accent through `--warm: #a77a55`
- Soft text, lines, overlays, and elevation use the semantic variables already
  defined in `tokens.css`, not new component literals

Rules: do not remove or rewrite theme overrides during feature work; do not add
color literals without an approved token proposal first.

### Accent usage

Blue is the active brand/technical accent, but its altitude depends on the
surface: use the darker `--accent-fg` on day surfaces and the lighter value on
night surfaces. Components consume `--accent-fg`, `--accent-fill`, and
`--accent-on`; they do not select a raw brand step casually. The homepage stays
mineral, material-led, and restrained rather than becoming blue decoration.
Warm metal remains secondary. No new accent family without an approved token
proposal.

### Runtime theme

Theme is **app state**, not `prefers-color-scheme`. It lives in `localStorage`
under `kardoor-showroom-ambience` with values `day` / `night`, and surfaces as
`data-ambience` in the DOM. Seed that key directly when testing a theme.

## 4. Typography

Base tokens in `tokens.css`:

- `--font-display` — Barlow Condensed / Arial Narrow
- `--font-body` — Inter / system-ui
- `--font-serif` — Instrument Serif / Georgia

Established cinematic/editorial families loaded locally in `fonts.css`:

- PP Telegraf — established display face for entrance, catalog, references,
  reviews, company, and contact surfaces
- PP Mori — established text/control face for those same product-led surfaces

Tailwind exposes these established families as `font-telegraf` and `font-mori`.
Use them only where the existing component language already establishes that
pair. Other imported families, including Montserrat, General Sans, Plus Jakarta
Sans, and Science Gothic, are not blanket approval for new UI; availability in
configuration or a legacy component is not design authority.

Direction: display type architectural and confident; body copy clear, quiet,
specific; short lines for editorial rhythm; large headings allowed when they act
as a primary visual element; serif rare and intentional. Avoid marketing filler
("modern solutions for your business") and random uppercase outside labels and
compact metadata. No new font family without explicit approval. Do not mix type
systems inside a section unless the component already does.

## 5. Layout and structure

Current structure (verified 2026-08-14):

- Global CSS loads from `nuxt/app/assets/styles/main.css`, which imports base,
  component, section, and page styles.
- `nuxt/app/app.vue` owns global startup, theme, and page-transition state, then
  renders the active page through `NuxtLayout`.
- `nuxt/app/layouts/default.vue` owns the site chrome, ScrollSmoother frame,
  page slot, and site-wide `SiteFooter`.
- Homepage route: `nuxt/app/pages/index.vue` → renders `HomeExperience`
  directly.
- `HomeExperience.vue` composes the entrance (`EntranceDoorLab` on desktop,
  `EntranceDoorMobile` on coarse pointers ≤1024px, chosen inside `ClientOnly`
  with an SSR shell), then `HomeCatalogTransition` (catalog + references +
  manifesto) and `HomeReviews`.

`HomeContentLoader.vue` was deleted. Do not reintroduce it.

Rules: respect section ownership · keep edits scoped · do not move layout
responsibility between files outside an explicit refactor · avoid equal-height
card grids outside catalogs and repeated lists · prefer controlled asymmetry,
wide cinematic composition, narrow text blocks · preserve responsive constraints
already encoded · introduce no new spacing system.

### Section quality checklist

Before changing or creating a section: one clear visual idea? existing tokens?
no slop signatures? scroll/motion ownership preserved? no unrelated redesign?
architectural, material, cinematic, controlled? an appropriate composition
recipe rather than an invented generic layout? product/material/architecture as
the first visual signal?

## 6. Motion and scroll

The project uses **GSAP, ScrollTrigger, and ScrollSmoother**, plus RAF loops,
resize observers, and scroll listeners in active flows. **Lenis was removed** —
`lenis.client.ts` no longer exists; `nuxt/app/plugins/scroll.client.ts` owns
smoothing now, and it **disables ScrollSmoother on touch** (coarse pointer and
width ≤ 1024), so touch devices run on native scroll.

Sensitive files (verified 2026-08-14):

- `nuxt/app/plugins/scroll.client.ts`
- `nuxt/app/components/home/EntranceDoorLab.vue`
- `nuxt/app/components/home/EntranceDoorMobile.vue`
- `nuxt/app/components/home/HomeExperience.vue`
- `nuxt/app/components/home/HomeCatalogTransition.vue`
- `nuxt/app/components/home/HomeCatalog.vue`
- `nuxt/app/components/layout/SiteFooter.vue`
- `nuxt/app/pages/company.vue`, `nuxt/app/pages/references.vue`

Motion should feel heavy, smooth, mechanical, cinematic, purposeful.

Rules: touch these systems only when the task is explicitly about them · no new
pinning without approval · no casual `ScrollTrigger.refresh()` · no DOM
read/write loops in scroll handlers · prefer transform and opacity · one clear
animation owner per section · preserve current scroll behavior.

Input authority: `useEntranceInput` reduces wheel, keyboard, and touch to a
single `drive(direction, strength, cancel)` contract, so scene logic never knows
the input type. Extend that contract rather than adding a parallel input path.

## 7. Components

**Buttons** — minimal and confident; strong but not playful hover; no invented
radii, shadows, fills, or transitions; reuse existing patterns first.

**Cards** — editorial, material-based, or functional. Avoid white-card-plus-
shadow. Subtle borders. Do not nest card-like containers unless established.

**Catalog** — functional, scannable, premium; rows read as architectural series
presentation, never e-commerce tiles; no unrelated card styles in the flow.

**Header** — owns its glass/token language. Do not rewrite its variables
casually. Preserve responsive behavior and theme interaction.

**Homepage** — entrance and scroll handoff are high risk. `HomeExperience.vue`
is now a thin composition node (101 lines; its script holds only the entrance
device check, entrance copy, and locale). Runtime behavior moved out to
`HomeCatalogTransition`, the section components, and composables. Look for a
section's state in its own component or composable, not in the parent.

## 8. Tokens

`nuxt/app/assets/styles/base/tokens.css` is the token source.

Authority order:

1. Existing component-level variable
2. Existing global token in `tokens.css`
3. Existing theme variable
4. A new token — proposed and documented, **not applied in the same change**
5. A hardcoded value only with explicit approval

Use section-level variables only where that section already owns the namespace.
No one-off hex, rgba, shadow, radius, spacing, transition, or font values for
convenience. No token renames outside an explicit token refactor.

Proposal format:

```md
Proposed token:
- Name: `--example-token`
- Value: `...`
- Reason: ...
- Files expected to use it: ...
```

## 9. Prohibitions

Do not: create new colors, shadows, radii, or a new spacing system · add a new
font family · add decorative gradients, glow, or glass without approval ·
redesign unrelated areas · perform speculative cleanup · delete or clean the
theme override files during feature work · touch GSAP, ScrollTrigger,
ScrollSmoother, pin, RAF, or resize logic unless the task is about them ·
introduce a styling system other than the approved Tailwind migration (§11).

## 10. Known risk areas

**Theme overrides** — `light.css` / `dark.css` hold many active overrides,
repeated declarations, hardcoded colors, and `!important` rules. Treat as risk
documentation until a dedicated cleanup is approved.

**Token drift** — `tokens.css`, runtime theme variables, section-local
variables, and many hardcoded values coexist. New work drifts easily.

**Scroll and animation** — homepage behavior depends on GSAP, ScrollTrigger,
ScrollSmoother, RAF scheduling, resize observers, and catalog handoff. Small
unrelated changes break scroll timing, pinning, reveal progress, or the reviews
marquee.

**Layout ownership is split intentionally** — `app.vue` owns global startup,
theme, and transition state. `layouts/default.vue` owns route chrome,
`#smooth-wrapper`, the page slot, and the site-wide `SiteFooter`. Route chrome
exceptions belong in a layout or a route-specific layout, not in `app.vue`.

**`SiteFooter` is default-layout chrome**, not a homepage section. It renders on
every route that uses the default layout; route-specific footer behavior must be
expressed by layout choice or an explicit layout contract.

**Two stacking/transform contexts** — the fixed chrome sits outside
`#smooth-wrapper` on purpose, because the `#smooth-content` transform would
break `position: fixed`. Correct, but it means chrome and page content live in
different contexts: the startup curtain can cover the page and absorb input
while `app-shell--content-hidden` is set.

**CSS ownership** — `main.css` imports most styles globally; class names can
collide or be reshaped by theme overrides. Scoped styles exist in some
components, but most rules are global.

**Mobile** — see §12.

## 11. Tailwind migration (approved, in progress)

Tailwind v4 **is installed and in use**: `tailwindcss`, `@tailwindcss/vite`, and
`nuxt/app/assets/styles/tailwind.css`. Any older statement that Tailwind is "not
part of the project" is void.

**Why.** The active CSS is spread across global imports, scoped component
styles, section sheets, page sheets, and runtime theme overrides. Some component
rules still span several files and breakpoints, which makes ownership and mobile
behavior drift. Tailwind puts ordinary layout rules next to their markup while
the existing token layer remains authoritative.

Tailwind is not expected to reduce complexity by itself. If a migrated component
only produces long `class=""` blocks without reducing total rules, the migration
stops.

**Scope rule — no split architecture.** Migration is per component, desktop and
mobile together. A component is never half Tailwind and half legacy CSS, and
there is never a "mobile Tailwind + desktop legacy" pair. Splitting the
*styling* architecture by viewport is forbidden: it produces two systems to
maintain and guarantees drift.

**Moves to Tailwind:** layout, flex/grid, spacing, sizing, typography scale and
responsive behavior, simple state variants.

**Stays in CSS by design:** theme tokens and ambience variables, complex
gradients and material treatments, GSAP-driven properties, keyframes, and
anything the theme override layers reach.

## 12. Mobile — full split

Process for mobile work lives in `.claude/skills/kardoor-mobile-workflow/`
(`SKILL.md` for the pipeline, `VERIFY.md` for what counts as evidence,
`LEDGER.md` for per-section state).

Current rendered structure remains a shared homepage tree. `HomeExperience.vue`
branches only the entrance inside `ClientOnly`; catalog, references, manifesto,
and reviews stay in the shared tree. Dedicated mobile entrance/showroom files,
component-scoped responsive rules, and stylesheet media queries coexist. That
mixed ownership is the known defect.

The current working tree is also the behavioral source of truth: at the time of
this rewrite `EntranceDoorMobile.vue` contains a `ScrollTrigger` pin with scrub,
even though some planning/ledger text describes a gesture-only version. Do not
report either model as accepted without real-device verification and explicit
phone acceptance.

## Decision (2026-08-14): full split

**Mobile is its own component tree.** Every home surface gets a mobile
component and its own stylesheet. Mobile is treated as a different product for a
different input, not as the desktop layout made narrower. The user chose this
twice, explicitly; it is settled.

The cost is real and named here so nobody is surprised by it: **every change is
made twice.** A copy change, a token change, a data change — if it lives in the
markup of both files, it must be edited in both. The rules in "Anti-drift"
below exist to shrink that surface, not to remove it.

### What gets a mobile file

| Surface | Mobile component | Status |
|---|---|---|
| Entrance | `EntranceDoorMobile.vue` | exists |
| Showroom | `ShowroomLabMobile.vue` | exists |
| Catalog | `HomeCatalogMobile.vue` | to build |
| References | `HomeReferencesMobile.vue` | to build |
| Manifesto | `HomeManifestoMobile.vue` | to build |
| Reviews | `HomeReviewsMobile.vue` | to build |
| Footer | `SiteFooterMobile.vue` | to build |

Each gets exactly one stylesheet next to its peers, named for the component.

### Anti-drift rules — these are what make a split survivable

1. **Text never lives in a mobile component.** All copy comes from a composable
   (`useEntranceCopy`, `useCatalogCopy`, …). If a string is typed into a mobile
   template, it will drift from desktop the first time marketing changes a word.
2. **Data never lives in a mobile component.** Products, doors, collections,
   locale, theme, favourites — composables and `data/` only.
3. **A mobile component owns layout, motion, and gesture. Nothing else.**
4. **No mobile component imports a desktop component**, and no desktop component
   imports a mobile one. They meet only at composables and `ui/` primitives.
5. **Shared primitives stay shared.** Buttons, modals, form controls, and
   focus/accessibility helpers are used by both trees, never duplicated.
6. When a section is migrated, its old responsive rules — the scoped `@media`
   block in the shared component and its mobile rules in the desktop stylesheet
   — are removed **in the same change**, so there is never a period where two
   mechanisms both claim the same viewport.

### Still to be settled before the root split is wired

The device decision is currently client-only, inside `ClientOnly`, per section.
A full tree split needs one decision point, and the server must reach the same
answer as the client or hydration tears and the SSR work is lost. Until that is
solved, **build the mobile components and mount them section by section the way
the entrance already does** — do not introduce a root-level `HomeMobile` split
or a device flag.

## 13. Accessibility, content, and responsive proof

- WCAG 2.1 AA is the minimum target.
- All controls remain keyboard reachable with visible focus; modal focus and
  cleanup must survive theme and route changes.
- Touch targets use a 44px working floor unless the established control is
  larger.
- `prefers-reduced-motion` receives a complete, usable state rather than simply
  hiding content.
- Turkish and English copy comes from the locale/copy composables; do not fork
  prose inside presentation components.
- Mobile or responsive claims require rendered browser evidence. Test 390x844
  and 360x800 with touch enabled, every changed breakpoint boundary, both day
  and night when theme is involved, and desktop when a shared owner changed.
- Synthetic DOM `TouchEvent` or `PointerEvent` dispatch is not proof of browser
  gesture arbitration. Use Playwright/CDP real input.

## 14. External references

Study references only through: what we like · how it translates to Kardoor ·
what must not be copied.

Separate the reference's useful principle from its surface skin. Kardoor may
borrow discipline, hierarchy, rhythm, and restraint. It must never borrow brand
colors, fonts, layout identity, product language, or decorative tricks.
