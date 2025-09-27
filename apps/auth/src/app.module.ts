import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { LoggerClientModule } from "@shared/logger";
import { PrismaModule } from "@shared/prisma";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";

@Module({
  imports: [LoggerClientModule, PrismaModule, AuthModule, ProfileModule],
  controllers: [HealthController],
})
export class AppModule {}
