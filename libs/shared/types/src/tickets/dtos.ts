import { ApiProperty } from "@nestjs/swagger";
import { ProfileOverview } from "../profile/dtos";
import { SprintOverview } from "../sprints/dtos";
import { LabelDto } from "../labels/dtos";
import { BasePaginationDto } from "../common/page";

export enum TicketStatus {
  TODO = "TODO",
  ACTIVE = "ACTIVE",
  IN_REVIEW = "IN_REVIEW",
  VALIDATED = "VALIDATED",
  PROD = "PROD",
  CANCELLED = "CANCELLED",
  REFUSED = "REFUSED",
}

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum TicketCategory {
  BUG = "BUG",
  TASK = "TASK",
  FEATURE = "FEATURE",
}

export class CreateTicketDto {
  @ApiProperty({ example: "Fix login issue" })
  title!: string;

  @ApiProperty({ example: "Users are unable to log in with valid credentials", required: false })
  description?: string;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.MEDIUM, required: false })
  priority?: TicketPriority;

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.TASK, required: false })
  category?: TicketCategory;

  @ApiProperty({ example: 14, description: "Story points", required: false })
  story_points?: number;

  @ApiProperty({ example: 14, description: "Estimated hours", required: false })
  estimated_hours?: number;

  @ApiProperty({ example: "2025-09-22", description: "Due date", required: false })
  due_date?: string;

  @ApiProperty({ example: 3, description: "Project ID", required: false })
  project_id?: number;

  @ApiProperty({ example: 12, description: "Sprint ID", required: false })
  sprint_id?: number;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Parent ticket ID", required: false })
  parent_ticket_id?: number;

  @ApiProperty({ type: [Number], example: [4, 3, 2], description: "Task IDs", required: false })
  task_id?: number[];
}

export class UpdateTicketDto {
  @ApiProperty({ example: "Fix login issue - updated", required: false })
  title?: string;

  @ApiProperty({ example: "Updated description", required: false })
  description?: string;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.ACTIVE, required: false })
  status?: TicketStatus;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.HIGH, required: false })
  priority?: TicketPriority;

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.TASK, required: false })
  category?: TicketCategory;

  @ApiProperty({ example: 16, description: "Story points", required: false })
  story_points?: number;

  @ApiProperty({ example: 16, description: "Estimated hours", required: false })
  estimated_hours?: number;

  @ApiProperty({ example: 8, description: "Actual hours", required: false })
  actual_hours?: number;

  @ApiProperty({ example: "2025-09-23", description: "Due date", required: false })
  due_date?: string;

  @ApiProperty({ example: "2025-09-23T15:30:45.123Z", description: "Completed at", required: false })
  completed_at?: string;

  @ApiProperty({ example: "Implementation notes", required: false })
  implementation_notes?: string;

  @ApiProperty({ example: "Testing notes", required: false })
  testing_notes?: string;

  @ApiProperty({ example: 13, description: "Sprint ID", required: false })
  sprint_id?: number;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Assignee user ID", required: false })
  assigned_to?: string;

  @ApiProperty({ example: "PRO-0024", description: "Ticket number", required: false })
  ticket_number?: string;

  @ApiProperty({ example: 94, description: "Parent ticket ID", required: false })
  parent_ticket_id?: number;

  @ApiProperty({ type: [Number], example: [4, 3, 2], description: "Task IDs", required: false })
  task_id?: number[];
}

export class TicketOverview {
  @ApiProperty({ example: 93 })
  id!: number;

  @ApiProperty({ example: "PRO-0023" })
  ticket_number!: string;

  @ApiProperty({ example: "jjjj" })
  title!: string;

  @ApiProperty({ example: "TODO" })
  status!: string;

  @ApiProperty({ example: "MEDIUM" })
  priority!: string;

  @ApiProperty({ example: "TASK" })
  category!: string;
}

export class TicketDto extends TicketOverview {
  @ApiProperty({ type: [Number], example: [], required: false })
  task_id?: number[];

  @ApiProperty({ example: null, required: false })
  parent_ticket_id?: number;

  @ApiProperty({ example: null, required: false })
  description?: string;

  @ApiProperty({ example: 14, required: false })
  story_points?: number | null;

  @ApiProperty({ example: 0, required: false })
  estimated_hours?: number | null;

  @ApiProperty({ example: 0, required: false })
  actual_hours?: number | null;

  @ApiProperty({ example: null, required: false })
  due_date?: string;

  @ApiProperty({ example: null, required: false })
  completed_at?: string;

  @ApiProperty({ example: null, required: false })
  implementation_notes?: string;

  @ApiProperty({ example: null, required: false })
  testing_notes?: string;

  @ApiProperty({
    example: new Date(),
  })
  created_at!: Date;

  @ApiProperty({
    example: new Date(),
    required: false,
  })
  updated_at?: Date;

  @ApiProperty({
    type: SprintOverview,
    example: {
      id: 12,
      name: "Sprint 3 - Sprint Planning",
      version: 3,
    },
    required: false,
  })
  sprint?: SprintOverview;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "bibz",
      avatar_url: null,
    },
    required: false,
  })
  created_by_user?: ProfileOverview;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "bibz",
      avatar_url: null,
    },
    required: false,
  })
  updated_by_user?: ProfileOverview;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "bibz",
      avatar_url: null,
    },
    required: false,
  })
  assigned_to_user?: ProfileOverview;

  @ApiProperty({
    type: [Object],
    example: [
      { id: 4, name: "API" },
      { id: 3, name: "Database" },
      { id: 2, name: "Backend" },
    ],
    required: false,
  })
  labels?: LabelDto[];
}

export class TicketsListDto extends BasePaginationDto<TicketDto> {
  @ApiProperty({
    type: [TicketDto],
    description: "Array of ticket overview objects",
  })
  items!: TicketDto[];
}
