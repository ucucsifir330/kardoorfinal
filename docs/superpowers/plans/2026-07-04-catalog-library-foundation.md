# Catalog Library Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/catalog` landing page with the first working Kardoor interpretation of the supplied Material Library reference: a cream, hairline-divided, responsive grid populated from the existing door catalogue.

**Architecture:** The route remains a single Nuxt page and consumes `products` directly from the existing typed data module. All new visuals live under the `.catalog-lib` namespace in a new page stylesheet, leaving the old catalogue components and stylesheet intact until the replacement is approved.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, TypeScript, CSS Grid, existing `DoorProduct` data.

## Global Constraints

- Do not modify or delete the legacy catalogue components, composable, or `catalog.css` in this milestone.
- Do not touch GSAP, Lenis, ScrollTrigger, the global header, footer, or theme files.
- Use `products[].localImage` and link cards to `/doors/:slug`.
- Preserve the current locale-aware SEO block and `definePageMeta({ pageTransition: false })`.
- Scope every new selector and local token beneath `.catalog-lib`.
- First six images load eagerly; remaining images use native lazy loading.
- Hover and `:focus-visible` expose the same plus affordance; coarse pointers keep it visible.
- Reduced-motion users receive no card transition.
- Commit only this milestone's files; do not stage the existing `AGENTS.md`, `.claude/`, or `catalogmd/` changes.

---

### Task 1: Build the catalogue foundation and product grid

**Files:**
- Create: `nuxt/assets/styles/pages/catalog-library.css`
- Modify: `nuxt/assets/styles/main.css`
- Modify: `nuxt/pages/catalog.vue`

**Interfaces:**
- Consumes: `products: DoorProduct[]` from `~/data/products`, including `slug`, `name`, `code`, `localImage`, and `seriesTitle`.
- Produces: `.catalog-lib` page root and `.catalog-lib__grid` card collection; no reusable public component API in this milestone.

- [ ] **Step 1: Record the clean baseline**

Run: `git status --short -- nuxt/pages/catalog.vue nuxt/assets/styles/main.css nuxt/assets/styles/pages/catalog-library.css`

Expected: no existing changes in the three implementation paths.

- [ ] **Step 2: Add the isolated stylesheet and global import**

Create the `.catalog-lib` token scope using the approved cream/text/hairline/raised values from `catalogmd/HANDOFF.md`, then implement:

```css
.catalog-lib { min-height: 100dvh; background: var(--clg-surface); color: var(--clg-text); }
.catalog-lib__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: var(--clg-hairline); }
.catalog-lib__card { min-width: 0; background: var(--clg-surface); }
```

Add `@import "./pages/catalog-library.css";` immediately after the existing catalogue import in `main.css`. Complete responsive states for 2 columns on tablet and 1 column on narrow mobile, with 3 columns on laptop and 4 on wide desktop.

- [ ] **Step 3: Rewrite the route with real products**

Keep the existing SEO calculation and replace the old `useCatalogPage`, `CatalogSidebar`, and `CatalogMain` usage with:

```vue
<NuxtLink
  v-for="(product, index) in products"
  :key="product.slug"
  class="catalog-lib__card"
  :to="`/doors/${product.slug}`"
  :aria-label="`${product.name}, ${product.code}`"
>
  <span class="catalog-lib__visual">
    <img
      :src="product.localImage"
      :alt="`${product.name} ${product.code}`"
      width="320"
      height="480"
      :loading="index < 6 ? 'eager' : 'lazy'"
      :fetchpriority="index < 2 ? 'high' : 'auto'"
    />
    <span class="catalog-lib__add" aria-hidden="true">+</span>
  </span>
  <span class="catalog-lib__meta">
    <strong>{{ product.name }}</strong>
    <span>{{ product.code }}</span>
  </span>
</NuxtLink>
```

Use a single `<section id="main-content" class="catalog-lib">` inside the application's existing main landmark, with an accessible introduction heading and the grid. Do not add filters or pagination in this milestone.

- [ ] **Step 4: Verify the implementation**

Run: `npm run typecheck`

Expected: exit code 0 with no Vue or TypeScript errors.

Run the development server and inspect `/catalog` at approximately 390px, 1024px, 1440px, and 1920px widths. Confirm no horizontal overflow, visible keyboard focus, equal hover/focus affordances, correct local images, and unchanged `/catalog/steel` rendering.

- [ ] **Step 5: Commit the milestone**

```powershell
git add docs/superpowers/plans/2026-07-04-catalog-library-foundation.md nuxt/pages/catalog.vue nuxt/assets/styles/main.css nuxt/assets/styles/pages/catalog-library.css
git commit -m "feat: katalog kütüphanesi temel gridini oluştur"
```

Expected: one commit containing only the plan and the three implementation files.

## Deferred Milestones

- Filters toggle, modal drawer, URL-backed filter state, focus trap, Apply/Clear All.
- Load-more pagination and live-region announcements.
- Loading, empty, image-error/retry, and exhausted states.
- Night-theme treatment.
- Removal of legacy catalogue components, composable, and old landing-page CSS after explicit approval.
