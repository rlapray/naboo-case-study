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

## Hooks React — `renderHook` + `act`

```ts
import { act, renderHook } from "@testing-library/react";

const { result, rerender } = renderHook(() => useFoo(props));

await act(async () => { await result.current.doSomething(); });
expect(result.current.value).toBe(42);
```
Toute mutation d'état asynchrone doit être enveloppée dans `await act(async () => { ... })` — sinon warning React et test flaky.

Pour wrapper un hook avec un contexte (ex. `useAuth` qui dépend de `AuthProvider`) : passer un `wrapper` à `renderHook`. Voir `src/contexts/authContext.test.tsx` pour le pattern projet.

## Composants React → skill `writing-rtl-tests`

Tout test rendant un composant React (`render`, `userEvent`, queries DOM) **n'est pas couvert par ce skill**. Déléguer à `writing-rtl-tests` qui détaille :

- Priorité des queries (`getByRole` > … > `getByTestId`).
- `userEvent` v14 (jamais `fireEvent`).
- Mocks à la frontière HTTP uniquement (`@/services/api`, `next/router`, jamais `useForm` / `useAuth` / hooks internes).
- Helper projet `src/test-utils/renderWithProviders.tsx`.
- Pièges Mantine (portals, `Select`, `ResizeObserver`).
- Async via `findBy*` (jamais `waitFor(() => getBy*())`).

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
