import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { ProjectsService } from "./projects.service";
import type { BaseSearchQueryDto } from "@shared/types";
import { CreateProjectDto, UpdateProjectDto, ProjectDto, ProjectsListDto } from "@shared/types";
import type { TeamOverview } from "@shared/types";

@Controller()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly logger: LoggerClientService,
  ) {}

  // Create a new project
  @GrpcMethod("Projects", "Create")
  async create(data: { user_id: string; workspace_id: string; dto: CreateProjectDto }): Promise<ProjectDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.create",
      message: "gRPC Create project request",
      data,
    });

    const project = await this.projectsService.create(data.user_id, data.workspace_id, data.dto);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.create",
      message: "gRPC Create project response",
      data: { projectId: project.id, workspaceId: data.workspace_id },
    });

    return project;
  }

  // Search projects within a workspace
  @GrpcMethod("Projects", "Search")
  async search(data: { user_id: string; workspace_id: string; params?: BaseSearchQueryDto }): Promise<ProjectsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.search",
      message: "gRPC Search projects request",
      data,
    });

    const list = await this.projectsService.search(data.user_id, data.workspace_id, data.params ?? {});

    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.search",
      message: "gRPC Search projects response",
      data: { total: list.total, count: list.items.length },
    });

    return list;
  }

  // Get project by ID
  @GrpcMethod("Projects", "GetById")
  async getById(data: { user_id: string; id: number | string }): Promise<ProjectDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.getById",
      message: `gRPC GetById project request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const project = await this.projectsService.getById(id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.getById",
      message: `gRPC GetById project response for id ${data.id}`,
      data: { projectId: project?.id },
    });

    return project;
  }

  // Get projects overview for a workspace
  @GrpcMethod("Projects", "GetOverview")
  async getOverview(data: { user_id: string; workspace_id: string; params?: BaseSearchQueryDto }): Promise<ProjectsListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.getOverview",
      message: `gRPC GetOverview projects request for workspace ${data.workspace_id}`,
      data,
    });

    const list = await this.projectsService.getOverview(data.workspace_id, data.user_id, data.params ?? {});

    return list;
  }

  // Update project
  @GrpcMethod("Projects", "Update")
  async update(data: { user_id: string; id: number | string; dto: UpdateProjectDto }): Promise<ProjectDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.update",
      message: `gRPC Update project request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const project = await this.projectsService.update(id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.update",
      message: `gRPC Update project response for id ${data.id}`,
      data: { projectId: project.id },
    });

    return project;
  }

  // Delete project
  @GrpcMethod("Projects", "Delete")
  async delete(data: { user_id: string; id: number | string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.delete",
      message: `gRPC Delete project request for id ${data.id}`,
      data,
    });

    const id = typeof data.id === "string" ? Number(data.id) : data.id;
    const result = await this.projectsService.delete(id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.delete",
      message: `gRPC Delete project response for id ${data.id}`,
      data: { result },
    });

    return result;
  }

  // Get team for project
  @GrpcMethod("Projects", "GetTeam")
  async getTeam(data: { user_id: string; project_id: number | string }): Promise<TeamOverview> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.getTeam",
      message: `gRPC GetTeam request for project ${data.project_id}`,
      data,
    });

    const pid = typeof data.project_id === "string" ? Number(data.project_id) : data.project_id;
    const team = await this.projectsService.getTeam(pid, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "projects.grpc.getTeam",
      message: `gRPC GetTeam response for project ${data.project_id}`,
      data: team,
    });

    return team;
  }
}
