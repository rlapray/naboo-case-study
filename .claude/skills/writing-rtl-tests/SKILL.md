---
name: writing-rtl-tests
description: >-
  Écrit, révise et débogue des tests de composants React via React Testing
  Library (RTL + jsdom + Vitest). À utiliser quand l'utilisateur demande
  « écris un test RTL », « ajoute un test composant », « test pour ce
  composant », ou édite un fichier `*.test.tsx` situé dans `src/components/`
  ou `src/pages/` (hors `src/pages/api/`). Ne pas utiliser pour les hooks
  isolés (skill `writing-unit-tests`, via `renderHook`) ni pour les parcours
  utilisateur multi-pages (skill `e2e-test`).
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
---

# writing-rtl-tests

## But

Combler le niveau **component test** dans la pyramide projet : un composant React rendu dans jsdom, mocks à la frontière HTTP uniquement, asserts sur le DOM observable comme un utilisateur. Plus rapide qu'un Playwright, plus représentatif qu'un test de hook isolé.

Place dans la pyramide projet :

```
        /\
       /e2\         ← parcours critiques (skill `e2e-test`)
      /----\
     / comp \       ← ce skill : composant React (RTL + jsdom)
    /--------\
   / serveur  \     ← intégration serveur (mongodb-memory-server)
  /------------\
 /     unit     \   ← fonctions pures + hooks (`renderHook`)
/----------------\
```

## Réutilisation par référence

Les principes universels (FIRST, AAA, 4 piliers de Khorikov, DAMP > DRY, classical vs London) sont définis dans `.claude/skills/writing-unit-tests/references/principles.md` — **lire ce fichier en premier** si non déjà chargé. Ce skill n'ajoute que ce qui est spécifique au niveau component RTL.

## Workflow

1. **Identifier le SUT** : un composant React, sa frontière publique = ses props + le DOM rendu + les services externes qu'il appelle.
2. **Identifier les frontières à mocker** :
   - `vi.mock("@/services/api")` pour tout appel REST projet.
   - `vi.spyOn(global, "fetch")` (ou `vi.stubGlobal`) pour tout fetch tiers (geo.api.gouv.fr).
   - `vi.mock("next/router")` ou `vi.mock("next/navigation")` si le composant navigue.
   - **Ne jamais mocker** : `useForm` Mantine, hooks internes (`useAuth`, `useDebounced`...), composants enfants — sauf si trivialement délégué et hors périmètre du test.
3. **Wrapper minimal** : utiliser `renderWithProviders` depuis `src/test-utils/renderWithProviders.tsx` (Mantine + AuthContext + SnackbarContext, valeurs overridables via `auth: { user, handleSignin }`, `snackbar: { error }`).
4. **Setup `userEvent` v14** dans chaque test :
   ```ts
   const user = userEvent.setup();
   ```
   Voir `references/user-event-patterns.md`.
5. **Écrire l'AAA** (Arrange / Act / Assert) avec :
   - Queries selon la priorité officielle (`getByRole` >> `getByTestId`). Voir `references/queries-priority.md`.
   - Asserts via matchers `@testing-library/jest-dom` (`toBeDisabled`, `toBeInTheDocument`, `toHaveValue`).
   - `await screen.findBy*` pour l'async, jamais `await waitFor(() => screen.getBy*())`.
6. **Vérifier les pièges Mantine** (portals, Select, Modal) — voir `references/mantine-tips.md`.
7. **Lancer la suite** : `pnpm verify:test`. Si lint/types touchés : `pnpm verify`.
8. **Vérifier l'absence de flake** : `pnpm vitest run <fichier> --repeat-each=10`.

## Règles dures

Les 15 anti-patterns Kent C. Dodds + docs officielles, applicables sans exception. Détail dans `references/common-pitfalls.md`.

| # | Règle | Source |
|---|---|---|
| 1 | Priorité queries : `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByDisplayValue` > `getByAltText` > `getByTitle` >> `getByTestId`. **Jamais** `container.querySelector`. | testing-library.com — *About Queries* |
| 2 | `userEvent.setup()` v14 obligatoire. **Jamais** `fireEvent`. Toutes les interactions sont `await`. | testing-library.com — *user-event intro* |
| 3 | Matchers `@testing-library/jest-dom` : `toBeDisabled()`, `toBeInTheDocument()`, `toHaveValue()`. **Jamais** `expect(button.disabled).toBe(true)`. | Kent C. Dodds — *Common Mistakes* §5 |
| 4 | `screen` partout. Ne pas déstructurer les queries du retour de `render`. | Kent C. Dodds — §4 |
| 5 | `await screen.findBy*` pour l'async. **Jamais** `await waitFor(() => screen.getBy*())`. | Kent C. Dodds — §11 |
| 6 | `waitFor` : une seule assertion par callback, pas de side-effect dedans. | Kent C. Dodds — §13–14 |
| 7 | `queryBy*` uniquement pour asserter l'**absence**. | Kent C. Dodds — §10 |
| 8 | Pas de `cleanup` manuel (auto). | Kent C. Dodds — §3 |
| 9 | Pas de `wrapper` comme nom de variable ; rien ou `view`. | Kent C. Dodds — §2 |
| 10 | Pas de `act()` autour de `render` ou `userEvent` (déjà wrappés). | Kent C. Dodds — §6 |
| 11 | `eslint-plugin-testing-library` + `eslint-plugin-jest-dom` recommandés. | Kent C. Dodds — §1 |
| 12 | Mocks à la frontière HTTP uniquement. **Jamais** mocker `useForm`, hooks internes, composants enfants. | Kent C. Dodds — *Testing Implementation Details* |
| 13 | Helper projet `src/test-utils/renderWithProviders.tsx` obligatoire. | Convention projet |
| 14 | Fake timers pour `useDebounced` : `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(N)`. Restaurer en `afterEach` avec `vi.useRealTimers()`. | Convention projet |
| 15 | Pièges Mantine : portals → `findBy*` sur `screen` (scanne `document.body`). Composants overlay (Modal, Select) testables via leur `role` (`combobox`, `dialog`). | `references/mantine-tips.md` |

## Avant de rendre la main

- [ ] Le test échoue si je casse le comportement observable (vérifié en supprimant 1 ligne du composant).
- [ ] Le test passe encore si je renomme une variable interne du composant.
- [ ] Aucune assertion ne lit du state interne, aucune `getByTestId` non justifiée.
- [ ] `pnpm verify` vert (lint + typecheck).
- [ ] `pnpm verify:test` vert.
- [ ] 10 runs consécutifs verts (`pnpm vitest run <fichier> --repeat-each=10`).

## Références projet

Modèles déjà au vert dans le repo, à imiter pour les patterns transverses :

- `src/hooks/useCreateActivity.test.ts` — modèle `vi.mock("@/services/api")`.
- `src/hooks/useDebounced.test.ts` — modèle fake timers.
- `src/contexts/authContext.test.tsx` — modèle `vi.mock("next/router")`.
- `src/components/PageTitle/PageTitle.test.tsx` — premier test composant projet.

## Références internes

- `references/canonical-sources.md` — liens autoritatives (Kent C. Dodds, testing-library.com).
- `references/queries-priority.md` — détail de la priorité, exemples concrets.
- `references/user-event-patterns.md` — setup v14, async, snippets.
- `references/common-pitfalls.md` — les 15 anti-patterns avec correction.
- `references/mantine-tips.md` — portals, Select, Modal, useForm.
