# Stack cheatsheet — Vitest + RTL + mongodb-memory-server

## Lancer la suite

```sh
pnpm verify:test       # vitest run (unit + intégration serveur)
pnpm test              # mode watch
pnpm test path/to/sut  # cible un fichier
```

Avant commit : `pnpm verify` (lint + typecheck) — bloque si une règle ESLint saute.

## Vitest — essentiel

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
```

| Besoin | API |
|---|---|
| Mock de fonction | `vi.fn(impl?)` |
| Espionner une méthode existante | `vi.spyOn(obj, "method")` |
| Mocker un module | `vi.mock("./path", () => ({ exported: vi.fn() }))` (top-level, hoisted) |
| Restaurer après test | `vi.restoreAllMocks()` dans `beforeEach` |
| Faux temps | `vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01"))` puis `vi.useRealTimers()` |
| Avancer le temps | `await vi.advanceTimersByTimeAsync(1000)` |
| Environnement Node (pas jsdom) | `// @vitest-environment node` en haut du fichier |

`vi.mock` est hoisté : la factory ne peut pas référencer de variable du module. Pour cela, utiliser `vi.hoisted` :
```ts
const { mockFoo } = vi.hoisted(() => ({ mockFoo: vi.fn() }));
vi.mock("./foo", () => ({ foo: mockFoo }));
```

## React Testing Library — guiding principles

> The more your tests resemble the way your software is used, the more confidence they can give you.

### Priorité des queries
1. `getByRole(role, { name })` — le défaut.
2. `getByLabelText` — pour les inputs de formulaire.
3. `getByPlaceholderText` — si pas de label (mauvais signe d'accessibilité).
4. `getByText` — éléments non interactifs.
5. `getByDisplayValue` — valeur courante d'un input.
6. `getByAltText`, `getByTitle`.
7. `getByTestId` — dernier recours, à justifier.

Variantes : `query*` (retourne `null`), `find*` (async, retry).

### `userEvent` (jamais `fireEvent`)
```ts
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();
await user.click(screen.getByRole("button", { name: /se connecter/i }));
await user.type(screen.getByLabelText(/email/i), "alice@example.com");
```

### Hooks — `renderHook` + `act`
```ts
import { act, renderHook } from "@testing-library/react";

const { result, rerender } = renderHook(() => useFoo(props));

await act(async () => { await result.current.doSomething(); });
expect(result.current.value).toBe(42);
```
Toute mutation d'état asynchrone doit être enveloppée dans `await act(async () => { ... })` — sinon warning React et test flaky.

### Async UI — `findBy*` + web-first assertions
```ts
expect(await screen.findByRole("alert")).toHaveTextContent(/erreur/i);
```
`findBy*` retry jusqu'au timeout — ne pas mélanger avec `waitFor` ad-hoc.

## Tests serveur (Next.js API routes + Mongoose)

### Setup standard (cf. `src/server/__tests__/activities.http.test.ts`)
```ts
// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import handler from "@/pages/api/activities";
import { __resetRateLimitForTests } from "@/server/rate-limit";
import { callHandler, extractCookie } from "./helpers/mock-http";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

describe("activities HTTP", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret";
    await startTestDb();
  });
  afterAll(async () => { await stopTestDb(); });
  beforeEach(async () => {
    await clearTestDb();
    __resetRateLimitForTests();
  });

  it("returns 401 when no jwt cookie is set", async () => {
    const res = await callHandler(handler, { method: "GET" });
    expect(res.status).toBe(401);
  });
});
```

### Helpers à connaître
- `startTestDb()` / `stopTestDb()` — démarre/arrête une instance `mongodb-memory-server` et connecte Mongoose.
- `clearTestDb()` — vide toutes les collections entre tests (à appeler dans `beforeEach`).
- `callHandler(handler, { method, body, headers, cookies, query })` — invoque un handler Next.js API sans serveur HTTP.
- `extractCookie(headers, name)` — extrait un cookie d'une réponse `Set-Cookie`.

### Reset des états globaux serveur
Si le SUT (ou une dépendance) tient un état module-level (cache, rate-limit, in-memory store), exposer un `__resetForTests()` et l'appeler dans `beforeEach`. Exemple : `__resetRateLimitForTests`.

## Environnements Vitest

- **Par défaut** : `jsdom` (config projet) — convient au client (composants, hooks).
- **Tests serveur / DB** : ajouter en haut du fichier
  ```ts
  // @vitest-environment node
  ```
  pour éviter le poids de jsdom et les surprises `window` / `document`.

## Couverture

`pnpm vitest run --coverage` (Vitest utilise V8 par défaut). Viser la couverture comme **indicateur** : ce qui n'est pas couvert n'est pas testé, mais 100% de couverture ne garantit aucune qualité (cf. assertions tautologiques). Préférer la qualité des assertions à la couverture brute.
