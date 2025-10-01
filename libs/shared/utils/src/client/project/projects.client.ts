import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, type Observable } from "rxjs";
import type { CreateProjectDto, UpdateProjectDto, ProjectDto, ProjectsListDto, TeamOverview, BaseSearchQueryDto } from "@shared/types";

interface ProjectsGrpc {
  Create(request: { user_id: string; workspace_id: string; dto: CreateProjectDto }): Observable<ProjectDto>;
  Search(request: { user_id: string; workspace_id: string; params?: BaseSearchQueryDto }): Observable<ProjectsListDto>;
  GetById(request: { user_id: string; id: number }): Observable<ProjectDto>;
  GetOverview(request: { user_id: string; workspace_id: string; params?: BaseSearchQueryDto }): Observable<ProjectsListDto>;
  Update(request: { user_id: string; id: number; dto: UpdateProjectDto }): Observable<ProjectDto>;
  Delete(request: { user_id: string; id: number }): Observable<{ success: boolean }>;
  GetTeam(request: { user_id: string; project_id: number }): Observable<TeamOverview>;
}

@Injectable()
export class ProjectsGatewayService implements OnModuleInit {
  private svc!: ProjectsGrpc;

  constructor(@Inject("PROJECT_PACKAGE") private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.svc = this.client.getService<ProjectsGrpc>("Projects");
  }

  async create(user_id: string, workspace_id: string, dto: CreateProjectDto): Promise<ProjectDto> {
    return await firstValueFrom(this.svc.Create({ user_id, workspace_id, dto }));
  }

  async search(user_id: string, workspace_id: string, params?: BaseSearchQueryDto): Promise<ProjectsListDto> {
    return await firstValueFrom(this.svc.Search({ user_id, workspace_id, params }));
  }

  async findById(user_id: string, id: number): Promise<ProjectDto> {
    return await firstValueFrom(this.svc.GetById({ user_id, id }));
  }

  async update(user_id: string, id: number, dto: UpdateProjectDto): Promise<ProjectDto> {
    return await firstValueFrom(this.svc.Update({ user_id, id, dto }));
  }

  async remove(user_id: string, id: number): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.Delete({ user_id, id }));
  }

  async getOverview(user_id: string, workspace_id: string, params?: BaseSearchQueryDto): Promise<ProjectsListDto> {
    return await firstValueFrom(this.svc.GetOverview({ user_id, workspace_id, params }));
  }

  async getTeam(user_id: string, project_id: number): Promise<TeamOverview> {
    return await firstValueFrom(this.svc.GetTeam({ user_id, project_id }));
  }
}
