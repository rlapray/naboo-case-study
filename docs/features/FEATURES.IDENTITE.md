# Identité

> Snapshot du 2026-04-28 — régénérer si > 3 mois

> Cycle de vie du compte Utilisateur : création, ouverture et fermeture de session, consultation du Profil.

## Fonctionnalités

> Exhaustif : toutes les fonctionnalités d'Identité figurent dans ce tableau.

| Feature | Acteur | Résultat | Surface | Notes |
|---------|--------|----------|---------|-------|
| Inscription | Visiteur | Compte Utilisateur créé avec email, mot de passe, prénom et nom. Redirection vers la page de Connexion. | both | L'email doit être unique. Le mot de passe est stocké chiffré. |
| Connexion | Visiteur | Session ouverte, jeton d'authentification persisté côté client. Redirection vers le Profil. | both | Échec explicite si email ou mot de passe invalide. |
| Déconnexion | Utilisateur | Session fermée, jeton d'authentification supprimé. Redirection vers l'accueil. | both | Page `/logout` — accessible directement par URL. |
| Consulter mon Profil | Utilisateur | Vue des informations personnelles : prénom, nom, email. | both | Exige une session ouverte. |

## Notes

- Aucune fonctionnalité d'édition du Profil (changement d'email, de mot de passe, de nom) n'est exposée à date.
- L'absence de session est gérée par redirection : les pages réservées renvoient vers la Connexion, les pages d'authentification renvoient vers l'accueil si une session existe déjà.
