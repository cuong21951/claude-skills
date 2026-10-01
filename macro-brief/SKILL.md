---
name: macro-brief
description: 'Deep macro research producing a sourced, forecast-bearing report as an Artifact — inflation, central bank policy, rates, FX, sovereign bonds, commodities, trade, Vietnamese property, and the politics that move them. Use whenever the user asks about the macro picture, "tình hình vĩ mô", "lạm phát", "Fed sắp tới thế nào", "dự báo lãi suất", "dự báo tỷ giá", "lãi suất liên ngân hàng", "kinh tế Mỹ/thế giới/Việt Nam", "check tình hình kinh tế", inflation/CPI/PCE, FOMC or ECB/BoJ/SBV decisions, yield curves, USD/VND or DXY, oil or gold, tariffs and trade policy — and equally for the Vietnamese property market: "bất động sản", "giá nhà", "giá chung cư", "thị trường BĐS Hà Nội / TP HCM", "dự án mới mở bán", "có nên mua nhà lúc này", "tâm lý thị trường", housing supply, absorption or rental yields. Not for valuing one specific listing, and not personal financial advice.'
---

# Macro brief

A macro report is worth reading only if a reader can act on it. That means every
number carries a date and a source, every forecast carries a probability and a
trigger, and every gap in the evidence is named out loud.

**You cannot answer macro from memory.** Your knowledge cutoff is behind the
present, and macro is the one domain where a six-month-old fact is a wrong fact.
Central bank chairs change. Wars start. Court rulings void tariff regimes. Search
before you assert — every single time, including facts you feel certain about.

## 1. Anchor the present before anything else

Run these first, on the main thread, before delegating anything. They set the
frame that all other research hangs on, and they routinely overturn priors:

- Today's date (`date`) — then search the *current month*, not a generic query.
- The policy rate and the last decision of the central bank in question, plus
  **who currently chairs it**.
- The most recent inflation print, and the date the next one lands.
- Whether a dominant shock is running (war, energy, credit event, election,
  court ruling). If one is, it is the spine of the report — find it now, not in
  section 9.

If any anchor contradicts what you assumed, stop and re-plan. A report built on
a stale policy rate is worthless no matter how good the prose.

## 2. Fan out, then keep the spine

Delegate breadth, keep judgment. Launch 4–6 subagents **in one message**
(`model: sonnet` is right for this; it is search-and-summarize work), each on one
domain, each told to return numbers with dates and URLs and to *flag explicitly
what it could not verify*. Meanwhile run the core inflation and central bank
searches yourself, because those decide the report's argument.

Typical split — adjust to the question:

| Agent | Owns |
|---|---|
| A | Home-country real economy: labour, GDP, consumer, housing |
| B | Fiscal & sovereign bonds: deficit, issuance, curve, debt service |
| C | Global ex-home: other central banks, China, growth forecasts, commodities |
| D | The user's own market (Vietnam by default): growth, CPI, policy rates, credit, interbank, FX, reserves, equities |
| E | Politics & trade policy: elections, tariffs, court rulings, bilateral relations |
| F | The dominant shock, if one exists |
| G | **Vietnamese property — Hà Nội and TP HCM, always its own agent** (see below) |

Keep on the main thread: inflation anatomy, the central bank reaction function,
the causal chain, every forecast, and the artifact.

### Agent G — Vietnamese property, Hà Nội and TP HCM

Property is not a side topic in a Vietnam macro report. It is roughly a quarter
of system credit, it is where household wealth sits, and it is the transmission
channel most people actually feel. Give it its own agent and ask for all four:

1. **Prices, split by market.** Never quote one blended "giá nhà" number.
   Primary (sơ cấp — developer sale) and secondary (thứ cấp — resale) diverge
   sharply and often move in opposite directions; blending them is the standard
   error in Vietnamese property coverage. Get giá/m² for each, for **Hà Nội and
   TP HCM separately** — the two cities have decoupled and averaging them
   destroys the story. Break out apartment vs landed vs land plot (đất nền).
2. **Supply and absorption.** New launches (nguồn cung mở bán mới), units sold,
   **tỷ lệ hấp thụ**, inventory (tồn kho), and how long a unit takes to sell.
   Absorption is the honest demand indicator; asking price is not.
3. **Projects, old and new.** Which large projects launched this cycle and at
   what price; which older projects are re-selling above or below launch price;
   which are stuck on legal approval (vướng pháp lý, chưa có sổ). Name specific
   projects with their district — a report that says "Hanoi apartments rose" and
   never names a project has not done the work.
4. **Buyer and seller sentiment — as proxies, never as vibes.** Usable signals:
   Batdongsan.com.vn's market sentiment index and its search/listing volume
   data; developer discount and payment-support terms (chiết khấu, hỗ trợ lãi
   suất — generous terms mean weak demand regardless of headline price);
   distressed resale (cắt lỗ, hàng ngộp); broker headcount returning or leaving;
   time-on-market; rental yield versus deposit rates, which tells you whether
   buyers are investing or speculating.

