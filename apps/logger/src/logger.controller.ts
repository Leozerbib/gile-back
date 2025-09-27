import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { formatLogLine } from "@shared/logger";

// Mirror of proto enum values (supports both numeric and string when enums are loaded as strings)
// 0: LOG_LEVEL_UNSPECIFIED, 1: DEBUG, 2: INFO, 3: WARN, 4: ERROR, 5: FATAL
function mapLevelToText(level: number | string | undefined): "debug" | "info" | "warn" | "error" | "fatal" {
  if (typeof level === "string") {
    switch (level.toUpperCase()) {
      case "DEBUG":
        return "debug";
      case "INFO":
        return "info";
      case "WARN":
        return "warn";
      case "ERROR":
        return "error";
      case "FATAL":
        return "fatal";
      default:
        return "info";
    }
  }
  switch (level) {
    case 1:
      return "debug";
    case 2:
      return "info";
    case 3:
      return "warn";
    case 4:
      return "error";
    case 5:
      return "fatal";
    default:
      return "info";
  }
}

@Controller()
export class LoggerController {
  @GrpcMethod("Logger", "WriteLog")
  writeLog(data: { timestamp?: string; level?: number; service?: string; func?: string; message?: string; data_json?: string }): { ok: boolean } {
    const timestamp = data.timestamp ?? new Date().toISOString();
    const level = mapLevelToText(data.level ?? 2);
    const service = data.service ?? "unknown";
    const func = data.func ?? "unknown";
    const message = data.message ?? "";
    const parsed = data.data_json ? safeParseJSON(data.data_json) : undefined;

    const line = formatLogLine({ timestamp, level, service, func, message, data: parsed });
    // Output log to stdout
    console.log(line);

    return { ok: true };
  }
}

function safeParseJSON(json: string): any | undefined {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}
