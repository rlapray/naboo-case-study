# Multi-Agent Orchestration — Pattern « agent qui mange les autres »

## Principe : briefing minimal, tool result structuré

L'agent principal porte le contexte feature. Les sous-agents reçoivent **le strict nécessaire** dans leur prompt initial, font une chose, rendent un tool result structuré.

**Pourquoi** : économise les tokens (pas de duplication du contexte feature dans 5 sous-agents), accélère, et garde l'agent principal en position d'arbitre.

## Format du briefing d'un sous-agent

```
Tâche : <T-id> — <verbe court>
Skill à appliquer : <writing-unit-tests | writing-rtl-tests | e2e-test | (libre)>
Modèle : <haiku | sonnet | opus>

Contexte minimal :
- Brief feature (extrait, ≤ 10 lignes)
- Fichier(s) concerné(s) : <chemins>
- Comportement à produire : <phrase métier>
- Frontières à mocker : <liste>
- Conventions : <pyramide tests, ubiquitous language pour les noms>

Si tu bloques :
- Écris `.claude/scratch/coding/<slug>/escalations/<T-id>.md` avec : contexte, modifs faites, ce qui a été essayé (succès/échec numéroté), 3 problèmes les plus chauds
- Rends ESCALATION : voir <chemin> dans ton tool result
- N'insiste pas après 2 essais infructueux

Tu ne peux pas spawner d'autres sous-agents. Si tu as besoin d'un autre type de travail, escalade.
```

## Format du tool result attendu en retour

```
Statut : ok | partial | escalation
Tâche : <T-id>
Diff produit : <fichiers modifiés, +/- lignes>
Tests : <nb ajoutés, statut RED/GREEN>
Notes : <1-3 lignes sur les choix faits ou les frictions rencontrées>
[Si escalation : chemin du fichier d'escalation]
```

L'agent principal lit ce résultat, met à jour `TaskList`, et passe à la suite.

## Détection des tâches parallélisables

Deux tâches peuvent partir en parallèle si :
- Pas de dépendance déclarée commune (`Dépend de` vide ou disjoint)
- Pas de modification du même fichier
- Pas de dépendance implicite via un type partagé qui doit être créé par l'autre

Exemple parallélisable : T2 = validator Zod pour activity, T3 = validator Zod pour user.
Exemple non parallélisable : T2 = service `findById`, T3 = route qui appelle `findById`.

## Lancer en parallèle

Dans un seul message, plusieurs `Agent` calls avec `run_in_background: true`. Donne un `name` distinct à chaque sous-agent (`name: "test-writer-T2"`, `name: "test-writer-T3"`). Tu pourras les contacter via `SendMessage(to: <name>, ...)` si besoin de steering en cours.

Une fois tous les sous-agents lancés, attends leur retour (ils signalent leur fin via leur tool result). Synthétise et passe à la suite.

**Limite à 3 sous-agents en parallèle** maximum sur ce projet (au-delà, l'agent principal sature à coordonner).

## Escalation file — protocole détaillé

### Quand un sous-agent doit escalader
- Signature ambiguë sans pouvoir choisir
- Comportement métier flou (le brief ne tranche pas)
- Conflit de mock (deux mocks contradictoires)
- > 2 tentatives sans progrès
- Erreur d'env / outillage qu'il ne peut pas résoudre seul

### Format du fichier d'escalation

```markdown
# Escalation — T<id> : <titre court>

**Sous-agent** : <subagent_type>, modèle <haiku|sonnet|opus>
**Skill appliqué** : <skill name>

## Contexte
<Ce qui devait être fait, en 3-5 lignes>

## Modifications déjà faites
- <chemin> : <résumé du diff>
- ...

## Tentatives

### 1. <approche>
- Hypothèse : ...
- Action : ...
- Résultat : ❌ <ce qui n'a pas marché>

### 2. <approche>
- ...

## Problèmes les plus chauds
1. <problème 1, le plus bloquant>
2. <problème 2>
3. <problème 3>

## Question ouverte à l'agent principal
<Une question concrète, pas un appel à l'aide vague>
```

### Que fait l'agent principal
1. Lit l'escalation
2. Présente à l'utilisateur les options :
   - Relancer avec un modèle plus puissant (sonnet → opus)
   - Plus de contexte (passer le brief feature complet, pas juste l'extrait)
   - Effort plus important (plus de tentatives autorisées)
   - Changer d'approche (Chicago ↔ London, ou découpage différent)
   - Court-circuiter et faire en direct (l'agent principal prend la main)
3. Selon la décision, soit relance un sous-agent (avec le contexte de l'escalation passé en input), soit fait lui-même.

L'escalation file **reste persistant** : utile pour le rapport de session, et pour donner du contexte à un sous-agent relancé.

## Worktrees — quand oui, quand non

**Par défaut : NON.** Travaille dans l'arbre principal :
- Tous les sous-agents voient les modifications en cours (cohérence)
- Pas de coût de merge / cherry-pick à la fin
- `pnpm verify` simple à invoquer

**Worktree justifié** :
- Refactoring qui touche > 10 fichiers cross-domaine
- Expérimentation parallèle de deux approches concurrentes
- Tâche destructive qu'on veut pouvoir abandonner

Si worktree retenu : utilise `isolation: "worktree"` sur l'agent **orchestrateur** (pas un par sous-agent — sinon les sous-agents ne se voient plus). Un seul worktree pour tout le batch.

Au merge : revue manuelle, cherry-pick si nécessaire, puis suppression du worktree.

## Limitations harness à communiquer aux sous-agents

Inclure dans le briefing minimal de chaque sous-agent :
- **Tu ne peux pas spawner d'autres sous-agents** (le harness l'interdit). Si tu as besoin d'un autre type de travail, escalade.
- **La communication avec l'agent principal est asynchrone** : tu ne reçois pas de message en cours de tâche, sauf via `SendMessage` (et seulement si tu as un `name` et tournes en background).
- **Pas de polling de fichier** : le briefing initial est ta source unique. Si tu as besoin d'un complément, escalade.

## Anti-patterns multi-agents

- ❌ **Briefing trop large** : passer le brief feature complet à chaque sous-agent → pollution de contexte. Garde l'extrait pertinent.
- ❌ **Sous-agent qui « bricolent »** : un sous-agent qui rend `partial` après 5 essais sans escalader = il a brûlé du temps et des tokens. Cap à 2 essais avant escalation.
- ❌ **Pas de `name` quand on parallélise** : impossible de cibler avec `SendMessage`, et le rapport de session n'a pas de fil pour identifier qui a fait quoi.
- ❌ **Worktree par défaut** : ralentit, pollue, complique. Justifie-le ou ne l'utilise pas.
- ❌ **Lecture parallèle d'un même fichier** par 2 sous-agents qui le modifient ensuite : conflit garanti. Sépare les tâches qui touchent au même fichier.
