import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiExtraModels } from "@nestjs/swagger";
import { TicketsGatewayService } from "libs/shared/utils/src/client/ticket/tickets.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import { plainToInstance } from "class-transformer";
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketDto,
  TicketsListDto,
  BaseSearchQueryDto,
  SortOrder,
  FilterRule,
  TicketSortField,
  TicketGroupField,
  TicketSubGroupField,
  GroupByOption,
  Granularity,
} from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Tickets")
@ApiExtraModels(FilterRule)
@ApiBearerAuth()
@Controller("project/:projectId/tickets")
export class TicketsGatewayController {
  constructor(private readonly tickets: TicketsGatewayService) {}

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiOperation({ summary: "Create a new ticket" })
  @ApiBody({ type: CreateTicketDto })
  @ApiOkResponse({ type: TicketDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Body() body: CreateTicketDto): Promise<TicketDto> {
    const ticket = await this.tickets.create(user.user_id, body);
    return normalizeObject(ticket) as TicketDto;
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: "Get all tickets with filters" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 50, nullable: true } })
  @ApiQuery({
    name: "sort",
    required: false,
    schema: { type: "string", enum: Object.values(TicketSortField), nullable: true },
  })
  @ApiQuery({ name: "order", required: false, schema: { type: "string", nullable: true, enum: Object.values(SortOrder) } })
  @ApiQuery({ name: "groupBy", required: false, schema: { type: "string", enum: Object.values(TicketGroupField), nullable: true } })
  @ApiQuery({ name: "subGroupBy", required: false, schema: { type: "string", enum: Object.values(TicketSubGroupField), nullable: true } })
  @ApiQuery({ name: "dateGranularity", required: false, schema: { type: "string", enum: Object.values(Granularity), nullable: true } })
  @ApiQuery({
    name: "filter",
    required: false,
    type: [FilterRule],
  })
  @ApiOkResponse({ type: TicketsListDto })
  async list(
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
  ): Promise<TicketsListDto> {
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
    const sortField = inSet(sort, Object.values(TicketSortField));
    const groupField = inSet(groupBy, Object.values(TicketGroupField));
    const subGroupField = inSet(subGroupBy, Object.values(TicketSubGroupField));
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

    const result = await this.tickets.search(user.user_id, Number(projectId), params);
    return normalizeObject(result) as TicketsListDto;
  }

  @Get("options")
  @Auth()
  @ApiOperation({ summary: "Get ticket options for dropdowns" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 20, nullable: true } })
  async listTicketOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    try {
      const pid = !isNullish(projectId) ? Number(projectId) : undefined;
      if (projectId && Number.isNaN(Number(projectId))) {
        throw new Error(`Invalid project_id param: ${projectId}`);
      }
      const res = await this.tickets.search(user.user_id, Number(projectId), {
        search: !isNullish(search) ? search : undefined,
        skip: !isNullish(skip) ? Number(skip) : 0,
        take: !isNullish(take) ? Number(take) : 20,
      });

      const normalized = normalizeObject(res) as TicketsListDto;
      const items = (normalized.items ?? []).map((t: { id: number; Name?: string | null; title?: string | null }) => {
        return { id: t.id, name: t.Name ?? t.title ?? "" };
      });

      return {
        items,
        total: normalized.total ?? 0,
        skip: normalized.skip ?? 0,
        take: normalized.take ?? 20,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Tickets options failed: ${msg}`);
    }
  }

  @Get(":id")
  @Auth()
  @ApiOperation({ summary: "Get ticket by ID" })
  @ApiOkResponse({ type: TicketDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: number): Promise<TicketDto> {
    const ticket = await this.tickets.findById(id, user.user_id);
    return normalizeObject(ticket) as TicketDto;
  }

  @Put(":id")
  @Auth()
  @ApiOperation({ summary: "Update a ticket by ID" })
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkResponse({ type: TicketDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string, @Body() body: UpdateTicketDto): Promise<TicketDto> {
    const ticket = await this.tickets.update(id, body, user.user_id);
    return normalizeObject(ticket) as TicketDto;
  }

  @Delete(":id")
  @Auth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a ticket by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string) {
    await this.tickets.remove(id, user.user_id);
  }
}
