# Tests end-to-end (Playwright)

## Commandes

| Commande | Effet |
|---|---|
| `npm run e2e` | Lance toute la suite (chromium, headless). |
| `npm run e2e -- e2e/signin.spec.ts` | Lance un fichier précis. |
| `npm run e2e:ui` | Ouvre l'UI mode (watch + time-travel). |
| `npm run e2e:debug` | Lance avec l'inspector Playwright (step-by-step). |
| `npm run e2e:report` | Ouvre le dernier HTML report. |
| `npm run e2e:codegen` | Lance le générateur de tests sur `localhost:3001`. |

## Prérequis

- Le port `3001` doit être libre (Playwright démarre Next via `webServer`, ou réutilise l'instance déjà lancée par `npm run dev`).
- Pour les parcours qui touchent l'API (parcours authentifié, listing GraphQL…), démarrer aussi le back-end :
  ```bash
  cd ../back-end && npm run start:db   # MongoDB via docker-compose
  cd ../back-end && npm run start:dev  # NestJS
  ```

Le smoke `signin.spec.ts` ne dépend **pas** du backend (le HOC `withoutAuth` rend le formulaire dès qu'aucun token n'est présent en `localStorage`).

## Écrire un nouveau test

Utiliser le skill `/e2e-test <parcours>` — il applique les best practices (locators role-first, web-first assertions, isolation, anti-flake).
