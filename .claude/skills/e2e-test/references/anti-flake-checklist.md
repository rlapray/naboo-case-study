# Checklist anti-flake (avant de rendre la main)

Tout test e2e doit passer chaque item. Un test qui flake est **pire** qu'un test absent : il érode la confiance dans toute la suite.

## Sleeps & timing

- [ ] Aucun `waitForTimeout(\d+)`.
- [ ] Aucun `setTimeout` ou `sleep` dans le test.
- [ ] Aucun `page.waitFor(...)` avec délai fixe.
- [ ] Toutes les attentes passent par des assertions web-first qui retry (`await expect(...)...`).

## Locators

- [ ] Aucun selector CSS brittle (`.classname`, `div > div > span`, `:nth-child`).
- [ ] Aucun XPath.
- [ ] Aucun ID auto-généré (`#mantine-r-3`, `#radix-:r1:`).
- [ ] Tous les locators sont `getByRole` / `getByLabel` / `getByText` / `getByTestId`.

## Assertions

- [ ] Toutes les assertions ont `await expect(locator)`, pas `expect(await locator....()).to...`.
- [ ] Aucun `await` manquant (vérifier : pas de floating promise — ESLint `@typescript-eslint/no-floating-promises` recommandé).

## Isolation

- [ ] Le test ne dépend d'aucun état laissé par un autre test.
- [ ] L'ordre d'exécution peut être inversé (`--workers=1 -g "..."` dans n'importe quel ordre) sans casser le test.
- [ ] Aucune donnée partagée entre tests (chaque test a ses identifiants uniques : `Date.now()`, uuid).
- [ ] Aucun `localStorage`/`sessionStorage` hérité (Playwright le garantit par défaut via BrowserContext isolé).

## Lisibilité

- [ ] Le titre du `describe` nomme un **parcours métier**.
- [ ] Le titre du `test` décrit un **résultat observable** (pas une action technique).
- [ ] Un PO peut comprendre l'intention du test en 30s sans lire le code source de l'app.

## Stabilité empirique

- [ ] Le test passe **3× d'affilée** :
  ```bash
  cd front-end && npm run e2e -- e2e/<parcours>.spec.ts --repeat-each=3
  ```
- [ ] Le test échoue **utilement** quand on casse volontairement la feature (assertion claire, screenshot/trace exploitable).

## Données & dépendances

- [ ] Si le test touche le backend : vérifié que la DB est dans un état connu au démarrage.
- [ ] Aucun mock de service interne (mock uniquement les tiers externes : Stripe, analytics).
- [ ] Aucune dépendance à un service externe non-mocké (pas de fetch vers une URL publique réelle).

## Si un item ne passe pas

**Ne pas rendre la main**. Corriger d'abord. Si le fix nécessite une intervention plus large (refactor, ajout d'un endpoint de reset), proposer le scope au lieu de livrer un test fragile.
