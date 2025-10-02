# Service Architecture Guide - Complete Service Implementation

> **Complete guide for building a service from backend service to gateway API**
> 
> This document explains the complete flow for creating a new service in the gile-back microservices architecture, from the gRPC service layer through to the REST gateway.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Step 1: Define Proto File](#step-1-define-proto-file)
3. [Step 2: Create Shared Types (DTOs)](#step-2-create-shared-types-dtos)
4. [Step 3: Build Service Layer](#step-3-build-service-layer)
5. [Step 4: Create RPC Controller](#step-4-create-rpc-controller)
6. [Step 5: Create Gateway Client](#step-5-create-gateway-client)
7. [Step 6: Build Gateway Controller](#step-6-build-gateway-controller)
8. [Error Handling](#error-handling)
9. [Data Validation](#data-validation)
10. [Best Practices](#best-practices)
11. [Query Patterns](#query-patterns)
12. [Testing](#testing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. Proto Definition    (.proto files)
   ↓
2. TypeScript DTOs     (@shared/types)
   ↓
3. Service Layer       (apps/{service}/src/{entity}/{entity}.service.ts)
   ↓
4. RPC Controller      (apps/{service}/src/{entity}/{entity}.controller.ts)
   ↓
5. Gateway Client      (libs/shared/utils/src/client/{entity}/{entity}.client.ts)
   ↓
6. Gateway Controller  (apps/gilentry/src/{entity}-gateway/{entity}-gateway.controller.ts)
   ↓
7. REST API            (HTTP/REST endpoints)
```

### Directory Structure

```
gile-back/
├── apps/
│   ├── {service}/              # Microservice (e.g., project, workspace, auth)
│   │   └── src/
│   │       └── {entity}/       # Business entity
│   │           ├── {entity}.service.ts      # Business logic
│   │           └── {entity}.controller.ts   # gRPC controller
│   │
│   └── gilentry/               # API Gateway
│       └── src/
│           └── {entity}-gateway/
│               └── {entity}-gateway.controller.ts  # REST controller
│
├── libs/
│   ├── proto/                  # Protocol Buffer definitions
│   │   └── {entity}/
│   │       └── v1/
│   │           └── {entity}.proto
│   │
│   └── shared/
│       ├── types/              # Shared TypeScript DTOs
│       │   └── src/
│       │       └── {entity}/
│       │           └── dtos.ts
│       │
│       └── utils/              # Gateway clients
│           └── src/
│               └── client/
│                   └── {entity}/
│                       └── {entity}.client.ts
```

---

## Step 1: Define Proto File

**Location:** `libs/proto/{entity}/v1/{entity}.proto`

### Proto File Structure

```protobuf
syntax = "proto3";

package {entity}.v1;

// Import common types
import "google/protobuf/struct.proto";
import "profile/v1/profile.proto";
import "util/page.proto";
import "util/search.proto";

// ============================================================================
// ENUMS
// ============================================================================

enum EntityStatus {
  ENTITY_STATUS_UNSPECIFIED = 0;
  ACTIVE = 1;
  INACTIVE = 2;
  ARCHIVED = 3;
}

// ============================================================================
// MESSAGES - DTOs
// ============================================================================

message CreateEntityDto {
  string name = 1;
  optional string description = 2;
  EntityStatus status = 3;
  optional google.protobuf.Struct settings = 4;
  optional google.protobuf.Struct custom_fields = 5;
}

message UpdateEntityDto {
  optional string name = 1;
  optional string description = 2;
  optional EntityStatus status = 3;
  optional google.protobuf.Struct settings = 4;
  optional google.protobuf.Struct custom_fields = 5;
}

// ============================================================================
// MESSAGES - Response Objects
// ============================================================================

message Entity {
  int32 id = 1;                              // Use int32 for auto-increment IDs
  string name = 2;
  optional string slug = 3;
  optional string description = 4;
  EntityStatus status = 5;
  string workspace_id = 6;                   // Use string for UUIDs
  optional google.protobuf.Struct settings = 7;
  optional google.protobuf.Struct custom_fields = 8;
  string created_at = 9;                     // ISO 8601 string
  optional string updated_at = 10;
  optional string created_by = 11;           // UUID
  optional string updated_by = 12;
  optional profile.v1.ProfileOverview created_by_user = 13;
  optional profile.v1.ProfileOverview updated_by_user = 14;
}

message EntityOverview {
  int32 id = 1;
  string name = 2;
  EntityStatus status = 3;
  string created_at = 4;
}

message EntityList {
  repeated Entity items = 1;
  int32 total = 2 [deprecated = true];       // Use top-level pagination instead
  int32 skip = 3 [deprecated = true];
  int32 take = 4 [deprecated = true];
  bool has_next = 5;
  bool has_prev = 6;
}

message EntityOverviewList {
  repeated EntityOverview items = 1;
  int32 total = 2 [deprecated = true];
  int32 skip = 3 [deprecated = true];
  int32 take = 4 [deprecated = true];
  bool has_next = 5;
  bool has_prev = 6;
}

// ============================================================================
// REQUESTS
// ============================================================================

message CreateRequest {
  string user_id = 1;                        // Always include user_id for auth
  string workspace_id = 2;                   // Context (workspace, team, etc.)
  CreateEntityDto dto = 3;
}

message SearchRequest {
  string user_id = 1;
  string workspace_id = 2;
  optional util.SearchQuery params = 3;
}

message GetByIdRequest {
  string user_id = 1;
  int32 id = 2;                              // or string for UUID
}

message GetOverviewRequest {
  string user_id = 1;
  string workspace_id = 2;
  optional util.SearchQuery params = 3;
}

message UpdateRequest {
  string user_id = 1;
  int32 id = 2;
  UpdateEntityDto dto = 3;
}

message DeleteRequest {
  string user_id = 1;
  int32 id = 2;
}

message DeleteResponse {
  bool success = 1;
}

// ============================================================================
// SERVICE
// ============================================================================

service Entities {
  rpc Create (CreateRequest) returns (Entity);
  rpc Search (SearchRequest) returns (EntityList);
  rpc GetById (GetByIdRequest) returns (Entity);
  rpc GetOverview (GetOverviewRequest) returns (EntityOverviewList);
  rpc Update (UpdateRequest) returns (Entity);
  rpc Delete (DeleteRequest) returns (DeleteResponse);
}
```

### Proto Best Practices

1. **Use semantic versioning:** Always version your proto files (`v1`, `v2`, etc.)
2. **Field numbers:** Never reuse field numbers, even for deleted fields
3. **Optional vs Required:**
   - Use `optional` for nullable fields
   - Don't use `required` (deprecated in proto3)
4. **Naming conventions:**
   - Messages: PascalCase (e.g., `CreateEntityDto`)
   - Fields: snake_case (e.g., `user_id`, `created_at`)
   - Services: PascalCase (e.g., `Entities`)
   - RPCs: PascalCase (e.g., `GetById`)
5. **Always include:**
   - `user_id` in requests for authentication
   - `workspace_id` or context ID for multi-tenancy
   - Timestamps as ISO 8601 strings
6. **Use common utility imports:**
   - `util/page.proto` for pagination
   - `util/search.proto` for search queries
   - `google/protobuf/struct.proto` for JSON objects

---

## Step 2: Create Shared Types (DTOs)

**Location:** `libs/shared/types/src/{entity}/dtos.ts`

### DTO Structure

```typescript
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { 
  IsBoolean, IsDateString, IsEnum, IsInt, IsObject, 
  IsOptional, IsString, IsUUID, Length, Max, Min 
} from "class-validator";
import { Expose, Transform, Type } from "class-transformer";
import { BasePaginationDto } from "../common/page";
import { ProfileOverview } from "../profile/dtos";

// ============================================================================
// ENUMS (matching proto definitions)
// ============================================================================

export enum EntityStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new entity
 * Used in REST endpoints and gRPC services
 * Compatible with Prisma model
 */
export class CreateEntityDto {
  @ApiProperty({
    description: "Entity name",
    example: "My Entity",
    minLength: 1,
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsString({ message: "Name must be a string" })
  @Length(1, 255, { message: "Name must be between 1 and 255 characters" })
  name!: string;

  @ApiPropertyOptional({
    description: "Entity description",
    example: "A detailed description",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Transform(({ value }): string | undefined => 
    typeof value === "string" ? value.trim() : value
  )
  description?: string;

  @ApiProperty({
    description: "Entity status",
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
    example: EntityStatus.ACTIVE,
    enumName: "EntityStatus",
  })
  @Expose()
  @IsEnum(EntityStatus, { message: "Invalid entity status" })
  status: EntityStatus = EntityStatus.ACTIVE;

  @ApiPropertyOptional({
    description: "Entity settings",
    type: "object",
    example: { theme: "dark", notifications: true },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Settings must be an object" })
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Custom fields",
    type: "object",
    example: { priority: "high", tags: ["important"] },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Custom fields must be an object" })
  custom_fields?: Record<string, any>;
}

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating an entity
 * All fields are optional for partial updates
 * Compatible with Prisma update operations
 */
export class UpdateEntityDto {
  @ApiPropertyOptional({
    description: "Entity name",
    example: "Updated Entity",
    minLength: 1,
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Name must be a string" })
  @Length(1, 255, { message: "Name must be between 1 and 255 characters" })
  name?: string;

  @ApiPropertyOptional({
    description: "Entity description",
    example: "Updated description",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Transform(({ value }): string | undefined => 
    typeof value === "string" ? value.trim() : value
  )
  description?: string;

  @ApiPropertyOptional({
    description: "Entity status",
    enum: EntityStatus,
    example: EntityStatus.INACTIVE,
    enumName: "EntityStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(EntityStatus, { message: "Invalid entity status" })
  status?: EntityStatus;

  @ApiPropertyOptional({
    description: "Entity settings",
    type: "object",
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Settings must be an object" })
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Custom fields",
    type: "object",
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Custom fields must be an object" })
  custom_fields?: Record<string, any>;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Main entity DTO
 * Represents the complete entity data
 */
export class EntityDto {
  @ApiProperty({
    description: "Entity ID",
    example: 1,
    type: "integer",
  })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({
    description: "Entity name",
    example: "My Entity",
    type: "string",
  })
  @Expose()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: "Entity slug (URL-friendly)",
    example: "my-entity",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: "Entity description",
    example: "A detailed description",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Entity status",
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
    enumName: "EntityStatus",
  })
  @Expose()
  @IsEnum(EntityStatus)
  status!: EntityStatus;

  @ApiProperty({
    description: "Workspace ID",
    example: "workspace-uuid-123",
    type: "string",
  })
  @Expose()
  @IsUUID()
  workspace_id!: string;

  @ApiPropertyOptional({
    description: "Entity settings",
    type: "object",
  })
  @Expose()
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Custom fields",
    type: "object",
  })
  @Expose()
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;

  @ApiProperty({
    description: "Creation timestamp (ISO 8601)",
    example: "2024-01-15T10:30:00Z",
    type: "string",
  })
  @Expose()
  @IsDateString()
  created_at!: string;

  @ApiPropertyOptional({
    description: "Last update timestamp (ISO 8601)",
    example: "2024-01-20T15:45:00Z",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString()
  updated_at?: string;

  @ApiPropertyOptional({
    description: "Creator user ID",
    example: "user-uuid-456",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiPropertyOptional({
    description: "Last updater user ID",
    example: "user-uuid-789",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID()
  updated_by?: string;

  @ApiPropertyOptional({
    description: "Creator user profile",
    type: () => ProfileOverview,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Last updater user profile",
    type: () => ProfileOverview,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  updated_by_user?: ProfileOverview;
}

/**
 * Entity overview DTO
 * Lightweight version for lists and previews
 */
export class EntityOverview {
  @ApiProperty({
    description: "Entity ID",
    example: 1,
    type: "integer",
  })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({
    description: "Entity name",
    example: "My Entity",
    type: "string",
  })
  @Expose()
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Entity status",
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
    enumName: "EntityStatus",
  })
  @Expose()
  @IsEnum(EntityStatus)
  status!: EntityStatus;

  @ApiProperty({
    description: "Creation timestamp (ISO 8601)",
    example: "2024-01-15T10:30:00Z",
    type: "string",
  })
  @Expose()
  @IsDateString()
  created_at!: string;
}

/**
 * Paginated list of entities
 */
export class EntityListDto extends BasePaginationDto<EntityDto> {
  @ApiProperty({
    description: "List of entities",
    type: [EntityDto],
    isArray: true,
  })
  @Expose()
  @Type(() => EntityDto)
  items!: EntityDto[];
}

/**
 * Paginated list of entity overviews
 */
export class EntityOverviewListDto extends BasePaginationDto<EntityOverview> {
  @ApiProperty({
    description: "List of entity overviews",
    type: [EntityOverview],
    isArray: true,
  })
  @Expose()
  @Type(() => EntityOverview)
  items!: EntityOverview[];
}

// ============================================================================
// PRISMA SELECT OBJECTS
// ============================================================================

/**
 * Prisma select object for EntityOverview
 * Use in Prisma queries to fetch only necessary fields
 */
export const EntityOverviewSelect = {
  id: true,
  name: true,
  status: true,
  created_at: true,
} as const;
```

### DTO Best Practices

1. **Validation decorators:**
   - Always use `class-validator` decorators
   - Provide clear error messages
   - Use appropriate validators for data types

2. **Swagger documentation:**
   - Use `@ApiProperty` for required fields
   - Use `@ApiPropertyOptional` for optional fields
   - Provide examples, descriptions, and constraints

3. **Class transformer:**
   - Use `@Expose()` for serialization
   - Use `@Type()` for nested objects
   - Use `@Transform()` for data transformation

4. **Naming:**
   - DTOs end with `Dto` (e.g., `CreateEntityDto`)
   - Lists end with `ListDto` (e.g., `EntityListDto`)
   - Overviews end with `Overview` (e.g., `EntityOverview`)

5. **Field types:**
   - Use `!` for required fields
   - Use `?` for optional fields
   - Provide default values where appropriate

---

## Step 3: Build Service Layer

**Location:** `apps/{service}/src/{entity}/{entity}.service.ts`

### Service Structure

```typescript
import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import {
  CreateEntityDto,
  UpdateEntityDto,
  EntityDto,
  EntityListDto,
  EntityStatus,
  BaseSearchQueryDto,
  SearchQueryBuilder,
  BasePaginationDto,
  ProfileOverviewSelect,
  EntityOverviewSelect,
  EntityOverview,
} from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Entity management service
 * 
 * Provides CRUD operations and business logic for entities:
 * - create: Create a new entity
 * - search: Search with pagination and filters
 * - getById: Retrieve an entity by ID
 * - getOverview: Retrieve entity overview
 * - update: Update an existing entity
 * - delete: Delete an entity
 * 
 * @author Your Name
 * @version 1.0.0
 */
@Injectable()
export class EntitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
    // Inject other services as needed
  ) {}

  /**
   * Create a new entity with validation and logging
   * Uses transaction for data integrity
   * 
   * @param userId - ID of the user creating the entity
   * @param workspaceId - ID of the workspace context
   * @param dto - DTO containing entity data
   * @returns The created entity
   * @throws RpcException with INVALID_ARGUMENT if data is invalid
   * @throws RpcException with ALREADY_EXISTS if slug conflicts
   * @throws RpcException with PERMISSION_DENIED if user lacks rights
   */
  async create(
    userId: string,
    workspaceId: string,
    dto: CreateEntityDto
  ): Promise<EntityDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "entity-service",
      func: "entities.create",
      message: `Creating entity with name: ${dto.name}`,
      data: { userId, name: dto.name, workspaceId },
    });

    // Validate input data
    if (!dto?.name?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "entity-service",
        func: "entities.create",
        message: "Entity creation failed: name is required",
      });
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Entity name is required",
      });
    }

    if (!workspaceId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Workspace ID is required",
      });
    }

    // Verify workspace exists
    const workspace = await this.prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Workspace with ID "${workspaceId}" not found`,
      });
    }

    // Check permissions (example - adapt to your auth system)
    const hasPermission = await this.checkUserPermission(
      workspaceId,
      userId,
      "create",
      "entity"
    );

    if (!hasPermission) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: "You don't have permission to create entities in this workspace",
      });
    }

    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check slug uniqueness
    const existingEntity = await this.prisma.entities.findFirst({
      where: {
        slug,
        workspace_id: workspaceId,
      },
    });

    if (existingEntity) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Entity with slug "${slug}" already exists in this workspace`,
      });
    }

    try {
      // Create entity
      const entity = await this.prisma.entities.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() ?? null,
          workspace_id: workspaceId,
          status: dto.status ?? EntityStatus.ACTIVE,
          settings: dto.settings ?? null,
          custom_fields: dto.custom_fields ?? null,
          created_by: userId,
          updated_by: userId,
        },
        include: {
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
        },
      });

      if (!entity) {
        throw new Error("Failed to create entity");
      }

      await this.loggerClient.log({
        level: "info",
        service: "entity-service",
        func: "entities.create",
        message: `Entity created successfully with ID: ${entity.id}`,
        data: { id: entity.id, name: entity.name },
      });

      return plainToInstance(EntityDto, entity, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "entity-service",
          func: "entities.create",
          message: `Failed to create entity: ${error.message}`,
          data: { error: error.message, userId, name: dto.name },
        });
      }
      throw error;
    }
  }

  /**
   * Search entities with pagination and filters
   * 
   * @param userId - ID of the user making the request
   * @param workspaceId - ID of the workspace context
   * @param params - Search and pagination parameters
   * @returns Paginated list of entities
   */
  async search(
    userId: string,
    workspaceId: string,
    params?: BaseSearchQueryDto
  ): Promise<EntityListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    // Verify workspace exists
    const workspace = await this.prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Workspace with ID "${workspaceId}" not found`,
      });
    }

    // Check permissions
    const hasPermission = await this.checkUserPermission(
      workspaceId,
      userId,
      "get",
      "entity"
    );

    if (!hasPermission) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: "You don't have permission to read entities in this workspace",
      });
    }

    // Build base where clause
    let where: Prisma.entitiesWhereInput = {
      workspace_id: workspaceId,
      // Add visibility/access control here
    };

    // Apply text search
    const searchConditions = SearchQueryBuilder.buildSearchConditions(
      params?.search,
      ["name", "description"]
    );
    where = { ...where, ...searchConditions };

    // Apply filters
    const filterMapping: Record<string, string> = {
      status: "status",
      name: "name",
    };

    if (params?.filters) {
      const prismaFilters: Prisma.entitiesWhereInput = {};
      for (const [key, value] of Object.entries(params.filters)) {
        const mappedKey = filterMapping[key] ?? key;
        prismaFilters[mappedKey] = value;
      }
      where = SearchQueryBuilder.applyFilters(where, prismaFilters);
    }

    // Build orderBy
    const sortOptions = SearchQueryBuilder.buildSortOptions(params?.sortBy);
    const fieldMapping: Record<string, keyof Prisma.entitiesOrderByWithRelationInput> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      name: "name",
      status: "status",
    };

    const orderByArray: Prisma.entitiesOrderByWithRelationInput[] = [];
    for (const [field, direction] of Object.entries(sortOptions)) {
      const mappedField = fieldMapping[field] ?? (field as keyof Prisma.entitiesOrderByWithRelationInput);
      orderByArray.push({ 
        [mappedField]: direction as Prisma.SortOrder 
      } as Prisma.entitiesOrderByWithRelationInput);
    }

    // Default sort
    const orderBy = orderByArray.length > 0 
      ? orderByArray 
      : [{ created_at: Prisma.SortOrder.desc }];

    try {
      const [items, total] = await Promise.all([
        this.prisma.entities.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            created_by_user: {
              select: ProfileOverviewSelect,
            },
            updated_by_user: {
              select: ProfileOverviewSelect,
            },
          },
        }),
        this.prisma.entities.count({ where }),
      ]);

      return BasePaginationDto.create(
        items.map(item => 
          plainToInstance(EntityDto, item, { excludeExtraneousValues: true })
        ),
        total,
        skip,
        take,
        EntityListDto
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "entity-service",
          func: "entities.search",
          message: `Failed to search entities: ${error.message}`,
          data: { error: error.message, params },
        });
      }
      throw error;
    }
  }

  /**
   * Get entity by ID
   * 
   * @param id - Entity ID
   * @param userId - ID of the user making the request
   * @returns The entity
   * @throws RpcException with NOT_FOUND if entity doesn't exist
   * @throws RpcException with PERMISSION_DENIED if user lacks access
   */
  async getById(id: number, userId?: string): Promise<EntityDto> {
    try {
      const item = await this.prisma.entities.findUnique({
        where: { id },
        include: {
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
        },
      });

      if (!item) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Entity with ID "${id}" not found`,
        });
      }

      if (userId) {
        const hasPermission = await this.checkUserPermission(
          item.workspace_id,
          userId,
          "get",
          "entity"
        );

        if (!hasPermission) {
          throw new RpcException({
            code: status.PERMISSION_DENIED,
            message: "You don't have permission to view this entity",
          });
        }
      }

      return plainToInstance(EntityDto, item, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "entity-service",
          func: "entities.getById",
          message: `Failed to get entity by ID: ${error.message}`,
          data: { error: error.message, id },
        });
      }
      throw error;
    }
  }

  /**
   * Get entity overview with pagination
   * 
   * @param workspaceId - ID of the workspace context
   * @param userId - ID of the user making the request
   * @param params - Search and pagination parameters
   * @returns Paginated list of entity overviews
   */
  async getOverview(
    workspaceId: string,
    userId: string,
    params?: BaseSearchQueryDto
  ): Promise<EntityListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 10;
    const search = params?.search ?? "";

    try {
      const where: Prisma.entitiesWhereInput = {
        workspace_id: workspaceId,
        name: { contains: search, mode: "insensitive" },
      };

      const [items, total] = await Promise.all([
        this.prisma.entities.findMany({
          where,
          select: EntityOverviewSelect,
          orderBy: { created_at: Prisma.SortOrder.desc },
          skip,
          take,
        }),
        this.prisma.entities.count({ where }),
      ]);

      return BasePaginationDto.create(
        items.map(item => 
          plainToInstance(EntityOverview, item, { excludeExtraneousValues: true })
        ),
        total,
        skip,
        take,
        EntityListDto
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "entity-service",
          func: "entities.getOverview",
          message: `Failed to get entity overview: ${error.message}`,
          data: { error: error.message, search, userId },
        });
      }
      throw error;
    }
  }

  /**
   * Update an existing entity
   * 
   * @param id - Entity ID to update
   * @param dto - DTO containing update data
   * @param updatedBy - ID of the user performing the update
   * @returns The updated entity
   * @throws RpcException with NOT_FOUND if entity doesn't exist
   * @throws RpcException with INVALID_ARGUMENT if no data provided
   * @throws RpcException with ALREADY_EXISTS if new slug conflicts
   * @throws RpcException with PERMISSION_DENIED if user lacks rights
   */
  async update(
    id: number,
    dto: UpdateEntityDto,
    updatedBy: string
  ): Promise<EntityDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "entity-service",
      func: "entities.update",
      message: `Updating entity: ${id}`,
      data: { id, updatedBy, changes: Object.keys(dto) },
    });

    // Validate input
    if (!dto || Object.keys(dto).length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "No data provided for update",
      });
    }

    try {
      // Verify entity exists
      const existingEntity = await this.prisma.entities.findUnique({
        where: { id },
        select: { id: true, workspace_id: true, name: true, slug: true },
      });

      if (!existingEntity) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Entity with ID "${id}" not found`,
        });
      }

      // Check permissions
      const hasPermission = await this.checkUserPermission(
        existingEntity.workspace_id,
        updatedBy,
        "update",
        "entity"
      );

      if (!hasPermission) {
        throw new RpcException({
          code: status.PERMISSION_DENIED,
          message: "You don't have permission to update this entity",
        });
      }

      // Check slug uniqueness if name is being changed
      if (dto.name && dto.name !== existingEntity.name) {
        const newSlug = dto.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const slugConflict = await this.prisma.entities.findFirst({
          where: {
            slug: newSlug,
            workspace_id: existingEntity.workspace_id,
            id: { not: id },
          },
        });

        if (slugConflict) {
          throw new RpcException({
            code: status.ALREADY_EXISTS,
            message: `Entity with slug "${newSlug}" already exists in this workspace`,
          });
        }
      }

      // Prepare update data
      const updateData: Prisma.entitiesUpdateInput = {
        updated_by_user: { connect: { user_id: updatedBy } },
        updated_at: new Date(),
      };

      if (dto.name !== undefined) {
        updateData.name = dto.name.trim();
        updateData.slug = dto.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      if (dto.description !== undefined) {
        updateData.description = dto.description?.trim() ?? null;
      }
      if (dto.status !== undefined) {
        updateData.status = dto.status;
      }
      if (dto.settings !== undefined) {
        updateData.settings = dto.settings;
      }
      if (dto.custom_fields !== undefined) {
        updateData.custom_fields = dto.custom_fields;
      }

      const updated = await this.prisma.entities.update({
        where: { id },
        data: updateData,
        include: {
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
        },
      });

      await this.loggerClient.log({
        level: "info",
        service: "entity-service",
        func: "entities.update",
        message: `Entity updated successfully: ${updated.id}`,
        data: { id: updated.id, name: updated.name, slug: updated.slug },
      });

      return plainToInstance(EntityDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "entity-service",
          func: "entities.update",
          message: `Failed to update entity: ${error.message}`,
          data: { error: error.message, id, updatedBy },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Delete an entity
   * 
   * @param id - Entity ID to delete
   * @param deletedBy - ID of the user performing the deletion
   * @returns Deletion result
   * @throws RpcException with NOT_FOUND if entity doesn't exist
   * @throws RpcException with PERMISSION_DENIED if user lacks rights
   */
  async delete(id: number, deletedBy: string): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "debug",
      service: "entity-service",
      func: "entities.delete",
      message: `Deleting entity: ${id}`,
      data: { id, deletedBy },
    });

    try {
      // Verify entity exists
      const existingEntity = await this.prisma.entities.findUnique({
        where: { id },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!existingEntity) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Entity with ID "${id}" not found`,
        });
      }

      // Check permissions
      const hasPermission = await this.checkUserPermission(
        existingEntity.workspace_id,
        deletedBy,
        "delete",
        "entity"
      );

      if (!hasPermission) {
        throw new RpcException({
          code: status.PERMISSION_DENIED,
          message: "You don't have permission to delete this entity",
        });
      }

      // Delete entity (CASCADE will handle related records)
      await this.prisma.entities.delete({
        where: { id },
      });

      await this.loggerClient.log({
        level: "info",
        service: "entity-service",
        func: "entities.delete",
        message: `Entity deleted successfully: ${id}`,
        data: { id, name: existingEntity.name },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "entity-service",
          func: "entities.delete",
          message: `Failed to delete entity: ${error.message}`,
          data: { error: error.message, id },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Check user permission (adapt to your authorization system)
   */
  private async checkUserPermission(
    workspaceId: string,
    userId: string,
    action: string,
    resource: string
  ): Promise<boolean> {
    // Implement your authorization logic here
    // This is a placeholder example
    return true;
  }
}
```

### Service Best Practices

1. **Always log operations:**
   - Log entry points (debug level)
   - Log successful operations (info level)
   - Log errors (error level with full context)

2. **Input validation:**
   - Validate all inputs before processing
   - Throw appropriate RpcException codes
   - Provide clear error messages

3. **Permission checks:**
   - Always verify workspace/context exists
   - Check user permissions before operations
   - Use consistent permission checking patterns

4. **Error handling:**
   - Catch and rethrow RpcExceptions
   - Log errors with full context
   - Don't expose sensitive data in error messages

5. **Database operations:**
   - Use transactions for multi-step operations
   - Always include timestamps
   - Use Prisma relations for nested data

6. **Return types:**
   - Use `plainToInstance` for DTO transformation
   - Set `excludeExtraneousValues: true`
   - Return complete DTOs with all fields

---

## Step 4: Create RPC Controller

**Location:** `apps/{service}/src/{entity}/{entity}.controller.ts`

### RPC Controller Structure

```typescript
import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { EntitiesService } from "./entities.service";
import type { BaseSearchQueryDto } from "@shared/types";
import { 
  CreateEntityDto, 
  UpdateEntityDto, 
  EntityDto, 
  EntityListDto 
} from "@shared/types";

/**
 * gRPC controller for Entity service
 * Handles RPC method calls and delegates to the service layer
 * 
 * Pattern: Controller receives gRPC calls → Logs request → Calls service → Logs response
 */
@Controller()
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly logger: LoggerClientService,
  ) {}

  /**
   * Create a new entity via gRPC
   * 
   * @GrpcMethod decorator maps to proto service method
   * First param is service name, second is method name (must match proto)
   */
  @GrpcMethod("Entities", "Create")
  async create(data: {
    user_id: string;
    workspace_id: string;
    dto: CreateEntityDto;
  }): Promise<EntityDto> {
    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.create",
      message: "gRPC Create entity request",
      data,
    });

    const entity = await this.entitiesService.create(
      data.user_id,
      data.workspace_id,
      data.dto
    );

    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.create",
      message: "gRPC Create entity response",
      data: { entityId: entity.id, workspaceId: data.workspace_id },
    });

    return entity;
  }

  /**
   * Search entities via gRPC
   */
  @GrpcMethod("Entities", "Search")
  async search(data: {
    user_id: string;
    workspace_id: string;
    params?: BaseSearchQueryDto;
  }): Promise<EntityListDto> {
    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.search",
      message: "gRPC Search entities request",
      data,
    });

    const list = await this.entitiesService.search(
      data.user_id,
      data.workspace_id,
      data.params ?? {}
    );

    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.search",
      message: "gRPC Search entities response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  /**
   * Get entity by ID via gRPC
   */
  @GrpcMethod("Entities", "GetById")
  async getById(data: {
    user_id: string;
    id: number | string;
  }): Promise<EntityDto> {
    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.getById",
      message: `gRPC GetById entity request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const entity = await this.entitiesService.getById(id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.getById",
      message: `gRPC GetById entity response for id ${data.id}`,
      data: { entityId: entity?.id },
    });

    return entity;
  }

  /**
   * Get entity overview via gRPC
   */
  @GrpcMethod("Entities", "GetOverview")
  async getOverview(data: {
    user_id: string;
    workspace_id: string;
    params?: BaseSearchQueryDto;
  }): Promise<EntityListDto> {
    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.getOverview",
      message: `gRPC GetOverview entities request for workspace ${data.workspace_id}`,
      data,
    });

    const list = await this.entitiesService.getOverview(
      data.workspace_id,
      data.user_id,
      data.params ?? {}
    );

    return list;
  }

  /**
   * Update entity via gRPC
   */
  @GrpcMethod("Entities", "Update")
  async update(data: {
    user_id: string;
    id: number | string;
    dto: UpdateEntityDto;
  }): Promise<EntityDto> {
    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.update",
      message: `gRPC Update entity request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const entity = await this.entitiesService.update(id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.update",
      message: `gRPC Update entity response for id ${data.id}`,
      data: { entityId: entity.id },
    });

    return entity;
  }

  /**
   * Delete entity via gRPC
   */
  @GrpcMethod("Entities", "Delete")
  async delete(data: {
    user_id: string;
    id: number | string;
  }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.delete",
      message: `gRPC Delete entity request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const result = await this.entitiesService.delete(id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "entity-service",
      func: "entities.grpc.delete",
      message: `gRPC Delete entity response for id ${data.id}`,
      data: { result },
    });

    return result;
  }
}
```

### RPC Controller Best Practices

1. **@GrpcMethod decorator:**
   - First parameter: service name from proto (e.g., "Entities")
   - Second parameter: method name from proto (e.g., "Create")
   - Must match exactly with proto definition

2. **Parameter types:**
   - Match proto message structure exactly
   - Handle both `number` and `string` for IDs (gRPC quirk)
   - Use optional params with default values

3. **Logging:**
   - Log all incoming requests
   - Log all outgoing responses
   - Include relevant context data

4. **Thin controller:**
   - Controller should only handle RPC routing
   - Delegate all business logic to service
   - Minimal transformation

5. **Error handling:**
   - Let service layer handle errors
   - Don't catch and re-throw unnecessarily
   - RpcExceptions propagate automatically

---

## Step 5: Create Gateway Client

**Location:** `libs/shared/utils/src/client/{entity}/{entity}.client.ts`

### Gateway Client Structure

```typescript
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import type {
  CreateEntityDto,
  UpdateEntityDto,
  EntityDto,
  EntityListDto,
  BaseSearchQueryDto,
} from "@shared/types";

/**
 * gRPC service interface
 * Matches the proto service definition
 * Used for type safety when calling gRPC methods
 */
interface EntitiesGrpc {
  Create(request: {
    user_id: string;
    workspace_id: string;
    dto: CreateEntityDto;
  }): Observable<EntityDto>;

  Search(request: {
    user_id: string;
    workspace_id: string;
    params?: BaseSearchQueryDto;
  }): Observable<EntityListDto>;

  GetById(request: {
    user_id: string;
    id: number;
  }): Observable<EntityDto>;

  GetOverview(request: {
    user_id: string;
    workspace_id: string;
    params?: BaseSearchQueryDto;
  }): Observable<EntityListDto>;

  Update(request: {
    user_id: string;
    id: number;
    dto: UpdateEntityDto;
  }): Observable<EntityDto>;

  Delete(request: {
    user_id: string;
    id: number;
  }): Observable<{ success: boolean }>;
}

/**
 * Gateway service for Entity gRPC communication
 * 
 * This service provides a typed interface for calling Entity service via gRPC
 * Used by the API gateway to communicate with the Entity microservice
 * 
 * Pattern: Convert Observable to Promise using firstValueFrom
 */
@Injectable()
export class EntitiesGatewayService implements OnModuleInit {
  private svc!: EntitiesGrpc;

  /**
   * Inject the gRPC client
   * 
   * @param client - The gRPC client instance
   *                 Injection token must match module configuration
   *                 Example: "ENTITY_PACKAGE" configured in module
   */
  constructor(
    @Inject("ENTITY_PACKAGE") private readonly client: ClientGrpc
  ) {}

  /**
   * Initialize the gRPC service on module initialization
   * Gets the service proxy from the gRPC client
   * Service name must match proto package and service name
   */
  onModuleInit() {
    this.svc = this.client.getService<EntitiesGrpc>("Entities");
  }

  /**
   * Create a new entity
   * 
   * @param user_id - ID of the user creating the entity
   * @param workspace_id - ID of the workspace context
   * @param dto - Entity creation data
   * @returns Promise resolving to the created entity
   */
  async create(
    user_id: string,
    workspace_id: string,
    dto: CreateEntityDto
  ): Promise<EntityDto> {
    return await firstValueFrom(
      this.svc.Create({ user_id, workspace_id, dto })
    );
  }

  /**
   * Search entities with pagination and filters
   * 
   * @param user_id - ID of the user making the request
   * @param workspace_id - ID of the workspace context
   * @param params - Search and pagination parameters
   * @returns Promise resolving to paginated entity list
   */
  async search(
    user_id: string,
    workspace_id: string,
    params?: BaseSearchQueryDto
  ): Promise<EntityListDto> {
    return await firstValueFrom(
      this.svc.Search({ user_id, workspace_id, params })
    );
  }

  /**
   * Find entity by ID
   * 
   * @param user_id - ID of the user making the request
   * @param id - Entity ID
   * @returns Promise resolving to the entity
   */
  async findById(user_id: string, id: number): Promise<EntityDto> {
    return await firstValueFrom(this.svc.GetById({ user_id, id }));
  }

  /**
   * Update an entity
   * 
   * @param user_id - ID of the user performing the update
   * @param id - Entity ID
   * @param dto - Entity update data
   * @returns Promise resolving to the updated entity
   */
  async update(
    user_id: string,
    id: number,
    dto: UpdateEntityDto
  ): Promise<EntityDto> {
    return await firstValueFrom(this.svc.Update({ user_id, id, dto }));
  }

  /**
   * Delete an entity
   * 
   * @param user_id - ID of the user performing the deletion
   * @param id - Entity ID
   * @returns Promise resolving to deletion result
   */
  async remove(user_id: string, id: number): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.Delete({ user_id, id }));
  }

  /**
   * Get entity overview with pagination
   * 
   * @param user_id - ID of the user making the request
   * @param workspace_id - ID of the workspace context
   * @param params - Search and pagination parameters
   * @returns Promise resolving to paginated entity overview list
   */
  async getOverview(
    user_id: string,
    workspace_id: string,
    params?: BaseSearchQueryDto
  ): Promise<EntityListDto> {
    return await firstValueFrom(
      this.svc.GetOverview({ user_id, workspace_id, params })
    );
  }
}
```

### Gateway Client Best Practices

1. **Interface definition:**
   - Create a typed interface matching proto service
   - Use Observable<T> return types (gRPC standard)
   - Match request/response structures exactly

2. **Service initialization:**
   - Implement `OnModuleInit`
   - Call `getService<T>()` in `onModuleInit()`
   - Service name must match proto exactly

3. **Observable to Promise:**
   - Always use `firstValueFrom()` (not `toPromise()`)
   - Convert all Observable responses
   - Maintain async/await pattern

4. **Injection token:**
   - Use descriptive token names (e.g., "ENTITY_PACKAGE")
   - Must match module configuration
   - Document in comments

5. **Method naming:**
   - Use REST-style names (create, search, findById, update, remove)
   - Keep consistent across all gateway services
   - Different from proto method names is OK

---

## Step 6: Build Gateway Controller

**Location:** `apps/gilentry/src/{entity}-gateway/{entity}-gateway.controller.ts`

### Gateway Controller Structure

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { EntitiesGatewayService } from "libs/shared/utils/src/client/entity/entities.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser } from "@shared/types";
import {
  CreateEntityDto,
  UpdateEntityDto,
  EntityDto,
  EntityListDto,
  BaseSearchQueryDto,
} from "@shared/types";
import { normalizeObject } from "@shared/utils";

/**
 * REST API Gateway Controller for Entities
 * 
 * Exposes Entity service operations via REST endpoints
 * Handles HTTP requests and delegates to gRPC gateway service
 * 
 * Pattern: HTTP Request → Validate → Transform → Call gRPC → Normalize → Response
 */
@ApiTags("Entities")
@Controller("entities")
export class EntitiesGatewayController {
  constructor(private readonly entities: EntitiesGatewayService) {}

  /**
   * GET /entities
   * List entities with search and pagination
   */
  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "List entities with search and pagination" })
  @ApiQuery({
    name: "workspace_id",
    required: true,
    schema: { type: "string" },
  })
  @ApiQuery({
    name: "search",
    required: false,
    schema: { type: "string", nullable: true },
  })
  @ApiQuery({
    name: "skip",
    required: false,
    schema: { type: "integer", minimum: 0, default: 0, nullable: true },
  })
  @ApiQuery({
    name: "take",
    required: false,
    schema: { type: "integer", minimum: 1, default: 25, nullable: true },
  })
  @ApiQuery({
    name: "_sort",
    required: false,
    schema: {
      type: "string",
      example: "createdAt|updatedAt|name|status",
      nullable: true,
    },
  })
  @ApiQuery({
    name: "_order",
    required: false,
    schema: { type: "string", example: "asc|desc", nullable: true },
  })
  @ApiOkResponse({ type: EntityListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("workspace_id") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("_sort") sort?: string,
    @Query("_order") order?: string
  ): Promise<EntityListDto> {
    // Validate required parameters
    if (!workspaceId) {
      throw new BadRequestException("workspace_id is required");
    }

    // Helper to check if value is nullish
    const isNullish = (v?: string) =>
      v == null || v === "" || v.toLowerCase?.() === "null";

    // Build search parameters
    const params: BaseSearchQueryDto = {
      search: !isNullish(search) ? search : undefined,
      skip: !isNullish(skip) ? Number(skip) : undefined,
      take: !isNullish(take) ? Number(take) : undefined,
      sortBy: !isNullish(sort)
        ? [
            {
              field: String(sort),
              order:
                order?.toUpperCase() === "ASC" ||
                order?.toUpperCase() === "DESC"
                  ? (order.toUpperCase() as "ASC" | "DESC")
                  : ("DESC" as const),
            },
          ]
        : undefined,
    } as BaseSearchQueryDto;

    // Call gRPC service
    const result = await this.entities.search(
      user.user_id,
      workspaceId,
      params
    );

    // Normalize response (handle proto quirks)
    return normalizeObject(result) as EntityListDto;
  }

  /**
   * GET /entities/overview
   * Get entities overview for a workspace
   */
  @Get("overview")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get entities overview for a workspace" })
  @ApiQuery({
    name: "workspace_id",
    required: true,
    schema: { type: "string" },
  })
  @ApiQuery({
    name: "search",
    required: false,
    schema: { type: "string", nullable: true },
  })
  @ApiQuery({
    name: "skip",
    required: false,
    schema: { type: "integer", minimum: 0, default: 0, nullable: true },
  })
  @ApiQuery({
    name: "take",
    required: false,
    schema: { type: "integer", minimum: 1, default: 10, nullable: true },
  })
  @ApiOkResponse({ type: EntityListDto })
  async overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query("workspace_id") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string
  ): Promise<EntityListDto> {
    if (!workspaceId) {
      throw new BadRequestException("workspace_id is required");
    }

    const s = Number(skip);
    const t = Number(take);

    const params: BaseSearchQueryDto = {
      search: search || undefined,
      skip: !Number.isNaN(s) ? s : 0,
      take: !Number.isNaN(t) ? t : 10,
    } as BaseSearchQueryDto;

    const res = await this.entities.getOverview(
      user.user_id,
      workspaceId,
      params
    );

    return res;
  }

  /**
   * GET /entities/:id
   * Get an entity by ID
   */
  @Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get an entity by ID" })
  @ApiOkResponse({ type: EntityDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ): Promise<EntityDto> {
    const entityId = Number(id);
    if (Number.isNaN(entityId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    const result = await this.entities.findById(user.user_id, entityId);
    return normalizeObject(result) as EntityDto;
  }

  /**
   * POST /entities
   * Create a new entity
   */
  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new entity" })
  @ApiQuery({
    name: "workspace_id",
    required: true,
    schema: { type: "string" },
  })
  @ApiBody({ type: CreateEntityDto })
  @ApiOkResponse({ type: EntityDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Query("workspace_id") workspaceId: string,
    @Body() body: CreateEntityDto
  ) {
    if (!workspaceId) {
      throw new BadRequestException("workspace_id is required");
    }

    const result = await this.entities.create(
      user.user_id,
      workspaceId,
      body
    );

    return normalizeObject(result) as EntityDto;
  }

  /**
   * PUT /entities/:id
   * Update an entity by ID
   */
  @Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update an entity by ID" })
  @ApiBody({ type: UpdateEntityDto })
  @ApiOkResponse({ type: EntityDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: UpdateEntityDto
  ) {
    const entityId = Number(id);
    if (Number.isNaN(entityId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    const result = await this.entities.update(user.user_id, entityId, body);
    return normalizeObject(result) as EntityDto;
  }

  /**
   * DELETE /entities/:id
   * Delete an entity by ID
   */
  @Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete an entity by ID" })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    const entityId = Number(id);
    if (Number.isNaN(entityId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    await this.entities.remove(user.user_id, entityId);
  }
}
```

### Gateway Controller Best Practices

1. **Swagger documentation:**
   - Use `@ApiTags()` for grouping
   - Use `@ApiOperation()` for descriptions
   - Use `@ApiOkResponse()` for response types
   - Document all query parameters

2. **Authentication:**
   - Use `@Auth()` decorator for protected routes
   - Use `@ApiBearerAuth()` for Swagger auth
   - Extract user from `@CurrentUser()`

3. **Parameter validation:**
   - Validate required query params
   - Parse and validate IDs
   - Handle nullish values properly
   - Throw BadRequestException for invalid input

4. **Query parameter handling:**
   - Support nullish values (null, empty string, "null")
   - Provide sensible defaults
   - Support sorting and pagination

5. **Response normalization:**
   - Use `normalizeObject()` to handle proto quirks
   - Cast to proper DTO types
   - Return consistent response shapes

6. **HTTP status codes:**
   - 200 for GET/PUT
   - 201 for POST (use `@HttpCode(201)`)
   - 204 for DELETE (use `@HttpCode(204)`)

---

## Error Handling

### RPC Error Codes

Use gRPC status codes from `@grpc/grpc-js`:

```typescript
import { status } from "@grpc/grpc-js";
import { RpcException } from "@nestjs/microservices";

// Common error patterns:

// 1. NOT_FOUND - Resource doesn't exist
throw new RpcException({
  code: status.NOT_FOUND,
  message: `Entity with ID "${id}" not found`,
});

// 2. INVALID_ARGUMENT - Invalid input data
throw new RpcException({
  code: status.INVALID_ARGUMENT,
  message: "Entity name is required",
});

// 3. ALREADY_EXISTS - Duplicate/conflict
throw new RpcException({
  code: status.ALREADY_EXISTS,
  message: `Entity with slug "${slug}" already exists`,
});

// 4. PERMISSION_DENIED - Authorization failure
throw new RpcException({
  code: status.PERMISSION_DENIED,
  message: "You don't have permission to access this resource",
});

// 5. INTERNAL - Unexpected errors
throw new RpcException({
  code: status.INTERNAL,
  message: "An internal error occurred",
});

// 6. UNAUTHENTICATED - Authentication failure
throw new RpcException({
  code: status.UNAUTHENTICATED,
  message: "Authentication required",
});

// 7. RESOURCE_EXHAUSTED - Rate limiting/quotas
throw new RpcException({
  code: status.RESOURCE_EXHAUSTED,
  message: "Rate limit exceeded",
});

// 8. FAILED_PRECONDITION - Operation can't be performed
throw new RpcException({
  code: status.FAILED_PRECONDITION,
  message: "Entity must be active to perform this operation",
});
```

### Error Handling Pattern

```typescript
try {
  // Operation
  const result = await this.someOperation();
  return result;
} catch (error) {
  // Don't catch and re-throw RpcExceptions
  if (error instanceof RpcException) {
    throw error;
  }

  // Log and handle unexpected errors
  if (error instanceof Error) {
    await this.loggerClient.log({
      level: "error",
      service: "service-name",
      func: "function-name",
      message: `Operation failed: ${error.message}`,
      data: { error: error.message, context: "relevant-context" },
    });
  }

  // Re-throw or wrap in RpcException
  throw error;
}
```

---

## Data Validation

### Input Validation

1. **Use class-validator decorators:**

```typescript
@IsString({ message: "Name must be a string" })
@Length(1, 255, { message: "Name must be between 1 and 255 characters" })
name!: string;

@IsOptional()
@IsEmail({}, { message: "Invalid email format" })
email?: string;

@IsEnum(EntityStatus, { message: "Invalid entity status" })
status!: EntityStatus;

@IsInt({ message: "ID must be an integer" })
@Min(1, { message: "ID must be positive" })
id!: number;

@IsUUID("4", { message: "Must be a valid UUID" })
workspace_id!: string;

@IsDateString({}, { message: "Must be a valid ISO 8601 date" })
created_at!: string;

@IsObject({ message: "Settings must be an object" })
settings?: Record<string, any>;
```

2. **Service-level validation:**

```typescript
// Validate required fields
if (!dto?.name?.trim()) {
  throw new RpcException({
    code: status.INVALID_ARGUMENT,
    message: "Entity name is required",
  });
}

// Validate relationships
const workspace = await this.prisma.workspaces.findUnique({
  where: { id: workspaceId },
});

if (!workspace) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Workspace with ID "${workspaceId}" not found`,
  });
}

// Validate business rules
if (dto.end_date && dto.start_date && dto.end_date < dto.start_date) {
  throw new RpcException({
    code: status.INVALID_ARGUMENT,
    message: "End date must be after start date",
  });
}
```

3. **Gateway validation:**

```typescript
// Validate query parameters
if (!workspaceId) {
  throw new BadRequestException("workspace_id is required");
}

// Validate ID format
const entityId = Number(id);
if (Number.isNaN(entityId)) {
  throw new BadRequestException(`Invalid id param: ${id}`);
}

// Validate pagination
const skip = Number(skipParam);
const take = Number(takeParam);

if (skip < 0) {
  throw new BadRequestException("skip must be non-negative");
}

if (take < 1 || take > 100) {
  throw new BadRequestException("take must be between 1 and 100");
}
```

---

## Best Practices

### 1. Naming Conventions

- **Files:** kebab-case (`entity-name.service.ts`)
- **Classes:** PascalCase (`EntityService`)
- **Methods:** camelCase (`createEntity`)
- **Variables:** camelCase (`userId`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`)
- **Proto fields:** snake_case (`user_id`, `created_at`)
- **DTO fields:** snake_case matching proto (`user_id`, `created_at`)
- **Database columns:** snake_case (`user_id`, `created_at`)

### 2. Code Organization

```
{entity}/
├── {entity}.service.ts       # Business logic
├── {entity}.controller.ts    # gRPC controller
├── {entity}.module.ts        # NestJS module
└── tests/
    ├── {entity}.service.spec.ts
    └── {entity}.controller.spec.ts
```

### 3. Documentation

- **JSDoc comments** for all public methods
- Describe parameters, return types, and exceptions
- Include usage examples for complex operations
- Document business rules and constraints

### 4. Logging Standards

```typescript
// Entry point (debug)
await this.loggerClient.log({
  level: "debug",
  service: "service-name",
  func: "function-name",
  message: "Operation starting",
  data: { /* relevant context */ },
});

// Success (info)
await this.loggerClient.log({
  level: "info",
  service: "service-name",
  func: "function-name",
  message: "Operation completed successfully",
  data: { /* result summary */ },
});

// Warning (warn)
await this.loggerClient.log({
  level: "warn",
  service: "service-name",
  func: "function-name",
  message: "Operation completed with warnings",
  data: { /* warning details */ },
});

// Error (error)
await this.loggerClient.log({
  level: "error",
  service: "service-name",
  func: "function-name",
  message: "Operation failed",
  data: { error: error.message, /* context */ },
});
```

### 5. Transaction Patterns

```typescript
// Use transactions for multi-step operations
const result = await this.prisma.$transaction(async (tx) => {
  const entity = await tx.entities.create({
    data: { /* ... */ },
  });

  await tx.entity_audit.create({
    data: {
      entity_id: entity.id,
      action: "created",
      user_id: userId,
    },
  });

  return entity;
});
```

### 6. Permission Patterns

```typescript
// Check permissions before operations
const hasPermission = await this.checkUserPermission(
  workspaceId,
  userId,
  "create", // action
  "entity"  // resource
);

if (!hasPermission) {
  throw new RpcException({
    code: status.PERMISSION_DENIED,
    message: "You don't have permission to perform this operation",
  });
}
```

---

## Query Patterns

### 1. Search with Filters

```typescript
// Build dynamic where clause
let where: Prisma.entitiesWhereInput = {
  workspace_id: workspaceId,
};

// Add text search
if (params?.search) {
  where.OR = [
    { name: { contains: params.search, mode: "insensitive" } },
    { description: { contains: params.search, mode: "insensitive" } },
  ];
}

// Add filters
if (params?.filters) {
  where = { ...where, ...params.filters };
}

// Execute query
const items = await this.prisma.entities.findMany({
  where,
  skip: params.skip,
  take: params.take,
  orderBy: { created_at: "desc" },
});
```

### 2. Pagination

```typescript
// Always fetch items and count in parallel
const [items, total] = await Promise.all([
  this.prisma.entities.findMany({
    where,
    skip,
    take,
    orderBy,
  }),
  this.prisma.entities.count({ where }),
]);

// Use BasePaginationDto helper
return BasePaginationDto.create(
  items.map(item => plainToInstance(EntityDto, item, {
    excludeExtraneousValues: true,
  })),
  total,
  skip,
  take,
  EntityListDto
);
```

### 3. Relations and Includes

```typescript
// Include related data with select for optimization
const entity = await this.prisma.entities.findUnique({
  where: { id },
  include: {
    // Include full related objects
    workspace: true,
    
    // Include with select for specific fields
    created_by_user: {
      select: ProfileOverviewSelect,
    },
    
    // Include nested relations
    team: {
      include: {
        members: {
          select: {
            user_id: true,
            role: true,
          },
        },
      },
    },
  },
});
```

### 4. Soft Delete Pattern

```typescript
// Use is_archived or is_deleted flag
const where: Prisma.entitiesWhereInput = {
  is_archived: false, // Only active entities
  workspace_id: workspaceId,
};

// Soft delete instead of hard delete
await this.prisma.entities.update({
  where: { id },
  data: {
    is_archived: true,
    archived_at: new Date(),
    archived_by: userId,
  },
});
```

### 5. Unique Constraints

```typescript
// Check uniqueness before create/update
const existingEntity = await this.prisma.entities.findFirst({
  where: {
    slug: newSlug,
    workspace_id: workspaceId,
    id: { not: id }, // Exclude current entity for updates
  },
});

if (existingEntity) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Entity with slug "${newSlug}" already exists`,
  });
}
```

---

## Testing

### Unit Test Example

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { EntitiesService } from "./entities.service";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";

describe("EntitiesService", () => {
  let service: EntitiesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitiesService,
        {
          provide: PrismaService,
          useValue: {
            entities: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            workspaces: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: LoggerClientService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("create", () => {
    it("should create an entity successfully", async () => {
      const userId = "user-123";
      const workspaceId = "workspace-123";
      const dto = {
        name: "Test Entity",
        description: "Test description",
      };

      const mockWorkspace = { id: workspaceId, name: "Test Workspace" };
      const mockEntity = {
        id: 1,
        name: dto.name,
        slug: "test-entity",
        description: dto.description,
        workspace_id: workspaceId,
        created_at: new Date(),
      };

      jest.spyOn(prisma.workspaces, "findUnique").mockResolvedValue(mockWorkspace);
      jest.spyOn(prisma.entities, "create").mockResolvedValue(mockEntity);

      const result = await service.create(userId, workspaceId, dto);

      expect(result).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(prisma.entities.create).toHaveBeenCalled();
    });

    it("should throw error if name is missing", async () => {
      const userId = "user-123";
      const workspaceId = "workspace-123";
      const dto = { name: "" };

      await expect(
        service.create(userId, workspaceId, dto)
      ).rejects.toThrow(RpcException);
    });
  });

  describe("getById", () => {
    it("should return entity by id", async () => {
      const mockEntity = {
        id: 1,
        name: "Test Entity",
        workspace_id: "workspace-123",
      };

      jest.spyOn(prisma.entities, "findUnique").mockResolvedValue(mockEntity);

      const result = await service.getById(1, "user-123");

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("should throw NOT_FOUND if entity doesn't exist", async () => {
      jest.spyOn(prisma.entities, "findUnique").mockResolvedValue(null);

      await expect(
        service.getById(999, "user-123")
      ).rejects.toThrow(RpcException);
    });
  });
});
```

---

## Summary

This guide covers the complete architecture for building a service in the gile-back microservices system:

1. **Proto Definition** - Define the API contract
2. **Shared Types** - Create validated DTOs
3. **Service Layer** - Implement business logic
4. **RPC Controller** - Handle gRPC requests
5. **Gateway Client** - Create typed gRPC client
6. **Gateway Controller** - Expose REST API

### Key Principles

- **Separation of concerns:** Each layer has a specific responsibility
- **Type safety:** Strong typing throughout the stack
- **Validation:** Input validation at every layer
- **Error handling:** Consistent error patterns with gRPC codes
- **Logging:** Comprehensive logging at all levels
- **Testing:** Unit tests for all critical paths
- **Documentation:** Clear documentation and examples

### Common Patterns

- Always check permissions before operations
- Validate workspace/context existence
- Generate slugs from names
- Check uniqueness constraints
- Use transactions for multi-step operations
- Log entry, success, and error cases
- Transform data with `plainToInstance`
- Normalize gRPC responses in gateway

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-01  
**Author:** Bibz Project Team
