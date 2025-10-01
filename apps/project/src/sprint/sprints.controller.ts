import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { CreateSprintDto, UpdateSprintDto, SprintDto, BaseSearchQueryDto, SprintsListDto } from "@shared/types";
import { SprintsService } from "./sprints.service";

@Controller()
export class SprintsController {
  constructor(
    private readonly sprintsService: SprintsService,
    private readonly logger: LoggerClientService,
  ) {}

  @GrpcMethod("SprintsService", "Create")
  async create(data: { ownerId: string; dto: CreateSprintDto }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.create",
      message: "gRPC Create sprint request",
      data,
    });

    const sprint = await this.sprintsService.create(data.ownerId, data.dto);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.create",
      message: "gRPC Create sprint response",
      data: { sprintId: sprint.id },
    });

    return sprint;
  }

  @GrpcMethod("SprintsService", "Search")
  async search(data: { params?: BaseSearchQueryDto; userId?: string }): Promise<SprintsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.search",
      message: "gRPC Search sprints request",
      data,
    });

    const list = await this.sprintsService.search(data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.search",
      message: "gRPC Search sprints response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  @GrpcMethod("SprintsService", "GetById")
  async getById(data: { id: string; userId?: string; includeMetrics?: boolean }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getById",
      message: `gRPC GetById sprint request for id ${data.id}`,
      data,
    });

    const sprint = await this.sprintsService.getById(data.id, data.userId ?? "");

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getById",
      message: `gRPC GetById sprint response for id ${data.id}`,
      data: { sprintId: sprint?.id },
    });

    return sprint;
  }

  @GrpcMethod("SprintsService", "GetOverview")
  async getOverview(data: { projectId: number; params?: BaseSearchQueryDto; userId?: string }): Promise<SprintsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getOverview",
      message: `gRPC GetOverview sprints request for project ${data.projectId}`,
      data,
    });

    const list = await this.sprintsService.getOverview(data.projectId, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getOverview",
      message: "gRPC GetOverview sprints response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  @GrpcMethod("SprintsService", "FindActiveSprint")
  async findActiveSprint(data: { workspaceId?: string; projectId?: number; userId?: string }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.findActiveSprint",
      message: "gRPC FindActiveSprint request",
      data,
    });

    const sprint = await this.sprintsService.findActiveSprints(data.workspaceId ?? "", data.projectId ?? 0);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.findActiveSprint",
      message: "gRPC FindActiveSprint response",
      data: { sprintId: sprint?.id },
    });

    return sprint;
  }

  @GrpcMethod("SprintsService", "Update")
  async update(data: { id: string; dto: UpdateSprintDto; updatedBy?: string }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.update",
      message: `gRPC Update sprint request for id ${data.id}`,
      data,
    });

    const sprint = await this.sprintsService.update(data.id, data.dto, data.updatedBy ?? "");

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.update",
      message: `gRPC Update sprint response for id ${data.id}`,
      data: { sprintId: sprint.id },
    });

    return sprint;
  }

  @GrpcMethod("SprintsService", "Delete")
  async delete(data: { id: string; deletedBy?: string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.delete",
      message: `gRPC Delete sprint request for id ${data.id}`,
      data,
    });

    const success = await this.sprintsService.delete(data.id, data.deletedBy ?? "");

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.delete",
      message: `gRPC Delete sprint response for id ${data.id}`,
      data: { success },
    });

    return { success };
  }
}
