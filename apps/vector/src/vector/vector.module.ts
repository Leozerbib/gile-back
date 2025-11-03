import { Module } from "@nestjs/common";
import { VectorController } from "./vector.controller";
import { VectorAggregationService } from "./services/vector-aggregation.service";
import { VectorSearchService } from "./services/vector-search.service";
import { VectorEmbeddingService } from "./services/vector-embedding.service";
import { VectorDatabaseService } from "./services/vector-database.service";
import { DependencyTrackerService } from "./services/dependency-tracker.service";
import { MonitoringService } from "./services/monitoring.service";
import { CircuitBreakerService } from "./services/circuit-breaker.service";
import { RetryService } from "./services/retry.service";
import { VectorConfigService } from "./config/vector.config";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";

@Module({
  controllers: [VectorController],
  providers: [
    // Core vector services
    VectorAggregationService,
    VectorSearchService,
    VectorEmbeddingService,
    VectorDatabaseService,

    // Supporting services
    DependencyTrackerService,
    MonitoringService,
    CircuitBreakerService,
    RetryService,

    // Configuration
    VectorConfigService,

    // Shared services
    PrismaService,
    LoggerClientService,
  ],
  exports: [
    // Export services that might be used by other modules
    VectorAggregationService,
    VectorSearchService,
    VectorEmbeddingService,
    VectorDatabaseService,
    MonitoringService,
    VectorConfigService,
  ],
})
export class VectorModule {}
