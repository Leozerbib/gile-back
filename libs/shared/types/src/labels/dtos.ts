import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, Matches, IsUUID } from "class-validator";
import { BasePaginationDto } from "../common/page";
import { Expose } from "class-transformer";
import { ProfileOverview } from "../profile/dtos";

export class CreateLabelDto {
  @ApiProperty({
    description: "Nom du label",
    example: "High Priority",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiPropertyOptional({
    description: "Description du label",
    example: "Issues that need immediate attention",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Couleur hexadécimale du label",
    example: "#FF6B6B",
    pattern: "^#?[0-9a-fA-F]{6}$",
  })
  @IsOptional()
  @IsString()
  @Matches(/^#?[0-9a-fA-F]{6}$/)
  color?: string;

  @ApiProperty({
    description: "ID du workspace",
    example: "workspace-uuid-123",
  })
  @IsUUID()
  workspace_id!: string;
}

export class UpdateLabelDto {
  @ApiPropertyOptional({
    description: "Nom du label",
    example: "Critical Priority",
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    description: "Description du label",
    example: "Critical issues requiring immediate attention",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Couleur hexadécimale du label",
    example: "#FF4444",
    pattern: "^#?[0-9a-fA-F]{6}$",
  })
  @IsOptional()
  @IsString()
  @Matches(/^#?[0-9a-fA-F]{6}$/)
  color?: string;
}

export class LabelDto {
  @Expose()
  @ApiProperty({
    description: "ID du label",
    example: 123,
  })
  id!: number;

  @Expose()
  @ApiProperty({
    description: "Nom du label",
    example: "High Priority",
  })
  name!: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Description du label",
    example: "Issues that need immediate attention",
  })
  description?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Couleur hexadécimale du label",
    example: "#FF6B6B",
  })
  color: string;

  @Expose()
  @ApiProperty({
    description: "Date de création du label",
    example: "2023-01-01T00:00:00.000Z",
  })
  created_at!: Date;

  @Expose()
  @ApiProperty({
    description: "Utilisateur qui a créé le label",
    type: ProfileOverview,
  })
  created_by_user!: ProfileOverview;
}

export class LabelsListDto extends BasePaginationDto<LabelDto> {
  @ApiProperty({
    description: "Liste des labels",
    type: [LabelDto],
  })
  items: LabelDto[];
}

export const LabelDtoSelect = {
  id: true,
  name: true,
  description: true,
  color: true,
  created_at: true,
  created_by_user: true,
} as const;

// Type helpers for Prisma query return types
export type PrismaLabelOverview = {
  id: number;
  name: string;
  color: string | null;
};

export type PrismaLabelDto = {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
};

export type PrismaLabelList = PrismaLabelOverview[];
