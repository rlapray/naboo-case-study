# Méthode d'interview — Étape 3

## Format de question imposé

Poser **une question à la fois** avec ce format :

```
Q<n> — [Tag de catégorie]
Pourquoi je pose cette question : <une phrase qui révèle l'angle mort>
Question : <la question>
Ma recommandation : <réponse recommandée>
```

## Tags de catégorie

`[Synonyme]` `[Ambiguïté]` `[Bounded Context]` `[Hiérarchie]` `[Cardinalité]` `[Cycle de vie]` `[Écart code/intention]`

## Taxonomie des axes à couvrir

| Axe | Description |
|-----|-------------|
| **Synonymes** | Deux mots pour le même concept |
| **Ambiguïtés** | Un mot pour deux concepts |
| **Termes surchargés** | Concept trop large mélangeant plusieurs responsabilités |
| **Absences** | Concept du domaine sans terme dans le code |
| **Frontières** | Où s'arrête un Bounded Context, où commence le suivant |
| **Cardinalité** | Un X a un ou plusieurs Y ? |
| **Cycle de vie** | Transitions, états |

## Anti-patterns à proscrire

- Pas de question rhétorique ou orientée
- Pas de réponse vague acceptée (« ça dépend » → creuse)
- Pas de complaisance après une bonne réponse — enchaîner
- Pas de détails périphériques tant que des décisions structurantes restent ouvertes
