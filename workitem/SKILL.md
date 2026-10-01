---
name: workitem
description: Draft and create a bug or a story in this project's tracker, in the shape the team's own items use and with the fields the tracker requires. Use whenever the user says "/workitem", "create a bug", "file a bug for this", "make a ticket for it", "raise a story", "tạo bug", "tạo ticket", "draft cho tôi một bug", or asks for a work item to be drafted or filed for something found during other work.
---

# Work item

Draft first, always. Write the draft to the ticket folder, show it in chat, and create it in the
tracker only after the user says go.

The shape is the project's, not this skill's: an item reads like the team's own recent items.

## This project

<!-- init: Read five recent bugs and five recent stories in this project's tracker. Record the sections and wording pattern a bug uses, the same for a story, the language, the title convention, every required field with how its value is chosen, and the exact create and link calls for the tracker tool or CLI in use. Write `Not established yet.` if the tracker has no items or cannot be reached. -->

## 1. Bug

- Say where it was seen, the steps, what was expected and what happened, with the evidence
  attached. The steps are ones the reader can follow themselves.
- Write only what was actually run or seen. Anything else is marked as not verified, or left out.
- Analysis that the team's bugs do not carry stays in the ticket folder and is offered in chat.

## 2. Story

Context, what is in scope and what is not, and acceptance criteria written as outcomes someone
can check. An open question is marked as open, not written as a criterion.

## 3. Create

1. Create the item with every required field. Values are read from a sibling item, not guessed.
2. Link the parent with the tracker's own link operation.
3. Re-read the item and confirm the fields and the formatting survived.
4. Report the id and URL, and record it in the ticket `memory.md`.

## Guardrails

- Nothing is created without the user's go.
- No secret and no personal data in a work item.
