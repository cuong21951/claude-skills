# Global instructions

Files that live in `~/.claude/` and apply to every project.

| File | Purpose |
|---|---|
| `CLAUDE.md` | Entry file; imports the other three with `@file`. Copy to `~/.claude/CLAUDE.md`. |
| `model-routing.md` | Orchestration policy: which model rung (Haiku / Sonnet / Opus / main thread) does which work, effort selector, delegation reflexes. |
| `coding-rules.md` | Coding taste: state assumptions, verify before hoping, minimal diff, no comments, no speculative boundary branches, generated files from the generator. |
| `RTK.md` | Shell commands go through `rtk` (a PreToolUse hook rewrites them). Drop this file if you don't use rtk. |

Install: copy all four into `~/.claude/`. The `ponytail:` marker rule in
`coding-rules.md` assumes the ponytail plugin; harmless without it.
