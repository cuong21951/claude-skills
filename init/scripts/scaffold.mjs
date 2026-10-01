import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// ponytail: templates/ mirrors the project tree. Every file is copied once and never
// overwritten; settings.json and the ignore file are merged, so a re-run only fills gaps.
const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templates = path.join(skill, "templates");
const settingsTemplate = path.join(".claude", "settings.json");
const hooksRel = path.join(".claude", "hooks");

const fail = (message) => {
	console.error(message);
	process.exit(1);
};
const slash = (p) => p.split(path.sep).join("/");
const list = (value) => (Array.isArray(value) ? value : value.split(/[ ,]+/).filter(Boolean));
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// ponytail: regexes and permission rules carry | and (), which a Windows node shim hands to
// cmd.exe. Anything beyond a plain word comes in through --config, a JSON file with the same keys.
const { values: flags } = parseArgs({
	options: {
		dir: { type: "string" },
		config: { type: "string" },
		name: { type: "string" },
		tracker: { type: "string" },
		mode: { type: "string" },
		skills: { type: "string" },
		check: { type: "boolean" },
	},
});
const opt = {
	dir: process.cwd(),
	tracker: "none",
	"ado-servers": "azure-devops",
	ask: [],
	skills: "pr,test,deploy,workitem,deep-review",
	"skills-src": path.join(os.homedir(), "claude-skills"),
	...(flags.config ? readJson(flags.config) : {}),
	...flags,
};
const dir = path.resolve(opt.dir);
const git = (cwd, ...args) => {
	const run = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
	return run.status === 0 ? run.stdout.trim() : null;
};
const walk = (root, rel = "") =>
	fs
		.readdirSync(path.join(root, rel), { withFileTypes: true })
		.flatMap((entry) =>
			entry.isDirectory() ? walk(root, path.join(rel, entry.name)) : [path.join(rel, entry.name)],
		);

const isRepo = git(dir, "rev-parse", "--show-toplevel") !== null;

const adoWriteTools = [
	"repo_create_branch",
	"repo_pull_request_thread_write",
	"testplan_test_case_write",
	"testplan_test_plan_write",
	"testplan_test_suite_write",
	"wiki_upsert_page",
	"wit_work_item_write",
	"wit_work_item_comment_write",
	"wit_work_item_link_write",
	"work_capacity_write",
	"work_iteration_write",
	"pipelines_write",
];
const ghWriteVerbs = [
	"pr merge",
	"pr comment",
	"pr review",
	"issue create",
	"issue comment",
	"issue edit",
	"issue close",
	"release create",
	"workflow run",
];
const trackers = {
	ado: {
		mention: "_workitems/edit/[0-9]+|(work item|ticket)[ _#-]*[0-9]+",
		id: "[0-9]+",
		sample: "ticket 4242",
		disposition: "#[0-9]+|ruled|filed",
		ask: () => list(opt["ado-servers"]).flatMap((server) => adoWriteTools.map((tool) => `mcp__${server}__${tool}`)),
	},
	github: {
		mention: "issues/[0-9]+|(issue|ticket)[ _#-]*[0-9]+",
		id: "[0-9]+",
		sample: "issue 4242",
		disposition: "#[0-9]+|ruled|filed",
		ask: () =>
			ghWriteVerbs.flatMap((verb) => [`Bash(gh ${verb}:*)`, `Bash(rtk gh ${verb}:*)`, `PowerShell(gh ${verb}:*)`]),
	},
	none: {
		mention: "ticket[ _#-]*[0-9]+",
		id: "[0-9]+",
		sample: "ticket 4242",
		disposition: "#[0-9]+|ruled|filed",
		ask: () => [],
	},
};

const commentStyles = {
	slash: list("cs js jsx mjs cjs ts tsx java go rs kt swift c cc cpp h hpp php scala dart"),
	hash: list("py rb"),
};
const trackedExts = () => {
	const children = fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, ".git")))
		.map((entry) => path.join(dir, entry.name));
	const files = [dir, ...children].flatMap((repo) => (git(repo, "ls-files") ?? "").split("\n"));
	return new Set(files.map((file) => path.extname(file).slice(1)));
};

const scaffolded = walk(templates).filter((rel) => rel !== settingsTemplate);
const harnessPaths = fs
	.readdirSync(templates, { withFileTypes: true })
	.map((entry) => entry.name + (entry.isDirectory() ? "/" : ""));
const modes = {
	none: { settings: "settings.json", lineFiles: [] },
	tracked: {
		settings: "settings.json",
		lineFiles: [
			{
				file: () => path.join(dir, ".gitignore"),
				lines: [".agents/", ".claude/settings.local.json", "ticket-investigation/"],
			},
			{ file: () => path.join(dir, ".gitattributes"), lines: [".claude/hooks/* text eol=lf"] },
		],
	},
	local: {
		settings: "settings.local.json",
		lineFiles: [
			{
				file: () => path.resolve(dir, git(dir, "rev-parse", "--git-path", "info/exclude")),
				lines: harnessPaths,
			},
		],
	},
};

