# Shape — Mode debug : date de création sur les cartes (admin)

**Statut** : Livré (cf. `docs/sessions/2026-04-30-1337-admin-debug-created-at.md`). Périmètre élargi en cours d'implémentation à `src/pages/activities/[id].tsx` (la fiche détail réelle, vs `src/components/Activity.tsx` indiqué dans le draft).
**Date** : 2026-04-30
**Auteur** : Romain Lapray
**Slug** : admin-debug-created-at

## Job (JTBD)

Quand je consulte les listes d'Activités et la fiche d'une Activité, en tant qu'**Administrateur**, je veux voir la **Date de création** de chaque Activité directement à l'écran, pour diagnostiquer rapidement l'ordre des données et repérer des anomalies temporelles sans ouvrir la base.

## Fit

- **Bounded Context** : **Administration** (premier consommateur produit du Rôle, jusqu'ici dormant — cf. `docs/features/FEATURES.ADMINISTRATION.md` et l'item « Mode debug Utilisateur » des zones non cartographiées de `docs/features/FEATURES.md`).
- **Acteur** : **Administrateur** (Rôle Identité/Administration).
- **Surface** : `front` uniquement — `ActivityDto.createdAt` est déjà exposé publiquement (`src/types/activity.ts:9`, `src/server/serialize.ts:40`).
- **Nature** : feature *nouvelle* dans Administration, *extension* visuelle des composants `ActivityListItem` (`src/components/ActivityListItem.tsx`) et `Activity` (fiche détail `src/components/Activity.tsx`).
- **Doublons / interférences** : aucune feature existante n'affiche `createdAt` à l'écran. Touche toutes les surfaces qui rendent une carte (Découvrir, Explorer, Dernières activités, Mes activités, Mes favoris) + la fiche `/activities/[id]`.

## Critères de décision

1. **KISS / YAGNI** — case study, premier usage du Rôle, pas de système de toggle ni de DTO admin séparé.
2. **Cohérence avec les patterns existants** — encapsulation à la `FavoriteToggle` (composant qui lit lui-même `useAuth`), `renderWithProviders` pour les tests.
3. **Cohérence d'affichage (Nielsen #4)** — même format, même emplacement sur toutes les cartes et la fiche.
4. **Pas de sur-ingénierie de gating** — `createdAt` est déjà public dans le DTO ; on n'introduit pas de DTO admin.

## Décisions tranchées

