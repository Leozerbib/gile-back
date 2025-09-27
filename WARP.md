# WARP.md - Gile-Back Project Documentation

This file provides comprehensive guidance to WARP (warp.dev) and AI agents when working with code in this repository.

## Project Overview

**Project**: gile-back - Agile Application Backend  
**Architecture**: NestJS monorepo with microservices (gRPC)  
**Database**: PostgreSQL with Prisma ORM  
**Package Manager**: pnpm  
**Purpose**: Backend for an agent-based agile project management application

## 1. Architecture & Structure

### 1.1 Monorepo Layout

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
│   ├── proto/              # gRPC protocol buffer definitions
│   └── shared/             # Common utilities and services
│       ├── errors/         # Error handling utilities
│       ├── logger/         # Logging client service
│       ├── prisma/         # Database service
│       ├── types/          # Shared TypeScript types & DTOs
│       └── utils/          # Common utility functions
├── src/                    # Main HTTP gateway (port 3000)
├── prisma/                 # Database schema and migrations
└── test/                   # E2E tests
```

### 1.2 Service Responsibilities

- **Main Gateway (HTTP)**: REST API gateway routing to microservices, Swagger documentation
- **Auth Service**: Authentication, JWT management, user profiles
- **Workspace Service**: Workspace CRUD, member management, settings, invitations
- **Project Service**: Projects, tickets, sprints, agile workflows
- **Chat Service**: AI conversations, agents, workflow automation
- **Analytics Service**: Usage tracking, metrics, reporting
- **Logger Service**: Centralized logging and audit trails

### 1.3 Communication Patterns

- **External → Gateway**: HTTP REST API (port 3000)
- **Gateway → Microservices**: gRPC protocol buffers
- **Inter-service**: Direct gRPC communication
- **Database**: Shared PostgreSQL via Prisma ORM

## 2. Development Commands

### 2.1 Package Management

```bash
# Install dependencies
pnpm install

# Add dependency
pnpm add package-name

# Add dev dependency  
pnpm add -D package-name
```

### 2.2 Database Operations

```bash
# Generate Prisma client
pnpm run prisma:generate

# Run migrations
pnpm run prisma:migrate

# Open Prisma Studio
pnpm run prisma:studio
```

### 2.3 Build Commands

```bash
# Build main gateway
pnpm run build:main

# Build specific service
pnpm run build:auth
pnpm run build:workspace
pnpm run build:project
pnpm run build:chat
pnpm run build:analytics
pnpm run build:logger
```

### 2.4 Development Mode

```bash
# Start main gateway (HTTP)
pnpm run start:dev

# Start specific microservice (gRPC)
pnpm run start:dev:auth
pnpm run start:dev:workspace
pnpm run start:dev:project
pnpm run start:dev:chat
pnpm run start:dev:analytics
pnpm run start:dev:logger

# Override port (PowerShell)
$env:PORT="4000"; pnpm run start:dev
$env:AUTH_GRPC_URL="127.0.0.1:60051"; pnpm run start:dev:auth

# Override port (bash/zsh)
PORT=4000 pnpm run start:dev
AUTH_GRPC_URL=127.0.0.1:60051 pnpm run start:dev:auth
```

### 2.5 Testing

```bash
# Unit tests
pnpm run test
pnpm run test:watch
pnpm run test:cov

# E2E tests
pnpm run test:e2e

# Run specific test
pnpm run test -- src/app.controller.spec.ts
pnpm run test -- -t "getHello"
```

### 2.6 Code Quality

```bash
# Lint with ESLint (type-aware)
pnpm run lint

# Format with Prettier
pnpm run format
```

## 3. Development Standards

### 3.1 Import Conventions

**ALWAYS use path aliases for shared libraries:**

```typescript
// ✅ CORRECT
import { CreateWorkspaceDto, BaseSearchQueryDto } from "@shared/types";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { ValidationError, MicroserviceUnavailableException } from "@shared/errors";
import { PROTO_WORKSPACE_PATH } from "@proto";

// ❌ WRONG - Don't use relative paths
import { CreateWorkspaceDto } from "../../../libs/shared/types/src";
```

### 3.2 gRPC Service Implementation

**Standard microservice bootstrap pattern:**

```typescript
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "node:path";

