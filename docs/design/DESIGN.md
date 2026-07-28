# Ege Kardoor DESIGN.md

> Premium architectural steel door systems. Cinematic, industrial, tactile, controlled.
> Not SaaS. Not generic AI landing page. Not decoration-first.

This document is the design contract for agents working in this repository. It describes the current Kardoor design language and the limits that must be respected before any UI, CSS, Vue, animation, or theme work is proposed.

## 1. Kardoor Brand Feeling

Kardoor should feel like:

- Architectural precision.
- Heavy material quality.
- Cinematic entrance and reveal.
- Industrial luxury.
- Calm confidence.
- Manufactured craft, not generic tech.
- Premium showroom, not e-commerce template.

Avoid:

- Generic SaaS gradients.
- Random glassmorphism.
- Decorative glow without purpose.
- Over-rounded marketing cards.
- Dashboard aesthetics.
- Stock AI visual language.
- Playful motion where the subject needs weight.
- Redesigning sections just because they can be made "nicer".

## 2. Visual Principles

- Door imagery and material presence carry the experience.
- Typography should feel deliberate, architectural, and editorial.
- Layouts should use fewer elements with stronger hierarchy.
- Negative space is part of the premium feeling.
- Each section should have one clear visual idea.
- UI chrome must support the product, not compete with it.
- Catalog surfaces should feel like architectural presentation, not a cheap product grid.
- Decorative effects must be rare and tied to an existing system or component purpose.
- Visual density can increase in catalog and operational sections, but the composition should stay controlled.

### Composition Recipes

Use these composition recipes as approved directions when a new section needs a visual structure. They are not templates to copy blindly; they are starting points that keep Kardoor from drifting into generic AI layouts.

#### Cinematic Split

- Best for hero, entrance, showroom, and high-impact product sections.
- One dominant image or product/render surface carries the emotional weight.
- Copy stays compact and controlled, usually anchored to one side or one strong alignment line.
- Avoid equal halves that feel like a SaaS landing page.
- Motion, if present, should feel like camera movement, door mechanics, or material reveal.

#### Editorial Broadsheet

- Best for manifesto, company story, production principles, and reference narrative sections.
- Large typography behaves like an image.
- Use strict hierarchy, narrow body text, and generous negative space.
- Photography or product details should be sparse and deliberate.
- Do not copy newspaper aesthetics literally; translate the discipline, density, and typographic confidence.

#### Material Showcase

- Best for finishes, construction details, closeups, and premium product proof.
- Surface, texture, shadow, and physical scale are the main story.
- Use fewer cards and larger inspection moments.
- Prefer real product imagery, renders, material crops, or structured technical visuals over decorative illustration.
- Avoid glow-heavy presentation that hides the material.

#### Technical Archive

- Best for specifications, production details, dimensions, certifications, export information, and documentation-like pages.
- Dense information is allowed, but it must be organized with calm hierarchy.
- Use tables, rows, metadata labels, and restrained dividers before decorative cards.
- Technical areas may use cooler accents only when they support reading, focus, or state.
- Avoid fake dashboard panels and meaningless metrics.

#### Catalog Architecture

- Best for product families, series, filters, and browsing experiences.
- Catalog should feel like an architectural archive or showroom wall, not a generic store grid.
- Product hierarchy should be clear: family, model, finish, technical code, action.
- Repeated items can be card-like, but they must remain restrained and scannable.
- Do not introduce unrelated card styles inside the catalog flow.

### AI Slop Signatures To Avoid

These patterns are prohibited unless an existing component already depends on them and the task is specifically to maintain that component:

- Generic SaaS gradients.
- Floating blurred blobs.
- Random glassmorphism.
- Fake dashboard panels.
- Meaningless icon grids.
- Generic 3-card marketing blocks.
- Over-rounded pill CTAs.
- Decorative glow without system purpose.
- Stock-like abstract backgrounds that do not reveal doors, material, production, architecture, or real product state.
- Symmetric "feature block" layouts that could belong to any startup website.

## 3. Current Color Language

The current repo already has a color/token layer in:

