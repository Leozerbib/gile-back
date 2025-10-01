import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketDto,
  TicketsListDto,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  BaseSearchQueryDto,
  BasePaginationDto,
  ProfileOverviewSelect,
  SprintOverviewSelect,
  ProjectOverviewSelect,
  LabelDtoSelect,
  LabelDto,
} from "@shared/types";
import { plainToInstance } from "class-transformer";

/**
 * Service de gestion des tickets
 *
 * Ce service fournit les opérations CRUD pour les tickets avec contrôle d'accès :
 * - create: Création d'un nouveau ticket
 * - search: Recherche avec pagination et filtres
 * - getById: Récupération d'un ticket par son ID
 * - update: Mise à jour d'un ticket existant
 * - delete: Suppression d'un ticket
 *
 * @author Bibz Project
 * @version 1.0.0
 */
@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  /**
   * Crée un nouveau ticket avec validation et contrôle d'accès
   *
   * @param userId ID de l'utilisateur créateur
   * @param dto DTO contenant les données du ticket
   * @returns Le ticket créé
   * @throws ValidationError Si les données sont invalides
   * @throws NotFoundException Si le projet ou sprint n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async create(userId: string, dto: CreateTicketDto): Promise<number> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tickets.create",
      message: `Creating ticket for user ${userId}`,
      data: { userId, dto },
    });

    // Validation des données d'entrée
    if (!dto?.title?.trim()) {
      await this.loggerClient.log({
        level: "warn",
        service: "project",
        func: "tickets.create",
        message: "Ticket creation failed: title is required",
      });
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Title is required" });
    }

    if (!dto.project_id) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Project ID is required" });
    }

    try {
      // Vérifier le sprint si fourni
      if (dto.sprint_id) {
        const sprint = await this.prisma.sprints.findUnique({
          where: { id: dto.sprint_id },
          select: { id: true, project_id: true },
        });

        if (!sprint) {
          await this.loggerClient.log({
            level: "warn",
            service: "project",
            func: "tickets.create",
            message: `Ticket creation failed: sprint with ID "${dto.sprint_id}" not found`,
          });
          throw new RpcException({ code: status.NOT_FOUND, message: `Sprint with ID "${dto.sprint_id}" not found` });
        }

        if (sprint.project_id !== dto.project_id) {
          await this.loggerClient.log({
            level: "warn",
            service: "project",
            func: "tickets.create",
            message: `Ticket creation failed: sprint with ID "${dto.sprint_id}" does not belong to the specified project`,
          });
          throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Sprint does not belong to the specified project" });
        }
      }

      let parentTicket: number | null = null;
      // Vérifier le ticket parent si fourni
      if (dto.parent_ticket_id && dto.parent_ticket_id !== 0) {
        const parent = await this.prisma.tickets.findUnique({
          where: { id: dto.parent_ticket_id },
          select: { id: true, project_id: true },
        });

        if (!parent) {
          parentTicket = null;
        } else if (parent?.project_id !== dto.project_id) {
          throw new RpcException({ code: status.FAILED_PRECONDITION, message: "Parent ticket does not belong to the specified project" });
        } else {
          parentTicket = parent.id;
        }
      }

      const id = await this.prisma.$transaction(async tx => {
        const id = await tx.tickets.create({
          data: {
            title: dto.title,
            description: dto.description,
            status: TicketStatus.TODO,
            priority: (dto.priority as TicketPriority) || TicketPriority.MEDIUM,
            category: (dto.category as TicketCategory) || TicketCategory.TASK,
            story_points: dto.story_points,
            estimated_hours: dto.estimated_hours ? Number(dto.estimated_hours) : null,
            due_date: dto.due_date ? new Date(dto.due_date) : null,
            project_id: dto.project_id,
            sprint_id: dto.sprint_id,
            parent_ticket_id: parentTicket,
            task_id: dto.task_id || [],
            created_by: userId,
            assigned_to: userId,
          },
          select: {
            id: true,
          },
        });

        if (!id) {
          await this.loggerClient.log({
            level: "warn",
            service: "project",
            func: "tickets.create",
            message: "Ticket creation failed: unable to create ticket",
          });
          throw new RpcException({ code: status.INTERNAL, message: "Unable to create ticket" });
        }

        if (dto.labels_id!.length > 0) {
          // Vérifier l'existence des labels
          for (const labelId of dto.labels_id!) {
            const existingLabel = await tx.labels.findUnique({
              where: { id: labelId },
              select: { id: true },
            });

            if (existingLabel) {
              await tx.ticket_labels.create({
                data: {
                  ticket_id: id.id,
                  label_id: labelId,
                  created_by: userId,
                },
              });
            }
          }
        }

        return id;
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "tickets.create",
        message: `Ticket created successfully`,
        data: { ticketId: id.id, projectId: dto.project_id, userId },
      });

      return id.id;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tickets.create",
          message: "Error creating ticket",
          data: { error: error.message, dto, userId },
        });

        // Handle specific Prisma errors
        if ("code" in error) {
          const prismaError = error as Prisma.PrismaClientKnownRequestError;
          if (prismaError.code === "P2003") {
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid foreign key reference" });
          }
          if (prismaError.code === "P2002") {
            throw new RpcException({ code: status.ALREADY_EXISTS, message: "Ticket with this identifier already exists" });
          }
          if (prismaError.code === "P2025") {
            throw new RpcException({ code: status.NOT_FOUND, message: "Referenced resource not found" });
          }
        }

        throw new RpcException({ code: status.INTERNAL, message: "Unable to create ticket: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Recherche des tickets avec pagination et filtres
   *
   * @param userId ID de l'utilisateur effectuant la recherche
   * @param query Paramètres de recherche avec pagination et filtres
   * @returns Liste paginée des tickets
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async search(userId: string, query: BaseSearchQueryDto): Promise<TicketsListDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tickets.search",
      message: "Searching tickets with filters",
      data: { userId, query },
    });

    const { search, sortBy, filters } = query;
    const skip = query.skip || 0;
    const take = query.take || 25;

    try {
      const where: Prisma.ticketsWhereInput = {};

      // Handle search term
      if (search && search.trim()) {
        where.title = { contains: search.trim(), mode: "insensitive" };
      }

      // Handle filters from BaseSearchQueryDto
      if (filters) {
        if (typeof filters.project_id === "number") where.project_id = filters.project_id;
        if (Array.isArray(filters.sprint_ids) && filters.sprint_ids.length) where.sprint_id = { in: filters.sprint_ids };
        else if (typeof filters.sprint_id === "number") where.sprint_id = filters.sprint_id;
        if (Array.isArray(filters.status_in) && filters.status_in.length) where.status = { in: filters.status_in };
        if (Array.isArray(filters.assign_to_in) && filters.assign_to_in.length) where.assigned_to = { in: filters.assign_to_in };
        if (Array.isArray(filters.label_ids) && filters.label_ids.length) {
          where.labels = { some: { label_id: { in: filters.label_ids } } };
        }
      }

      // Sorting configuration
      const ORDER_MAP: Record<string, Prisma.ticketsOrderByWithRelationInput> = {
        createdAt: { created_at: "desc" },
        updatedAt: { updated_at: "desc" },
        name: { title: "asc" },
        title: { title: "asc" },
        status: { status: "asc" },
        priority: { priority: "asc" },
        category: { category: "asc" },
        value: { story_points: "asc" },
        story_points: { story_points: "asc" },
      };

      let orderBy: Prisma.ticketsOrderByWithRelationInput = { created_at: "desc" };

      // Handle sortBy from BaseSearchQueryDto
      if (sortBy && sortBy.length > 0) {
        const firstSort = sortBy[0];
        if (ORDER_MAP[firstSort.field]) {
          orderBy = {
            ...ORDER_MAP[firstSort.field],
            [Object.keys(ORDER_MAP[firstSort.field])[0]]: firstSort.order?.toLowerCase() || "asc",
          };
        }
      }

      const [tickets, total] = await this.prisma.$transaction([
        this.prisma.tickets.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            project: { select: { id: true, name: true, slug: true } },
            sprint: { select: { id: true, name: true, version: true } },
            assigned_to_user: { select: ProfileOverviewSelect },
            created_by_user: { select: ProfileOverviewSelect },
            updated_by_user: { select: ProfileOverviewSelect },
            labels: { include: { label: { select: { id: true, name: true } } } },
          },
        }),
        this.prisma.tickets.count({ where }),
      ]);

      const items = tickets.map(ticket => {
        const transformedTicket = {
          ...ticket,
          estimated_hours: ticket.estimated_hours ? Number(ticket.estimated_hours) : null,
          actual_hours: ticket.actual_hours ? Number(ticket.actual_hours) : null,
          story_points: ticket.story_points ? Number(ticket.story_points) : null,
        };
        return plainToInstance(TicketDto, transformedTicket);
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "tickets.search",
        message: `Search completed successfully`,
        data: { count: items.length, total, userId },
      });

      return BasePaginationDto.create(items, total, skip, take, TicketsListDto);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tickets.search",
          message: "Error searching tickets",
          data: { error: error.message, query, userId },
        });

        throw new RpcException({ code: status.INTERNAL, message: "Unable to search tickets: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Récupère un ticket par son ID avec contrôle d'accès
   *
   * @param id ID du ticket
   * @param userId ID de l'utilisateur effectuant la requête
   * @returns Le ticket trouvé
   * @throws NotFoundException Si le ticket n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async getById(id: number, userId: string): Promise<TicketDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tickets.getById",
      message: `Fetching ticket with id ${id}`,
      data: { id, userId },
    });

    const ticketId = Number(id);
    if (Number.isNaN(ticketId)) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid ticket identifier" });
    }

    try {
      const ticket = await this.prisma.tickets.findUnique({
        where: { id: ticketId },
        include: {
          project: { select: ProjectOverviewSelect },
          sprint: { select: SprintOverviewSelect },
          assigned_to_user: { select: ProfileOverviewSelect },
          created_by_user: { select: ProfileOverviewSelect },
          updated_by_user: { select: ProfileOverviewSelect },
        },
      });

      if (!ticket) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Ticket with ID "${id}" not found` });
      }

      // TODO: Add workspace access validation
      // const hasPermission = await this.workspaceMembersService.hasRight(ticket.project.workspace_id, userId, "get", "project");
      // if (!hasPermission) {
      //   throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to view this ticket" });
      // }

      const ticketDto: TicketDto = plainToInstance(TicketDto, ticket);

      const labels = await this.prisma.ticket_labels
        .findMany({
          where: {
            ticket_id: ticket.id,
          },
          select: {
            label: {
              select: LabelDtoSelect,
            },
          },
        })
        .then(items => items.map(item => plainToInstance(LabelDto, item.label, { excludeExtraneousValues: true })));

      ticketDto.labels = labels;
      return ticketDto;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tickets.getById",
          message: "Error retrieving ticket",
          data: { error: error.message, id, userId },
        });

        throw new RpcException({ code: status.INTERNAL, message: "Unable to retrieve ticket: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Met à jour un ticket existant avec contrôle d'accès
   *
   * @param id ID du ticket à mettre à jour
   * @param dto DTO contenant les données de mise à jour
   * @param userId ID de l'utilisateur effectuant la mise à jour
   * @returns Le ticket mis à jour
   * @throws NotFoundException Si le ticket n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async update(id: string, dto: UpdateTicketDto, userId: string): Promise<TicketDto> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tickets.update",
      message: `Updating ticket ${id} for user ${userId}`,
      data: { id, dto, userId },
    });

    const ticketId = Number(id);
    if (Number.isNaN(ticketId)) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid ticket identifier" });
    }

    try {
      // Vérifier que le ticket existe et récupérer les informations du projet
      const existingTicket = await this.prisma.tickets.findUnique({
        where: { id: ticketId },
        include: {
          project: { select: { id: true, workspace_id: true } },
        },
      });

      if (!existingTicket) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Ticket with ID "${id}" not found` });
      }

      // TODO: Add workspace access validation
      // const hasPermission = await this.workspaceMembersService.hasRight(existingTicket.project.workspace_id, userId, "update", "project");
      // if (!hasPermission) {
      //   throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to update this ticket" });
      // }

      // Validation des références si elles sont modifiées
      if (dto.sprint_id && dto.sprint_id !== existingTicket.sprint_id) {
        const sprint = await this.prisma.sprints.findUnique({
          where: { id: dto.sprint_id },
          select: { id: true, project_id: true },
        });

        if (!sprint) {
          throw new RpcException({ code: status.NOT_FOUND, message: `Sprint with ID "${dto.sprint_id}" not found` });
        }

        if (sprint.project_id !== existingTicket.project_id) {
          throw new RpcException({ code: status.INTERNAL, message: "Sprint does not belong to the ticket's project" });
        }
      }

      if (dto.parent_ticket_id && dto.parent_ticket_id !== existingTicket.parent_ticket_id) {
        const parentTicket = await this.prisma.tickets.findUnique({
          where: { id: dto.parent_ticket_id },
          select: { id: true, project_id: true },
        });

        if (!parentTicket) {
          throw new RpcException({ code: status.NOT_FOUND, message: `Parent ticket with ID "${dto.parent_ticket_id}" not found` });
        }

        if (parentTicket.project_id !== existingTicket.project_id) {
          throw new RpcException({ code: status.INTERNAL, message: "Parent ticket does not belong to the same project" });
        }
      }

      const updateData: Prisma.ticketsUpdateInput = {
        updated_by_user: { connect: { user_id: userId } },
        updated_at: new Date(),
      };

      // Mise à jour des champs optionnels
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.priority !== undefined) updateData.priority = dto.priority;
      if (dto.category !== undefined) updateData.category = dto.category;
      if (dto.story_points !== undefined) updateData.story_points = dto.story_points;
      if (dto.estimated_hours !== undefined) updateData.estimated_hours = dto.estimated_hours ? Number(dto.estimated_hours) : null;
      if (dto.actual_hours !== undefined) updateData.actual_hours = dto.actual_hours ? Number(dto.actual_hours) : null;
      if (dto.due_date !== undefined) updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;
      if (dto.completed_at !== undefined) updateData.completed_at = dto.completed_at ? new Date(dto.completed_at) : null;
      if (dto.implementation_notes !== undefined) updateData.implementation_notes = dto.implementation_notes;
      if (dto.testing_notes !== undefined) updateData.testing_notes = dto.testing_notes;
      if (dto.sprint_id !== undefined) updateData.sprint = { connect: { id: dto.sprint_id } };
      if (dto.assigned_to !== undefined) updateData.assigned_to_user = { connect: { user_id: dto.assigned_to } };
      if (dto.ticket_number !== undefined) updateData.ticket_number = dto.ticket_number;
      if (dto.parent_ticket_id !== undefined) {
        updateData.ticket = dto.parent_ticket_id ? { connect: { id: dto.parent_ticket_id } } : { disconnect: true };
      }
      if (dto.task_id !== undefined) updateData.task_id = dto.task_id;

      const updatedTicket = await this.prisma.tickets.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          assigned_to_user: { select: ProfileOverviewSelect },
          created_by_user: { select: ProfileOverviewSelect },
          updated_by_user: { select: ProfileOverviewSelect },
        },
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "tickets.update",
        message: `Ticket updated successfully: ${updatedTicket.title}`,
        data: { ticketId: id, userId, changes: dto },
      });

      const transformedTicket = {
        ...updatedTicket,
        estimated_hours: updatedTicket.estimated_hours ? Number(updatedTicket.estimated_hours) : null,
        actual_hours: updatedTicket.actual_hours ? Number(updatedTicket.actual_hours) : null,
        story_points: updatedTicket.story_points ? Number(updatedTicket.story_points) : null,
      };

      return plainToInstance(TicketDto, transformedTicket);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tickets.update",
          message: "Error updating ticket",
          data: { error: error.message, id, dto, userId },
        });

        // Handle specific Prisma errors
        if ("code" in error) {
          const prismaError = error as Prisma.PrismaClientKnownRequestError;
          if (prismaError.code === "P2025") {
            throw new RpcException({ code: status.NOT_FOUND, message: "Ticket not found" });
          }
          if (prismaError.code === "P2003") {
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid foreign key reference" });
          }
          if (prismaError.code === "P2002") {
            throw new RpcException({ code: status.ALREADY_EXISTS, message: "Ticket with this identifier already exists" });
          }
        }

        throw new RpcException({ code: status.INTERNAL, message: "Unable to update ticket: " + error.message });
      }
      throw error;
    }
  }

  /**
   * Supprime un ticket avec contrôle d'accès
   *
   * @param id ID du ticket à supprimer
   * @param userId ID de l'utilisateur effectuant la suppression
   * @returns Confirmation de suppression
   * @throws NotFoundException Si le ticket n'existe pas
   * @throws UnauthorizedException Si l'utilisateur n'a pas les droits
   */
  async delete(id: string, userId: string): Promise<boolean> {
    await this.loggerClient.log({
      level: "debug",
      service: "project",
      func: "tickets.delete",
      message: `Deleting ticket ${id}`,
      data: { id, userId },
    });

    const ticketId = Number(id);
    if (Number.isNaN(ticketId)) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Invalid ticket identifier" });
    }

    try {
      // Vérifier que le ticket existe et récupérer les informations du projet
      const existingTicket = await this.prisma.tickets.findUnique({
        where: { id: ticketId },
        include: {
          project: { select: { id: true, workspace_id: true } },
        },
      });

      if (!existingTicket) {
        throw new RpcException({ code: status.NOT_FOUND, message: `Ticket with ID "${id}" not found` });
      }

      // TODO: Add workspace access validation
      // const hasPermission = await this.workspaceMembersService.hasRight(existingTicket.project.workspace_id, userId, "delete", "project");
      // if (!hasPermission) {
      //   throw new RpcException({ code: status.PERMISSION_DENIED, message: "You don't have permission to delete this ticket" });
      // }

      await this.prisma.tickets.delete({
        where: { id: ticketId },
      });

      await this.loggerClient.log({
        level: "info",
        service: "project",
        func: "tickets.delete",
        message: `Ticket deleted successfully: ${id}`,
        data: { ticketId: id, userId },
      });

      return true;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "project",
          func: "tickets.delete",
          message: "Error deleting ticket",
          data: { error: error.message, id, userId },
        });

        // Handle specific Prisma errors
        if ("code" in error) {
          const prismaError = error as Prisma.PrismaClientKnownRequestError;
          if (prismaError.code === "P2025") {
            throw new RpcException({ code: status.NOT_FOUND, message: "Ticket not found" });
          }
          if (prismaError.code === "P2014") {
            throw new RpcException({ code: status.INVALID_ARGUMENT, message: "Cannot delete ticket with existing relations" });
          }
        }

        throw new RpcException({ code: status.INTERNAL, message: "Unable to delete ticket: " + error.message });
      }
      throw error;
    }
  }
}
