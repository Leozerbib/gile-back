import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import { CreateTicketDto, UpdateTicketDto, TicketDto, TicketsListDto, BaseSearchQueryDto } from "@shared/types";

interface TicketsGrpc {
  Create(request: { user_id: string; dto: CreateTicketDto }): Observable<TicketDto>;
  Search(request: { user_id: string; project_id: number; params?: BaseSearchQueryDto }): Observable<TicketsListDto>;
  GetById(request: { user_id: string; id: number }): Observable<TicketDto>;
  Update(request: { user_id: string; id: string; dto: UpdateTicketDto }): Observable<TicketDto>;
  Delete(request: { user_id: string; id: string }): Observable<boolean>;
  UpsertDependencyTickets(request: { user_id: string; ticket_id: number; dependency_ticket_ids: number[] }): Observable<{ success: boolean }>;
  UpsertTicketLabels(request: { user_id: string; ticket_id: number; label_ids: number[] }): Observable<{ success: boolean }>;
  AssignTicket(request: { user_id: string; ticket_id: number; assigned_to_user_id: string }): Observable<{ success: boolean }>;
  AssignTicketToSprint(request: { user_id: string; ticket_id: number; sprint_id: number }): Observable<{ success: boolean }>;
}

@Injectable()
export class TicketsGatewayService implements OnModuleInit {
  private svc!: TicketsGrpc;

  constructor(@Inject("PROJECT_PACKAGE") private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.svc = this.client.getService<TicketsGrpc>("Tickets");
  }

  async create(user_id: string, dto: CreateTicketDto): Promise<TicketDto> {
    return await firstValueFrom(this.svc.Create({ user_id, dto }));
  }

  async search(user_id: string, project_id: number, params?: BaseSearchQueryDto): Promise<TicketsListDto> {
    return await firstValueFrom(this.svc.Search({ user_id, project_id, params }));
  }

  async findById(id: number, user_id: string): Promise<TicketDto> {
    return await firstValueFrom(this.svc.GetById({ user_id, id }));
  }

  async update(id: string, dto: UpdateTicketDto, user_id: string): Promise<TicketDto> {
    return await firstValueFrom(this.svc.Update({ user_id, id, dto }));
  }

  async remove(id: string, user_id: string): Promise<void> {
    await firstValueFrom(this.svc.Delete({ user_id, id }));
  }

  async upsertDependencyTickets(ticket_id: number, dependency_ticket_ids: number[], user_id: string): Promise<boolean> {
    const result = await firstValueFrom(this.svc.UpsertDependencyTickets({ user_id, ticket_id, dependency_ticket_ids }));
    return result.success;
  }

  async upsertTicketLabels(ticket_id: number, label_ids: number[], user_id: string): Promise<boolean> {
    const result = await firstValueFrom(this.svc.UpsertTicketLabels({ user_id, ticket_id, label_ids }));
    return result.success;
  }

  async assignTicket(ticket_id: number, assigned_to_user_id: string, user_id: string): Promise<boolean> {
    const result = await firstValueFrom(this.svc.AssignTicket({ user_id, ticket_id, assigned_to_user_id }));
    return result.success;
  }

  async assignTicketToSprint(ticket_id: number, sprint_id: number, user_id: string): Promise<boolean> {
    const result = await firstValueFrom(this.svc.AssignTicketToSprint({ user_id, ticket_id, sprint_id }));
    return result.success;
  }
}
