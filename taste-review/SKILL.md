---
name: taste-review
description: Review the current diff for taste — pattern consistency, modularity, minimal-diff discipline, and performance — the dimensions /code-review (bugs) and /ponytail-review (bloat) don't cover. Use when the user says "taste review", "/taste-review", "review the style", or "does this follow our patterns". Ends by proposing recurring findings as permanent coding rules.
---

# Taste review

Review the working diff (`git diff` + `git diff --staged`; fall back to the
branch diff vs default branch if the working tree is clean). Judge ONLY these
dimensions — bugs belong to /code-review, over-engineering to
/ponytail-review:

1. **Pattern consistency** — does new code copy the idioms of its sibling files
   (naming, error handling, layering, test style)? Flag anything that invents a
   new style where an established one exists. This is the #1 check.
2. **Structure preserved** — no files moved, no modules split/merged, no renames,
   no reorganization the user didn't ask for. Any unrequested restructuring is
   a finding, even if it's "better".
3. **Minimal diff** — every hunk must serve the stated task. Flag drive-by edits,
   unrelated cleanup, and speculative parameters/abstractions.
4. **Contract safety** — existing behavior, API shapes, and return values
   unchanged unless the task was to change them ("never break userspace").
5. **Performance floor** — O(n²) on unbounded input, I/O or queries inside loops,
   N+1 patterns, allocation in hot paths. Also: >3 indent levels or an edge-case
   `if` that restructuring would eliminate.
6. **Non-code surfaces** — CI and deploy config, build/packaging config, config
   transforms, migrations, lockfiles and dependency pins, IaC get all five checks
   above too. These are the files that drift worst, because reviewers skip them
   for "not being code".
7. **Reach beyond the repo** — does a changed public name or signature have
   consumers pinned at a floating version range (`^1.2`, `1.*`, `latest`)?
   They break at an unchanged commit and no diff anywhere shows it. Name them.

## Output

One line per finding: `file:line — [dimension] what's wrong → the fix`.
Ranked worst first. If clean, say "clean" — do not invent findings.

Close with one line naming the surfaces actually reviewed and any skipped (a
config or CI file not opened is not a reviewed file).

## Compound (always do this last)

After reporting, ask: "Would any of these findings recur in future tasks?"
For each recurring one, propose a one-line rule and offer to append it to
`~/.claude/coding-rules.md` under "Write like the codebase". A finding fixed
once is a fix; a finding turned into a rule never happens again.
