import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { CreateTicketDto, UpdateTicketDto, TicketDto, BaseSearchQueryDto, TicketsListDto } from "@shared/types";
import { TicketsService } from "./tickets.service";

@Controller()
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly logger: LoggerClientService,
  ) {}

  @GrpcMethod("Tickets", "Create")
  async create(data: { user_id: string; dto: CreateTicketDto }): Promise<TicketDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.create",
      message: "gRPC Create ticket request",
    });

    const id = await this.ticketsService.create(data.user_id, data.dto);

    const ticket = await this.ticketsService.getById(id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.create",
      message: "gRPC Create ticket response",
      data: { ticketId: ticket.id },
    });

    return ticket;
  }

  @GrpcMethod("Tickets", "Search")
  async search(data: { user_id: string; project_id: number; params?: BaseSearchQueryDto }): Promise<TicketsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.search",
      message: "gRPC Search tickets request",
      data,
    });

    const list = await this.ticketsService.search(data.user_id, data.project_id, data.params);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.search",
      message: "gRPC Search tickets response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  @GrpcMethod("Tickets", "GetById")
  async getById(data: { user_id: string; id: number }): Promise<TicketDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.getById",
      message: `gRPC GetById ticket request for id ${data.id}`,
      data,
    });

    const ticket = await this.ticketsService.getById(data.id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.getById",
      message: `gRPC GetById ticket response for id ${data.id}`,
      data: { ticketId: ticket.id },
    });

    return ticket;
  }

  @GrpcMethod("Tickets", "Update")
  async update(data: { user_id: string; id: string; dto: UpdateTicketDto }): Promise<TicketDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.update",
      message: `gRPC Update ticket request for id ${data.id}`,
      data,
    });

    const ticket = await this.ticketsService.update(data.id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.update",
      message: `gRPC Update ticket response for id ${data.id}`,
      data: { ticketId: ticket.id },
    });

    return ticket;
  }

  @GrpcMethod("Tickets", "Delete")
  async delete(data: { user_id: string; id: string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.delete",
      message: `gRPC Delete ticket request for id ${data.id}`,
      data,
    });

    const result = await this.ticketsService.delete(data.id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.delete",
      message: `gRPC Delete ticket response for id ${data.id}`,
      data: { result },
    });

    return { success: result };
  }

  @GrpcMethod("Tickets", "UpsertDependencyTickets")
  async upsertDependencyTickets(data: { user_id: string; ticket_id: number; dependency_ticket_ids: number[] }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.upsertDependencyTickets",
      message: `gRPC UpsertDependencyTickets request for ticket id ${data.ticket_id}`,
      data,
    });

    const result = await this.ticketsService.upsertDependencyTickets(data.ticket_id, data.dependency_ticket_ids, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.upsertDependencyTickets",
      message: `gRPC UpsertDependencyTickets response for ticket id ${data.ticket_id}`,
      data: { result, count: data.dependency_ticket_ids.length },
    });

    return { success: result };
  }

  @GrpcMethod("Tickets", "UpsertTicketLabels")
  async upsertTicketLabels(data: { user_id: string; ticket_id: number; label_ids: number[] }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.upsertTicketLabels",
      message: `gRPC UpsertTicketLabels request for ticket id ${data.ticket_id}`,
      data,
    });

    const result = await this.ticketsService.upsertTicketLabels(data.ticket_id, data.label_ids, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.upsertTicketLabels",
      message: `gRPC UpsertTicketLabels response for ticket id ${data.ticket_id}`,
      data: { result, count: data.label_ids.length },
    });

    return { success: result };
  }

  @GrpcMethod("Tickets", "AssignTicket")
  async assignTicket(data: { user_id: string; ticket_id: number; assigned_to_user_id: string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.assignTicket",
      message: `gRPC AssignTicket request for ticket id ${data.ticket_id}`,
      data,
    });

    const result = await this.ticketsService.assignTicket(data.ticket_id, data.assigned_to_user_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.assignTicket",
      message: `gRPC AssignTicket response for ticket id ${data.ticket_id}`,
      data: { result, assignedTo: data.assigned_to_user_id },
    });

    return { success: result };
  }

  @GrpcMethod("Tickets", "AssignTicketToSprint")
  async assignTicketToSprint(data: { user_id: string; ticket_id: number; sprint_id: number }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.assignTicketToSprint",
      message: `gRPC AssignTicketToSprint request for ticket id ${data.ticket_id}`,
      data,
    });

    const result = await this.ticketsService.assignTicketToSprint(data.ticket_id, data.sprint_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.assignTicketToSprint",
      message: `gRPC AssignTicketToSprint response for ticket id ${data.ticket_id}`,
      data: { result, sprintId: data.sprint_id },
    });

    return { success: result };
  }
}
