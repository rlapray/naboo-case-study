# Session — Favoris (incrément 1 — walking skeleton)

**Date** : 2026-04-29 23:49 (Europe/Paris)
**Feature** : Favoris (incrément 1 sur 3)
**Bounded contexts** : Catalogue × Identité
**Commit subject** : `feat(favorites): walking skeleton for Mes favoris (mark, list, remove)` (SHA via `git log -- docs/sessions/2026-04-29-2349-favoris-increment-1.md`)
**Voie d'entrée** : A (draft consolidé issu de `/shaping-feature` + `/grill-me`)

## Cadrage d'origine

> Source : `docs/features/drafts/favoris.md` (conservé dans le repo, annoté avec note de statut renvoyant ici ; reste la source canonique pour les incréments 2 et 3 à venir).

# Shape — Favoris

**Statut** : Draft
**Date** : 2026-04-29
**Auteur** : Romain Lapray
**Slug** : favoris

## Job (JTBD)

Quand je tombe sur une **Activité** qui m'intéresse mais que je ne suis pas prêt à m'engager, en tant qu'**Utilisateur connecté**, je veux la marquer comme **Favori** et la retrouver dans l'ordre que je choisis sur mon **Profil**, pour comparer mes options et y revenir plus tard.

## Fit

- **Bounded Context** : `Catalogue` (objet marqué : Activité) × `Identité` (porteur du marquage : Utilisateur, exposition sur le Profil).
- **Acteur** : Utilisateur connecté.
- **Surface** : `both`.
- **Nature** : nouvelle feature.
- **Doublons / interférences** :
  - Réutilise le pattern des cards d'Activité partagé entre Découvrir / Explorer / Mes activités → le toggle « cœur » apparaît partout, pas seulement sur la fiche.
  - `/profil` (`src/pages/profil.tsx`) ne contient à date que prénom/nom/email — il devient le point d'entrée d'une liste, à enrichir d'une section.

## Critères de décision

Boussole utilisée pendant le grilling, par priorité décroissante.

1. **Cohérence avec les patterns existants** du projet (services serveur dédiés, `useCursorPagination`, `SnackbarContext`, `withAuth/withoutAuth`).
2. **Simplicité d'implémentation** sur ce case study (pas de sur-ingénierie sur des cas qui n'arriveront jamais).
3. **Respect des Bounded Contexts** : éviter qu'un service Catalogue connaisse Identité et inversement.
4. **Réversibilité** des choix de modèle (pouvoir ajouter un champ sans migration de masse).
5. **Testabilité** : chaque décision doit produire un comportement vérifiable simplement par la pyramide projet.

## Décisions tranchées

Issues du grilling Q1-Q7. Alternatives évaluées conservées sous `<details>` pour audit.

