import { Injectable } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { Observable, firstValueFrom } from "rxjs";
import { Inject } from "@nestjs/common";
import { EpicDto, EpicListDto, CreateEpicDto, UpdateEpicDto, BaseSearchQueryDto } from "@shared/types";

interface EpicsGrpcClient {
  Create(request: { user_id: string; epic: CreateEpicDto }): Observable<EpicDto>;
  Search(request: { user_id: string; project_id: number; params?: BaseSearchQueryDto }): Observable<EpicListDto>;
  GetOverview(request: { user_id: string; project_id: number; params?: BaseSearchQueryDto }): Observable<EpicListDto>;
  GetById(request: { user_id: string; id: number }): Observable<EpicDto>;
  Update(request: { user_id: string; id: number; epic: UpdateEpicDto }): Observable<EpicDto>;
  Delete(request: { user_id: string; id: number }): Observable<Record<string, never>>;
}

@Injectable()
export class EpicsGatewayService {
  private client!: EpicsGrpcClient;

  constructor(@Inject("EPICS_PACKAGE") private readonly grpcClient: ClientGrpc) {}

  onModuleInit() {
    this.client = this.grpcClient.getService<EpicsGrpcClient>("EpicsService");
  }

  async create(userId: string, epic: CreateEpicDto): Promise<EpicDto> {
    return firstValueFrom(this.client.Create({ user_id: userId, epic }));
  }

  async search(userId: string, projectId: number, params?: BaseSearchQueryDto): Promise<EpicListDto> {
    return firstValueFrom(this.client.Search({ user_id: userId, project_id: projectId, params }));
  }

  async getOverview(userId: string, projectId: number, params?: BaseSearchQueryDto): Promise<EpicListDto> {
    return firstValueFrom(this.client.GetOverview({ user_id: userId, project_id: projectId, params }));
  }

  async findById(userId: string, id: number): Promise<EpicDto> {
    return firstValueFrom(this.client.GetById({ user_id: userId, id }));
  }

  async update(userId: string, id: number, epic: UpdateEpicDto): Promise<EpicDto> {
    return firstValueFrom(this.client.Update({ user_id: userId, id, epic }));
  }

  async remove(userId: string, id: number): Promise<void> {
    await firstValueFrom(this.client.Delete({ user_id: userId, id }));
  }
}
