# Project Microservice

Ce microservice gère les fonctionnalités de santé, de tickets et de sprints dans l'architecture monorepo `@gile-back/`.

## Fonctionnalités

### Health Service

- **Endpoint GRPC**: `Health.Check`
- **Description**: Vérifie l'état de santé du service.

### Tickets Service

- **Endpoints GRPC**:
  - `Tickets.Create`: Créer un ticket
  - `Tickets.FindAll`: Lister les tickets avec filtres
  - `Tickets.FindById`: Récupérer un ticket par ID
  - `Tickets.Update`: Mettre à jour un ticket
  - `Tickets.Remove`: Supprimer un ticket

### Sprints Service

- **Endpoints GRPC**:
  - `Sprints.Create`: Créer un sprint
  - `Sprints.FindAll`: Lister les sprints avec filtres
  - `Sprints.FindById`: Récupérer un sprint par ID
  - `Sprints.GetOverview`: Obtenir un aperçu du sprint
  - `Sprints.FindByProject`: Lister les sprints par projet
  - `Sprints.FindActiveSprints`: Lister les sprints actifs
  - `Sprints.GetLastVersionByProject`: Obtenir la dernière version de sprint par projet
  - `Sprints.GetLastActualEndDateByProject`: Obtenir la dernière date de fin effective par projet
  - `Sprints.GetLastEndDateByProject`: Obtenir la dernière date de fin par projet
  - `Sprints.Update`: Mettre à jour un sprint
  - `Sprints.Remove`: Supprimer un sprint

## Types Partagés

Les DTOs et interfaces sont définis dans `libs/shared/types/`:

- `tickets/dtos.ts`: DTOs pour les tickets
- `sprints/dtos.ts`: DTOs pour les sprints

## Logger Partagé

Utilise le logger partagé de `libs/shared/logger/` pour tous les logs.

## Configuration

- **URL GRPC**: `process.env.PROJECT_GRPC_URL` (par défaut: `0.0.0.0:50053`)
- **Packages Proto**: `health.v1`, `tickets.v1`, `sprints.v1`

## Utilisation

Démarrer le microservice:

```bash
npm run start:dev
```

Appeler un endpoint GRPC:

```bash
grpcurl -plaintext localhost:50053 tickets.v1.Tickets/Create
```

## Architecture

- **Contrôleurs**: Gèrent les requêtes GRPC
- **Services**: Contiennent la logique métier
- **Types**: Partagés via `libs/shared/types/`
- **Logger**: Partagé via `libs/shared/logger/`
