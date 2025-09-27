import { Injectable, OnModuleInit, Inject } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import type { ClientGrpc } from "@nestjs/microservices";
import { Module } from "@nestjs/common";
import { join } from "node:path";
import type { LogEntry, LogLevel } from "@shared/types";
import { firstValueFrom } from "rxjs";

interface LoggerGrpcService {
  writeLog(entry: {
    timestamp?: string;
    level?: number; // matches proto enum
    service?: string;
    func?: string;
    message?: string;
    data_json?: string;
  }): any;
}

function mapLevel(level: LogLevel): number {
  switch (level) {
    case "debug":
      return 1;
    case "info":
      return 2;
    case "warn":
      return 3;
    case "error":
      return 4;
    case "fatal":
      return 5;
    default:
      return 2;
  }
}

@Injectable()
export class LoggerClientService implements OnModuleInit {
  private loggerGrpc!: LoggerGrpcService;
  constructor(@Inject("LOGGER_CLIENT") private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.loggerGrpc = this.client.getService<LoggerGrpcService>("Logger");
  }

  async log(entry: LogEntry) {
    const payload = {
      timestamp: entry.timestamp ?? new Date().toISOString(),
      level: mapLevel(entry.level),
      service: entry.service,
      func: entry.func,
      message: entry.message,
      data_json: entry.data ? safeJson(entry.data) : undefined,
    };
    try {
      await firstValueFrom(this.loggerGrpc.writeLog(payload));
    } catch {
      // Swallow errors to not break callers
    }
  }
}

function safeJson(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    return "";
  }
}

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "LOGGER_CLIENT",
        transport: Transport.GRPC,
        options: {
          url: process.env.LOGGER_GRPC_URL ?? "localhost:50056",
          package: "logger.v1",
          protoPath: [join(process.cwd(), "libs/proto/logger/v1/logger.proto")],
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  providers: [LoggerClientService],
  exports: [LoggerClientService],
})
export class LoggerClientModule {}
