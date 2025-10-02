import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min, IsNumber, IsUUID, IsPositive } from "class-validator";
import { Expose, Transform } from "class-transformer";
import { ProfileOverview } from "../profile/dtos";
import { EpicOverview } from "../epics/dtos";
import { BasePaginationDto } from "../common/page";

/**
 * Task status enumeration aligned with Prisma schema
 * Used for task lifecycle management in the agile system
 */
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

/**
 * Task priority levels for project management
 * Lower numbers indicate higher priority
 */
export enum TaskPriority {
  LOWEST = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  HIGHEST = 4,
}

/**
 * Data Transfer Object for creating new tasks
 * Aligned with Prisma schema and optimized for gRPC serialization
 */
export class CreateTaskDto {
  @Expose()
  @ApiProperty({
    description: "Task title - must be unique within the epic",
    example: "Implement user authentication API",
    maxLength: 255,
    minLength: 1,
  })
  @IsString()
  @Length(1, 255, {
    message: "Task title must be between 1 and 255 characters",
  })
  title!: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Detailed description of the task requirements and implementation details",
    example: "Create REST API endpoints for user login, registration, and password reset with JWT token management",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @Expose()
  @ApiProperty({
    description: "Epic ID that this task belongs to",
    example: 123,
  })
  @IsInt()
  @IsPositive()
  epic_id!: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Current status of the task in the workflow",
    enum: TaskStatus,
    default: TaskStatus.TODO,
    example: TaskStatus.TODO,
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: "Status must be one of: TODO, IN_PROGRESS, BLOCKED, DONE, CANCELLED",
  })
  status?: TaskStatus;

  @Expose()
  @ApiPropertyOptional({
    description: "Priority level (0-100, where 0 is highest priority)",
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    example: TaskPriority.HIGH,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === "number" ? value : 0;
  })
  priority?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Estimated hours to complete the task (format: 999.99)",
    example: 8.5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === "number" ? value : 0;
  })
  estimated_hours?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Actual hours spent working on the task",
    default: 0,
    example: 6.5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === "number" ? value : 0;
  })
  actual_hours?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Due date for task completion (ISO 8601 date format)",
    example: "2024-02-15",
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: "Due date must be a valid ISO 8601 date string",
    },
  )
  due_date?: string;
}

/**
 * Data Transfer Object for updating existing tasks
 * All fields are optional to support partial updates
 */
export class UpdateTaskDto {
  @Expose()
  @ApiPropertyOptional({
    description: "Updated task title",
    maxLength: 255,
    minLength: 1,
    example: "Implement user authentication API with OAuth",
  })
  @IsOptional()
  @IsString()
  @Length(1, 255, {
    message: "Task title must be between 1 and 255 characters",
  })
  title?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Updated task description",
    example: "Updated description with OAuth integration requirements and JWT refresh tokens",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Move task to different epic",
    example: 124,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  epic_id?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Updated task status in workflow",
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: "Status must be one of: TODO, IN_PROGRESS, BLOCKED, DONE, CANCELLED",
  })
  status?: TaskStatus;

  @Expose()
  @ApiPropertyOptional({
    description: "Updated priority level (0-100, where 0 is highest priority)",
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === "number" ? value : 0;
  })
  priority?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Completion timestamp when task is marked as DONE",
    example: "2024-02-10T15:30:00Z",
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: "Completion date must be a valid ISO 8601 datetime string",
    },
  )
  completed_at?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Updated estimated hours to complete the task",
    example: 12.5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === "number" ? value : 0;
  })
  estimated_hours?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Updated actual hours spent working on the task",
    example: 10.5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === "number" ? value : 0;
  })
  actual_hours?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Updated due date for task completion",
    example: "2024-02-20",
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: "Due date must be a valid ISO 8601 date string",
    },
  )
  due_date?: string;
}

/**
 * Lightweight task overview for list views and references
 * Optimized for gRPC serialization and performance
 */
export class TaskOverview {
  @Expose()
  @ApiProperty({
    description: "Unique task identifier",
    example: 123,
  })
  id!: number;

