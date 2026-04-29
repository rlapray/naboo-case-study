# Priorité des queries (officielle)

Source : https://testing-library.com/docs/queries/about

L'ordre est **strict**. Toujours essayer la query du tier supérieur avant de descendre. Source ESLint : `eslint-plugin-testing-library/prefer-explicit-assert` + `prefer-screen-queries`.

## Tier 1 — Accessible à tout le monde

| Query | Quand l'utiliser |
|---|---|
| `getByRole(role, { name })` | **Le défaut.** Tout élément exposé dans l'arbre d'accessibilité : `button`, `link`, `heading`, `textbox`, `combobox`, `dialog`, `alert`, `list`, `listitem`, `checkbox`, `radio`, `tab`, `option`. Combine avec `name` (regex possible). |
| `getByLabelText(label)` | Champs de formulaire référencés par `<label>`. La meilleure manière d'attraper un input : reflète l'usage utilisateur. |
| `getByPlaceholderText(text)` | Si pas de label (mais c'est un défaut d'accessibilité — préférer ajouter un label). |
| `getByText(text)` | Texte non-interactif (paragraphe, libellé, message). |
| `getByDisplayValue(value)` | Locate un `<input>` par sa valeur courante (utile pour un form pré-rempli). |

## Tier 2 — Sémantiques

| Query | Quand l'utiliser |
|---|---|
| `getByAltText(text)` | `<img>`, `<area>`, `<input type="image">`. |
| `getByTitle(text)` | Dernier recours sémantique. Le `title` n'est pas systématiquement annoncé par les lecteurs d'écran. |

## Tier 3 — Escape hatch

| Query | Quand l'utiliser |
|---|---|
| `getByTestId(id)` | **Uniquement** si aucune autre query ne fonctionne (texte dynamique, élément invisible aux AT mais pertinent à tester). Justifier en commentaire. |

## Anti-patterns

```ts
// MAUVAIS — selectors CSS
container.querySelector(".btn-primary");
container.querySelector("input[name='email']");

// MAUVAIS — getByTestId par défaut
screen.getByTestId("submit-button");

// MAUVAIS — déstructurer depuis render
const { getByRole } = render(<Form />);
getByRole("button");
```

```ts
// BON
screen.getByRole("button", { name: /enregistrer/i });
screen.getByLabelText(/email/i);
```

## Variantes

| Préfixe | Usage |
|---|---|
| `getBy*` | Synchrone, throw si absent. Pour asserter la présence immédiate. |
| `findBy*` | Async (retry jusqu'à timeout). **Le bon choix pour tout ce qui apparaît après une interaction async.** |
| `queryBy*` | Synchrone, retourne `null` si absent. **Uniquement** pour asserter l'absence (`expect(...).not.toBeInTheDocument()`). |

Variantes `*All*` (`getAllByRole`, `findAllByRole`, `queryAllByRole`) pour récupérer plusieurs éléments.

## Exemples projet

```ts
// Bouton de soumission
screen.getByRole("button", { name: /créer/i });

// Champ avec label Mantine
screen.getByLabelText(/nom de l'activité/i);

// Suggestion dans un dropdown ouvert
await screen.findByRole("option", { name: /paris/i });

// Notification de succès qui apparaît après submit
await screen.findByText(/créée avec succès/i);

// Vérifier qu'il n'y a pas d'erreur affichée
expect(screen.queryByRole("alert")).not.toBeInTheDocument();
```
