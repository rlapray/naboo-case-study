# Langage Ubiquitaire — Naboo Case Study

> Glossaire DDD des termes métier de la plateforme. Tout le code, les PR, et les discussions doivent utiliser ces termes.

---

## Bounded Contexts

| Bounded Context | Périmètre |
|-----------------|-----------|
| **Catalogue** | Activités, villes, recherche, filtrage, publication |
| **Identité** | Inscription, connexion, déconnexion, profil utilisateur |
| **Administration** | Rôles et permissions techniques (admin vs utilisateur) |

---

## Catalogue

### Activité
**Définition** : Expérience ou prestation proposée sur la plateforme, créée par un Propriétaire.  
**Attributs** : nom, ville, description, tarif journalier, date de création, propriétaire.  
**Code** : `Activity` (GraphQL schema, NestJS entity)  
**Règle** : Une activité est créée directement et immédiatement visible — il n'existe pas d'état brouillon ou archivé.

### Propriétaire
**Définition** : Utilisateur qui a créé une activité et en est responsable.  
**Code** : `Owner` / `OwnerFragment` (GraphQL), champ `owner` sur `Activity`  
**Note** : Le Propriétaire est un Utilisateur vu depuis le Bounded Context Catalogue — il n'expose que `firstName`, `lastName`.

### Tarif journalier
**Définition** : Montant en euros demandé par le Propriétaire pour une journée d'activité.  
**Code** : champ `price` sur `Activity`, affiché "€/j" dans l'UI  
**Unité** : euros par jour (€/j)

### Découvrir
**Définition** : Mode de recherche filtrée dans le catalogue — l'Utilisateur cherche une activité précise par nom, ville ou fourchette de tarif.  
**Code** : page `/discover`, query `activities` avec filtres `city`, `price`, `activity`

### Explorer
**Définition** : Mode de navigation géographique dans le catalogue — l'Utilisateur parcourt les villes disponibles pour voir les activités proposées près de chez lui.  
**Code** : page `/explorer`, API `geo.api.gouv.fr` pour `searchCity`

### Ville
**Définition** : Localisation géographique d'une activité, utilisée comme critère de filtrage et de navigation.  
**Code** : champ `city` sur `Activity`, service externe `geo.api.gouv.fr`

---

## Identité

### Utilisateur
**Définition** : Personne inscrite et connectée à la plateforme.  
**Attributs** : prénom, nom, email, mot de passe, rôle.  
**Code** : `User` (NestJS entity, GraphQL type), retourné par `useAuth` côté front

### Inscription
**Définition** : Action par laquelle une personne crée un compte Utilisateur sur la plateforme.  
**Code** : mutation `signUp` (GraphQL), `register` (NestJS AuthService), page `/signup`

### Connexion
**Définition** : Action par laquelle un Utilisateur s'authentifie pour accéder à la plateforme.  
**Code** : mutation `signIn` (GraphQL), `login` (NestJS AuthService), page `/signin`  
**Résultat** : délivrance d'un `access_token` (JWT) persisté côté client

### Déconnexion
**Définition** : Action par laquelle un Utilisateur met fin à sa session.  
**Code** : mutation `logout` (GraphQL), page `/logout`

### Profil
**Définition** : Vue des informations personnelles de l'Utilisateur connecté.  
**Code** : query `getMe` (NestJS `MeModule`), page `/profil`

---

## Administration

### Rôle
**Définition** : Niveau de permission technique attribué à un Utilisateur.  
**Valeurs** : `utilisateur` (accès standard) | `administrateur` (accès étendu)  
**Code** : champ `role: 'user' | 'admin'` sur `User`  
**Note** : Le rôle `administrateur` est modélisé en base mais n'expose pas encore d'interface dédiée dans l'UI.

---

## Correspondances code ↔ glossaire

| Terme du code | Terme du glossaire |
|---------------|-------------------|
| `Activity` | Activité |
| `Owner` / `OwnerFragment` | Propriétaire |
| `price` | Tarif journalier |
| `User` | Utilisateur |
| `signIn` / `login` | Connexion |
| `signUp` / `register` | Inscription |
| `logout` | Déconnexion |
| `getMe` | Profil |
| `discover` | Découvrir |
| `explorer` | Explorer |
| `role: 'admin'` | Administrateur |
| `city` | Ville |
