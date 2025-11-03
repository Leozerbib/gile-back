import { Controller } from "@nestjs/common";
import { GrpcMethod, GrpcService } from "@nestjs/microservices";
import { VectorAggregationService } from "./services/vector-aggregation.service";
import { VectorSearchService } from "./services/vector-search.service";
import { VectorEmbeddingService } from "./services/vector-embedding.service";
import { MonitoringService } from "./services/monitoring.service";
import { LoggerClientService } from "@shared/logger";

// gRPC message types (these would be generated from proto files)
interface EntityChangeEvent {
  sourceTable: string;
  sourceId: string;
  workspaceId: string;
  projectId?: string;
  operation: string;
  timestamp: Date;
}

interface ProcessEntityRequest {
  event: EntityChangeEvent;
}

interface ProcessEntityResponse {
  success: boolean;
  message: string;
}

interface RemoveEntityRequest {
  event: EntityChangeEvent;
}

interface RemoveEntityResponse {
  success: boolean;
  message: string;
  affectedEntities: number;
}

interface SearchVectorRequest {
  query: string;
  workspaceId: string;
  projectId?: string;
  documentTypes?: string[];
  limit?: number;
  similarityThreshold?: number;
}

interface SearchVectorResponse {
  results: Array<{
    document: any;
    similarityScore: number;
  }>;
  totalCount: number;
}

interface SearchSimilarRequest {
  sourceTable: string;
  sourceId: string;
  workspaceId: string;
  limit?: number;
  similarityThreshold?: number;
}

interface SearchSimilarResponse {
  results: Array<{
    document: any;
    similarityScore: number;
  }>;
}

interface GenerateEmbeddingRequest {
  content: string;
  entityType: string;
  entityId: string;
  workspaceId: string;
}

interface GenerateEmbeddingResponse {
  embedding: number[];
  dimensions: number;
}

interface GetHealthRequest {}

interface GetHealthResponse {
  status: string;
  service: string;
  timestamp: Date;
}

interface GetMetricsRequest {}

interface GetMetricsResponse {
  metrics: string; // JSON string
}

@Controller()
@GrpcService("VectorService")
export class VectorController {
  constructor(
    private readonly vectorAggregation: VectorAggregationService,
    private readonly vectorSearch: VectorSearchService,
    private readonly vectorEmbedding: VectorEmbeddingService,
    private readonly monitoring: MonitoringService,
    private readonly logger: LoggerClientService,
  ) {}

