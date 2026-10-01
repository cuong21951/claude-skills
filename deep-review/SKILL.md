---
name: deep-review
description: 'Whole-context deep review — reads the entire affected subsystem and its pre-change version before judging any diff, then reviews the surfaces a diff never shows: CI config and whether the tests actually run, migrations, build/deploy config, tracker state vs the code that state implies, consumers pinned at floating version ranges, and every path that bypasses a new cross-cutting layer. Sweeps call sites of every changed public member across the workspace, fans out multi-dimension finder agents with adversarial verification, proves candidate blockers with a real runtime check, and reviews the diff against what the ticket/issue actually promised. Use for large or risky PRs when the user says "deep review" or "/deep-review". Expensive by design — for routine diffs use /code-review instead.'
---

# Deep Review

Invoking this skill IS the user's opt-in to multi-agent orchestration for this review.

The unit under review is the **change in its whole context** — not the diff. Code
is one surface of it; CI config, migrations, build/deploy config, tracker state,
consumers pinned at floating version ranges, and whether the tests can even run
are the others. A finding that lives entirely outside the diff is still this
review's finding.

## Scale dial

State the tier in one line before starting, and size the fan-out to it:

- **PR** — one story, one repo. Phase 0 on the touched cluster only, the core
  dimensions, single finder round.
- **Epic/branch** — many stories, many repos. Full Phase 0 per repo, all
  dimensions, two finder rounds.

## Scope resolution

Argument = PR number, branch, or path. Resolve to: a local checkout,
`BASE = git merge-base HEAD origin/<target>`, and the touched-file list
`git diff --name-only BASE HEAD`.

Then pull the real requirement from the linked ticket/issue via this project's
tracker (GitHub issues, Jira MCP, Azure DevOps MCP — whatever is connected; the
review judges the code against what the story PROMISES, not just against itself):

- Get the issue key from the PR title/branch name or ask. Fetch the issue:
  summary, description, acceptance criteria, and ALL comments — decisions often
  live in comments, not the description.
- Walk up the parent chain (parent/epic link) and read the epic description —
  it usually states contract rules the whole epic must obey.
- List sibling stories under the same epic with their statuses; note which have
  open PRs on the same integration branch — precedent to reuse, collision risk
  to flag.
- Check dependency links (blocks / is blocked by): a finding that is really the
  dependency's job gets labeled that way instead of blocking this PR.
- **State vs code.** For every sibling already marked Done/Closed/Accepted, grep
  for the code that status implies. A story cannot be done if the files it must
  touch have no commits, or if only half of it exists (read path but no write
  path). This finds the highest-severity class of defect in the whole review —
  what the board says shipped and did not.
- Output: a short requirement summary (promised behavior, acceptance criteria,
  epic contract rules, sibling/PR map, state-vs-code mismatches). Every finder
  agent receives it.

## Prior-review ledger

Read every earlier deep-review report on this ticket/branch (project notes,
agent memory, past PR threads). Extract three lists and hand all three to every
finder agent:

- **Refuted** — do not re-report; re-litigating these is the main way a second
  round wastes its budget.
- **Confirmed still open** — re-verify against current code, do not re-derive.
- **Confirmed fixed since** — check the fix landed and did not regress anything.

Round N's report is scored on what it adds to round N-1, not on raw count.

## Phase 0 — Understand the whole subsystem (no verdicts here)

Before looking at any diff, fan out reader agents to read the affected subsystem
END-TO-END in its current state and return a subsystem map: data flow, who calls
whom, where key decisions happen, invariants the code relies on.

- Identify the subsystem from the touched files: the module cluster they belong
  to, the layers above and below it, and every consumer (other packages,
  services, frontends) that depends on the touched public surface.
- Readers read WHOLE FILES, not excerpts. One agent per cluster; merge the maps.
- Do not skip this phase because the diff "looks small" — cost = per-call ×
  frequency, and small diffs on shared paths are large changes.

## Phase 1 — Old vs new, per file

For EVERY touched file: read the entire new version, then the entire old version
(`git show BASE:<path>`). Produce a BEHAVIOR-delta list (what observable behavior
changed), not a text-delta list. Then open the CALL SITES of every changed public
member across the whole workspace, including downstream consumers. Judge each
delta from the callers' perspective.

## Phase 2 — Finder fan-out

Launch finder agents, one per dimension, each armed with the subsystem map +
behavior-delta list + requirement summary. Default dimensions (adapt to the change):

- **Correctness** — edge behavior: nulls/empty, time/timezone/date-boundary
  handling, concurrency/shared state, idempotency, transaction boundaries.
- **Contract compatibility** — stability of public contracts: serialized wire
  formats, API routes, persisted keys/schemas, package public APIs. Diff actual
  serialized output where in doubt.
