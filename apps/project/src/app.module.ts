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
import { EpicsController } from "./epic/epics.controller";
import { EpicsService } from "./epic/epics.service";
import { TeamMembersService } from "apps/workspace/src/team/team-members.service";
import { TasksController } from "./task/tasks.controller";
import { TasksService } from "./task/tasks.service";

@Module({
  imports: [LoggerClientModule, PrismaModule, TeamsGatewayModule],
  controllers: [HealthController, TicketsController, SprintsController, ProjectsController, EpicsController, TasksController],
  providers: [TicketsService, SprintsService, ProjectsService, EpicsService, WorkspaceMembersService, TeamsService, TeamMembersService, TasksService],
})
export class AppModule {}
