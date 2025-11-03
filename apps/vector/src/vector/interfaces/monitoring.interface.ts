export interface VectorOperationMetrics {
  operationType: "embedding" | "search" | "insert" | "update" | "delete" | "batch";
  entityType?: "project" | "ticket" | "epic" | "task" | "sprint";
  entityId?: string;
  workspaceId?: string;
  duration: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EmbeddingMetrics extends VectorOperationMetrics {
  operationType: "embedding";
  provider: string;
  model: string;
  textLength: number;
  embeddingDimensions?: number;
  attempts: number;
  circuitBreakerState?: "closed" | "open" | "half-open";
}

export interface SearchMetrics extends VectorOperationMetrics {
  operationType: "search";
  queryLength: number;
  resultsCount: number;
  similarityThreshold?: number;
  searchLimit: number;
}

export interface DatabaseMetrics extends VectorOperationMetrics {
  operationType: "insert" | "update" | "delete" | "batch";
  recordsAffected: number;
  batchSize?: number;
}

export interface PerformanceStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  operationsPerMinute: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface ServiceHealthMetrics {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  circuitBreakerStats: {
    state: "closed" | "open" | "half-open";
    failureCount: number;
    successCount: number;
    lastFailureTime?: Date;
  };
  lastHealthCheck: Date;
}

export interface VectorStoreStats {
  totalDocuments: number;
  documentsByEntityType: Record<string, number>;
  documentsByWorkspace: Record<string, number>;
  averageEmbeddingDimensions: number;
  storageSize: number;
  indexingStatus: "up-to-date" | "indexing" | "stale";
  lastIndexUpdate: Date;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  metricsInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    errorRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  logLevel: "debug" | "info" | "warn" | "error" | "fatal";
}

export interface AlertCondition {
  id: string;
  name: string;
  description: string;
  condition: (metrics: PerformanceStats | ServiceHealthMetrics) => boolean;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface MonitoringEvent {
  id: string;
  type: "metric" | "alert" | "health_check" | "performance";
  timestamp: Date;
  service: string;
  data: VectorOperationMetrics | PerformanceStats | ServiceHealthMetrics | VectorStoreStats;
  tags?: Record<string, string>;
}
