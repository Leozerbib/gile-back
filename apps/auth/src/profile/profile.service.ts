import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { normalizeWithRequiredFields } from "@shared/utils";
import { BasePaginationDto, ProfileDto, ProfileDtoSelect, ProfilesListDto } from "@shared/types";
import { plainToInstance } from "class-transformer";

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerClientService,
  ) {}

  async getByUserId(userId: string): Promise<ProfileDto> {
    const row = await this.prisma.profiles.findUnique({ where: { user_id: userId }, select: ProfileDtoSelect });
    if (!row) throw new RpcException({ code: status.NOT_FOUND, message: "PROFILE_NOT_FOUND" });
    return plainToInstance(ProfileDto, row);
  }

  async getAll(): Promise<ProfilesListDto> {
    const [items, total] = await Promise.all([this.prisma.profiles.findMany({ orderBy: { created_at: "desc" }, select: ProfileDtoSelect }), this.prisma.profiles.count()]);
    return BasePaginationDto.create(
      items.map(item => plainToInstance(ProfileDto, item)),
      total,
      0,
      items.length,
      ProfilesListDto,
    );
  }

  async insert(data: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<boolean> {
    try {
      // Normaliser les données d'entrée pour convertir les chaînes vides en null
      // user_id est requis, username est requis, les autres sont optionnels
      const normalizedData = normalizeWithRequiredFields(data, ["user_id", "username"]);

      await this.prisma.profiles.create({
        data: {
          user_id: normalizedData.user_id,
          username: normalizedData.username ?? normalizedData.user_id,
          first_name: normalizedData.first_name ?? null,
          last_name: normalizedData.last_name ?? null,
          avatar_url: normalizedData.avatar_url ?? null,
        },
        select: ProfileDtoSelect,
      });
      await this.logger.log({ level: "info", service: "auth", func: "profile.insert", message: "Profile inserted", data: { userId: normalizedData.user_id } });
      return true;
    } catch (e: any) {
      await this.logger.log({ level: "error", service: "auth", func: "profile.insert", message: "Profile insert failed" });
      if (e instanceof Error) throw new RpcException({ code: status.ALREADY_EXISTS, message: "PROFILE_ALREADY_EXISTS", error: e });
      return false;
    }
  }

  async update(userId: string, data: { username?: string; first_name?: string; last_name?: string; avatar_url?: string }): Promise<ProfileDto | false> {
    try {
      // Normaliser les données d'entrée pour convertir les chaînes vides en null
      // Pour l'update, tous les champs sont optionnels dans l'entrée mais username est requis si fourni
      const requiredFields: (keyof typeof data)[] = [];
      if (data.username !== undefined) {
        requiredFields.push("username");
      }

      const normalizedData = normalizeWithRequiredFields(data, requiredFields);

      const updated = await this.prisma.profiles.update({
        where: { user_id: userId },
        data: {
          username: normalizedData.username ?? undefined,
          first_name: normalizedData.first_name ?? undefined,
          last_name: normalizedData.last_name ?? undefined,
          avatar_url: normalizedData.avatar_url ?? undefined,
        },
        select: ProfileDtoSelect,
      });
      await this.logger.log({ level: "info", service: "auth", func: "profile.update", message: "Profile updated", data: { userId } });
      return plainToInstance(ProfileDto, updated);
    } catch (e: any) {
      await this.logger.log({ level: "error", service: "auth", func: "profile.update", message: "Profile update failed" });
      if (e instanceof Error) throw new RpcException({ code: status.NOT_FOUND, message: "PROFILE_NOT_FOUND", error: e });
      return false;
    }
  }
}
