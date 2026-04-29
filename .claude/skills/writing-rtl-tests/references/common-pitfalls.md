# Anti-patterns RTL — 15 erreurs courantes

Source : Kent C. Dodds — *Common Mistakes with React Testing Library* (https://kentcdodds.com/blog/common-mistakes-with-react-testing-library).

Pour chaque erreur : la version mauvaise, la version corrigée.

## 1. Ne pas utiliser les ESLint plugins

```sh
pnpm add -D eslint-plugin-testing-library eslint-plugin-jest-dom
```

Ils détectent automatiquement la majorité des erreurs ci-dessous.

## 2. Nommer la variable `wrapper`

```ts
// MAUVAIS
const wrapper = render(<Example />);

// BON — pas de variable, ou `view`
render(<Example />);
const view = render(<Example />);
```

## 3. Appeler `cleanup` manuellement

`@testing-library/react` ≥ 9 nettoie automatiquement après chaque test (auto-import de `cleanup` dans le runner). **Ne jamais** appeler `cleanup` ni le mettre en `afterEach`.

## 4. Ne pas utiliser `screen`

```ts
// MAUVAIS
const { getByRole } = render(<Form />);
getByRole("button");

// BON
render(<Form />);
screen.getByRole("button");
```

## 5. Asserts sans `jest-dom`

```ts
// MAUVAIS
expect(button.disabled).toBe(true);
expect(input.value).toBe("alice");

// BON
expect(button).toBeDisabled();
expect(input).toHaveValue("alice");
```

## 6. Wrapper inutile dans `act()`

```ts
// MAUVAIS — render et userEvent sont déjà wrappés
await act(async () => {
  render(<Form />);
});
await act(async () => {
  await user.click(button);
});

// BON
render(<Form />);
await user.click(button);
```

## 7. Query par testid quand role/text marche

```ts
// MAUVAIS
screen.getByTestId("submit-button");

// BON
screen.getByRole("button", { name: /enregistrer/i });
```

## 8. `container.querySelector`

```ts
// MAUVAIS
const { container } = render(<Form />);
container.querySelector(".error-message");

// BON
screen.getByRole("alert");
screen.getByText(/erreur/i);
```

## 9. Pas de `userEvent`

```ts
// MAUVAIS
fireEvent.change(input, { target: { value: "alice" } });
fireEvent.click(button);

// BON
const user = userEvent.setup();
await user.type(input, "alice");
await user.click(button);
```

## 10. `queryBy*` pour asserter la présence

```ts
// MAUVAIS
expect(screen.queryByRole("alert")).toBeInTheDocument();

// BON
expect(screen.getByRole("alert")).toBeInTheDocument();
// ou pour de l'async :
expect(await screen.findByRole("alert")).toBeInTheDocument();
```

`queryBy*` retourne `null` au lieu de throw — donc `expect(null).toBeInTheDocument()` produit un message d'erreur incompréhensible. Utiliser `queryBy*` **uniquement** pour asserter l'absence.

## 11. `waitFor` pour attendre un élément

```ts
// MAUVAIS
await waitFor(() => screen.getByRole("alert"));

// BON
await screen.findByRole("alert");
```

## 12. `waitFor` avec callback vide

```ts
// MAUVAIS
await waitFor(() => {});
expect(mock).toHaveBeenCalled();

// BON
await waitFor(() => {
  expect(mock).toHaveBeenCalled();
});
```

## 13. Plusieurs assertions dans `waitFor`

```ts
// MAUVAIS
await waitFor(() => {
  expect(mockA).toHaveBeenCalled();
  expect(mockB).toHaveBeenCalled();
});

// BON — un waitFor par assertion
await waitFor(() => expect(mockA).toHaveBeenCalled());
expect(mockB).toHaveBeenCalled();
```

`waitFor` retry tant que la callback throw — chaque retry ré-exécute toutes les assertions. Avec plusieurs, le timing devient imprévisible.

## 14. Side-effect dans `waitFor`

```ts
// MAUVAIS
await waitFor(() => {
  fireEvent.click(button);
  expect(mock).toHaveBeenCalled();
});

// BON — side-effect AVANT, assertion DANS
await user.click(button);
await waitFor(() => expect(mock).toHaveBeenCalled());
```

## 15. `getBy*` sans assertion

```ts
// MAUVAIS — ne teste rien explicitement, repose sur le throw
screen.getByRole("alert");

// BON
expect(screen.getByRole("alert")).toBeInTheDocument();
```

Bien que `getBy*` throw si absent, expliciter l'assertion rend l'intention claire et évite que `eslint-plugin-testing-library` (`prefer-explicit-assert`) hurle.

## Bonus projet : ne pas mocker les hooks internes

```ts
// MAUVAIS — le test ne prouve plus que le composant câble bien le hook
vi.mock("@/hooks/useCreateActivity", () => ({
  useCreateActivity: () => ({ create: vi.fn(), isSubmitting: false }),
}));

// BON — mocker le service que le hook appelle, garder le hook réel
vi.mock("@/services/api", () => ({
  api: { createActivity: vi.fn().mockResolvedValue({ id: "a1" }) },
}));
```
