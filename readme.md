# Naboo case study

Application Next.js (Pages Router) qui sert à la fois le rendu et l'API REST. MongoDB en service externe via Docker.

## Stack

- Next.js 16 + React 19 + Mantine 9
- Mongoose 9 + MongoDB 7
- JWT (cookie httpOnly) + bcrypt
- zod (validation)
- Vitest (unit + intégration serveur via mongodb-memory-server) + RTL (jsdom)
- Playwright (e2e)
- Stryker (mutation testing)

## Démarrage

```sh
pnpm install
cp .env.example .env
pnpm start:db   # docker-compose up -d  → Mongo sur :27017
pnpm seed       # crée user1@test.fr et les activités de démo
pnpm dev        # Next.js sur :3001
```

Node ≥ 24 requis (`.nvmrc`).

## Variables d'env

`.env.example` :

```
MONGO_URI=mongodb://localhost:27017/naboo
JWT_SECRET=replace_me_in_dev
JWT_EXPIRATION_TIME=86400
```

## Compte de démo

email : `user1@test.fr`
password : `user1`

## UI Mongo

mongo-express est démarré avec `pnpm start:db` → http://localhost:8081 (pas d'auth en local).

## Scripts

| Script                  | Effet                                              |
|-------------------------|----------------------------------------------------|
| `pnpm dev`              | Next.js dev sur :3001                              |
| `pnpm build`            | Build production                                   |
| `pnpm start`            | Next.js prod sur :3001                             |
| `pnpm seed`             | Seed Mongo (user de démo + activités)              |
| `pnpm start:db`         | Lance MongoDB + mongo-express (UI sur :8081) via docker-compose |
| `pnpm stop:db`          | Stoppe MongoDB                                     |
| `pnpm verify`           | lint + typecheck                                   |
| `pnpm verify:test`      | Vitest run (unit + intégration + RTL)              |
| `pnpm coverage`         | Vitest run + coverage v8                           |
| `pnpm e2e`              | Playwright (build + start sur :3002 + suite)       |
| `pnpm e2e:ui`           | Playwright en mode UI                              |
| `pnpm mutation`         | Stryker (mutation testing) full                    |
| `pnpm mutation:incremental` | Stryker en mode incrémental                    |

## Architecture

```
src/
├── pages/             pages Next + route handlers REST sous api/
├── server/            code serveur (mongoose, services, auth, seed, bounded contexts)
├── components/        composants React + Mantine
├── contexts/          AuthContext, SnackbarContext
├── hocs/              withAuth / withoutAuth
├── hooks/             useAuth, useSnackbar, useDebounced…
├── services/          api.ts (fetch wrapper) + cities.ts (geo.api.gouv.fr)
├── types/             DTOs partagés client/serveur
├── utils/             thème Mantine, styles globaux
├── test-utils/        renderWithProviders (Mantine + Auth + Snackbar)
├── __tests__/         tests cross-cutting
├── routes.ts          table centralisée des routes
└── setupTests.ts      jest-dom matchers + polyfills jsdom
e2e/                   Playwright + global-setup pour seed
scripts/               seed.ts (CLI)
docs/                  ubiquitous language, feature map, drafts, sessions
docker-compose.yml     MongoDB 7
```

## Tests — pyramide à 4 niveaux

| Niveau     | Outil                       | Cible                                                            |
|------------|-----------------------------|------------------------------------------------------------------|
| Unit pur   | Vitest                      | Fonctions `(input) → output` (validators, mappers, helpers)      |
| Unit hook  | Vitest + `renderHook`       | Hooks custom isolés, services mockés                             |
| Component  | Vitest + RTL + jsdom        | Composants React, mocks à la frontière HTTP                      |
| E2E        | Playwright                  | Parcours utilisateur multi-pages, vrai backend                   |

**Mutation testing** (Stryker) sur `src/server/**`, `src/hooks/**`, `src/utils/**`, `src/pages/api/**` pour durcir la suite.

- **Unit / intégration / composants** : `pnpm verify:test`. Vitest exécute aussi les tests serveur via `mongodb-memory-server`.
- **E2E** : `pnpm e2e`. Playwright lance `next build && next start -p 3002`, le `globalSetup` seed la base, puis exécute la suite.
