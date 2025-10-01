import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, Length, Matches, IsUUID, IsUrl, MaxLength } from "class-validator";
import { Expose, Transform } from "class-transformer";
import { BasePaginationDto } from "../common/page";

/**
 * DTO pour l'insertion d'un profil utilisateur
 * Compatible avec Prisma model profiles et gRPC UserService
 * Utilisé pour créer un nouveau profil lors de l'inscription
 */
export class CreateProfileDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: "00000000-0000-0000-0000-000000000000",
    format: "uuid",
    type: "string",
    minLength: 36,
    maxLength: 36,
    required: true,
  })
  @Expose()
  @IsUUID("4", { message: "L'ID utilisateur doit être un UUID valide" })
  @IsNotEmpty({ message: "L'ID utilisateur est requis" })
  user_id!: string;

  @ApiPropertyOptional({
    description: "Nom d'utilisateur unique",
    example: "john.doe",
    type: "string",
    minLength: 3,
    maxLength: 50,
    pattern: "^[a-zA-Z0-9._-]+$",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom d'utilisateur doit être une chaîne de caractères" })
  @Length(3, 50, { message: "Le nom d'utilisateur doit contenir entre 3 et 50 caractères" })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores",
  })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.toLowerCase().trim() : value))
  username?: string;

  @ApiPropertyOptional({
    description: "Prénom de l'utilisateur",
    example: "John",
    type: "string",
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le prénom doit être une chaîne de caractères" })
  @Length(1, 100, { message: "Le prénom doit contenir entre 1 et 100 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  first_name?: string;

  @ApiPropertyOptional({
    description: "Nom de famille de l'utilisateur",
    example: "Doe",
    type: "string",
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom de famille doit être une chaîne de caractères" })
  @Length(1, 100, { message: "Le nom de famille doit contenir entre 1 et 100 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  last_name?: string;

  @ApiPropertyOptional({
    description: "URL de l'avatar de l'utilisateur",
    example: "https://example.com/avatar.png",
    format: "uri",
    type: "string",
    maxLength: 500,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsUrl({}, { message: "L'URL de l'avatar doit être une URL valide" })
  @MaxLength(500, { message: "L'URL de l'avatar ne peut pas dépasser 500 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  avatar_url?: string;
}

/**
 * DTO pour la mise à jour d'un profil utilisateur
 * Compatible avec Prisma model profiles et gRPC UserService
 * Utilisé pour modifier les informations d'un profil existant
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "Nom d'utilisateur unique",
    example: "johnny.d",
    type: "string",
    minLength: 3,
    maxLength: 50,
    pattern: "^[a-zA-Z0-9._-]+$",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom d'utilisateur doit être une chaîne de caractères" })
  @Length(3, 50, { message: "Le nom d'utilisateur doit contenir entre 3 et 50 caractères" })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores",
  })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.toLowerCase().trim() : value))
  username?: string;

  @ApiPropertyOptional({
    description: "Prénom de l'utilisateur",
    example: "Johnny",
    type: "string",
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le prénom doit être une chaîne de caractères" })
  @Length(1, 100, { message: "Le prénom doit contenir entre 1 et 100 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  first_name?: string;

  @ApiPropertyOptional({
    description: "Nom de famille de l'utilisateur",
    example: "Doe",
    type: "string",
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom de famille doit être une chaîne de caractères" })
  @Length(1, 100, { message: "Le nom de famille doit contenir entre 1 et 100 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  last_name?: string;

  @ApiPropertyOptional({
    description: "URL de l'avatar de l'utilisateur",
    example: "https://example.com/new-avatar.png",
    format: "uri",
    type: "string",
    maxLength: 500,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsUrl({}, { message: "L'URL de l'avatar doit être une URL valide" })
  @MaxLength(500, { message: "L'URL de l'avatar ne peut pas dépasser 500 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  avatar_url?: string;
}

/**
 * DTO pour l'aperçu d'un profil utilisateur
 * Compatible avec Prisma model profiles et gRPC UserService
 * Utilisé pour les listes et recherches d'utilisateurs
 */
export class ProfileOverview {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: "00000000-0000-0000-0000-000000000000",
    format: "uuid",
    type: "string",
    required: true,
  })
  @Expose()
  @IsUUID("4", { message: "L'ID utilisateur doit être un UUID valide" })
  user_id!: string;

  @ApiProperty({
    description: "Nom d'utilisateur unique",
    example: "john.doe",
    type: "string",
    minLength: 3,
    maxLength: 50,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le nom d'utilisateur doit être une chaîne de caractères" })
  @Length(3, 50, { message: "Le nom d'utilisateur doit contenir entre 3 et 50 caractères" })
  username!: string;

  @ApiProperty({
    description: "URL de l'avatar de l'utilisateur",
    example: "https://example.com/avatar.png",
    format: "uri",
    type: "string",
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsUrl({}, { message: "L'URL de l'avatar doit être une URL valide" })
  avatar_url!: string | null;
}

/**
 * DTO complet pour un profil utilisateur
 * Compatible avec Prisma model profiles et gRPC UserService
 * Utilisé pour les réponses détaillées et opérations CRUD complètes
 */
export class ProfileDto extends ProfileOverview {
  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: "John",
    type: "string",
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le prénom doit être une chaîne de caractères" })
  @Length(1, 100, { message: "Le prénom doit contenir entre 1 et 100 caractères" })
  first_name!: string | null;

  @ApiProperty({
    description: "Nom de famille de l'utilisateur",
    example: "Doe",
    type: "string",
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom de famille doit être une chaîne de caractères" })
  @Length(1, 100, { message: "Le nom de famille doit contenir entre 1 et 100 caractères" })
  last_name!: string | null;

  @ApiProperty({
    description: "Date de création du profil",
    example: "2025-09-23T09:41:59.298Z",
    format: "date-time",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "La date de création doit être une chaîne de caractères" })
  created_at!: string;

  @ApiProperty({
    description: "Date de dernière mise à jour du profil",
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
}

/**
 * DTO pour la liste paginée des profils
 * Compatible avec gRPC UserService et Prisma queries
 * Utilisé pour les listes d'utilisateurs avec pagination
 */
export class ProfilesListDto extends BasePaginationDto<ProfileDto> {
  @ApiProperty({
    type: [ProfileDto],
    description: "Array of profile overview objects",
  })
  items!: ProfileDto[];
}

// ============================================================================
// PRISMA SELECT TYPES
// ============================================================================

/**
 * Type de sélection Prisma pour ProfileOverview
 * Utilisé dans les relations avec les utilisateurs
 */
export const ProfileOverviewSelect = {
  user_id: true,
  username: true,
  avatar_url: true,
} as const;

/**
 * Type de sélection Prisma pour ProfileDto complet
 * Inclut toutes les informations détaillées du profil
 */
export const ProfileDtoSelect = {
  user_id: true,
  username: true,
  avatar_url: true,
  first_name: true,
  last_name: true,
  created_at: true,
  updated_at: true,
} as const;

/**
 * Type de sélection Prisma pour les listes de profils
 * Optimisé pour les requêtes de pagination
 */
export const ProfileListSelect = {
  user_id: true,
  username: true,
  avatar_url: true,
  first_name: true,
  last_name: true,
  created_at: true,
  updated_at: true,
} as const;

// ============================================================================
// TYPE HELPERS
// ============================================================================

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec ProfileOverviewSelect
 */
export type PrismaProfileOverview = {
  user_id: string;
  username: string;
  avatar_url: string | null;
};

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec ProfileDtoSelect
 */
export type PrismaProfileDto = {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: Date;
  updated_at: Date | null;
};
