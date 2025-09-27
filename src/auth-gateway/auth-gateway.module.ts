import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";
import { AuthGatewayService } from "./auth.client";
import { AuthGatewayController } from "./auth.controller";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Auth, CurrentUser } from "./auth.decorators";
import { LoggerClientModule } from "@shared/logger";
import { ProfileGatewayService } from "../profile-gateway/profile.client";

@Module({
  imports: [
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
      {
        name: "AUTH_CLIENT",
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_GRPC_URL ?? "localhost:50051",
          package: "auth.v1",
          protoPath: [join(process.cwd(), "libs/proto/auth/v1/auth.proto")],
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  controllers: [AuthGatewayController],
  providers: [AuthGatewayService, JwtAuthGuard, ProfileGatewayService],
  exports: [AuthGatewayService, JwtAuthGuard, ProfileGatewayService],
})
export class AuthGatewayModule {}

// Re-export decorators for easier imports
export { Auth, CurrentUser } from "./auth.decorators";
