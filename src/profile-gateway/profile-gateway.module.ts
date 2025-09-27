import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { ProfileGatewayService } from "./profile.client";
import { ProfileGatewayController } from "./profile.controller";
import { AuthGatewayModule } from "../auth-gateway/auth-gateway.module";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [
    AuthGatewayModule,
    LoggerClientModule,
    ClientsModule.register([
      {
        name: "PROFILE_CLIENT",
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_GRPC_URL ?? "localhost:50051",
          package: "profile.v1",
          protoPath: [join(process.cwd(), "libs/proto/profile/v1/profile.proto")],
          loader: { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true },
        },
      },
    ]),
  ],
  controllers: [ProfileGatewayController],
  providers: [ProfileGatewayService],
  exports: [ProfileGatewayService],
})
export class ProfileGatewayModule {}
