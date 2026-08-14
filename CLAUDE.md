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

## Mobile architecture — full split (decided 2026-08-14)

Every home surface gets its own mobile component and stylesheet. Mobile is a
different product for a different input, not a narrower desktop. `DESIGN.md` §12
holds the surface table and the anti-drift rules — copy, data, and shared
primitives never get duplicated into a mobile file.

Still not decided, do not invent: the root-level device decision (mount section
by section inside `ClientOnly`, as the entrance does) and the entrance
interaction model (swipe versus the pinned scrub currently shipping).
