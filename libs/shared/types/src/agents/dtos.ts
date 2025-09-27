import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsBoolean, IsUUID, IsNumber, IsDateString, MinLength, MaxLength, IsNotEmpty } from "class-validator";
import { Expose, Transform } from "class-transformer";
import { BasePaginationDto } from "../common/page";

/**
 * Status d'un prompt - utilisé pour gérer le cycle de vie des prompts
 * Compatible avec Prisma enum PromptStatus
 */
export enum PromptStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  DEPRECATED = "DEPRECATED",
}

/**
 * Type de créateur du prompt - système ou utilisateur
 * Compatible avec Prisma enum PromptCreatorType
 */
export enum PromptCreatorType {
  SYSTEM = "SYSTEM",
  USER = "USER",
}

/**
 * Type de partie d'un prompt - différentes sections d'un prompt
 * Compatible avec Prisma enum PromptPartType
 */
export enum PromptPartType {
  INTRODUCTION = "INTRODUCTION",
  OBJECTIVE = "OBJECTIVE",
  CONTEXT = "CONTEXT",
  CONSTRAINT = "CONSTRAINT",
  INSTRUCTION = "INSTRUCTION",
  EXAMPLE = "EXAMPLE",
  FORMAT = "FORMAT",
  RESPONSE_FORMAT = "RESPONSE_FORMAT",
  OUTPUT_SCHEMA = "OUTPUT_SCHEMA",
  TOOLS = "TOOLS",
  KNOWLEDGE_BASE = "KNOWLEDGE_BASE",
  FALLBACK = "FALLBACK",
  PERSONALITY = "PERSONALITY",
}

/**
 * Rôle fonctionnel du prompt dans le système
 * Compatible avec Prisma enum PromptRoleType
 */
export enum PromptRoleType {
  CREATION = "CREATION",
  UPDATE = "UPDATE",
  CREATION_UPDATE = "CREATION_UPDATE",
  INFO = "INFO",
  GENERATION = "GENERATION",
  CLASSIFICATION = "CLASSIFICATION",
  SUMMARIZATION = "SUMMARIZATION",
  TRANSLATION = "TRANSLATION",
}

/**
 * Status d'un agent - cycle de vie de l'agent
 * Compatible avec Prisma enum AgentStatus
 */
export enum AgentStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  DEPRECATED = "DEPRECATED",
  ARCHIVED = "ARCHIVED",
}

/**
 * Type d'agent - classification fonctionnelle
 * Compatible avec Prisma enum AgentType
 */
export enum AgentType {
  FABRIC_DATA_AGENT = "FABRIC_DATA_AGENT",
  CUSTOM_AI_AGENT = "CUSTOM_AI_AGENT",
  CHATBOT = "CHATBOT",
  AUTOMATION_AGENT = "AUTOMATION_AGENT",
}

/**
 * DTO pour la création d'un agent
 * Utilisé dans les endpoints REST et gRPC
 * Compatible avec Prisma model Agent
 */
