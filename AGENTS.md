# Kardoor Agent Working Contract

## 1. Core Working Rule

- Read `/docs/design/DESIGN.md` before every task.
- Change only the area requested by the user.
- Do not touch unrelated files.
- Do not refactor unless the user explicitly asks for refactor work.
- Do not change design under the excuse of "improvement".
- Preserve Kardoor's architectural, material, cinematic, and controlled design language.

## 2. File Scope Rules

- Output only files that changed.
- If HTML/Vue changed, output only the relevant Vue file.
- If CSS changed, output only the relevant CSS file.
- If TS changed, output only the relevant TS file.
- Do not reprint unchanged files.
- Do not include unrelated cleanup, formatting, or generated changes.

## 3. Design System Rules

- Do not create new colors.
- Do not create new fonts.
- Do not create new radii.
- Do not create new shadows.
- Do not create a new spacing system.
- Do not create new gradient, glow, or glass effects.
- Use styling values in this order:
  1. Existing component-level variable.
  2. Existing global token from `tokens.css`.
  3. Existing theme variable.
  4. Proposed new token documented but not applied.
  5. Hardcoded value only with explicit approval.
- If a token is missing, propose it first and do not apply it in the same change.
- Avoid AI slop signatures listed in `/docs/design/DESIGN.md`.

## 4. Motion / Scroll Protection

- Touch GSAP, Lenis, ScrollTrigger, pin, RAF, resize observer, and scroll listener logic only when the task explicitly concerns those systems.
- Treat these files as high risk:
  - `nuxt/components/home/EntranceDoor.vue`
  - `nuxt/components/home/HomeExperience.vue`
  - `nuxt/components/home/HomeContentLoader.vue`
  - `nuxt/components/home/HomeCatalog.vue`
  - `nuxt/plugins/lenis.client.ts`
- Preserve existing scroll behavior.
- Do not add new pinning behavior.
- Do not add random `ScrollTrigger.refresh()` calls.
- Do not create DOM read/write loops inside scroll handlers.
- Keep animation ownership local and intentional.

## 5. Theme / Token Risk Rules

- Treat `nuxt/public/themes/light.css` and `nuxt/public/themes/dark.css` as active override layers.
- Do not clean, delete, or rewrite those theme files during normal feature work.
- Treat `nuxt/assets/styles/base/tokens.css` as the current token source.
- Do not perform token refactors unless the user explicitly asks for them.
- Do not rename tokens as part of unrelated work.

## 6. Tailwind Rule

- Do not add Tailwind to the project.
- Do not add Tailwind classes.
- Do not add Tailwind config.
- Do not add Tailwind dependencies.
- Do not propose Tailwind migration during normal work.
- Discuss Tailwind only if the user explicitly asks for a new component strategy or migration.

## 7. Reference Usage Rule

- Do not copy external references directly.
- Interpret references only in this format:
  - What we like.
  - How it translates to Kardoor.
  - What must not be copied.
- Do not directly transfer a reference's colors, fonts, layout identity, product language, or decorative tricks.
- Borrow discipline, hierarchy, rhythm, and restraint only.

## 8. Output Rule

- After changes, list only the files that changed.
- State the change scope clearly.
- Explicitly state that prohibited areas were not touched.
- If typecheck or tests were run, report the result.
- If typecheck or tests were not run, say they were not run.
- Do not imply verification that was not performed.
## 9. Verification Commands

Before reporting completion, run only the checks relevant to the changed files.

Default checks:
- For Vue, TypeScript, Nuxt, or composable changes: run `npm run typecheck`.
- For broad build-impacting changes: run the project build command only if the user asks or if the change touches configuration/routing.
- For documentation-only changes: no typecheck is required unless the user asks.

Rules:
- Do not claim a check passed unless it was actually run.
- If a check fails, report the failure and do not hide it.
- If a check was skipped, state why it was skipped.


## 10. Instruction Precedence

- Direct user instructions in the current task override this file.
- More specific nested `AGENTS.md` or `AGENTS.override.md` files override broader repository guidance for their own directory scope.
- If instructions conflict, stop and ask before editing.