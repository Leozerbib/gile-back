import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";

@Controller()
export class HealthController {
  constructor(private readonly logger: LoggerClientService) {}

  @GrpcMethod("Health", "Check")
  async check(data: { service?: string }): Promise<{ status: string }> {
    // logger service logs to itself
    await this.logger.log({ level: "info", service: data.service || "logger", func: "health.check", message: "I am ALIVE!!!" });
    return { status: "SERVING" };
  }
}
