import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import { CreateTicketDto, UpdateTicketDto, TicketDto, TicketsListDto, BaseSearchQueryDto } from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";

interface TicketsGrpc {
  Create(request: { user: AuthenticatedUser; dto: CreateTicketDto }): Observable<TicketDto>;
  Search(request: { user: AuthenticatedUser; params?: BaseSearchQueryDto }): Observable<TicketsListDto>;
  GetById(request: { user: AuthenticatedUser; id: string }): Observable<TicketDto>;
  Update(request: { user: AuthenticatedUser; id: string; dto: UpdateTicketDto }): Observable<TicketDto>;
  Delete(request: { user: AuthenticatedUser; id: string }): Observable<boolean>;
}

@Injectable()
export class TicketsGatewayService implements OnModuleInit {
  private ticketsService!: TicketsGrpc;

  constructor(@Inject("PROJECT_PACKAGE") private client: ClientGrpc) {}

  onModuleInit() {
    this.ticketsService = this.client.getService("Tickets");
  }

  // Normalize gRPC proto-loader output to clean HTTP JSON
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isGrpcTimestamp(value: unknown): value is { seconds: string | number; nanos: string | number } {
    if (!this.isPlainObject(value)) return false;
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every(k => k === "seconds" || k === "nanos") && "seconds" in value && "nanos" in value;
  }

  private normalizeGrpcTimestamp(ts: { seconds: string | number; nanos: string | number }): string | undefined {
    const seconds = typeof ts.seconds === "string" ? parseInt(ts.seconds, 10) : ts.seconds;
    const nanos = typeof ts.nanos === "string" ? parseInt(ts.nanos, 10) : ts.nanos;
    if (!Number.isFinite(seconds)) return undefined;
    if (seconds === 0 && (!nanos || nanos === 0)) return undefined;
    const ms = seconds * 1000 + (nanos ? Math.floor(nanos / 1e6) : 0);
    return new Date(ms).toISOString();
  }

  private normalizeArray(arr: unknown[]): unknown[] {
    return arr.map(v => this.normalizeValue(v));
  }

  private normalizeValue<T = unknown>(value: T, key?: string): T {
    if (value == null) return value;
    if (Array.isArray(value)) return this.normalizeArray(value as unknown[]) as unknown as T;
    if (this.isGrpcTimestamp(value)) {
      return this.normalizeGrpcTimestamp(value) as unknown as T;
    }
    if (this.isPlainObject(value)) {
      const input = value as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input)) {
        if (k.startsWith("_")) continue; // drop proto oneof presence markers (e.g., _description)
        result[k] = this.normalizeValue(v, k);
      }
      for (const dateKey of ["created_at", "updated_at", "due_date", "completed_at"]) {
        const dv = result[dateKey];
        if (typeof dv === "string") {
          const d = new Date(dv);
          if (!Number.isNaN(d.getTime())) result[dateKey] = d.toISOString();
        }
      }
      return result as unknown as T;
    }
    if (typeof value === "string" && (key === "due_date" || key === "completed_at")) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toISOString() as unknown as T;
    }
    return value;
  }

  async create(user: AuthenticatedUser, dto: CreateTicketDto): Promise<TicketDto> {
    const ticket = await firstValueFrom<TicketDto>(this.ticketsService.Create({ user, dto }));
    return this.normalizeValue<TicketDto>(ticket);
  }

  async search(user: AuthenticatedUser, params: BaseSearchQueryDto): Promise<TicketsListDto> {
    const response = await firstValueFrom<TicketsListDto>(this.ticketsService.Search({ user, params }));
    return this.normalizeValue<TicketsListDto>(response);
  }

  async findById(id: string, user: AuthenticatedUser): Promise<TicketDto> {
    const ticket = await firstValueFrom<TicketDto>(this.ticketsService.GetById({ user, id }));
    return this.normalizeValue<TicketDto>(ticket);
  }

  async update(id: string, dto: UpdateTicketDto, user: AuthenticatedUser): Promise<TicketDto> {
    const ticket = await firstValueFrom<TicketDto>(this.ticketsService.Update({ user, id, dto }));
    return this.normalizeValue<TicketDto>(ticket);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    await firstValueFrom(this.ticketsService.Delete({ user, id }));
  }
}
