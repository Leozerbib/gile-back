import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from "class-validator";
import { Expose, Transform } from "class-transformer";
import { ProfileOverview, ProfileOverviewSelect } from "../profile/dtos";
import { BasePaginationDto } from "../common/page";

/**
 * Type d'une stack - classification fonctionnelle
 * Compatible avec Prisma enum StackType
 */
export enum StackType {
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND",
  DATABASE = "DATABASE",
  DEVOPS = "DEVOPS",
  TESTING = "TESTING",
  DOCUMENTATION = "DOCUMENTATION",
}

/**
 * DTO pour la création d'une stack
 * Utilisé dans les endpoints REST et gRPC
 * Compatible avec Prisma model Stack
 */
export class CreateStackDto {
  @ApiProperty({
    description: "Titre de la stack",
    example: "React Frontend Stack",
    minLength: 1,
    maxLength: 200,
    type: "string",
  })
  @Expose()
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  @Length(1, 200, { message: "Le titre doit contenir entre 1 et 200 caractères" })
  title!: string;

  @ApiProperty({
    description: "Type de stack technologique",
    enum: StackType,
    example: StackType.FRONTEND,
    enumName: "StackType",
  })
  @Expose()
  @IsEnum(StackType, { message: "Type de stack invalide" })
  type!: StackType;

