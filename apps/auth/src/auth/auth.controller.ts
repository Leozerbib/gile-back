import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { AuthService } from "./auth.service";
import { AuthRefreshRequestDto, AuthRegisterRequestDto, AuthSignInRequestDto, AuthVerifyOtpRequestDto } from "@shared/types";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("Auth", "SignIn")
  async signIn(data: AuthSignInRequestDto) {
    return this.authService.signIn(data);
  }

  @GrpcMethod("Auth", "SignUp")
  async signUp(data: AuthRegisterRequestDto) {
    return { success: await this.authService.signUp(data) };
  }

  @GrpcMethod("Auth", "VerifyOtp")
  async verifyOtp(data: AuthVerifyOtpRequestDto) {
    return this.authService.verifyOtp(data);
  }

  @GrpcMethod("Auth", "Refresh")
  async refresh(data: AuthRefreshRequestDto) {
    return this.authService.refresh(data);
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
