import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "node:path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: process.env.PROJECT_GRPC_URL ?? "0.0.0.0:50053",
      package: ["health.v1", "tickets.v1", "sprints.v1", "projects.v1"],
      protoPath: [
        join(process.cwd(), "libs/proto/health/v1/health.proto"),
        join(process.cwd(), "libs/proto/tickets/v1/tickets.proto"),
        join(process.cwd(), "libs/proto/sprints/v1/sprints.proto"),
        join(process.cwd(), "libs/proto/projects/v1/projects.proto"),
      ],
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        includeDirs: [join(process.cwd(), "libs/proto")],
      },
    },
  });
  await app.listen();
}
bootstrap();
