import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { TicketsGatewayService } from "libs/shared/utils/src/client/ticket/tickets.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketDto,
  TicketsListDto,
  BaseSearchQueryDto,
  SortOrder,
  FilterRule,
  FilterOperator,
  FilterValueType,
  TicketSortField,
  TicketGroupField,
  TicketSubGroupField,
  GroupByOption,
  Granularity,
} from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Tickets")
@ApiBearerAuth()
@Controller("tickets")
export class TicketsGatewayController {
  constructor(private readonly tickets: TicketsGatewayService) {}

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiOperation({ summary: "Create a new ticket" })
  @ApiBody({ type: CreateTicketDto })
  @ApiOkResponse({ type: TicketDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTicketDto): Promise<TicketDto> {
    const ticket = await this.tickets.create(user.user_id, body);
    return normalizeObject(ticket) as TicketDto;
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: "Get all tickets with filters" })
  @ApiQuery({ name: "project_id", required: false, schema: { type: "integer", minimum: 1, nullable: true } })
  @ApiQuery({
    name: "filter",
    required: false,
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          type: { type: "string", enum: Object.values(FilterValueType) },
          op: { type: "string", enum: Object.values(FilterOperator) },
          values: { type: "array", items: { type: "string" } },
        },
      },
      nullable: true,
      examples: {
        rules: {
          summary: "Rule-based filters",
          value: '[{"field":"status","type":"enum","op":"in","values":["TODO","ACTIVE"]},{"field":"createdAt","type":"date","op":"between","values":["2025-01-01","2025-12-31"]}]',
        },
        legacy: {
          summary: "Legacy object filters",
          value: '{"status_in":["TODO","ACTIVE"],"createdAt_gte":"2025-01-01"}',
        },
      },
    },
  })
  @ApiQuery({
    name: "sort",
    required: false,
    schema: { type: "string", enum: Object.values(TicketSortField), nullable: true },
  })
  @ApiQuery({ name: "groupBy", required: false, schema: { type: "string", enum: Object.values(TicketGroupField), nullable: true } })
  @ApiQuery({ name: "subGroupBy", required: false, schema: { type: "string", enum: Object.values(TicketSubGroupField), nullable: true } })
  @ApiQuery({ name: "dateGranularity", required: false, schema: { type: "string", enum: Object.values(Granularity), nullable: true } })
  @ApiQuery({ name: "order", required: false, schema: { type: "string", nullable: true, enum: Object.values(SortOrder) } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 50, nullable: true } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiOkResponse({ type: TicketsListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("project_id") projectId?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("search") search?: string,
    @Query("groupBy") groupBy?: string,
    @Query("subGroupBy") subGroupBy?: string,
    @Query("dateGranularity") dateGranularity?: string,
    @Body("filter") filter?: FilterRule[],
  ): Promise<TicketsListDto> {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    const inSet = (v?: string, allowed?: readonly string[]) => (v && allowed?.includes(v) ? v : undefined);
    const granularity = !isNullish(dateGranularity) ? String(dateGranularity) : "day";
    let filterObj: Record<string, unknown> | undefined;
    const filterRules: FilterRule[] | undefined = filter;

    const extraRules: FilterRule[] = [];
    if (!isNullish(projectId)) extraRules.push({ field: "project_id", type: FilterValueType.NUMBER, op: FilterOperator.EQ, value: Number(projectId) });

    const sortField = inSet(sort, Object.values(TicketSortField));
    const groupField = inSet(groupBy, Object.values(TicketGroupField));
    const subGroupField = inSet(subGroupBy, Object.values(TicketSubGroupField));
    const params: BaseSearchQueryDto = {
      search: !isNullish(search) ? search : undefined,
      skip: !isNullish(skip) ? Number(skip) : undefined,
      take: !isNullish(take) ? Number(take) : undefined,
      sortBy: sortField
        ? [
            {
              field: String(sortField),
              order: order?.toUpperCase() === "ASC" ? SortOrder.ASC : SortOrder.DESC,
            },
          ]
        : undefined,
      groupBy: groupField ? ({ field: String(groupField), fieldGranularity: granularity } as GroupByOption) : undefined,
      subGroupBy: subGroupField ? ({ field: String(subGroupField), fieldGranularity: granularity } as GroupByOption) : undefined,
      filters: filterRules
        ? [...filterRules, ...extraRules]
        : {
            ...(filterObj ?? {}),
            project_id: !isNullish(projectId) ? Number(projectId) : undefined,
          },
    } as BaseSearchQueryDto;

    const res = await this.tickets.findAll(user.user_id, params);
    return normalizeObject(res) as TicketsListDto;
  }

  @Get("options")
  @Auth()
  @ApiOperation({ summary: "Get ticket options for dropdowns" })
  @ApiQuery({ name: "project_id", required: false, schema: { type: "integer", minimum: 1, nullable: true } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 20, nullable: true } })
  async listTicketOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("project_id") project_id?: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    try {
      const pid = !isNullish(project_id) ? Number(project_id) : undefined;
      if (project_id && Number.isNaN(Number(project_id))) {
        throw new Error(`Invalid project_id param: ${project_id}`);
      }
      const res = await this.tickets.findAll(user.user_id, {
        search: !isNullish(search) ? search : undefined,
        skip: !isNullish(skip) ? Number(skip) : 0,
        take: !isNullish(take) ? Number(take) : 20,
        filters: [{ field: "project_id", type: FilterValueType.NUMBER, op: FilterOperator.EQ, value: pid }],
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
  async get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: number): Promise<TicketDto> {
    const ticket = await this.tickets.findById(id, user.user_id);
    return normalizeObject(ticket) as TicketDto;
  }

  @Put(":id")
  @Auth()
  @ApiOperation({ summary: "Update a ticket by ID" })
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkResponse({ type: TicketDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: UpdateTicketDto): Promise<TicketDto> {
    const ticket = await this.tickets.update(id, body, user.user_id);
    return normalizeObject(ticket) as TicketDto;
  }

  @Delete(":id")
  @Auth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a ticket by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.tickets.remove(id, user.user_id);
  }
}
