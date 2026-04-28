Prépend tes appels bash avec rtk (Rust Token Killer) pour limiter le cout en token.

## Routine qualité code

Après toute modification de code dans `front-end/` ou `back-end/`, lance dans le workspace concerné :

```sh
npm run verify       # lint + typecheck (+ format côté back)
npm run verify:test  # tests unitaires
```

Si une commande échoue, corrige avant de continuer.

Ne jamais utiliser `--no-verify` sur un `git commit` ou `git push` ; corrige plutôt la cause.

## Stack

Monorepo : `front-end/` (Next.js 13 + Vitest + Playwright), `back-end/` (NestJS + Jest + MongoDB). npm sur les deux. Lefthook au root.
