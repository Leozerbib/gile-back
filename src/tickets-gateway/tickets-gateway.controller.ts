import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { TicketsGatewayService } from "./tickets.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import { CreateTicketDto, UpdateTicketDto, TicketDto, TicketsListDto, BaseSearchQueryDto } from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";

@ApiTags("Tickets")
@Controller("tickets")
export class TicketsGatewayController {
  constructor(private readonly tickets: TicketsGatewayService) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all tickets with filters" })
  @ApiQuery({ name: "project_id", required: false, schema: { type: "integer", minimum: 1, nullable: true } })
  @ApiQuery({ name: "sprint_id", required: false, schema: { type: "integer", minimum: 1, nullable: true } })
  @ApiQuery({ name: "sprintIds", required: false, schema: { type: "string", nullable: true, example: "1,2,3" } })
  @ApiQuery({ name: "status", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "statusIn", required: false, schema: { type: "string", nullable: true, example: "Todo,Active" } })
  @ApiQuery({ name: "priority", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "priorityIn", required: false, schema: { type: "string", nullable: true, example: "Low,High" } })
  @ApiQuery({ name: "category", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "categoryIn", required: false, schema: { type: "string", nullable: true, example: "Task,Bug" } })
  @ApiQuery({ name: "assignToIn", required: false, schema: { type: "string", nullable: true, example: "user-uuid-1,user-uuid-2" } })
  @ApiQuery({ name: "labelIds", required: false, schema: { type: "string", nullable: true, example: "3,5,9" } })
  @ApiQuery({
    name: "_sort",
    required: false,
    schema: { type: "string", nullable: true, example: "createdAt|updatedAt|title|status|priority|category|story_points|sprint|assignee" },
  })
  @ApiQuery({ name: "_order", required: false, schema: { type: "string", nullable: true, example: "asc|desc" } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 50, nullable: true } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiOkResponse({ type: TicketsListDto })
  async listTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query("project_id") projectId?: string,
    @Query("sprint_id") sprintId?: string,
    @Query("sprintIds") sprintIds?: string,
    @Query("status") status?: string,
    @Query("statusIn") statusIn?: string,
    @Query("priority") priority?: string,
    @Query("priorityIn") priorityIn?: string,
    @Query("category") category?: string,
    @Query("categoryIn") categoryIn?: string,
    @Query("assignToIn") assignToIn?: string,
    @Query("labelIds") labelIds?: string,
    @Query("_sort") sort?: string,
    @Query("_order") order?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("search") search?: string,
  ) {
    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";
    const listIds = !isNullish(sprintIds)
      ? String(sprintIds)
          .split(",")
          .map(s => Number(s.trim()))
          .filter(n => Number.isFinite(n) && n > 0)
      : undefined;
    const parseList = (v?: string): string[] | undefined =>
      !isNullish(v)
        ? String(v)
            .split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0)
        : undefined;
    const parseNumList = (v?: string): number[] | undefined =>
      !isNullish(v)
        ? String(v)
            .split(",")
            .map(s => Number(s.trim()))
            .filter(n => Number.isFinite(n) && n > 0)
        : undefined;

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
      filters: {
        project_id: !isNullish(projectId) ? Number(projectId) : undefined,
        sprint_id: !isNullish(sprintId) ? Number(sprintId) : undefined,
        sprint_ids: listIds && listIds.length ? listIds : undefined,
        status: !isNullish(status) ? status : undefined,
        status_in: parseList(statusIn),
        priority: !isNullish(priority) ? priority : undefined,
        priority_in: parseList(priorityIn),
        category: !isNullish(category) ? category : undefined,
        category_in: parseList(categoryIn),
        assign_to_in: parseList(assignToIn),
        label_ids: parseNumList(labelIds),
      },
    } as BaseSearchQueryDto;

    const res = await this.tickets.search(user, params);

    return res;
  }

  @Get("options")
  @Auth()
  @ApiBearerAuth()
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
      const res = await this.tickets.search(user, {
        search: !isNullish(search) ? search : undefined,
        skip: !isNullish(skip) ? Number(skip) : 0,
        take: !isNullish(take) ? Number(take) : 20,
        filters: { project_id: pid },
      });
      // Convertir les Timestamps en strings pour l'API
      const items = (res.items ?? []).map((t: { id: number; Name?: string | null; title?: string | null }) => {
        return { id: t.id, name: t.Name ?? t.title ?? "" };
      });

      return {
        items,
        total: res.total ?? 0,
        skip: res.skip ?? 0,
        take: res.take ?? 20,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Tickets options failed: ${msg}`);
    }
  }

  @Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get ticket by ID" })
  @ApiOkResponse({ type: TicketDto })
  async getTicket(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const ticket = await this.tickets.findById(id, user);
    return ticket;
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new ticket" })
  @ApiBody({ type: CreateTicketDto })
  @ApiOkResponse({ type: TicketDto })
  async createTicket(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTicketDto) {
    const ticket = await this.tickets.create(user, body);

    return ticket;
  }

  @Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a ticket by ID" })
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkResponse({ type: TicketDto })
  async updateTicket(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: UpdateTicketDto) {
    const ticket = await this.tickets.update(id, body, user);

    return ticket;
  }

  @Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a ticket by ID" })
  async deleteTicket(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.tickets.remove(id, user);
  }
}
