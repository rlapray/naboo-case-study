# Principes — mutation testing

## Définitions canoniques (StrykerJS)

Un **mutant** est une variante du code source produite en appliquant un **mutator** (transformation syntaxique typée). États possibles après exécution de la suite :

| État | Signification | Action |
|---|---|---|
| **Killed** | ≥ 1 test a échoué sur ce mutant | Bon. Le test détecte la faute. |
| **Survived** | tous les tests passent | Trou de test. Ajouter une assertion. |
| **Timeout** | exécution > budget | Compté killed. Souvent boucle infinie injectée. |
| **No coverage** | aucun test n'exécute la zone | Pire que survived : la zone est aveugle. |
| **Equivalent** | sémantiquement identique à l'original | Indécidable en général (Jia & Harman). À annoter, pas à éliminer. |
| **Compile error** | mutation invalide TS | Ignoré dans le score. |
| **Ignored** | exclu par config ou annotation `// Stryker disable` | Ignoré dans le score. |

## Formule

```
mutation score = killed / (killed + survived + no_coverage + timeout)
```

Stryker exclut `equivalent` et `ignored` du dénominateur. La couverture v8 et le mutation score mesurent des choses orthogonales : 100 % de coverage avec 0 % de mutation score est possible (les tests exécutent tout sans rien asserter).

## Mutators principaux (Stryker)

Les transformations qu'on **ne désactive jamais** (ratio bug-réel/équivalent élevé) :

- `ConditionalExpression` — `if (x)` → `if (true)` / `if (false)`
- `EqualityOperator` — `===` ↔ `!==`, `<` ↔ `>=`, etc.
- `LogicalOperator` — `&&` ↔ `||`
- `ArithmeticOperator` — `+` ↔ `-`, `*` ↔ `/`
- `BooleanLiteral` — `true` ↔ `false`
- `OptionalChaining` — `a?.b` ↔ `a.b`
- `UpdateOperator` — `i++` ↔ `i--`

À désactiver avec parcimonie (souvent équivalents ou cosmétiques) :

- `StringLiteral` — vide les chaînes. Sur logs / i18n / messages d'erreur, OK de désactiver.
- `BlockStatement` — vide un block `{}`. Sur early-returns trivials, équivalent fréquent.
- `ArrayDeclaration` — `[1,2,3]` → `[]`. Souvent test-able si l'array a une sémantique.

Liste complète : https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/

## Pourquoi 100 % est un anti-pattern

1. **Mutants équivalents indécidables** — Jia & Harman 2011 (https://crest.cs.ucl.ac.uk/fileadmin/crest/sebasepaper/JiaH10.pdf) : déterminer si un mutant est équivalent à l'original est indécidable dans le cas général (réduction à l'arrêt).
2. **Couplage à l'implémentation** — chasser les 5 % derniers force à asserter sur des détails internes (ordre d'appels, variables intermédiaires), exactement ce que `writing-unit-tests` interdit.
3. **Coût marginal explosif** — passer de 80 → 95 % coûte généralement plus que passer de 0 → 80 %, pour un gain de détection marginal.

Cibles raisonnables (Stryker docs, https://stryker-mutator.io/docs/stryker-js/configuration/) :

- **High** 80 — au-delà : zone confortable.
- **Low** 60 — en-dessous : score insuffisant, bloque CI si `break` est positionné.
- **Break** 60 — fait échouer le run (recommandé en CI sur scope serveur).

Durcir à 75–80 sur `src/server/services/**` (logique métier critique). Relâcher (40–50 ou pas de break) sur composants UI tant que la maturité n'est pas là.

## Sources autoritatives

- StrykerJS — https://stryker-mutator.io/docs/
  - Introduction, Configuration, Vitest runner, Disable mutants, Incremental, Supported mutators, Equivalent mutants
- Jia & Harman, *An Analysis and Survey of the Development of Mutation Testing*, IEEE TSE 2011 — https://crest.cs.ucl.ac.uk/fileadmin/crest/sebasepaper/JiaH10.pdf
- PIT (Henry Coles, Java) — https://pitest.org/quickstart/mutators/, https://blog.pitest.org/ (concepts transférables, prose claire sur équivalence)
- Stryker Dashboard — https://dashboard.stryker-mutator.io (tendance score)
