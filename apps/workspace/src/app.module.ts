import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { WorkspacesController } from "./workspace/workspaces.controller";
import { TeamsService } from "./team/teams.service";
import { TeamMembersService } from "./team/team-members.service";
import { WorkspacesService } from "./workspace/workspaces.service";
import { WorkspaceMembersService } from "./member/workspace-members.service";
import { WorkspaceMembersController } from "./member/workspace-members.controller";
import { LoggerClientModule } from "@shared/logger";
import { PrismaModule } from "@shared/prisma";
import { TeamsController } from "./team/teams.controller";
import { LabelService } from "./workspace/label.service";
import { LabelController } from "./workspace/label.controller";

@Module({
  imports: [LoggerClientModule, PrismaModule],
  controllers: [HealthController, WorkspacesController, TeamsController, LabelController, WorkspaceMembersController],
  providers: [WorkspacesService, WorkspaceMembersService, TeamMembersService, TeamsService, LabelService],
})
export class AppModule {}
