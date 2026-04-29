# Playbook — tuer un mutant survivant

Pour chaque mutator courant : exemple plausible dans `src/server/**` ou `src/hooks/**`, mutation injectée, **assertion qui la tue**. Toujours cibler le **comportement observable** changé, jamais une tautologie.

## ConditionalExpression

Source :

```ts
if (cursor && cursor.length > 0) {
  query.where("_id").gt(cursor);
}
```

Mutations :

- `if (cursor && cursor.length > 0)` → `if (true)` (toujours filtrer)
- → `if (false)` (jamais filtrer)

Assertion qui tue :

```ts
it("does not filter when cursor is undefined", async () => {
  const result = await listActivities({ cursor: undefined, limit: 10 });
  expect(result.items).toHaveLength(10); // sans cursor on a tout
});

it("filters strictly above the cursor", async () => {
  const result = await listActivities({ cursor: "65a...", limit: 10 });
  expect(result.items.every((i) => i._id > "65a...")).toBe(true);
});
```

## EqualityOperator

Source :

```ts
if (user.role === "admin") return next();
```

Mutations :

- `===` → `!==`

Assertion qui tue (couvre les deux côtés du prédicat) :

```ts
it("calls next when role is admin", async () => { /* ... */ });
it("rejects when role is user", async () => {
  const res = await callHandler({ user: { role: "user" } });
  expect(res.status).toBe(403);
});
```

## ArithmeticOperator

Source :

```ts
const skip = (page - 1) * pageSize;
```

Mutations :

- `*` → `/`, `-` → `+`

Assertion qui tue :

```ts
it("skips zero items on page 1", () => {
  expect(buildSkip({ page: 1, pageSize: 20 })).toBe(0);
});
it("skips pageSize items on page 2", () => {
  expect(buildSkip({ page: 2, pageSize: 20 })).toBe(20);
});
it("skips 2 * pageSize on page 3", () => {
  expect(buildSkip({ page: 3, pageSize: 20 })).toBe(40);
});
```

(Boundaries multiples ferment l'arithmétique.)

## LogicalOperator

Source :

```ts
const visible = isPublished && !isDraft;
```

Mutations :

- `&&` → `||`

Assertion qui tue :

```ts
it("hides drafts even if published", () => {
  expect(isVisible({ isPublished: true, isDraft: true })).toBe(false);
});
```

(Avec `&&` le résultat est `false`, avec `||` il devient `true` — le test détecte la mutation.)

## BooleanLiteral

Source :

```ts
return { ok: true, body };
```

Mutations :

- `true` → `false`

Assertion qui tue :

```ts
expect(result.ok).toBe(true); // pas toBeTruthy()
```

`toBeTruthy()` peut laisser passer la mutation si la valeur reste truthy par ailleurs.

## OptionalChaining

Source :

```ts
const city = address?.city ?? "unknown";
```

Mutations :

- `address?.city` → `address.city` (crash sur `undefined`)
- `?? "unknown"` → suppression

Assertion qui tue :

```ts
it("returns 'unknown' when address is undefined", () => {
  expect(formatCity({ address: undefined })).toBe("unknown");
});
```

## BlockStatement

Source :

```ts
function validate(input: Input) {
  if (!input.name) {
    throw new ValidationError("name required");
  }
  return input;
}
```

Mutations :

- vide le block du `if` → jamais throw

Assertion qui tue :

```ts
it("throws when name is missing", () => {
  expect(() => validate({ name: "" })).toThrow(ValidationError);
});
```

## ArrayDeclaration

Source :

```ts
const ALLOWED = ["read", "write"];
```

Mutations :

- `["read", "write"]` → `[]`

Assertion qui tue :

```ts
expect(canPerform("write")).toBe(true); // forcerait `[]` à fail
```

## StringLiteral (souvent à désactiver)

Source :

```ts
logger.info("user.created", { id });
```

Mutation :

- `"user.created"` → `""`

C'est un log, pas un comportement. **Annoter** :

```ts
// Stryker disable next-line StringLiteral: log key, no observable behavior
logger.info("user.created", { id });
```

Si en revanche la chaîne est un identifiant de canal Kafka, un slug d'URL, une clé i18n liée au DOM testé : ne pas désactiver, asserter dessus.

## Pièges spécifiques au stack

### Vitest

- **Timeouts qui dérivent**. Avec `coverageAnalysis: perTest`, Stryker ré-exécute des sous-ensembles ; un test à 5 s peut bloquer 100 mutants. Tightener `testTimeout: 2000` quand possible.
- **In-source tests** (Vitest feature) : préfixer le block avec `// Stryker disable all` pour ne pas mutater le code de test embarqué.
- **`vi.useFakeTimers()`** : si oublié de `vi.useRealTimers()` en cleanup, mutation amplifie le leak entre mutants.

### Mantine / RTL

- Mutants `StringLiteral` sur labels Mantine (`<TextInput label="Email" />`) → souvent équivalents si le test ne cite pas le label exact. Préférer `getByLabelText("Email")` au lieu de `getByPlaceholderText` pour rendre la mutation détectable.
- Mutants `BlockStatement` sur callbacks `onChange` → s'assurer que le test fait `await user.type(...)` puis assert la valeur, pas juste le rendu initial.
- Snapshots : aveugles aux mutants qui ne changent pas le DOM. Préférer assertions ciblées (déjà la convention `writing-rtl-tests`).

### Mongoose

- **Defaults d'enum / schema** : `default: "draft"` → Stryker peut tester la mutation. Si le test ne crée pas explicitement un doc sans valeur, le mutant survit. Soit ajouter le test (`expect(doc.status).toBe("draft")` à la création par défaut), soit exclure les fichiers `*.schema.ts` du `mutate` (déjà fait dans la config par défaut).
- **`mongodb-memory-server`** : le boot prend ~3 s. Avec `concurrency: 4`, 4 instances en parallèle = 12 s + RAM. Si la machine peine, baisser à 2.

### Code généré / glue

- `getServerSideProps` qui appelle un service : muter le service, pas la page. Si la page n'a pas d'autre logique, l'exclure du `mutate`.
- `pages/api/**` thin handlers (parse → service → respond) : mutations du service couvrent l'essentiel, mais garder les handlers dans le scope car ils contiennent le mapping d'erreurs HTTP (souvent sous-testé).

## Anti-patterns à éviter (gros rouge)

- **Assertion ajoutée pour kill un mutant sans signification métier** : `expect(result).toBeDefined()`, `expect(spy).toHaveBeenCalled()` sans matcher d'argument.
- **Affaiblir le `mutate` glob pour faire monter le score** : équivalent à supprimer un test rouge pour rendre la suite verte.
- **`// Stryker disable all` sans justification** : interdit. Toujours nommer le mutator et la raison.
- **Tuer un mutant en dupliquant la logique du SUT dans le test** (oracle problem) : si le test recalcule la même expression, la mutation passe les deux côtés.
