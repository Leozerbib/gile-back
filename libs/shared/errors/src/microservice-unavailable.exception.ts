import { ServiceUnavailableException, HttpExceptionOptions } from "@nestjs/common";

export interface MicroserviceUnavailableBody {
  statusCode: number;
  error: "MicroserviceUnavailable";
  service: string;
  message: string;
  detail?: string;
  timestamp: string;
  path?: string;
}

export class MicroserviceUnavailableException extends ServiceUnavailableException {
  constructor(service: string, detail?: string, options?: HttpExceptionOptions & { path?: string }) {
    const message = `The "${service}" microservice is unavailable. Please try again later.`;
    const body: MicroserviceUnavailableBody = {
      statusCode: 503,
      error: "MicroserviceUnavailable",
      service,
      message,
      detail,
      timestamp: new Date().toISOString(),
      path: options?.path,
    };
    super(body, options);
  }
}
