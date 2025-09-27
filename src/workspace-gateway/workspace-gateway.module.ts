import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { WorkspaceGatewayService } from "./workspace.client";
import { WorkspaceGatewayController } from "./workspace.controller";
import { AuthGatewayModule } from "../auth-gateway/auth-gateway.module";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
    AuthGatewayModule,
    LoggerClientModule,
    ClientsModule.register([
      {
        name: "WORKSPACE_CLIENT",
        transport: Transport.GRPC,
        options: {
          url: process.env.WORKSPACE_GRPC_URL ?? "localhost:50052",
          package: "workspace.v1",
          protoPath: [join(process.cwd(), "libs/proto/workspace/v1/workspace.proto")],
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            includeDirs: [join(process.cwd(), "libs/proto")],
          },
        },
      },
    ]),
  ],
  controllers: [WorkspaceGatewayController],
  providers: [WorkspaceGatewayService],
  exports: [WorkspaceGatewayService],
})
export class WorkspaceGatewayModule {}
