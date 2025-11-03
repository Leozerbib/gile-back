import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { EntityChangeEvent } from "../interfaces/vector-event.interface";
import { VectorEmbeddingService } from "./vector-embedding.service";
import { VectorDatabaseService, VectorDocument } from "./vector-database.service";
import { DependencyTrackerService } from "./dependency-tracker.service";
import { MonitoringService } from "./monitoring.service";

@Injectable()
export class VectorAggregationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerClientService,
    private readonly vectorEmbedding: VectorEmbeddingService,
    private readonly vectorDatabase: VectorDatabaseService,
    private readonly dependencyTracker: DependencyTrackerService,
    private readonly monitoringService: MonitoringService,
  ) {}

  /**
   * Process entity for embedding with dependency tracking
   */
  async processEntityForEmbedding(event: EntityChangeEvent): Promise<void> {
    await this.logger.log({
      level: "info",
      service: "vector",
      func: "processEntityForEmbedding",
      message: "Processing entity for embedding",
      data: {
        entityTable: event.sourceTable,
        entityId: event.sourceId,
        entityType: event.entityType,
        workspaceId: event.workspaceId,
      },
    });

    try {
      // Get all affected entities (including dependencies)
      const affectedEntities = await this.dependencyTracker.getAffectedEntities(event.sourceTable, event.sourceId, event.workspaceId);

      // Process each affected entity
      for (const entity of affectedEntities) {
        await this.processIndividualEntity(entity.table, entity.id, event.workspaceId, entity.projectId);
      }

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "processEntityForEmbedding",
        message: "Successfully processed entity and dependencies",
        data: {
          sourceEntity: { table: event.sourceTable, id: event.sourceId },
          affectedEntitiesCount: affectedEntities.length,
        },
      });
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "processEntityForEmbedding",
        message: "Failed to process entity for embedding",
        data: {
          entityTable: event.sourceTable,
          entityId: event.sourceId,
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Process individual entity for embedding
   */
  private async processIndividualEntity(entityTable: string, entityId: number, workspaceId: string, projectId?: number): Promise<void> {
    const startTime = Date.now();

    try {
      let content: string;
      let documentType: string;

      // Aggregate data based on entity type
      switch (entityTable) {
        case "projects":
          content = await this.aggregateProjectData(entityId.toString(), workspaceId);
          documentType = "project";
          break;
        case "tickets":
          content = await this.aggregateTicketData(entityId.toString(), workspaceId);
          documentType = "ticket";
          break;
        case "epics":
          content = await this.aggregateEpicData(entityId.toString(), workspaceId);
          documentType = "epic";
          break;
        case "tasks":
          content = await this.aggregateTaskData(entityId.toString(), workspaceId);
          documentType = "task";
          break;
        case "sprints":
          content = await this.aggregateSprintData(entityId.toString(), workspaceId);
          documentType = "sprint";
          break;
        default:
          await this.logger.log({
            level: "warn",
            service: "vector",
            func: "processIndividualEntity",
            message: "Unsupported entity type",
            data: { entityTable, entityId },
          });
          return;
      }

      // Generate embedding with monitoring
      const embedding = await this.vectorEmbedding.generateEmbedding(content, documentType as any, entityId.toString(), workspaceId);

      // Create vector document
      const vectorDoc: VectorDocument = {
        content,
        embedding,
        sourceTable: entityTable,
        sourceId: entityId.toString(),
        workspaceId,
        projectId: projectId?.toString(),
        documentType,
        metadata: {
          lastUpdated: new Date().toISOString(),
          contentLength: content.length,
          embeddingDimensions: embedding.length,
        },
      };

      // Store in vector database
      await this.vectorDatabase.insertDocument(vectorDoc);

      const duration = Date.now() - startTime;

      // Record successful database operation
      await this.monitoringService.recordDatabaseMetric("insert", 1, duration, true, undefined, undefined, undefined, documentType as any, entityId.toString(), workspaceId);

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "processIndividualEntity",
        message: "Successfully processed entity for embedding",
        data: {
          entityTable,
          entityId,
          workspaceId,
          contentLength: content.length,
          embeddingDimensions: embedding.length,
          duration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed database operation
      await this.monitoringService.recordDatabaseMetric(
        "insert",
        0,
        duration,
        false,
        undefined,
        error.constructor.name,
        error.message,
        entityTable as any,
        entityId.toString(),
        workspaceId,
      );

      await this.logger.log({
        level: "error",
        service: "vector",
        func: "processIndividualEntity",
        message: "Failed to process entity for embedding",
        data: {
          entityTable,
          entityId,
          workspaceId,
          error: error.message,
          duration,
        },
      });
      throw error;
    }
  }

  /**
   * Remove entity embedding from vector database
   */
  async removeEntityEmbedding(event: EntityChangeEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Get all affected entities (including dependencies)
      const affectedEntities = await this.dependencyTracker.getAffectedEntities(event.sourceTable, event.sourceId, event.workspaceId);

      // Remove the main entity
      await this.vectorDatabase.deleteDocument(event.sourceTable, event.sourceId, event.workspaceId);

      const deleteTime = Date.now() - startTime;

      // Record successful delete operation
      await this.monitoringService.recordDatabaseMetric(
        "delete",
        1,
        deleteTime,
        true,
        undefined,
        undefined,
        undefined,
        event.sourceTable as any,
        event.sourceId,
        event.workspaceId,
      );

      // Re-process dependent entities (they may need updated embeddings without this entity)
      let reprocessedCount = 0;
      for (const entity of affectedEntities) {
        if (entity.table !== event.sourceTable || entity.id !== event.sourceId) {
          await this.processIndividualEntity(entity.table, entity.id, event.workspaceId, entity.projectId);
          reprocessedCount++;
        }
      }

      const totalDuration = Date.now() - startTime;

      await this.logger.log({
        level: "info",
        service: "vector",
        func: "removeEntityEmbedding",
        message: "Successfully removed entity embedding and updated dependencies",
        data: {
          entityTable: event.sourceTable,
          entityId: event.sourceId,
          workspaceId: event.workspaceId,
          affectedEntitiesCount: affectedEntities.length - 1, // Exclude the removed entity
          reprocessedCount,
          deleteTime,
          totalDuration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed delete operation
      await this.monitoringService.recordDatabaseMetric(
        "delete",
        0,
        duration,
        false,
        undefined,
        error.constructor.name,
        error.message,
        event.sourceTable as any,
        event.sourceId,
        event.workspaceId,
      );

      await this.logger.log({
        level: "error",
        service: "vector",
        func: "removeEntityEmbedding",
        message: "Failed to remove entity embedding",
        data: {
          entityTable: event.sourceTable,
          entityId: event.sourceId,
          workspaceId: event.workspaceId,
          error: error.message,
          duration,
        },
      });
      throw error;
    }
  }

  /**
   * Aggregate project data with dependencies
   */
  private async aggregateProjectData(projectId: string, workspaceId: string): Promise<string> {
    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        profiles: true,
        workspace: true,
      },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Get dependency context
    const dependencyContext = await this.dependencyTracker.getDependencyContext("projects", projectId, workspaceId);

    const parts = [
      `Project: ${project.name} (${project.slug})`,
      `Description: ${project.description || "No description"}`,
      project.full_description ? `Full Description: ${project.full_description}` : "",
      `Status: ${project.status}, Priority: ${project.priority}`,
      project.profiles ? `Managed by: ${project.profiles.first_name} ${project.profiles.last_name} (${project.profiles.username})` : "",
      project.stack ? `Technology Stack: ${project.stack}` : "",
      project.workspace ? `Workspace: ${project.workspace.name}` : "",
      dependencyContext ? `Dependencies: ${dependencyContext}` : "",
    ].filter(Boolean);

    return parts.join(". ");
  }

  /**
   * Aggregate ticket data with dependencies
   */
  private async aggregateTicketData(ticketId: string, workspaceId: string): Promise<string> {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        profiles: true,
        projects: true,
        sprints: true,
        epics: true,
        ticket_labels: {
          include: { labels: true },
        },
      },
    });

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Get dependency context
    const dependencyContext = await this.dependencyTracker.getDependencyContext("tickets", ticketId, workspaceId);

    const parts = [
      `Ticket #${ticket.ticket_number}: ${ticket.title}`,
      `Description: ${ticket.description || "No description"}`,
      `Status: ${ticket.status}, Priority: ${ticket.priority}, Category: ${ticket.category}`,
      ticket.profiles ? `Assigned to: ${ticket.profiles.first_name} ${ticket.profiles.last_name} (${ticket.profiles.username})` : "",
      ticket.sprints ? `Sprint: ${ticket.sprints.name} (${ticket.sprints.status})` : "",
      ticket.projects ? `Project: ${ticket.projects.name} (${ticket.projects.slug})` : "",
      ticket.epics ? `Epic: ${ticket.epics.title}` : "",
      ticket.story_points ? `Story Points: ${ticket.story_points}` : "",
      ticket.estimated_hours ? `Estimated Hours: ${ticket.estimated_hours}` : "",
      ticket.implementation_notes ? `Implementation Notes: ${ticket.implementation_notes}` : "",
      ticket.testing_notes ? `Testing Notes: ${ticket.testing_notes}` : "",
      ticket.ticket_labels.length > 0 ? `Labels: ${ticket.ticket_labels.map(tl => tl.labels.name).join(", ")}` : "",
      dependencyContext ? `Dependencies: ${dependencyContext}` : "",
    ].filter(Boolean);

    return parts.join(". ");
  }

  /**
   * Aggregate epic data with dependencies
   */
  private async aggregateEpicData(epicId: string, workspaceId: string): Promise<string> {
    const epic = await this.prisma.epics.findUnique({
      where: { id: epicId },
      include: {
        projects: true,
        profiles: true,
        tickets: {
          select: { id: true, title: true, ticket_number: true, status: true },
        },
      },
    });

    if (!epic) {
      throw new Error(`Epic not found: ${epicId}`);
    }

    // Get dependency context
    const dependencyContext = await this.dependencyTracker.getDependencyContext("epics", epicId, workspaceId);

    const parts = [
      `Epic: ${epic.title}`,
      `Description: ${epic.description || "No description"}`,
      `Status: ${epic.status}, Priority: ${epic.priority}`,
      epic.profiles ? `Assigned to: ${epic.profiles.first_name} ${epic.profiles.last_name} (${epic.profiles.username})` : "",
      epic.projects ? `Project: ${epic.projects.name} (${epic.projects.slug})` : "",
      epic.story_points ? `Story Points: ${epic.story_points}` : "",
      epic.estimated_hours ? `Estimated Hours: ${epic.estimated_hours}` : "",
      epic.tickets.length > 0 ? `Tickets: ${epic.tickets.map(t => `#${t.ticket_number}: ${t.title} (${t.status})`).join(", ")}` : "",
      dependencyContext ? `Dependencies: ${dependencyContext}` : "",
    ].filter(Boolean);

    return parts.join(". ");
  }

  /**
   * Aggregate task data with dependencies
   */
  private async aggregateTaskData(taskId: string, workspaceId: string): Promise<string> {
    const task = await this.prisma.task_tickets.findUnique({
      where: { id: taskId },
      include: {
        tickets: true,
        profiles: true,
      },
    });

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Get dependency context
    const dependencyContext = await this.dependencyTracker.getDependencyContext("task_tickets", taskId, workspaceId);

    const parts = [
      `Task: ${task.title}`,
      `Description: ${task.description || "No description"}`,
      `Status: ${task.status}, Priority: ${task.priority}`,
      task.profiles ? `Assigned to: ${task.profiles.first_name} ${task.profiles.last_name} (${task.profiles.username})` : "",
      task.tickets ? `Ticket: #${task.tickets.ticket_number}: ${task.tickets.title}` : "",
      task.estimated_hours ? `Estimated Hours: ${task.estimated_hours}` : "",
      task.actual_hours ? `Actual Hours: ${task.actual_hours}` : "",
      dependencyContext ? `Dependencies: ${dependencyContext}` : "",
    ].filter(Boolean);

    return parts.join(". ");
  }

  /**
   * Aggregate sprint data with dependencies
   */
  private async aggregateSprintData(sprintId: string, workspaceId: string): Promise<string> {
    const sprint = await this.prisma.sprints.findUnique({
      where: { id: sprintId },
      include: {
        projects: true,
        tickets: {
          select: { id: true, title: true, ticket_number: true, status: true },
        },
      },
    });

    if (!sprint) {
      throw new Error(`Sprint not found: ${sprintId}`);
    }

    // Get dependency context
    const dependencyContext = await this.dependencyTracker.getDependencyContext("sprints", sprintId, workspaceId);

    const parts = [
      `Sprint: ${sprint.name}`,
      `Description: ${sprint.description || "No description"}`,
      `Status: ${sprint.status}`,
      sprint.start_date ? `Start Date: ${sprint.start_date.toISOString().split("T")[0]}` : "",
      sprint.end_date ? `End Date: ${sprint.end_date.toISOString().split("T")[0]}` : "",
      sprint.projects ? `Project: ${sprint.projects.name} (${sprint.projects.slug})` : "",
      sprint.tickets.length > 0 ? `Tickets: ${sprint.tickets.map(t => `#${t.ticket_number}: ${t.title} (${t.status})`).join(", ")}` : "",
      dependencyContext ? `Dependencies: ${dependencyContext}` : "",
    ].filter(Boolean);

    return parts.join(". ");
  }
}
