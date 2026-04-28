# Workflow détaillé — feature-map

## Phase 0 — Vérification du langage ubiquitaire

Le skill `feature-map` est **bloquant** sur l'existence et la cohérence du fichier
`docs/UBIQUITOUS_LANGUAGE.md`.

### Cas 1 — Fichier absent

Stoppe immédiatement. Réponds :

> _« Ce skill nécessite un glossaire ubiquitaire. Lance d'abord `/ubiquitous-language`,
> puis relance `/feature-map`. »_

Ne crée pas le fichier toi-même, ne lance pas de sous-agent — c'est la responsabilité
explicite de l'utilisateur d'avoir ce socle avant de cartographier les features.

### Cas 2 — Fichier présent et cohérent

Lis `docs/UBIQUITOUS_LANGUAGE.md`. Retiens les termes pour la rédaction (Phase 5).
Continue à la Phase 1.

### Cas 3 — Fichier présent mais écarts substantiels

Si la lecture des termes du glossaire confronté à ta première inférence des domaines
candidats (Phase 2 anticipée) révèle des écarts substantiels — termes manquants pour
des domaines clairement présents dans le code, contradictions, renommages métier non
reflétés — stoppe et réponds :

> _« Le glossaire ubiquitaire présente des écarts substantiels avec le code actuel
> (ex: [exemples concrets]). Lance `/ubiquitous-language` pour les résoudre, puis
> relance `/feature-map`. »_

## Phase 2 — Analyse approfondie

Ordre de lecture du code (du plus au moins riche en intention métier) :

1. **Tests d'intégration / e2e** : cherche les user flows complets, les cas nominaux et
   les cas d'erreur — c'est le meilleur signal de ce que le système est censé faire
2. **Structure de modules / packages** : les noms de dossiers révèlent souvent les
   Bounded Contexts
3. **Routes + controllers** : les endpoints exposés = les actions que les acteurs peuvent
   déclencher
4. **Events / commands** : dans une archi event-driven, ce sont les intentions explicites
5. **Schemas / entités** : les modèles de données révèlent les agrégats DDD

Pour chaque domaine identifié, note :
- Nom candidat (en termes métier, pas techniques)
- Acteurs impliqués
- Use cases principaux (1 phrase : acteur + action + résultat)
- Surface (back / front / both)
- Dépendances avec d'autres domaines (inclus dans, overlap, indépendant)

## Phase 3 — Interview — règles supplémentaires

**Plafond strict : 5 à 7 questions max**, regroupées par lots de 2-3 par tour. L'utilisateur
peut skipper une question (« je sais pas / passe ») à tout moment.

Ne pose pas de question si la réponse est lisible dans le code avec certitude.

Priorise les questions sur :
1. Les domaines dont le nom est ambigu
2. Les acteurs non identifiables depuis le code seul
3. Les overlaps entre domaines (est-ce le même, ou deux domaines distincts ?)
4. Les use cases absents du code mais présents dans le métier

**Critère d'arrêt** : plafond atteint OU tous les domaines candidats validés (nom +
acteurs + au moins un use case confirmé).

Les zones non résolues (questions skippées, non posées par manque de quota) → section
`## Zones non cartographiées` du `FEATURES.md` racine. Ne pas créer de sous-fichier
pour les zones grises.
