import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser, BaseSearchQueryDto } from "@shared/types";
import { AddWorkspaceMemberDto, UpdateWorkspaceMemberDto, WorkspaceMemberDto, WorkspaceMembersListDto } from "@shared/types";
import { normalizeObject } from "@shared/utils";
import { WorkspaceMembersGatewayService } from "libs/shared/utils/src/client/workspace/member.client";

@ApiTags("Workspaces")
@ApiBearerAuth()
@Controller("workspaces/:workspaceId/members")
export class WorkspaceMemberGatewayController {
  constructor(private readonly members: WorkspaceMembersGatewayService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: "List workspace members with search and pagination" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 25, nullable: true } })
  @ApiOkResponse({ type: WorkspaceMembersListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ): Promise<WorkspaceMembersListDto> {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");

    const params: BaseSearchQueryDto = {
      search: search || undefined,
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
    } as BaseSearchQueryDto;

    const res = await this.members.getOverview(user.user_id, workspaceId, params);
    return normalizeObject(res) as WorkspaceMembersListDto;
  }

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiOperation({ summary: "Add a member to a workspace" })
  @ApiBody({ type: AddWorkspaceMemberDto })
  @ApiOkResponse({ type: WorkspaceMemberDto })
  async addMember(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Body() body: AddWorkspaceMemberDto): Promise<WorkspaceMemberDto> {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    const res = await this.members.addMember(user.user_id, workspaceId, body);
    return normalizeObject(res) as WorkspaceMemberDto;
  }

  @Get("is-member")
  @Auth()
  @ApiOperation({ summary: "Check if a user is a member of the workspace" })
  async isMember(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string): Promise<{ is_member: boolean }> {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    const res = await this.members.isMember(user.user_id, workspaceId);
    return normalizeObject(res) as { is_member: boolean };
  }

  @Get("role")
  @Auth()
  @ApiOperation({ summary: "Get a user's role in the workspace" })
  async getUserRole(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string): Promise<{ role: string }> {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    const res = await this.members.getUserRole(user.user_id, workspaceId);
    return normalizeObject(res) as { role: string };
  }

  @Get("has-right/:action/:resource")
  @Auth()
  @ApiOperation({ summary: "Check if a user has a specific right in the workspace" })
  async hasRight(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Param("action") action: string,
    @Param("resource") resource: string,
  ): Promise<{ has_right: boolean }> {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    const res = await this.members.hasRight(user.user_id, workspaceId, action, resource);
    return normalizeObject(res) as { has_right: boolean };
  }

  // Place parameterized routes after fixed-string routes to avoid shadowing
  @Get(":memberId")
  @Auth()
  @ApiOperation({ summary: "Get a workspace member by ID" })
  @ApiOkResponse({ type: WorkspaceMemberDto })
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("memberId") memberId: string): Promise<WorkspaceMemberDto> {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    const res = await this.members.getById(workspaceId, memberId);
    return normalizeObject(res) as WorkspaceMemberDto;
  }

  @Put(":memberId")
  @Auth()
  @ApiOperation({ summary: "Update a workspace member" })
  @ApiBody({ type: UpdateWorkspaceMemberDto })
  @ApiOkResponse({ type: WorkspaceMemberDto })
  async updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Param("memberId") memberId: string,
    @Body() body: UpdateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberDto> {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    const res = await this.members.updateMember(user.user_id, workspaceId, memberId, body);
    return normalizeObject(res) as WorkspaceMemberDto;
  }

  @Delete(":memberId")
  @Auth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a workspace member" })
  async deleteMember(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("memberId") memberId: string) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.members.deleteMember(user.user_id, workspaceId, memberId);
  }
}
