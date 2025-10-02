import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { TasksGatewayService } from "./tasks.client";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
    LoggerClientModule,
    ClientsModule.register([
      {
        name: "TASKS_PACKAGE",
        transport: Transport.GRPC,
        options: {
          url: process.env.PROJECT_GRPC_URL ?? "localhost:50053",
          package: "tasks.v1",
          protoPath: [join(process.cwd(), "libs/proto/tasks/v1/tasks.proto")],
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
  providers: [TasksGatewayService],
  exports: [TasksGatewayService],
})
export class TasksGatewayModule {}
