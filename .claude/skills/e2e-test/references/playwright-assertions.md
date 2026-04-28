# Assertions Playwright

Source : `playwright.dev/docs/test-assertions`.

## Règle absolue : web-first uniquement

Les matchers `expect(locator)...` **attendent et retentent** automatiquement jusqu'à un timeout (5s par défaut). C'est le mécanisme anti-flake principal.

```ts
// ✅ Web-first : attend et réessaie
await expect(page.getByRole("heading", { name: "Bienvenue" })).toBeVisible();

// ❌ Pas web-first : capture l'état à l'instant T, pas de retry
expect(await page.getByRole("heading").isVisible()).toBe(true);

// ❌ Pas de retry sur l'attribut
expect(await page.getByRole("textbox").inputValue()).toBe("hello");
```

## Matchers fréquents

| Matcher | Usage |
|---|---|
| `toBeVisible()` | Élément rendu et visible. |
| `toBeHidden()` | Élément absent du DOM ou caché. |
| `toBeEnabled()` / `toBeDisabled()` | État d'un input/bouton. |
| `toBeChecked()` | Checkbox/radio coché. |
| `toHaveText("...")` | Texte exact (égalité stricte). |
| `toContainText("...")` | Texte contient. |
| `toHaveValue("...")` | Valeur d'un input. |
| `toHaveCount(n)` | Nombre d'éléments matchant un locator. |
| `toHaveURL(/pattern/)` | URL courante (regex ou string). |
| `toHaveTitle(/pattern/)` | `<title>` du document. |
| `toHaveAttribute("aria-label", "...")` | Attribut sur l'élément. |

## Soft assertions

Utiles quand on veut collecter plusieurs failures avant de stopper.

```ts
await expect.soft(page.getByTestId("status")).toHaveText("OK");
await expect.soft(page.getByTestId("count")).toHaveText("3");
// le test continue, échoue à la fin si l'une des soft a failé
```

## Anti-patterns

```ts
// ❌ Pas d'await sur expect → le test peut sortir avant la résolution
expect(page.getByRole("button")).toBeVisible();

// ❌ Sleep magique au lieu d'une assertion
await page.waitForTimeout(2000);
await expect(...).toBeVisible();

// ✅ La forme correcte : pas de sleep, juste l'assertion qui retry
await expect(...).toBeVisible();
```

## Modifier les timeouts ponctuellement

```ts
await expect(page.getByText("Long async result")).toBeVisible({ timeout: 30_000 });
```

À utiliser avec parcimonie — un timeout long cache souvent un vrai problème de perf ou de signal.
