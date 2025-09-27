import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SprintsGatewayService } from "./sprints.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import { CreateSprintDto, UpdateSprintDto, SprintDto, SprintsListDto, SprintOverview, BaseSearchQueryDto } from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";
import { normalizeWithRequiredFields, normalizeObject } from "@shared/utils";

@ApiTags("Sprints")
@Controller("sprints")
export class SprintsGatewayController {
  constructor(private readonly sprints: SprintsGatewayService) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all sprints with filters" })
  @ApiQuery({ name: "projectId", required: false, schema: { type: "integer", minimum: 1, nullable: true } })
  @ApiQuery({ name: "status", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 50, nullable: true } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "_sort", required: false, schema: { type: "string", nullable: true, example: "createdAt|name|startDate|endDate|status|version|updatedAt" } })
  @ApiQuery({ name: "_order", required: false, schema: { type: "string", nullable: true, example: "asc|desc" } })
  @ApiQuery({ name: "groupBy", required: false, schema: { type: "string", nullable: true, example: "status|version|startDate|endDate|createdAt|updatedAt" } })
  @ApiQuery({ name: "subGroupBy", required: false, schema: { type: "string", nullable: true, example: "version|status" } })
  @ApiQuery({ name: "dateGranularity", required: false, schema: { type: "string", nullable: true, example: "day|week|month|year" } })
  @ApiQuery({ name: "filter", required: false, schema: { type: "string", nullable: true, example: '{"status_in":["Active","Planned"],"createdAt_gte":"2025-01-01"}' } })
  @ApiOkResponse({ type: SprintsListDto })
  async listSprints(
    @CurrentUser() user: AuthenticatedUser,
    @Query("projectId") projectId?: string,
    @Query("status") status?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("search") search?: string,
    @Query("_sort") sort?: string,
    @Query("_order") order?: string,
    @Query("groupBy") groupBy?: string,
    @Query("subGroupBy") subGroupBy?: string,
    @Query("dateGranularity") dateGranularity?: string,
    @Query("filter") filter?: string,
  ) {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    let filterObj: Record<string, unknown> | undefined;
    if (!isNullish(filter)) {
      try {
        const parsed: unknown = JSON.parse(String(filter));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          filterObj = parsed as Record<string, unknown>;
        }
      } catch {
        // ignore invalid filter JSON
      }
    }

    const params: BaseSearchQueryDto = {
      search: !isNullish(search) ? search : undefined,
      skip: !isNullish(skip) ? Number(skip) : undefined,
      take: !isNullish(take) ? Number(take) : undefined,
      sortBy: !isNullish(sort)
        ? [
            {
              field: String(sort),
              order: order?.toUpperCase() === "ASC" || order?.toUpperCase() === "DESC" ? (order.toUpperCase() as "ASC" | "DESC") : ("DESC" as const),
            },
          ]
        : undefined,
      groupBy: !isNullish(groupBy) ? ({ field: groupBy } as any) : undefined,
      subGroupBy: !isNullish(subGroupBy) ? ({ field: subGroupBy } as any) : undefined,
      filters: {
        ...(filterObj ?? {}),
        project_id: !isNullish(projectId) ? Number(projectId) : undefined,
        status: !isNullish(status) ? status : undefined,
      },
    } as BaseSearchQueryDto;

    const res = await this.sprints.search(user, params);
    return normalizeWithRequiredFields(res, ["items", "total", "skip", "take"]);
  }

