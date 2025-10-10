import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiExtraModels } from "@nestjs/swagger";
import { SprintsGatewayService } from "libs/shared/utils/src/client/sprint/sprints.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import { plainToInstance } from "class-transformer";
import {
  CreateSprintDto,
  UpdateSprintDto,
  SprintDto,
  SprintsListDto,
  BaseSearchQueryDto,
  GroupByOption,
  SortOrder,
  SprintSortField,
  SprintGroupField,
  SprintSubGroupField,
  Granularity,
  FilterRule,
} from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Sprints")
@ApiExtraModels(FilterRule)
@ApiBearerAuth()
@Controller("project/:projectId/sprints")
export class SprintsGatewayController {
  constructor(private readonly sprints: SprintsGatewayService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: "List sprints with search and pagination" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 50, nullable: true } })
  @ApiQuery({ name: "sort", required: false, schema: { type: "string", enum: Object.values(SprintSortField), nullable: true } })
  @ApiQuery({ name: "order", required: false, schema: { type: "string", enum: Object.values(SortOrder), nullable: true } })
  @ApiQuery({ name: "groupBy", required: false, schema: { type: "string", enum: Object.values(SprintGroupField), nullable: true } })
  @ApiQuery({ name: "subGroupBy", required: false, schema: { type: "string", enum: Object.values(SprintSubGroupField), nullable: true } })
  @ApiQuery({ name: "dateGranularity", required: false, schema: { type: "string", enum: Object.values(Granularity), nullable: true } })
  @ApiQuery({
    name: "filter",
    required: false,
    type: [FilterRule],
  })
  @ApiOkResponse({ type: SprintsListDto })
  async listSprints(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
    @Query("groupBy") groupBy?: string,
    @Query("subGroupBy") subGroupBy?: string,
    @Query("dateGranularity") dateGranularity?: string,
    @Query("filter") filter?: string | string[],
  ): Promise<SprintsListDto> {
    if (!projectId) {
      throw new BadRequestException("project_id is required");
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

    const inSet = (v?: string, allowed?: readonly string[]) => (v && allowed?.includes(v) ? v : undefined);
    const sortField = inSet(sort, Object.values(SprintSortField));
    const groupField = inSet(groupBy, Object.values(SprintGroupField));
    const subGroupField = inSet(subGroupBy, Object.values(SprintSubGroupField));
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

    const result = await this.sprints.search(user.user_id, Number(projectId), params);
    return normalizeObject(result) as SprintsListDto;
  }

  @Get("overview")
  @Auth()
  @ApiOperation({ summary: "Get sprint overview for dropdowns" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 20, nullable: true } })
  async listSprintOverview(
    @CurrentUser() _user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    try {
      const res = await this.sprints.getOverview(_user.user_id, Number(projectId), {
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
  @ApiOkResponse({ type: SprintDto })
  async getActiveSprint(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string) {
    const sprint = await this.sprints.findActiveSprint(user.user_id, Number(projectId));
    return normalizeObject(sprint);
  }

  @Get(":id")
  @Auth()
  @ApiOperation({ summary: "Get sprint by ID" })
  @ApiOkResponse({ type: SprintDto })
  async getSprint(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string): Promise<SprintDto> {
    const sprint = await this.sprints.findById(id, user.user_id);
    return normalizeObject(sprint) as SprintDto;
  }

  @Post()
  @Auth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new sprint" })
  @ApiBody({ type: CreateSprintDto })
  @ApiOkResponse({ type: SprintDto })
  async createSprint(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Body() body: CreateSprintDto) {
    const sprint = await this.sprints.create(user.user_id, body);
    return normalizeObject(sprint) as SprintDto;
  }

  @Put(":id")
  @Auth()
  @ApiOperation({ summary: "Update a sprint by ID" })
  @ApiBody({ type: UpdateSprintDto })
  @ApiOkResponse({ type: SprintDto })
  async updateSprint(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string, @Body() body: UpdateSprintDto) {
    const sprint = await this.sprints.update(id, body, user.user_id);
    return normalizeObject(sprint) as SprintDto;
  }

  @Delete(":id")
  @Auth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a sprint by ID" })
  async deleteSprint(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string) {
    return normalizeObject(await this.sprints.remove(id, user.user_id));
  }
}
