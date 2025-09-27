import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
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
} from "@shared/types";
import { Prisma } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { ProjectsService } from "../project/projects.service";

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
      throw new BadRequestException("name is required");
    }

    try {
      // Validate start_date
      if (!dto.start_date) {
        throw new BadRequestException("start_date is required");
      }

      // Validate project exists and user has access
      await this.projectsService.getById(dto.project_id, ownerId);

      // Calculate end_date based on start_date + duration_days (safely)
      const startDate = new Date(dto.start_date);

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
            throw new BadRequestException("Sprint name already exists for this project.");
          case "P2003":
            throw new BadRequestException("Invalid project ID provided.");
          case "P2025":
            throw new BadRequestException("Sprint with this ID does not exist.");
          default:
            throw new BadRequestException("An error occurred while creating the sprint. Please try again.");
        }
      }
      throw error;
    }
  }

  async findAll(userId: string, query: BaseSearchQueryDto): Promise<SprintsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.findAll",
      message: `Fetching sprints for user ${userId}`,
      data: query,
    });

    try {
      // Extract pagination parameters
      const { search, sortBy, filters } = query;
      const skip = query.skip ?? 0;
      const take = query.take ?? 50;

      // Build base where clause
      let where: Prisma.sprintsWhereInput = {};

      // Apply search term if provided
      if (search?.trim()) {
        const searchConditions = SearchQueryBuilder.buildSearchConditions(search, ["name", "description"]);
        where = { ...where, ...searchConditions };
      }

      // Apply filters from BaseSearchQueryDto
      if (filters) {
        // Project filter
        if (filters.project_id) {
          where.project_id = Number(filters.project_id);
        }

        // Status filter
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            where.status = { in: filters.status };
          } else {
            where.status = filters.status as SprintStatus;
          }
        }

        // Date range filters
        if (filters.start_date_from || filters.start_date_to) {
          where.start_date = {};
          if (filters.start_date_from) {
            where.start_date.gte = new Date(filters.start_date_from);
          }
          if (filters.start_date_to) {
            where.start_date.lte = new Date(filters.start_date_to);
          }
        }

        if (filters.end_date_from || filters.end_date_to) {
          where.end_date = {};
          if (filters.end_date_from) {
            where.end_date.gte = new Date(filters.end_date_from);
          }
          if (filters.end_date_to) {
            where.end_date.lte = new Date(filters.end_date_to);
          }
        }

        // Version filter
        if (filters.version) {
          where.version = Number(filters.version);
        }

        // Created by filter
        if (filters.created_by) {
          where.created_by = filters.created_by as string;
        }
      }

      // Build sort options
      const orderBy = SearchQueryBuilder.buildSortOptions(sortBy);

      // Execute queries
      const [itemsRaw, total] = await Promise.all([
        this.prisma.sprints.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            project: true,
            created_by_user: true,
            updated_by_user: true,
          },
        }),
        this.prisma.sprints.count({ where }),
      ]);

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.findAll",
        message: `Successfully fetched ${itemsRaw.length} sprints out of ${total}`,
        data: { count: itemsRaw.length, total, skip, take },
      });

      // Transform to DTOs
      const items = itemsRaw.map(item => plainToInstance(SprintDto, item));

      // Return search result with pagination metadata
      return BasePaginationDto.create(items, total, skip, take, SprintsListDto);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.findAll",
          message: `Error fetching sprints: ${error?.message}`,
          data: { userId, query, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2003":
            throw new BadRequestException("Invalid project ID provided.");
          default:
            throw new BadRequestException("An error occurred while fetching sprints. Please try again.");
        }
      }
      throw error;
    }
  }

  async findById(id: string, userId?: string): Promise<SprintDto | null> {
    await this.logger.log({
      level: "debug",
      service: "project",
      func: "sprints.findById",
      message: `Fetching sprint with id ${id}`,
      data: { userId },
    });

    const sprintId = Number(id);
    if (Number.isNaN(sprintId)) {
      await this.logger.log({
        level: "warn",
        service: "project",
        func: "sprints.findById",
        message: `Invalid identifier provided: ${id}`,
        data: { userId },
      });
      throw new BadRequestException("Invalid identifier");
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
        throw new NotFoundException("Sprint not found");
      }

      await this.logger.log({
        level: "debug",
        service: "project",
        func: "sprints.findById",
        message: `Sprint found successfully`,
        data: { sprintId: sprint.id, sprintName: sprint.name, userId },
      });

      return plainToInstance(SprintDto, sprint);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.findById",
          message: `Error fetching sprint: ${error?.message}`,
          data: { id, userId, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2003":
            throw new BadRequestException("Invalid project ID provided.");
          default:
            throw new BadRequestException("An error occurred while fetching the sprint. Please try again.");
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
      throw new NotFoundException("Sprint not found");
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
      throw new NotFoundException("Sprint not found");
    }

    return plainToInstance(SprintDto, sprint);
  }

  async update(id: string, dto: UpdateSprintDto, ownerId: string): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.update",
      message: `Updating sprint ${id} for user ${ownerId}`,
      data: dto,
    });

    const sprintId = Number(id);
    if (Number.isNaN(sprintId)) {
      throw new BadRequestException("Invalid identifier");
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
          updated_by: ownerId,
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
          data: { id: sprintId, dto, userId: ownerId, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2025":
            throw new NotFoundException("Sprint not found");
          case "P2002":
            throw new BadRequestException("Sprint name already exists for this project.");
          case "P2003":
            throw new BadRequestException("Invalid project ID provided.");
          default:
            throw new BadRequestException("An error occurred while updating the sprint. Please try again.");
        }
      }
      throw error;
    }
  }

  async remove(id: string, userId?: string): Promise<boolean> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.remove",
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
      throw new BadRequestException("Invalid identifier");
    }

    try {
      await this.prisma.sprints.delete({ where: { id: sprintId } });

      await this.logger.log({
        level: "info",
        service: "project",
        func: "sprints.remove",
        message: `Sprint ${id} removed successfully`,
        data: { sprintId, userId },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        await this.logger.log({
          level: "error",
          service: "project",
          func: "sprints.remove",
          message: `Error removing sprint: ${error?.message}`,
          data: { id: sprintId, userId, stack: error?.stack, code: error?.code },
        });

        switch (error?.code) {
          case "P2025":
            throw new NotFoundException("Sprint not found");
          default:
            throw new BadRequestException("An error occurred while removing the sprint. Please try again.");
        }
      }
      throw error;
    }
  }
}
