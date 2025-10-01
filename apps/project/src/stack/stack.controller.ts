import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { CreateStackDto, UpdateStackDto, StackDto, BaseSearchQueryDto, StackListDto } from "@shared/types";
import { StackService } from "./stack.service";

/**
 * Controller gRPC pour la gestion des stacks technologiques
 *
 * Endpoints exposés:
 * - Create: Création d'une nouvelle stack dans un projet
 * - Update: Mise à jour d'une stack existante
 * - Delete: Suppression d'une stack
 * - GetOverview: Liste paginée des stacks d'un projet avec recherche et filtres
 * - GetById: Récupération d'une stack par son ID
 * - GetByProjectId: Récupération de toutes les stacks d'un projet
 */
@Controller()
export class StackController {
  constructor(
    private readonly stackService: StackService,
    private readonly logger: LoggerClientService,
  ) {}

  /**
   * Créer une nouvelle stack dans un projet
   */
  @GrpcMethod("Stack", "Create")
  async create(data: { project_id: number; user_id: string; dto: CreateStackDto }): Promise<StackDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.create",
      message: "gRPC Create stack request",
      data: { project_id: data.project_id, user_id: data.user_id, title: data.dto?.title },
    });

    const stack = await this.stackService.create(data.project_id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.create",
      message: "gRPC Create stack response",
      data: { stackId: stack.id, project_id: data.project_id },
    });

    return stack;
  }

  /**
   * Mettre à jour une stack existante
   */
  @GrpcMethod("Stack", "Update")
  async update(data: { stack_id: number; project_id: number; user_id: string; dto: UpdateStackDto }): Promise<StackDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.update",
      message: `gRPC Update stack request for id ${data.stack_id}`,
      data: { stack_id: data.stack_id, project_id: data.project_id, user_id: data.user_id },
    });

    const stack = await this.stackService.update(data.stack_id, data.project_id, data.dto, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.update",
      message: `gRPC Update stack response for id ${data.stack_id}`,
      data: { stackId: stack.id, project_id: data.project_id },
    });

    return stack;
  }

  /**
   * Supprimer une stack
   */
  @GrpcMethod("Stack", "Delete")
  async delete(data: { stack_id: number; project_id: number; user_id: string }): Promise<{ success: boolean }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.delete",
      message: `gRPC Delete stack request for id ${data.stack_id}`,
      data: { stack_id: data.stack_id, project_id: data.project_id, user_id: data.user_id },
    });

    const result = await this.stackService.delete(data.stack_id, data.project_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.delete",
      message: `gRPC Delete stack response for id ${data.stack_id}`,
      data: { result, project_id: data.project_id },
    });

    return result;
  }

  /**
   * Récupérer la liste des stacks d'un projet avec pagination et recherche
   */
  @GrpcMethod("Stack", "GetOverview")
  async getOverview(data: { project_id: number; user_id: string; params?: BaseSearchQueryDto }): Promise<StackListDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.getOverview",
      message: "gRPC GetOverview stacks request",
      data: { project_id: data.project_id, user_id: data.user_id, params: data.params },
    });

    const list = await this.stackService.getOverview(data.project_id, data.user_id, data.params);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.getOverview",
      message: "gRPC GetOverview stacks response",
      data: { project_id: data.project_id, total: list.total, count: list.items.length },
    });

    return list;
  }

  /**
   * Récupérer une stack par son ID
   */
  @GrpcMethod("Stack", "GetById")
  async getById(data: { stack_id: number; project_id: number; user_id: string }): Promise<StackDto> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.getById",
      message: `gRPC GetById stack request for id ${data.stack_id}`,
      data: { stack_id: data.stack_id, project_id: data.project_id, user_id: data.user_id },
    });

    const stack = await this.stackService.getById(data.stack_id, data.project_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.getById",
      message: `gRPC GetById stack response for id ${data.stack_id}`,
      data: { stackId: stack.id, project_id: data.project_id },
    });

    return stack;
  }

  /**
   * Récupérer toutes les stacks d'un projet
   */
  @GrpcMethod("Stack", "GetByProjectId")
  async getByProjectId(data: { project_id: number; user_id: string }): Promise<{ stacks: StackDto[] }> {
    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.getByProjectId",
      message: `gRPC GetByProjectId stacks request for project ${data.project_id}`,
      data: { project_id: data.project_id, user_id: data.user_id },
    });

    const stacks = await this.stackService.getByProjectId(data.project_id, data.user_id);

    await this.logger.log({
      level: "info",
      service: "project",
      func: "stack.grpc.getByProjectId",
      message: `gRPC GetByProjectId stacks response for project ${data.project_id}`,
      data: { project_id: data.project_id, count: stacks.length },
    });

    return { stacks };
  }
}
