import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import type { CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceDto, WorkspacesListDto, BaseSearchQueryDto } from "@shared/types";

interface WorkspaceGrpc {
  Create(req: { ownerId: string; dto: CreateWorkspaceDto }): Observable<WorkspaceDto>;
  Search(req: { params?: BaseSearchQueryDto }): Observable<WorkspacesListDto>;
  GetById(req: { id: string; userId?: string }): Observable<WorkspaceDto>;
  GetOverview(req: { params?: BaseSearchQueryDto; userId?: string }): Observable<WorkspacesListDto>;
  Update(req: { id: string; dto: UpdateWorkspaceDto; updatedBy?: string }): Observable<WorkspaceDto>;
  Delete(req: { id: string; deletedBy?: string }): Observable<{ success: boolean }>;
}

@Injectable()
export class WorkspaceGatewayService implements OnModuleInit {
  private svc!: WorkspaceGrpc;
  constructor(@Inject("WORKSPACE_CLIENT") private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.svc = this.client.getService<WorkspaceGrpc>("WorkspaceService");
  }

  async create(ownerId: string, dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const workspace = await firstValueFrom(this.svc.Create({ ownerId, dto }));
    if (!workspace) throw new Error("Failed to create workspace");
    return workspace;
  }

  async findAll(params?: BaseSearchQueryDto): Promise<WorkspacesListDto> {
    const result = await firstValueFrom(this.svc.Search({ params }));
    return result;
  }

  async findById(id: string, userId?: string): Promise<WorkspaceDto> {
    const workspace = await firstValueFrom(this.svc.GetById({ id, userId }));
    if (!workspace) throw new Error(`Workspace with id ${id} not found`);
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto, userId?: string): Promise<WorkspaceDto> {
    const workspace = await firstValueFrom(this.svc.Update({ id, dto, updatedBy: userId }));
    if (!workspace) throw new Error(`Failed to update workspace ${id}`);
    return workspace;
  }

  async remove(id: string, userId?: string): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.Delete({ id, deletedBy: userId }));
  }

  async getOverview(userId?: string, params?: BaseSearchQueryDto): Promise<WorkspacesListDto> {
    const res = await firstValueFrom(this.svc.GetOverview({ userId, params }));
    return res;
  }
}
