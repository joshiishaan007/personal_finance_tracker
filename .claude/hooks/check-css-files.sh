#!/bin/sh
# PostToolUse(Edit|Write): warn when a banned stylesheet type is created/edited.
# Personal Finance Tracker is Tailwind-only — no SCSS/Sass/CSS Modules/styled-components.
# The single allowed stylesheet is src/app/globals.css. WARN only. POSIX sh.

FILE=$(grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//')
[ -z "$FILE" ] && exit 0

case "$FILE" in
  *src/app/globals.css) exit 0 ;;
  *.scss|*.sass|*.module.css|*.styled.ts|*.styled.tsx)
    echo "[design-system] $FILE — banned stylesheet type. Personal Finance Tracker is Tailwind-only; use utility classes + tokens, and the single src/app/globals.css for base/utilities." ;;
  *.css)
    echo "[design-system] $FILE — only src/app/globals.css should exist. Prefer Tailwind utilities over a new CSS file." ;;
esac
exit 0
