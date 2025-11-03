import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";

export interface DependencyRelation {
  sourceTable: string;
  sourceId: string;
  relatedTable: string;
  relatedId: string;
  relationType: "depends_on" | "blocks" | "relates_to" | "parent_child" | "epic_ticket" | "sprint_ticket";
  workspaceId: string;
  projectId?: string;
}

export interface EntityDependencies {
  entityId: string;
  entityTable: string;
  dependencies: DependencyRelation[];
  dependents: DependencyRelation[];
}

@Injectable()
export class DependencyTrackerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerClientService,
  ) {}

  /**
   * Get all dependencies for a specific entity
   */
  async getEntityDependencies(entityTable: string, entityId: string, workspaceId: string): Promise<EntityDependencies> {
    await this.logger.log({
      level: "debug",
      service: "vector",
      func: "getEntityDependencies",
      message: "Getting entity dependencies",
      data: { entityTable, entityId, workspaceId },
    });

    try {
      const dependencies: DependencyRelation[] = [];
      const dependents: DependencyRelation[] = [];

      // Get ticket dependencies
      if (entityTable === "tickets") {
        const ticketDeps = await this.getTicketDependencies(entityId, workspaceId);
        dependencies.push(...ticketDeps.dependencies);
        dependents.push(...ticketDeps.dependents);
      }

      // Get epic-ticket relationships
      if (entityTable === "tickets" || entityTable === "epics") {
        const epicRelations = await this.getEpicTicketRelations(entityTable, entityId, workspaceId);
        dependencies.push(...epicRelations.dependencies);
        dependents.push(...epicRelations.dependents);
      }

      // Get sprint-ticket relationships
      if (entityTable === "tickets" || entityTable === "sprints") {
        const sprintRelations = await this.getSprintTicketRelations(entityTable, entityId, workspaceId);
        dependencies.push(...sprintRelations.dependencies);
        dependents.push(...sprintRelations.dependents);
      }

      // Get task-ticket relationships
      if (entityTable === "tickets" || entityTable === "tasks") {
        const taskRelations = await this.getTaskTicketRelations(entityTable, entityId, workspaceId);
        dependencies.push(...taskRelations.dependencies);
        dependents.push(...taskRelations.dependents);
      }

      // Get project relationships
      if (entityTable === "projects" || entityTable === "tickets" || entityTable === "epics" || entityTable === "sprints") {
        const projectRelations = await this.getProjectRelations(entityTable, entityId, workspaceId);
        dependencies.push(...projectRelations.dependencies);
        dependents.push(...projectRelations.dependents);
      }

      return {
        entityId,
        entityTable,
        dependencies,
        dependents,
      };
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "getEntityDependencies",
        message: "Failed to get entity dependencies",
        data: { entityTable, entityId, workspaceId, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Get ticket dependencies (ticket_dependencies table)
   */
  private async getTicketDependencies(
    ticketId: string,
    workspaceId: string,
  ): Promise<{
    dependencies: DependencyRelation[];
    dependents: DependencyRelation[];
  }> {
    const dependencies: DependencyRelation[] = [];
    const dependents: DependencyRelation[] = [];

    // Get tickets this ticket depends on
    const dependsOn = await this.prisma.$queryRaw<
      Array<{
        depends_on_ticket_id: string;
        project_id: string;
      }>
    >`
      SELECT td.depends_on_ticket_id, t.project_id
      FROM ticket_dependencies td
      JOIN tickets t ON t.id = td.depends_on_ticket_id
      WHERE td.ticket_id = ${ticketId}
      AND t.workspace_id = ${workspaceId}
    `;

    for (const dep of dependsOn) {
      dependencies.push({
        sourceTable: "tickets",
        sourceId: ticketId,
        relatedTable: "tickets",
        relatedId: dep.depends_on_ticket_id,
        relationType: "depends_on",
        workspaceId,
        projectId: dep.project_id,
      });
    }

    // Get tickets that depend on this ticket
    const dependentTickets = await this.prisma.$queryRaw<
      Array<{
        ticket_id: string;
        project_id: string;
      }>
    >`
      SELECT td.ticket_id, t.project_id
      FROM ticket_dependencies td
      JOIN tickets t ON t.id = td.ticket_id
      WHERE td.depends_on_ticket_id = ${ticketId}
      AND t.workspace_id = ${workspaceId}
    `;

    for (const dep of dependentTickets) {
      dependents.push({
        sourceTable: "tickets",
        sourceId: dep.ticket_id,
        relatedTable: "tickets",
        relatedId: ticketId,
        relationType: "depends_on",
        workspaceId,
        projectId: dep.project_id,
      });
    }

    return { dependencies, dependents };
  }

  /**
   * Get epic-ticket relationships
   */
  private async getEpicTicketRelations(
    entityTable: string,
    entityId: string,
    workspaceId: string,
  ): Promise<{
    dependencies: DependencyRelation[];
    dependents: DependencyRelation[];
  }> {
    const dependencies: DependencyRelation[] = [];
    const dependents: DependencyRelation[] = [];

    if (entityTable === "tickets") {
      // Get epic for this ticket
      const ticketEpic = await this.prisma.$queryRaw<
        Array<{
          epic_id: string;
          project_id: string;
        }>
      >`
        SELECT epic_id, project_id
        FROM tickets
        WHERE id = ${entityId} AND epic_id IS NOT NULL
        AND workspace_id = ${workspaceId}
      `;

      for (const epic of ticketEpic) {
        dependencies.push({
          sourceTable: "tickets",
          sourceId: entityId,
          relatedTable: "epics",
          relatedId: epic.epic_id,
          relationType: "epic_ticket",
          workspaceId,
          projectId: epic.project_id,
        });
      }
    } else if (entityTable === "epics") {
      // Get tickets in this epic
      const epicTickets = await this.prisma.$queryRaw<
        Array<{
          id: string;
          project_id: string;
        }>
      >`
        SELECT id, project_id
        FROM tickets
        WHERE epic_id = ${entityId}
        AND workspace_id = ${workspaceId}
      `;

      for (const ticket of epicTickets) {
        dependents.push({
          sourceTable: "tickets",
          sourceId: ticket.id,
          relatedTable: "epics",
          relatedId: entityId,
          relationType: "epic_ticket",
          workspaceId,
          projectId: ticket.project_id,
        });
      }
    }

    return { dependencies, dependents };
  }

  /**
   * Get sprint-ticket relationships
   */
  private async getSprintTicketRelations(
    entityTable: string,
    entityId: string,
    workspaceId: string,
  ): Promise<{
    dependencies: DependencyRelation[];
    dependents: DependencyRelation[];
  }> {
    const dependencies: DependencyRelation[] = [];
    const dependents: DependencyRelation[] = [];

    if (entityTable === "tickets") {
      // Get sprint for this ticket
      const ticketSprint = await this.prisma.$queryRaw<
        Array<{
          sprint_id: string;
          project_id: string;
        }>
      >`
        SELECT sprint_id, project_id
        FROM tickets
        WHERE id = ${entityId} AND sprint_id IS NOT NULL
        AND workspace_id = ${workspaceId}
      `;

      for (const sprint of ticketSprint) {
        dependencies.push({
          sourceTable: "tickets",
          sourceId: entityId,
          relatedTable: "sprints",
          relatedId: sprint.sprint_id,
          relationType: "sprint_ticket",
          workspaceId,
          projectId: sprint.project_id,
        });
      }
    } else if (entityTable === "sprints") {
      // Get tickets in this sprint
      const sprintTickets = await this.prisma.$queryRaw<
        Array<{
          id: string;
          project_id: string;
        }>
      >`
        SELECT id, project_id
        FROM tickets
        WHERE sprint_id = ${entityId}
        AND workspace_id = ${workspaceId}
      `;

      for (const ticket of sprintTickets) {
        dependents.push({
          sourceTable: "tickets",
          sourceId: ticket.id,
          relatedTable: "sprints",
          relatedId: entityId,
          relationType: "sprint_ticket",
          workspaceId,
          projectId: ticket.project_id,
        });
      }
    }

    return { dependencies, dependents };
  }

  /**
   * Get task-ticket relationships
   */
  private async getTaskTicketRelations(
    entityTable: string,
    entityId: string,
    workspaceId: string,
  ): Promise<{
    dependencies: DependencyRelation[];
    dependents: DependencyRelation[];
  }> {
    const dependencies: DependencyRelation[] = [];
    const dependents: DependencyRelation[] = [];

    if (entityTable === "tasks") {
      // Get tickets for this task
      const taskTickets = await this.prisma.$queryRaw<
        Array<{
          ticket_id: string;
          project_id: string;
        }>
      >`
        SELECT tt.ticket_id, t.project_id
        FROM task_tickets tt
        JOIN tickets t ON t.id = tt.ticket_id
        WHERE tt.task_id = ${entityId}
        AND t.workspace_id = ${workspaceId}
      `;

      for (const ticket of taskTickets) {
        dependencies.push({
          sourceTable: "tasks",
          sourceId: entityId,
          relatedTable: "tickets",
          relatedId: ticket.ticket_id,
          relationType: "parent_child",
          workspaceId,
          projectId: ticket.project_id,
        });
      }
    } else if (entityTable === "tickets") {
      // Get tasks for this ticket
      const ticketTasks = await this.prisma.$queryRaw<
        Array<{
          task_id: string;
          project_id: string;
        }>
      >`
        SELECT tt.task_id, t.project_id
        FROM task_tickets tt
        JOIN tickets t ON t.id = tt.ticket_id
        WHERE tt.ticket_id = ${entityId}
        AND t.workspace_id = ${workspaceId}
      `;

      for (const task of ticketTasks) {
        dependents.push({
          sourceTable: "tasks",
          sourceId: task.task_id,
          relatedTable: "tickets",
          relatedId: entityId,
          relationType: "parent_child",
          workspaceId,
          projectId: task.project_id,
        });
      }
    }

    return { dependencies, dependents };
  }

  /**
   * Get project relationships
   */
  private async getProjectRelations(
    entityTable: string,
    entityId: string,
    workspaceId: string,
  ): Promise<{
    dependencies: DependencyRelation[];
    dependents: DependencyRelation[];
  }> {
    const dependencies: DependencyRelation[] = [];
    const dependents: DependencyRelation[] = [];

    if (entityTable === "tickets" || entityTable === "epics" || entityTable === "sprints") {
      // Get project for this entity
      let projectQuery: string;
      switch (entityTable) {
        case "tickets":
          projectQuery = `SELECT project_id FROM tickets WHERE id = '${entityId}' AND workspace_id = '${workspaceId}'`;
          break;
        case "epics":
          projectQuery = `SELECT project_id FROM epics WHERE id = '${entityId}' AND workspace_id = '${workspaceId}'`;
          break;
        case "sprints":
          projectQuery = `SELECT project_id FROM sprints WHERE id = '${entityId}' AND workspace_id = '${workspaceId}'`;
          break;
      }

      const projectResult = await this.prisma.$queryRawUnsafe<Array<{ project_id: string }>>(projectQuery);

      for (const project of projectResult) {
        if (project.project_id) {
          dependencies.push({
            sourceTable: entityTable,
            sourceId: entityId,
            relatedTable: "projects",
            relatedId: project.project_id,
            relationType: "parent_child",
            workspaceId,
            projectId: project.project_id,
          });
        }
      }
    } else if (entityTable === "projects") {
      // Get all entities in this project
      const projectEntities = await Promise.all([
        this.prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM tickets WHERE project_id = ${entityId} AND workspace_id = ${workspaceId}`,
        this.prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM epics WHERE project_id = ${entityId} AND workspace_id = ${workspaceId}`,
        this.prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM sprints WHERE project_id = ${entityId} AND workspace_id = ${workspaceId}`,
      ]);

      const [tickets, epics, sprints] = projectEntities;

      // Add tickets as dependents
      for (const ticket of tickets) {
        dependents.push({
          sourceTable: "tickets",
          sourceId: ticket.id,
          relatedTable: "projects",
          relatedId: entityId,
          relationType: "parent_child",
          workspaceId,
          projectId: entityId,
        });
      }

      // Add epics as dependents
      for (const epic of epics) {
        dependents.push({
          sourceTable: "epics",
          sourceId: epic.id,
          relatedTable: "projects",
          relatedId: entityId,
          relationType: "parent_child",
          workspaceId,
          projectId: entityId,
        });
      }

      // Add sprints as dependents
      for (const sprint of sprints) {
        dependents.push({
          sourceTable: "sprints",
          sourceId: sprint.id,
          relatedTable: "projects",
          relatedId: entityId,
          relationType: "parent_child",
          workspaceId,
          projectId: entityId,
        });
      }
    }

    return { dependencies, dependents };
  }

  /**
   * Get all entities that should be re-processed when a dependency changes
   */
  async getAffectedEntities(
    entityTable: string,
    entityId: string,
    workspaceId: string,
  ): Promise<
    Array<{
      table: string;
      id: string;
      projectId?: string;
    }>
  > {
    const dependencies = await this.getEntityDependencies(entityTable, entityId, workspaceId);
    const affectedEntities: Array<{ table: string; id: string; projectId?: string }> = [];

    // Add the entity itself
    affectedEntities.push({
      table: entityTable,
      id: entityId,
      projectId: dependencies.dependencies.find(d => d.relatedTable === "projects")?.relatedId,
    });

    // Add all dependent entities
    for (const dependent of dependencies.dependents) {
      affectedEntities.push({
        table: dependent.sourceTable,
        id: dependent.sourceId,
        projectId: dependent.projectId,
      });
    }

    // Add all dependency entities (for bidirectional updates)
    for (const dependency of dependencies.dependencies) {
      if (dependency.relationType === "depends_on") {
        affectedEntities.push({
          table: dependency.relatedTable,
          id: dependency.relatedId,
          projectId: dependency.projectId,
        });
      }
    }

    // Remove duplicates
    const uniqueEntities = affectedEntities.filter((entity, index, self) => index === self.findIndex(e => e.table === entity.table && e.id === entity.id));

    await this.logger.log({
      level: "debug",
      service: "vector",
      func: "getAffectedEntities",
      message: "Found affected entities",
      data: {
        sourceEntity: { table: entityTable, id: entityId },
        affectedCount: uniqueEntities.length,
        entities: uniqueEntities,
      },
    });

    return uniqueEntities;
  }

  /**
   * Check if an entity has dependencies that need to be included in its vector document
   */
  async shouldIncludeDependencies(entityTable: string, entityId: string, workspaceId: string): Promise<boolean> {
    const dependencies = await this.getEntityDependencies(entityTable, entityId, workspaceId);

    // Include dependencies if there are any meaningful relationships
    return dependencies.dependencies.length > 0 || dependencies.dependents.length > 0;
  }

  /**
   * Get dependency context for inclusion in vector document content
   */
  async getDependencyContext(entityTable: string, entityId: string, workspaceId: string): Promise<string> {
    const dependencies = await this.getEntityDependencies(entityTable, entityId, workspaceId);
    const contextParts: string[] = [];

    // Add dependency information
    if (dependencies.dependencies.length > 0) {
      const depsByType = dependencies.dependencies.reduce(
        (acc, dep) => {
          if (!acc[dep.relationType]) acc[dep.relationType] = [];
          acc[dep.relationType].push(dep);
          return acc;
        },
        {} as Record<string, DependencyRelation[]>,
      );

      for (const [type, deps] of Object.entries(depsByType)) {
        const depIds = deps.map(d => d.relatedId).join(", ");
        contextParts.push(`${type.replace("_", " ")}: ${depIds}`);
      }
    }

    // Add dependent information
    if (dependencies.dependents.length > 0) {
      const depsByType = dependencies.dependents.reduce(
        (acc, dep) => {
          if (!acc[dep.relationType]) acc[dep.relationType] = [];
          acc[dep.relationType].push(dep);
          return acc;
        },
        {} as Record<string, DependencyRelation[]>,
      );

      for (const [type, deps] of Object.entries(depsByType)) {
        const depIds = deps.map(d => d.sourceId).join(", ");
        contextParts.push(`${type.replace("_", " ")} by: ${depIds}`);
      }
    }

    return contextParts.join(". ");
  }
}
