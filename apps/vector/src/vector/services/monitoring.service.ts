import { Injectable } from "@nestjs/common";
import { LoggerClientService } from "@shared/logger";
import {
  VectorOperationMetrics,
  EmbeddingMetrics,
  SearchMetrics,
  DatabaseMetrics,
  PerformanceStats,
  ServiceHealthMetrics,
  VectorStoreStats,
  MonitoringConfig,
  AlertCondition,
  MonitoringEvent,
} from "../interfaces/monitoring.interface";
import { VectorConfigService } from "../config/vector.config";

@Injectable()
export class MonitoringService {
  private metrics: VectorOperationMetrics[] = [];
  private performanceStats: Map<string, PerformanceStats> = new Map();
  private alertConditions: AlertCondition[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;
  private config: MonitoringConfig;

  constructor(
    private readonly logger: LoggerClientService,
    private readonly configService: VectorConfigService,
  ) {
    this.config = this.configService.getMonitoringConfig();
    this.initializeDefaultAlerts();

    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  /**
   * Record a vector operation metric
   */
  async recordMetric(metric: VectorOperationMetrics): Promise<void> {
    try {
      // Add timestamp if not provided
      if (!metric.timestamp) {
        metric.timestamp = new Date();
      }

      // Store metric
      this.metrics.push(metric);

      // Update performance stats
      this.updatePerformanceStats(metric);

      // Check alert conditions
      await this.checkAlertConditions(metric);

      // Log metric if enabled
      if (this.config.logLevel === "debug") {
        await this.logger.log({
          level: "debug",
          service: "vector",
          func: "recordMetric",
          message: "Vector operation metric recorded",
          data: {
            operationType: metric.operationType,
            entityType: metric.entityType,
            duration: metric.duration,
            success: metric.success,
            errorType: metric.errorType,
          },
        });
      }

      // Clean up old metrics
      this.cleanupOldMetrics();
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "recordMetric",
        message: "Failed to record metric",
        data: { error: error.message, metric },
      });
    }
  }

  /**
   * Record embedding operation metrics
   */
  async recordEmbeddingMetric(
    provider: string,
    model: string,
    textLength: number,
    duration: number,
    success: boolean,
    embeddingDimensions?: number,
    attempts: number = 1,
    circuitBreakerState?: "closed" | "open" | "half-open",
    errorType?: string,
    errorMessage?: string,
    entityType?: "project" | "ticket" | "epic" | "task" | "sprint",
    entityId?: string,
    workspaceId?: string,
  ): Promise<void> {
    const metric: EmbeddingMetrics = {
      operationType: "embedding",
      entityType,
      entityId,
      workspaceId,
      duration,
      success,
      errorType,
      errorMessage,
      timestamp: new Date(),
      provider,
      model,
      textLength,
      embeddingDimensions,
      attempts,
      circuitBreakerState,
    };

    await this.recordMetric(metric);
  }

  /**
   * Record search operation metrics
   */
  async recordSearchMetric(
    queryLength: number,
    resultsCount: number,
    duration: number,
    success: boolean,
    searchLimit: number,
    similarityThreshold?: number,
    errorType?: string,
    errorMessage?: string,
    workspaceId?: string,
  ): Promise<void> {
    const metric: SearchMetrics = {
      operationType: "search",
      workspaceId,
      duration,
      success,
      errorType,
      errorMessage,
      timestamp: new Date(),
      queryLength,
      resultsCount,
      similarityThreshold,
      searchLimit,
    };

    await this.recordMetric(metric);
  }

  /**
   * Record database operation metrics
   */
  async recordDatabaseMetric(
    operationType: "insert" | "update" | "delete" | "batch",
    recordsAffected: number,
    duration: number,
    success: boolean,
    batchSize?: number,
    errorType?: string,
    errorMessage?: string,
    entityType?: "project" | "ticket" | "epic" | "task" | "sprint",
    entityId?: string,
    workspaceId?: string,
  ): Promise<void> {
    const metric: DatabaseMetrics = {
      operationType,
      entityType,
      entityId,
      workspaceId,
      duration,
      success,
      errorType,
      errorMessage,
      timestamp: new Date(),
      recordsAffected,
      batchSize,
    };

    await this.recordMetric(metric);
  }

