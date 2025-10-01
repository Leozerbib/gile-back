import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsUUID, IsUrl, Length, MinLength, MaxLength } from "class-validator";
import { Expose, Transform, Type } from "class-transformer";
import { ProfileOverview, ProfileOverviewSelect } from "../profile/dtos.js";
import { BasePaginationDto } from "../common/page.js";

/**
 * Enumération des niveaux de visibilité d'un workspace
 * Compatible avec Prisma enum WorkspaceVisibility et gRPC WorkspaceService
 */
export enum WorkspaceVisibility {
  PRIVATE = "PRIVATE",
  TEAM = "TEAM",
  PUBLIC = "PUBLIC",
}

/**
 * Enumération des rôles utilisateur dans un workspace
 * Compatible avec Prisma enum UserRole et gRPC WorkspaceService
 */
export enum WorkspaceRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  WORKSPACE_OWNER = "WORKSPACE_OWNER",
  WORKSPACE_ADMIN = "WORKSPACE_ADMIN",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  DEVELOPER = "DEVELOPER",
  DESIGNER = "DESIGNER",
  TESTER = "TESTER",
  VIEWER = "VIEWER",
  GUEST = "GUEST",
}

/**
 * DTO pour la création d'un workspace
 * Compatible avec Prisma model workspaces et gRPC WorkspaceService
 * Utilisé pour créer un nouveau workspace
 */
