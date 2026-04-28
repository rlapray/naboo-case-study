# Format de sortie — UBIQUITOUS_LANGUAGE.md

Structure complète attendue du fichier produit.

```markdown
# Langage Ubiquitaire

## [Nom du Bounded Context A]

| Terme | Définition | Alias à éviter |
|-------|-----------|----------------|
| **Customer** | Personne ou organisation qui passe des Orders | Client, buyer, account |
| **Order** | Demande d'achat d'un ou plusieurs items par un Customer | Purchase, transaction |

## [Nom du Bounded Context B]

| Terme | Définition | Alias à éviter |
|-------|-----------|----------------|
| **Invoice** | Demande de paiement émise après livraison | Bill, payment request |

## Relations inter-contextes

- Un **Customer** appartient au Bounded Context Sales et est référencé en lecture seule dans le Bounded Context Billing
- Un **Order** produit un ou plusieurs **Invoices**

## Dialogue d'exemple

> **Dev :** « Quand un **Customer** passe un **Order**, on émet l'**Invoice** tout de suite ? »
> **Expert métier :** « Non, l'**Invoice** n'est généré qu'après confirmation du **Fulfillment**. Un **Order** peut produire plusieurs **Invoices** si les items partent en **Shipments** séparés. »
> **Dev :** « Donc si un **Shipment** est annulé avant expédition, aucun **Invoice** n'est émis pour celui-ci ? »
> **Expert métier :** « Exactement. Le cycle de vie de l'**Invoice** est lié au **Fulfillment**, pas à l'**Order**. »

## Ambiguïtés signalées

- `account` était utilisé pour désigner à la fois **Customer** et **User** — ces concepts sont distincts : un **Customer** passe des **Orders**, un **User** est une identité d'authentification qui peut ou non représenter un **Customer**.

## Écarts code vs. langage canonique

| Terme canonique | Terme utilisé dans le code | Localisation | Statut |
|-----------------|---------------------------|--------------|--------|
| **Customer** | `Client` | `src/sales/client.entity.ts` | À aligner |
| **Invoice** | `Bill` | `src/billing/bill.service.ts` | À aligner |

*Cette section est purement informative. L'agent ne propose ni n'exécute aucun renommage. À l'utilisateur de décider.*

<!-- meta
last_run: 2026-04-27T14:32:00Z
files_scanned: 23
sha256: 3f7b1c9a8d2e4f5b6c7a8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a
external_sources_consulted:
  - https://martinfowler.com/bliki/UbiquitousLanguage.html (vérification définition Aggregate)
-->
```
