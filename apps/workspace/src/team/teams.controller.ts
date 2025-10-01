import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { TeamsService } from "./teams.service";
import { TeamMembersService } from "./team-members.service";
import type { BaseSearchQueryDto } from "@shared/types";
import { CreateTeamDto, UpdateTeamDto, TeamDto, TeamListDto } from "@shared/types";
import { AddTeamMemberDto, UpdateTeamMemberDto, TeamMemberDto, TeamMemberListDto } from "@shared/types";
import type { TeamRole } from "@prisma/client";

@Controller()
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly logger: LoggerClientService,
  ) {}

  // Create a new team
  @GrpcMethod("Teams", "Create")
  async create(data: { user_id: string; workspace_id: string; dto: CreateTeamDto }): Promise<TeamDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.create",
      message: "gRPC Create team request",
      data,
    });

    const team = await this.teamsService.create(data.user_id, data.workspace_id, data.dto);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.create",
      message: "gRPC Create team response",
      data: { teamId: team.id, workspaceId: data.dto.workspace_id },
    });

    return team;
  }

  // Get team by ID
  @GrpcMethod("Teams", "GetById")
  async getById(data: { user_id: string; workspace_id: string; id: string }): Promise<TeamDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.getById",
      message: `gRPC GetById team request for id ${data.id}`,
      data,
    });

    const team = await this.teamsService.getById(data.workspace_id, data.id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.getById",
      message: `gRPC GetById team response for id ${data.id}`,
      data: { teamId: team?.id },
    });

    return team;
  }

  // Get teams overview within a workspace
  @GrpcMethod("Teams", "GetOverview")
  async getOverview(data: { user_id: string; workspace_id: string; params?: BaseSearchQueryDto }): Promise<TeamListDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.getOverview",
      message: `gRPC GetOverview teams request for workspace ${data.workspace_id}`,
      data,
    });

    const list = await this.teamsService.getOverview(data.user_id, data.workspace_id, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.getOverview",
      message: "gRPC GetOverview teams response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  // Update team
  @GrpcMethod("Teams", "Update")
  async update(data: { user_id: string; workspace_id: string; id: string; dto: UpdateTeamDto }): Promise<TeamDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.update",
      message: `gRPC Update team request for id ${data.id}`,
      data,
    });

    const team = await this.teamsService.update(data.workspace_id, data.id, data.user_id, data.dto);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.update",
      message: `gRPC Update team response for id ${data.id}`,
      data: { teamId: team?.id },
    });

    // teamsService.update currently can return null on unexpected error paths; enforce non-null for gRPC
    if (!team) {
      throw new Error("Failed to update team");
    }

    return team;
  }

  // Delete team
  @GrpcMethod("Teams", "Delete")
  async delete(data: { user_id: string; workspace_id: string; id: string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.delete",
      message: `gRPC Delete team request for id ${data.id}`,
      data,
    });

    await this.teamsService.delete(data.workspace_id, data.id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "teams.grpc.delete",
      message: `gRPC Delete team response for id ${data.id}`,
      data: { success: true },
    });

    return { success: true };
  }

  // =============================
  // Team Members gRPC Endpoints
  // =============================

  // Add a member to a team
  @GrpcMethod("TeamMembers", "Create")
  async createMember(data: { team_id: string; dto: AddTeamMemberDto; user_id: string }): Promise<TeamMemberDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.create",
      message: `gRPC Create team member request for team ${data.team_id}`,
      data,
    });

    const member = await this.teamMembersService.create(data.team_id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.create",
      message: "gRPC Create team member response",
      data: { id: member.id, teamId: data.team_id },
    });

    return member;
  }

  // Get all members for a team
  @GrpcMethod("TeamMembers", "GetByTeamId")
  async getMembersByTeamId(data: { team_id: string; user_id: string }): Promise<TeamMemberDto[]> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getByTeamId",
      message: `gRPC GetByTeamId members request for team ${data.team_id}`,
      data,
    });

    const members = await this.teamMembersService.getByTeamId(data.team_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getByTeamId",
      message: "gRPC GetByTeamId members response",
      data: { teamId: data.team_id, count: members.length },
    });

    return members;
  }

  // Get a team member by member ID
  @GrpcMethod("TeamMembers", "GetById")
  async getMemberById(data: { team_id: string; id: string; user_id: string }): Promise<TeamMemberDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getById",
      message: `gRPC GetById team member request for id ${data.id}`,
      data,
    });

    const member = await this.teamMembersService.getById(data.team_id, data.id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getById",
      message: `gRPC GetById team member response for id ${data.id}`,
      data: { id: member.id, teamId: data.team_id },
    });

    return member;
  }

  // Get members overview (paginated)
  @GrpcMethod("TeamMembers", "GetOverview")
  async getMembersOverview(data: { team_id: string; user_id: string; params?: BaseSearchQueryDto }): Promise<TeamMemberListDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getOverview",
      message: `gRPC GetOverview team members request for team ${data.team_id}`,
      data,
    });

    const list = await this.teamMembersService.getOverview(data.team_id, data.user_id, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getOverview",
      message: "gRPC GetOverview team members response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  // Update a team member
  @GrpcMethod("TeamMembers", "Update")
  async updateMember(data: { team_id: string; id: string; dto: UpdateTeamMemberDto; user_id: string }): Promise<TeamMemberDto> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.update",
      message: `gRPC Update team member request for id ${data.id}`,
      data,
    });

    const updated = await this.teamMembersService.update(data.team_id, data.id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.update",
      message: `gRPC Update team member response for id ${data.id}`,
      data: { id: updated?.id },
    });

    if (!updated) {
      throw new Error("Failed to update team member");
    }

    return updated;
  }

  // Delete a team member
  @GrpcMethod("TeamMembers", "Delete")
  async deleteMember(data: { team_id: string; id: string; user_id: string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.delete",
      message: `gRPC Delete team member request for id ${data.id}`,
      data,
    });

    await this.teamMembersService.delete(data.team_id, data.id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.delete",
      message: `gRPC Delete team member response for id ${data.id}`,
      data: { success: true },
    });

    return { success: true };
  }

  // Check if a user is a member of the team
  @GrpcMethod("TeamMembers", "IsMember")
  async isMember(data: { team_id: string; user_id: string }): Promise<{ is_member: boolean }> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.isMember",
      message: `gRPC IsMember request for team ${data.team_id}`,
      data,
    });

    const is_member = await this.teamMembersService.isMember(data.team_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.isMember",
      message: "gRPC IsMember response",
      data: { teamId: data.team_id, userId: data.user_id, is_member },
    });

    return { is_member };
  }

  // Get a user's role within the team
  @GrpcMethod("TeamMembers", "GetUserRole")
  async getUserRole(data: { team_id: string; user_id: string }): Promise<{ role: TeamRole | null }> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getUserRole",
      message: `gRPC GetUserRole request for team ${data.team_id}`,
      data,
    });

    const role = await this.teamMembersService.getUserRole(data.team_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.getUserRole",
      message: "gRPC GetUserRole response",
      data: { teamId: data.team_id, userId: data.user_id, role },
    });

    return { role };
  }

  // Check if a user has rights for a given action/resource within the team
  @GrpcMethod("TeamMembers", "HasRight")
  async hasRight(data: {
    team_id: string;
    user_id: string;
    action: "create" | "get" | "update" | "delete";
    resource: "member" | "project" | "sprint" | "ticket" | "task" | "epic" | "stack";
  }): Promise<{ allowed: boolean }> {
    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.hasRight",
      message: `gRPC HasRight request for team ${data.team_id}`,
      data,
    });

    const allowed = await this.teamMembersService.hasRight(data.team_id, data.user_id, data.action, data.resource);

    await this.logger.log({
      level: "info",
      service: "workspace",
      func: "team-members.grpc.hasRight",
      message: "gRPC HasRight response",
      data: { teamId: data.team_id, userId: data.user_id, action: data.action, resource: data.resource, allowed },
    });

    return { allowed };
  }
}
