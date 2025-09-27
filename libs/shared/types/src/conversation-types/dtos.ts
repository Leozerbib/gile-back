import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateConversationTypeDto {
  @ApiProperty({ example: "Customer Support Chat", description: "Conversation type name" })
  name!: string;

  @ApiPropertyOptional({ example: "Chat interface for customer support inquiries", description: "Conversation type description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#10B981", description: "UI color for the conversation type" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { max_messages: 100, allow_attachments: true }, description: "Conversation type metadata" })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateConversationTypeDto {
  @ApiPropertyOptional({ example: "Updated Customer Support Chat", description: "Updated conversation type name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Updated chat interface description", description: "Updated conversation type description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#EF4444", description: "Updated UI color" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { max_messages: 200, allow_attachments: false }, description: "Updated metadata" })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ConversationTypeDto {
  @ApiProperty({ example: 123 })
  id!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: "2025-09-23T14:25:33.456Z", nullable: true })
  updated_at?: string | null;

  @ApiProperty({ example: "Customer Support Chat" })
  name!: string;

  @ApiProperty({ example: "Chat interface for customer support inquiries", nullable: true })
  description?: string | null;

  @ApiProperty({ example: "#10B981", nullable: true })
  ui_color?: string | null;

  @ApiProperty({ type: Object, example: { max_messages: 100, allow_attachments: true }, nullable: true })
  metadata?: Record<string, any> | null;
}
