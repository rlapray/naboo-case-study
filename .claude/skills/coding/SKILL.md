---
name: coding
description: >-
  Implémente une feature en TDD orchestré multi-agents. Accepte 3 voies d'entrée :
  draft consolidé `docs/features/drafts/<slug>.md` (issu de /shaping-feature), brief
  inline du template « # Shape — », ou brief court pour feature simple. Si la demande
  est incomplète, propose /shaping-feature et s'arrête. Découpe la feature en tâches
  avec dépendances et complexité (classification automatique haiku/sonnet/opus),
  exécute en Red-Green-Refactor (Chicago bottom-up par défaut, London si très visuel),
  délègue les tests aux skills writing-unit-tests / writing-rtl-tests / e2e-test,
  debug rapide via chrome-cdp, quality gate `pnpm verify` + `pnpm verify:test` avant
  commit, rédige un rapport timestampé dans `docs/sessions/`. À utiliser quand
  l'utilisateur dit « implémente », « code cette feature », « passe à l'implem »,
  « /code », typiquement après /shaping-feature.
argument-hint: "[draft path | brief inline | brief court | --worktree | --no-mutation]"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, TaskCreate, TaskList, TaskUpdate, TaskGet, TaskOutput, SendMessage
---

# Coding — Orchestrateur d'implémentation TDD multi-agents

Tu pilotes l'implémentation d'une feature de bout en bout. Tu **n'écris pas tout toi-même** : tu découpes en tâches, tu délègues aux sous-agents avec le bon skill et le bon modèle, tu synchronises, tu garantis le quality gate, tu produis un rapport.

Tu es **l'agent principal qui mange les autres** : contexte feature porté par toi, sous-agents avec briefing minimal, tool result structuré en retour. Pas de chaînage sous-agent → sous-agent (interdit par le harness).

Argument fourni : `$ARGUMENTS`

---

## Phase 0 — Ingestion du brief (4 voies)

Détecte la voie d'entrée **sans invoquer aucun skill amont** (périmètre serré : tu proposes, l'utilisateur lance lui-même).

| Détection | Voie | Action |
|---|---|---|
| Chemin vers `docs/features/drafts/*.md` | A — Draft consolidé | Lis le draft, **skippe Phase 1** (grilling déjà fait), va en Phase 2 |
| Texte commençant par `# Shape —` | B — Brief inline non grillé | Va en Phase 1 (proposition de grill) |
| ≤ 3 phrases descriptives, verbe + objet, pas de question | C — Brief court (feature simple) | Si trivialement simple : Phase 2 directe ; sinon suggère `/shaping-feature` puis stoppe |
| Vide, juste « ajoute X », question floue | D — Demande incomplète | **Stoppe** : « la demande me paraît incomplète, lance `/shaping-feature` pour cadrer ; reviens avec le draft `docs/features/drafts/<slug>.md` » |

Pour les voies A/B/C, lis ensuite :
- `docs/UBIQUITOUS_LANGUAGE.md` (court) pour aligner le vocabulaire
- `docs/features/FEATURES.<DOMAIN>.md` selon le bounded context identifié dans le brief

**Ne court-circuite jamais le cadrage par paresse.** Si la voie n'est pas A et que le brief manque d'éléments structurants (acteur, motivation, surface back/front, découpage), repasse en voie D et propose `/shaping-feature`.

---

## Phase 1 — Grill-me (conditionnelle, jamais automatique)

Skip si :
- Voie A (grilling déjà fait dans `/shaping-feature`)
- Voie C (feature triviale)
- L'utilisateur a explicitement décliné

Sinon (voie B avec décisions ouvertes) : **propose** `/grill-me` à l'utilisateur. Il le lance lui-même et revient avec les décisions tranchées (typiquement consolidées dans le brief de la Phase 2 ou dans un ADR).

---

## Phase 2 — Découpage TDD en tâches

Produit un **plan markdown** ET un tracking live via `TaskCreate`.

### Choix du chemin scratch (multi-incréments vs simple)

Lis la section « Découpage » du draft (voie A) ou identifie les incréments dans le brief (voies B/C).

