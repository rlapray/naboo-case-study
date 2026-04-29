# Session Report — Template & Conventions

## Convention de nommage

Fichier : `docs/sessions/<YYYY-MM-DD-HHMM>-<feature-slug>.md`
- Date format ISO court (Europe/Paris)
- Slug : kebab-case du nom de la feature
- Crée le dossier `docs/sessions/` s'il n'existe pas

Exemples :
- `docs/sessions/2026-04-29-1430-healthcheck-endpoint.md`
- `docs/sessions/2026-04-29-1605-panier-utilisateur.md`

## Ordre de remplissage progressif (rapport vivant)

Le rapport est créé en **Phase 2** et enrichi au fil de l'eau. Chaque section a une phase de remplissage attitrée :

| Section | Phase qui remplit | Mode |
|---|---|---|
| Métadonnées (sauf SHA) | Phase 2 | Création |
| Cadrage d'origine | Phase 2 | Création (copie intégrale) |
| Plan initial | Phase 2 | Création (copie de `plan.md`) |
| Timeline d'exécution | Phase 4 | Append après chaque tâche |
| Tentatives & impasses | Phase 4 | Append à chaque escalation / bascule |
| Décisions techniques tranchées | Phase 4 | Append à chaque décision |
| Quality gate | Phase 5 | Append (sortie résumée) |
| Résumé | Phase 6 | Edit (3-5 lignes) |
| Modèles & coûts | Phase 6 | Edit (table consolidée) |
| Liens | Phase 6 | Edit (commit subject prévu) |

**Règle clé** : ne jamais différer ce qui peut être écrit maintenant. Une décision technique non consignée au moment où elle est prise sera reconstituée de mémoire (faible qualité) ou perdue (compactage).

## Mapping sources → sections

| Section du rapport | Source |
|---|---|
| Métadonnées (date, feature, contexte) | Brief de Phase 0 + bounded context déduit |
| **Cadrage d'origine** | Voie A : copie intégrale de `docs/features/drafts/<slug>.md` ; Voie B/C : copie intégrale du contenu reçu en `$ARGUMENTS` |
| Résumé | Synthèse de ce qui a été livré (toi-même, en 3-5 lignes) |
| Plan initial | Copie de `.claude/scratch/coding/<slug>[/<increment-id>]/plan.md` |
| Trajectoire (multi-incréments uniquement) | Snapshot de `.claude/scratch/coding/<slug>/trajectory.md` au moment de la session — esquisses des incréments restants. Conservée vivante dans le scratch après commit, supprimée seulement à la dernière session. |
| Timeline d'exécution | Historique `TaskList` / `TaskUpdate` (status changes + horodatage) |
| Tentatives & impasses | Tool results des sous-agents (champ `Notes`) + fichiers `.claude/scratch/coding/<slug>[/<increment-id>]/escalations/*.md` |
| Décisions techniques tranchées | À synthétiser depuis le brief, le grill éventuel, les choix de refactor |
| Modèles & coûts | TaskList enrichi avec le modèle utilisé par tâche + escalations subies |
| Quality gate | Sortie de `pnpm verify` et `pnpm verify:test` finale |
| Liens | Plan initial (sera supprimé du scratch après commit), escalations conservées, subject du commit final, PR (si applicable) |

## Pourquoi archiver le cadrage d'origine

Le rapport est l'**archive consolidée et auto-contenue** d'une session : on doit pouvoir le rouvrir 6 mois plus tard et retrouver l'intention initiale **et** l'exécution sans dépendance externe.

**Voie A** : le draft `docs/features/drafts/<slug>.md` est intégré dans la section « Cadrage d'origine » du rapport. Le draft **n'est jamais supprimé automatiquement** — il est annoté en tête avec son statut courant :
- Statut « Livré » + lien vers le rapport si **tous** les incréments décrits dans le draft ont été couverts cette session.
- Statut + liste des incréments restants si seul un sous-ensemble a été livré (le draft reste alors la source canonique pour les futures sessions `/coding`).
La décision de supprimer définitivement le draft revient à l'utilisateur.

**Voies B et C** : l'input n'a pas de fichier source — il vit uniquement dans la conversation. L'archiver dans le rapport est encore plus important : sans ça, on ne saura plus jamais ce qui a été demandé.

## Template à remplir

