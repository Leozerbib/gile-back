import { Module } from "@nestjs/common";
import { PrismaModule } from "@shared/prisma";
import { ProfileService } from "./profile.service";
import { LoggerClientModule } from "@shared/logger";
import { ProfileController } from "./profile.controller";

@Module({
  imports: [PrismaModule, LoggerClientModule],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