- `nuxt/assets/styles/base/tokens.css`
- `nuxt/public/themes/light.css`
- `nuxt/public/themes/dark.css`
- Section-level CSS files under `nuxt/assets/styles/sections/`
- Page-level CSS files under `nuxt/assets/styles/pages/`

Current recurring color families:

- Deep black / graphite: `#050505`, `#0D1012`, `#111417`, `#14151D`, `#171B1F`
- Warm light mineral surfaces: `#EAE8E8`, `#F4F1EA`, `#f8f6ef`
- Soft text and borders through low-opacity rgba values.
- Cool blue accent: `#006cff`, `#2ce3ff`, `#3a83ff`
- Warm mineral / metal accent: `#B88A44`, `#a77a55`

Current source of truth:

- Treat `nuxt/assets/styles/base/tokens.css` as the current primary token source.
- Treat `light.css` and `dark.css` as active runtime theme override layers, not as a clean design system yet.
- Do not remove or rewrite theme overrides during normal feature work.
- Do not add new color literals unless the task explicitly approves a token proposal first.

### Accent Usage Rules

- Cool blue and cyan accents are legacy or technical accents.
- They must not become the primary Kardoor brand emotion.
- Use cool blue/cyan only for links, focus states, technical UI, or components that already depend on those accents.
- Homepage visual language should remain graphite, mineral, metal, and material-led.
- Warm metal accents should stay restrained and should support material authority, not become decoration.
- Do not introduce a new accent family without an approved token proposal.

## 4. Current Typography Language

Current font tokens in `tokens.css`:

- `--font-display`: Barlow Condensed / Arial Narrow fallback
- `--font-body`: Inter / system-ui fallback
- `--font-serif`: Instrument Serif / Georgia fallback

Current imported families include:

- Barlow Condensed
- Inter
- Instrument Serif
- Montserrat
- General Sans
- Plus Jakarta Sans

Typography direction:

- Display type should feel architectural and confident.
- Body copy should stay clear, quiet, and specific.
- Short lines are preferred for premium editorial rhythm.
- Large headings are allowed when they function as a primary visual element.
- Serif moments should be rare and intentional.
- Avoid generic marketing copy such as "modern solutions for your business".
- Avoid random uppercase except for labels, compact metadata, or established component language.
- Do not introduce a new font family without explicit approval.

### Typography Authority

- Imported font does not mean approved design usage.
- Use current display/body/serif tokens only.
- `--font-display`, `--font-body`, and `--font-serif` are the approved typography entry points.
- Serif is a rare editorial accent, not the default voice.
- Montserrat, General Sans, and Plus Jakarta Sans should not be used in new UI unless already used by the target component.
- Do not choose a font because it is available in `nuxt.config.ts` or `main.css`.
- Do not mix type systems inside one section unless the existing component already establishes that mix.

## 5. Layout Principles

Current layout structure:

- Nuxt loads global CSS from `nuxt/assets/styles/main.css`.
- `main.css` imports base, shared component, section, and page styles.
- Homepage route is `nuxt/pages/index.vue`.
- Homepage renders `HomeContentLoader`.
- `HomeContentLoader` lazily renders `HomeExperience`.
- `HomeExperience` composes `EntranceDoor`, `HomeCatalog`, `HomeReferences`, `HomeManifesto`, and `HomeReviews`.

Layout rules:

- Respect existing section ownership.
- Keep edits scoped to the requested component or section.
- Do not move layout responsibility between files unless the task explicitly asks for refactor work.
- Avoid equal-height card grids unless the section is a catalog or repeated item list.
- Use controlled asymmetry, wide cinematic compositions, and narrow text blocks where appropriate.
- Preserve responsive constraints already encoded in section CSS.
- Do not introduce a new spacing system.
- Do not introduce Tailwind.

### Section Quality Checklist

Before changing or creating a section, the agent must check:

- Does it have one clear visual idea?
- Does it use existing tokens?
- Does it avoid AI slop signatures?
- Does it preserve scroll/motion ownership?
- Does it avoid unrelated redesign?
- Does it feel architectural, material, cinematic, and controlled?
- Does it use an appropriate composition recipe instead of inventing a generic layout?
- Does it keep product, material, or architecture as the first visual signal?

## 6. Motion / Scroll Principles

