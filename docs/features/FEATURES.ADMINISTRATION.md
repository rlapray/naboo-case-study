# Administration

> Snapshot du 2026-04-28 — régénérer si > 3 mois

> Domaine **dormant** : le Rôle de l'Utilisateur est modélisé en base mais aucune fonctionnalité produit ne s'appuie sur cette frontière à date.

## Périmètre déclaré

Le glossaire ubiquitaire définit deux Rôles possibles pour un Utilisateur :

- **Utilisateur** (rôle par défaut) : accès standard à la plateforme.
- **Administrateur** : accès étendu, prévu pour des opérations privilégiées.

## Fonctionnalités

> Exhaustif : aucune fonctionnalité du domaine Administration n'est exposée à date.

| Feature | Acteur | Résultat | Surface | Notes |
|---------|--------|----------|---------|-------|
| _(aucune)_ | — | — | — | Le Rôle existe sur le compte Utilisateur, mais aucune action, écran, ni contrôle d'accès ne le consomme. Un compte Administrateur est créé automatiquement au démarrage par le jeu de démo, sans privilège distinct exploité. |

## Statut

L'écart entre le modèle et le produit est assumé : le Rôle est posé en prévision d'un périmètre Administration à cadrer (modération d'Activités, gestion des Utilisateurs, mode debug, etc.), mais aucune décision produit n'a été prise à date.

Tant qu'aucune feature n'est ouverte sur ce domaine, le Rôle est sans effet observable côté Utilisateur.