- **Hot-path performance** — per-call cost × call frequency; hidden copies, N+1,
  per-item lookups a parameter could carry, allocations in loops.
- **Contract-layer completeness** — when the change adds a classification,
  registry, or enum: enumerate ALL members that need classifying; unclassified
  means silent default behavior.
- **Test adequacy** — for each behavior delta: which existing test fails if it
  regresses? If none, name the exact missing test. Then the harder half: **does
  that test actually run?** Open the CI config — a job with no test step, a test
  glob that misses the assembly, an untracked spec file, a skipped/`.only`
  block, or a continue-on-error flag means the green build proves nothing.
- **Non-code surfaces** — the change's other half, one agent for all of it: CI
  and deploy config, build/packaging config, environment and config transforms,
  dependency pins and lockfiles, migrations **including the down path**, feature
  flags, infrastructure-as-code.
- **Consumer skew** — who consumes the changed package at a **floating**
  version range (`^1.2`, `1.*`, `latest`)? A rename or signature change breaks
  them at an unchanged commit, and no diff anywhere shows it. Name each floating
  consumer and whether it still builds against the new shape.
- **Bypass sweep** — for any new cross-cutting layer (converter, serializer,
  filter, interceptor, middleware): enumerate every path reaching the same data
  and mark which ones do NOT go through it. The layer is only as good as its
  least-covered path — alternate serializers, webhooks, exports, background
  jobs and templating engines are the usual escapees.
- **Scope** — does the diff deliver every acceptance criterion, and nothing
  beyond scope?

Findings must carry file:line + a concrete failure scenario (inputs/state →
wrong output). No style nitpicks; pre-existing issues labeled separately.

Epic tier: run a second round after deduping against round 1, aimed only at
surfaces round 1 never opened. Stop when a round adds nothing new.

## Phase 3 — Adversarial verification

Every finding gets an independent refuter agent with full-file context whose job
is to KILL it (wrong reading, guarded elsewhere, unreachable, intentional per
the requirement).

A refuter must produce evidence, not a shrug. Three outcomes only:

- **REFUTED** — with the file:line or requirement line that makes it wrong. Dropped.
- **CONFIRMED** — the failure scenario holds on a full read.
- **UNPROVEN** — cannot be settled statically. Goes to Phase 3.5, never silently
  dropped. For a review whose whole job is finding bugs, a shrug that discards a
  real defect is the more expensive error.

## Phase 3.5 — Prove it

Static reading produces plausible bugs; the review's value is the ones you can
demonstrate. For every candidate blocker and every UNPROVEN finding, name and run
the **cheapest** real check: call the endpoint and read the actual status/body,
query the datastore for the row the theory predicts, run the single test that
must fail if the finding is real, read the CI log rather than the CI config's
intent, or reproduce the user-visible symptom.

Label every reported finding **CONFIRMED** (demonstrated) or **PLAUSIBLE**
(read-only), and for each PLAUSIBLE one give the exact command or query that
would settle it. Never present an unrun check as a result. Read-only checks only
— no state-changing calls without confirmation.

## Phase 3.6 — Read the diff yourself

Agents summarise; semantic bugs hide in what a summary drops. Before writing the
report, the main thread reads the actual diff end to end and adds what the
fan-out missed.

## Phase 4 — Reviewer-taste lens

If the project has a review-conventions/taste doc, apply it to the final diff.
Optionally sweep the human reviewer's past PR comments to predict what they will
flag next, and pre-empt those before they become findings. If no taste doc
exists, create one and seed it with this review's durable lessons.

## Report

Write it to the ticket's notes as `deep-review-<YYYY-MM-DD>.md` and summarise in
chat. Sections, in order: **Verdict · Blockers · Should fix · Intentional
behaviour, confirmed · Coverage · Not verified · Pre-existing · Durable lessons**.

Ranked: correctness > data loss/security > compat > hot-path perf > style.
Each finding: file:line, CONFIRMED/PLAUSIBLE, one-sentence defect, concrete
failure scenario, suggested minimal fix, and — on a second round — new /
still-open / fixed-since.

**Coverage** is a table, not a sentence: one row per surface (each repo, CI
config, migrations, build/deploy config, consumers, tests), marked read / proved
/ not covered + why. An unlisted surface reads as "reviewed" when it wasn't;
state what the review could not see. A count of findings is not coverage.

## Memory write-back

- New durable review-taste rules → the project's taste doc.
- Ticket-specific findings/verdicts → the ticket's notes.
- Cross-session facts worth remembering → agent memory per its rules.

## Guardrails

- No push, no PR comments, no reviewer-list changes without explicit user
  confirmation. Findings are reported to the user, not posted.
- Do not modify the code under review unless asked.
