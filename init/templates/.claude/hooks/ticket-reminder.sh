#!/usr/bin/env bash
# UserPromptSubmit hook: when the prompt references a ticket, ensure the ticket
# folder exists (create ticket-investigation/<id>/memory.md if missing) and inject
# a reminder to investigate it (Rules.MD section 3). What counts as a ticket
# reference is TICKET_MENTION / TICKET_ID in harness.conf.
# Only the prompt text is read: a working directory named after a ticket is not a mention.
# ponytail: pulls .prompt out of stdin with grep instead of jq — no jq on Git Bash PATH.
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/harness.conf"
root="${CLAUDE_PROJECT_DIR:-$(cd "$here/../.." && pwd)}/ticket-investigation"

prompt="$(grep -oE '"prompt"[[:space:]]*:[[:space:]]*"([^"\\]|\\.)*"')"
prompt="${prompt%%$'\n'*}"
prompt="${prompt#*:}"
prompt="${prompt#*\"}"
prompt="${prompt%\"}"
printf -v prompt '%b' "${prompt//\\\"/\"}"
case "$prompt" in *task-notification*|*"SYSTEM NOTIFICATION"*) exit 0 ;; esac
ids="$(printf '%s' "$prompt" \
  | grep -oiE "$TICKET_MENTION" \
  | grep -oE "$TICKET_ID" \
  | sort -u)"
[ -z "$ids" ] && exit 0

for id in $ids; do
  dir="$root/$id"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    printf '# %s\n\nState:\nSummary:\n\n## Investigation\n\n## Notes\n' "$id" > "$dir/memory.md"
    printf 'Ticket %s: created ticket-investigation/%s/memory.md — investigate and fill it in (Rules.MD section 3).\n' "$id" "$id"
  else
    printf 'Ticket %s: folder exists at ticket-investigation/%s — read its memory.md before investigating (Rules.MD section 3).\n' "$id" "$id"
  fi
done
