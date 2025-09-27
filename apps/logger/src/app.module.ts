import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { LoggerController } from "./logger.controller";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [LoggerClientModule],
  controllers: [HealthController, LoggerController],
})
export class AppModule {}
