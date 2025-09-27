import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { ValidationError } from "@shared/errors";
import { TeamRole } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { WorkspaceMembersService } from "../member/workspace-members.service";
import {
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  TeamMemberDto,
  ProfileOverviewSelect,
  TeamOverviewSelect,
  TeamMemberListDto,
  BaseSearchQueryDto,
  TeamMemberOverview,
  BasePaginationDto,
} from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Service de gestion des membres d'équipe
 *
 * Ce service fournit les opérations CRUD pour les membres d'équipe :
 * - create: Ajout d'un membre à une équipe
 * - getByTeamId: Récupération des membres d'une équipe
 * - getById: Récupération d'un membre par son ID
 * - update: Mise à jour du rôle d'un membre
 * - delete: Suppression d'un membre d'une équipe
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class TeamMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  /**
   * Ajoute un membre à une équipe
   *
   * @param teamId ID de l'équipe
   * @param dto DTO contenant les données du membre
   * @param addedBy ID de l'utilisateur qui ajoute le membre
   * @returns Le membre d'équipe créé
   * @throws ValidationError Si les données sont invalides
   * @throws NotFoundException Si l'équipe ou l'utilisateur n'existe pas
   * @throws ConflictException Si l'utilisateur est déjà membre de l'équipe
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async create(teamId: string, dto: AddTeamMemberDto, addedBy: string): Promise<TeamMemberDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "teams",
      func: "team-members.create",
      message: `Adding member to team: ${teamId}`,
      data: { teamId, userId: dto.user_id, role: dto.role, addedBy },
    });

    // Validation des données d'entrée
    if (!dto?.user_id?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "teams",
        func: "team-members.create",
        message: "Member creation failed: user_id is required",
      });
      throw new ValidationError("User ID is required");
    }

    try {
      // Vérifier que l'équipe existe et récupérer le workspace_id
      const team = await this.prisma.teams.findUnique({
        where: { id: teamId },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${teamId}" not found`);
      }

      // Vérification des droits dans le workspace
      const hasPermission = await this.hasRight(team.workspace_id, addedBy, "create", "member");
      if (!hasPermission) {
        throw new UnauthorizedException("You don't have permission to add members to this team");
      }

      // Vérifier que l'utilisateur existe
      const user = await this.prisma.profiles.findUnique({
        where: { user_id: dto.user_id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${dto.user_id}" not found`);
      }

      // Vérifier que l'utilisateur n'est pas déjà membre de l'équipe
      const existingMember = await this.prisma.team_members.findUnique({
        where: {
          team_id_user_id: {
            team_id: teamId,
            user_id: dto.user_id,
          },
        },
      });

      if (existingMember) {
        throw new ConflictException(`User "${dto.user_id}" is already a member of team "${teamId}"`);
      }

      const created = await this.prisma.team_members.create({
        data: {
          team_id: teamId,
          user_id: dto.user_id,
          role: dto.role ?? TeamRole.MEMBER,
          created_by: addedBy,
        },
        include: {
          profile: {
            select: ProfileOverviewSelect,
          },
        },
      });

      await this.loggerClient.log({
        level: "info",
        service: "teams",
        func: "team-members.create",
        message: `Member added successfully to team: ${teamId}`,
        data: { id: created.id, teamId, userId: dto.user_id, role: created.role },
      });

      return plainToInstance(TeamMemberDto, created);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException || error instanceof ValidationError || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.create",
          message: `Failed to add member to team: ${error.message}`,
          data: { error: error.message, teamId, userId: dto.user_id },
        });
      }
      throw error;
    }
  }

  /**
   * Récupère tous les membres d'une équipe
   *
   * @param teamId ID de l'équipe
   * @param userId ID de l'utilisateur qui fait la demande
   * @returns Liste des membres de l'équipe
   * @throws NotFoundException Si l'équipe n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getByTeamId(teamId: string, userId: string): Promise<TeamMemberDto[]> {
    try {
      // Vérifier que l'équipe existe et récupérer le workspace_id
      const team = await this.prisma.teams.findUnique({
        where: { id: teamId },
        select: { id: true, workspace_id: true },
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${teamId}" not found`);
      }

      // Vérification des droits
      const hasPermission = await this.hasRight(team.workspace_id, userId, "get", "member");
      if (!hasPermission) {
        throw new UnauthorizedException("You don't have permission to view members of this team");
      }

      const members = await this.prisma.team_members.findMany({
        where: { team_id: teamId },
        include: {
          profile: {
            select: ProfileOverviewSelect,
          },
        },
        orderBy: { created_at: "asc" },
      });

      return members.map(member => plainToInstance(TeamMemberDto, member));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.getByTeamId",
          message: "Error retrieving team members",
          data: { error: error.message, teamId, userId },
        });

        throw new ValidationError("Unable to retrieve team members: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Récupère un membre d'équipe par son ID
   *
   * @param id ID du membre d'équipe
   * @param userId ID de l'utilisateur qui fait la demande
   * @returns Le membre d'équipe trouvé
   * @throws NotFoundException Si le membre n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getById(team_id: string, id: string): Promise<TeamMemberDto> {
    try {
      const team = await this.prisma.teams.findUnique({
        where: { id: team_id },
        select: { id: true, workspace_id: true },
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${team_id}" not found`);
      }

      const member = await this.prisma.team_members.findUnique({
        where: { id },
        include: {
          profile: {
            select: ProfileOverviewSelect,
          },
        },
      });

      if (!member) {
        throw new NotFoundException(`Team member with ID "${id}" not found`);
      }

      // Vérification des droits
      const hasPermission = await this.hasRight(team.workspace_id, member.user_id, "get", "member");
      if (!hasPermission) {
        throw new UnauthorizedException("You don't have permission to view this team member");
      }

      return plainToInstance(TeamMemberDto, member);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.getById",
          message: "Error retrieving team member",
          data: { error: error.message, id },
        });

        throw new ValidationError("Unable to retrieve team member: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Récupère l'overview de tous les membres d'une équipe
   *
   * @param team_id ID de l'équipe
   * @param userId ID de l'utilisateur qui fait la demande
   * @returns Liste des membres de l'équipe avec leurs rôles
   * @throws NotFoundException Si l'équipe n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getOverview(team_id: string, userId: string, params?: BaseSearchQueryDto): Promise<TeamMemberListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    const search = params?.search ?? "";

    try {
      const team = await this.prisma.teams.findUnique({
        where: { id: team_id },
        select: { id: true, workspace_id: true },
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${team_id}" not found`);
      }

      // Vérification des droits
      const hasPermission = await this.hasRight(team.workspace_id, userId, "get", "member");
      if (!hasPermission) {
        throw new UnauthorizedException("You don't have permission to view members of this team");
      }

      const [members, total] = await this.prisma.$transaction([
        this.prisma.team_members.findMany({
          where: { team_id: team_id, profile: { username: { contains: search } } },
          include: {
            profile: {
              select: ProfileOverviewSelect,
            },
          },
          orderBy: { created_at: "asc" },
          skip,
          take,
        }),
        this.prisma.team_members.count({
          where: { team_id: team_id, profile: { username: { contains: search } } },
        }),
      ]);

      return BasePaginationDto.create(
        members.map(item => plainToInstance(TeamMemberOverview, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        TeamMemberListDto,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.getOverview",
          message: "Error retrieving team member overview",
          data: { error: error.message, team_id, userId },
        });

        throw new ValidationError("Unable to retrieve team member overview: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Met à jour le rôle d'un membre d'équipe
   *
   * @param id ID du membre d'équipe
   * @param dto DTO contenant les nouvelles données
   * @param updatedBy ID de l'utilisateur qui fait la modification
   * @returns Le membre d'équipe mis à jour
   * @throws NotFoundException Si le membre n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async update(team_id: string, id: string, dto: UpdateTeamMemberDto, updatedBy: string): Promise<TeamMemberDto> {
    try {
      // Vérifier que l'équipe existe et récupérer le workspace_id
      const team = await this.prisma.teams.findUnique({
        where: { id: team_id },
        select: { id: true, workspace_id: true },
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${team_id}" not found`);
      }

      const existingMember = await this.prisma.team_members.findUnique({
        where: { id },
        include: {
          teams: {
            select: TeamOverviewSelect,
          },
        },
      });

      if (!existingMember) {
        throw new NotFoundException(`Team member with ID "${id}" not found`);
      }

      // Vérification des droits
      const hasPermission = await this.hasRight(team.workspace_id, updatedBy, "update", "member");
      if (!hasPermission) {
        throw new UnauthorizedException("You don't have permission to update this team member");
      }

      const updated = await this.prisma.team_members.update({
        where: { id },
        data: {
          role: dto.role,
        },
        include: {
          profile: {
            select: ProfileOverviewSelect,
          },
        },
      });

      await this.loggerClient.log({
        level: "info",
        service: "teams",
        func: "team-members.update",
        message: `Team member updated successfully: ${id}`,
        data: { id, updatedBy, changes: dto },
      });

      return plainToInstance(TeamMemberDto, updated);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.update",
          message: "Error updating team member",
          data: { error: error.message, id, updatedBy, dto },
        });

        throw new ValidationError("Unable to update team member: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Supprime un membre d'une équipe
   *
   * @param id ID du membre d'équipe
   * @param deletedBy ID de l'utilisateur qui fait la suppression
   * @throws NotFoundException Si le membre n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async delete(team_id: string, id: string, deletedBy: string): Promise<void> {
    try {
      // Vérifier que l'équipe existe et récupérer le workspace_id
      const team = await this.prisma.teams.findUnique({
        where: { id: team_id },
        select: { id: true, workspace_id: true },
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${team_id}" not found`);
      }

      const member = await this.prisma.team_members.findUnique({
        where: { id },
        include: {
          teams: {
            select: TeamOverviewSelect,
          },
          profile: {
            select: ProfileOverviewSelect,
          },
        },
      });

      if (!member) {
        throw new NotFoundException(`Team member with ID "${id}" not found`);
      }

      // Vérification des droits
      const hasPermission = await this.workspaceMembersService.hasRight(team.workspace_id, deletedBy, "delete", "team");
      if (!hasPermission) {
        throw new UnauthorizedException("You don't have permission to remove members from this team");
      }

      await this.prisma.team_members.delete({
        where: { id },
      });

      await this.loggerClient.log({
        level: "info",
        service: "teams",
        func: "team-members.delete",
        message: `Team member removed successfully: ${id}`,
        data: { id, deletedBy, teamName: member.teams.name, userName: member.profile?.username },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.delete",
          message: "Error removing team member",
          data: { error: error.message, id, deletedBy },
        });

        throw new ValidationError("Unable to remove team member: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur est membre d'une équipe
   *
   * @param teamId ID de l'équipe
   * @param userId ID de l'utilisateur
   * @returns true si l'utilisateur est membre, false sinon
   */
  async isMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.prisma.team_members.findUnique({
        where: {
          team_id_user_id: {
            team_id: teamId,
            user_id: userId,
          },
        },
      });

      return !!member;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.isMember",
          message: "Error checking team membership",
          data: { error: error.message, teamId, userId },
        });
      }
      return false;
    }
  }

  /**
   * Récupère le rôle d'un utilisateur dans une équipe
   *
   * @param teamId ID de l'équipe
   * @param userId ID de l'utilisateur
   * @returns Le rôle de l'utilisateur ou null s'il n'est pas membre
   */
  async getUserRole(teamId: string, userId: string): Promise<TeamRole | null> {
    try {
      const member = await this.prisma.team_members.findUnique({
        where: {
          team_id_user_id: {
            team_id: teamId,
            user_id: userId,
          },
        },
        select: { role: true },
      });

      return member?.role || null;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.getUserRole",
          message: "Error getting user role in team",
          data: { error: error.message, teamId, userId },
        });
      }
      return null;
    }
  }

  /**
   * Vérifie si un utilisateur a les droits pour effectuer une action sur une ressource dans une équipe
   * @param teamId - ID de l'équipe
   * @param userId - ID de l'utilisateur
   * @param action - Action à effectuer (create, get, update, delete)
   * @param resource - Ressource concernée (member, task, project)
   * @returns true si l'utilisateur a les droits, false sinon
   */
  async hasRight(teamId: string, userId: string, action: "create" | "get" | "update" | "delete", resource: "member" | "project"): Promise<boolean> {
    try {
      // Récupérer le rôle de l'utilisateur dans l'équipe
      const teamRole = await this.getUserRole(teamId, userId);
      if (teamRole === null) {
        return false; // L'utilisateur n'est pas membre de l'équipe
      }

      // Récupérer l'équipe pour vérifier les droits workspace
      const team = await this.prisma.teams.findUnique({
        where: { id: teamId },
        select: { workspace_id: true },
      });

      if (!team) {
        return false;
      }

      // Vérifier d'abord les droits au niveau workspace
      const hasWorkspaceRight = await this.workspaceMembersService.hasRight(team.workspace_id, userId, "get", "team");
      if (!hasWorkspaceRight) {
        return false; // Si pas de droits workspace, pas de droits équipe
      }

      // Définir les permissions par rôle d'équipe
      switch (teamRole) {
        case TeamRole.LEADER:
          // Le leader a tous les droits dans l'équipe
          return true;

        case TeamRole.MEMBER:
          switch (resource) {
            case "member":
              // Les membres peuvent voir les autres membres mais pas les gérer
              return action === "get";
            case "project":
              // Les membres peuvent lire et modifier les projets de l'équipe
              return action === "get" || action === "update";
            default:
              return false;
          }

        case TeamRole.CONTRIBUTOR:
          switch (resource) {
            case "member":
              // Les contributeurs peuvent voir les membres
              return action === "get";
            case "project":
              // Les contributeurs peuvent lire les projets
              return action === "get";
            default:
              return false;
          }

        case TeamRole.OBSERVER:
          // Les observateurs ont uniquement des droits de lecture
          return action === "get";

        default:
          return false;
      }
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "team-members.hasRight",
          message: "Error checking team member rights",
          data: { error: error.message, teamId, userId, action, resource },
        });
      }
      return false;
    }
  }
}
