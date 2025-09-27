import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsInt, IsDateString, IsUUID, IsIP, Min, Max } from "class-validator";
import { ProfileOverview } from "../profile/dtos";

export enum ActivityAction {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
  ARCHIVED = "ARCHIVED",
  RESTORED = "RESTORED",
  ASSIGNED = "ASSIGNED",
  COMPLETED = "COMPLETED",
  COMMENTED = "COMMENTED",
  ATTACHED = "ATTACHED",
  DETACHED = "DETACHED",
  MOVED = "MOVED",
  COPIED = "COPIED",
  EXPORTED = "EXPORTED",
  IMPORTED = "IMPORTED",
  SHARED = "SHARED",
  UNASSIGNED = "UNASSIGNED",
  REJECTED = "REJECTED",
  APPROVED = "APPROVED",
  REVIEWED = "REVIEWED",
  MERGED = "MERGED",
  REVERTED = "REVERTED",
  DEPLOYED = "DEPLOYED",
  ROLLED_BACK = "ROLLED_BACK",
  BACKED_UP = "BACKED_UP",
  RESTORED_FROM_BACKUP = "RESTORED_FROM_BACKUP",
  CONFIGURED = "CONFIGURED",
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
  AUTHORIZED = "AUTHORIZED",
  DEAUTHORIZED = "DEAUTHORIZED",
  LOGGED_IN = "LOGGED_IN",
  LOGGED_OUT = "LOGGED_OUT",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
  INVITED = "INVITED",
  ACCEPTED_INVITATION = "ACCEPTED_INVITATION",
  DECLINED_INVITATION = "DECLINED_INVITATION",
  REMOVED = "REMOVED",
  PROMOTED = "PROMOTED",
  DEMOTED = "DEMOTED",
  SUSPENDED = "SUSPENDED",
  REACTIVATED = "REACTIVATED",
  NOTIFIED = "NOTIFIED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  ESCALATED = "ESCALATED",
  DE_ESCALATED = "DE_ESCALATED",
  PRIORITIZED = "PRIORITIZED",
  DEPRIORITIZED = "DEPRIORITIZED",
  LABELED = "LABELED",
  UNLABELED = "UNLABELED",
  TAGGED = "TAGGED",
  UNTAGGED = "UNTAGGED",
  FOLLOWED = "FOLLOWED",
  UNFOLLOWED = "UNFOLLOWED",
  SUBSCRIBED = "SUBSCRIBED",
  UNSUBSCRIBED = "UNSUBSCRIBED",
  LIKED = "LIKED",
  UNLIKED = "UNLIKED",
  RATED = "RATED",
  REPORTED = "REPORTED",
  BLOCKED = "BLOCKED",
  UNBLOCKED = "UNBLOCKED",
}

export enum ActivityEntityType {
  PROJECT = "PROJECT",
  SPRINT = "SPRINT",
  EPIC = "EPIC",
  TASK = "TASK",
  TICKET = "TICKET",
  USER = "USER",
  TEAM = "TEAM",
  WORKSPACE = "WORKSPACE",
  COMMENT = "COMMENT",
  FILE = "FILE",
  LABEL = "LABEL",
  STACK = "STACK",
  LANGUAGE = "LANGUAGE",
  AGENT = "AGENT",
  PROMPT = "PROMPT",
  WORKFLOW = "WORKFLOW",
  CHAT = "CHAT",
  MESSAGE = "MESSAGE",
  NOTIFICATION = "NOTIFICATION",
  INVITATION = "INVITATION",
  SETTING = "SETTING",
  PREFERENCE = "PREFERENCE",
  PERMISSION = "PERMISSION",
  ROLE = "ROLE",
  SESSION = "SESSION",
  LOG = "LOG",
  BACKUP = "BACKUP",
  CONFIGURATION = "CONFIGURATION",
  INTEGRATION = "INTEGRATION",
  WEBHOOK = "WEBHOOK",
  API_KEY = "API_KEY",
  TOKEN = "TOKEN",
  REPORT = "REPORT",
  DASHBOARD = "DASHBOARD",
  WIDGET = "WIDGET",
  FILTER = "FILTER",
  VIEW = "VIEW",
  TEMPLATE = "TEMPLATE",
  THEME = "THEME",
  PLUGIN = "PLUGIN",
  EXTENSION = "EXTENSION",
}

export class CreateActivityLogDto {
  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "User ID" })
  user_id!: string;

  @ApiProperty({ enum: ActivityAction, example: ActivityAction.CREATED })
  action!: ActivityAction;

  @ApiProperty({ enum: ActivityEntityType, example: ActivityEntityType.PROJECT })
  entity_type!: ActivityEntityType;

  @ApiProperty({ example: 123, description: "Entity ID" })
  entity_id!: number;

  @ApiPropertyOptional({ example: 1, description: "Project ID" })
  @IsOptional()
  project_id?: number;

  @ApiPropertyOptional({ example: 456, description: "Ticket ID" })
  @IsOptional()
  ticket_id?: number;

  @ApiPropertyOptional({ type: Object, example: { old_status: "TODO", new_status: "IN_PROGRESS" }, description: "Additional metadata" })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: "192.168.1.1", description: "IP address" })
  @IsOptional()
  @IsIP()
  ip_address?: string;

  @ApiPropertyOptional({ example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", description: "User agent" })
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional({ example: "session-uuid-123", description: "Session ID" })
  @IsOptional()
  @IsUUID()
  session_id?: string;
}

export class UpdateActivityLogDto {
  @ApiPropertyOptional({ example: "Updated action", description: "Updated action" })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ type: Object, example: { additional_data: "new info" }, description: "Updated metadata" })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: "203.0.113.1", description: "Updated IP address" })
  @IsOptional()
  @IsIP()
  ip_address?: string;

  @ApiPropertyOptional({ example: "Mozilla/5.0 (macOS) AppleWebKit/605.1.15", description: "Updated user agent" })
  @IsOptional()
  @IsString()
  user_agent?: string;
}

