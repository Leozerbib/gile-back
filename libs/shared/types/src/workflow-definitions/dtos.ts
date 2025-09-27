import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsInt, Min, Max, IsEnum } from "class-validator";
import { ProfileOverview } from "../profile/dtos";

export enum WorkflowStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DEPRECATED = "DEPRECATED",
  ARCHIVED = "ARCHIVED",
}

export enum WorkflowTriggerType {
  MANUAL = "MANUAL",
  SCHEDULED = "SCHEDULED",
  EVENT_BASED = "EVENT_BASED",
  WEBHOOK = "WEBHOOK",
  API_CALL = "API_CALL",
  TICKET_STATUS_CHANGE = "TICKET_STATUS_CHANGE",
  SPRINT_STATUS_CHANGE = "SPRINT_STATUS_CHANGE",
  PROJECT_STATUS_CHANGE = "PROJECT_STATUS_CHANGE",
  USER_ACTION = "USER_ACTION",
  TIME_BASED = "TIME_BASED",
  CONDITION_BASED = "CONDITION_BASED",
}

export enum WorkflowActionType {
  SEND_NOTIFICATION = "SEND_NOTIFICATION",
  UPDATE_TICKET = "UPDATE_TICKET",
  CREATE_TICKET = "CREATE_TICKET",
  ASSIGN_TICKET = "ASSIGN_TICKET",
  UPDATE_PROJECT = "UPDATE_PROJECT",
  CREATE_COMMENT = "CREATE_COMMENT",
  SEND_EMAIL = "SEND_EMAIL",
  MAKE_API_CALL = "MAKE_API_CALL",
  EXECUTE_SCRIPT = "EXECUTE_SCRIPT",
  UPDATE_STATUS = "UPDATE_STATUS",
  ADD_LABEL = "ADD_LABEL",
  REMOVE_LABEL = "REMOVE_LABEL",
  SET_PRIORITY = "SET_PRIORITY",
  SET_DUE_DATE = "SET_DUE_DATE",
  ARCHIVE_ITEM = "ARCHIVE_ITEM",
  CREATE_BACKUP = "CREATE_BACKUP",
  GENERATE_REPORT = "GENERATE_REPORT",
  SYNC_DATA = "SYNC_DATA",
  TRIGGER_WEBHOOK = "TRIGGER_WEBHOOK",
  CUSTOM_ACTION = "CUSTOM_ACTION",
}

export class CreateWorkflowDefinitionDto {
  @ApiProperty({ example: "Ticket Auto-Assignment", description: "Workflow name" })
  name!: string;

  @ApiPropertyOptional({ example: "Automatically assigns tickets to team members based on workload", description: "Workflow description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#3B82F6", description: "UI color for the workflow" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { trigger: "ticket_created", conditions: {}, actions: [] }, description: "Workflow configuration data" })
  @IsOptional()
  config_data?: Record<string, any>;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Created by user ID" })
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Updated by user ID" })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

export class UpdateWorkflowDefinitionDto {
  @ApiPropertyOptional({ example: "Updated Ticket Auto-Assignment", description: "Updated workflow name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Updated workflow description", description: "Updated workflow description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#10B981", description: "Updated UI color" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { trigger: "ticket_updated", conditions: { status: "IN_PROGRESS" }, actions: [] }, description: "Updated configuration data" })
  @IsOptional()
  config_data?: Record<string, any>;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Updated by user ID" })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

export class WorkflowDefinitionDto {
  @ApiProperty({ example: 123 })
  id!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: "2025-09-23T14:25:33.456Z", nullable: true })
  updated_at?: string | null;

  @ApiProperty({ example: "Ticket Auto-Assignment" })
  name!: string;

  @ApiProperty({ example: "Automatically assigns tickets to team members based on workload", nullable: true })
  description?: string | null;

  @ApiProperty({ example: "#3B82F6", nullable: true })
  ui_color?: string | null;

  @ApiProperty({ type: Object, example: { trigger: "ticket_created", conditions: {}, actions: [] }, nullable: true })
  config_data?: Record<string, any> | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  created_by?: string | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  updated_by?: string | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
    nullable: true,
  })
  created_by_user?: ProfileOverview | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
    nullable: true,
  })
  updated_by_user?: ProfileOverview | null;
}

export class WorkflowDefinitionOverview {
  @ApiProperty({ example: 123 })
  id!: number;

  @ApiProperty({ example: "Ticket Auto-Assignment" })
  name!: string;

  @ApiProperty({ example: "Automatically assigns tickets to team members based on workload", nullable: true })
  description?: string | null;

  @ApiProperty({ example: "#3B82F6", nullable: true })
  ui_color?: string | null;

  @ApiProperty({ example: "ACTIVE" })
  status!: WorkflowStatus;
}

export class WorkflowDefinitionListDto {
  @ApiProperty({ type: [WorkflowDefinitionDto] })
  items!: WorkflowDefinitionDto[];

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 0 })
  skip!: number;

  @ApiProperty({ example: 25 })
  take!: number;
}

export class WorkflowExecutionDto {
  @ApiProperty({ example: 456 })
  id!: number;

