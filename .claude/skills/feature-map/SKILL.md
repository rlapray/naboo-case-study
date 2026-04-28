---
name: feature-map
description: >-
  Génère la feature map d'une codebase dans docs/features/ — un snapshot daté du périmètre
  fonctionnel, rédigé pour un PO mais consommé en pratique par des devs. Utiliser quand
  l'utilisateur veut cartographier les fonctionnalités métier, comprendre le périmètre du
  produit, ou onboarder un nouveau membre / une PO (« fais la feature map »,
  « documente les fonctionnalités »).
argument-hint: ""
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Feature Map

Tu produis une **feature map** — une carte au trésor des fonctionnalités métier de la
codebase, rédigée comme si elle était lue par un PO non-technique, mais en pratique
consommée par des devs (« PO quality, dev consumption »).

Elle est **exacte ET exhaustive à la maille d'un domaine déclaré** : toutes les features
identifiées d'un domaine y figurent intégralement. Ce qui n'a pas pu être rattaché à un
domaine va dans la section `Zones non cartographiées` du `FEATURES.md` racine — jamais
dans un sous-fichier de domaine.

C'est un **snapshot daté**, pas un document vivant. Il se régénère, il ne se met pas à
jour incrémentalement.

Contexte fourni : $ARGUMENTS

## Phase 0 — Prérequis : Langage Ubiquitaire (mode vérification)

1. Vérifie si `docs/UBIQUITOUS_LANGUAGE.md` existe.
2. **Si absent** → **stoppe immédiatement** et invite l'utilisateur :
   _« Ce skill nécessite un glossaire ubiquitaire. Lance d'abord `/ubiquitous-language`,
   puis relance `/feature-map`. »_
3. **Si présent** → lis-le et fais une vérification rapide de cohérence avec les domaines
   candidats que tu vas inférer en Phase 2.
4. **Si tu détectes des écarts substantiels** (termes manquants, contradictions,
   renommages métier non reflétés) → **stoppe** et invite :
   _« Le glossaire ubiquitaire présente des écarts substantiels avec le code actuel.
   Lance `/ubiquitous-language` pour les résoudre, puis relance `/feature-map`. »_
5. Sinon → continue à la Phase 1.

## Phase 1 — Détection de l'existant

- `docs/features/FEATURES.md` **absent** → continue à la Phase 2.
- `docs/features/FEATURES.md` **présent** :
  1. Affiche un **diff informatif** entre l'existant et ce que tu vas regénérer (résumé
     en bullets ou format `git diff` — l'objectif est d'aider l'utilisateur à repérer
     d'éventuelles annotations manuelles à reporter).
  2. Demande confirmation explicite avant écrasement.
  3. Ce n'est pas un mode merge — c'est un garde-fou anti-perte d'annotations.

Si une convention différente de `docs/features/` existe déjà dans le repo (ex:
`docs/FEATURES.md`, `features/`), utilise-la plutôt que d'en créer une nouvelle.

## Phase 2 — Analyse de la codebase

Analyse le code selon la stratégie décrite dans `references/analysis-strategy.md`.

Résume ta compréhension initiale : domaines candidats, acteurs identifiés, zones grises.

## Phase 3 — Interview métier (plafonnée)

Interroge l'utilisateur pour valider tes inférences.

**Plafond strict : 5 à 7 questions max**, regroupées par lots de 2-3 par tour. Skip
libre — l'utilisateur peut répondre « je sais pas / passe » à tout moment.

Format imposé pour chaque question :

```
**Q[n]** `[Tag]`
_Pourquoi je pose cette question_ : ...
**Question** : ...
**Ma recommandation** : ...
```

Tags : `[Domaine]`, `[Acteur]`, `[Use case]`, `[Frontière]`, `[Zone grise]`

**Critère d'arrêt** : plafond atteint OU tous les domaines candidats sans ambiguïté
restante.

Les questions non posées et les zones « passées » → section `Zones non cartographiées`
du `FEATURES.md` racine (cf. Phase 5).

## Phase 4 — Proposition de hiérarchie

Présente la hiérarchie proposée sous cette forme :

```
FEATURES.md (racine)
├── [Domaine A] → FEATURES.DOMAINEA.md
│   ├── [Sous-domaine A1] (section interne)
│   └── [Sous-domaine A2] (section interne)
└── [Domaine B] → FEATURES.DOMAINEB.md (si autonome)
```

**Critère d'éclatement en sous-fichiers : frontière de Bounded Context** (acteurs propres,
données propres, autonomie fonctionnelle), **jamais la longueur**. Pas de 3ème niveau de
fichier — un sous-domaine reste une section dans le fichier de son domaine parent.

**Signal d'archi à remonter à l'utilisateur** : si tu prévois qu'un fichier domaine
dépassera ~400 lignes ou ~20 features, signale-le explicitement :
_« Le domaine X concentre N features — c'est un signal probable que sa frontière
mériterait d'être retracée. Je produis le doc complet quand même, mais c'est un point
d'attention archi. »_

**Attends la validation explicite de l'utilisateur avant d'écrire le moindre fichier.**

## Phase 5 — Écriture

Une fois la hiérarchie validée, écris les fichiers selon le format de
`references/document-format.md`. Règles strictes :

- **Bannière obligatoire** en tête de chaque fichier généré :
  `> Snapshot du YYYY-MM-DD — régénérer si > 3 mois`
- **Vocabulaire** : uniquement les termes du glossaire `docs/UBIQUITOUS_LANGUAGE.md`.
- **Langue** : celle du fichier `docs/UBIQUITOUS_LANGUAGE.md`.
- **« PO quality, dev consumption »** : prose métier sans jargon technique, pas de
  chemins de fichiers dans le contenu narratif. Tolérés uniquement dans la section
  `Zones non cartographiées` (pour permettre au dev/auditeur d'investiguer).
- **Tableau Fonctionnalités** : inclure une colonne `Surface` avec valeur
  `back` / `front` / `both` (gestion multi-stack).
- **Section `## Zones non cartographiées`** : présente uniquement à la fin de
  `FEATURES.md` racine. **Interdite dans les sous-fichiers de domaine** — un domaine
  déclaré est exhaustif par définition.

Fichiers à produire :
- `docs/features/FEATURES.md` — vue d'ensemble avec `mindmap` Mermaid + tableau
  Périmètre + section `Zones non cartographiées` si pertinent.
- `docs/features/FEATURES.[DOMAINE].md` — un fichier par domaine autonome.

## Phase 7 — Suivi (régénération préventive)

À la fin du run, propose à l'utilisateur :

> _« Veux-tu que je `/schedule` une relance mensuelle pour garder le snapshot frais ?
> Le banner devient une alarme rouge à 3 mois ; une régénération mensuelle te laisse
> de la marge. »_

## Références

- **Workflow détaillé** : `references/workflow.md` — phases, mode vérification UL.
- **Format des documents** : `references/document-format.md` — templates Markdown.
- **Stratégie d'analyse** : `references/analysis-strategy.md` — heuristiques, frontières
  de domaine, signaux de zone grise.
