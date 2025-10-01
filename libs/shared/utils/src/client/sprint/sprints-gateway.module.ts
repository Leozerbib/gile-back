import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { SprintsGatewayService } from "./sprints.client";
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
          package: "sprints.v1",
          protoPath: [join(process.cwd(), "libs/proto/sprints/v1/sprints.proto")],
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            includeDirs: [join(process.cwd(), "libs/proto")],
          },
        },
      },
    ]),
  ],
  providers: [SprintsGatewayService],
  exports: [SprintsGatewayService],
})
export class SprintsGatewayModule {}
