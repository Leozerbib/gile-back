import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "node:path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: process.env.WORKSPACE_GRPC_URL ?? "0.0.0.0:50052",
      package: ["health.v1", "workspace.v1", "teams.v1", "labels.v1", "members.v1"],
      protoPath: [
        join(process.cwd(), "libs/proto/health/v1/health.proto"),
        join(process.cwd(), "libs/proto/workspace/v1/workspace.proto"),
        join(process.cwd(), "libs/proto/teams/v1/teams.proto"),
        join(process.cwd(), "libs/proto/labels/v1/labels.proto"),
        join(process.cwd(), "libs/proto/members/v1/workspace-members.proto"),
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
