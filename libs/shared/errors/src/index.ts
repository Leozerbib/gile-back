export class DomainError extends Error {
  public readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Not Found") {
    super(message, "NOT_FOUND");
  }
}

export class ValidationError extends DomainError {
  constructor(message = "Validation Error") {
    super(message, "VALIDATION_ERROR");
  }
}

export * from "./microservice-unavailable.exception";
export * from "./grpc-error.util";
export * from "./operators";
export * from "./auth-exceptions";
export * from "./profile-exceptions";