The project uses GSAP, ScrollTrigger, Lenis, RAF loops, resize observers, and scroll listeners in active flows.

Sensitive areas include:

- `nuxt/plugins/lenis.client.ts`
- `nuxt/components/home/EntranceDoor.vue`
- `nuxt/components/home/HomeExperience.vue`
- `nuxt/components/home/HomeContentLoader.vue`
- `nuxt/components/home/HomeCatalog.vue`
- `nuxt/components/home/HomeFooter.vue`
- `nuxt/pages/company.vue`
- `nuxt/pages/references.vue`

Motion should feel:

- Heavy.
- Smooth.
- Mechanical.
- Cinematic.
- Purposeful.

Motion rules:

- Do not touch GSAP, Lenis, ScrollTrigger, pin, RAF, resize observer, or scroll listener logic unless the task is explicitly about those systems.
- Do not add new pinning behavior without explicit approval.
- Do not add scroll refresh calls casually.
- Do not create DOM read/write loops in scroll handlers.
- Prefer transform and opacity when motion is required.
- One section should have one clear animation owner.
- Preserve current scroll behavior unless the task specifically asks to change it.

## 7. Component Principles

Buttons:

- Minimal and confident.
- Hover states should be strong but not playful.
- Do not invent new radii, shadows, fills, or transition styles.
- Use existing button/component patterns first.

Cards:

- Cards should feel editorial, material-based, or functional.
- Avoid default white card plus shadow patterns.
- Borders should be subtle.
- Do not nest card-like containers unless the component already establishes that pattern.

Catalog:

- Catalog should remain functional, scannable, and premium.
- Product rows/cards should feel like architectural series presentation.
- Avoid turning catalog areas into generic e-commerce tiles.

Header:

- Header uses its own glass/token language.
- Do not rewrite header variables casually.
- Preserve current responsive behavior and theme interaction.

Homepage:

- Entrance and scroll handoff behavior are high-risk.
- Catalog, references/manifesto, reviews, and footer are already split into feature components, but some runtime logic still lives in `HomeExperience`.
- Do not redesign unrelated homepage sections from inside a local task.

## 8. Agent Prohibitions

When editing this repository, agents must not:

- Create new colors.
- Create new shadows.
- Create new radii.
- Create a new spacing system.
- Add Tailwind outside the approved migration (see section 12).
- Add a new font family.
- Add decorative gradients, glow, or glass effects without approval.
- Redesign unrelated areas.
- Touch GSAP unless the task is specifically about GSAP.
- Touch Lenis unless the task is specifically about Lenis.
- Touch ScrollTrigger unless the task is specifically about ScrollTrigger.
- Touch pin behavior unless the task is specifically about pin behavior.
- Touch RAF loops unless the task is specifically about RAF behavior.
- Touch resize logic unless the task is specifically about resize behavior.
- Delete or clean `public/themes/light.css` or `public/themes/dark.css` overrides during normal feature work.
- Perform speculative cleanup.
- Replace the current CSS architecture with a styling system other than the
  approved Tailwind migration (see section 12).

## 9. Token Usage Rules

Current rule:

- `nuxt/assets/styles/base/tokens.css` is the current token source.

When styling:

- Use existing CSS variables first.
- Use section-level variables only when that section already owns that local token namespace.
- Prefer existing text, line, panel, ambience, header, catalog, and theme variables over hardcoded literals.
- If a needed token does not exist, propose it first.
- Do not directly use a proposed token in the same change unless the user approves it.
- Do not introduce one-off hex, rgba, shadow, radius, spacing, transition, or font values for convenience.
- Do not rename existing tokens unless the task is explicitly a token refactor.

Token authority order:

1. Existing component-level variable.
2. Existing global token from `tokens.css`.
3. Existing theme variable.
4. Proposed new token documented but not applied.
5. Hardcoded value only with explicit approval.

Suggested token proposal format:

```md
Proposed token:
- Name: `--example-token`
- Value: `...`
- Reason: ...
- Files expected to use it: ...
```

## 10. Current Risky Areas

Theme override risk:

- `nuxt/public/themes/light.css` and `nuxt/public/themes/dark.css` contain many active overrides, repeated declarations, hardcoded colors, and `!important` rules.
- These files are active and must not be deleted or cleaned casually.
- They should be treated as risk documentation until a dedicated theme cleanup task is approved.

