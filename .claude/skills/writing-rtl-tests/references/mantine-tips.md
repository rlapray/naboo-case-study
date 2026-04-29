# Mantine — pièges et patterns RTL

Mantine v7+ s'appuie sur des **portals** (rendus dans `document.body`), des `useForm` riches, et des composants overlay (Select, Modal, Popover) qui demandent des patterns spécifiques.

## Portals → `screen` + `findBy*`

Les éléments rendus via Portal **n'apparaissent pas** dans `container` mais dans `document.body`. `screen` scanne tout le document, donc :

```ts
// MAUVAIS — container ne voit pas les portals
const { container } = render(<Form />);
container.querySelector(".mantine-Select-dropdown");

// BON
await screen.findByRole("listbox");
await screen.findByRole("option", { name: /paris/i });
```

Pour les overlays qui apparaissent après une interaction, **toujours `findBy*`** (async).

## `Select` / `Combobox`

Mantine `Select` a le rôle `combobox` et son dropdown a le rôle `listbox` avec des `option`s.

```ts
const user = userEvent.setup();

// Ouvrir le dropdown
await user.click(screen.getByRole("combobox", { name: /ville/i }));

// Sélectionner — { hidden: true } parfois nécessaire selon la version Mantine
await user.click(
  await screen.findByRole("option", { name: /paris/i, hidden: true }),
);

// La valeur affichée
expect(screen.getByRole("combobox", { name: /ville/i })).toHaveValue("Paris");
```

**Piège `hidden: true` (Mantine v9 + jsdom)** : le dropdown est rendu dans un portal mais une chaîne `aria-hidden`/présentation rend les options invisibles aux queries par défaut. Si `findByRole("option", { name })` échoue, ajouter `hidden: true` à l'option.

**`ResizeObserver`** : `Select` utilise `ScrollArea` qui consomme `ResizeObserver`. Le projet polyfill globalement dans `src/setupTests.ts` — rien à faire dans les tests.

## Roles non évidents

- `TextInput type="number"` → rôle **`spinbutton`** (pas `textbox`).
- `TextInput type="search"` → rôle **`searchbox`**.
- `Select` searchable → rôle **`combobox`** (l'input lui-même).
- `Textarea` → rôle **`textbox`** standard.

## Recherche debounced — préférer `vi.waitFor` aux fake timers

**Confirmé sur Mantine v9 + vitest 4 + user-event v14 + jsdom** : `vi.useFakeTimers()` casse l'interaction (timeouts, calls perdus) sous toutes les variantes (`{ toFake: [...] }`, `{ shouldAdvanceTime: true }`, `userEvent.setup({ advanceTimers })`).

**Pattern qui marche** : real timers + `vi.waitFor` autour de l'assertion. Le test reste rapide (~1s) et déterministe.

```ts
it("queries the search API only after debounce", async () => {
  const user = userEvent.setup();
  searchCity.mockResolvedValue([{ nom: "Paris", code: "75056" }]);
  renderWithProviders(<ActivityForm />);

  const cityInput = screen.getByRole("combobox", { name: /localisation/i });
  await user.click(cityInput);
  await user.type(cityInput, "Pari");

  // Avant le debounce, le service n'est pas appelé.
  expect(searchCity).not.toHaveBeenCalled();

  // Après debounce — pas besoin de fake timers, vi.waitFor poll jusqu'à 1s par défaut.
  await vi.waitFor(() => {
    expect(searchCity).toHaveBeenCalledTimes(1);
  });
  expect(searchCity).toHaveBeenCalledWith("Pari");
});
```

**Quand quand-même utiliser fake timers** : si on teste un comportement purement temporel sans interaction utilisateur Mantine (par ex. un hook isolé via `renderHook`), `vi.useFakeTimers()` reste OK.

## `Modal` / `Drawer`

Rôle `dialog` (ou `alertdialog` selon le composant). Toujours `findBy*` pour l'ouverture (animation + portal).

```ts
await user.click(screen.getByRole("button", { name: /confirmer/i }));
const dialog = await screen.findByRole("dialog");
expect(within(dialog).getByText(/êtes-vous sûr/i)).toBeInTheDocument();
```

## `useForm` Mantine — ne pas le mocker

`useForm` est un hook interne au composant. **Le tester via le DOM**, pas via mock :

```ts
// MAUVAIS
vi.mock("@mantine/form", () => ({ useForm: () => ({ getInputProps: () => ({}) }) }));

// BON — interagir avec les inputs réels
await user.type(screen.getByLabelText(/email/i), "alice@example.com");
await user.click(screen.getByRole("button", { name: /soumettre/i }));
expect(screen.getByText(/champ requis/i)).toBeInTheDocument(); // si validation déclenchée
```

## Validation et messages d'erreur

Mantine affiche les erreurs de `useForm` dans un élément lié au champ via `aria-describedby`. Recherche :

```ts
// L'erreur est associée au champ via aria-describedby
const emailInput = screen.getByLabelText(/email/i);
expect(emailInput).toHaveAccessibleDescription(/email invalide/i);

// Ou par texte si l'erreur est globale
expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
```

## `Notification` (Snackbar projet)

Le contexte `SnackbarProvider` rend une `Mantine.Notification` qui a le rôle `alert` (par défaut). Pour vérifier qu'elle apparaît, il faut **utiliser `SnackbarProvider` réel** (pas mocker) ou injecter une fake `error`/`success` via `renderWithProviders({ snackbar: { error: vi.fn() } })`.

```ts
// Vérifier l'appel via le mock (recommandé — simple)
const error = vi.fn();
renderWithProviders(<Form />, { snackbar: { error } });
await user.click(screen.getByRole("button", { name: /submit/i }));
await waitFor(() => expect(error).toHaveBeenCalledWith("Une erreur est survenue"));
```

## `MantineProvider` est obligatoire

Sans `MantineProvider`, beaucoup de composants throw au runtime ("MantineProvider was not found in component tree"). C'est pourquoi `renderWithProviders` le wrappe systématiquement.

## Ordre stable des éléments

Mantine peut rendre plusieurs éléments avec le même rôle (ex. plusieurs `combobox` dans un form). Lever l'ambiguïté avec l'option `name` :

```ts
screen.getByRole("combobox", { name: /ville/i });
screen.getByRole("combobox", { name: /catégorie/i });
```

Si l'élément n'a pas de label accessible, c'est un défaut d'a11y du composant — l'ajouter avant de tester.
