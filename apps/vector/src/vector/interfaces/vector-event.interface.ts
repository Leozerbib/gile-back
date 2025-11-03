export interface VectorEvent {
  eventType: "CREATE" | "UPDATE" | "DELETE";
  sourceTable: string;
  sourceId: number;
  workspaceId: string;
  projectId?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EntityChangeEvent extends VectorEvent {
  entityType: "PROJECT" | "TICKET" | "EPIC" | "TASK" | "SPRINT" | "LABEL";
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export interface DependencyChangeEvent extends VectorEvent {
  dependentEntityId: number;
  dependsOnEntityId: number;
  dependencyType: "TICKET_DEPENDENCY" | "TASK_DEPENDENCY";
}
