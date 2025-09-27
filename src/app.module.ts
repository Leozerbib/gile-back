import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./health/health.module";
import { LoggerClientModule } from "@shared/logger";
import { GrpcToHttpExceptionFilter } from "./common/filters/grpc-exception.filter";
import { AuthGatewayModule } from "./auth-gateway/auth-gateway.module";
import { ProfileGatewayModule } from "./profile-gateway/profile-gateway.module";
import { WorkspaceGatewayModule } from "./workspace-gateway/workspace-gateway.module";
import { TicketsGatewayModule } from "./tickets-gateway/tickets-gateway.module";
import { SprintsGatewayModule } from "./sprints-gateway/sprints-gateway.module";

@Module({
  imports: [LoggerClientModule, HealthModule, AuthGatewayModule, ProfileGatewayModule, WorkspaceGatewayModule, TicketsGatewayModule, SprintsGatewayModule],
  controllers: [AppController],
  providers: [AppService, GrpcToHttpExceptionFilter],
})
export class AppModule {}
