import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { WorkspacesService } from "./workspaces.service";
import { CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceDto, WorkspaceOverview, BaseSearchQueryDto, WorkspacesListDto } from "@shared/types";

/**
 * Controller gRPC pour la gestion des workspaces
 *
 * Endpoints exposés:
 * - Create: Création d'un nouveau workspace
 * - Search: Recherche avec pagination et filtres
 * - GetById: Récupération d'un workspace par son ID (avec contrôle d'accès facultatif)
 * - GetOverview: Liste paginée d'aperçus de workspaces accessibles par l'utilisateur
 * - Update: Mise à jour d'un workspace existant
 * - Delete: Suppression d'un workspace
 */
@Controller()
export class WorkspacesController {
  private readonly logger = new Logger(WorkspacesController.name);

  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  /**
   * Créer un nouveau workspace
   */
  @GrpcMethod("WorkspaceService", "Create")
  async create(data: { ownerId: string; dto: CreateWorkspaceDto }): Promise<{ workspace: WorkspaceDto }> {
    this.logger.log(`Creating workspace via gRPC for owner: ${data.ownerId}`);

    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspaces.create",
      message: `Workspace creation request via gRPC`,
      data: { ownerId: data.ownerId, name: data.dto?.name, slug: data.dto?.slug },
    });

    try {
      const workspace = await this.workspacesService.create(data.ownerId, data.dto);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.create",
        message: `Workspace created successfully: ${workspace.id}`,
        data: { id: workspace.id, name: workspace.name },
      });

      return { workspace };
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.create",
          message: `Failed to create workspace via gRPC: ${error.message}`,
          data: { error: error.message, ownerId: data.ownerId },
        });
      }
      throw error;
    }
  }

  /**
   * Rechercher des workspaces (pagination + filtres)
   */
  @GrpcMethod("WorkspaceService", "Search")
  async search(data: { params?: BaseSearchQueryDto }): Promise<WorkspacesListDto> {
    this.logger.log(`Searching workspaces via gRPC with params: ${JSON.stringify(data.params ?? {})}`);

    try {
      const list = await this.workspacesService.search(data.params);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.search",
        message: `Workspace search completed via gRPC`,
        data: { total: list.total, count: list.items.length, search: data.params?.search },
      });

      return list;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.search",
          message: `Failed to search workspaces via gRPC: ${error.message}`,
          data: { error: error.message, params: data.params },
        });
      }
      throw error;
    }
  }

  /**
   * Récupérer un workspace par ID
   */
  @GrpcMethod("WorkspaceService", "GetById")
  async getById(data: { id: string; userId?: string }): Promise<{ workspace: WorkspaceDto }> {
    this.logger.log(`Getting workspace by ID via gRPC: ${data.id}`);

    try {
      const workspace = await this.workspacesService.getById(data.id, data.userId);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.getById",
        message: `Workspace retrieved via gRPC: ${workspace.id}`,
        data: { id: workspace.id, name: workspace.name },
      });

      return { workspace };
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.getById",
          message: `Failed to get workspace by ID via gRPC: ${error.message}`,
          data: { error: error.message, id: data.id },
        });
      }
      throw error;
    }
  }

  /**
   * Récupérer la liste d'aperçus de workspaces accessibles par l'utilisateur
   */
  @GrpcMethod("WorkspaceService", "GetOverview")
  async getOverview(data: { params?: BaseSearchQueryDto; userId?: string }): Promise<{ workspaces: WorkspaceOverview[]; total: number; skip: number; take: number }> {
    this.logger.log(`Getting workspace overviews via gRPC with params: ${JSON.stringify(data.params ?? {})}`);

    try {
      const list = await this.workspacesService.getOverview(data.params, data.userId);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.getOverview",
        message: `Workspace overview list retrieved via gRPC`,
        data: { total: list.total, count: list.items.length, search: data.params?.search },
      });

      return {
        workspaces: list.items as unknown as WorkspaceOverview[],
        total: list.total,
        skip: list.skip,
        take: list.take,
      };
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.getOverview",
          message: `Failed to get workspace overviews via gRPC: ${error.message}`,
          data: { error: error.message, params: data.params },
        });
      }
      throw error;
    }
  }

  /**
   * Mettre à jour un workspace
   */
  @GrpcMethod("WorkspaceService", "Update")
  async update(data: { id: string; dto: UpdateWorkspaceDto; updatedBy?: string }): Promise<{ workspace: WorkspaceDto }> {
    this.logger.log(`Updating workspace via gRPC: ${data.id} by user: ${data.updatedBy ?? "unknown"}`);

    try {
      const workspace = await this.workspacesService.update(data.id, data.dto, data.updatedBy);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.update",
        message: `Workspace updated via gRPC: ${workspace.id}`,
        data: { id: workspace.id, name: workspace.name },
      });

      return { workspace };
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.update",
          message: `Failed to update workspace via gRPC: ${error.message}`,
          data: { error: error.message, id: data.id },
        });
      }
      throw error;
    }
  }

  /**
   * Supprimer un workspace
   */
  @GrpcMethod("WorkspaceService", "Delete")
  async delete(data: { id: string; deletedBy?: string }): Promise<{ success: boolean }> {
    this.logger.log(`Deleting workspace via gRPC: ${data.id} by user: ${data.deletedBy ?? "unknown"}`);

    try {
      const result = await this.workspacesService.delete(data.id, data.deletedBy);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.delete",
        message: `Workspace deleted via gRPC: ${data.id}`,
        data: { id: data.id, success: result.success },
      });

      this.logger.log(`Workspace deleted successfully: ${data.id}`);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "workspaces.delete",
          message: `Failed to delete workspace via gRPC: ${error.message}`,
          data: { error: error.message, id: data.id },
        });
      }
      throw error;
    }
  }
}
