import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ProfileService } from "./profile.service";

@Controller()
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @GrpcMethod("ProfileService", "GetByUserId")
  async getByUserId(data: { user_id: string }) {
    const row = await this.service.getByUserId(data.user_id);
    return serialize(row);
  }

  @GrpcMethod("ProfileService", "GetAll")
  async getAll(_: Record<string, never>) {
    const rows = await this.service.getAll();
    return { items: rows.map(serialize) };
  }

  @GrpcMethod("ProfileService", "Insert")
  async insert(data: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }) {
    const row = await this.service.insert({
      user_id: data.user_id,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
    });
    return serialize(row);
  }

  @GrpcMethod("ProfileService", "Update")
  async update(data: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }) {
    const row = await this.service.update(data.user_id, {
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
    });
    return serialize(row);
  }
}

function serialize(row: any) {
  return {
    id: String(row.id),
    user_id: row.user_id,
    username: row.username ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    avatar_url: row.avatar_url ?? null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : null,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : null,
  };
}
