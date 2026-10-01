# {{PROJECT_NAME}} Review Taste

Reviewer taste for {{PROJECT_NAME}} code: style, naming, code shape, and the findings that keep coming back in PR feedback. Read it before reviewing, self-reviewing, or changing code.
Architecture → `Design.MD`. Workflow, evidence standard, reporting → `Rules.MD`. Test flows, environments, browser traps → `Test.MD`.
New rules are appended to the matching area group, with their one-line entry under `## Precedents` in the same edit.

## Always

Rules that apply to every diff, whatever it touches.

- **Minimal diff, no code comments.** Make the smallest change that does the job; naming and small functions carry intent. A hook blocks new comments in source files.

<!-- init: The checks this project's reviewers apply to every change, learned from the review comments on merged PRs and from the contributing guide. One bullet each: bold title, the rule, the PRs that show it. -->

## Hard rules by area

Open the group that matches the diff.

<!-- init: Review findings that came back two or more times, grouped under one `###` heading per area the findings actually fall into. One bullet per rule: bold title, the rule, the reason the reviewer gave. A finding seen once is not a rule yet. -->

## Precedents

One line per rule: `<rule title> — <PR or ticket where it was ruled>`.

<!-- init: One line for each rule written above, in the format on the line above. -->