  @Expose()
  @ApiProperty({
    description: "Task title for display purposes",
    example: "Implement user authentication API",
    maxLength: 255,
  })
  title!: string;

  @Expose()
  @ApiProperty({
    description: "Current task status in the workflow",
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  status!: TaskStatus;

  @Expose()
  @ApiProperty({
    description: "Task priority level (0-100, where 0 is highest priority)",
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  priority!: number;
}

/**
 * Complete task data transfer object with all task information
 * Extends TaskOverview for comprehensive task representation
 */
export class TaskDto extends TaskOverview {
  @Expose()
  @ApiPropertyOptional({
    description: "Detailed description of the task requirements and implementation details",
    example: "Create REST API endpoints for user login, registration, and password reset with JWT token management",
  })
  description?: string;

  @Expose()
  @ApiProperty({
    description: "Epic ID that this task belongs to",
    example: 456,
  })
  @IsInt()
  @IsPositive()
  epic_id!: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Estimated hours to complete the task (format: 999.99)",
    example: 8.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  estimated_hours?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Actual hours spent working on the task",
    example: 6.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actual_hours?: number;

  @Expose()
  @ApiPropertyOptional({
    description: "Due date for task completion (ISO 8601 date format)",
    example: "2024-02-15",
  })
  due_date?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Completion timestamp when task is marked as DONE",
    example: "2024-02-10T15:30:00Z",
  })
  completed_at?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Task creation timestamp",
    example: "2024-01-15T10:30:00Z",
  })
  created_at?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Last modification timestamp",
    example: "2024-01-20T14:30:00Z",
  })
  updated_at?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "UUID of the user who created the task",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  created_by?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "UUID of the user who last modified the task",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @IsUUID()
  updated_by?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "User profile information for the task creator",
    type: ProfileOverview,
  })
  created_by_user?: ProfileOverview;

  @Expose()
  @ApiPropertyOptional({
    description: "User profile information for the last modifier",
    type: ProfileOverview,
  })
  updated_by_user?: ProfileOverview;

  @Expose()
  @ApiPropertyOptional({
    description: "Associated epic information",
    type: EpicOverview,
  })
  epic?: EpicOverview;
}

/**
 * Paginated task list response using the common pagination base class
 * Optimized for gRPC streaming and API performance with consistent pagination behavior
 */
export class TaskListDto extends BasePaginationDto<TaskOverview> {
  @Expose()
  @ApiProperty({
    type: [TaskOverview],
    description: "Array of task overview objects",
  })
  items!: TaskOverview[];
}

// Prisma select types for type-safe queries
export const TaskOverviewSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
} as const;

export const TaskDtoSelect = {
  id: true,
  title: true,
  description: true,
  epic_id: true,
  status: true,
  priority: true,
  estimated_hours: true,
  actual_hours: true,
  due_date: true,
  completed_at: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  created_by_user: {
    select: {
      id: true,
      username: true,
      email: true,
      first_name: true,
      last_name: true,
      avatar_url: true,
    },
  },
  updated_by_user: {
    select: {
      id: true,
      username: true,
      email: true,
      first_name: true,
      last_name: true,
      avatar_url: true,
    },
  },
  epic: {
    select: {
      id: true,
      title: true,
      progress: true,
      status: true,
      category: true,
    },
  },
} as const;

export const TaskListSelect = {
  ...TaskOverviewSelect,
} as const;

// Type helpers for Prisma query return types
export type PrismaTaskOverview = {
  id: number;
  title: string;
  status: string;
  priority: number;
};

export type PrismaTaskDto = {
  id: number;
  title: string;
  description: string | null;
  epic_id: number;
  status: string;
  priority: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: Date | null;
  completed_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_by_user: {
    id: string;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  updated_by_user: {
    id: string;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  epic: {
    id: number;
    title: string;
    progress: number;
    status: string;
    category: string;
  } | null;
};

export type PrismaTaskList = PrismaTaskOverview[];