| Q# | Sujet | Choix | Justification | Alternatives évaluées |
|----|-------|-------|---------------|----------------------|
| Q1 | Modèle de données | **Collection dédiée** `favorites { userId, activityId, position, createdAt }`, index composé `(userId, position)` | Cohérence avec le pattern « collection + service + DTO » déjà utilisé pour `activities` ; un Favori est une **relation** ordonnée, pas un attribut de l'Utilisateur ; ajouts futurs (note, tag, createdAt) sans migration | <details>**Tableau embarqué** `favorites: ObjectId[]` sur `UserModel` — rejeté : couple deux Bounded Contexts côté serveur, pagination ad hoc, ajout de champ par-favori = migration tableau</details> |
| Q2 | Encodage de l'ordre + cap | **PATCH full sequence** `{ ids: string[] }`, le serveur réécrit toutes les positions en `bulkWrite`. **Cap dur à 100 Favoris/Utilisateur** | Pas de concurrence réelle sur ce case study, payload (~2.4 KB) trivial, zéro logique de calcul de rang à tester | <details>**Integer position incrémentée** — rejeté : cascade `UPDATE` à chaque drop, conflits silencieux sous concurrence. **Fractional ranking (LexoRank)** — rejeté : utilitaire à écrire et tester, érosion de précision après N réinsertions, complexité non justifiée ici</details> |
| Q3 | Pagination de Mes favoris | **Aucune.** GET `/api/me/favorites` renvoie la liste complète (≤100 entrées, Activités hydratées) | Cohérent avec PATCH full sequence (le client doit connaître tout l'ensemble pour réordonner) ; Mes favoris est une **liste finie personnelle**, pas un Catalogue subi | <details>**Pagination par Curseur** comme le reste du Catalogue — rejeté : empêche le reorder libre. **Pagination en lecture + full sequence en écriture** — rejeté : double endpoint, complexité front pour un bénéfice nul à 100 entrées max</details> |
| Q4 | Clic cœur par un Visiteur non connecté | **Modale de vente** : explique la feature, propose Connexion ou Inscription | Préserve le contexte de navigation de l'utilisateur (scroll, recherche) ; sert aussi de pédagogie produit | <details>**Cœur masqué** — rejeté : pas de découverte de la feature. **Redirection directe `/signin?returnTo=`** — rejeté : brutal, casse le flow de découverte</details> |
| Q5 | Hydratation du cœur sur les listes | **Set d'IDs préchargé dans `AuthContext`** (`favoriteIds: Set<string>`), chargé une fois à la Connexion via `GET /api/me/favorites/ids`, mis à jour de manière synchrone à chaque toggle | Respecte les Bounded Contexts côté serveur (`activities` n'a aucune connaissance des Favoris) ; lecture O(1) côté `<FavoriteToggle>` ; un seul fetch par session | <details>**Enrichir chaque `ActivityDto` côté serveur** avec `isFavorited` — rejeté : couple Catalogue → Identité côté serveur, viral. **Endpoint séparé appelé en parallèle de chaque liste** — rejeté : N requêtes redondantes, pas de cache</details> |
| Q6 | Position d'un nouveau Favori | **En tête (position 0)**, décalage des autres dans le même `bulkWrite` | #1 Visibilité du statut Nielsen — résultat de l'action immédiatement visible ; convention du marché (Pinterest, Spotify) | <details>**En queue** — rejeté : oblige à scroller pour vérifier l'ajout sur une liste longue. **Position neutre (alphabétique / date)** — rejeté : impose un reorder manuel pour tout ordre signifiant</details> |
| Q7 | UX au-delà du cap de 100 | **Toast d'erreur explicite** via `SnackbarContext` : « Vous avez atteint la limite de 100 favoris ». Cœur reste vide | Réutilise l'infra existante (zéro nouveau composant) ; #9 Récupération erreurs Nielsen | <details>**Modale bloquante avec proposition de retrait** — rejeté : composant dédié pour un cas qui n'arrivera quasi jamais. **Auto-éviction du plus ancien (FIFO)** — rejeté : l'utilisateur perd un Favori à son insu, anti-pattern</details> |

## Options écartées

Pistes envisagées pendant le cadrage et rejetées explicitement.

- **Stocker les Favoris dans un champ JSON sur `UserModel`** : rejeté pour les mêmes raisons que le tableau embarqué (Q1).
- **Page dédiée `/favoris` séparée du Profil** : rejeté — le job parle explicitement de « consulter ses favoris **sur son profil** », et `/profil` est sous-utilisé aujourd'hui.
- **Tri automatique des Favoris (date, prix, nom)** : rejeté — l'ordre **manuel** est au cœur du job (« comparer mes options »). Un tri automatique trahirait l'intention.
- **Partage public d'une liste de Favoris** : hors scope explicite — pas demandé par le job.

## Conséquences

### Positives

