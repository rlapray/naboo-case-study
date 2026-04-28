#!/usr/bin/env bash
# Stop hook : lance `npm run verify` (lint + typecheck) à la racine si du code TS/JS
# a été modifié. Sort en exit 2 + stderr pour signaler à l'agent toute erreur — il
# devra corriger avant de rendre la main.
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

# Ne déclenche verify que si du code lint/typecheckable a bougé sous src/, e2e/, scripts/
# ou parmi les fichiers de config racine.
if ! echo "$CHANGED" | grep -qE '^(src|e2e|scripts)/.*\.(ts|tsx|js|jsx)$|^(next\.config\.js|playwright\.config\.ts|vitest\.config\.ts|tsconfig\.json|\.eslintrc\.json)$'; then
  exit 0
fi

echo "▶ verify" >&2
if ! npm run --silent verify >&2; then
  echo "✗ verify a échoué — corrige avant de rendre la main." >&2
  exit 2
fi

exit 0
