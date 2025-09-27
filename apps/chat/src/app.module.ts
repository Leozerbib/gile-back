import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [LoggerClientModule],
  controllers: [HealthController],
})
export class AppModule {}
