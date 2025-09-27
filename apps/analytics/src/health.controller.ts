import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { LoggerClientService } from "@shared/logger";

@Controller()
export class HealthController {
  constructor(private readonly logger: LoggerClientService) {}

  @GrpcMethod("Health", "Check")
  async check(data: { service?: string }): Promise<{ status: string }> {
    await this.logger.log({ level: "info", service: "analytics", func: "health.check", message: "I am ALIVE!!!" });
    return { status: "SERVING" };
  }
}
