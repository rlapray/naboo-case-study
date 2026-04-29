# Task Classification — Complexité × Modèle

## Principes

La classification a **trois objectifs** :
1. Choisir le **bon modèle** par tâche (haiku / sonnet / opus) pour optimiser coût × qualité
2. Détecter les **tâches parallélisables** (mêmes tâches indépendantes peuvent partir en background simultanément)
3. Anticiper les **escalations probables** (tâches complexes → préparer une escalation file)

**Coût d'erreur asymétrique** : sous-classer une tâche (haiku pour de la logique métier) coûte plus cher que sur-classer (sonnet pour un renommage). En cas de doute, bump à la classe supérieure.

## Tableau de référence

| Complexité | Critères détectables | Modèle | Effort |
|---|---|---|---|
| **trivial** | renommage, ajout d'export, fix typo, déplacement de fichier, snippet < 20 lignes, ajout d'un champ optionnel à un type, import à corriger | haiku | low |
| **standard** | fonction pure (validator, mapper, helper), route API CRUD simple, hook avec 1-2 effets, composant Mantine de présentation, test unitaire d'un cas évident, ajout d'un endpoint sur un service existant | sonnet | medium |
| **complexe** | logique métier non-triviale, refacto cross-fichier, design d'API (signatures à inventer), parcours e2e, résolution d'un cas limite ambigu, migration de schéma, optimisation de query | opus | high |

## Exemples concrets sur ce projet

### Trivial → haiku
- Renommer `getUserById` en `findUserById` dans tous les usages
- Ajouter un export manquant dans `src/server/services/index.ts`
- Corriger une typo dans un message d'erreur Mantine
- Déplacer un type de `src/types/user.ts` vers `src/types/auth.ts`
- Ajouter un endpoint `GET /api/healthcheck` qui retourne `{ ok: true }`

### Standard → sonnet
- Écrire un validator Zod pour le payload de création d'activité
- Ajouter une route `GET /api/activities/:id` qui appelle `activityService.findById`
- Créer un hook `useActivityFilter(activities, query)` qui applique un filtre simple
- Construire un `<ActivityCard>` qui prend une activité en prop et affiche titre + tarif + ville
- Écrire un test unit de `paginate(items, cursor)` sur 3 cas (début, milieu, fin)

### Complexe → opus
- Implémenter la pagination par curseur côté serveur (encodage du curseur, gestion des bornes, tri stable)
- Refactor du système d'auth pour passer de session à JWT (multi-fichiers, état partagé)
- Designer l'API REST pour la modération d'activités (workflow draft / pending / approved / rejected)
- Écrire un test e2e du parcours « inscription → connexion → création d'activité → publication »
- Résoudre un bug de race condition entre `useActivityFilter` et `useEffect` qui setState

## Règles de routage

1. **Tâche avec ambiguïté** (signatures floues, mocks indécis, parcours pas clair) → bump à la classe supérieure. Une escalation pour cause d'ambiguïté coûte 2× la tâche elle-même.
2. **Tâche multi-fichiers** (plus de 2 fichiers à toucher) → minimum standard, souvent complexe.
3. **Tâche sur du code legacy** ou peu testé → bump (le contexte non capturé en prompt = risque de régression).
4. **Tâche purement mécanique** (rename, déplacement) → haiku quoi qu'il arrive (pas de jugement requis).
5. **Tâche test** : la complexité de l'écriture du test suit la complexité du code testé. Test d'un validator pur → standard. Test d'un parcours e2e → complexe.

## Anti-patterns

- ❌ **Haiku-iser de la logique métier** : haiku ne tient pas la corde sur des règles métier non-triviales (off-by-one, edge cases, tri custom). Si la tâche contient le mot « gérer », « calculer », « décider » → c'est au moins sonnet.
- ❌ **Opus-iser un fix typo** : gaspillage. Garde opus pour les tâches où le jugement et la cohérence cross-fichier importent.
- ❌ **Classifier sans avoir lu le brief de la feature** : la complexité dépend du contexte (un même endpoint REST est trivial sur un service existant, complexe si le service n'existe pas).
- ❌ **Ignorer les signaux d'ambiguïté** : si tu te dis « je ne sais pas trop quelle signature », c'est qu'il faut bump (ou faire grill-me d'abord).
- ❌ **Classifier au feeling sans table** : utilise les critères ci-dessus, pas l'intuition.

## Détection des tâches parallélisables

Deux tâches peuvent partir en parallèle si **et seulement si** :
- Pas de dépendance déclarée entre elles (T2 ne référence pas T1 dans `Dépend de`)
- Pas de modification du même fichier
- Pas de dépendance implicite via un type partagé qui doit être créé par l'autre tâche

Exemples :
- ✅ T2 = « ajoute le validator Zod pour activity » et T3 = « ajoute le validator Zod pour user » → parallélisables (fichiers distincts, pas de couplage)
- ❌ T2 = « ajoute le service `activityService.findById` » et T3 = « ajoute la route `GET /api/activities/:id` qui appelle `activityService.findById` » → séquentiel (T3 dépend de T2)

## Quand surclasser pour de bon

Si une tâche standard escalade au cours de l'exécution (le sous-agent écrit dans `escalations/`), à la relance :
- Bump le modèle d'un cran (sonnet → opus)
- Augmente le contexte (passe le brief complet, pas juste la signature)
- Garde le contexte de l'escalation précédente pour ne pas refaire les mêmes essais
