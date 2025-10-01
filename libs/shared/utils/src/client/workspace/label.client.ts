import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import type { CreateLabelDto, UpdateLabelDto, LabelDto, LabelsListDto, BaseSearchQueryDto } from "@shared/types";
import { LoggerClientService } from "@shared/logger";

interface LabelGrpc {
  Create(req: { userId: string; dto: CreateLabelDto; workspaceId: string }): Observable<LabelDto>;
  Search(req: { params?: BaseSearchQueryDto; workspaceId: string }): Observable<LabelsListDto>;
  GetById(req: { id: string; userId?: string; workspaceId: string }): Observable<LabelDto>;
  GetOverview(req: { params?: BaseSearchQueryDto; userId?: string; workspaceId: string }): Observable<LabelsListDto>;
  Update(req: { id: string; dto: UpdateLabelDto; updatedBy?: string; workspaceId: string }): Observable<LabelDto>;
  Delete(req: { id: string; deletedBy?: string; workspaceId: string }): Observable<{ success: boolean }>;
}

@Injectable()
export class LabelGatewayService implements OnModuleInit {
  private svc!: LabelGrpc;
  constructor(
    @Inject("LABEL_CLIENT") private readonly client: ClientGrpc,
    private readonly loggerClient: LoggerClientService,
  ) {}

  onModuleInit() {
    this.svc = this.client.getService<LabelGrpc>("LabelService");
  }

  async create(userId: string, dto: CreateLabelDto, workspaceId: string): Promise<LabelDto> {
    const label = await firstValueFrom(this.svc.Create({ userId, dto, workspaceId }));
    if (!label) throw new Error("Failed to create label");
    return label;
  }

  async findAll(params?: BaseSearchQueryDto, workspaceId?: string): Promise<LabelsListDto> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const result = await firstValueFrom(this.svc.Search({ params, workspaceId }));
    await this.loggerClient.log({
      level: "info",
      service: "labels",
      func: "label-gateway.findAll",
      message: `Label search request via gRPC`,
      data: result,
    });
    return result;
  }

  async findById(id: string, userId?: string, workspaceId?: string): Promise<LabelDto> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const label = await firstValueFrom(this.svc.GetById({ id, userId, workspaceId }));
    if (!label) throw new Error(`Label with id ${id} not found`);
    return label;
  }

  async update(id: string, dto: UpdateLabelDto, userId?: string, workspaceId?: string): Promise<LabelDto> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const label = await firstValueFrom(this.svc.Update({ id, dto, updatedBy: userId, workspaceId }));
    if (!label) throw new Error(`Failed to update label ${id}`);
    return label;
  }

  async remove(id: string, userId?: string, workspaceId?: string): Promise<{ success: boolean }> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    return await firstValueFrom(this.svc.Delete({ id, deletedBy: userId, workspaceId }));
  }

  async getOverview(userId?: string, params?: BaseSearchQueryDto, workspaceId?: string): Promise<LabelsListDto> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const res = await firstValueFrom(this.svc.GetOverview({ userId, params, workspaceId }));
    return res;
  }
}
