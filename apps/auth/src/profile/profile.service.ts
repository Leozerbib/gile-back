import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma";
import { LoggerClientService } from "@shared/logger";
import { RpcException } from "@nestjs/microservices";
import { status } from "@grpc/grpc-js";
import { normalizeWithRequiredFields } from "@shared/utils";

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerClientService,
  ) {}

  async getByUserId(userId: string) {
    const row = await this.prisma.profiles.findUnique({ where: { user_id: userId } });
    if (!row) throw new RpcException({ code: status.NOT_FOUND, message: "PROFILE_NOT_FOUND" });
    return row;
  }

  async getAll() {
    return this.prisma.profiles.findMany({ orderBy: { created_at: "desc" } });
  }

  async insert(data: { user_id: string; username?: string; first_name?: string; last_name?: string; avatar_url?: string }) {
    try {
      // Normaliser les données d'entrée pour convertir les chaînes vides en null
      // user_id est requis, username est requis, les autres sont optionnels
      const normalizedData = normalizeWithRequiredFields(data, ["user_id", "username"]);

      const created = await this.prisma.profiles.create({
        data: {
          user_id: normalizedData.user_id,
          username: normalizedData.username ?? normalizedData.user_id,
          first_name: normalizedData.first_name ?? null,
          last_name: normalizedData.last_name ?? null,
          avatar_url: normalizedData.avatar_url ?? null,
        },
      });
      await this.logger.log({ level: "info", service: "auth", func: "profile.insert", message: "Profile inserted", data: { userId: normalizedData.user_id } });
      return created;
    } catch (e: any) {
      // handle unique violations
      throw new RpcException({ code: status.ALREADY_EXISTS, message: "PROFILE_ALREADY_EXISTS" });
    }
  }

  async update(userId: string, data: { username?: string; first_name?: string; last_name?: string; avatar_url?: string }) {
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
      });
      await this.logger.log({ level: "info", service: "auth", func: "profile.update", message: "Profile updated", data: { userId } });
      return updated;
    } catch (e: any) {
      throw new RpcException({ code: status.NOT_FOUND, message: "PROFILE_NOT_FOUND" });
    }
  }
}
