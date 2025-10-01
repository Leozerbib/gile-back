import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import type { BaseSearchQueryDto, WorkspaceMemberDto, WorkspaceMembersListDto, AddWorkspaceMemberDto, UpdateWorkspaceMemberDto, WorkspaceRole } from "@shared/types";

// gRPC interface mirroring workspace/v1/workspace-members.proto
interface WorkspaceMembersGrpc {
  AddMember(req: { user_id: string; workspace_id: string; dto: AddWorkspaceMemberDto }): Observable<WorkspaceMemberDto>;
  GetByWorkspaceId(req: { user_id: string; workspace_id: string }): Observable<WorkspaceMembersListDto>;
  GetById(req: { workspace_id: string; id: string }): Observable<WorkspaceMemberDto>;
  GetOverview(req: { user_id: string; workspace_id: string; params?: BaseSearchQueryDto }): Observable<WorkspaceMembersListDto>;
  UpdateMember(req: { user_id: string; workspace_id: string; id: string; dto: UpdateWorkspaceMemberDto }): Observable<WorkspaceMemberDto>;
  DeleteMember(req: { user_id: string; workspace_id: string; id: string }): Observable<{ success: boolean }>;
  IsMember(req: { user_id: string; workspace_id: string }): Observable<{ is_member: boolean }>;
  GetUserRole(req: { user_id: string; workspace_id: string }): Observable<{ role?: WorkspaceRole }>;
  HasRight(req: { user_id: string; workspace_id: string; action: string; resource: string }): Observable<{ has_right: boolean }>;
}

@Injectable()
export class WorkspaceMembersGatewayService implements OnModuleInit {
  private svc!: WorkspaceMembersGrpc;

  constructor(@Inject("MEMBER_CLIENT") private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.svc = this.client.getService<WorkspaceMembersGrpc>("WorkspaceMembers");
  }

  async addMember(user_id: string, workspace_id: string, dto: AddWorkspaceMemberDto): Promise<WorkspaceMemberDto> {
    return await firstValueFrom(this.svc.AddMember({ user_id, workspace_id, dto }));
  }

  async getByWorkspaceId(user_id: string, workspace_id: string): Promise<WorkspaceMembersListDto> {
    return await firstValueFrom(this.svc.GetByWorkspaceId({ user_id, workspace_id }));
  }

  async getById(workspace_id: string, id: string): Promise<WorkspaceMemberDto> {
    return await firstValueFrom(this.svc.GetById({ workspace_id, id }));
  }

  async getOverview(user_id: string, workspace_id: string, params?: BaseSearchQueryDto): Promise<WorkspaceMembersListDto> {
    return await firstValueFrom(this.svc.GetOverview({ user_id, workspace_id, params }));
  }

  async updateMember(user_id: string, workspace_id: string, id: string, dto: UpdateWorkspaceMemberDto): Promise<WorkspaceMemberDto> {
    return await firstValueFrom(this.svc.UpdateMember({ user_id, workspace_id, id, dto }));
  }

  async deleteMember(user_id: string, workspace_id: string, id: string): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.DeleteMember({ user_id, workspace_id, id }));
  }

  async isMember(user_id: string, workspace_id: string): Promise<{ is_member: boolean }> {
    return await firstValueFrom(this.svc.IsMember({ user_id, workspace_id }));
  }

  async getUserRole(user_id: string, workspace_id: string): Promise<{ role?: WorkspaceRole }> {
    return await firstValueFrom(this.svc.GetUserRole({ user_id, workspace_id }));
  }

  async hasRight(user_id: string, workspace_id: string, action: string, resource: string): Promise<{ has_right: boolean }> {
    return await firstValueFrom(this.svc.HasRight({ user_id, workspace_id, action, resource }));
  }
}
