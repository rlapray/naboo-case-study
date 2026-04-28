# Stratégie d'analyse — feature-map

## Ordre de lecture (du plus au moins riche en intention métier)

### 1. Tests d'intégration / e2e
**Pourquoi** : les tests décrivent ce que le système est censé faire, pas comment il le fait.
Un test nommé `should allow user to complete checkout` est une feature déclarée.

Cherche :
- Dossiers `test/`, `tests/`, `e2e/`, `spec/`, `__tests__/`
- Fichiers `*.test.*`, `*.spec.*`, `*.e2e.*`
- Noms de describe/it/test/scenario — ce sont souvent des use cases verbatim

Signal fort : `describe('Paiement', () => { it('permet à un acheteur de payer par carte') })`

### 2. Structure de modules / packages
**Pourquoi** : les noms de dossiers racines révèlent les Bounded Contexts voulus par les devs.

Cherche :
- `src/[domaine]/`, `app/[domaine]/`, `modules/[domaine]/`
- Packages dans un monorepo (`packages/`, `apps/`, `services/`)
- Noms de modules dans `package.json`, `pyproject.toml`, `Cargo.toml`

Signal fort : `src/orders/`, `src/catalog/`, `src/auth/` → 3 domaines candidats

### 3. Routes / controllers / resolvers
**Pourquoi** : chaque route est une action que le système expose. C'est la surface contractuelle.

Cherche :
- Controllers (`*Controller`, `*Router`, `*Handler`)
- Routes (`routes.ts`, `router.ts`, `urls.py`)
- Resolvers GraphQL (`*Resolver`)
- Groupes de routes — ils délimitent souvent les domaines

Signal fort : `GET /orders`, `POST /orders/:id/cancel` → features "Consulter commande" et "Annuler commande"

### 4. Events / Commands (archi event-driven / CQRS)
**Pourquoi** : les events et commands sont des intentions métier explicites.

Cherche :
- Classes suffixées `Event`, `Command`, `Query`
- Dossiers `events/`, `commands/`, `queries/`
- Handlers d'events (`*EventHandler`, `on('event-name')`)

Signal fort : `OrderPlacedEvent`, `CancelOrderCommand` → features directement nommées

### 5. Schemas / Entités / Modèles
**Pourquoi** : les entités révèlent les agrégats DDD et les concepts porteurs.

Cherche :
- `*.schema.ts`, `*.entity.ts`, `*.model.ts`
- Classes de domaine avec comportement (méthodes métier, pas juste des getters)
- Relations entre entités — elles révèlent les frontières de domaine

Signal fort : `Order` avec méthodes `place()`, `cancel()`, `ship()` → features de cycle de vie

---

## Heuristiques pour délimiter les domaines

Le critère d'éclatement en sous-fichier est **la frontière de Bounded Context**, jamais
la longueur. Un domaine déclaré est **exhaustivement** cartographié dans son fichier ;
si le résultat est très long, c'est un signal sur l'archi (BC trop gros, frontières mal
tracées), pas sur le doc — à remonter à l'utilisateur sans tronquer.

### Un domaine mérite son propre sous-document si :
- Il a ses propres acteurs (pas uniquement les mêmes qu'un domaine parent)
- Il a des données propres (entités qui lui appartiennent)
- Un PO pourrait le décrire indépendamment des autres
- Il a une autonomie fonctionnelle claire

### Un domaine reste une section du parent si :
- Il partage tous ses acteurs avec le parent
- Il n'a pas d'entités propres
- Il ne peut pas être compris sans le contexte du parent

### Overlaps entre domaines
Si un même use case semble appartenir à deux domaines, c'est souvent le signe d'une
frontière à tracer. Options :
- Le rattacher au domaine où il **crée de la valeur** (pas où il est implémenté)
- Le placer dans les deux avec une note de dépendance
- Créer un sous-domaine partagé explicite (ex : `Notifications` peut servir plusieurs domaines)

---

## Signaux de zone grise (→ section interne `Zones non cartographiées`)

- Module avec uniquement des noms techniques (`utils/`, `helpers/`, `common/`, `shared/`)
- Code sans tests ni documentation
- Noms de fonctions/classes purement implémentatoires sans intention métier lisible
- Module dont la responsabilité chevauche ≥ 3 domaines sans logique propre
- Code legacy sans structure claire

**Règle** : ces zones vont dans la section `## Zones non cartographiées` du `FEATURES.md`
**racine uniquement** — jamais dans un sous-fichier de domaine (un domaine déclaré est
exhaustif par définition). Si une zone significative reste non identifiable après
l'interview plafonnée, la documenter ainsi plutôt que d'inventer un rattachement.

---

## Ce qu'on ignore délibérément

- Fichiers de configuration (`*.config.*`, `.env`, `docker-compose.yml`)
- Migrations de base de données
- Scripts de build / CI
- Fichiers de style (`*.css`, `*.scss`)
- Utilitaires de test (`fixtures/`, `factories/`, `mocks/`)

Ces fichiers ne portent pas d'intention métier et polluent l'analyse.
