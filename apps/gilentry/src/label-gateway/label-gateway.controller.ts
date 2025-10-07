import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { LabelGatewayService } from "libs/shared/utils/src/client/workspace/label.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser } from "@shared/types";
import { CreateLabelDto, UpdateLabelDto, LabelDto, LabelsListDto, BaseSearchQueryDto, FilterOperator, FilterValueType } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Label")
@ApiBearerAuth()
@Controller("workspaces/:workspaceId/label")
export class LabelGatewayController {
  constructor(private readonly labels: LabelGatewayService) {}

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiOperation({ summary: "Create a new label in workspace" })
  @ApiBody({ type: CreateLabelDto })
  @ApiOkResponse({ type: LabelDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Body() body: CreateLabelDto): Promise<LabelDto> {
    // Ensure workspace_id is set from the URL parameter
    const labelDto = { ...body, workspace_id: workspaceId };
    const result = await this.labels.create(user.user_id, labelDto, workspaceId);
    return normalizeObject(result) as LabelDto;
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: "List labels in workspace with search and pagination" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 10, nullable: true } })
  @ApiQuery({ name: "_sort", required: false, schema: { type: "string", example: "createdAt|updatedAt|name", nullable: true } })
  @ApiQuery({ name: "_order", required: false, schema: { type: "string", example: "asc|desc", nullable: true } })
  @ApiOkResponse({ type: LabelsListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("_sort") sort?: string,
    @Query("_order") order?: string,
  ): Promise<LabelsListDto> {
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
      // Add workspace filter
      filters: [
        {
          field: "workspace_id",
          type: FilterValueType.NUMBER,
          op: FilterOperator.EQ,
          value: workspaceId,
        },
      ],
    } as BaseSearchQueryDto;

    const result = await this.labels.findAll(params, workspaceId);
    return normalizeObject(result) as LabelsListDto;
  }

  @Get("overview")
  @Auth()
  @ApiOperation({ summary: "Get label overviews in workspace" })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 100, nullable: true } })
  @ApiOkResponse({ type: LabelsListDto })
  async getOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Param("workspaceId") workspaceId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ): Promise<LabelsListDto> {
    const params: BaseSearchQueryDto = {
      search: search ?? "",
      skip: skip ?? 0,
      take: take ?? 10,
      // Add workspace filter
      filters: [
        {
          field: "workspace_id",
          type: FilterValueType.NUMBER,
          op: FilterOperator.EQ,
          value: workspaceId,
        },
      ],
    } as BaseSearchQueryDto;

    const result = await this.labels.getOverview(user.user_id, params, workspaceId);
    return normalizeObject(result) as LabelsListDto;
  }

  @Get(":id")
  @Auth()
  @ApiOperation({ summary: "Get a label by ID in workspace" })
  @ApiOkResponse({ type: LabelDto })
  async findById(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("id") id: string): Promise<LabelDto> {
    const result = await this.labels.findById(id, user.user_id, workspaceId);
    return normalizeObject(result) as LabelDto;
  }

  @Put(":id")
  @Auth()
  @ApiOperation({ summary: "Update a label by ID in workspace" })
  @ApiBody({ type: UpdateLabelDto })
  @ApiOkResponse({ type: LabelDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("id") id: string, @Body() body: UpdateLabelDto): Promise<LabelDto> {
    // First verify the label belongs to the workspace
    const result = await this.labels.update(id, body, user.user_id, workspaceId);
    return normalizeObject(result) as LabelDto;
  }

  @Delete(":id")
  @Auth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a label by ID in workspace" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("workspaceId") workspaceId: string, @Param("id") id: string): Promise<{ success: boolean }> {
    const result = await this.labels.remove(id, user.user_id, workspaceId);
    return result;
  }
}
