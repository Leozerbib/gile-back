import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service";

@ApiTags("Microservices Health")
@Controller("microservices")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  private normalizeStatus(s?: string) {
    return (s ?? "").toUpperCase() === "SERVING" ? "SERVING" : "UNAVAILABLE";
  }

  @Get("healthz")
  @ApiOperation({ summary: "Check health of all microservices" })
  @ApiResponse({ status: 200, description: "Health status of all microservices" })
  async healthAll() {
    const results: { service: string; status: string }[] = await this.healthService.checkAllServices();
    return results.map((r: { service: string; status: string }) => ({
      service: r.service,
      status: this.normalizeStatus(r.status),
    }));
  }

  @Get("healthz/:service")
  @ApiOperation({ summary: "Check health of a single microservice" })
  @ApiResponse({ status: 200, description: "Health status of the specified microservice" })
  async healthOne(@Param("service") service: string) {
    const res = await this.healthService.checkService(service);
    return { service: res.service, status: this.normalizeStatus(res.status) };
  }
}