  @GrpcMethod("VectorService", "ProcessEntity")
  async processEntity(request: ProcessEntityRequest): Promise<ProcessEntityResponse> {
    try {
      await this.logger.log({
        level: "info",
        service: "vector",
        func: "processEntity",
        message: "Processing entity for embedding",
        data: {
          sourceTable: request.event.sourceTable,
          sourceId: request.event.sourceId,
          workspaceId: request.event.workspaceId,
          operation: request.event.operation,
        },
      });

      await this.vectorAggregation.processEntityForEmbedding({
        sourceTable: request.event.sourceTable,
        sourceId: request.event.sourceId,
        workspaceId: request.event.workspaceId,
        projectId: request.event.projectId,
        operation: request.event.operation,
        timestamp: request.event.timestamp,
      });

      return {
        success: true,
        message: "Entity processed successfully",
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "processEntity",
        message: "Failed to process entity",
        data: {
          sourceTable: request.event.sourceTable,
          sourceId: request.event.sourceId,
          error: error.message,
        },
      });

      return {
        success: false,
        message: `Failed to process entity: ${error.message}`,
      };
    }
  }

  @GrpcMethod("VectorService", "RemoveEntity")
  async removeEntity(request: RemoveEntityRequest): Promise<RemoveEntityResponse> {
    try {
      await this.logger.log({
        level: "info",
        service: "vector",
        func: "removeEntity",
        message: "Removing entity embedding",
        data: {
          sourceTable: request.event.sourceTable,
          sourceId: request.event.sourceId,
          workspaceId: request.event.workspaceId,
        },
      });

      await this.vectorAggregation.removeEntityEmbedding({
        sourceTable: request.event.sourceTable,
        sourceId: request.event.sourceId,
        workspaceId: request.event.workspaceId,
        projectId: request.event.projectId,
        operation: request.event.operation,
        timestamp: request.event.timestamp,
      });

      return {
        success: true,
        message: "Entity removed successfully",
        affectedEntities: 0, // This would be returned from the service
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "removeEntity",
        message: "Failed to remove entity",
        data: {
          sourceTable: request.event.sourceTable,
          sourceId: request.event.sourceId,
          error: error.message,
        },
      });

      return {
        success: false,
        message: `Failed to remove entity: ${error.message}`,
        affectedEntities: 0,
      };
    }
  }

  @GrpcMethod("VectorService", "SearchVector")
  async searchVector(request: SearchVectorRequest): Promise<SearchVectorResponse> {
    try {
      await this.logger.log({
        level: "info",
        service: "vector",
        func: "searchVector",
        message: "Performing vector search",
        data: {
          query: request.query.substring(0, 100), // Log first 100 chars
          workspaceId: request.workspaceId,
          limit: request.limit,
        },
      });

      const results = await this.vectorSearch.searchByQuery(request.query, request.workspaceId, {
        projectId: request.projectId,
        documentTypes: request.documentTypes,
        limit: request.limit || 10,
        similarityThreshold: request.similarityThreshold || 0.7,
      });

      return {
        results: results.map(result => ({
          document: result.document,
          similarityScore: result.similarity,
        })),
        totalCount: results.length,
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "searchVector",
        message: "Failed to perform vector search",
        data: {
          workspaceId: request.workspaceId,
          error: error.message,
        },
      });

      return {
        results: [],
        totalCount: 0,
      };
    }
  }

  @GrpcMethod("VectorService", "SearchSimilar")
  async searchSimilar(request: SearchSimilarRequest): Promise<SearchSimilarResponse> {
    try {
      await this.logger.log({
        level: "info",
        service: "vector",
        func: "searchSimilar",
        message: "Searching for similar entities",
        data: {
          sourceTable: request.sourceTable,
          sourceId: request.sourceId,
          workspaceId: request.workspaceId,
          limit: request.limit,
        },
      });

      const results = await this.vectorSearch.findSimilarEntities(request.sourceTable, request.sourceId, request.workspaceId, {
        limit: request.limit || 10,
        similarityThreshold: request.similarityThreshold || 0.7,
      });

      return {
        results: results.map(result => ({
          document: result.document,
          similarityScore: result.similarity,
        })),
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "searchSimilar",
        message: "Failed to search similar entities",
        data: {
          sourceTable: request.sourceTable,
          sourceId: request.sourceId,
          error: error.message,
        },
      });

      return {
        results: [],
      };
    }
  }

  @GrpcMethod("VectorService", "GenerateEmbedding")
  async generateEmbedding(request: GenerateEmbeddingRequest): Promise<GenerateEmbeddingResponse> {
    try {
      await this.logger.log({
        level: "info",
        service: "vector",
        func: "generateEmbedding",
        message: "Generating embedding",
        data: {
          entityType: request.entityType,
          entityId: request.entityId,
          workspaceId: request.workspaceId,
          contentLength: request.content.length,
        },
      });

      const embedding = await this.vectorEmbedding.generateEmbedding(request.content, request.entityType as any, request.entityId, request.workspaceId);

      return {
        embedding,
        dimensions: embedding.length,
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "generateEmbedding",
        message: "Failed to generate embedding",
        data: {
          entityType: request.entityType,
          entityId: request.entityId,
          error: error.message,
        },
      });

      throw error;
    }
  }

  @GrpcMethod("VectorService", "GetHealth")
  async getHealth(request: GetHealthRequest): Promise<GetHealthResponse> {
    try {
      // Check service health
      const healthMetrics = await this.monitoring.getServiceHealthMetrics();

      return {
        status: healthMetrics.status,
        service: "vector",
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: "vector",
        timestamp: new Date(),
      };
    }
  }

  @GrpcMethod("VectorService", "GetMetrics")
  async getMetrics(request: GetMetricsRequest): Promise<GetMetricsResponse> {
    try {
      const performanceStats = await this.monitoring.getPerformanceStats();
      const healthMetrics = await this.monitoring.getServiceHealthMetrics();
      const vectorStoreStats = await this.monitoring.getVectorStoreStats();

      const metrics = {
        performance: performanceStats,
        health: healthMetrics,
        vectorStore: vectorStoreStats,
        timestamp: new Date().toISOString(),
      };

      return {
        metrics: JSON.stringify(metrics),
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "getMetrics",
        message: "Failed to get metrics",
        data: { error: error.message },
      });

      return {
        metrics: JSON.stringify({
          error: "Failed to retrieve metrics",
          timestamp: new Date().toISOString(),
        }),
      };
    }
  }
}
