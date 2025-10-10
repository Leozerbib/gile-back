import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { TasksGatewayService } from "libs/shared/utils/src/client/task/tasks.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser } from "@shared/types";
import { CreateTaskDto, UpdateTaskDto, TaskDto, TaskListDto, BaseSearchQueryDto } from "@shared/types";
import { normalizeObject } from "@shared/utils";

/**
 * REST API Gateway Controller for Tasks
 *
 * Exposes Task service operations via REST endpoints
 * Handles HTTP requests and delegates to gRPC gateway service
 */
@ApiTags("Tasks")
@Controller("project/:projectId/tasks")
export class TasksGatewayController {
  constructor(private readonly tasks: TasksGatewayService) {}

  /**
   * GET /tasks
   * List tasks within an epic with search and pagination
   */
  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "List tasks within an epic with search and pagination" })
  @ApiQuery({
    name: "epic_id",
    required: true,
    schema: { type: "integer" },
  })
  @ApiQuery({
    name: "search",
    required: false,
    schema: { type: "string", nullable: true },
  })
  @ApiQuery({
    name: "skip",
    required: false,
    schema: { type: "integer", minimum: 0, default: 0, nullable: true },
  })
  @ApiQuery({
    name: "take",
    required: false,
    schema: { type: "integer", minimum: 1, default: 25, nullable: true },
  })
  @ApiQuery({
    name: "_sort",
    required: false,
    schema: {
      type: "string",
      example: "createdAt|updatedAt|title|status|priority|dueDate",
      nullable: true,
    },
  })
  @ApiQuery({
    name: "_order",
    required: false,
    schema: { type: "string", example: "asc|desc", nullable: true },
  })
  @ApiOkResponse({ type: TaskListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Query("epic_id") epicId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("_sort") sort?: string,
    @Query("_order") order?: string,
  ): Promise<TaskListDto> {
    const epicIdNum = Number(epicId);
    if (!epicId || Number.isNaN(epicIdNum)) {
      throw new BadRequestException("epic_id is required and must be a valid number");
    }

    const isNullish = (v?: string) => v == null || v === "" || v.toLowerCase?.() === "null";

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
    } as BaseSearchQueryDto;

    const result = await this.tasks.search(Number(projectId), user.user_id, epicIdNum, params);
    return normalizeObject(result) as TaskListDto;
  }

  /**
   * GET /tasks/overview
   * Get tasks overview for an epic
   */
  @Get("overview")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get tasks overview for an epic" })
  @ApiQuery({
    name: "epic_id",
    required: true,
    schema: { type: "integer" },
  })
  @ApiQuery({
    name: "search",
    required: false,
    schema: { type: "string", nullable: true },
  })
  @ApiQuery({
    name: "skip",
    required: false,
    schema: { type: "integer", minimum: 0, default: 0, nullable: true },
  })
  @ApiQuery({
    name: "take",
    required: false,
    schema: { type: "integer", minimum: 1, default: 10, nullable: true },
  })
  @ApiOkResponse({ type: TaskListDto })
  async overview(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Query("epic_id") epicId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ): Promise<TaskListDto> {
    const epicIdNum = Number(epicId);
    if (!epicId || Number.isNaN(epicIdNum)) {
      throw new BadRequestException("epic_id is required and must be a valid number");
    }

    const s = Number(skip);
    const t = Number(take);

    const params: BaseSearchQueryDto = {
      search: search || undefined,
      skip: !Number.isNaN(s) ? s : 0,
      take: !Number.isNaN(t) ? t : 10,
    } as BaseSearchQueryDto;

    const res = await this.tasks.getOverview(Number(projectId), user.user_id, epicIdNum, params);
    return res;
  }

  /**
   * GET /tasks/:id
   * Get a task by ID
   */
  @Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a task by ID" })
  @ApiOkResponse({ type: TaskDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string): Promise<TaskDto> {
    const taskId = Number(id);
    if (Number.isNaN(taskId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    const result = await this.tasks.findById(Number(projectId), user.user_id, taskId);
    return normalizeObject(result) as TaskDto;
  }

  /**
   * POST /tasks
   * Create a new task
   */
  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new task" })
  @ApiQuery({
    name: "epic_id",
    required: true,
    schema: { type: "integer" },
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiOkResponse({ type: TaskDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Query("epic_id") epicId: string, @Body() body: CreateTaskDto) {
    const epicIdNum = Number(epicId);
    if (!epicId || Number.isNaN(epicIdNum)) {
      throw new BadRequestException("epic_id is required and must be a valid number");
    }

    const result = await this.tasks.create(Number(projectId), user.user_id, epicIdNum, body);
    return normalizeObject(result) as TaskDto;
  }

  /**
   * PUT /tasks/:id
   * Update a task by ID
   */
  @Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a task by ID" })
  @ApiBody({ type: UpdateTaskDto })
  @ApiOkResponse({ type: TaskDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string, @Body() body: UpdateTaskDto) {
    const taskId = Number(id);
    if (Number.isNaN(taskId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    const result = await this.tasks.update(Number(projectId), user.user_id, taskId, body);
    return normalizeObject(result) as TaskDto;
  }

  /**
   * DELETE /tasks/:id
   * Delete a task by ID
   */
  @Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a task by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("projectId") projectId: string, @Param("id") id: string) {
    const taskId = Number(id);
    if (Number.isNaN(taskId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    await this.tasks.remove(Number(projectId), user.user_id, taskId);
  }
}
