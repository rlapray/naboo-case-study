# Principes — Tests unitaires

Sources : Robert C. Martin (FIRST), Kent Beck (TDD/AAA), Vladimir Khorikov (*Unit Testing: Principles, Practices, and Patterns*, Manning), Martin Fowler (*UnitTest*, *TestPyramid*, *Mocks Aren't Stubs*), Kent C. Dodds (*Testing Implementation Details*).

## FIRST (Robert C. Martin)

| Lettre | Signification | Conséquence pratique |
|---|---|---|
| **F**ast | < 100 ms par test idéalement | pas d'I/O réseau ; DB en mémoire (`mongodb-memory-server`) |
| **I**ndependent | aucun ordre, aucun état partagé | `beforeEach` reset complet |
| **R**epeatable | même résultat partout, à toute heure | pas de `new Date()` non figée, pas d'aléa non seedé |
| **S**elf-validating | pass/fail clair, sans inspection humaine | assertions explicites, pas de `console.log` à lire |
| **T**imely | écrits avec / juste après le code (TDD ou pas) | pas de batch « j'ajoute les tests à la fin du sprint » |

## AAA — Arrange / Act / Assert (Kent Beck)

```ts
it("appends fetched items and advances the cursor", async () => {
  // Arrange
  const fetchPage = vi.fn(async () => ({ items: [dto("b")], nextCursor: "next" }));
  const { result } = renderHook(() =>
    useCursorPagination({ initial: [dto("a")], initialCursor: "c1", fetchPage }),
  );

  // Act
  await act(async () => { await result.current.loadMore(); });

  // Assert
  expect(result.current.items.map(i => i.id)).toEqual(["a", "b"]);
  expect(result.current.cursor).toBe("next");
});
```

Variante : **Given / When / Then** (BDD). Identique sémantiquement.

## Les 4 piliers de Khorikov

Tout test doit maximiser conjointement (pas un seul à la fois) :

1. **Protection contre les régressions** — détecte un bug si l'on en introduit un.
2. **Résistance au refactoring** — ne casse PAS si l'on refacto sans changer le comportement.
3. **Feedback rapide** — s'exécute vite.
4. **Maintenabilité** — facile à lire, à comprendre, à modifier.

> Un test qui assert sur des détails internes maximise (1) mais détruit (2). C'est le piège classique des tests « blanc » à coups de `vi.spyOn` partout.

**Règle de décision** : si je peux refacto le SUT en gardant le même comportement public et que mon test casse, le test est trop couplé. Réduire les mocks et asserter sur la sortie observable.

## Test Pyramid (Fowler)

```
        /\
       /e2\        ← peu, lents, fragiles → skill `e2e-test`
      /----\
     /  int \      ← serveur + DB en mémoire (ce skill couvre)
    /--------\
   /   unit   \    ← majorité ; rapides, ciblés (ce skill couvre)
  /------------\
```

Pour ce projet : **majorité unit + une bonne couche d'intégration serveur** (`src/server/__tests__/`). Les e2e Playwright restent rares et couvrent les parcours critiques.

## Classical vs London school (Fowler, *Mocks Aren't Stubs*)

- **Classical (Detroit / state-based)** — on instancie de vrais collaborateurs, on assert sur l'état final. **Défaut du projet.**
- **London (mockist / interaction-based)** — on mock tous les collaborateurs, on assert sur les interactions.

**Choix par défaut : classical.** Exception légitime — frontière externe non déterministe ou coûteuse (HTTP sortant, horloge, randomness, file system). Dans ces cas, mocker uniquement la frontière, pas la chaîne entière.

## DAMP > DRY dans les tests

> "DRY is for production code. DAMP is for tests." — *Descriptive And Meaningful Phrases*

Un test doit se lire seul. Préférer une duplication assumée (factory locale `dto()`, setup inline) à un helper trop abstrait qui force le lecteur à sauter de fichier en fichier. Un `beforeEach` qui prépare 5 entités complexes est souvent un anti-pattern : déplacer le setup dans le `it` quand il diffère d'un test à l'autre.

## "Test the behavior, not the implementation" (Kent C. Dodds)

> "The more your tests resemble the way your software is used, the more confidence they can give you."

- Pour un hook : appeler les fonctions exposées, lire les valeurs exposées. Pas `expect(result.current.__internalState)`.
- Pour un composant : interagir comme un utilisateur (`userEvent`), assert sur ce qu'il voit (`screen.getByRole`).
- Pour un service serveur : appeler la fonction publique, assert sur le retour et l'état persisté en DB. Pas sur les méthodes Mongoose intermédiaires.
