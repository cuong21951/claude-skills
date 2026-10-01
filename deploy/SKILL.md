---
name: deploy
description: Build and deploy a change to a target environment the way this project does it, then prove it landed. Use whenever the user says "/deploy", "deploy this", "deploy to dev", "deploy to test", "release", "ship it to <env>", "deploy cái fix này", "build rồi deploy", or asks to get a fix or a version onto an environment. Also use before re-testing a fix on a shared environment.
---

# Deploy

How this project builds and deploys — systems, environments, order, probes — is in `Deploy.MD`.
Which environments may be deployed without asking is in `AGENTS.md`. Anything not pre-authorized
there needs the user's explicit ask, every time.

## This project

<!-- init: The exact calls to queue a build, queue a deploy, and read a run's status and the artifact version it resolved, in this project's CI system: tool or CLI name with every required parameter filled in; `<branch>`, `<env>` and `<run>` stay as per-run values. Write `No deploy pipeline yet.` if `Deploy.MD` says so. -->

## 0. Before queuing anything

- **What and where** — one change or a whole release, and which environment. From the user's
  message, else ask.
- **Allowed** — the environment is pre-authorized, or the user asked for this deploy.
- **What it runs now** — the probe in `Deploy.MD` § 4. If the deploy replaces someone else's
  work on that environment, say so before queuing.

## 1. Build

Queue the build for the branch being deployed. Record the artifact version it produces; the later
steps are checked against it. Build what other components depend on first.

## 2. Deploy

Deploy only what changed, in the order `Deploy.MD` § 3 gives.

## 3. Verify — a green run is not the evidence

1. The run deployed the artifact version recorded in step 1.
2. The behaviour is there: probe the target for the change itself, and calibrate against
   something known to be absent.
3. Then test it for real with the `test` skill.

## Report

- Environment.
- Each component with the version deployed.
- What was probed and what it returned.
- Anything deliberately not deployed. Say plainly if a run is still queued.

## Guardrails

- Never deploy to an environment that is not pre-authorized without the user's ask.
- No credentials printed; reference the `.agents/` path.
