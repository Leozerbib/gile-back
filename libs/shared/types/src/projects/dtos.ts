import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";
import { Expose, Transform } from "class-transformer";
import { ProfileOverview } from "../profile/dtos";
import { BasePaginationDto } from "../common/page";

export enum ProjectStatus {
  TODO = "TODO",
  ACTIVE = "ACTIVE",
  STABLE = "STABLE",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
  TO_COMPLETE = "TO_COMPLETE",
}

export enum ProjectPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * DTO pour la création d'un projet
 * Utilisé dans les endpoints REST et gRPC
 * Compatible avec Prisma model Project
 */
export class CreateProjectDto {
  @ApiProperty({
    description: "Nom du projet",
    example: "E-commerce Platform",
    minLength: 1,
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsString({ message: "Le nom du projet doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le nom du projet doit contenir entre 1 et 255 caractères" })
  name!: string;

  @ApiPropertyOptional({
    description: "Description courte du projet",
    example: "Modern e-commerce platform with advanced features",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "Description complète du projet",
    example: "A comprehensive e-commerce platform with inventory management, payment processing, and analytics",
    maxLength: 2000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description complète doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  full_description?: string;

  @ApiPropertyOptional({
    description: "ID du chef de projet",
    example: "user-uuid-456",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID du chef de projet doit être un UUID valide" })
  project_manager_id?: string;

  @ApiPropertyOptional({
    description: "Priorité du projet",
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM,
    example: ProjectPriority.HIGH,
    enumName: "ProjectPriority",
  })
  @Expose()
  @IsOptional()
  @IsEnum(ProjectPriority, { message: "Priorité de projet invalide" })
  priority?: ProjectPriority = ProjectPriority.MEDIUM;

  @ApiPropertyOptional({
    description: "Date de début prévue (format ISO 8601)",
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
    example: "2024-06-15",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide ISO 8601" })
  end_date?: string;

  @ApiPropertyOptional({
    description: "Projet public",
    example: true,
    type: "boolean",
    default: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ public doit être un booléen" })
  is_public?: boolean = false;

  @ApiPropertyOptional({
    description: "Paramètres du projet",
    type: "object",
    example: { allow_guest_access: true, require_approval: false },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Les paramètres doivent être un objet" })
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Champs personnalisés",
    type: "object",
    example: { budget: 50000, client: "ABC Corp" },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Les champs personnalisés doivent être un objet" })
  custom_fields?: Record<string, any>;
}

/**
 * DTO pour la mise à jour d'un projet
 * Tous les champs sont optionnels pour permettre les mises à jour partielles
 * Compatible avec Prisma update operations
 */
export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: "Nom du projet",
    example: "E-commerce Platform v2",
    minLength: 1,
    maxLength: 255,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom du projet doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le nom du projet doit contenir entre 1 et 255 caractères" })
  name?: string;

  @ApiPropertyOptional({
    description: "Description courte du projet",
    example: "Updated e-commerce platform with new features",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "Description complète du projet",
    example: "Updated comprehensive e-commerce platform with enhanced features",
    maxLength: 2000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description complète doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  full_description?: string;

  @ApiPropertyOptional({
    description: "ID du chef de projet",
    example: "user-uuid-789",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID du chef de projet doit être un UUID valide" })
  project_manager_id?: string;

  @ApiPropertyOptional({
    description: "Statut du projet",
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
    enumName: "ProjectStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(ProjectStatus, { message: "Statut de projet invalide" })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: "Priorité du projet",
    enum: ProjectPriority,
    example: ProjectPriority.CRITICAL,
    enumName: "ProjectPriority",
  })
  @Expose()
  @IsOptional()
  @IsEnum(ProjectPriority, { message: "Priorité de projet invalide" })
  priority?: ProjectPriority;

  @ApiPropertyOptional({
    description: "Date de début prévue (format ISO 8601)",
    example: "2024-01-20",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de début doit être une date valide ISO 8601" })
  start_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin prévue (format ISO 8601)",
    example: "2024-07-01",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide ISO 8601" })
  end_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin réelle (format ISO 8601)",
    example: "2024-06-25",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin réelle doit être une date valide ISO 8601" })
  actual_end_date?: string;

  @ApiPropertyOptional({
    description: "Projet archivé",
    example: false,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ archivé doit être un booléen" })
  is_archived?: boolean;

  @ApiPropertyOptional({
    description: "Projet public",
    example: true,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ public doit être un booléen" })
  is_public?: boolean;

  @ApiPropertyOptional({
    description: "Paramètres du projet",
    type: "object",
    example: { allow_guest_access: false, require_approval: true },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Les paramètres doivent être un objet" })
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Champs personnalisés",
    type: "object",
    example: { budget: 75000, client: "XYZ Corp" },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Les champs personnalisés doivent être un objet" })
  custom_fields?: Record<string, any>;
}

/**
 * Vue d'ensemble d'un projet - informations essentielles
 * Utilisé pour les listes et références
 * Compatible avec gRPC message ProjectOverview
 */
export class ProjectOverview {
  @ApiProperty({
    description: "ID unique du projet",
    example: 123,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsInt({ message: "L'ID doit être un nombre entier" })
  @Min(1, { message: "L'ID doit être positif" })
  id!: number;

  @ApiProperty({
    description: "Nom du projet",
    example: "E-commerce Platform",
    minLength: 1,
    maxLength: 255,
  })
  @Expose()
  @IsString({ message: "Le nom du projet doit être une chaîne de caractères" })
  name!: string;

  @ApiProperty({
    description: "Statut du projet",
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
    enumName: "ProjectStatus",
  })
  @Expose()
  @IsEnum(ProjectStatus, { message: "Statut de projet invalide" })
  status!: ProjectStatus;

  @ApiProperty({
    description: "Priorité du projet",
    enum: ProjectPriority,
    example: ProjectPriority.HIGH,
    enumName: "ProjectPriority",
  })
  @Expose()
  @IsEnum(ProjectPriority, { message: "Priorité de projet invalide" })
  priority!: ProjectPriority;

  @ApiProperty({
    description: "Progression du projet (0-100)",
    example: 25,
    type: "integer",
    minimum: 0,
    maximum: 100,
  })
  @Expose()
  @IsInt({ message: "La progression doit être un nombre entier" })
  @Min(0, { message: "La progression ne peut pas être négative" })
  @Max(100, { message: "La progression ne peut pas dépasser 100" })
  progress!: number;
}

/**
 * DTO complet d'un projet - hérite de ProjectOverview avec informations détaillées
 * Utilisé pour les réponses API détaillées et gRPC
 * Compatible avec Prisma model Project + relations
 */
export class ProjectDto extends ProjectOverview {
  @ApiPropertyOptional({
    description: "Slug du projet (identifiant URL-friendly)",
    example: "e-commerce-platform",
    pattern: "^[a-z0-9-]+$",
    maxLength: 100,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le slug doit être une chaîne de caractères" })
  slug?: string;

  @ApiPropertyOptional({
    description: "Description courte du projet",
    example: "Modern e-commerce platform with advanced features",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiProperty({
    description: "Date de création du projet (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsDateString({}, { message: "La date de création doit être une date valide ISO 8601" })
  created_at!: string;

  @ApiPropertyOptional({
    description: "Description complète du projet",
    example: "A comprehensive e-commerce platform with inventory management, payment processing, and analytics",
    maxLength: 2000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description complète doit être une chaîne de caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  full_description?: string;

  @ApiProperty({
    description: "ID du workspace associé",
    example: "workspace-uuid-123",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsUUID("4", { message: "L'ID du workspace doit être un UUID valide" })
  workspace_id!: string;

  @ApiPropertyOptional({
    description: "ID du chef de projet",
    example: "user-uuid-456",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID du chef de projet doit être un UUID valide" })
  project_manager_id?: string;

  @ApiPropertyOptional({
    description: "Date de début prévue (format ISO 8601)",
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
    example: "2024-06-15",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide ISO 8601" })
  end_date?: string;

  @ApiPropertyOptional({
    description: "Date de fin réelle (format ISO 8601)",
    example: "2024-06-10",
    format: "date",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de fin réelle doit être une date valide ISO 8601" })
  actual_end_date?: string;

  @ApiPropertyOptional({
    description: "Projet archivé",
    example: false,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ archivé doit être un booléen" })
  is_archived?: boolean;

  @ApiPropertyOptional({
    description: "Projet public",
    example: true,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ public doit être un booléen" })
  is_public?: boolean;

  @ApiPropertyOptional({
    description: "Paramètres du projet",
    type: "object",
    example: { allow_guest_access: true, require_approval: false },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Les paramètres doivent être un objet" })
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Champs personnalisés",
    type: "object",
    example: { budget: 50000, client: "ABC Corp" },
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Les champs personnalisés doivent être un objet" })
  custom_fields?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Date de dernière modification du projet (ISO 8601)",
    example: "2024-01-20T14:30:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de modification doit être une date valide ISO 8601" })
  updated_at?: string;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a créé le projet",
    type: ProfileOverview,
  })
  @Expose()
  @IsOptional()
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a modifié le projet",
    type: ProfileOverview,
  })
  @Expose()
  @IsOptional()
  updated_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur le chef de projet",
    type: ProfileOverview,
  })
  @Expose()
  @IsOptional()
  manager?: ProfileOverview;
}

/**
 * DTO pour la liste paginée de projets
 * Utilisé pour les réponses de listing avec pagination
 * Compatible avec gRPC message ProjectList
 * Étend BasePaginationDto pour une gestion uniforme de la pagination
 */
export class ProjectsListDto extends BasePaginationDto<ProjectDto | ProjectOverview> {
  @ApiProperty({
    type: [ProjectDto],
    description: "Liste des projets",
  })
  @Expose()
  items!: (ProjectDto | ProjectOverview)[];
}

// ============================================================================
// PRISMA SELECT OBJECTS
// ============================================================================

/**
 * Type de sélection Prisma pour ProjectOverview
 * Utilisé dans les relations avec les projets
 */
export const ProjectOverviewSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  priority: true,
  progress: true,
} as const;

/**
 * Type de sélection Prisma pour ProjectDto complet
 * Inclut toutes les informations détaillées du projet
 */
export const ProjectDtoSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  full_description: true,
  status: true,
  priority: true,
  progress: true,
  workspace_id: true,
  project_manager_id: true,
  start_date: true,
  end_date: true,
  actual_end_date: true,
  is_archived: true,
  is_public: true,
  settings: true,
  custom_fields: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  created_by_user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
  updated_by_user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
  manager: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
} as const;
