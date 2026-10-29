import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const scaffoldScript = path.resolve(here, "..", "scripts", "scaffold.mjs");
const resultsFile = path.join(here, "hooks.results.json");
const gitBash = path.join(process.env.ProgramFiles ?? "", "Git", "bin", "bash.exe");
const bash = fs.existsSync(gitBash) ? gitBash : "bash";
const slash = (p) => p.split(path.sep).join("/");
const lines = (...rows) => `${rows.join("\n")}\n`;
const forms = ["compact", "spaced"];
const slashExts = "cs js jsx mjs cjs ts tsx java go rs kt swift c cc cpp h hpp php scala dart";
const hashExts = "py rb";
const jiraPattern = "(SHOP|OPS)-[0-9]+";

const presetConfigs = {
	github: { tracker: "github" },
	ado: { tracker: "ado" },
	none: { tracker: "none" },
	jira: {
		tracker: "none",
		"ticket-mention": jiraPattern,
		"ticket-id": jiraPattern,
		"ticket-sample": "SHOP-4242",
		disposition: `#[0-9]+|${jiraPattern}|ruled|filed`,
	},
};

const results = [];
const timings = {};
const fx = {};
let root;
let counter = 0;

const freshDir = () => fs.mkdtempSync(path.join(root, "t-"));
const outcomeOf = (status) => (status === 2 ? "block" : status === 0 ? "pass" : `exit ${status}`);

function judge(hook, name, desired, observed) {
	results.push({ hook, case: name, desired, observed, pass: desired === observed });
	assert.equal(observed, desired, name);
}

function observe(hook, name, observed) {
	results.push({ hook, case: name, desired: null, observed, pass: null });
}

function serialize(value, spaced) {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((item) => serialize(item, spaced)).join(",")}]`;
	const colon = spaced ? ": " : ":";
	const members = Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}${colon}${serialize(item, spaced)}`);
	return `{${members.join(",")}}`;
}

const session = "7f3c2b1e-9d4a-4c55-8e21-0a1b2c3d4e5f";
const envelope = (event, over = {}) => ({
	session_id: session,
	transcript_path: `C:\\Users\\dev\\.claude\\projects\\C--proj\\${session}.jsonl`,
	cwd: "C:\\proj",
	permission_mode: "default",
	hook_event_name: event,
	...over,
});
const promptPayload = (prompt, over) => ({ ...envelope("UserPromptSubmit", over), prompt });
const commandPayload = (tool, command, description, over) => ({
	...envelope("PreToolUse", over),
	tool_name: tool,
	tool_input: { command, ...(description ? { description } : {}) },
	tool_use_id: "toolu_01A2b3C4d5E6f7G8h9I0jK",
});
const writePayload = (file, content, kind = "create") => ({
	...envelope("PostToolUse"),
	tool_name: "Write",
	tool_input: { file_path: file, content },
	tool_response: { type: kind, filePath: file, content, structuredPatch: [], originalFile: null },
	tool_use_id: "toolu_01A2b3C4d5E6f7G8h9I0jK",
});
const editPayload = (file, oldString, newString) => ({
	...envelope("PostToolUse"),
	tool_name: "Edit",
	tool_input: { file_path: file, old_string: oldString, new_string: newString, replace_all: false },
	tool_response: {
		filePath: file,
		oldString,
		newString,
		originalFile: oldString,
		structuredPatch: [],
		userModified: false,
		replaceAll: false,
	},
	tool_use_id: "toolu_01A2b3C4d5E6f7G8h9I0jK",
});

function git(cwd, ...args) {
	return spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

function runHook(repo, script, input, { project = repo.dir, tmp = freshDir() } = {}) {
	const env = { ...process.env, CLAUDE_PROJECT_DIR: slash(project), TMPDIR: slash(tmp) };
	const run = spawnSync(bash, [path.join(repo.dir, ".claude", "hooks", script)], { input, encoding: "utf8", env });
	return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

function buildRepo(name) {
	const dir = path.join(root, name);
	fs.mkdirSync(dir, { recursive: true });
	git(dir, "init", "-q", "-b", "main");
	git(dir, "config", "user.name", "Hook Tester");
	git(dir, "config", "user.email", "hooks@example.test");
	git(dir, "config", "core.autocrlf", "false");
	const config = path.join(root, `${name}.json`);
	fs.writeFileSync(
		config,
		JSON.stringify({ ...presetConfigs[name], "slash-exts": slashExts, "hash-exts": hashExts, skills: [] }),
	);
	const scaffold = spawnSync(process.execPath, [scaffoldScript, "--dir", dir, "--mode", "tracked", "--config", config], {
		encoding: "utf8",
	});
	assert.equal(scaffold.status, 0, scaffold.stderr);
	git(dir, "add", "-A");
	git(dir, "commit", "-q", "-m", "scaffold");
	const conf = fs.readFileSync(path.join(dir, ".claude", "hooks", "harness.conf"), "utf8");
	const sample = conf.match(/^TICKET_SAMPLE='([^']*)'/m)[1];
	return { name, dir, sample, id: sample.match(/SHOP-[0-9]+|[0-9]+/)[0] };
}

before(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "hooks-test-"));
	for (const name of Object.keys(presetConfigs)) fx[name] = buildRepo(name);
});

