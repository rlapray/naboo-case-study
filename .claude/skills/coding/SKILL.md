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
argument-hint: "[draft path | brief inline | brief court | --worktree]"
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

Produit un **plan markdown** dans `.claude/scratch/coding/<slug>/plan.md` ET un tracking live via `TaskCreate`.

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
1. Il écrit `.claude/scratch/coding/<slug>/escalations/<task-id>.md` avec : contexte, modifs faites, ce qu'il a essayé (succès/échec numéroté), 3 problèmes les plus chauds
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

---

## Phase 6 — Rapport de session + commit final

Rédige un rapport timestampé dans `docs/sessions/<YYYY-MM-DD-HHMM>-<feature-slug>.md`. Crée le dossier `docs/sessions/` s'il n'existe pas.

Template complet et exemples : `references/session-report-template.md`.

**Ordre des sections du rapport** :
1. Métadonnées (date, feature, contexte, commit final)
2. **Cadrage d'origine** (intégré tel quel, archive complète) :
   - Voie A : copie intégrale du draft `docs/features/drafts/<slug>.md` (avec tous ses détails — Job, Fit, Vocabulaire, UX, Découpage, décisions tranchées par grill-me)
   - Voie B : copie intégrale du brief inline reçu en `$ARGUMENTS`
   - Voie C : copie de la phrase courte reçue en `$ARGUMENTS`
3. Sections d'exécution (résumé, plan initial, timeline, tentatives & impasses, décisions techniques, modèles & coûts, quality gate, liens)

**Sources mobilisées** :
- `$ARGUMENTS` (voies B/C) ou `docs/features/drafts/<slug>.md` (voie A) → section « Cadrage d'origine »
- `.claude/scratch/coding/<slug>/plan.md` → section « Plan initial »
- `TaskList` historisé → section « Timeline »
- Tool results des sous-agents → section « Tentatives & impasses »
- `.claude/scratch/coding/<slug>/escalations/*.md` → section « Tentatives & impasses »
- `git log -1 --format=%H%n%s` du commit final → métadonnées (SHA + subject)
- Sortie de `pnpm verify` et `pnpm verify:test` finale → section « Quality gate »

**La valeur du rapport** : le cadrage d'origine archivé rend le rapport auto-contenu. La section « Tentatives & impasses » archive ce qui a été essayé et n'a pas marché. Pas de liste exhaustive de fichiers (le commit fait foi).

**Cleanup post-archive** (voie A uniquement) : une fois le rapport écrit, **supprime** le draft `docs/features/drafts/<slug>.md` (`git rm`). Son contenu est désormais archivé dans le rapport ; le garder créerait deux sources de vérité divergentes. Pour les voies B/C, il n'y a pas de fichier draft à supprimer.

### Commit final (un seul commit englobant)

Une fois le rapport écrit et le draft supprimé (le cas échéant), invoque `/commit`. **Le commit final inclut tout en une seule fois** :
- Le code de la feature (déjà staged ou prêt à être staged)
- Le rapport `docs/sessions/<YYYY-MM-DD-HHMM>-<slug>.md`
- La suppression de `docs/features/drafts/<slug>.md` (voie A)

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
