import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";
import { LabelService } from "./label.service";
import { CreateLabelDto, UpdateLabelDto, LabelDto, LabelsListDto, BaseSearchQueryDto } from "@shared/types";

/**
 * Controller gRPC pour la gestion des labels
 *
 * Endpoints exposés:
 * - Create: Création d'un nouveau label dans un workspace
 * - Update: Mise à jour d'un label existant
 * - Delete: Suppression d'un label
 * - GetByLabel: Récupération d'un label par son nom dans un workspace
 * - GetOverview: Liste paginée des labels d'un workspace avec recherche et filtres
 */
@Controller()
export class LabelController {
  constructor(
    private readonly labelService: LabelService,
    private readonly loggerClient: LoggerClientService,
  ) {}

  /**
   * Créer un nouveau label dans un workspace
   */
  @GrpcMethod("LabelService", "Create")
  async create(data: { workspaceId: string; dto: CreateLabelDto; userId: string }): Promise<LabelDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "label.create",
      message: `Label creation request via gRPC`,
      data: { workspaceId: data.workspaceId, userId: data.userId, name: data.dto?.name },
    });

    try {
      const label = await this.labelService.create(data.workspaceId, data.dto, data.userId);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.create",
        message: `Label created successfully via gRPC: ${label.id}`,
        data: { id: label.id, name: label.name, workspaceId: data.workspaceId },
      });

      return label;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.create",
          message: `Failed to create label via gRPC: ${error.message}`,
          data: { error: error.message, workspaceId: data.workspaceId, userId: data.userId },
        });
      }
      throw error;
    }
  }

  /**
   * Mettre à jour un label existant
   */
  @GrpcMethod("LabelService", "Update")
  async update(data: { id: number; dto: UpdateLabelDto; updatedBy: string; workspaceId: string }): Promise<LabelDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "label.update",
      message: `Label update request via gRPC`,
      data: { id: data.id, updatedBy: data.updatedBy, workspaceId: data.workspaceId, changes: Object.keys(data.dto) },
    });

    try {
      const label = await this.labelService.update(data.id, data.dto, data.updatedBy);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.update",
        message: `Label updated successfully via gRPC: ${label.id}`,
        data: { id: label.id, name: label.name, workspaceId: data.workspaceId },
      });

      return label;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.update",
          message: `Failed to update label via gRPC: ${error.message}`,
          data: { error: error.message, id: data.id, updatedBy: data.updatedBy, workspaceId: data.workspaceId },
        });
      }
      throw error;
    }
  }

  /**
   * Supprimer un label
   */
  @GrpcMethod("LabelService", "Delete")
  async delete(data: { id: number; deletedBy: string; workspaceId: string }): Promise<{ success: boolean }> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "label.delete",
      message: `Label deletion request via gRPC`,
      data: { id: data.id, deletedBy: data.deletedBy, workspaceId: data.workspaceId },
    });

    try {
      const result = await this.labelService.delete(data.id, data.deletedBy);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.delete",
        message: `Label deleted successfully via gRPC: ${data.id}`,
        data: { id: data.id, success: result.success, workspaceId: data.workspaceId },
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.delete",
          message: `Failed to delete label via gRPC: ${error.message}`,
          data: { error: error.message, id: data.id, deletedBy: data.deletedBy, workspaceId: data.workspaceId },
        });
      }
      throw error;
    }
  }

  /**
   * Récupérer un label par son nom dans un workspace
   */
  @GrpcMethod("LabelService", "GetByLabel")
  async getByLabel(data: { workspaceId: string; labelName: string; userId: string }): Promise<LabelDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "label.getByLabel",
      message: `Label retrieval by name request via gRPC`,
      data: { workspaceId: data.workspaceId, labelName: data.labelName, userId: data.userId },
    });

    try {
      const label = await this.labelService.getByLabel(data.workspaceId, data.labelName, data.userId);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.getByLabel",
        message: `Label retrieved by name via gRPC: ${label.id}`,
        data: { id: label.id, name: label.name, workspaceId: data.workspaceId },
      });

      return label;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.getByLabel",
          message: `Failed to get label by name via gRPC: ${error.message}`,
          data: { error: error.message, workspaceId: data.workspaceId, labelName: data.labelName },
        });
      }
      throw error;
    }
  }

  /**
   * Récupérer la liste des labels d'un workspace avec pagination et recherche
   */
  @GrpcMethod("LabelService", "GetOverview")
  async getOverview(data: { workspaceId: string; userId: string; params?: BaseSearchQueryDto }): Promise<LabelsListDto> {
    await this.loggerClient.log({
      level: "info",
      service: "workspace",
      func: "label.getOverview",
      message: `Labels overview request via gRPC`,
      data: { workspaceId: data.workspaceId, userId: data.userId, params: data.params },
    });

    try {
      const list = await this.labelService.getOverview(data.workspaceId, data.userId, data.params);

      await this.loggerClient.log({
        level: "info",
        service: "workspace",
        func: "label.getOverview",
        message: `Labels overview retrieved via gRPC`,
        data: { workspaceId: data.workspaceId, total: list.total, count: list.items.length, hasNext: list.has_next },
      });

      return list;
    } catch (error) {
      if (error instanceof Error) {
        await this.loggerClient.log({
          level: "error",
          service: "workspace",
          func: "label.getOverview",
          message: `Failed to get labels overview via gRPC: ${error.message}`,
          data: { error: error.message, workspaceId: data.workspaceId, params: data.params },
        });
      }
      throw error;
    }
  }
}
