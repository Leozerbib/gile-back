import { Module } from "@nestjs/common";
import { PrismaModule } from "@shared/prisma";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [PrismaModule, LoggerClientModule],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
