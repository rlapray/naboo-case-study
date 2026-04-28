#!/usr/bin/env bash
# outdated-check.sh — wrapper pnpm outdated avec whitelist .pnpm-outdated-allow
# Usage: bash scripts/outdated-check.sh --prod | --dev

set -euo pipefail

MODE="${1:-}"
ROOT="$(git rev-parse --show-toplevel)"
ALLOW_FILE="$ROOT/.pnpm-outdated-allow"

if [[ "$MODE" != "--prod" && "$MODE" != "--dev" ]]; then
  echo "Usage: $0 --prod | --dev" >&2
  exit 1
fi

# Lire la whitelist (lignes non vides, non commentaires)
WHITELIST=()
if [[ -f "$ALLOW_FILE" ]]; then
  while IFS= read -r line; do
    line="${line%%#*}"   # retirer les commentaires inline
    line="${line//[[:space:]]/}"   # trim tous les espaces
    [[ -n "$line" ]] && WHITELIST+=("$line")
  done < "$ALLOW_FILE"
fi

if [[ ${#WHITELIST[@]} -gt 0 ]]; then
  echo "ℹ️  Paquets outdated whitelistés : ${WHITELIST[*]}"
fi

# Lancer pnpm outdated (exit 1 quand des paquets sont outdated)
PNPM_OUTPUT=""
PNPM_EXIT=0
if [[ "$MODE" == "--prod" ]]; then
  PNPM_OUTPUT=$(cd "$ROOT" && /home/romain/.volta/bin/pnpm outdated --prod --long 2>&1) || PNPM_EXIT=$?
else
  PNPM_OUTPUT=$(cd "$ROOT" && /home/romain/.volta/bin/pnpm outdated --dev --long 2>&1) || PNPM_EXIT=$?
fi

if [[ $PNPM_EXIT -eq 0 ]]; then
  echo "✅ Aucun paquet outdated."
  exit 0
fi

# Parser les noms de paquets depuis le tableau ASCII pnpm
# Format : │ Package-name    │ current │ latest │ ...
# On sélectionne les lignes commençant par │, on exclut la ligne d'en-tête "Package"
REMAINING=()
while IFS= read -r line; do
  # Seules les lignes de données : commencent par │ mais ne sont pas des séparateurs
  [[ "$line" =~ ^[[:space:]]*[┌├└] ]] && continue
  [[ ! "$line" =~ ^[[:space:]]*│ ]] && continue
  # Extraire le premier champ (entre le 1er et 2e │)
  pkg=$(echo "$line" | awk -F'│' '{gsub(/[[:space:]]/,"",$2); print $2}')
  [[ -z "$pkg" ]] && continue
  [[ "$pkg" == "Package" ]] && continue
  # Vérifier si dans la whitelist
  in_whitelist=false
  for allowed in "${WHITELIST[@]}"; do
    if [[ "$pkg" == "$allowed" ]]; then
      in_whitelist=true
      break
    fi
  done
  if [[ "$in_whitelist" == false ]]; then
    REMAINING+=("$pkg")
  fi
done <<< "$PNPM_OUTPUT"

if [[ ${#REMAINING[@]} -eq 0 ]]; then
  echo "✅ Tous les paquets outdated sont whitelistés."
  exit 0
fi

if [[ "$MODE" == "--prod" ]]; then
  echo ""
  echo "$PNPM_OUTPUT"
  echo ""
  echo "❌ Dependencies production outdated (non whitelistées) : ${REMAINING[*]}"
  exit 1
else
  echo ""
  echo "⚠️  devDependencies outdated :"
  echo "$PNPM_OUTPUT"
  echo "Paquets concernés (non whitelistés) : ${REMAINING[*]}"
  exit 0
fi
