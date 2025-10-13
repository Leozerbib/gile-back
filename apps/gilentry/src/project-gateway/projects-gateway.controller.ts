import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiExtraModels } from "@nestjs/swagger";
import { ProjectsGatewayService } from "libs/shared/utils/src/client/project/projects.client";
import { TeamsGatewayService } from "libs/shared/utils/src/client/team/teams.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser, TeamMemberListDto } from "@shared/types";
import { plainToInstance } from "class-transformer";
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  ProjectsListDto,
  TeamOverview,
  TeamMemberDto,
  BaseSearchQueryDto,
  SortOrder,
  FilterRule,
  ProjectSortField,
  ProjectGroupField,
  ProjectSubGroupField,
  GroupByOption,
  Granularity,
} from "@shared/types";
import { normalizeObject, normalizeWithRequiredFields } from "@shared/utils";

@ApiTags("Projects")
@ApiExtraModels(FilterRule)
@Controller("projects")
export class ProjectsGatewayController {
  constructor(
    private readonly projects: ProjectsGatewayService,
    private readonly teams: TeamsGatewayService,
  ) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "List projects with search and pagination" })
  @ApiQuery({ name: "workspace_id", required: true, schema: { type: "string" } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 25, nullable: true } })
  @ApiQuery({ name: "sort", required: false, schema: { type: "string", enum: Object.values(ProjectSortField), nullable: true } })
  @ApiQuery({ name: "order", required: false, schema: { type: "string", enum: Object.values(SortOrder), nullable: true } })
  @ApiQuery({ name: "groupBy", required: false, schema: { type: "string", enum: Object.values(ProjectGroupField), nullable: true } })
  @ApiQuery({ name: "subGroupBy", required: false, schema: { type: "string", enum: Object.values(ProjectSubGroupField), nullable: true } })
  @ApiQuery({ name: "dateGranularity", required: false, schema: { type: "string", enum: Object.values(Granularity), nullable: true } })
  @ApiQuery({
    name: "filter",
    required: false,
    type: [FilterRule],
  })
  @ApiOkResponse({ type: ProjectsListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("workspace_id") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
    @Query("groupBy") groupBy?: string,
    @Query("subGroupBy") subGroupBy?: string,
    @Query("dateGranularity") dateGranularity?: string,
    @Query("filter") filter?: string | string[],
  ): Promise<ProjectsListDto> {
    if (!workspaceId) {
      throw new BadRequestException("workspace_id is required");
    }

    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    // Parse filter query param which may come as JSON string(s)
    const parseFilterParam = (input?: string | string[]): FilterRule[] | undefined => {
      if (input == null) return undefined;
      const raw = Array.isArray(input) ? input : [input];
      const rules: FilterRule[] = [];
      for (const item of raw) {
        if (!item) continue;
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            for (const r of parsed) {
              rules.push(plainToInstance(FilterRule, r));
            }
          } else if (typeof parsed === "object") {
            rules.push(plainToInstance(FilterRule, parsed));
          }
        } catch {
          // Ignore invalid JSON; optionally could log
        }
      }
      return rules.length > 0 ? rules : undefined;
    };
    const filterRules = parseFilterParam(filter);
    // console.log("filterRules", filterRules);
    const inSet = (v?: string, allowed?: readonly string[]) => (v && allowed?.includes(v) ? v : undefined);
    const sortField = inSet(sort, Object.values(ProjectSortField));
    const groupField = inSet(groupBy, Object.values(ProjectGroupField));
    const subGroupField = inSet(subGroupBy, Object.values(ProjectSubGroupField));
    const granularity = !isNullish(dateGranularity) ? String(dateGranularity) : "day";
    const params: BaseSearchQueryDto = {
      search: !isNullish(search) ? search : undefined,
      skip: !isNullish(skip) ? Number(skip) : undefined,
      take: !isNullish(take) ? Number(take) : undefined,
      sortBy: sortField
        ? {
            field: String(sortField),
            order: order?.toUpperCase() === "ASC" ? SortOrder.ASC : SortOrder.DESC,
          }
        : undefined,
      groupBy: groupField ? ({ field: String(groupField), fieldGranularity: granularity } as GroupByOption) : undefined,
      subGroupBy: subGroupField ? ({ field: String(subGroupField), fieldGranularity: granularity } as GroupByOption) : undefined,
      filters: filterRules,
    } as BaseSearchQueryDto;

    const result = await this.projects.search(user.user_id, workspaceId, params);
    return normalizeObject(result) as ProjectsListDto;
  }

  @Get("overview")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get projects overview for a workspace" })
  @ApiQuery({ name: "workspace_id", required: true, schema: { type: "string" } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 10, nullable: true } })
  @ApiOkResponse({ type: ProjectsListDto })
  async overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query("workspace_id") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ): Promise<ProjectsListDto> {
    if (!workspaceId) {
      throw new BadRequestException("workspace_id is required");
    }
    const s = Number(skip);
    const t = Number(take);
    const params: BaseSearchQueryDto = {
      search: search || undefined,
      skip: !Number.isNaN(s) ? s : 0,
      take: !Number.isNaN(t) ? t : 10,
    } as BaseSearchQueryDto;
    const res = await this.projects.getOverview(user.user_id, workspaceId, params);
    return res;
  }

  @Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a project by ID" })
  @ApiOkResponse({ type: ProjectDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<ProjectDto> {
    const projectId = Number(id);
    if (Number.isNaN(projectId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }
    const result = await this.projects.findById(user.user_id, projectId);
    return normalizeObject(result) as ProjectDto;
  }

  @Get(":id/team")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the team of a project" })
  @ApiOkResponse({ type: TeamOverview })
  async getTeam(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<TeamOverview> {
    const projectId = Number(id);
    if (Number.isNaN(projectId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }
    const res = await this.projects.getTeam(user.user_id, projectId);
    return normalizeWithRequiredFields(res, ["id", "name", "slug", "is_active"]);
  }

  @Get(":id/team/members")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get team members for a project" })
  @ApiOkResponse({ type: [TeamMemberDto] })
  async getTeamMembers(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<TeamMemberListDto> {
    const projectId = Number(id);
    if (Number.isNaN(projectId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    // First get the team for the project
    const team = await this.projects.getTeam(user.user_id, projectId);

    // Then get the team members using the team ID
    const result = await this.teams.getMembersOverview(user.user_id, team.id);
    return result;
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new project" })
  @ApiQuery({ name: "workspace_id", required: true, schema: { type: "string" } })
  @ApiBody({ type: CreateProjectDto })
  @ApiOkResponse({ type: ProjectDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Query("workspace_id") workspaceId: string, @Body() body: CreateProjectDto) {
    if (!workspaceId) {
      throw new BadRequestException("workspace_id is required");
    }

    console.log("body", body);
    const result = await this.projects.create(user.user_id, workspaceId, body);
    return normalizeObject(result) as ProjectDto;
  }

  @Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a project by ID" })
  @ApiBody({ type: UpdateProjectDto })
  @ApiOkResponse({ type: ProjectDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: UpdateProjectDto) {
    const projectId = Number(id);
    if (Number.isNaN(projectId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }
    const result = await this.projects.update(user.user_id, projectId, body);
    return normalizeObject(result) as ProjectDto;
  }

  @Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a project by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const projectId = Number(id);
    if (Number.isNaN(projectId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }
    await this.projects.remove(user.user_id, projectId);
  }
}
