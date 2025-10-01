import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { WorkspaceGatewayService } from "libs/shared/utils/src/client/workspace/workspace.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser } from "@shared/types";
import { CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceDto, WorkspacesListDto, WorkspaceOverview, BaseSearchQueryDto } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Workspaces")
@ApiBearerAuth()
@Controller("workspaces")
export class WorkspaceGatewayController {
  constructor(private readonly workspaces: WorkspaceGatewayService) {}

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiOperation({ summary: "Create a new workspace" })
  @ApiBody({ type: CreateWorkspaceDto })
  @ApiOkResponse({ type: WorkspaceDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const result = await this.workspaces.create(user.user_id, body);
    return normalizeObject(result) as WorkspaceDto;
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: "List workspaces with search and pagination" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 10, nullable: true } })
  @ApiQuery({ name: "_sort", required: false, schema: { type: "string", example: "createdAt|updatedAt|name|slug", nullable: true } })
  @ApiQuery({ name: "_order", required: false, schema: { type: "string", example: "asc|desc", nullable: true } })
  @ApiOkResponse({ type: WorkspacesListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("_sort") sort?: string,
    @Query("_order") order?: string,
  ): Promise<WorkspacesListDto> {
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

    const result = await this.workspaces.findAll(params);
    return normalizeObject(result) as WorkspacesListDto;
  }

  @Get("my-workspaces")
  @Auth()
  @ApiOperation({ summary: "Get current user's workspace overviews" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 100, nullable: true } })
  @ApiOkResponse({ type: WorkspacesListDto })
  async getMyWorkspaces(
    @CurrentUser() user: AuthenticatedUser,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ): Promise<WorkspacesListDto> {
    const params: BaseSearchQueryDto = {
      search: search ?? "",
      skip: skip ?? 0,
      take: take ?? 10,
    } as BaseSearchQueryDto;

    const result = await this.workspaces.getOverview(user.user_id, params);
    return result;
  }

  @Get(":id")
  @Auth()
  @ApiOperation({ summary: "Get a workspace by ID" })
  @ApiOkResponse({ type: WorkspaceDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<WorkspaceDto> {
    const result = await this.workspaces.findById(id, user.user_id);
    return normalizeObject(result) as WorkspaceDto;
  }

  @Put(":id")
  @Auth()
  @ApiOperation({ summary: "Update a workspace by ID" })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiOkResponse({ type: WorkspaceDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: UpdateWorkspaceDto): Promise<WorkspaceDto> {
    const result = await this.workspaces.update(id, body, user.user_id);
    return normalizeObject(result) as WorkspaceDto;
  }

  @Delete(":id")
  @Auth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a workspace by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<{ success: boolean }> {
    return normalizeObject(await this.workspaces.remove(id, user.user_id));
  }
}
