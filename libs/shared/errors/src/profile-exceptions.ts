import { ConflictException, HttpExceptionOptions, NotFoundException } from "@nestjs/common";

export class ProfileNotFoundException extends NotFoundException {
  constructor(message = "PROFILE_NOT_FOUND", options?: HttpExceptionOptions) {
    super({ statusCode: 404, error: "Not Found", message }, options);
  }
}

export class ProfileAlreadyExistsException extends ConflictException {
  constructor(message = "PROFILE_ALREADY_EXISTS", options?: HttpExceptionOptions) {
    super({ statusCode: 409, error: "Conflict", message }, options);
  }
}
