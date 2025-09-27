import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import { CreateSprintDto, UpdateSprintDto, SprintDto, SprintsListDto, BaseSearchQueryDto } from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";

interface SprintsGrpc {
  Create(request: { user: AuthenticatedUser; dto: CreateSprintDto }): Observable<SprintDto>;
  Search(request: { user: AuthenticatedUser; params?: BaseSearchQueryDto }): Observable<SprintsListDto>;
  GetById(request: { user: AuthenticatedUser; id: string }): Observable<SprintDto>;
  GetOverview(request: { user: AuthenticatedUser; project_id: number; params?: BaseSearchQueryDto }): Observable<SprintsListDto>;
  FindActiveSprint(request: { user: AuthenticatedUser; workspace_id?: string; project_id?: number }): Observable<SprintDto>;
  Update(request: { user: AuthenticatedUser; id: string; dto: UpdateSprintDto }): Observable<SprintDto>;
  Delete(request: { user: AuthenticatedUser; id: string }): Observable<boolean>;
}

@Injectable()
export class SprintsGatewayService implements OnModuleInit {
  private sprintsService!: SprintsGrpc;

  constructor(@Inject("PROJECT_PACKAGE") private client: ClientGrpc) {}

  onModuleInit() {
    this.sprintsService = this.client.getService<SprintsGrpc>("Sprints");
  }

  async create(user: AuthenticatedUser, dto: CreateSprintDto): Promise<SprintDto> {
    return await firstValueFrom<SprintDto>(this.sprintsService.Create({ user, dto }));
  }

  async update(id: string, dto: UpdateSprintDto, user: AuthenticatedUser): Promise<SprintDto> {
    return await firstValueFrom<SprintDto>(this.sprintsService.Update({ user, id, dto }));
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    await firstValueFrom(this.sprintsService.Delete({ user, id }));
  }

  async search(user: AuthenticatedUser, params: BaseSearchQueryDto): Promise<SprintsListDto> {
    return await firstValueFrom<SprintsListDto>(this.sprintsService.Search({ user, params }));
  }

  async findById(id: string, user: AuthenticatedUser): Promise<SprintDto> {
    return await firstValueFrom<SprintDto>(this.sprintsService.GetById({ user, id }));
  }

  async getOverview(user: AuthenticatedUser, projectId: number, params: BaseSearchQueryDto): Promise<SprintsListDto> {
    return await firstValueFrom<SprintsListDto>(this.sprintsService.GetOverview({ user, project_id: projectId, params }));
  }

  async findActiveSprint(user: AuthenticatedUser, workspaceId?: string, projectId?: number): Promise<SprintDto> {
    return await firstValueFrom<SprintDto>(this.sprintsService.FindActiveSprint({ user, workspace_id: workspaceId, project_id: projectId }));
  }
}
