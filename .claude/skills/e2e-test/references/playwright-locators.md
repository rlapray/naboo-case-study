# Locators Playwright

Source : `playwright.dev/docs/best-practices` + `playwright.dev/docs/locators`.

## Priorité stricte

Suivre cet ordre pour choisir un locator. Descendre d'un cran **uniquement** si le précédent ne fonctionne pas.

| Rang | API | Exemple | Quand |
|---|---|---|---|
| 1 | `getByRole` | `page.getByRole("button", { name: "Valider" })` | **Toujours en premier**. Fonctionne pour `button`, `link`, `heading`, `textbox`, `checkbox`, `dialog`, `navigation`, etc. |
| 2 | `getByLabel` | `page.getByLabel("Email")` | Champs de formulaire avec un `<label>`. |
| 3 | `getByPlaceholder` | `page.getByPlaceholder("your@email.com")` | Champs sans label visible (accepter à contrecœur). |
| 4 | `getByText` | `page.getByText("Bienvenue")` | Contenu textuel non-interactif (paragraphes, titres). |
| 5 | `getByTestId` | `page.getByTestId("activity-card")` | **Dernier recours** : seulement si aucune sémantique accessible n'existe et qu'on ne peut pas l'ajouter. |

## Anti-patterns

```ts
// ❌ Brittle — casse au moindre changement de markup
page.locator(".btn-primary.submit-btn");
page.locator("div > div > span:nth-child(3)");

// ❌ XPath — illisible et fragile
page.locator("//button[@class='Mui-root']");

// ❌ ID auto-généré — change à chaque build
page.locator("#mantine-r-3");
```

## Chaîner et filtrer

```ts
// Restreindre dans un parent
const card = page.getByRole("article").filter({ hasText: "Yoga" });
await card.getByRole("button", { name: "Réserver" }).click();

// Filtrer par contenu d'un descendant
page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Activité 1" }) });
```

## Gestes utilisateur réels

```ts
await page.getByLabel("Email").fill("user@test.fr");        // saisie clavier
await page.getByRole("checkbox", { name: "OK" }).check();
await page.getByRole("combobox").selectOption("paris");
await page.getByRole("button", { name: "Valider" }).click();
```

## Décision rapide

> « Si je décris cet élément à un humain qui ne voit pas le code, qu'est-ce que je dirais ? »
> → C'est ça le locator à utiliser.

## Quand ajouter un `data-testid`

- Le composant n'a **aucune** sémantique accessible (icône cliquable sans `aria-label`, par exemple).
- Et corriger l'accessibilité n'est pas dans le scope du test.
- Alors : ajouter `data-testid="..."` au composant ET utiliser `getByTestId`.

Ne **jamais** ajouter un `data-testid` quand un `getByRole`/`getByLabel` aurait fonctionné — c'est masquer un manque d'accessibilité.
