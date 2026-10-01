#!/usr/bin/env bash
# Enforces the Rules.MD git rule: commit locally, then stop and report — push and
# PR creation only when the user explicitly asks.
#
# Two events, one script:
#   UserPromptSubmit -> record whether THIS prompt asked for a push/PR
#   PreToolUse       -> block a push command when the current prompt did not
#
# The flag is rewritten on every prompt, so intent never leaks past the turn it
# was given in. It is keyed by project so two projects never share one intent.
# ponytail: greps raw stdin instead of jq-parsing — no jq on Git Bash PATH.

flag="${TMPDIR:-/tmp}/push-intent-$(printf '%s' "${CLAUDE_PROJECT_DIR:-$PWD}" | cksum | cut -d' ' -f1)"
payload="$(cat)"

case "$payload" in
  *'"hook_event_name":"UserPromptSubmit"'*|*'"hook_event_name": "UserPromptSubmit"'*)
    if printf '%s' "$payload" | grep -qiE 'push|đẩy lên|create (a )?pr|make (a )?pr|raise (a )?pr|open (a )?pull|tạo pr|làm pr|mở pr|/pr\b'; then
      printf 'yes' > "$flag"
    else
      printf 'no' > "$flag"
    fi
    exit 0
    ;;
esac

# PreToolUse: only care about commands that publish to a remote.
printf '%s' "$payload" | grep -qE 'git[^"]*\bpush\b|gh[^"]*\bpr create\b' || exit 0

[ "$(cat "$flag" 2>/dev/null)" = "yes" ] && exit 0

cat >&2 <<'EOF'
Blocked: pushing to a remote was not requested in the current message.

The rule is commit locally, then stop and report. Finish the work, report it, and
let the user ask for the push.

If the user did ask and the wording was missed, they can repeat it with the word
"push" and this gate opens for that turn.
EOF
exit 2
