#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): a defect you found but did not fix must carry a
# disposition on the same line — a work item id, or a named ruling. A "flag
# separately" note in a ticket memory.md is read by nobody after the session ends
# and comes back weeks later as a fresh bug with a full re-investigation. What
# counts as a disposition is DISPOSITION in harness.conf.
# ponytail: greps raw stdin instead of jq-parsing .tool_input.file_path (no jq on
# Git Bash PATH). Greps the whole file rather than added lines only, because the
# ticket folder is usually untracked; it self-heals — add the disposition, warning gone.
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/harness.conf"

f="$(cat \
  | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -1 \
  | sed 's/.*: *"//; s/"$//; s/\\\\/\//g')"

case "$f" in
  */ticket-investigation/*.md) ;;
  *) exit 0 ;;
esac

leaks="$(grep -niE 'flag (it )?separately|not my bug|separate (ticket|bug|defect)|follow-?up ticket|own (bug|ticket)|file a ticket|pre-existing bug' "$f" 2>/dev/null \
  | grep -viE "$DISPOSITION")"
[ -z "$leaks" ] && exit 0

{
  echo "Deferred findings with no disposition in $f:"
  echo "$leaks" | head -10
  echo "Rules.MD section 11: a found-and-not-fixed defect leaves the session as an artifact."
  echo "Put one of these on the line: the new work item id, 'comment on #<ticket>', or"
  echo "'ruled by <name> <date>'. 'Flag separately' is not a disposition."
} >&2
exit 2
