import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { ValidationError } from "@shared/errors";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { WorkspaceMembersService } from "../member/workspace-members.service";
import { CreateTeamDto, UpdateTeamDto, TeamDto, TeamListDto, TeamOverview, BaseSearchQueryDto, BasePaginationDto, ProfileOverviewSelect, TeamOverviewSelect } from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Service de gestion des équipes
 *
 * Ce service fournit les opérations CRUD de base pour les équipes :
 * - create: Création d'une nouvelle équipe
 * - search: Recherche avec pagination et filtres
 * - getById: Récupération d'une équipe par son ID
 * - getOverview: Récupération d'un aperçu d'une équipe
 * - update: Mise à jour d'une équipe existante
 * - delete: Suppression d'une équipe
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  /**
   * Crée une nouvelle équipe avec un créateur et génère un slug unique.
   * Utilise une transaction pour assurer l'intégrité des données.
   *
   * @param userId ID de l'utilisateur créateur
   * @param dto DTO contenant les données de l'équipe
   * @returns L'équipe créée
   * @throws ValidationError Si les données sont invalides
   * @throws ConflictException Si une équipe avec le même nom existe déjà
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async create(userId: string, dto: CreateTeamDto): Promise<TeamDto> {
    const isInWorkspace = await this.workspaceMembersService.isMember(dto.workspace_id, userId);
    if (!isInWorkspace) {
      throw new UnauthorizedException("Vous n'avez pas les droits pour créer une équipe dans ce workspace");
    }

    // Vérification des droits
    const hasPermission = await this.workspaceMembersService.hasRight(dto.workspace_id, userId, "create", "team");
    if (!hasPermission) {
      throw new UnauthorizedException("Vous n'avez pas les droits pour créer une équipe dans ce workspace");
    }

    // Génération du slug unique
    const slug = await this.generateUniqueSlug(dto.name, dto.workspace_id);

    try {
      const team = await this.prisma.$transaction(async tx => {
        // Vérification de l'unicité du nom dans le workspace
        const existingTeam = await tx.teams.findFirst({
          where: {
            workspace_id: dto.workspace_id,
            name: dto.name,
          },
        });

        if (existingTeam) {
          throw new ConflictException(`Une équipe avec le nom "${dto.name}" existe déjà dans ce workspace`);
        }

        // Création de l'équipe
        const newTeam = await tx.teams.create({
          data: {
            workspace_id: dto.workspace_id,
            name: dto.name,
            slug,
            description: dto.description,
            avatar_url: dto.avatar_url,
            is_active: true,
            created_by: userId,
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

        return newTeam;
      });

      await this.loggerClient.log({
        level: "info",
        service: "teams",
        func: "create",
        message: `Équipe créée avec succès: ${team.name}`,
        data: { teamId: team.id, workspaceId: dto.workspace_id, userId },
      });

      return plainToInstance(TeamDto, team);
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "create",
          message: "Erreur lors de la création de l'équipe",
          data: { error: error.message, dto, userId },
        });
        throw new ValidationError("Impossible de créer l'équipe: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Récupère une équipe par son ID avec toutes ses relations
   *
   * @param id ID de l'équipe
   * @param userId ID de l'utilisateur
   * @returns L'équipe trouvée
   * @throws NotFoundException Si l'équipe n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getById(id: string, userId: string): Promise<TeamDto> {
    try {
      const team = await this.prisma.teams.findUnique({
        where: { id },
        include: {
          created_by_user: {
            select: ProfileOverviewSelect,
          },
          updated_by_user: {
            select: ProfileOverviewSelect,
          },
          members: {
            include: {
              profile: {
                select: ProfileOverviewSelect,
              },
            },
          },
        },
      });

      if (!team) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      // Vérification des droits
      const hasPermission = await this.workspaceMembersService.hasRight(team.workspace_id, userId, "get", "team");
      if (!hasPermission) {
        throw new UnauthorizedException("Vous n'avez pas les droits pour consulter cette équipe");
      }

      return plainToInstance(TeamDto, team);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "getById",
          message: "Erreur lors de la récupération de l'équipe",
          data: { error: error.message, id, userId },
        });

        throw new ValidationError("Impossible de récupérer l'équipe: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Récupère un aperçu d'une équipe (informations de base uniquement)
   *
   * @param id ID de l'équipe
   * @param userId ID de l'utilisateur
   * @returns Aperçu de l'équipe
   * @throws NotFoundException Si l'équipe n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getOverview(userId: string, workspace_id: string, params?: BaseSearchQueryDto): Promise<TeamListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    const search = params?.search ?? "";

    try {
      const isInWorkspace = await this.workspaceMembersService.isMember(workspace_id, userId);
      if (!isInWorkspace) {
        throw new UnauthorizedException("Your are not member of this workspace");
      }
      // Vérification des droits
      const hasPermission = await this.workspaceMembersService.hasRight(workspace_id, userId, "get", "team");
      if (!hasPermission) {
        throw new UnauthorizedException("You dont have permission to get the teams in this workspace");
      }

      const [team, total] = await this.prisma.$transaction([
        this.prisma.teams.findMany({
          where: { workspace_id, name: { contains: search }, members: { some: { user_id: userId } } },
          select: TeamOverviewSelect,
          skip,
          take,
        }),
        this.prisma.teams.count({
          where: { workspace_id, name: { contains: search }, members: { some: { user_id: userId } } },
        }),
      ]);

      if (!team) {
        throw new NotFoundException(`No team found with in this workspace: ${workspace_id}`);
      }

      return BasePaginationDto.create(
        team.map(item => plainToInstance(TeamOverview, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        TeamListDto,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "getOverview",
          message: "Erreur lors de la récupération de l'aperçu de l'équipe",
          data: { error: error.message, workspace_id, userId },
        });

        throw new ValidationError("Impossible de récupérer l'aperçu de l'équipe: " + error.message);
      }
      throw error;
    }
  }

  /**
   * Met à jour une équipe existante
   *
   * @param id ID de l'équipe à modifier
   * @param userId ID de l'utilisateur
   * @param dto DTO contenant les nouvelles données
   * @returns L'équipe mise à jour
   * @throws NotFoundException Si l'équipe n'existe pas
   * @throws ConflictException Si le nouveau nom existe déjà
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async update(id: string, userId: string, dto: UpdateTeamDto): Promise<TeamDto | null> {
    try {
      const existingTeam = await this.prisma.teams.findUnique({
        where: { id },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!existingTeam) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      const isInWorkspace = await this.workspaceMembersService.isMember(existingTeam.workspace_id, userId);
      if (!isInWorkspace) {
        throw new UnauthorizedException("You are not member of this workspace");
      }

      // Vérification des droits
      const hasPermission = await this.workspaceMembersService.hasRight(existingTeam.workspace_id, userId, "update", "team");
      if (!hasPermission) {
        throw new UnauthorizedException("You dont have permission to update this team");
      }

      const updateData: Prisma.teamsUpdateInput = {
        updated_by_user: {
          connect: { user_id: userId },
        },
        updated_at: new Date(),
      };

      // Mise à jour du nom et génération d'un nouveau slug si nécessaire
      if (dto.name && dto.name !== existingTeam.name) {
        // Vérification de l'unicité du nouveau nom
        const nameExists = await this.prisma.teams.findFirst({
          where: {
            workspace_id: existingTeam.workspace_id,
            name: dto.name,
            id: { not: id },
          },
        });

        if (nameExists) {
          throw new ConflictException(`Une équipe avec le nom "${dto.name}" existe déjà dans ce workspace`);
        }

        updateData.name = dto.name;
        updateData.slug = await this.generateUniqueSlug(dto.name, existingTeam.workspace_id, id);
      }

      // Autres champs optionnels
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.avatar_url !== undefined) updateData.avatar_url = dto.avatar_url;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

      const updatedTeam = await this.prisma.teams.update({
        where: { id },
        data: updateData,
        include: {
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
        service: "teams",
        func: "update",
        message: `Équipe mise à jour avec succès: ${updatedTeam.name}`,
        data: { teamId: id, userId, changes: dto },
      });

      return plainToInstance(TeamDto, updatedTeam);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "update",
          message: "Erreur lors de la mise à jour de l'équipe",
          data: { error: error.message, id, userId, dto },
        });

        throw new ValidationError("Impossible de mettre à jour l'équipe: " + error.message);
      }
      return null;
    }
  }

  /**
   * Supprime une équipe
   *
   * @param id ID de l'équipe à supprimer
   * @param userId ID de l'utilisateur
   * @throws NotFoundException Si l'équipe n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      const team = await this.prisma.teams.findUnique({
        where: { id },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!team) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      // Vérification des droits
      const hasPermission = await this.workspaceMembersService.hasRight(team.workspace_id, userId, "delete", "team");
      if (!hasPermission) {
        throw new UnauthorizedException("You dont have permission to delete this team");
      }

      await this.prisma.$transaction(async tx => {
        // Suppression des membres de l'équipe
        await tx.team_members.deleteMany({
          where: { team_id: id },
        });

        // Suppression de l'équipe
        await tx.teams.delete({
          where: { id },
        });
      });

      await this.loggerClient.log({
        level: "info",
        service: "teams",
        func: "delete",
        message: `Équipe supprimée avec succès: ${team.name}`,
        data: { teamId: id, userId },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "teams",
          func: "delete",
          message: "Erreur lors de la suppression de l'équipe",
          data: { error: error.message, id, userId },
        });

        throw new ValidationError("Impossible de supprimer l'équipe: " + error.message);
      }
    }
  }

  /**
   * Génère un slug unique pour une équipe
   *
   * @param name Nom de l'équipe
   * @param workspaceId ID du workspace
   * @param excludeId ID à exclure de la vérification (pour les mises à jour)
   * @returns Slug unique
   */
  private async generateUniqueSlug(name: string, workspaceId: string, excludeId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.teams.findFirst({
        where: {
          workspace_id: workspaceId,
          slug,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
