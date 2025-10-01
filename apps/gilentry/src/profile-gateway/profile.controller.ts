/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Param, Patch, UnauthorizedException } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProfileGatewayService } from "./profile.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import { ProfileNotFoundException } from "@shared/errors";
import { ProfileDto, UpdateProfileDto, ProfilesListDto } from "@shared/types";
import type { AuthenticatedUser } from "@shared/types";

@ApiTags("Profiles")
@Controller("profiles")
export class ProfileGatewayController {
  constructor(private readonly profiles: ProfileGatewayService) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all profiles" })
  @ApiOkResponse({ type: ProfilesListDto })
  async getAll() {
    const res = await this.profiles.getAll();
    return res; // { items: ProfileDto[] }
  }

  @Get("me")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiOkResponse({ type: ProfileDto })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    try {
      return await this.profiles.getByUserId(user.user_id);
    } catch (e: any) {
      if (Number(e?.code) === 5) throw new ProfileNotFoundException();
      throw e;
    }
  }

  @Get(":userId")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get profile by user id" })
  @ApiOkResponse({ type: ProfileDto })
  async getByUserId(@Param("userId") userId: string) {
    try {
      return await this.profiles.getByUserId(userId);
    } catch (e: any) {
      if (Number(e?.code) === 5) throw new ProfileNotFoundException();
      throw e;
    }
  }

  @Patch(":userId")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a profile by user id" })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: ProfileDto })
  async update(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string, @Body() body: UpdateProfileDto) {
    try {
      if (user.user_id !== userId) throw new UnauthorizedException();
      return await this.profiles.update(userId, body);
    } catch (e: any) {
      if (Number(e?.code) === 5) throw new ProfileNotFoundException();
      throw e;
    }
  }
}
