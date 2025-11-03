import { Injectable } from "@nestjs/common";
import { LoggerClientService } from "@shared/logger";
import { PrismaService } from "@shared/prisma";
import {
  CreateSprintDto,
  UpdateSprintDto,
  SprintDto,
  SprintsListDto,
  SprintStatus,
  BaseSearchQueryDto,
  SearchQueryBuilder,
  BasePaginationDto,
  SprintOverview,
  FilterRule,
} from "@shared/types";
import { Prisma } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { ProjectsService } from "../project/projects.service";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";

@Injectable()
export class SprintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerClientService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(ownerId: string, dto: CreateSprintDto): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.create",
      message: `Creating sprint for user ${ownerId}`,
      data: dto,
    });

    if (!dto.name) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "name is required" });
    }

    try {
      // Validate project exists and user has access
      await this.projectsService.getById(dto.project_id, ownerId);

      const startDate = new Date(dto.start_date);
      let endDate: Date | null = null;
      if (dto.end_date) {
        endDate = new Date(dto.end_date);
      }

      // Generate slug from name
      const slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const sprint = await this.prisma.sprints.create({
        data: {
          name: dto.name,
          slug: slug,
          description: dto.description,
          start_date: startDate,
          end_date: endDate,
          version: dto.version ?? 1,
          status: dto.status || SprintStatus.PLANNED,
          project_id: dto.project_id,
          velocity: dto.velocity ?? 0,
          capacity: dto.capacity ?? 0,
          created_by: ownerId,
        },
        include: {
          project: true,
          created_by_user: true,
          updated_by_user: true,
        },
      });

      return plainToInstance(SprintDto, sprint);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.create",
          message: `Error creating sprint: ${error?.message}`,
          data: { userId: ownerId, dto, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2002":
            throw new RpcException({ code: status.ALREADY_EXISTS, message: "Sprint name already exists for this project." });
          case "P2003":
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid project ID provided." });
          case "P2025":
            throw new RpcException({ code: status.NOT_FOUND, message: "Sprint with this ID does not exist." });
          default:
            throw new RpcException({ code: status.INTERNAL, message: "An error occurred while creating the sprint. Please try again." });
        }
      }
      throw error;
    }
  }

  async search(userId: string, projectId: number, params?: BaseSearchQueryDto): Promise<SprintsListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 50;

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.search",
      message: `Searching sprints with filters: ${JSON.stringify(params?.filters)}`,
      data: { userId, projectId, params },
    });

    try {
      // Validate project exists and user has access
      await this.projectsService.getById(projectId, userId);

      // Base where clause: sprints for the project
      let where: Prisma.sprintsWhereInput = {
        project_id: projectId,
      };

      // Apply text search across selected fields
      const searchConditions = SearchQueryBuilder.buildSearchConditions(params?.search, ["name", "description"]);
      where = { ...where, ...searchConditions };

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.search",
        message: `Searching sprints with filters: ${JSON.stringify(params?.filters)}`,
        data: { where },
      });

      if (params?.filters) {
        where = SearchQueryBuilder.applyFilters(where, params.filters);
      }

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.search",
        message: `Applying filters: ${JSON.stringify(params?.filters)}`,
        data: { where },
      });

      // Build orderBy from sort options, mapping fields to DB columns
      const sortOptions = SearchQueryBuilder.buildSortOptions(params?.sortBy);
      const fieldMapping: Record<string, keyof Prisma.sprintsOrderByWithRelationInput> = {
        createdAt: "created_at",
        updatedAt: "updated_at",
        name: "name",
        status: "status",
        startDate: "start_date",
        endDate: "end_date",
        actualStartDate: "actual_start_date",
        actualEndDate: "actual_end_date",
        version: "version",
        velocity: "velocity",
        capacity: "capacity",
      };

      const orderByArray: Prisma.sprintsOrderByWithRelationInput[] = [];
      for (const [field, direction] of Object.entries(sortOptions)) {
        const mappedField = fieldMapping[field] ?? (field as keyof Prisma.sprintsOrderByWithRelationInput);
        orderByArray.push({ [mappedField]: direction as Prisma.SortOrder } as Prisma.sprintsOrderByWithRelationInput);
      }

      // Default sort
      const orderBy = orderByArray.length > 0 ? orderByArray : [{ created_at: Prisma.SortOrder.desc }];

      const [items, total] = await Promise.all([
        this.prisma.sprints.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            project: { select: { id: true, name: true, slug: true } },
            created_by_user: { select: { user_id: true, username: true, avatar_url: true } },
            updated_by_user: { select: { user_id: true, username: true, avatar_url: true } },
          },
        }),
        this.prisma.sprints.count({ where }),
      ]);

      // Transform items to DTOs for consistent logging and response
      const transformedItems = items.map(item => plainToInstance(SprintDto, item, { excludeExtraneousValues: true }));

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.search",
        message: `Successfully fetched ${items.length} sprints out of ${total}`,
        data: { count: transformedItems, total, skip, take },
      });

      return BasePaginationDto.create(transformedItems, total, skip, take, SprintsListDto);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.search",
          message: `Failed to search sprints: ${error.message}`,
          data: { error: error.message, params },
        });
      }
      throw error;
    }
  }

  async getById(id: string, userId?: string): Promise<SprintDto> {
    await this.logger.log({
      level: "debug",
      service: "project",
      func: "sprints.getById",
      message: `Fetching sprint with id ${id}`,
      data: { userId },
    });

    const sprintId = Number(id);
    if (Number.isNaN(sprintId)) {
      await this.logger.log({
        level: "warn",
        service: "project",
        func: "sprints.getById",
        message: `Invalid identifier provided: ${id}`,
        data: { userId },
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid identifier" });
    }

    try {
      const sprint = await this.prisma.sprints.findUnique({
        where: { id: sprintId },
        include: {
          project: { select: { id: true, name: true, slug: true } },
          created_by_user: { select: { user_id: true, username: true, avatar_url: true } },
          updated_by_user: { select: { user_id: true, username: true, avatar_url: true } },
        },
      });

      if (!sprint) {
        await this.logger.log({
          level: "warn",
          service: "project",
          func: "sprints.findById",
          message: `Sprint not found with id ${id}`,
          data: { userId },
        });
        throw new RpcException({ code: status.NOT_FOUND, message: "Sprint not found" });
      }

      await this.logger.log({
        level: "debug",
        service: "project",
        func: "sprints.getById",
        message: `Sprint found successfully`,
        data: { sprintId: sprint.id, sprintName: sprint.name, userId },
      });

      return plainToInstance(SprintDto, sprint);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.getById",
          message: `Error fetching sprint: ${error?.message}`,
          data: { id, userId, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2003":
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid project ID provided." });
          default:
            throw new RpcException({ code: status.INTERNAL, message: "An error occurred while fetching the sprint. Please try again." });
        }
      }
      throw error;
    }
  }

  async getOverview(id: number, params: BaseSearchQueryDto): Promise<SprintsListDto> {
    const skip = params.skip ?? 0;
    const take = params.take ?? 10;
    const search = params.search ?? "";
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.getOverview",
      message: `Getting overview for sprint ${id}`,
    });

    const [sprint, total] = await Promise.all([
      this.prisma.sprints.findMany({
        where: { project_id: id, name: { contains: search } },
        select: {
          id: true,
          name: true,
          version: true,
          status: true,
        },
        orderBy: { created_at: "desc" },
        skip: skip,
        take: take,
      }),
      this.prisma.sprints.count({ where: { project_id: id } }),
    ]);

    if (!sprint) {
      throw new RpcException({ code: status.NOT_FOUND, message: "Sprint not found" });
    }
    // Simulate overview logic
    return BasePaginationDto.create(
      sprint.map(item => plainToInstance(SprintOverview, item)),
      total,
      skip,
      take,
      SprintsListDto,
    );
  }

  async findActiveSprints(workspace_id: string, project_id: number): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.findActiveSprints",
      message: "Fetching active sprints",
      data: { workspace_id, project_id },
    });

    const whereClause: Prisma.sprintsWhereInput = {
      status: SprintStatus.ACTIVE,
    };

    if (project_id) {
      whereClause.project_id = project_id;
    }

    if (workspace_id) {
      whereClause.project = {
        workspace_id,
      };
    }

    const sprint = await this.prisma.sprints.findFirst({
      where: whereClause,
      include: {
        project: true,
        created_by_user: true,
        updated_by_user: true,
      },
      orderBy: {
        start_date: "desc",
      },
    });

    if (!sprint) {
      throw new RpcException({ code: status.NOT_FOUND, message: "Sprint not found" });
    }

    return plainToInstance(SprintDto, sprint);
  }

  async update(id: string, dto: UpdateSprintDto, updatedBy?: string): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.update",
      message: `Updating sprint ${id}`,
      data: { dto, updatedBy },
    });

    const sprintId = Number(id);
    if (Number.isNaN(sprintId)) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid identifier" });
    }

    try {
      const sprint = await this.prisma.sprints.update({
        where: { id: sprintId },
        data: {
          name: dto.name,
          description: dto.description,
          start_date: dto.start_date ? new Date(dto.start_date) : undefined,
          end_date: dto.end_date ? new Date(dto.end_date) : undefined,
          actual_start_date: dto.actual_start_date ? new Date(dto.actual_start_date) : undefined,
          actual_end_date: dto.actual_end_date ? new Date(dto.actual_end_date) : undefined,
          version: dto.version,
          status: dto.status,
          velocity: dto.velocity,
          capacity: dto.capacity,
          review_notes: dto.review_notes,
          retrospective_notes: dto.retrospective_notes,
          updated_by: updatedBy,
        },
        include: {
          project: true,
          created_by_user: true,
          updated_by_user: true,
        },
      });

      return plainToInstance(SprintDto, sprint);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.update",
          message: `Error updating sprint: ${error?.message}`,
          data: { id: sprintId, dto, updatedBy, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2025":
            throw new RpcException({ code: status.NOT_FOUND, message: "Sprint not found" });
          case "P2002":
            throw new RpcException({ code: status.ALREADY_EXISTS, message: "Sprint name already exists for this project." });
          case "P2003":
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid project ID provided." });
          default:
            throw new RpcException({ code: status.INTERNAL, message: "An error occurred while updating the sprint. Please try again." });
        }
      }
      throw error;
    }
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.delete",
      message: `Removing sprint ${id}`,
      data: { userId },
    });

    const sprintId = Number(id);
    if (Number.isNaN(sprintId)) {
      await this.logger.log({
        level: "warn",
        service: "project",
        func: "sprints.remove",
        message: `Invalid identifier provided: ${id}`,
        data: { userId },
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid identifier" });
    }

    try {
      await this.prisma.sprints.delete({ where: { id: sprintId } });

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.delete",
        message: `Sprint ${id} removed successfully`,
        data: { sprintId, userId },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.delete",
          message: `Error removing sprint: ${error?.message}`,
          data: { id: sprintId, userId, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2025":
            throw new RpcException({ code: status.NOT_FOUND, message: "Sprint not found" });
          default:
            throw new RpcException({ code: status.INTERNAL, message: "An error occurred while removing the sprint. Please try again." });
        }
      }
      throw error;
    }
  }

  /**
   * Get the last sprint for a project
   * Returns version, start/end dates, and actual start/end dates
   */
  async getLast(projectId: number, userId: string): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.getLast",
      message: `Fetching last sprint for project ${projectId}`,
      data: { projectId, userId },
    });

    try {
      // Validate project exists and user has access
      await this.projectsService.getById(projectId, userId);

      const sprint = await this.prisma.sprints.findFirst({
        where: { project_id: projectId },
        orderBy: [{ version: "desc" }, { created_at: "desc" }],
        include: {
          project: { select: { id: true, name: true, slug: true } },
          created_by_user: { select: { user_id: true, username: true, avatar_url: true } },
          updated_by_user: { select: { user_id: true, username: true, avatar_url: true } },
        },
      });

      if (!sprint) {
        await this.logger.log({
          level: "warn",
          service: "project",
          func: "sprints.getLast",
          message: `No sprint found for project ${projectId}`,
          data: { projectId, userId },
        });
        throw new RpcException({ code: status.NOT_FOUND, message: "No sprint found for this project" });
      }

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.getLast",
        message: `Last sprint found successfully`,
        data: { sprintId: sprint.id, version: sprint.version, projectId, userId },
      });

      return plainToInstance(SprintDto, sprint);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.getLast",
          message: `Failed to get last sprint: ${error.message}`,
          data: { projectId, userId, error: error.message },
        });
      }
      throw error;
    }
  }

  /**
   * Start a sprint
   * Sets status to ACTIVE, sets start_date if not set, and sets actual_start_date to now
   */
  async startSprint(sprintId: number, projectId: number, userId: string): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.startSprint",
      message: `Starting sprint ${sprintId}`,
      data: { sprintId, projectId, userId },
    });

    try {
      // Validate project exists and user has access
      await this.projectsService.getById(projectId, userId);

      // Check if sprint exists and belongs to project
      const existingSprint = await this.prisma.sprints.findFirst({
        where: { id: sprintId, project_id: projectId },
      });

      if (!existingSprint) {
        throw new RpcException({ code: status.NOT_FOUND, message: "Sprint not found for this project" });
      }

      // Check if sprint is already active or completed
      if (existingSprint.status === SprintStatus.ACTIVE) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Sprint is already active" });
      }

      if (existingSprint.status === SprintStatus.COMPLETED) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Cannot start a completed sprint" });
      }

      const now = new Date();
      const updateData: Prisma.sprintsUpdateInput = {
        status: SprintStatus.ACTIVE,
        actual_start_date: now,
        updated_by_user: { connect: { user_id: userId } },
      };

      // Set start_date to now if not already set
      if (!existingSprint.start_date) {
        updateData.start_date = now;
      }

      const sprint = await this.prisma.sprints.update({
        where: { id: sprintId },
        data: updateData,
        include: {
          project: { select: { id: true, name: true, slug: true } },
          created_by_user: { select: { user_id: true, username: true, avatar_url: true } },
          updated_by_user: { select: { user_id: true, username: true, avatar_url: true } },
        },
      });

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.startSprint",
        message: `Sprint ${sprintId} started successfully`,
        data: { sprintId, projectId, userId, actualStartDate: sprint.actual_start_date },
      });

      return plainToInstance(SprintDto, sprint);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.startSprint",
          message: `Error starting sprint: ${error?.message}`,
          data: { sprintId, projectId, userId, stack: error?.stack, code: error?.code },
        });
        throw new RpcException({ code: status.INTERNAL, message: "An error occurred while starting the sprint. Please try again." });
      }
      throw error;
    }
  }

  /**
   * Complete a sprint
   * Sets status to COMPLETED, sets end_date if not set, and sets actual_end_date to now
   */
  async completeSprint(sprintId: number, projectId: number, userId: string): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.completeSprint",
      message: `Completing sprint ${sprintId}`,
      data: { sprintId, projectId, userId },
    });

    try {
      // Validate project exists and user has access
      await this.projectsService.getById(projectId, userId);

      // Check if sprint exists and belongs to project
      const existingSprint = await this.prisma.sprints.findFirst({
        where: { id: sprintId, project_id: projectId },
      });

      if (!existingSprint) {
        throw new RpcException({ code: status.NOT_FOUND, message: "Sprint not found for this project" });
      }

      // Check if sprint is already completed
      if (existingSprint.status === SprintStatus.COMPLETED) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Sprint is already completed" });
      }

      const now = new Date();
      const updateData: Prisma.sprintsUpdateInput = {
        status: SprintStatus.COMPLETED,
        actual_end_date: now,
        updated_by_user: { connect: { user_id: userId } },
      };

      // Set end_date to now if not already set
      if (!existingSprint.end_date) {
        updateData.end_date = now;
      }

      const sprint = await this.prisma.sprints.update({
        where: { id: sprintId },
        data: updateData,
        include: {
          project: { select: { id: true, name: true, slug: true } },
          created_by_user: { select: { user_id: true, username: true, avatar_url: true } },
          updated_by_user: { select: { user_id: true, username: true, avatar_url: true } },
        },
      });

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.completeSprint",
        message: `Sprint ${sprintId} completed successfully`,
        data: { sprintId, projectId, userId, actualEndDate: sprint.actual_end_date },
      });

      return plainToInstance(SprintDto, sprint);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.completeSprint",
          message: `Error completing sprint: ${error?.message}`,
          data: { sprintId, projectId, userId, stack: error?.stack, code: error?.code },
        });
        throw new RpcException({ code: status.INTERNAL, message: "An error occurred while completing the sprint. Please try again." });
      }
      throw error;
    }
  }
}