export class CreateAgentDto {
  @ApiProperty({
    description: "Nom d'affichage de l'agent",
    example: "Project Assistant",
    minLength: 2,
    maxLength: 100,
    type: "string",
  })
  @Expose()
  @IsNotEmpty({ message: "Le nom d'affichage est requis" })
  @IsString({ message: "Le nom d'affichage doit être une chaîne de caractères" })
  @MinLength(2, { message: "Le nom d'affichage doit contenir au moins 2 caractères" })
  @MaxLength(100, { message: "Le nom d'affichage ne peut pas dépasser 100 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  display_name!: string;

  @ApiPropertyOptional({
    description: "Description de l'agent",
    example: "AI assistant specialized in project management and analysis",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(500, { message: "La description ne peut pas dépasser 500 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiProperty({
    description: "Type d'agent",
    enum: AgentType,
    example: AgentType.CUSTOM_AI_AGENT,
    enumName: "AgentType",
  })
  @Expose()
  @IsEnum(AgentType, { message: "Type d'agent invalide" })
  agent_type!: AgentType;

  @ApiPropertyOptional({
    description: "Statut de l'agent",
    enum: AgentStatus,
    example: AgentStatus.DRAFT,
    default: AgentStatus.DRAFT,
    enumName: "AgentStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(AgentStatus, { message: "Statut d'agent invalide" })
  status?: AgentStatus = AgentStatus.DRAFT;
}

/**
 * DTO pour la mise à jour d'un agent
 * Tous les champs sont optionnels pour permettre les mises à jour partielles
 * Compatible avec Prisma update operations
 */
export class UpdateAgentDto {
  @ApiPropertyOptional({
    description: "Nom d'affichage de l'agent",
    example: "Project Assistant Pro",
    minLength: 2,
    maxLength: 100,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le nom d'affichage doit être une chaîne de caractères" })
  @MinLength(2, { message: "Le nom d'affichage doit contenir au moins 2 caractères" })
  @MaxLength(100, { message: "Le nom d'affichage ne peut pas dépasser 100 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  display_name?: string;

  @ApiPropertyOptional({
    description: "Description de l'agent",
    example: "Enhanced AI assistant with advanced project analysis capabilities",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(500, { message: "La description ne peut pas dépasser 500 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "Statut de l'agent",
    enum: AgentStatus,
    example: AgentStatus.ACTIVE,
    enumName: "AgentStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(AgentStatus, { message: "Statut d'agent invalide" })
  status?: AgentStatus;
}

/**
 * Vue d'ensemble d'un agent - informations essentielles
 * Utilisé pour les listes et références
 * Compatible avec gRPC message AgentOverview
 */
export class AgentOverview {
  @ApiProperty({
    description: "ID unique de l'agent",
    example: 123,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsNumber({}, { message: "L'ID doit être un nombre" })
  id!: number;

  @ApiProperty({
    description: "Code unique de l'agent (identifiant technique)",
    example: "PROJECT_ASSISTANT",
    minLength: 3,
    maxLength: 50,
    pattern: "^[A-Z_]+$",
  })
  @Expose()
  @IsString({ message: "Le code agent doit être une chaîne de caractères" })
  @MinLength(3, { message: "Le code agent doit contenir au moins 3 caractères" })
  @MaxLength(50, { message: "Le code agent ne peut pas dépasser 50 caractères" })
  agent_name_code!: string;

  @ApiProperty({
    description: "Version de l'agent",
    example: 1,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsNumber({}, { message: "La version doit être un nombre" })
  version!: number;

  @ApiProperty({
    description: "Nom d'affichage de l'agent",
    example: "Project Assistant",
    minLength: 2,
    maxLength: 100,
  })
  @Expose()
  @IsString({ message: "Le nom d'affichage doit être une chaîne de caractères" })
  display_name!: string;

  @ApiProperty({
    description: "Type d'agent",
    enum: AgentType,
    example: AgentType.CUSTOM_AI_AGENT,
    enumName: "AgentType",
  })
  @Expose()
  @IsEnum(AgentType, { message: "Type d'agent invalide" })
  agent_type!: AgentType;

  @ApiProperty({
    description: "Statut de l'agent",
    enum: AgentStatus,
    example: AgentStatus.ACTIVE,
    enumName: "AgentStatus",
  })
  @Expose()
  @IsEnum(AgentStatus, { message: "Statut d'agent invalide" })
  status!: AgentStatus;
}

/**
 * DTO complet d'un agent - hérite d'AgentOverview avec informations détaillées
 * Utilisé pour les réponses API détaillées et gRPC
 * Compatible avec Prisma model Agent + relations
 */
export class AgentDto extends AgentOverview {
  @ApiPropertyOptional({
    description: "Description détaillée de l'agent",
    example: "AI assistant specialized in project management and analysis",
    maxLength: 500,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(500, { message: "La description ne peut pas dépasser 500 caractères" })
  description?: string;

  @ApiPropertyOptional({
    description: "Date de publication de l'agent (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: "La date de publication doit être une date valide ISO 8601" })
  published_at?: string;

  @ApiProperty({
    description: "Date de création de l'agent (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsDateString({}, { message: "La date de création doit être une date valide ISO 8601" })
  created_at!: string;

  @ApiProperty({
    description: "Date de dernière modification de l'agent (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsDateString({}, { message: "La date de modification doit être une date valide ISO 8601" })
  updated_at!: string;

  @ApiPropertyOptional({
    description: "Prompts associés à cet agent",
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1 },
        prompt_code: { type: "string", example: "PROJECT_ANALYSIS" },
        part_type: { type: "string", enum: Object.values(PromptPartType) },
        role_type: { type: "string", enum: Object.values(PromptRoleType) },
        status: { type: "string", enum: Object.values(PromptStatus) },
      },
    },
    example: [
      {
        id: 1,
        prompt_code: "PROJECT_ANALYSIS",
        part_type: PromptPartType.INSTRUCTION,
        role_type: PromptRoleType.GENERATION,
        status: PromptStatus.ACTIVE,
      },
    ],
  })
  @Expose()
  @IsOptional()
  prompts?: {
    id: number;
    prompt_code: string;
    part_type: PromptPartType;
    role_type: PromptRoleType;
    status: PromptStatus;
  }[];
}

/**
 * DTO pour les filtres de recherche d'agents
 * Utilisé pour filtrer les agents selon différents critères
 */
export class AgentFilterDto {
  @ApiPropertyOptional({
    description: "Filtrer par type d'agent",
    enum: AgentType,
    enumName: "AgentType",
  })
  @Expose()
  @IsOptional()
  @IsEnum(AgentType, { message: "Type d'agent invalide" })
  agent_type?: AgentType;

  @ApiPropertyOptional({
    description: "Filtrer par statut d'agent",
    enum: AgentStatus,
    enumName: "AgentStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(AgentStatus, { message: "Statut d'agent invalide" })
  status?: AgentStatus;

  @ApiPropertyOptional({
    description: "Rechercher dans le nom d'affichage",
    example: "Project",
    maxLength: 100,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le terme de recherche doit être une chaîne de caractères" })
  @MaxLength(100, { message: "Le terme de recherche ne peut pas dépasser 100 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    description: "Filtrer par workspace ID",
    format: "uuid",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID du workspace doit être un UUID valide" })
  workspace_id?: string;
}

/**
 * DTO pour la liste paginée d'agents
 * Utilisé pour les réponses de listing avec pagination
 * Compatible avec gRPC message AgentList
 * Étend BasePaginationDto pour une gestion uniforme de la pagination
 */
export class AgentListDto extends BasePaginationDto<AgentDto> {
  @ApiProperty({
    type: [AgentDto],
    description: "Liste des agents",
  })
  @Expose()
  items!: AgentDto[];
}

/**
 * DTO pour la création d'un prompt d'agent
 * Utilisé dans les endpoints REST et gRPC
 * Compatible avec Prisma model AgentPrompt
 */
export class CreateAgentPromptDto {
  @ApiProperty({
    description: "Type de partie du prompt",
    enum: PromptPartType,
    example: PromptPartType.INSTRUCTION,
    enumName: "PromptPartType",
  })
  @Expose()
  @IsEnum(PromptPartType, { message: "Type de partie du prompt invalide" })
  part_type!: PromptPartType;

  @ApiProperty({
    description: "Contenu du prompt",
    example: "You are a helpful AI assistant specialized in project management. Analyze the provided project requirements and provide detailed technical specifications.",
    minLength: 10,
    maxLength: 10000,
    type: "string",
  })
  @Expose()
  @IsNotEmpty({ message: "Le contenu du prompt est requis" })
  @IsString({ message: "Le contenu doit être une chaîne de caractères" })
  @MinLength(10, { message: "Le contenu du prompt doit contenir au moins 10 caractères" })
  @MaxLength(10000, { message: "Le contenu du prompt ne peut pas dépasser 10 000 caractères" })
  content!: string;

  @ApiPropertyOptional({
    description: "Description du prompt",
    example: "Main instruction prompt for project analysis",
    maxLength: 200,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(200, { message: "La description ne peut pas dépasser 200 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "Type de rôle du prompt",
    enum: PromptRoleType,
    example: PromptRoleType.GENERATION,
    enumName: "PromptRoleType",
  })
  @Expose()
  @IsOptional()
  @IsEnum(PromptRoleType, { message: "Type de rôle du prompt invalide" })
  role_type?: PromptRoleType;

  @ApiPropertyOptional({
    description: "Type de créateur du prompt",
    enum: PromptCreatorType,
    example: PromptCreatorType.USER,
    default: PromptCreatorType.USER,
    enumName: "PromptCreatorType",
  })
  @Expose()
  @IsOptional()
  @IsEnum(PromptCreatorType, { message: "Type de créateur invalide" })
  creator_type?: PromptCreatorType = PromptCreatorType.USER;

  @ApiPropertyOptional({
    description: "Statut du prompt",
    enum: PromptStatus,
    example: PromptStatus.ACTIVE,
    default: PromptStatus.DRAFT,
    enumName: "PromptStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(PromptStatus, { message: "Statut du prompt invalide" })
  status?: PromptStatus = PromptStatus.DRAFT;

  @ApiPropertyOptional({
    description: "Le prompt peut être mis à jour par les utilisateurs",
    example: false,
    type: "boolean",
    default: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ updatable doit être un booléen" })
  updatable?: boolean = false;

  @ApiPropertyOptional({
    description: "ID du workspace associé",
    example: "workspace-uuid-123",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID du workspace doit être un UUID valide" })
  workspace_id?: string;
}

/**
 * DTO pour la mise à jour d'un prompt d'agent
 * Tous les champs sont optionnels pour permettre les mises à jour partielles
 * Compatible avec Prisma update operations
 */
export class UpdateAgentPromptDto {
  @ApiPropertyOptional({
    description: "Type de partie du prompt",
    enum: PromptPartType,
    example: PromptPartType.INSTRUCTION,
    enumName: "PromptPartType",
  })
  @Expose()
  @IsOptional()
  @IsEnum(PromptPartType, { message: "Type de partie du prompt invalide" })
  part_type?: PromptPartType;

  @ApiPropertyOptional({
    description: "Contenu du prompt",
    example: "Updated instruction content for the agent",
    minLength: 10,
    maxLength: 10000,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "Le contenu doit être une chaîne de caractères" })
  @MinLength(10, { message: "Le contenu du prompt doit contenir au moins 10 caractères" })
  @MaxLength(10000, { message: "Le contenu du prompt ne peut pas dépasser 10 000 caractères" })
  content?: string;

  @ApiPropertyOptional({
    description: "Description du prompt",
    example: "Updated prompt description",
    maxLength: 200,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(200, { message: "La description ne peut pas dépasser 200 caractères" })
  @Transform(({ value }): string | undefined => (typeof value === "string" ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: "Type de rôle du prompt",
    enum: PromptRoleType,
    example: PromptRoleType.GENERATION,
    enumName: "PromptRoleType",
  })
  @Expose()
  @IsOptional()
  @IsEnum(PromptRoleType, { message: "Type de rôle du prompt invalide" })
  role_type?: PromptRoleType;

  @ApiPropertyOptional({
    description: "Statut du prompt",
    enum: PromptStatus,
    example: PromptStatus.ACTIVE,
    enumName: "PromptStatus",
  })
  @Expose()
  @IsOptional()
  @IsEnum(PromptStatus, { message: "Statut du prompt invalide" })
  status?: PromptStatus;

  @ApiPropertyOptional({
    description: "ID du workspace associé",
    example: "workspace-uuid-456",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID du workspace doit être un UUID valide" })
  workspace_id?: string;
}

/**
 * DTO complet d'un prompt d'agent
 * Utilisé pour les réponses API détaillées et gRPC
 * Compatible avec Prisma model AgentPrompt + relations
 */
export class AgentPromptDto {
  @ApiProperty({
    description: "ID unique du prompt",
    example: 456,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsNumber({}, { message: "L'ID doit être un nombre" })
  id!: number;

  @ApiProperty({
    description: "ID de l'agent associé",
    example: 123,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsNumber({}, { message: "L'ID de l'agent doit être un nombre" })
  agent_id!: number;

  @ApiProperty({
    description: "Code unique du prompt",
    example: "PROJECT_ANALYSIS_INSTRUCTION",
    minLength: 3,
    maxLength: 100,
    pattern: "^[A-Z_]+$",
  })
  @Expose()
  @IsString({ message: "Le code du prompt doit être une chaîne de caractères" })
  @MinLength(3, { message: "Le code du prompt doit contenir au moins 3 caractères" })
  @MaxLength(100, { message: "Le code du prompt ne peut pas dépasser 100 caractères" })
  prompt_code!: string;

  @ApiProperty({
    description: "Version du prompt",
    example: 1,
    type: "integer",
    minimum: 1,
  })
  @Expose()
  @IsNumber({}, { message: "La version doit être un nombre" })
  version!: number;

  @ApiProperty({
    description: "Type de créateur du prompt",
    enum: PromptCreatorType,
    example: PromptCreatorType.USER,
    enumName: "PromptCreatorType",
  })
  @Expose()
  @IsEnum(PromptCreatorType, { message: "Type de créateur invalide" })
  creator_type!: PromptCreatorType;

  @ApiProperty({
    description: "Type de partie du prompt",
    enum: PromptPartType,
    example: PromptPartType.INSTRUCTION,
    enumName: "PromptPartType",
  })
  @Expose()
  @IsEnum(PromptPartType, { message: "Type de partie du prompt invalide" })
  part_type!: PromptPartType;

  @ApiProperty({
    description: "Type de rôle du prompt",
    enum: PromptRoleType,
    example: PromptRoleType.GENERATION,
    enumName: "PromptRoleType",
  })
  @Expose()
  @IsEnum(PromptRoleType, { message: "Type de rôle du prompt invalide" })
  role_type!: PromptRoleType;

  @ApiProperty({
    description: "Contenu du prompt",
    example: "You are a helpful AI assistant specialized in project management...",
    minLength: 10,
    maxLength: 10000,
  })
  @Expose()
  @IsString({ message: "Le contenu doit être une chaîne de caractères" })
  content!: string;

  @ApiPropertyOptional({
    description: "Description du prompt",
    example: "Main instruction prompt for project analysis",
    maxLength: 200,
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  @MaxLength(200, { message: "La description ne peut pas dépasser 200 caractères" })
  description?: string;

  @ApiProperty({
    description: "Statut du prompt",
    enum: PromptStatus,
    example: PromptStatus.ACTIVE,
    enumName: "PromptStatus",
  })
  @Expose()
  @IsEnum(PromptStatus, { message: "Statut du prompt invalide" })
  status!: PromptStatus;

  @ApiProperty({
    description: "Date de création du prompt (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsDateString({}, { message: "La date de création doit être une date valide ISO 8601" })
  created_at!: string;

  @ApiProperty({
    description: "Date de dernière modification du prompt (ISO 8601)",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
    type: "string",
  })
  @Expose()
  @IsDateString({}, { message: "La date de modification doit être une date valide ISO 8601" })
  updated_at!: string;

  @ApiPropertyOptional({
    description: "Le prompt peut être mis à jour par les utilisateurs",
    example: false,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "Le champ updatable doit être un booléen" })
  updatable?: boolean;

  @ApiPropertyOptional({
    description: "ID du workspace associé",
    example: "workspace-uuid-123",
    format: "uuid",
    type: "string",
  })
  @Expose()
  @IsOptional()
  @IsUUID("4", { message: "L'ID du workspace doit être un UUID valide" })
  workspace_id?: string;
}

export class AgentPromptListDto extends BasePaginationDto<AgentPromptDto> {
  @ApiProperty({
    type: [AgentPromptDto],
    description: "Array of agent prompt overview objects",
  })
  items!: AgentPromptDto[];
}
