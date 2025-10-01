import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { ProjectsGatewayService } from "./projects.client";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
    LoggerClientModule,
    ClientsModule.register([
      {
        name: "PROJECT_PACKAGE",
        transport: Transport.GRPC,
        options: {
          url: process.env.PROJECT_GRPC_URL ?? "localhost:50053",
          package: "projects.v1",
          protoPath: [join(process.cwd(), "libs/proto/projects/v1/projects.proto")],
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            includeDirs: [join(process.cwd(), "libs/proto")],
          },
        },
      },
    ]),
  ],
  providers: [ProjectsGatewayService],
  exports: [ProjectsGatewayService],
})
export class ProjectsGatewayModule {}
