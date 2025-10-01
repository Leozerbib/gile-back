import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { CreateStackDto, UpdateStackDto, StackDto, StackListDto, BaseSearchQueryDto, StackDtoSelect, StackListSelect } from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Service de gestion des stacks technologiques
 *
 * Ce service fournit les opérations CRUD pour les stacks avec contrôle d'accès :
 * - create: Création d'une nouvelle stack
 * - update: Mise à jour d'une stack existante
 * - delete: Suppression d'une stack
 * - getOverview: Liste paginée des stacks avec recherche et filtres
 * - getById: Récupération d'une stack par son ID
 * - getByProjectId: Récupération des stacks d'un projet
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class StackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  /**
   * Crée une nouvelle stack avec validation et contrôle d'accès
   *
   * @param projectId ID du projet
   * @param dto DTO contenant les données de la stack
   * @param userId ID de l'utilisateur créateur
   * @returns La stack créée
   * @throws ValidationError Si les données sont invalides
   * @throws NotFoundException Si le projet n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async create(projectId: number, dto: CreateStackDto, userId: string): Promise<StackDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "stack.create",
      message: `Creating stack for project ${projectId}`,
      data: { projectId, userId, dto },
    });

    // Validation des données d'entrée
    if (!dto?.title?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "project",
        func: "stack.create",
        message: "Stack creation failed: title is required",
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Title is required" });
    }

    if (!projectId) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Project ID is required" });
    }

    try {
      // Vérifier que le projet existe
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId },
        select: { id: true, name: true },
      });

      if (!project) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Project with ID "${projectId}" not found` });
      }

      // Si c'est une stack principale, s'assurer qu'il n'y en a pas déjà une
      if (dto.is_primary) {
        const existingPrimaryStack = await this.prisma.stacks.findFirst({
          where: {
            project_id: projectId,
            is_primary: true,
          },
        });

        if (existingPrimaryStack) {
          throw new RpcException({ code: status.ALREADY_EXISTS, message: "A primary stack already exists for this project" });
        }
      }

      const stack = await this.prisma.stacks.create({
        data: {
          title: dto.title.trim(),
          type: dto.type,
          project_id: projectId,
          language_id: dto.language_id,
          version: dto.version?.trim(),
          description: dto.description?.trim(),
          is_primary: dto.is_primary || false,
          created_by: userId,
          updated_by: userId,
        },
        select: StackDtoSelect,
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "stack.create",
        message: `Stack created successfully: ${stack.title}`,
        data: { stackId: stack.id, projectId, userId },
      });

      return plainToInstance(StackDto, stack);
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "stack.create",
          message: "Error creating stack",
          data: { error: error.message, dto, projectId, userId },
        });

        // Handle specific Prisma errors
        if ("code" in error) {
          const prismaError = error as Prisma.PrismaClientKnownRequestError;
          if (prismaError.code === "P2003") {
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid foreign key reference" });
          }
          if (prismaError.code === "P2002") {
            throw new RpcException({ code: status.ALREADY_EXISTS, message: "Stack with this identifier already exists" });
          }
          if (prismaError.code === "P2025") {
            throw new RpcException({ code: status.NOT_FOUND, message: "Referenced resource not found" });
          }
        }

        throw new RpcException({ code: status.INTERNAL, message: "Unable to create stack: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Met à jour une stack existante
   *
   * @param stackId ID de la stack à mettre à jour
   * @param projectId ID du projet
   * @param dto DTO contenant les données à mettre à jour
   * @param userId ID de l'utilisateur effectuant la modification
   * @returns La stack mise à jour
   * @throws NotFoundException Si la stack n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   * @throws ValidationError Si les données sont invalides
   */
  async update(stackId: number, projectId: number, dto: UpdateStackDto, userId: string): Promise<StackDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "stack.update",
      message: `Updating stack ${stackId}`,
      data: { stackId, projectId, userId, dto },
    });

    try {
      // Vérifier que la stack existe et appartient au projet
      const existingStack = await this.prisma.stacks.findUnique({
        where: { id: stackId },
        select: { id: true, project_id: true, is_primary: true, title: true },
      });

      if (!existingStack) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Stack with ID "${stackId}" not found` });
      }

      if (existingStack.project_id !== projectId) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Stack does not belong to the specified project" });
      }

      // Si on veut définir cette stack comme principale
      if (dto.is_primary && !existingStack.is_primary) {
        const existingPrimaryStack = await this.prisma.stacks.findFirst({
          where: {
            project_id: projectId,
            is_primary: true,
            id: { not: stackId },
          },
        });

        if (existingPrimaryStack) {
          throw new RpcException({ code: status.ALREADY_EXISTS, message: "A primary stack already exists for this project" });
        }
      }

      const updateData: Prisma.stacksUpdateInput = {
        updated_by_user: { connect: userId ? { user_id: userId } : undefined },
        updated_at: new Date(),
      };

      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.type !== undefined) updateData.type = dto.type;
      if (dto.version !== undefined) updateData.version = dto.version?.trim();
      if (dto.description !== undefined) updateData.description = dto.description?.trim();
      if (dto.is_primary !== undefined) updateData.is_primary = dto.is_primary;

      const stack = await this.prisma.stacks.update({
        where: { id: stackId },
        data: updateData,
        select: StackDtoSelect,
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "stack.update",
        message: `Stack updated successfully: ${stack.title}`,
        data: { stackId, projectId, userId },
      });

      return plainToInstance(StackDto, stack);
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "stack.update",
          message: "Error updating stack",
          data: { error: error.message, stackId, projectId, userId },
        });

        if ("code" in error) {
          const prismaError = error as Prisma.PrismaClientKnownRequestError;
          if (prismaError.code === "P2025") {
            throw new RpcException({ code: status.NOT_FOUND, message: "Stack not found" });
          }
          if (prismaError.code === "P2002") {
            throw new RpcException({ code: status.ALREADY_EXISTS, message: "Stack with this identifier already exists" });
          }
        }

        throw new RpcException({ code: status.INTERNAL, message: "Unable to update stack: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Supprime une stack
   *
   * @param stackId ID de la stack à supprimer
   * @param projectId ID du projet
   * @param userId ID de l'utilisateur effectuant la suppression
   * @returns Confirmation de suppression
   * @throws NotFoundException Si la stack n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async delete(stackId: number, projectId: number, userId: string): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "stack.delete",
      message: `Deleting stack ${stackId}`,
      data: { stackId, projectId, userId },
    });

    try {
      // Vérifier que la stack existe et appartient au projet
      const existingStack = await this.prisma.stacks.findUnique({
        where: { id: stackId },
        select: { id: true, project_id: true, title: true },
      });

      if (!existingStack) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Stack with ID "${stackId}" not found` });
      }

      if (existingStack.project_id !== projectId) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Stack does not belong to the specified project" });
      }

      await this.prisma.stacks.delete({
        where: { id: stackId },
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "stack.delete",
        message: `Stack deleted successfully: ${existingStack.title}`,
        data: { stackId, projectId, userId },
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
          func: "stack.delete",
          message: "Error deleting stack",
          data: { error: error.message, stackId, projectId, userId },
        });

        if ("code" in error) {
          const prismaError = error as Prisma.PrismaClientKnownRequestError;
          if (prismaError.code === "P2025") {
            throw new RpcException({ code: status.NOT_FOUND, message: "Stack not found" });
          }
        }

        throw new RpcException({ code: status.INTERNAL, message: "Unable to delete stack: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Récupère la liste des stacks avec pagination et filtres
   *
   * @param projectId ID du projet
   * @param userId ID de l'utilisateur effectuant la recherche
   * @param query Paramètres de recherche avec pagination et filtres
   * @returns Liste paginée des stacks
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getOverview(projectId: number, userId: string, query?: BaseSearchQueryDto): Promise<StackListDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "stack.getOverview",
      message: "Getting stacks overview",
      data: { projectId, userId, query },
    });

    const skip = query?.skip || 0;
    const take = query?.take || 25;

    const search = query?.search?.trim() || "";

    try {
      const where: Prisma.stacksWhereInput = {
        project_id: projectId,
      };

      // Handle search term
      if (search && search.trim()) {
        where.OR = [{ title: { contains: search.trim(), mode: "insensitive" } }, { description: { contains: search.trim(), mode: "insensitive" } }];
      }

      const [stacks, total] = await this.prisma.$transaction([
        this.prisma.stacks.findMany({
          where,
          select: StackListSelect,
          orderBy: { title: "desc" },
          skip,
          take,
        }),
        this.prisma.stacks.count({ where }),
      ]);

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "stack.getOverview",
        message: `Retrieved ${stacks.length} stacks`,
        data: { projectId, total, count: stacks.length },
      });

      return plainToInstance(StackListDto, {
        items: stacks,
        total,
        skip,
        take,
      });
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "stack.getOverview",
          message: "Error getting stacks overview",
          data: { error: error.message, projectId, userId },
        });

        throw new RpcException({ code: status.INTERNAL, message: "Unable to retrieve stacks: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Récupère une stack par son ID
   *
   * @param stackId ID de la stack
   * @param projectId ID du projet
   * @param userId ID de l'utilisateur effectuant la requête
   * @returns La stack trouvée
   * @throws NotFoundException Si la stack n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getById(stackId: number, projectId: number, userId: string): Promise<StackDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "stack.getById",
      message: `Getting stack by ID ${stackId}`,
      data: { stackId, projectId, userId },
    });

    try {
      const stack = await this.prisma.stacks.findUnique({
        where: { id: stackId },
        select: StackDtoSelect,
      });

      if (!stack) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Stack with ID "${stackId}" not found` });
      }

      if (stack.project_id !== projectId) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Stack does not belong to the specified project" });
      }

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "stack.getById",
        message: `Stack retrieved: ${stack.title}`,
        data: { stackId, projectId },
      });

      return plainToInstance(StackDto, stack);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "stack.getById",
          message: "Error getting stack by ID",
          data: { error: error.message, stackId, projectId, userId },
        });

        throw new RpcException({ code: status.INTERNAL, message: "Unable to retrieve stack: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Récupère toutes les stacks d'un projet
   *
   * @param projectId ID du projet
   * @param userId ID de l'utilisateur effectuant la requête
   * @returns Liste des stacks du projet
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getByProjectId(projectId: number, userId: string): Promise<StackDto[]> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "stack.getByProjectId",
      message: `Getting stacks for project ${projectId}`,
      data: { projectId, userId },
    });

    try {
      const stacks = await this.prisma.stacks.findMany({
        where: { project_id: projectId },
        select: StackDtoSelect,
        orderBy: [{ is_primary: "desc" }, { created_at: "desc" }],
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "stack.getByProjectId",
        message: `Retrieved ${stacks.length} stacks for project`,
        data: { projectId, count: stacks.length },
      });

      return stacks.map(stack => plainToInstance(StackDto, stack));
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "stack.getByProjectId",
          message: "Error getting stacks by project ID",
          data: { error: error.message, projectId, userId },
        });

        throw new RpcException({ code: status.INTERNAL, message: "Unable to retrieve stacks: " + error.message });
      }
      throw error;
    }
  }
}
