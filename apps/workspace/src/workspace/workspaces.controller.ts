import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { WorkspacesService } from "./workspaces.service";
import { CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceDto, BaseSearchQueryDto, WorkspacesListDto } from "@shared/types";

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
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  /**
   * Créer un nouveau workspace
   */
  @GrpcMethod("WorkspaceService", "Create")
  async create(data: { ownerId: string; dto: CreateWorkspaceDto }): Promise<WorkspaceDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "workspaces.create",
      message: `Workspace creation request via gRPC`,
      data: { ownerId: data.ownerId, name: data.dto?.name },
    });

    try {
      const workspace = await this.workspacesService.create(data.ownerId, data.dto);

      return workspace;
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
    try {
      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.search",
        message: `Workspace search completed via gRPC`,
        data: data,
      });
      const list = await this.workspacesService.search(data.params);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.search",
        message: `Workspace search completed via gRPC`,
        data: list,
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
  async getById(data: { id: string; userId?: string }): Promise<WorkspaceDto> {
    try {
      const workspace = await this.workspacesService.getById(data.id, data.userId);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.getById",
        message: `Workspace retrieved via gRPC: ${workspace.id}`,
        data: { id: workspace.id, name: workspace.name },
      });

      return workspace;
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
  async getOverview(data: { params?: BaseSearchQueryDto; userId?: string }): Promise<WorkspacesListDto> {
    try {
      const list = await this.workspacesService.getOverview(data.params, data.userId);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.getOverview",
        message: `Workspace overview list retrieved via gRPC`,
        data: list,
      });

      return list;
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
    try {
      const result = await this.workspacesService.delete(data.id, data.deletedBy);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "workspaces.delete",
        message: `Workspace deleted via gRPC: ${data.id}`,
        data: { id: data.id, success: result.success },
      });

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
