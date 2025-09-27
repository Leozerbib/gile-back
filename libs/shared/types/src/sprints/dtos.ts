import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, IsDateString, IsEnum, Length, Min, Max, MaxLength } from "class-validator";
import { Expose, Transform, Type } from "class-transformer";
import { ProfileOverview } from "../profile/dtos.js";
import { BasePaginationDto } from "../common/page.js";

/**
 * Enumération des statuts de sprint
 * Compatible avec Prisma enum SprintStatus et gRPC SprintService
 */
export enum SprintStatus {
  PLANNED = "PLANNED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * DTO pour la création d'un sprint
 * Compatible avec Prisma model sprints et gRPC SprintService
 * Utilisé pour créer un nouveau sprint dans un projet
 */
export class CreateSprintDto {
  @ApiProperty({
    description: "Nom du sprint",
    example: "Sprint 1 - Authentication System",
    type: "string",
    minLength: 1,
    maxLength: 255,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le nom du sprint doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le nom du sprint est requis" })
  @Length(1, 255, { message: "Le nom du sprint doit contenir entre 1 et 255 caractères" })
  @Transform(({ value }): string => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @ApiPropertyOptional({
    description: "Description détaillée du sprint",
    example: "Sprint focused on implementing secure authentication system with JWT tokens and role-based access control",
    type: "string",
    maxLength: 2000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(2000, { message: "La description ne peut pas dépasser 2000 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiProperty({
    description: "Identifiant unique du projet associé",
    example: 96,
    type: "integer",
    minimum: 1,
    required: true,
  })
  @Expose()
  @IsInt({ message: "L'ID du projet doit être un nombre entier" })
  @Min(1, { message: "L'ID du projet doit être positif" })
  @Transform(({ value }): number => (typeof value === "string" ? parseInt(value, 10) : value))
  project_id!: number;

  @ApiProperty({
    description: "Date de début prévue du sprint",
    example: "2025-09-23",
    format: "date",
    type: "string",
    required: true,
  })
  @Expose()
  @IsDateString({}, { message: "La date de début doit être au format ISO 8601 (YYYY-MM-DD)" })
  @Transform(({ value }): string => (typeof value === "string" ? value : new Date(value).toISOString().split("T")[0]))
  start_date!: string;

  @ApiPropertyOptional({
    description: "Date de fin prévue du sprint",
    example: "2025-10-07",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être au format ISO 8601 (YYYY-MM-DD)" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value : value ? new Date(value).toISOString().split("T")[0] : value))
  end_date?: string;

  @ApiPropertyOptional({
    description: "Statut initial du sprint",
    enum: SprintStatus,
    example: SprintStatus.PLANNED,
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEnum(SprintStatus, { message: "Statut de sprint invalide" })
  status?: SprintStatus = SprintStatus.PLANNED;

  @ApiPropertyOptional({
    description: "Vélocité estimée du sprint (points par sprint)",
    example: 20,
    type: "integer",
    minimum: 0,
    maximum: 1000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La vélocité doit être un nombre entier" })
  @Min(0, { message: "La vélocité doit être positive ou nulle" })
  @Max(1000, { message: "La vélocité ne peut pas dépasser 1000 points" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseInt(value, 10) : value))
  velocity?: number = 0;

  @ApiPropertyOptional({
    description: "Capacité du sprint (nombre de développeurs * nombre de jours)",
    example: 40,
    type: "integer",
    minimum: 1,
    maximum: 500,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La capacité doit être un nombre entier" })
  @Min(1, { message: "La capacité doit être supérieure à 0" })
  @Max(500, { message: "La capacité ne peut pas dépasser 500" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseInt(value, 10) : value))
  capacity?: number;

  @ApiPropertyOptional({
    description: "Numéro de version du sprint",
    example: 1.0,
    type: "number",
    minimum: 0.1,
    maximum: 99.9,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsNumber({}, { message: "La version doit être un nombre" })
  @Min(0.1, { message: "La version doit être supérieure à 0.1" })
  @Max(99.9, { message: "La version ne peut pas dépasser 99.9" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseFloat(value) : value))
  version?: number = 0.1;
}

/**
 * DTO pour la mise à jour d'un sprint
 * Compatible avec Prisma model sprints et gRPC SprintService
 * Utilisé pour modifier les propriétés d'un sprint existant
 */
export class UpdateSprintDto {
  @ApiPropertyOptional({
    description: "Nom mis à jour du sprint",
    example: "Sprint 1 - Updated Authentication",
    type: "string",
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom du sprint doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le nom du sprint doit contenir entre 1 et 255 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    description: "Description mise à jour du sprint",
    example: "Updated sprint focused on implementing secure authentication system with JWT tokens and role-based access control",
    type: "string",
    maxLength: 2000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(2000, { message: "La description ne peut pas dépasser 2000 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "Date de début mise à jour",
    example: "2025-09-24",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de début doit être au format ISO 8601 (YYYY-MM-DD)" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value : value ? new Date(value).toISOString().split("T")[0] : value))
  start_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin mise à jour",
    example: "2025-10-08",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être au format ISO 8601 (YYYY-MM-DD)" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value : value ? new Date(value).toISOString().split("T")[0] : value))
  end_date?: string;

  @ApiPropertyOptional({
    description: "Date de début réelle du sprint",
    example: "2025-09-24",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de début réelle doit être au format ISO 8601 (YYYY-MM-DD)" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value : value ? new Date(value).toISOString().split("T")[0] : value))
  actual_start_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin réelle du sprint",
    example: "2025-10-08",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin réelle doit être au format ISO 8601 (YYYY-MM-DD)" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value : value ? new Date(value).toISOString().split("T")[0] : value))
  actual_end_date?: string;

  @ApiPropertyOptional({
    description: "Numéro de version mis à jour",
    example: 1.1,
    type: "number",
    minimum: 0.1,
    maximum: 99.9,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsNumber({}, { message: "La version doit être un nombre" })
  @Min(0.1, { message: "La version doit être supérieure à 0.1" })
  @Max(99.9, { message: "La version ne peut pas dépasser 99.9" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseFloat(value) : value))
  version?: number;

  @ApiPropertyOptional({
    description: "Statut mis à jour du sprint",
    enum: SprintStatus,
    example: SprintStatus.ACTIVE,
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEnum(SprintStatus, { message: "Statut de sprint invalide" })
  status?: SprintStatus;

  @ApiPropertyOptional({
    description: "Vélocité mise à jour du sprint",
    example: 25,
    type: "integer",
    minimum: 0,
    maximum: 1000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La vélocité doit être un nombre entier" })
  @Min(0, { message: "La vélocité doit être positive ou nulle" })
  @Max(1000, { message: "La vélocité ne peut pas dépasser 1000 points" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseInt(value, 10) : value))
  velocity?: number;

  @ApiPropertyOptional({
    description: "Capacité mise à jour du sprint",
    example: 45,
    type: "integer",
    minimum: 1,
    maximum: 500,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La capacité doit être un nombre entier" })
  @Min(1, { message: "La capacité doit être supérieure à 0" })
  @Max(500, { message: "La capacité ne peut pas dépasser 500" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseInt(value, 10) : value))
  capacity?: number;

  @ApiPropertyOptional({
    description: "Notes de révision mises à jour",
    example: "Sprint completed ahead of schedule with all authentication features implemented",
    type: "string",
    maxLength: 2000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Les notes de révision doivent être une chaîne de caractères" })
  @MaxLength(2000, { message: "Les notes de révision ne peuvent pas dépasser 2000 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  review_notes?: string;

  @ApiPropertyOptional({
    description: "Notes de rétrospective mises à jour",
    example: "Team worked well together, but we need to improve testing coverage in future sprints",
    type: "string",
    maxLength: 2000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Les notes de rétrospective doivent être une chaîne de caractères" })
  @MaxLength(2000, { message: "Les notes de rétrospective ne peuvent pas dépasser 2000 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  retrospective_notes?: string;
}

/**
 * DTO pour l'aperçu d'un sprint
 * Compatible avec Prisma model sprints et gRPC SprintService
 * Utilisé pour les listes et recherches de sprints
 */
export class SprintOverview {
  @ApiProperty({
    description: "Identifiant unique du sprint",
    example: 1,
    type: "integer",
    minimum: 1,
    required: true,
  })
  @Expose()
  @IsInt({ message: "L'ID du sprint doit être un nombre entier" })
  @Min(1, { message: "L'ID du sprint doit être positif" })
  @Transform(({ value }): number => (typeof value === "string" ? parseInt(value, 10) : value))
  id!: number;

  @ApiProperty({
    description: "Nom du sprint",
    example: "Sprint 1 - Authentication System",
    type: "string",
    minLength: 1,
    maxLength: 255,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le nom du sprint doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le nom du sprint doit contenir entre 1 et 255 caractères" })
  name!: string;

  @ApiPropertyOptional({
    description: "Slug URL-friendly du sprint",
    example: "sprint-1-authentication-system",
    type: "string",
    minLength: 1,
    maxLength: 255,
    pattern: "^[a-z0-9-]+$",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le slug du sprint doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le slug du sprint doit contenir entre 1 et 255 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.toLowerCase().trim() : value))
  slug?: string;

  @ApiProperty({
    description: "Statut actuel du sprint",
    enum: SprintStatus,
    example: SprintStatus.PLANNED,
    type: "string",
    required: true,
  })
  @Expose()
  @IsEnum(SprintStatus, { message: "Statut de sprint invalide" })
  status!: SprintStatus;
}

/**
 * DTO complet pour un sprint
 * Compatible avec Prisma model sprints et gRPC SprintService
 * Utilisé pour les réponses détaillées et opérations CRUD complètes
 */
export class SprintDto extends SprintOverview {
  @ApiPropertyOptional({
    description: "Description détaillée du sprint",
    example: "Sprint focused on implementing secure authentication system with JWT tokens and role-based access control",
    type: "string",
    maxLength: 2000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(2000, { message: "La description ne peut pas dépasser 2000 caractères" })
  description?: string;

  @ApiProperty({
    description: "Identifiant unique du projet associé",
    example: 96,
    type: "integer",
    minimum: 1,
    required: true,
  })
  @Expose()
  @IsInt({ message: "L'ID du projet doit être un nombre entier" })
  @Min(1, { message: "L'ID du projet doit être positif" })
  @Transform(({ value }): number => (typeof value === "string" ? parseInt(value, 10) : value))
  project_id!: number;

  @ApiProperty({
    description: "Date de début prévue du sprint",
    example: "2025-09-23",
    format: "date",
    type: "string",
    required: true,
  })
  @Expose()
  @IsDateString({}, { message: "La date de début doit être au format ISO 8601 (YYYY-MM-DD)" })
  start_date!: string;

  @ApiPropertyOptional({
    description: "Date de fin prévue du sprint",
    example: "2025-10-07",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être au format ISO 8601 (YYYY-MM-DD)" })
  end_date?: string;

  @ApiPropertyOptional({
    description: "Date de début réelle du sprint",
    example: "2025-09-23",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de début réelle doit être au format ISO 8601 (YYYY-MM-DD)" })
  actual_start_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin réelle du sprint",
    example: "2025-10-07",
    format: "date",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin réelle doit être au format ISO 8601 (YYYY-MM-DD)" })
  actual_end_date?: string;

  @ApiPropertyOptional({
    description: "Vélocité du sprint (points par sprint)",
    example: 20,
    type: "integer",
    minimum: 0,
    maximum: 1000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La vélocité doit être un nombre entier" })
  @Min(0, { message: "La vélocité doit être positive ou nulle" })
  @Max(1000, { message: "La vélocité ne peut pas dépasser 1000 points" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseInt(value, 10) : value))
  velocity?: number;

  @ApiPropertyOptional({
    description: "Capacité du sprint (nombre de développeurs * nombre de jours)",
    example: 40,
    type: "integer",
    minimum: 1,
    maximum: 500,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "La capacité doit être un nombre entier" })
  @Min(1, { message: "La capacité doit être supérieure à 0" })
  @Max(500, { message: "La capacité ne peut pas dépasser 500" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseInt(value, 10) : value))
  capacity?: number;

  @ApiPropertyOptional({
    description: "Numéro de version du sprint",
    example: 1.0,
    type: "number",
    minimum: 0.1,
    maximum: 99.9,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsNumber({}, { message: "La version doit être un nombre" })
  @Min(0.1, { message: "La version doit être supérieure à 0.1" })
  @Max(99.9, { message: "La version ne peut pas dépasser 99.9" })
  @Transform(({ value }): number | undefined => (typeof value === "string" ? parseFloat(value) : value))
  version?: number;

  @ApiPropertyOptional({
    description: "Notes de révision du sprint",
    example: "Sprint completed successfully with all planned features implemented",
    type: "string",
    maxLength: 2000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Les notes de révision doivent être une chaîne de caractères" })
  @MaxLength(2000, { message: "Les notes de révision ne peuvent pas dépasser 2000 caractères" })
  review_notes?: string;

  @ApiPropertyOptional({
    description: "Notes de rétrospective du sprint",
    example: "Team worked well together, but we need to improve testing coverage in future sprints",
    type: "string",
    maxLength: 2000,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Les notes de rétrospective doivent être une chaîne de caractères" })
  @MaxLength(2000, { message: "Les notes de rétrospective ne peuvent pas dépasser 2000 caractères" })
  retrospective_notes?: string;

  @ApiPropertyOptional({
    description: "Identifiant de l'utilisateur qui a créé le sprint",
    example: "b3fb243f-8368-47aa-bcc7-072f049db8af",
    format: "uuid",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "L'ID de l'utilisateur créateur doit être une chaîne de caractères" })
  created_by?: string;

  @ApiPropertyOptional({
    description: "Identifiant de l'utilisateur qui a modifié le sprint",
    example: "b3fb243f-8368-47aa-bcc7-072f049db8af",
    format: "uuid",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "L'ID de l'utilisateur modificateur doit être une chaîne de caractères" })
  updated_by?: string;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a créé le sprint",
    type: () => ProfileOverview,
    required: false,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a modifié le sprint",
    type: () => ProfileOverview,
    required: false,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  updated_by_user?: ProfileOverview;

  @ApiProperty({
    description: "Date de création du sprint",
    example: "2025-09-23T09:41:59.298Z",
    format: "date-time",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "La date de création doit être une chaîne de caractères" })
  created_at!: string;

  @ApiPropertyOptional({
    description: "Date de dernière modification du sprint",
    example: "2025-09-23T14:25:33.456Z",
    format: "date-time",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La date de mise à jour doit être une chaîne de caractères" })
  updated_at?: string;
}

/**
 * DTO pour la liste paginée des sprints
 * Compatible avec gRPC SprintService et Prisma queries
 * Utilisé pour les listes de sprints avec pagination
 */
export class SprintsListDto extends BasePaginationDto<SprintDto | SprintOverview> {
  @ApiProperty({
    description: "Liste des sprints",
    type: [SprintDto],
    required: true,
  })
  @Expose()
  items!: (SprintDto | SprintOverview)[];
}
