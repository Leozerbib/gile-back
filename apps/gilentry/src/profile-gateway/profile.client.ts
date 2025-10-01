import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, Observable } from "rxjs";
import type { ProfilesListDto, ProfileDto } from "@shared/types";

interface ProfileGrpc {
  getByUserId(req: { user_id: string }): Observable<ProfileDto>;
  getAll(req: object): Observable<ProfilesListDto>;
  insert(req: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Observable<{ success: boolean }>;
  update(req: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Observable<ProfileDto>;
}

@Injectable()
export class ProfileGatewayService implements OnModuleInit {
  private svc!: ProfileGrpc;
  constructor(@Inject("PROFILE_CLIENT") private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.svc = this.client.getService<ProfileGrpc>("ProfileService");
  }

  async getByUserId(user_id: string): Promise<ProfileDto> {
    return await firstValueFrom(this.svc.getByUserId({ user_id }));
  }

  async getAll(): Promise<ProfilesListDto> {
    return await firstValueFrom(this.svc.getAll({}));
  }

  async insert(body: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<{ success: boolean }> {
    return await firstValueFrom(this.svc.insert(body));
  }

  async update(user_id: string, body: { username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<ProfileDto> {
    return await firstValueFrom(this.svc.update({ user_id, ...body }));
  }
}
