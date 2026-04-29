# Langage Ubiquitaire — Naboo Case Study

> Glossaire DDD prescriptif des termes métier de la plateforme. PR, code, tickets et discussions doivent utiliser ces termes. Le terme canonique reflète l'intention métier, pas l'implémentation actuelle.

## Bounded Contexts

| Bounded Context | Périmètre |
|-----------------|-----------|
| **Catalogue** | Activités, villes, recherche, navigation, mise en avant des dernières activités, pagination des listes |
| **Identité** | Inscription, connexion, déconnexion, profil de l'Utilisateur connecté |
| **Administration** | Rôle technique attribué à un Utilisateur (utilisateur standard vs administrateur) |

---

## Catalogue

| Terme | Définition | Alias à éviter |
|-------|-----------|----------------|
| **Activité** | Expérience ou prestation proposée sur la plateforme par un Propriétaire, immédiatement visible à la création. | activity, prestation, offre, annonce |
| **Propriétaire** | Utilisateur qui a créé une Activité et en est responsable ; vu depuis le Catalogue, il n'expose que prénom et nom. | owner, créateur, auteur, host |
| **Tarif journalier** | Montant en euros demandé par le Propriétaire pour une journée d'Activité. | prix, price, coût, daily rate |
| **Ville** | Localisation géographique d'une Activité, utilisée comme critère de filtrage et axe de navigation. | city, commune, lieu |
| **Découvrir** | Mode de recherche filtrée du Catalogue : l'Utilisateur cherche une Activité par nom, Ville ou plafond de Tarif journalier. | search, recherche, find |
| **Explorer** | Mode de navigation géographique du Catalogue : l'Utilisateur parcourt les Villes connues puis les Activités proposées dans une Ville donnée. | browse, navigation, parcourir |
| **Dernières activités** | Liste des trois Activités les plus récemment créées, mises en avant sur la page d'accueil. | latest, recent, top activities |
| **Mes activités** | Liste des Activités dont l'Utilisateur connecté est le Propriétaire. | mine, my activities |
| **Page d'activités** | Tranche ordonnée d'Activités renvoyée par une liste du Catalogue, accompagnée du Curseur de la tranche suivante quand elle existe. | batch, chunk, results page |
| **Curseur** | Repère opaque pointant sur la prochaine Page d'activités à charger ; absent quand la liste est terminée. | offset, page number, token de pagination |
| **Charger plus** | Action de l'Utilisateur qui demande la Page d'activités suivante à partir du Curseur courant. | load more, paginate, voir plus |

## Identité

| Terme | Définition | Alias à éviter |
|-------|-----------|----------------|
| **Utilisateur** | Personne inscrite sur la plateforme, identifiée par son email et capable de se connecter. | user, account, compte, membre |
| **Inscription** | Création d'un compte Utilisateur avec prénom, nom, email et mot de passe. | signUp, register, enregistrement |
| **Connexion** | Authentification d'un Utilisateur ouvrant une session sur la plateforme. | signIn, login, auth |
| **Déconnexion** | Fin de la session de l'Utilisateur connecté. | logout, signOut |
| **Profil** | Vue des informations personnelles (prénom, nom, email, rôle) de l'Utilisateur connecté. | me, account, getMe |
| **Session** | État authentifié d'un Utilisateur, matérialisé par un jeton délivré à la Connexion et invalidé à la Déconnexion. | token, JWT, access_token |

## Administration

| Terme | Définition | Alias à éviter |
|-------|-----------|----------------|
| **Rôle** | Niveau de permission attribué à un Utilisateur. | permission, droit |
| **Utilisateur standard** | Rôle par défaut donnant accès aux fonctionnalités courantes du Catalogue et de l'Identité. | user role, basique |
| **Administrateur** | Rôle accordant un accès étendu (modélisé en base, sans interface dédiée à ce jour). | admin, superuser |

---

## Relations inter-contextes

