import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { LoggerClientModule } from "@shared/logger";
import { PrismaModule } from "@shared/prisma";
import { VectorModule } from "./vector/vector.module";

@Module({
  imports: [LoggerClientModule, PrismaModule, VectorModule],
  controllers: [HealthController],
})
export class AppModule {}
