- Prépend tes appels bash avec rtk (Rust Token Killer) pour limiter le cout en token.
- Utilise Context7 pour la documentation, migration, etc...
- Pour améliorer tes plans
  - utilise la méthode du skill /grill-me, utilise docs/UBIQUITOUS_LANGUAGE.md
  - utilise les features maps dans docs quand nécessaire
- Chaque feature, bugfix, refacto doit être accompagné de ses tests unitaires, d'intégration ou e2e selon le cas. Utilise les règles de décision pour choisir le type de test.


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

## Tests front — pyramide à 4 niveaux

| Niveau | Outil | Skill | Cible |
|---|---|---|---|
| Unit pur | Vitest | `writing-unit-tests` | Fonctions `(input) → output` (validators, mappers, helpers) |
| Unit hook | Vitest + `renderHook` | `writing-unit-tests` | Hooks custom isolés, services mockés |
| Component | Vitest + RTL + jsdom | `writing-rtl-tests` | Composants React rendus, mocks à la frontière HTTP (`@/services/api`, `@/services/cities`, `next/router`) |
| E2E | Playwright | `e2e-test` | Parcours utilisateur multi-pages, vrai backend |

**Règle de décision** : *« Si je peux exprimer le comportement sans citer un parcours utilisateur, c'est unit ou RTL. Si j'ai besoin de plusieurs pages et d'un vrai backend, c'est e2e. »*

**Mutation testing** (Stryker) sur `src/server/**`, `src/hooks/**`, `src/utils/**`, `src/pages/api/**` — voir skill `mutation-testing` pour configurer Stryker, lire le rapport et tuer les mutants survivants. Complète la pyramide, ne la remplace pas.

**Helper RTL projet** : `src/test-utils/renderWithProviders.tsx` enveloppe `MantineProvider` + `AuthContext` + `SnackbarContext`, valeurs overridables via `{ auth: { user, handleSignin... }, snackbar: { error, success } }`. À utiliser pour tout test composant.

**Setup global** (`src/setupTests.ts`) : `@testing-library/jest-dom` matchers + polyfills `window.matchMedia` et `ResizeObserver` pour Mantine.

**Anti-patterns récurrents** : voir `.claude/skills/writing-rtl-tests/references/common-pitfalls.md`. Les principaux : `getByRole` toujours préférable à `getByTestId`, `userEvent` jamais `fireEvent`, `findBy*` jamais `waitFor(() => getBy*())`, mocks à la frontière HTTP uniquement (jamais `useForm`, `useAuth`, hooks internes).
