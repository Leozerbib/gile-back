import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsInt, Length, Matches, IsUUID, MinLength, MaxLength, IsDateString, IsEnum } from "class-validator";
import { Expose, Transform, Type } from "class-transformer";
import { ProfileDto } from "../profile/dtos.js";

/**
 * DTO pour la requête de connexion
 * Compatible avec Prisma model profiles et gRPC AuthService
 * Utilisé pour authentifier un utilisateur existant
 */
export class AuthSignInRequestDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: "leospoutnik@gmail.com",
    format: "email",
    type: "string",
    minLength: 5,
    maxLength: 255,
    required: true,
  })
  @Expose()
  @IsEmail({}, { message: "L'adresse email doit être valide" })
  @IsNotEmpty({ message: "L'adresse email est requise" })
  @Length(5, 255, { message: "L'email doit contenir entre 5 et 255 caractères" })
  @Transform(({ value }): string => (typeof value === "string" ? value.toLowerCase().trim() : value))
  email!: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: "Leoleoo1.",
    format: "password",
    type: "string",
    minLength: 8,
    maxLength: 128,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le mot de passe doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le mot de passe est requis" })
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
  @MaxLength(128, { message: "Le mot de passe ne peut pas dépasser 128 caractères" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
  })
  password!: string;
}

/**
 * DTO pour la requête d'inscription
 * Compatible avec Prisma model profiles et gRPC AuthService
 * Utilisé pour créer un nouvel utilisateur
 */