@Get("options")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get sprint options for dropdowns" })
  @ApiQuery({ name: "projectId", required: false, schema: { type: "integer", minimum: 1, nullable: true } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 20, nullable: true } })
  async listSprintOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("projectId") projectId?: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    try {
      const pid = !isNullish(projectId) ? Number(projectId) : undefined;
      if (projectId && Number.isNaN(Number(projectId))) {
        throw new Error(`Invalid projectId param: ${projectId}`);
      }
      const res = await this.sprints.search(user, {
        search: !isNullish(search) ? search : undefined,
        skip: !isNullish(skip) ? Number(skip) : 0,
        take: !isNullish(take) ? Number(take) : 20,
        sortBy: [
          { field: "created_at", order: "DESC" as const },
        ],
        filters: { project_id: pid },
      } as BaseSearchQueryDto);
      return normalizeObject({
        items: (res.items ?? []).map((s: { id: number; Name?: string | null; name?: string | null; Version?: unknown; Status?: unknown }) => ({
          id: s.id,
          name: s.Name ?? s.name ?? "",
          version: (s.Version as string | number | null) ?? null,
          status: (s.Status as string | null) ?? null,
        })),
        total: res.total ?? 0,
        skip: res.skip ?? 0,
        take: res.take ?? 20,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Sprints options failed: ${msg}`);
    }
  }

@Get("active")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get active sprint" })
  @ApiQuery({ name: "workspace_id", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "project_ids", required: false, schema: { type: "string", nullable: true, example: "1,2,3" } })
  @ApiOkResponse({ type: SprintDto })
  async getActiveSprint(@CurrentUser() user: AuthenticatedUser, @Query("workspace_id") workspaceId?: string, @Query("project_ids") projectIds?: string) {
    const projectIdArray = projectIds
      ? projectIds
          .split(",")
          .map(id => Number(id.trim()))
          .filter(id => !isNaN(id))
      : undefined;

    const sprint = await this.sprints.findActiveSprint(user, workspaceId, projectIdArray?.[0]);
    return normalizeWithRequiredFields(sprint, [
      "id",
      "name",
      "project_id",
      "start_date",
      "end_date",
      "actual_start_date",
      "actual_end_date",
      "version",
      "status",
      "velocity",
      "capacity",
      "review_notes",
      "retrospective_notes",
      "created_at",
      "updated_at",
    ]);
  }

@Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get sprint by ID" })
  @ApiOkResponse({ type: SprintDto })
  async getSprint(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<SprintDto> {
    const sprint = await this.sprints.findById(id, user);
    return normalizeWithRequiredFields(sprint, [
      "id",
      "name",
      "project_id",
      "start_date",
      "end_date",
      "actual_start_date",
      "actual_end_date",
      "version",
      "status",
      "velocity",
      "capacity",
      "review_notes",
      "retrospective_notes",
      "created_at",
      "updated_at",
    ]);
  }

@Get(":id/overview")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get sprints overview by project ID" })
  @ApiOkResponse({ type: SprintOverview })
  async getSprintOverview(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Query("skip") skip?: string, @Query("take") take?: string, @Query("search") search?: string): Promise<SprintsListDto> {
    const projectId = Number(id);
    if (Number.isNaN(projectId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }
    const s = Number(skip);
    const t = Number(take);
    const params: BaseSearchQueryDto = {
      skip: !Number.isNaN(s) ? s : 0,
      take: !Number.isNaN(t) ? t : 10,
      search: search || undefined,
    } as BaseSearchQueryDto;
    const overview = await this.sprints.getOverview(user, projectId, params);
    return overview;
  }

@Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new sprint" })
  @ApiBody({ type: CreateSprintDto })
  @ApiOkResponse({ type: SprintDto })
  async createSprint(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateSprintDto) {
    const sprint = await this.sprints.create(user, body);
    return normalizeWithRequiredFields(sprint, [
      "id",
      "name",
      "project_id",
      "start_date",
      "end_date",
      "actual_start_date",
      "actual_end_date",
      "version",
      "status",
      "velocity",
      "capacity",
      "review_notes",
      "retrospective_notes",
      "created_at",
      "updated_at",
    ]);
  }

@Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a sprint by ID" })
  @ApiBody({ type: UpdateSprintDto })
  @ApiOkResponse({ type: SprintDto })
  async updateSprint(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: UpdateSprintDto) {
    const sprint = await this.sprints.update(id, body, user);
    return normalizeWithRequiredFields(sprint, [
      "id",
      "name",
      "project_id",
      "start_date",
      "end_date",
      "actual_start_date",
      "actual_end_date",
      "version",
      "status",
      "velocity",
      "capacity",
      "review_notes",
      "retrospective_notes",
      "created_at",
      "updated_at",
    ]);
  }

@Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a sprint by ID" })
  async deleteSprint(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.sprints.remove(id, user);
  }
}
