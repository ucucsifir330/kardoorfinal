# Kardoor Agent Working Contract

Rewritten 2026-08-14. The previous version referenced six files that no longer
exist and banned a dependency the project had already adopted, so its
protections were fictional. Every path below was verified against the tree on
that date. **If a rule here points at a file that has moved, fix the rule in the
same change — a stale contract protects nothing.**

## 1. Core working rule

- Read `docs/design/DESIGN.md` before design or styling work.
- For mobile, touch, responsive, or breakpoint work, also read
  `.claude/skills/kardoor-mobile-workflow/SKILL.md` and `VERIFY.md`. Treat the
  rendered source and current working tree as authoritative when a ledger or
  planning note disagrees with them.
- Change only what the task asks for. Do not refactor unless asked.
- Do not redesign under the banner of "improvement".
- Preserve Kardoor's architectural, material, cinematic, controlled language.
- **Do not act on inference about what the user "must have meant" when the
  inference would delete or rewrite working code.** Open the file, quote what is
  actually there, and ask. This rule exists because it was broken.

## 2. Verify before you assert

- Do not describe code you have not opened, in chat or in a document.
- Do not report a check as passing unless it ran; report real exit codes.
- Do not claim a mobile or interaction behavior from reading source. See
  `.claude/skills/kardoor-mobile-workflow/VERIFY.md` for what counts as proof.
- When a measurement contradicts your diagnosis, the measurement wins.

## 3. Scope and output

- Touch only the files the task requires; list exactly what changed.
- State plainly which protected areas were not touched.
- State which checks ran and which did not, and why.
- No bulk rewrites of source files via scripts or regex.
- Preserve pre-existing uncommitted work. Never "clean up" someone else's diff.
  If your change would collide with one, stop and say so.

## 4. Design system rules

Use styling values in this order:

1. Existing component-level variable.
2. Existing global token in `nuxt/app/assets/styles/base/tokens.css`.
3. Existing theme variable.
4. A new token — proposed and documented, not applied in the same change.
5. A hardcoded value only with explicit approval.

Do not invent new colors, fonts, radii, shadows, or spacing scales. Avoid the
AI-slop signatures listed in `DESIGN.md`.

## 5. Motion and scroll protection

Touch GSAP, ScrollTrigger, ScrollSmoother, pinning, RAF, resize observers, and
scroll listeners only when the task is explicitly about those systems.

High-risk files (verified 2026-08-14):

- `nuxt/app/components/home/EntranceDoorLab.vue` — desktop entrance scene
- `nuxt/app/components/home/EntranceDoorMobile.vue` — mobile entrance scene
- `nuxt/app/components/home/HomeExperience.vue` — mounts the home tree
- `nuxt/app/components/home/HomeCatalogTransition.vue` — catalog handoff
- `nuxt/app/components/home/HomeCatalog.vue`
- `nuxt/app/plugins/scroll.client.ts` — ScrollSmoother; disabled when the
  primary pointer is coarse and the viewport is at most 1024px
- `nuxt/app/app.vue` — startup screens and route-transition lifecycle
- `nuxt/nuxt.config.ts` — global CSS, head bootstrap, hero preload and routing

Rules: preserve existing scroll behavior, add no new pinning without explicit
approval, add no stray `ScrollTrigger.refresh()`, create no DOM read/write loops
in scroll handlers, keep animation ownership local.

`nuxt/app/plugins/lenis.client.ts` no longer exists — Lenis was replaced by
ScrollSmoother. `HomeContentLoader.vue` was deleted. Do not reintroduce either.

## 6. Theme and token risk

- `nuxt/public/themes/light.css` and `nuxt/public/themes/dark.css` are active
  override layers. Do not clean, delete, or rewrite them during feature work.
- `nuxt/app/assets/styles/base/tokens.css` is the token source.
- No token refactors or renames unless explicitly requested.
- Runtime theme is app state under the `kardoor-showroom-ambience` key
  (`day` / `night`), **not** `prefers-color-scheme`. Seed it directly when
  testing.

## 7. Tailwind

Tailwind v4 **is installed and in use** (`tailwindcss`, `@tailwindcss/vite`,
`nuxt/app/assets/styles/tailwind.css`). The old blanket ban is void.

- Migration is governed by `DESIGN.md` §11 — per component, desktop and mobile
  together.
- Do not start a migration of a component that was not asked for.
- The current CSS/Tailwind hybrid is intentional. Do not add another framework
  or give the same rule permanent ownership in both Tailwind and legacy CSS.

## 8. Reference usage

Never copy an external reference directly. Interpret it as: what we like, how it
translates to Kardoor, what must not be copied. Borrow discipline, hierarchy,
rhythm, restraint — never colors, fonts, layout identity, or decorative tricks.

## 9. Verification commands

Run from `nuxt/`, and report the real result:

- Vue / TypeScript / composable changes: `npm run typecheck`
- CSS changes: `npm run lint:css`
- Route-wide or runtime concerns: `npm run audit:runtime` (Playwright + CDP,
  390x844 and 1440x1000, both themes)
- Documentation only: no check required

## 10. Shared logic

Before writing behavior into a component, inspect `nuxt/app/composables/` and
check whether the behavior belongs there. Data, copy, i18n, theme, and business
state belong in composables; components own presentation and input.

## 11. Instruction precedence

1. Direct user instructions in the current task.
2. A more specific nested `AGENTS.md` for its own directory.
3. This file.
4. `docs/design/DESIGN.md` for design and styling specifics.

If instructions conflict — including a conflict between this file and
`DESIGN.md` — stop and ask rather than picking one silently.
