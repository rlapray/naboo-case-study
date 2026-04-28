#!/usr/bin/env bash
# audit-check.sh — wrapper pnpm audit avec affichage des CVEs/GHSAs ignorés
# Usage: bash scripts/audit-check.sh --prod | --dev

set -euo pipefail

MODE="${1:-}"
ROOT="$(git rev-parse --show-toplevel)"
PKG_JSON="$ROOT/package.json"
PNPM="${PNPM_EXEC:-pnpm}"

if [[ "$MODE" != "--prod" && "$MODE" != "--dev" ]]; then
  echo "Usage: $0 --prod | --dev" >&2
  exit 1
fi

# Afficher les CVEs/GHSAs ignorés si non vides
if command -v node &>/dev/null; then
  IGNORED=$(node -e "
    const p = require('$PKG_JSON');
    const cves = (p.pnpm && p.pnpm.auditConfig && p.pnpm.auditConfig.ignoreCves) || [];
    const ghsas = (p.pnpm && p.pnpm.auditConfig && p.pnpm.auditConfig.ignoreGhsas) || [];
    if (cves.length || ghsas.length) {
      process.stdout.write('⚠️  Vulns ignorées explicitement: CVEs=[' + cves.join(',') + '] GHSAs=[' + ghsas.join(',') + ']\n');
    }
  " 2>/dev/null || true)
  [[ -n "$IGNORED" ]] && echo "$IGNORED"
fi

# Lancer l'audit
AUDIT_EXIT=0
if [[ "$MODE" == "--prod" ]]; then
  cd "$ROOT" && "$PNPM" audit --prod --audit-level=high || AUDIT_EXIT=$?
  exit $AUDIT_EXIT
else
  AUDIT_OUTPUT=""
  AUDIT_OUTPUT=$(cd "$ROOT" && "$PNPM" audit --dev --audit-level=high 2>&1) || AUDIT_EXIT=$?
  if [[ $AUDIT_EXIT -ne 0 ]]; then
    echo ""
    echo "⚠️  Vulnérabilités détectées dans les devDependencies (non bloquant) :"
    echo "$AUDIT_OUTPUT"
  else
    echo "$AUDIT_OUTPUT"
  fi
  exit 0
fi
