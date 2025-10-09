/**
 * Project-specific search and filter options
 * Derived from Prisma model `projects` fields in schema.prisma
 */

// Sortable fields for project listings
export enum ProjectSortField {
  CreatedAt = "created_at",
  UpdatedAt = "updated_at",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Name = "name",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "start_date",
  EndDate = "end_date",
}

// Group-by fields for aggregations
export enum ProjectGroupField {
  CreatedAt = "created_at",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "start_date",
  EndDate = "end_date",
}

// Sub-group-by fields for nested aggregations
export enum ProjectSubGroupField {
  CreatedAt = "created_at",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "start_date",
  EndDate = "end_date",
}

// Filterable fields for project queries
export enum ProjectFilterField {
  CreatedAt = "created_at",
  UpdatedAt = "updated_at",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Name = "name",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "start_date",
  EndDate = "end_date",
}
