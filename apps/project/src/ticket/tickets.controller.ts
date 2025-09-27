import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { CreateTicketDto, UpdateTicketDto, TicketDto, AuthenticatedUser, BaseSearchQueryDto, TicketsListDto } from "@shared/types";
import { TicketsService } from "./tickets.service";

@Controller()
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly logger: LoggerClientService,
  ) {}

  @GrpcMethod("Tickets", "Create")
  async create(data: { user: AuthenticatedUser; dto: CreateTicketDto }): Promise<TicketDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.create",
      message: "gRPC Create ticket request",
      data,
    });

    const ticket = await this.ticketsService.create(data.user.userId, data.dto);

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
  async search(data: { user: AuthenticatedUser; params?: BaseSearchQueryDto }): Promise<TicketsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.search",
      message: "gRPC Search tickets request",
      data,
    });

    const list = await this.ticketsService.search(data.user.userId, data.params ?? {});

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
  async getById(data: { user: AuthenticatedUser; id: string }): Promise<TicketDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.getById",
      message: `gRPC GetById ticket request for id ${data.id}`,
      data,
    });

    const ticket = await this.ticketsService.getById(data.id, data.user.userId);

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
  async update(data: { user: AuthenticatedUser; id: string; dto: UpdateTicketDto }): Promise<TicketDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.update",
      message: `gRPC Update ticket request for id ${data.id}`,
      data,
    });

    const ticket = await this.ticketsService.update(data.id, data.dto, data.user.userId);

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
  async delete(data: { user: AuthenticatedUser; id: string }): Promise<boolean> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.delete",
      message: `gRPC Delete ticket request for id ${data.id}`,
      data,
    });

    const result = await this.ticketsService.delete(data.id, data.user.userId);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tickets.grpc.delete",
      message: `gRPC Delete ticket response for id ${data.id}`,
      data: { result },
    });

    return result;
  }
}
