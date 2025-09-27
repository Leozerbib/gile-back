import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { AuthTokensDto, AuthUserDto } from "@shared/types";

interface AuthGrpc {
  signIn(req: { email: string; password: string }): any;
  signUp(req: { email: string; password: string }): any;
  refresh(req: { refresh_token: string }): any;
  verify(req: { access_token: string }): any;
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

  async signIn(email: string, password: string): Promise<AuthTokensDto> {
    return firstValueFrom(this.svc.signIn({ email, password })) as Promise<AuthTokensDto>;
  }

  async signUp(email: string, password: string): Promise<AuthTokensDto> {
    return firstValueFrom(this.svc.signUp({ email, password })) as Promise<AuthTokensDto>;
  }

  async refresh(refresh_token: string) {
    return firstValueFrom(this.svc.refresh({ refresh_token }));
  }

  async verify(access_token: string): Promise<AuthVerifyResponse> {
    return firstValueFrom(this.svc.verify({ access_token })) as Promise<AuthVerifyResponse>;
  }

  async getUser(user_id: string): Promise<AuthUserDto> {
    return firstValueFrom(this.svc.getUser({ user_id })) as Promise<AuthUserDto>;
  }
}
