# `userEvent` v14 — Patterns

Source : https://testing-library.com/docs/user-event/intro

## Setup obligatoire

```ts
import userEvent from "@testing-library/user-event";

it("submits the form", async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyForm />);

  await user.type(screen.getByLabelText(/email/i), "alice@example.com");
  await user.click(screen.getByRole("button", { name: /envoyer/i }));
  // ...
});
```

**Règles :**
- `userEvent.setup()` **dans chaque test** (pas en `beforeEach` global, sauf besoin spécifique).
- **Toutes les méthodes sont `async`** : toujours `await`.
- `user.click`, `user.type`, `user.keyboard`, `user.selectOptions`, `user.upload`, `user.tab`, `user.hover`, `user.clear`.

## Pourquoi pas `fireEvent` ?

`fireEvent` dispatch un événement DOM brut. `userEvent` simule l'**interaction complète** :
- `user.type` → focus + keydown + keypress + input + keyup pour chaque caractère.
- `user.click` → checks de visibilité + pointerdown + mousedown + focus + pointerup + mouseup + click.

Conséquence : `userEvent` détecte les bugs réels (input désactivé, élément caché, `pointer-events: none`), `fireEvent` non.

## Setup avec fake timers

`userEvent` v14 marche **out-of-the-box** avec `vi.useFakeTimers()` à condition de configurer `setup` avec `advanceTimers`:

```ts
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it("debounces the city search", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  renderWithProviders(<ActivityForm />);

  await user.type(screen.getByLabelText(/ville/i), "Pari");
  expect(global.fetch).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(300);
  expect(global.fetch).toHaveBeenCalledOnce();
});
```

## Async patterns

| Situation | Bonne pratique |
|---|---|
| Élément qui apparaît après une action | `await screen.findByRole(...)` |
| Élément qui disparaît | `await waitForElementToBeRemoved(() => screen.getByRole(...))` |
| État UI à attendre (pas un élément) | `await waitFor(() => expect(...).toBe(...))` (1 seul `expect`, pas de side-effect) |

```ts
// MAUVAIS
await waitFor(() => {
  expect(screen.getByRole("alert")).toBeInTheDocument();
});

// BON
expect(await screen.findByRole("alert")).toBeInTheDocument();
```

## Snippets fréquents

```ts
// Formulaire complet
const user = userEvent.setup();
await user.type(screen.getByLabelText(/nom/i), "Atelier poterie");
await user.type(screen.getByLabelText(/prix/i), "50");
await user.click(screen.getByRole("button", { name: /créer/i }));

// Sélectionner dans un combobox
await user.click(screen.getByRole("combobox", { name: /ville/i }));
await user.click(await screen.findByRole("option", { name: /paris/i }));

// Tab navigation
await user.tab();
expect(screen.getByLabelText(/email/i)).toHaveFocus();

// Clavier
await user.keyboard("{Enter}");
await user.keyboard("{Escape}");
```
