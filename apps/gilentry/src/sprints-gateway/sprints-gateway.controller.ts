import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SprintsGatewayService } from "libs/shared/utils/src/client/sprint/sprints.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import { CreateSprintDto, UpdateSprintDto, SprintDto, SprintsListDto, SprintOverview, BaseSearchQueryDto } from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Sprints")
@ApiBearerAuth()
@Controller("sprints")
export class SprintsGatewayController {
  constructor(private readonly sprints: SprintsGatewayService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: "List sprints with search and pagination" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "projectId", required: false, schema: { type: "integer", minimum: 1, nullable: true } })
  @ApiQuery({ name: "status", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 50, nullable: true } })
  @ApiQuery({ name: "_sort", required: false, schema: { type: "string", example: "createdAt|name|startDate|endDate|status|version|updatedAt", nullable: true } })
  @ApiQuery({ name: "_order", required: false, schema: { type: "string", example: "asc|desc", nullable: true } })
  @ApiQuery({ name: "groupBy", required: false, schema: { type: "string", nullable: true, example: "status|version|startDate|endDate|createdAt|updatedAt" } })
  @ApiQuery({ name: "subGroupBy", required: false, schema: { type: "string", nullable: true, example: "version|status" } })
  @ApiQuery({ name: "dateGranularity", required: false, schema: { type: "string", nullable: true, example: "day|week|month|year" } })
  @ApiQuery({ name: "filter", required: false, schema: { type: "string", nullable: true, example: '{"status_in":["Active","Planned"],"createdAt_gte":"2025-01-01"}' } })
  @ApiOkResponse({ type: SprintsListDto })
  async listSprints(
    @CurrentUser() _user: AuthenticatedUser,
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
        date_granularity: !isNullish(dateGranularity) ? dateGranularity : undefined,
      },
    } as BaseSearchQueryDto;

    const res = await this.sprints.findAll(_user.user_id, params);
    return normalizeObject(res);
  }

  @Get("overview")
  @Auth()
  @ApiOperation({ summary: "Get sprint overview for dropdowns" })
  @ApiQuery({ name: "projectId", required: true, schema: { type: "integer", minimum: 1 } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 20, nullable: true } })
  async listSprintOverview(
    @CurrentUser() _user: AuthenticatedUser,
    @Query("projectId") projectId: number,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    try {
      const res = await this.sprints.getOverview(_user.user_id, projectId, {
        search: !isNullish(search) ? search : undefined,
        skip: !isNullish(skip) ? Number(skip) : 0,
        take: !isNullish(take) ? Number(take) : 20,
      } as BaseSearchQueryDto);
      return normalizeObject(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Sprints options failed: ${msg}`);
    }
  }

  @Get("active")
  @Auth()
  @ApiOperation({ summary: "Get active sprint" })
  @ApiQuery({ name: "projectId", required: true, schema: { type: "integer", minimum: 1 } })
  @ApiOkResponse({ type: SprintDto })
  async getActiveSprint(@CurrentUser() user: AuthenticatedUser, @Query("projectId") projectId: number) {
    const sprint = await this.sprints.findActiveSprint(user.user_id, projectId);
    return normalizeObject(sprint);
  }

  @Get(":id")
  @Auth()
  @ApiOperation({ summary: "Get sprint by ID" })
  @ApiOkResponse({ type: SprintDto })
  async getSprint(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<SprintDto> {
    const sprint = await this.sprints.findById(id, user.user_id);
    return normalizeObject(sprint) as SprintDto;
  }

  @Post()
  @Auth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new sprint" })
  @ApiBody({ type: CreateSprintDto })
  @ApiOkResponse({ type: SprintDto })
  async createSprint(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateSprintDto) {
    const sprint = await this.sprints.create(user.user_id, body);
    return normalizeObject(sprint) as SprintDto;
  }

  @Put(":id")
  @Auth()
  @ApiOperation({ summary: "Update a sprint by ID" })
  @ApiBody({ type: UpdateSprintDto })
  @ApiOkResponse({ type: SprintDto })
  async updateSprint(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: UpdateSprintDto) {
    const sprint = await this.sprints.update(id, body, user.user_id);
    return normalizeObject(sprint) as SprintDto;
  }

  @Delete(":id")
  @Auth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a sprint by ID" })
  async deleteSprint(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return normalizeObject(await this.sprints.remove(id, user.user_id));
  }
}