Token drift risk:

- The repo has `tokens.css`, runtime theme variables, section-local variables, and many hardcoded color values.
- New work can easily drift unless agents use existing tokens and avoid new literals.

Scroll and animation risk:

- Homepage behavior depends on GSAP, ScrollTrigger, Lenis, RAF scheduling, resize observers, lazy rendering, and scroll handoff logic.
- Small unrelated changes can break scroll timing, pinning, reveal progress, catalog handoff, or review marquee behavior.

Homepage orchestration risk:

- `HomeExperience.vue` still owns important runtime behavior for multiple child sections.
- Component boundaries are partially split visually, but not fully split logically.
- Do not assume a visual component owns all of its state or animation logic.

CSS ownership risk:

- `main.css` imports many section and page styles globally.
- Class names can collide or be affected by theme overrides.
- Scoped Vue styles exist in some components, but most visual rules are global CSS.

Tailwind risk:

- Tailwind is not part of the current project.
- Adding it would create a second styling system and increase drift.
- Do not add Tailwind unless a dedicated migration or new-component strategy is approved.

Reference usage rule:

- External reference `DESIGN.md` files may be studied for structure and discipline.
- Do not copy another site's design system directly.
- Capture references as interpretation notes, not as borrowed skin.

Reference translation protocol:

External design references may be studied only through:

- What we like.
- How it translates to Kardoor.
- What must not be copied.

For every reference note, explicitly separate the reference's useful principle from its surface skin. Kardoor may borrow discipline, hierarchy, rhythm, and restraint; it must not borrow brand colors, fonts, layout identity, product language, or decorative tricks directly.

## 12. Tailwind Migration (Approved)

Status: **approved and in progress.** This section overrides the blanket
Tailwind prohibition in section 8. Nothing else in section 8 is relaxed.

### 12.1 Why

The current CSS is ~11k lines across 21+ files, with `home-catalog.css` alone
at 2728 lines and 24 media queries. Desktop and mobile rules for one component
are spread across several files and breakpoints, which is the direct cause of
the scroll/touch regressions on mobile. Tailwind is adopted to put a
component's layout rules next to its markup.

Tailwind is **not** expected to reduce complexity by itself. If a migrated
component only produces long `class=""` blocks without reducing total rules,
the migration stops.

### 12.2 Scope rule — no split architecture

Migration is **per component, desktop and mobile together**. A component is
never half Tailwind and half legacy CSS, and there is never a
"mobile Tailwind + desktop legacy" pair. Splitting the architecture by
viewport is explicitly forbidden — it produces two systems to maintain and
guarantees drift.

### 12.3 What migrates and what stays

Moves to Tailwind:

- Layout, flex/grid, spacing, sizing.
- Typography scale and responsive behavior.
- Simple state variants (hover, focus, active).

Stays in CSS (by design, not as debt):

- `@keyframes` and animation definitions.
- Pseudo-elements with complex backgrounds.
- GSAP/ScrollTrigger state classes and pin structure.
- Theme override layers (`public/themes/*.css`).
- Browser-specific fixes.

### 12.4 Token discipline

- Color, font, radius, shadow: **only** via Kardoor tokens exposed through
  `@theme inline` in `tailwind.css`. Arbitrary values for these are forbidden
  in new work.
- Pre-existing hardcoded values (e.g. `#1b39bf` in reviews) are carried over
  **unchanged** during migration. Migration must not alter appearance; token
  cleanup is a separate task.
- `@theme inline` is mandatory — it references `tokens.css` instead of copying
  it, so `.app-shell--day/--night` theme switching keeps working.
- Preflight stays disabled; the project has its own `reset.css`.

### 12.5 Evidence requirement

Before a legacy CSS file is deleted, the migrated component must be verified
against the original at every breakpoint, in both light and dark themes, using
real rendered output (CDP computed styles), not static file reading. Static
analysis alone is not acceptable evidence — see the earlier cleanup failure
recorded in the repo's handoff notes.

Dead rules found only in the old file are **not** migrated. Migration copies
what actually renders.

### 12.6 Order

