import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { TasksService } from "./tasks.service";
import type { BaseSearchQueryDto } from "@shared/types";
import { CreateTaskDto, UpdateTaskDto, TaskDto, TaskListDto } from "@shared/types";

/**
 * gRPC controller for Tasks service
 * Handles RPC method calls and delegates to the service layer
 */
@Controller()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly logger: LoggerClientService,
  ) {}

  @GrpcMethod("Tasks", "Create")
  async create(data: { project_id: number; user_id: string; epic_id: number; dto: CreateTaskDto }): Promise<TaskDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.create",
      message: "gRPC Create task request",
      data,
    });

    const task = await this.tasksService.create(data.project_id, data.user_id, data.epic_id, data.dto);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.create",
      message: "gRPC Create task response",
      data: { taskId: task.id, epicId: data.epic_id },
    });

    return task;
  }

  @GrpcMethod("Tasks", "Search")
  async search(data: { project_id: number; user_id: string; epic_id: number; params?: BaseSearchQueryDto }): Promise<TaskListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.search",
      message: "gRPC Search tasks request",
      data,
    });

    const list = await this.tasksService.search(data.user_id, data.epic_id, data.project_id, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.search",
      message: "gRPC Search tasks response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  @GrpcMethod("Tasks", "GetById")
  async getById(data: { project_id: number; user_id: string; id: number | string }): Promise<TaskDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.getById",
      message: `gRPC GetById task request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const task = await this.tasksService.getById(id, data.user_id, data.project_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.getById",
      message: `gRPC GetById task response for id ${data.id}`,
      data: { taskId: task?.id },
    });

    return task;
  }

  @GrpcMethod("Tasks", "GetOverview")
  async getOverview(data: { project_id: number; user_id: string; epic_id: number; params?: BaseSearchQueryDto }): Promise<TaskListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.getOverview",
      message: `gRPC GetOverview tasks request for epic ${data.epic_id}`,
      data,
    });

    const list = await this.tasksService.getOverview(data.project_id, data.epic_id, data.user_id, data.params ?? {});

    return list;
  }

  @GrpcMethod("Tasks", "Update")
  async update(data: { project_id: number; user_id: string; id: number | string; dto: UpdateTaskDto }): Promise<TaskDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.update",
      message: `gRPC Update task request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const task = await this.tasksService.update(id, data.project_id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.update",
      message: `gRPC Update task response for id ${data.id}`,
      data: { taskId: task.id },
    });

    return task;
  }

  @GrpcMethod("Tasks", "Delete")
  async delete(data: { project_id: number; user_id: string; id: number | string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.delete",
      message: `gRPC Delete task request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const result = await this.tasksService.delete(id, data.project_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "tasks.grpc.delete",
      message: `gRPC Delete task response for id ${data.id}`,
      data: { result },
    });

    return result;
  }
}
