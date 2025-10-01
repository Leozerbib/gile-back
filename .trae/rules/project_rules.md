# Gile-Back Project Rules

## Overview

Gile-Back is an agile application backend built as a NestJS monorepo with microservices architecture. This document defines the technical implementation standards, architectural patterns, and development practices for the project.

## 1. Project Architecture

### 1.1 Monorepo Structure

The project follows a structured monorepo layout managed by `nest-cli.json`:

```
gile-back/
├── apps/                    # Microservice applications
│   ├── auth/               # Authentication & Profile service (port 50051)
│   ├── workspace/          # Workspace management service (port 50052)
│   ├── project/            # Project, Tickets & Sprints service (port 50053)
│   ├── chat/               # Chat & AI conversation service (port 50054)
│   ├── analytics/          # Analytics service (port 50055)
│   └── logger/             # Centralized logging service (port 50056)
├── libs/                   # Shared libraries
│   ├── proto/              # gRPC protocol definitions
│   └── shared/             # Common utilities and services
├── src/                    # Main HTTP gateway application (port 3000)
└── prisma/                 # Database schema and migrations
```

### 1.2 Service Boundaries

Each microservice has clearly defined responsibilities:

- **Main Gateway (HTTP)**: REST API gateway that routes requests to appropriate microservices
- **Auth Service**: User authentication, JWT management, and profile operations
- **Workspace Service**: Workspace CRUD, member management, settings, and invitations
- **Project Service**: Project management, tickets, sprints, and agile workflows
- **Chat Service**: AI conversations, chat sessions, and agent interactions
- **Analytics Service**: Usage tracking, metrics, and reporting
- **Logger Service**: Centralized logging and audit trails

## 2. Communication Patterns

### 2.1 gRPC Protocol

**RULE**: All inter-service communication MUST use gRPC with Protocol Buffers.

- **Proto Files Location**: `libs/proto/{service}/v1/{service}.proto`
- **Package Naming**: `{service}.v1` (e.g., `auth.v1`, `workspace.v1`)
- **Service Naming**: PascalCase (e.g., `Auth`, `WorkspaceService`, `Tickets`)

### 2.2 gRPC Configuration Standards

```typescript
// Standard gRPC microservice bootstrap
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    url: process.env.{SERVICE}_GRPC_URL ?? "0.0.0.0:5005X",
    package: ["health.v1", "{service}.v1"],
    protoPath: [
      join(process.cwd(), "libs/proto/health/v1/health.proto"),
      join(process.cwd(), "libs/proto/{service}/v1/{service}.proto"),
    ],
    loader: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      includeDirs: [join(process.cwd(), "libs/proto")],
    },
  },
});
```

### 2.3 Health Check Protocol

**RULE**: Every microservice MUST implement the Health service for connectivity monitoring.

- **Proto**: `libs/proto/health/v1/health.proto`
- **Package**: `health.v1`
- **Service**: `Health.Check`

## 3. Database Management

### 3.1 Prisma ORM Standards

**RULE**: All database operations MUST use Prisma ORM through the shared PrismaService.

- **Schema Location**: `prisma/schema.prisma`
- **Database**: PostgreSQL with schema `bibz-agile`
- **Shared Service**: `@shared/prisma/PrismaService`

### 3.2 Database Access Patterns

```typescript
// Correct Prisma service injection
constructor(private readonly prisma: PrismaService) {}

// Transaction usage for complex operations
const result = await this.prisma.$transaction(async tx => {
  // Multiple operations within transaction
});

// Proper error handling with Prisma
try {
  const result = await this.prisma.model.operation();
} catch (error) {
  // Handle Prisma errors appropriately
}
```

### 3.3 Migration Standards

- **Command**: `pnpm run prisma:migrate`
- **Generation**: `pnpm run prisma:generate`
- **Studio**: `pnpm run prisma:studio`

## 4. Shared Libraries

### 4.1 Path Aliases

**RULE**: Use TypeScript path aliases for all shared library imports.

```typescript
// Correct imports
import { LoggerClientService } from "@shared/logger";
import { PrismaService } from "@shared/prisma";
import { MicroserviceUnavailableException } from "@shared/errors";
import { PROTO_AUTH_PATH } from "@proto";

// Path mappings in tsconfig.json
{
  "@shared/types": ["libs/shared/types/src"],
  "@shared/errors": ["libs/shared/errors/src"],
  "@shared/logger": ["libs/shared/logger/src"],
  "@shared/utils": ["libs/shared/utils/src"],
  "@shared/prisma": ["libs/shared/prisma/src"],
  "@proto": ["libs/proto/index.ts"]
}
```

### 4.2 Shared Library Structure

- **Types**: Common TypeScript interfaces and types
- **Errors**: Standardized error handling and gRPC error mapping
- **Logger**: Centralized logging client for microservices
- **Utils**: Common utility functions
- **Prisma**: Database service and connection management

## 5. Error Handling

### 5.1 gRPC Error Management

**RULE**: Use standardized error handling for gRPC communication failures.

