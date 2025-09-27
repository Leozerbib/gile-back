import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "node:path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: process.env.ANALYTICS_GRPC_URL ?? "0.0.0.0:50055",
      package: "health.v1",
      protoPath: [join(process.cwd(), "libs/proto/health/v1/health.proto")],
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });
  await app.listen();
}
bootstrap();
