#!/bin/sh
# PostToolUse(Edit|Write): after a source edit, remind to run the quality gates.
# WARN only, non-blocking. POSIX sh.

FILE=$(grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//')
[ -z "$FILE" ] && exit 0

case "$FILE" in
  *src/*.ts|*src/*.tsx)
    echo "[gate] Before shipping: pnpm typecheck && pnpm lint && pnpm build  (+ pnpm test if a tested surface changed)." ;;
  *) exit 0 ;;
esac
exit 0
