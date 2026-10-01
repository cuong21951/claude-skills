---
name: pr
description: Create a pull request the way this project creates them — branch name, commit shape, title, ticket link and reviewers follow the conventions recorded in the project's rules doc — and leave auto-merge off. Use whenever the user says "/pr", "create a PR", "make a PR", "raise a PR", "tạo PR", "làm PR", "push và tạo PR", or asks to open a pull request for the current work. Also use before pushing, so the branch name and commits get fixed first.
---

# PR

Invoking this skill IS the user's opt-in to pushing the branch and creating the pull request.
Outside this skill the standing rule still holds: commit locally, never push unprompted.

The conventions are the project's, not this skill's. Branch naming, commit shape, title format,
reviewers and merge strategy come from `Rules.MD` § 3. Follow them exactly; do not invent
variants. A convention that is not recorded there is read from the last merged PRs before anything
is pushed, and then written into `Rules.MD` § 3.

## This project

<!-- init: The exact calls for this project's code host, each taken from a probe that worked: read a ticket, create a PR with the ticket linked, add reviewers, read the PR back. Tool or CLI name with every required parameter filled in; `<ticket>`, `<branch>`, `<target>` and `<title>` stay as per-PR values. -->

## 0. Preflight — never skip

- `git status` shows only files this change touches. Stage those paths; never stage everything
  from the repo root.
- Build and test with the commands in `Rules.MD` § 8. A PR whose build was never run says so in
  the report.
- Self-review the final diff against `ReviewTaste.MD`.

## 1. Ticket and target branch

- **Ticket** — from the user's message or the branch name. Read it: its type and title feed the
  branch name and the PR title.
- **Target** — the branch this work was cut from, confirmed rather than assumed:

  ```bash
  git merge-base --is-ancestor origin/<target> HEAD && echo "cut from <target>"
  ```

- A release or protected branch is never the target unless the user says so.

## 2. Branch and commits

- Rename the branch to the project's convention before the first push (`git branch -m`). If a
  wrongly named branch is already pushed, push the new name and ask before deleting the old one.
- Shape the commits the way the project does. Rewrite only your own unpushed commits; a branch
  that is already shared, or that carries a merge from the target, is not rewritten without asking.

## 3. Push and create

1. Push the branch with upstream tracking.
2. Create the PR with the title in the project's format, and the ticket linked in the same call
   when the host supports it.
3. Add the reviewers the project requires.
4. Read the PR back. Title, target, linked ticket and reviewers are what was intended; a link or
   reviewer that did not take is fixed now, not later.

## 4. Stop before merge

Do not enable auto-merge and do not complete the PR. Merging is the author's decision after
review. Do it only when the user asks, and say first whether anyone has approved.

## Report

- PR id or URL, source and target branch.
- What was verified — build, tests, manual check — and what was not.
- Anything deliberately left out of scope.

Then stop. No build or deploy is queued unless asked.

## Guardrails

- No force-push over commits that are not yours.
- No PR comment and no change to someone else's PR without the user's ask.
