import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { TicketsController } from "./ticket/tickets.controller";
import { SprintsController } from "./sprint/sprints.controller";
import { TicketsService } from "./ticket/tickets.service";
import { SprintsService } from "./sprint/sprints.service";
import { ProjectsService } from "./project/projects.service";
import { ProjectsController } from "./project/projects.controller";
import { WorkspaceMembersService } from "apps/workspace/src/member/workspace-members.service";
import { TeamsService } from "apps/workspace/src/team/teams.service";
import { LoggerClientModule } from "@shared/logger";
import { PrismaModule } from "@shared/prisma";
import { TeamsGatewayModule } from "libs/shared/utils/src/client/team/teams-gateway.module";

@Module({
  imports: [LoggerClientModule, PrismaModule, TeamsGatewayModule],
  controllers: [HealthController, TicketsController, SprintsController, ProjectsController],
  providers: [TicketsService, SprintsService, ProjectsService, WorkspaceMembersService, TeamsService],
})
export class AppModule {}
