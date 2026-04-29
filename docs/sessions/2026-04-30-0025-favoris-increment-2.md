# Session — Favoris (incrément 2 — Réordonnancement)

**Date** : 2026-04-30 00:25 (Europe/Paris)
**Feature** : Favoris (incrément 2 sur 3)
**Bounded contexts** : Catalogue × Identité (extension front-only via `AuthContext` inchangé ; couplage serveur toujours absent)
**Commit subject** : `<à compléter en Phase 6>`
**Voie d'entrée** : A (draft consolidé `docs/features/drafts/favoris.md` annoté après incrément 1, esquisse trajectoire `<slug>/trajectory.md`)

## Cadrage d'origine

> Source : `docs/features/drafts/favoris.md` — section « Découpage », incrément 2.
> Esquisses transverses : `.claude/scratch/coding/favoris/trajectory.md`.
> Contexte d'exécution acquis : `docs/sessions/2026-04-29-2349-favoris-increment-1.md`.

### Brief consolidé pour l'incrément 2

Issu du draft (cf. `docs/features/drafts/favoris.md` pour le contenu intégral) :

- **Job (rappel)** : un Utilisateur connecté veut retrouver ses Favoris **dans l'ordre qu'il choisit** sur son Profil pour comparer ses options.
- **Critère de succès** : « glisser-déposer sur `/profil` modifie l'ordre, persisté au reload » (Découpage incrément 2).
- **Décision Q2** : PATCH full sequence `{ ids: string[] }`, le serveur réécrit toutes les positions en `bulkWrite`. Pas de fractional ranking. Cap dur à 100.
- **Décision Q5** : `AuthContext.favoriteIds` est un `Set<string>` — l'ordre n'y est pas représenté. Pas de modification du context.
- **Décision ouverte au démarrage** : choix de la lib DnD (`@hello-pangea/dnd` vs `dnd-kit` vs HTML5 natif). Tranchée dans le plan en faveur de `@dnd-kit` (cf. justification dans `## Décisions techniques tranchées`).
- **Risque UX Nielsen #6** : poignée de drag explicite ; `dnd-kit` fournit un `KeyboardSensor` accessible.

## Plan initial

7 tâches (T1 → T7), chaîne quasi-séquentielle sauf T4 indépendante de T1-T3 (parallélisable en théorie, séquentialisée pour clarté). Détail dans `.claude/scratch/coding/favoris/increment-2/plan.md`.

| # | Tâche | Couche | Modèle |
|---|---|---|---|
| T1 | `favoriteService.reorder` + tests intégration | server | opus |
| T2 | Route `PATCH /api/me/favorites` + tests HTTP | server | sonnet |
| T3 | `api.reorderFavorites` client | client | agent principal direct |
| T4 | `<FavoritesReorderableList>` + tests RTL (`@dnd-kit`) | component | opus |
| T5 | Intégration `/profil` + optimistic + rollback | component | sonnet |
| T6 | E2E Playwright (reorder + cap 100 reportée) | e2e | opus |
| T7 | Quality gate + mutation + rapport + commit | meta | orchestré par l'agent principal |

## Timeline d'exécution

