---
name: writing-unit-tests
description: >-
  Écrit, révise et débogue des tests unitaires (fonctions pures, hooks via
  `renderHook`) et d'intégration serveur (Next.js API routes + Mongoose) en
  appliquant les meilleures pratiques (FIRST, AAA, 4 piliers de Khorikov,
  DAMP > DRY). À utiliser quand l'utilisateur demande « écris un test »,
  « ajoute un test pour ce hook / service / fonction », « pourquoi ce test
  flake », « refacto ces tests », ou édite un fichier `*.test.ts` hors
  `e2e/`. **Ne pas utiliser** pour : tests de composants React (déléguer au
  skill `writing-rtl-tests`), tests end-to-end Playwright (skill `e2e-test`).
---

# writing-unit-tests

## But

Garantir que chaque test ajouté dans `src/**/*.test.ts(x)` :

- vérifie un **comportement observable** (pas un détail d'implémentation),
- est **rapide, isolé, déterministe**,
- **résiste au refactoring** (renommer une variable interne ne doit pas le casser),
- est **lisible seul** (DAMP — Descriptive And Meaningful Phrases — l'emporte sur DRY).

## Workflow

1. **Identifier le SUT (System Under Test) et sa frontière publique.** Liste ce qui est observable depuis l'extérieur : valeur de retour, état exposé, effet visible (DOM, DB, HTTP). Tout le reste = détail d'implémentation, ne pas tester.
2. **Choisir le niveau de test** (voir `references/stack-cheatsheet.md`) :
   - Fonction pure / utilitaire → test unitaire pur.
   - Hook React → `@testing-library/react` (`renderHook`).
   - **Composant React → skill `writing-rtl-tests`** (à invoquer, ne pas faire ici).
   - Service serveur, route API, modèle Mongoose → intégration avec `mongodb-memory-server` via les helpers `src/server/__tests__/helpers/`.
3. **Structurer chaque `it` en AAA** : `// Arrange` (setup explicite), `// Act` (UNE action), `// Assert` (vérifie le comportement attendu).
4. **Nommer en phrase métier.** `it("appends fetched items and advances the cursor")`, jamais `it("works")` ni `it("test 1")`. Forme : `it("<verb>s <object> when <condition>")`.
5. **Mocker uniquement ce que tu possèdes**, et seulement aux frontières (HTTP sortant, horloge, randomness). Préférer les vrais collaborateurs ou un fake en mémoire. Voir `references/patterns-and-antipatterns.md`.
6. **Réutiliser les helpers existants** plutôt que recréer :
   - `src/server/__tests__/helpers/test-db.ts` → `startTestDb`, `stopTestDb`, `clearTestDb`.
   - `src/server/__tests__/helpers/mock-http.ts` → `callHandler`, `extractCookie`.
7. **Lancer la suite** : `pnpm verify:test`. Si lint/types touchés : `pnpm verify`. Ne jamais utiliser `--no-verify`.

## Règles dures

- **Tester le comportement, pas l'implémentation.** Pas d'assertion sur le state interne d'un hook, sur l'ordre d'appels d'une fonction privée, ou sur le nom d'une méthode interne. Si le test casse au moindre refactoring sans changement de comportement, il est mauvais.
- **Un test = un comportement = un `it`.** Plusieurs `expect` sont permis s'ils décrivent **le même** comportement (ex. valeur de retour ET cursor mis à jour pour la même action).
- **Pas de `screen.getByTestId`** si un `getByRole` (accessible) existe. Priorité Testing Library : `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByDisplayValue` > `getByAltText` > `getByTitle` > `getByTestId`.
- **Pas de `fireEvent`** : utiliser `userEvent.setup()` puis `await user.click(...)`, `await user.type(...)`.
- **Pas de `Date.now()` / `Math.random()` directs dans le SUT testé.** Soit injecter la dépendance, soit `vi.useFakeTimers()` / `vi.spyOn(Math, "random")` dans le test.
- **Isolation stricte.** `beforeEach` doit reset l'état partagé : `clearTestDb()`, `__resetRateLimitForTests()`, `vi.restoreAllMocks()`. Les tests doivent passer dans n'importe quel ordre et en parallèle.
- **Pas de `.skip` silencieux ni de `--no-verify`.** Si un test flake, identifie la cause (async non awaité, état partagé, dépendance temporelle) et corrige-la.
- **Pas de mock de ce qu'on ne possède pas** (libs tierces, fetch global, Mongoose) sauf au plus haut niveau d'abstraction qu'on contrôle. Préférer un wrapper interne mockable.
- **Pas d'assertions vides ou tautologiques.** `expect.anything()`, `expect(result).toBeDefined()` ne testent rien d'utile — assert la valeur.

## Avant de rendre la main

Checklist mentale :

- [ ] Le test échoue si je casse le comportement (vérifié en supprimant 1 ligne du SUT).
- [ ] Le test passe encore si je renomme une variable interne du SUT.
- [ ] Le nom du `it` décrit ce qui est testé sans avoir à lire le corps.
- [ ] Pas de mock superflu (chaque mock a une justification : frontière externe, horloge, randomness).
- [ ] `pnpm verify:test` est vert.

## Références

- `references/principles.md` — FIRST, AAA, 4 piliers de Khorikov, Test Pyramid, classical vs London.
- `references/patterns-and-antipatterns.md` — exemples concrets, conventions de nommage, anti-patterns à corriger.
- `references/stack-cheatsheet.md` — Vitest + React Testing Library + mongodb-memory-server, snippets projet.