```typescript
// Error mapping utility
import { mapGrpcErrorToUnavailable } from "@shared/errors";

// Service unavailability handling
if (exception instanceof MicroserviceUnavailableException) {
  // Handle service unavailable scenarios
}

// gRPC error detection
if (isGrpcUnavailableError(error)) {
  // Handle connection failures
}
```

### 5.2 HTTP Gateway Error Filtering

**RULE**: Implement `GrpcToHttpExceptionFilter` for proper error translation from gRPC to HTTP.

```typescript
@Injectable()
@Catch()
export class GrpcToHttpExceptionFilter implements ExceptionFilter {
  // Convert gRPC errors to appropriate HTTP status codes
}
```

## 6. Logging Standards

### 6.1 Centralized Logging

**RULE**: All services MUST use the shared LoggerClientService for consistent logging.

```typescript
// Proper logging usage
await this.logger.log({
  level: "info" | "warn" | "error" | "debug" | "fatal",
  service: "service-name",
  func: "function-name",
  message: "Human-readable message",
  data: optionalDataObject,
});
```

### 6.2 Log Levels and Structure

- **DEBUG**: Development debugging information
- **INFO**: General operational messages
- **WARN**: Warning conditions that don't halt execution
- **ERROR**: Error conditions that affect functionality
- **FATAL**: Critical errors that may cause service failure

## 7. Development Practices

### 7.1 Code Quality Standards

**ESLint Configuration**:
- TypeScript recommended rules with type checking
- Prettier integration for consistent formatting
- Custom rules: `@typescript-eslint/no-explicit-any: off`

**Prettier Configuration**:
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 180,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

### 7.2 Testing Approach

**Unit Tests**:
- Location: `src/**/*.spec.ts`
- Framework: Jest
- Command: `pnpm run test`

**E2E Tests**:
- Location: `test/**/*.e2e-spec.ts`
- Configuration: `test/jest-e2e.json`
- Command: `pnpm run test:e2e`

### 7.3 Build and Deployment

**Build Commands**:
```bash
# Build specific service
pnpm run build:{service}

# Start development mode
pnpm run start:dev:{service}

# Production start
pnpm run start:prod
```

## 8. API Contracts

### 8.1 gRPC Service Definitions

**RULE**: All gRPC services MUST follow consistent naming and structure patterns.

```protobuf
syntax = "proto3";
package {service}.v1;

service {ServiceName} {
  rpc Create(CreateRequest) returns (CreateResponse);
  rpc FindAll(FindAllRequest) returns (FindAllResponse);
  rpc FindById(FindByIdRequest) returns (FindByIdResponse);
  rpc Update(UpdateRequest) returns (UpdateResponse);
  rpc Remove(RemoveRequest) returns (RemoveResponse);
}
```

### 8.2 Message Conventions

- **Request/Response Naming**: `{Operation}Request` / `{Operation}Response`
- **Field Naming**: snake_case in proto, camelCase in TypeScript
- **Timestamps**: Use `google.protobuf.Timestamp`
- **Optional Fields**: Use `optional` keyword appropriately

## 9. Security Practices

### 9.1 Authentication Flow

- **JWT Tokens**: Managed by Auth service
- **Service Communication**: Internal gRPC calls are trusted
- **Gateway Security**: HTTP gateway handles authentication/authorization

### 9.2 Data Protection

**RULE**: Never log or expose sensitive information such as:
- User passwords or tokens
- Database connection strings
- Internal service URLs in production logs

## 10. Agile Development Processes

### 10.1 Domain Models

The system supports comprehensive agile project management:

- **Workspaces**: Multi-tenant organization units
- **Projects**: Agile project containers
- **Epics**: Large feature groupings
- **Sprints**: Time-boxed development cycles
- **Tickets**: Individual work items
- **Tasks**: Granular work breakdown

### 10.2 Agent-Based Features

- **Chat System**: AI-powered conversations and assistance
- **Agent Definitions**: Configurable AI agent behaviors
- **Workflow Automation**: Automated agile process support
- **Analytics**: Performance and usage tracking

## 11. Environment Configuration

### 11.1 Service URLs

```bash
# Default gRPC service endpoints
AUTH_GRPC_URL=0.0.0.0:50051
WORKSPACE_GRPC_URL=0.0.0.0:50052
PROJECT_GRPC_URL=0.0.0.0:50053
CHAT_GRPC_URL=0.0.0.0:50054
ANALYTICS_GRPC_URL=0.0.0.0:50055
LOGGER_GRPC_URL=0.0.0.0:50056

# Main HTTP gateway
PORT=3000

# Database
DATABASE_URL=postgresql://...
```

### 11.2 Package Management

**RULE**: Use `pnpm` as the package manager for all operations.

```bash
# Install dependencies
pnpm install

# Add dependency
pnpm add package-name

# Development dependency
pnpm add -D package-name
```

## 12. Compliance and Monitoring

### 12.1 Health Monitoring

- All services expose health endpoints
- Main gateway aggregates service health status
- Implement proper circuit breaker patterns for service failures

### 12.2 Performance Standards

- gRPC calls should include timeout configurations
- Database queries should use appropriate indexing
- Implement proper pagination for large datasets
- Use transactions for data consistency requirements

---

**Note**: This document should be updated as the project evolves. All team members must follow these standards to ensure consistency and maintainability of the codebase.