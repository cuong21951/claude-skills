# Coding rules (distilled from Karpathy's CLAUDE.md; Ponytail covers simplicity/surgical-diff)

## Before coding
- State assumptions in one line. If two interpretations exist, name both — don't pick silently.
- If a simpler approach exists, say so before building the asked one.
- A boundary branch needs a citation. Before writing any handling for midnight/overnight,
  DST, leap, negative duration, rollover, empty/null: name the requirement line, the test
  that fails without it, or the real data row. No citation → don't write the branch; say
  the case is unhandled and move on. Enforcement: delete the branch and run the suite —
  nothing fails means it was speculation, and it ships as a bug for someone else's story.

## Verify, don't hope
- Turn the task into a check before writing code:
  "fix bug" → failing test that reproduces it, then make it pass.
  "add validation" → test the invalid inputs, then make them pass.
- For multi-step work, state the plan as `step → verify:` lines and loop until green.

## Write like the codebase (taste rules)
- Before writing, read a sibling file doing something similar and copy its idioms
  (naming, error handling, layering). Local consistency beats your preference.
- Minimal diff that solves the problem. Never refactor, rename, move files, or
  restructure modules unless explicitly asked. New code goes where similar code lives.
- Never change existing behavior or API contracts while adding a feature.
- No code comments. Naming and small functions carry the intent; a comment that
  restates what the line does is a rename you skipped. The only comments that ship
  are ones already in the file's style, and `ponytail:` markers — and in repos whose
  own taste doc bans comments outright, that ban wins.
- Edge case needing an `if`? First try restructuring so the edge case becomes the
  normal case (Linus's "good taste" rule).
- Data structures first: before writing logic, ask if a better-shaped structure
  deletes the logic.
- More than 3 levels of indentation = the function does too much. Extract.
- When a change alters a variable's meaning (local→UTC, unit, type), rename it in
  the same commit; never bridge with `var newName = oldName;` aliases to dodge
  the rename — the stale name misleads every later reader.
- Performance floor: no O(n²) on unbounded input, no I/O/queries/allocations inside
  hot loops. Beyond that, don't optimize without measuring.
- Generated files come from the generator, never by hand: migrations, scaffolds,
  lockfiles, codegen output. Even when the change is data-only and the hand-made
  file would compile, reviewers reject it and tooling drift bites later. If the
  GUI tool isn't available, find the underlying CLI (it always exists).
- Contract safety: a feature that extends a contract must update every canonical
  list that names it — doc overviews, enum unions, type definitions. Grep the docs
  for the old enumeration before calling it done.
- Reference-implementation checklist: when hand-rolling what a mature SDK's official
  components already do (a room UI, auth flows, players…), first extract the
  reference implementation's behavior list (their components/docs = solved-problem
  inventory) and diff yours against it. Every component they ship that you skip
  is a production bug you are scheduling.

Example — good taste (edge case eliminated):
  bad:  if (!prev) { head = node->next; } else { prev->next = node->next; }
  good: indirect = &head; while (*indirect != node) indirect = &(*indirect)->next;
        *indirect = node->next;   // one path, no special case
