#!/bin/sh
# PostToolUse(Edit|Write): warn on banned raw HTML tags in client feature JSX.
# Element wrappers live in src/components/ui/ — those are exempt.
# WARN only, never blocks. POSIX sh, grep/sed/echo only.

FILE=$(grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//')
[ -z "$FILE" ] && exit 0

# only .tsx feature files under src/; skip the element tier
case "$FILE" in
  *src/*.tsx) ;;
  *) exit 0 ;;
esac
case "$FILE" in
  *src/components/ui/*) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

HITS=$(grep -nE '<(button|input|textarea|select|h[1-6]|p|span|a|img|label|ul|ol|li|table|thead|tbody|th|td|tr)[ >/]' "$FILE")
if [ -n "$HITS" ]; then
  echo "[design-system] Banned raw tag(s) in $FILE — use the components/ui wrapper (Button/Input/Heading/Text/Link/...). Create the element first if it doesn't exist:"
  echo "$HITS" | sed 's/^/    /'
fi
exit 0