function copyOnce(rel, produce) {
	const target = path.join(dir, rel);
	if (fs.existsSync(target)) {
		console.log(`keep    ${slash(rel)} (exists)`);
		return;
	}
	fs.mkdirSync(path.dirname(target), { recursive: true });
	produce(target);
	console.log(`write   ${slash(rel)}`);
}

function mergeSettings(file, ask) {
	const target = path.join(dir, ".claude", file);
	const base = readJson(path.join(templates, settingsTemplate));
	const settings = fs.existsSync(target) ? readJson(target) : {};
	settings.permissions ??= {};
	for (const [key, add] of [["allow", base.permissions.allow], ["ask", ask]]) {
		settings.permissions[key] = [...new Set([...(settings.permissions[key] ?? []), ...add])];
	}
	settings.hooks ??= {};
	for (const [event, groups] of Object.entries(base.hooks)) {
		settings.hooks[event] ??= [];
		for (const group of groups) mergeHookGroup(settings.hooks[event], group);
	}
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, `${JSON.stringify(settings, null, 2)}\n`);
	console.log(`merged  .claude/${file} (${settings.permissions.ask.length} ask rules)`);
}

function mergeHookGroup(existing, group) {
	let into = existing.find((candidate) => candidate.matcher === group.matcher);
	if (!into) {
		into = { ...group, hooks: [] };
		existing.push(into);
	}
	for (const hook of group.hooks) {
		if (!into.hooks.some((have) => have.command === hook.command)) into.hooks.push(hook);
	}
}

function mergeLines(target) {
	const file = target.file();
	const have = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
	const add = target.lines.filter((line) => !have.split(/\r?\n/).includes(line));
	if (!add.length) {
		console.log(`keep    ${slash(path.relative(dir, file))} (already has the harness lines)`);
		return;
	}
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, `${have}${have && !have.endsWith("\n") ? "\n" : ""}${add.join("\n")}\n`);
	console.log(`merged  ${slash(path.relative(dir, file))} (+${add.length} lines)`);
}

function installedSkills() {
	const root = path.join(dir, ".claude", "skills");
	if (!fs.existsSync(root)) return [];
	return fs.readdirSync(root).map((name) => path.join(".claude", "skills", name, "SKILL.md"));
}

function pending() {
	return [...scaffolded, ...installedSkills()]
		.filter((rel) => !rel.endsWith(".sh") && fs.existsSync(path.join(dir, rel)))
		.flatMap((rel) =>
			fs
				.readFileSync(path.join(dir, rel), "utf8")
				.split("\n")
				.map((line, index) => ({ line, where: `${slash(rel)}:${index + 1}` }))
				.filter(({ line }) => /\{\{\w+\}\}|<!-- init:/.test(line))
				.map(({ line, where }) => `${where}  ${line.trim().slice(0, 110)}`),
		);
}

function scaffold() {
	const tracker = trackers[opt.tracker] ?? fail(`tracker must be one of: ${Object.keys(trackers).join(", ")}`);
	const mode = opt.mode ?? (isRepo ? fail("mode tracked|local is required inside a git repo") : "none");
	if (!(mode in modes)) fail(`mode must be one of: ${Object.keys(modes).join(", ")}`);
	const skills = list(opt.skills);
	const missing = skills.filter((name) => !fs.existsSync(path.join(opt["skills-src"], name, "SKILL.md")));
	if (missing.length) fail(`skills not found in ${opt["skills-src"]}: ${missing.join(", ")}`);

	const tracked = trackedExts();
	const detect = (style) => commentStyles[style].filter((ext) => tracked.has(ext)).join(" ");
	const tokens = {
		PROJECT_NAME: opt.name ?? path.basename(dir),
		TICKET_MENTION: opt["ticket-mention"] ?? tracker.mention,
		TICKET_ID: opt["ticket-id"] ?? tracker.id,
		TICKET_SAMPLE: opt["ticket-sample"] ?? tracker.sample,
		DISPOSITION: opt.disposition ?? tracker.disposition,
		SLASH_EXTS: opt["slash-exts"] ?? detect("slash"),
		HASH_EXTS: opt["hash-exts"] ?? detect("hash"),
	};
	const render = (text) => text.replace(/\{\{(\w+)\}\}/g, (token, key) => tokens[key] ?? token);

	for (const rel of scaffolded) {
		copyOnce(rel, (target) => fs.writeFileSync(target, render(fs.readFileSync(path.join(templates, rel), "utf8"))));
	}
	mergeSettings(modes[mode].settings, [...tracker.ask(), ...opt.ask]);
	for (const name of skills) {
		copyOnce(path.join(".claude", "skills", name), (target) =>
			fs.cpSync(path.join(opt["skills-src"], name), target, { recursive: true }),
		);
	}
	for (const target of modes[mode].lineFiles) mergeLines(target);

	const todo = pending();
	console.log(`\n${todo.length} fill markers to resolve:`);
	for (const item of todo) console.log(`  ${item}`);
}