export class AuthRegisterRequestDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: "newuser@example.com",
    format: "email",
    type: "string",
    minLength: 5,
    maxLength: 255,
    required: true,
  })
  @Expose()
  @IsEmail({}, { message: "L'adresse email doit être valide" })
  @IsNotEmpty({ message: "L'adresse email est requise" })
  @Length(5, 255, { message: "L'email doit contenir entre 5 et 255 caractères" })
  @Transform(({ value }): string => (typeof value === "string" ? value.toLowerCase().trim() : value))
  email!: string;

  @ApiProperty({
    description: "Mot de passe sécurisé de l'utilisateur",
    example: "StrongP@ssw0rd123",
    format: "password",
    type: "string",
    minLength: 8,
    maxLength: 128,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le mot de passe doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le mot de passe est requis" })
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
  @MaxLength(128, { message: "Le mot de passe ne peut pas dépasser 128 caractères" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
  })
  password!: string;
}

/**
 * DTO pour la requête de rafraîchissement de token
 * Compatible avec gRPC AuthService et Prisma session management
 */
export class AuthRefreshRequestDto {
  @ApiProperty({
    description: "Token de rafraîchissement JWT",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    format: "jwt",
    type: "string",
    minLength: 20,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le refresh token doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le refresh token est requis" })
  @MinLength(20, { message: "Le refresh token doit contenir au moins 20 caractères" })
  refresh_token!: string;
}

/**
 * DTO pour la requête de vérification de token
 * Compatible avec gRPC AuthService et Prisma session validation
 */
export class AuthVerifyRequestDto {
  @ApiProperty({
    description: "Token d'accès JWT à vérifier",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    format: "jwt",
    type: "string",
    minLength: 20,
    required: true,
  })
  @Expose()
  @IsString({ message: "Le token d'accès doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le token d'accès est requis" })
  @MinLength(20, { message: "Le token d'accès doit contenir au moins 20 caractères" })
  access_token!: string;
}

/**
 * DTO pour les tokens d'authentification
 * Compatible avec gRPC AuthService et Prisma session storage
 * Utilisé pour la sérialisation des réponses d'authentification
 */
export class AuthTokensDto {
  @ApiProperty({
    description: "Token d'accès JWT",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ...",
    format: "jwt",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "Le token d'accès doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le token d'accès est requis" })
  access_token!: string;

  @ApiProperty({
    description: "Token de rafraîchissement JWT",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ...",
    format: "jwt",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "Le refresh token doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le refresh token est requis" })
  refresh_token!: string;

  @ApiProperty({
    description: "Durée de validité du token d'accès en secondes",
    example: 3600,
    type: "integer",
    minimum: 1,
    maximum: 86400,
    required: true,
  })
  @Expose()
  @Transform(({ value }): number => (typeof value === "string" ? parseInt(value, 10) : value))
  @IsInt({ message: "La durée d'expiration doit être un nombre entier" })
  expires_in!: number;

  @ApiProperty({
    description: "Type de token d'authentification",
    example: "Bearer",
    enum: ["Bearer", "Basic"],
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "Le type de token doit être une chaîne de caractères" })
  @IsEnum(["Bearer", "Basic"], { message: "Le type de token doit être 'Bearer' ou 'Basic'" })
  token_type!: string;
}

/**
 * DTO pour la réponse d'authentification complète
 * Compatible avec gRPC AuthService et Prisma profiles
 * Utilisé pour les réponses de connexion réussie
 */
export class AuthWithProfileDto {
  @ApiProperty({
    description: "Objets de tokens d'authentification",
    type: () => AuthTokensDto,
    required: true,
  })
  @Expose()
  @Type(() => AuthTokensDto)
  tokens!: AuthTokensDto;

  @ApiProperty({
    description: "Informations du profil utilisateur",
    type: () => ProfileDto,
    required: true,
  })
  @Expose()
  @Type(() => ProfileDto)
  profile!: ProfileDto;
}

/**
 * DTO pour les informations utilisateur authentifié
 * Compatible avec Prisma model profiles et gRPC UserService
 * Utilisé pour la sérialisation des données utilisateur
 */
export class AuthUserDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: "b3fb243f-8368-47aa-bcc7-072f049db8af",
    format: "uuid",
    type: "string",
    required: true,
  })
  @Expose()
  @IsUUID("4", { message: "L'ID utilisateur doit être un UUID valide" })
  id!: string;

  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: "user@example.com",
    format: "email",
    type: "string",
    required: true,
  })
  @Expose()
  @IsEmail({}, { message: "L'adresse email doit être valide" })
  @Length(5, 255, { message: "L'email doit contenir entre 5 et 255 caractères" })
  email!: string;

  @ApiProperty({
    description: "Date de création du compte",
    example: "2025-09-23T08:15:30.123Z",
    format: "date-time",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "La date de création doit être une chaîne de caractères" })
  @IsDateString({}, { message: "La date de création doit être au format ISO 8601" })
  created_at!: string;

  @ApiProperty({
    description: "Date de dernière mise à jour du compte",
    example: "2025-09-23T14:25:33.456Z",
    format: "date-time",
    type: "string",
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La date de mise à jour doit être une chaîne de caractères" })
  @IsDateString({}, { message: "La date de mise à jour doit être au format ISO 8601" })
  updated_at?: string;

  @ApiProperty({
    description: "Statut de confirmation de l'email",
    example: true,
    type: "boolean",
    required: true,
  })
  @Expose()
  @IsBoolean({ message: "Le statut de confirmation doit être un booléen" })
  email_confirmed!: boolean;

  @ApiProperty({
    description: "Date de dernière connexion",
    example: "2025-09-23T16:45:12.789Z",
    format: "date-time",
    type: "string",
    nullable: true,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La date de dernière connexion doit être une chaîne de caractères" })
  @IsDateString({}, { message: "La date de dernière connexion doit être au format ISO 8601" })
  last_sign_in_at?: string;
}

/**
 * DTO pour la réponse de connexion
 * Compatible avec gRPC AuthService et Prisma profiles
 * Utilisé pour les réponses d'authentification réussie
 */
export class AuthLoginResponseDto {
  @ApiProperty({
    description: "Token d'accès JWT",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    format: "jwt",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "Le token d'accès doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le token d'accès est requis" })
  access_token!: string;

  @ApiProperty({
    description: "Token de rafraîchissement JWT",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    format: "jwt",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "Le refresh token doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le refresh token est requis" })
  refresh_token!: string;

  @ApiProperty({
    description: "Durée de validité du token d'accès en secondes",
    example: 3600,
    type: "integer",
    minimum: 1,
    maximum: 86400,
    required: true,
  })
  @Expose()
  @Transform(({ value }): number => (typeof value === "string" ? parseInt(value, 10) : value))
  @IsInt({ message: "La durée d'expiration doit être un nombre entier" })
  expires_in!: number;

  @ApiProperty({
    description: "Type de token d'authentification",
    example: "Bearer",
    enum: ["Bearer", "Basic"],
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "Le type de token doit être une chaîne de caractères" })
  @IsEnum(["Bearer", "Basic"], { message: "Le type de token doit être 'Bearer' ou 'Basic'" })
  token_type!: string;

  @ApiProperty({
    description: "Informations de l'utilisateur authentifié",
    type: () => AuthUserDto,
    required: true,
  })
  @Expose()
  @Type(() => AuthUserDto)
  user!: AuthUserDto;

  @ApiProperty({
    description: "Informations du profil utilisateur",
    type: () => ProfileDto,
    required: true,
  })
  @Expose()
  @Type(() => ProfileDto)
  profile!: ProfileDto;
}

/**
 * DTO pour la réponse de vérification de token
 * Compatible avec gRPC AuthService et Prisma session validation
 * Utilisé pour les réponses de vérification de token
 */
export class AuthVerifyResponseDto {
  @ApiProperty({
    description: "Statut de validité du token",
    example: true,
    type: "boolean",
    required: true,
  })
  @Expose()
  @IsBoolean({ message: "Le statut de validité doit être un booléen" })
  valid!: boolean;

  @ApiProperty({
    description: "Identifiant unique de l'utilisateur associé au token",
    example: "00000000-0000-0000-0000-000000000000",
    format: "uuid",
    type: "string",
    required: true,
  })
  @Expose()
  @IsUUID("4", { message: "L'ID utilisateur doit être un UUID valide" })
  user_id!: string;

  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: "user@example.com",
    format: "email",
    type: "string",
    required: true,
  })
  @Expose()
  @IsEmail({}, { message: "L'adresse email doit être valide" })
  email!: string;

  @ApiProperty({
    description: "Raison de l'échec de vérification (vide si valide)",
    example: "Token expiré",
    type: "string",
    required: true,
  })
  @Expose()
  @IsString({ message: "La raison doit être une chaîne de caractères" })
  reason!: string;
}