  @ApiProperty({
    description: "ID du projet associé",
    example: 123,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsInt({ message: "L'ID du projet doit être un nombre entier" })
  @Min(1, { message: "L'ID du projet doit être positif" })
  project_id!: number;

  @ApiPropertyOptional({
    description: "ID du langage de programmation",
    example: 1,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "L'ID du langage doit être un nombre entier" })
  @Min(1, { message: "L'ID du langage doit être positif" })
  language_id?: number;

  @ApiPropertyOptional({
    description: "Version de la stack",
    example: "18.2.0",
    maxLength: 50,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La version doit être une chaîne de caractères" })
  @MaxLength(50, { message: "La version ne peut pas dépasser 50 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  version?: string;

  @ApiPropertyOptional({
    description: "Description de la stack",
    example: "Modern React stack with TypeScript, Next.js, and Tailwind CSS",
    maxLength: 1000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "La stack est-elle la principale pour le projet",
    example: true,
    type: "boolean",
    default: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ principal doit être un booléen" })
  is_primary?: boolean = false;
}

/**
 * DTO pour la mise à jour d'une stack
 * Tous les champs sont optionnels pour permettre les mises à jour partielles
 * Compatible avec Prisma update operations
 */
export class UpdateStackDto {
  @ApiPropertyOptional({
    description: "Titre de la stack",
    example: "React Frontend Stack v2",
    minLength: 1,
    maxLength: 200,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  @Length(1, 200, { message: "Le titre doit contenir entre 1 et 200 caractères" })
  title?: string;

  @ApiPropertyOptional({
    description: "Type de stack technologique",
    enum: StackType,
    example: StackType.FRONTEND,
    enumName: "StackType",
  })
  @Expose()
  @IsOptional()
  @IsEnum(StackType, { message: "Type de stack invalide" })
  type?: StackType;

  @ApiPropertyOptional({
    description: "Version mise à jour",
    example: "18.3.0",
    maxLength: 50,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La version doit être une chaîne de caractères" })
  @MaxLength(50, { message: "La version ne peut pas dépasser 50 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  version?: string;

  @ApiPropertyOptional({
    description: "Description mise à jour",
    example: "Updated React stack with latest Next.js features",
    maxLength: 1000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "La stack est-elle la principale pour le projet",
    example: false,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ principal doit être un booléen" })
  is_primary?: boolean;
}

/**
 * Vue d'ensemble d'une stack - informations essentielles
 * Utilisé pour les listes et références
 * Compatible avec gRPC message StackOverview
 */
export class StackOverview {
  @ApiProperty({
    description: "ID unique de la stack",
    example: 123,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsInt({ message: "L'ID doit être un nombre entier" })
  @Min(1, { message: "L'ID doit être positif" })
  id!: number;

  @ApiProperty({
    description: "Titre de la stack",
    example: "React Frontend Stack",
    minLength: 1,
    maxLength: 200,
  })
  @Expose()
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  title!: string;

  @ApiProperty({
    description: "Type de stack technologique",
    enum: StackType,
    example: StackType.FRONTEND,
    enumName: "StackType",
  })
  @Expose()
  @IsEnum(StackType, { message: "Type de stack invalide" })
  type!: StackType;

  @ApiPropertyOptional({
    description: "Version de la stack",
    example: "18.2.0",
    maxLength: 50,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La version doit être une chaîne de caractères" })
  @MaxLength(50, { message: "La version ne peut pas dépasser 50 caractères" })
  version?: string;

  @ApiProperty({
    description: "La stack est-elle la principale pour le projet",
    example: true,
    type: "boolean",
  })
  @Expose()
  @IsBoolean({ message: "Le champ principal doit être un booléen" })
  is_primary!: boolean;
}

/**
 * DTO complet d'une stack - hérite de StackOverview avec informations détaillées
 * Utilisé pour les réponses API détaillées et gRPC
 * Compatible avec Prisma model Stack + relations
 */
export class StackDto extends StackOverview {
  @ApiPropertyOptional({
    description: "ID du langage de programmation",
    example: 1,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "L'ID du langage doit être un nombre entier" })
  @Min(1, { message: "L'ID du langage doit être positif" })
  language_id?: number;

  @ApiPropertyOptional({
    description: "Informations sur le langage de programmation",
    type: "object",
    additionalProperties: true,
    example: {
      id: 1,
      name: "TypeScript",
      icon: "https://example.com/icons/typescript.png",
    },
  })
  @Expose()
  @IsOptional()
  language?: {
    id: number;
    name: string;
    icon?: string;
    color?: string;
    description?: string;
  };

  @ApiProperty({
    description: "ID du projet associé à la stack",
    example: 123,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsInt({ message: "L'ID du projet doit être un nombre entier" })
  @Min(1, { message: "L'ID du projet doit être positif" })
  project_id!: number;

  @ApiProperty({
    description: "Date de création de la stack (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsString({ message: "La date de création doit être une chaîne de caractères" })
  created_at!: string;

  @ApiPropertyOptional({
    description: "Date de dernière modification de la stack (ISO 8601)",
    example: "2024-01-15T14:30:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La date de modification doit être une chaîne de caractères" })
  updated_at?: string;

  @ApiPropertyOptional({
    description: "ID de l'utilisateur qui a créé la stack",
    example: "user-uuid-789",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID de l'utilisateur créateur doit être un UUID valide" })
  created_by?: string;

  @ApiPropertyOptional({
    description: "ID de l'utilisateur qui a modifié la stack",
    example: "user-uuid-101",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID de l'utilisateur modificateur doit être un UUID valide" })
  updated_by?: string;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a créé la stack",
    type: ProfileOverview,
  })
  @Expose()
  @IsOptional()
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a modifié la stack",
    type: ProfileOverview,
  })
  @Expose()
  @IsOptional()
  updated_by_user?: ProfileOverview;
}

export class StackListDto extends BasePaginationDto<StackDto> {
  @ApiProperty({
    type: [StackDto],
    description: "Liste des stacks",
  })
  @Expose()
  items!: StackDto[];
}

// Prisma select types for type-safe queries
export const StackOverviewSelect = {
  id: true,
  title: true,
  type: true,
  version: true,
  is_primary: true,
} as const;

export const StackDtoSelect = {
  id: true,
  title: true,
  type: true,
  version: true,
  is_primary: true,
  language_id: true,
  language: {
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      description: true,
    },
  },
  project_id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  created_by_user: {
    select: {
      ...ProfileOverviewSelect,
    },
  },
  updated_by_user: {
    select: {
      ...ProfileOverviewSelect,
    },
  },
} as const;

export const StackListSelect = {
  ...StackDtoSelect,
} as const;

// Type helpers for Prisma query return types
export type PrismaStackOverview = {
  id: number;
  title: string;
  type: string;
  version: string | null;
  is_primary: boolean;
};

export type PrismaStackDto = {
  id: number;
  title: string;
  type: string;
  version: string | null;
  is_primary: boolean;
  language_id: number | null;
  language: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
    description: string | null;
  } | null;
  documentation_url: string | null;
  repository_url: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_by_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  updated_by_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

export type PrismaStackList = PrismaStackDto[];
