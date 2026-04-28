- Prépend tes appels bash avec rtk (Rust Token Killer) pour limiter le cout en token.
- Utilise Context7 pour la documentation, migration, etc...

## Routine qualité code

Après toute modification de code dans `src/`, lance à la racine :

```sh
pnpm verify       # lint + typecheck
pnpm verify:test  # vitest run (unit + intégration serveur)
```

Si une commande échoue, corrige avant de continuer.

Ne jamais utiliser `--no-verify` sur un `git commit` ou `git push` ; corrige plutôt la cause.

## Stack

Application Next.js 13 (Pages Router) unique à la racine. Mongo en service externe via docker-compose. Tests unit/intégration en Vitest (avec mongodb-memory-server pour la couche serveur), e2e en Playwright. Lefthook orchestre les hooks git.

Code serveur sous `src/server/` (mongoose schemas, services, auth, seed) ; route handlers REST sous `src/pages/api/**` ; client (pages, composants Mantine, contexts) sous `src/`. DTOs partagés client/serveur dans `src/types/`. `getServerSideProps` appelle directement les services serveur — pas de bouclage HTTP self-call.