| Q# | Sujet | Choix | Justification | Alternatives évaluées |
|----|-------|-------|---------------|----------------------|
| Q1 | Statut de `createdAt` dans le DTO public | (a) Donnée publique assumée — pas de gating serveur | `createdAt` est déjà sérialisé pour tous ; pas sensible (pas de RGPD, pas d'info concurrentielle) ; case study | <details>(b) Retirer du DTO public et exposer via DTO admin séparé — rejetée : sur-ingénierie pour un seul champ non sensible. (c) Documenter sans changer — redondant avec (a).</details> |
| Q2 | Surfaces concernées | (b) Cartes en liste **+** fiche détail | Cohérence #4 sur toutes les surfaces où une Activité est rendue à l'écran | <details>(a) Listes seules — incohérent avec la fiche détail. (c) + modale Favoris — pas de modale Activité dans la modale de vente, hors périmètre.</details> |
| Q3 | Format d'affichage | (b) Date + heure locale FR, ex. `30/04/2026 14:32` | Granularité minute utile pour debug (ordre de seed, anomalies de batch) ; format local cohérent avec l'app | <details>(a) Jour seul — perd l'info batch. (c) ISO brut — illisible. (d) Relatif — ambigu pour comparer.</details> |
| Q4 | Activation du mode | (a) Implicite : `role === "admin"` ⇒ date toujours visible | Un seul indicateur, un seul cas d'usage ; pas de toggle à introduire avant qu'un 2e affichage debug existe | <details>(b) Toggle header + localStorage — YAGNI tant que c'est un seul affichage. (c) Query param `?debug=1` — implicite suffit, le query param ajoute du bruit URL.</details> |
| Q5 | Source du rôle côté front | (c) Composant dédié `<DebugCreatedAt activity={…} />` qui lit `useAuth()` et formate | Encapsule la règle (rôle + format) en un point ; un seul test ; deux insertions triviales ; aligné avec `FavoriteToggle` | <details>(a) Lecture directe de `useAuth` dans `ActivityListItem` et `Activity` — duplique la règle. (b) Prop `isAdmin` depuis le parent — prop drilling sur N pages.</details> |
| Q6 | Niveau de tests | (b) RTL composant + RTL d'intégration sur les surfaces ; **plus** : étendre les e2e existantes avec un parcours admin | Vérifie la branche admin/non-admin du composant **et** l'insertion effective dans les surfaces ; e2e ajoutées car aucun parcours admin n'existe à date dans `e2e/` | <details>(a) RTL composant seul — n'attrape pas un oubli d'insertion. (c) RTL composant + e2e seulement — manque la garantie d'insertion structurelle.</details> |

## Options écartées

- **DTO admin dédié `AdminActivityDto`** — pour un seul champ déjà public, le coût (sérialisation conditionnelle, branchement par rôle, test de fuite) dépasse le bénéfice. Reposer la question si une vraie donnée sensible doit s'ajouter (ex. email du Propriétaire en clair).
- **Mécanisme de toggle générique « mode debug »** — anticipation d'un besoin futur. À introduire au 2e affichage debug, pas avant.
- **Helper `formatDateTime` mutualisé** — un seul site d'usage à date ; helper local au composant `<DebugCreatedAt>` suffit.

## Conséquences

### Positives

- Premier usage produit concret du Rôle Administrateur — débloque le périmètre Administration.
- Composant `<DebugCreatedAt>` réutilisable comme socle si d'autres affichages debug s'ajoutent (mode debug Utilisateur de la roadmap).
- Aucune migration, aucun changement de DTO, aucun risque de régression sur les surfaces non-admin.

### Négatives / dette assumée

- `createdAt` reste publiquement exposé dans `ActivityDto` — assumé (Q1). À reposer si la sensibilité du champ change.
- Le rôle est lu côté front uniquement ; un Utilisateur qui modifierait son rôle dans le contexte React verrait la date — non-problème puisque la donnée est déjà publique (Q1) et que le rôle authoritative vit côté serveur.

## Vocabulaire (UBIQUITOUS_LANGUAGE)

- **Aligné** : `Administrateur`, `Activité`, `Rôle`.
- **À ajouter** :
  - **Mode debug** — _ensemble d'affichages diagnostics réservés à l'Administrateur, sans effet sur les autres Utilisateurs ni sur les données métier ; activé implicitement par le Rôle._
  - **Date de création (d'Activité)** — _métadonnée `createdAt` issue des timestamps Mongoose, déjà exposée dans `ActivityDto`, affichée à l'écran uniquement en Mode debug._
- **Alias à éviter** : `admin mode`, `developer view`, `createdAt visible` → utiliser **Mode debug** et **Date de création**.

## Risques UX (Nielsen)

- **#8 — Design minimaliste** : risque que la date pollue les cartes pour les non-admins. Parade : composant qui rend `null` strict si `user?.role !== "admin"` ; couvert par un test RTL dédié.
- **#4 — Cohérence et standards** : risque d'afficher la date à un endroit/format différent selon la surface. Parade : un seul composant `<DebugCreatedAt>` réutilisé partout, format figé `dd/MM/yyyy HH:mm`.
- **#6 — Reconnaissance plutôt que rappel** : risque qu'un format ISO ou timestamp Unix oblige à un effort de lecture. Parade : format local FR avec séparateurs habituels.

## Contrat technique

- **Modèle de données** : aucun changement. `ActivityDto.createdAt` (string ISO) déjà disponible, `IActivity.createdAt` côté Mongoose déjà persisté.
- **API** : aucune nouvelle route, aucun changement de contrat.
- **Couplages cross-contexts** : Administration → Identité (lecture du `role` via `AuthContext`, déjà chargé à la Connexion) ; Administration → Catalogue (consommation du `createdAt` déjà sérialisé). Couplage front-only assumé, en cohérence avec la note `Relations inter-contextes` de `UBIQUITOUS_LANGUAGE.md`.
- **Nouveau composant** : `src/components/DebugCreatedAt.tsx`
  - Props : `{ activity: Pick<ActivityDto, "createdAt"> }`.
  - Logique : si `useAuth().user?.role !== "admin"` → renvoie `null`. Sinon → rend la date au format `dd/MM/yyyy HH:mm` (locale FR, fuseau navigateur).
  - Insertion : dans `ActivityListItem.tsx` (carte de liste) et `Activity.tsx` (fiche détail), à un emplacement discret (sous le titre ou en pied de carte — choix d'implémentation).

## Découpage

`1 PR suffit`. Périmètre :

1. Créer `src/components/DebugCreatedAt.tsx` + test RTL composant.
2. Insérer dans `ActivityListItem.tsx` et `Activity.tsx`.
3. Étendre `ActivityListItem.test.tsx` et `Activity.test.tsx` pour vérifier la présence du composant rendu.
4. Étendre `e2e/fixtures/auth.ts` avec une fixture admin (`adminAuth`) et ajouter des assertions dans `e2e/discover.spec.ts` + `e2e/activity-detail.spec.ts` qui se connectent admin et vérifient la visibilité d'un texte au format `dd/MM/yyyy HH:mm`.

## Tests à prévoir

- **RTL composant** (`DebugCreatedAt.test.tsx`) :
  - Rend la date formatée FR pour un user `role: "admin"`.
  - Rend `null` (rien dans le DOM) pour un user `role: "user"`.
  - Rend `null` pour un visiteur non connecté (`user: null`).
- **RTL intégration** :
  - `ActivityListItem.test.tsx` : avec un admin dans `renderWithProviders`, la carte affiche un texte matching `\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}`.
  - `Activity.test.tsx` : idem sur la fiche.
- **E2E Playwright** :
  - Fixture `adminAuth` dans `e2e/fixtures/auth.ts` (login avec le compte admin du seed `src/server/seed/`).
  - `discover.spec.ts` : nouveau bloc `test.describe("admin debug")` qui s'authentifie admin, navigue sur `/discover`, asserte qu'au moins une carte contient un texte au format `dd/MM/yyyy HH:mm`.
  - `activity-detail.spec.ts` : idem sur `/activities/[id]`.
  - Vérifier en complément (test existant ou nouveau) qu'un user standard **ne voit pas** la date sur la même page (anti-régression Q1).

## Plan de vérification

- Commandes : `pnpm verify` (lint + typecheck), `pnpm verify:test` (Vitest unit + intégration), `pnpm test:e2e` (Playwright).
- Parcours manuel sur `:3001` :
  1. Connexion avec le compte admin du seed.
  2. Aller sur `/discover` — date visible sur chaque carte au format `dd/MM/yyyy HH:mm`.
  3. Cliquer sur une carte — date visible sur la fiche `/activities/[id]`.
  4. Déconnexion, reconnexion en user standard — aucune date affichée nulle part.
- Inspection DevTools optionnelle (`chrome-cdp` sur `:3001`) pour confirmer que le composant est bien absent du DOM côté non-admin (et pas juste masqué par CSS).

## Décisions ouvertes (non bloquantes)

- Emplacement visuel exact dans la carte (sous le titre vs pied de carte) — choix d'implémentation, à arbitrer en revue visuelle.
- Couleur / typographie « discrète » (gris muted, taille `xs`) — choix d'implémentation, sans impact contractuel.

## Liens

- **ADRs liés** : aucun (décisions tranchées ici sont produit/UX, pas architecturales durables).
- **Features liées** : `docs/features/FEATURES.ADMINISTRATION.md` (domaine dormant activé), `docs/features/FEATURES.md` ligne 56 (zone non cartographiée « Mode debug Utilisateur »).
- **Issues / PRs** : à créer.
