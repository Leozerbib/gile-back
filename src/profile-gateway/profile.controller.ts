import { Body, Controller, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProfileGatewayService } from "./profile.client";
import { Auth, CurrentUser } from "../auth-gateway/auth.decorators";
import { ProfilesListDto, ProfileDto, UpdateProfileDto, CreateProfileDto } from "@shared/types";
import { ProfileAlreadyExistsException, ProfileNotFoundException } from "@shared/errors";
import { normalizeObject } from "@shared/utils";
import { AuthUser } from "@supabase/supabase-js";

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
    const res = normalizeObject(await this.profiles.getAll());
    return res; // { items: ProfileDto[] }
  }

  @Get("me")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiOkResponse({ type: ProfileDto })
  async getMe(@CurrentUser() user: any) {
    try {
      return normalizeObject(await this.profiles.getByUserId(user.id));
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
      return normalizeObject(await this.profiles.getByUserId(userId));
    } catch (e: any) {
      if (Number(e?.code) === 5) throw new ProfileNotFoundException();
      throw e;
    }
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: "Insert a profile" })
  @ApiBody({ type: CreateProfileDto })
  @ApiOkResponse({ type: ProfileDto })
  async insert(@Body() body: CreateProfileDto) {
    try {
      return normalizeObject(await this.profiles.insert(body));
    } catch (e: any) {
      if (Number(e?.code) === 6) throw new ProfileAlreadyExistsException();
      throw e;
    }
  }

  @Patch(":userId")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a profile by user id" })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: ProfileDto })
  async update(@Param("userId") userId: string, @Body() body: UpdateProfileDto) {
    try {
      return normalizeObject(await this.profiles.update(userId, body));
    } catch (e: any) {
      if (Number(e?.code) === 5) throw new ProfileNotFoundException();
      throw e;
    }
  }
}
