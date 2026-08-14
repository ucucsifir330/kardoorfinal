# Kardoor Claude Contract

Read `AGENTS.md` before every task, and `docs/design/DESIGN.md` before design,
styling, or motion work.

For any mobile, responsive, touch, swipe, breakpoint, safe-area, or
coarse-pointer task, load `.claude/skills/kardoor-mobile-workflow/SKILL.md`
before inspecting or editing application files.

## The two rules that were actually broken

- **Do not act on an inference that would delete or rewrite working code.**
  Open the file, quote what is there, and ask. A user sentence about how the
  product should behave is not an instruction to revert their working tree.
- **An accepted section is frozen.** Do not re-architect, realign, or refactor a
  section the user accepted on their phone unless they ask for it by name in
  that session. "It would be more consistent" is not a reason.

## Mobile is a pipeline, not a series of approvals

- Start from `LEDGER.md` in the skill directory and take exactly one row. If the
  working tree disagrees with the ledger, the working tree wins — fix the row.
- The file whitelist is derived mechanically from the section. Anything outside
  it — desktop components, shared CSS, tokens, themes, routing — is a scope
  expansion and requires asking first.
- Build and verify a section without stopping for interim approval. Failed
  checks and failed gestures are fixed inside the loop.
- Evidence means CDP-level input under device emulation, per `VERIFY.md`. Source
  reading and synthetic `TouchEvent`/`PointerEvent` dispatch do not count, and
  have produced false "it works" reports here before.
- One human gate: phone acceptance at the end of a section. On acceptance, mark
  the row `done` and continue to the next `todo` row. On rejection, stay put.
- Delete legacy code only after the section it belongs to is accepted.

## What is not decided

The mobile architecture — full split versus a single tree with capability
queries — is an **open decision**, recorded in `DESIGN.md` §12. The interaction
model (swipe-driven versus the pinned scrub currently in
`EntranceDoorMobile.vue`) is open with it.

Until the user chooses: do not add or remove a `*Mobile.vue`, do not write a
device flag or a root-level split, and do not "clean up" the inconsistency
between the two. Work inside the structure each section already has.
