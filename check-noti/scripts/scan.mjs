#!/usr/bin/env node
import { execFileSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, ...v]) => [k, v.join("=") || "true"])
);
const org = args.org;
const project = args.project;
const days = Number(args.days ?? 30);
if (!org || !project) {
  console.error("usage: scan.mjs --org=<org> --project=<project> [--tenant=<id>] [--wiki=<local clone>] [--days=30]");
  process.exit(2);
}

const ADO_RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";
const DONE_STATES = new Set(["Closed", "Done", "Removed", "Resolved"]);
const VOTE = { 10: "approved", 5: "approved with suggestions", 0: "no vote", "-5": "waiting for author", "-10": "rejected" };
const since = Date.now() - days * 86400000;

function token() {
  if (args.tenant && !/^[0-9a-f-]{36}$/i.test(args.tenant)) {
    console.error("--tenant must be a tenant GUID");
    process.exit(2);
  }
  const tenant = args.tenant ? ` --tenant ${args.tenant}` : "";
  try {
    return execSync(`az account get-access-token --resource ${ADO_RESOURCE}${tenant} --query accessToken -o tsv`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    console.error(`AUTH: az token failed. Run: az login${args.tenant ? ` --tenant ${args.tenant}` : ""} --allow-no-subscriptions`);
    process.exit(3);
  }
}
const auth = { Authorization: `Bearer ${token()}` };
const base = `https://dev.azure.com/${org}`;

async function api(path, body) {
  const res = await fetch(path.startsWith("http") ? path : `${base}/${path}`, {
    method: body ? "POST" : "GET",
    headers: { ...auth, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${path}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const me = (await api("_apis/connectionData")).authenticatedUser;
const myId = me.id.toLowerCase();
const mentionsMe = (text = "") => text.toLowerCase().includes(myId);
const byMe = (c) => c.author?.id?.toLowerCase() === myId || c.createdBy?.id?.toLowerCase() === myId;
const strip = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/@<[0-9A-F-]{36}>/gi, "@…").replace(/\s+/g, " ").trim().slice(0, 160);
const prUrl = (pr) => `${base}/${encodeURIComponent(pr.repository.project.name)}/_git/${encodeURIComponent(pr.repository.name)}/pullrequest/${pr.pullRequestId}`;
const wiUrl = (id) => `${base}/${encodeURIComponent(project)}/_workitems/edit/${id}`;
const found = [];
const add = (kind, priority, where, what, url, extra = {}) => found.push({ kind, priority, where, what, url, ...extra });

function humanThreads(threads) {
  return threads.filter((t) => !t.isDeleted && t.comments?.some((c) => c.commentType === "text" && !c.isDeleted));
}
const textComments = (t) => t.comments.filter((c) => c.commentType === "text" && !c.isDeleted);
const isOpen = (t) => t.status === "active" || t.status === "pending";

async function threadsOf(pr) {
  return humanThreads((await api(`${pr.repository.project.name}/_apis/git/repositories/${pr.repository.id}/pullRequests/${pr.pullRequestId}/threads?api-version=7.1`)).value);
}

async function scanPullRequests() {
  const prs = (await api(`${encodeURIComponent(project)}/_apis/git/pullrequests?searchCriteria.status=active&$top=500&api-version=7.1`)).value;
  for (const pr of prs) {
    const mine = pr.createdBy.id.toLowerCase() === myId;
    const myReview = pr.reviewers?.find((r) => r.id.toLowerCase() === myId);
    const where = `PR !${pr.pullRequestId} ${pr.title} (${pr.repository.name})`;
    const threads = await threadsOf(pr);

    if (mine) {
      for (const r of pr.reviewers ?? []) {
        if (r.vote < 0) add("my-pr-vote", 1, where, `${r.displayName} voted ${VOTE[r.vote]}`, prUrl(pr));
      }
      if (pr.mergeStatus === "conflicts") add("my-pr-conflict", 1, where, "merge conflicts with target", prUrl(pr));
      if (pr.isDraft) add("my-pr-draft", 3, where, "still a draft", prUrl(pr));
      for (const t of threads.filter(isOpen)) {
        const cs = textComments(t);
        const last = cs.at(-1);
        if (!byMe(last)) {
          add("my-pr-thread", 1, where, `${last.author.displayName}: ${strip(last.content)}`, `${prUrl(pr)}?discussionId=${t.id}`, {
            file: t.threadContext?.filePath,
          });
        }
      }
      const links = await api(`${pr.repository.project.name}/_apis/git/repositories/${pr.repository.id}/pullRequests/${pr.pullRequestId}/workitems?api-version=7.1`);
      if (!links.count) add("process", 2, where, "PR has no linked work item", prUrl(pr));
      const approvals = (pr.reviewers ?? []).filter((r) => r.vote >= 5 && r.id.toLowerCase() !== myId).length;
      if (!approvals && !(pr.reviewers ?? []).some((r) => r.id.toLowerCase() !== myId && !r.isContainer)) {
        add("process", 2, where, "no human reviewer added", prUrl(pr));
      }
    }

    if (myReview && !mine) {
      if (myReview.vote === 0) add("review-requested", 2, where, `review requested from you${myReview.isRequired ? " (required)" : ""}`, prUrl(pr));
      for (const t of threads.filter(isOpen)) {
        const cs = textComments(t);
        if (byMe(cs[0]) && !byMe(cs.at(-1))) {
          add("review-followup", 1, where, `${cs.at(-1).author.displayName} replied to your comment: ${strip(cs.at(-1).content)}`, `${prUrl(pr)}?discussionId=${t.id}`);
        }
      }
    }

    for (const t of threads) {
      const cs = textComments(t);
      const lastMention = cs.findLastIndex((c) => !byMe(c) && mentionsMe(c.content));
      if (lastMention < 0 || cs.slice(lastMention + 1).some(byMe)) continue;
      if (mine && isOpen(t)) continue;
      add("pr-mention", 1, where, `${cs[lastMention].author.displayName} mentioned you: ${strip(cs[lastMention].content)}`, `${prUrl(pr)}?discussionId=${t.id}`);
    }
  }
  return prs.length;
}

async function wiql(query) {
  const r = await api(`${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.1`, { query });
  return r.workItems.map((w) => w.id);
}

async function workItems(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 200) {
    const r = await api(`_apis/wit/workitems?ids=${ids.slice(i, i + 200).join(",")}&$expand=relations&api-version=7.1`);
    out.push(...r.value);
  }
  return out;
}

const commentsOf = async (id) =>
  (await api(`${encodeURIComponent(project)}/_apis/wit/workItems/${id}/comments?$top=200&api-version=7.1-preview.4`)).comments;

async function scanMentions() {
  const ids = await wiql("SELECT [System.Id] FROM WorkItems WHERE [System.Id] IN (@RecentMentions) ORDER BY [System.ChangedDate] DESC");
  const items = new Map((await workItems(ids)).map((w) => [w.id, w]));
  for (const id of ids) {
    const cs = (await commentsOf(id)).sort((a, b) => a.createdDate.localeCompare(b.createdDate));
    const i = cs.findLastIndex((c) => !byMe(c) && mentionsMe(c.text));
    if (i < 0 || Date.parse(cs[i].createdDate) < since || cs.slice(i + 1).some(byMe)) continue;
    const w = items.get(id)?.fields ?? {};
    add("wi-mention", 1, `#${id} ${w["System.Title"]} [${w["System.State"]}]`, `${cs[i].createdBy.displayName} mentioned you: ${strip(cs[i].text)}`, wiUrl(id), {
      at: cs[i].createdDate,
    });
  }
  return ids.length;
}

async function scanAssigned() {
  const ids = await wiql(
    `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.AssignedTo] = @Me AND [System.State] NOT IN ('Closed','Done','Removed','Resolved') ORDER BY [System.ChangedDate] DESC`
  );
  for (const w of await workItems(ids)) {
    const f = w.fields;
    const where = `#${w.id} ${f["System.Title"]} [${f["System.WorkItemType"]}, ${f["System.State"]}]`;
    const prLinks = (w.relations ?? []).filter((r) => r.rel === "ArtifactLink" && /PullRequestId/i.test(r.url));
    if (prLinks.length) {
      const states = await Promise.all(
        prLinks.map(async (r) => {
          const [, , prId] = decodeURIComponent(r.url).split("/").slice(-3);
          const pr = await api(`_apis/git/pullrequests/${prId}?api-version=7.1`).catch(() => null);
          return pr?.status;
        })
      );
      if (states.every((s) => s === "completed")) add("process", 2, where, "all linked PRs merged but item is not Resolved/Closed", wiUrl(w.id));
    }
    if (f["System.State"] === "Active" || f["System.State"] === "In Progress") {
      const cs = await commentsOf(w.id);
      if (!cs.some(byMe)) add("process", 3, where, `in progress with no comment from you (plan / root cause not posted)`, wiUrl(w.id));
    }
    const changedTs = Date.parse(f["System.ChangedDate"]);
    if (Date.now() - changedTs > 14 * 86400000) add("stale", 3, where, `assigned to you, untouched for ${Math.round((Date.now() - changedTs) / 86400000)} days`, wiUrl(w.id));
  }
  return ids.length;
}

function scanWiki() {
  const dir = args.wiki;
  if (!dir || !existsSync(dir)) return "skipped (no --wiki clone)";
  const git = (...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let ref = "HEAD";
  try {
    git("fetch", "-q", "origin");
    ref = git("rev-parse", "--abbrev-ref", "origin/HEAD").trim();
  } catch {
    add("wiki", 3, dir, "wiki fetch failed; mentions checked on the local copy only", "");
  }
  const log = git("log", ref, `--since=${days}.days`, "-p", "--format=@@commit %h %an %ad", "--date=short", "--", "*.md");
  let commit = "";
  let file = "";
  const seen = new Set();
  for (const line of log.split("\n")) {
    if (line.startsWith("@@commit ")) commit = line.slice(9);
    else if (line.startsWith("+++ b/")) file = line.slice(6);
    else if (line.startsWith("+") && mentionsMe(line) && !seen.has(file)) {
      seen.add(file);
      add("wiki-mention", 2, decodeURIComponent(file), `mentioned in commit ${commit}: ${strip(line.slice(1))}`, "");
    }
  }
  return `${seen.size} page(s)`;
}

const summary = { user: me.providerDisplayName, org, project, days };
for (const [name, fn] of [["pullRequests", scanPullRequests], ["mentions", scanMentions], ["assigned", scanAssigned], ["wiki", scanWiki]]) {
  try {
    summary[name] = await fn();
  } catch (e) {
    summary[name] = `ERROR ${e.message}`;
  }
}
found.sort((a, b) => a.priority - b.priority || a.kind.localeCompare(b.kind));
console.log(JSON.stringify({ summary, actions: found }, null, 1));
