---
name: e2e-test
description: >-
  Crée, exécute et débogue des tests end-to-end Playwright en suivant les principes e2e
  agnostiques (test pyramid, parcours utilisateur, isolation, déterminisme) et les
  conventions Playwright (locators role-first, web-first assertions, anti-flake).
  Utiliser quand l'utilisateur veut « ajouter un test e2e », « tester un parcours
  utilisateur », « écrire un test Playwright », « lancer la suite e2e », ou « débugger
  un test e2e qui flake ».
argument-hint: "<parcours à tester>"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# e2e-test

Tu crées, exécutes ou débogues un test e2e Playwright. Le skill comporte deux couches :

- **Brain** — principes e2e agnostiques (`references/principles.md`).
- **Mains** — implémentation Playwright (`references/playwright-*.md`).

Charge les references à la demande, pas en bloc.

Contexte fourni : `$ARGUMENTS`

## Phase 0 — Prérequis

1. Vérifier que `front-end/playwright.config.ts` existe et que `@playwright/test` est dans `front-end/package.json` (devDependencies).
2. Si **absent** → stopper et inviter :
   _« Playwright n'est pas configuré. Installe-le avec `cd front-end && npm install -D @playwright/test && npx playwright install chromium`, puis crée `playwright.config.ts`. »_
3. Si **présent** → continuer.

## Phase 1 — Choisir quoi tester (brain)

Avant d'écrire, valider que le parcours mérite un e2e. Charger `references/principles.md` si doute. Règles canoniques :

- Un e2e teste un **parcours utilisateur de bout en bout** (signin → action → résultat visible), **pas** une unité de code.
- Cible : 5–10 % du suite de tests, **uniquement** les parcours business critiques.
- **Pas de doublons** avec l'unitaire/intégration : edge cases et conditionnels restent en bas de la pyramide.
- **Black-box** : on teste ce que l'utilisateur voit, jamais l'implémentation (noms de fonctions, structure DOM interne, classes CSS).
- **Données isolées et déterministes** : seed propre par run, reset entre tests, jamais de dépendance entre tests.

Si le parcours demandé est mieux servi par un test unitaire ou d'intégration → **proposer ce niveau plutôt qu'un e2e** et arrêter.

## Phase 2 — Cadrage du parcours

Reformuler le parcours en suite d'actions/assertions visibles depuis l'UI :
- Quelles routes sont touchées (`front-end/src/pages/*`) ?
- Quelles données préalables (utilisateur, état localStorage, état DB) ?
- Faut-il le backend (`cd back-end && npm run start:db && npm run start:dev`) ?
- Quel est l'**état observable final** qui prouve que le parcours a réussi ?

## Phase 3 — Codegen optionnel

Pour démarrer rapidement sur un parcours UI complexe :

```bash
cd front-end && npm run e2e:codegen
```

Playwright génère un squelette avec des locators role-first. Le raffiner ensuite en suivant la Phase 4.

## Phase 4 — Rédaction (mains Playwright)

Créer `front-end/e2e/<parcours>.spec.ts`. Charger les references à la demande :

- **Locators** → `references/playwright-locators.md`
  Priorité **stricte** : `getByRole` > `getByLabel` > `getByText` > `getByTestId`. **Jamais** de selector CSS brittle (`.classname`, `div > span`) ni XPath.
- **Assertions** → `references/playwright-assertions.md`
  Web-first uniquement (`await expect(locator).toBeVisible()`). **Jamais** `expect(await locator.isVisible()).toBe(true)` ni `waitForTimeout`.
- **Structure du fichier** → `references/playwright-structure.md`
  `test.describe`, `test.beforeEach` pour le setup partagé, isolation par contexte par défaut.
- **URLs relatives** via `baseURL` : `await page.goto("/discover")` (pas d'URL absolue).
- **Mocks** : ne mocker **que** les dépendances tierces externes (Stripe, analytics…). Ne **jamais** mocker les services internes — c'est l'objet du test.

## Phase 5 — Exécution & debug

Depuis `front-end/` :

| Commande | Quand |
|---|---|
| `npm run e2e -- e2e/<parcours>.spec.ts` | Exécution ciblée. |
| `npm run e2e:ui` | Debug interactif (watch + time-travel). |
| `npm run e2e:debug` | Step-by-step avec inspector. |
| `npm run e2e:report` | Lire le HTML report après échec. |

Pour tout test qui échoue ou flake → charger `references/playwright-debug.md` (lecture trace, UI mode, codegen).

## Phase 6 — Checklist anti-flake (avant de rendre la main)

Charger `references/anti-flake-checklist.md` et **valider chaque item** :

- [ ] Aucun `waitForTimeout` / `setTimeout` / `page.waitForTimeout(\d+)`.
- [ ] Aucun selector CSS brittle ni XPath.
- [ ] Tous les `await` présents (pas de floating promise).
- [ ] Toutes les assertions sont web-first.
- [ ] Le test ne dépend d'aucun état laissé par un autre.
- [ ] Le test passe **3× d'affilée** : `npm run e2e -- e2e/<parcours>.spec.ts --repeat-each=3`.

Si un item échoue → corriger avant de rendre la main. Un test qui flake est pire qu'absent.
