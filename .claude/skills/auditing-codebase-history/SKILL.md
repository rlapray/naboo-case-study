---
name: auditing-codebase-history
description: >-
  Diagnostique un codebase via 5 commandes git (churn, contributeurs,
  clusters de bugs, vélocité, reverts) avant de lire le code. À utiliser
  quand l'utilisateur découvre un nouveau repo, fait de l'onboarding,
  demande "où sont les bugs / qui maintient ce code / par où commencer",
  veut auditer la santé d'un codebase, ou cherche les fichiers à risque.
  Croise churn × bugs pour identifier les hotspots.
user-invocable: true
---

# Auditing Codebase History — Workflow

## Quand utiliser ce skill

Avant de lire le code, l'historique git donne une image diagnostique du projet : qui l'a construit, où sont les zones à risque, si l'équipe livre avec confiance ou marche sur des œufs.

Déclencheurs typiques :
- Premier contact avec un repo (onboarding, prise en charge d'un legacy)
- Audit de santé demandé par l'utilisateur
- Question type "où sont les bugs ?", "qui a écrit ça ?", "par où commencer ?"
- Cherche-t-on les fichiers à risque avant un refactor ?

## Workflow

1. **Annoncer** en une phrase ce qui va être lancé : "Je lance les 5 commandes de diagnostic git en parallèle."
2. **Exécuter les 5 commandes en parallèle** — un seul message avec plusieurs `Bash` simultanés. Travailler dans le repo courant (`pwd` doit être un repo git).
3. **Synthétiser** — ne pas dumper l'output brut. Produire un rapport structuré :
   - Top 5 fichiers à churn élevé
   - Bus factor (top contributeur en %, nombre d'actifs récents)
   - Top 3 fichiers à bugs récurrents
   - Tendance de vélocité (croissante / stable / décroissante)
   - Fréquence des reverts/hotfixes
4. **Croiser churn × bugs** — identifier l'intersection des deux top-20. C'est la zone à risque maximal.
5. **Recommander** 2-3 fichiers à lire en priorité, avec une raison concrète pour chacun.

## Les 5 commandes

### 1. Churn — fichiers les plus modifiés sur 1 an

```bash
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -20
```

Ce que ça révèle : la haute fréquence de modification est le signal le plus fiable de drag du codebase. Le fichier en tête est souvent celui dont on dit "tout le monde a peur d'y toucher".

### 2. Contributeurs — bus factor

```bash
git shortlog -sn --no-merges
git shortlog -sn --no-merges --since="6 months ago"
```

Ce que ça révèle : si un contributeur représente >60 % des commits, le bus factor est faible. Si le top contributeur historique n'apparaît pas dans la fenêtre 6 mois, l'équipe perd ses bâtisseurs.

### 3. Clusters de bugs

```bash
git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

Ce que ça révèle : les fichiers les plus patchés. À croiser avec le churn — un fichier qui apparaît dans les deux top-20 est ton risque maximal.

### 4. Vélocité — commits par mois

```bash
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c
```

Ce que ça révèle : un rythme stable est sain. Une chute brutale = départ probable. Une pente déclinante sur 6-12 mois = équipe qui perd son momentum. Des pics suivis de creux = livraisons batchées au lieu de livraison continue.

### 5. Reverts et hotfixes

```bash
git log --oneline --grep="^Revert\|hotfix" -i | wc -l
git log --oneline | wc -l
```

Ce que ça révèle : un ratio reverts/total >5 % indique un pipeline de déploiement fragile (tests peu fiables, staging absent, rollback compliqué). Zéro résultat est aussi un signal — soit l'équipe est stable, soit personne n'écrit de messages descriptifs.

## Lecture croisée churn × bugs

La valeur ajoutée du skill, ce n'est pas chaque commande prise isolément, c'est leur croisement.

**Méthode** : prendre les 20 fichiers du top churn, les 20 fichiers du top bugs, et nommer explicitement les fichiers présents dans **les deux listes**. Ce sont des fichiers qui :
- changent souvent (haut volume de modifications)
- ET cassent souvent (haut volume de patches)

Ces fichiers absorbent un travail répétitif sans jamais être correctement réparés. Ils sont les premiers candidats à un refactor ou une réécriture. C'est aussi par eux qu'il faut commencer la lecture du code.

## Limitations à signaler

- **Squash-merge** : si l'équipe écrase chaque PR en un commit, `shortlog` reflète qui a mergé, pas qui a écrit. Demander la stratégie de merge avant de tirer des conclusions sur les contributeurs.
- **Messages de commit non descriptifs** : si tout est "update stuff", la commande bug clustering ne donnera rien. Mentionner cette limite à l'utilisateur si l'output bug est vide alors que le projet est manifestement actif.
- **Fenêtre temporelle** : `--since="1 year ago"` peut être inadapté. Pour un repo de 2 mois, l'output sera quasi identique à `git log` total. Pour un repo de 10 ans, élargir éventuellement à 2 ans pour repérer le code historiquement instable.
- **Fichiers générés** : `package-lock.json`, `yarn.lock`, fichiers de migration, snapshots de tests apparaissent souvent en tête du churn. Les filtrer mentalement avant de tirer des conclusions.

## Pour aller plus loin

Voir `references/interpretation-guide.md` pour les heuristiques détaillées : seuils empiriques de churn, lecture des courbes de vélocité, patterns de hotspots, et quoi faire après l'audit.
