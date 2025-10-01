import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { WorkspaceMembersService } from "./workspace-members.service";
import { AddWorkspaceMemberDto, UpdateWorkspaceMemberDto, WorkspaceMemberDto, WorkspaceMembersListDto, WorkspaceRole, BaseSearchQueryDto } from "@shared/types";

@Controller()
export class WorkspaceMembersController {
  constructor(
    private readonly membersService: WorkspaceMembersService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  // Add a member to a workspace
  @GrpcMethod("WorkspaceMembers", "AddMember")
  async addMember(data: { user_id?: string; workspace_id: string; dto: AddWorkspaceMemberDto }): Promise<WorkspaceMemberDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.addMember",
      message: `gRPC AddMember request for workspace ${data.workspace_id}`,
      data,
    });

    const result = await this.membersService.create(data.workspace_id, data.dto, data.user_id);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.addMember",
      message: `gRPC AddMember response for workspace ${data.workspace_id}`,
      data: result,
    });

    return result;
  }

  // Get workspace members overview with pagination/search
  @GrpcMethod("WorkspaceMembers", "GetOverview")
  async getMembersOverview(data: { workspace_id: string; params?: BaseSearchQueryDto }): Promise<WorkspaceMembersListDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.getOverview",
      message: `gRPC GetOverview members request for workspace ${data.workspace_id}`,
      data,
    });

    const result = await this.membersService.getOverview(data.workspace_id, data.params);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.getOverview",
      message: `gRPC GetOverview members response for workspace ${data.workspace_id}`,
      data: { total: result.total, count: result.items.length },
    });

    return result;
  }

  // Get a member by ID
  @GrpcMethod("WorkspaceMembers", "GetById")
  async getMemberById(data: { id: string }): Promise<WorkspaceMemberDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.getById",
      message: `gRPC GetById member request ${data.id}`,
      data,
    });

    const result = await this.membersService.getById(data.id);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.getById",
      message: `gRPC GetById member response ${data.id}`,
      data: result,
    });
    return result;
  }

  // Update a workspace member
  @GrpcMethod("WorkspaceMembers", "UpdateMember")
  async updateMember(data: { id: string; dto: UpdateWorkspaceMemberDto; updated_by?: string }): Promise<WorkspaceMemberDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.updateMember",
      message: `gRPC UpdateMember request ${data.id}`,
      data,
    });

    const result = await this.membersService.update(data.id, data.dto, data.updated_by);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.updateMember",
      message: `gRPC UpdateMember response ${data.id}`,
      data: result,
    });

    return result;
  }

  // Delete a workspace member
  @GrpcMethod("WorkspaceMembers", "DeleteMember")
  async deleteMember(data: { id: string; deleted_by?: string }): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.deleteMember",
      message: `gRPC DeleteMember request ${data.id}`,
      data,
    });

    const result = await this.membersService.delete(data.id, data.deleted_by);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.deleteMember",
      message: `gRPC DeleteMember response ${data.id}`,
      data: result,
    });

    return result;
  }

  // Check if user is a workspace member
  @GrpcMethod("WorkspaceMembers", "IsMember")
  async isMember(data: { workspace_id: string; user_id: string }): Promise<{ is_member: boolean }> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.isMember",
      message: `gRPC IsMember request for workspace ${data.workspace_id}`,
      data,
    });

    const isMember = await this.membersService.isMember(data.workspace_id, data.user_id);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.isMember",
      message: `gRPC IsMember response for workspace ${data.workspace_id}`,
      data: { is_member: isMember },
    });

    return { is_member: isMember };
  }

  // Get user role within a workspace
  @GrpcMethod("WorkspaceMembers", "GetUserRole")
  async getUserRole(data: { workspace_id: string; user_id: string }): Promise<{ role: WorkspaceRole | null }> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.getUserRole",
      message: `gRPC GetUserRole request for workspace ${data.workspace_id}`,
      data,
    });

    const role = await this.membersService.getUserRole(data.workspace_id, data.user_id);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.getUserRole",
      message: `gRPC GetUserRole response for workspace ${data.workspace_id}`,
      data: { role },
    });

    return { role };
  }

  // Check if user has rights for an action on a resource within workspace
  @GrpcMethod("WorkspaceMembers", "HasRight")
  async hasRight(data: {
    workspace_id: string;
    user_id: string;
    action: "create" | "get" | "update" | "delete" | "assign";
    resource: "workspace" | "project" | "label" | "agent" | "prompt" | "member" | "team";
  }): Promise<{ has_right: boolean }> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.hasRight",
      message: `gRPC HasRight request for workspace ${data.workspace_id}`,
      data,
    });

    const hasRight = await this.membersService.hasRight(data.workspace_id, data.user_id, data.action, data.resource);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspace-members.grpc.hasRight",
      message: `gRPC HasRight response for workspace ${data.workspace_id}`,
      data: { has_right: hasRight },
    });

    return { has_right: hasRight };
  }
}
