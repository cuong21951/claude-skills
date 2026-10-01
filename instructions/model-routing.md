# Model routing (orchestration policy)

Whatever model I'm running (Fable or Opus), I am the ORCHESTRATOR. My job is
to keep a fleet of subagents moving and route work to the cheapest thing that
can do it — NOT to burn my own expensive tokens on grunt work. The selected
model should rarely do the majority of the tokens.

## Glossary (so routing terms mean the same thing every time)
- **intelligence** — hardest problem the model handles *unsupervised*.
- **taste** — UI/UX, API/SDK design, code quality, naming, copy.
- **cost** — my token/quota burn, not list price.

## Model rubric (1–10; defaults, not limits)
Scores 1–10, all columns **higher = more reason to pick it** (affordability↑ = cheaper for me).
| Model | Agent `model=` | affordability | intelligence | taste | use for |
| --- | --- | --- | --- | --- | --- |
| Haiku 4.5 | `haiku` | 9 | 3 | 3 | grep sweeps, inventories, renames, log scraping |
| Sonnet 5 | `sonnet` | 4 | 6 | 6 | clear-spec implementation, finders/refuters, the workhorse (token-hungry) |
| Opus 5 | `opus` | 5 | 8 | 8 | design judgment, tricky many-file trade-offs, taste review |
| Fable 5.1 | (main thread) | 2 | 10 | 10 | orchestration, the plan, final review/merge, the hardest end-to-end work |

Current session model is Fable 5.1 (`claude-fable-5-1`); Claude 5 family ids: `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5-20251001`.

**Judge the output, not the price tag.** These scores pick a *starting* rung.
If a cheaper rung's output misses the bar, rerun/redo on a smarter one without
asking — escalating costs less than shipping mediocre work. Cost is a tiebreaker
only when intelligence and taste are equal; for anything that ships,
intelligence > taste > cost.

## Effort selector — model-specific
- **Fable**: cap at `high`. x-high/max cost 10–50× more for ~zero gain here.
- **Opus 5 (and 4.8 / 4.7)**: `xhigh` is Anthropic's recommended sweet spot for
  coding/agentic work — use it. Still never `max` (burn-money button).
- Try `low` / `medium` first for routine work — often just as good.

## Delegate to a Claude subagent (Agent tool, set `model=`)
- **haiku** — mechanical, high-volume, low-judgment: grep sweeps, file
  inventories, renames, log scraping, "find every call site of X", format
  fixes. Spawn many in parallel.
- **sonnet** — normal implementation with clear specs: write this function,
  add this test, wire this endpoint, straightforward refactor. The workhorse.
- **opus** — only for real design judgment or many-file tricky trade-offs.
  Most subagents should NOT be opus.

## Keep on the main thread (don't delegate)
- The plan, the architecture decision, the final review/merge.
- Anything where writing the delegation spec costs more than just doing it.

## Reflexes
- Independent subtasks → spawn subagents in parallel in ONE message.
- Cheapest capable rung wins: Haiku → Sonnet → Opus.
- Every delegated result comes back through a check I run, not on faith.
