#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): block newly added code comments. Enforces
# ReviewTaste.MD "Minimal Diff, No Code Comments" at write time — a doc rule alone
# loses to the model's commenting prior. Which files are checked, and which
# comment-shaped lines are tool directives rather than comments, is SLASH_EXTS /
# HASH_EXTS / PRAGMA in harness.conf.
# ponytail: greps raw stdin instead of jq-parsing .tool_input.file_path (no jq on
# Git Bash PATH), and signals the block with exit 2 + stderr instead of hand-escaping
# JSON. Upgrade path if false positives bite: add the pattern to PRAGMA.
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/harness.conf"

f="$(cat \
  | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -1 \
  | sed 's/.*: *"//; s/"$//; s/\\\\/\//g')"

ext="${f##*.}"
pattern=""
case " $SLASH_EXTS " in *" $ext "*) pattern='^\+[[:space:]]*(//[^/]|/\*)|^\+.*[^:/]//[^/]' ;; esac
case " $HASH_EXTS " in *" $ext "*) pattern='^\+[[:space:]]*#[^!]|^\+.*[^[:space:]][[:space:]]{2,}#[[:space:]]' ;; esac
[ -z "$pattern" ] && exit 0

# Added lines only, vs the last commit: a whole-file grep would flag comments that
# were already there. A brand-new file is untracked, so `git diff` is empty; diff it
# against /dev/null so "new file" is the same case as "edited file".
d="$(dirname "$f")"
if git -C "$d" ls-files --error-unmatch "$f" >/dev/null 2>&1; then
  diff="$(git -C "$d" diff -U0 -- "$f" 2>/dev/null)"
else
  diff="$(git -C "$d" diff --no-index -U0 /dev/null "$f" 2>/dev/null)"
fi

added="$(printf '%s\n' "$diff" | grep -E "$pattern" | grep -vE "${PRAGMA:-^$}")"
[ -z "$added" ] && exit 0

{
  echo "Blocked — new code comments in $f:"
  echo "$added"
  echo "ReviewTaste.MD bans comments in shipped code, with no \"non-obvious\" escape hatch."
  echo "Remove them; intent belongs in naming and small functions. Only exception: a"
  echo "comment style the file already carries as a pattern."
} >&2
exit 2
