import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { ProfilesListDto, ProfileDto } from "@shared/types";

interface ProfileGrpc {
  getByUserId(req: { user_id: string }): any;
  getAll(req: Record<string, never>): any;
  insert(req: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): any;
  update(req: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): any;
}

@Injectable()
export class ProfileGatewayService implements OnModuleInit {
  private svc!: ProfileGrpc;
  constructor(@Inject("PROFILE_CLIENT") private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.svc = this.client.getService<ProfileGrpc>("ProfileService");
  }

  async getByUserId(user_id: string): Promise<ProfileDto> {
    return firstValueFrom(this.svc.getByUserId({ user_id })) as Promise<ProfileDto>;
  }

  async getAll(): Promise<ProfilesListDto> {
    return firstValueFrom(this.svc.getAll({} as any)) as Promise<ProfilesListDto>;
  }

  async insert(body: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<ProfileDto> {
    return firstValueFrom(this.svc.insert(body)) as Promise<ProfileDto>;
  }

  async update(user_id: string, body: { username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<ProfileDto> {
    return firstValueFrom(this.svc.update({ user_id, ...body })) as Promise<ProfileDto>;
  }
}
