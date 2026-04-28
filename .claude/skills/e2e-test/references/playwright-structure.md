# Structure d'un fichier `.spec.ts`

Source : `playwright.dev/docs/writing-tests` + best practices officielles.

## Squelette de référence

```ts
import { expect, test } from "@playwright/test";

test.describe("Nom du parcours métier", () => {
  test.beforeEach(async ({ page }) => {
    // Setup partagé : navigation, login, état initial
    await page.goto("/route-de-départ");
  });

  test("résultat business attendu n°1", async ({ page }) => {
    // Action(s) utilisateur
    await page.getByLabel("Email").fill("user@test.fr");
    await page.getByRole("button", { name: "Valider" }).click();

    // Assertion(s) sur l'état observable
    await expect(page).toHaveURL(/\/profil/);
    await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
  });

  test("résultat business attendu n°2", async ({ page }) => {
    // Indépendant du premier test
  });
});
```

## Conventions

- **Un fichier par parcours** (`signin.spec.ts`, `discover.spec.ts`, `booking.spec.ts`). Pas un fichier par page.
- **Titre du `describe`** : nom du parcours métier (« Inscription », « Recherche d'activité »). Pas un nom technique.
- **Titre du `test`** : un **résultat observable** (« l'utilisateur peut se connecter », « la liste se filtre par catégorie »). Pas une action (« cliquer sur Valider »).
- **URLs relatives** : `page.goto("/signin")` — `baseURL` est dans `playwright.config.ts`.

## Isolation : ce que Playwright fait pour toi

- Chaque test reçoit un **`page` fraîche dans un BrowserContext isolé** (cookies, localStorage, sessionStorage vierges).
- Les tests d'un même fichier tournent **en parallèle** par défaut (sauf si `test.describe.serial` ou `fullyParallel: false`).

Conséquence : ne **jamais** écrire un test qui dépend d'un état laissé par un autre.

## Setup d'authentification réutilisable

Si beaucoup de tests doivent être loggés, utiliser un **setup project** plutôt que de relogger dans chaque `beforeEach`. Doc : `playwright.dev/docs/auth`.

```ts
// auth.setup.ts
import { test as setup } from "@playwright/test";

setup("authentifie un user", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Mot de passe").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Valider" }).click();
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
```

Puis dans `playwright.config.ts` :

```ts
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" },
    dependencies: ["setup"],
  },
],
```

## Hooks worker-level (rare)

`test.beforeAll` et `test.afterAll` partagent l'état entre tests **du même worker** — utile pour démarrer une ressource coûteuse (DB seed lourd). À éviter sauf besoin réel : casse l'isolation par défaut.

## Données de test

- **Identifiants uniques par test** (timestamp, uuid) pour éviter les collisions :
  ```ts
  const email = `user-${Date.now()}@test.fr`;
  ```
- **Reset côté backend** : si l'API expose un endpoint de seed/reset (typiquement `/test/reset`), l'appeler dans `beforeEach`. Si rien n'existe, créer des données fraîches à chaque test.
- **Jamais de partage de données** entre tests, même au sein d'un `describe`.
