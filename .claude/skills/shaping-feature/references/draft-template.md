# Shape — <Nom de la feature>

**Statut** : Draft
**Date** : YYYY-MM-DD
**Auteur** : <git config user.name>
**Slug** : <kebab-case>

## Job (JTBD)

Quand <contexte>, en tant que <acteur>, je veux <motivation>, pour <résultat>.

## Fit

- **Bounded Context** : Catalogue / Identité / Administration (ou plusieurs)
- **Acteur** : Visiteur / Utilisateur connecté / Propriétaire / Administrateur
- **Surface** : `back` | `front` | `both`
- **Nature** : nouvelle feature | extension de `<feature existante>` (citer l'emplacement dans `FEATURES.<DOMAIN>.md`)
- **Doublons / interférences** : ...

## Critères de décision

Boussole utilisée pendant le grilling pour trancher les options. 3-6 critères, ordonnés par priorité décroissante.

- Critère 1 (ex. cohérence avec les patterns existants)
- Critère 2 (ex. simplicité d'implémentation sur ce case study)
- Critère 3 (ex. réversibilité)

## Décisions tranchées

Issues du grilling. Chaque ligne référence la question, le choix, la justification courte, et garde la trace des alternatives évaluées sous `<details>` pour audit ultérieur.

| Q# | Sujet | Choix | Justification | Alternatives évaluées |
|----|-------|-------|---------------|----------------------|
| Q1 | <sujet> | <choix> | <pourquoi en une phrase> | <details>Option B (raison du rejet), Option C (raison du rejet)</details> |

## Options écartées

Pistes envisagées pendant le cadrage **et** rejetées explicitement, pour éviter qu'elles reviennent à chaque revue.

- **<Nom de la piste>** : rejetée parce que ...

## Conséquences

### Positives

- ...

### Négatives / dette assumée

- ...

## Vocabulaire (UBIQUITOUS_LANGUAGE)

- **Aligné** : `terme1`, `terme2` (déjà dans le glossaire)
- **À ajouter** :
  - **<Terme>** — _proposition de définition courte_
- **Alias à éviter** : `aliasX` → utiliser `termeY`

## Risques UX (Nielsen)

3-4 heuristiques ciblées. Pour chacune : risque concret + parade.

- **#N — <Nom de l'heuristique>** : risque ... Parade : ...

## Contrat technique

Émerge du grilling. Sert d'input direct à l'implémentation.

- **Modèle de données** : collections, champs, index. Cite les schemas Mongoose existants à étendre/créer.
- **API** : tableau `verbe | route | effet | codes d'erreur`.
- **Couplages cross-contexts** : où le couplage est accepté, pourquoi (front-only / serveur-only), et le périmètre exact.

## Découpage

N incréments séquencés OU `1 PR suffit`. Pour chaque incrément : périmètre + critère de succès observable.

1. **Walking skeleton** — ... · _Succès :_ ...
2. **Incrément 2** — ... · _Succès :_ ...

## Tests à prévoir

Selon la pyramide du projet (CLAUDE.md). Un bullet par scénario clé.

- **Unit serveur** (Vitest + `mongodb-memory-server`) : ...
- **RTL** : ...
- **E2E Playwright** : ...

## Plan de vérification

Comment on saura que la feature marche end-to-end après implémentation.

- Commandes à lancer (`pnpm verify`, `pnpm verify:test`, `pnpm test:e2e`).
- Parcours manuel à effectuer (URL d'entrée, étapes, état attendu). Si chrome-cdp dispo sur `:3001`, citer la page et l'action.
- Métrique ou log à observer (si applicable).

## Décisions ouvertes (non bloquantes)

Ce qui peut attendre l'implémentation pour être tranché. Ne pas mettre ici les décisions structurantes — celles-ci doivent être tranchées par le grilling.

- ...

## Liens

- **ADRs liés** : ...
- **Features liées** : `docs/features/FEATURES.<DOMAIN>.md` ligne <X>
- **Issues / PRs** : (si applicable)
