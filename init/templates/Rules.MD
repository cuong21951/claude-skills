# {{PROJECT_NAME}} Agent Rules

These rules apply to AI coding work in this project. Keep this file for mandatory workflow and operating rules only. Architecture belongs in `Design.MD`, local validation data in `Test.MD`, and reviewer preferences in `ReviewTaste.MD`.

## 1. Design Reference And Ticket Memory

- `Design.MD` is generic architecture only. Ticket and behavior detail — intended behavior, decisions, verification notes — goes in `ticket-investigation/<id>/memory.md`.
- Do not gate implementation on a `Design.MD` edit. Update it only when the architecture actually changes.

## 2. Mandatory Context

- Startup gates — which doc to read before which activity — are owned by `AGENTS.md` § Mandatory Startup. Do not restate them here; a second copy drifts.

<!-- init: What must be read before changing or building here: which README, task or build definition files exist, and which repos or modules a typical change crosses. One bullet each, with paths. -->

## 3. Ticket And Git Workflow

- Do not ask for a ticket number. If the user gives one, the work is ticketed; otherwise continue without one.
- Ticketed work: find or create `ticket-investigation/<id>/`, read its `memory.md` and notes before source investigation, and keep every generated script, screenshot, log and scratch file inside it, not in the project root.
- Commit finished work locally, then stop and report. Do not push and do not create a PR until the user asks; invoking the `pr` skill is that ask.
- Do not revert or overwrite the user's changes unless asked.

<!-- init: Learn this project's git conventions from `git branch -r`, `git log -50` and the last 20 merged PRs: integration branch, branch naming, commit message format (title only or with body, prefixes, trailers), PR title and description convention, required reviewers, merge strategy, how a ticket is linked. Write each as a rule backed by what the history shows. -->

## 4. Shell Commands

- Prefix shell commands with `rtk`.

<!-- init: Tracker and CI tool order for this project: which MCP server or CLI to try first, which is the last resort, and any known scope or auth trap, read from the configured MCP servers, the installed CLIs and the remote host. Delete this marker if the project has no tracker. -->

## 5. Secret Handling

- Never put a secret in docs, notes, commits, PR descriptions, logs, screenshots, evidence or final answers.
- Credentials live only in private files under `.agents/`. Reference the path, never the value.
- Data you only read can still carry a secret: scrub logs, query results and screenshots before attaching them.

<!-- init: Where this project keeps secrets (env files, secret store, CI variables) and what must be true before connecting to a non-local environment (VPN, allow-listed IP). Names and locations only, never values. -->

## 6. Follow Design Architecture

Before planning or implementing, find how {{PROJECT_NAME}} already solves the same kind of problem and match that shape (`Design.MD`, `Playbook.MD`).

<!-- init: The structural rules this codebase follows, learned from the code: layer boundaries, dependency direction, where shared code lives, what must not be bypassed. One bullet each, naming a file that shows it. -->

## 7. Coding Rules

<!-- init: Project-specific coding rules, learned from the linter and formatter config, the contributing guide and the dominant idioms in the code: error handling, naming, language of identifiers and messages, test style. One bullet each with its source. Do not restate what a linter already enforces. -->

## 8. Build And Test

<!-- init: The exact build, test, lint and format commands per repo or module, taken from the task runner, package scripts and CI config, one bullet each as "- <module> <build|test|lint|format>: `<command>`", then one bullet naming which file is the build source of truth and any non-default prerequisite. -->

- Report skipped verification with the exact reason.

<!-- init: Every repo or branch whose PRs get no CI validation, and every pipeline with no test step, read from the CI config and branch rules. One bullet each; write "none found" if every path is gated. -->

## 9. Evidence Standard

A claim about what is deployed, what is running, what is covered, or what is broken must rest on evidence that could have come back negative. If the check that would have falsified the claim was not run, say the claim is unverified rather than reporting it as a finding.

<!-- init: How each kind of claim is proven in this project: the command or request that shows which version is actually running, and the runner output that shows which tests actually executed and how many. One bullet each. -->

## 10. Memory And Docs

- Save reusable knowledge into the doc that owns it. Which doc owns what is listed once, in `AGENTS.md` § Doc Ownership.
- Ticket-specific findings, scripts and evidence stay in the ticket folder.

## 11. Final Report Format

When finishing a change, report:

- Memory/docs updated.
- Files changed.
- Verification run.
- Verification skipped and why.
- Risks or follow-up checks.
- **Found, not fixed** — every defect proven during this work and left unfixed, one line each, with its disposition: the new work item id, `comment on #<ticket>`, or `ruled by <name> <date>`. "Flag separately" and "follow-up ticket" are not dispositions. If the list is empty, say so.