after(() => {
	fs.writeFileSync(resultsFile, `${JSON.stringify({ results, timings }, null, 2)}\n`);
	fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
});

const hookRunner = (script) => (form, repo, payload, options) =>
	runHook(repo, script, serialize(payload, form === "spaced"), options);
const sendPrompt = hookRunner("push-gate.sh");

function gate(form, { prompts = ["fix the bug"], command, tool = "Bash", description, over = {}, project, tmp }) {
	const shared = { project: project ?? freshDir(), tmp: tmp ?? freshDir() };
	for (const prompt of prompts) sendPrompt(form, fx.github, promptPayload(prompt, over), shared);
	const run = sendPrompt(form, fx.github, commandPayload(tool, command, description, over), shared);
	return outcomeOf(run.status);
}

describe("push-gate", () => {
	const blockCommands = [
		["git push", "git push"],
		["git push --force origin x", "git push --force origin x"],
		["rtk git push", "rtk git push"],
		["git -C path push", "git -C ../other push origin main"],
		["chained add commit push", "git add . && git commit -m x && git push"],
		["git -C quoted path with a space push", 'git -C "../my repo" push origin main'],
		["push on the second line of a command", "git add .\ngit push"],
		["gh pr create", "gh pr create --title t --body b"],
	];
	const passCommands = [
		["git stash push", "git stash push"],
		["git stash push -m wip", "git stash push -m wip"],
		["git log --grep=push", "git log --grep=push"],
		["git commit -m double-quoted push word", 'git commit -m "fix push notifications"'],
		["git commit -m single-quoted push word", "git commit -m 'fix push notifications'"],
		["git config push.default simple", "git config push.default simple"],
		["echo push", "echo push"],
		["cat src/push-service.ts", "cat src/push-service.ts"],
	];

	for (const form of forms) {
		for (const tool of ["Bash", "PowerShell"]) {
			for (const [name, command] of blockCommands) {
				test(`blocks ${name} via ${tool} [${form}]`, () => {
					judge("push-gate", `${name} (${tool}) [${form}]`, "block", gate(form, { command, tool }));
				});
			}
			for (const [name, command] of passCommands) {
				test(`passes ${name} via ${tool} [${form}]`, () => {
					judge("push-gate", `${name} (${tool}) [${form}]`, "pass", gate(form, { command, tool }));
				});
			}
		}

		test(`blocks git push with no prompt recorded yet [${form}]`, () => {
			judge("push-gate", `git push, no prior prompt [${form}]`, "block", gate(form, { prompts: [], command: "git push" }));
		});

		test(`passes harmless command whose description mentions git push [${form}]`, () => {
			const outcome = gate(form, {
				command: "git status",
				description: "Show git status so we know what to push",
			});
			judge("push-gate", `description mentions git ... push [${form}]`, "pass", outcome);
		});

		test(`passes harmless command whose description mentions the push [${form}]`, () => {
			const outcome = gate(form, { command: "git diff --stat", description: "Review the diff ahead of the push" });
			judge("push-gate", `description mentions the push [${form}]`, "pass", outcome);
		});

		test(`passes harmless command in a cwd containing github and push [${form}]`, () => {
			const outcome = gate(form, { command: "ls", over: { cwd: "C:\\repos\\github\\push-notifications" } });
			judge("push-gate", `ls with cwd C:\\repos\\github\\push-notifications [${form}]`, "pass", outcome);
		});

		test(`passes harmless command in a cwd containing digital-push [${form}]`, () => {
			const outcome = gate(form, { command: "ls", over: { cwd: "C:\\work\\digital-push-app" } });
			judge("push-gate", `ls with cwd C:\\work\\digital-push-app [${form}]`, "pass", outcome);
		});

		const intents = [
			["push it", "git push origin HEAD", "pass"],
			["please push", "git push origin HEAD", "pass"],
			["đẩy lên", "git push origin HEAD", "pass"],
			["tạo PR", "gh pr create --fill", "pass"],
			["/pr", "git push -u origin feature/x", "pass"],
			["create a PR", "gh pr create --fill", "pass"],
			["open a PR for this", "gh pr create --fill", "pass"],
			["fix it, don't ask, just push", "git push origin HEAD", "pass"],
			["commit xong thì push luôn nhé", "git push origin HEAD", "pass"],
			["fix the bug", "git push origin HEAD", "block"],
			["do not push yet", "git push origin HEAD", "block"],
			["commit thôi, chưa cần push", "git push origin HEAD", "block"],
			["fix the push notification bug", "git push origin HEAD", "block"],
			["update docs/pr/template.md", "git push origin HEAD", "block"],
		];
		for (const [prompt, command, desired] of intents) {
			test(`prompt "${prompt}" then ${command} [${form}]`, () => {
				judge("push-gate", `prompt "${prompt}" then ${command} [${form}]`, desired, gate(form, { prompts: [prompt], command }));
			});
		}

		test(`project path containing push does not open the gate via cwd [${form}]`, () => {
			const outcome = gate(form, {
				prompts: ["fix the bug"],
				command: "git push origin HEAD",
				over: { cwd: "C:\\work\\push-service" },
			});
			judge("push-gate", `cwd C:\\work\\push-service, prompt "fix the bug" [${form}]`, "block", outcome);
		});

		test(`project path containing push does not open the gate via transcript_path [${form}]`, () => {
			const outcome = gate(form, {
				prompts: ["fix the bug"],
				command: "git push origin HEAD",
				over: { transcript_path: `C:\\Users\\dev\\.claude\\projects\\C--work-push-service\\${session}.jsonl` },
			});
			judge("push-gate", `transcript_path ...push-service..., prompt "fix the bug" [${form}]`, "block", outcome);
		});

		test(`intent does not leak into the next prompt [${form}]`, () => {
			const outcome = gate(form, { prompts: ["push it", "fix the bug"], command: "git push origin HEAD" });
			judge("push-gate", `"push it" then "fix the bug" [${form}]`, "block", outcome);
		});

		test(`intent from a later asking prompt opens the gate [${form}]`, () => {
			const outcome = gate(form, { prompts: ["fix the bug", "push it"], command: "git push origin HEAD" });
			judge("push-gate", `"fix the bug" then "push it" [${form}]`, "pass", outcome);
		});

		test(`two project dirs do not share intent [${form}]`, () => {
			const tmp = freshDir();
			const projectA = freshDir();
			const projectB = freshDir();
			const command = "git push origin HEAD";
			sendPrompt(form, fx.github, promptPayload("push it"), { project: projectA, tmp });
			sendPrompt(form, fx.github, promptPayload("fix the bug"), { project: projectB, tmp });
			const inA = outcomeOf(sendPrompt(form, fx.github, commandPayload("Bash", command), { project: projectA, tmp }).status);
			const inB = outcomeOf(sendPrompt(form, fx.github, commandPayload("Bash", command), { project: projectB, tmp }).status);
			judge("push-gate", `project A asked, project B did not: A [${form}]`, "pass", inA);
			judge("push-gate", `project A asked, project B did not: B [${form}]`, "block", inB);
		});

		for (const prompt of ["don't push", "never push without asking me", "no pushing today"]) {
			test(`negated prompt ${prompt} keeps the gate shut [${form}]`, () => {
				judge("push-gate", `negation "${prompt}" then git push [${form}]`, "block", gate(form, { prompts: [prompt], command: "git push" }));
			});
		}

		test(`records unicode-escaped đẩy lên [${form}]`, () => {
			const shared = { project: freshDir(), tmp: freshDir() };
			const text = serialize(promptPayload("đẩy lên"), form === "spaced").replace(
				/[^\x00-\x7f]/g,
				(ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`,
			);
			runHook(fx.github, "push-gate.sh", text, shared);
			const run = sendPrompt(form, fx.github, commandPayload("Bash", "git push"), shared);
			observe("push-gate", `\\u-escaped "đẩy lên" then git push [${form}]`, outcomeOf(run.status));
		});
	}
});

function folderList(project) {
	const dir = path.join(project, "ticket-investigation");
	return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

function remind(form, repo, prompt, over = {}, project = freshDir()) {
	const run = hookRunner("ticket-reminder.sh")(form, repo, promptPayload(prompt, over), { project });
	return { run, project, folders: folderList(project).join(",") };
}

const sampleOf = (repo) => repo.sample;
const quotedPrompt = (repo) => `He said "read ${sampleOf(repo)}" and\nthen "reply ok".\n\nThanks`;

const ticketCases = [
	{ name: "sample creates the folder", prompt: (r) => `Please look at ${sampleOf(r)} today`, expect: (r) => [r.id] },
	{ name: "same sample twice makes one folder", prompt: (r) => `${sampleOf(r)} and again ${sampleOf(r)}`, expect: (r) => [r.id] },
	{ name: "escaped quotes and newlines", prompt: quotedPrompt, expect: (r) => [r.id] },
	{
		name: "several ids in one prompt",
		prompt: (r) =>
			({
				github: "issue 11, issue #22 and https://github.com/o/r/issues/33",
				ado: "ticket 11, work item 22 and https://dev.azure.com/o/p/_workitems/edit/33",
				none: "ticket 11 and ticket #22",
				jira: "SHOP-11 then OPS-22 and SHOP-33",
			})[r.name],
		expect: (r) =>
			({ github: ["11", "22", "33"], ado: ["11", "22", "33"], none: ["11", "22"], jira: ["OPS-22", "SHOP-11", "SHOP-33"] })[r.name],
	},
	{
		name: "github issue URL",
		prompt: () => "see https://github.com/o/r/issues/12",
		expect: (r) => (r.name === "github" ? ["12"] : undefined),
	},
	{
		name: "ado work item URL",
		prompt: () => "see https://dev.azure.com/o/p/_workitems/edit/12",
		expect: (r) => (r.name === "ado" ? ["12"] : undefined),
	},
	{ name: "issue #12", prompt: () => "look at issue #12", expect: (r) => (r.name === "github" ? ["12"] : undefined) },
	{ name: "ISSUE 12 uppercase", prompt: () => "look at ISSUE 12", expect: (r) => (r.name === "github" ? ["12"] : undefined) },
	{
		name: "TICKET 4242 uppercase",
		prompt: () => "look at TICKET 4242",
		expect: (r) => (r.name === "jira" ? undefined : ["4242"]),
	},
	{ name: "fixes #12", prompt: () => "this fixes #12", expect: () => undefined },
	{ name: "Ticket: 4242 with colon", prompt: () => "Ticket: 4242 is broken", expect: () => undefined },
	{ name: "Ticket then newline then number", prompt: () => "Ticket\n4242", expect: () => undefined },
	{ name: "lowercase shop-4242", prompt: () => "look at shop-4242", expect: () => undefined },
	{ name: "we hit this issue 3 times", prompt: () => "we hit this issue 3 times", expect: () => undefined },
	{ name: "DESKTOPS-2 embedded in a longer word", prompt: () => "check the DESKTOPS-2 laptop", expect: () => undefined },
	{
		name: "ordinary numbers",
		prompt: () => "retry 3 times on port 8080, bump to 2.10.4, 100 items, 192.168.1.10, 2026-10-01, version 6.19.0",
		expect: () => [],
	},
	{
		name: "task-notification payload skipped",
		prompt: (r) =>
			`<task-notification>\n<task-id>b4k9</task-id>\n<summary>Command finished, see ${sampleOf(r)}</summary>\n</task-notification>`,
		expect: () => [],
	},
];

const trackerCwds = {
	github: "C:\\work\\issue-12-fix",
	ado: "C:\\work\\ticket-77-fix",
	none: "C:\\work\\ticket-77-fix",
	jira: "C:\\work\\SHOP-9-service",
};
const trackerTranscripts = {
	github: `C:\\Users\\dev\\.claude\\projects\\C--work-issue-12-fix\\${session}.jsonl`,
	ado: `C:\\Users\\dev\\.claude\\projects\\C--work-ticket-77-fix\\${session}.jsonl`,
	none: `C:\\Users\\dev\\.claude\\projects\\C--work-ticket-77-fix\\${session}.jsonl`,
	jira: `C:\\Users\\dev\\.claude\\projects\\C--work-SHOP-9-service\\${session}.jsonl`,
};

describe("ticket-reminder", () => {
	for (const form of forms) {
		for (const preset of Object.keys(presetConfigs)) {
			const repo = fx;
			const label = (name) => `[${preset}] ${name} [${form}]`;

			for (const item of ticketCases) {
				test(label(item.name), () => {
					const target = repo[preset];
					const { folders } = remind(form, target, item.prompt(target));
					const desired = item.expect(target);
					if (desired === undefined) observe("ticket-reminder", label(item.name), folders || "(none)");
					else judge("ticket-reminder", label(item.name), desired.join(",") || "(none)", folders || "(none)");
				});
			}

			test(label("sample prints created and writes memory.md"), () => {
				const target = repo[preset];
				const { run, project } = remind(form, target, `look at ${target.sample}`);
				const memory = path.join(project, "ticket-investigation", target.id, "memory.md");
				const ok = run.stdout.includes("created") && fs.existsSync(memory);
				judge("ticket-reminder", label("sample prints created and writes memory.md"), "created", ok ? "created" : `stdout=${run.stdout.trim()}`);
			});

			test(label("second mention says the folder exists"), () => {
				const target = repo[preset];
				const first = remind(form, target, `look at ${target.sample}`);
				const second = remind(form, target, `again ${target.sample}`, {}, first.project);
				const message = second.run.stdout.includes("folder exists") ? "folder exists" : second.run.stdout.trim();
				judge("ticket-reminder", label("second mention says the folder exists"), "folder exists", message);
			});

			test(label("cwd that looks like a ticket, prompt mentions none"), () => {
				const { folders } = remind(form, repo[preset], "fix the login bug", { cwd: trackerCwds[preset] });
				judge("ticket-reminder", label(`cwd ${trackerCwds[preset]}, prompt "fix the login bug"`), "(none)", folders || "(none)");
			});

			test(label("transcript_path that looks like a ticket, prompt mentions none"), () => {
				const over = { transcript_path: trackerTranscripts[preset] };
				const { folders } = remind(form, repo[preset], "fix the login bug", over);
				judge("ticket-reminder", label("transcript_path ticket-like, prompt mentions none"), "(none)", folders || "(none)");
			});

			if (preset !== "jira") {
				test(label("existing BUG-445 folder, prompt names 445"), () => {
					const target = repo[preset];
					const project = freshDir();
					fs.mkdirSync(path.join(project, "ticket-investigation", "BUG-445"), { recursive: true });
					const word = preset === "github" ? "issue" : "ticket";
					const { folders } = remind(form, target, `continue ${word} 445`, {}, project);
					observe("ticket-reminder", label("existing BUG-445, prompt names 445"), folders);
				});
			}
		}
	}
});

let sourceCounter = 0;

function sourceFile(repo, spec) {
	const folder = repo
		? path.join(repo.dir, "cases", `c${++sourceCounter}`, ...(spec.subdir ? [spec.subdir] : []))
		: path.join(freshDir(), ...(spec.subdir ? [spec.subdir] : []));
	fs.mkdirSync(folder, { recursive: true });
	const file = path.join(folder, spec.file);
	if (spec.committed !== undefined) {
		fs.writeFileSync(file, spec.committed);
		git(repo.dir, "add", "--", file);
		git(repo.dir, "commit", "-q", "-m", "seed", "--", file);
	}
	fs.writeFileSync(file, spec.content);
	return file;
}

function commentOutcome(form, spec) {
	const repo = spec.outside ? null : fx.github;
	const file = sourceFile(repo, spec);
	const shown = spec.forward ? slash(file) : file;
	const payload =
		spec.committed === undefined
			? writePayload(shown, spec.content)
			: editPayload(shown, spec.committed, spec.content);
	const run = runHook(fx.github, "no-code-comments.sh", serialize(payload, form === "spaced"), {
		project: repo?.dir ?? root,
	});
	return outcomeOf(run.status);
}

const ts = (name, content, desired, extra = {}) => ({ name, file: "a.ts", content, desired, ...extra });
const withComments = lines("// existing note", "const a = 1;");

const commentCases = [
	{
		name: "Apache licence header block, new .java",
		file: "A.java",
		desired: "pass",
		content: lines(
			"/*",
			" * Copyright 2024 Acme",
			" *",
			' * Licensed under the Apache License, Version 2.0 (the "License");',
			" * you may not use this file except in compliance with the License.",
			" */",
			"package com.acme;",
			"",
			"public class A {}",
		),
	},
	ts("MIT licence header block, new .ts", lines("/*", " * MIT License", " * Copyright (c) 2024 Acme", " */", "export const a = 1;"), "pass"),
	{ name: "/// doc comment, C#", file: "A.cs", desired: "pass", content: lines("/// <summary>Does a thing.</summary>", "public void A() {}") },
	{ name: "/// doc comment, Rust", file: "a.rs", desired: "pass", content: lines("/// Returns one.", "fn a() -> i32 { 1 }") },
	{ name: "//! inner doc comment, Rust", file: "a.rs", desired: "pass", content: lines("//! Crate docs.", "fn a() {}") },
	ts("/// <reference /> in TS", lines('/// <reference types="node" />', "export const a = 1;"), "pass"),
	{ name: "//go:build", file: "a.go", desired: "pass", content: lines("//go:build linux", "", "package a") },
	{ name: "leading //nolint", file: "a.go", desired: "pass", content: lines("package a", "", "//nolint:errcheck", "func A() {}") },
	{ name: "trailing //nolint", file: "a.go", desired: "pass", content: lines("package a", "", "func A() { f() //nolint", "}") },
	ts("// eslint-disable-next-line", lines("// eslint-disable-next-line no-console", "console.log(1);"), "pass"),
	ts("// @ts-expect-error", lines("// @ts-expect-error", 'const a: number = "x";'), "pass"),
	ts("URL in a string", lines('const u = "https://x.y/z";'), "pass"),
	ts("string containing a//b", lines('const s = "a//b";'), "pass"),
	ts("single-quoted string containing a//b", lines("const s = 'a//b';"), "pass"),
	ts("template string containing a//b", lines("const s = `a//b`;"), "pass"),
	ts("scheme-less URL string //cdn.example.com", lines('const cdn = "//cdn.example.com/lib.js";'), "pass"),
	ts("regex literal /\\/\\//", `${String.raw`const r = /\/\//;`}\n`, "pass"),
	ts("glob string src/**/*.ts", lines('const g = "src/**/*.ts";'), "pass"),
	{ name: "Python shebang", file: "a.py", desired: "pass", content: lines("#!/usr/bin/env python3", "print(1)") },
	{ name: "Python trailing # type: ignore", file: "a.py", desired: "pass", content: lines('x: int = "a"  # type: ignore') },
	{ name: "Python leading # type: ignore", file: "a.py", desired: "pass", content: lines("# type: ignore", "x = 1") },
	{ name: "Python # noqa", file: "a.py", desired: "pass", content: lines("import os  # noqa: F401") },
	{ name: "Python coding cookie", file: "a.py", desired: "pass", content: lines("# -*- coding: utf-8 -*-", "print(1)") },
	{
		name: "Python docstring",
		file: "a.py",
		desired: "pass",
		content: lines('"""Module docs."""', "", "", "def a():", '    """Do a thing."""', "    return 1"),
	},
	{ name: 'Python color = "#fff"', file: "a.py", desired: "pass", content: lines('color = "#fff"') },
	{
		name: 'Python f"{x}  # not a comment"',
		file: "a.py",
		desired: "pass",
		content: lines("x = 1", 'print(f"{x}  # not a comment")'),
	},
	{ name: "Ruby frozen_string_literal", file: "a.rb", desired: "pass", content: lines("# frozen_string_literal: true", "", "puts 1") },
	ts("edit to tracked file with existing comments, added line has none", `${withComments}const b = 2;\n`, "pass", {
		committed: withComments,
	}),
	{ name: "unlisted extension .txt with // note", file: "notes.txt", desired: "pass", content: lines("// note") },
	{ name: "unlisted extension .md with # heading", file: "README.md", desired: "pass", content: lines("# Title", "", "text") },
	{ name: "unlisted extension .sh with # note", file: "run.sh", desired: "pass", content: lines("# note", "echo 1") },
	{ name: "unlisted extension .yml with # note", file: "ci.yml", desired: "pass", content: lines("# note", "a: 1") },
	{ name: "path with spaces, clean", file: "a b.ts", subdir: "dir with space", desired: "pass", content: lines("export const a = 1;") },
	ts("file outside any git repo, clean", lines("export const a = 1;"), "pass", { outside: true }),

	ts("new // note line", lines("// note", "export const a = 1;"), "block"),
	{ name: "new /* note */, Java", file: "A.java", desired: "block", content: lines("/* note */", "class A {}") },
	ts("trailing x = 1; // note", lines("export const x = 1; // note"), "block"),
	{ name: "Python # note", file: "a.py", desired: "block", content: lines("# note", "x = 1") },
	{ name: "Python x = 1  # note", file: "a.py", desired: "block", content: lines("x = 1  # note") },
	{ name: "Ruby # note", file: "a.rb", desired: "block", content: lines("# note", "puts 1") },
	{
		name: "JSX {/* note */}, .tsx",
		file: "A.tsx",
		desired: "block",
		content: lines("export const A = () => (", "  <div>", "    {/* note */}", "  </div>", ");"),
	},
	{
		name: "JSX {/* note */}, .jsx",
		file: "A.jsx",
		desired: "block",
		content: lines("export const A = () => (", "  <div>", "    {/* note */}", "  </div>", ");"),
	},
	{ name: "path with spaces, // note", file: "a b.ts", subdir: "dir with space", desired: "block", content: lines("// note") },
	ts("forward-slash path, // note", lines("// note"), "block", { forward: true }),
	ts("edit adds // note to tracked file", `${withComments}// another note\n`, "block", { committed: withComments }),
	ts("edit adds trailing // note to tracked file", `${withComments.replace("const a = 1;", "const a = 1; // why")}`, "block", {
		committed: withComments,
	}),

	ts("JSDoc /** */", lines("/** Adds one. */", "export const add = (n: number) => n + 1;"), null),
	{ name: "Python x = 1 # note (single space)", file: "a.py", desired: null, content: lines("x = 1 # note") },
	ts("editing text of an existing comment line", lines("// existing note changed", "const a = 1;"), null, {
		committed: withComments,
	}),
	ts("file outside any git repo, // note", lines("// note"), null, { outside: true }),
	ts("// Copyright header lines, new .ts", lines("// Copyright 2024 Acme", "// Licensed under the MIT License", "export const a = 1;"), null),
	ts("/*! banner */ header, new .ts", lines("/*! lib v1.0 | MIT */", "export const a = 1;"), null),
];

describe("no-code-comments", () => {
	for (const form of forms) {
		for (const item of commentCases) {
			const label = `${item.name} [${form}]`;
			test(label, () => {
				const outcome = commentOutcome(form, item);
				if (item.desired === null) observe("no-code-comments", label, outcome);
				else judge("no-code-comments", label, item.desired, outcome);
			});
		}

		for (const ext of slashExts.split(" ")) {
			test(`blocks // note in .${ext} [${form}]`, () => {
				const outcome = commentOutcome(form, { file: `a.${ext}`, content: lines("// note") });
				judge("no-code-comments", `// note in .${ext} [${form}]`, "block", outcome);
			});
		}
		for (const ext of hashExts.split(" ")) {
			test(`blocks # note in .${ext} [${form}]`, () => {
				const outcome = commentOutcome(form, { file: `a.${ext}`, content: lines("# note") });
				judge("no-code-comments", `# note in .${ext} [${form}]`, "block", outcome);
			});
		}
	}
});

const memoryLines = (...rows) => lines("# 101", "", "State: Active", "", "## Notes", ...rows);

function deferredOutcome(form, repo, spec) {
	const project = freshDir();
	const file = path.join(project, ...(spec.rel ?? "ticket-investigation/101/memory.md").split("/"));
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, spec.content);
	const shown = spec.forward ? slash(file) : file;
	const run = runHook(repo, "deferred-findings.sh", serialize(writePayload(shown, spec.content), form === "spaced"), { project });
	return outcomeOf(run.status);
}

const triggerPhrases = [
	"flag separately",
	"flag it separately",
	"Flag It Separately",
	"not my bug",
	"separate ticket",
	"separate bug",
	"separate defect",
	"follow-up ticket",
	"followup ticket",
	"own bug",
	"own ticket",
	"file a ticket",
	"pre-existing bug",
];
const dispositions = [
	["#123", "tracked as #123"],
	["ruled by X 2026-01-01", "ruled by X 2026-01-01"],
	["filed", "filed"],
];

describe("deferred-findings", () => {
	for (const form of forms) {
		for (const phrase of triggerPhrases) {
			test(`blocks "${phrase}" [${form}]`, () => {
				const content = memoryLines(`- The create form loses the value, ${phrase}`);
				judge("deferred-findings", `trigger "${phrase}" [${form}]`, "block", deferredOutcome(form, fx.github, { content }));
			});
		}

		for (const preset of Object.keys(presetConfigs)) {
			const forms2 = preset === "jira" ? [...dispositions, ["SHOP-12", "see SHOP-12"]] : dispositions;
			for (const [name, text] of forms2) {
				test(`[${preset}] accepts disposition ${name} [${form}]`, () => {
					const content = memoryLines(`- Pre-existing bug in the save path, ${text}`);
					judge(
						"deferred-findings",
						`[${preset}] disposition "${name}" [${form}]`,
						"pass",
						deferredOutcome(form, fx[preset], { content }),
					);
				});
			}
			test(`[${preset}] still blocks a line with no disposition [${form}]`, () => {
				const content = memoryLines("- Pre-existing bug in the save path, see below");
				judge("deferred-findings", `[${preset}] no disposition [${form}]`, "block", deferredOutcome(form, fx[preset], { content }));
			});
		}

		const leak = "- Not my bug, the save path is slow";
		const other = [
			["md outside ticket-investigation passes", { rel: "docs/notes.md", content: memoryLines(leak) }, "pass"],
			["forward-slash path blocks", { content: memoryLines(leak), forward: true }, "block"],
			["nested evidence/notes.md blocks", { rel: "ticket-investigation/1/evidence/notes.md", content: memoryLines(leak) }, "block"],
			["Windows backslash path blocks", { content: memoryLines(leak) }, "block"],
			["clean memory.md passes", { content: memoryLines("- Root cause found and fixed") }, "pass"],
			[
				"one leak among dispositioned lines still blocks",
				{ content: memoryLines("- Pre-existing bug A, filed", leak, "- Separate ticket B, #9") },
				"block",
			],
			[
				"leak is not excused by a disposition on another line",
				{ content: memoryLines("- Filed #55 for something else", leak) },
				"block",
			],
			[
				"profiled is not a disposition",
				{ content: memoryLines("- Not my bug: the query is slow, I profiled it but have not decided") },
				"block",
			],
			[
				"overruled is not a disposition",
				{ content: memoryLines("- Pre-existing bug, my first idea was overruled by the compiler") },
				"block",
			],
		];
		for (const [name, spec, desired] of other) {
			test(`${name} [${form}]`, () => {
				judge("deferred-findings", `${name} [${form}]`, desired, deferredOutcome(form, fx.github, spec));
			});
		}

		const recorded = [
			["follow up ticket (space instead of hyphen)", { content: memoryLines("- Needs a follow up ticket") }],
			["pre-existing defect", { content: memoryLines("- This is a pre-existing defect") }],
			["separate issue", { content: memoryLines("- This is a separate issue") }],
			["non-md file in ticket-investigation", { rel: "ticket-investigation/1/notes.txt", content: memoryLines(leak) }],
			["ticket-investigation-old directory", { rel: "ticket-investigation-old/1/memory.md", content: memoryLines(leak) }],
		];
		for (const [name, spec] of recorded) {
			test(`records ${name} [${form}]`, () => {
				observe("deferred-findings", `${name} [${form}]`, deferredOutcome(form, fx.github, spec));
			});
		}
	}
});

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

function timeIt(fn) {
	const samples = [];
	for (let i = 0; i < 5; i += 1) {
		const start = performance.now();
		fn();
		samples.push(performance.now() - start);
	}
	return Math.round(median(samples));
}

describe("performance", () => {
	test("median of 5 runs per hook on a 5,000-line tracked file", () => {
		const repo = fx.github;
		const original = Array.from({ length: 5000 }, (_, i) => `export const value${i} = ${i};`).join("\n") + "\n";
		const edited = original.replace("export const value2500 = 2500;", "export const value2500 = 2501;");
		const file = sourceFile(repo, { file: "big.ts", committed: original, content: edited });
		const project = freshDir();
		const memory = path.join(project, "ticket-investigation", "101", "memory.md");
		fs.mkdirSync(path.dirname(memory), { recursive: true });
		fs.writeFileSync(memory, memoryLines(...Array.from({ length: 4995 }, (_, i) => `- note ${i}`)));
		const send = (script, payload, options) => () => runHook(repo, script, serialize(payload, false), options);
		const tmp = freshDir();
		const shared = { project, tmp };
		const sourceEdit = editPayload(file, original, edited);
		const memoryEdit = editPayload(memory, "- note 2500", "- note 2501");
		timings["bash startup (bash -c true)"] = timeIt(() => spawnSync(bash, ["-c", "true"]));
		timings["push-gate UserPromptSubmit"] = timeIt(send("push-gate.sh", promptPayload("fix the bug"), shared));
		timings["push-gate PreToolUse git push (blocked)"] = timeIt(send("push-gate.sh", commandPayload("Bash", "git push"), shared));
		timings["ticket-reminder prompt with ticket"] = timeIt(send("ticket-reminder.sh", promptPayload(`look at ${repo.sample}`), shared));
		timings["no-code-comments Edit on 5,000-line tracked file"] = timeIt(send("no-code-comments.sh", sourceEdit, shared));
		timings["deferred-findings Edit on 5,000-line memory.md"] = timeIt(send("deferred-findings.sh", memoryEdit, shared));
		assert.ok(Object.values(timings).every((ms) => ms > 0));
	});
});