- Une **Activité** appartient au Catalogue ; son **Propriétaire** est la projection en lecture d'un **Utilisateur** du contexte Identité (prénom et nom uniquement).
- Un **Utilisateur** doit être en **Session** pour créer une **Activité** ou consulter **Mes activités**.
- Le **Rôle** (Administration) est porté par l'**Utilisateur** (Identité) mais ne change rien au cycle de vie d'une **Activité** — toutes les Activités sont visibles immédiatement, sans modération.
- La **Ville** d'une **Activité** est une chaîne libre côté **Catalogue** ; le contexte **Explorer** s'appuie en plus sur un service externe (geo.api.gouv.fr) pour suggérer des Villes existantes lors de la création.
- **Découvrir**, **Explorer** et **Mes activités** renvoient tous une **Page d'activités** ; **Dernières activités** est la seule liste du Catalogue qui n'expose ni **Curseur** ni **Charger plus** (taille fixe à trois).

## Dialogue d'exemple

> **Dev :** « Quand un **Utilisateur** crée une **Activité**, est-ce qu'elle passe par un état brouillon avant d'apparaître dans **Découvrir** ? »
> **Expert métier :** « Non, une **Activité** est immédiatement visible. Son **Propriétaire** est l'**Utilisateur** qui l'a créée. »
> **Dev :** « Sur **Découvrir** et **Explorer**, on charge tout d'un coup ? »
> **Expert métier :** « Non — on affiche une **Page d'activités** et l'Utilisateur clique sur **Charger plus** pour récupérer la suivante via le **Curseur**. Quand le Curseur est absent, il n'y a plus rien à montrer. »
> **Dev :** « Et **Dernières activités** suit la même logique ? »
> **Expert métier :** « Non, **Dernières activités** est une vitrine fixe de trois Activités, sans pagination. »
> **Dev :** « Si un **Administrateur** se connecte, voit-il un écran différent ? »
> **Expert métier :** « Pas aujourd'hui — le **Rôle** existe en base mais aucune fonctionnalité d'Administration n'est exposée dans l'UI. »

## Ambiguïtés signalées

