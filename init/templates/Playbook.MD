# {{PROJECT_NAME}} Implementation Playbook

Per-module "how to add X" recipes. The goal: implement a change the way the code already does it, so it passes review on the first try.

Read this with `Design.MD` (architecture, source of truth), `Rules.MD` (workflow), and `ReviewTaste.MD` (reviewer taste). When this file and `Design.MD` disagree, `Design.MD` wins.

## How To Use

1. Find the module you are changing below.
2. Open the named **template file** and copy its shape. The template is the spec; these notes are the map.
3. Follow the ordered steps; put logic where "Where logic goes" says.
4. Check your change against the "Do NOT" list before asking for a push.

<!-- init: Write one `## <repo or module> — <stack>` section per repo or module, each with the four bold blocks shown in the example below — `**Templates to copy:**` (real paths to the most recent well-shaped example of each repeatable thing), `**Recipe — <task>:**` (ordered steps), `**Where logic goes:**`, `**Do NOT:**` — derived from the code and its git history, not invented. Then delete the example section; if no repeatable pattern exists yet, write `Not established yet.` and delete it anyway. -->

## <module> — <stack>

Flow: **<entry point>** → **<service or handler>** → **<data layer>**.

**Templates to copy:**
- <repeatable thing>: `<path/to/most-recent-well-shaped-example>`
- <another repeatable thing>: `<path/to/another-example>`

**Recipe — add <a repeatable thing>:**
1. <Create the first file, naming the type and the template it copies.>
2. <Put the logic where "Where logic goes" says, reusing the existing helper.>
3. <Register or wire it the way the template does, then add the test the template has.>

**Where logic goes:** <which layer parses and delegates, which holds behavior, which holds persistence>.

**Do NOT:** <anti-pattern review keeps rejecting>; <second anti-pattern>.
