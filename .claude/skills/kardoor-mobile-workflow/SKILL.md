---
name: kardoor-mobile-workflow
description: Run Kardoor mobile and responsive work as a section-at-a-time pipeline that finishes. Use for any phone, tablet, touch, swipe, pointer-coarse, responsive breakpoint, mobile-only component, mobile CSS, viewport, safe-area, or mobile performance task in this repository.
---

# Kardoor Mobile Workflow

Mobile is a finite list of sections, not an open-ended risk. This skill exists to
finish that list without disturbing desktop. Read `AGENTS.md` and
`docs/design/DESIGN.md`. Direct user instructions override this skill.

The pipeline is: **pick one row from the ledger → build it → prove it in a real
emulated device → hand the user one URL → move to the next row.** There is
exactly one human gate, at the end. Everything before it you decide yourself.

## Step 0 — Enter the pipeline

1. Read `LEDGER.md` in this skill directory. It is the source of truth for what
   is done, in progress, and unstarted. Do not reconstruct state from memory or
   from `git status` alone.
2. Run `git status --short` and reconcile: if the diff contradicts the ledger,
   the working tree wins — correct the ledger row before editing anything.
3. Pick **one** row. Prefer the row already `in-review`, otherwise the topmost
   `todo`. If the user named a section, that row wins.
4. Set the row to `in-progress` and state the target in one line.

Never work two rows at once. Never edit a row you are not on.

## Step 0.5 — The architecture (decided 2026-08-14)

**Full split.** Every home surface gets its own mobile component and stylesheet.
Mobile is a different product for a different input, not a narrower desktop.
See `DESIGN.md` §12 for the table of surfaces and the anti-drift rules — read
them before writing a mobile component, because a split only stays healthy if
copy, data, and primitives stay shared.

Two things are still **not** decided, and you must not invent them:

- **No root-level split and no device flag yet.** Mount each mobile component
  section by section, the way `HomeExperience.vue` already mounts
  `EntranceDoorMobile` inside `ClientOnly`. A single SSR-safe decision point is
  a separate task.
- **The entrance interaction model.** The user has said mobile should be
  swipe-driven with `ScrollTrigger` off; the current `EntranceDoorMobile.vue`
  uses a pinned scrub and the user perfected it in that form. Both are true.
  Do not resolve that by rewriting code.

The **interaction model is also open.** The user has stated that mobile should
be swipe-driven and that `ScrollTrigger` should be off on mobile. The current
`EntranceDoorMobile.vue` contradicts that — it builds a pinned scrub, and the
user perfected it in that form. Both facts are true. Do not resolve the
contradiction by rewriting code; it is resolved by the user, in words, first.

An agent that "cleans up" this inconsistency without being asked repeats the
most expensive mistake in this project's history.

## Step 1 — Standing decisions (do not re-litigate)

These are settled *given the structure that exists today*. They are not
permission to extend that structure — see Step 0.5.

- **Mobile test**: `window.innerWidth <= 1024 && matchMedia('(pointer: coarse)')`.
  Today this lives in `HomeExperience.vue` and `plugins/scroll.client.ts`. Do not
  invent a second breakpoint system and do not add a third copy of this test.
- **Ownership**: a `*Mobile.vue` owns presentation and gesture only. Data,
  copy, modal, theme, i18n and business logic stay in the shared composable or
  parent. Duplicating logic into a mobile file is a defect, not a shortcut.
- **Styles**: every mobile component gets exactly one stylesheet, named for the
  component and sitting next to its peers in `app/assets/styles/`. It stays
  scoped to that component and never leaks. Never add mobile rules to a desktop
  stylesheet, and when a section is migrated, delete its old `@media` rules in
  the same change.
- **Viewport units**: `100dvh` for full-height mobile surfaces. Not `vh`, and
  deliberately **not `svh`** — `svh` is the viewport *with* the address bar
  showing, so it under-measures once the bar retracts. `dvh` tracks the live
  viewport.
- **ACCEPTED MEANS FROZEN.** This is the rule that has been broken most and cost
  the most. A section the user accepted on their phone is finished. Do not
  re-architect it, do not "align it with desktop", do not convert its input
  model, do not refactor it while passing through on another task. The good
  prototype gets built, the user perfects it, and then a later pass rewrites it
  — that pattern ends here.

  Touching an accepted section requires the user to ask for it, in that session,
  by name. "It would be more consistent" is not a reason. If you believe an
  accepted section is wrong, say so in one sentence and leave the code alone.
- **No invented mobile design.** The reference for a mobile section is the
  desktop component measured at 390x844, not a new composition. Measure first
  (set the viewport with touch *off* so the desktop branch renders, read
  computed styles), then adapt only what the smaller interaction model forces.
