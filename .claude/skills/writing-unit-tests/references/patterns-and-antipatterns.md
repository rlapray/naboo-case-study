# Patterns & Anti-patterns

## Conventions de nommage

Format : `it("<verb>s <object> when <condition>")`.

Bons noms :
- `it("appends fetched items and advances the cursor")`
- `it("rejects the login when the password does not match")`
- `it("clears the cursor when the server stops returning one")`
- `it("is a no-op when there is no cursor")`

Mauvais noms :
- `it("works")` / `it("test 1")` / `it("should work correctly")`
- `it("calls fetchPage")` — décrit l'implémentation, pas le comportement.
- `it("returns true")` — sans contexte, inutile.

## Structure d'un fichier de test

```ts
import { describe, expect, it, vi } from "vitest";
import { sut } from "./sut";

// Factory locale (DAMP) — préférer une factory inline qu'un import depuis un mega-helper
const makeFoo = (overrides: Partial<Foo> = {}): Foo => ({
  id: "id",
  name: "n",
  ...overrides,
});

describe("sut", () => {
  it("does X when Y", () => { /* AAA */ });
  it("returns Z when W", () => { /* AAA */ });
});
```

Un seul `describe` racine du nom du SUT. Sous-`describe` uniquement si l'on regroupe par méthode publique ou par condition (ex. `describe("when authenticated")`).

## Quoi mocker — quoi NE PAS mocker

| Cible | Mocker ? | Pourquoi |
|---|---|---|
| HTTP sortant (autres services) | ✅ Oui | frontière externe non déterministe |
| Horloge / `Date.now()` | ✅ `vi.useFakeTimers()` | déterminisme |
| `Math.random()`, `crypto.randomUUID()` | ✅ Spy ou injection | déterminisme |
| Mongoose / DB | ❌ Non — utiliser `mongodb-memory-server` | mocker l'ORM rejoue les bugs en prod |
| Logger interne | ❌ Non, sauf assert spécifique | bruit |
| Hooks React du SUT | ❌ Non | détail d'implémentation |
| Composants enfants du SUT | ❌ Non par défaut | tester l'arbre rendu reflète l'usage réel |
| Module qu'on possède | ⚠️ Plutôt injecter en paramètre | testable sans `vi.mock` |

> **Règle Khorikov** : *don't mock what you don't own*. Mocker `fetch` global ou `mongoose.Model` directement crée une dépendance fragile à l'API d'une lib tierce. Préférer un wrapper interne (`fetchPage`, `userRepository`) qu'on injecte ou qu'on mock.

## Anti-patterns à corriger activement

### 1. Assertions sur l'implémentation
```ts
// ❌ Mauvais — couplé au compteur d'appels interne
expect(fetchPage).toHaveBeenCalledTimes(1);

// ✅ Bon — assert sur le résultat observable
expect(result.current.items).toEqual([dto("a"), dto("b")]);
```
Exception légitime : on teste précisément la **non-duplication** d'appels (cas du guard ré-entrant), où l'effet de bord EST le comportement.

### 2. Mock factice qui ne teste rien
```ts
// ❌ Le mock retourne ce que le SUT lui passe — le test passe même si le SUT est vide
const sut = vi.fn().mockReturnValue("ok");
expect(sut()).toBe("ok");
```

### 3. `expect.anything()` partout
```ts
// ❌ N'attrape aucune régression
expect(payload).toEqual({ id: expect.anything(), name: expect.anything() });

// ✅ Assert les valeurs attendues
expect(payload).toEqual({ id: "u-1", name: "Alice" });
```

### 4. Setup gigantesque dans `beforeEach`
Si chaque `it` n'utilise que 20% du setup, il dégrade la lisibilité. Inline le setup pertinent dans le `it` (DAMP).

### 5. Tests qui dépendent de l'ordre
Symptôme : `pnpm verify:test --shuffle` casse. Cause : état partagé non reset (DB, mocks, modules cachés). Solution : `beforeEach` exhaustif, `vi.restoreAllMocks()`.

### 6. Async non awaité
```ts
// ❌ Le test peut passer alors que la promesse échoue plus tard
result.current.loadMore();
expect(result.current.items).toHaveLength(2);

// ✅
await act(async () => { await result.current.loadMore(); });
expect(result.current.items).toHaveLength(2);
```

### 7. `getByTestId` au lieu de `getByRole`
```ts
// ❌
screen.getByTestId("submit-button");

// ✅
screen.getByRole("button", { name: /se connecter/i });
```
Bonus : force l'accessibilité du composant.

### 8. `fireEvent` au lieu de `userEvent`
```ts
// ❌ Ne déclenche pas la séquence complète (focus, keydown, keypress, input, keyup…)
fireEvent.click(button);

// ✅
const user = userEvent.setup();
await user.click(button);
```

## Réutiliser plutôt que recréer

Avant d'écrire un helper de test, vérifier :

- `src/server/__tests__/helpers/test-db.ts` — `startTestDb()`, `stopTestDb()`, `clearTestDb()` (mongodb-memory-server).
- `src/server/__tests__/helpers/mock-http.ts` — `callHandler(handler, { method, body, headers, cookies })`, `extractCookie(headers, name)`.
- Factories de DTO : pattern `dto(id)` local au fichier de test, voir `src/hooks/useCursorPagination.test.ts:6`.
