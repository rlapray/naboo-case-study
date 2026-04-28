---
name: writing-adrs
description: >-
  Rédige et améliore des Architecture Decision Records (ADR). À utiliser
  quand l'utilisateur veut créer un nouvel ADR, améliorer un ADR existant,
  ou auditer la qualité des ADRs du projet.
argument-hint: "[new | docs/architecture/adr/NNN-*.md | audit]"
user-invocable: true
---

# Skill : Writing ADRs

## Template

Les ADRs du projet suivent un template MADR enrichi (fusion Nygard + MADR). Le template de référence est dans `references/adr-template.md`.

### Structure obligatoire

```
# ADR-NNN : Titre

**Statut** : Proposé | Accepté | Déprécié | Remplacé par ADR-XXX
**Date** : YYYY-MM-DD
**Dernière revue** : YYYY-MM-DD
**Auteur** : Prénom Nom

## Contexte
## Critères de décision
## Options envisagées
## Décision
## Conséquences
## ADRs liés
```

## Règles de rédaction

1. **Langue** : français, sauf termes techniques (noms de libs, patterns, etc.)
2. **1 décision = 1 ADR** : ne pas mélanger plusieurs décisions dans un même ADR
3. **Critères de décision** : lister les exigences qui guident le choix (3-6 critères)
4. **Options** : chaque option a une description + **Avantages** et **Inconvénients** en bullet points
5. **Décision** : choix + justification courte style Y-statement ("Nous choisissons X parce que Y")
6. **Conséquences négatives obligatoires** : ne pas lister que le positif, séparer en Positives / Négatives
7. **ADRs liés** : toujours lister les dépendances croisées entre ADRs
8. **Statuts** : Proposé → Accepté → Déprécié → Remplacé par ADR-XXX

## Modes d'utilisation

### Mode `new` — Créer un nouvel ADR

1. Lire le template dans `references/adr-template.md`
2. Déterminer le prochain numéro d'ADR en listant `docs/architecture/adr/`
3. Demander à l'utilisateur le sujet de la décision si non précisé
4. Rédiger l'ADR en suivant le template et les règles ci-dessus
5. Écrire le fichier dans `docs/architecture/adr/NNN-slug.md`

### Mode fichier — Améliorer un ADR existant

1. Lire l'ADR cible
2. Vérifier la conformité avec le template (sections manquantes, structure)
3. Enrichir : ajouter critères de décision, pros/cons par option, conséquences négatives, liens croisés
4. Conserver le contenu existant, ne pas supprimer d'information
5. Réécrire le fichier amélioré

### Mode `audit` — Vérifier la qualité des ADRs

Parcourir tous les fichiers dans `docs/architecture/adr/` et vérifier pour chaque ADR :

- [ ] Métadonnées complètes (Statut, Date, Dernière revue, Auteur)
- [ ] Section "Critères de décision" présente et avec 3+ critères
- [ ] Section "Options envisagées" avec pros/cons pour chaque option
- [ ] Section "Décision" avec justification (pas juste "Utiliser X")
- [ ] Section "Conséquences" séparée en positives et négatives
- [ ] Section "ADRs liés" présente (même si vide : "Aucun")
- [ ] Pas de mélange de décisions dans un seul ADR

Produire un rapport avec le statut de conformité de chaque ADR.
