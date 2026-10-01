---
name: ticket
description: Post the comment on a work item that says what will be done or what was fixed — the plan on a story, root cause and fix in plain words on a bug — in the shape this project's team uses. Trigger on any of "post the plan", "comment the plan", "rca", "post the rootcause", "explain the fix on the ticket", "put it in the ticket", "post it to the ticket", "update the ticket", "comment on the story", "write it up for the ticket", "let the team know on the ticket", "comment lên ticket", "post lên ticket", "cập nhật ticket" — or any other ask to write something onto a ticket, work item, story or bug. Also offer it once a plan is agreed or a fix is finished and the ticket has no comment for it yet.
---

# Ticket comment

One comment on the work item, in one of two shapes:

| Moment | Shape |
| --- | --- |
| A plan is agreed | **Plan** — what will change, and where |
| A fix is done and verified | **Root cause + Fix** — what was wrong, what changed, what the reader sees now |

If the user names the shape, that wins.

## This project

<!-- init: How this team writes ticket comments, read from the developers' comments on ten recently closed tickets: the shapes in use, their headings, length and language. Then the exact comment call for the tracker tool or CLI in use, how an existing comment is updated, and how a person is mentioned so that they are notified. Write `Not established yet.` if the tracker cannot be reached. -->

## Writing it

- Plain words. The person who reported it has to understand it without a follow-up question.
- The plan says what will change, not how the system works. Only the parts that actually change.
- The root cause is one thing, said once. Not the investigation, not everything that was checked.
- Say what changes for the reader: what works now, and anything they still have to do. If
  existing data stays wrong, say so.
- A partial fix or a workaround is named as one. Never imply more is fixed than is.
- The whole comment fits on one screen.
- Use the `myvoice` skill for the wording when it is installed.

## Posting

- The ticket id comes from the user's message, else from the ticket already in play. Read the
  item first; its title and criteria are the words the reader already knows.
- If this skill already posted on this ticket in this thread, update that comment. Never leave two.
- Post it, then show the text in chat.
- Nothing proven yet → say so and stop. A guessed cause on a ticket is worse than no comment.

## Guardrails

- A comment is posted only on the user's ask or their yes to the offer.
- No secret in a comment.
