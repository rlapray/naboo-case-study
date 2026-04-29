---
name: shaping-feature
description: >-
  Cadre une nouvelle feature avant le code en trois temps : (A) cadrage haut niveau
  (Job, Fit, Vocabulaire, UX, Découpage), (B) grilling socratique des décisions structurantes
  via /grill-me, (C) draft consolidé dans docs/features/drafts/<slug>.md.
  Utiliser quand l'utilisateur dit « j'ajoute la feature X », « aide-moi à cadrer / shaper
  cette feature », « est-ce que je découpe », « avant de coder aide-moi à bien le poser ».
argument-hint: "[description courte de la feature à ajouter]"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebSearch
---

# Shaping Feature

Tu aides l'utilisateur à **cadrer une nouvelle feature** avant qu'il ne code, sur ce petit
case study. Tu produis un **draft d'une page** dans `docs/features/drafts/<slug>.md` —
artefact qui survit à la conversation et alimente l'implémentation.

L'ancrage méthodologique est discret :
- Job statement à la [Ulwick / JTBD](https://strategyn.com/jobs-to-be-done/) pour cadrer le pourquoi.
- Sélection ciblée de 3-4 [heuristiques de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/) pertinentes pour le type de feature — pas un balayage des 10.
- Sections inspirées de [MADR / writing-adrs](.) (Critères, Options écartées, Conséquences ±) pour fossiliser les arbitrages.

Contexte fourni : $ARGUMENTS

## Vue d'ensemble du workflow

Trois phases enchaînées :

1. **Phase A — Cadrage** : 5 checks haut niveau, restitution courte en conversation pour validation.
2. **Phase B — Grilling** : enchaînement automatique sur `/grill-me` pour trancher les décisions structurantes (modèle de données, API, UX critique, etc.). Skippé uniquement si l'utilisateur dit explicitement « pas besoin de grill » ou si la Phase A conclut à `1 PR suffit`.
3. **Phase C — Draft consolidé** : écriture de `docs/features/drafts/<slug>.md` selon le template `references/draft-template.md`. Échappatoire inline si trivial (voir Phase C).

## Phase 0 — Prérequis

1. Vérifie que `docs/UBIQUITOUS_LANGUAGE.md` existe. Si absent → stoppe et invite à lancer `/ubiquitous-language` d'abord.
2. Vérifie que `docs/features/FEATURES.md` existe. Si absent → stoppe et invite à lancer `/feature-map` d'abord.
3. Si l'un des deux a un snapshot > 3 mois (banner `Snapshot du YYYY-MM-DD`), signale-le mais continue.
4. Si un draft existe déjà à `docs/features/drafts/<slug>.md`, demande à l'utilisateur s'il veut **écraser** ou **abandonner**. Pas de merge intelligent — on n'est pas dans le cycle de vie aval.

## Phase 1 — Capter l'intention

Si `$ARGUMENTS` est vide ou trop vague (< 1 phrase utile), pose **une seule question** :
_« Décris la feature en 2-3 phrases : qui l'utilise, ce qu'elle fait, et pourquoi. »_

Sinon, prends ce qui est donné et pars.

## Phase 2 — Lire le contexte juste nécessaire

1. Lis `docs/UBIQUITOUS_LANGUAGE.md` (intégralement — il est court).
2. Déduis le Bounded Context probable (Catalogue / Identité / Administration) depuis la description.
3. Lis le `docs/features/FEATURES.<DOMAIN>.md` correspondant. Ne lis pas les autres sauf si la feature traverse plusieurs domaines.
4. **Si le périmètre est flou** ou la feature peut interférer avec plusieurs domaines, délègue un sous-agent `Explore` avec ce brief court : _« Trouve toutes les features existantes dans ce projet qui touchent à `<concept>` — réponds en moins de 200 mots avec fichiers et numéros de ligne. »_
5. **Si un concept produit/UX inconnu apparaît** dans la description, fais un `WebSearch` ciblé pour clarifier — pas plus.

## Phase A — Cadrage (5 checks rapides)

Restitution courte en conversation pour validation utilisateur **avant** de passer au grilling.

### A1. Job clair ?
Formule un job statement : _« Quand [contexte], en tant que [acteur], je veux [motivation], pour [résultat]. »_ Si une zone est floue, marque-la `[à clarifier]` plutôt que d'inventer.

### A2. Fit dans la feature map ?
- **Bounded Context** : Catalogue / Identité / Administration.
- **Acteur** : depuis l'ubiquitous language.
- **Surface** : `back` / `front` / `both`.
- **Nature** : feature *nouvelle* ou *extension* (cite-la avec son emplacement dans `FEATURES.<DOMAIN>.md`).
- **Doublons / interférences** potentiels.

### A3. Vocabulaire aligné ?
Trois listes : termes **alignés**, termes **à ajouter** (avec définition proposée), **alias à éviter**.

### A4. Risques UX évidents ?
Sélectionne **3-4 heuristiques de Nielsen** pertinentes :
- Formulaire / saisie → #1 visibilité statut, #5 prévention erreurs, #9 récupération erreurs.
- Navigation / découverte → #2 match monde réel, #4 cohérence, #6 reconnaissance vs rappel.
- Action critique / destructive → #3 contrôle utilisateur, #5 prévention erreurs.
- Données affichées → #7 flexibilité, #8 design minimaliste.

Pour chaque heuristique retenue : **risque concret** + **parade**.

Si l'app tourne sur `:3001` et que la feature étend une UI existante, tu peux ouvrir la page concernée via `chrome-cdp` pour confirmer l'état actuel — uniquement si ça lève vraiment un doute.

### A5. Découpage (préliminaire) ?
- Si la feature touche **> 1 page** OU **> 1 modèle Mongoose** OU **> 1 Bounded Context** → propose **2-3 incréments séquencés** (walking skeleton minimal d'abord, enrichissements ensuite).
- Sinon → écris explicitement : `1 PR suffit`.

### Restitution Phase A

Format compact, en conversation :

```markdown
## Cadrage — <nom feature>
**Job** : ...
**Fit** : ...
**Vocabulaire** : aligné / à ajouter / alias à éviter
**Risques UX** : 3-4 bullets
**Découpage préliminaire** : N incréments OU 1 PR suffit
```

Demande : _« Ce cadrage te paraît juste ? On enchaîne sur le grilling pour trancher les décisions structurantes ? »_

## Phase B — Grilling

**Si l'utilisateur valide le cadrage** ET qu'on n'est pas dans le cas trivial (`1 PR suffit` ET feature ne touche aucun modèle de données nouveau) :

→ **Invoque `/grill-me`** sur le cadrage produit. Le grilling produit une séquence Q1…QN avec des choix tranchés.

**Si l'utilisateur dit explicitement « pas besoin de grill »** ou que la feature est triviale, skippe la Phase B et passe directement à Phase C (avec échappatoire inline si possible).

Pendant le grilling, tu peux découvrir des concepts qui modifient le cadrage initial (vocabulaire à ajouter, risque UX manqué…). C'est normal — le draft consolide le cadrage **après** grilling.

## Phase C — Draft consolidé

### Cas standard : écrire le draft

Charge le template depuis `.claude/skills/shaping-feature/references/draft-template.md` et remplis-le avec :

- Le **cadrage Phase A** (Job, Fit, Vocabulaire, UX, Découpage).
- Les **décisions tranchées** issues du grilling, dans le tableau `Q# | Sujet | Choix | Justification | Alternatives évaluées`. Les alternatives écartées vont sous `<details>` HTML pour audit ultérieur sans alourdir la lecture.
- Le **contrat technique** émergent (modèle de données, API, couplages cross-contexts).
- Le **plan de vérification** (commandes à lancer, parcours manuel, métrique à observer).
- Métadonnées : `Statut: Draft`, `Date` du jour, `Auteur` depuis `git config user.name`.

Écris dans `docs/features/drafts/<slug>.md` (slug en kebab-case, dérivé du nom de la feature). Crée le dossier si nécessaire.

### Cas trivial : restitution inline

**Conditions cumulées** : Phase A conclut `1 PR suffit` ET grilling skippé OU producteur de ≤ 2 décisions.

→ Pas de fichier. Restitue dans la conversation un brief compact reprenant Job + Fit + Vocabulaire + Risques + Tests.

### Pont vers `/writing-adrs`

Si le grilling a produit une **décision architecturale durable** (typiquement : choix de modèle de données, choix de pattern de pagination, couplage entre Bounded Contexts, choix d'un contrat d'API), propose à la fin :

> _« La décision Q<N> sur `<sujet>` est architecturale et survivra à cette feature. Veux-tu la promouvoir en ADR via `/writing-adrs` ? Le draft pointera vers l'ADR dans la section Liens. »_

Ne le propose **pas** pour les décisions purement UX ou produit (ex. emplacement d'un bouton, copy d'une modale).

## Garde-fous

- **Pas d'audit lourd**. Pas de `docs/audits/`. Pas de rapport multi-sections horodaté.
- **Pas de balayage des 10 heuristiques** : 3-4 ciblées max.
- **Le draft tient en une page écran** (template `references/draft-template.md`). Si ça déborde, c'est un signal qu'il faut découper la feature elle-même — dis-le.
- **Tools larges autorisés** (Agent, WebSearch, chrome-cdp) mais **invoqués à la demande**, jamais en orchestration parallèle systématique.
- **Ne modifie jamais** `docs/UBIQUITOUS_LANGUAGE.md` ni `docs/features/FEATURES.*.md` toi-même. Tu *proposes* des évolutions dans le draft ; l'utilisateur les valide et les intègre.
- **Statut figé à `Draft`**. Le cycle de vie aval (validation, implémentation, archivage, fraîcheur) n'est pas du ressort de ce skill — un autre process s'en chargera.
