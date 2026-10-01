---
name: test
description: Verify a change in every layer this project has — unit and integration suites, the API, the UI flow in a browser, logs and stored data — and report each layer separately. Use whenever the user says "test this", "/test", "run the tests", "verify it works", "browser test", "api test", "regression test", "check it works locally", "test ở local", "test lại", "test giúp", "chạy test", "kiểm tra ở local", "verify", "reproduce ở local". Also use when a fix is finished and nothing has verified it yet.
---

# Test

Invoking this skill is the opt-in to delegating test runs to subagents.

What there is to test with — environments, URLs, accounts, suites, traps — is the project's and
is recorded in `Test.MD`. Build and test commands are in `Rules.MD` § 8. Read both first.

## This project

<!-- init: The layers this project actually has and how each is exercised, as a table `| Layer | How to run or reach it | What a pass looks like |`: unit and integration suites with their commands, the API base and how a request is authenticated, the UI entry URL and the browser automation tool connected in this environment, where logs are read, how stored data is inspected. Leave out a layer the project does not have. -->

## 1. Every layer, no mode question

A change is verified when every layer in the table above that the change can affect has run and
is in the report. Do not ask which to run; run them all unless the user names a subset. Cheapest
first: suites → API → UI → logs → data. A failing unit test makes the rest pointless.

Scope comes from the diff:

```bash
git diff --name-only $(git merge-base HEAD origin/<target>)
```

Touched files → modules → the flows that use them. A ticket in the conversation means reading
its `ticket-investigation/<id>/memory.md` first.

Before testing, confirm the target is up and is the build you think it is
(`Test.MD` § Environment Matrix).

## 2. Suites

Run the suites that cover the touched modules. Before counting a suite as coverage, check that it
is tracked in git, that CI actually runs it, that nothing in it is skipped or allowed to fail
silently, and that the executed count is not zero. Numbers come from the runner's own output at
report time.

## 3. API

- Replay the request the UI makes, then send one the UI cannot make: wrong role, missing field,
  invalid value.
- Calibrate with a path that does not exist, so "route missing" and "request refused" stay
  distinguishable.

## 4. UI

- Walk the flow as a user would, with the browser tool named above. One browser, on the main thread.
- Log in with the test account from `Test.MD`. Credentials come from `.agents/`, never from this file.
- After the flow, read the browser's console errors and the network calls it made.
- Screenshots and other evidence go to the ticket folder.
- Read `Test.MD` § Browser And Automation Traps before trusting a green run.

## 5. Logs

Note the time before the flow. Afterwards read the log store for that window. Every error in the
window goes in the report, even when the screen was green. Cite an entry by id and time; do not
paste it.

## 6. Stored data

Confirm which datastore the running app is connected to, then compare the rows the flow should
change, before and after.

## Report

Per layer: the tool or command run, what it returned, pass or fail, with discovered and executed
counts for suites. A skipped layer carries its exact reason — skipped is not passed. Defects found
and not fixed are listed separately, each with its disposition (`Rules.MD` § 11).

## Guardrails

- No push, no PR, no tracker write.
- No credential in this file, in evidence or in the report.
- A test that changes shared data on a non-local environment needs the user's ask first.
