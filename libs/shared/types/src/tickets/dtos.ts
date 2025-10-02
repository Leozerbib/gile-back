import { ApiProperty } from "@nestjs/swagger";
import { ProfileOverview } from "../profile/dtos";
import { SprintOverview } from "../sprints/dtos";
import { LabelDto } from "../labels/dtos";
import { BasePaginationDto } from "../common/page";
import { Expose } from "class-transformer";

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

  @ApiProperty({ type: [Number], example: [4, 3, 2], description: "Task IDs", required: false })
  task_ids?: number[];

  @ApiProperty({ type: [Number], example: [4, 3, 2], description: "Label IDs", required: false })
  label_ids?: number[];

  @ApiProperty({ type: [Number], example: [5, 6], description: "Ticket dependency IDs (tickets this one depends on)", required: false })
  dependency_ticket_ids?: number[];
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
  parent_ticket_id?: number | null;

  @ApiProperty({ type: [Number], example: [4, 3, 2], description: "Task IDs", required: false })
  task_ids?: number[];

  @ApiProperty({ type: [Number], example: [4, 3, 2], description: "Label IDs", required: false })
  label_ids?: number[];

  @ApiProperty({ type: [Number], example: [5, 6], description: "Ticket dependency IDs (tickets this one depends on)", required: false })
  dependency_ticket_ids?: number[];
}

export class TicketOverview {
  @Expose()
  @ApiProperty({ example: 93 })
  id!: number;

  @Expose()
  @ApiProperty({ example: "PRO-0023" })
  ticket_number!: string;

  @Expose()
  @ApiProperty({ example: "jjjj" })
  title!: string;

  @Expose()
  @ApiProperty({ example: "TODO" })
  status!: string;

  @Expose()
  @ApiProperty({ example: "MEDIUM" })
  priority!: string;

  @Expose()
  @ApiProperty({ example: "TASK" })
  category!: string;
}

export class TicketDto extends TicketOverview {
  @Expose()
  @ApiProperty({ type: [Number], example: [], required: false })
  task_ids?: number[];

  @Expose()
  @ApiProperty({ example: null, required: false })
  parent_ticket_id?: number | null;

  @Expose()
  @ApiProperty({ example: null, required: false })
  description?: string;

  @Expose()
  @ApiProperty({ example: 14, required: false })
  story_points?: number | null;

  @Expose()
  @ApiProperty({ example: 0, required: false })
  estimated_hours?: number | null;

  @Expose()
  @ApiProperty({ example: 0, required: false })
  actual_hours?: number | null;

  @Expose()
  @ApiProperty({ example: null, required: false })
  due_date?: string;

  @Expose()
  @ApiProperty({ example: null, required: false })
  completed_at?: string;

  @Expose()
  @ApiProperty({ example: null, required: false })
  implementation_notes?: string;

  @Expose()
  @ApiProperty({ example: null, required: false })
  testing_notes?: string;

  @Expose()
  @ApiProperty({
    example: new Date(),
  })
  created_at!: Date;

  @Expose()
  @ApiProperty({
    example: new Date(),
    required: false,
  })
  updated_at?: Date;

  @Expose()
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

  @Expose()
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

  @Expose()
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

  @Expose()
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

  @Expose()
  @ApiProperty({
    type: [Object],
    example: [
      { id: 4, name: "API", color: "#4ECDC4" },
      { id: 3, name: "Database", color: "#FF6B6B" },
      { id: 2, name: "Backend", color: "#FF6B6B" },
    ],
    required: false,
  })
  labels?: LabelDto[];

  @Expose()
  @ApiProperty({
    type: [Number],
    example: [5, 6],
    description: "IDs of tickets this ticket depends on",
    required: false,
  })
  dependency_ticket_ids?: number[];
}

export class TicketsListDto extends BasePaginationDto<TicketDto> {
  @ApiProperty({
    type: [TicketDto],
    description: "Array of ticket overview objects",
  })
  items!: TicketDto[];
}

// ============================================================================
// PRISMA SELECT TYPES
// ============================================================================

/**
 * Type de sélection Prisma pour TicketOverview
 * Utilisé pour les listes et aperçus de tickets
 */
export const TicketOverviewSelect = {
  id: true,
  ticket_number: true,
  title: true,
  status: true,
  priority: true,
  category: true,
} as const;

/**
 * Type de sélection Prisma pour TicketDto complet
 * Inclut toutes les informations détaillées du ticket avec relations
 */
export const TicketDtoSelect = {
  id: true,
  ticket_number: true,
  title: true,
  status: true,
  priority: true,
  category: true,
  parent_ticket_id: true,
  description: true,
  story_points: true,
  estimated_hours: true,
  actual_hours: true,
  due_date: true,
  completed_at: true,
  implementation_notes: true,
  testing_notes: true,
  created_at: true,
  updated_at: true,
  task_tickets: {
    select: {
      task_id: true,
    },
  },
  ticket_dependencies_ticket_dependencies_ticket_idTotickets: {
    select: {
      depends_on_ticket_id: true,
    },
  },
} as const;

/**
 * Type de sélection Prisma pour les listes de tickets
 * Optimisé pour les requêtes de pagination avec relations minimales
 */
export const TicketListSelect = {
  id: true,
  ticket_number: true,
  title: true,
  status: true,
  priority: true,
  category: true,
  description: true,
  story_points: true,
  estimated_hours: true,
  actual_hours: true,
  due_date: true,
  completed_at: true,
  created_at: true,
  updated_at: true,
  sprint: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  },
  created_by_user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
  assigned_to_user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
} as const;

// ============================================================================
// TYPE HELPERS
// ============================================================================

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec TicketOverviewSelect
 */
export type PrismaTicketOverview = {
  id: number;
  ticket_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
};

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec TicketDtoSelect
 */
export type PrismaTicketDto = {
  id: number;
  ticket_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  parent_ticket_id: number | null;
  description: string | null;
  story_points: number | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  task_tickets: { task_id: number }[];
  ticket_dependencies_ticket_dependencies_ticket_idTotickets: { depends_on_ticket_id: number }[];
  due_date: Date | null;
  completed_at: Date | null;
  implementation_notes: string | null;
  testing_notes: string | null;
  created_at: Date;
  updated_at: Date | null;
  sprint: {
    id: number;
    name: string;
    slug: string | null;
    status: string;
  } | null;
  created_by_user: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  updated_by_user: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  assigned_to_user: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  labels: {
    id: number;
    name: string;
    color: string | null;
    description: string | null;
  }[];
};

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec TicketListSelect
 */
export type PrismaTicketList = {
  id: number;
  ticket_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  description: string | null;
  story_points: number | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
  sprint: {
    id: number;
    name: string;
    slug: string | null;
    status: string;
  } | null;
  created_by_user: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  assigned_to_user: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
};
