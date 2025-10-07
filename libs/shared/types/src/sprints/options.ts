/**
 * Sprint-specific search and filter options
 * Derived from Prisma model `sprints` fields in schema.prisma
 */

// Sortable fields for sprint listings
export enum SprintSortField {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
  ProjectId = "project_id",
  Name = "name",
  Status = "status",
  StartDate = "startDate",
  EndDate = "endDate",
  Version = "version",
}

// Group-by fields for aggregations
export enum SprintGroupField {
  CreatedAt = "createdAt",
  ProjectId = "project_id",
  Status = "status",
  StartDate = "startDate",
  EndDate = "endDate",
  Version = "version",
}

// Sub-group-by fields for nested aggregations
export enum SprintSubGroupField {
  CreatedAt = "createdAt",
  ProjectId = "project_id",
  Status = "status",
  StartDate = "startDate",
  EndDate = "endDate",
  Version = "version",
}

// Filterable fields for sprint queries
export enum SprintFilterField {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
  ProjectId = "project_id",
  Status = "status",
  StartDate = "startDate",
  EndDate = "endDate",
  Version = "version",
}
