import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { WorkspaceMembersService } from "../member/workspace-members.service";
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceDto,
  WorkspacesListDto,
  WorkspaceVisibility,
  BaseSearchQueryDto,
  SearchQueryBuilder,
  BasePaginationDto,
  ProfileOverviewSelect,
  WorkspaceOverviewSelect,
  WorkspaceOverview,
  WorkspaceRole,
} from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Service de gestion des workspaces
 *
 * Ce service fournit les opérations CRUD de base pour les workspaces :
 * - create: Création d'un nouveau workspace
 * - search: Recherche avec pagination et filtres
 * - getById: Récupération d'un workspace par son ID
 * - getOverview: Récupération d'un aperçu d'un workspace
 * - update: Mise à jour d'un workspace existant
 * - delete: Suppression d'un workspace
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  /**
   * Crée un nouvel espace de travail avec un propriétaire et génère un slug unique.
   * Utilise une transaction pour assurer l'intégrité des données.
   *
   * @param ownerId ID de l'utilisateur propriétaire
   * @param dto DTO contenant les données du workspace
   * @returns Le workspace créé
   * @throws ValidationError si les données sont invalides
   * @throws ConflictException si le slug existe déjà
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async create(ownerId: string, dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "workspaces.create",
      message: `Creating workspace with name: ${dto.name}`,
      data: { ownerId, name: dto.name },
    });

    // Validate ownerId
    if (!ownerId?.trim()) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Owner ID is required" });
    }

    // Validation des données d'entrée
    if (!dto?.name?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "workspace",
        func: "workspaces.create",
        message: "Workspace creation failed: name is required",
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Workspace name is required" });
    }

    // Générer le slug
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Vérifier l'unicité du slug
    const existingWorkspace = await this.prisma.workspaces.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      throw new RpcException({ code: status.ALREADY_EXISTS, message: `Workspace with slug "${slug}" already exists` });
    }

    try {
      // Utiliser une transaction pour créer le workspace et les settings par défaut
      const created = await this.prisma.$transaction(async tx => {
        const workspace = await tx.workspaces.create({
          data: {
            name: dto.name.trim(),
            slug,
            description: dto.description?.trim() ?? null,
            logo_url: dto.logoUrl?.trim() ?? null,
            visibility: (dto.visibility as WorkspaceVisibility) ?? WorkspaceVisibility.PRIVATE,
            owner_id: ownerId,
            created_by: ownerId,
          },
          include: {
            owner: {
              select: ProfileOverviewSelect,
            },
            created_by_user: {
              select: ProfileOverviewSelect,
            },
            updated_by_user: {
              select: ProfileOverviewSelect,
            },
          },
        });

        // Add the owner as a workspace member using the service
        // Note: We need to handle this outside the transaction since WorkspaceMembersService
        // uses its own Prisma instance. We'll create the member after the workspace is created.

        // Créer les settings par défaut
        await tx.workspace_settings.create({
          data: {
            workspace_id: workspace.id,
            default_project_visibility: "PRIVATE",
            allow_guest_access: false,
            auto_assign_tickets: false,
            require_time_tracking: false,
            email_notifications: true,
            default_sprint_duration: 7,
            created_by: ownerId,
          },
        });

        return workspace;
      });

      // Add the owner as a workspace member using the service
      await this.workspaceMembersService.create(
        created.id,
        {
          userId: ownerId,
          role: WorkspaceRole.WORKSPACE_OWNER,
        },
        ownerId,
      );

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.create",
        message: `Workspace created successfully with ID: ${created.id}`,
        data: { id: created.id, name: created.name },
      });

      return plainToInstance(WorkspaceDto, created, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.create",
          message: `Failed to create workspace: ${error.message}`,
          data: { error: error.message, ownerId, name: dto.name },
        });
      }
      throw error;
    }
  }

  /**
   * Recherche des workspaces avec pagination et filtres
   *
   * @param params Paramètres de recherche et pagination (BaseSearchQueryDto)
   * @returns Liste paginée des workspaces
   */
  async search(params?: BaseSearchQueryDto): Promise<WorkspacesListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    // Base where clause: only active workspaces by default
    let where: Prisma.workspacesWhereInput = {
      is_active: true,
    };

    // Apply text search across selected fields
    const searchConditions = SearchQueryBuilder.buildSearchConditions(params?.search, ["name"]);
    where = { ...where, ...searchConditions };

    // Apply filters with simple mapping from camelCase to DB columns
    const filterMapping: Record<string, string> = {
      visibility: "visibility",
      isActive: "is_active",
      ownerId: "owner_id",
      slug: "slug",
      name: "name",
    };

    if (params?.filters) {
      const prismaFilters: Prisma.workspacesWhereInput = {};
      for (const [key, value] of Object.entries(params.filters)) {
        const mappedKey = filterMapping[key] ?? key;
        // Basic equals filter; extend as needed
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        prismaFilters[mappedKey] = value;
      }
      where = SearchQueryBuilder.applyFilters(where, params.filters);
    }

    // Build orderBy from sort options, mapping fields to DB columns
    const sortOptions = SearchQueryBuilder.buildSortOptions(params?.sortBy);
    const fieldMapping: Record<string, keyof Prisma.workspacesOrderByWithRelationInput> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      name: "name",
      slug: "slug",
      visibility: "visibility",
    };

    const orderByArray: Prisma.workspacesOrderByWithRelationInput[] = [];
    for (const [field, direction] of Object.entries(sortOptions)) {
      const mappedField = fieldMapping[field] ?? (field as keyof Prisma.workspacesOrderByWithRelationInput);
      orderByArray.push({ [mappedField]: direction as Prisma.SortOrder } as Prisma.workspacesOrderByWithRelationInput);
    }

    // Default sort
    const orderBy = orderByArray.length > 0 ? orderByArray : [{ created_at: Prisma.SortOrder.desc }];

    try {
      const [items, total] = await Promise.all([this.prisma.workspaces.findMany({ where, skip, take, orderBy }), this.prisma.workspaces.count({ where })]);

      return BasePaginationDto.create(
        items.map(item => plainToInstance(WorkspaceDto, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        WorkspacesListDto,
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.search",
          message: `Failed to search workspaces: ${error.message}`,
          data: { error: error.message, params },
        });
      }
      throw error;
    }
  }

  /**
   * Récupère un workspace par son ID
   *
   * @param id ID du workspace
   * @param userId ID de l'utilisateur qui fait la demande (optionnel)
   * @returns Le workspace trouvé
   * @throws NotFoundException si le workspace n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async getById(id: string, userId?: string): Promise<WorkspaceDto> {
    // Check authorization - user must be a member of the workspace to view it
    if (userId) {
      const hasPermission = await this.workspaceMembersService.hasRight(id, userId, "get", "workspace");

      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to view this workspace" });
      }
    }

    try {
      const item = await this.prisma.workspaces.findUnique({
        where: { id },
        include: {
          owner: {
            select: ProfileOverviewSelect,
          },
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
        },
      });

      if (!item) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Workspace with ID "${id}" not found` });
      }

      return plainToInstance(WorkspaceDto, item, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.getById",
          message: `Failed to get workspace by ID: ${error.message}`,
          data: { error: error.message, id },
        });
      }
      throw error;
    }
  }

  /**
   * Récupère un aperçu d'un workspace par son ID (données limitées)
   *
   * @param id ID du workspace
   * @returns L'aperçu du workspace
   * @throws NotFoundException si le workspace n'existe pas
   */
  async getOverview(params?: BaseSearchQueryDto, userId?: string): Promise<WorkspacesListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 10;

    const search = params?.search ?? "";

    try {
      if (!userId) {
        // If no userId provided, return empty result
        return BasePaginationDto.create([], 0, skip, take, WorkspacesListDto);
      }

      // Get all workspaces where user is owner
      const ownedWorkspaces = await this.prisma.workspaces.findMany({
        where: {
          owner_id: userId,
          name: { contains: search },
        },
        select: { id: true },
      });

      // Get all workspace IDs where user is a member (using WorkspaceMembersService)
      // Note: We need to get all workspaces first, then check membership for each
      const allWorkspaces = await this.prisma.workspaces.findMany({
        where: {
          name: { contains: search },
        },
        select: { id: true },
      });

      const memberWorkspaceIds: string[] = [];
      for (const workspace of allWorkspaces) {
        const isMember = await this.workspaceMembersService.isMember(workspace.id, userId);
        if (isMember) {
          memberWorkspaceIds.push(workspace.id);
        }
      }

      // Combine owned and member workspace IDs
      const accessibleWorkspaceIds = [
        ...ownedWorkspaces.map(w => w.id),
        ...memberWorkspaceIds.filter(id => !ownedWorkspaces.some(w => w.id === id)), // Avoid duplicates
      ];

      if (accessibleWorkspaceIds.length === 0) {
        return BasePaginationDto.create([], 0, skip, take, WorkspacesListDto);
      }

      const [items, total] = await Promise.all([
        this.prisma.workspaces.findMany({
          where: {
            id: { in: accessibleWorkspaceIds },
            name: { contains: search },
          },
          select: WorkspaceOverviewSelect,
          orderBy: { created_at: Prisma.SortOrder.desc },
          skip,
          take,
        }),
        this.prisma.workspaces.count({
          where: {
            id: { in: accessibleWorkspaceIds },
            name: { contains: search },
          },
        }),
      ]);

      return BasePaginationDto.create(
        items.map(item => plainToInstance(WorkspaceOverview, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        WorkspacesListDto,
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.getOverview",
          message: `Failed to get workspace overview: ${error.message}`,
          data: { error: error.message, search },
        });
      }
      throw error;
    }
  }

  /**
   * Met à jour un workspace existant
   *
   * @param id ID du workspace à mettre à jour
   * @param dto DTO contenant les données à mettre à jour
   * @param updatedBy ID de l'utilisateur qui effectue la mise à jour
   * @returns Le workspace mis à jour
   * @throws NotFoundException si le workspace n'existe pas
   * @throws ConflictException si le nouveau slug existe déjà
   * @throws ValidationError si les données sont invalides
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async update(id: string, dto: UpdateWorkspaceDto, updatedBy?: string): Promise<WorkspaceDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "workspaces.update",
      message: `Updating workspace: ${id}`,
      data: { id, updatedBy, changes: Object.keys(dto) },
    });

    // Check authorization - user must be workspace owner or admin
    if (updatedBy) {
      const hasPermission = await this.workspaceMembersService.hasRight(id, updatedBy, "update", "workspace");

      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to update this workspace" });
      }
    }

    // Validation des données d'entrée
    if (!dto || Object.keys(dto).length === 0) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "No data provided for update" });
    }

    try {
      // Vérifier que le workspace existe
      const existingWorkspace = await this.prisma.workspaces.findUnique({
        where: { id },
      });

      if (!existingWorkspace) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Workspace with ID "${id}" not found` });
      }

      // Vérifier l'unicité du slug si fourni
      if (dto.slug) {
        const slugConflict = await this.prisma.workspaces.findUnique({
          where: { slug: dto.slug.trim() },
        });

        if (slugConflict && slugConflict.id !== id) {
          throw new RpcException({ code: status.ALREADY_EXISTS, message: `Workspace with slug "${dto.slug}" already exists` });
        }
      }

      // Préparer les données de mise à jour
      const updateData: Prisma.workspacesUpdateInput = {
        updated_by_user: {
          connect: updatedBy ? { user_id: updatedBy } : undefined,
        },
      };

      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.slug !== undefined) updateData.slug = dto.slug.trim();
      if (dto.description !== undefined) updateData.description = dto.description?.trim() ?? null;
      if (dto.logoUrl !== undefined) updateData.logo_url = dto.logoUrl?.trim() ?? null;
      if (dto.visibility !== undefined) updateData.visibility = dto.visibility;
      if (typeof dto.isActive === "boolean") updateData.is_active = dto.isActive;

      const updated = await this.prisma.workspaces.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: ProfileOverviewSelect,
          },
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
        },
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.update",
        message: `Workspace updated successfully: ${updated.id}`,
        data: { id: updated.id, name: updated.name, slug: updated.slug },
      });

      return plainToInstance(WorkspaceDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.update",
          message: `Failed to update workspace: ${error.message}`,
          data: { error: error.message, id, updatedBy },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Supprime un workspace
   *
   * @param id ID du workspace à supprimer
   * @returns Résultat de la suppression
   * @throws NotFoundException si le workspace n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async delete(id: string, deletedBy?: string): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "workspaces.delete",
      message: `Deleting workspace: ${id}`,
      data: { id, deletedBy },
    });

    // Check authorization - only workspace owner can delete
    if (deletedBy) {
      const hasPermission = await this.workspaceMembersService.hasRight(id, deletedBy, "delete", "workspace");

      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "Only workspace owners can delete workspaces" });
      }
    }

    try {
      // Vérifier que le workspace existe
      const existingWorkspace = await this.prisma.workspaces.findUnique({
        where: { id },
      });

      if (!existingWorkspace) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Workspace with ID "${id}" not found` });
      }

      // Supprimer le workspace (les relations seront supprimées automatiquement grâce aux contraintes CASCADE)
      await this.prisma.workspaces.delete({
        where: { id },
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.delete",
        message: `Workspace deleted successfully: ${id}`,
        data: { id, name: existingWorkspace.name },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.delete",
          message: `Failed to delete workspace: ${error.message}`,
          data: { error: error.message, id },
        });
        throw error;
      }
      throw error;
    }
  }
}