```markdown
# Session — <titre court de la feature>

**Date** : YYYY-MM-DD HH:MM (Europe/Paris)
**Feature** : <nom>
**Bounded context** : Catalogue | Identité | Administration
**Commit subject** : `feat(<scope>): <description>` (SHA via `git log -- <ce-fichier>`)
**Voie d'entrée** : A (draft consolidé) | B (brief inline) | C (brief court)

## Cadrage d'origine

> Source : `docs/features/drafts/<slug>.md` (voie A) | brief inline reçu en `$ARGUMENTS` (voie B) | brief court reçu en `$ARGUMENTS` (voie C)

<COPIE INTÉGRALE du draft ou du brief reçu en input, sans aucune modification ni résumé.
Pour la voie A : copie le contenu complet de `docs/features/drafts/<slug>.md` (titre, Job, Fit,
Vocabulaire, UX, Découpage, décisions tranchées par grill-me, etc.).
Pour les voies B/C : reproduis le texte reçu tel quel.>

## Résumé
<3-5 lignes : ce qui a été livré, le périmètre effectif, le résultat fonctionnel.
Pas de liste de fichiers — le commit fait foi.>

## Plan initial
<Copie du plan markdown produit en Phase 2 — tâches, classification, dépendances, parallélisation.
Si le plan est long, garde la structure brute (T1, T2, ...) et coupe les détails secondaires.>

## Timeline d'exécution
- HH:MM — T1 (haiku) : RED écrit, GREEN passé, refactor ok
- HH:MM — T2 (sonnet) : RED écrit, GREEN initial échoue, retry → ok
- HH:MM — T3 et T4 (sonnet, parallèle) : succès simultanés à HH:MM
- HH:MM — Quality gate : `pnpm verify` ok, `pnpm verify:test` ok
- HH:MM — Rapport rédigé, draft annoté avec statut, commit final

## Tentatives & impasses (mise en avant)
> Ce qui a été essayé mais n'a pas fonctionné, et ce qui a été retenu à la place.

- **T2 — connexion Mongoose** : tentative initiale avec mock partiel → flaky.
  Bascule vers `mongodb-memory-server` (recommandation CLAUDE.md). Référence : `escalations/T2.md`.
- **T5 — refactor pour remplacer mock** : conflit entre l'école Chicago visée et le mock du `cityService`.
  Décision : conserver le mock côté frontière (service externe).

(Si rien d'inattendu n'est arrivé, écris simplement : « Aucune impasse — exécution conforme au plan. »
La section reste, même vide, pour souligner qu'elle a été pensée.)

## Décisions techniques tranchées
- École TDD retenue : Chicago bottom-up (raison : pas de surface UI nouvelle)
- Mocks conservés : `@/services/cities` (service externe), `next/router`
- Mocks remplacés au refactor : helpers internes de pagination
- Worktree : non
- Renommages dans l'ubiquitous language : <le cas échéant>

## Modèles & coûts
| Tâche | Complexité | Modèle | Effort | Escalation ? |
|---|---|---|---|---|
| T1 | trivial | haiku | low | non |
| T2 | standard | sonnet | medium | oui (relancée en opus) |
| T3 | standard | sonnet | medium | non |
| T4 | standard | sonnet | medium | non |
| T5 | complexe | opus | high | non |

## Quality gate
- `pnpm verify` : ok
- `pnpm verify:test` : ok (X tests, durée : Y s)
- Tests ajoutés : N unit, M RTL, P e2e
- Commit signé : oui
- Hooks pré-commit : ok (jamais `--no-verify`)

## Liens
- Plan initial : `.claude/scratch/coding/<slug>[/<increment-id>]/plan.md` (scratch éphémère, supprimé après archive dans ce rapport)
- Trajectoire (multi-incréments) : `.claude/scratch/coding/<slug>/trajectory.md` — snapshot inclus en annexe ci-dessus, vivante dans le scratch jusqu'à la dernière session
- Escalations conservées : `.claude/scratch/coding/<slug>[/<increment-id>]/escalations/T2.md` (si pertinent à conserver)
- Commit subject : `feat(<scope>): <description>` (SHA via `git log -- <ce-fichier>`)
- Draft d'origine (voie A) : annoté en tête avec son statut (livré / incréments restants), conservé dans le repo. Suppression manuelle à la discrétion de l'utilisateur.
- PR (si créée) : <lien manuel — pas créée par /coding>
```

## Règles de concision

- **Pas de liste exhaustive de fichiers** : le commit `git show <SHA>` ou la PR fait foi. Mentionne uniquement les fichiers s'ils ont une histoire (ex. « le fichier X a été créé puis abandonné »).
- **La timeline reste compacte** : une ligne par jalon. Si tu as 30 jalons, regroupe par tâche.
- **« Tentatives & impasses » est la valeur du rapport** : ne le minimise pas. Un rapport qui ne montre que des succès n'apporte rien à un futur lecteur.
- **Ne pas inventer** : si une info est manquante (pas de timestamp dans `TaskList`, pas d'escalation), écris « non disponible » plutôt que de fabuler.

## Quand le rapport déborde

Si le rapport dépasse une page écran (~50 lignes), c'est un signal que la feature aurait dû être découpée plus tôt. Garde-le tel quel pour ce run, mais note dans la section « Décisions techniques tranchées » : « rapport long → pour les features de taille comparable, découper en 2-3 incréments ».