  /**
   * Get performance statistics for a specific operation type
   */
  getPerformanceStats(operationType?: string): PerformanceStats | Map<string, PerformanceStats> {
    if (operationType) {
      return this.performanceStats.get(operationType) || this.createEmptyStats();
    }
    return new Map(this.performanceStats);
  }

  /**
   * Get service health metrics
   */
  async getServiceHealthMetrics(): Promise<ServiceHealthMetrics> {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Calculate overall health status
    const overallStats = this.calculateOverallStats();
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (overallStats.errorRate > this.config.alertThresholds.errorRate) {
      status = "unhealthy";
    } else if (overallStats.averageDuration > this.config.alertThresholds.averageResponseTime) {
      status = "degraded";
    }

    return {
      service: "vector",
      status,
      uptime,
      memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // Would need additional monitoring for CPU
      activeConnections: 0, // Would need connection pool monitoring
      circuitBreakerStats: {
        state: "closed", // Would get from circuit breaker service
        failureCount: 0,
        successCount: overallStats.successfulOperations,
      },
      lastHealthCheck: new Date(),
    };
  }

  /**
   * Get vector store statistics
   */
  async getVectorStoreStats(): Promise<VectorStoreStats> {
    // This would typically query the database for actual stats
    // For now, return calculated stats from metrics
    const documentsByEntityType: Record<string, number> = {};
    const documentsByWorkspace: Record<string, number> = {};

    this.metrics
      .filter(m => m.operationType === "insert" && m.success)
      .forEach(metric => {
        if (metric.entityType) {
          documentsByEntityType[metric.entityType] = (documentsByEntityType[metric.entityType] || 0) + 1;
        }
        if (metric.workspaceId) {
          documentsByWorkspace[metric.workspaceId] = (documentsByWorkspace[metric.workspaceId] || 0) + 1;
        }
      });

    const totalDocuments = Object.values(documentsByEntityType).reduce((sum, count) => sum + count, 0);

    return {
      totalDocuments,
      documentsByEntityType,
      documentsByWorkspace,
      averageEmbeddingDimensions: 1536, // Would calculate from actual embeddings
      storageSize: 0, // Would query database for storage size
      indexingStatus: "up-to-date",
      lastIndexUpdate: new Date(),
    };
  }

  /**
   * Add custom alert condition
   */
  addAlertCondition(condition: AlertCondition): void {
    this.alertConditions.push(condition);
  }

  /**
   * Remove alert condition
   */
  removeAlertCondition(conditionId: string): void {
    this.alertConditions = this.alertConditions.filter(c => c.id !== conditionId);
  }

  /**
   * Get all metrics within a time range
   */
  getMetrics(startTime?: Date, endTime?: Date, operationType?: string, entityType?: string): VectorOperationMetrics[] {
    let filteredMetrics = [...this.metrics];

    if (startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
    }

    if (operationType) {
      filteredMetrics = filteredMetrics.filter(m => m.operationType === operationType);
    }

    if (entityType) {
      filteredMetrics = filteredMetrics.filter(m => m.entityType === entityType);
    }

    return filteredMetrics;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.performanceStats.clear();
  }

