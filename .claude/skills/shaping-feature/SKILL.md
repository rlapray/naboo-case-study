---
name: shaping-feature
description: >-
  Cadre une nouvelle feature avant le code : job clair, fit dans la feature map,
  vocabulaire aligné sur l'ubiquitous language, risques UX évidents, découpage si nécessaire.
  Produit un brief d'une page. Utiliser quand l'utilisateur dit « j'ajoute la feature X »,
  « aide-moi à cadrer / shaper cette feature », « est-ce que je découpe », « avant de coder
  ça aide-moi à bien le poser ».
argument-hint: "[description courte de la feature à ajouter]"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebSearch
---

# Shaping Feature

Tu aides l'utilisateur à **cadrer une nouvelle feature** avant qu'il ne code, sur ce petit
case study. Tu produis un **brief d'une page**, pas un audit. Cinq checks, restitution dans
la conversation.

L'ancrage méthodologique est discret :
- Job statement à la [Ulwick / JTBD](https://strategyn.com/jobs-to-be-done/) pour cadrer le pourquoi.
- Sélection ciblée de 3-4 [heuristiques de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/) pertinentes pour le type de feature — pas un balayage des 10.

Contexte fourni : $ARGUMENTS

## Phase 0 — Prérequis

1. Vérifie que `docs/UBIQUITOUS_LANGUAGE.md` existe. Si absent → stoppe et invite à lancer `/ubiquitous-language` d'abord.
2. Vérifie que `docs/features/FEATURES.md` existe. Si absent → stoppe et invite à lancer `/feature-map` d'abord.
3. Si l'un des deux a un snapshot > 3 mois (banner `Snapshot du YYYY-MM-DD`), signale-le mais continue.

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

## Phase 3 — 5 checks rapides (un seul passage)

### 1. Job clair ?
Formule un job statement : _« Quand [contexte], en tant que [acteur], je veux [motivation], pour [résultat]. »_ Si une zone est floue, marque-la `[à clarifier]` plutôt que d'inventer.

### 2. Fit dans la feature map ?
Identifie :
- **Bounded Context** : Catalogue / Identité / Administration.
- **Acteur** : depuis l'ubiquitous language (Particulier, Propriétaire, Admin…).
- **Surface** : `back` / `front` / `both`.
- **Nature** : feature *nouvelle* ou *extension* d'une feature existante (cite-la avec son emplacement dans `FEATURES.<DOMAIN>.md`).
- **Doublons / interférences** potentiels.

### 3. Vocabulaire aligné ?
Confronte les termes utilisés dans la description aux termes canoniques de `UBIQUITOUS_LANGUAGE.md`. Trois listes :
- Termes **alignés** (déjà dans le glossaire).
- Termes **à ajouter** au glossaire (proposition de définition courte).
- **Alias à éviter** détectés (avec le terme canonique à utiliser).

### 4. Risques UX évidents ?
Sélectionne **3-4 heuristiques de Nielsen** pertinentes pour ce type de feature. Indications :
- Formulaire / saisie → #1 visibilité statut, #5 prévention erreurs, #9 récupération erreurs.
- Navigation / découverte → #2 match monde réel, #4 cohérence, #6 reconnaissance vs rappel.
- Action critique / destructive → #3 contrôle utilisateur, #5 prévention erreurs.
- Données affichées → #7 flexibilité, #8 design minimaliste.

Pour chaque heuristique retenue, cite **le risque concret** + **la parade**.

Si l'app tourne sur `:3001` et que la feature étend une UI existante, tu peux ouvrir la page concernée via `chrome-cdp` pour confirmer l'état actuel — uniquement si ça lève vraiment un doute.

### 5. Découpage ?
- Si la feature touche **> 1 page** OU **> 1 modèle Mongoose** OU **> 1 Bounded Context** → propose **2-3 incréments séquencés** (walking skeleton minimal d'abord, enrichissements ensuite).
- Sinon → écris explicitement : `1 PR suffit`.

## Phase 4 — Livrable

Restitue **dans la conversation** (pas de fichier), avec ce template exact :

```markdown
# Shape — <nom de la feature>

**Job** : Quand …, en tant que …, je veux …, pour ….

**Fit** : Domaine `<X>` · Acteur `<Y>` · Surface `<back|front|both>` · `<nouvelle | extension de Z>`.
- (doublons / interférences éventuels)

**Vocabulaire**
- Aligné : `terme1`, `terme2`
- À ajouter à UBIQUITOUS_LANGUAGE.md : `terme3` — _proposition de définition_
- Alias à éviter : `aliasX` → utiliser `termeY`

**Risques UX**
- [Heuristique #N — Nom] : risque concret. Parade : ….

**Découpage suggéré**
1. Incrément 1 — …
2. Incrément 2 — …
(ou : `1 PR suffit`)

**Tests à prévoir** : unit / RTL / e2e selon la pyramide projet (cf. CLAUDE.md).
```

Si l'utilisateur demande explicitement « sauvegarde ce brief », écris-le dans `docs/features/drafts/<slug>.md` (créer le dossier si nécessaire). Sinon, reste dans la conversation.

## Garde-fous

- **Pas d'audit lourd**. Pas de `docs/audits/`. Pas de rapport multi-sections horodaté.
- **Pas de balayage des 10 heuristiques** : 3-4 ciblées max, sinon le bruit noie le signal.
- **Le brief tient en une page écran**. Si ça déborde, c'est un signal qu'il faut découper la feature elle-même — dis-le.
- **Tools larges autorisés** (Agent, WebSearch, chrome-cdp) mais **invoqués à la demande**, jamais en orchestration parallèle systématique.
- **Ne modifie jamais** `docs/UBIQUITOUS_LANGUAGE.md` ni `docs/features/*` toi-même. Tu *proposes* des évolutions ; l'utilisateur les valide.
