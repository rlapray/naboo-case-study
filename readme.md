# Naboo case study

Application Next.js 13 (Pages Router) qui sert à la fois le rendu et l'API REST. MongoDB en service externe via Docker.

## Stack

- Next.js 13.4 + React 18 + Mantine 6
- Mongoose 7 + MongoDB
- JWT (cookie httpOnly) + bcrypt
- zod (validation)
- Vitest (unit + intégration serveur via mongodb-memory-server)
- Playwright (e2e)

## Démarrage

```sh
pnpm install
cp .env.example .env
pnpm start:db   # docker-compose up -d  → Mongo sur :27017
pnpm seed       # crée user1@test.fr et 5 activités de démo
pnpm dev        # Next.js sur :3001
```

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

## Scripts

| Script               | Effet                                             |
|----------------------|---------------------------------------------------|
| `pnpm dev`        | Next.js dev sur :3001                              |
| `pnpm build`      | Build production                                   |
| `pnpm start`      | Next.js prod sur :3001                             |
| `pnpm seed`       | Seed Mongo (user de démo + activités)              |
| `pnpm start:db`   | Lance MongoDB via docker-compose                   |
| `pnpm stop:db`    | Stoppe MongoDB                                     |
| `pnpm verify`     | lint + typecheck                                   |
| `pnpm verify:test`| Vitest run (unit + intégration)                    |
| `pnpm e2e`        | Playwright (build + start sur :3002 + suite)       |

## Architecture

```
src/
├── pages/             pages Next + route handlers REST sous api/
├── server/            code serveur (mongoose, services, auth, seed)
├── components/        composants React + Mantine
├── contexts/          AuthContext, SnackbarContext
├── hocs/              withAuth / withoutAuth
├── hooks/             useAuth, useSnackbar, useDebounced
├── services/          api.ts (fetch wrapper) + cities.ts (geo.api.gouv.fr)
├── types/             DTOs partagés client/serveur
└── utils/             thème Mantine, styles globaux
e2e/                   Playwright + global-setup pour seed
scripts/               seed.ts (CLI)
docs/                  ubiquitous language, feature map
docker-compose.yml     MongoDB 7
```

## Tests

- **Unit / intégration serveur** : `pnpm verify:test`. Vitest exécute aussi les tests serveur sous `src/server/` via `mongodb-memory-server`.
- **E2E** : `pnpm e2e`. Playwright lance `next build && next start -p 3002`, le `globalSetup` seed la base, puis exécute les 13 specs.
