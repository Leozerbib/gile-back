import { Injectable } from "@nestjs/common";
import { LoggerClientService } from "@shared/logger";
import { VectorEvent, EntityChangeEvent, DependencyChangeEvent } from "../interfaces/vector-event.interface";
import { VectorAggregationService } from "./vector-aggregation.service";

@Injectable()
export class EventListenerService {
  constructor(
    private readonly logger: LoggerClientService,
    private readonly vectorAggregation: VectorAggregationService,
  ) {}

  /**
   * Process incoming entity change events
   */
  async handleEntityChange(event: EntityChangeEvent): Promise<void> {
    await this.logger.log({
      level: "info",
      service: "vector",
      func: "handleEntityChange",
      message: `Processing ${event.eventType} event for ${event.entityType}`,
      data: { sourceTable: event.sourceTable, sourceId: event.sourceId },
    });

    try {
      switch (event.eventType) {
        case "CREATE":
        case "UPDATE":
          await this.vectorAggregation.processEntityForEmbedding(event);
          break;
        case "DELETE":
          await this.vectorAggregation.removeEntityEmbedding(event);
          break;
      }
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "handleEntityChange",
        message: `Failed to process entity change event`,
        data: { event, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Process dependency change events (affects multiple entities)
   */
  async handleDependencyChange(event: DependencyChangeEvent): Promise<void> {
    await this.logger.log({
      level: "info",
      service: "vector",
      func: "handleDependencyChange",
      message: `Processing dependency change event`,
      data: {
        dependentId: event.dependentEntityId,
        dependsOnId: event.dependsOnEntityId,
        type: event.dependencyType,
      },
    });

    try {
      // Process both entities affected by the dependency change
      const dependentEvent: EntityChangeEvent = {
        ...event,
        entityType: event.dependencyType === "TICKET_DEPENDENCY" ? "TICKET" : "TASK",
        sourceId: event.dependentEntityId,
      };

      const dependsOnEvent: EntityChangeEvent = {
        ...event,
        entityType: event.dependencyType === "TICKET_DEPENDENCY" ? "TICKET" : "TASK",
        sourceId: event.dependsOnEntityId,
      };

      await Promise.all([this.vectorAggregation.processEntityForEmbedding(dependentEvent), this.vectorAggregation.processEntityForEmbedding(dependsOnEvent)]);
    } catch (error) {
      await this.logger.log({
        level: "error",
        service: "vector",
        func: "handleDependencyChange",
        message: `Failed to process dependency change event`,
        data: { event, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Batch process multiple events (useful for initial data load)
   */
  async processBatchEvents(events: VectorEvent[]): Promise<void> {
    await this.logger.log({
      level: "info",
      service: "vector",
      func: "processBatchEvents",
      message: `Processing batch of ${events.length} events`,
    });

    const results = await Promise.allSettled(
      events.map(event => {
        if ("entityType" in event) {
          return this.handleEntityChange(event as EntityChangeEvent);
        } else if ("dependencyType" in event) {
          return this.handleDependencyChange(event as DependencyChangeEvent);
        }
        throw new Error(`Unknown event type: ${JSON.stringify(event)}`);
      }),
    );

    const failures = results.filter(result => result.status === "rejected");
    if (failures.length > 0) {
      await this.logger.log({
        level: "warn",
        service: "vector",
        func: "processBatchEvents",
        message: `${failures.length} events failed to process`,
        data: { totalEvents: events.length, failures: failures.length },
      });
    }
  }
}