async function bootstrap() {
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
        oneofs: true,
        includeDirs: [join(process.cwd(), "libs/proto")],
      },
    },
  });
  await app.listen();
}
```

### 3.3 Service & Controller Pattern

**Service implementation:**

```typescript
@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  async search(params?: BaseSearchQueryDto): Promise<WorkspacesListDto> {
    // Use SearchQueryBuilder for consistent search/filter/sort
    const searchConditions = SearchQueryBuilder.buildSearchConditions(
      params?.search,
      ["name", "description", "slug"]
    );
    
    const sortOptions = SearchQueryBuilder.buildSortOptions(params?.sortBy);
    
    // Return paginated results with metadata
    return {
      items,
      total,
      skip,
      take,
      hasNext: skip + take < total,
      hasPrev: skip > 0,
    };
  }
}
```

**Controller implementation:**

```typescript
@Controller()
export class WorkspacesController {
  @GrpcMethod("WorkspaceService", "Search")
  async search(data: { params?: SearchParams }): Promise<SearchResponse> {
    // Map incoming params to BaseSearchQueryDto
    const searchDto: BaseSearchQueryDto = {
      search: data.params?.search,
      skip: data.params?.skip,
      take: data.params?.take,
      sortBy: data.params?.sort ? [{
        field: data.params.sort,
        order: data.params.order === "asc" ? SortOrder.ASC : SortOrder.DESC,
      }] : undefined,
    };
    
    const result = await this.service.search(searchDto);
    return { workspaces: result.items, total: result.total };
  }
}
```

### 3.4 Error Handling

**Consistent error handling patterns:**

```typescript
// Domain errors
import { ValidationError, NotFoundError } from "@shared/errors";

// gRPC connectivity errors
import { MicroserviceUnavailableException, mapGrpcErrorToUnavailable } from "@shared/errors";

try {
  const result = await this.prisma.workspaces.findUnique({ where: { id } });
  if (!result) {
    throw new NotFoundException(`Workspace with ID "${id}" not found`);
  }
} catch (error) {
  if (error instanceof NotFoundException) {
    throw error; // Re-throw known errors
  }
  // Log unexpected errors
  await this.loggerClient.log({
    level: "error",
    service: "workspace",
    func: "workspaces.getById",
    message: `Failed: ${error.message}`,
    data: { error: error.message, id },
  });
  throw error;
}
```

### 3.5 Logging Standards

**Use structured logging consistently:**

```typescript
await this.loggerClient.log({
  level: "info" | "warn" | "error" | "debug" | "fatal",
  service: "workspace",        // Service name
  func: "workspaces.create",    // Function identifier
  message: "Human-readable message",
  data: { id, name, ...metadata },  // Structured data
});
```

### 3.6 Database Transactions

**Use transactions for data consistency:**

```typescript
const result = await this.prisma.$transaction(async tx => {
  const workspace = await tx.workspaces.create({ data: {...} });
  await tx.workspace_settings.create({ 
    data: { workspace_id: workspace.id, ... } 
  });
  return workspace;
});
```

## 4. Protocol Buffer Conventions

### 4.1 Proto File Structure

```protobuf
syntax = "proto3";
package {service}.v1;

import "profile/v1/profile.proto";

service {ServiceName}Service {
  rpc Create(Create{Entity}Request) returns (Create{Entity}Response);
  rpc Search(Search{Entity}Request) returns (Search{Entity}Response);
  rpc GetById(Get{Entity}ByIdRequest) returns (Get{Entity}ByIdResponse);
  rpc Update(Update{Entity}Request) returns (Update{Entity}Response);
  rpc Delete(Delete{Entity}Request) returns (Delete{Entity}Response);
}

message Create{Entity}Request {
  string owner_id = 1;
  Create{Entity}Dto dto = 2;
}

message Create{Entity}Response {
  {Entity}Dto entity = 1;
}
```

### 4.2 Naming Conventions

- **Package**: `{service}.v1` (e.g., `workspace.v1`)
- **Service**: `{ServiceName}Service` (e.g., `WorkspaceService`)
- **Methods**: PascalCase (e.g., `Create`, `Search`, `GetById`)
- **Messages**: `{Operation}{Entity}{Request|Response}` 
- **Fields**: snake_case in proto, camelCase in TypeScript

## 5. Shared Types & DTOs

### 5.1 Common Patterns

**Search functionality (libs/shared/types/src/common/search.ts):**

```typescript
// Base search query with pagination, sort, filters
export class BaseSearchQueryDto extends PaginationQueryDto {
  search?: string;
  sortBy?: SortOption[];
  groupBy?: GroupByOption;
  filters?: SearchFilter;
}