Then tie it back to macro, which is the part most property coverage skips: real
estate credit as a share of system credit, property NPL trend, developer bond
maturities coming due, and mortgage rates versus the 12-month deposit rate.
A property market cannot be read apart from the funding cost that drives it.

Sources worth naming in the agent prompt: Batdongsan.com.vn báo cáo thị trường,
CBRE Vietnam, Savills Vietnam, JLL, Cushman & Wakefield, Knight Frank, **VARS**
(Hội Môi giới Bất động sản Việt Nam), the Ministry of Construction's quarterly
housing-market report, and **HoREA** for TP HCM specifically.

Consult `references/analysts.md` for whose reads to seek out and where their
output lives — it is a search index, not a citation list. Naming an analyst is
worth doing only when you found and can cite what they actually said this cycle;
never attribute a view to someone because it sounds like something they'd say.

## 3. Reconcile, don't average

Subagents come back with conflicts. Do not split the difference.

- **Two sources disagree** → show both, say which you trust and why (primary
  beats secondary; statistical agency beats news outlet; later vintage beats
  earlier). If you cannot resolve it, say it is unresolved.
- **A number smells stale** → check its date. Search results mix vintages
  constantly; a 2024 stimulus package will happily present itself as current.
- **A release hasn't happened** → never state it. Name the release date and say
  it decides the call. An unreleased print is the most valuable thing you can
  tell a reader about, precisely because nobody knows it yet.
- **Never blend measures.** CPI ≠ PCE. Headline ≠ core. Central rate ≠ bank rate
  ≠ free-market rate. Policy rate ≠ interbank rate. Giá sơ cấp ≠ giá thứ cấp, and
  Hà Nội ≠ TP HCM. Asking price ≠ transacted price. Where two measures of the
  same thing disagree, *that gap is usually the story* — the report's best
  section is often the one explaining why.

## 4. Find the causal chain

A list of facts is not a report. Before writing, state in one sentence what
causes what: shock → prices → policy → rates → currency → the user's exposure.
Then number the sections along that chain, so the numbering encodes the argument
rather than decorating it.

Two habits that carry a macro report:

- **Anatomise the headline number.** Split it into what's driving it and what
  isn't. A headline inflation rate held up entirely by energy implies a
  different policy than the same rate driven by services.
- **Find the reaction function, not the forecast.** What would make this central
  bank move? Read the actual speech and the actual vote split — dissents and dot
  plots are worth more than any strategist's target.

## 5. Forecast with triggers, or don't forecast

Forecasts are the point of the exercise. They also must be visibly separated
from the sourced data: open the section by saying it is your judgment, and that
the probabilities rank scenarios rather than price options.

Deliver three things:

1. **Scenario cards** — base / hawkish / dovish, each with a subjective
   probability summing to 100, and 3–5 bullets of *why*, not what.
2. **A forecast table** with one row per variable and these columns:
   `current | base case | stress case | what triggers the stress case`. The
   trigger column is what makes the table usable; a forecast without a
   falsifying condition is a horoscope.
3. **A watchlist** of ~5 indicators, each with a threshold that changes the call
   ("30y above 5.25% means X"), plus a dated event calendar saying what each
   upcoming release decides.

State the reasoning plainly, including where you disagree with market pricing
and why. Then say what would prove you wrong.

## 6. Ship it as an Artifact

The deliverable is a published page, not terminal scrollback. Load
`artifact-design` first; load `dataviz` before writing any chart code.

- **The artifact is always written in Vietnamese** — body text, headings, table
  headers, chart labels, the `<title>`, and the publish `description`. This holds
  even when the user asked in English, even when every source is English, and
  even when the request itself was in English. No exceptions, no asking.
- Keep standard technical terms recognizable rather than over-translating:
  CPI, PCE, core PCE, OMO, FOMC, DXY, repo, spread, dot plot stay as-is;
  bps → điểm cơ bản; yield curve → đường cong lợi suất; headline → toàn phần;
  core → lõi. Institution and person names stay in the original.
- Structure: TL;DR of ~8 numbered takeaways → the causal chain sections →
  forecasts → calendar & watchlist → **limitations** → sources.
- A data tape of key levels near the top pays for itself.
- **Chart only complete, sourced series.** A line chart across months you don't
  have invites the reader to read an interpolation as data. A yield curve or a
  term structure at a single date is complete and honest; a sparse annotated
  timeline beats a fake trend line. When in doubt, use a table.
- The **limitations section is mandatory.** List what wasn't released yet, which
  figures conflicted between sources, and that the forecast section is judgment.
  A report that admits its gaps is trusted on the rest.

## Hard rules

- The published artifact is in Vietnamese. Always. Regardless of the language of
  the request or the sources.
- No number without a date. No claim without a source you actually opened.
- Never invent a person, an institution's view, a quote, or a data point. If a
  subagent returns something you can't corroborate, drop it or label it.
- Subagent output is a lead, not a fact. Spot-check anything load-bearing.
- Don't tell the user to buy, sell, or hold anything. Describe conditions,
  exposures and triggers; the decision is theirs.
