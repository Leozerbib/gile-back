import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { LabelGatewayService } from "./label.client";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
    LoggerClientModule,
    ClientsModule.register([
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
    ]),
  ],
  providers: [LabelGatewayService],
  exports: [LabelGatewayService],
})
export class LabelsGatewayModule {}
