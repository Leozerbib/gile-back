import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";
import type { OperatorFunction } from "rxjs";
import { MicroserviceUnavailableException } from "./microservice-unavailable.exception";
import { mapGrpcErrorDetail } from "./grpc-error.util";

export function mapGrpcErrorToUnavailable<T>(service: string): OperatorFunction<T, T> {
  return source => source.pipe(catchError(err => throwError(() => new MicroserviceUnavailableException(service, mapGrpcErrorDetail(err)))));
}
