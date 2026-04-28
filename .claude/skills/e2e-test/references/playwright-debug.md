# Debug Playwright

Source : `playwright.dev/docs/debug`, `trace-viewer`, `codegen`.

## Arbre de décision

```
Test échoue / flake ?
├── 1. UI mode      → npm run e2e:ui          (watch + time-travel — défaut)
├── 2. HTML report  → npm run e2e:report      (post-mortem rapide)
├── 3. Trace viewer → ouvrir trace.zip        (analyse fine si la trace est dispo)
├── 4. Inspector    → npm run e2e:debug       (step-by-step si rien d'autre n'aide)
└── 5. Codegen      → npm run e2e:codegen     (régénérer les locators d'une zone)
```

## 1. UI mode (à privilégier)

```bash
cd front-end && npm run e2e:ui
```

- Time-travel : voir le DOM à chaque action.
- Watch mode : modifier le test → relance auto.
- Pick locator : cliquer sur un élément → Playwright propose le bon locator.

## 2. HTML report (post-mortem)

```bash
cd front-end && npm run e2e:report
```

Affiche les tests échoués avec stacktrace, screenshot et trace cliquable.

## 3. Trace viewer

Activé en config via `trace: "on-first-retry"`. À l'échec, un `trace.zip` est produit.

```bash
npx playwright show-trace path/to/trace.zip
```

À lire :
- **Timeline** : quand chaque action a eu lieu.
- **Action / Before / After / Locator** : DOM avant et après chaque step.
- **Network** : requêtes HTTP avec payloads.
- **Console** : logs et erreurs JS.
- **Source** : code du test qui correspond à l'action sélectionnée.

## 4. Inspector (step-by-step)

```bash
cd front-end && npm run e2e:debug
```

Pause à chaque action, permet d'inspecter le DOM en live et de tester des locators dans la console.

Ajouter un point d'arrêt programmatique :

```ts
await page.pause(); // s'arrête ici en mode debug
```

## 5. Codegen (regénérer des locators)

```bash
cd front-end && npm run e2e:codegen
```

Ouvre un navigateur instrumenté qui transcrit chaque action en code Playwright avec des locators role-first. Utile :
- Pour démarrer un nouveau test sur un parcours UI complexe.
- Pour récupérer un locator stable quand le tien casse à chaque rebuild.

## Exécutions ciblées

```bash
npm run e2e -- e2e/signin.spec.ts                      # un fichier
npm run e2e -- -g "se connecter"                       # tests dont le titre matche
npm run e2e -- --headed                                # voir le navigateur
npm run e2e -- --repeat-each=3                         # rejouer 3× pour détecter du flake
npm run e2e -- --workers=1                             # exécution sérielle (debug d'isolation)
```

## Diagnostic des flakes courants

| Symptôme | Cause probable | Fix |
|---|---|---|
| « Element not found » alors qu'il existe | Action lancée avant le rendu | Remplacer le selector manuel par `getByRole`, l'auto-wait gère |
| Test passe en `--workers=1`, échoue en parallèle | Données partagées entre tests | Identifiant unique par test, isolation backend |
| Test passe en `--headed`, échoue en headless | Différence de viewport / cookies | Vérifier `devices["Desktop Chrome"]`, fixer le viewport |
| Click ignoré sur un bouton visible | Élément en transition (animation) | Désactiver les animations en CSS de test |
| Réseau lent en CI | Timeout trop court | Augmenter ponctuellement `{ timeout: 30_000 }` sur l'assertion concernée |
