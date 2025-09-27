import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";
import { Expose, Transform } from "class-transformer";
import { BasePaginationDto } from "../common/page";
import { ProfileOverview } from "../profile/dtos";

/**
 * Catégorie d'un epic - classification fonctionnelle
 * Compatible avec Prisma enum EpicCategory
 */
export enum EpicCategory {
  SECURITY = "SECURITY",
  PERFORMANCE = "PERFORMANCE",
  OPTIMIZATION = "OPTIMIZATION",
  FEATURE = "FEATURE",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  DOCUMENTATION = "DOCUMENTATION",
  TESTING = "TESTING",
  REFACTORING = "REFACTORING",
  RESEARCH = "RESEARCH",
  DESIGN = "DESIGN",
}

/**
 * Statut d'un epic - cycle de vie de l'epic
 * Compatible avec Prisma enum EpicStatus
 */
export enum EpicStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

/**
 * DTO pour la création d'un epic
 * Utilisé dans les endpoints REST et gRPC
 * Compatible avec Prisma model Epic
 */
export class CreateEpicDto {
  @ApiProperty({
    description: "Titre de l'epic",
    example: "Authentication System Overhaul",
    minLength: 1,
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le titre doit contenir entre 1 et 255 caractères" })
  title!: string;

  @ApiPropertyOptional({
    description: "Slug de l'epic (généré automatiquement si non fourni)",
    example: "authentication-system-overhaul",
    pattern: "^[a-z0-9-]+$",
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le slug doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le slug doit contenir entre 1 et 255 caractères" })
  slug?: string;

  @ApiPropertyOptional({
    description: "Description de l'epic",
    example: "Complete overhaul of the authentication system including OAuth integration, MFA, and improved security",
    maxLength: 2000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : (value as string)))
  description?: string;

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

  @ApiProperty({
    description: "Catégorie de l'epic",
    enum: EpicCategory,
    example: EpicCategory.FEATURE,
    enumName: "EpicCategory",
  })
  @Expose()
  @IsEnum(EpicCategory, { message: "Catégorie d'epic invalide" })
  category!: EpicCategory;

  @ApiPropertyOptional({
    description: "Statut de l'epic",
    enum: EpicStatus,
    default: EpicStatus.TODO,
    example: EpicStatus.TODO,
    enumName: "EpicStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(EpicStatus, { message: "Statut d'epic invalide" })
  status?: EpicStatus = EpicStatus.TODO;

  @ApiPropertyOptional({
    description: "Priorité de l'epic (0-100)",
    default: 50,
    minimum: 0,
    maximum: 100,
    example: 75,
    type: "integer",
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La priorité doit être un nombre entier" })
  @Min(0, { message: "La priorité ne peut pas être négative" })
  @Max(100, { message: "La priorité ne peut pas dépasser 100" })
  priority?: number = 50;

  @ApiPropertyOptional({
    description: "Date de début (format ISO 8601)",
    example: "2024-01-15",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de début doit être une date valide ISO 8601" })
  start_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin prévue (format ISO 8601)",
    example: "2024-03-15",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide ISO 8601" })
  end_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin réelle (format ISO 8601)",
    example: "2024-03-10",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin réelle doit être une date valide ISO 8601" })
  actual_end_date?: string;

  @ApiPropertyOptional({
    description: "Progression de l'epic (0-100)",
    default: 0,
    minimum: 0,
    maximum: 100,
    example: 35,
    type: "integer",
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La progression doit être un nombre entier" })
  @Min(0, { message: "La progression ne peut pas être négative" })
  @Max(100, { message: "La progression ne peut pas dépasser 100" })
  progress?: number = 0;
}

/**
 * DTO pour la mise à jour d'un epic
 * Tous les champs sont optionnels pour permettre les mises à jour partielles
 * Compatible avec Prisma update operations
 */
export class UpdateEpicDto {
  @ApiPropertyOptional({
    description: "Titre de l'epic",
    example: "Authentication System Overhaul v2",
    minLength: 1,
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le titre doit contenir entre 1 et 255 caractères" })
  title?: string;

  @ApiPropertyOptional({
    description: "Slug de l'epic",
    example: "authentication-system-overhaul-v2",
    pattern: "^[a-z0-9-]+$",
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le slug doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le slug doit contenir entre 1 et 255 caractères" })
  slug?: string;

  @ApiPropertyOptional({
    description: "Description de l'epic",
    example: "Updated description with additional requirements",
    maxLength: 2000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : (value as string)))
  description?: string;

  @ApiPropertyOptional({
    description: "Catégorie de l'epic",
    enum: EpicCategory,
    example: EpicCategory.FEATURE,
    enumName: "EpicCategory",
  })
  @Expose()
  @IsOptional()
  @IsEnum(EpicCategory, { message: "Catégorie d'epic invalide" })
  category?: EpicCategory;

  @ApiPropertyOptional({
    description: "Statut de l'epic",
    enum: EpicStatus,
    example: EpicStatus.IN_PROGRESS,
    enumName: "EpicStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(EpicStatus, { message: "Statut d'epic invalide" })
  status?: EpicStatus;

  @ApiPropertyOptional({
    description: "Priorité de l'epic (0-100)",
    minimum: 0,
    maximum: 100,
    example: 80,
    type: "integer",
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La priorité doit être un nombre entier" })
  @Min(0, { message: "La priorité ne peut pas être négative" })
  @Max(100, { message: "La priorité ne peut pas dépasser 100" })
  priority?: number;
}

/**
 * Vue d'ensemble d'un epic - informations essentielles
 * Utilisé pour les listes et références
 * Compatible avec gRPC message EpicOverview
 */
export class EpicOverview {
  @ApiProperty({
    description: "ID unique de l'epic",
    example: 1,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsInt({ message: "L'ID doit être un nombre entier" })
  @Min(1, { message: "L'ID doit être positif" })
  id!: number;

  @ApiProperty({
    description: "Titre de l'epic",
    example: "Authentication System Overhaul",
    minLength: 1,
    maxLength: 255,
  })
  @Expose()
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  title!: string;

  @ApiProperty({
    description: "Progression de l'epic (0-100)",
    example: 35,
    type: "integer",
    minimum: 0,
    maximum: 100,
  })
  @Expose()
  @IsInt({ message: "La progression doit être un nombre entier" })
  @Min(0, { message: "La progression ne peut pas être négative" })
  @Max(100, { message: "La progression ne peut pas dépasser 100" })
  progress!: number;

  @ApiProperty({
    description: "Statut de l'epic",
    enum: EpicStatus,
    example: EpicStatus.IN_PROGRESS,
    enumName: "EpicStatus",
  })
  @Expose()
  @IsEnum(EpicStatus, { message: "Statut d'epic invalide" })
  status!: EpicStatus;

  @ApiProperty({
    description: "Catégorie de l'epic",
    enum: EpicCategory,
    example: EpicCategory.FEATURE,
    enumName: "EpicCategory",
  })
  @Expose()
  @IsEnum(EpicCategory, { message: "Catégorie d'epic invalide" })
  category!: EpicCategory;
}

/**
 * DTO complet d'un epic - hérite d'EpicOverview avec informations détaillées
 * Utilisé pour les réponses API détaillées et gRPC
 * Compatible avec Prisma model Epic + relations
 */
export class EpicDto extends EpicOverview {
  @ApiPropertyOptional({
    description: "Slug de l'epic (identifiant URL-friendly)",
    example: "authentication-system-overhaul",
    pattern: "^[a-z0-9-]+$",
    maxLength: 255,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le slug doit être une chaîne de caractères" })
  slug?: string;

  @ApiPropertyOptional({
    description: "Description de l'epic",
    example: "Complete overhaul of the authentication system including OAuth integration, MFA, and improved security",
    maxLength: 2000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : (value as string)))
  description?: string;

  @ApiPropertyOptional({
    description: "Date de début (format ISO 8601)",
    example: "2024-01-15",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de début doit être une date valide ISO 8601" })
  start_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin prévue (format ISO 8601)",
    example: "2024-03-15",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide ISO 8601" })
  end_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin réelle (format ISO 8601)",
    example: "2024-03-10",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin réelle doit être une date valide ISO 8601" })
  actual_end_date?: string;

  @ApiProperty({
    description: "Date de création de l'epic (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsDateString({}, { message: "La date de création doit être une date valide ISO 8601" })
  created_at!: string;

  @ApiPropertyOptional({
    description: "Date de dernière modification de l'epic (ISO 8601)",
    example: "2024-01-20T14:30:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de modification doit être une date valide ISO 8601" })
  updated_at?: string;

  @ApiPropertyOptional({
    description: "ID de l'utilisateur qui a créé l'epic",
    example: "user-uuid-789",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID de l'utilisateur créateur doit être un UUID valide" })
  created_by?: string;

  @ApiPropertyOptional({
    description: "ID de l'utilisateur qui a modifié l'epic",
    example: "user-uuid-101",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID de l'utilisateur modificateur doit être un UUID valide" })
  updated_by?: string;

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
    description: "Informations sur l'utilisateur qui a créé l'epic",
    type: ProfileOverview,
  })
  @Expose()
  @IsOptional()
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a modifié l'epic",
    type: ProfileOverview,
  })
  @Expose()
  @IsOptional()
  updated_by_user?: ProfileOverview;
}

/**
 * DTO pour la liste paginée d'epics
 * Utilisé pour les réponses de listing avec pagination
 * Compatible avec gRPC message EpicList
 * Étend BasePaginationDto pour une gestion uniforme de la pagination
 */
export class EpicListDto extends BasePaginationDto<EpicOverview> {
  @ApiProperty({
    type: [EpicOverview],
    description: "Liste des epics",
  })
  @Expose()
  items!: EpicOverview[];
}