export class CreateWorkspaceDto {
  @ApiProperty({
    description: "Nom du workspace",
    example: "Mon Espace de Travail",
    type: "string",
    minLength: 1,
    maxLength: 255,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le nom du workspace doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le nom du workspace est requis" })
  @Length(1, 255, { message: "Le nom du workspace doit contenir entre 1 et 255 caractères" })
  @Transform(({ value }): string => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @ApiPropertyOptional({
    description: "Description détaillée du workspace",
    example: "Workspace dédié au développement d'applications web modernes avec méthodologies agiles",
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
    description: "URL du logo du workspace",
    example: "https://example.com/logo.png",
    format: "uri",
    type: "string",
    maxLength: 500,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsUrl({}, { message: "L'URL du logo doit être une URL valide" })
  @MaxLength(500, { message: "L'URL du logo ne peut pas dépasser 500 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  logoUrl?: string;

  @ApiPropertyOptional({
    description: "Niveau de visibilité du workspace",
    enum: WorkspaceVisibility,
    example: WorkspaceVisibility.PRIVATE,
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEnum(WorkspaceVisibility, { message: "Niveau de visibilité invalide" })
  visibility?: WorkspaceVisibility = WorkspaceVisibility.PRIVATE;
}

/**
 * DTO pour la mise à jour d'un workspace
 * Compatible avec Prisma model workspaces et gRPC WorkspaceService
 * Utilisé pour modifier les propriétés d'un workspace existant
 */
export class UpdateWorkspaceDto {
  @ApiPropertyOptional({
    description: "Nom mis à jour du workspace",
    example: "Mon Espace de Travail - Mise à Jour",
    type: "string",
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom du workspace doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le nom du workspace doit contenir entre 1 et 255 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    description: "Slug mis à jour (URL-friendly)",
    example: "mon-espace-mise-a-jour",
    type: "string",
    minLength: 3,
    maxLength: 255,
    pattern: "^[a-z0-9-]+$",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le slug doit être une chaîne de caractères" })
  @MinLength(3, { message: "Le slug doit contenir au moins 3 caractères" })
  @MaxLength(255, { message: "Le slug ne peut pas dépasser 255 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.toLowerCase().trim() : value))
  slug?: string;

  @ApiPropertyOptional({
    description: "Description mise à jour du workspace",
    example: "Workspace optimisé pour le développement d'applications avec tests automatisés",
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
    description: "URL mise à jour du logo du workspace",
    example: "https://example.com/new-logo.png",
    format: "uri",
    type: "string",
    maxLength: 500,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsUrl({}, { message: "L'URL du logo doit être une URL valide" })
  @MaxLength(500, { message: "L'URL du logo ne peut pas dépasser 500 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  logoUrl?: string;

  @ApiPropertyOptional({
    description: "Niveau de visibilité mis à jour du workspace",
    enum: WorkspaceVisibility,
    example: WorkspaceVisibility.TEAM,
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEnum(WorkspaceVisibility, { message: "Niveau de visibilité invalide" })
  visibility?: WorkspaceVisibility;

  @ApiPropertyOptional({
    description: "Activer/Désactiver le workspace",
    example: true,
    type: "boolean",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le statut d'activation doit être un booléen" })
  isActive?: boolean = true;
}

/**
 * DTO pour ajouter un membre à un workspace
 * Compatible avec Prisma model workspace_members et gRPC WorkspaceService
 * Utilisé pour ajouter un utilisateur à un workspace avec un rôle spécifique
 */
export class AddWorkspaceMemberDto {
  @ApiProperty({
    description: "ID de l'utilisateur à ajouter au workspace",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: "string",
    format: "uuid",
    required: true,
  })
  @Expose()
  @IsUUID(4, { message: "L'ID utilisateur doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID utilisateur est requis" })
  userId: string;

  @ApiPropertyOptional({
    description: "Rôle de l'utilisateur dans le workspace",
    example: WorkspaceRole.DEVELOPER,
    enum: WorkspaceRole,
    default: WorkspaceRole.VIEWER,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEnum(WorkspaceRole, { message: "Le rôle doit être une valeur valide de WorkspaceRole" })
  role?: WorkspaceRole = WorkspaceRole.VIEWER;
}

/**
 * DTO pour mettre à jour un membre d'un workspace
 * Compatible avec Prisma model workspace_members et gRPC WorkspaceService
 * Utilisé pour modifier les informations d'un membre existant
 */
export class UpdateWorkspaceMemberDto {
  @ApiPropertyOptional({
    description: "Nouveau rôle de l'utilisateur dans le workspace",
    example: WorkspaceRole.PROJECT_MANAGER,
    enum: WorkspaceRole,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEnum(WorkspaceRole, { message: "Le rôle doit être une valeur valide de WorkspaceRole" })
  role?: WorkspaceRole;

  @ApiPropertyOptional({
    description: "Statut d'activité du membre dans le workspace",
    example: true,
    type: "boolean",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le statut d'activité doit être un booléen" })
  is_active?: boolean;
}

/**
 * DTO pour les paramètres de recherche des membres d'un workspace
 * Compatible avec les requêtes de pagination et filtrage
 */
export class SearchWorkspaceMembersDto extends BasePaginationDto<WorkspaceMemberDto> {
  @ApiProperty({
    description: "Liste des membres trouvés",
    type: () => [WorkspaceMemberDto],
  })
  @Expose()
  items: WorkspaceMemberDto[];

  @ApiPropertyOptional({
    description: "ID du workspace pour filtrer les membres",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: "string",
    format: "uuid",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsUUID(4, { message: "L'ID du workspace doit être un UUID valide" })
  workspaceId?: string;

  @ApiPropertyOptional({
    description: "Rôle pour filtrer les membres",
    example: WorkspaceRole.DEVELOPER,
    enum: WorkspaceRole,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsEnum(WorkspaceRole, { message: "Le rôle doit être une valeur valide de WorkspaceRole" })
  role?: WorkspaceRole;

  @ApiPropertyOptional({
    description: "Statut d'activité pour filtrer les membres",
    example: true,
    type: "boolean",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le statut d'activité doit être un booléen" })
  is_active?: boolean;

  @ApiPropertyOptional({
    description: "Terme de recherche pour filtrer par nom d'utilisateur",
    example: "john",
    type: "string",
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le terme de recherche doit être une chaîne de caractères" })
  @MinLength(1, { message: "Le terme de recherche doit contenir au moins 1 caractère" })
  @MaxLength(100, { message: "Le terme de recherche ne peut pas dépasser 100 caractères" })
  search?: string;
}

/**
 * DTO pour l'aperçu d'un workspace
 * Compatible avec Prisma model workspaces et gRPC WorkspaceService
 * Utilisé pour les listes et recherches de workspaces
 */
export class WorkspaceOverview {
  @ApiProperty({
    description: "Identifiant unique du workspace",
    example: "b3fb243f-8368-47aa-bcc7-072f049db8af",
    format: "uuid",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "L'ID du workspace doit être une chaîne de caractères" })
  id!: string;

  @ApiProperty({
    description: "Nom du workspace",
    example: "Mon Espace de Travail",
    type: "string",
    minLength: 1,
    maxLength: 255,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le nom du workspace doit être une chaîne de caractères" })
  @Length(1, 255, { message: "Le nom du workspace doit contenir entre 1 et 255 caractères" })
  name!: string;

  @ApiProperty({
    description: "URL du logo du workspace",
    example: "https://example.com/logo.png",
    format: "uri",
    type: "string",
    maxLength: 500,
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsUrl({}, { message: "L'URL du logo doit être une URL valide" })
  @MaxLength(500, { message: "L'URL du logo ne peut pas dépasser 500 caractères" })
  logo_url!: string | null;

  @ApiProperty({
    description: "Niveau de visibilité du workspace",
    enum: WorkspaceVisibility,
    example: WorkspaceVisibility.PRIVATE,
    type: "string",
    required: true,
  })
  @Expose()
  @IsEnum(WorkspaceVisibility, { message: "Niveau de visibilité invalide" })
  visibility!: WorkspaceVisibility;

  @ApiProperty({
    description: "Statut d'activation du workspace",
    example: true,
    type: "boolean",
    required: true,
  })
  @Expose()
  @IsBoolean({ message: "Le statut d'activation doit être un booléen" })
  is_active!: boolean;
}

/**
 * DTO complet pour un workspace
 * Compatible avec Prisma model workspaces et gRPC WorkspaceService
 * Utilisé pour les réponses détaillées et opérations CRUD complètes
 */
export class WorkspaceDto extends WorkspaceOverview {
  @ApiProperty({
    description: "Description détaillée du workspace",
    example: "Workspace dédié au développement d'applications web modernes avec méthodologies agiles",
    type: "string",
    maxLength: 2000,
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(2000, { message: "La description ne peut pas dépasser 2000 caractères" })
  description!: string | null;

  @ApiProperty({
    description: "Date de création du workspace",
    example: "2025-09-23T09:41:59.298Z",
    format: "date-time",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "La date de création doit être une chaîne de caractères" })
  created_at!: string;

  @ApiProperty({
    description: "Date de dernière modification du workspace",
    example: "2025-09-23T14:25:33.456Z",
    format: "date-time",
    type: "string",
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La date de mise à jour doit être une chaîne de caractères" })
  updated_at!: string | null;

  @ApiPropertyOptional({
    description: "Informations complètes de l'utilisateur qui a créé le workspace",
    type: () => ProfileOverview,
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations complètes de l'utilisateur qui a modifié le workspace",
    type: () => ProfileOverview,
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  updated_by_user?: ProfileOverview;

  @ApiProperty({
    description: "Informations complètes du propriétaire du workspace",
    type: () => ProfileOverview,
    required: true,
  })
  @Expose()
  @Type(() => ProfileOverview)
  owner!: ProfileOverview;
}

/**
 * DTO complet pour un membre d'un workspace
 * Compatible avec Prisma model workspace_members et gRPC WorkspaceService
 * Utilisé pour les réponses détaillées sur les membres
 */
export class WorkspaceMemberDto {
  @ApiProperty({
    description: "Identifiant unique du membre du workspace",
    example: "b3fb243f-8368-47aa-bcc7-072f049db8af",
    format: "uuid",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "L'ID du membre doit être une chaîne de caractères" })
  id!: string;

  @ApiProperty({
    description: "Identifiant de l'utilisateur",
    example: "b3fb243f-8368-47aa-bcc7-072f049db8af",
    format: "uuid",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "L'ID utilisateur doit être une chaîne de caractères" })
  user_id!: string;

  @ApiProperty({
    description: "Rôle de l'utilisateur dans le workspace",
    enum: WorkspaceRole,
    example: WorkspaceRole.DEVELOPER,
    type: "string",
    required: true,
  })
  @Expose()
  @IsEnum(WorkspaceRole, { message: "Rôle utilisateur invalide" })
  role!: WorkspaceRole;

  @ApiProperty({
    description: "Statut d'activation du membre",
    example: true,
    type: "boolean",
    required: true,
  })
  @Expose()
  @IsBoolean({ message: "Le statut d'activation doit être un booléen" })
  is_active!: boolean;

  @ApiProperty({
    description: "Date d'ajout du membre",
    example: "2025-09-23T09:41:59.298Z",
    format: "date-time",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "La date de création doit être une chaîne de caractères" })
  created_at!: string;

  @ApiProperty({
    description: "Date de dernière modification du membre",
    example: "2025-09-23T14:25:33.456Z",
    format: "date-time",
    type: "string",
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La date de mise à jour doit être une chaîne de caractères" })
  updated_at!: string | null;

  @ApiPropertyOptional({
    description: "Informations complètes de l'utilisateur qui a ajouté le membre",
    type: () => ProfileOverview,
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations complètes de l'utilisateur qui a ajouté le membre",
    type: () => ProfileOverview,
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @Type(() => ProfileOverview)
  profile?: ProfileOverview;
}

export class WorkspacesListDto extends BasePaginationDto<WorkspaceOverview | WorkspaceDto> {
  @ApiProperty({
    description: "Liste des workspaces",
    type: [WorkspaceOverview],
    required: true,
  })
  @Expose()
  @Type(() => WorkspaceOverview || WorkspaceDto)
  items!: WorkspaceOverview[] | WorkspaceDto[];
}

export class WorkspaceMembersListDto extends BasePaginationDto<WorkspaceMemberDto> {
  @ApiProperty({
    description: "Liste des membres du workspace",
    type: [WorkspaceMemberDto],
    required: true,
  })
  @Expose()
  @Type(() => WorkspaceMemberDto)
  items!: WorkspaceMemberDto[];
}

// ============================================================================
// PRISMA SELECT TYPES
// ============================================================================

/**
 * Type de sélection Prisma pour WorkspaceOverview
 * Utilisé pour les listes et aperçus de workspaces
 */
export const WorkspaceOverviewSelect = {
  id: true,
  name: true,
  logo_url: true,
  visibility: true,
  is_active: true,
} as const;

/**
 * Type de sélection Prisma pour WorkspaceDto complet
 * Inclut toutes les informations détaillées du workspace avec relations
 */
export const WorkspaceDtoSelect = {
  id: true,
  name: true,
  logo_url: true,
  visibility: true,
  is_active: true,
  description: true,
  created_at: true,
  updated_at: true,
  created_by_user: {
    select: {
      profiles: {
        select: ProfileOverviewSelect,
      },
    },
  },
  updated_by_user: {
    select: {
      profiles: {
        select: ProfileOverviewSelect,
      },
    },
  },
  owner: {
    select: {
      profiles: {
        select: ProfileOverviewSelect,
      },
    },
  },
} as const;

/**
 * Type de sélection Prisma pour WorkspaceMemberDto
 * Inclut les informations complètes du membre avec relations utilisateur
 */
export const WorkspaceMemberDtoSelect = {
  id: true,
  user_id: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  created_by_user: {
    select: ProfileOverviewSelect,
  },
  profile: {
    select: ProfileOverviewSelect,
  },
} as const;

/**
 * Type de sélection Prisma pour les listes de workspaces
 * Optimisé pour les requêtes de pagination avec relations minimales
 */
export const WorkspaceListSelect = {
  id: true,
  name: true,
  logo_url: true,
  visibility: true,
  is_active: true,
  description: true,
  created_at: true,
  updated_at: true,
  owner: {
    select: {
      profiles: {
        select: ProfileOverviewSelect,
      },
    },
  },
} as const;

/**
 * Type de sélection Prisma pour les listes de membres de workspace
 * Optimisé pour les requêtes de pagination des membres
 */
export const WorkspaceMemberListSelect = {
  id: true,
  workspace_id: true,
  user_id: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  user: {
    select: {
      profiles: {
        select: ProfileOverviewSelect,
      },
    },
  },
} as const;

// ============================================================================
// TYPE HELPERS
// ============================================================================

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec WorkspaceOverviewSelect
 */
export type PrismaWorkspaceOverview = {
  id: string;
  name: string;
  logo_url: string | null;
  visibility: WorkspaceVisibility;
  is_active: boolean;
};

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec WorkspaceDtoSelect
 */
export type PrismaWorkspaceDto = {
  id: string;
  name: string;
  logo_url: string | null;
  visibility: WorkspaceVisibility;
  is_active: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date | null;
  created_by_user?: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  updated_by_user?: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  owner: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  };
};

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec WorkspaceMemberDtoSelect
 */
export type PrismaWorkspaceMemberDto = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
  created_by_user?: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
};
