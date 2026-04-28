---
name: commit
description: >-
  Crée des commits Git conformes aux Conventional Commits et aux meilleures
  pratiques. À utiliser quand l'utilisateur veut committer, créer un commit,
  ou demande un message de commit.
argument-hint: "[message optionnel ou instruction]"
user-invocable: true
model: sonnet
---

# Skill : Commit

Analyse les changements Git, propose un commit conforme aux Conventional Commits, attend la validation utilisateur, puis exécute.

## Instructions

### 1. Analyser les changements

Exécuter en parallèle :
- `git status` — fichiers modifiés/non trackés
- `git diff` — contenu des modifications non stagées
- `git diff --staged` — contenu des modifications stagées
- `git log --oneline -5` — style des commits récents du repo

### 2. Proposer un commit

En respectant les règles des références :
- Format Conventional Commits : `<type>[(scope)][!]: <description>`
- Sujet ≤ 50 caractères, mode impératif, pas de point final
- Corps si nécessaire (pourquoi, pas comment), wrappé à 72 caractères
- Breaking changes → `!` et/ou footer `BREAKING CHANGE:`
- Alertes si : fichiers sensibles (.env, credentials), commits non atomiques

Préparer la commande complète avec heredoc :

```
git add <fichiers> && git commit -m "$(cat <<'EOF'
<message complet>
EOF
)"
```

### 3. Présenter à l'utilisateur et attendre confirmation

**OBLIGATOIRE** : présenter la proposition et **attendre confirmation explicite** avant d'exécuter quoi que ce soit.

Afficher :
- La liste des fichiers qui seront commités
- Le message de commit proposé
- Les alertes éventuelles (fichiers sensibles, atomicité, breaking changes)

### 4. Exécuter après validation

**Seulement** après confirmation de l'utilisateur :
- Exécuter la commande `git add` + `git commit`
- Vérifier avec `git status` que le commit a réussi

Si l'utilisateur demande des modifications → ajuster le message et re-présenter.

### 5. Gestion des erreurs

- **Pre-commit hook échoue** → corriger le problème, re-stage, créer un **nouveau** commit. Ne **jamais** `--amend`.
- **Ne jamais** utiliser `--no-verify` ou `--no-gpg-sign` sauf demande explicite.
- **Ne jamais** push sauf demande explicite.