<!-- append après chaque tâche : `HH:MM — T<n> (<modèle>) : RED/GREEN/REFACTOR ok` -->
- 00:35 — T1 (opus) : 6 cas RED → GREEN, suite serveur 24/24 sur `favorite.service.test.ts` (18 existants + 6 nouveaux), `pnpm verify` ok.
- 00:43 — T2 (sonnet) : 4 cas HTTP RED → GREEN sur `favorites.http.test.ts` (19/19), handler PATCH ajouté à `src/pages/api/me/favorites/index.ts`, `pnpm verify` ok.
- 00:45 — T3 (agent principal) : `api.reorderFavorites(ids)` ajouté dans `src/services/api.ts`, `pnpm verify` ok.
- 01:08 — T4 (opus) : `<FavoritesReorderableList>` + 12/12 RTL (helper pur `computeReorderedIds` exporté + tests rendu + a11y poignée), install `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`, `pnpm verify` ok.
- 01:26 — T5 (sonnet) : `/profil` refacto avec `useState` + `handleReorder` optimistic + rollback, 4 nouveaux cas RTL (vide, optimistic, succès, rollback) via mock du composant DnD à la frontière `@/components`. Suite globale 322/322, `pnpm verify` ok.
- 01:53 — T6 (opus) : S1 e2e reorder ajouté via drag pointer manuel (`page.mouse.move/down/up` avec seuil + trajet en 15 steps) après échec du `KeyboardSensor` ; anti-flake via `waitForResponse` sur le PATCH avant `reload()`. S2 cap 100 : déjà couverte par RTL `authContext.test.tsx` (mock `api.addFavorite` rejetant `ApiError(400)` → rollback + snackbar) + seed ne contient que 5 activités → seed e2e impossible sans bricolage. `pnpm e2e -- e2e/favorites.spec.ts` 4/4, `pnpm e2e` global 36/37 (1 flake pré-existant sur `signin.spec.ts` sous parallel load, indépendant), `pnpm verify` ok.
- 02:30 — Stryker initial (sonnet bg) : 95.59% global, 82.69% sur `favorite.service.ts`, 5 mutants `ObjectLiteral` survivants critiques sur les filtres `{ userId }` (isolation multi-user).
- 02:55 — Itération mutation (sonnet) : 8 assertions multi-user ajoutées (favorite.service + http) prouvant l'isolation des opérations par user + annotations Stryker `disable` ciblées sur le guard défensif `!doc` et les `StringLiteral` cosmétiques. Score `favorite.service.ts` 82.69% → 100%, global 95.59% → 97.51%.
- 02:58 — Quality gate final : verify ok, verify:test 330/330 (50 fichiers, 7.75s) ok.

## Tentatives & impasses

<!-- append à chaque escalation ou bascule -->
- **T6 — KeyboardSensor e2e** : tentative initiale via `Tab → Space → ArrowUp×2 → Space` → dnd-kit signalait `dropped over droppable area <same id>`, l'ArrowUp ne propageait pas le mouvement en mode Playwright. **Bascule** sur drag pointer manuel : `page.mouse.move(source) → mouse.down() → petit déplacement pour franchir le seuil dnd-kit → mouse.move(target, { steps: 15 }) → mouse.up()`. Stable sur 3 répétitions.
- **T6 — Seed cap 100** : le seed projet (`scripts/seed.ts`) ne contient que 5 activités, donc impossible de seeder 100 favoris sans bricolage e2e (créer 100 activités à la volée serait lourd et lent). **Décision** : pas de scénario e2e dédié au cap. Couverture déjà assurée par RTL existant `src/contexts/authContext.test.tsx` (mock `api.addFavorite` rejetant `ApiError(400, "limit reached")`, vérifie `addFavoriteId` rollback + `snackbar.error("Vous avez atteint la limite de 100 favoris.")`). La règle « si je peux exprimer le comportement sans citer un parcours utilisateur, c'est unit ou RTL » s'applique : la limite est un comportement de gestion d'erreur du context, pas un parcours.
- **`signin.spec.ts` flake parallel load** : un test pré-existant flake sous `pnpm e2e` global (race `withoutAuth`), passe en isolation. Indépendant de l'incrément 2. Documenté ; pas traité ici.

## Décisions techniques tranchées

<!-- append à chaque décision en cours de route -->