- **Plusieurs incréments décrits** (la session ne couvre qu'un sous-ensemble — ex. incrément 1 sur 3) :
  - Identifie l'identifiant de l'incrément traité (ex. `increment-1`, `increment-2`).
  - Le **plan détaillé** de la session courante vit sous `.claude/scratch/coding/<slug>/<increment-id>/` :
    - `plan.md`
    - `escalations/<task-id>.md`
  - La **trajectoire** des incréments restants (esquisses légères, voir sous-section ci-dessous) vit dans un fichier transverse au feature : `.claude/scratch/coding/<slug>/trajectory.md`.
  - Cela isole le scratch de la session courante des futures sessions sur les autres incréments — pas de collision, pas d'écrasement — tout en persistant le travail mental qui a été fait pour la suite.
- **Un seul incrément** (feature mono-bloc, brief court voie C, ou tous les incréments couverts en une seule session) :
  - Scratch plat sous `.claude/scratch/coding/<slug>/` (`plan.md`, `escalations/`).
  - Pas de `trajectory.md` (rien de futur à esquisser).

Annonce le chemin scratch retenu à l'utilisateur dans le plan que tu présenteras en Phase 3 (« scratch sous `<slug>/increment-1/` car incrément 1 sur 3 ; trajectoire des incréments 2 et 3 dans `<slug>/trajectory.md` »).

### Trajectoire — esquisses des incréments restants

Au premier `/coding` sur un draft multi-incréments, tu produis **deux artefacts distincts**, de granularité différente :

1. **Plan détaillé** de l'incrément courant (`<slug>/<increment-id>/plan.md`) — tâches numérotées, complexité, modèle suggéré, dépendances, fichiers cibles. C'est le document que tu présenteras pour validation Phase 3.

2. **Trajectoire** des incréments restants (`<slug>/trajectory.md`) — une esquisse légère par incrément non couvert par cette session :
   - Un titre par incrément (`## Incrément <N> — <nom court>`).
   - 3-8 bullets sur ce qui doit être fait : tâches imaginées, fichiers principaux pressentis, points d'attention, nouvelles décisions à trancher si tu en pressens.
   - **Pas** de classification de complexité, pas de modèle suggéré, pas d'estimation. Ce n'est pas un plan, c'est une note brouillon pour l'agent suivant.
   - En tête : un encart `> Esquisses brouillon produites par /coding lors de la session <date>. À réviser au prochain lancement — l'agent suivant peut tout réécrire.`

Au lancement suivant (autre session sur le même draft, autre incrément) :
- **Lis** `trajectory.md` pour récupérer l'esquisse de l'incrément que tu vas implémenter.
- **Lis** le ou les rapports précédents (`docs/sessions/<...>.md`) pour le contexte d'exécution déjà acquis (décisions tranchées, escalations résolues).
- **Produis** ton plan détaillé qui peut **diverger librement** de l'esquisse — le but de l'esquisse était de te donner un point de départ, pas un contrat. Dans la présentation Phase 3 à l'utilisateur, signale les écarts notables vs ce qui était imaginé (« la trajectoire envisageait T2 en sonnet, je passe en opus parce que… »).
- En fin de session (Phase 6), **mets à jour** `trajectory.md` : marque ton incrément `Livré — cf. <rapport>` (sans supprimer le contenu — il sert à montrer la divergence imaginée → réelle), et affine éventuellement les esquisses des incréments encore restants si tes choix actuels les impactent.

Template du plan :

```markdown
# Implémentation — <feature>

**École TDD** : Chicago bottom-up (default) | London top-down (si très visuel UI-first)
**Pyramide tests** : unit pur → unit hook → component RTL → e2e (cf. CLAUDE.md)
**Worktree** : non | oui (justifier)

## Tâches

### T1 — <verbe court à l'impératif>
- **Couche** : server | hook | component | e2e | refactor
- **Type** : implémentation | test | refactor
- **Dépend de** : — (ou T0)
- **Complexité** : trivial | standard | complexe
- **Modèle suggéré** : haiku | sonnet | opus
- **Skill test associé** : writing-unit-tests | writing-rtl-tests | e2e-test
- **Définition de fini** : test rouge → vert → refactor → `pnpm verify` ok
```

**Classification rapide** (détails et exemples : `references/task-classification.md`) :

| Complexité | Critères | Modèle |
|---|---|---|
| trivial | renommage, ajout d'export, fix typo, déplacement, snippet < 20 lignes | haiku |
| standard | fonction pure, route API CRUD simple, hook 1-2 effets, composant Mantine de présentation | sonnet |
| complexe | logique métier non-triviale, refacto cross-fichier, design d'API, parcours e2e, cas limite ambigu | opus |

En cas de doute → bump à la classe supérieure. Le coût d'erreur est asymétrique (un haiku qui rate coûte plus cher qu'un sonnet qui réussit).

