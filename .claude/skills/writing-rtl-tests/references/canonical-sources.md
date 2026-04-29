# Sources canoniques RTL

Les sources autoritatives à citer et à consulter pour toute question RTL. Ne jamais s'appuyer sur du tutoriel tiers ni sur Stack Overflow quand l'une de ces sources couvre le sujet.

## Philosophie

- **Kent C. Dodds — *Testing Implementation Details*** — https://kentcdodds.com/blog/testing-implementation-details
  Définit ce qu'est un détail d'implémentation, pourquoi le tester produit faux positifs et faux négatifs, et la règle d'or :
  > « The more your tests resemble the way your software is used, the more confidence they can give you. »

- **testing-library.com — *Guiding Principles*** — https://testing-library.com/docs/guiding-principles
  Principes officiels du projet. Insiste sur l'accessibilité comme axe principal des queries.

## Anti-patterns

- **Kent C. Dodds — *Common Mistakes with React Testing Library*** — https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
  Liste de 15 erreurs courantes avec correction. Référence pour les règles dures du skill (voir `common-pitfalls.md`).

## Queries

- **testing-library.com — *About Queries*** — https://testing-library.com/docs/queries/about
  Définit la priorité officielle (`getByRole` > … > `getByTestId`). Voir `queries-priority.md`.

- **testing-library.com — *ByRole*** — https://testing-library.com/docs/queries/byrole
  Détail de `getByRole`, options (`name`, `level`, `selected`, `checked`, `expanded`).

## Interactions

- **testing-library.com — *user-event intro*** — https://testing-library.com/docs/user-event/intro
  Setup v14 (`userEvent.setup()`), différence avec `fireEvent`, toutes les méthodes async.

## Async

- **testing-library.com — *Async Methods*** — https://testing-library.com/docs/dom-testing-library/api-async
  Définit `findBy*`, `waitFor`, `waitForElementToBeRemoved`. Le bon usage de chaque.

## Outillage

- **`@testing-library/jest-dom`** — https://github.com/testing-library/jest-dom
  Liste des matchers (`toBeInTheDocument`, `toBeDisabled`, `toHaveValue`, `toHaveAccessibleName`...).

- **`eslint-plugin-testing-library`** — https://github.com/testing-library/eslint-plugin-testing-library
  Plugin ESLint qui détecte automatiquement la majorité des anti-patterns du skill.

- **`eslint-plugin-jest-dom`** — https://github.com/testing-library/eslint-plugin-jest-dom
  Plugin ESLint qui force l'usage des matchers `jest-dom` au lieu d'asserts manuelles.
