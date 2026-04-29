---
name: mutation-testing
description: >-
  Met en place et exploite Stryker (mutation testing) pour durcir les tests
  existants : configure StrykerJS + runner Vitest, lance les runs, lit le
  rapport HTML, classe les mutants survivants et ajoute des assertions
  ciblées. À utiliser quand l'utilisateur demande « configure Stryker »,
  « lance mutation testing », « améliore ce test à partir des mutants
  survivants », « tuer ce mutant », ou « pourquoi ce test ne détecte pas X ».
  Complète `writing-unit-tests` et `writing-rtl-tests` (cibles des assertions
  ajoutées) sans remplacer la pyramide projet (qui reste autoritative pour
  choisir le niveau de test). **Ne pas utiliser** pour : créer un test
  from-scratch sans signal de mutant, ajuster la couverture v8, ou déboguer
  un flaky test (corriger d'abord, mesurer ensuite).
---

# mutation-testing

## But

Mutation testing mesure ce que la couverture ne mesure pas : **est-ce que la suite *détecterait* un bug ?** Stryker injecte de petites fautes (mutants) dans `src/`, relance Vitest, et chaque mutant qui *survit* est une assertion manquante.

Vocabulaire canonique (Stryker) :

- **Killed** — au moins un test a échoué. Le mutant est détecté.
- **Survived** — tous les tests passent. **Vrai trou de test.**
- **Timeout** — exécution > budget (compté comme killed).
- **No coverage** — aucun test n'exécute la zone (pire que survived).
- **Equivalent** — mutant sémantiquement identique à l'original (indécidable en général). À documenter, pas à éliminer automatiquement.

Mutation score = `killed / (total − equivalent − ignored)`. Cibles par défaut Stryker : **high 80 / low 60 / break 60**. Viser 100 % est un anti-pattern (cf. `references/principles.md`).

## Quand l'invoquer dans la pyramide projet

| Niveau pyramide | Valeur mutation testing | Action |
|---|---|---|
| Unit pur (validators, mappers, services purs) | **Haute** | Inclure dans `mutate`, break threshold strict (≥ 70). |
| Unit hook (`renderHook`) | **Haute** | Inclure, mêmes seuils. |
| Component (RTL) | Moyenne | Inclure progressivement, beaucoup de mutants équivalents sur rendu Mantine ; `StringLiteral` désactivable. |
| E2E (Playwright) | **N/A** | Hors scope, durée prohibitive. |

Mutation testing **complète** un niveau, ne le remplace pas. Le choix du niveau de test reste fait via `writing-unit-tests` / `writing-rtl-tests` / `e2e-test`.

## Workflow setup (premier run)

À exécuter une seule fois sur le repo :

1. **Pré-requis** : suite verte et stable. `pnpm verify` et `pnpm verify:test` doivent passer **sans flake** sur 3 runs consécutifs. Mutation testing amplifie tout flake (1 % → ~50 % sur 100 mutants du même fichier).
2. **Install** : `pnpm add -D @stryker-mutator/core @stryker-mutator/vitest-runner`.
3. **Config** : créer `stryker.config.json` à la racine. Voir `references/stryker-vitest-config.md` pour le contenu exact (scope `src/server/**` + `src/hooks/**` + `src/utils/**`, exclusions explicites).
4. **Scripts `package.json`** :
   - `mutation` → `stryker run` (run complet local).
   - `mutation:incremental` → `stryker run --incremental` (cache `reports/stryker-incremental.json`).
   - `mutation:ci` → `stryker run --incremental --mutate "$CHANGED_FILES"` (PR runs).
5. **`.gitignore`** : ajouter `reports/`, `.stryker-tmp/`.
6. **Premier run** : `pnpm mutation`. Ouvrir `reports/mutation/mutation.html`, trier par survived.

## Workflow amélioration (boucle quotidienne)

Pour chaque mutant survivant, **classer puis agir** :

1. **Gap réel** → ajouter une assertion qui cible **exactement** le comportement observable que le mutant a changé (boundary, inégalité, branche). Ré-exécuter le mutant ciblé : `pnpm mutation -- --mutate "<file>"`. Le mutant doit passer killed.
2. **Équivalent** → annoter en place : `// Stryker disable next-line <Mutator>: <raison courte>`. Toujours nommer le mutator et la raison ; jamais `disable all` aveugle.
3. **Pas worth** (log, i18n, message d'erreur cosmétique) → désactiver le mutator au niveau global (`mutator.excludedMutations`) avec justification dans `stryker.config.json`, ou en place avec annotation.

Voir `references/survived-mutant-playbook.md` pour un exemple par mutator (ConditionalExpression, EqualityOperator, ArithmeticOperator, BooleanLiteral, BlockStatement, OptionalChaining, etc.) avec l'assertion qui le tue.

## Règles dures

- **Ne jamais désactiver** `ConditionalExpression`, `EqualityOperator`, `LogicalOperator`, `ArithmeticOperator` — c'est là que vivent les bugs.
- **Ne jamais affaiblir le `mutate` glob** pour faire monter le score. Soit on tue le mutant, soit on l'annote équivalent avec raison.
- **Ne jamais ajouter d'assertion tautologique** (`toBeDefined()`, `toBeTruthy()` sur une valeur déjà filtrée) pour kill un mutant. L'assertion doit cibler le **comportement observable** changé par la mutation.
- **`StringLiteral`** désactivable uniquement sur logs / i18n / messages d'erreur, avec justification.
- **CI break threshold** : 60 sur le scope serveur (`src/server/**`), pas de break automatique sur UI tant que le scope RTL n'est pas mature.
- **Run mutation après suite verte uniquement.** Un test rouge invalide tout le rapport.
- **Invalider le cache incremental** lors d'un bump de deps, modif `vitest.config.ts`, modif `stryker.config.json` : supprimer `reports/stryker-incremental.json`.
- **Ne pas mutate du code généré** (DTOs `src/types/`, schémas Mongoose, snapshots, `_app`/`_document` Next).

## Avant de rendre la main

- [ ] `pnpm verify` et `pnpm verify:test` verts (pré-requis absolu).
- [ ] `pnpm mutation` (ou `:incremental`) lance le run sur le scope cible.
- [ ] Score affiché ≥ low threshold du scope.
- [ ] Chaque mutant survivant est classé : gap (assertion ajoutée), équivalent (annoté avec raison), ou pas-worth (mutator désactivé avec raison).
- [ ] Aucun ajout d'assertion tautologique ni rétrécissement opportuniste du `mutate` glob.
- [ ] `pnpm verify:test` toujours vert après les nouvelles assertions.

## Références

- `references/principles.md` — définitions canoniques, formule mutation score, pourquoi 100 % est un anti-pattern, sources autoritatives (Stryker docs, Jia & Harman 2011, PIT/Henry Coles).
- `references/stryker-vitest-config.md` — config minimale projet, globs `mutate` adaptés, thresholds, scripts pnpm, stratégie CI nightly vs PR.
- `references/survived-mutant-playbook.md` — par mutator courant : exemple TypeScript du repo + assertion qui le tue. Pièges Vitest, Mantine/RTL, Mongoose.
