import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { AuthService } from "./auth.service";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("Auth", "SignIn")
  async signIn(data: { email: string; password: string }) {
    return this.authService.signIn(data.email, data.password);
  }

  @GrpcMethod("Auth", "SignUp")
  async signUp(data: { email: string; password: string }) {
    return this.authService.signUp(data.email, data.password);
  }

  @GrpcMethod("Auth", "Refresh")
  async refresh(data: { refresh_token: string }) {
    return this.authService.refresh(data.refresh_token);
  }

  @GrpcMethod("Auth", "Verify")
  async verify(data: { access_token: string }) {
    return this.authService.verify(data.access_token);
  }

  @GrpcMethod("Auth", "GetUser")
  async getUser(data: { user_id: string }) {
    return this.authService.getUser(data.user_id);
  }
}