**Détection des tâches parallélisables** :
- Pas de dépendance commune
- Pas de modification du même fichier
- Si parallélisation : un sous-agent par tâche, `run_in_background: true`, attente collective avant la synthèse

**TDD school** :
- **Chicago bottom-up** par défaut : commence par les fondations (server / pure functions / hooks), puis remonte vers la couche présentation
- **London top-down** si la feature est très visuelle (UI-first, ex. nouvelle page) : commence par le composant, mocks aux frontières, remplace les mocks par du vrai au refactor (sauf services externes)
- Détails : `references/tdd-loops.md`

---

### Création du rapport (squelette pré-rempli)

À la fin de Phase 2, **crée immédiatement** le rapport `docs/sessions/<YYYY-MM-DD-HHMM>-<slug>.md` avec :

- **Métadonnées** complètes sauf SHA (date, feature, bounded context, voie d'entrée, commit subject : `<à compléter>`)
- **Cadrage d'origine** : copie intégrale du draft (voie A) ou du brief reçu en `$ARGUMENTS` (voies B/C)
- **Plan initial** : copie du `.claude/scratch/coding/<slug>[/<increment-id>]/plan.md`
- **Sections vides** avec balises de placeholder, à enrichir aux phases suivantes :
  - `## Timeline d'exécution` — `<!-- append après chaque tâche -->`
  - `## Tentatives & impasses` — `<!-- append à chaque escalation ou bascule -->`
  - `## Décisions techniques tranchées` — `<!-- append à chaque décision en cours de route -->`
  - `## Modèles & coûts` — `<!-- consolidé en Phase 6 -->`
  - `## Quality gate` — `<!-- rempli en Phase 5 -->`
  - `## Résumé` — `<!-- rédigé en Phase 6 -->`
  - `## Liens` — `<!-- finalisé en Phase 6 -->`

Le rapport est désormais **vivant**. À chaque phase suivante, tu y appendes au fur et à mesure (cf. Phases 4/5/6).

---

## Phase 3 — Validation du plan par l'utilisateur

Présente :
- Le plan markdown
- Les tâches parallélisables détectées
- Le worktree proposé si justifié (refacto > 10 fichiers OU expérimentation parallèle OU tâche destructive)
- L'estimation des modèles agrégés (« 1 haiku, 3 sonnet, 1 opus »)

**Demande confirmation explicite** avant exécution. Une seule validation pour le batch — pas de re-confirmation par tâche.

---

## Phase 4 — Exécution TDD orchestrée

Pour chaque tâche (ou groupe parallélisable), enchaîne **RED → GREEN → REFACTOR**. Briefing complet en prompt à chaque sous-agent (pas de mailbox, pas de polling). Détails du pattern : `references/multi-agent-orchestration.md`.

**Rédaction au fil de l'eau du rapport** (section créée en Phase 2) :
- Après chaque tâche terminée → append une ligne dans `## Timeline d'exécution` : `HH:MM — T<n> (<modèle>) : RED/GREEN/REFACTOR ok`
- À chaque escalation (cf. plus bas) → append une entrée dans `## Tentatives & impasses` avec lien vers le fichier d'escalation
- À chaque décision technique tranchée en cours de route (bascule Chicago↔London, choix de mock conservé/remplacé, renommage ubiquitous language) → append dans `## Décisions techniques tranchées`

Ne diffère pas la rédaction : ce qui n'est pas écrit maintenant sera reconstitué de mémoire (mauvaise qualité) ou perdu (compactage du contexte).

### RED
- Spawn un sous-agent **test-writer** avec `subagent_type: "general-purpose"`, le bon skill (`writing-unit-tests` | `writing-rtl-tests` | `e2e-test`), et le modèle adapté
- Briefing : nom de tâche, fichier(s) concernés, comportement à tester en phrase métier, frontières à mocker, chemin de l'escalation file
- Output : fichier `*.test.ts(x)` qui échoue
- Vérifie le rouge avec `pnpm vitest run <chemin>` (ciblé)

### GREEN
- Spawn un sous-agent **implementer** avec le modèle adapté
- Briefing : test en RED + signatures + ubiquitous language + conventions du fichier
- Output : implémentation minimale qui passe
- Vérifie le vert

### REFACTOR
- Si simple : agent principal le fait directement (économie de spawn)
- Si plus large : sous-agent dédié
- **Chicago** : remplace les mocks internes par les vraies deps (sauf services externes)
- **London** : conserve les mocks aux frontières
- Lance `pnpm verify` (lint + typecheck) après refactor

### Pyramide de tests
- Unit (pur + hook) : dans la boucle TDD de chaque tâche
- RTL : déclenche quand le composant est suffisamment avancé (au moins 1 unit test sur sa logique interne)
- E2E : en clôture, après le quality gate complet

### Validation visuelle (chrome-cdp)
- L'agent principal **lui-même** peut utiliser chrome-cdp pour valider rapidement (pas un sous-agent : moins de friction)
- Si dev server pas lancé : lance `pnpm dev` en background avant le premier appel
- Règle : si tu peux exprimer le comportement, écris un test ; chrome-cdp pour exploration manuelle uniquement

### Escalation par sous-agent en difficulté
Quand un sous-agent bute (signature ambiguë, comportement métier flou, conflit de mock, > 2 essais sans progrès) :
1. Il écrit `.claude/scratch/coding/<slug>[/<increment-id>]/escalations/<task-id>.md` avec : contexte, modifs faites, ce qu'il a essayé (succès/échec numéroté), 3 problèmes les plus chauds
2. Il rend la main avec un résumé court dans son tool result : `ESCALATION : voir <chemin>`
3. Tu lis l'escalation, présentes les options à l'utilisateur :
   - Relancer avec un modèle plus puissant ?
   - Effort plus important (plus de contexte, plus de tentatives) ?
   - Changer d'approche ?
   - Court-circuiter et faire en direct ?

L'escalation file est **persistant** : reste après l'exécution, sert d'audit, peut être passé en contexte au sous-agent relancé.

---

## Phase 5 — Quality gate

1. `pnpm verify` (lint + typecheck) — bloquant
2. `pnpm verify:test` (vitest) — bloquant
3. Si UI changée et tâches RTL prévues, vérifie que le test RTL passe ; sinon, sanity check chrome-cdp ou e2e

Jamais `--no-verify`. Si une commande échoue, corrige avant de continuer. **Pas de commit à cette phase** : le commit final inclura aussi le rapport et la suppression du draft (Phase 6).

**Append au rapport** : remplis la section `## Quality gate` avec la sortie résumée des deux commandes (statut ok/ko, nb de tests, durée).

---

## Phase 5.5 — Mutation testing (optionnel, background)

**Déclenchement** : **par défaut activé**. Skippé uniquement si :
- Flag `--no-mutation` présent dans `$ARGUMENTS` (opt-out explicite, à justifier dans le rapport)
- **OU** la diff ne touche aucun fichier dans `src/server/**`, `src/hooks/**`, `src/utils/**`, `src/pages/api/**` (scope Stryker du projet — RTL pur, e2e, types ou pages SSR n'ont rien à muter)

La qualité des TU est non négociable : sur du code testé unitairement, le mutation testing est le seul moyen de mesurer si les assertions sont réelles ou cosmétiques. On l'exécute systématiquement sur les couches où il est pertinent.

**Pourquoi à ce moment précis** :
- Le quality gate vient de passer → code stable, pas d'éditions concurrentes possibles
- Stryker mute les sources et relance les tests : **toute édition concurrente corromprait l'état** → c'est pour ça qu'on ne le lance jamais par tâche en Phase 4
- Tourne en background pendant que tu finalises le rapport (Phase 6) : zéro temps mort

**Procédure** :
1. Récupère la liste des fichiers modifiés dans le scope : `git diff --name-only HEAD -- 'src/server/**' 'src/hooks/**' 'src/utils/**' 'src/pages/api/**'`
2. Si liste vide → skip
3. Spawn un sous-agent **mutation-runner** en `run_in_background: true` :
   - `subagent_type: "general-purpose"`
   - skill : `mutation-testing`
   - briefing : liste des fichiers cibles, chemin du rapport `docs/sessions/<ts>-<slug>.md`, instruction d'appendre une section `## Mutation testing` à la fin (score, table mutants survivants classés par criticité)
4. **Verrou** : aucune édition de `src/` tant qu'il tourne (uniquement le rapport et le draft à supprimer)
5. Tu enchaînes la Phase 6 (finalisation rapport)
6. **Avant le commit final** : attends le tool result du mutation-runner

**Décision post-run** :
- Score acceptable / pas de mutant critique → commit direct (rapport inclut la section mutation)
- Mutants critiques survivants → **propose** à l'utilisateur une mini-boucle TDD ciblée (relance Phase 4 sur la tâche concernée avec briefing « tuer le mutant `<id>` »). Tu ne la lances pas auto. Si l'utilisateur décline, commit avec la section mutation telle quelle (transparent dans le rapport).

**Garde-fous** :
- Jamais en parallèle de Phase 4 (corruption d'état)
- Tourne en background pendant Phase 6 → coût temps réel ≈ 0 (overlap avec la rédaction du rapport)
- Si Stryker échoue (config cassée, OOM) → log dans le rapport, commit quand même, ne bloque pas le flow
- `--no-mutation` reste disponible pour les hotfixes urgents ou les features 100% UI ; toujours justifier le skip dans le rapport

---

## Phase 6 — Finalisation du rapport + commit final

À ce stade, le rapport est déjà largement rédigé (créé en Phase 2, enrichi au fil de l'eau en Phases 4/5). Tu **finalises** uniquement les sections qui demandent une vue d'ensemble ; tu ne re-rédiges rien.

**Sections à finaliser** (par `Edit` ciblé, pas de réécriture from-scratch) :
- `## Résumé` : 3-5 lignes synthétiques — ce qui a été livré, périmètre effectif, résultat fonctionnel
- `## Modèles & coûts` : table consolidée des tâches × modèle × escalations (depuis le `TaskList` final + les appends de Phase 4)
- `## Liens` : commit subject prévu (`feat(<scope>): <description>`), pointeurs vers escalations conservées, mention du draft supprimé (voie A)
- **Relecture rapide de cohérence** : la timeline correspond-elle bien à la table coûts ? Les décisions techniques appendées en cours sont-elles toutes consignées ?

**Cycle de vie des artefacts en fin de session** (voie A uniquement) :

1. **Plan détaillé éphémère** (`<slug>/<increment-id>/plan.md` et `escalations/`) : son contenu est archivé dans le rapport de session (sections « Plan initial », « Tentatives & impasses »). Une fois le rapport écrit, le sous-dossier `<slug>/<increment-id>/` est **supprimé** du scratch (`rm -rf`). Si une escalation mérite d'être conservée hors-session pour audit, copie-la dans le rapport et déplace-la avant suppression.

2. **Trajectoire** (`<slug>/trajectory.md`) : **mise à jour**, pas supprimée tant qu'il reste des incréments à livrer. Marque l'incrément couvert cette session comme `Livré — cf. <rapport>` (garde le bullet point d'esquisse pour montrer divergence imaginée → réelle, c'est une trace utile). Tu peux affiner les esquisses des incréments encore à venir si tes choix actuels les ont impactées.

3. **Draft d'origine** (`docs/features/drafts/<slug>.md`) : on **ne supprime PAS** automatiquement. On l'**annote** en tête avec le statut courant.
   - Si **tous les incréments** décrits dans la section « Découpage » du draft ont été livrés (cette session ou des sessions précédentes — vérifie via `docs/sessions/<slug>-*.md`) → édite le draft pour passer son statut à `Statut : Livré (cf. docs/sessions/<rapport>.md, ...)`. À ce moment seulement, **supprime** également la trajectoire (`<slug>/trajectory.md`) et le sous-dossier scratch `<slug>/` devient vide → tu peux le retirer (`rmdir`). Le draft reste sur le disque ; la suppression définitive (`git rm`) est une décision utilisateur.
   - Si **un sous-ensemble** des incréments a été livré → édite le draft pour ajouter une note de statut en tête : statut courant + lien vers le ou les rapports + liste explicite des incréments restants. Le draft reste la source canonique pour les futures sessions `/coding`.
   - **Jamais de `git rm` automatique** : ce serait priver l'utilisateur de la décision finale. La suppression définitive du draft est une décision utilisateur.

Pas de SHA dans la métadonnée du rapport (référence circulaire impossible) : la métadonnée mentionne juste le **subject** du commit final attendu. Le lecteur retrouve le SHA via `git log -- docs/sessions/<rapport>.md`.

### Commit final (un seul commit englobant, message en anglais)

Une fois le rapport écrit et le draft annoté, invoque `/commit`. **Le commit final inclut tout en une seule fois** :
- Le code de la feature (déjà staged ou prêt à être staged)
- Le rapport `docs/sessions/<YYYY-MM-DD-HHMM>-<slug>.md`
- L'annotation du draft `docs/features/drafts/<slug>.md` (voie A)

**Le message du commit final (sujet ET body) est en anglais.** Conventional Commits style. Le sujet est court ; le body explique le périmètre livré, les décisions notables, et pointe vers le rapport. Cette règle s'applique à tous les commits du projet (cf. mémoire `feedback_commit_test_workflow.md`).

Pas de SHA dans la métadonnée du rapport (référence circulaire impossible) : la métadonnée mentionne juste le **subject** du commit final attendu (`feat(<scope>): <description>`). Le lecteur retrouve le SHA via `git log -- docs/sessions/<rapport>.md`.

---

## Garde-fous

- **Cadrage en amont : tu proposes, tu n'invoques jamais.** Si la demande paraît incomplète, propose `/shaping-feature` et stoppe (Phase 0 voie D). Si décisions structurantes ouvertes, propose `/grill-me` (Phase 1 voie B). L'utilisateur lance lui-même les skills amont. Respecte la règle « un skill produit son livrable et s'arrête ».
- **Pas de chaîne** sous-agent → sous-agent. Tout passe par toi.
- **Le sous-agent ne polle pas** : briefing initial complet ou rien. Steering en cours via `SendMessage` uniquement si vraiment nécessaire (sous-agent en background).
- **Une seule validation utilisateur** par batch (au plan global), pas par tâche.
- **Worktree non par défaut** ; propose-le uniquement si refacto > 10 fichiers OU expérimentation parallèle OU tâche destructive.
- **Skills tests jamais inlinés** : invoque toujours le skill correspondant (`writing-unit-tests`, `writing-rtl-tests`, `e2e-test`) — pas de duplication.
- **`pnpm verify` + `pnpm verify:test`** : non négociables avant commit ; jamais `--no-verify`.
- **chrome-cdp est exploratoire**, pas un substitut de test. Si tu peux exprimer le comportement, écris le test.
- **Cycle de vie post-commit hors-scope** : pas de PR auto, pas de déploiement, pas de monitoring. Tu t'arrêtes au rapport de session.

---

## Références

- `references/task-classification.md` — tables complexité × modèle, exemples concrets, anti-patterns de routage
- `references/tdd-loops.md` — Red-Green-Refactor détaillé, Chicago vs London, stratégie mocks
- `references/multi-agent-orchestration.md` — pattern « agent qui mange », parallélisme, escalation, worktrees
- `references/session-report-template.md` — template Markdown du rapport, mapping sources → sections
