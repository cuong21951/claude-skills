---
name: init
description: Set up the agent harness in the current project by investigating the project first, asking only what investigation cannot answer, and filling every doc from what was learned — detect the code host, ticket tracker, connected MCP servers and CLIs, CI and review habits; scaffold the AGENTS.md router and CLAUDE.md stub, the owned docs (Rules, Design, Test, ReviewTaste, Playbook, Deploy) as skeletons, .claude settings with tracker-write ask-gates and four enforcement hooks (push gate, ticket reminder, no code comments, deferred findings), the project skills, ticket-investigation/ and the private .agents/ folder; then read the code, repo docs, git history, PR review comments and CI config and write each doc from them. Use whenever the user says "/init", "init", "init this project", "set up the harness", "apply my harness", "bootstrap this repo", "khởi tạo project", "áp harness vào project này", "setup harness", or starts work in a project that has no AGENTS.md. Replaces the built-in /init. Never overwrites an existing file; safe to re-run.
argument-hint: "[check]"
---

# Init

Invoking this skill IS the user's opt-in to subagent delegation for the investigation and
learning phases. It is not an opt-in to commit, push, or write to any tracker.

Two rules shape everything below:

- **Structure is given, content is learned.** The templates carry headings, the few rules the
  hooks and the router depend on, and a marker for every gap. Everything a doc says about this
  project comes from this project. Nothing is carried over from another one.
- **Investigate, then ask, then build.** Every project is wired differently. Find out how this
  one works before choosing anything, ask the user only what no command can answer, and fit the
  harness to what was found rather than the project to the harness.

Already global, so never duplicated here: `~/.claude/CLAUDE.md` with its rule imports, the rtk
rewrite hook, the status line, user-level skills, auto-memory.

Argument `check` runs § 6 only.

## 0. Preflight — never skip

- Work from the project root. In a git repo that is `git rev-parse --show-toplevel`; a folder that
  only holds child repos is an umbrella and is its own root.
- Git Bash must be present (`bash --version`): all four hooks are bash. Missing → stop and say so.
- `~/claude-skills` must exist: the project skills are copied from it, never from another
  project's `.claude/skills`, which carry that project's facts. Missing →
  `gh repo clone cuong21951/claude-skills ~/claude-skills`.
- If `AGENTS.md` already has `## Mandatory Startup`, this is a re-run: say so and continue. The
  scaffold only fills gaps.

## 1. Investigate — before asking anything

| Find out | How |
| --- | --- |
| Repo shape | `git rev-parse --show-toplevel`; child folders with their own `.git` |
| Who else pushes here | Remote owner against `gh api user -q .login`; `git shortlog -sn` |
| Code host | `git remote -v`: GitHub, Azure DevOps, GitLab, Bitbucket, self-hosted |
| Ticket tracker | It can differ from the code host. Read ids in `git log --oneline -200` and branch names (`ABC-123`, `#123`, `AB#123`), links in the README and the PR template |
| Shape of a ticket id | The same history. The pattern comes from real ids, not from a guess |
| Connected tools | `claude mcp list` and the MCP tools this session exposes; CLIs and whether they are logged in: `gh auth status`, `az account show`, `glab auth status`, a Jira or Linear CLI |
| CI and deploy | Workflow and pipeline files, hosting config, env examples |
| Languages and comment habit | `git ls-files` by extension; how many comment lines the 20 most recently changed source files carry |
| Rule files already present | `AGENTS.md`, `CLAUDE.md`, editor or other-agent rule files, a contributing guide |
| Review habit | Whether merged PRs carry human review comments, and where reviews happen |

**Access ladder.** For each thing the harness must reach — tickets, PR review comments,
pipelines — take the first rung that answers a real read-only probe:

1. An MCP server already connected for it.
2. A CLI that is installed and logged in.
3. The service's REST API with a token the user keeps in `.agents/`.
4. The browser, on the user's logged-in session.
5. The user exports or pastes it.

A rung counts only after the probe returned data: one PR's comments, one ticket. The rung chosen
per capability is written into `Rules.MD` § 4. If no rung works, that is a question for § 2 —
never a reason to skip the doc in silence.

## 2. Ask — only what investigation left open

One round, at most four questions, each with concrete options built from what § 1 found and the
recommended one first. Never ask what a command can answer. If nothing is open, ask nothing.

