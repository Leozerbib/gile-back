export type HealthStatus = "SERVING" | "NOT_SERVING" | "UNKNOWN";

export interface HealthCheckDTO {
  service?: string;
}

export interface HealthCheckResult {
  status: HealthStatus;
}

export * from "./auth/dtos";
export * from "./profile/dtos";
export * from "./workspace/dtos";
export * from "./tickets/dtos";
export * from "./sprints/dtos";
export * from "./user-preferences/dtos";
export * from "./notifications/dtos";
export * from "./activity-logs/dtos";
export * from "./model-usage/dtos";
export * from "./workflow-definitions/dtos";
export * from "./conversation-types/dtos";
export * from "./chatbot-configurations/dtos";
export * from "./completion-definitions/dtos";
export * from "./projects/dtos";
export * from "./agents/dtos";
export * from "./labels/dtos";
export * from "./teams/dtos";
export * from "./stacks/dtos";
export * from "./chats/dtos";
export * from "./epics/dtos";
export * from "./tasks/dtos";
export * from "./common/page";
export * from "./common/search";

// Shared log types
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp?: string; // ISO8601
  level: LogLevel;
  service: string; // which microservice emits the log
  func: string; // which function/scope
  message: string; // human readable message
  data?: unknown; // optional structured data
}

// GRPC User type for authenticated requests
export interface AuthenticatedUser {
  user_id: string;
}

// GRPC Message wrapper for authenticated requests
export interface AuthenticatedGrpcRequest<T> {
  user: AuthenticatedUser;
  data: T;
}
