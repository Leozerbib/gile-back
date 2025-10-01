import { Module } from "@nestjs/common";
import { AppController } from "./gilentry.controller";
import { AppService } from "./gilentry.service";
import { HealthModule } from "./health/health.module";
import { LoggerClientModule } from "@shared/logger";
import { GrpcToHttpExceptionFilter } from "./common/filters/grpc-exception.filter";
import { AuthGatewayModule } from "./auth-gateway/auth-gateway.module";
import { ProfileGatewayModule } from "./profile-gateway/profile-gateway.module";
import { WorkspaceGatewayModule } from "libs/shared/utils/src/client/workspace/workspace-gateway.module";
import { TicketsGatewayModule } from "libs/shared/utils/src/client/ticket/tickets-gateway.module";
import { SprintsGatewayModule } from "libs/shared/utils/src/client/sprint/sprints-gateway.module";
import { ProjectsGatewayModule } from "libs/shared/utils/src/client/project/projects-gateway.module";
import { TeamsGatewayModule } from "libs/shared/utils/src/client/team/teams-gateway.module";
import { TeamsGatewayController } from "./teams-gateway/teams-gateway.controller";
import { TeamMemberGatewayController } from "./teams-gateway/team-member-gateway.controller";
import { ProfileGatewayController } from "./profile-gateway/profile.controller";
import { SprintsGatewayController } from "./sprints-gateway/sprints-gateway.controller";
import { TicketsGatewayController } from "./tickets-gateway/tickets-gateway.controller";
import { WorkspaceGatewayController } from "./workspace-gateway/workspace.controller";
import { WorkspaceMemberGatewayController } from "./workspace-gateway/workspace-member-gateway.controller";
import { ProjectsGatewayController } from "./project-gateway/projects-gateway.controller";
import { LabelGatewayController } from "./label-gateway/label-gateway.controller";

@Module({
  imports: [
    LoggerClientModule,
    HealthModule,
    AuthGatewayModule,
    ProfileGatewayModule,
    WorkspaceGatewayModule,
    TicketsGatewayModule,
    SprintsGatewayModule,
    ProjectsGatewayModule,
    TeamsGatewayModule,
  ],
  controllers: [
    AppController,
    TeamsGatewayController,
    TeamMemberGatewayController,
    WorkspaceGatewayController,
    WorkspaceMemberGatewayController,
    ProfileGatewayController,
    TicketsGatewayController,
    SprintsGatewayController,
    ProjectsGatewayController,
    LabelGatewayController,
  ],
  providers: [AppService, GrpcToHttpExceptionFilter],
})
export class AppModule {}
