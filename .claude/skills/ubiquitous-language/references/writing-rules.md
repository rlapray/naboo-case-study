# Règles de rédaction, sources externes et re-run

## Règles de rédaction

- **Être opinioné** : quand plusieurs mots existent pour le même concept, choisir le meilleur et lister les autres comme alias à éviter.
- **Métier-pur** : zéro jargon technique (`JWT`, `Schema`, `Resolver`, `Mongoose`, `GraphQL`, `endpoint`) sauf si le terme a un sens métier irréductible.
- **Définitions courtes** : une phrase max — définir ce qu'il EST, pas ce qu'il fait.
- **Termes en gras** dans les relations et le dialogue.
- **Exclure les concepts génériques** de programmation (tableau, fonction, classe).
- **Une table par Bounded Context** — si la codebase n'a qu'un seul contexte, une seule table.
- **Dialogue d'exemple obligatoire** (3 à 5 répliques) entre un dev et un expert métier, illustrant les frontières entre concepts proches.
- **Section « Écarts code vs. langage canonique » obligatoire** si au moins un écart est détecté — purement descriptive, aucune proposition d'action.

## Transparence sur les ressources externes

Utiliser WebSearch / WebFetch pour :
- Vérifier une référence DDD canonique (Evans, Fowler, Vernon)
- Contextualiser un terme métier sectoriel (assurance, finance, tourisme…)
- Trouver une donnée à jour (statut d'une API tierce, version d'un standard)

**Obligation absolue** : avant ou immédiatement après chaque appel externe, déclarer à l'utilisateur l'URL consultée et la raison. Lister toutes les sources dans la section `<!-- meta -->` du fichier produit sous la clé `external_sources_consulted`.

## Comportement en re-run

Quand invoqué sur une codebase qui possède déjà un `docs/UBIQUITOUS_LANGUAGE.md` :

1. Lire le doc existant et extraire la section `<!-- meta -->` (timestamp, hash, fichiers scannés)
2. Re-scanner la codebase et calculer le nouveau hash
3. Diffuser à l'utilisateur la liste des fichiers ayant changé depuis le dernier run
4. Intégrer les nouveaux termes détectés
5. Mettre à jour les définitions si la compréhension a évolué
6. Re-signaler les nouvelles ambiguïtés et nouveaux écarts
7. Réécrire le dialogue d'exemple pour intégrer les nouveaux termes
8. Mettre à jour la section `<!-- meta -->` (nouveau timestamp, nouveau hash, sources consultées)
