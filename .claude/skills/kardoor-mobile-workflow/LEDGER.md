# Mobile Ledger

Source of truth for mobile completion state. Step 0 of `SKILL.md` reads this
file first. If `git status` contradicts a row, **the working tree wins** — fix
the row before editing anything else.

Status values: `done` · `in-review` (built, awaiting phone acceptance) ·
`in-progress` · `todo` · `blocked`.

Update the row in the same change that alters its state. One row at a time.

---

## Home route (`/`)

| # | Section | Status | Owner file | Notes |
|---|---------|--------|-----------|-------|
| 1 | Entrance | `in-review` | `home/EntranceDoorMobile.vue` + `entrance-mobile.css` | Wired in `HomeExperience.vue:13`. A scroll conversion (`ScrollTrigger` pin+scrub) regressed this and was reverted to the committed swipe version — `phase` state machine driven by `gesture.startX`, zero `ScrollTrigger`. **CDP-verified 2026-08-13** at 390x844 day/night and 360x800 day: one upward flick `--hero`→`--showroom` (scene 1.00→15.00), one downward flick returns (15.00→1.00), `scrollWidth == innerWidth` throughout, no console errors. Awaiting phone acceptance. |
| 2 | Showroom | `in-review` | `home/ShowroomLabMobile.vue` + `showroom-mobile.css` | Mounted inside `EntranceDoorMobile.vue`, takes `progress` in / `doorSelect` out. Swapped in over desktop `ShowroomLab`, which could never match `showroom.css`'s `.entrance-lab[data-ambience]` rules and so rendered the wrong palette. Verifies together with row 1 — it lives inside that scene. **CDP-verified 2026-08-13**: carries its own `data-ambience`; day name `rgb(22,19,15)` / CTA `rgb(34,49,140)`, night name `rgb(244,246,255)` / CTA `rgb(244,246,255)`. Four flicks step 01→05, four back to 01. Card 364px with `scrollHeight == clientHeight`. Rail tap targets raised 28px→44px during verification. |
| 3 | Catalog | `todo` | `home/HomeCatalog.vue` | Mobile already exists **inline**: scoped `@media (max-width: 860px)` block at `HomeCatalog.vue:1022` (series strips + horizontal scroll, no filters, 271px desktop padding dropped — decided 2026-08-05). Work here is extraction into `HomeCatalogMobile.vue` + `home-catalog-mobile.css`, not a redesign. **Re-measure before starting**: the `revise` merge (2026-08-13) rewrote +722 lines of this file — scroll-linked structural nodes and sidebar filters — so the mobile block's assumptions may have moved. `home-catalog.css` carries heavy `!important` layering; expect cascade resistance. |
| 4 | References | `todo` | `home/HomeReferences.vue` | No mobile branch. Flip geometry re-measures after fonts load — re-check that on narrow widths. |
| 5 | Manifesto | `todo` | `home/HomeManifesto.vue` | No mobile branch, no responsive rules found. |
| 6 | Reviews | `todo` | `home/HomeReviews.vue` | No mobile branch, no responsive rules found. |
| 7 | Footer | `todo` | `layout/SiteFooter.vue` + `components/site-footer.css` | **Moved 2026-08-14**: was `home/HomeFooter.vue` + `sections/home-footer.css`, mounted globally in `app.vue`; now owned by `layouts/default.vue`. Both old files deleted. **Measured defect, still open**: at 390x664 the footer renders 1818px tall (2.7 viewports) with a ~700px empty void between the column headings and the wordmark — the columns print headings with no visible content under them. Verify against the moved files, not the old ones. `tests/audit/footer-visual-check.mjs` exists. |

## Routes and shared surfaces

| # | Surface | Status | Owner file | Notes |
|---|---------|--------|-----------|-------|
| 8 | `/catalog` Collections | `todo` | `catalog/CollectionsIndex.vue` | Flagged in a prior session as **knowingly broken on mobile** after the catalog→Collections migration, and required to close before production. Confirm the current state in the browser before trusting that note. Do not "fix" the palette while here. |
| 9 | Product modal | `todo` | `home/CatalogProductModal.vue` | 6 responsive queries already present; verify rather than assume. |
| 10 | Header / nav | `todo` | `layout/SiteHeader.vue`, `layout/SiteNavControls.vue` | Logo hides ≤620px; ink layer needs `isolation`. Shared surface — scope expansion rules apply. |
| 11 | Contact hub | `todo` | `ui/ContactHub.vue` | Has an uncommitted diff in the working tree. Reconcile before starting. |
| 12 | Door detail | `todo` | `pages/doors/[code].vue` | Not assessed. |
| 13 | Company / References / Contact pages | `todo` | `pages/company.vue`, `pages/references.vue`, `pages/contact.vue` | Not assessed. |

---

## Evidence log

Append one line per accepted section: date, section, viewports and themes
proven, and what the user confirmed on the phone. Keep it to one line each.

- 2026-08-13 — Entrance — accepted on phone in a prior session (single flick,
  under-door hint, swipe SVG). Evidence predates this ledger.
