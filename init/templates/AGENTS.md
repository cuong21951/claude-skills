# {{PROJECT_NAME}} Agent Entry

Short mandatory entrypoint for AI work in this project. Detail lives in the owned docs below. Read them by task, not all at startup.

## Mandatory Startup

- Do not ask for a ticket number. If the user gives one, the work is ticketed: search `ticket-investigation/` for an exact or suffix-number folder and read its `README.md`, `memory.md` and notes before source investigation. Otherwise assume no ticket and continue.
- Read this file. Then read only what the task in front of you needs:

| Doing | Read first |
| --- | --- |
| Answering or reading only | nothing more |
| Editing code | `Design.MD` section of the area touched; `ReviewTaste.MD` § Always + the § Hard rules by area group matching the diff |
| Adding a repeatable thing (endpoint, page, migration, command, business rule) | `Playbook.MD` recipe for that area, plus the row above |
| Reviewing a diff | `ReviewTaste.MD` § Always + matching area group |
| Git, commit, PR, ticket comment | `Rules.MD` § 3; the `pr`, `ticket`, `workitem` skills supersede it where they say so |
| Building or running tests | `Rules.MD` § 8, then the `test` skill |
| Touching ANY environment | `Test.MD` § Environment Matrix |
| Browser automation | `Test.MD` § Browser And Automation Traps, then the `test` skill |
| Claiming something is deployed, stale, covered or defective | `Rules.MD` § 9 Evidence Standard |
| Deploying | `Deploy.MD`, then the `deploy` skill |
| Finishing a change | `Rules.MD` § 11 Final Report Format |

## Doc Ownership

- `AGENTS.md`: startup gates and mandatory pointers only.
- `Rules.MD`: agent workflow, ticket/git rules, shell rules, secret handling, build/test/report requirements.
- `Design.MD`: generic architecture, runtime flow, auth, data, messaging and frontend design. No ticket-specific or behavior-specific detail — that lives in `ticket-investigation/<id>/memory.md`.
- `Test.MD`: the environment matrix (which host/branch/database is which), browser and automation traps, local URLs, login notes, expected messages, browser validation steps, and reusable test data.
- `ReviewTaste.MD`: reviewer preferences, code shape, naming/style taste, and recurring PR feedback.
- `Playbook.MD`: "how to add X" recipes — template file to copy, ordered steps, where logic goes, and do-not pitfalls for each repo or module.
- `Deploy.MD`: how a build reaches each environment — build and deploy systems, branch per environment, component order, and common deploy errors.
- `CLAUDE.md`: Claude entrypoint that imports this file; do not duplicate project rules there.

## Non-Negotiable Rules

- Capture ticket/behavior detail in the ticket `memory.md` (`ticket-investigation/<id>/memory.md`), not `Design.MD`. `Design.MD` is generic architecture only; update it only when that architecture actually changes.
- Follow `Design.MD` architecture and existing repo/module patterns; do not introduce new structure because it looks cleaner.
- Prefix shell commands with `rtk`.
- Keep generated ticket scripts, screenshots, logs, HTML dumps, exported reports, and scratch data inside the matching ticket folder, not in the project root.
- Keep non-secret credential context when useful, but never store or print raw passwords, client secrets, refresh tokens, bearer tokens, API keys, or full credential-bearing connection strings. Never echo any of them into evidence, commits, PR comments or work items.
- Use the private secret-memory files under `.agents/` when credentials are needed; reference paths, not secret values. `.agents/` is never committed.
<!-- init: ask the user which environments, if any, are pre-authorized for build and deploy without asking, and write it as one bullet. If they name none, write: "- No environment is pre-authorized for deploy; ask first." -->
- Push and PR creation only when asked (the `pr` skill is that ask).
- Build and test with the commands in `Rules.MD` § 8 and report verification/skipped checks in the final response.

<!-- init: tracker section. Heading `# <Tracker> (<org>, <project>)`, then the numbered facts an agent needs to call it correctly: the project/repo name to pass, team or label names, which MCP server or CLI to prefer, known tool quirks. Delete this marker if the project has no tracker. -->
