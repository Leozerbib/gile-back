import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, Observable } from "rxjs";
import type { AuthRefreshRequestDto, AuthRegisterRequestDto, AuthSignInRequestDto, AuthTokensDto, AuthUserDto, AuthVerifyOtpRequestDto, AuthVerifyRequestDto } from "@shared/types";

interface AuthGrpc {
  signIn(req: AuthSignInRequestDto): any;
  signUp(req: AuthRegisterRequestDto): Observable<{ success: boolean }>;
  refresh(req: AuthRefreshRequestDto): any;
  verifyOtp(req: AuthVerifyOtpRequestDto): any;
  verify(req: AuthVerifyRequestDto): any;
  getUser(req: { user_id: string }): any;
}

export interface AuthVerifyResponse {
  valid: boolean;
  user_id: string;
  email: string;
  reason: string;
}

@Injectable()
export class AuthGatewayService implements OnModuleInit {
  private svc!: AuthGrpc;
  constructor(@Inject("AUTH_CLIENT") private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.svc = this.client.getService<AuthGrpc>("Auth");
  }

  async signIn(req: AuthSignInRequestDto): Promise<AuthTokensDto> {
    return firstValueFrom(this.svc.signIn(req));
  }

  async signUp(req: AuthRegisterRequestDto): Promise<{ success: boolean }> {
    return firstValueFrom(this.svc.signUp(req));
  }

  async refresh(req: AuthRefreshRequestDto) {
    return firstValueFrom(this.svc.refresh(req));
  }

  async verifyOtp(req: AuthVerifyOtpRequestDto): Promise<AuthTokensDto> {
    return firstValueFrom(this.svc.verifyOtp(req));
  }

  async verify(req: AuthVerifyRequestDto): Promise<AuthVerifyResponse> {
    return firstValueFrom(this.svc.verify(req));
  }

  async getUser(user_id: string): Promise<AuthUserDto> {
    return firstValueFrom(this.svc.getUser({ user_id }));
  }
}