export class ActivityLogDto {
  @ApiProperty({ example: 123456 })
  id!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  user_id!: string;

  @ApiProperty({ example: "CREATED" })
  action!: string;

  @ApiProperty({ example: "PROJECT" })
  entity_type!: string;

  @ApiProperty({ example: 123 })
  entity_id!: number;

  @ApiProperty({ example: 1, nullable: true })
  project_id?: number | null;

  @ApiProperty({ example: 456, nullable: true })
  ticket_id?: number | null;

  @ApiProperty({ type: Object, example: { old_status: "TODO", new_status: "IN_PROGRESS" }, nullable: true })
  metadata?: Record<string, any> | null;

  @ApiProperty({ example: "192.168.1.1", nullable: true })
  ip_address?: string | null;

  @ApiProperty({ example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", nullable: true })
  user_agent?: string | null;

  @ApiProperty({ example: "session-uuid-123", nullable: true })
  session_id?: string | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
    nullable: true,
  })
  user?: ProfileOverview | null;

  @ApiProperty({
    example: {
      id: 1,
      name: "Project Management Suite",
      slug: "project-management-suite",
    },
    nullable: true,
  })
  project?: {
    id: number;
    name: string;
    slug?: string;
  } | null;

  @ApiProperty({
    example: {
      id: 456,
      title: "Fix login issue",
      status: "IN_PROGRESS",
    },
    nullable: true,
  })
  ticket?: {
    id: number;
    title: string;
    status: string;
  } | null;
}

export class ActivityLogOverview {
  @ApiProperty({ example: 123456 })
  id!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  user_id!: string;

  @ApiProperty({ example: "CREATED" })
  action!: string;

  @ApiProperty({ example: "PROJECT" })
  entity_type!: string;

  @ApiProperty({ example: 123 })
  entity_id!: number;
}

export class ActivityLogsListDto {
  @ApiProperty({ type: [ActivityLogDto] })
  items!: ActivityLogDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 0 })
  skip!: number;

  @ApiProperty({ example: 25 })
  take!: number;
}

export class ActivityLogStatsDto {
  @ApiProperty({ example: 150 })
  total_logs!: number;

  @ApiProperty({ example: 45 })
  today_logs!: number;

  @ApiProperty({ example: 25 })
  unique_users!: number;

  @ApiProperty({ type: Object, example: { CREATED: 60, UPDATED: 40, DELETED: 5 } })
  actions_distribution!: Record<ActivityAction, number>;

  @ApiProperty({ type: Object, example: { PROJECT: 50, TICKET: 30, TASK: 20 } })
  entities_distribution!: Record<ActivityEntityType, number>;

  @ApiProperty({ type: Object, example: { "192.168.1.1": 25, "203.0.113.1": 15 } })
  ip_distribution!: Record<string, number>;
}

export class ActivityLogFilterDto {
  @ApiPropertyOptional({ example: "2025-09-23T00:00:00.000Z", description: "Start date" })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: "2025-09-23T23:59:59.999Z", description: "End date" })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ enum: ActivityAction, example: ActivityAction.CREATED, description: "Filter by action" })
  @IsOptional()
  @IsEnum(ActivityAction)
  action?: ActivityAction;

  @ApiPropertyOptional({ enum: ActivityEntityType, example: ActivityEntityType.PROJECT, description: "Filter by entity type" })
  @IsOptional()
  @IsEnum(ActivityEntityType)
  entity_type?: ActivityEntityType;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Filter by user ID" })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ example: 1, description: "Filter by project ID" })
  @IsOptional()
  project_id?: number;

  @ApiPropertyOptional({ example: 456, description: "Filter by ticket ID" })
  @IsOptional()
  ticket_id?: number;

  @ApiPropertyOptional({ example: "192.168.1.1", description: "Filter by IP address" })
  @IsOptional()
  @IsIP()
  ip_address?: string;

  @ApiPropertyOptional({ example: "session-uuid-123", description: "Filter by session ID" })
  @IsOptional()
  @IsUUID()
  session_id?: string;

  @ApiPropertyOptional({ example: 0, description: "Number of records to skip", minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ example: 25, description: "Number of records to take", minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

export class BulkActivityLogDto {
  @ApiProperty({ type: [Number], example: [123, 456, 789] })
  activity_log_ids!: number[];

  @ApiPropertyOptional({ type: Object, example: { reviewed: true }, description: "Bulk update metadata" })
  @IsOptional()
  metadata?: Record<string, any>;
}
