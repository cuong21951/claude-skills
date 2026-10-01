---
name: myvoice
description: Write messages in the user's own voice — ticket comments, PR replies and review comments, chat messages, emails — learned from messages the user actually wrote. Use whenever the user asks to reply, comment, answer, draft or word something that will go out under their name ("reply to the reviewer", "comment on the ticket", "answer this email", "trả lời", "viết reply", "soạn tin nhắn"), or to make a draft "shorter", "more natural" or "my style". "/myvoice learn" learns or refreshes the voice from sources the user picks.
argument-hint: "[learn]"
---

# My voice

Write the message the way the user types, not the way an assistant writes. The voice is learned
from the user's own sent messages and kept in `voice.md` next to this file. This skill ships
with no voice in it.

## 0. Is there a voice yet?

- `${CLAUDE_SKILL_DIR}/voice.md` exists → go to § 3.
- It does not, or the argument is `learn` → § 1.
- The user needs a message now and does not want to set up → write it plain and short, say the
  voice is not learned yet, and offer `learn` afterwards.

## 1. Ask where to learn from

Look first, so the options offered are real: which MCP servers are connected in this session
(mail, chat, tracker, code host), which CLIs are logged in, and whether a browser tool can act on
the user's logged-in session.

Then ask, in one round:

| Question | Options |
| --- | --- |
| Which of your messages sound most like you? (pick any) | Chat messages · Emails you sent · PR comments and reviews · Ticket comments · "I will paste some" |
| How should each be read? | Built from what was found: a connected MCP server, named · a logged-in CLI · the browser on your logged-in session · you paste or export them |
| Who are these messages for, and in which languages? | Teammates · customers · both; each language the user writes in |

- Offer only a route that a read-only probe showed working, plus pasting, which always works.
- If a source needs a connection that is not there, give the user the command or the setting to
  add it. Do not connect, log in, or store a token yourself.
- Ask which conversations or folders are in bounds when the source is a mailbox or a chat tool.

## 2. Learn

- Collect 30–50 messages the **user wrote** — never ones they received — spread over the sources
  picked, recent first. Read only; open no more than is needed to reach the user's own messages.
- Write `voice.md`:
  - **Rules** — how they open and close, sentence length, how formal, the words and phrases they
    reach for, how they hedge, how they ask for something, how they push back, punctuation and
    emoji habits, what they never say. Split by register where they differ (chat, review
    comment, ticket comment, email) and by language when they write in more than one.
  - **Examples** — about ten short real messages, the most typical first.
  - **Anti-examples** — starts empty.
- Before anything is stored, strip other people's names (use a role: "the reviewer"), customer
  and company names, hostnames, ids and anything secret. Keep the wording.
- Show the rules in chat and ask whether it sounds like them. Fix what they reject, then save.

## 3. Write

- Follow `voice.md`, in the register of the place the message is going.
- Do not smooth the user's natural phrasing into polished prose, and do not fake mistakes either.
- When two versions could work, pick the one closer to the examples.
- Show the draft in chat. Sending or posting is a separate step, done on the user's ask by
  whatever tool owns that channel.

## 4. Keep learning

When the user rewrites, shortens or rejects a draft, add the version they approved to Examples,
and the rejected pattern to Anti-examples when it shows a new rule. Keep about ten examples and
drop stale ones. Change a rule only when a correction shows a pattern, not for a one-off.

## Guardrails

- Only the user's own messages are learned from. Nobody else's writing is stored.
- `voice.md` is personal and local. It is not committed and not shared.
- This skill sends nothing.