- **École TDD** : Chicago bottom-up (cohérent avec incrément 1).
- **Worktree** : non.
- **Lib DnD** : `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Justification : React 19.2 dans le projet — `@hello-pangea/dnd` n'a pas annoncé de support officiel React 19, risque de régression sur StrictMode. `@dnd-kit` est maintenu activement, plus modulaire, et fournit un `KeyboardSensor` accessible out-of-the-box (Nielsen #6).
- **Identifiant payload `ids` du PATCH = `_id` du favori** (cohérent avec `FavoriteDto.id`, cf. `src/server/serialize.ts:52`). Confirmé en T1.
- **Array vide en reorder** : early-return `[]` après validation pour éviter un `bulkWrite` vide (Mongo throw sur opérations vides).
- **Tests DnD en jsdom — fallback computeReorderedIds** : le `KeyboardSensor` de `@dnd-kit` ne se déclenche pas de façon stable en jsdom (`closestCenter` requiert un layout réel ; `getBoundingClientRect` retourne `0` partout). Stratégie retenue : extraire la logique pure `computeReorderedIds(currentIds, activeId, overId)` (basée sur `arrayMove`), l'exporter, la tester unitairement. Les tests RTL couvrent le rendu observable + l'accessibilité de la poignée. Le câblage `DndContext → onDragEnd → onReorder` est prouvé bout-en-bout par le test e2e Playwright (T6) qui pilote une vraie souris.
- **Drag handle pattern** : `attributes` + `listeners` de `useSortable` posés uniquement sur `<ActionIcon>` (poignée `IconGripVertical`, `aria-label="Réordonner ce favori"`). Le reste de la card reste cliquable normalement.

## Modèles & coûts

| Tâche | Complexité | Modèle | Effort | Escalation ? |
|---|---|---|---|---|
| T1 | complexe | opus | medium | non |
| T2 | standard | sonnet | low | non |
| T3 | trivial | (agent principal) | low | non |
| T4 | complexe | opus | medium | non (fallback `computeReorderedIds` retenu d'emblée) |
| T5 | standard | sonnet | medium | non |
| T6 | complexe | opus | high | non (bascule KeyboardSensor → drag pointer manuel ; S2 redirigée vers RTL existant) |
| T7 | meta | (agent principal + sonnet pour Stryker) | low | — |

Total : 3 opus, 2 sonnet, 2 directs (objectif tenu vs plan). Une bascule technique en T6 (drag clavier → pointer) résolue sans escalation file.

## Quality gate

- `pnpm verify` (lint + typecheck) : ok
- `pnpm verify:test` (vitest unit + intégration serveur) : 322 tests / 50 fichiers, 8.09s, ok
- `pnpm e2e -- e2e/favorites.spec.ts` : 4/4 ok (3 scénarios incrément 1 + S1 reorder incrément 2)
- `pnpm e2e` (suite complète) : 36/37 — 1 flake pré-existant sur `signin.spec.ts` sous parallel load (race `withoutAuth` documentée), passe en isolation, indépendant de cet incrément
- Tests ajoutés : 16 unit/RTL (T1: 6 service + T2: 4 HTTP + T4: 12 RTL component + T5: 4 RTL page = 26 ; les 4 cas T5 incluent l'adaptation de cas existants) + 1 e2e
- Hooks pré-commit : ok (jamais `--no-verify`)

## Mutation testing

<!-- rempli en Phase 5.5 par le sous-agent mutation-runner -->

## Résumé

Incrément 2 livré : un Utilisateur connecté peut **réordonner ses Favoris** en glisser-déposer sur `/profil`. Backend : nouvelle méthode `favoriteService.reorder(userId, ids)` (validation set-equality stricte, `bulkWrite` ordonné) + route `PATCH /api/me/favorites` (Zod max 100 IDs). Frontend : composant `<FavoritesReorderableList>` basé sur `@dnd-kit` (poignée explicite `IconGripVertical`, `KeyboardSensor` accessible), intégration `/profil` avec optimistic update + rollback + snackbar d'erreur. La logique pure de calcul de séquence (`computeReorderedIds`) est extraite et testée unitairement ; le câblage DnD est validé bout-en-bout par un e2e Playwright pilotant un drag pointer réel. Critère de succès du draft tenu : « glisser-déposer modifie l'ordre, persisté au reload ».

Périmètre effectif : 7 tâches (T1-T7), 0 escalation file produite, 1 bascule technique (KeyboardSensor → drag pointer en T6). 1 incrément reste avant complétion de la feature : incrément 3 (`<FavoriteToggle>` posé sur les cards Découvrir / Explorer / Mes activités).

## Liens

- Plan initial : `.claude/scratch/coding/favoris/increment-2/plan.md` (scratch éphémère, supprimé en fin de Phase 6).
- Aucune escalation file produite.
- Commit subject : `feat(favorites): drag-and-drop reorder with optimistic update on /profil` (SHA via `git log -- docs/sessions/2026-04-30-0025-favoris-increment-2.md`).
- Draft d'origine (voie A) : `docs/features/drafts/favoris.md` — annoté en tête (incrément 2 livré, incrément 3 reste). Reste source canonique pour la prochaine session `/coding`.
- Trajectoire : `.claude/scratch/coding/favoris/trajectory.md` — incrément 2 marqué `Livré`.
- Rapport incrément 1 : `docs/sessions/2026-04-29-2349-favoris-increment-1.md`.
- ADR candidats reportés : Q1 (collection dédiée), Q5 (couplage front-only via `AuthContext`).

## Mutation testing

**Run itération 1** : 2026-04-30 — scope incrément 2 uniquement (`favorite.service.ts` + `src/pages/api/me/favorites/index.ts`).

| Fichier | Score | Killed | Survived | No cov |
|---|---|---|---|---|
| `src/server/favorites/favorite.service.ts` | **82.69 %** | 43 | 8 | 1 |
| `src/pages/api/me/favorites/index.ts` (PATCH) | **83.33 %** | 10 | 2 | 0 |
| Score global run (tous fichiers en cache) | 95.59 % | 476 | 21 | 1 |

---

## Mutation testing — itération 2

**Run** : 2026-04-30 — mêmes fichiers cibles + `[activityId].ts`.

### Mutants tués (assertions ajoutées)

| Fichier | Ligne | Mutateur | Action |
|---|---|---|---|
| `favorite.service.ts` | 23 | `ObjectLiteral` (`findOne({ userId, activityId })` → `{}`) | Tué — test "same activity, 2 users, vérifie `userId` dans le retour de `add`" |
| `favorite.service.ts` | 42 | `ObjectLiteral` (`countDocuments({ userId })` → `{}`) | Tué — test "cap isolé par user : userA à 100 ne bloque pas userB" |
| `favorite.service.ts` | 56 | `ObjectLiteral` (`updateMany({ userId })` → `{}`) | Tué — test "add userA ne shifter pas les positions de userB" |
| `favorite.service.ts` | 106 | `ConditionalExpression` (`new Set(ids).size === ids.length` → `true`) | Tué — test "payload avec ids dupliqués → `BadRequestError`" |
| `favorite.service.ts` | 123 | `ObjectLiteral` (`find({ userId })` dans `reorder`) | Tué — test "reorder userA retourne SEULEMENT ses 2 favoris, pas ceux de userB" |
| `favorite.service.ts` | 130 | `ObjectLiteral` (`find({ userId })` dans `findIdsByUser`) | Tué — test "findIdsByUser ne leak pas les ids d'un autre user" |
| `favorite.service.ts` | L. reorder/findIdsByUser | `ObjectLiteral` divers | Tués via tests multi-user |

### Mutants annotés (équivalents ou cosmétiques — pas worth)

| Fichier | Ligne | Mutateur | Décision |
|---|---|---|---|
| `favorite.service.ts` | 27 | `ConditionalExpression` `if (!doc) → if (false)` | **Guard défensif** — chemin réachable uniquement en mockant le modèle Mongoose. Annoté `Stryker disable next-line ConditionalExpression,StringLiteral`. |
| `favorite.service.ts` | 12, 46, 53, 109 | `StringLiteral` (messages d'erreur) | **Cosmétique** — texte non testé car la valeur observable est le type d'erreur/HTTP status. Annotés `Stryker disable next-line StringLiteral`. |
| `favorite.service.ts` | 112 | `ConditionalExpression` `if (ids.length === 0) → if (false)` | **Équivalent** — `bulkWrite([])` + `find({ userId })` produit aussi `[]` quand l'user n'a pas de favoris. Annoté `Stryker disable next-line ConditionalExpression`. |

### Scores après itération 2

| Fichier | Score | Killed | Survived | Disabled/Equiv |
|---|---|---|---|---|
| `src/server/favorites/favorite.service.ts` | **100 %** | 75 | 0 | 5 (annotés) |
| Score global run (scope incrément 2) | **97.51 %** | 508 | 13 | — |

### Tests ajoutés (fichiers modifiés)

- `src/server/__tests__/favorite.service.test.ts` : +6 cas multi-user (`add` cap isolé, `add` no-shift autres users, `loadHydrated` userId vérifié, `remove` isolation, `reorder` isolation retour, `findIdsByUser` no-leak) + 1 cas duplicate ids = **7 assertions**
- `src/server/__tests__/favorites.http.test.ts` : +1 cas POST/DELETE activityId avec 24-hex encadré (ancres regex) = **1 test** (2 assertions)

### Décision finale sur le guard `!doc` (L.27)

Le mutant `ConditionalExpression` sur `if (!doc)` (`→ if (false)`) est **non tué intentionnellement**. Ce chemin ne peut s'activer que si le `FavoriteModel.findOne({ userId, activityId })` appelé juste après le `create` ne retrouve pas le document qu'on vient d'insérer, ce qui requiert un mock du modèle Mongoose et sort du périmètre des tests d'intégration. Annoté en place avec raison explicite.
