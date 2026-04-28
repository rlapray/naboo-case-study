# Guide d'interprétation — auditing-codebase-history

Heuristiques pour passer de la sortie brute des 5 commandes à une synthèse utile.

## Lecture du churn

### Seuils empiriques

Sur un repo actif (équipe de 5+ personnes, 1 an d'historique) :
- **>200 modifications/an** sur un fichier : zone chaude, à inspecter
- **>500 modifications/an** : très probablement un God Object ou un fichier de routes/config qui agrège tout
- **>1000 modifications/an** : presque toujours un fichier généré ou un lockfile

### Exclusions usuelles à filtrer mentalement

Avant d'interpréter le top-20, ignorer :
- Lockfiles : `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, `poetry.lock`, `Cargo.lock`
- Migrations : `db/migrate/*`, `migrations/*`, `prisma/migrations/*`
- Snapshots : `__snapshots__/*`, `*.snap`
- Fichiers générés : `*.generated.*`, fichiers protobuf compilés, types auto-générés
- Documentation versionnée : `CHANGELOG.md`

### Ce que la position en tête signifie

- **#1 fichier source réel** : c'est le candidat numéro 1 à inspecter. Si on demande "par où commencer", c'est par là.
- **Top 5 dominé par un même répertoire** : ce répertoire concentre l'activité du projet. Bonne lecture initiale.
- **Top 20 éclaté sur tous les répertoires** : codebase sans hotspot clair, équipe qui touche à tout. Plus rare.

## Bus factor — seuils

À partir du `git shortlog -sn --no-merges` total :
- **Top contributeur >60 %** : bus factor critique. Si cette personne part, le projet est en danger.
- **Top contributeur 30-60 %** : bus factor préoccupant mais pas alarmant.
- **Top contributeur <30 %** avec >5 contributeurs significatifs : équipe saine.

À partir de la fenêtre 6 mois :
- **<3 contributeurs actifs** : projet maintenu par une équipe squelettique. Risque sur la continuité.
- **Top contributeur historique absent** : les bâtisseurs ne sont plus là. La connaissance s'érode.
- **Nouveaux contributeurs en tête** : projet en transmission de maintenance. Vérifier la documentation.

### Caveat squash-merge

Si l'équipe utilise systématiquement le squash-merge, le `shortlog` reflète **qui a mergé**, pas **qui a écrit**. Symptômes typiques :
- Concentration extrême sur 1-2 personnes (les mainteneurs qui mergent les PR)
- Très peu de commits par PR (un par PR)
- Messages de commit standardisés (titre de PR)

Dans ce cas, l'analyse bus factor par shortlog est trompeuse. Demander à l'utilisateur la stratégie de merge avant de conclure.

## Vélocité — formes typiques

### Patterns sains
- **Rythme stable** : ~N commits/mois sur 12 mois, avec variation <30 %. Équipe régulière, pas de crise.
- **Croissance lente** : pente positive sur 6+ mois. Équipe qui grandit ou montée en puissance d'une initiative.

### Patterns inquiétants
- **Chute brutale** (-50 % en 1-2 mois) : presque toujours un départ. Demander à l'utilisateur ce qui s'est passé à cette date.
- **Pente déclinante sur 6-12 mois** : perte de momentum. Équipe qui se réduit, ou projet en fin de vie.
- **Pics suivis de longs creux** : livraisons batchées en releases. Symptôme d'absence de CI/CD continu, ou de cycles de release lents.
- **Mois à zéro** dans un projet supposé actif : freeze, gel des features, ou projet abandonné silencieusement.

### Cas limites
- **Repo de <3 mois** : la commande de vélocité est peu informative. Mentionner que les données sont insuffisantes.
- **Spike massif sur le dernier mois** : souvent une migration de repo (import de l'ancien historique en bloc) ou une release majeure.

## Reverts et hotfixes — seuils

Calculer le ratio `reverts_count / total_commits` :
- **<1 %** : excellent. Process de validation solide.
- **1-3 %** : normal. Quelques accidents par an, c'est humain.
- **3-5 %** : signal jaune. Le pipeline mérite attention.
- **>5 %** : signal rouge. Process CI/CD fragile : tests peu fiables, staging absent, ou rollback plus compliqué qu'un nouveau déploiement.

### Cas particuliers
- **Zéro revert sur 1 an** : soit l'équipe est exceptionnelle, soit personne ne nomme ses commits "Revert". Vérifier en regardant `git log --grep="revert\|rollback\|undo"` (insensible casse).
- **Hotfixes nommés mais pas de reverts** : équipe qui corrige par patch plutôt que par retour arrière. Pas mauvais en soi.
- **Spike de reverts sur 1 mois** : incident majeur ou changement de pipeline. Demander.

## Patterns de hotspots

Une fois les 5 commandes croisées, classer les hotspots dans une de ces catégories :

### God Object
**Symptômes** : un fichier source de domaine (`UserService`, `OrderController`) en tête de churn ET de bugs.
**Diagnostic** : trop de responsabilités. Refactor par extraction de classes/modules.

### Hub de routes/config
**Symptômes** : un `routes.rb`, `app.tsx`, `urls.py`, `Module.kt` en tête du churn mais pas du bug list.
**Diagnostic** : haut churn naturel (chaque feature ajoute une route). Pas un risque, juste un point d'entrée fréquent.

### Couche d'intégration fragile
**Symptômes** : un fichier qui parle à un service externe (API client, webhook handler) en tête des bugs.
**Diagnostic** : surface d'erreur exposée à l'extérieur (réseau, formats qui changent). Investir dans tests d'intégration et observabilité plutôt qu'en réécriture.

### Code de migration / legacy bridge
**Symptômes** : fichier au nom suggérant une transition (`v2_compat.py`, `legacy_adapter.ts`) avec churn modéré et bugs élevés.
**Diagnostic** : code qu'on ne veut plus toucher mais qu'on doit patcher. Prioriser la fin de migration.

## Étapes suivantes après l'audit

Une fois la synthèse produite, recommander concrètement à l'utilisateur :

1. **Lire les hotspots** identifiés (intersection churn × bugs) — pas tout le code, juste ces 2-3 fichiers
2. **Vérifier la couverture de tests** sur ces hotspots (`grep -c "test\|spec" path/to/hotspot` ou regarder le rapport de couverture si présent)
3. **Parler aux mainteneurs** identifiés dans le shortlog — surtout si le top contributeur 6 mois diffère du top contributeur historique
4. **Vérifier la doc** pour les zones de transition repérées (legacy bridges, migrations en cours)
5. **Examiner le pipeline CI** si le ratio reverts est élevé (regarder `.github/workflows/`, `.gitlab-ci.yml`, etc.)

## Source

Skill basé sur l'article de Tom Piechowski : *"The Git Commands I Run Before Reading Any Code"* (piechowski.io). L'étude Microsoft Research 2005 citée dans l'article confirme que les métriques de churn prédisent les défauts plus fiablement que les métriques de complexité seules.
