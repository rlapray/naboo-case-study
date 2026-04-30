# Session — Mode debug : Date de création (admin)

**Date** : 2026-04-30 13:37
**Feature** : admin-debug-created-at
**Bounded context** : Administration (premier consommateur produit du Rôle)
**Voie d'entrée** : A — Draft consolidé (`docs/features/drafts/admin-debug-created-at.md`)
**Commit subject (prévu)** : `feat(admin): show activity creation date on cards and detail in debug mode`

## Cadrage d'origine

Cf. `docs/features/drafts/admin-debug-created-at.md` (annoté `Statut : Livré` à la fin de la session).

Job : un Administrateur veut voir la **Date de création** de chaque Activité sur les listes et la fiche, pour diagnostiquer l'ordre des données sans ouvrir la base. Décisions clés :
- Q1 — `createdAt` reste public dans `ActivityDto`, pas de DTO admin (KISS).
- Q4 — Activation implicite par le `role === "admin"` (pas de toggle).
- Q5 — Composant dédié `<DebugCreatedAt>` qui lit `useAuth` et formate.
- Q6 — Tests : RTL composant (3 cas) + RTL intégration sur les surfaces + e2e admin/user.

## Plan initial

Cf. `.claude/scratch/coding/admin-debug-created-at/plan.md` (supprimé en fin de session).

| ID | Tâche | Couche | Modèle | Dépend de |
|----|-------|--------|--------|-----------|
| T1 | DebugCreatedAt + test RTL | component | sonnet | — |
| T2 | Insertion ActivityListItem + RTL | component | sonnet | T1 |
| T3 | Insertion Activity (fiche) + RTL | component | sonnet | T1 |
| T4 | Fixture `adminAuth` e2e | e2e | sonnet | — |
| T5 | E2E admin/user (discover + detail) | e2e | opus | T2, T3, T4 |

## Timeline d'exécution

- 13:38 — T4 (inline) : ajout `SEED_ADMIN` dans `e2e/fixtures/auth.ts` ok.
- 13:39 — T1 (sonnet) : RED → GREEN → REFACTOR ok. 3/3 tests RTL passent. Écart mineur : `container.firstChild` non asserté car `MantineProvider` injecte un `<style>` (couvert par `queryByText`).
- 13:41 — T2 (sonnet, parallèle) : RED → GREEN → REFACTOR ok. 4/4 tests `ActivityListItem.test.tsx`.
- 13:41 — T3 (sonnet, parallèle) : RED → GREEN → REFACTOR ok. 6/6 tests `Activity.test.tsx`.
- 14:50 — T5 (opus) : 7/8 e2e ok puis ESCALATION (date absente sur la fiche détail).
- 14:55 — Inline (orchestrateur) : insertion `<DebugCreatedAt>` dans `src/pages/activities/[id].tsx`. Re-run e2e ciblé : 3/3 ok.
- 14:59 — Quality gate : `pnpm verify` ok, `pnpm verify:test` ok (342/342, 51 fichiers).

## Tentatives & impasses

- **T5 — escalation : date absente sur la fiche détail.** Le draft pointait vers `src/components/Activity.tsx` comme « fiche détail », mais ce composant est une carte (utilisée en grille type Découvrir/Explorer). La vraie fiche `/activities/[id]` est rendue par `src/pages/activities/[id].tsx` qui est un layout SSR autonome. T5 a bien câblé les deux specs e2e mais le test admin de la fiche échouait car `<DebugCreatedAt>` n'était pas inséré dans la page. Résolution : édition inline de la page (import + 1 ligne) puis re-run e2e ok. Escalation conservée pour audit dans le rapport (cf. § « Décisions »).

## Décisions techniques tranchées

- T1 — Format date manuel zero-padded (et non `toLocaleString`) pour garantir la regex `\d{2}/\d{2}/\d{4} \d{2}:\d{2}` indépendamment du runtime/fuseau de la machine de test.
- T1 — Assertion DOM-vide via `queryByText(...) === null` plutôt que `container.firstChild === null` (MantineProvider injecte un `<style>`).
- **Périmètre élargi à `src/pages/activities/[id].tsx`** (vs draft qui ciblait `src/components/Activity.tsx`). Le composant `Activity.tsx` n'est jamais monté par la fiche détail ; la couverture initiale (RTL T3 sur `Activity.tsx`) reste utile pour la surface « carte » mais n'attrapait pas l'absence de date sur la page détail. Aucun RTL ajouté pour la page : couvert par e2e (cohérent avec la pyramide pour pages SSR).

## Modèles & coûts

| Tâche | Modèle | Statut | Escalations |
|-------|--------|--------|-------------|
| T1 — DebugCreatedAt + RTL | sonnet | ok | — |
| T2 — ActivityListItem (∥ T3) | sonnet | ok | — |
| T3 — Activity card (∥ T2) | sonnet | ok | — |
| T4 — Fixture adminAuth | inline | ok | — |
| T5 — E2E discover + detail | opus → inline | ok après fix | T5 (résolu, cf. § Tentatives) |

## Quality gate

- `pnpm verify` (eslint + tsc) : ✅
- `pnpm verify:test` (vitest run) : ✅ — 342 tests / 51 fichiers / 8.33s
- `pnpm e2e e2e/activity-detail.spec.ts` : ✅ — 3/3 (after fix)
- `pnpm e2e e2e/discover.spec.ts` : ✅ — exécuté implicitement dans le run T5 initial (5/5 verts)
- Mutation testing : skip — diff entièrement hors scope Stryker (`src/components/**`, page SSR, e2e ; aucun fichier dans `src/server`, `src/hooks`, `src/utils`, `src/pages/api`).

## Résumé

Mode debug livré sur les trois surfaces qui rendent une Activité : carte de liste (`ActivityListItem`), carte de grille (`Activity`) et fiche détail (`/activities/[id]`). Composant unique `<DebugCreatedAt>` qui lit `useContext(AuthContext)` et rend `dd/MM/yyyy HH:mm` zero-padded pour `role === "admin"`, `null` sinon. 5 nouveaux tests RTL (3 composant + 2 intégration) et 4 nouveaux tests e2e (admin/user × discover/detail). Anti-régression Q1 vérifiée par les e2e user. Périmètre élargi vs draft : le draft pointait `src/components/Activity.tsx` comme fiche détail, la vraie fiche est `src/pages/activities/[id].tsx` (escalation T5 résolue inline).

## Liens

- Draft : `docs/features/drafts/admin-debug-created-at.md` (annoté `Statut : Livré`).
- Escalation T5 : conservée à `.claude/scratch/coding/admin-debug-created-at/escalations/T5.md` jusqu'au cleanup scratch (contenu reflété dans § Tentatives).
- Commit subject prévu : `feat(admin): show activity creation date on cards and detail in debug mode`.
- SHA : retrouver via `git log -- docs/sessions/2026-04-30-1337-admin-debug-created-at.md`.
