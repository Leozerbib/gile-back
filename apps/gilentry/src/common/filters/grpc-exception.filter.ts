/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import { MicroserviceUnavailableException } from "@shared/errors";
import { isGrpcUnavailableError, mapGrpcErrorDetail } from "@shared/errors";
import { LoggerClientService } from "@shared/logger";

@Injectable()
@Catch()
export class GrpcToHttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerClientService) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If it's already a MicroserviceUnavailableException, just serialize it
    if (exception instanceof MicroserviceUnavailableException) {
      const body = exception.getResponse();
      const status = (exception.getStatus && exception.getStatus()) || HttpStatus.SERVICE_UNAVAILABLE;
      await this.logger.log({
        level: "warn",
        service: "main",
        func: "grpc.unavailable",
        message: `Microservice ${typeof body === "object" && body && (body as any).service ? (body as any).service : "unknown"} unavailable`,
        data: { path: request.url, detail: typeof body === "object" ? (body as any).detail : undefined },
      });
      return response.status(status).json(body);
    }

    // Map typical gRPC connectivity errors to a clear 503 message
    if (isGrpcUnavailableError(exception)) {
      const detail = mapGrpcErrorDetail(exception);
      await this.logger.log({
        level: "warn",
        service: "main",
        func: "grpc.unavailable",
        message: "Microservice unavailable",
        data: { path: request.url, detail },
      });
      const body = new MicroserviceUnavailableException("unknown", detail, { path: request.url }).getResponse();
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json(body);
    }

    // Handle unauthorized HTTP errors (guards) without default console log
    if (exception instanceof UnauthorizedException) {
      const status = exception.getStatus?.() ?? HttpStatus.UNAUTHORIZED;
      const body = exception.getResponse?.() ?? { statusCode: status, error: "Unauthorized", message: "UNAUTHORIZED" };
      await this.logger.log({ level: "warn", service: "main", func: "auth.guard", message: "Unauthorized access", data: { path: request.url } });
      return response.status(status).json(body);
    }

    // Map gRPC business errors (e.g., UNAUTHENTICATED) to HTTP status without logging here
    if (typeof exception?.code === "number") {
      const httpStatus = mapGrpcCodeToHttpStatus(exception.code);
      const message = extractGrpcMessage(exception) || HttpStatus[httpStatus] || "Error";
      return response.status(httpStatus).json({ statusCode: httpStatus, error: HttpStatus[httpStatus], message });
    }

    // Not a gRPC connectivity issue — let Nest default error handler manage
    throw exception;
  }
}

function mapGrpcCodeToHttpStatus(code: number): number {
  switch (code) {
    case 16: // UNAUTHENTICATED
      return HttpStatus.UNAUTHORIZED;
    case 7: // PERMISSION_DENIED
      return HttpStatus.FORBIDDEN;
    case 5: // NOT_FOUND
      return HttpStatus.NOT_FOUND;
    case 6: // ALREADY_EXISTS
      return HttpStatus.CONFLICT;
    case 3: // INVALID_ARGUMENT
      return HttpStatus.BAD_REQUEST;
    case 13: // INTERNAL
      return HttpStatus.INTERNAL_SERVER_ERROR;
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

function extractGrpcMessage(exception: any): string | undefined {
  if (!exception) return undefined;
  if (typeof exception.details === "string" && exception.details.length > 0) return exception.details;
  if (typeof exception.message === "string" && exception.message.length > 0) return exception.message;
  return undefined;
}
