/**
 * Sprint-specific search and filter options
 * Derived from Prisma model `sprints` fields in schema.prisma
 */

// Sortable fields for sprint listings
export enum SprintSortField {
  CreatedAt = "created_at",
  UpdatedAt = "updated_at",
  ProjectId = "project_id",
  Name = "name",
  Status = "status",
  StartDate = "start_date",
  EndDate = "end_date",
  ActualStartDate = "actual_start_date",
  ActualEndDate = "actual_end_date",
  Version = "version",
  Velocity = "velocity",
  Capacity = "capacity",
}

// Group-by fields for aggregations
export enum SprintGroupField {
  CreatedAt = "created_at",
  ProjectId = "project_id",
  Status = "status",
  StartDate = "start_date",
  EndDate = "end_date",
  ActualStartDate = "actual_start_date",
  ActualEndDate = "actual_end_date",
  Version = "version",
}

// Sub-group-by fields for nested aggregations
export enum SprintSubGroupField {
  CreatedAt = "created_at",
  ProjectId = "project_id",
  Status = "status",
  StartDate = "start_date",
  EndDate = "end_date",
  ActualStartDate = "actual_start_date",
  ActualEndDate = "actual_end_date",
  Version = "version",
}

// Filterable fields for sprint queries
export enum SprintFilterField {
  CreatedAt = "created_at",
  UpdatedAt = "updated_at",
  ProjectId = "project_id",
  Name = "name",
  Status = "status",
  StartDate = "start_date",
  EndDate = "end_date",
  ActualStartDate = "actual_start_date",
  ActualEndDate = "actual_end_date",
  Version = "version",
  Velocity = "velocity",
  Capacity = "capacity",
}
