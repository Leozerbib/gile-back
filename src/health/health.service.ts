import { Injectable, OnModuleInit, Inject } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import type { Observable } from "rxjs";
import { firstValueFrom, timeout, catchError, of } from "rxjs";
import { LoggerClientService } from "@shared/logger";

type HealthResponse = { status: string };

const normalizeStatus = (s?: string): "SERVING" | "unavailable" => {
  return (s ?? "").toUpperCase() === "SERVING" ? "SERVING" : "unavailable";
};

interface GrpcHealthService {
  check(data: { service?: string }): Observable<HealthResponse>;
}

@Injectable()
export class HealthService implements OnModuleInit {
  private authHealth: GrpcHealthService;
  private workspaceHealth: GrpcHealthService;
  private projectHealth: GrpcHealthService;
  private chatHealth: GrpcHealthService;
  private analyticsHealth: GrpcHealthService;
  private loggerHealth: GrpcHealthService;

  constructor(
    private readonly logger: LoggerClientService,
    @Inject("AUTH_SERVICE") private authClient: ClientGrpc,
    @Inject("WORKSPACE_SERVICE") private workspaceClient: ClientGrpc,
    @Inject("PROJECT_SERVICE") private projectClient: ClientGrpc,
    @Inject("CHAT_SERVICE") private chatClient: ClientGrpc,
    @Inject("ANALYTICS_SERVICE") private analyticsClient: ClientGrpc,
    @Inject("LOGGER_SERVICE") private loggerClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authHealth = this.authClient.getService<GrpcHealthService>("Health");
    this.workspaceHealth = this.workspaceClient.getService<GrpcHealthService>("Health");
    this.projectHealth = this.projectClient.getService<GrpcHealthService>("Health");
    this.chatHealth = this.chatClient.getService<GrpcHealthService>("Health");
    this.analyticsHealth = this.analyticsClient.getService<GrpcHealthService>("Health");
    this.loggerHealth = this.loggerClient.getService<GrpcHealthService>("Health");
  }

  async checkAllServices() {
    const services = [
      { name: "auth", health: this.authHealth },
      { name: "workspace", health: this.workspaceHealth },
      { name: "project", health: this.projectHealth },
      { name: "chat", health: this.chatHealth },
      { name: "analytics", health: this.analyticsHealth },
      { name: "logger", health: this.loggerHealth },
    ];

    const results = await Promise.allSettled(
      services.map(async service => {
        try {
          const result = await firstValueFrom<HealthResponse>(
            service.health.check({ service: service.name }).pipe(
              timeout(5000),
              catchError(err => {
                void this.logger.log({
                  level: "warn",
                  service: "main",
                  func: `health.checkAll:${service.name}`,
                  message: "Microservice unavailable",
                  data: { error: String(err?.message ?? err), service: service.name },
                });
                return of<HealthResponse>({ status: "unavailable" });
              }),
            ),
          );
          return { service: service.name, status: normalizeStatus(result.status) };
        } catch (error) {
          void this.logger.log({
            level: "warn",
            service: "main",
            func: `health.checkAll:${service.name}`,
            message: "Microservice unavailable (exception)",
            data: { error: String((error as any)?.message ?? error), service: service.name },
          });
          return { service: service.name, status: "unavailable" };
        }
      }),
    );

    return results.map(result => (result.status === "fulfilled" ? result.value : { service: "unknown", status: "unavailable" }));
  }

  async checkService(serviceName: string) {
    const serviceMap: Record<string, GrpcHealthService | undefined> = {
      auth: this.authHealth,
      workspace: this.workspaceHealth,
      project: this.projectHealth,
      chat: this.chatHealth,
      analytics: this.analyticsHealth,
      logger: this.loggerHealth,
    };

    const healthService = serviceMap[serviceName.toLowerCase()];
    if (!healthService) {
      return { service: serviceName, status: "UNKNOWN_SERVICE" };
    }

    try {
      const result = await firstValueFrom<HealthResponse>(
        healthService.check({ service: serviceName }).pipe(
          timeout(5000),
          catchError(err => {
            void this.logger.log({
              level: "warn",
              service: "main",
              func: `health.check:${serviceName}`,
              message: "Microservice unavailable",
              data: { error: String(err?.message ?? err), service: serviceName },
            });
            return of<HealthResponse>({ status: "unavailable" });
          }),
        ),
      );
      return { service: serviceName, status: normalizeStatus(result.status) };
    } catch (error) {
      void this.logger.log({
        level: "warn",
        service: "main",
        func: `health.check:${serviceName}`,
        message: "Microservice unavailable (exception)",
        data: { error: String((error as any)?.message ?? error), service: serviceName },
      });
      return { service: serviceName, status: "unavailable" };
    }
  }
}
