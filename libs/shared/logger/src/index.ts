import { Global, Logger, Module } from "@nestjs/common";
export { formatLogLine, colorLevel } from "./format";
export { LoggerClientModule, LoggerClientService } from "./client";

@Global()
@Module({
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule {}
