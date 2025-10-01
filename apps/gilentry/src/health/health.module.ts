import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
    LoggerClientModule,
    ClientsModule.register([
      {
        name: "AUTH_SERVICE",
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_GRPC_URL ?? "localhost:50051",
          package: "health.v1",
          protoPath: [join(process.cwd(), "libs/proto/health/v1/health.proto")],
        },
      },
      {
        name: "WORKSPACE_SERVICE",
        transport: Transport.GRPC,
        options: {
          url: process.env.WORKSPACE_GRPC_URL ?? "localhost:50052",
          package: "health.v1",
          protoPath: [join(process.cwd(), "libs/proto/health/v1/health.proto")],
        },
      },
      {
        name: "PROJECT_SERVICE",
        transport: Transport.GRPC,
        options: {
          url: process.env.PROJECT_GRPC_URL ?? "localhost:50053",
          package: "health.v1",
          protoPath: [join(process.cwd(), "libs/proto/health/v1/health.proto")],
        },
      },
      {
        name: "CHAT_SERVICE",
        transport: Transport.GRPC,
        options: {
          url: process.env.CHAT_GRPC_URL ?? "localhost:50054",
          package: "health.v1",
          protoPath: [join(process.cwd(), "libs/proto/health/v1/health.proto")],
        },
      },
      {
        name: "ANALYTICS_SERVICE",
        transport: Transport.GRPC,
        options: {
          url: process.env.ANALYTICS_GRPC_URL ?? "localhost:50055",
          package: "health.v1",
          protoPath: [join(process.cwd(), "libs/proto/health/v1/health.proto")],
        },
      },
      {
        name: "LOGGER_SERVICE",
        transport: Transport.GRPC,
        options: {
          url: process.env.LOGGER_GRPC_URL ?? "localhost:50056",
          package: "health.v1",
          protoPath: [join(process.cwd(), "libs/proto/health/v1/health.proto")],
        },
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
