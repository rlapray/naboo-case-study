# Commit Message Rules

Sources :
- Chris Beams — https://cbea.ms/git-commit/
- Atomic Commits — https://dev.to/paulinevos/atomic-commits-will-help-you-git-legit-35i7

## Les 7 règles de Chris Beams

### 1. Séparer le sujet du corps par une ligne vide

```
feat(parser): add YAML frontmatter support

Parse the YAML block between --- delimiters at the start of story
files. Extract metadata fields into the Story struct.
```

### 2. Limiter le sujet à 50 caractères

- Oblige à être concis
- GitHub tronque au-delà de 72 caractères

### 3. Capitaliser le sujet

- `feat: Add user search` (bon)
- `feat: add user search` (acceptable avec Conventional Commits — la majuscule porte sur la description après le type)

Note : avec Conventional Commits, le type est en minuscule. La majuscule s'applique au premier mot de la description.

### 4. Ne pas terminer le sujet par un point

- `fix: Resolve null pointer in handler` (bon)
- `fix: Resolve null pointer in handler.` (mauvais)

### 5. Utiliser le mode impératif dans le sujet

Le test : "If applied, this commit will **_[sujet]_**"

| Bon                        | Mauvais                     |
|----------------------------|-----------------------------|
| Add validation for email   | Added validation for email  |
| Fix race condition in pool | Fixes race condition        |
| Remove deprecated API      | Removing deprecated API     |
| Update dependencies        | Updated dependencies        |

### 6. Wrapper le corps à 72 caractères

- Les outils Git n'effectuent pas de retour à la ligne automatique
- 72 caractères laisse de la marge avec l'indentation de `git log`

### 7. Utiliser le corps pour expliquer le quoi et le pourquoi, pas le comment

Le diff montre le **comment**. Le message explique :
- **Quoi** a changé (résumé haut niveau)
- **Pourquoi** ce changement est nécessaire
- **Quels effets de bord** ou impacts

```
refactor(templates): split monolithic template into components

The single template file had become difficult to navigate and test
independently. Splitting by concern (layout, sections, sidebar)
enables targeted HTMX partial rendering.
```

## Atomic Commits

Un commit = **un changement logique cohérent**.

### Principes

- Chaque commit compile et passe les tests
- Un commit peut être cherry-picked ou revert indépendamment
- Ne pas mélanger : feature + refactor, fix + style, test + implementation

### Granularité

- **Trop gros** : "implement entire feature" → difficile à review, impossible à bisect
- **Trop petit** : "fix typo" suivi de "fix another typo" → bruit dans l'historique
- **Juste bien** : un changement logique complet avec ses tests
