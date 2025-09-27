# Workspace Microservice

Ce microservice gère les espaces de travail (workspaces) dans l'application Bibz/Gile. Il fournit des opérations CRUD complètes pour les workspaces, ainsi que la gestion des membres, paramètres et invitations via gRPC.

## Fonctionnalités

- **Gestion des Workspaces** : Création, lecture, mise à jour, suppression
- **Gestion des Membres** : Ajout, liste, suppression des membres
- **Paramètres Workspace** : Gestion des paramètres de configuration
- **Invitations** : Création et liste des invitations
- **Rôles et Permissions** : Support des rôles utilisateurs (SUPER_ADMIN, WORKSPACE_OWNER, etc.)

## Architecture

Le microservice utilise :
- **NestJS** pour la structure de l'application
- **gRPC** pour la communication inter-services
- **Prisma** pour l'accès à la base de données
- **Types partagés** dans `libs/shared/types/`
- **Logger partagé** dans `libs/shared/logger/`

## Services gRPC Disponibles

### WorkspaceService

- `Create` : Crée un nouvel espace de travail
- `FindAll` : Récupère la liste des workspaces avec pagination et recherche
- `FindById` : Récupère un workspace par son ID
- `Update` : Met à jour un workspace
- `Remove` : Supprime un workspace
- `ListMembers` : Liste les membres d'un workspace
- `AddMember` : Ajoute un membre à un workspace
- `RemoveMember` : Supprime un membre d'un workspace
- `GetSettings` : Récupère les paramètres d'un workspace
- `UpdateSettings` : Met à jour les paramètres d'un workspace
- `ListInvitations` : Liste les invitations d'un workspace
- `CreateInvitation` : Crée une invitation
- `GetMyWorkspaces` : Récupère les workspaces de l'utilisateur connecté

## Utilisation

### Démarrage du Service

```bash
npm run start:dev
```

Le service démarre sur le port 50052 par défaut (configurable via `WORKSPACE_GRPC_URL`).

### Exemple d'Utilisation gRPC

```typescript
import { Client, ClientGrpc } from '@nestjs/microservices';

// Dans un autre service
const client: ClientGrpc = ...;
const workspaceService = client.getService<WorkspaceService>('WorkspaceService');

const workspace = await workspaceService.create({
  ownerId: 'user-123',
  dto: { name: 'Mon Workspace', description: 'Description' }
}).toPromise();
```

## Types Partagés

Les DTOs sont définis dans `libs/shared/types/src/workspace/dtos.ts` :
- `CreateWorkspaceDto` : Pour la création
- `UpdateWorkspaceDto` : Pour les mises à jour
- `WorkspaceDto` : Représentation complète d'un workspace
- `WorkspaceMemberDto` : Pour les membres
- `WorkspaceSettingsDto` : Pour les paramètres
- `WorkspaceInvitationDto` : Pour les invitations

## Tests

Les tests unitaires sont disponibles dans :
- `src/workspaces.service.spec.ts` : Tests du service
- `src/workspaces.controller.spec.ts` : Tests du contrôleur gRPC

```bash
npm run test
```

## Optimisations

- **Transactions Prisma** : Utilisées pour les opérations critiques (création avec settings)
- **Logging Structuré** : Tous les événements sont loggés avec le logger partagé
- **Validation** : Utilisation de class-validator pour la validation des DTOs
- **Pagination** : Support de la pagination pour les listes
- **Recherche** : Recherche insensible à la casse sur nom et description

## Sécurité

- Validation des données d'entrée
- Gestion des erreurs avec exceptions partagées
- Logging de sécurité pour les opérations sensibles

## Déploiement

Ce microservice peut être déployé indépendamment en tant que service Docker ou Kubernetes.
