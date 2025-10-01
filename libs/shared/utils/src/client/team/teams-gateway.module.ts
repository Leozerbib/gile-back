import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { TeamsGatewayService } from "./teams.client";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
    LoggerClientModule,
    ClientsModule.register([
      {
        name: "TEAM_CLIENT",
        transport: Transport.GRPC,
        options: {
          url: process.env.WORKSPACE_GRPC_URL ?? "localhost:50052",
          package: "teams.v1",
          protoPath: [join(process.cwd(), "libs/proto/teams/v1/teams.proto")],
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
  providers: [TeamsGatewayService],
  exports: [TeamsGatewayService],
})
export class TeamsGatewayModule {}