Low-risk leaf components first. `EntranceDoorLab`, the scroll handoff chain,
and anything touching GSAP pinning go last.

## 13. CSS Ownership & Naming (Plan)

Status: **approved, not yet executed.** Section 12 (Tailwind migration) stays in
force; this section adds the ownership rules that migration must follow.

### 13.1 The problem, measured

`scripts/class-ownership.mjs` output (2026-07-28):

- **36 classes are written from 3+ separate files.** Worst: `.footer-wrapper`
  (7 files, 27 rules), `.app-shell--day` (9 files), `.catalog-section` (4 files).
- `scripts/classify-rules.mjs`: **56% of `themes/dark.css` is LAYOUT**, not theme.
  `.catalog-main` gets `width`, `height`, `overflow`, `scrollbar-*` from a theme file.

This is the root cause of the `!important` wars. Two files write the same property
to the same element, neither owns it, so whoever loads last (or shouts `!important`)
wins. Fixing `!important` without fixing ownership just moves the fight.

### 13.2 Rule 1 — one owner per class

| Layer | Writes | Lives in |
|---|---|---|
| Token | raw values (`--accent`, `--bg-navy`) | `base/tokens.css` |
| Theme | **only** variable assignments (`--x: <color>`) | `public/themes/*.css` |
| Component | layout, typography, motion | the component's own file |

A theme file must never write `width`, `padding`, `display`, `grid-*`, `position`.
If a theme needs a different size, the component reads a variable the theme sets.

Proven: applying this to the footer took `!important` from 241 → 14 and deleted
1045 lines from the theme files, with **zero** measured pixel change.

### 13.3 Rule 2 — names declare ownership

Target convention (not yet applied):

```
.c-catalog__card            component: catalog, part: card
.c-catalog__card--liquid    variant
.is-liquid-expanded         state (added by JS)
.u-visually-hidden          utility (rare)
```

The `c-` prefix means "this class has an owner." Nothing outside the component
writes to it. Current names (`.catalog-card`, `.social-btn`, `.hours`) carry no
ownership signal, which is why anyone felt free to write to them.

### 13.4 Rule 3 — the Tailwind/CSS boundary

Goes to Tailwind: layout, spacing, sizing, typography scale, simple hover/focus.

Stays in CSS: `::before`/`::after` content, `@keyframes`, parent-state selectors
(`.is-expanded .hamburger-line`), anything GSAP touches, theme variables.

This is not preference. A utility class styles the element itself; it cannot
express "when my ancestor has state X." In `home-catalog`, 45 of 61 rules are
parent-state — which is why Tailwind alone did not help there.

### 13.5 Execution order

Per component, never in bulk:

1. Collect every rule for the component into one place, wherever it currently lives
2. Delete layout rules from the theme files; leave only colour variables
3. Strip `!important` — with no rival left, they are inert
4. Rename to `c-<component>__<part>`
5. Verify at 1440 + 390 with CDP computed styles; commit only at zero deviation

Steps 1–3 are done for `HomeReviews`, `FloatingContactHub`, and the footer.
Step 4 has not been attempted anywhere yet.

### 13.6 Remaining work, measured

| File | Lines | !important | Theme rules |
|---|---|---|---|
| home-catalog.css | 1773 | 686 | 89 |
| home-footer.css | 1141 | 17 | 0 |
| home-references.css | 499 | 9 | 0 |
| home-team.css | 509 | 0 | 0 |
| showroom.css | 583 | 0 | 0 |
| entrance-lab.css | 659 | 0 | 0 |
| entrance-mobile.css | 318 | 0 | 0 |

**All ownership debt is now concentrated in `home-catalog`.** Every other section
already has a single owner. Rule 1 work = `home-catalog` only.

### 13.7 Renaming risk (read before step 4)

Class names appear in JS selectors, GSAP targets, theme files, and `main.css`
performance rules (`html.is-scrolling .site-header__bar`). A missed reference
fails **silently** — see the `.flip-text-link` regression on 2026-07-28, where
dropping one `!important` made text render twice with no error.

Therefore renaming requires: grep every occurrence across `.vue`, `.ts`, `.css`
before touching anything; rename one component per commit; verify hover, theme
switch, and scroll state — not just static layout.
