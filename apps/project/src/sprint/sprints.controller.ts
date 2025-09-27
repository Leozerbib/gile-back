import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { CreateSprintDto, UpdateSprintDto, SprintDto, AuthenticatedUser, BaseSearchQueryDto, SprintsListDto } from "@shared/types";
import { SprintsService } from "./sprints.service";

@Controller()
export class SprintsController {
  constructor(
    private readonly sprintsService: SprintsService,
    private readonly logger: LoggerClientService,
  ) {}

  @GrpcMethod("Sprints", "Create")
  async create(data: { user: AuthenticatedUser; dto: CreateSprintDto }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.create",
      message: "gRPC Create sprint request",
      data,
    });

    const sprint = await this.sprintsService.create(data.user.userId, data.dto);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.create",
      message: "gRPC Create sprint response",
      data: { sprintId: sprint.id },
    });

    return sprint;
  }

  @GrpcMethod("Sprints", "Search")
  async search(data: { user: AuthenticatedUser; params?: BaseSearchQueryDto }): Promise<SprintsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.search",
      message: "gRPC Search sprints request",
      data,
    });

    const list = await this.sprintsService.findAll(data.user.userId, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.search",
      message: "gRPC Search sprints response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  @GrpcMethod("Sprints", "GetById")
  async getById(data: { user: AuthenticatedUser; id: string }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getById",
      message: `gRPC GetById sprint request for id ${data.id}`,
      data,
    });

    const sprint = await this.sprintsService.findById(data.id, data.user.userId);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getById",
      message: `gRPC GetById sprint response for id ${data.id}`,
      data: { sprintId: sprint?.id },
    });

    return sprint as SprintDto;
  }

  @GrpcMethod("Sprints", "GetOverview")
  async getOverview(data: { user: AuthenticatedUser; project_id: number; params?: BaseSearchQueryDto }): Promise<SprintsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getOverview",
      message: `gRPC GetOverview sprints request for project ${data.project_id}`,
      data,
    });

    const list = await this.sprintsService.getOverview(data.project_id, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.getOverview",
      message: "gRPC GetOverview sprints response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  @GrpcMethod("Sprints", "FindActiveSprint")
  async findActiveSprint(data: { user: AuthenticatedUser; workspace_id?: string; project_id?: number }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.findActiveSprint",
      message: "gRPC FindActiveSprint request",
      data,
    });

    const sprint = await this.sprintsService.findActiveSprints(data.workspace_id ?? "", data.project_id ?? 0);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.findActiveSprint",
      message: "gRPC FindActiveSprint response",
      data: { sprintId: sprint?.id },
    });

    return sprint;
  }

  @GrpcMethod("Sprints", "Update")
  async update(data: { user: AuthenticatedUser; id: string; dto: UpdateSprintDto }): Promise<SprintDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.update",
      message: `gRPC Update sprint request for id ${data.id}`,
      data,
    });

    const sprint = await this.sprintsService.update(data.id, data.dto, data.user.userId);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.update",
      message: `gRPC Update sprint response for id ${data.id}`,
      data: { sprintId: sprint.id },
    });

    return sprint;
  }

  @GrpcMethod("Sprints", "Delete")
  async delete(data: { user: AuthenticatedUser; id: string }): Promise<boolean> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.delete",
      message: `gRPC Delete sprint request for id ${data.id}`,
      data,
    });

    const success = await this.sprintsService.remove(data.id, data.user.userId);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "sprints.grpc.delete",
      message: `gRPC Delete sprint response for id ${data.id}`,
      data: { success },
    });

    return success;
  }
}
