import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { TicketsGatewayService } from "./tickets.client";
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
          package: "tickets.v1",
          protoPath: [join(process.cwd(), "libs/proto/tickets/v1/tickets.proto")],
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
  providers: [TicketsGatewayService],
  exports: [TicketsGatewayService],
})
export class TicketsGatewayModule {}
