---
name: investigate
description: Structured investigation of a bug, issue, or story before any code is written. Use whenever the user says "investigate", "look into", "debug this", "why does X happen", "check this issue/story", or asks to analyze a ticket before implementing. Produces root cause + minimal fix proposal; writes NO code.
---

# Investigate

You are investigating, not fixing. The deliverable is a findings report. Do not
edit code unless the user asks afterward.

## Steps

1. **Reproduce first.** Confirm the issue actually happens (failing test, log
   evidence, or observed behavior) before theorizing. If you can't reproduce,
   say so and stop — don't propose fixes for unconfirmed bugs.

2. **Is this a common/known issue?** Search the web and the library's issue
   tracker for the error message or symptom. If thousands of people hit this,
   there is an established fix — prefer it over inventing one. Report what the
   community/best practice says.

3. **Find the existing pattern.** How does THIS codebase already handle similar
   cases? (Same error type, same layer, sibling feature.) The fix must follow
   that pattern, not introduce a new one.

4. **Root cause, not symptom.** Trace to the actual cause. A null check at the
   crash site is a symptom patch; find where the null was born.

   The cause is often not in the code. Before concluding, check the surfaces a
   diff never shows: config and environment differences, a migration that never
   ran, a feature flag, a dependency resolved through a
   floating version range (`^1.2`, `1.*`) that moved under an unchanged
   commit, a CI job that never ran the test that would have caught it, or a
   deployed artifact older than the source you are reading. **Confirm the code
   you are reading is the code that is running.**

5. **Was this supposed to be fixed already?** If a previous ticket or PR claims
   to fix this, verify the fix is present both in the branch AND in the artifact
   the failing environment is running. A story marked Done whose code never
   landed — or landed on a branch this environment doesn't have — is itself a
   root cause, and the fix is a deploy, not a patch.

6. **Propose the minimal change.** Smallest diff that fixes the root cause,
   located where similar code already lives, with acceptable performance
   (no O(n²) on unbounded input, no I/O in loops). If a bigger refactor would
   be "nicer", mention it in one line — but propose the minimal one.

7. **Say how it gets verified.** Name the cheapest check that fails if the fix is
   wrong, and which layers it has to cover (unit / api / integration / browser /
   automation). If the project has a `test` skill, use its modes and runners —
   don't invent a plan it already describes. Plan only; running it is the user's
   call after they approve the fix.

## Report format

- **Issue**: one sentence, confirmed how (repro evidence).
- **Common issue?**: yes/no + what the standard fix is (with source link).
- **Root cause**: file:line + the causal chain in 2-3 sentences, labeled
  **CONFIRMED** (demonstrated — repro, log line, query result) or **PLAUSIBLE**
  (read-only). For PLAUSIBLE, give the exact command or query that settles it.
  Never present an unrun check as a result.
- **Existing pattern**: how the codebase handles similar cases, which the fix will follow.
- **Proposed minimal fix**: what changes, estimated diff size, perf note.
- **Explicitly NOT touching**: structure/modules that stay as-is.
- **Verification plan**: mode(s) + the specific case(s), one line each. Mark any
  mode that can't run here (env down, suite not cloned) instead of silently
  dropping it.

Then stop. Wait for the user to approve before implementing — the verification
plan runs only if they say so.

For heavy code-scanning (tracing across many files), delegate to cheap
subagents per model-routing rules; keep the synthesis on the main thread.
