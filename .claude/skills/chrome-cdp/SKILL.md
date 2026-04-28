---
name: chrome-cdp
description: Interagir avec une session Chrome locale (uniquement sur approbation explicite de l'utilisateur après avoir demandé à inspecter, déboguer ou interagir avec une page ouverte dans Chrome)
---

# Chrome CDP

CLI Chrome DevTools Protocol léger. Se connecte directement via WebSocket — sans Puppeteer, fonctionne avec 100+ onglets, connexion instantanée.

## Prérequis

- Chrome (ou Chromium, Brave, Edge, Vivaldi) avec le débogage distant activé : ouvrir `chrome://inspect/#remote-debugging` et activer le switch
- Node.js 22+ (utilise le WebSocket intégré)
- Si le `DevToolsActivePort` de ton navigateur est dans un emplacement non standard, définir `CDP_PORT_FILE` avec son chemin complet

## Commandes

Toutes les commandes utilisent `scripts/cdp.mjs`. Le `<cible>` est un préfixe **unique** de targetId issu de `list` ; copier le préfixe complet affiché dans la sortie `list` (par exemple `6BE827FA`). La CLI rejette les préfixes ambigus.

### Lister les pages ouvertes

```bash
scripts/cdp.mjs list
```

### Capturer une capture d'écran

```bash
scripts/cdp.mjs shot <cible> [fichier]    # défaut : screenshot-<cible>.png dans le répertoire runtime
```

Capture **uniquement le viewport**. Faire défiler avec `eval` si du contenu est en dessous de la ligne de flottaison. La sortie inclut le DPR de la page et un indice de conversion de coordonnées (voir **Coordonnées** ci-dessous).

### Arbre d'accessibilité

```bash
scripts/cdp.mjs snap <cible>
```

### Évaluer du JavaScript

```bash
scripts/cdp.mjs eval <cible> <expr>
```

> **Attention :** éviter la sélection par index (`querySelectorAll(...)[i]`) sur plusieurs appels `eval` quand le DOM peut changer entre eux (ex : après avoir cliqué sur Ignorer, les indices de carte changent). Collecter toutes les données en un seul `eval` ou utiliser des sélecteurs stables.

### Autres commandes

```bash
scripts/cdp.mjs html    <cible> [sélecteur]   # HTML complet de la page ou d'un élément
scripts/cdp.mjs nav     <cible> <url>          # naviguer et attendre le chargement
scripts/cdp.mjs net     <cible>                # entrées de timing réseau
scripts/cdp.mjs click   <cible> <sélecteur>    # cliquer sur un élément par sélecteur CSS
scripts/cdp.mjs clickxy <cible> <x> <y>        # cliquer aux coordonnées CSS en pixels
scripts/cdp.mjs type    <cible> <texte>         # Input.insertText au focus actuel ; fonctionne dans les iframes cross-origin contrairement à eval
scripts/cdp.mjs loadall <cible> <sélecteur> [ms]  # cliquer sur "charger plus" jusqu'à disparition (délai par défaut 1500ms)
scripts/cdp.mjs evalraw <cible> <méthode> [json]  # commande CDP brute
scripts/cdp.mjs open    [url]                  # ouvrir un nouvel onglet (chacun déclenche une invite Allow)
scripts/cdp.mjs stop    [cible]                # arrêter le(s) daemon(s)
```

## Coordonnées

`shot` sauvegarde une image à la résolution native : pixels image = pixels CSS × DPR. Les événements CDP Input (`clickxy` etc.) prennent des **pixels CSS**.

```
px CSS = pixels image screenshot / DPR
```

`shot` affiche le DPR de la page courante. Typique Retina (DPR=2) : diviser les coordonnées screenshot par 2.

## Conseils

- Préférer `snap --compact` à `html` pour la structure de la page.
- Utiliser `type` (pas eval) pour saisir du texte dans les iframes cross-origin — `click`/`clickxy` pour donner le focus d'abord, puis `type`.
- Chrome affiche une modale "Allow debugging" une fois par onglet au premier accès. Un daemon en arrière-plan maintient la session active, les commandes suivantes n'ont plus besoin d'approbation. Les daemons s'arrêtent automatiquement après 20 minutes d'inactivité.
