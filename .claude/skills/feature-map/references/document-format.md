# Format des documents — feature-map

## Règles transverses

- **« PO quality, dev consumption »** : prose métier sans jargon technique, mais le doc
  reste dans le repo en Markdown — la colonne `Surface` (back/front/both) et les refs
  techniques discrètes en section `Zones non cartographiées` sont autorisées.
- **Vocabulaire** : uniquement les termes du glossaire `docs/UBIQUITOUS_LANGUAGE.md`.
- **Langue** : celle du fichier `docs/UBIQUITOUS_LANGUAGE.md`.
- **Bannière obligatoire** en tête de chaque fichier généré :
  `> Snapshot du YYYY-MM-DD — régénérer si > 3 mois`
- **Granularité** : un use case métier autonome = acteur + action + résultat — en dessous,
  c'est de l'implémentation.
- **Exhaustivité** : un domaine déclaré est cartographié à 100 % dans son fichier. Les
  zones non rattachées vont dans la section interne `Zones non cartographiées` du
  `FEATURES.md` racine **uniquement**.
- **Pas de chemins de fichiers** dans la prose métier ; tolérés uniquement dans la section
  `Zones non cartographiées` (pour permettre au dev/auditeur d'investiguer).

---

## FEATURES.md (document racine)

```markdown
# Feature Map — [Nom du projet]

> Snapshot du YYYY-MM-DD — régénérer si > 3 mois

> [Phrase de présentation du produit en termes métier — 1 ligne]

## Domaines

```mindmap
root[Nom du projet]
  [Domaine A]
    [Sous-domaine A1]
    [Sous-domaine A2]
  [Domaine B]
  [Domaine C]
    [Sous-domaine C1]
```

## Périmètre

| Domaine | Description | Sous-document |
|---------|-------------|---------------|
| [Domaine A] | [Une phrase métier] | [FEATURES.DOMAINEA.md] |
| [Domaine B] | [Une phrase métier] | [FEATURES.DOMAINEB.md] |

## Relations entre domaines

> Décrire ici les dépendances et overlaps notables (1-3 lignes max).
> Omettre si tous les domaines sont indépendants.

## Zones non cartographiées

> Présente uniquement si certaines parties de la codebase n'ont pas pu être rattachées
> à un domaine métier avec suffisamment de certitude. Section **interne au FEATURES.md
> racine uniquement** — interdite dans les sous-fichiers de domaine.

| Chemin | Surface | Raison de l'incertitude |
|--------|---------|------------------------|
| [path/to/module] | [~X fichiers] | [ex: nomenclature purement technique] |

Pistes de résolution suggérées :
- [ ] Interviewer [rôle] sur [zone]
- [ ] Vérifier si [module] est un détail d'implémentation ou un domaine à part entière
```

---

## FEATURES.[DOMAINE].md (sous-document de domaine)

```markdown
# [Nom du domaine]

> Snapshot du YYYY-MM-DD — régénérer si > 3 mois

> [Phrase de présentation du domaine en termes métier — 1 ligne, vocabulaire UL]

## Vue d'ensemble

> **Inclure le `graph TD` ci-dessous uniquement si > 3 acteurs OU si des dépendances
> inter-features non triviales existent.** Sinon, omettre ce bloc et laisser le tableau
> Fonctionnalités parler seul.

```graph TD
    A[Acteur 1] -->|action| B[Feature X]
    A -->|action| C[Feature Y]
    B --> D[Résultat]
    C --> D
    E[Acteur 2] -->|action| C
```

## Fonctionnalités

> Exhaustif : toutes les features de ce domaine y figurent.

| Feature | Acteur | Résultat | Surface | Notes |
|---------|--------|----------|---------|-------|
| [Nom use case] | [Qui] | [Quoi obtient-il] | back / front / both | [Contrainte, dépendance] |

## Sous-domaines (sections internes)

> Présente uniquement si ce domaine contient des sous-domaines. Chaque sous-domaine est
> une **section H2 dans ce même fichier**, jamais un fichier séparé (pas de 3ème niveau).
```

---

## Règles de rédaction

- **Un seul niveau de sous-fichier** : `FEATURES.md` → `FEATURES.[DOMAINE].md`. Pas de
  `FEATURES.[DOMAINE].[SOUSDOMAINE].md` — les sous-domaines sont des sections internes.
- **Notes** : brèves, factuelles — pas de jugements sur la qualité du code.
- **Relations** entre domaines : décrites dans `FEATURES.md` uniquement, pas dans les
  sous-documents.
- **Diagrammes Mermaid** :
  - `mindmap` : uniquement dans `FEATURES.md` racine.
  - `graph TD` : optionnel, dans un sous-document de domaine, conditionnel (cf. règle
    ci-dessus).
  - `sequenceDiagram` : **interdit** dans la feature map (appartient à un doc d'archi
    ou de séquence, pas à une carte de périmètre).
- **Signal d'archi** : si un fichier domaine dépasse ~400 lignes ou ~20 features, c'est
  probablement un Bounded Context trop gros. Le skill le signale à l'utilisateur en
  Phase 4 mais produit le doc complet quand même — on ne tronque jamais.
