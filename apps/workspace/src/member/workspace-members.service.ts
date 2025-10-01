import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import {
  AddWorkspaceMemberDto,
  WorkspaceMemberDto,
  WorkspaceRole,
  ProfileOverviewSelect,
  WorkspaceMemberDtoSelect,
  UpdateWorkspaceMemberDto,
  WorkspaceMembersListDto,
  BaseSearchQueryDto,
} from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Service de gestion des membres de workspace
 *
 * Ce service fournit les opérations CRUD de base pour les membres de workspace :
 * - create: Ajout d'un nouveau membre à un workspace
 * - search: Recherche avec pagination et filtres
 * - getById: Récupération d'un membre par son ID
 * - update: Mise à jour d'un membre existant
 * - delete: Suppression d'un membre
 * - getByWorkspaceAndUser: Récupération d'un membre par workspace et utilisateur
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  /**
   * Ajoute un nouveau membre à un workspace.
   * Vérifie que l'utilisateur n'est pas déjà membre du workspace.
   *
   * @param workspaceId ID du workspace
   * @param dto DTO contenant les données du membre
   * @param addedBy ID de l'utilisateur qui ajoute le membre
   * @returns Le membre créé
   * @throws ValidationError si les données sont invalides
   * @throws ConflictException si l'utilisateur est déjà membre
   * @throws NotFoundException si le workspace ou l'utilisateur n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async create(workspaceId: string, dto: AddWorkspaceMemberDto, addedBy?: string): Promise<WorkspaceMemberDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "workspace-members.create",
      message: `Adding member to workspace: ${workspaceId}`,
      data: { workspaceId, dto, addedBy },
    });

    // Check authorization - user must have permission to add members
    if (addedBy) {
      const hasPermission = await this.hasRight(workspaceId, addedBy, "create", "member");

      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to add members to this workspace" });
      }
    }

    // Validation des données d'entrée
    if (!dto?.userId?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "workspace",
        func: "workspace-members.create",
        message: "Member creation failed: userId is required",
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "User ID is required" });
    }

    try {
      // Vérifier que le workspace existe
      const workspace = await this.prisma.workspaces.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Workspace with ID "${workspaceId}" not found` });
      }

      // Vérifier que l'utilisateur existe
      const user = await this.prisma.profiles.findUnique({
        where: { user_id: dto.userId },
        select: {
          user_id: true,
        },
      });

      if (!user) {
        throw new RpcException({ code: status.NOT_FOUND, message: `User with ID "${dto.userId}" not found` });
      }

      // Vérifier que l'utilisateur n'est pas déjà membre
      const isMember = await this.isMember(workspaceId, dto.userId);

      if (isMember) {
        throw new RpcException({ code: status.ALREADY_EXISTS, message: `User "${dto.userId}" is already a member of workspace "${workspaceId}"` });
      }

      const created = await this.prisma.workspace_members.create({
        data: {
          workspace_id: workspaceId,
          user_id: dto.userId,
          role: (dto.role as UserRole) ?? UserRole.VIEWER,
          created_by: addedBy,
        },
        select: WorkspaceMemberDtoSelect,
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspace-members.create",
        message: `Member added successfully to workspace: ${workspaceId}`,
        data: { id: created.id, workspaceId, userId: dto.userId, role: created.role },
      });

      return plainToInstance(WorkspaceMemberDto, created, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspace-members.create",
          message: `Failed to add member to workspace: ${error.message}`,
          data: { error: error.message, workspaceId, userId: dto.userId },
        });
      }
      throw error;
    }
  }

  /**
   * Récupère un membre par son ID
   *
   * @param id ID du membre
   * @returns Le membre trouvé
   * @throws NotFoundException si le membre n'existe pas
   */
  async getById(id: string): Promise<WorkspaceMemberDto> {
    try {
      const item = await this.prisma.workspace_members.findUnique({
        where: { id },
        select: WorkspaceMemberDtoSelect,
      });

      if (!item) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Workspace member with ID "${id}" not found` });
      }

      return plainToInstance(WorkspaceMemberDto, item, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspace-members.getById",
          message: `Failed to get workspace member by ID: ${error.message}`,
          data: { error: error.message, id },
        });
      }
      throw error;
    }
  }

  /**
   * Récupère un aperçu des membres d'un workspace
   *
   * @param workspaceId ID du workspace
   * @returns Liste paginée des membres avec leur rôle
   */
  async getOverview(workspaceId: string, params?: BaseSearchQueryDto): Promise<WorkspaceMembersListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 10;

    const search = params?.search?.trim() ?? "";
    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.workspace_members.findMany({
          where: {
            workspace_id: workspaceId,
            profile: {
              OR: [{ username: { contains: search } }, { last_name: { contains: search } }, { first_name: { contains: search } }],
            },
          },
          select: WorkspaceMemberDtoSelect,
          orderBy: { role: "desc" },
          skip,
          take,
        }),
        this.prisma.workspace_members.count({
          where: { workspace_id: workspaceId },
        }),
      ]);

      return plainToInstance(WorkspaceMembersListDto, { items, total, skip, take }, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspace-members.getOverview",
          message: `Failed to get workspace members overview: ${error.message}`,
          data: { error: error.message, workspaceId },
        });
      }
      throw error;
    }
  }

  /**
   * Met à jour un membre de workspace existant
   *
   * @param id ID du membre à mettre à jour
   * @param dto DTO contenant les données à mettre à jour
   * @param updatedBy ID de l'utilisateur qui effectue la mise à jour
   * @returns Le membre mis à jour
   * @throws NotFoundException si le membre n'existe pas
   * @throws ValidationError si les données sont invalides
   * @throws ForbiddenException si on tente de modifier le propriétaire
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async update(id: string, dto: UpdateWorkspaceMemberDto, updatedBy?: string): Promise<WorkspaceMemberDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "workspace-members.update",
      message: `Updating workspace member: ${id}`,
      data: { id, updatedBy, changes: Object.keys(dto) },
    });

    // Validation des données d'entrée
    if (!dto || Object.keys(dto).length === 0) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "No data provided for update" });
    }

    try {
      // Vérifier que le membre existe
      const existingMember = await this.prisma.workspace_members.findUnique({
        where: { id },
        include: {
          workspace: true,
        },
      });

      if (!existingMember) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Workspace member with ID "${id}" not found` });
      }

      // Check authorization - user must have permission to update members
      if (updatedBy) {
        const hasPermission = await this.hasRight(existingMember.workspace_id, updatedBy, "update", "member");

        if (!hasPermission) {
          throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to update workspace members" });
        }
      }

      // Empêcher la modification du propriétaire du workspace
      if (existingMember.workspace.owner_id === existingMember.user_id && dto.role && dto.role !== WorkspaceRole.WORKSPACE_OWNER) {
        throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Cannot change the role of the workspace owner" });
      }

      // Préparer les données de mise à jour
      const updateData: Prisma.workspace_membersUpdateInput = {
        updated_by_user: {
          connect: updatedBy ? { user_id: updatedBy } : undefined,
        },
      };

      if (dto.role !== undefined) updateData.role = dto.role as UserRole;
      if (typeof dto.is_active === "boolean") updateData.is_active = dto.is_active;

      const updated = await this.prisma.workspace_members.update({
        where: { id },
        data: updateData,
        select: WorkspaceMemberDtoSelect,
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspace-members.update",
        message: `Workspace member updated successfully: ${updated.id}`,
        data: { id: updated.id, role: updated.role, isActive: updated.is_active },
      });

      return plainToInstance(WorkspaceMemberDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspace-members.update",
          message: `Failed to update workspace member: ${error.message}`,
          data: { error: error.message, id, updatedBy },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Supprime un membre de workspace
   *
   * @param id ID du membre à supprimer
   * @param deletedBy ID de l'utilisateur qui effectue la suppression
   * @returns Résultat de la suppression
   * @throws NotFoundException si le membre n'existe pas
   * @throws ForbiddenException si on tente de supprimer le propriétaire
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async delete(id: string, deletedBy?: string): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "debug",
      service: "workspace",
      func: "workspace-members.delete",
      message: `Deleting workspace member: ${id}`,
      data: { id, deletedBy },
    });

    try {
      // Vérifier que le membre existe
      const existingMember = await this.prisma.workspace_members.findUnique({
        where: { id },
        include: {
          profile: {
            select: ProfileOverviewSelect,
          },
        },
      });

      if (!existingMember) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Workspace member with ID "${id}" not found` });
      }

      // Check authorization - user must have permission to delete members
      if (deletedBy) {
        const hasPermission = await this.hasRight(existingMember.workspace_id, deletedBy, "delete", "member");

        if (!hasPermission) {
          throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to remove workspace members" });
        }
      }

      // Empêcher la suppression du propriétaire du workspace
      if (existingMember.role === WorkspaceRole.WORKSPACE_OWNER || existingMember.role === WorkspaceRole.WORKSPACE_ADMIN || existingMember.role === WorkspaceRole.SUPER_ADMIN) {
        throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Cannot remove the workspace owner, admin, or super admin" });
      }

      // Supprimer le membre
      await this.prisma.workspace_members.delete({
        where: { id },
      });

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspace-members.delete",
        message: `Workspace member deleted successfully: ${id}`,
        data: { id, workspaceId: existingMember.workspace_id, userId: existingMember.user_id },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspace-members.delete",
          message: `Failed to delete workspace member: ${error.message}`,
          data: { error: error.message, id },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur est membre d'un workspace
   *
   * @param workspaceId ID du workspace
   * @param userId ID de l'utilisateur
   * @returns true si l'utilisateur est membre, false sinon
   */
  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.prisma.workspace_members.findUnique({
        where: {
          workspace_id_user_id: {
            workspace_id: workspaceId,
            user_id: userId,
          },
        },
        select: { id: true, is_active: true },
      });

      return member !== null && member.is_active;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspace-members.isMember",
          message: `Failed to check membership: ${error.message}`,
          data: { error: error.message, workspaceId, userId },
        });
      }
      return false;
    }
  }

  /**
   * Récupère le rôle d'un utilisateur dans un workspace
   *
   * @param workspaceId ID du workspace
   * @param userId ID de l'utilisateur
   * @returns Le rôle de l'utilisateur ou null s'il n'est pas membre
   */
  async getUserRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    try {
      const member = await this.prisma.workspace_members.findUnique({
        where: {
          workspace_id_user_id: {
            workspace_id: workspaceId,
            user_id: userId,
          },
        },
        select: { role: true, is_active: true },
      });

      if (!member || !member.is_active) {
        return null;
      }

      return member.role as WorkspaceRole;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspace-members.getUserRole",
          message: `Failed to get user role: ${error.message}`,
          data: { error: error.message, workspaceId, userId },
        });
      }
      return null;
    }
  }

  async hasMember(workspaceId: string): Promise<boolean> {
    const count = await this.prisma.workspace_members.count({
      where: {
        workspace_id: workspaceId,
      },
    });

    return count > 0;
  }

  /**
   * Vérifie si un utilisateur a les droits pour effectuer une action sur une ressource
   * @param workspaceId - ID du workspace
   * @param userId - ID de l'utilisateur
   * @param action - Action à effectuer (create, get, update, delete)
   * @param resource - Ressource concernée (workspace, project, label, agent, prompt, member, team)
   * @returns true si l'utilisateur a les droits, false sinon
   */
  async hasRight(
    workspaceId: string,
    userId: string,
    action: "create" | "get" | "update" | "delete" | "assign",
    resource: "workspace" | "project" | "label" | "agent" | "prompt" | "member" | "team",
  ): Promise<boolean> {
    const role = await this.getUserRole(workspaceId, userId);
    if (role === null) {
      if (await this.hasMember(workspaceId)) {
        return false;
      }
      return true;
    }
    // Super admin a tous les droits
    if (role === WorkspaceRole.SUPER_ADMIN) {
      return true;
    }

    // Workspace owner a tous les droits sauf sur les autres workspaces
    if (role === WorkspaceRole.WORKSPACE_OWNER) {
      return true;
    }

    // Workspace admin a la plupart des droits
    if (role === WorkspaceRole.WORKSPACE_ADMIN) {
      // Ne peut pas supprimer le workspace ou modifier certains paramètres critiques
      if (resource === "workspace" && action === "delete") {
        return false;
      }
      return true;
    }

    // Project manager a des droits sur les projets et ressources associées
    if (role === WorkspaceRole.PROJECT_MANAGER) {
      switch (resource) {
        case "workspace":
          return action === "get"; // Lecture seule du workspace
        case "project":
          return true; // Tous droits sur les projets
        case "label":
          return true; // Tous droits sur les labels
        case "agent":
          return action !== "delete"; // Peut créer, lire, modifier mais pas supprimer
        case "prompt":
          return true; // Tous droits sur les prompts
        case "member":
          return action === "get" || action === "update"; // Peut voir et modifier les membres
        case "team":
          return true; // Tous droits sur les équipes
        default:
          return false;
      }
    }

    // Developer a des droits limités
    if (role === WorkspaceRole.DEVELOPER) {
      switch (resource) {
        case "workspace":
          return action === "get"; // Lecture seule
        case "project":
          return action !== "delete" && action !== "assign"; // Peut créer, lire, modifier mais pas supprimer
        case "label":
          return action !== "delete"; // Peut créer, lire, modifier mais pas supprimer
        case "agent":
          return action === "get" || action === "create"; // Peut lire et créer
        case "prompt":
          return action !== "delete"; // Peut créer, lire, modifier mais pas supprimer
        case "member":
          return action === "get"; // Lecture seule des membres
        case "team":
          return action === "get" || action === "create"; // Peut voir et créer des équipes
        default:
          return false;
      }
    }

    // Designer a des droits similaires au developer avec focus sur l'UI
    if (role === WorkspaceRole.DESIGNER) {
      switch (resource) {
        case "workspace":
          return action === "get"; // Lecture seule
        case "project":
          return action !== "delete" && action !== "assign"; // Peut créer, lire, modifier mais pas supprimer
        case "label":
          return true; // Tous droits sur les labels (important pour l'UI)
        case "agent":
          return action === "get"; // Peut lire et créer
        case "prompt":
          return action !== "delete"; // Peut créer, lire, modifier mais pas supprimer
        case "member":
          return action === "get"; // Lecture seule des membres
        case "team":
          return action === "get" || action === "create"; // Peut voir et créer des équipes
        default:
          return false;
      }
    }

    // Tester a des droits limités, principalement en lecture
    if (role === WorkspaceRole.TESTER) {
      switch (resource) {
        case "workspace":
          return action === "get"; // Lecture seule
        case "project":
          return action === "get" || action === "update"; // Peut lire et modifier (pour les tests)
        case "label":
          return action === "get"; // Peut lire et créer des labels de test
        case "agent":
          return action === "get"; // Lecture seule
        case "prompt":
          return action === "get"; // Peut lire et créer des prompts de test
        case "member":
          return action === "get"; // Lecture seule des membres
        case "team":
          return action === "get"; // Lecture seule des équipes
        default:
          return false;
      }
    }

    // Viewer a uniquement des droits de lecture
    if (role === WorkspaceRole.VIEWER) {
      return action === "get";
    }

    // Guest a des droits très limités
    if (role === WorkspaceRole.GUEST) {
      switch (resource) {
        case "workspace":
          return action === "get"; // Lecture seule du workspace
        case "project":
          return action === "get"; // Lecture seule des projets
        case "member":
          return action === "get"; // Lecture seule des membres
        case "team":
          return action === "get"; // Lecture seule des équipes
        default:
          return false; // Pas d'accès aux autres ressources
      }
    }

    // Par défaut, aucun droit
    return false;
  }
}
