/**
 * Ticket-specific search and filter options
 * Derived from Prisma model `tickets` fields in schema.prisma
 */

// Sortable fields for ticket listings
export enum TicketSortField {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
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
  DueDate = "dueDate",
  CompletedAt = "completedAt",
}

// Group-by fields for aggregations
export enum TicketGroupField {
  CreatedAt = "createdAt",
  SprintId = "sprint_id",
  ProjectId = "project_id",
  AssignedTo = "assigned_to",
  Status = "status",
  Priority = "priority",
  Category = "category",
  DueDate = "dueDate",
  CompletedAt = "completedAt",
}

// Sub-group-by fields for nested aggregations
export enum TicketSubGroupField {
  CreatedAt = "createdAt",
  SprintId = "sprint_id",
  ProjectId = "project_id",
  AssignedTo = "assigned_to",
  Status = "status",
  Priority = "priority",
  Category = "category",
  DueDate = "dueDate",
  CompletedAt = "completedAt",
}

// Filterable fields for ticket queries
export enum TicketFilterField {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
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
  DueDate = "dueDate",
  CompletedAt = "completedAt",
}
