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
comment=""
blocks=""
case " $SLASH_EXTS " in *" $ext "*) comment='^[[:space:]]*//[^/!]|[^:/\\]//[^/!]|/\*'; blocks=1 ;; esac
case " $HASH_EXTS " in *" $ext "*) comment='^[[:space:]]*#[^!]|[^[:space:]][[:space:]][[:space:]]+#[[:space:]]' ;; esac
[ -z "$comment" ] && exit 0
strings='"([^"\\]|\\.)*"|`([^`\\]|\\.)*`|'"'([^'\\\\]|\\\\.)*'"

# Added lines only, vs the last commit: a whole-file grep would flag comments that
# were already there. A brand-new file is untracked, so `git diff` is empty; diff it
# against /dev/null so "new file" is the same case as "edited file".
d="$(dirname "$f")"
if git -C "$d" ls-files --error-unmatch "$f" >/dev/null 2>&1; then
  diff="$(git -C "$d" diff -U0 -- "$f" 2>/dev/null)"
else
  diff="$(git -C "$d" diff --no-index -U0 /dev/null "$f" 2>/dev/null)"
fi

# String literals are cut out before a line is judged, so "a//b" and f"{x}  # y" are
# code. A block comment is judged as a whole: one PRAGMA line (a licence header) clears it.
added="$(printf '%s\n' "$diff" | COMMENT="$comment" PRAGMA="${PRAGMA:-^$}" STRINGS="$strings" BLOCKS="$blocks" awk '
  function release() { if (held != "") print held; held = ""; inblock = 0 }
  BEGIN { comment = ENVIRON["COMMENT"]; pragma = ENVIRON["PRAGMA"]; strings = ENVIRON["STRINGS"]; blocks = ENVIRON["BLOCKS"] }
  /^@@/ { release(); hunk = 1; next }
  !hunk || !/^\+/ { next }
  {
    line = substr($0, 2)
    code = line
    gsub(strings, "", code)
    if (inblock) {
      if (line ~ pragma) held = ""
      if (code ~ /\*\//) release()
      next
    }
    if (line ~ pragma) next
    if (blocks && code ~ /\/\*/ && code !~ /\*\//) { held = line; inblock = 1; next }
    if (code ~ comment) print line
  }
  END { release() }
')"
[ -z "$added" ] && exit 0

{
  echo "Blocked — new code comments in $f:"
  echo "$added"
  echo "ReviewTaste.MD bans comments in shipped code, with no \"non-obvious\" escape hatch."
  echo "Remove them; intent belongs in naming and small functions. Only exception: a"
  echo "comment style the file already carries as a pattern."
} >&2
exit 2