- **Activité** est utilisée à deux niveaux dans le code : (1) l'entité métier (objet stocké, affiché, créé) et (2) le critère de recherche textuel `activity` dans **Découvrir** (filtre sur le nom). Le filtre désigne en réalité « nom de l'Activité » — à clarifier dans le code et l'UI (le placeholder `Activité` dans `Filters` renvoie en fait au nom recherché).
- **Ville** est à la fois un attribut d'**Activité** (chaîne libre persistée) et une suggestion issue d'un service externe (geo.api.gouv.fr) dans **Explorer** et le formulaire de création — ce ne sont pas les mêmes objets, ils ne sont pas synchronisés.
- **Token** apparaît côté serveur (`token` persisté sur l'**Utilisateur**) et côté client (cookie de session) — la notion canonique unique est la **Session**.
- **Curseur** et `cursor` désignent à la fois le repère renvoyé par le serveur (`nextCursor`) et celui que le client renvoie en paramètre de requête (`cursor`). Le concept est unique : un repère opaque sur la prochaine Page d'activités. Aucun « numéro de page » ni offset n'existe dans le domaine.

## Écarts code vs. langage canonique

| Terme canonique | Terme utilisé dans le code | Localisation | Statut |
|-----------------|---------------------------|--------------|--------|
| **Activité** | `Activity`, `IActivity`, `ActivityModel`, `ActivityDto` | `src/server/activities/`, `src/types/activity.ts` | Acceptable (anglais technique) |
| **Propriétaire** | `owner` | `activity.schema.ts`, `ActivityDto.owner`, `populate("owner")` | Acceptable (anglais technique) |
| **Tarif journalier** | `price` | `IActivity.price`, `ActivityDto.price`, filtre `price` | Écart : `price` ne porte pas l'unité « par jour » ; l'unité « €/j » n'existe que dans l'UI |
| **Découvrir** | `discover`, route `/discover`, paramètre `activity` du filtre | `src/pages/discover.tsx`, `findByCity` | Écart : le paramètre nommé `activity` désigne le **nom** de l'Activité recherchée, pas l'Activité elle-même |
| **Explorer** | `explorer`, route `/explorer` | `src/pages/explorer/`, page `[city].tsx` | Acceptable |
| **Dernières activités** | `findLatest`, route `/api/activities/latest` | `activity.service.ts`, `src/pages/index.tsx` | Acceptable |
| **Mes activités** | `findByUser`, route `/api/activities/mine`, page `/my-activities` | `activity.service.ts`, `src/pages/my-activities.tsx` | Écart mineur : `mine` côté API, `my-activities` côté URL, `findByUser` côté service — trois variantes pour un même concept |
| **Page d'activités** | `PaginatedResult<T>`, `PaginatedActivitiesResponse`, `{ items, nextCursor }` | `activity.service.ts`, `src/types/activity.ts` | Acceptable (anglais technique) |
| **Curseur** | `cursor` (paramètre de requête), `nextCursor` (réponse) | `useCursorPagination.ts`, `src/pages/api/activities/*.ts`, `src/types/activity.ts` | Acceptable (anglais technique) |
| **Charger plus** | `loadMore`, libellé UI « Charger plus » | `useCursorPagination.ts`, `discover.tsx`, `explorer/[city].tsx`, `my-activities.tsx` | Acceptable |
| **Utilisateur** | `User`, `IUser`, `UserModel`, `UserDto`, `PublicUserDto` | `src/server/users/`, `src/types/user.ts` | Acceptable |
| **Inscription** | `signUp` (service), `register` (route `/api/auth/register`), page `/signup` | `auth.service.ts`, `src/pages/api/auth/register.ts`, `src/pages/signup.tsx` | Écart : trois noms (`signUp`, `register`, `signup`) pour le même concept |
| **Connexion** | `signIn` (service), `login` (route `/api/auth/login`), page `/signin` | `auth.service.ts`, `src/pages/api/auth/login.ts`, `src/pages/signin.tsx` | Écart : trois noms (`signIn`, `login`, `signin`) pour le même concept |
| **Déconnexion** | `logout`, page `/logout` | `src/pages/api/auth/logout.ts`, `src/pages/logout.tsx` | Acceptable |
| **Profil** | `getMe`, route `/api/me`, page `/profil` | `src/pages/api/me.ts`, `src/pages/profil.tsx` | Écart mineur : `me` côté API, `profil` côté URL |
| **Session** | `access_token`, `token`, cookies de session, `signToken` | `src/server/auth/jwt.ts`, `cookies.ts`, `session.ts`, `IUser.token` | Écart : pas de notion explicite de **Session** ; le concept est éclaté entre un champ `token` sur l'Utilisateur et un cookie côté client |
| **Utilisateur standard** | `role: "user"` | `user.schema.ts`, `UserRole` | Acceptable |
| **Administrateur** | `role: "admin"` | `user.schema.ts`, `UserRole` | Acceptable |
| **Ville** | `city` | `IActivity.city`, `searchCity`, `findCities` | Acceptable |

*Cette section est purement informative. L'agent ne propose ni n'exécute aucun renommage. À l'utilisateur de décider.*

<!-- meta
last_run: 2026-04-29T12:00:00Z
files_scanned: 107
sha256: c52b61128d6323e7c3112eaac732aebe094d3df3d25e2e8ab185e727ed631e97
external_sources_consulted: []
notes:
  - Mise à jour incrémentale (re-run) après les commits de2129d (cursor-based pagination), 06597b6 (extract useCursorPagination) et f2527a8 (test helpers).
  - Nouveaux termes Catalogue : Page d'activités, Curseur, Charger plus — concepts surfacés dans les DTOs publics (`{ items, nextCursor }`), le hook `useCursorPagination` et l'UI (« Charger plus »).
  - Dialogue d'exemple enrichi pour couvrir la pagination, et distinction explicite avec Dernières activités (vitrine fixe sans Curseur).
  - Aucune source externe consultée : aucun terme métier sectoriel ambigu dans ce run.
-->
