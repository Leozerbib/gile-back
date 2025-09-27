import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ProfileOverview } from "../profile/dtos";

export class CreateChatbotConfigurationDto {
  @ApiProperty({ example: "Customer Support Bot", description: "Chatbot configuration name" })
  name!: string;

  @ApiPropertyOptional({ example: "AI-powered chatbot for customer support", description: "Chatbot configuration description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#6366F1", description: "UI color for the chatbot" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { model: "gpt-4", temperature: 0.7, max_tokens: 1000 }, description: "Chatbot configuration data" })
  @IsOptional()
  config_data?: Record<string, any>;
}

export class UpdateChatbotConfigurationDto {
  @ApiPropertyOptional({ example: "Updated Customer Support Bot", description: "Updated chatbot configuration name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Updated AI-powered chatbot description", description: "Updated chatbot configuration description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#8B5CF6", description: "Updated UI color" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { model: "gpt-4-turbo", temperature: 0.5, max_tokens: 1500 }, description: "Updated configuration data" })
  @IsOptional()
  config_data?: Record<string, any>;
}

export class ChatbotConfigurationDto {
  @ApiProperty({ example: 123 })
  id!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: "2025-09-23T14:25:33.456Z", nullable: true })
  updated_at?: string | null;

  @ApiProperty({ example: "Customer Support Bot" })
  name!: string;

  @ApiProperty({ example: "AI-powered chatbot for customer support", nullable: true })
  description?: string | null;

  @ApiProperty({ example: "#6366F1", nullable: true })
  ui_color?: string | null;

  @ApiProperty({ type: Object, example: { model: "gpt-4", temperature: 0.7, max_tokens: 1000 }, nullable: true })
  config_data?: Record<string, any> | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  created_by?: string | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  updated_by?: string | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
    nullable: true,
  })
  created_by_user?: ProfileOverview | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
    nullable: true,
  })
  updated_by_user?: ProfileOverview | null;
}
