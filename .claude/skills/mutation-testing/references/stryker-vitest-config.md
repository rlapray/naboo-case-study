# Configuration Stryker — projet naboo-case-study

## Install

```sh
pnpm add -D @stryker-mutator/core @stryker-mutator/vitest-runner
```

Versions : laisser pnpm résoudre la latest stable. Pas de pin sauf incompatibilité avec Vitest 4.x.

## `stryker.config.json` (racine)

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vitest.config.ts"
  },
  "mutate": [
    "src/server/**/*.ts",
    "src/hooks/**/*.ts",
    "src/utils/**/*.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.stories.tsx",
    "!src/**/__tests__/**",
    "!src/**/*.schema.ts",
    "!src/types/**",
    "!src/pages/_app.tsx",
    "!src/pages/_document.tsx"
  ],
  "coverageAnalysis": "perTest",
  "incremental": true,
  "incrementalFile": "reports/stryker-incremental.json",
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 60
  },
  "mutator": {
    "excludedMutations": []
  },
  "reporters": ["html", "clear-text", "progress"],
  "htmlReporter": {
    "fileName": "reports/mutation/mutation.html"
  },
  "timeoutMS": 10000,
  "concurrency": 4
}
```

Notes :

- **Scope retenu** : `src/server/**` + `src/hooks/**` + `src/utils/**` (cf. choix produit). Composants RTL hors scope du premier run, à ajouter en 2e temps.
- **`coverageAnalysis: perTest`** : Stryker n'exécute que les tests qui couvrent la ligne mutée → réduction massive du temps de run.
- **`timeoutMS: 10000`** : couvre les intégrations `mongodb-memory-server` (boot ~3 s la 1ère fois). Si flake, monter à 15000 plutôt qu'augmenter le timeout par fichier.
- **`concurrency: 4`** : adapter à la machine. Sur CI, fixer à `2` pour ne pas saturer.
- **Pas de `dashboard.project`** par défaut : ajouter quand on est prêt à publier le score (`reporters: [..., "dashboard"]` + `dashboard.project: "github.com/<org>/naboo-case-study"`).

## Scripts `package.json`

```json
{
  "scripts": {
    "mutation": "stryker run",
    "mutation:incremental": "stryker run --incremental",
    "mutation:ci": "stryker run --incremental"
  }
}
```

PR runs ciblés via la variable d'env (à utiliser en CI) :

```sh
CHANGED=$(git diff --name-only --diff-filter=AMR origin/master...HEAD \
  | grep -E '^src/(server|hooks|utils)/.*\.ts$' \
  | grep -vE '\.(test|schema)\.ts$' \
  | paste -sd, -)
[ -n "$CHANGED" ] && pnpm mutation:ci -- --mutate "$CHANGED" || echo "no relevant changes"
```

## `.gitignore`

Ajouter :

```
reports/
.stryker-tmp/
```

## Stratégie CI

| Trigger | Commande | Objectif | Break |
|---|---|---|---|
| **PR** | `mutation:ci --mutate <changed>` | Garde-fou sur le diff | Oui (60) |
| **Nightly** | `mutation` (full) | Tendance, dashboard | Non (warn only) |
| **Local** | `mutation:incremental` | Boucle dev rapide | Non |

Invalidation cache incremental — supprimer `reports/stryker-incremental.json` quand :

- bump de `vitest`, `@stryker-mutator/*`, ou deps testées en profondeur
- modif de `vitest.config.ts` ou `stryker.config.json`
- modif de helpers de test partagés (`src/server/__tests__/helpers/**`, `src/test-utils/**`, `src/setupTests.ts`)

## Ajustement par scope (futur)

Quand on étend aux composants RTL, créer un 2ᵉ profil au lieu de tout fusionner :

```sh
stryker run --configFile stryker.ui.config.json
```

Avec `mutate: ["src/components/**/*.tsx", "src/pages/**/*.tsx", ...]`, `thresholds: { break: null }`, et `mutator.excludedMutations: ["StringLiteral"]` (logs / labels Mantine).

## Sources

- StrykerJS Vitest runner — https://stryker-mutator.io/docs/stryker-js/vitest-runner/
- Configuration — https://stryker-mutator.io/docs/stryker-js/configuration/
- Incremental — https://stryker-mutator.io/docs/stryker-js/incremental/
- Disable mutants — https://stryker-mutator.io/docs/stryker-js/disable-mutants/