- Le projet gagne un pattern réutilisable pour toute future « relation ordonnée Utilisateur ↔ X » (favoris d'Activités, plus tard de Villes, etc.).
- L'`AuthContext` devient le point d'entrée unique pour les états « personnels » (Q5) — base saine si on veut y ajouter d'autres sets (Activités vues récemment, etc.).
- Le cap explicite à 100 protège dès le jour 1 contre les abus (curl avec 10k IDs) et contraint l'UX à rester simple.

### Négatives / dette assumée

- **Couplage front-only** entre Catalogue et Identité dans `AuthContext` : accepté en connaissance de cause (Q5). Si demain on veut un site SSR pour les Favoris d'un autre utilisateur, ce couplage devra remonter côté serveur.
- **PATCH full sequence** ne tient pas si le cap monte au-delà de ~500 entrées (payload + transaction). Si la décision produit change, basculer sur fractional ranking sera un chantier non trivial.
- **Pas de cascade** sur la suppression d'une Activité : l'absence actuelle de feature de suppression d'Activité rend ce point théorique, mais ce sera une dette à régler le jour où la suppression est introduite.

## Vocabulaire (UBIQUITOUS_LANGUAGE)

- **Aligné** : `Activité`, `Utilisateur`, `Profil`, `Page d'activités` (référence dans la définition de Mes favoris pour expliciter ce qu'elle n'est **pas**).
- **À ajouter** :
  - **Favori** — _Activité qu'un Utilisateur connecté a marquée pour la retrouver depuis son Profil. Marquage personnel, réversible, n'affecte pas la visibilité de l'Activité pour les autres._
  - **Mes favoris** — _Liste finie ordonnée des Favoris de l'Utilisateur connecté, présentée dans son Profil. **N'est pas une Page d'activités** (pas de Curseur, pas de Charger plus). L'ordre est défini par l'Utilisateur._
- **Alias à éviter** : `favorite`, `bookmark`, `like`, `wishlist`, `saved` → utiliser **Favori** / **Mes favoris**.

## Risques UX (Nielsen)

- **#1 Visibilité du statut** : l'état favori doit être lisible **partout où une card d'Activité apparaît** (Découvrir, Explorer, Mes activités, fiche). Parade : set d'IDs hydraté depuis `AuthContext` (Q5), pas de fetch par card.
- **#3 Contrôle utilisateur & liberté** : retrait accidentel = perte de donnée perçue ; reorder optimistic peut désynchroniser silencieusement. Parade : snackbar avec « Annuler » sur retrait (réutiliser `SnackbarContext`) ; rollback optimistic + sync `AuthContext` en cas d'échec API.
- **#4 Cohérence et standards** : icône cœur (pas étoile/épingle), placement constant en haut-droite des cards, comportement identique pour les Visiteurs (modale Q4). Parade : un seul composant `<FavoriteToggle activityId>` consommé partout.
- **#6 Reconnaissance plutôt que rappel** : l'affordance « glisser » sur la liste réordonnable doit être visible. Parade : poignée explicite (Mantine `@hello-pangea/dnd` ou équivalent) ; ordre persisté côté serveur, pas seulement client.

## Contrat technique

### Modèle de données

Nouvelle collection `favorites` (Mongoose schema dans `src/server/favorites/favorite.schema.ts`).

| Champ | Type | Notes |
|-------|------|-------|
| `userId` | `ObjectId` (ref `User`) | Indexé |
| `activityId` | `ObjectId` (ref `Activity`) | — |
| `position` | `Number` | 0-based, contigu après chaque mutation |
| `createdAt` | `Date` | Auto |

Index composé `(userId, position)` unique. Index `(userId, activityId)` unique pour empêcher les doublons.

### API

| Verbe | Route | Effet | Codes |
|-------|-------|-------|-------|
| `POST` | `/api/me/favorites/:activityId` | Insère en tête (`position = 0`), décale les autres dans un `bulkWrite` | 201 / 409 (déjà présent) / 400 (cap atteint) / 401 |
| `DELETE` | `/api/me/favorites/:activityId` | Retire et compacte les positions | 204 / 401 (idempotent : 204 même si absent) |
| `GET` | `/api/me/favorites` | Liste complète ordonnée par `position`, Activités hydratées via `populate("activityId")` puis projetées en `ActivityDto` | 200 / 401 |
| `GET` | `/api/me/favorites/ids` | Set d'IDs uniquement (`{ ids: string[] }`, ~2.4 KB max) — chargé par `AuthContext` | 200 / 401 |
| `PATCH` | `/api/me/favorites` | Body `{ ids: string[] }` ; valide `set(ids) === set(existing)` ; réécrit toutes les positions en `bulkWrite` | 200 / 400 (set ≠) / 401 |

### Couplages cross-contexts

- **Front uniquement** : `AuthContext` connaît `favoriteIds: Set<string>`. Le service serveur `activities` reste agnostique des Favoris.
- **Aucun couplage serveur** : la collection `favorites` ne fait que référencer `Activity` par `ObjectId` (pas de duplication de données d'Activité).

## Découpage

Trois incréments séquencés (touche 2 Bounded Contexts, 4 routes nouvelles, schema nouveau → ne tient pas en 1 PR).

1. **Walking skeleton — marquer / retirer / lister** · Schema `Favorite`, service + 4 routes (POST / DELETE / GET liste / GET ids), composant `<FavoriteToggle>` posé sur la fiche Activité, section « Mes favoris » sur `/profil` (liste sans drag), modale vente pour Visiteurs, sync `AuthContext`.
   _Succès :_ un Utilisateur peut marquer 3 Activités depuis la fiche, les voir listées sur `/profil`, en retirer une.

2. **Réordonnancement** · Route `PATCH /api/me/favorites`, DnD sur `/profil` avec poignée explicite, optimistic update + rollback sur erreur.
   _Succès :_ glisser-déposer sur `/profil` modifie l'ordre, persisté au reload.

3. **Hydratation des listes** · `<FavoriteToggle>` posé sur les cards de Découvrir / Explorer / Mes activités, lecture du set `favoriteIds` depuis `AuthContext`.
   _Succès :_ marquer depuis Découvrir met à jour l'icône partout sans rechargement.

## Tests à prévoir

- **Unit serveur** (Vitest + `mongodb-memory-server`, dans `src/server/favorites/*.test.ts`) :
  - `service.add` idempotent (409 sur doublon), respecte le cap 100 (400), insère bien en `position = 0` et décale.
  - `service.remove` silencieux si absent, compacte les positions.
  - `service.reorder` rejette si le set diffère de l'existant ; succès si égal.
  - Ownership : un user ne peut pas réordonner les Favoris d'un autre.
- **RTL** :
  - `<FavoriteToggle>` : états authentifié / non-authentifié (ouverture modale Q4), optimistic + rollback sur erreur API mockée à la frontière `@/services/api`.
  - Section profil « Mes favoris » : liste vide, ordre rendu, snackbar « Annuler » sur retrait, callback `onReorder(newSequence)` (DnD testé via callback, pas via drag réel).
- **E2E Playwright** (parcours connecté) :
  - Marquer 3 Activités depuis Découvrir → `/profil` → réordonner → reload → ordre persisté → retirer un favori → undo via snackbar.
  - Visiteur non connecté clique cœur → modale → bascule vers `/signin` → après Connexion, Activité est en Favori.
  - Cap atteint : seed 100 Favoris, tenter le 101ème → toast d'erreur, cœur vide.

## Plan de vérification

- `pnpm verify` (lint + typecheck) et `pnpm verify:test` (unit + intégration serveur) passent.
- `pnpm test:e2e` passe sur les 3 scénarios E2E ci-dessus.
- Parcours manuel via `chrome-cdp` sur `:3001` :
  1. Login avec un compte de seed.
  2. Aller sur `/discover`, cliquer le cœur de 3 Activités → vérifier feedback visuel (cœur plein).
  3. Naviguer sur `/profil` → section « Mes favoris » présente, 3 entrées dans l'ordre inverse de marquage.
  4. Drag de l'item 3 vers position 1 → reload (`F5`) → ordre conservé.
  5. Logout, retour sur `/discover`, cliquer un cœur → modale de vente apparaît.

## Décisions ouvertes (non bloquantes)

- Un **Propriétaire** peut-il favoriser sa propre Activité ? *Choix par défaut : oui.* Trancher au moment d'écrire les tests.
- Comportement quand une Activité référencée serait supprimée. *Non bloquant : aucune feature de suppression d'Activité n'existe à date.*
- Choix de la lib DnD pour l'incrément 2 (`@hello-pangea/dnd`, `dnd-kit`, ou natif HTML5 drag) — à arbitrer au début de l'incrément 2 selon la version de React et l'ergonomie souhaitée.

## Liens

- **ADRs liés** : aucun à date. Q1 (collection dédiée) et Q5 (couplage front-only via AuthContext) sont des candidats de promotion en ADR via `/writing-adrs`.
- **Features liées** : `docs/features/FEATURES.CATALOGUE.md` (Consulter la fiche d'une Activité, Mes activités) et `docs/features/FEATURES.IDENTITE.md` (Consulter mon Profil).
- **Issues / PRs** : à créer au démarrage de l'incrément 1.

---

## Résumé

Incrément 1 livré : un Utilisateur connecté peut marquer une Activité comme Favori depuis sa fiche, la liste s'affiche sur `/profil` (SSR, ordonnée par `position` côté serveur), et il peut la retirer depuis la fiche ou depuis le Profil. Un Visiteur qui clique le cœur voit s'ouvrir une modale de vente proposant Connexion ou Inscription. Schema Mongoose dédié, 4 routes REST (`POST/DELETE /api/me/favorites/:id`, `GET /api/me/favorites`, `GET /api/me/favorites/ids`), `AuthContext` étendu avec `favoriteIds: Set<string>` (optimistic + rollback). Critère de succès du draft tenu.

## Plan initial

8 tâches, chaîne strictement séquentielle (T1 → T2 → … → T8), aucune parallélisation utile. Détail dans `.claude/scratch/coding/favoris/increment-1/plan.md` (scratch, peut être nettoyé après commit).

| # | Tâche | Couche | Modèle |
|---|---|---|---|
| T1 | Schema Mongoose `Favorite` + `FavoriteDto` + indexes | server | sonnet (fait directement par l'agent principal) |
| T2 | Service `favoriteService` + tests intégration | server | opus |
| T3 | 4 routes API REST `/api/me/favorites*` + tests HTTP | server | sonnet |
| T4 | `AuthContext` étendu avec `favoriteIds` | client | sonnet |
| T5 | `<FavoriteToggle>` + `<SignInPromptModal>` + tests RTL | client | sonnet |
| T6 | Section « Mes favoris » sur `/profil` (SSR) + toggle sur fiche | client | sonnet |
| T7 | E2E Playwright (parcours connecté + visiteur) | e2e | opus |
| T8 | Quality gate + rapport + commit final | meta | orchestré par l'agent principal |

## Timeline d'exécution

- 23:18 — T1 (agent principal) : schema + DTO posés, `pnpm verify` ok.
- 23:24 — T2 (opus) : 18 cas RED puis GREEN, suite serveur 268/268.
- 23:28 — T3 (sonnet) : 15 cas HTTP, suite 283/283.
- 23:32 — T4 (sonnet) : 9 cas RTL sur `AuthContext`, suite 282/282.
- 23:34 — T5 (sonnet) : 9 cas RTL (`<FavoriteToggle>` + `<SignInPromptModal>`), suite 291/291.
- 23:37 — T6 (sonnet) : 6 cas RTL (`/profil` + fiche Activité), suite 297/297. La page `/profil` passe en `getServerSideProps` (auth + favoris en SSR), le HOC `withAuth` est retiré de cette page.
- 23:40 — T7 (opus) ESCALATION : `pnpm e2e:server` (next build) refusait les fichiers de test colocalisés sous `src/pages/`.
- 23:43 — Agent principal : déplacement des tests vers `src/__tests__/pages/` (la première tentative dans `src/pages/__tests__/` ne suffisait pas — Next scanne récursivement). Cache `.next/` purgé. `pnpm verify` re-passe.
- 23:46 — T7 (opus) reprise : 3 scénarios e2e passants (S1 connecté, S2 visiteur → /signin, S3 visiteur → /signup), suite e2e 36/36.
- 23:49 — Quality gate final : verify ok, verify:test 297/297 ok, e2e 36/36 ok.
- 23:50 — Rapport rédigé, draft annoté avec statut + incréments restants, commit final préparé.

## Tentatives & impasses

- **T2 — index `(userId, position)` unique** : le draft prescrivait un index unique sur `(userId, position)`. Conservé non-unique côté schema car le `bulkWrite` de décalage `$inc: { position: 1 }` viole transitoirement la contrainte unique sur MongoDB (les writes ne sont pas un swap atomique). Cohérence des positions assumée par le service ; un test de sanity-check vérifie que l'unicité `(userId, activityId)` (anti-doublon, elle critique) reste appliquée. Justification documentée en commentaire de `src/server/favorites/favorite.schema.ts`.
- **T2 — chaîner `populate` sur le doc retourné par `create`** : ne fonctionne pas correctement (le populate ne déréférence pas l'`ObjectId` stocké). Le sous-agent re-fetche via `loadHydrated(userId, activityId)` après `create`. Coût : un round-trip Mongo de plus, payé pour la lisibilité.
- **T6 — pattern de la page `/profil`** : le code existant utilisait le HOC client-side `withAuth(Profile)` (redirection après render). Pour respecter le plan (« pas de bouclage HTTP self-call ; appeler le service serveur depuis `getServerSideProps` »), la page passe en SSR : `getServerSideProps` fait `getCurrentUser(req)` + redirect serveur si null, puis charge les favoris via `favoriteService.findByUser`. Le HOC `withAuth` reste utilisé par les autres pages (intact dans `src/hocs/`), seul son usage sur `/profil` est retiré.
- **T7 — escalation Next.js build vs tests colocalisés** : `T6` avait colocalisé `src/pages/profil.test.tsx` et `src/pages/activities/[id].test.tsx`. `pnpm dev` les ignore, mais `next build` (utilisé par `pnpm e2e:server`) les traite comme des pages et exige un default export `PagesPageConfig`. Première tentative de fix : `src/pages/__tests__/` — toujours scanné par Next. Fix retenu : déplacement complet hors de `src/pages/`, vers `src/__tests__/pages/`. Vitest les ramasse via les imports en alias `@/pages/...`. Escalation persistée dans `.claude/scratch/coding/favoris/increment-1/escalations/T7.md`.
- **T7 — anti-flake e2e** : la vérification de l'ajout au Profil nécessite un `waitForResponse` sur le POST `/api/me/favorites/[activityId]` avant la navigation vers `/profil`, sinon le SSR de `getServerSideProps` lit la DB avant la persistance optimistic. Idem pour le retrait : un `reload()` est obligatoire pour distinguer la persistance DB de l'optimistic-update côté UI.

## Décisions techniques tranchées

- **École TDD** : Chicago bottom-up. Backend nouveau → on commence par le schema + service + routes, puis on remonte vers le composant et la page.
- **Worktree** : non.
- **Index `(userId, position)` non unique** (cf. ci-dessus).
- **Owner peut favoriser sa propre Activité** (décision ouverte du draft tranchée à « oui », couvert par un test).
- **Réponse `POST /api/me/favorites/:activityId`** : `FavoriteDto` complet avec Activité hydratée — simplifie le client sans nécessiter un re-fetch.
- **Page `/profil` en SSR** : `getServerSideProps` fait l'auth serveur + charge les favoris ; le HOC `withAuth` est retiré de cette page seule.
- **Tests de page colocalisés interdits** : à cause de Next.js, les tests de fichiers `src/pages/**` doivent vivre sous `src/__tests__/pages/**` (et non sous `src/pages/**`). Convention à propager si d'autres tests de page sont ajoutés.
- **Gestion du cap 100 côté UI** : sur `ApiError` 400, `addFavoriteId` (dans `AuthContext`) rollback + `snackbar.error("Vous avez atteint la limite de 100 favoris.")`. Aucune nouvelle infra UI introduite.
- **Modale de vente** : composant Mantine `<SignInPromptModal>` partagé via `src/components/`. Le bouton de fermeture reçoit explicitement `aria-label="Fermer"` (Mantine par défaut n'a pas de label exposé en jsdom).

## Modèles & coûts

| Tâche | Complexité | Modèle | Effort | Escalation ? |
|---|---|---|---|---|
| T1 | trivial | (agent principal) | low | non |
| T2 | complexe | opus | high | non |
| T3 | standard | sonnet | medium | non |
| T4 | standard | sonnet | medium | non |
| T5 | standard | sonnet | medium | non |
| T6 | standard | sonnet | medium | non |
| T7 | complexe | opus | high | oui (relancée après déblocage par l'agent principal) |
| T8 | meta | (agent principal) | low | non |

## Quality gate

- `pnpm verify` (lint + typecheck) : ok
- `pnpm verify:test` (vitest unit + intégration serveur) : 297 tests / 49 fichiers, 7,5 s, ok
- `pnpm test:e2e` : 36 scénarios, ok (3 scénarios Favoris + suite préexistante intacte)
- Tests ajoutés : 53 unit/RTL (T2: 18 + T3: 15 + T4: 9 + T5: 9 + T6: 6 — soit 18 unit serveur, 15 HTTP intégration, 20 RTL) + 3 e2e
- Hooks pré-commit : ok (jamais `--no-verify`)

## Hors scope (incrément 1)

Reportés conformément au draft et au plan validé :
- **Incrément 2** : route `PATCH /api/me/favorites`, DnD sur `/profil`, optimistic reorder + rollback. Lib DnD à arbitrer (`@hello-pangea/dnd`, `dnd-kit`, ou HTML5 natif).
- **Incrément 3** : `<FavoriteToggle>` posé sur les cards Découvrir / Explorer / Mes activités, vérification que `favoriteIds` (déjà dans `AuthContext`) hydrate l'icône partout sans rechargement.
- **E2E « cap 100 atteint »** : reporté — pas critique pour le walking skeleton, peut accompagner l'incrément 2 ou 3.

## Liens

- Plan initial : `.claude/scratch/coding/favoris/increment-1/plan.md` (scratch éphémère).
- Escalation conservée : `.claude/scratch/coding/favoris/increment-1/escalations/T7.md` (détail du diagnostic Next.js build).
- Commit subject : `feat(favorites): walking skeleton for Mes favoris (mark, list, remove)` (SHA via `git log -- docs/sessions/2026-04-29-2349-favoris-increment-1.md`).
- Draft d'origine (voie A) : conservé dans `docs/features/drafts/favoris.md`, annoté en tête avec note de statut (incrément 1 livré, incréments 2 et 3 restants). Source canonique pour les futures sessions `/coding`. Le contenu intégral est aussi archivé ci-dessus dans « Cadrage d'origine » pour rendre ce rapport auto-contenu.
- ADR candidats (reportés) : Q1 (collection dédiée) et Q5 (couplage front-only via `AuthContext`) — à promouvoir via `/writing-adrs` lors d'un futur passage.
