import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillsRepo = path.resolve(here, "..", "..");
const script = path.join(skillsRepo, "init", "scripts", "scaffold.mjs");
const templatesDir = path.join(skillsRepo, "init", "templates");
const gitBash = path.join(process.env.ProgramFiles ?? "", "Git", "bin", "bash.exe");
const bashBin = fs.existsSync(gitBash) ? gitBash : "bash";
const PASS = "Harness is in place.";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-test-"));
const emptyGitConfig = path.join(root, "empty.gitconfig");
fs.writeFileSync(emptyGitConfig, "");
Object.assign(process.env, {
	GIT_CONFIG_NOSYSTEM: "1",
	GIT_CONFIG_GLOBAL: emptyGitConfig,
	GIT_AUTHOR_NAME: "t",
	GIT_AUTHOR_EMAIL: "t@t.t",
	GIT_COMMITTER_NAME: "t",
	GIT_COMMITTER_EMAIL: "t@t.t",
});

after(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

let counter = 0;
const fresh = (name = "p") => {
	const dir = path.join(root, `${String(++counter).padStart(3, "0")}`, name);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
};
const git = (cwd, ...args) => {
	const run = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
	assert.equal(run.status, 0, `git ${args.join(" ")} failed: ${run.stderr}`);
	return run.stdout;
};
const writeFiles = (dir, files) => {
	for (const [rel, content] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
		fs.writeFileSync(path.join(dir, rel), content);
	}
};
const commitAll = (dir, message = "init") => {
	git(dir, "add", "-A");
	git(dir, "commit", "-q", "-m", message);
};
const repo = (files = { "app.js": "export const x = 1;\n" }, name = "p") => {
	const dir = fresh(name);
	git(dir, "init", "-q", "-b", "main");
	writeFiles(dir, files);
	commitAll(dir);
	return dir;
};
const plain = (files = {}, name = "p") => {
	const dir = fresh(name);
	writeFiles(dir, files);
	return dir;
};
const run = (args, { cfg, scriptPath = script } = {}) => {
	const extra = [];
	if (cfg) {
		const file = path.join(fresh("cfg"), "init.json");
		fs.writeFileSync(file, JSON.stringify(cfg));
		extra.push("--config", file);
	}
	const res = spawnSync(process.execPath, [scriptPath, ...extra, ...args], { encoding: "utf8" });
	return { status: res.status, stdout: res.stdout, stderr: res.stderr };
};
const scaffold = (dir, cfg = {}, args = []) => run(["--dir", dir, ...args], { cfg });
const check = (dir, scriptPath = script) => run(["--dir", dir, "--check"], { scriptPath });

const walkFiles = (dir, rel = "") =>
	fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((entry) => {
		const next = path.join(rel, entry.name);
		if (entry.name === ".git") return [];
		return entry.isDirectory() ? walkFiles(dir, next) : [next];
	});
const resolveMarkers = (dir) => {
	for (const rel of walkFiles(dir).filter((file) => /\.md$/i.test(file))) {
		const file = path.join(dir, rel);
		const text = fs.readFileSync(file, "utf8");
		if (!text.includes("<!-- init:")) continue;
		const out = text
			.split("\n")
			.map((line) => (line.includes("<!-- init:") ? `Not established yet.${line.endsWith("\r") ? "\r" : ""}` : line))
			.join("\n");
		fs.writeFileSync(file, out);
	}
};
const snapshot = (dir) => new Map(walkFiles(dir).map((rel) => [rel.split(path.sep).join("/"), fs.readFileSync(path.join(dir, rel)).toString("hex")]));
const settingsOf = (dir, file = "settings.json") => JSON.parse(fs.readFileSync(path.join(dir, ".claude", file), "utf8"));
const commandsOf = (settings) =>
	Object.values(settings.hooks).flatMap((groups) => groups.flatMap((group) => group.hooks.map((hook) => hook.command)));
const confValue = (dir, key) => {
	const conf = path.join(dir, ".claude", "hooks", "harness.conf").split(path.sep).join("/");
	const res = spawnSync(bashBin, ["-c", `. "$1"; printf %s "\${!2}"`, "x", conf, key], { encoding: "utf8" });
	return res.stdout;
};
const green = (res) => res.status === 0 && res.stdout.includes(PASS);
const explain = (res) => `exit ${res.status}\nSTDOUT tail:\n${res.stdout.split("\n").slice(-25).join("\n")}\nSTDERR:\n${res.stderr}`;
const assertGreen = (res) => assert.ok(green(res), explain(res));
const assertNotGreen = (res) => assert.ok(!res.stdout.includes(PASS) && res.status !== 0, explain(res));
const assertCleanFailure = (res) => {
	assert.equal(res.status, 1, explain(res));
	const lines = res.stderr.trim().split(/\r?\n/);
	assert.equal(lines.length, 1, `expected a one-line error, got:\n${res.stderr}`);
	assert.doesNotMatch(res.stderr, /node:internal|\n\s+at |\.mjs:\d+/, `stack trace leaked:\n${res.stderr}`);
	assert.ok(!res.stdout.includes(PASS));
};
const porcelain = (dir) => git(dir, "status", "--porcelain").trim();
const tracked = { mode: "tracked", tracker: "none" };
const scaffoldAndResolve = (dir, cfg) => {
	const res = scaffold(dir, cfg);
	assert.equal(res.status, 0, explain(res));
	resolveMarkers(dir);
	return res;
};

test("01 tracked mode: fresh repo with one commit scaffolds, resolves markers, and checks green", () => {
	const dir = repo();
	scaffoldAndResolve(dir, tracked);
	assertGreen(check(dir));
});

test("02a local mode: git status stays empty, hooks go to settings.local.json, settings.json is not created, check green", () => {
	const dir = repo();
	scaffoldAndResolve(dir, { mode: "local", tracker: "none" });
	assert.equal(porcelain(dir), "");
	assert.ok(fs.existsSync(path.join(dir, ".claude", "settings.local.json")));
	assert.ok(!fs.existsSync(path.join(dir, ".claude", "settings.json")));
	assert.ok(commandsOf(settingsOf(dir, "settings.local.json")).some((command) => command.includes("push-gate.sh")));
	assertGreen(check(dir));
});

test("02b local mode keeps a pre-existing .git/info/exclude without trailing newline intact and still hides everything", () => {
	const dir = repo();
	const exclude = path.join(dir, ".git", "info", "exclude");
	fs.mkdirSync(path.dirname(exclude), { recursive: true });
	fs.writeFileSync(exclude, "*.log");
	scaffoldAndResolve(dir, { mode: "local", tracker: "none" });
	const lines = fs.readFileSync(exclude, "utf8").split(/\r?\n/);
	assert.ok(lines.includes("*.log"));
	assert.ok(lines.includes(".agents/"));
	assert.equal(porcelain(dir), "");
});

test("02c local mode leaves a user's own .claude/settings.json byte-identical", () => {
	const own = '{\n  "permissions": { "allow": ["Bash(npm test:*)"] }\n}\n';
	const dir = repo({ "app.js": "1\n", ".claude/settings.json": own });
	scaffoldAndResolve(dir, { mode: "local", tracker: "none" });
	assert.equal(fs.readFileSync(path.join(dir, ".claude", "settings.json"), "utf8"), own);
	assertGreen(check(dir));
});

test("03a none mode: non-git folder scaffolds without a mode, writes no ignore files, check green", () => {
	const dir = plain({ "notes.txt": "x\n" });
	const res = scaffoldAndResolve(dir, { tracker: "none" });
	assert.ok(!fs.existsSync(path.join(dir, ".gitignore")));
	assert.ok(!fs.existsSync(path.join(dir, ".claude", "settings.local.json")));
	assert.ok(res.stdout.includes("write"));
	assertGreen(check(dir));
});

test("03b umbrella folder (not a repo) with a child repo: comment-ban extensions come from the child's files", () => {
	const umbrella = plain();
	const child = path.join(umbrella, "api");
	fs.mkdirSync(child);
	git(child, "init", "-q", "-b", "main");
	writeFiles(child, { "a.ts": "export {};\n", "b.py": "x = 1\n" });
	commitAll(child);
	scaffoldAndResolve(umbrella, { tracker: "none" });
	assert.match(confValue(umbrella, "SLASH_EXTS"), /\bts\b/);
	assert.match(confValue(umbrella, "HASH_EXTS"), /\bpy\b/);
	assertGreen(check(umbrella));
});

test("04a re-run is idempotent: only keep/merged lines and every file byte-identical", () => {
	const dir = repo();
	scaffoldAndResolve(dir, { ...tracked, tracker: "ado", "ado-servers": "alpha,beta" });
	const before = snapshot(dir);
	const second = scaffold(dir, { ...tracked, tracker: "ado", "ado-servers": "alpha,beta" });
	assert.equal(second.status, 0, explain(second));
	const actions = second.stdout.split("\n").filter((line) => /^(write|keep|merged)\s/.test(line));
	assert.ok(actions.length > 0);
	assert.deepEqual(actions.filter((line) => !/^(keep|merged)\s/.test(line)), []);
	assert.deepEqual([...snapshot(dir)], [...before]);
	assertGreen(check(dir));
});

test("04b re-run adds no duplicate hook entries or permission rules", () => {
	const dir = repo();
	const cfg = { ...tracked, tracker: "github", ask: ["Bash(jira close:*)"] };
	scaffoldAndResolve(dir, cfg);
	const first = settingsOf(dir);
	scaffold(dir, cfg);
	scaffold(dir, cfg);
	const again = settingsOf(dir);
	for (const groups of Object.values(again.hooks)) {
		const commands = groups.flatMap((group) => group.hooks.map((hook) => hook.command));
		assert.equal(new Set(commands).size, commands.length);
	}
	for (const key of ["allow", "ask"]) {
		assert.equal(new Set(again.permissions[key]).size, again.permissions[key].length);
		assert.deepEqual(again.permissions[key], first.permissions[key]);
	}
	assert.deepEqual(again, first);
});

test("04c re-run in local mode and in none mode is idempotent too", () => {
	const local = repo();
	scaffoldAndResolve(local, { mode: "local", tracker: "none" });
	const localBefore = snapshot(local);
	const nonGit = plain();
	scaffoldAndResolve(nonGit, { tracker: "none" });
	const noneBefore = snapshot(nonGit);
	const a = scaffold(local, { mode: "local", tracker: "none" });
	const b = scaffold(nonGit, { tracker: "none" });
	assert.equal(a.status, 0, explain(a));
	assert.equal(b.status, 0, explain(b));
	assert.deepEqual([...snapshot(local)], [...localBefore]);
	assert.deepEqual([...snapshot(nonGit)], [...noneBefore]);
	assert.equal(porcelain(local), "");
});

test("05a existing AGENTS.md and CLAUDE.md that already wire the harness are kept byte-identical and check green", () => {
	const agents = "# Mine\n\n## Mandatory Startup\n\n- read the docs\n";
	const claude = "@AGENTS.md\n\nmine\n";
	const dir = repo({ "AGENTS.md": agents, "CLAUDE.md": claude });
	const res = scaffoldAndResolve(dir, tracked);
	assert.match(res.stdout, /keep\s+AGENTS\.md/);
	assert.match(res.stdout, /keep\s+CLAUDE\.md/);
	assert.equal(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8"), agents);
	assert.equal(fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8"), claude);
	assertGreen(check(dir));
});

test("05b existing settings.json keeps the user's hooks (same and different matcher), permissions and unknown keys", () => {
	const own = {
		model: "opus",
		permissions: { allow: ["Bash(npm test:*)"], ask: ["Bash(rm:*)"], deny: ["Bash(curl:*)"] },
		hooks: {
			PreToolUse: [
				{ matcher: "Bash|PowerShell", hooks: [{ type: "command", command: "echo mine-same" }] },
				{ matcher: "Read", hooks: [{ type: "command", command: "echo mine-other" }] },
			],
			Stop: [{ hooks: [{ type: "command", command: "echo stop" }] }],
		},
	};
	const dir = repo({ "app.js": "1\n", ".claude/settings.json": JSON.stringify(own, null, 2) });
	scaffoldAndResolve(dir, { ...tracked, tracker: "github" });
	const merged = settingsOf(dir);
	assert.equal(merged.model, "opus");
	assert.deepEqual(merged.permissions.deny, ["Bash(curl:*)"]);
	assert.ok(merged.permissions.allow.includes("Bash(npm test:*)"));
	assert.ok(merged.permissions.ask.includes("Bash(rm:*)"));
	assert.deepEqual(merged.hooks.Stop, own.hooks.Stop);
	const read = merged.hooks.PreToolUse.find((group) => group.matcher === "Read");
	assert.deepEqual(read, own.hooks.PreToolUse[1]);
	const same = merged.hooks.PreToolUse.find((group) => group.matcher === "Bash|PowerShell");
	assert.equal(same.hooks[0].command, "echo mine-same");
	assert.ok(same.hooks.some((hook) => hook.command.includes("push-gate.sh")));
	assertGreen(check(dir));
});

test("05c .gitignore without trailing newline keeps its last line intact and gains the harness lines on their own lines", () => {
	const dir = repo({ "app.js": "1\n", ".gitignore": "node_modules\ndist" });
	scaffoldAndResolve(dir, tracked);
	const text = fs.readFileSync(path.join(dir, ".gitignore"), "utf8");
	assert.ok(text.startsWith("node_modules\ndist\n"), JSON.stringify(text));
	const lines = text.split(/\r?\n/);
	for (const line of [".agents/", ".claude/settings.local.json", "ticket-investigation/"]) assert.ok(lines.includes(line));
	assertGreen(check(dir));
});

test("05d .gitignore with CRLF keeps its bytes, still ignores .agents/, and a re-run changes nothing", () => {
	const original = "node_modules\r\ndist\r\n";
	const dir = repo({ "app.js": "1\n", ".gitignore": original });
	scaffoldAndResolve(dir, tracked);
	const text = fs.readFileSync(path.join(dir, ".gitignore"), "utf8");
	assert.ok(text.startsWith(original));
	const before = text;
	scaffold(dir, tracked);
	assert.equal(fs.readFileSync(path.join(dir, ".gitignore"), "utf8"), before);
	assertGreen(check(dir));
});

test("05e .gitignore that already lists the harness lines with CRLF is not appended to", () => {
	const original = ".agents/\r\n.claude/settings.local.json\r\nticket-investigation/\r\n";
	const dir = repo({ "app.js": "1\n", ".gitignore": original });
	const res = scaffoldAndResolve(dir, tracked);
	assert.equal(fs.readFileSync(path.join(dir, ".gitignore"), "utf8"), original);
	assert.match(res.stdout, /keep\s+\.gitignore/);
});

test("05f existing .gitattributes without trailing newline is preserved and the LF pin lands on its own line", () => {
	const dir = repo({ "app.js": "1\n", ".gitattributes": "*.png binary" });
	scaffoldAndResolve(dir, tracked);
	const lines = fs.readFileSync(path.join(dir, ".gitattributes"), "utf8").split(/\r?\n/);
	assert.ok(lines.includes("*.png binary"));
	assert.ok(lines.includes(".claude/hooks/* text eol=lf"));
});

test("06a existing CLAUDE.md that does not import AGENTS.md: check must not say the harness is in place", () => {
	const dir = repo({ "app.js": "1\n", "CLAUDE.md": "# Mine\n\nUse tabs.\n" });
	scaffoldAndResolve(dir, tracked);
	assertNotGreen(check(dir));
});

test("06b existing AGENTS.md without the Mandatory Startup router: check must not say the harness is in place", () => {
	const dir = repo({ "app.js": "1\n", "AGENTS.md": "# Mine\n\nUse tabs.\n" });
	scaffoldAndResolve(dir, tracked);
	assertNotGreen(check(dir));
});

test("07 project path with spaces and non-ASCII characters scaffolds and checks green", () => {
	const dir = repo({ "app.ts": "export {};\n" }, "dự án thử");
	scaffoldAndResolve(dir, { ...tracked, mode: "tracked" });
	assert.ok(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8").startsWith("# dự án thử Agent Entry"));
	assertGreen(check(dir));
});

test("07b project path with spaces in local mode keeps git status empty", () => {
	const dir = repo({ "app.ts": "export {};\n" }, "my project");
	scaffoldAndResolve(dir, { mode: "local", tracker: "none" });
	assert.equal(porcelain(dir), "");
	assertGreen(check(dir));
});

test("08a git worktree in local mode: exclude is honoured, status empty in both trees, check green", () => {
	const main = repo();
	const wt = path.join(fresh("wtparent"), "wt");
	git(main, "worktree", "add", "-q", wt, "-b", "side");
	scaffoldAndResolve(wt, { mode: "local", tracker: "none" });
	assert.equal(porcelain(wt), "");
	assert.equal(porcelain(main), "");
	assertGreen(check(wt));
});

test("08b --dir pointing at a subdirectory of a repo, local mode: status empty, check green", () => {
	const top = repo({ "sub/app.ts": "export {};\n", "README.md": "x\n" });
	const sub = path.join(top, "sub");
	scaffoldAndResolve(sub, { mode: "local", tracker: "none" });
	assert.equal(porcelain(top), "");
	assertGreen(check(sub));
});

test("08c --dir pointing at a subdirectory of a repo, tracked mode: check green and detection sees the subdirectory files", () => {
	const top = repo({ "sub/app.ts": "export {};\n", "README.md": "x\n" });
	const sub = path.join(top, "sub");
	scaffoldAndResolve(sub, tracked);
	assert.match(confValue(sub, "SLASH_EXTS"), /\bts\b/);
	assertGreen(check(sub));
});

test("09a ado preset with two servers gates every write tool on both: 24 ask rules", () => {
	const dir = plain();
	const res = scaffoldAndResolve(dir, { tracker: "ado", "ado-servers": "alpha,beta" });
	assert.match(res.stdout, /merged\s+\.claude\/settings\.json \(24 ask rules\)/);
	const ask = settingsOf(dir).permissions.ask;
	assert.ok(ask.includes("mcp__alpha__pipelines_write"));
	assert.ok(ask.includes("mcp__beta__wit_work_item_write"));
	assertGreen(check(dir));
});

test("09b ado preset accepts ado-servers as an array and as a space separated string", () => {
	const a = plain();
	const b = plain();
	assert.match(scaffold(a, { tracker: "ado", "ado-servers": ["x", "y", "z"] }).stdout, /\(36 ask rules\)/);
	assert.match(scaffold(b, { tracker: "ado", "ado-servers": "x y" }).stdout, /\(24 ask rules\)/);
});

test("09c ado preset default server gates 12 write tools and extra ask rules are added on top", () => {
	const dir = plain();
	const res = scaffold(dir, { tracker: "ado", ask: ["mcp__other__thing"] });
	assert.match(res.stdout, /\(13 ask rules\)/);
	assert.ok(settingsOf(dir).permissions.ask.includes("mcp__azure-devops__wit_work_item_write"));
});

test("09d github preset gates 9 gh verbs across Bash, rtk and PowerShell: 27 rules, check green", () => {
	const dir = plain();
	const res = scaffoldAndResolve(dir, { tracker: "github" });
	assert.match(res.stdout, /\(27 ask rules\)/);
	assert.ok(settingsOf(dir).permissions.ask.includes("Bash(gh pr merge:*)"));
	assertGreen(check(dir));
});

test("09e none preset has no ask rules and the sample ticket still passes the reminder smoke test", () => {
	const dir = plain();
	const res = scaffoldAndResolve(dir, { tracker: "none" });
	assert.match(res.stdout, /\(0 ask rules\)/);
	assertGreen(check(dir));
});

test("10a Jira-style custom tracker: values reach harness.conf intact and smoke passes", () => {
	const dir = repo();
	scaffoldAndResolve(dir, {
		...tracked,
		"ticket-mention": "(SHOP|OPS)-[0-9]+",
		"ticket-id": "(SHOP|OPS)-[0-9]+",
		"ticket-sample": "SHOP-4242",
		disposition: "(SHOP|OPS)-[0-9]+|ruled|filed",
		ask: ["mcp__jira__create_issue", "Bash(jira close:*)"],
	});
	assert.equal(confValue(dir, "TICKET_MENTION"), "(SHOP|OPS)-[0-9]+");
	assert.equal(confValue(dir, "TICKET_ID"), "(SHOP|OPS)-[0-9]+");
	assert.equal(confValue(dir, "TICKET_SAMPLE"), "SHOP-4242");
	assert.equal(confValue(dir, "DISPOSITION"), "(SHOP|OPS)-[0-9]+|ruled|filed");
	assert.ok(settingsOf(dir).permissions.ask.includes("Bash(jira close:*)"));
	assertGreen(check(dir));
});

test("10b hash-style custom tracker (#123): values reach harness.conf intact and smoke passes", () => {
	const dir = repo();
	scaffoldAndResolve(dir, {
		...tracked,
		"ticket-mention": "#[0-9]+",
		"ticket-id": "[0-9]+",
		"ticket-sample": "fixes #4242",
	});
	assert.equal(confValue(dir, "TICKET_MENTION"), "#[0-9]+");
	assert.equal(confValue(dir, "TICKET_SAMPLE"), "fixes #4242");
	assertGreen(check(dir));
});

test("10c custom values containing $& and $1 are written literally", () => {
	const dir = repo();
	scaffoldAndResolve(dir, { ...tracked, "ticket-mention": "KEY-[0-9]+$", "ticket-id": "[0-9]+", "ticket-sample": "KEY-1", name: "a$&b$1" });
	assert.equal(confValue(dir, "TICKET_MENTION"), "KEY-[0-9]+$");
	assert.ok(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8").startsWith("# a$&b$1 Agent Entry"));
});

for (const ext of ["vue", "sh", "sql", "kts", "lua", "ex"]) {
	test(`11 extension detection: repo holding only .${ext} files scaffolds and checks green`, () => {
		const dir = repo({ [`file.${ext}`]: "x\n" });
		scaffoldAndResolve(dir, tracked);
		assertGreen(check(dir));
	});
}

test("11b files with no extension scaffold and check green", () => {
	const dir = repo({ Makefile: "all:\n", LICENSE: "MIT\n", Dockerfile: "FROM scratch\n" });
	scaffoldAndResolve(dir, tracked);
	assertGreen(check(dir));
});

test("11c a .py + .ts mix puts ts in SLASH_EXTS and py in HASH_EXTS and checks green", () => {
	const dir = repo({ "a.py": "x = 1\n", "b.ts": "export {};\n" });
	scaffoldAndResolve(dir, tracked);
	assert.equal(confValue(dir, "SLASH_EXTS"), "ts");
	assert.equal(confValue(dir, "HASH_EXTS"), "py");
	assertGreen(check(dir));
});

test("11d an empty slash-exts and hash-exts (comment ban off) stays off and checks green", () => {
	const dir = repo({ "a.py": "x = 1\n", "b.ts": "export {};\n" });
	scaffoldAndResolve(dir, { ...tracked, "slash-exts": "", "hash-exts": "" });
	assert.equal(confValue(dir, "SLASH_EXTS"), "");
	assert.equal(confValue(dir, "HASH_EXTS"), "");
	assertGreen(check(dir));
});

test("11e a tracked file with a non-ASCII name is still detected by extension", () => {
	const dir = repo({ "tệp.ts": "export {};\n" });
	scaffoldAndResolve(dir, tracked);
	assert.equal(confValue(dir, "SLASH_EXTS"), "ts");
});

test("11f an empty slash-exts override wins over detection while hash-exts is still detected", () => {
	const dir = repo({ "a.py": "x = 1\n", "b.ts": "export {};\n" });
	scaffoldAndResolve(dir, { ...tracked, "slash-exts": "" });
	assert.equal(confValue(dir, "SLASH_EXTS"), "");
	assert.equal(confValue(dir, "HASH_EXTS"), "py");
});

test("12a a doc legitimately filled with spaced {{ handlebars }} text does not trip the check", () => {
	const doc = "# Design\n\nTemplates use {{ title }} and Helm uses {{ .Values.image.tag }}.\n";
	const dir = repo({ "app.js": "1\n", "Design.MD": doc });
	scaffoldAndResolve(dir, tracked);
	assertGreen(check(dir));
});

test("12b a doc legitimately filled with unspaced {{title}} Vue text does not trip the check", () => {
	const doc = "# Design\n\nThe Vue template renders {{title}} and {{user}}.\n";
	const dir = repo({ "app.js": "1\n", "Design.MD": doc });
	scaffoldAndResolve(dir, tracked);
	assertGreen(check(dir));
});

test("12c a pre-existing project skill containing {{var}} does not trip the check", () => {
	const dir = repo({
		"app.js": "1\n",
		".claude/skills/other/SKILL.md": "---\nname: other\ndescription: x\n---\n\nUse {{var}} in the template.\n",
	});
	scaffoldAndResolve(dir, tracked);
	assertGreen(check(dir));
});

test("12d a pre-existing project skill with an init-like HTML comment does not trip the check", () => {
	const dir = repo({
		"app.js": "1\n",
		".claude/skills/other/SKILL.md": "---\nname: other\ndescription: x\n---\n\n<!-- init: owned by someone else -->\n",
	});
	scaffoldAndResolve(dir, tracked);
	assertGreen(check(dir));
});

let crlfClone;
const cloneWithCrlf = () => {
	if (crlfClone) return crlfClone;
	const target = path.join(fresh("clone"), "claude-skills");
	const res = spawnSync("git", ["clone", "-q", "-c", "core.autocrlf=true", skillsRepo, target], { encoding: "utf8" });
	assert.equal(res.status, 0, res.stderr);
	crlfClone = target;
	return target;
};
const hookFilesOf = (dir) => {
	const hooks = path.join(dir, ".claude", "hooks");
	return fs.readdirSync(hooks).map((name) => [name, fs.readFileSync(path.join(hooks, name), "utf8")]);
};
const scaffoldFromClone = () => {
	const clone = cloneWithCrlf();
	const clonedScript = path.join(clone, "init", "scripts", "scaffold.mjs");
	const hookInClone = fs.readFileSync(path.join(clone, "init", "templates", ".claude", "hooks", "push-gate.sh"), "utf8");
	assert.ok(hookInClone.includes("\r"), "precondition: the autocrlf clone must hold CRLF hook sources");
	const dir = repo({ "app.ts": "export {};\n" });
	const cfg = { ...tracked, "skills-src": clone };
	const res = run(["--dir", dir], { cfg, scriptPath: clonedScript });
	assert.equal(res.status, 0, explain(res));
	resolveMarkers(dir);
	return { dir, clonedScript };
};

test("13a skill cloned with core.autocrlf=true: hook scripts and harness.conf arrive in the project with LF only", () => {
	const { dir } = scaffoldFromClone();
	const withCr = hookFilesOf(dir).filter(([, text]) => text.includes("\r")).map(([name]) => name);
	assert.deepEqual(withCr, [], `hook files that arrived with CRLF: ${withCr.join(", ")}`);
});

test("13b skill cloned with core.autocrlf=true: scaffold + check is green", () => {
	const { dir, clonedScript } = scaffoldFromClone();
	assertGreen(check(dir, clonedScript));
});

test("14 project repo with core.autocrlf=true: hook scripts deleted and restored by git checkout still check green", () => {
	const dir = fresh();
	git(dir, "init", "-q", "-b", "main");
	git(dir, "config", "core.autocrlf", "true");
	writeFiles(dir, { "app.js": "export const x = 1;\n" });
	commitAll(dir);
	scaffoldAndResolve(dir, tracked);
	commitAll(dir, "harness");
	fs.rmSync(path.join(dir, ".claude", "hooks"), { recursive: true, force: true });
	git(dir, "checkout", "--", ".");
	const withCr = hookFilesOf(dir).filter(([, text]) => text.includes("\r")).map(([name]) => name);
	assert.deepEqual(withCr, []);
	assertGreen(check(dir));
});

test("15a unknown tracker gives a one-line error and exit 1", () => {
	assertCleanFailure(scaffold(plain(), { tracker: "jira" }));
});

test("15b missing mode inside a repo gives a one-line error and exit 1", () => {
	assertCleanFailure(scaffold(repo(), { tracker: "none" }));
});

test("15c a skill name that does not exist gives a one-line error and exit 1", () => {
	assertCleanFailure(scaffold(plain(), { tracker: "none", skills: "pr,does-not-exist" }));
});

test("15d a missing config file gives a one-line error and exit 1", () => {
	const dir = plain();
	assertCleanFailure(run(["--dir", dir, "--config", path.join(root, "nope", "init.json")]));
});

test("15e a malformed config file gives a one-line error and exit 1", () => {
	const dir = plain();
	const file = path.join(fresh("cfg"), "bad.json");
	fs.writeFileSync(file, "{ not json");
	assertCleanFailure(run(["--dir", dir, "--config", file]));
});

test("15f an existing JSONC .claude/settings.json gives a one-line error, exit 1, and the file is untouched", () => {
	const jsonc = '{\n  // mine\n  "permissions": { "allow": ["Bash(ls:*)",], },\n}\n';
	const dir = repo({ "app.js": "1\n", ".claude/settings.json": jsonc });
	assertCleanFailure(scaffold(dir, tracked));
	assert.equal(fs.readFileSync(path.join(dir, ".claude", "settings.json"), "utf8"), jsonc);
});

test("15g --check before any scaffold exits 1 with a one-line error and never says the harness is in place", () => {
	const res = check(repo());
	assertCleanFailure(res);
});

test("15h an unknown mode gives a one-line error and exit 1", () => {
	assertCleanFailure(scaffold(repo(), { tracker: "none", mode: "bogus" }));
});

test("15i an unknown command line flag gives a one-line error and exit 1", () => {
	assertCleanFailure(run(["--dir", plain(), "--bogus"]));
});

test("15j a --dir that does not exist gives a one-line error and exit 1", () => {
	assertCleanFailure(run(["--dir", path.join(root, "no-such-dir")]));
});

test("15l ask given as a string instead of an array is rejected or kept whole, never split into characters", () => {
	const dir = plain();
	const res = scaffold(dir, { tracker: "none", ask: "mcp__x__write" });
	if (res.status === 0) {
		const ask = settingsOf(dir).permissions.ask;
		assert.ok(ask.every((rule) => rule.length > 1), JSON.stringify(ask));
	} else {
		assertCleanFailure(res);
	}
});

test("16 an existing design.md in another case is kept, not duplicated as Design.MD, and check green", () => {
	const dir = repo({ "app.js": "1\n", "design.md": "# my design\n" });
	const res = scaffoldAndResolve(dir, tracked);
	const designs = fs.readdirSync(dir).filter((name) => name.toLowerCase() === "design.md");
	assert.equal(designs.length, 1, designs.join(","));
	assert.equal(fs.readFileSync(path.join(dir, designs[0]), "utf8"), "# my design\n");
	assert.match(res.stdout, /keep\s+Design\.MD/);
	assertGreen(check(dir));
});

test('17 "skills": "" installs no skills and checks green', () => {
	const dir = repo();
	scaffoldAndResolve(dir, { ...tracked, skills: "" });
	assert.ok(!fs.existsSync(path.join(dir, ".claude", "skills")));
	assertGreen(check(dir));
});

test("18 plain-word command line flags (--mode --tracker --skills --name) work without a config", () => {
	const dir = repo();
	const res = run(["--dir", dir, "--mode", "tracked", "--tracker", "github", "--skills", "pr", "--name", "Flagged"]);
	assert.equal(res.status, 0, explain(res));
	resolveMarkers(dir);
	assert.ok(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8").startsWith("# Flagged Agent Entry"));
	assert.ok(fs.existsSync(path.join(dir, ".claude", "skills", "pr", "SKILL.md")));
	assert.ok(!fs.existsSync(path.join(dir, ".claude", "skills", "deploy")));
	assertGreen(check(dir));
});

test("19 a command line flag overrides the same key in the config", () => {
	const dir = repo();
	const res = run(["--dir", dir, "--mode", "tracked"], { cfg: { mode: "local", tracker: "none" } });
	assert.equal(res.status, 0, explain(res));
	assert.ok(fs.existsSync(path.join(dir, ".claude", "settings.json")));
	assert.ok(!fs.existsSync(path.join(dir, ".claude", "settings.local.json")));
});

test("20a check fails while fill markers are unresolved and lists them", () => {
	const dir = repo();
	scaffold(dir, tracked);
	const res = check(dir);
	assert.equal(res.status, 1);
	assert.match(res.stdout, /FAIL\s+unresolved AGENTS\.md/);
	assert.ok(!res.stdout.includes(PASS));
});

test("20b check fails when a hook is no longer wired in settings", () => {
	const dir = repo();
	scaffoldAndResolve(dir, tracked);
	const file = path.join(dir, ".claude", "settings.json");
	const settings = settingsOf(dir);
	delete settings.hooks.PostToolUse;
	fs.writeFileSync(file, JSON.stringify(settings));
	const res = check(dir);
	assert.equal(res.status, 1);
	assert.match(res.stdout, /FAIL\s+settings\.json wires no-code-comments\.sh/);
});

test("20c check fails when .agents/ is not ignored by git", () => {
	const dir = repo();
	scaffoldAndResolve(dir, tracked);
	fs.writeFileSync(path.join(dir, ".gitignore"), "");
	const res = check(dir);
	assert.equal(res.status, 1);
	assert.match(res.stdout, /FAIL\s+\.agents\/ is ignored by git/);
});

test("20d check fails when a hook script is broken (push-gate no longer blocks)", () => {
	const dir = repo();
	scaffoldAndResolve(dir, tracked);
	fs.writeFileSync(path.join(dir, ".claude", "hooks", "push-gate.sh"), "#!/usr/bin/env bash\nexit 0\n");
	const res = check(dir);
	assert.equal(res.status, 1);
	assert.match(res.stdout, /FAIL\s+push-gate blocks/);
});
