# {{PROJECT_NAME}} Test Playbook

Use this file for practical local validation details: which URL to open, which test data to select, which steps to run, and what result proves the flow.

All passwords, tokens, API keys and credential-bearing connection strings live only in private files under `.agents/` — reference the path, never the value. Never echo one into evidence, commits, PR comments or work items.

Keep architecture in `Design.MD`, mandatory workflow in `Rules.MD`, reviewer preferences in `ReviewTaste.MD`, and ticket-specific test notes under `ticket-investigation/<id>/`.

## Environment Matrix

Which host, branch and database each environment is. Identify the environment before testing anything on it.

| Environment | Host | Branch deployed | Database | Log store | Network prerequisite |
|---|---|---|---|---|---|
<!-- init: Add one row per environment, local included, from deploy config, env files and CI config; write names and hostnames only, never credentials. -->

<!-- init: How to tell which build an environment is running: this project's exact version or health probe (URL or command) and what it answers, read from the code or the build metadata. -->

### Which DB is the app actually on

<!-- init: Name the file or setting that holds the database connection per environment and a one-line command that prints only the database name from it, never the credentials. Delete this section if the project has no database. -->

## Local Environment

<!-- init: For each runnable component give the start command, URL/port, test login account names (never passwords), seed data to select and the expected "it works" signal, reading the README, package scripts, env examples and launch settings. -->

### Credential Map

Store raw credentials only in private local secret-memory files under `.agents/`. This playbook keeps only routing context (environment, server, database, username, network prerequisite, secret-memory path).

When a task needs credentials:

1. Use the matching private secret-memory file under `.agents/`.
2. Do not print the password, full connection string, bearer token, or API key.
3. In notes/final answers, mention only environment, server, database, username, network prerequisite, and the secret-memory path.

| Environment | System | Username | Secret-memory path |
|---|---|---|---|
<!-- init: Add one row per environment and system that needs a credential, read from env examples and config, with the username and the `.agents/` file path that will hold the secret; never write the secret itself. -->

## Browser And Automation Traps

Things in this project that make an automated test pass without testing anything. Read before writing browser automation or reporting a UI defect.

<!-- init: This project's own traps, one bullet each with the symptom and the tell, learned from existing e2e helpers, test README notes and workarounds visible in the test code. Keep the heading even when the project has no browser UI; `AGENTS.md` cites this section by name. -->

## Reusable Test Assets

When something in a ticket folder becomes reusable beyond the ticket — a local test playbook, a regression case list, a fixture script — name it as such and link it here. An unlinked reusable playbook is rewritten from scratch by the next thread.
