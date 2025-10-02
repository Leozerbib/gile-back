import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { EpicsService } from "./epics.service";
import type { BaseSearchQueryDto } from "@shared/types";
import { CreateEpicDto, UpdateEpicDto, EpicDto, EpicListDto } from "@shared/types";

@Controller()
export class EpicsController {
  constructor(
    private readonly epicsService: EpicsService,
    private readonly logger: LoggerClientService,
  ) {}

  // Create a new epic
  @GrpcMethod("EpicsService", "Create")
  async create(data: { user_id: string; epic: CreateEpicDto }): Promise<EpicDto> {
    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.create", message: "gRPC Create epic request", data: { user_id: data.user_id, epic: { ...data.epic } } });

    const epic = await this.epicsService.create(data.user_id, data.epic);

    await this.logger.log({
      level: "info",
      service: "epic",
      func: "epics.grpc.create",
      message: "gRPC Create epic response",
      data: { epicId: epic.id, projectId: epic.project_id },
    });

    return epic;
  }

  // Search epics within a project
  @GrpcMethod("EpicsService", "Search")
  async search(data: { user_id: string; project_id: number | string; params?: BaseSearchQueryDto }): Promise<EpicListDto> {
    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.search", message: "gRPC Search epics request", data });

    const pid = typeof data.project_id === "string" ? Number(data.project_id) : data.project_id;
    const list = await this.epicsService.search(data.user_id, pid, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "epic",
      func: "epics.grpc.search",
      message: "gRPC Search epics response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  // Get epics overview for a project
  @GrpcMethod("EpicsService", "GetOverview")
  async getOverview(data: { user_id: string; project_id: number | string; params?: BaseSearchQueryDto }): Promise<EpicListDto> {
    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.getOverview", message: "gRPC GetOverview epics request", data });

    const pid = typeof data.project_id === "string" ? Number(data.project_id) : data.project_id;
    const list = await this.epicsService.getOverview(data.user_id, pid, data.params ?? {});

    return list;
  }

  // Get epic by ID
  @GrpcMethod("EpicsService", "GetById")
  async getById(data: { user_id: string; id: number | string }): Promise<EpicDto> {
    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.getById", message: `gRPC GetById epic request for id ${data.id}`, data });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const epic = await this.epicsService.getById(id, data.user_id);

    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.getById", message: `gRPC GetById epic response for id ${data.id}`, data: { epicId: epic?.id } });

    return epic;
  }

  // Update epic
  @GrpcMethod("EpicsService", "Update")
  async update(data: { user_id: string; id: number | string; epic: UpdateEpicDto }): Promise<EpicDto> {
    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.update", message: `gRPC Update epic request for id ${data.id}`, data: { user_id: data.user_id, id: data.id, epic: { ...data.epic } } });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const epic = await this.epicsService.update(id, data.epic, data.user_id);

    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.update", message: `gRPC Update epic response for id ${data.id}`, data: { epicId: epic.id } });

    return epic;
  }

  // Delete epic
  @GrpcMethod("EpicsService", "Delete")
  async delete(data: { user_id: string; id: number | string }): Promise<Record<string, never>> {
    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.delete", message: `gRPC Delete epic request for id ${data.id}`, data });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    await this.epicsService.delete(id, data.user_id);

    await this.logger.log({ level: "info", service: "epic", func: "epics.grpc.delete", message: `gRPC Delete epic response for id ${data.id}` });

    return {} as Record<string, never>;
  }
}