- **Tokens**: `AGENTS.md` §4 applies unchanged. No new colors, fonts, radii,
  shadows, or spacing scales for mobile.

## Step 2 — Derive the file whitelist mechanically

For section `X`, the allowed set is fixed by the pattern — no scope approval
round trip is needed for these:

```text
app/components/<area>/XMobile.vue          the new or existing mobile component
app/assets/styles/sections/x-mobile.css    its stylesheet
<the single parent line that mounts it>    v-if branch only, nothing else
LEDGER.md                                  the row you are on
```

Anything outside that set is a **scope expansion**: stop, name the file and the
reason in one short paragraph, and ask. Especially these, which are never
auto-included: desktop components, `HomeExperience.vue`, `app.vue`, shared CSS,
`tokens.css`, `public/themes/*.css`, routing, `nuxt.config.ts`, and any file
already carrying someone else's uncommitted diff.

Preserve all pre-existing worktree changes. Never clean up a diff you did not
create. Never bulk-rewrite source with scripts or regex.

## Step 3 — Build, then prove it, without stopping

Work the whole section in one pass. Do not report interim progress and wait —
if verification fails, fix it and re-verify yourself. That loop is your job, not
a checkpoint.

Prefer the smallest path that reaches the acceptance criteria:

1. Fix the existing mobile-owned code.
2. Add a scoped responsive rule in the mobile stylesheet.
3. Split a new `*Mobile.vue` only when the interaction model genuinely differs
   — a gesture the desktop version does not have, or a layout that cannot be
   reached by responsive rules. Note the reason in the ledger row.

Verification is not optional and not negotiable: follow `VERIFY.md` in this
directory. Reading the source, or dispatching synthetic `TouchEvent` /
`PointerEvent`, does **not** count as evidence and has produced false "works"
reports in this repo before.

Then run the checks the change actually requires, and report their real exit
codes:

- Vue / TS / composable: `npm run typecheck` (from `nuxt/`).
- CSS: `npm run lint:css`.
- Ledger or docs only: no check.

Do not grep away failing output. A failed check is a result, not a setback.

## Step 4 — The one gate: phone acceptance

When the section passes `VERIFY.md` and its checks, stop and hand over:

```text
Section: <row name>
URL: <one exact URL, dev host reachable from the phone>
Check on your phone: <3-5 concrete observable things, no jargon>
Changed files: <literal paths>
Checks: <command → result>
```

Then wait. On acceptance: mark the row `done`, record the evidence line in the
ledger, and **continue to the next `todo` row on your own** — the user has
already authorized the sequence. On rejection: stay on the same row. Rejection
narrows the work; it never authorizes a wider rewrite.

Legacy code deletion and any "unify mobile and desktop" cleanup happen only
after acceptance, and only for the accepted section.

## Traps this repo has already paid for

Do not rediscover these.

- **Synthetic events lie.** Dispatched `TouchEvent`/`PointerEvent` bypass the
  real input path. Use CDP device emulation with real input.
- **`setPointerCapture` throws under synthetic pointers**, kills the handler
  mid-flight, and makes you report a bug that does not exist. Neutralize it in
  the harness via init script — never patch production code to satisfy a test.
- **`vh` and the address bar.** Full-height bugs of this class appear only on a
  real device or correct emulation. `dvh` is the fix, not a magic offset.
- **ScrollTrigger `isActive` lies at the very end of a pin.** It flips false on
  the last frame — exactly where the configure phase sits. Sync bands from
  `scrollY <= trigger.end + 2`, not from `onToggle`, or the user cannot pull
  back out.
- **Pinned elements are transformed**, so absolutely positioned layers must hang
  off the inner frame box, not the pinned root, or the door geometry shifts.
- **Theme rules scoped to the desktop root never reach mobile.** `showroom.css`
  binds every ambience rule to `.entrance-lab[data-ambience]`; the mobile tree
  has to carry its own `data-ambience` or it silently renders the wrong palette.
- **Thin-scrollbar rule**: setting `scrollbar-width`/`scrollbar-color` kills
  `::-webkit-scrollbar` entirely in Chrome. Pick one mechanism.
- **`virtual:public` HMR**: a static `public/` `src` in a template can 404 after
  HMR in dev. Use a `:src` binding.

## Stop conditions

Short list. These are the only ones that interrupt the pipeline:

- A file outside the derived whitelist is genuinely required.
- The component you assumed renders on mobile is not the one that actually does.
- Your edit would collide with someone else's uncommitted diff.
- Mobile correctness would require changing desktop behavior.
- Browser evidence contradicts your source-level diagnosis.

Everything else — a failing check, an ugly first attempt, an unclear CSS
cascade — you resolve inside Step 3 and keep going.
