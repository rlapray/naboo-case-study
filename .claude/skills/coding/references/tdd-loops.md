# TDD Loops — Red-Green-Refactor, Chicago vs London

## Le cycle Red-Green-Refactor

Pour chaque tâche d'implémentation, le cycle est strict :

### RED — Écrire un test qui échoue
- Le test exprime le comportement attendu en **phrase métier** (`it("retourne 200 et le status ok", ...)`)
- Le test échoue parce que l'implémentation n'existe pas (ou ne produit pas le bon résultat)
- **Vérifier le rouge** : `pnpm vitest run <chemin>` doit afficher l'échec attendu, pas un échec d'import ou de typecheck

### GREEN — Faire passer le test (minimum viable)
- Code minimal qui rend le test vert
- **Pas d'élégance** ici : on cherche juste à faire passer
- Vérification : le test passe, et seulement celui-là

### REFACTOR — Nettoyer
- Maintenant que c'est vert, améliore le code (DRY, lisibilité, performance)
- Le test doit toujours passer après refactor
- Lance `pnpm verify` (lint + typecheck) pour valider

**Cycle court** : RED → GREEN → REFACTOR doit prendre quelques minutes par étape, pas une heure. Si une étape déborde, c'est que la tâche est trop grosse → re-découpe.

## Chicago vs London — Quel choix par défaut ?

### Chicago (classicist, bottom-up) — **DEFAULT**
- Commence par les **fondations** : fonctions pures, services, modèles
- Remonte vers les couches supérieures (hooks, composants, parcours)
- **Mocks rares** : utilise les vraies dépendances quand c'est possible (les modules internes du projet)
- **Frontières externes mockées** : HTTP, DB, time, randomness, tiers (Mongoose si on n'utilise pas `mongodb-memory-server`)

**Quand l'utiliser** :
- Backend (server services, validators, mappers)
- Hooks utilitaires sans rendu
- Logique pure (pagination, tri, filtre)
- Refacto interne d'une couche existante

### London (mockist, top-down)
- Commence par la **couche visible** (composant React, page, parcours)
- Mocks à toutes les frontières internes (services, hooks)
- Remplace progressivement les mocks par du vrai au refactor

**Quand l'utiliser** :
- Feature très visuelle (nouvelle page, nouvelle UX)
- Quand l'utilisateur veut voir quelque chose à l'écran rapidement
- Quand le découpage backend n'est pas encore tranché et qu'il sera dirigé par les besoins UI

## Stratégie mocks — synthèse

| Mock à... | Chicago | London |
|---|---|---|
| Frontière HTTP (`fetch`, `@/services/api`) | ✓ toujours | ✓ toujours |
| Frontière DB (Mongoose direct) | ✓ ou `mongodb-memory-server` | ✓ |
| Service externe (cities API, payment) | ✓ toujours | ✓ toujours |
| Service interne (`activityService`, `userService`) | ✗ utiliser le vrai | ✓ au début, remplacer au refactor |
| Hook custom (`useActivityFilter`) | ✗ utiliser le vrai | ✓ au début, remplacer au refactor |
| Helper / utility pure | ✗ jamais | ✗ jamais |
| `next/router` | ✓ toujours | ✓ toujours |
| Time, randomness | ✓ toujours | ✓ toujours |

**Règle d'or** : on ne mock **jamais** une fonction pure. C'est un signal qu'elle ne devrait pas être mockée — utilise la vraie.

## Stratégie de refactor pour London → Chicago

Quand on a démarré London (mocks aux frontières internes) et qu'on arrive à la phase refactor, on **remplace les mocks par les vraies dépendances** au fur et à mesure que les couches inférieures sont implémentées.

Exemple :
1. T1 — composant `<ActivityList>` testé avec `activityService` mocké → London
2. T2 — implémentation de `activityService.findAll` (avec ses propres tests unitaires)
3. T3 — refactor du test de `<ActivityList>` : remplace le mock de `activityService` par le vrai. Conserve le mock de `@/services/api` (frontière HTTP).

Si après refactor le test de `<ActivityList>` échoue alors que `activityService.findAll` passe ses propres tests : signal d'un contrat implicite qu'on a raté. C'est précieux, ne le balaie pas.

## Que faire si un test ancien casse après refactor ?

C'est **normal et attendu**. Trois cas :

1. **Le test exprimait un détail d'implémentation** (ex. « appelle `getUserId` 3 fois ») → réécris-le pour exprimer le comportement, pas la mécanique.
2. **Le refactor a modifié un comportement observable** que le test capturait correctement → le test est juste, le refactor est faux. Annule le refactor ou ajuste-le.
3. **Le refactor a corrigé un bug ancien** que le test reproduisait par erreur → corrige le test.

Distinguer 1 vs 2 : si le test fait `toHaveBeenCalledTimes(3)` ou check des appels internes, c'est probablement 1. S'il fait `expect(result).toEqual(...)` ou `expect(getByRole(...))`, c'est probablement 2.

## Anti-patterns

- ❌ **Sauter le RED** : écrire le code puis le test « pour vérifier que ça marche ». Le test n'a jamais échoué → tu ne sais pas s'il aurait détecté un bug.
- ❌ **Refactor sans tests verts** : si tu refactores avec des tests rouges, tu ne sais pas ce qui change.
- ❌ **Sur-mocker** : si ton test fait 5 mocks pour 10 lignes de code, c'est trop. Bascule en Chicago ou découpe la fonction.
- ❌ **Mocker le SUT** (System Under Test) : tu testes un mock, pas ton code.
- ❌ **TDD sur du code purement déclaratif** (config, constantes) : pas de comportement → pas de TDD utile.

## Référence projet

Voir CLAUDE.md pour la pyramide à 4 niveaux et la règle de décision « si je peux exprimer le comportement sans citer un parcours utilisateur, c'est unit ou RTL ; sinon e2e ».
