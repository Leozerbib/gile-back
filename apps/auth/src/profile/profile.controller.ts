import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ProfileService } from "./profile.service";
import { ProfileDto, ProfilesListDto } from "@shared/types";

@Controller()
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @GrpcMethod("ProfileService", "GetByUserId")
  async getByUserId(data: { user_id: string }): Promise<ProfileDto> {
    const row = await this.service.getByUserId(data.user_id);
    return row;
  }

  @GrpcMethod("ProfileService", "GetAll")
  async getAll(): Promise<ProfilesListDto> {
    const rows = await this.service.getAll();
    return rows;
  }

  @GrpcMethod("ProfileService", "Insert")
  async insert(data: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<{ success: boolean }> {
    const row = await this.service.insert({
      user_id: data.user_id,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
    });
    if (!row) {
      throw new Error("Profile not created");
    }
    return { success: true };
  }

  @GrpcMethod("ProfileService", "Update")
  async update(data: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<ProfileDto> {
    const row = await this.service.update(data.user_id, {
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
    });
    if (!row) {
      throw new Error("Profile not updated");
    }
    return row;
  }
}
