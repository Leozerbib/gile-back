import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { SupabaseClientProvider } from "./supabase.provider";
import { LoggerClientModule } from "@shared/logger";

@Module({
  imports: [LoggerClientModule, ConfigModule.forRoot({ isGlobal: false }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, SupabaseClientProvider],
})
export class AuthModule {}
