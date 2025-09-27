import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { TicketsController } from "./ticket/tickets.controller";
import { SprintsController } from "./sprint/sprints.controller";
import { TicketsService } from "./ticket/tickets.service";
import { SprintsService } from "./sprint/sprints.service";
import { ProjectsService } from "./project/projects.service";
import { WorkspaceMembersService } from "apps/workspace/src/member/workspace-members.service";
import { TeamsService } from "apps/workspace/src/team/teams.service";
import { LoggerClientModule } from "@shared/logger";
import { PrismaModule } from "@shared/prisma";

@Module({
  imports: [LoggerClientModule, PrismaModule],
  controllers: [HealthController, TicketsController, SprintsController],
  providers: [TicketsService, SprintsService, ProjectsService, WorkspaceMembersService, TeamsService],
})
export class AppModule {}
