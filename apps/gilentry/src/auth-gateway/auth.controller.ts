import { Body, Controller, Get, Headers, HttpCode, HttpException, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGatewayService } from "./auth.client";
import { ProfileGatewayService } from "../profile-gateway/profile.client";
import { AuthRegisterRequestDto, AuthSignInRequestDto, AuthRefreshRequestDto, AuthTokensDto, AuthVerifyResponseDto, AuthLoginResponseDto, ProfileDto, AuthVerifyOtpRequestDto } from "@shared/types";
import { normalizeObject } from "@shared/utils";

@ApiTags("Auth")
@Controller("auth")
export class AuthGatewayController {
  constructor(
    private readonly auth: AuthGatewayService,
    private readonly profiles: ProfileGatewayService,
  ) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Sign in with email and password" })
  @ApiBody({
    type: AuthSignInRequestDto,
    examples: {
      default: {
        value: { email: "leospoutnik@gmail.com", password: "Leoleoo1." },
      },
    },
  })
  @ApiOkResponse({ description: "Returns tokens, user and profile", type: AuthLoginResponseDto })
  async signIn(@Body() body: AuthSignInRequestDto) {
    const tokens: AuthTokensDto = await this.auth.signIn(body);
    const ver = await this.auth.verify({ access_token: tokens.access_token });
    const user = await this.auth.getUser(ver.user_id);

    const profile = await (async () => {
      try {
        return await this.profiles.getByUserId(ver.user_id);
      } catch (e: any) {
        if (Number(e?.code) === 5) {
          return await this.profiles.insert({ user_id: ver.user_id, username: (ver.email || "").split("@")[0] });
        }
        throw e;
      }
    })();

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      user,
      profile,
    };
  }

  @Post("register")
  @HttpCode(201)
  @ApiOperation({ summary: "Register with email and password" })
  @ApiBody({
    type: AuthRegisterRequestDto,
    examples: {
      default: {
        value: { email: "newuser@example.com", password: "StrongP@ssw0rd" },
      },
    },
  })
  @ApiCreatedResponse({ description: "Created and returns tokens, user and profile", type: AuthLoginResponseDto })
  async register(@Body() body: AuthRegisterRequestDto) {
    const success: boolean = (await this.auth.signUp(body)).success;
    return { success, message: `Verification email sent to ${body.email}` };
  }

  @Post("verify-otp")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify OTP" })
  @ApiBody({
    type: AuthVerifyOtpRequestDto,
    examples: {
      default: {
        value: { email: "newuser@example.com", otp: 123456 },
      },
    },
  })
  @ApiOkResponse({ description: "Returns tokens, user and profile", type: AuthLoginResponseDto })
  async verifyOtp(@Body() body: AuthVerifyOtpRequestDto) {
    const tokens: AuthTokensDto = await this.auth.verifyOtp(body);

    const ver = await this.auth.verify({ access_token: tokens.access_token });
    const user = await this.auth.getUser(ver.user_id);

    const profile: ProfileDto = await (async () => {
      try {
        return await this.profiles.getByUserId(ver.user_id);
      } catch (e: any) {
        if (Number(e?.code) === 5) {
          if ((await this.profiles.insert({ user_id: ver.user_id, username: (ver.email || "").split("@")[0] })).success) {
            return await this.profiles.getByUserId(ver.user_id);
          }
        }
        throw e;
      }
    })();
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      user,
      profile,
    };
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Refresh tokens using a refresh token" })
  @ApiBody({
    type: AuthRefreshRequestDto,
    examples: {
      default: {
        value: { refresh_token: "eyJhbGciOi...refresh..." },
      },
    },
  })
  @ApiOkResponse({ type: AuthTokensDto })
  async refresh(@Body() body: AuthRefreshRequestDto) {
    return this.auth.refresh(body);
  }

  @Get("verify")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify access token from Authorization: Bearer" })
  @ApiOkResponse({ type: AuthVerifyResponseDto })
  async verify(@Headers("authorization") authHeader?: string) {
    const token = extractBearer(authHeader);
    return this.auth.verify({ access_token: token });
  }
}

function extractBearer(header?: string): string {
  if (!header) return "";
  const [typ, val] = header.split(" ");
  if (!val || typ.toLowerCase() !== "bearer") return "";
  return val;
}