// Use SearchQueryBuilder utilities
SearchQueryBuilder.buildSearchConditions(search, fields);
SearchQueryBuilder.buildSortOptions(sortOptions);
SearchQueryBuilder.applyFilters(query, filters);
```

**Pagination (libs/shared/types/src/common/page.ts):**

```typescript
export interface PaginationMeta {
  total: number;
  skip: number;
  take: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### 5.2 DTO Organization

- `libs/shared/types/src/workspace/dtos.ts` - Workspace DTOs
- `libs/shared/types/src/tickets/dtos.ts` - Ticket DTOs
- `libs/shared/types/src/sprints/dtos.ts` - Sprint DTOs
- `libs/shared/types/src/auth/dtos.ts` - Authentication DTOs
- `libs/shared/types/src/profile/dtos.ts` - Profile DTOs

## 6. Environment Configuration

### 6.1 Service URLs

```bash
# Main HTTP Gateway
PORT=3000
MAIN_HTTP_PORT=3000

# gRPC Microservices
AUTH_GRPC_URL=0.0.0.0:50051
WORKSPACE_GRPC_URL=0.0.0.0:50052
PROJECT_GRPC_URL=0.0.0.0:50053
CHAT_GRPC_URL=0.0.0.0:50054
ANALYTICS_GRPC_URL=0.0.0.0:50055
LOGGER_GRPC_URL=0.0.0.0:50056

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bibz-agile?schema=bibz-agile

# External Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## 7. Database Schema

### 7.1 Prisma Configuration

- **Schema**: `prisma/schema.prisma`
- **Database**: PostgreSQL
- **Schema Name**: `bibz-agile`
- **Client Generation**: `pnpm run prisma:generate`

### 7.2 Key Models

- **workspaces**: Multi-tenant organization units
- **projects**: Agile project containers
- **tickets**: Work items with status workflow
- **sprints**: Time-boxed development cycles
- **epics**: Large feature groupings
- **tasks**: Granular work breakdown
- **profiles**: User profiles
- **chat**: AI conversation sessions
- **agents**: AI agent definitions

## 8. Testing Strategy

### 8.1 Unit Tests

- **Location**: `src/**/*.spec.ts`, `apps/{service}/src/**/*.spec.ts`
- **Framework**: Jest
- **Coverage**: Services, controllers, utilities

### 8.2 E2E Tests

- **Location**: `test/**/*.e2e-spec.ts`
- **Config**: `test/jest-e2e.json`
- **Focus**: Gateway endpoints, gRPC communication

## 9. Security Practices

### 9.1 Authentication

- JWT tokens managed by Auth service
- Supabase integration for user management
- Bearer token authentication on HTTP gateway

### 9.2 Data Protection

- Never log sensitive data (passwords, tokens, keys)
- Use environment variables for configuration
- Implement proper input validation
- Use Prisma parameterized queries

## 10. Code Quality Standards

### 10.1 ESLint Configuration

```javascript
// eslint.config.mjs highlights
- @eslint/js recommended
- typescript-eslint recommendedTypeChecked
- eslint-plugin-prettier/recommended
- Custom: @typescript-eslint/no-explicit-any: off
```

### 10.2 Prettier Configuration

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

## 11. Health Monitoring

**Every microservice MUST implement Health.Check:**

```typescript
@GrpcMethod("Health", "Check")
check(data: HealthCheckDTO): HealthCheckResult {
  return { status: "SERVING" };
}
```

## 12. Common Troubleshooting

### 12.1 Service Connectivity Issues

```typescript
// Check for MicroserviceUnavailableException
if (error instanceof MicroserviceUnavailableException) {
  // Service is down or unreachable
}
```

### 12.2 Database Connection

```bash
# Test database connection
pnpm run prisma:studio

# Reset database (development only)
prisma migrate reset
```

## 13. Performance Optimization

### 13.1 Database Queries

- Use proper indexes (defined in schema.prisma)
- Implement pagination for large datasets
- Use `select` to limit returned fields
- Batch operations with transactions

### 13.2 gRPC Optimization

- Set appropriate timeouts
- Implement circuit breakers
- Use streaming for large data transfers
- Cache frequently accessed data

## 14. Deployment Considerations

### 14.1 Docker Support

- Each microservice can be containerized independently
- Use multi-stage builds for optimization
- Environment variables for configuration

### 14.2 Scaling

- Microservices can scale independently
- Database connection pooling via Prisma
- Implement rate limiting on gateway
- Use message queuing for async operations

## 15. Contributing Guidelines

### 15.1 Before Committing

1. Run linting: `pnpm run lint`
2. Run tests: `pnpm run test`
3. Format code: `pnpm run format`
4. Update types if needed: `pnpm run prisma:generate`

### 15.2 Pull Request Checklist

- [ ] Tests added/updated for new functionality
- [ ] Documentation updated (README, WARP.md)
- [ ] Proto files updated if API changed
- [ ] Database migrations created if schema changed
- [ ] Error handling implemented
- [ ] Logging added for important operations
- [ ] Types exported from @shared/types if needed

---

**Note**: This document serves as the authoritative guide for development practices in the gile-back project. All contributors and AI agents should follow these standards to ensure consistency and maintainability.
