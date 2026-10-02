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
# Only the prompt text and the command text are read: a path, a description or a
# commit message that happens to hold the word "push" decides nothing.
# ponytail: pulls one JSON string field out of stdin with grep instead of jq —
# no jq on Git Bash PATH.

flag="${TMPDIR:-/tmp}/push-intent-$(printf '%s' "${CLAUDE_PROJECT_DIR:-$PWD}" | cksum | cut -d' ' -f1)"
payload="$(cat)"

read_field() {
  value="$(grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"([^\"\\\\]|\\\\.)*\"" <<<"$payload")"
  value="${value%%$'\n'*}"
  value="${value#*:}"
  value="${value#*\"}"
  value="${value%\"}"
  printf -v value '%b' "${value//\\\"/\"}"
}

case "$payload" in
  *'"hook_event_name":"UserPromptSubmit"'*|*'"hook_event_name": "UserPromptSubmit"'*)
    read_field prompt
    edge='[^[:alnum:]_./-]'
    refused="(^|$edge)(do not|don[^[:space:]]{0,3}t|never|not|no|without|đừng|không|chưa|khoan)[[:space:]]+([^[:space:][:punct:]]+[[:space:]]+)?push[a-z]*"
    not_a_request='push[[:space:]]+notifications?'
    asks_push="(^|$edge)push($edge|\$)|đẩy lên"
    asks_pr="(^|$edge)(create|make|raise|open|submit|tạo|làm|mở)[[:space:]]+((a|an|the|new)[[:space:]]+)*(pr|pull request)($edge|\$)|(^|[[:space:]])/pr([[:space:]]|\$)"
    if sed -E "y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/; s/$refused/ /g; s/$not_a_request/ /g" <<<"$value" \
      | grep -qE "$asks_push|$asks_pr"
    then
      printf 'yes' > "$flag"
    else
      printf 'no' > "$flag"
    fi
    exit 0
    ;;
esac

# PreToolUse: only care about commands that publish to a remote — `push` as git's own
# subcommand (after any global options), not `stash push`, `--grep=push` or `push.default`.
read_field command
git_option="-[Cc][[:space:]]+(\"[^\"]*\"|'[^']*'|[^[:space:]]+)|--?[[:alnum:]-]+(=[^[:space:]]+)?"
git_push="(^|[^[:alnum:]_.-])git([[:space:]]+($git_option))*[[:space:]]+push([^[:alnum:]_.=-]|\$)"
pr_create="(^|[^[:alnum:]_.-])gh[[:space:]]+pr[[:space:]]+create([^[:alnum:]_.=-]|\$)"
grep -qE "$git_push|$pr_create" <<<"$value" || exit 0

[ "$(cat "$flag" 2>/dev/null)" = "yes" ] && exit 0

cat >&2 <<'EOF'
Blocked: pushing to a remote was not requested in the current message.

The rule is commit locally, then stop and report. Finish the work, report it, and
let the user ask for the push.

If the user did ask and the wording was missed, they can repeat it with the word
"push" and this gate opens for that turn.
EOF
exit 2