  /**
   * Stop metrics collection
   */
  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectPeriodicMetrics();
      } catch (error) {
        await this.logger.log({
          level: "error",
          service: "vector",
          func: "startMetricsCollection",
          message: "Failed to collect periodic metrics",
          data: { error: error.message },
        });
      }
    }, this.config.metricsInterval);
  }

  /**
   * Collect periodic metrics
   */
  private async collectPeriodicMetrics(): Promise<void> {
    const healthMetrics = await this.getServiceHealthMetrics();
    const vectorStoreStats = await this.getVectorStoreStats();

    // Log health metrics
    await this.logger.log({
      level: "info",
      service: "vector",
      func: "collectPeriodicMetrics",
      message: "Periodic health metrics collected",
      data: {
        status: healthMetrics.status,
        memoryUsage: healthMetrics.memoryUsage,
        uptime: healthMetrics.uptime,
        totalDocuments: vectorStoreStats.totalDocuments,
      },
    });
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(metric: VectorOperationMetrics): void {
    const key = metric.operationType;
    let stats = this.performanceStats.get(key);

    if (!stats) {
      stats = this.createEmptyStats();
      this.performanceStats.set(key, stats);
    }

    stats.totalOperations++;
    if (metric.success) {
      stats.successfulOperations++;
    } else {
      stats.failedOperations++;
    }

    // Update duration stats
    if (stats.totalOperations === 1) {
      stats.minDuration = metric.duration;
      stats.maxDuration = metric.duration;
      stats.averageDuration = metric.duration;
    } else {
      stats.minDuration = Math.min(stats.minDuration, metric.duration);
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
      stats.averageDuration = (stats.averageDuration * (stats.totalOperations - 1) + metric.duration) / stats.totalOperations;
    }

    // Calculate error rate and operations per minute
    stats.errorRate = stats.failedOperations / stats.totalOperations;

    // Calculate operations per minute (simplified)
    const timeWindow = 60000; // 1 minute
    const recentMetrics = this.metrics.filter(m => m.operationType === key && Date.now() - m.timestamp.getTime() < timeWindow);
    stats.operationsPerMinute = recentMetrics.length;

    stats.lastUpdated = new Date();
  }

  /**
   * Check alert conditions
   */
  private async checkAlertConditions(metric: VectorOperationMetrics): Promise<void> {
    const stats = this.performanceStats.get(metric.operationType);
    if (!stats) return;

    for (const condition of this.alertConditions) {
      if (!condition.enabled) continue;

      try {
        if (condition.condition(stats)) {
          await this.triggerAlert(condition, metric, stats);
        }
      } catch (error) {
        await this.logger.log({
          level: "error",
          service: "vector",
          func: "checkAlertConditions",
          message: "Failed to evaluate alert condition",
          data: { conditionId: condition.id, error: error.message },
        });
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(condition: AlertCondition, metric: VectorOperationMetrics, stats: PerformanceStats): Promise<void> {
    await this.logger.log({
      level: condition.severity === "critical" ? "fatal" : "warn",
      service: "vector",
      func: "triggerAlert",
      message: `Alert triggered: ${condition.name}`,
      data: {
        alertId: condition.id,
        alertName: condition.name,
        severity: condition.severity,
        description: condition.description,
        triggeringMetric: {
          operationType: metric.operationType,
          entityType: metric.entityType,
          duration: metric.duration,
          success: metric.success,
        },
        currentStats: {
          errorRate: stats.errorRate,
          averageDuration: stats.averageDuration,
          totalOperations: stats.totalOperations,
        },
      },
    });
  }

  /**
   * Initialize default alert conditions
   */
  private initializeDefaultAlerts(): void {
    this.alertConditions = [
      {
        id: "high-error-rate",
        name: "High Error Rate",
        description: "Error rate exceeds threshold",
        condition: (stats: PerformanceStats) => stats.errorRate > this.config.alertThresholds.errorRate,
        severity: "high",
        enabled: true,
      },
      {
        id: "slow-response-time",
        name: "Slow Response Time",
        description: "Average response time exceeds threshold",
        condition: (stats: PerformanceStats) => stats.averageDuration > this.config.alertThresholds.averageResponseTime,
        severity: "medium",
        enabled: true,
      },
    ];
  }

  /**
   * Clean up old metrics based on retention period
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * Create empty performance stats
   */
  private createEmptyStats(): PerformanceStats {
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      operationsPerMinute: 0,
      errorRate: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate overall statistics across all operation types
   */
  private calculateOverallStats(): PerformanceStats {
    const allStats = Array.from(this.performanceStats.values());

    if (allStats.length === 0) {
      return this.createEmptyStats();
    }

    const totalOps = allStats.reduce((sum, stats) => sum + stats.totalOperations, 0);
    const successfulOps = allStats.reduce((sum, stats) => sum + stats.successfulOperations, 0);
    const failedOps = allStats.reduce((sum, stats) => sum + stats.failedOperations, 0);

    return {
      totalOperations: totalOps,
      successfulOperations: successfulOps,
      failedOperations: failedOps,
      averageDuration: allStats.reduce((sum, stats) => sum + stats.averageDuration, 0) / allStats.length,
      minDuration: Math.min(...allStats.map(s => s.minDuration)),
      maxDuration: Math.max(...allStats.map(s => s.maxDuration)),
      operationsPerMinute: allStats.reduce((sum, stats) => sum + stats.operationsPerMinute, 0),
      errorRate: totalOps > 0 ? failedOps / totalOps : 0,
      lastUpdated: new Date(),
    };
  }
}
