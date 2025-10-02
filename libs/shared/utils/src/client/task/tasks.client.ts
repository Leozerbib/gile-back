import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import type { CreateTaskDto, UpdateTaskDto, TaskDto, TaskListDto, BaseSearchQueryDto } from "@shared/types";

/**
 * gRPC service interface matching the proto service definition
 */
interface TasksGrpc {
  Create(request: { project_id: number; user_id: string; epic_id: number; dto: CreateTaskDto }): Observable<TaskDto>;

  Search(request: { project_id: number; user_id: string; epic_id: number; params?: BaseSearchQueryDto }): Observable<TaskListDto>;

  GetById(request: { project_id: number; user_id: string; id: number }): Observable<TaskDto>;

  GetOverview(request: { project_id: number; user_id: string; epic_id: number; params?: BaseSearchQueryDto }): Observable<TaskListDto>;

  Update(request: { project_id: number; user_id: string; id: number; dto: UpdateTaskDto }): Observable<TaskDto>;

  Delete(request: { project_id: number; user_id: string; id: number }): Observable<{ success: boolean }>;
}

/**
 * Gateway service for Task gRPC communication
 *
 * Provides a typed interface for calling Task service via gRPC
 * Used by the API gateway to communicate with the Project microservice
 */
@Injectable()
export class TasksGatewayService implements OnModuleInit {
  private svc!: TasksGrpc;

  constructor(@Inject("TASKS_PACKAGE") private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.svc = this.client.getService<TasksGrpc>("Tasks");
  }

  async create(project_id: number, user_id: string, epic_id: number, dto: CreateTaskDto): Promise<TaskDto> {
    return await firstValueFrom(this.svc.Create({ project_id, user_id, epic_id, dto }));
  }

  async search(project_id: number, user_id: string, epic_id: number, params?: BaseSearchQueryDto): Promise<TaskListDto> {
    return await firstValueFrom(this.svc.Search({ project_id, user_id, epic_id, params }));
  }

  async findById(project_id: number, user_id: string, id: number): Promise<TaskDto> {
    return await firstValueFrom(this.svc.GetById({ project_id, user_id, id }));
  }

  async update(project_id: number, user_id: string, id: number, dto: UpdateTaskDto): Promise<TaskDto> {
    return await firstValueFrom(this.svc.Update({ project_id, user_id, id, dto }));
  }

  async remove(project_id: number, user_id: string, id: number): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.Delete({ project_id, user_id, id }));
  }

  async getOverview(project_id: number, user_id: string, epic_id: number, params?: BaseSearchQueryDto): Promise<TaskListDto> {
    return await firstValueFrom(this.svc.GetOverview({ project_id, user_id, epic_id, params }));
  }
}