| Ask when | Question | Options come from |
| --- | --- | --- |
| Other people push to the repo, or ownership is unclear | Should the harness files be committed, or stay local to this machine? | § 3 harness modes; recommend `local` |
| A tracker is in use and no rung reaches it | How should tickets be read and written? | Connect an MCP server (give the `claude mcp add` command), use a CLI, use the browser, or work without the tracker |
| History shows no ticket ids, or several styles | How are tickets referenced here? | The id styles found, with an example of each |
| No review comments were reachable | Where does review feedback live, and whose reviews set the standard? | The reviewers found in history; another tool; none yet |
| The code already carries many comments | The harness blocks new code comments. Keep that here? | Keep, exempt the existing doc-comment style, or turn it off for this project |
| Deploy config exists | Which environments may be deployed without asking? | The environments found; recommend none |
| Rule files already exist | Which one is authoritative, and may the harness entry be merged into it? | The files found |

Put each answer where it belongs — `AGENTS.md`, `Rules.MD`, `harness.conf` — not in memory.

## 3. Scaffold

Write the findings and answers to `ticket-investigation/_init/init.json`, then run:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scaffold.mjs" --dir "<root>" --config "<root>/ticket-investigation/_init/init.json"
```

The config is the record of what was decided and why the harness looks the way it does. Regexes
and permission rules go in the file, never on the command line — a shell mangles `|` and `(`.

```json
{
  "name": "<project name>",
  "mode": "tracked",
  "tracker": "github",
  "skills": "pr,test,deploy,workitem,deep-review"
}
```

**Mode** decides who sees the harness files:

| Mode | When | Effect |
| --- | --- | --- |
| `tracked` | The user's own repo | Harness files are committable. `.gitignore` gets `.agents/`, `.claude/settings.local.json`, `ticket-investigation/`; `.gitattributes` pins the hook scripts to LF. Hooks and permissions go in `.claude/settings.json`. |
| `local` | A team or client repo | Nothing shows in a teammate's `git status`: every harness path goes in `.git/info/exclude`, and hooks and permissions go in `.claude/settings.local.json`. |
| `none` | Not a git repo | No ignore file. Chosen automatically. |

**Config keys follow the findings:**

| Finding | Keys |
| --- | --- |
| Azure DevOps reached through MCP | `"tracker": "ado"`, `"ado-servers": "<server names>"` |
| GitHub reached through `gh` | `"tracker": "github"` |
| Any other tracker (Jira, Linear, GitLab, …) | `"tracker": "none"`, then `ticket-mention`, `ticket-id`, `ticket-sample`, `disposition` built from the real ids, and `ask`: one rule per write tool or CLI verb found |
| No tracker | `"tracker": "none"`, and drop `workitem` from `skills` |
| No deploy pipeline | Drop `deploy` from `skills` |
| The user turned the comment ban off | `"slash-exts": ""`, `"hash-exts": ""` |
| Comment-ban extensions | Detected from `git ls-files`; set `slash-exts` / `hash-exts` only to override |

A tracker with keys such as `SHOP-4242`:

```json
{
  "tracker": "none",
  "ticket-mention": "(SHOP|OPS)-[0-9]+",
  "ticket-id": "(SHOP|OPS)-[0-9]+",
  "ticket-sample": "SHOP-4242",
  "disposition": "(SHOP|OPS)-[0-9]+|ruled|filed",
  "ask": ["mcp__<server>__<write tool>", "Bash(<cli> <write verb>:*)"]
}
```

The session may run without permission prompts, so a tracker write that is not in an `ask` rule
runs unasked. Take the write tool names from the connected server's own tool list and gate each.

Output lines: `write` created from the template, `keep` already existed and was left alone,
`merged` missing entries added. A `keep` on `AGENTS.md` or `CLAUDE.md` means the project had one:
the existing file wins, and what happens to the harness entry is the § 2 answer.

## 4. Learn the project, then fill

Every gap is a `<!-- init: … -->` marker naming what to learn and what shape to write. Sources,
in order of authority:

| Source | What it teaches | Feeds |
| --- | --- | --- |
| The code | Architecture, layering, the pattern each repeatable thing follows, error and naming idioms | `Design.MD`, `Playbook.MD`, `Rules.MD` § 6 § 7 |
| Docs already in the repo | What the team wrote down | All |
| Git history | Branch naming, commit format, merge strategy, files that change together | `Rules.MD` § 3, `Playbook.MD` |
| Review history | What reviewers reject and why | `ReviewTaste.MD` |
| CI and deploy config | Build and test commands, what is gated, environments, deploy order | `Rules.MD` § 8 § 9, `Test.MD`, `Deploy.MD` |
| The user's § 2 answers | What no source shows | `AGENTS.md`, `Rules.MD` § 4 |

**Review sweep.** Through the rung chosen in § 1, collect the human review comments on the last
100 merged PRs (skip bots and the author's own replies) into
`ticket-investigation/_init/review-sweep.md`, one line each: PR, reviewer, file, comment. Group
them by what the reviewer objected to. A finding seen in two or more PRs becomes a rule in
`ReviewTaste.MD`, worded as the reviewer worded it, with its PRs under `## Precedents`. A finding
seen once stays in the sweep file. No reachable review history → `Not established yet.`

**Project skills.** Each copied skill is procedure only and has a `## This project` block with a
marker. Fill it in the same pass, from probes that worked and from the docs just written:

| Skill | Its block holds |
| --- | --- |
| `pr` | The exact code-host calls: read a ticket, create a PR with the ticket linked, add reviewers, read it back |
| `test` | The layers this project has, how each is run or reached, what a pass looks like |
| `deploy` | The exact CI calls: queue a build, queue a deploy, read a run's status and resolved version |
| `workitem` | The shape of the team's recent bugs and stories, required fields, the create and link calls |

Fan out one subagent per doc or skill, all in one message; route by `~/.claude/model-routing.md`.
Each brief carries the file path, the sources that feed it, the access rung to use, "edit only
this file", and these rules:

- A marker is replaced by what a source shows; the `file:line`, commit or PR goes in the agent's
  report, not in the doc.
- What no source shows is the literal line `Not established yet.` Under a table header, leave the
  table empty and put that line below it. A thin true doc beats a full invented one.
- A best practice the project does not actually follow is not written down as its rule.

Then check what came back: for each doc open two of the cited sources and confirm the claim. A
doc whose citations do not hold goes back to its agent.

## 5. Fit the hooks to the project

- `.claude/hooks/harness.conf` holds every project-specific value the hooks use. Re-read it
  against the findings: `SLASH_EXTS` / `HASH_EXTS` are where new comments are blocked, `PRAGMA`
  lists comment-shaped lines that are allowed (add the project's existing doc-comment opener
  when the § 2 answer was to exempt it), `TICKET_MENTION` decides which prompt text creates a
  ticket folder.
- A user-level skill beats a project skill of the same name. If `~/.claude/skills/` holds a skill
  written for one specific project, say which one before the user relies on it here.

## 6. Verify — loop until green

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scaffold.mjs" --dir "<root>" --check
```

It checks every harness file exists, the hooks are wired, `.agents/` is ignored by git, no marker
or `{{token}}` is left, and it runs each hook against a sample payload in a temp directory: a
push the prompt did not ask for is blocked, a comment in a covered file is blocked, a deferral
with no disposition is blocked, the project's sample ticket id creates its folder and ordinary
numbers do not. A `FAIL` line is fixed, not explained away. `Harness is in place.` is the only
passing result.

## Report

- What was found: code host, tracker, the access rung per capability, mode.
- What was asked and what the user answered.
- Files written, files kept.
- Per doc and per skill: what was learned and from which source; which sections are `Not established yet.`
- Review sweep: PRs read, comments collected, rules that came out of it.
- `--check` result, quoted.
- Nothing was committed. In `tracked` mode, list the files that are ready to commit.

## Guardrails

- Never overwrite, never delete. A wrong template is fixed in this skill, not by replacing a project file.
- No commit, no push, no tracker write. Probes and the review sweep only read.
- Do not connect an MCP server, log a CLI in, or store a token yourself; give the user the command.
- `.agents/` is ignored before anything is put in it. No credential goes in a doc, a skill or a hook.
- Nothing is copied in from another project: no rule, example, hostname or name. If a doc
  sentence cannot be traced to this project or to the user, it does not belong in the doc.
- Do not seed project memory. It fills from real work.
- Templates stay skeletons. A change in `${CLAUDE_SKILL_DIR}/templates/` adds structure or a
  better marker, never project knowledge.
