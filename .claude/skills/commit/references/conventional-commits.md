# Conventional Commits v1.0.0

Spécification : https://www.conventionalcommits.org/en/v1.0.0/

## Format

```
<type>[(scope)][!]: <description>

[body]

[footer(s)]
```

## Types

| Type       | Description                              | SemVer  |
|------------|------------------------------------------|---------|
| `feat`     | Nouvelle fonctionnalité                  | MINOR   |
| `fix`      | Correction de bug                        | PATCH   |
| `refactor` | Restructuration sans changement externe  | PATCH   |
| `perf`     | Amélioration de performance              | PATCH   |
| `style`    | Formatage (pas de changement de logique) | —       |
| `test`     | Ajout ou correction de tests             | —       |
| `docs`     | Documentation uniquement                 | —       |
| `build`    | Build, dépendances (go.mod, Taskfile)    | —       |
| `ci`       | Configuration CI/CD                      | —       |
| `chore`    | Maintenance, tâches sans impact prod     | —       |

## Breaking Changes

Deux notations possibles (combinables) :

1. `!` après le type/scope : `feat(api)!: remove v1 endpoints`
2. Footer `BREAKING CHANGE:` dans le message :
   ```
   feat(api): redesign authentication flow

   BREAKING CHANGE: the /auth/token endpoint now requires client_id
   ```

Un breaking change → bump **MAJOR** en SemVer.

## Footers

Format `token: value` ou `token #value` :

```
Closes #42
Refs #123, #456
BREAKING CHANGE: description of the change
Co-Authored-By: Name <email>
```

## Exemples

### Simple
```
feat: add user preferences page
```

### Avec scope
```
fix(parser): handle empty frontmatter gracefully
```

### Breaking change
```
feat(api)!: remove deprecated /v1/stories endpoint

BREAKING CHANGE: clients must migrate to /v2/stories before March 2026.

Closes #89
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Avec corps explicatif
```
refactor(server): extract middleware into dedicated package

The server.go file had grown to 500+ lines with middleware mixed
into route handlers. Extracting middleware improves testability
and makes the request pipeline explicit.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
