/**
 * Project-specific search and filter options
 * Derived from Prisma model `projects` fields in schema.prisma
 */

// Sortable fields for project listings
export enum ProjectSortField {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Name = "name",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "startDate",
  EndDate = "endDate",
}

// Group-by fields for aggregations
export enum ProjectGroupField {
  CreatedAt = "createdAt",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "startDate",
  EndDate = "endDate",
}

// Sub-group-by fields for nested aggregations
export enum ProjectSubGroupField {
  CreatedAt = "createdAt",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "startDate",
  EndDate = "endDate",
}

// Filterable fields for project queries
export enum ProjectFilterField {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
  WorkspaceId = "workspace_id",
  ProjectManagerId = "project_manager_id",
  Name = "name",
  Status = "status",
  Priority = "priority",
  Progress = "progress",
  IsArchived = "is_archived",
  IsPublic = "is_public",
  StartDate = "startDate",
  EndDate = "endDate",
}
