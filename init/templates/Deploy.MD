# {{PROJECT_NAME}} Deploy

<!-- init: If the project has no deploy pipeline (no CI deploy stage, release workflow, image push or hosting config), replace everything below this line with `No deploy pipeline yet.` -->

## 1. Build and deploy systems

<!-- init: Read the CI/pipeline config and name which system builds, which deploys, where artifacts are stored, and how a deploy picks its artifact version (pinned, latest, wildcard, tag). -->

## 2. Environments and branches

| Environment | Branch | Who may deploy | Pre-authorized for the agent |
|---|---|---|---|
<!-- init: Add one row per environment from the deploy config and branch rules; mark "Pre-authorized for the agent" `no` unless `AGENTS.md` or the owner says otherwise. -->

## 3. Pipelines and order

<!-- init: As a table `| Order | Job | Deploys | Why this position |`, list each pipeline or job and the order components must go in, reading stage dependencies and triggers in the pipeline config. -->

## 4. Verify the deploy landed

A green run is not the evidence; the standard is `Rules.MD` § 9.

<!-- init: Write this project's exact post-deploy probe (URL or command) and the expected output that proves the intended version is serving. -->

## 5. Common failures

<!-- init: List known deploy failures as `symptom -> cause -> fix`, one bullet each, taken from CI history, pipeline comments and README troubleshooting notes. -->

## 6. Target URLs

| Environment | Component | URL |
|---|---|---|
<!-- init: Add one row per environment and component from the deploy variables and hosting config; hostnames only, no credentials or keys. -->
