import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import { CreateSprintDto, UpdateSprintDto, SprintDto, SprintsListDto, BaseSearchQueryDto } from "@shared/types";
import { LoggerClientService } from "@shared/logger";

interface SprintsGrpc {
  Create(req: { ownerId: string; dto: CreateSprintDto }): Observable<SprintDto>;
  Search(req: { user_id: string; project_id: number; params?: BaseSearchQueryDto }): Observable<SprintsListDto>;
  GetById(req: { id: string; userId: string; includeMetrics?: boolean }): Observable<SprintDto>;
  GetOverview(req: { projectId: number; params?: BaseSearchQueryDto; userId?: string }): Observable<SprintsListDto>;
  FindByProject(req: { projectId: number; params?: BaseSearchQueryDto; userId?: string }): Observable<SprintsListDto>;
  FindActiveSprint(req: { userId: string; projectId: number }): Observable<SprintDto>;
  Update(req: { id: string; dto: UpdateSprintDto; updatedBy: string }): Observable<SprintDto>;
  Delete(req: { id: string; deletedBy: string }): Observable<{ success: boolean }>;
}

@Injectable()
export class SprintsGatewayService implements OnModuleInit {
  private svc!: SprintsGrpc;

  constructor(
    @Inject("PROJECT_PACKAGE") private readonly client: ClientGrpc,
    private readonly loggerClient: LoggerClientService,
  ) {}

  onModuleInit() {
    this.svc = this.client.getService<SprintsGrpc>("SprintsService");
  }

  async create(ownerId: string, dto: CreateSprintDto): Promise<SprintDto> {
    const sprint = await firstValueFrom(this.svc.Create({ ownerId, dto }));
    if (!sprint) throw new Error("Failed to create sprint");
    return sprint;
  }

  async search(userId: string, projectId: number, params?: BaseSearchQueryDto): Promise<SprintsListDto> {
    const result = await firstValueFrom(this.svc.Search({ user_id: userId, project_id: projectId, params }));
    await this.loggerClient.log({
      level: "info",
      service: "sprint",
      func: "sprints-gateway.search",
      message: `Sprints search request via gRPC`,
      data: result,
    });
    return result;
  }

  async findById(id: string, userId: string): Promise<SprintDto> {
    const sprint = await firstValueFrom(this.svc.GetById({ id, userId }));
    if (!sprint) throw new Error(`Sprint with id ${id} not found`);
    return sprint;
  }

  async update(id: string, dto: UpdateSprintDto, userId: string): Promise<SprintDto> {
    const sprint = await firstValueFrom(this.svc.Update({ id, dto, updatedBy: userId }));
    if (!sprint) throw new Error(`Failed to update sprint ${id}`);
    return sprint;
  }

  async remove(id: string, userId: string): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.Delete({ id, deletedBy: userId }));
  }

  async getOverview(userId: string, projectId: number, params?: BaseSearchQueryDto): Promise<SprintsListDto> {
    return await firstValueFrom(this.svc.GetOverview({ userId, projectId, params }));
  }

  async findActiveSprint(userId: string, projectId: number): Promise<SprintDto> {
    return await firstValueFrom(this.svc.FindActiveSprint({ userId, projectId }));
  }
}