  @ApiProperty({ example: 123 })
  workflow_definition_id!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  started_at!: string;

  @ApiProperty({ example: "2025-09-23T10:30:16.789Z", nullable: true })
  completed_at?: string | null;

  @ApiProperty({ example: "SUCCESS" })
  status!: string;

  @ApiProperty({ example: "Workflow executed successfully" })
  result!: string;

  @ApiProperty({ type: Object, example: { ticket_id: 789, assigned_to: "user-123" }, nullable: true })
  metadata?: Record<string, any> | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  triggered_by!: string;

  @ApiProperty({
    type: WorkflowDefinitionOverview,
    example: {
      id: 123,
      name: "Ticket Auto-Assignment",
      description: "Automatically assigns tickets to team members based on workload",
      ui_color: "#3B82F6",
    },
  })
  workflow_definition!: WorkflowDefinitionOverview;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
  })
  triggered_by_user!: ProfileOverview;
}

export class CreateWorkflowExecutionDto {
  @ApiProperty({ example: 123, description: "Workflow definition ID" })
  workflow_definition_id!: number;

  @ApiPropertyOptional({ type: Object, example: { ticket_id: 789, priority: "HIGH" }, description: "Trigger metadata" })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Triggered by user ID" })
  @IsOptional()
  @IsUUID()
  triggered_by?: string;
}

export class WorkflowStepDto {
  @ApiProperty({ example: 1 })
  step_id!: number;

  @ApiProperty({ example: "SEND_NOTIFICATION" })
  action_type!: WorkflowActionType;

  @ApiProperty({ example: "Send notification to assigned user" })
  description!: string;

  @ApiProperty({ type: Object, example: { notification_type: "IN_APP", message: "Ticket assigned" }, nullable: true })
  config?: Record<string, any> | null;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ example: true })
  is_active!: boolean;
}

export class WorkflowTriggerDto {
  @ApiProperty({ example: 1 })
  trigger_id!: number;

  @ApiProperty({ enum: WorkflowTriggerType, example: WorkflowTriggerType.MANUAL })
  trigger_type!: WorkflowTriggerType;

  @ApiProperty({ example: "ticket_created" })
  event_name!: string;

  @ApiProperty({ type: Object, example: { status: "TODO", priority: "HIGH" }, nullable: true })
  conditions?: Record<string, any> | null;

  @ApiProperty({ example: true })
  is_active!: boolean;
}

export class WorkflowStatsDto {
  @ApiProperty({ example: 15 })
  total_workflows!: number;

  @ApiProperty({ example: 8 })
  active_workflows!: number;

  @ApiProperty({ example: 3 })
  inactive_workflows!: number;

  @ApiProperty({ example: 2 })
  draft_workflows!: number;

  @ApiProperty({ example: 45 })
  total_executions!: number;

  @ApiProperty({ example: 42 })
  successful_executions!: number;

  @ApiProperty({ example: 3 })
  failed_executions!: number;

  @ApiProperty({ type: Object, example: { SEND_NOTIFICATION: 25, UPDATE_TICKET: 12, ASSIGN_TICKET: 8 } })
  executions_by_action!: Record<WorkflowActionType, number>;

  @ApiProperty({ example: 93.33 })
  success_rate!: number;
}

export class WorkflowFilterDto {
  @ApiPropertyOptional({ example: "Ticket Auto-Assignment", description: "Search in workflow name and description" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WorkflowStatus, example: WorkflowStatus.ACTIVE, description: "Filter by workflow status" })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional({ enum: WorkflowTriggerType, example: WorkflowTriggerType.EVENT_BASED, description: "Filter by trigger type" })
  @IsOptional()
  @IsEnum(WorkflowTriggerType)
  trigger_type?: WorkflowTriggerType;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Filter by created by user" })
  @IsOptional()
  @IsUUID()
  created_by?: string;

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

export class WorkflowExecutionFilterDto {
  @ApiPropertyOptional({ example: 123, description: "Filter by workflow definition ID" })
  @IsOptional()
  workflow_definition_id?: number;

  @ApiPropertyOptional({ example: "SUCCESS", description: "Filter by execution status" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Filter by triggered by user" })
  @IsOptional()
  @IsUUID()
  triggered_by?: string;

  @ApiPropertyOptional({ example: "2025-09-23T00:00:00.000Z", description: "Start date" })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ example: "2025-09-23T23:59:59.999Z", description: "End date" })
  @IsOptional()
  @IsString()
  end_date?: string;

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

export class WorkflowTemplateDto {
  @ApiProperty({ example: "ticket-assignment" })
  id!: string;

  @ApiProperty({ example: "Ticket Auto-Assignment Template" })
  name!: string;

  @ApiProperty({ example: "Template for automatically assigning tickets to team members" })
  description!: string;

  @ApiProperty({ example: "#3B82F6" })
  ui_color!: string;

  @ApiProperty({ type: Object, example: { trigger: "ticket_created", actions: [] } })
  default_config!: Record<string, any>;

  @ApiProperty({ example: "1.0" })
  version!: string;

  @ApiProperty({ type: [String], example: ["auto-assignment", "workflow", "automation"] })
  tags!: string[];
}
