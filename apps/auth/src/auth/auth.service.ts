/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoggerClientService } from "@shared/logger";
import { SupabaseClientProvider } from "./supabase.provider";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { ProfileService } from "../profile/profile.service";
import { AuthRefreshRequestDto, AuthRegisterRequestDto, AuthSignInRequestDto, AuthVerifyOtpRequestDto } from "@shared/types";

function parseTTL(ttl?: string): string {
  return ttl && ttl.trim().length > 0 ? ttl : "15m";
}

function parseRefreshTTL(ttl?: string): string {
  return ttl && ttl.trim().length > 0 ? ttl : "7d";
}

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? "change_me";
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? "change_me_refresh";
  private readonly accessTtl = parseTTL(process.env.JWT_ACCESS_TTL);
  private readonly refreshTtl = parseRefreshTTL(process.env.JWT_REFRESH_TTL);

  constructor(
    private readonly jwt: JwtService,
    private readonly logger: LoggerClientService,
    private readonly supabaseProvider: SupabaseClientProvider,
  ) {}

  async signIn(body: AuthSignInRequestDto) {
    const supabase = this.supabaseProvider.getClient();
    await this.logger.log({ level: "info", service: "auth", func: "signIn", message: "Sign-in attempt", data: { email: body.email } });
    const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
    if (error || !data?.user) {
      await this.logger.log({ level: "warn", service: "auth", func: "signIn", message: "Invalid credentials", data: { email: body.email } });
      // Return UNAUTHENTICATED to caller
      throw new RpcException({ code: status.UNAUTHENTICATED, message: "WRONG_CREDENTIALS" });
    }
    const user = data.user;
    const payload = { sub: user.id, email: user.email, typ: "access" };
    const access_token = await this.jwt.signAsync(payload, { secret: this.accessSecret, expiresIn: this.accessTtl, algorithm: "HS256" });
    const refresh_token = await this.jwt.signAsync({ sub: user.id, typ: "refresh" }, { secret: this.refreshSecret, expiresIn: this.refreshTtl, algorithm: "HS256" });
    const expires_in = this.expiresInSeconds(this.accessTtl);

    await this.logger.log({ level: "info", service: "auth", func: "signIn", message: "Sign-in success", data: { userId: user.id } });

    return {
      access_token,
      refresh_token,
      expires_in,
      token_type: "Bearer",
    };
  }

  async signUp(body: AuthRegisterRequestDto): Promise<boolean> {
    const supabase = this.supabaseProvider.getClient();
    await this.logger.log({ level: "info", service: "auth", func: "signUp", message: "Sign-up attempt", data: { email: body.email } });
    const { data, error } = await supabase.auth.signUp({ email: body.email, password: body.password });

    if (error || !data?.user) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: "SIGN_UP_FAILED" });
    }

    await this.logger.log({ level: "info", service: "auth", func: "signUp", message: "Sign-up success", data: { userId: data.user.id } });

    return true;
  }

  async verifyOtp(body: AuthVerifyOtpRequestDto) {
    const supabase = this.supabaseProvider.getClient();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: body.email,
        token: body.otp,
        type: "email",
      });

      if (error || !data?.user) {
        await this.logger.log({
          level: "warn",
          service: "auth",
          func: "verifyOtp",
          message: "OTP verification failed",
          data: { email: body.email, error: String(error?.message ?? error) },
        });
        throw new RpcException({ code: status.INVALID_ARGUMENT, message: "INVALID_OTP" });
      }

      const user = data.user;
      const payload = { sub: user.id, email: user.email, typ: "access" };
      const access_token = await this.jwt.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: this.accessTtl,
        algorithm: "HS256",
      });
      const refresh_token = await this.jwt.signAsync({ sub: user.id, typ: "refresh" }, { secret: this.refreshSecret, expiresIn: this.refreshTtl, algorithm: "HS256" });
      const expires_in = this.expiresInSeconds(this.accessTtl);

      await this.logger.log({ 
        level: "info",
        service: "auth",
        func: "verifyOtp",
        message: "OTP verification success",
        data: { userId: user.id },
      });

      return {
        access_token,
        refresh_token,
        expires_in,
        token_type: "Bearer",
      };
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }
      await this.logger.log({
        level: "error",
        service: "auth",
        func: "verifyOtp",
        message: "OTP verification error",
        data: { email: body.email, error: String(err?.message ?? err) },
      });
      throw new RpcException({ code: status.INTERNAL, message: "OTP_VERIFICATION_ERROR" });
    }
  }

  async refresh(body: AuthRefreshRequestDto) {
    try {
      const decoded = await this.jwt.verifyAsync(body.refresh_token, { secret: this.refreshSecret });
      if (decoded?.typ !== "refresh") {
        throw new Error("INVALID_TOKEN_TYPE");
      }
      const access_token = await this.jwt.signAsync({ sub: decoded.sub, typ: "access" }, { secret: this.accessSecret, expiresIn: this.accessTtl, algorithm: "HS256" });
      const new_refresh = await this.jwt.signAsync({ sub: decoded.sub, typ: "refresh" }, { secret: this.refreshSecret, expiresIn: this.refreshTtl, algorithm: "HS256" });
      const expires_in = this.expiresInSeconds(this.accessTtl);

      await this.logger.log({ level: "info", service: "auth", func: "refresh", message: "Token refreshed", data: { userId: decoded.sub } });

      return { access_token, refresh_token: new_refresh, expires_in, token_type: "Bearer" };
    } catch (err) {
      await this.logger.log({ level: "warn", service: "auth", func: "refresh", message: "Refresh failed", data: { reason: String(err?.message ?? err) } });
      throw new RpcException({ code: status.UNAUTHENTICATED, message: "INVALID_REFRESH_TOKEN" });
    }
  }

  async getUser(userId: string) {
    try {
      const supabase = this.supabaseProvider.getClient();
      const { data, error } = await (supabase.auth.admin as any).getUserById(userId);
      if (error || !data?.user) throw error || new Error("USER_NOT_FOUND");
      const u: any = data.user;
      const email_confirmed = !!(u.email_confirmed_at || u.email_confirmed);
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at ?? null,
        updated_at: u.updated_at ?? null,
        email_confirmed,
        last_sign_in_at: u.last_sign_in_at ?? null,
      };
    } catch (err) {
      await this.logger.log({ level: "warn", service: "auth", func: "getUser", message: "GetUser failed", data: { userId, reason: String((err as any)?.message ?? err) } });
      throw new RpcException({ code: status.NOT_FOUND, message: "USER_NOT_FOUND" });
    }
  }

  async verify(accessToken: string) {
    try {
      let token = (accessToken || "").trim();
      if (token.toLowerCase().startsWith("bearer ")) token = token.slice(7).trim();
      if (!token) return { valid: false, user_id: "", email: "", reason: "INVALID_TOKEN" };

      // Decode first to check token type (no secret needed for decode)
      const preview: any = this.jwt.decode(token) || {};

      const decoded: any = await this.jwt.verifyAsync(token, {
        secret: this.accessSecret,
        clockTolerance: 15, // allow leeway for local clocks
      });

      if ((preview?.typ ?? decoded?.typ) !== "access") {
        return { valid: false, user_id: "", email: "", reason: "INVALID_TOKEN_TYPE" };
      }
      return { valid: true, user_id: decoded.sub ?? "", email: decoded.email ?? "", reason: "" };
    } catch (err) {
      const msg = String(err?.message ?? err).toUpperCase();
      let reason = "INVALID_TOKEN";
      if (msg.includes("EXPIRED")) reason = "TOKEN_EXPIRED";
      if (msg.includes("MALFORMED") || msg.includes("SIGNATURE") || msg.includes("INVALID")) reason = "INVALID_TOKEN";
      await this.logger.log({ level: "warn", service: "auth", func: "verify", message: "Verify failed", data: { reason } });
      return { valid: false, user_id: "", email: "", reason };
    }
  }

  private expiresInSeconds(ttl: string): number {
    // Simple parse for s/m/h/d
    const m = ttl.match(/^(\d+)([smhd])$/i);
    if (!m) return 900;
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    switch (unit) {
      case "s":
        return n;
      case "m":
        return n * 60;
      case "h":
        return n * 3600;
      case "d":
        return n * 86400;
      default:
        return 900;
    }
  }
}