// ponytail: plain `bash` on a Windows PATH can be WSL, which cannot open C:/ paths.
const gitBash = path.join(process.env.ProgramFiles ?? "", "Git", "bin", "bash.exe");
const bash = fs.existsSync(gitBash) ? gitBash : "bash";

function smoke(expect) {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "init-smoke-"));
	const env = { ...process.env, CLAUDE_PROJECT_DIR: slash(tmp), TMPDIR: slash(tmp) };
	const run = (script, payload) =>
		spawnSync(bash, [path.join(dir, hooksRel, script)], { input: JSON.stringify(payload), encoding: "utf8", env });
	const prompt = (text) => ({ hook_event_name: "UserPromptSubmit", prompt: text });
	const push = { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "git push origin HEAD" } };
	const edit = (file) => ({ hook_event_name: "PostToolUse", tool_name: "Write", tool_input: { file_path: file } });

	expect(spawnSync(bash, ["--version"]).status === 0, "bash is available");

	run("push-gate.sh", prompt("fix the bug"));
	expect(run("push-gate.sh", push).status === 2, "push-gate blocks a push the prompt did not ask for");
	run("push-gate.sh", prompt("push it"));
	expect(run("push-gate.sh", push).status === 0, "push-gate opens when the prompt asks for a push");

	const conf = fs.readFileSync(path.join(dir, hooksRel, "harness.conf"), "utf8");
	const confValue = (key) => conf.match(new RegExp(`^${key}='([^']*)'`, "m"))?.[1] ?? "";

	const tickets = path.join(tmp, "ticket-investigation");
	const sample = confValue("TICKET_SAMPLE");
	const reminder = run("ticket-reminder.sh", prompt(`look at ${sample}`));
	const created = fs.existsSync(tickets) && fs.readdirSync(tickets).length === 1;
	expect(reminder.stdout.includes("created") && created, `ticket-reminder creates a folder for "${sample}"`);
	run("ticket-reminder.sh", prompt("retry 3 times on port 8080 and bump to 2.10.4"));
	expect(fs.readdirSync(tickets).length === 1, "ticket-reminder ignores ordinary numbers");

	const memory = path.join(tickets, "probe.md");
	fs.writeFileSync(memory, "Create form loses the value, flag separately\n");
	expect(run("deferred-findings.sh", edit(memory)).status === 2, "deferred-findings blocks a deferral with no disposition");
	fs.writeFileSync(memory, "Create form loses the value, flag separately -> filed\n");
	expect(run("deferred-findings.sh", edit(memory)).status === 0, "deferred-findings accepts a disposition");

	for (const [key, comment] of [["SLASH_EXTS", "// note"], ["HASH_EXTS", "# note"]]) {
		const ext = confValue(key).split(" ")[0];
		if (!ext) continue;
		const probe = path.join(tmp, `probe.${ext}`);
		fs.writeFileSync(probe, `${comment}\n`);
		expect(run("no-code-comments.sh", edit(probe)).status === 2, `no-code-comments blocks "${comment}" in .${ext}`);
		fs.writeFileSync(probe, "value\n");
		expect(run("no-code-comments.sh", edit(probe)).status === 0, `no-code-comments passes clean .${ext}`);
	}
	fs.rmSync(tmp, { recursive: true, force: true });
}

function check() {
	const problems = [];
	const expect = (ok, what) => {
		console.log(`${ok ? "ok  " : "FAIL"}  ${what}`);
		if (!ok) problems.push(what);
	};

	for (const rel of scaffolded) expect(fs.existsSync(path.join(dir, rel)), `exists ${slash(rel)}`);
	if (problems.length) fail(`\n${problems.length} files missing — run the scaffold first.`);

	const wired = [...new Set(Object.values(modes).map((mode) => path.join(dir, ".claude", mode.settings)))]
		.filter((file) => fs.existsSync(file))
		.map((file) => JSON.stringify(readJson(file).hooks ?? {}))
		.join();
	const scripts = fs.readdirSync(path.join(templates, hooksRel)).filter((file) => file.endsWith(".sh"));
	for (const script of scripts) expect(wired.includes(`.claude/hooks/${script}`), `settings.json wires ${script}`);
	if (isRepo) {
		const ignored = spawnSync("git", ["-C", dir, "check-ignore", "-q", ".agents/probe"]).status === 0;
		expect(ignored, ".agents/ is ignored by git");
	}
	smoke(expect);
	for (const item of pending()) expect(false, `unresolved ${item}`);

	if (problems.length) fail(`\n${problems.length} problems.`);
	console.log("\nHarness is in place.");
}

if (opt.check) check();
else scaffold();
