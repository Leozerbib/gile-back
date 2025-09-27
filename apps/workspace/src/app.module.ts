import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { WorkspacesController } from "./workspace/workspaces.controller";
import { TeamsService } from "./team/teams.service";
import { TeamMembersService } from "./team/team-members.service";
import { WorkspacesService } from "./workspace/workspaces.service";
import { WorkspaceMembersService } from "./member/workspace-members.service";
import { LoggerClientModule } from "@shared/logger";
import { PrismaModule } from "@shared/prisma";

@Module({
  imports: [LoggerClientModule, PrismaModule],
  controllers: [HealthController, WorkspacesController],
  providers: [WorkspacesService, WorkspaceMembersService, TeamMembersService, TeamsService],
})
export class AppModule {}
