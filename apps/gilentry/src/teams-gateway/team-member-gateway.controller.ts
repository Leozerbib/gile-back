import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser, BaseSearchQueryDto } from "@shared/types";
import { AddTeamMemberDto, UpdateTeamMemberDto, TeamMemberDto, TeamMemberListDto } from "@shared/types";
import { normalizeObject } from "@shared/utils";
import { TeamsGatewayService } from "libs/shared/utils/src/client/team/teams.client";

@ApiTags("Teams")
@Controller("workspaces/:workspaceId/team/:teamId/members")
export class TeamMemberGatewayController {
  constructor(private readonly teams: TeamsGatewayService) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "List team members with search and pagination" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 25, nullable: true } })
  @ApiOkResponse({ type: TeamMemberListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Param("teamId") teamId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ): Promise<TeamMemberListDto> {
    if (!workspaceId) throw new BadRequestException("workspace_id is required");
    if (!teamId) throw new BadRequestException("team_id is required");
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    const params: BaseSearchQueryDto = {
      search: !isNullish(search) ? search : undefined,
      skip: !isNullish(skip) ? Number(skip) : undefined,
      take: !isNullish(take) ? Number(take) : undefined,
    } as BaseSearchQueryDto;
    const result = await this.teams.getMembersOverview(user.user_id, teamId, params);
    return normalizeObject(result) as TeamMemberListDto;
  }

  @Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a team member by ID" })
  @ApiOkResponse({ type: TeamMemberDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("teamId") teamId: string, @Param("id") id: string): Promise<TeamMemberDto> {
    if (!workspaceId) throw new BadRequestException("workspace_id is required");
    if (!teamId) throw new BadRequestException("team_id is required");
    const result = await this.teams.getMemberById(user.user_id, teamId, id);
    return normalizeObject(result) as TeamMemberDto;
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Add a new team member" })
  @ApiBody({ type: AddTeamMemberDto })
  @ApiOkResponse({ type: TeamMemberDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("teamId") teamId: string, @Body() body: AddTeamMemberDto) {
    if (!workspaceId) throw new BadRequestException("workspace_id is required");
    if (!teamId) throw new BadRequestException("team_id is required");
    const result = await this.teams.addMember(user.user_id, teamId, body);
    return normalizeObject(result) as TeamMemberDto;
  }

  @Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a team member by ID" })
  @ApiBody({ type: UpdateTeamMemberDto })
  @ApiOkResponse({ type: TeamMemberDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Param("teamId") teamId: string,
    @Param("id") id: string,
    @Body() body: UpdateTeamMemberDto,
  ) {
    if (!workspaceId) throw new BadRequestException("workspace_id is required");
    if (!teamId) throw new BadRequestException("team_id is required");
    const result = await this.teams.updateMember(user.user_id, teamId, id, body);
    return normalizeObject(result) as TeamMemberDto;
  }

  @Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Remove a team member by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("teamId") teamId: string, @Param("id") id: string) {
    if (!workspaceId) throw new BadRequestException("workspace_id is required");
    if (!teamId) throw new BadRequestException("team_id is required");
    await this.teams.removeMember(user.user_id, teamId, id);
  }
}
