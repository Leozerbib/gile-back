import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskDto,
  TaskListDto,
  TaskStatus,
  BaseSearchQueryDto,
  SearchQueryBuilder,
  BasePaginationDto,
  ProfileOverviewSelect,
  TaskOverviewSelect,
  TaskOverview,
} from "@shared/types";
import { plainToInstance } from "class-transformer";
import { TeamMembersService } from "apps/workspace/src/team/team-members.service";

/**
 * Service for task management
 *
 * Provides CRUD operations and business logic for tasks:
 * - create: Create a new task within an epic
 * - search: Search tasks with pagination and filters
 * - getById: Retrieve a task by ID
 * - getOverview: Retrieve task overview
 * - update: Update an existing task
 * - delete: Delete a task
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
    private readonly teamMembersService: TeamMembersService,
  ) {}

  private async getProjectTeamIdOrThrow(projectId: number): Promise<string> {
    const pt = await this.prisma.project_teams.findFirst({
      where: { project_id: projectId },
      select: { team_id: true },
    });
    if (!pt) {
      throw new RpcException({ code: status.INTERNAL, message: `No team found for project with ID "${projectId}"` });
    }
    return pt.team_id;
  }

  /**
   * Create a new task within an epic
   *
   * @param userId - ID of the user creating the task
   * @param epicId - ID of the epic this task belongs to
   * @param dto - DTO containing task data
   * @returns The created task
   * @throws RpcException with INVALID_ARGUMENT if data is invalid
   * @throws RpcException with NOT_FOUND if epic doesn't exist
   * @throws RpcException with PERMISSION_DENIED if user lacks rights
   */
  async create(projectId: number, userId: string, epicId: number, dto: CreateTaskDto): Promise<TaskDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tasks.create",
      message: `Creating task with title: ${dto.title}`,
      data: { userId, title: dto.title, epicId },
    });

    // Validate input data
    if (!dto?.title?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "project",
        func: "tasks.create",
        message: "Task creation failed: title is required",
      });
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Task title is required",
      });
    }

    if (!epicId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "Epic ID is required",
      });
    }

    // Verify epic exists and get project/workspace context
    const epic = await this.prisma.epics.findUnique({
      where: { id: epicId },
      select: {
        id: true,
        title: true,
        project_id: true,
        project: {
          select: {
            id: true,
            workspace_id: true,
          },
        },
      },
    });

    if (!epic) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Epic with ID "${epicId}" not found`,
      });
    }

    // Check permissions
    const teamId = await this.getProjectTeamIdOrThrow(epic.project_id);
    const hasPermission = await this.teamMembersService.hasRight(teamId, userId, "create", "task");

    if (!hasPermission) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: "You don't have permission to create tasks in this workspace",
      });
    }

    try {
      // Create task
      const task = await this.prisma.tasks.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() ?? null,
          epic_id: epicId,
          status: (dto.status as TaskStatus) ?? TaskStatus.TODO,
          priority: dto.priority ?? 0,
          estimated_hours: dto.estimated_hours ?? null,
          actual_hours: dto.actual_hours ?? 0,
          due_date: dto.due_date ? new Date(dto.due_date) : null,
          created_by: userId,
          updated_by: userId,
        },
        include: {
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
        },
      });

      if (!task) {
        throw new Error("Failed to create task");
      }

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "tasks.create",
        message: `Task created successfully with ID: ${task.id}`,
        data: { id: task.id, title: task.title },
      });

      return plainToInstance(TaskDto, task, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tasks.create",
          message: `Failed to create task: ${error.message}`,
          data: { error: error.message, userId, title: dto.title },
        });
      }
      throw error;
    }
  }

  /**
   * Search tasks within an epic with pagination and filters
   *
   * @param userId - ID of the user making the request
   * @param epicId - ID of the epic to search tasks in
   * @param params - Search and pagination parameters
   * @returns Paginated list of tasks
   */
  async search(userId: string, epicId: number, projectId: number, params?: BaseSearchQueryDto): Promise<TaskListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    // Verify epic exists and get workspace context
    const epic = await this.prisma.epics.findUnique({
      where: { id: epicId },
      select: {
        id: true,
        project: {
          select: {
            workspace_id: true,
          },
        },
      },
    });

    if (!epic) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Epic with ID "${epicId}" not found`,
      });
    }

    // Check permissions
    const teamId = await this.getProjectTeamIdOrThrow(projectId);
    const hasPermission = await this.teamMembersService.hasRight(teamId, userId, "get", "task");

    if (!hasPermission) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: "You don't have permission to read tasks in this workspace",
      });
    }

    // Build base where clause
    let where: Prisma.tasksWhereInput = {
      epic_id: epicId,
    };

    // Apply text search
    const searchConditions = SearchQueryBuilder.buildSearchConditions(params?.search, ["title", "description"]);
    where = { ...where, ...searchConditions };

    // Apply filters
    const filterMapping: Record<string, string> = {
      status: "status",
      priority: "priority",
    };

    if (params?.filters) {
      const additionalFilters: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(params.filters as Record<string, unknown>)) {
        const mappedKey = filterMapping[key] ?? key;
        additionalFilters[mappedKey] = value;
      }
      where = { ...where, ...(additionalFilters as Prisma.tasksWhereInput) };
    }

    // Build orderBy
    const sortOptions = SearchQueryBuilder.buildSortOptions(params?.sortBy);
    const fieldMapping: Record<string, keyof Prisma.tasksOrderByWithRelationInput> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      title: "title",
      status: "status",
      priority: "priority",
      dueDate: "due_date",
    };

    const orderByArray: Prisma.tasksOrderByWithRelationInput[] = [];
    for (const [field, direction] of Object.entries(sortOptions)) {
      const mappedField = fieldMapping[field] ?? (field as keyof Prisma.tasksOrderByWithRelationInput);
      orderByArray.push({
        [mappedField]: direction as Prisma.SortOrder,
      } as Prisma.tasksOrderByWithRelationInput);
    }

    // Default sort
    const orderBy = orderByArray.length > 0 ? orderByArray : [{ created_at: Prisma.SortOrder.desc }];

    try {
      const [items, total] = await Promise.all([
        this.prisma.tasks.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            created_by_user: {
              select: ProfileOverviewSelect,
            },
            updated_by_user: {
              select: ProfileOverviewSelect,
            },
            epic: {
              select: {
                id: true,
                title: true,
                status: true,
                progress: true,
                category: true,
              },
            },
          },
        }),
        this.prisma.tasks.count({ where }),
      ]);

      return BasePaginationDto.create(
        items.map(item => plainToInstance(TaskDto, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        TaskListDto,
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tasks.search",
          message: `Failed to search tasks: ${error.message}`,
          data: { error: error.message, params },
        });
      }
      throw error;
    }
  }

  /**
   * Get task by ID
   *
   * @param id - Task ID
   * @param userId - ID of the user making the request
   * @returns The task
   * @throws RpcException with NOT_FOUND if task doesn't exist
   * @throws RpcException with PERMISSION_DENIED if user lacks access
   */
  async getById(id: number, userId: string, projectId: number): Promise<TaskDto> {
    try {
      const item = await this.prisma.tasks.findUnique({
        where: { id },
        include: {
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
          epic: {
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
              category: true,
              project: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });

      if (!item) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Task with ID "${id}" not found`,
        });
      }

      // Check permissions
      const teamId = await this.getProjectTeamIdOrThrow(projectId);
      const hasPermission = await this.teamMembersService.hasRight(teamId, userId, "get", "task");

      if (!hasPermission) {
        throw new RpcException({
          code: status.PERMISSION_DENIED,
          message: "You don't have permission to view this task",
        });
      }

      return plainToInstance(TaskDto, item, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tasks.getById",
          message: `Failed to get task by ID: ${error.message}`,
          data: { error: error.message, id },
        });
      }
      throw error;
    }
  }

  /**
   * Get task overview with pagination
   *
   * @param epicId - ID of the epic context
   * @param userId - ID of the user making the request
   * @param params - Search and pagination parameters
   * @returns Paginated list of task overviews
   */
  async getOverview(projectId: number, epicId: number, userId: string, params?: BaseSearchQueryDto): Promise<TaskListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 10;
    const search = params?.search ?? "";

    // Verify epic exists
    const epic = await this.prisma.epics.findUnique({
      where: { id: epicId },
      select: {
        id: true,
        project: {
          select: {
            workspace_id: true,
          },
        },
      },
    });

    if (!epic) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Epic with ID "${epicId}" not found`,
      });
    }

    try {
      const where: Prisma.tasksWhereInput = {
        epic_id: epicId,
        title: { contains: search, mode: "insensitive" },
      };

      const [items, total] = await Promise.all([
        this.prisma.tasks.findMany({
          where,
          select: TaskOverviewSelect,
          orderBy: { created_at: Prisma.SortOrder.desc },
          skip,
          take,
        }),
        this.prisma.tasks.count({ where }),
      ]);

      return BasePaginationDto.create(
        items.map(item => plainToInstance(TaskOverview, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        TaskListDto,
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tasks.getOverview",
          message: `Failed to get task overview: ${error.message}`,
          data: { error: error.message, search, userId },
        });
      }
      throw error;
    }
  }

  /**
   * Update an existing task
   *
   * @param id - Task ID to update
   * @param dto - DTO containing update data
   * @param updatedBy - ID of the user performing the update
   * @returns The updated task
   * @throws RpcException with NOT_FOUND if task doesn't exist
   * @throws RpcException with INVALID_ARGUMENT if no data provided
   * @throws RpcException with PERMISSION_DENIED if user lacks rights
   */
  async update(id: number, projectId: number, dto: UpdateTaskDto, updatedBy: string): Promise<TaskDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tasks.update",
      message: `Updating task: ${id}`,
      data: { id, updatedBy, changes: Object.keys(dto) },
    });

    // Validate input
    if (!dto || Object.keys(dto).length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: "No data provided for update",
      });
    }

    try {
      // Verify task exists
      const existingTask = await this.prisma.tasks.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          epic: {
            select: {
              project: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });

      if (!existingTask) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Task with ID "${id}" not found`,
        });
      }

      // Check permissions
      const teamId = await this.getProjectTeamIdOrThrow(projectId);
      const hasPermission = await this.teamMembersService.hasRight(teamId, updatedBy, "update", "task");

      if (!hasPermission) {
        throw new RpcException({
          code: status.PERMISSION_DENIED,
          message: "You don't have permission to update this task",
        });
      }

      // Prepare update data
      const updateData: Prisma.tasksUpdateInput = {
        updated_by_user: { connect: { user_id: updatedBy } },
        updated_at: new Date(),
      };

      if (dto.title !== undefined) {
        updateData.title = dto.title.trim();
      }
      if (dto.description !== undefined) {
        updateData.description = dto.description?.trim() ?? null;
      }
      if (dto.epic_id !== undefined) {
        updateData.epic = { connect: { id: dto.epic_id } };
      }
      if (dto.status !== undefined) {
        updateData.status = dto.status;
      }
      if (dto.priority !== undefined) {
        updateData.priority = dto.priority;
      }
      if (dto.estimated_hours !== undefined) {
        updateData.estimated_hours = dto.estimated_hours;
      }
      if (dto.actual_hours !== undefined) {
        updateData.actual_hours = dto.actual_hours;
      }
      if (dto.due_date !== undefined) {
        updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;
      }
      if (dto.completed_at !== undefined) {
        updateData.completed_at = dto.completed_at ? new Date(dto.completed_at) : null;
      }

      const updated = await this.prisma.tasks.update({
        where: { id },
        data: updateData,
        include: {
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
          epic: {
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
              category: true,
            },
          },
        },
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "tasks.update",
        message: `Task updated successfully: ${updated.id}`,
        data: { id: updated.id, title: updated.title },
      });

      return plainToInstance(TaskDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tasks.update",
          message: `Failed to update task: ${error.message}`,
          data: { error: error.message, id, updatedBy },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Delete a task
   *
   * @param id - Task ID to delete
   * @param deletedBy - ID of the user performing the deletion
   * @returns Deletion result
   * @throws RpcException with NOT_FOUND if task doesn't exist
   * @throws RpcException with PERMISSION_DENIED if user lacks rights
   */
  async delete(id: number, projectId: number, deletedBy: string): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tasks.delete",
      message: `Deleting task: ${id}`,
      data: { id, deletedBy },
    });

    try {
      // Verify task exists
      const existingTask = await this.prisma.tasks.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          epic: {
            select: {
              project: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });

      if (!existingTask) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Task with ID "${id}" not found`,
        });
      }

      // Check permissions
      const teamId = await this.getProjectTeamIdOrThrow(projectId);
      const hasPermission = await this.teamMembersService.hasRight(teamId, deletedBy, "delete", "task");

      if (!hasPermission) {
        throw new RpcException({
          code: status.PERMISSION_DENIED,
          message: "You don't have permission to delete this task",
        });
      }

      // Delete task
      await this.prisma.tasks.delete({
        where: { id },
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "tasks.delete",
        message: `Task deleted successfully: ${id}`,
        data: { id, title: existingTask.title },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tasks.delete",
          message: `Failed to delete task: ${error.message}`,
          data: { error: error.message, id },
        });
        throw error;
      }
      throw error;
    }
  }
}
