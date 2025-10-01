import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { WorkspaceGatewayService } from "./workspace.client";
import { LabelGatewayService } from "./label.client";
import { WorkspaceMembersGatewayService } from "./member.client";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
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
            includeDirs: [join(process.cwd(), "libs/proto")],
          },
        },
      },
      {
        name: "LABEL_CLIENT",
        transport: Transport.GRPC,
        options: {
          url: process.env.WORKSPACE_GRPC_URL ?? "localhost:50052",
          package: "labels.v1",
          protoPath: [join(process.cwd(), "libs/proto/labels/v1/labels.proto")],
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            includeDirs: [join(process.cwd(), "libs/proto")],
          },
        },
      },
      {
        name: "MEMBER_CLIENT",
        transport: Transport.GRPC,
        options: {
          url: process.env.WORKSPACE_GRPC_URL ?? "localhost:50052",
          package: "members.v1",
          protoPath: [join(process.cwd(), "libs/proto/members/v1/workspace-members.proto")],
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
  providers: [WorkspaceGatewayService, WorkspaceMembersGatewayService, LabelGatewayService],
  exports: [WorkspaceGatewayService, WorkspaceMembersGatewayService, LabelGatewayService],
})
export class WorkspaceGatewayModule {}
