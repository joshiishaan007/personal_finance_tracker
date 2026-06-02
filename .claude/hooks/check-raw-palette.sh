#!/bin/sh
# PostToolUse(Edit|Write): warn on raw hex / arbitrary Tailwind color values in
# client feature code. Use token classes (brand/success/warn/danger/slate) or add
# a token to tailwind.config.ts. WARN only. POSIX sh, grep/sed/echo only.
# Exempt: globals.css and tailwind.config.ts (where tokens ARE defined).

FILE=$(grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//')
[ -z "$FILE" ] && exit 0

case "$FILE" in
  *src/*.tsx|*src/*.ts) ;;
  *) exit 0 ;;
esac
case "$FILE" in
  *globals.css|*tailwind.config.ts) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

# arbitrary Tailwind value with a hex, e.g. bg-[#6366F1], text-[#fff]
HITS=$(grep -nE '\[#[0-9A-Fa-f]{3,8}\]' "$FILE")
if [ -n "$HITS" ]; then
  echo "[design-system] Raw hex / arbitrary color in $FILE — use a token class (brand/success/warn/danger/slate) or add a token to tailwind.config.ts:"
  echo "$HITS" | sed 's/^/    /'
fi
exit 0
