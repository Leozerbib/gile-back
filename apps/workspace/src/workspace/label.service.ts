import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { WorkspaceMembersService } from "../member/workspace-members.service";
import { CreateLabelDto, UpdateLabelDto, LabelDto, LabelsListDto, BaseSearchQueryDto, BasePaginationDto, LabelDtoSelect } from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Service de gestion des labels
 *
 * Ce service fournit les opérations CRUD de base pour les labels :
 * - create: Création d'un nouveau label
 * - update: Mise à jour d'un label existant
 * - delete: Suppression d'un label
 * - getByLabel: Récupération d'un label par son nom
 * - getOverview: Récupération d'un aperçu des labels
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class LabelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  /**
   * Crée un nouveau label dans un workspace.
   * Vérifie l'unicité du nom du label dans le workspace.
   *
   * @param workspaceId ID du workspace
   * @param dto DTO contenant les données du label
   * @param createdBy ID de l'utilisateur qui crée le label
   * @returns Le label créé
   * @throws ValidationError si les données sont invalides
   * @throws ConflictException si le nom du label existe déjà dans le workspace
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async create(workspaceId: string, dto: CreateLabelDto, createdBy: string): Promise<LabelDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "label.create",
      message: `Creating label with name: ${dto.name}`,
      data: { workspaceId, createdBy, name: dto.name },
    });

    // Validate identifiers
    if (!workspaceId?.trim()) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Workspace ID is required" });
    }
    if (!createdBy?.trim()) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "createdBy is required" });
    }

    // Check authorization - user must be workspace member
    const hasPermission = await this.workspaceMembersService.hasRight(workspaceId, createdBy, "create", "label");
    if (!hasPermission) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to create labels in this workspace" });
    }

    // Validation des données d'entrée
    if (!dto?.name?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "workspace",
        func: "label.create",
        message: "Label creation failed: name is required",
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Label name is required" });
    }

    // Vérifier l'unicité du nom dans le workspace
    const existingLabel = await this.prisma.labels.findFirst({
      where: {
        workspace_id: workspaceId,
        name: dto.name.trim(),
      },
    });

    if (existingLabel) {
      throw new RpcException({ code: status.ALREADY_EXISTS, message: `Label with name "${dto.name}" already exists in this workspace` });
    }

    try {
      const created = await this.prisma.labels.create({
        data: {
          workspace_id: workspaceId,
          name: dto.name.trim(),
          description: dto.description?.trim() ?? null,
          color: dto.color?.trim() ?? "#6B7280", // Default gray color
          created_by: createdBy,
        },
        select: LabelDtoSelect,
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.create",
        message: `Label created successfully with ID: ${created.id}`,
        data: { id: created.id, name: created.name, workspaceId },
      });

      return plainToInstance(LabelDto, created, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.create",
          message: `Failed to create label: ${error.message}`,
          data: { error: error.message, workspaceId, createdBy, name: dto.name },
        });
      }
      throw error;
    }
  }

  /**
   * Met à jour un label existant
   *
   * @param id ID du label à mettre à jour
   * @param dto DTO contenant les données à mettre à jour
   * @param updatedBy ID de l'utilisateur qui effectue la mise à jour
   * @returns Le label mis à jour
   * @throws NotFoundException si le label n'existe pas
   * @throws ConflictException si le nouveau nom existe déjà dans le workspace
   * @throws ValidationError si les données sont invalides
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async update(id: number, dto: UpdateLabelDto, updatedBy: string): Promise<LabelDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "label.update",
      message: `Updating label: ${id}`,
      data: { id, updatedBy, changes: Object.keys(dto) },
    });

    // Validation des données d'entrée
    if (!dto || Object.keys(dto).length === 0) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "No data provided for update" });
    }

    try {
      // Vérifier que le label existe
      const existingLabel = await this.prisma.labels.findUnique({
        where: { id },
      });

      if (!existingLabel) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Label with ID "${id}" not found` });
      }

      // Check authorization - user must be workspace member
      const hasPermission = await this.workspaceMembersService.hasRight(existingLabel.workspace_id, updatedBy, "update", "label");
      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to update labels in this workspace" });
      }

      // Vérifier l'unicité du nom si fourni
      if (dto.name) {
        const nameConflict = await this.prisma.labels.findFirst({
          where: {
            workspace_id: existingLabel.workspace_id,
            name: dto.name.trim(),
            id: { not: id },
          },
        });

        if (nameConflict) {
          throw new RpcException({ code: status.ALREADY_EXISTS, message: `Label with name "${dto.name}" already exists in this workspace` });
        }
      }

      // Préparer les données de mise à jour
      const updateData: Prisma.labelsUpdateInput = {
        updated_by_user: { connect: updatedBy ? { user_id: updatedBy } : undefined },
      };

      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.description !== undefined) updateData.description = dto.description?.trim() ?? null;
      if (dto.color !== undefined) updateData.color = dto.color?.trim() ?? null;

      const updated = await this.prisma.labels.update({
        where: { id },
        data: updateData,
        select: LabelDtoSelect,
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.update",
        message: `Label updated successfully: ${updated.id}`,
        data: { id: updated.id, name: updated.name },
      });

      return plainToInstance(LabelDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.update",
          message: `Failed to update label: ${error.message}`,
          data: { error: error.message, id, updatedBy },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Supprime un label
   *
   * @param id ID du label à supprimer
   * @param deletedBy ID de l'utilisateur qui effectue la suppression
   * @returns Résultat de la suppression
   * @throws NotFoundException si le label n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async delete(id: number, deletedBy: string): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "label.delete",
      message: `Deleting label: ${id}`,
      data: { id, deletedBy },
    });

    if (!deletedBy?.trim()) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "deletedBy is required" });
    }

    try {
      // Vérifier que le label existe
      const existingLabel = await this.prisma.labels.findUnique({
        where: { id },
      });

      if (!existingLabel) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Label with ID "${id}" not found` });
      }

      // Check authorization - user must be workspace member
      const hasPermission = await this.workspaceMembersService.hasRight(existingLabel.workspace_id, deletedBy, "delete", "label");
      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to delete labels in this workspace" });
      }

      // Supprimer le label (les relations seront supprimées automatiquement grâce aux contraintes CASCADE)
      await this.prisma.labels.delete({
        where: { id },
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.delete",
        message: `Label deleted successfully: ${id}`,
        data: { id, name: existingLabel.name },
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
          func: "label.delete",
          message: `Failed to delete label: ${error.message}`,
          data: { error: error.message, id },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Récupère un label par son nom dans un workspace
   *
   * @param workspaceId ID du workspace
   * @param labelName Nom du label à rechercher
   * @param userId ID de l'utilisateur qui fait la requête
   * @returns Le label trouvé
   * @throws NotFoundException si le label n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async getByLabel(workspaceId: string, labelName: string, userId: string): Promise<LabelDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "label.getByLabel",
      message: `Getting label by name: ${labelName}`,
      data: { workspaceId, labelName, userId },
    });

    try {
      const label = await this.prisma.labels.findFirst({
        where: {
          workspace_id: workspaceId,
          name: labelName.trim(),
        },
        select: LabelDtoSelect,
      });

      if (!label) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Label with name "${labelName}" not found in this workspace` });
      }

      return plainToInstance(LabelDto, label, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.getByLabel",
          message: `Failed to get label by name: ${error.message}`,
          data: { error: error.message, workspaceId, labelName },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Récupère un aperçu des labels d'un workspace avec pagination et recherche
   *
   * @param workspaceId ID du workspace
   * @param userId ID de l'utilisateur qui fait la requête
   * @param params Paramètres de recherche et pagination
   * @returns Liste paginée des labels
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async getOverview(workspaceId: string, userId: string, params?: BaseSearchQueryDto): Promise<LabelsListDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "label.getOverview",
      message: `Getting labels overview for workspace: ${workspaceId}`,
      data: { workspaceId, userId, params },
    });

    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    const search = params?.search?.trim() ?? "";

    // Base where clause: labels in the workspace
    const where: Prisma.labelsWhereInput = {
      workspace_id: workspaceId,
      OR: [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }],
    };

    try {
      const [items, total] = await Promise.all([
        this.prisma.labels.findMany({
          where,
          select: LabelDtoSelect,
          orderBy: { name: "desc" },
          skip,
          take,
        }),
        this.prisma.labels.count({ where }),
      ]);

      return BasePaginationDto.create(
        items.map(item => plainToInstance(LabelDto, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        LabelsListDto,
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.getOverview",
          message: `Failed to get labels overview: ${error.message}`,
          data: { error: error.message, workspaceId, params },
        });
      }
      throw error;
    }
  }
}
