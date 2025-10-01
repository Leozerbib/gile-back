import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import type {
  BaseSearchQueryDto,
  CreateTeamDto,
  UpdateTeamDto,
  TeamDto,
  TeamListDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  TeamMemberDto,
  TeamMemberListDto,
  TeamRole,
} from "@shared/types";

interface TeamsGrpc {
  Create(request: { user_id: string; workspace_id: string; dto: CreateTeamDto }): Observable<TeamDto>;
  GetById(request: { user_id: string; workspace_id: string; id: string }): Observable<TeamDto>;
  GetOverview(request: { user_id: string; workspace_id: string; params?: BaseSearchQueryDto }): Observable<TeamListDto>;
  Update(request: { user_id: string; workspace_id: string; id: string; dto: UpdateTeamDto }): Observable<TeamDto>;
  Delete(request: { user_id: string; workspace_id: string; id: string }): Observable<{ success: boolean }>;
}

interface TeamMembersGrpc {
  Create(request: { user_id: string; team_id: string; dto: AddTeamMemberDto }): Observable<TeamMemberDto>;
  GetByTeamId(request: { user_id: string; team_id: string }): Observable<{ items: TeamMemberDto[] }>;
  GetById(request: { user_id: string; team_id: string; id: string }): Observable<TeamMemberDto>;
  GetOverview(request: { user_id: string; team_id: string; params?: BaseSearchQueryDto }): Observable<TeamMemberListDto>;
  Update(request: { user_id: string; team_id: string; id: string; dto: UpdateTeamMemberDto }): Observable<TeamMemberDto>;
  Delete(request: { user_id: string; team_id: string; id: string }): Observable<{ success: boolean }>;
  IsMember(request: { team_id: string; user_id: string }): Observable<{ is_member: boolean }>;
  GetUserRole(request: { team_id: string; user_id: string }): Observable<{ role?: TeamRole | null }>;
  HasRight(request: {
    team_id: string;
    user_id: string;
    action: "create" | "get" | "update" | "delete";
    resource: "member" | "project" | "sprint" | "ticket" | "task" | "epic" | "stack";
  }): Observable<{ allowed: boolean }>;
}

@Injectable()
export class TeamsGatewayService implements OnModuleInit {
  private svc!: TeamsGrpc;
  private membersSvc!: TeamMembersGrpc;

  constructor(@Inject("TEAM_CLIENT") private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.svc = this.client.getService<TeamsGrpc>("Teams");
    this.membersSvc = this.client.getService<TeamMembersGrpc>("TeamMembers");
  }

  async create(userId: string, workspaceId: string, dto: CreateTeamDto): Promise<TeamDto> {
    return await firstValueFrom(this.svc.Create({ user_id: userId, workspace_id: workspaceId, dto }));
  }

  async findById(userId: string, workspaceId: string, id: string): Promise<TeamDto> {
    return await firstValueFrom(this.svc.GetById({ user_id: userId, workspace_id: workspaceId, id }));
  }

  async getOverview(userId: string, workspace_id: string, params?: BaseSearchQueryDto): Promise<TeamListDto> {
    return await firstValueFrom(this.svc.GetOverview({ user_id: userId, workspace_id, params }));
  }

  async update(userId: string, workspaceId: string, id: string, dto: UpdateTeamDto): Promise<TeamDto> {
    return await firstValueFrom(this.svc.Update({ user_id: userId, workspace_id: workspaceId, id, dto }));
  }

  async remove(userId: string, workspaceId: string, id: string): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.Delete({ user_id: userId, workspace_id: workspaceId, id }));
  }

  // =============================
  // Team Members RPC wrappers
  // =============================

  async addMember(userId: string, teamId: string, dto: AddTeamMemberDto): Promise<TeamMemberDto> {
    return await firstValueFrom(this.membersSvc.Create({ user_id: userId, team_id: teamId, dto }));
  }

  async getMembersByTeamId(userId: string, teamId: string): Promise<TeamMemberDto[]> {
    const res = await firstValueFrom(this.membersSvc.GetByTeamId({ user_id: userId, team_id: teamId }));
    return res.items;
  }

  async getMemberById(userId: string, teamId: string, id: string): Promise<TeamMemberDto> {
    return await firstValueFrom(this.membersSvc.GetById({ user_id: userId, team_id: teamId, id }));
  }

  async getMembersOverview(userId: string, teamId: string, params?: BaseSearchQueryDto): Promise<TeamMemberListDto> {
    return await firstValueFrom(this.membersSvc.GetOverview({ user_id: userId, team_id: teamId, params }));
  }

  async updateMember(userId: string, teamId: string, id: string, dto: UpdateTeamMemberDto): Promise<TeamMemberDto> {
    return await firstValueFrom(this.membersSvc.Update({ user_id: userId, team_id: teamId, id, dto }));
  }

  async removeMember(userId: string, teamId: string, id: string): Promise<{ success: boolean }> {
    return await firstValueFrom(this.membersSvc.Delete({ user_id: userId, team_id: teamId, id }));
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const res = await firstValueFrom(this.membersSvc.IsMember({ team_id: teamId, user_id: userId }));
    return res.is_member;
  }

  async getUserRole(teamId: string, userId: string): Promise<TeamRole | null | undefined> {
    const res = await firstValueFrom(this.membersSvc.GetUserRole({ team_id: teamId, user_id: userId }));
    return res.role ?? null;
  }

  async hasRight(teamId: string, userId: string, action: "create" | "get" | "update" | "delete", resource: "member" | "project"): Promise<boolean> {
    const res = await firstValueFrom(this.membersSvc.HasRight({ team_id: teamId, user_id: userId, action, resource }));
    return res.allowed;
  }
}
