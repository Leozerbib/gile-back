import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";

export interface VectorDocument {
  id?: string;
  content: string;
  embedding: number[];
  sourceTable: string;
  sourceId: string;
  workspaceId: string;
  projectId?: string;
  documentType: string;
  metadata?: any;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  sourceTable: string;
  sourceId: string;
  workspaceId: string;
  projectId?: string;
  documentType: string;
  metadata?: any;
  similarity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VectorSearchOptions {
  workspaceId?: string;
  projectId?: string;
  sourceTable?: string;
  documentType?: string;
  limit?: number;
  threshold?: number;
}

@Injectable()
export class VectorDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerClientService,
  ) {}

  /**
   * Insert a new vector document
   */
  async insertVectorDocument(document: VectorDocument): Promise<string> {
    await this.logger.log({
      level: "debug",
      service: "vector",
      func: "insertVectorDocument",
      message: "Inserting new vector document",
      data: {
        sourceTable: document.sourceTable,
        sourceId: document.sourceId,
        workspaceId: document.workspaceId,
        documentType: document.documentType,
        contentLength: document.content.length,
        embeddingDimensions: document.embedding.length,
      },
    });

    try {
      // Convert embedding array to PostgreSQL vector format
      const embeddingVector = `[${document.embedding.join(",")}]`;

      const result = await this.prisma.$executeRaw`
        INSERT INTO vector_documents (
          content, embedding, source_table, source_id, workspace_id, 
          project_id, document_type, metadata, created_at, updated_at
        ) VALUES (
          ${document.content}, 
          ${embeddingVector}::vector, 
          ${document.sourceTable}, 
          ${document.sourceId}, 
          ${document.workspaceId}, 
          ${document.projectId || null}, 
          ${document.documentType}, 
          ${JSON.stringify(document.metadata || {})}, 
          NOW(), 
          NOW()
        )
        RETURNING id
      `;

      // Get the inserted document ID
      const insertedDoc = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM vector_documents 
        WHERE source_table = ${document.sourceTable} 
        AND source_id = ${document.sourceId} 
        AND workspace_id = ${document.workspaceId}
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const documentId = insertedDoc[0]?.id;

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "insertVectorDocument",
        message: "Successfully inserted vector document",
        data: { documentId, sourceTable: document.sourceTable, sourceId: document.sourceId },
      });

      return documentId;
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "insertVectorDocument",
        message: "Failed to insert vector document",
        data: {
          sourceTable: document.sourceTable,
          sourceId: document.sourceId,
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Update an existing vector document
   */
  async updateVectorDocument(sourceTable: string, sourceId: string, workspaceId: string, updates: Partial<VectorDocument>): Promise<void> {
    await this.logger.log({
      level: "debug",
      service: "vector",
      func: "updateVectorDocument",
      message: "Updating vector document",
      data: { sourceTable, sourceId, workspaceId },
    });

    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.content !== undefined) {
        updateFields.push("content = $" + (updateValues.length + 1));
        updateValues.push(updates.content);
      }

      if (updates.embedding !== undefined) {
        updateFields.push("embedding = $" + (updateValues.length + 1) + "::vector");
        updateValues.push(`[${updates.embedding.join(",")}]`);
      }

      if (updates.documentType !== undefined) {
        updateFields.push("document_type = $" + (updateValues.length + 1));
        updateValues.push(updates.documentType);
      }

      if (updates.metadata !== undefined) {
        updateFields.push("metadata = $" + (updateValues.length + 1));
        updateValues.push(JSON.stringify(updates.metadata));
      }

      if (updateFields.length === 0) {
        return; // Nothing to update
      }

      updateFields.push("updated_at = NOW()");

      // Add WHERE clause parameters
      updateValues.push(sourceTable, sourceId, workspaceId);

      const query = `
        UPDATE vector_documents 
        SET ${updateFields.join(", ")} 
        WHERE source_table = $${updateValues.length - 2} 
        AND source_id = $${updateValues.length - 1} 
        AND workspace_id = $${updateValues.length}
      `;

      await this.prisma.$executeRawUnsafe(query, ...updateValues);

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "updateVectorDocument",
        message: "Successfully updated vector document",
        data: { sourceTable, sourceId, workspaceId },
      });
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "updateVectorDocument",
        message: "Failed to update vector document",
        data: { sourceTable, sourceId, workspaceId, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Delete a vector document
   */
  async deleteVectorDocument(sourceTable: string, sourceId: string, workspaceId: string): Promise<void> {
    await this.logger.log({
      level: "debug",
      service: "vector",
      func: "deleteVectorDocument",
      message: "Deleting vector document",
      data: { sourceTable, sourceId, workspaceId },
    });

    try {
      await this.prisma.$executeRaw`
        DELETE FROM vector_documents 
        WHERE source_table = ${sourceTable} 
        AND source_id = ${sourceId} 
        AND workspace_id = ${workspaceId}
      `;

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "deleteVectorDocument",
        message: "Successfully deleted vector document",
        data: { sourceTable, sourceId, workspaceId },
      });
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "deleteVectorDocument",
        message: "Failed to delete vector document",
        data: { sourceTable, sourceId, workspaceId, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Check if a vector document exists
   */
  async vectorDocumentExists(sourceTable: string, sourceId: string, workspaceId: string): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM vector_documents 
        WHERE source_table = ${sourceTable} 
        AND source_id = ${sourceId} 
        AND workspace_id = ${workspaceId}
      `;

      return Number(result[0].count) > 0;
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "vectorDocumentExists",
        message: "Failed to check vector document existence",
        data: { sourceTable, sourceId, workspaceId, error: error.message },
      });
      return false;
    }
  }

  /**
   * Perform semantic search using vector similarity
   */
  async semanticSearch(queryEmbedding: number[], options: VectorSearchOptions = {}): Promise<VectorSearchResult[]> {
    const { workspaceId, projectId, sourceTable, documentType, limit = 10, threshold = 0.7 } = options;

    await this.logger.log({
      level: "debug",
      service: "vector",
      func: "semanticSearch",
      message: "Performing semantic search",
      data: {
        workspaceId,
        projectId,
        sourceTable,
        documentType,
        limit,
        threshold,
        queryDimensions: queryEmbedding.length,
      },
    });

    try {
      const queryVector = `[${queryEmbedding.join(",")}]`;
      let whereConditions: string[] = [];
      let parameters: any[] = [queryVector];

      if (workspaceId) {
        whereConditions.push(`workspace_id = $${parameters.length + 1}`);
        parameters.push(workspaceId);
      }

      if (projectId) {
        whereConditions.push(`project_id = $${parameters.length + 1}`);
        parameters.push(projectId);
      }

      if (sourceTable) {
        whereConditions.push(`source_table = $${parameters.length + 1}`);
        parameters.push(sourceTable);
      }

      if (documentType) {
        whereConditions.push(`document_type = $${parameters.length + 1}`);
        parameters.push(documentType);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

      // Add similarity threshold and limit parameters
      parameters.push(threshold, limit);

      const query = `
        SELECT 
          id, content, source_table, source_id, workspace_id, project_id, 
          document_type, metadata, created_at, updated_at,
          1 - (embedding <=> $1::vector) as similarity
        FROM vector_documents 
        ${whereClause}
        AND 1 - (embedding <=> $1::vector) >= $${parameters.length - 1}
        ORDER BY embedding <=> $1::vector
        LIMIT $${parameters.length}
      `;

      const results = await this.prisma.$queryRawUnsafe<VectorSearchResult[]>(query, ...parameters);

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "semanticSearch",
        message: "Semantic search completed",
        data: { resultsCount: results.length, threshold, limit },
      });

      return results.map(result => ({
        ...result,
        metadata: typeof result.metadata === "string" ? JSON.parse(result.metadata) : result.metadata,
      }));
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "semanticSearch",
        message: "Semantic search failed",
        data: { error: error.message, options },
      });
      throw error;
    }
  }

  /**
   * Get vector documents by source
   */
  async getVectorDocumentsBySource(sourceTable: string, workspaceId: string, projectId?: string): Promise<VectorSearchResult[]> {
    try {
      let query: string;
      let parameters: any[];

      if (projectId) {
        query = `
          SELECT id, content, source_table, source_id, workspace_id, project_id, 
                 document_type, metadata, created_at, updated_at
          FROM vector_documents 
          WHERE source_table = $1 AND workspace_id = $2 AND project_id = $3
          ORDER BY created_at DESC
        `;
        parameters = [sourceTable, workspaceId, projectId];
      } else {
        query = `
          SELECT id, content, source_table, source_id, workspace_id, project_id, 
                 document_type, metadata, created_at, updated_at
          FROM vector_documents 
          WHERE source_table = $1 AND workspace_id = $2
          ORDER BY created_at DESC
        `;
        parameters = [sourceTable, workspaceId];
      }

      const results = await this.prisma.$queryRawUnsafe<VectorSearchResult[]>(query, ...parameters);

      return results.map(result => ({
        ...result,
        metadata: typeof result.metadata === "string" ? JSON.parse(result.metadata) : result.metadata,
      }));
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "getVectorDocumentsBySource",
        message: "Failed to get vector documents by source",
        data: { sourceTable, workspaceId, projectId, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Get vector document statistics
   */
  async getVectorDocumentStats(
    workspaceId: string,
    projectId?: string,
  ): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsBySource: Record<string, number>;
  }> {
    try {
      let whereClause = "WHERE workspace_id = $1";
      let parameters = [workspaceId];

      if (projectId) {
        whereClause += " AND project_id = $2";
        parameters.push(projectId);
      }

      // Get total count
      const totalResult = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*) as count FROM vector_documents ${whereClause}`, ...parameters);

      // Get count by document type
      const typeResult = await this.prisma.$queryRawUnsafe<Array<{ document_type: string; count: bigint }>>(
        `SELECT document_type, COUNT(*) as count FROM vector_documents ${whereClause} GROUP BY document_type`,
        ...parameters,
      );

      // Get count by source table
      const sourceResult = await this.prisma.$queryRawUnsafe<Array<{ source_table: string; count: bigint }>>(
        `SELECT source_table, COUNT(*) as count FROM vector_documents ${whereClause} GROUP BY source_table`,
        ...parameters,
      );

      const documentsByType: Record<string, number> = {};
      typeResult.forEach(row => {
        documentsByType[row.document_type] = Number(row.count);
      });

      const documentsBySource: Record<string, number> = {};
      sourceResult.forEach(row => {
        documentsBySource[row.source_table] = Number(row.count);
      });

      return {
        totalDocuments: Number(totalResult[0].count),
        documentsByType,
        documentsBySource,
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "getVectorDocumentStats",
        message: "Failed to get vector document statistics",
        data: { workspaceId, projectId, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Bulk delete vector documents by source
   */
  async bulkDeleteBySource(sourceTable: string, workspaceId: string, projectId?: string): Promise<number> {
    try {
      let query: string;
      let parameters: any[];

      if (projectId) {
        query = `DELETE FROM vector_documents WHERE source_table = $1 AND workspace_id = $2 AND project_id = $3`;
        parameters = [sourceTable, workspaceId, projectId];
      } else {
        query = `DELETE FROM vector_documents WHERE source_table = $1 AND workspace_id = $2`;
        parameters = [sourceTable, workspaceId];
      }

      const result = await this.prisma.$executeRawUnsafe(query, ...parameters);

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "bulkDeleteBySource",
        message: "Bulk deleted vector documents",
        data: { sourceTable, workspaceId, projectId, deletedCount: result },
      });

      return result as number;
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "bulkDeleteBySource",
        message: "Failed to bulk delete vector documents",
        data: { sourceTable, workspaceId, projectId, error: error.message },
      });
      throw error;
    }
  }
}
