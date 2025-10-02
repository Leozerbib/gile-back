import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { EpicsGatewayService } from "libs/shared/utils/src/client/epic/epics.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import type { AuthenticatedUser } from "@shared/types";
import { CreateEpicDto, UpdateEpicDto, EpicDto, EpicListDto, BaseSearchQueryDto } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Epics")
@Controller("epics")
export class EpicsGatewayController {
  constructor(private readonly epics: EpicsGatewayService) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "List epics within a project with search and pagination" })
  @ApiQuery({ name: "project_id", required: true, schema: { type: "integer" } })
  @ApiQuery({ name: "search", required: false, schema: { type: "string", nullable: true } })
  @ApiQuery({ name: "skip", required: false, schema: { type: "integer", minimum: 0, default: 0, nullable: true } })
  @ApiQuery({ name: "take", required: false, schema: { type: "integer", minimum: 1, default: 25, nullable: true } })
  @ApiQuery({ name: "_sort", required: false, schema: { type: "string", example: "created_at|updated_at|title|status|priority|progress", nullable: true } })
  @ApiQuery({ name: "_order", required: false, schema: { type: "string", example: "asc|desc", nullable: true } })
  @ApiOkResponse({ type: EpicListDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("project_id") projectId: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("_sort") sort?: string,
    @Query("_order") order?: string,
  ): Promise<EpicListDto> {
    const projectIdNum = Number(projectId);
    if (!projectId || Number.isNaN(projectIdNum)) {
      throw new BadRequestException("project_id is required and must be a valid number");
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

    const result = await this.epics.search(user.user_id, projectIdNum, params);
    return normalizeObject(result) as EpicListDto;
  }

  @Get(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get an epic by ID" })
  @ApiOkResponse({ type: EpicDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<EpicDto> {
    const epicId = Number(id);
    if (Number.isNaN(epicId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    const result = await this.epics.findById(user.user_id, epicId);
    return normalizeObject(result) as EpicDto;
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new epic" })
  @ApiBody({ type: CreateEpicDto })
  @ApiOkResponse({ type: EpicDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateEpicDto) {
    const result = await this.epics.create(user.user_id, body);
    return normalizeObject(result) as EpicDto;
  }

  @Put(":id")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update an epic by ID" })
  @ApiBody({ type: UpdateEpicDto })
  @ApiOkResponse({ type: EpicDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: UpdateEpicDto) {
    const epicId = Number(id);
    if (Number.isNaN(epicId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    const result = await this.epics.update(user.user_id, epicId, body);
    return normalizeObject(result) as EpicDto;
  }

  @Delete(":id")
  @Auth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: "Delete an epic by ID" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const epicId = Number(id);
    if (Number.isNaN(epicId)) {
      throw new BadRequestException(`Invalid id param: ${id}`);
    }

    await this.epics.remove(user.user_id, epicId);
  }
}
