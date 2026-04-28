#!/usr/bin/env bash
# Stop hook : lance `npm run verify` (lint + check + format) sur les workspaces
# qui ont des modifs non committées. Sort en exit 2 + stderr pour signaler à
# l'agent toute erreur — il devra corriger avant de rendre la main.
#
# Pas de tests ici (laissés au pre-commit lefthook + CI) pour rester rapide.

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi
cd "$REPO_ROOT"

# Fichiers modifiés (staged + unstaged + untracked) versus HEAD.
CHANGED="$(
  {
    git diff --name-only HEAD 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | sort -u
)"

[ -z "$CHANGED" ] && exit 0

workspaces=()
echo "$CHANGED" | grep -qE '^front-end/.*\.(ts|tsx|js|jsx)$' && workspaces+=("front-end")
echo "$CHANGED" | grep -qE '^back-end/.*\.(ts|js)$' && workspaces+=("back-end")

[ "${#workspaces[@]}" -eq 0 ] && exit 0

failed=0
for ws in "${workspaces[@]}"; do
  echo "▶ verify ($ws)" >&2
  if ! ( cd "$ws" && npm run --silent verify ) >&2; then
    echo "✗ verify a échoué dans $ws — corrige avant de rendre la main." >&2
    failed=1
  fi
done

[ "$failed" -eq 1 ] && exit 2
exit 0
