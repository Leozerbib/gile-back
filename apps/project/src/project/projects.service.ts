import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  ProjectsListDto,
  ProjectStatus,
  ProjectPriority,
  BaseSearchQueryDto,
  SearchQueryBuilder,
  BasePaginationDto,
  ProfileOverviewSelect,
  ProjectOverviewSelect,
  ProjectOverview,
  TeamOverview,
  TeamOverviewSelect,
  CreateTeamDto,
  FilterRule,
} from "@shared/types";
import { plainToInstance } from "class-transformer";
import { WorkspaceMembersService } from "apps/workspace/src/member/workspace-members.service";
import { TeamsService } from "apps/workspace/src/team/teams.service";
import { TeamsGatewayService } from "libs/shared/utils/src/client/team/teams.client";

/**
 * Service de gestion des projets
 *
 * Ce service fournit les opérations CRUD de base pour les projets :
 * - create: Création d'un nouveau projet
 * - search: Recherche avec pagination et filtres
 * - getById: Récupération d'un projet par son ID
 * - getOverview: Récupération d'un aperçu d'un projet
 * - update: Mise à jour d'un projet existant
 * - delete: Suppression d'un projet
 * - getTeam: Récupération de l'équipe d'un projet
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly teamService: TeamsService,
    private readonly teamGatewayService: TeamsGatewayService,
  ) {}

  /**
   * Crée un nouveau projet avec un créateur et génère un slug unique.
   * Utilise une transaction pour assurer l'intégrité des données.
   *
   * @param userId ID de l'utilisateur créateur
   * @param dto DTO contenant les données du projet
   * @returns Le projet créé
   * @throws ValidationError si les données sont invalides
   * @throws ConflictException si le slug existe déjà
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async create(userId: string, workspaceId: string, dto: CreateProjectDto): Promise<ProjectDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "projects.create",
      message: `Creating project with name: ${dto.name}`,
      data: { userId, name: dto.name, workspaceId },
    });

    // Validation des données d'entrée
    if (!dto?.name?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "project",
        func: "projects.create",
        message: "Project creation failed: name is required",
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Project name is required" });
    }

    if (!workspaceId) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Workspace ID is required" });
    }

    // Vérifier que le workspace existe
    const workspace = await this.prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Workspace with ID "${workspaceId}" not found` });
    }

    const hasPermission = await this.workspaceMembersService.hasRight(workspaceId, userId, "create", "project");
    if (!hasPermission) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to create projects in this workspace" });
    }

    // Générer le slug
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Vérifier l'unicité du slug dans le workspace
    const existingProject = await this.prisma.projects.findFirst({
      where: {
        slug,
        workspace_id: workspaceId,
      },
    });

    if (existingProject) {
      throw new RpcException({ code: status.ALREADY_EXISTS, message: `Project with slug "${slug}" already exists in this workspace` });
    }

    try {
      const project = await this.prisma.$transaction(async tx => {
        // Check slug uniqueness inside transaction
        const existingProject = await tx.projects.findFirst({
          where: {
            slug,
            workspace_id: workspaceId,
          },
        });

        if (existingProject) {
          throw new RpcException({ code: status.ALREADY_EXISTS, message: `Project with slug "${slug}" already exists in this workspace` });
        }

        const createdProject = await tx.projects.create({
          data: {
            name: dto.name.trim(),
            slug,
            description: dto.description?.trim() ?? null,
            full_description: dto.full_description?.trim() ?? null,
            workspace_id: workspaceId,
            project_manager_id: userId,
            status: ProjectStatus.TODO,
            priority: (dto.priority as ProjectPriority) ?? ProjectPriority.MEDIUM,
            progress: 0,
            start_date: dto.start_date ? new Date(dto.start_date) : null,
            end_date: dto.end_date ? new Date(dto.end_date) : null,
            is_public: dto.is_public ?? false,
            created_by: userId,
            updated_by: userId,
          },
          include: {
            manager: {
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

        if (!createdProject) {
          throw new Error("Failed to create project");
        }

        if (dto.team_id) {
          // Optional pre-check using existing service to maintain current behavior
          const teamExists = await this.teamService.exist(dto.team_id);
          if (!teamExists) {
            throw new RpcException({ code: status.NOT_FOUND, message: `Team with ID "${dto.team_id}" not found` });
          }

          // Validate team in the same workspace and assign within transaction
          const team = await tx.teams.findUnique({
            where: { id: dto.team_id },
            select: { id: true, workspace_id: true, name: true },
          });

          if (!team) {
            throw new RpcException({ code: status.NOT_FOUND, message: `Team with ID "${dto.team_id}" not found` });
          }

          if (team.workspace_id !== workspaceId) {
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Team and project must belong to the same workspace" });
          }

          const existingAssignment = await tx.project_teams.findFirst({
            where: {
              project_id: createdProject.id,
              team_id: dto.team_id,
            },
          });

          if (existingAssignment) {
            throw new RpcException({ code: status.ALREADY_EXISTS, message: "Team is already assigned to this project" });
          }

          await tx.project_teams.create({
            data: {
              project_id: createdProject.id,
              team_id: dto.team_id,
              created_by: userId,
            },
          });
        } else {
          // Create team via gateway and assign within the same transaction
          const createTeam: CreateTeamDto = {
            name: createdProject.name + " Team",
            description: "Team for project " + createdProject.name,
            avatar_url: undefined,
            workspace_id: workspaceId,
          };
          const created_team = await this.teamGatewayService.create(userId, workspaceId, createTeam);
          if (!created_team) {
            throw new Error("Failed to create team for project");
          }

          await tx.project_teams.create({
            data: {
              project_id: createdProject.id,
              team_id: created_team.id,
              created_by: userId,
            },
          });
        }

        return createdProject;
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "projects.create",
        message: `Project created successfully with ID: ${project.id}`,
        data: { id: project.id, name: project.name },
      });

      return plainToInstance(ProjectDto, project, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "projects.create",
          message: `Failed to create project: ${error.message}`,
          data: { error: error.message, userId, name: dto.name },
        });
      }
      throw error;
    }
  }

  /**
   * Recherche des projets avec pagination et filtres
   *
   * @param params Paramètres de recherche et pagination (BaseSearchQueryDto)
   * @returns Liste paginée des projets
   */
  async search(userId: string, workspaceId: string, params?: BaseSearchQueryDto): Promise<ProjectsListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 25;

    // Vérifier que le workspace existe
    const workspace = await this.prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Workspace with ID "${workspaceId}" not found` });
    }

    const hasPermission = await this.workspaceMembersService.hasRight(workspaceId, userId, "get", "project");
    if (!hasPermission) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to read projects in this workspace" });
    }

    // Base where clause: only active projects by default
    let where: Prisma.projectsWhereInput = {
      is_archived: false,
      workspace_id: workspaceId,
      OR: [
        { project_manager_id: userId },
        {
          teams: {
            some: {
              team: {
                members: {
                  some: {
                    user_id: userId,
                  },
                },
              },
            },
          },
        },
      ],
    };

    // Apply text search across selected fields
    const searchConditions = SearchQueryBuilder.buildSearchConditions(params?.search, ["name", "description"]);
    where = { ...where, ...searchConditions };

    if (params?.filters) {
      where = SearchQueryBuilder.applyFilters(where, params.filters);
    }

    // Build orderBy from sort options, mapping fields to DB columns
    const sortOptions = SearchQueryBuilder.buildSortOptions(params?.sortBy);
    const fieldMapping: Record<string, keyof Prisma.projectsOrderByWithRelationInput> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      name: "name",
      status: "status",
      priority: "priority",
      startDate: "start_date",
      endDate: "end_date",
      progress: "progress",
    };

    const orderByArray: Prisma.projectsOrderByWithRelationInput[] = [];
    for (const [field, direction] of Object.entries(sortOptions)) {
      const mappedField = fieldMapping[field] ?? (field as keyof Prisma.projectsOrderByWithRelationInput);
      orderByArray.push({ [mappedField]: direction as Prisma.SortOrder } as Prisma.projectsOrderByWithRelationInput);
    }

    // Default sort
    const orderBy = orderByArray.length > 0 ? orderByArray : [{ created_at: Prisma.SortOrder.desc }];

    try {
      const [items, total] = await Promise.all([
        this.prisma.projects.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            manager: {
              select: ProfileOverviewSelect,
            },
            created_by_user: {
              select: ProfileOverviewSelect,
            },
            updated_by_user: {
              select: ProfileOverviewSelect,
            },
          },
        }),
        this.prisma.projects.count({ where }),
      ]);

      return BasePaginationDto.create(
        items.map(item => plainToInstance(ProjectDto, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        ProjectsListDto,
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "projects.search",
          message: `Failed to search projects: ${error.message}`,
          data: { error: error.message, params },
        });
      }
      throw error;
    }
  }

  /**
   * Récupère un projet par son ID
   *
   * @param id ID du projet
   * @param userId ID de l'utilisateur qui fait la demande (optionnel)
   * @returns Le projet trouvé
   * @throws NotFoundException si le projet n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async getById(id: number, userId?: string): Promise<ProjectDto> {
    try {
      const item = await this.prisma.projects.findUnique({
        where: { id },
        include: {
          manager: {
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
        throw new RpcException({ code: status.NOT_FOUND, message: `Project with ID "${id}" not found` });
      }

      if (userId) {
        const hasPermission = await this.workspaceMembersService.hasRight(item.workspace_id, userId, "get", "project");
        if (!hasPermission) {
          throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to view this project" });
        }
      } else {
        if (!item.is_public) {
          throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to view this project" });
        }
      }

      return plainToInstance(ProjectDto, item, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "projects.getById",
          message: `Failed to get project by ID: ${error.message}`,
          data: { error: error.message, id },
        });
      }
      throw error;
    }
  }

  /**
   * Récupère un aperçu des projets avec pagination et filtres
   *
   * @param params Paramètres de recherche et pagination
   * @param userId ID de l'utilisateur qui fait la demande
   * @returns Liste paginée des aperçus de projets
   * @throws NotFoundException si aucun projet n'est trouvé
   */
  async getOverview(workspaceId: string, userId: string, params?: BaseSearchQueryDto): Promise<ProjectsListDto> {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 10;
    const search = params?.search ?? "";

    try {
      const where: Prisma.projectsWhereInput = {
        is_archived: false,
        name: { contains: search, mode: "insensitive" },
        workspace_id: workspaceId,
        OR: [{ project_manager_id: userId }, { workspace: { members: { some: { user_id: userId } } } }],
      };

      const [items, total] = await Promise.all([
        this.prisma.projects.findMany({
          where,
          select: ProjectOverviewSelect,
          orderBy: { created_at: Prisma.SortOrder.desc },
          skip,
          take,
        }),
        this.prisma.projects.count({ where }),
      ]);

      return BasePaginationDto.create(
        items.map(item => plainToInstance(ProjectOverview, item, { excludeExtraneousValues: true })),
        total,
        skip,
        take,
        ProjectsListDto,
      );
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "projects.getOverview",
          message: `Failed to get project overview: ${error.message}`,
          data: { error: error.message, search, userId },
        });
      }
      throw error;
    }
  }

  /**
   * Met à jour un projet existant
   *
   * @param id ID du projet à mettre à jour
   * @param dto DTO contenant les données à mettre à jour
   * @param updatedBy ID de l'utilisateur qui effectue la mise à jour
   * @returns Le projet mis à jour
   * @throws NotFoundException si le projet n'existe pas
   * @throws ConflictException si le nouveau slug existe déjà
   * @throws ValidationError si les données sont invalides
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async update(id: number, dto: UpdateProjectDto, updatedBy: string): Promise<ProjectDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "projects.update",
      message: `Updating project: ${id}`,
      data: { id, updatedBy, changes: Object.keys(dto) },
    });

    // Validation des données d'entrée
    if (!dto || Object.keys(dto).length === 0) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "No data provided for update" });
    }

    try {
      // Vérifier que le projet existe
      const existingProject = await this.prisma.projects.findUnique({
        where: { id },
        select: { id: true, workspace_id: true, name: true, slug: true },
      });

      if (!existingProject) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Project with ID "${id}" not found` });
      }

      const hasPermission = await this.workspaceMembersService.hasRight(existingProject.workspace_id, updatedBy, "update", "project");
      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to update this project" });
      }

      // Vérifier l'unicité du slug si le nom est modifié
      if (dto.name && dto.name !== existingProject.name) {
        const newSlug = dto.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const slugConflict = await this.prisma.projects.findFirst({
          where: {
            slug: newSlug,
            workspace_id: existingProject.workspace_id,
            id: { not: id },
          },
        });

        if (slugConflict) {
          throw new RpcException({ code: status.ALREADY_EXISTS, message: `Project with slug "${newSlug}" already exists in this workspace` });
        }
      }

      // Préparer les données de mise à jour
      const updateData: Prisma.projectsUpdateInput = {
        updated_by_user: { connect: { user_id: updatedBy } },
        updated_at: new Date(),
      };

      if (dto.name !== undefined) {
        updateData.name = dto.name.trim();
        updateData.slug = dto.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      if (dto.description !== undefined) updateData.description = dto.description?.trim() ?? null;
      if (dto.full_description !== undefined) updateData.full_description = dto.full_description?.trim() ?? null;
      if (dto.project_manager_id !== undefined) updateData.manager = { connect: { user_id: dto.project_manager_id } };
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.priority !== undefined) updateData.priority = dto.priority;
      if (dto.start_date !== undefined) updateData.start_date = dto.start_date ? new Date(dto.start_date) : null;
      if (dto.end_date !== undefined) updateData.end_date = dto.end_date ? new Date(dto.end_date) : null;
      if (dto.actual_end_date !== undefined) updateData.actual_end_date = dto.actual_end_date ? new Date(dto.actual_end_date) : null;
      if (typeof dto.is_archived === "boolean") updateData.is_archived = dto.is_archived;
      if (typeof dto.is_public === "boolean") updateData.is_public = dto.is_public;
      if (dto.settings !== undefined) updateData.settings = dto.settings;
      if (dto.custom_fields !== undefined) updateData.custom_fields = dto.custom_fields;

      const updated = await this.prisma.projects.update({
        where: { id },
        data: updateData,
        include: {
          manager: {
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
        service: "project",
        func: "projects.update",
        message: `Project updated successfully: ${updated.id}`,
        data: { id: updated.id, name: updated.name, slug: updated.slug },
      });

      return plainToInstance(ProjectDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "projects.update",
          message: `Failed to update project: ${error.message}`,
          data: { error: error.message, id, updatedBy },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Supprime un projet
   *
   * @param id ID du projet à supprimer
   * @param deletedBy ID de l'utilisateur qui effectue la suppression
   * @returns Résultat de la suppression
   * @throws NotFoundException si le projet n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async delete(id: number, deletedBy: string): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "projects.delete",
      message: `Deleting project: ${id}`,
      data: { id, deletedBy },
    });

    try {
      // Vérifier que le projet existe
      const existingProject = await this.prisma.projects.findUnique({
        where: { id },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!existingProject) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Project with ID "${id}" not found` });
      }

      const hasPermission = await this.workspaceMembersService.hasRight(existingProject.workspace_id, deletedBy, "delete", "project");
      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to delete this project" });
      }

      // Supprimer le projet (les relations seront supprimées automatiquement grâce aux contraintes CASCADE)
      await this.prisma.projects.delete({
        where: { id },
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "projects.delete",
        message: `Project deleted successfully: ${id}`,
        data: { id, name: existingProject.name },
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
          func: "projects.delete",
          message: `Failed to delete project: ${error.message}`,
          data: { error: error.message, id },
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Récupère l'équipe d'un projet
   *
   * @param id ID du projet
   * @param userId ID de l'utilisateur qui fait la demande
   * @returns L'équipe du projet
   * @throws NotFoundException si le projet n'existe pas
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async getTeam(id: number, userId: string): Promise<TeamOverview> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "projects.getTeam",
      message: `Getting team for project: ${id}`,
      data: { id, userId },
    });

    try {
      // Vérifier que le projet existe
      const project = await this.prisma.projects.findUnique({
        where: { id },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!project) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Project with ID "${id}" not found` });
      }

      const hasPermission = await this.workspaceMembersService.hasRight(project.workspace_id, userId, "get", "project");
      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to view this project's team" });
      }

      // Récupérer les équipes associées au projet
      const projectTeams = await this.prisma.project_teams.findFirst({
        where: { project_id: id },
        include: {
          team: {
            select: TeamOverviewSelect,
          },
        },
      });

      if (!projectTeams) {
        throw new RpcException({ code: status.INTERNAL, message: `No team found for project with ID "${id}"` });
      }

      const team = projectTeams.team;

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "projects.getTeam",
        message: `Retrieved team for project: ${id}`,
        data: team,
      });

      return plainToInstance(TeamOverview, team, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "projects.getTeam",
          message: `Failed to get project team: ${error.message}`,
          data: { error: error.message, id, userId },
        });
      }
      throw error;
    }
  }

  /**
   * Assigne une équipe à un projet
   *
   * @param projectId ID du projet
   * @param teamId ID de l'équipe à assigner
   * @param userId ID de l'utilisateur qui effectue l'assignation
   * @returns Résultat de l'assignation
   * @throws NotFoundException si le projet ou l'équipe n'existe pas
   * @throws ConflictException si l'équipe est déjà assignée au projet
   * @throws UnauthorizedException si l'utilisateur n'a pas les droits
   */
  async assignTeam(projectId: number, teamId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "projects.assignTeam",
      message: `Assigning team ${teamId} to project ${projectId}`,
      data: { projectId, teamId, userId },
    });

    try {
      // Vérifier que le projet existe
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!project) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Project with ID "${projectId}" not found` });
      }

      // Vérifier les permissions
      const hasPermission = await this.workspaceMembersService.hasRight(project.workspace_id, userId, "assign", "project");
      if (!hasPermission) {
        throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to assign teams to this project" });
      }

      // Vérifier que l'équipe existe et appartient au même workspace
      const team = await this.prisma.teams.findUnique({
        where: { id: teamId },
        select: { id: true, workspace_id: true, name: true },
      });

      if (!team) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Team with ID "${teamId}" not found` });
      }

      if (team.workspace_id !== project.workspace_id) {
        throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Team and project must belong to the same workspace" });
      }

      // Vérifier si l'équipe est déjà assignée au projet
      const existingAssignment = await this.prisma.project_teams.findFirst({
        where: {
          project_id: projectId,
          team_id: teamId,
        },
      });

      if (existingAssignment) {
        throw new RpcException({ code: status.ALREADY_EXISTS, message: "Team is already assigned to this project" });
      }

      // Créer l'assignation
      await this.prisma.project_teams.create({
        data: {
          project_id: projectId,
          team_id: teamId,
          created_by: userId,
        },
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "projects.assignTeam",
        message: `Team ${team.name} successfully assigned to project ${project.name}`,
        data: { projectId, teamId, projectName: project.name, teamName: team.name },
      });

      return {
        success: true,
        message: `Team "${team.name}" has been successfully assigned to project "${project.name}"`,
      };
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "projects.assignTeam",
          message: `Failed to assign team to project: ${error.message}`,
          data: { error: error.message, projectId, teamId, userId },
        });
      }
      throw error;
    }
  }
}
