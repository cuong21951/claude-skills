# Ticket Investigation Workspace

Use one folder per ticket:

```text
ticket-investigation/<ticket-id>/
  memory.md
  scripts/
  evidence/
  artifacts/
```

Rules:

- Do not ask for a ticket number. If the user gives one, the work is ticketed; otherwise continue without one.
- Before source investigation, search this folder for an existing ticket folder. Match exact folder names and suffix numbers, for example `445` can match `BUG-445`.
- Existing ticket: read `README.md`, `memory.md`, and other `*.md` notes in the ticket folder first.
- New ticket: create `memory.md`; create `scripts`, `evidence`, and `artifacts` only when needed.
- Keep generated scripts, screenshots, logs, HTML dumps, exported reports, and scratch data out of the project root.
- Do not store secrets, tokens, passwords, API keys, or full credential-bearing connection strings.
- A defect found and not fixed carries its disposition on the same line: the new work item id, `comment on #<ticket>`, or `ruled by <name> <date>`.
