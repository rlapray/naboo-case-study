# Principes e2e (agnostique du framework)

Sources : Martin Fowler — *The Practical Test Pyramid*, Playwright official best practices, synthèses 2026 sur les bonnes pratiques e2e.

## 1. Placement dans la pyramide de tests

L'e2e occupe le **sommet** de la pyramide : peu nombreux, lents, coûteux à maintenir. Cible **5–10 %** du suite de tests.

Conséquence : chaque e2e doit gagner sa place. Un parcours testable plus bas (unitaire, intégration) **doit** y rester.

```
                    ▲ e2e (5–10%)
                  /   \    parcours business critiques uniquement
                 /     \
                /───────\  intégration (15–25%)
               /         \
              /───────────\ unitaires (70–80%)
```

## 2. Tester des parcours utilisateur, pas l'implémentation

**À tester** : un scénario que l'utilisateur réalise réellement.
- « Un utilisateur s'inscrit, se connecte, complète son profil. »
- « Un visiteur recherche une activité, l'ajoute au panier, paie. »

**À ne pas tester en e2e** :
- Logique conditionnelle interne (`si X alors méthode A appelle méthode B`).
- Edge cases déjà couverts par l'unitaire (validation regex, formats d'erreur).
- Détails d'implémentation (noms de fonctions, structure DOM, classes CSS).

Règle pratique : si on peut renommer une variable interne sans casser le test, le test est correctement orienté parcours.

## 3. Isolation et déterminisme des données

L'instabilité des e2e vient à 80 % des données. Trois règles :

1. **Chaque test démarre dans un état connu.** Soit seed propre, soit setup explicite dans `beforeEach`. Jamais d'hypothèse sur l'état laissé par un test précédent.
2. **Les tests ne se partagent pas l'état.** Un test ne peut pas dépendre qu'un autre tourne d'abord. L'ordre d'exécution doit être totalement libre.
3. **Reset entre tests.** Soit nettoyage actif (truncate / restore snapshot), soit isolation par contexte navigateur (Playwright le fait par défaut côté front).

Sans ces règles, on obtient des tests qui passent en local et flakent en CI — ou inversement.

## 4. Black-box : ce que l'utilisateur voit

Un e2e traite l'app comme une boîte noire : entrée = clics + saisies utilisateur, sortie = ce qui s'affiche. Toute fenêtre vers l'intérieur (mocks de méthodes internes, accès direct au store, vérification de logs) est un **anti-pattern**.

Corollaire pour les locators : on cherche les éléments comme un humain — par rôle (`button`, `link`), par label (`Email`), par texte visible. Pas par classe CSS générée ni par chemin DOM.

## 5. Sources de flakiness à connaître

| Source | Symptôme | Mitigation |
|---|---|---|
| Timing | Test passe en local, échoue en CI | Web-first assertions (retry intégré), jamais de `setTimeout` |
| Animations | Click sur un élément en transition | `prefers-reduced-motion` ou `disable_animations` côté CSS de test |
| Popups inattendues (cookies, notifs) | Click bloqué | Setup déterministe (cookie d'opt-out posé avant `goto`) |
| Données polluées | Un test réussi pollue les suivants | Reset / seed par test, contexte navigateur isolé |
| Tiers externes (CDN, analytics) | Failures aléatoires | Mock du tiers ; ne pas le tester |

## 6. Mocks : règle simple

- **Mock des tiers externes** que tu ne contrôles pas : Stripe sandbox, analytics, services partenaires.
- **Pas de mock des services internes** : c'est précisément ce que l'e2e valide. Si ton API est trop instable pour un e2e, c'est un signal — investis dans un environnement de test stable, pas dans des mocks qui mentent.

## 7. Anti-patterns récurrents

- ❌ Test qui dépend qu'un autre tourne d'abord (chain of tests).
- ❌ Sleep fixe (`await sleep(2000)`) pour « être tranquille ».
- ❌ Selector CSS dépendant de la structure DOM (`.MuiBox-root > div:nth-child(3)`).
- ❌ Re-tester un edge case déjà couvert en unitaire.
- ❌ Test qui modifie le DOM via JS injection au lieu de simuler une action utilisateur.
- ❌ Suite de 200 tests e2e — le coût de maintenance dépasse la valeur.

## 8. Critères de qualité d'un e2e

Avant de rendre un test, vérifier :

- ✅ Le titre du test décrit un **résultat business** (« l'utilisateur peut se connecter »), pas une action technique (« click sur le bouton submit »).
- ✅ Le test est compréhensible par un PO en moins de 30 secondes.
- ✅ Le test passe 3× d'affilée sans modification.
- ✅ Le test échoue de façon **utile** quand on casse volontairement la feature (message d'erreur clair, screenshot/trace exploitable).
- ✅ Aucun autre test n'a besoin d'être lancé avant ou après.
