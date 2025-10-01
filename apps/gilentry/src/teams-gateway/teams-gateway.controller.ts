import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser, BaseSearchQueryDto } from "@shared/types";
import { CreateTeamDto, UpdateTeamDto, TeamDto, TeamListDto } from "@shared/types";
import { normalizeObject } from "@shared/utils";
import { TeamsGatewayService } from "libs/shared/utils/src/client/team/teams.client";

@ApiTags("Teams")
@Controller("workspaces/:workspaceId/teams")
export class TeamsGatewayController {
  constructor(private readonly teams: TeamsGatewayService) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "List teams in a workspace with search and pagination" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 25, nullable: true } })
  @ApiOkResponse({ type: TeamListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ): Promise<TeamListDto> {
    if (!workspaceId) throw new BadRequestException("workspace_id is required");
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    const params: BaseSearchQueryDto = {
      search: !isNullish(search) ? search : undefined,
      skip: !isNullish(skip) ? Number(skip) : undefined,
      take: !isNullish(take) ? Number(take) : undefined,
    } as BaseSearchQueryDto;
    const result = await this.teams.getOverview(user.user_id, workspaceId, params);
    return normalizeObject(result) as TeamListDto;
  }

  @Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a team by ID" })
  @ApiOkResponse({ type: TeamDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("id") id: string): Promise<TeamDto> {
    const result = await this.teams.findById(user.user_id, workspaceId, id);
    return normalizeObject(result) as TeamDto;
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new team" })
  @ApiBody({ type: CreateTeamDto })
  @ApiOkResponse({ type: TeamDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Body() body: CreateTeamDto) {
    if (!workspaceId) throw new BadRequestException("workspace_id is required");
    const result = await this.teams.create(user.user_id, workspaceId, body);
    return normalizeObject(result) as TeamDto;
  }

  @Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a team by ID" })
  @ApiBody({ type: UpdateTeamDto })
  @ApiOkResponse({ type: TeamDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("id") id: string, @Body() body: UpdateTeamDto) {
    const result = await this.teams.update(user.user_id, workspaceId, id, body);
    return normalizeObject(result) as TeamDto;
  }

  @Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a team by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("id") id: string) {
    await this.teams.remove(user.user_id, workspaceId, id);
  }
}
