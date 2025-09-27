import { UnauthorizedException, HttpExceptionOptions } from "@nestjs/common";

export class AuthUnauthorizedException extends UnauthorizedException {
  constructor(message = "UNAUTHORIZED", options?: HttpExceptionOptions) {
    super({ statusCode: 401, error: "Unauthorized", message }, options);
  }
}

export class BadCredentialsException extends UnauthorizedException {
  constructor(message = "WRONG_CREDENTIALS", options?: HttpExceptionOptions) {
    super({ statusCode: 401, error: "BadCredentials", message }, options);
  }
}

export class TokenInvalidException extends UnauthorizedException {
  constructor(message = "INVALID_TOKEN", options?: HttpExceptionOptions) {
    super({ statusCode: 401, error: "InvalidToken", message }, options);
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor(message = "TOKEN_EXPIRED", options?: HttpExceptionOptions) {
    super({ statusCode: 401, error: "TokenExpired", message }, options);
  }
}
