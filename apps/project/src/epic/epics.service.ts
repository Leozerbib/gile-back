import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { plainToInstance } from "class-transformer";
import { CreateEpicDto, UpdateEpicDto, EpicDto, EpicListDto, BaseSearchQueryDto, EpicDtoSelect, EpicListSelect, EpicOverview, BasePaginationDto } from "@shared/types";
import { TeamMembersService } from "apps/workspace/src/team/team-members.service";
import { Prisma, EpicStatus, EpicCategory } from "@prisma/client";

@Injectable()
export class EpicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerClientService,
    private readonly teamMembersService: TeamMembersService,
  ) {}

  // Helpers
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

  private async getEpicTeamIdOrThrow(epicId: number): Promise<{ team_id: string; project_id: number }> {
    const epic = await this.prisma.epics.findUnique({
      where: { id: epicId },
      select: { id: true, project_id: true },
    });
    if (!epic) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Epic with ID "${epicId}" not found` });
    }
    const team_id = await this.getProjectTeamIdOrThrow(epic.project_id);
    return { team_id, project_id: epic.project_id };
  }

  private buildOrderBy(sortBy?: BaseSearchQueryDto["sortBy"]): Record<string, "asc" | "desc">[] | undefined {
    if (!sortBy || sortBy.length === 0) return [{ created_at: "desc" }];
    const mapping: Record<string, string> = {
      id: "id",
      title: "title",
      status: "status",
      priority: "priority",
      progress: "progress",
      createdAt: "created_at",
      created_at: "created_at",
      updatedAt: "updated_at",
      updated_at: "updated_at",
      start_date: "start_date",
      end_date: "end_date",
    };
    const orderBy: Record<string, "asc" | "desc">[] = [];
    for (const s of sortBy) {
      const field = mapping[s.field] ?? s.field;
      orderBy.push({ [field]: s.order?.toLowerCase?.() === "asc" ? "asc" : "desc" });
    }
    return orderBy;
  }

  // Create Epic
  async create(userId: string, dto: CreateEpicDto): Promise<EpicDto> {
    await this.logger.log({ level: "debug", service: "epic", func: "epics.create", message: `Creating epic: ${dto.title}`, data: { userId, dto: { ...dto } } });

    if (!dto?.title?.trim()) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Epic title is required" });
    }

    // Validate project exists
    const project = await this.prisma.projects.findUnique({ where: { id: dto.project_id }, select: { id: true, name: true } });
    if (!project) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Project with ID "${dto.project_id}" not found` });
    }

    // Team-level permission check (use TeamMembersService)
    const teamId = await this.getProjectTeamIdOrThrow(dto.project_id);
    const allowed = await this.teamMembersService.hasRight(teamId, userId, "create", "epic");
    if (!allowed) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to create epics on this project" });
    }

    // Generate slug if missing
    const slug = (dto.slug && dto.slug.trim().length > 0 ? dto.slug : dto.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Ensure unique slug within project
    const existing = await this.prisma.epics.findFirst({ where: { project_id: dto.project_id, slug } });
    if (existing) {
      throw new RpcException({ code: status.ALREADY_EXISTS, message: `Epic with slug "${slug}" already exists in this project` });
    }

    try {
      const epic = await this.prisma.epics.create({
        data: {
          title: dto.title.trim(),
          slug,
          description: dto.description?.trim() ?? null,
          category: dto.category,
          status: dto.status ?? EpicStatus.TODO,
          priority: dto.priority ?? 0,
          start_date: dto.start_date ? new Date(dto.start_date) : null,
          project_id: dto.project_id,
          created_by: userId,
          updated_by: userId,
        },
        select: EpicDtoSelect,
      });

      await this.logger.log({ level: "info", service: "epic", func: "epics.create", message: "Epic created successfully", data: { id: epic.id } });

      return plainToInstance(EpicDto, epic, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.logger.log({
          level: "error",
          service: "epic",
          func: "epics.create",
          message: `Failed to create epic: ${error.message}`,
          data: { error: error.message, userId, dto: { ...dto } },
        });
      }
      throw error;
    }
  }

  // Search Epics by project
  async search(userId: string, projectId: number, params?: BaseSearchQueryDto): Promise<EpicListDto> {
    await this.logger.log({ level: "debug", service: "epic", func: "epics.search", message: `Searching epics for project: ${projectId}` });

    // Permission check via team
    const teamId = await this.getProjectTeamIdOrThrow(projectId);
    const allowed = await this.teamMembersService.hasRight(teamId, userId, "get", "epic");
    if (!allowed) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to view epics for this project" });
    }

    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    const where: Prisma.epicsWhereInput = { project_id: projectId };
    if (params?.search && params.search.trim()) {
      where.OR = [{ title: { contains: params.search.trim(), mode: "insensitive" } }, { description: { contains: params.search.trim(), mode: "insensitive" } }];
    }
    if (params?.filters) {
      Object.assign(where, params.filters as Prisma.epicsWhereInput);
    }

    const orderBy = this.buildOrderBy(params?.sortBy);

    const [items, total] = await this.prisma.$transaction([this.prisma.epics.findMany({ where, orderBy, skip, take, select: EpicListSelect }), this.prisma.epics.count({ where })]);

    const overviews = items.map(i => plainToInstance(EpicOverview, i, { excludeExtraneousValues: true }));
    return BasePaginationDto.create(overviews, total, skip, take, EpicListDto);
  }

  // Get overview (same shape as search for now)
  async getOverview(userId: string, projectId: number, params?: BaseSearchQueryDto): Promise<EpicListDto> {
    return this.search(userId, projectId, params);
  }

  // Get epic by ID
  async getById(id: number, userId: string): Promise<EpicDto> {
    await this.logger.log({ level: "debug", service: "epic", func: "epics.getById", message: `Getting epic: ${id}` });

    const { team_id } = await this.getEpicTeamIdOrThrow(id);
    const allowed = await this.teamMembersService.hasRight(team_id, userId, "get", "epic");
    if (!allowed) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to view this epic" });
    }

    const epic = await this.prisma.epics.findUnique({ where: { id }, select: EpicDtoSelect });
    if (!epic) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Epic with ID "${id}" not found` });
    }

    return plainToInstance(EpicDto, epic, { excludeExtraneousValues: true });
  }

  // Update epic by ID
  async update(id: number, dto: UpdateEpicDto, userId: string): Promise<EpicDto> {
    await this.logger.log({ level: "debug", service: "epic", func: "epics.update", message: `Updating epic: ${id}`, data: { id, dto: { ...dto } } });

    const ctx = await this.getEpicTeamIdOrThrow(id);
    const allowed = await this.teamMembersService.hasRight(ctx.team_id, userId, "update", "epic");
    if (!allowed) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to update this epic" });
    }

    // Ensure epic exists and get project_id
    const existing = await this.prisma.epics.findUnique({ where: { id }, select: { id: true, slug: true, project_id: true } });
    if (!existing) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Epic with ID "${id}" not found"` });
    }

    // Slug uniqueness if provided
    if (dto.slug && dto.slug !== existing.slug) {
      const duplicate = await this.prisma.epics.findFirst({ where: { project_id: existing.project_id, slug: dto.slug } });
      if (duplicate) {
        throw new RpcException({ code: status.ALREADY_EXISTS, message: `Epic with slug "${dto.slug}" already exists in this project` });
      }
    }

    const updated = await this.prisma.epics.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        slug: dto.slug?.trim(),
        description: dto.description?.trim(),
        category: dto.category as unknown as EpicCategory,
        status: dto.status as unknown as EpicStatus,
        priority: dto.priority ?? undefined,
        updated_by: userId,
        updated_at: new Date(),
      },
      select: EpicDtoSelect,
    });

    await this.logger.log({ level: "info", service: "epic", func: "epics.update", message: `Epic updated successfully: ${id}` });

    return plainToInstance(EpicDto, updated, { excludeExtraneousValues: true });
  }

  // Delete epic by ID
  async delete(id: number, userId: string): Promise<void> {
    await this.logger.log({ level: "debug", service: "epic", func: "epics.delete", message: `Deleting epic: ${id}` });

    const { team_id } = await this.getEpicTeamIdOrThrow(id);
    const allowed = await this.teamMembersService.hasRight(team_id, userId, "delete", "epic");
    if (!allowed) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to delete this epic" });
    }

    const existing = await this.prisma.epics.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Epic with ID "${id}" not found` });
    }

    await this.prisma.epics.delete({ where: { id } });

    await this.logger.log({ level: "info", service: "epic", func: "epics.delete", message: `Epic deleted: ${id}` });
  }
}
