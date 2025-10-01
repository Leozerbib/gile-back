/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGatewayService } from "./auth.client";
import { AuthUnauthorizedException, TokenExpiredException, TokenInvalidException } from "@shared/errors";
import { LoggerClientService } from "@shared/logger";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthGatewayService,
    private readonly logger: LoggerClientService,
  ) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers["authorization"] || req.headers["Authorization"];
    const token = extractBearer(header);
    if (!token) {
      await this.logger.log({ level: "warn", service: "main", func: "auth.guard", message: "Missing bearer token", data: { path: req.url, ip: req.ip } });
      throw new AuthUnauthorizedException("MISSING_BEARER_TOKEN");
    }
    const res = await this.auth.verify({ access_token: token });
    if (!res?.valid) {
      const reason = String(res?.reason || "").toUpperCase();
      await this.logger.log({ level: "warn", service: "main", func: "auth.guard", message: "Unauthorized access", data: { path: req.url, ip: req.ip, reason } });
      if (reason.includes("EXPIRED")) throw new TokenExpiredException();
      if (reason.includes("INVALID")) throw new TokenInvalidException();
      throw new AuthUnauthorizedException("UNAUTHORIZED");
    }
    req.user = { user_id: res.user_id };
    return true;
  }
}

function extractBearer(header?: string): string {
  if (!header) return "";
  const [typ, val] = String(header).split(" ");
  if (!val || typ.toLowerCase() !== "bearer") return "";
  return val;
}
