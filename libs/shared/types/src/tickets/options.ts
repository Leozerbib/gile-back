/**
 * Ticket-specific search and filter options
 * Derived from Prisma model `tickets` fields in schema.prisma
 */

// Sortable fields for ticket listings
export enum TicketSortField {
  CreatedAt = "created_at",
  UpdatedAt = "updated_at",
  SprintId = "sprint_id",
  ProjectId = "project_id",
  AssignedTo = "assigned_to",
  TicketNumber = "ticket_number",
  Title = "title",
  Status = "status",
  Priority = "priority",
  Category = "category",
  StoryPoints = "story_points",
  EstimatedHours = "estimated_hours",
  ActualHours = "actual_hours",
  DueDate = "due_date",
  CompletedAt = "completed_at",
}

// Group-by fields for aggregations
export enum TicketGroupField {
  CreatedAt = "created_at",
  SprintId = "sprint_id",
  ProjectId = "project_id",
  AssignedTo = "assigned_to",
  Status = "status",
  Priority = "priority",
  Category = "category",
  DueDate = "due_date",
  CompletedAt = "completed_at",
}

// Sub-group-by fields for nested aggregations
export enum TicketSubGroupField {
  CreatedAt = "created_at",
  SprintId = "sprint_id",
  ProjectId = "project_id",
  AssignedTo = "assigned_to",
  Status = "status",
  Priority = "priority",
  Category = "category",
  DueDate = "due_date",
  CompletedAt = "completed_at",
}

// Filterable fields for ticket queries
export enum TicketFilterField {
  CreatedAt = "created_at",
  UpdatedAt = "updated_at",
  SprintId = "sprint_id",
  ProjectId = "project_id",
  AssignedTo = "assigned_to",
  TicketNumber = "ticket_number",
  Title = "title",
  Status = "status",
  Priority = "priority",
  Category = "category",
  StoryPoints = "story_points",
  EstimatedHours = "estimated_hours",
  ActualHours = "actual_hours",
  DueDate = "due_date",
  CompletedAt = "completed_at",
}
