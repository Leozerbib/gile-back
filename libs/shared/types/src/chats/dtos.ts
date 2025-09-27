import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsObject, IsPositive, MinLength, MaxLength, IsNotEmpty, ValidateNested, Min, Max } from "class-validator";
import { Type, Transform, Expose } from "class-transformer";
import { ProfileOverview } from "../profile/dtos";
import { BasePaginationDto } from "../common/page";

export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}

export class CreateChatDto {
  @ApiProperty({
    description: "ID du projet associé à cette conversation",
    example: 123,
    type: Number,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  projectId!: number;

  @ApiPropertyOptional({
    description: "Titre descriptif de la conversation",
    example: "Discussion sur la planification du projet Q4",
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: "ID de session unique pour cette conversation",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({
    description: "ID de définition de workflow à utiliser",
    example: 456,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  workflowDefinitionId?: number;

  @ApiPropertyOptional({
    description: "ID de définition de completion à utiliser",
    example: 789,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  completionDefinitionId?: number;

  @ApiPropertyOptional({
    description: "ID de configuration de chatbot à utiliser",
    example: 101,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  chatbotConfigId?: number;

  @ApiPropertyOptional({
    description: "ID de définition de tâche d'agent à utiliser",
    example: 202,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  agentTaskDefinitionId?: number;

  @ApiPropertyOptional({
    description: "Métadonnées personnalisées de la conversation",
    example: {
      priority: "high",
      category: "planning",
      participants: ["user-1", "user-2"],
      tags: ["urgent", "review-needed"],
    },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: "ID unique du workspace propriétaire",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

export class UpdateChatDto {
  @ApiPropertyOptional({
    description: "Titre mis à jour de la conversation",
    example: "Discussion mise à jour sur la planification Q4",
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: "Métadonnées mises à jour de la conversation",
    example: {
      priority: "medium",
      tags: ["planning", "urgent"],
      estimated_duration: "2h",
      difficulty: "medium",
    },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  metadata?: Record<string, any>;
}

export class ChatOverview {
  @ApiProperty({
    description: "Identifiant unique de la conversation",
    example: 123,
    type: Number,
    minimum: 1,
  })
  @Expose()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({
    description: "Identifiant unique de session pour cette conversation",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @Expose({ name: "session_id" })
  sessionId?: string;

  @ApiPropertyOptional({
    description: "Titre descriptif de la conversation",
    example: "Discussion sur la planification du projet Q4",
    maxLength: 255,
  })
  title?: string;

  @ApiProperty({
    description: "Date et heure de création de la conversation",
    example: "2024-01-15T10:00:00Z",
    format: "date-time",
  })
  @Expose({ name: "created_at" })
  @Type(() => Date)
  @Transform(({ value }) => new Date(value).toISOString())
  createdAt!: Date;

  @ApiPropertyOptional({
    description: "Date et heure de dernière modification",
    example: "2024-01-15T14:30:00Z",
    format: "date-time",
  })
  @Expose({ name: "updated_at" })
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: "Nombre total de messages dans cette conversation",
    example: 15,
    type: Number,
    minimum: 0,
  })
  @Expose()
  @Type(() => Number)
  messageCount?: number;

  @ApiPropertyOptional({
    description: "Date du dernier message",
    example: "2024-01-15T14:30:00Z",
    format: "date-time",
  })
  @Expose()
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  lastMessageAt?: Date;
}

export class ChatDto extends ChatOverview {
  @ApiPropertyOptional({
    description: "Métadonnées personnalisées de la conversation",
    example: {
      priority: "high",
      category: "planning",
      participants: ["user-1", "user-2"],
      tags: ["urgent", "review-needed"],
    },
    type: Object,
  })
  @Expose({ name: "metadata" })
  @Type(() => Object)
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Identifiant du projet associé à cette conversation",
    example: 456,
    type: Number,
    minimum: 1,
  })
  @Expose({ name: "project_id" })
  @Type(() => Number)
  projectId?: number;

  @ApiPropertyOptional({
    description: "Identifiant de définition de workflow utilisée",
    example: 789,
    type: Number,
    minimum: 1,
  })
  @Expose({ name: "workflow_definition_id" })
  @Type(() => Number)
  workflowDefinitionId?: number;

  @ApiPropertyOptional({
    description: "Identifiant de définition de completion utilisée",
    example: 101,
    type: Number,
    minimum: 1,
  })
  @Expose({ name: "completion_definition_id" })
  @Type(() => Number)
  completionDefinitionId?: number;

  @ApiPropertyOptional({
    description: "Identifiant de configuration de chatbot utilisée",
    example: 202,
    type: Number,
    minimum: 1,
  })
  @Expose({ name: "chatbot_config_id" })
  @Type(() => Number)
  chatbotConfigId?: number;

  @ApiPropertyOptional({
    description: "Identifiant de définition de tâche d'agent utilisée",
    example: 303,
    type: Number,
    minimum: 1,
  })
  @Expose({ name: "agent_task_definition_id" })
  @Type(() => Number)
  agentTaskDefinitionId?: number;

  @ApiPropertyOptional({
    description: "Identifiant unique du workspace propriétaire",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @Expose({ name: "workspace_id" })
  workspaceId?: string;

  @ApiPropertyOptional({
    description: "Identifiant de l'utilisateur créateur de la conversation",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @Expose({ name: "created_by" })
  createdBy?: string;

  @ApiPropertyOptional({
    description: "Identifiant de l'utilisateur modificateur de la conversation",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @Expose({ name: "updated_by" })
  updatedBy?: string;

  @ApiPropertyOptional({
    description: "Informations complètes sur l'utilisateur créateur",
    type: ProfileOverview,
  })
  @Expose({ name: "created_by_user" })
  @Type(() => ProfileOverview)
  @ValidateNested()
  createdByUser?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations complètes sur l'utilisateur modificateur",
    type: ProfileOverview,
  })
  @Expose({ name: "updated_by_user" })
  @Type(() => ProfileOverview)
  @ValidateNested()
  updatedByUser?: ProfileOverview;
}

export class ChatListDto extends BasePaginationDto<ChatDto> {
  @ApiProperty({
    type: [ChatDto],
    description: "Array of chat overview objects",
  })
  items!: ChatDto[];
}

export class MessageOverview {
  @ApiProperty({
    description: "Identifiant unique du message",
    example: 1234,
    type: Number,
    minimum: 1,
  })
  @Expose()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({
    description: "Identifiant de la conversation parente",
    example: 123,
    type: Number,
    minimum: 1,
  })
  @Expose({ name: "chat_id" })
  @Type(() => Number)
  chatId?: number;

  @ApiPropertyOptional({
    description: "Rôle du message dans la conversation",
    example: MessageRole.USER,
    enum: MessageRole,
  })
  @Expose({ name: "message_role" })
  @Type(() => String)
  messageRole?: MessageRole;

  @ApiPropertyOptional({
    description: "Étape du workflow à laquelle ce message appartient",
    example: "analyse",
    maxLength: 100,
  })
  @Expose()
  step?: string;

  @ApiPropertyOptional({
    description: "Contenu textuel du message",
    example: "Bonjour, comment puis-je vous aider ?",
    maxLength: 10000,
  })
  @Expose()
  message?: string;

  @ApiPropertyOptional({
    description: "Temps de réponse en millisecondes (pour les messages générés)",
    example: 2500,
    type: Number,
    minimum: 0,
    maximum: 300000,
  })
  @Expose({ name: "response_time_ms" })
  @Type(() => Number)
  responseTimeMs?: number;

  @ApiPropertyOptional({
    description: "Message d'erreur associé à ce message",
    example: "Erreur lors de la génération de la réponse",
    maxLength: 1000,
  })
  @Expose({ name: "error_message" })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: "Date et heure de création du message",
    example: "2024-01-15T10:30:00Z",
    format: "date-time",
  })
  @Expose({ name: "created_at" })
  @Type(() => Date)
  @Transform(({ value }) => new Date(value).toISOString())
  createdAt!: Date;

  @ApiPropertyOptional({
    description: "Date et heure de dernière modification",
    example: "2024-01-15T11:00:00Z",
    format: "date-time",
  })
  @Expose({ name: "updated_at" })
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur créateur du message",
    type: ProfileOverview,
  })
  @Expose({ name: "created_by_user" })
  @Type(() => ProfileOverview)
  @ValidateNested()
  createdByUser?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur modificateur du message",
    type: ProfileOverview,
  })
  @Expose({ name: "updated_by_user" })
  @Type(() => ProfileOverview)
  @ValidateNested()
  updatedByUser?: ProfileOverview;
}

export class MessageDto extends MessageOverview {
  @ApiPropertyOptional({
    description: "Contenu brut du message au format JSON structuré",
    example: {
      text: "Bonjour, comment puis-je vous aider ?",
      type: "text",
      metadata: { language: "fr", confidence: 0.95 },
    },
    type: Object,
  })
  @Expose({ name: "raw_message_json" })
  @Type(() => Object)
  rawMessageJson?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Contenu du message en format Markdown enrichi",
    example: "# Titre\n\nContenu en **gras** et *italique* avec `code`.",
    maxLength: 50000,
  })
  @Expose()
  markdown?: string;

  @ApiPropertyOptional({
    description: "Modèle de langage utilisé pour générer ce message",
    example: "gpt-4",
    maxLength: 100,
  })
  @Expose()
  model?: string;

  @ApiPropertyOptional({
    description: "Nombre de tokens utilisés pour ce message",
    example: 150,
    type: Number,
    minimum: 0,
  })
  @Expose()
  @Type(() => Number)
  tokenCount?: number;

  @ApiPropertyOptional({
    description: "Outils utilisés pour générer ce message (le cas échéant)",
    example: ["web_search", "calculator"],
    type: [String],
  })
  @Expose()
  @Type(() => Array)
  tools?: string[];

  @ApiPropertyOptional({
    description: "Références externes utilisées pour ce message",
    example: ["doc-1", "api-ref-2"],
    type: [String],
  })
  @Expose()
  @Type(() => Array)
  references?: string[];

  @ApiPropertyOptional({
    description: "Métadonnées de performance pour ce message",
    example: {
      latency: 2500,
      model_version: "gpt-4-0613",
      temperature: 0.7,
      max_tokens: 2000,
    },
    type: Object,
  })
  @Expose()
  @Type(() => Object)
  performanceMetadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Liste des messages précédents référencés",
    example: [1234, 1235],
    type: [Number],
  })
  @Expose()
  @Type(() => Array)
  referencedMessages?: number[];

  @ApiPropertyOptional({
    description: "Score de confiance du message (0-1)",
    example: 0.95,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @Expose()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiPropertyOptional({
    description: "Message précédent dans la conversation",
    example: {
      id: 1233,
      message: "Contexte précédent...",
      messageRole: MessageRole.USER,
    },
  })
  @Expose()
  @Type(() => Object)
  previousMessage?: {
    id: number;
    message: string;
    messageRole: MessageRole;
  };

  @ApiPropertyOptional({
    description: "Message suivant dans la conversation",
    example: {
      id: 1235,
      message: "Réponse suivante...",
      messageRole: MessageRole.ASSISTANT,
    },
  })
  @Expose()
  @Type(() => Object)
  nextMessage?: {
    id: number;
    message: string;
    messageRole: MessageRole;
  };
}

export class MessageListDto extends BasePaginationDto<MessageDto> {
  @ApiProperty({
    type: [MessageDto],
    description: "Array of message overview objects",
  })
  items!: MessageDto[];
}
