# claude-skills

Claude Code skills and global instructions, portable across projects.

The skills hold procedure only. Whatever is specific to a project — its conventions, tools,
environments, review taste — is learned from that project by `init` and written into the
project's own docs and into the `## This project` block of each skill it installs.

Also here: `instructions/` (global `~/.claude` files: model routing, coding rules) and
`third-party.md` (skills I use but don't vendor).

## Skills

| Skill | What it does |
|---|---|
| `init` | Set up the agent harness in any project: investigate it (code host, tracker, connected tools, CI, review habits), ask only what cannot be found, scaffold skeleton docs, settings ask-gates and four enforcement hooks, then fill the docs and the project skills below from what the project itself shows. Replaces the built-in `/init`. |
| `pr` | Create a pull request following the project's own conventions, with the ticket linked and auto-merge left off. |
| `fix-comment` | Handle the review comments on your own PR: fix, push, reply and resolve; out-of-scope ones become a work item; each fixed comment is triaged into a scoped, generic ReviewTaste rule, a Playbook "Do NOT", or ticket notes. |
| `test` | Verify a change in every layer the project has — suites, API, UI, logs, stored data — and report each separately. |
| `deploy` | Build and deploy to an environment the way the project does it, then prove it landed. |
| `workitem` | Draft and create a bug or story in the shape the team's own items use. |
| `ticket` | Post the plan or the root cause and fix on a work item, in the team's shape. |
| `deep-review` | Whole-subsystem deep code review: reads the entire subsystem and the old version before judging the diff, sweeps call sites, multi-dimension finder agents with adversarial verification, reviews against what the ticket promised. |
| `check-noti` | Read-only Azure DevOps sweep of everything waiting on you: comments and votes on your PRs, review requests, @mentions in PRs, work items and wiki, process gaps, stale items — one prioritized list with links and the skill to handle each. |
| `investigate` | Structured bug/story investigation before any code is written. Produces root cause + minimal fix proposal, writes no code. |
| `taste-review` | Diff review for taste: pattern consistency, modularity, minimal-diff discipline, performance. Complements bug-focused review. |
| `myvoice` | Write messages in the user's own voice, learned from messages they actually wrote; asks which sources to learn from and how to read them. |
| `teach` | Teach a skill or concept inside the workspace, with learning records and glossaries. |
| `macro-brief` | Deep macro research (rates, FX, inflation, Vietnamese property) as a sourced Artifact report. |
| `explain` | Explain a fix/design/bug the Feynman way (one picture, tempting wrong fixes, honest section) in Vietnamese with Phạm Văn Thiều's prose voice, published as a chalkboard Artifact. `en` for English. |

## Install

```bash
git clone https://github.com/cuong21951/claude-skills ~/claude-skills
cp -r ~/claude-skills/init ~/.claude/skills/
```

Then run `/init` inside a project. It copies `pr`, `fix-comment`, `test`, `deploy`, `workitem`, `ticket`, `deep-review` and
`check-noti` into that project's `.claude/skills/` and fills them for it, and adds the Playwright MCP
server to the project's `.mcp.json` when the project has a web UI.

Any other skill, for all projects: `cp -r ~/claude-skills/<skill> ~/.claude/skills/`.
