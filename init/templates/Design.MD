# {{PROJECT_NAME}} Design

Generic architecture and runtime design of {{PROJECT_NAME}}: repo/module map, runtime flow, auth, data, messaging, frontend.
No ticket-specific or behaviour-specific detail — that lives in `ticket-investigation/<id>/memory.md`.

## 1. System Overview

<!-- init: Read the README, manifests, entry points and CI config, then write what the system does, its runtime components as a bullet list, and how one request or run flows end to end, in under 15 lines. -->

## 2. Repository Map

Shape of each entry: one `###` heading per repo/module, then an architecture line (stack + layering), a `Flow: A -> B -> C` line, and a `Don't …` line naming the mistake that repo punishes.

```
### `<repo-or-module>`
<Stack and version, key projects/folders, and the layering inside it.>
Flow: <entry point> -> <layer> -> <layer> -> <data or outbound call>.
Don't <the mistake this repo punishes>.
```

<!-- init: List every repo or top-level module in the entry shape above, taken from the workspace file, package manifests and top-level folders. Take each `Don't` line from the project's own docs or from a layering convention visible in the code. -->

## 2.1 Structure Preservation Rule

Preserve the existing structure and dependency direction. Restructuring needs the user's explicit ask and an update to this file first.

<!-- init: The required pattern per repo or module, one line each as `<name>: <entry> -> <layer> -> <layer> -> <data or outbound call>`, copied from the Flow lines in section 2. -->

Concrete file-by-file steps and the template to copy per flow: `Playbook.MD`.

## 3. Core Domains

<!-- init: List the main business concepts or capability groups as bullets, read from the data model, top-level module or package names and the README. Delete this section if the project has no distinct domain layer. -->

## 4. API and Authorization

<!-- init: Name where authorization is centralised (middleware, filter, decorator, gateway or route config), the identities a request can carry and the checks it can require, reading the auth code and env examples. Delete this section if the project has no API or no authorization layer. -->

## 5. Data, Persistence, and Logging

<!-- init: Name the datastore(s), the access layer and where it lives, how schema changes are made, and the logging library plus where logs go, reading connection settings, migration folders and logging config. Delete this section if the project has no persistence or logging layer. -->

## 6. Messaging and Background Work

<!-- init: Name the queue, bus or scheduler technology and where the message contracts and workers live, reading the queue config and worker or cron definitions. Delete this section if the project has no messaging or background work. -->

## 7. Caching and Feature Flags

<!-- init: Name the cache layers and how they are invalidated, and the feature-flag mechanism and where flags are set, reading the cache and flag code and env examples. Delete this section if the project has no caching or feature flags. -->

## 8. Frontend

<!-- init: Name the frontend stack, where its components, state and services live, and the flow from route to API call, reading package manifests, frontend config and the source tree. Delete this section if the project has no frontend. -->
